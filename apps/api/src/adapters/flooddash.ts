/**
 * Flooddash southern analytics — ported from ~/Flooddash for the NST dashboard.
 *
 * Computes province watch scores and GloFAS river cascade for southern Thailand
 * from the same upstream sources Flooddash uses (HII ThaiWater national load,
 * Open-Meteo forecast + GloFAS discharge). No Flooddash server dependency.
 *
 * Risk formula (risk.js): water 50% · rain 30% · forecast 20% — watch indicator,
 * not a prediction model.
 */

import type {
  NormalizedFeed,
  ProvinceWatchScore,
  FloodWatchBand,
  SouthernFloodRiskFeed,
  SouthernRiverCascadeFeed,
  SouthernRiverReach,
  SouthernRiverLink,
  RiverDischargeBand,
} from "@nst/shared";
import { isSouthernRegion, isSouthernProvinceCode } from "@nst/shared";
import { cacheAgeMinutes, cachedWithStale as cached } from "../lib/cache.js";
import { fetchJsonOrNull, fetchJsonOrThrow } from "./common.js";
import { NST_CANAL_GLOFAS_THRESHOLDS } from "./flood.js";

const TTL_RISK = 5 * 60;
const TTL_RIVERS = 3 * 60 * 60;

const TW_WL = "https://api-v3.thaiwater.net/api/v1/thaiwater30/public/waterlevel_load";
const TW_RAIN = "https://api-v3.thaiwater.net/api/v1/thaiwater30/public/rain_24h";
const OM_FORECAST = "https://api.open-meteo.com/v1/forecast";
const GLOFAS = "https://flood-api.open-meteo.com/v1/flood";

const RISK_WEIGHTS = { water: 0.5, rain: 0.3, forecast: 0.2 };
const RISK_BANDS = { watch: 20, elevated: 45, high: 70 };
const RAIN_FLASH_1H = 30;

/** Southern river reaches — Flooddash rivers.js + NST Tha Dee / Pak Phanang. */
const SOUTHERN_REACHES = [
  {
    id: "utaphao_hatyai",
    nameTh: "คลองอู่ตะเภา ที่หาดใหญ่",
    nameEn: "Khlong U-Taphao at Hat Yai",
    basinTh: "ลุ่มน้ำทะเลสาบสงขลา",
    basinEn: "Songkhla Lake",
    lat: 7.21,
    lng: 100.42,
    downstream: null as string | null,
    lagDays: 0,
    watch: 120,
    warning: 250,
    emergency: 400,
    noteTh: "คลองผ่านหาดใหญ่ — ลุ่มน้ำเล็ก น้ำมาเร็ว ท่วมฉับพลัน",
    noteEn: "the canal through Hat Yai — a small, flashy catchment",
  },
  {
    id: "tapi_surat",
    nameTh: "ตาปี ที่สุราษฎร์ธานี",
    nameEn: "Tapi at Surat Thani",
    basinTh: "ลุ่มน้ำตาปี",
    basinEn: "Tapi",
    lat: 9.19,
    lng: 99.33,
    downstream: null,
    lagDays: 0,
    watch: 400,
    warning: 800,
    emergency: 1300,
    noteTh: "แม่น้ำใหญ่สุดของภาคใต้",
    noteEn: "the South's largest river",
  },
  {
    id: "pattani_river",
    nameTh: "ปัตตานี ที่ปัตตานี",
    nameEn: "Pattani at Pattani",
    basinTh: "ลุ่มน้ำปัตตานี",
    basinEn: "Pattani",
    lat: 6.82,
    lng: 101.2,
    downstream: null,
    lagDays: 0,
    watch: 150,
    warning: 300,
    emergency: 500,
    noteTh: "ท้ายเขื่อนบางลาง",
    noteEn: "below Bang Lang Dam",
  },
  {
    id: "tha_dee_nst",
    nameTh: "คลองท่าดี นครศรีธรรมราช",
    nameEn: "Tha Dee Canal @ Nakhon Si Thammarat",
    basinTh: "ลุ่มน้ำปากพนัง",
    basinEn: "Pak Phanang",
    lat: 8.44,
    lng: 99.93,
    downstream: null,
    lagDays: 0,
    watch: NST_CANAL_GLOFAS_THRESHOLDS.watch,
    warning: NST_CANAL_GLOFAS_THRESHOLDS.warning,
    emergency: NST_CANAL_GLOFAS_THRESHOLDS.emergency,
    noteTh: "เส้นทางน้ำหลักเข้าเมืองนครศรี — น้ำจากเขาหลวง",
    noteEn: "primary flood vector into NST city — Khao Luang runoff",
  },
  {
    id: "pak_phanang",
    nameTh: "ลุ่มน้ำปากพนัง",
    nameEn: "Pak Phanang River Basin",
    basinTh: "ลุ่มน้ำปากพนัง",
    basinEn: "Pak Phanang",
    lat: 8.35,
    lng: 100.2,
    downstream: null,
    lagDays: 0,
    watch: NST_CANAL_GLOFAS_THRESHOLDS.watch,
    warning: NST_CANAL_GLOFAS_THRESHOLDS.warning,
    emergency: NST_CANAL_GLOFAS_THRESHOLDS.emergency,
    noteTh: "ที่ราบลุ่มตะวันออก — ท่วมหลังฝนต่อเนื่อง",
    noteEn: "eastern lowland basin — floods after sustained upstream rain",
  },
] as const;

// ---- ThaiWater row shapes ----

interface TWName { th?: string; en?: string }

interface TWRowBase {
  geocode?: {
    province_code?: string;
    province_name?: TWName | string;
    area_name?: TWName | string;
  };
  station?: {
    id?: number;
    tele_station_name?: TWName | string;
    tele_station_lat?: number;
    tele_station_long?: number;
  };
}

interface TWWaterRow extends TWRowBase {
  waterlevel_datetime?: string;
  situation_level?: number | null;
  storage_percent?: number | null;
}

interface TWRainRow extends TWRowBase {
  tele_station_id?: number;
  tele_station_name?: TWName | string;
  tele_station_lat?: number;
  tele_station_long?: number;
  rainfall_datetime?: string;
  rain_1h?: number | string | null;
  rain_24h?: number | string | null;
}

interface StationRow {
  key: string;
  nameTh: string;
  nameEn: string;
  provinceCode: string | null;
  provinceTh: string | null;
  provinceEn: string | null;
  regionTh: string | null;
  regionEn: string | null;
  lat: number;
  lng: number;
  obsTime: string;
  situationLevel?: number | null;
  storagePct?: number | null;
  rain24h?: number | null;
  rain1h?: number | null;
}

interface OpenMeteoDaily {
  daily?: { precipitation_sum?: Array<number | null> };
}

interface GlofasDaily {
  daily?: { time?: string[]; river_discharge?: Array<number | null> };
}

// ---- helpers ----

function str(v: unknown): string | null {
  if (v == null) return null;
  const s = String(v).trim();
  return s || null;
}

function num(v: number | string | null | undefined): number | null {
  if (v == null) return null;
  const n = typeof v === "string" ? parseFloat(v) : v;
  return Number.isFinite(n) ? n : null;
}

function names(obj: TWName | string | null | undefined): { th: string | null; en: string | null } {
  if (!obj) return { th: null, en: null };
  if (typeof obj === "string") return { th: obj, en: obj };
  return { th: str(obj.th) ?? str(obj.en), en: str(obj.en) ?? str(obj.th) };
}

function waterStationIdentity(row: TWWaterRow): StationRow | null {
  const stationObj = row.station;
  const key = stationObj?.id;
  if (key == null) return null;

  const name = names(stationObj?.tele_station_name);
  const prov = names(row.geocode?.province_name);
  const region = names(row.geocode?.area_name);
  const lat = num(stationObj?.tele_station_lat);
  const lng = num(stationObj?.tele_station_long);
  if (lat == null || lng == null) return null;

  return {
    key: String(key),
    nameTh: name.th ?? String(key),
    nameEn: name.en ?? String(key),
    provinceCode: str(row.geocode?.province_code),
    provinceTh: prov.th,
    provinceEn: prov.en,
    regionTh: region.th,
    regionEn: region.en,
    lat,
    lng,
    obsTime: "",
  };
}

function rainStationIdentity(row: TWRainRow): StationRow | null {
  const key = row.tele_station_id ?? row.station?.id;
  if (key == null) return null;

  const name = names(row.tele_station_name ?? row.station?.tele_station_name);
  const prov = names(row.geocode?.province_name);
  const region = names(row.geocode?.area_name);
  const lat = num(row.tele_station_lat ?? row.station?.tele_station_lat);
  const lng = num(row.tele_station_long ?? row.station?.tele_station_long);
  if (lat == null || lng == null) return null;

  return {
    key: String(key),
    nameTh: name.th ?? String(key),
    nameEn: name.en ?? String(key),
    provinceCode: str(row.geocode?.province_code),
    provinceTh: prov.th,
    provinceEn: prov.en,
    regionTh: region.th,
    regionEn: region.en,
    lat,
    lng,
    obsTime: "",
  };
}

function isSouthern(st: StationRow): boolean {
  return isSouthernRegion(st.regionEn, st.regionTh)
    || isSouthernProvinceCode(st.provinceCode);
}

function levelScore(level: number): number {
  if (level >= 5) return 100;
  if (level >= 4) return 60;
  return 0;
}

function rainScore(mm: number): number {
  if (mm > 135) return 95;
  if (mm > 90) return 80;
  if (mm > 35) return 45;
  if (mm > 10) return 15;
  return 0;
}

function forecastScore(mm48: number): number {
  if (mm48 >= 150) return 90;
  if (mm48 >= 90) return 70;
  if (mm48 >= 35) return 40;
  if (mm48 >= 10) return 15;
  return 0;
}

function scoreBand(score: number): FloodWatchBand {
  if (score >= RISK_BANDS.high) return "high";
  if (score >= RISK_BANDS.elevated) return "elevated";
  if (score >= RISK_BANDS.watch) return "watch";
  return "normal";
}

function dischargeBand(thresholds: { watch: number; warning: number; emergency: number }, q: number | null): RiverDischargeBand {
  if (q == null) return "unknown";
  if (q >= thresholds.emergency) return "emergency";
  if (q >= thresholds.warning) return "warning";
  if (q >= thresholds.watch) return "watch";
  return "normal";
}

function avg(nums: number[]): number {
  if (nums.length === 0) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

async function fetchSouthernWater(): Promise<StationRow[]> {
  const json = await fetchJsonOrNull<{ waterlevel_data?: { data?: TWWaterRow[] } }>(TW_WL);
  const rows = json?.waterlevel_data?.data ?? [];
  const out: StationRow[] = [];
  for (const row of rows) {
    const st = waterStationIdentity(row);
    if (!st || !isSouthern(st)) continue;
    st.obsTime = row.waterlevel_datetime ?? new Date().toISOString();
    st.situationLevel = num(row.situation_level);
    st.storagePct = num(row.storage_percent);
    out.push(st);
  }
  return out;
}

async function fetchSouthernRain(): Promise<StationRow[]> {
  const json = await fetchJsonOrNull<{ data?: TWRainRow[] }>(TW_RAIN);
  const rows = json?.data ?? [];
  const out: StationRow[] = [];
  for (const row of rows) {
    const st = rainStationIdentity(row);
    if (!st || !isSouthern(st)) continue;
    st.obsTime = row.rainfall_datetime ?? new Date().toISOString();
    st.rain24h = num(row.rain_24h);
    st.rain1h = num(row.rain_1h);
    out.push(st);
  }
  return out;
}

interface ProvinceCentroid {
  provinceCode: string;
  provinceTh: string;
  provinceEn: string;
  lat: number;
  lng: number;
}

function provinceCentroids(water: StationRow[], rain: StationRow[]): ProvinceCentroid[] {
  const byCode = new Map<string, { th: string; en: string; lats: number[]; lngs: number[] }>();
  for (const st of [...water, ...rain]) {
    if (!st.provinceCode) continue;
    let p = byCode.get(st.provinceCode);
    if (!p) {
      p = { th: st.provinceTh ?? st.provinceCode, en: st.provinceEn ?? st.provinceCode, lats: [], lngs: [] };
      byCode.set(st.provinceCode, p);
    }
    p.lats.push(st.lat);
    p.lngs.push(st.lng);
  }
  return [...byCode.entries()].map(([provinceCode, p]) => ({
    provinceCode,
    provinceTh: p.th,
    provinceEn: p.en,
    lat: avg(p.lats),
    lng: avg(p.lngs),
  }));
}

async function fetchForecast48h(centroids: ProvinceCentroid[]): Promise<Map<string, number>> {
  const out = new Map<string, number>();
  if (centroids.length === 0) return out;

  const batchSize = 50;
  for (let i = 0; i < centroids.length; i += batchSize) {
    const batch = centroids.slice(i, i + batchSize);
    const lats = batch.map((p) => p.lat.toFixed(3)).join(",");
    const lngs = batch.map((p) => p.lng.toFixed(3)).join(",");
    const url = `${OM_FORECAST}?latitude=${lats}&longitude=${lngs}&daily=precipitation_sum&forecast_days=3&timezone=Asia%2FBangkok`;
    const json = await fetchJsonOrNull<OpenMeteoDaily | OpenMeteoDaily[]>(url);
    const results = Array.isArray(json) ? json : [json];
    batch.forEach((p, j) => {
      const sums = results[j]?.daily?.precipitation_sum;
      if (!Array.isArray(sums)) return;
      const d0 = num(sums[0]);
      const d1 = num(sums[1]);
      if (d0 != null && d1 != null) out.set(p.provinceCode, d0 + d1);
    });
  }
  return out;
}

export function computeSouthernRisk(
  water: StationRow[],
  rain: StationRow[],
  forecast48h: Map<string, number>,
): SouthernFloodRiskFeed {
  interface ProvAcc {
    provinceCode: string;
    provinceTh: string;
    provinceEn: string;
    lat: number;
    lng: number;
    water: number;
    rain: number;
    forecast: number;
    stationsL4: number;
    stationsL5: number;
    storageOver: number;
    maxRain24h: number | null;
    maxRainStation: string | null;
    fc48h: number | null;
    topWater: Array<{ name: string; level: number }>;
  }

  const provinces = new Map<string, ProvAcc>();
  const byLevel: Record<string, number> = { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0 };

  const prov = (st: StationRow): ProvAcc | null => {
    const key = st.provinceCode ?? st.provinceTh;
    if (!key) return null;
    let p = provinces.get(key);
    if (!p) {
      p = {
        provinceCode: st.provinceCode ?? key,
        provinceTh: st.provinceTh ?? key,
        provinceEn: st.provinceEn ?? key,
        lat: st.lat,
        lng: st.lng,
        water: 0,
        rain: 0,
        forecast: 0,
        stationsL4: 0,
        stationsL5: 0,
        storageOver: 0,
        maxRain24h: null,
        maxRainStation: null,
        fc48h: null,
        topWater: [],
      };
      provinces.set(key, p);
    }
    return p;
  };

  for (const st of water) {
    const p = prov(st);
    if (!p || st.situationLevel == null) continue;
    const lv = Math.round(st.situationLevel);
    if (byLevel[String(lv)] != null) byLevel[String(lv)] += 1;
    const score = levelScore(lv);
    if (score > p.water) p.water = score;
    if (lv >= 5) {
      p.stationsL5 += 1;
      p.topWater.push({ name: st.nameTh, level: lv });
    } else if (lv >= 4) {
      p.stationsL4 += 1;
      p.topWater.push({ name: st.nameTh, level: lv });
    }
    if (st.storagePct != null && st.storagePct >= 100) p.storageOver += 1;
  }

  for (const p of provinces.values()) {
    if (p.storageOver > 0) p.water = Math.min(100, p.water + 10);
    p.topWater.sort((a, b) => b.level - a.level);
    p.topWater = p.topWater.slice(0, 3);
    const fc = forecast48h.get(p.provinceCode);
    if (fc != null) {
      p.fc48h = fc;
      p.forecast = forecastScore(fc);
    }
  }

  for (const st of rain) {
    const p = prov(st);
    if (!p) continue;
    const r24 = st.rain24h;
    if (r24 != null) {
      if (p.maxRain24h == null || r24 > p.maxRain24h) {
        p.maxRain24h = r24;
        p.maxRainStation = st.nameTh;
      }
      const score = rainScore(r24);
      if (score > p.rain) p.rain = score;
    }
    if (st.rain1h != null && st.rain1h >= RAIN_FLASH_1H) {
      p.rain = Math.min(100, p.rain + 10);
    }
  }

  const list: ProvinceWatchScore[] = [...provinces.values()]
    .map((p) => {
      const score = Math.round(RISK_WEIGHTS.water * p.water + RISK_WEIGHTS.rain * p.rain + RISK_WEIGHTS.forecast * p.forecast);
      return {
        provinceCode: p.provinceCode,
        provinceTh: p.provinceTh,
        provinceEn: p.provinceEn,
        score,
        band: scoreBand(score),
        waterScore: p.water,
        rainScore: p.rain,
        forecastScore: p.forecast,
        stationsL4: p.stationsL4,
        stationsL5: p.stationsL5,
        maxRain24h: p.maxRain24h,
        maxRainStation: p.maxRainStation,
        fc48h: p.fc48h,
        lat: p.lat,
        lng: p.lng,
        topWaterStations: p.topWater,
      };
    })
    .sort((a, b) => b.score - a.score || (b.maxRain24h ?? 0) - (a.maxRain24h ?? 0));

  const bandCounts: Record<FloodWatchBand, number> = { normal: 0, watch: 0, elevated: 0, high: 0 };
  for (const p of list) bandCounts[p.band] += 1;

  const regionalBand: FloodWatchBand = list.some((p) => p.band === "high") ? "high"
    : list.some((p) => p.band === "elevated") ? "elevated"
    : list.some((p) => p.band === "watch") ? "watch"
    : "normal";

  const worstRain = list.reduce<ProvinceWatchScore | null>(
    (acc, p) => (p.maxRain24h != null && (acc == null || p.maxRain24h > (acc.maxRain24h ?? 0)) ? p : acc),
    null,
  );

  return {
    summary: {
      regionalBand,
      bandCounts,
      bySituationLevel: byLevel,
      worstRain: worstRain?.maxRain24h != null
        ? { provinceTh: worstRain.provinceTh, mm: worstRain.maxRain24h }
        : null,
      methodEn: "Watch indicator from live data (water 50% · rain 30% · forecast 20%) — heuristic, not a prediction",
      methodTh: "ดัชนีเฝ้าระวังจากข้อมูลจริง (ระดับน้ำ 50% · ฝนสะสม 30% · พยากรณ์ 20%) — ไม่ใช่การพยากรณ์",
    },
    provinces: list,
  };
}

export function buildSouthernCascade(glofasResults: (GlofasDaily | null)[]): SouthernRiverCascadeFeed {
  const reaches: SouthernRiverReach[] = SOUTHERN_REACHES.map((reach, i) => {
    const daily = glofasResults[i]?.daily;
    const times = daily?.time ?? [];
    const qArr = daily?.river_discharge ?? [];
    const today = num(qArr[0]);
    const valid = qArr.map((v) => num(v)).filter((v): v is number => v != null && v > 0);
    const peak = valid.length ? Math.max(...valid) : null;
    const peakIdx = peak != null ? qArr.findIndex((v) => num(v) === peak) : -1;
    const third = Math.max(1, Math.floor(valid.length / 3));
    const front = avg(valid.slice(0, third));
    const back = avg(valid.slice(-third));
    const trend = today == null || peak == null
      ? "unknown" as const
      : peak > today * 1.15 ? "rising" as const
      : peak < today * 0.85 ? "falling" as const
      : "stable" as const;
    const thresholds = { watch: reach.watch, warning: reach.warning, emergency: reach.emergency };
    return {
      id: reach.id,
      nameTh: reach.nameTh,
      nameEn: reach.nameEn,
      basinTh: reach.basinTh,
      basinEn: reach.basinEn,
      lat: reach.lat,
      lng: reach.lng,
      discharge: today,
      forecastPeak: peak,
      forecastPeakDay: peakIdx >= 0 ? peakIdx : null,
      band: dischargeBand(thresholds, today),
      peakBand: dischargeBand(thresholds, peak),
      trend,
      thresholds,
      noteTh: reach.noteTh,
      noteEn: reach.noteEn,
      observedAt: times[0] ?? null,
    };
  });

  const links: SouthernRiverLink[] = [];
  for (const r of SOUTHERN_REACHES) {
    if (!r.downstream) continue;
    const to = SOUTHERN_REACHES.find((x) => x.id === r.downstream);
    if (!to) continue;
    links.push({
      fromId: r.id,
      toId: r.downstream,
      lagDays: r.lagDays,
      path: [[r.lng, r.lat], [to.lng, to.lat]],
    });
  }

  return {
    reaches,
    links,
    methodEn: "River discharge from GloFAS (Open-Meteo) · per-reach thresholds calibrated to basin size",
    methodTh: "อัตราการไหลจาก GloFAS (Open-Meteo) · เกณฑ์ปรับตามขนาดลุ่มน้ำแต่ละสาย",
  };
}

export async function fetchSouthernFloodRisk(): Promise<NormalizedFeed<SouthernFloodRiskFeed>> {
  return cached("flooddash-south-risk", TTL_RISK, async () => {
    const fetchedAt = new Date().toISOString();
    try {
      const [water, rain] = await Promise.all([fetchSouthernWater(), fetchSouthernRain()]);
      const centroids = provinceCentroids(water, rain);
      const forecast48h = await fetchForecast48h(centroids);
      const feed = computeSouthernRisk(water, rain, forecast48h);
      const live = water.length > 0 || rain.length > 0;
      return {
        features: [feed],
        meta: {
          source: "flooddash-south-risk",
          fetchedAt,
          ageMinutes: cacheAgeMinutes(fetchedAt),
          fallbackTier: live ? "live" : "unavailable",
          note: live
            ? `Southern watch scores: ${feed.provinces.length} provinces · regional ${feed.summary.regionalBand}`
            : "ThaiWater national load returned no southern stations",
        },
      };
    } catch {
      return {
        features: [],
        meta: {
          source: "flooddash-south-risk",
          fetchedAt,
          ageMinutes: 0,
          fallbackTier: "unavailable",
          note: "Southern flood risk computation failed — ThaiWater or Open-Meteo unreachable",
        },
      };
    }
  });
}

export async function fetchSouthernRiverCascade(): Promise<NormalizedFeed<SouthernRiverCascadeFeed>> {
  return cached("flooddash-south-rivers", TTL_RIVERS, async () => {
    const fetchedAt = new Date().toISOString();
    try {
      const lats = SOUTHERN_REACHES.map((r) => r.lat).join(",");
      const lngs = SOUTHERN_REACHES.map((r) => r.lng).join(",");
      const url = `${GLOFAS}?latitude=${lats}&longitude=${lngs}&daily=river_discharge&forecast_days=14`;
      const json = await fetchJsonOrThrow<GlofasDaily | GlofasDaily[]>(url);
      const results = Array.isArray(json) ? json : [json];
      const feed = buildSouthernCascade(results);
      const hasData = feed.reaches.some((r) => r.discharge != null);
      return {
        features: [feed],
        meta: {
          source: "flooddash-south-rivers",
          fetchedAt,
          ageMinutes: cacheAgeMinutes(fetchedAt),
          fallbackTier: hasData ? "live" : "unavailable",
          note: `${feed.reaches.length} southern GloFAS reaches`,
        },
      };
    } catch {
      return {
        features: [],
        meta: {
          source: "flooddash-south-rivers",
          fetchedAt,
          ageMinutes: 0,
          fallbackTier: "unavailable",
          note: "GloFAS southern cascade unreachable (Open-Meteo flood API)",
        },
      };
    }
  });
}
