/**
 * Flood / hydrology adapter for Nakhon Si Thammarat.
 *
 * Flooding is the dominant NST concern. Monsoon runoff off the Khao Luang
 * massif (1,835 m) drains down the Tha Dee watershed straight into the city,
 * while the broader Pak Phanang river basin floods the eastern lowlands. NST
 * has NO major regulating dam, so flash flooding tracks upstream discharge
 * directly with little buffering.
 *
 * There is no clean public real-time API for the Tha Dee canal or Pak Phanang
 * gauges, so we use Open-Meteo's free flood API (GloFAS river discharge) as a
 * proxy:
 *   https://flood-api.open-meteo.com/v1/flood?latitude=…&longitude=…&daily=river_discharge
 *
 * - fetchFloodGauges: river-discharge-derived gauge status at the Tha Dee canal
 *   west of the city + the Pak Phanang basin point downstream/east.
 * - fetchDamStatus: Khao Luang runoff / upstream discharge status, derived from
 *   the GloFAS discharge proxy (NST has no regulating dam, so storage % is null).
 *
 * Both degrade gracefully to a scenario tier when upstream is unavailable.
 */

import type { DamStatus, FloodGauge, NormalizedFeed } from "@nst/shared";
import { cacheAgeMinutes, cachedWithStale as cached } from "../lib/cache.js";
import { fetchJsonOrThrow } from "./common.js";

const TTL_SECONDS = 3 * 60 * 60; // 3h — GloFAS is daily; no need to poll often.

// Tha Dee canal gauge point just west of the city — the primary flood vector
// carrying Khao Luang runoff into Nakhon Si Thammarat.
const THA_DEE = { name: "Tha Dee Canal @ Nakhon Si Thammarat", lat: 8.44, lng: 99.93 };
// Pak Phanang river basin point to the east — the lowland estuary that floods
// after sustained upstream discharge.
const PAK_PHANANG = { name: "Pak Phanang River Basin", lat: 8.35, lng: 100.20 };

interface OpenMeteoFlood {
  daily?: {
    time?: string[];
    river_discharge?: Array<number | null>;
    river_discharge_max?: Array<number | null>;
  };
}

function floodUrl(lat: number, lng: number): string {
  return (
    "https://flood-api.open-meteo.com/v1/flood" +
    `?latitude=${lat}&longitude=${lng}` +
    "&daily=river_discharge,river_discharge_max&forecast_days=7"
  );
}

/** Latest non-null daily river discharge (m³/s) + its date. */
function latestDischarge(p: OpenMeteoFlood | null): { value: number | null; at: string | null } {
  const d = p?.daily;
  if (!d?.river_discharge || !d.time) return { value: null, at: null };
  for (let i = 0; i < d.river_discharge.length; i++) {
    const v = d.river_discharge[i];
    if (typeof v === "number" && Number.isFinite(v)) {
      return { value: v, at: d.time[i] ?? null };
    }
  }
  return { value: null, at: null };
}

/** Peak forecast discharge over the window — used to flag a rising trend. */
function peakDischarge(p: OpenMeteoFlood | null): number | null {
  const arr = p?.daily?.river_discharge_max ?? p?.daily?.river_discharge ?? [];
  let peak: number | null = null;
  for (const v of arr) {
    if (typeof v === "number" && Number.isFinite(v)) {
      peak = peak == null ? v : Math.max(peak, v);
    }
  }
  return peak;
}

// Tha Dee / Pak Phanang discharge thresholds (m³/s) — calibrated against real
// GloFAS grid-cell output. The ~5 km GloFAS model cell returns single-digit
// m³/s for these small Thai canals (observed baseline ≈ 6–8 m³/s), so thresholds
// that would make sense for a large river (300/600/1000) are unreachable here.
// These bands trigger on the *model's* relative departure from baseline flow.
const WATCH_CMS = 15;
const WARNING_CMS = 30;
const FLOOD_CMS = 50;

function gaugeStatus(dischargeCms: number | null): FloodGauge["status"] {
  if (dischargeCms == null) return "unknown";
  if (dischargeCms >= FLOOD_CMS) return "flood";
  if (dischargeCms >= WARNING_CMS) return "warning";
  if (dischargeCms >= WATCH_CMS) return "watch";
  return "normal";
}

export async function fetchFloodGauges(): Promise<NormalizedFeed<FloodGauge>> {
  return cached("flood-gauges", TTL_SECONDS, async () => {
    const fetchedAt = new Date().toISOString();
    const [river, basin] = await Promise.all([
      fetchJsonOrThrow<OpenMeteoFlood>(floodUrl(THA_DEE.lat, THA_DEE.lng)),
      fetchJsonOrThrow<OpenMeteoFlood>(floodUrl(PAK_PHANANG.lat, PAK_PHANANG.lng)),
    ]);

    const features: FloodGauge[] = [];

    const r = latestDischarge(river);
    if (r.value != null) {
      features.push({
        id: "gauge-tha-dee-nst",
        name: THA_DEE.name,
        lat: THA_DEE.lat,
        lng: THA_DEE.lng,
        // We surface discharge-derived status; absolute level (m) is not exposed
        // by GloFAS, so levelM is the discharge proxy in m³/s left null-safe.
        levelM: null,
        warningM: null,
        status: gaugeStatus(r.value),
        observedAt: r.at ?? fetchedAt,
        source: `open-meteo-flood:discharge=${Math.round(r.value)}cms`,
      });
    }

    const d = latestDischarge(basin);
    if (d.value != null) {
      features.push({
        id: "gauge-pak-phanang",
        name: PAK_PHANANG.name,
        lat: PAK_PHANANG.lat,
        lng: PAK_PHANANG.lng,
        levelM: null,
        warningM: null,
        status: gaugeStatus(d.value),
        observedAt: d.at ?? fetchedAt,
        source: `open-meteo-flood:discharge=${Math.round(d.value)}cms`,
      });
    }

    if (features.length === 0) {
      // Scenario fallback so the flood panel always renders.
      return {
        features: [
          {
            id: "gauge-tha-dee-nst",
            name: THA_DEE.name,
            lat: THA_DEE.lat,
            lng: THA_DEE.lng,
            levelM: null,
            warningM: null,
            status: "unknown" as const,
            observedAt: fetchedAt,
            source: "scenario (open-meteo flood unavailable)",
          },
        ],
        meta: {
          source: "open-meteo-flood",
          fetchedAt,
          ageMinutes: 0,
          fallbackTier: "scenario" as const,
          note: "Open-Meteo flood API returned no discharge — showing placeholder gauge.",
        },
      };
    }

    return {
      features,
      meta: {
        source: "open-meteo-flood",
        fetchedAt,
        ageMinutes: cacheAgeMinutes(fetchedAt),
        fallbackTier: "live" as const,
      },
    };
  });
}

function damStatusFromDischarge(latest: number | null, peak: number | null): DamStatus["status"] {
  if (latest == null) return "unknown";
  // Rising sharply toward flood threshold → high; sustained flood threshold → spilling.
  if (latest >= FLOOD_CMS) return "spilling";
  if (latest >= WARNING_CMS || (peak != null && peak >= FLOOD_CMS)) return "high";
  if (latest >= WATCH_CMS) return "normal";
  return "low";
}

export async function fetchDamStatus(): Promise<NormalizedFeed<DamStatus>> {
  return cached("dam-status", TTL_SECONDS, async () => {
    const fetchedAt = new Date().toISOString();
    // NST has no regulating dam — track Khao Luang runoff via the Tha Dee
    // upstream discharge as the "dam" concept's stand-in.
    const upstream = await fetchJsonOrThrow<OpenMeteoFlood>(floodUrl(THA_DEE.lat, THA_DEE.lng));
    const latest = latestDischarge(upstream);
    const peak = peakDischarge(upstream);

    if (latest.value == null) {
      // Scenario: NST has no regulating dam and storage % does not apply —
      // placeholder until the discharge proxy is available.
      return {
        features: [
          {
            id: "runoff-khao-luang",
            name: "Khao Luang runoff / upstream discharge",
            lat: THA_DEE.lat,
            lng: THA_DEE.lng,
            storagePct: null,
            outflowCms: null,
            status: "unknown" as const,
            observedAt: fetchedAt,
            source: "scenario (open-meteo flood unavailable)",
          },
        ],
        meta: {
          source: "open-meteo-flood",
          fetchedAt,
          ageMinutes: 0,
          fallbackTier: "scenario" as const,
          note: "NST has no regulating dam; Open-Meteo Khao Luang runoff discharge proxy unavailable — showing placeholder.",
        },
      };
    }

    const feature: DamStatus = {
      id: "runoff-khao-luang",
      name: "Khao Luang runoff / upstream discharge",
      lat: THA_DEE.lat,
      lng: THA_DEE.lng,
      // No regulating dam → no storage %.
      storagePct: null,
      // Upstream river discharge used as a runoff proxy.
      outflowCms: Math.round(latest.value),
      status: damStatusFromDischarge(latest.value, peak),
      observedAt: latest.at ?? fetchedAt,
      source: "open-meteo-flood (GloFAS discharge proxy)",
    };

    return {
      features: [feature],
      meta: {
        source: "open-meteo-flood",
        fetchedAt,
        ageMinutes: cacheAgeMinutes(fetchedAt),
        // Discharge is real/live; storage % is N/A (no dam) — still "live" for the proxy.
        fallbackTier: "live" as const,
        note: "Discharge is a GloFAS Khao Luang runoff proxy; NST has no regulating dam, so storage % is not applicable.",
      },
    };
  });
}
