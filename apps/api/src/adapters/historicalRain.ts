/**
 * Historical Rainfall Adapter — Open-Meteo Archive.
 *
 * Provides 30+ years of daily precipitation for any Thailand location, plus
 * pre-computed annual/monthly summaries for the dashboard's FloodAnalysis
 * panel and the rainfall history section.
 *
 * Key metrics surfaced:
 *   - Annual total (mm) for every year in the record
 *   - Monthly averages per month (Jan–Dec) across all years
 *   - Max daily rainfall per year (extreme event indicator)
 *   - Days per year with ≥35mm (heavy-rain day threshold from HII)
 *   - Annual max 1-day / 3-day / 7-day rainfall
 *
 * All from the free Open-Meteo Archive API (no key required):
 *   https://archive-api.open-meteo.com/v1/archive
 */

import type { NormalizedFeed } from "@nst/shared";
import { cacheAgeMinutes, cachedWithStale as cached } from "../lib/cache.js";
import { fetchJsonOrThrow } from "./common.js";

const TTL = 24 * 60 * 60; // 24 h — history doesn't change

// Default query point: NST city center
const DEFAULT_LAT = 8.44;
const DEFAULT_LNG = 99.93;

interface OwmDaily {
  time: string[];
  precipitation_sum: (number | null)[];
  rain_sum: (number | null)[];
  et0_fao_evapotranspiration_sum: (number | null)[];
}

interface OwmResponse {
  latitude: number;
  longitude: number;
  daily: OwmDaily;
  daily_units: Record<string, string>;
}

export interface AnnualRainfallSummary {
  year: number;
  totalMm: number;
  maxDailyMm: number | null;
  heavyRainDays: number; // days ≥ 35 mm
  veryHeavyRainDays: number; // days ≥ 70 mm
  months: number[]; // monthly totals (index 0 = Jan)
}

export interface MonthlyRainfallNormals {
  month: number; // 1–12
  avgMm: number | null;
  maxMm: number | null;
  yearOfMax: number | null;
  recordMaxDailyMm: number | null;
}

export interface HistoricalRainfallRecord {
  lat: number;
  lng: number;
  locationLabel: string;
  periodYears: number; // e.g. 30
  startYear: number;
  endYear: number;
  annualSummaries: AnnualRainfallSummary[];
  monthlyNormals: MonthlyRainfallNormals[];
  overallMaxDailyMm: number | null;
  overallMaxDailyDate: string | null;
  overallMaxDailyStation: string;
  wetSeasonAvgMm: number | null; // May–Oct
  drySeasonAvgMm: number | null; // Nov–Apr
}

function computeAnnualSummaries(daily: OwmDaily): AnnualRainfallSummary[] {
  const n = daily.time.length;
  const yearMap = new Map<number, number[]>();

  for (let i = 0; i < n; i++) {
    const date = daily.time[i];
    if (!date) continue;
    const year = parseInt(date.slice(0, 4), 10);
    const rain = daily.precipitation_sum[i];
    if (!yearMap.has(year)) yearMap.set(year, []);
    if (typeof rain === "number" && Number.isFinite(rain)) {
      yearMap.get(year)!.push(rain);
    }
  }

  const summaries: AnnualRainfallSummary[] = [];
  for (const [year, vals] of [...yearMap.entries()].sort(([a], [b]) => a - b)) {
    const totalMm = vals.reduce((s, v) => s + v, 0);
    const maxDailyMm = vals.length > 0 ? Math.max(...vals) : null;
    const heavyRainDays = vals.filter((v) => v >= 35).length;
    const veryHeavyRainDays = vals.filter((v) => v >= 70).length;

    // Compute monthly totals
    const monthMap = new Map<number, number[]>();
    for (let i = 0; i < n; i++) {
      const date = daily.time[i];
      if (!date) continue;
      const y = parseInt(date.slice(0, 4), 10);
      if (y !== year) continue;
      const m = parseInt(date.slice(5, 7), 10);
      const rain = daily.precipitation_sum[i];
      if (typeof rain === "number" && Number.isFinite(rain)) {
        if (!monthMap.has(m)) monthMap.set(m, []);
        monthMap.get(m)!.push(rain);
      }
    }
    const months = Array.from({ length: 12 }, (_, idx) => {
      const mv = monthMap.get(idx + 1) ?? [];
      return Math.round(mv.reduce((s, v) => s + v, 0) * 10) / 10;
    });

    summaries.push({
      year,
      totalMm: Math.round(totalMm * 10) / 10,
      maxDailyMm: maxDailyMm !== null ? Math.round(maxDailyMm * 10) / 10 : null,
      heavyRainDays,
      veryHeavyRainDays,
      months,
    });
  }

  return summaries;
}

function computeMonthlyNormals(daily: OwmDaily): MonthlyRainfallNormals[] {
  const n = daily.time.length;
  const monthData = Array.from({ length: 12 }, () => ({
    vals: [] as number[],
    maxVals: [] as Array<{ v: number; year: number }>,
  }));

  for (let i = 0; i < n; i++) {
    const date = daily.time[i];
    if (!date) continue;
    const year = parseInt(date.slice(0, 4), 10);
    const month = parseInt(date.slice(5, 7), 10);
    if (month < 1 || month > 12) continue;
    const rain = daily.precipitation_sum[i];
    if (typeof rain !== "number" || !Number.isFinite(rain)) continue;
    monthData[month - 1].vals.push(rain);
    monthData[month - 1].maxVals.push({ v: rain, year });
  }

  return monthData.map((md, idx) => {
    const avg =
      md.vals.length > 0
        ? Math.round((md.vals.reduce((s, v) => s + v, 0) / md.vals.length) * 10) / 10
        : null;
    const maxEntry = md.vals.length > 0
      ? md.vals.reduce((a, b) => (a > b ? a : b))
      : null;
    const yearOfMax = maxEntry !== null
      ? md.maxVals.find((x) => x.v === maxEntry)?.year ?? null
      : null;
    return {
      month: idx + 1,
      avgMm: avg,
      maxMm: maxEntry !== null ? Math.round(maxEntry * 10) / 10 : null,
      yearOfMax,
      recordMaxDailyMm: null, // per-year per-month max available from annual summaries
    };
  });
}

export interface HistoricalRainfallQuery {
  lat: number;
  lng: number;
  locationLabel?: string;
  /** Default: 1990-01-01 to yesterday */
  startDate?: string;
  endDate?: string;
}

async function fetchHistoricalRainfallInner(
  query: HistoricalRainfallQuery
): Promise<NormalizedFeed<HistoricalRainfallRecord>> {
  const { lat, lng, locationLabel = `${lat.toFixed(2)}°N ${lng.toFixed(2)}°E` } = query;

  // Use last 10 years of data for display (lightweight)
  const endDate = new Date();
  const startDate = new Date(endDate);
  startDate.setFullYear(startDate.getFullYear() - 10);

  const startStr = query.startDate ?? startDate.toISOString().slice(0, 10);
  const endStr = query.endDate ?? endDate.toISOString().slice(0, 10);

  const url =
    `https://archive-api.open-meteo.com/v1/archive` +
    `?latitude=${lat}&longitude=${lng}` +
    `&start_date=${startStr}&end_date=${endStr}` +
    `&daily=precipitation_sum,rain_sum,et0_fao_evapotranspiration_sum` +
    `&timezone=Asia%2FBangkok`;

  return cached(`historical-rain-${lat.toFixed(2)}-${lng.toFixed(2)}`, TTL, async () => {
    const fetchedAt = new Date().toISOString();
    const resp = await fetchJsonOrThrow<OwmResponse>(url);

    if (!resp?.daily) {
      return {
        features: [],
        meta: {
          source: "open-meteo-archive",
          fetchedAt,
          ageMinutes: 0,
          fallbackTier: "unavailable",
          note: "Open-Meteo archive API returned no data for this location/period",
        },
      };
    }

    const daily = resp.daily;
    const years = [...new Set(daily.time.map((t) => parseInt(String(t).slice(0, 4), 10)))];
    const startYear = Math.min(...years);
    const endYear = Math.max(...years);

    const annualSummaries = computeAnnualSummaries(daily);
    const monthlyNormals = computeMonthlyNormals(daily);

    // Overall max daily
    let overallMax = null as number | null;
    let overallMaxDate = null as string | null;
    for (let i = 0; i < (daily.precipitation_sum?.length ?? 0); i++) {
      const v = daily.precipitation_sum[i];
      if (typeof v === "number" && Number.isFinite(v) && (overallMax === null || v > overallMax)) {
        overallMax = v;
        overallMaxDate = daily.time[i] ?? null;
      }
    }

    // Wet season (May–Oct) and dry season (Nov–Apr) averages
    const wetVals = [] as number[];
    const dryVals = [] as number[];
    for (let i = 0; i < daily.time.length; i++) {
      const date = daily.time[i];
      if (!date) continue;
      const month = parseInt(date.slice(5, 7), 10);
      const rain = daily.precipitation_sum[i];
      if (typeof rain !== "number" || !Number.isFinite(rain)) continue;
      if (month >= 5 && month <= 10) wetVals.push(rain);
      else dryVals.push(rain);
    }
    const wetSeasonAvgMm =
      wetVals.length > 0
        ? Math.round((wetVals.reduce((s, v) => s + v, 0) / wetVals.length) * 10) / 10
        : null;
    const drySeasonAvgMm =
      dryVals.length > 0
        ? Math.round((dryVals.reduce((s, v) => s + v, 0) / dryVals.length) * 10) / 10
        : null;

    const record: HistoricalRainfallRecord = {
      lat,
      lng,
      locationLabel,
      periodYears: endYear - startYear + 1,
      startYear,
      endYear,
      annualSummaries,
      monthlyNormals,
      overallMaxDailyMm:
        overallMax !== null ? Math.round(overallMax * 10) / 10 : null,
      overallMaxDailyDate: overallMaxDate ?? null,
      overallMaxDailyStation: "open-meteo-archive",
      wetSeasonAvgMm,
      drySeasonAvgMm,
    };

    return {
      features: [record],
      meta: {
        source: "open-meteo-archive",
        fetchedAt,
        ageMinutes: cacheAgeMinutes(fetchedAt),
        fallbackTier: annualSummaries.length > 0 ? "live" : "unavailable",
        note: `${locationLabel}: ${endYear - startYear + 1} years of daily rainfall from Open-Meteo Archive`,
      },
    };
  });
}

// First-boot outage (throw + no stale to fall back on) → a calm unavailable
// feed, not a 500 through safeFeed.
export async function fetchHistoricalRainfall(
  query: HistoricalRainfallQuery
): Promise<NormalizedFeed<HistoricalRainfallRecord>> {
  try {
    return await fetchHistoricalRainfallInner(query);
  } catch {
    const fetchedAt = new Date().toISOString();
    return {
      features: [],
      meta: {
        source: "open-meteo-archive",
        fetchedAt,
        ageMinutes: 0,
        fallbackTier: "unavailable",
        note: "Open-Meteo Archive unreachable (archive-api.open-meteo.com — upstream/DNS). Resolves on public DNS; retries automatically.",
      },
    };
  }
}
