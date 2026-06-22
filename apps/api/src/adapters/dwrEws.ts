/**
 * DWR Early Warning System adapter — ews.dwr.go.th
 *
 * Department of Water Resources community flash-flood / landslide network.
 * No auth. A single POST returns ~2,275 stations nationwide; we filter to
 * Nakhon Si Thammarat (~86 stations), most of them in the Khao Luang upland
 * districts (ลานสกา, นบพิตำ, พิปูน, พรหมคีรี, สิชล) where flash floods
 * originate hours before the city floods.
 *
 * Why this matters for NST: unlike the HII river gauges, EWS carries
 *   • an official 0-3 alert status (watch / prepare / critical), and
 *   • soil-moisture %, the precursor that primes a flash flood —
 * the highest-value, lowest-availability signal flagged by the Japan-ASEAN
 * flood roundtable (Cao et al. 2024). Endpoint surfaced via the open
 * gain9999/thaiwater skill collection.
 */

import type { NormalizedFeed, EwsStation } from "@nst/shared";
import { cacheAgeMinutes, cachedWithStale as cached } from "../lib/cache.js";
import { fetchJsonOrThrow } from "./common.js";

const URL = "https://ews.dwr.go.th/ews/web-service/stn";
const PROVINCE_TH = "นครศรีธรรมราช";
const TTL = 15 * 60; // 15 min — flash floods move fast; the network updates ~15-min

interface EwsRaw {
  stn?: string;
  name?: string;
  stn_type?: string; // "RF" | "WL"
  tambon?: string;
  amphoe?: string;
  province?: string;
  main_basin?: string;
  latitude?: number | string;
  longitude?: number | string;
  status?: number | string;
  warn?: string | null;
  rain?: number | string | null;
  rain12h?: number | string | null;
  rain07h?: number | string | null;
  temp?: number | string | null;
  wl?: number | string | null;
  soil?: number | string | null;
  soil07h?: number | string | null;
  alert_min?: number | string | null;
  alert_max?: number | string | null;
  date?: string;
}

function num(v: number | string | null | undefined): number | null {
  if (v == null) return null;
  if (typeof v === "string") {
    if (v === "N/A" || v.trim() === "") return null;
    const n = parseFloat(v);
    // -9.99 is the EWS sensor-error / no-data sentinel
    return Number.isFinite(n) && n > -9 ? n : null;
  }
  return Number.isFinite(v) && v > -9 ? v : null;
}

function stationType(raw: string | undefined): EwsStation["type"] {
  if (raw === "RF") return "rain";
  if (raw === "WL") return "water";
  return "unknown";
}

function status(raw: number | string | null | undefined): EwsStation["status"] {
  const s = Math.round(typeof raw === "string" ? parseFloat(raw) : (raw ?? 0));
  if (s >= 3) return 3;
  if (s === 2) return 2;
  if (s === 1) return 1;
  return 0;
}

export async function fetchEwsStations(): Promise<NormalizedFeed<EwsStation>> {
  return cached("dwr-ews", TTL, async () => {
    const fetchedAt = new Date().toISOString();

    let raw: EwsRaw[] | null = null;
    try {
      const body = new FormData();
      body.append("action", "LoadStation");
      raw = await fetchJsonOrThrow<EwsRaw[]>(URL, {
        method: "POST",
        body,
        headers: { "User-Agent": "Mozilla/5.0" },
      });
    } catch (err) {
      return {
        features: [],
        meta: {
          source: "dwr-ews",
          fetchedAt,
          ageMinutes: 0,
          fallbackTier: "unavailable",
          note: `DWR EWS fetch failed: ${(err as Error).message}`,
        },
      };
    }

    // fetchJsonOrThrow returns null on non-OK / unparseable / DNS failure —
    // distinguish "upstream unreachable" from a genuinely empty NST result.
    if (raw == null) {
      return {
        features: [],
        meta: {
          source: "dwr-ews",
          fetchedAt,
          ageMinutes: 0,
          fallbackTier: "unavailable",
          note: "DWR EWS unreachable (ews.dwr.go.th — upstream/DNS). Resolves on public DNS; retries automatically.",
        },
      };
    }
    if (!Array.isArray(raw)) raw = [];

    const features: EwsStation[] = raw
      .filter((s) => String(s.province ?? "").includes(PROVINCE_TH))
      .map((s) => ({
        id: String(s.stn ?? ""),
        name: s.name ?? "",
        lat: num(s.latitude) ?? 0,
        lng: num(s.longitude) ?? 0,
        type: stationType(s.stn_type),
        tambon: s.tambon ?? "",
        amphoe: s.amphoe ?? "",
        basin: s.main_basin ?? "",
        status: status(s.status),
        rain: num(s.rain),
        rain12h: num(s.rain12h),
        rain07h: num(s.rain07h),
        waterLevel: num(s.wl),
        soilMoisture: num(s.soil),
        soil07h: num(s.soil07h),
        alertMin: num(s.alert_min),
        alertMax: num(s.alert_max),
        warn: s.warn ?? null,
        observedAt: s.date ?? fetchedAt,
      }))
      .filter((s) => s.id !== "" && s.lat !== 0 && s.lng !== 0);

    // Sort: highest alert status first, then most-saturated soil, then heaviest 12h rain.
    features.sort((a, b) => {
      if (b.status !== a.status) return b.status - a.status;
      if ((b.soilMoisture ?? 0) !== (a.soilMoisture ?? 0)) return (b.soilMoisture ?? 0) - (a.soilMoisture ?? 0);
      return (b.rain12h ?? 0) - (a.rain12h ?? 0);
    });

    return {
      features,
      meta: {
        source: "dwr-ews",
        fetchedAt,
        ageMinutes: cacheAgeMinutes(fetchedAt),
        fallbackTier: features.length > 0 ? "live" : "unavailable",
        ...(features.length === 0 ? { note: "DWR EWS returned no NST stations" } : {}),
      },
    };
  });
}
