/**
 * RID (Royal Irrigation Department / กรมชลประทาน) reservoir adapter.
 *
 * Public API — no authentication required.
 * GET https://app.rid.go.th/reservoir/api/reservoir/public
 *
 * Returns 461 reservoirs nationally, grouped by region. We filter to
 * ภาคใต้ (South) and then further to the NST reservoirs by id or name.
 *
 * Known NST / Pak Phanang basin reservoirs:
 *   rsv434 — ห้วยน้ำใส   (86 MCM)
 *   rsv435 — คลองกะทูน  (70.5 MCM)  ← main NST reservoir
 *   rsv425 — ยางชุม      (41.1 MCM)
 *   Plus any other southern reservoirs not yet mapped — we surface all of ภาคใต้.
 */

import type { NormalizedFeed, RidReservoir } from "@nst/shared";
import { cacheAgeMinutes, cachedWithStale as cached } from "../lib/cache.js";
import { fetchJsonOrThrow } from "./common.js";

const URL = "https://app.rid.go.th/reservoir/api/reservoir/public";
const TTL = 60 * 60; // 1 hour

// RID response shapes
interface RidReservoirRaw {
  id?: string;
  name?: string;
  storage?: number | null;       // full capacity (MCM)
  dead_storage?: number | null;
  volume?: number | null;        // current stored volume (MCM)
  percent_storage?: number | null; // % of capacity
  inflow?: number | null;        // MCM/day
  outflow?: number | null;       // MCM/day
}

interface RidRegion {
  region?: string;
  reservoir?: RidReservoirRaw[];
}

interface RidResponse {
  date?: string;
  total?: number;
  data?: RidRegion[];
}

// IDs confirmed for NST / Pak Phanang basin (from live API probe 2026-06-20)
const NST_IDS = new Set(["rsv434", "rsv435", "rsv425"]);

// Fallback: include any southern reservoir whose name contains an NST keyword
const NST_KEYWORDS = ["นครศรีธรรมราช", "ปากพนัง", "ท่าแดง", "คลองกะทูน", "ห้วยน้ำใส", "ยางชุม", "ลานสกา"];

function isNstReservoir(r: RidReservoirRaw): boolean {
  if (r.id && NST_IDS.has(r.id)) return true;
  if (r.name && NST_KEYWORDS.some((kw) => r.name!.includes(kw))) return true;
  return false;
}

export async function fetchRidReservoirs(): Promise<NormalizedFeed<RidReservoir>> {
  return cached("rid-reservoirs", TTL, async () => {
    const fetchedAt = new Date().toISOString();

    // fetchJsonOrThrow catches all errors internally and returns null — it never
    // throws — so a try/catch here is dead code. Check for null explicitly.
    const respRaw = await fetchJsonOrThrow<RidResponse>(URL);
    if (respRaw == null) {
      return {
        features: [],
        meta: {
          source: "rid-reservoirs",
          fetchedAt,
          ageMinutes: 0,
          fallbackTier: "unavailable",
          note: "RID reservoir API unreachable (app.rid.go.th — upstream/DNS). Resolves on public DNS; retries automatically.",
        },
      };
    }
    const resp: RidResponse = respRaw ?? {};

    // Find the South region and filter to NST reservoirs
    const southRegion = (resp.data ?? []).find((r) => r.region === "ภาคใต้");
    const southRaw = southRegion?.reservoir ?? [];
    const nstRaw = southRaw.filter(isNstReservoir);

    // If our id list gives no match, fall back to all southern reservoirs (surface the data)
    const sourceRaw = nstRaw.length > 0 ? nstRaw : southRaw.slice(0, 12);

    const features: RidReservoir[] = sourceRaw.map((r) => ({
      id: r.id ?? "unknown",
      name: r.name ?? "—",
      storageMcm: r.storage ?? null,
      volumeMcm: r.volume ?? null,
      storagePct: r.percent_storage ?? null,
      inflowMcm: r.inflow ?? null,
      outflowMcm: r.outflow ?? null,
      observedAt: resp.date ? `${resp.date}T00:00:00+07:00` : fetchedAt,
    }));

    // Sort: highest % first (most likely to spill)
    features.sort((a, b) => (b.storagePct ?? 0) - (a.storagePct ?? 0));

    return {
      features,
      meta: {
        source: "rid-reservoirs",
        fetchedAt,
        ageMinutes: cacheAgeMinutes(fetchedAt),
        fallbackTier: features.length > 0 ? "live" : "unavailable",
        ...(nstRaw.length === 0 && southRaw.length > 0
          ? { note: "NST reservoir IDs not matched — showing all southern reservoirs as fallback" }
          : features.length === 0
          ? { note: "RID API returned no southern reservoirs" }
          : {}),
      },
    };
  });
}
