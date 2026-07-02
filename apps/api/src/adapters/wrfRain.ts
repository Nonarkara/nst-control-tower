/**
 * WRF-ROMS 3-day rain forecast over the NST watershed — HII's coupled
 * atmosphere–ocean model (GFS-driven, ~3 km d03 grid over Thailand),
 * published twice daily as ESRI ASCII grids on the award-winning HII
 * open-data service. This is the "how much water is coming down at the
 * city" answer at watershed scale: rain falling on the Khao Luang massif
 * today is in the Tha Dee canal within hours and downtown within
 * ~1.4–2.8 h of the upper gauges (see web lib/watershed.ts lead-time math).
 *
 * Source: https://tiservice.hii.or.th/opendata/wrf-roms/
 *   <YYYY-MM-DD>_<00|12>UTC_esri_rain24hr_d03_asc/esri_rain24hr_d03_day{1,2,3}.asc
 * Free, no key. Grid observed 543×699 cells, cell 0.0271°, origin 95.48E 3.64N.
 *
 * Workers-CPU honesty: a full grid is ~380 k floats per file. We never parse
 * it all — rows are newline-delimited (north first), so we split/parse ONLY
 * the ~60 rows covering the NST province window and slice each to the ~40
 * relevant columns (~100 k parses across all 3 days, cached 6 h).
 */

import type { NormalizedFeed, WrfRainDay, WrfRainGrid } from "@nst/shared";
import { cacheAgeMinutes, cachedWithStale as cached } from "../lib/cache.js";
import { fetchTextOrNull } from "./common.js";

const BASE = "https://tiservice.hii.or.th/opendata/wrf-roms";
const TTL_SECONDS = 6 * 3600; // model runs land twice a day; 6 h is plenty
const SOURCE = "hii-wrf-roms";

// ── Analysis windows (WGS84 degrees) ────────────────────────────────────────
// Province window we retain from the national grid (matches NST_PROVINCE_BBOX).
const PROV = { lngMin: 99.3, lngMax: 100.35, latMin: 7.8, latMax: 9.45 };
// Khao Luang–Tha Dee upstream catchment: the massif's eastern flank feeding
// คีรีวง/ลานสกา and the city (box around the WATERSHED_FORECAST_POINTS
// upstream zones; verified against the real grid → 144 cells).
const CATCHMENT = { lngMin: 99.65, lngMax: 99.95, latMin: 8.25, latMax: 8.55 };
// City + coastal lowland (Old Town → Pak Nakhon).
const CITY = { lngMin: 99.9, lngMax: 100.1, latMin: 8.35, latMax: 8.52 };

interface AscHeader {
  ncols: number;
  nrows: number;
  xll: number;
  yll: number;
  cell: number;
  nodata: number;
}

/** Province-window slice of one day's grid (row-major from the NW corner). */
interface DayWindow {
  lngMin: number;
  latMax: number;
  cellDeg: number;
  ncols: number;
  nrows: number;
  valuesMm: number[]; // −1 = NODATA
}

/**
 * Parses an ESRI ASCII grid but materialises only the province window.
 * Exported for tests (synthetic small grids exercise the exact row/col math).
 */
export function parseAscWindow(text: string): DayWindow | null {
  // Header: 6 lines of "KEY value". Split off just enough of the head.
  const headerEnd = nthLineEnd(text, 6);
  if (headerEnd < 0) return null;
  const hdr: Partial<AscHeader> = {};
  for (const line of text.slice(0, headerEnd).split("\n")) {
    const [k, v] = line.trim().split(/\s+/);
    if (!k || v === undefined) continue;
    const key = k.toUpperCase();
    if (key === "NCOLS") hdr.ncols = parseInt(v, 10);
    else if (key === "NROWS") hdr.nrows = parseInt(v, 10);
    else if (key === "XLLCORNER") hdr.xll = parseFloat(v);
    else if (key === "YLLCORNER") hdr.yll = parseFloat(v);
    else if (key === "CELLSIZE") hdr.cell = parseFloat(v);
    else if (key === "NODATA_VALUE") hdr.nodata = parseFloat(v);
  }
  const { ncols, nrows, xll, yll, cell } = hdr;
  if (!ncols || !nrows || xll === undefined || yll === undefined || !cell) return null;
  const nodata = hdr.nodata ?? -9999;

  // Column window (clamped).
  const c0 = Math.max(0, Math.floor((PROV.lngMin - xll) / cell));
  const c1 = Math.min(ncols - 1, Math.floor((PROV.lngMax - xll) / cell));
  // Row window — ASCII rows run north→south; row r covers latitude band
  // [yll + (nrows−1−r)·cell, yll + (nrows−r)·cell).
  const rTop = Math.max(0, nrows - 1 - Math.floor((PROV.latMax - yll) / cell));
  const rBot = Math.min(nrows - 1, nrows - 1 - Math.floor((PROV.latMin - yll) / cell));
  if (c1 < c0 || rBot < rTop) return null;

  const values: number[] = [];
  let pos = headerEnd + 1;
  for (let r = 0; r < nrows && pos <= text.length; r++) {
    let next = text.indexOf("\n", pos);
    if (next < 0) next = text.length;
    if (r >= rTop && r <= rBot) {
      // Only these rows pay the split/parse cost.
      const cells = text.slice(pos, next).trim().split(/\s+/);
      for (let c = c0; c <= c1; c++) {
        const v = parseFloat(cells[c]);
        values.push(!Number.isFinite(v) || v === nodata ? -1 : v);
      }
    }
    pos = next + 1;
  }

  return {
    lngMin: xll + c0 * cell,
    latMax: yll + (nrows - rTop) * cell,
    cellDeg: cell,
    ncols: c1 - c0 + 1,
    nrows: rBot - rTop + 1,
    valuesMm: values,
  };
}

function nthLineEnd(text: string, n: number): number {
  let pos = -1;
  for (let i = 0; i < n; i++) {
    pos = text.indexOf("\n", pos + 1);
    if (pos < 0) return -1;
  }
  return pos;
}

/** Mean/max over a lat/lng box within a province window (NODATA excluded). */
export function windowStats(
  w: DayWindow,
  box: { lngMin: number; lngMax: number; latMin: number; latMax: number },
): { meanMm: number; maxMm: number } {
  let sum = 0;
  let max = 0;
  let n = 0;
  for (let r = 0; r < w.nrows; r++) {
    const latTop = w.latMax - r * w.cellDeg;
    if (latTop < box.latMin || latTop - w.cellDeg > box.latMax) continue;
    for (let c = 0; c < w.ncols; c++) {
      const lng = w.lngMin + (c + 0.5) * w.cellDeg;
      if (lng < box.lngMin || lng > box.lngMax) continue;
      const v = w.valuesMm[r * w.ncols + c];
      if (v < 0) continue;
      sum += v;
      if (v > max) max = v;
      n++;
    }
  }
  if (n === 0) return { meanMm: 0, maxMm: 0 };
  return { meanMm: Math.round((sum / n) * 10) / 10, maxMm: Math.round(max * 10) / 10 };
}

interface WrfRun {
  runId: string; // e.g. "2026-07-01_12UTC"
  fetchedAt: string;
  days: (DayWindow | null)[]; // index 0..2 = day1..day3
}

function runCandidates(now: Date): string[] {
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  const today = fmt(now);
  const yesterday = fmt(new Date(now.getTime() - 86_400_000));
  const before = fmt(new Date(now.getTime() - 2 * 86_400_000));
  // Newest first. Publication lags the run date by up to a day, so reach back 2.
  return [
    `${today}_12UTC`,
    `${today}_00UTC`,
    `${yesterday}_12UTC`,
    `${yesterday}_00UTC`,
    `${before}_12UTC`,
    `${before}_00UTC`,
  ];
}

function dayUrl(runId: string, day: number): string {
  return `${BASE}/${runId}_esri_rain24hr_d03_asc/esri_rain24hr_d03_day${day}.asc`;
}

async function fetchLatestRun(): Promise<WrfRun | null> {
  return cached("wrf-rain-run", TTL_SECONDS, async () => {
    const fetchedAt = new Date().toISOString();
    for (const runId of runCandidates(new Date())) {
      const day1 = await fetchTextOrNull(dayUrl(runId, 1));
      if (!day1) continue;
      const [day2, day3] = await Promise.all([
        fetchTextOrNull(dayUrl(runId, 2)),
        fetchTextOrNull(dayUrl(runId, 3)),
      ]);
      const days = [day1, day2, day3].map((t) => (t ? parseAscWindow(t) : null));
      if (!days[0]) continue; // header/format surprise — try the next run
      return { runId, fetchedAt, days };
    }
    return null;
  });
}

/** Valid date of a run's dayN file: run date + (n−1) days. */
function validDate(runId: string, day: number): string {
  const base = new Date(`${runId.slice(0, 10)}T00:00:00Z`);
  return new Date(base.getTime() + (day - 1) * 86_400_000).toISOString().slice(0, 10);
}

const UNAVAILABLE_NOTE =
  "WRF-ROMS grids unreachable (tiservice.hii.or.th) — no recent run found";

export async function fetchWrfRainOutlook(): Promise<NormalizedFeed<WrfRainDay>> {
  const run = await fetchLatestRun();
  if (!run) {
    return {
      features: [],
      meta: {
        source: SOURCE,
        fetchedAt: new Date().toISOString(),
        ageMinutes: 0,
        fallbackTier: "unavailable" as const,
        note: UNAVAILABLE_NOTE,
      },
    };
  }
  const features: WrfRainDay[] = [];
  run.days.forEach((w, i) => {
    if (!w) return;
    const day = (i + 1) as 1 | 2 | 3;
    const catchment = windowStats(w, CATCHMENT);
    const city = windowStats(w, CITY);
    features.push({
      day,
      validDate: validDate(run.runId, day),
      catchmentMeanMm: catchment.meanMm,
      catchmentMaxMm: catchment.maxMm,
      cityMeanMm: city.meanMm,
      cityMaxMm: city.maxMm,
    });
  });
  return {
    features,
    meta: {
      source: SOURCE,
      fetchedAt: run.fetchedAt,
      ageMinutes: cacheAgeMinutes(run.fetchedAt),
      fallbackTier: "live" as const,
      note: `model run ${run.runId}`,
    },
  };
}

export async function fetchWrfRainGrid(day: 1 | 2 | 3): Promise<NormalizedFeed<WrfRainGrid>> {
  const run = await fetchLatestRun();
  const w = run?.days[day - 1];
  if (!run || !w) {
    return {
      features: [],
      meta: {
        source: SOURCE,
        fetchedAt: new Date().toISOString(),
        ageMinutes: 0,
        fallbackTier: "unavailable" as const,
        note: run ? `model run ${run.runId} has no day${day} grid` : UNAVAILABLE_NOTE,
      },
    };
  }
  return {
    features: [
      {
        day,
        validDate: validDate(run.runId, day),
        lngMin: w.lngMin,
        latMax: w.latMax,
        cellDeg: w.cellDeg,
        ncols: w.ncols,
        nrows: w.nrows,
        valuesMm: w.valuesMm,
      },
    ],
    meta: {
      source: SOURCE,
      fetchedAt: run.fetchedAt,
      ageMinutes: cacheAgeMinutes(run.fetchedAt),
      fallbackTier: "live" as const,
      note: `model run ${run.runId}`,
    },
  };
}
