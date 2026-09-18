import type { IncidentFeature, IncidentSeverity, NormalizedFeed } from "@nst/shared";
import { cacheAgeMinutes, cachedWithStale as cached } from "../lib/cache.js";
import { inBbox } from "../lib/bbox.js";
import { fetchJsonOrThrow } from "./common.js";

const EVENT_URL = "https://event.longdo.com/feed/json";
const TTL_SECONDS = 180;

interface LongdoEvent {
  eid?: string | number;
  title?: string;
  title_en?: string;
  description?: string;
  description_en?: string;
  latitude?: string | number;
  longitude?: string | number;
  type?: string | number;
  start?: string;
  stop?: string;
  severity?: string | number;
}

function num(v: string | number | undefined): number | null {
  if (v === "" || v == null) return null;
  const n = Number(v);
  return Number.isFinite(n) && n !== 0 ? n : null;
}

function parseThaiTs(v?: string): string | undefined {
  if (!v) return undefined;
  const parsed = new Date(`${v.trim().replace(/\s+/g, "T")}+07:00`);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString();
}

function classify(typeCode: number, severity: number): { category: IncidentFeature["category"]; severity: IncidentSeverity } {
  // Longdo type codes (approximate, from existing iticAdapter):
  // 1=accident, 2=closure, 3=construction, 4=breakdown, else=traffic
  let category: IncidentFeature["category"] = "traffic-congestion";
  if (typeCode === 1) category = "traffic-accident";
  else if (typeCode === 2) category = "construction"; // closure mapped to construction
  else if (typeCode === 3) category = "construction";

  let sev: IncidentSeverity = "low";
  if (severity >= 3) sev = "high";
  else if (severity >= 2) sev = "medium";
  if (category === "traffic-accident" && sev === "low") sev = "medium";
  return { category, severity: sev };
}

async function fetchIticInner(): Promise<NormalizedFeed<IncidentFeature>> {
  return cached("itic", TTL_SECONDS, async () => {
    const fetchedAt = new Date().toISOString();
    const payload = await fetchJsonOrThrow<{ events?: LongdoEvent[] } | LongdoEvent[]>(EVENT_URL);
    const events = Array.isArray(payload) ? payload : payload?.events ?? [];
    // Zero events NATIONWIDE is not "a quiet day in NST" — the feed covers all
    // of Thailand and is never empty when healthy. Throw so the stale cache
    // (or the unavailable path below) answers, instead of a confident "live".
    if (events.length === 0) throw new Error("upstream returned no events nationwide");

    const features: IncidentFeature[] = [];

    for (const e of events) {
      const lat = num(e.latitude);
      const lng = num(e.longitude);
      if (lat === null || lng === null) continue;
      if (!inBbox(lng, lat)) continue;

      const typeCode = Number(e.type ?? 0);
      const severityCode = Number(e.severity ?? 0);
      const { category, severity } = classify(typeCode, severityCode);

      features.push({
        id: `itic-${e.eid ?? `${lng}-${lat}-${features.length}`}`,
        lat,
        lng,
        category,
        severity,
        status: "in-progress",
        title: (e.title_en ?? e.title ?? "Traffic event").trim(),
        description: (e.description_en ?? e.description ?? "").trim() || undefined,
        reportedAt: parseThaiTs(e.start) ?? fetchedAt,
        reporterPlatform: "itic",
      });
    }

    return {
      features,
      meta: {
        source: "itic-longdo",
        fetchedAt,
        ageMinutes: cacheAgeMinutes(fetchedAt),
        // Live whenever upstream answered with its nationwide feed — zero
        // events inside NST is a real, quiet reading, not a degraded one.
        fallbackTier: "live",
        ...(features.length === 0 ? { note: "Upstream live · no events inside Nakhon Si Thammarat right now" } : {}),
      },
    };
  });
}

// First-boot outage (throw + no stale to fall back on) → an honest
// unavailable feed, not a 500 through safeFeed.
export async function fetchItic(): Promise<NormalizedFeed<IncidentFeature>> {
  try {
    return await fetchIticInner();
  } catch (err) {
    // A real outage with nothing cached: say so. "scenario" means modelled
    // data, which an empty outage feed is not.
    const fetchedAt = new Date().toISOString();
    return {
      features: [],
      meta: {
        source: "itic-longdo",
        fetchedAt,
        ageMinutes: cacheAgeMinutes(fetchedAt),
        fallbackTier: "unavailable",
        note: `iTIC (Longdo traffic events) unreachable — ${(err as Error).message}. Retries automatically.`,
      },
    };
  }
}
