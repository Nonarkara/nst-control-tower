/**
 * GISTDA water adapters — three token-free FeatureServers on the public
 * gistdaportal ArcGIS directory, found by enumerating all 2,243 services
 * (2026-09-16) and probing the ~200 water/flood hits for NST coverage.
 *
 *   /api/gistda/level-posts     Hosted/สถานีวัดระดับน้ำ — 91 southern water-level
 *                               posts (เสาระดับ + small telemetry), 13 in NST,
 *                               with the waterway name and the highest level ever
 *                               recorded. Static (item 2021-08-08) → reference.
 *   /api/gistda/flood-stations  Hosted/GISTDA_FLOOD — national water-level
 *                               aggregation (21,942 rows, 672 in NST, 27
 *                               stations) with bank level, % of bank and
 *                               GISTDA's own alert class ปกติ/แจ้งเตือน/อันตราย.
 *                               Re-uploaded periodically, observations lag by
 *                               weeks → database tier, never "live".
 *   /api/gistda/flood-extent    Hosted/3dayflood — SAR-derived flooded area per
 *                               tambon from the Nov 2025 southern flood (item
 *                               2025-11-25). 232 NST tambons → reference.
 *
 * The Flood / Disaster folders on the same portal need a GISTDA token (499
 * "Token Required") and are catalogued as candidates, not wired.
 */

import type { NormalizedFeed, GistdaLevelPost, GistdaFloodStation, GistdaFloodExtentTambon } from "@nst/shared";
import { NST_PROVINCE_BBOX } from "@nst/shared";
import { cacheAgeMinutes, cachedWithStale as cached } from "../lib/cache.js";
import { fetchJsonOrThrow } from "./common.js";

const PORTAL = "https://gistdaportal.gistda.or.th/arcgis/rest/services/Hosted";

interface ArcGisFeature {
  attributes?: Record<string, unknown>;
  geometry?: { x?: number; y?: number; rings?: number[][][] };
}
interface ArcGisFeatureSet {
  features?: ArcGisFeature[];
  error?: { message?: string };
}

function bboxParam(): string {
  const [[lng0, lat0], [lng1, lat1]] = NST_PROVINCE_BBOX;
  return `${lng0},${lat0},${lng1},${lat1}`;
}

/** Query layer 0 of a Hosted FeatureServer inside the province bbox, lng/lat out. */
function queryUrl(service: string, fields: string, extra: Record<string, string> = {}): string {
  const params = new URLSearchParams({
    f: "json",
    where: "1=1",
    geometry: bboxParam(),
    geometryType: "esriGeometryEnvelope",
    inSR: "4326",
    spatialRel: "esriSpatialRelIntersects",
    outFields: fields,
    outSR: "4326",
    resultRecordCount: "2000",
    ...extra,
  });
  return `${PORTAL}/${encodeURIComponent(service)}/FeatureServer/0/query?${params}`;
}

async function queryFeatures(service: string, fields: string, extra?: Record<string, string>): Promise<ArcGisFeature[]> {
  const data = await fetchJsonOrThrow<ArcGisFeatureSet>(queryUrl(service, fields, extra));
  if (!data?.features) {
    // ArcGIS returns HTTP 200 with an `error` body on failure — must reject so
    // cachedWithStale serves the last good snapshot instead of caching the outage.
    throw new Error(`GISTDA ${service}: ${data?.error?.message ?? "no feature set"}`);
  }
  return data.features;
}

function num(v: unknown): number | null {
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  if (typeof v === "string" && v.trim() !== "") {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}
function str(v: unknown): string {
  return typeof v === "string" ? v.trim() : v == null ? "" : String(v);
}

function unavailable<T>(source: string, note: string): NormalizedFeed<T> {
  const fetchedAt = new Date().toISOString();
  return { features: [], meta: { source, fetchedAt, ageMinutes: cacheAgeMinutes(fetchedAt), fallbackTier: "unavailable", note } };
}

// ── Level posts ──────────────────────────────────────────────────────────

const POSTS_SOURCE = "gistda-level-posts";

export async function fetchGistdaLevelPosts(): Promise<NormalizedFeed<GistdaLevelPost>> {
  try {
    return await cached(POSTS_SOURCE, 24 * 3600, async () => {
      const fetchedAt = new Date().toISOString();
      const feats = await queryFeatures("สถานีวัดระดับน้ำ", "*");
      const features: GistdaLevelPost[] = [];
      for (const f of feats) {
        const a = f.attributes ?? {};
        const lat = num(a.lat) ?? num(f.geometry?.y);
        const lng = num(a.long) ?? num(f.geometry?.x);
        if (lat == null || lng == null) continue;
        const province = str(a["จัง"]);
        if (!province.includes("นครศรีธรรมราช")) continue;
        const kindRaw = str(a["สำร"]);
        const vmax = num(a.v_max);
        features.push({
          id: `gistda-post-${str(a.fid) || str(a["ลำด"]) || features.length}`,
          name: str(a["สถา"]) || "(unnamed post)",
          river: str(a["แม่"]),
          kind: kindRaw.includes("โทรมาตร") ? "telemetry" : "post",
          vMaxM: vmax != null && vmax > 0 ? vmax : null,
          amphoe: str(a["อำเ"]),
          province,
          lat,
          lng,
        });
      }
      return {
        features,
        meta: {
          source: POSTS_SOURCE,
          fetchedAt,
          ageMinutes: cacheAgeMinutes(fetchedAt),
          fallbackTier: "reference" as const,
          note: `${features.length} water-level posts in NST — GISTDA portal upload 2021-08-08 (static reference)`,
        },
      };
    }, 7 * 24 * 3600);
  } catch (err) {
    return unavailable(POSTS_SOURCE, `GISTDA level posts unavailable — ${(err as Error).message}`);
  }
}

// ── Flood stations (national water-level aggregation) ────────────────────

const STATIONS_SOURCE = "gistda-flood-stations";

function classifyOf(th: string): GistdaFloodStation["classify"] {
  if (th === "ปกติ") return "normal";
  if (th === "แจ้งเตือน") return "alert";
  if (th === "อันตราย") return "danger";
  return "unknown";
}

export async function fetchGistdaFloodStations(): Promise<NormalizedFeed<GistdaFloodStation>> {
  try {
    return await cached(STATIONS_SOURCE, 6 * 3600, async () => {
      const fetchedAt = new Date().toISOString();
      const feats = await queryFeatures(
        "GISTDA_FLOOD",
        "station_old_code,station_name,amphoe,tambon,basin_name,value,min_bank,ground_level,percentage,discharge,classify_name,update_time,x,y",
      );
      // Many rows per station (one per upload) → keep the newest per code.
      const latest = new Map<string, { t: number; f: ArcGisFeature }>();
      for (const f of feats) {
        const a = f.attributes ?? {};
        const code = str(a.station_old_code);
        if (!code) continue;
        const t = num(a.update_time) ?? 0;
        const prev = latest.get(code);
        if (!prev || t > prev.t) latest.set(code, { t, f });
      }
      const features: GistdaFloodStation[] = [];
      let newest = 0;
      for (const [code, { t, f }] of latest) {
        const a = f.attributes ?? {};
        const lat = num(f.geometry?.y) ?? num(a.y);
        const lng = num(f.geometry?.x) ?? num(a.x);
        if (lat == null || lng == null) continue;
        if (t > newest) newest = t;
        const classifyTh = str(a.classify_name) || null;
        features.push({
          stationCode: code,
          name: str(a.station_name) || code,
          amphoe: str(a.amphoe),
          tambon: str(a.tambon),
          basin: str(a.basin_name) || null,
          levelM: num(a.value),
          bankM: num(a.min_bank),
          groundM: num(a.ground_level),
          fullnessPct: num(a.percentage),
          dischargeCms: num(a.discharge),
          classify: classifyOf(classifyTh ?? ""),
          classifyTh,
          observedAt: t > 0 ? new Date(t).toISOString() : null,
          lat,
          lng,
        });
      }
      const alerts = features.filter((s) => s.classify !== "normal" && s.classify !== "unknown").length;
      return {
        features,
        meta: {
          source: STATIONS_SOURCE,
          fetchedAt,
          ageMinutes: cacheAgeMinutes(fetchedAt),
          // A re-uploaded snapshot: honest tier is database, and the note
          // carries the newest observation so the UI can show the real lag.
          fallbackTier: "database" as const,
          note: `${features.length} stations · ${alerts} flagged แจ้งเตือน/อันตราย · newest obs ${newest > 0 ? new Date(newest).toISOString().slice(0, 10) : "?"} (GISTDA snapshot, not live)`,
        },
      };
    }, 30 * 24 * 3600);
  } catch (err) {
    return unavailable(STATIONS_SOURCE, `GISTDA flood stations unavailable — ${(err as Error).message}`);
  }
}

// ── Flood extent (Nov 2025 southern flood, per tambon) ───────────────────

const EXTENT_SOURCE = "gistda-flood-extent";

export async function fetchGistdaFloodExtent(): Promise<NormalizedFeed<GistdaFloodExtentTambon>> {
  try {
    return await cached(EXTENT_SOURCE, 24 * 3600, async () => {
      const fetchedAt = new Date().toISOString();
      const feats = await queryFeatures(
        "3dayflood",
        "tb_idn,tb_tn,ap_tn,pv_tn,flood_area,f_area,house,lat,long",
        // ~50 m simplification — a tambon outline, not a survey.
        { maxAllowableOffset: "0.0005", geometryPrecision: "5" },
      );
      const features: GistdaFloodExtentTambon[] = [];
      for (const f of feats) {
        const a = f.attributes ?? {};
        if (!str(a.pv_tn).includes("นครศรีธรรมราช")) continue;
        const lat = num(a.lat);
        const lng = num(a.long);
        if (lat == null || lng == null) continue;
        const rings = (f.geometry?.rings ?? []).map((ring) => ring.map((p) => [p[0], p[1]] as [number, number]));
        features.push({
          tambonCode: str(a.tb_idn),
          tambon: str(a.tb_tn).replace(/^ต\./, ""),
          amphoe: str(a.ap_tn).replace(/^อ\./, ""),
          province: "นครศรีธรรมราช",
          floodAreaRai: num(a.flood_area),
          floodAreaSqm: num(a.f_area),
          houses: num(a.house),
          lat,
          lng,
          rings,
        });
      }
      const rai = features.reduce((s, t) => s + (t.floodAreaRai ?? 0), 0);
      return {
        features,
        meta: {
          source: EXTENT_SOURCE,
          fetchedAt,
          ageMinutes: cacheAgeMinutes(fetchedAt),
          fallbackTier: "reference" as const,
          note: `${features.length} NST tambons · ${Math.round(rai).toLocaleString()} rai flooded — GISTDA SAR extent, Nov 2025 event (static reference)`,
        },
      };
    }, 30 * 24 * 3600);
  } catch (err) {
    return unavailable(EXTENT_SOURCE, `GISTDA flood extent unavailable — ${(err as Error).message}`);
  }
}
