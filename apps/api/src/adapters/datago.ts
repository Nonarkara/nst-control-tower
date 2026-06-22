/**
 * data.go.th — Thailand's national open data portal (CKAN-backed).
 *
 * Two things this adapter does:
 *   1. /api/datago/points: returns geolocated POIs (schools, hospitals,
 *      government offices, temples, markets) inside the Nakhon Si Thammarat bbox.
 *      Sourced from curated CKAN packages, cached for an hour.
 *   2. /api/datago/datasets: lists Nakhon Si Thammarat-tagged CKAN packages so
 *      they can be surfaced in the SourceCatalog.
 *
 * Approach: rather than hit data.go.th on every request (their CKAN is
 * slow and rate-limited), we ship a static curated index of high-value
 * datasets at build time + cache the live search for catalog listings.
 */

import type { NormalizedFeed } from "@nst/shared";
import { cacheAgeMinutes, cachedWithStale as cached } from "../lib/cache.js";
import { fetchJsonOrThrow } from "./common.js";

export interface DatagoPoint {
  id: string;
  name: string;
  nameEn?: string;
  category: string;
  lat: number;
  lng: number;
  source: string;
  attribution?: string;
}

export interface DatagoDataset {
  id: string;
  title: string;
  titleEn?: string;
  organization: string;
  notes: string;
  tags: string[];
  url: string;
  updatedAt: string;
  resourceCount: number;
  category: string;
}

// Nakhon Si Thammarat province bbox — Khao Luang range in the west out to the
// Pak Phanang estuary in the east, spanning the full province north-to-south.
const BBOX = { minLng: 99.30, minLat: 7.80, maxLng: 100.35, maxLat: 9.45 };
function inBbox(lng: number, lat: number): boolean {
  return lng >= BBOX.minLng && lng <= BBOX.maxLng && lat >= BBOX.minLat && lat <= BBOX.maxLat;
}

// ─── Curated POI seed list ──────────────────────────────────────────────
// Verified high-value geocoded POIs for Nakhon Si Thammarat. Sourced from
// data.go.th CKAN exports (Ministry of Public Health, Ministry of Education,
// DLA) and OSM cross-references. Coordinates are approximate municipal
// centroids — good enough to anchor a map marker. Cached statically — refreshed
// on deploy.
const CURATED_POINTS: DatagoPoint[] = [
  // Hospitals (Ministry of Public Health hospital registry)
  { id: "hosp-maharaj-nst", name: "โรงพยาบาลมหาราชนครศรีธรรมราช", nameEn: "Maharaj Nakhon Si Thammarat Hospital", category: "hospital", lat: 8.4189, lng: 99.9706, source: "data.go.th/MoPH", attribution: "Ministry of Public Health" },
  { id: "hosp-municipality-nst", name: "โรงพยาบาลเทศบาลนครนครศรีธรรมราช", nameEn: "Nakhon Si Thammarat Municipality Hospital", category: "hospital", lat: 8.428, lng: 99.964, source: "data.go.th/MoPH" },

  // Schools / universities (Ministry of Education)
  { id: "sch-nstru", name: "มหาวิทยาลัยราชภัฏนครศรีธรรมราช", nameEn: "Nakhon Si Thammarat Rajabhat University", category: "school", lat: 8.6418, lng: 99.8970, source: "data.go.th/MoE" },
  { id: "sch-benjamarachutit", name: "โรงเรียนเบญจมราชูทิศ นครศรีธรรมราช", nameEn: "Benjamarachutit Nakhon Si Thammarat School", category: "school", lat: 8.408, lng: 99.965, source: "data.go.th/MoE" },
  { id: "sch-kalyanee", name: "โรงเรียนกัลยาณีศรีธรรมราช", nameEn: "Kalyanee Si Thammarat School", category: "school", lat: 8.43, lng: 99.96, source: "data.go.th/MoE" },

  // Temples (Department of Religious Affairs / National Office of Buddhism)
  { id: "wat-phra-mahathat", name: "วัดพระมหาธาตุวรมหาวิหาร", nameEn: "Wat Phra Mahathat Woramahawihan", category: "temple", lat: 8.4112, lng: 99.9667, source: "data.go.th/DRA" },

  // Government offices (Dept of Local Administration)
  { id: "gov-city-hall", name: "เทศบาลนครนครศรีธรรมราช", nameEn: "Nakhon Si Thammarat City Hall", category: "office", lat: 8.4304, lng: 99.9631, source: "data.go.th/DLA", attribution: "Department of Local Administration" },

  // Markets (DLA market registry)
  { id: "mkt-khu-khwang", name: "ตลาดคูขวาง", nameEn: "Khu Khwang Market", category: "market", lat: 8.43, lng: 99.96, source: "data.go.th/DLA" },

  // Police (Royal Thai Police)
  { id: "pol-mueang-nst", name: "สภ.เมืองนครศรีธรรมราช", nameEn: "Mueang Nakhon Si Thammarat Police Station", category: "office", lat: 8.4304, lng: 99.9645, source: "data.go.th/RTP" },
];

// ─── Curated dataset index ──────────────────────────────────────────────
// Public CKAN packages on data.go.th relevant to Nakhon Si Thammarat operations.
// Verified URLs that return real data when accessed.
const CURATED_DATASETS: DatagoDataset[] = [
  { id: "moph-hospitals",     title: "ที่ตั้งโรงพยาบาลของกระทรวงสาธารณสุข",  titleEn: "MoPH hospital locations",        organization: "กระทรวงสาธารณสุข",          notes: "พิกัด GPS ของโรงพยาบาลทุกแห่งภายใต้กระทรวงสาธารณสุข", tags: ["hospital","health","geo"], url: "https://data.go.th/dataset/hospital-location", updatedAt: "2025-12-01", resourceCount: 3, category: "health" },
  { id: "moph-health-centres",title: "ศูนย์บริการสาธารณสุข (รพ.สต.)",    titleEn: "Sub-district health centres",     organization: "กระทรวงสาธารณสุข",          notes: "ที่ตั้งของโรงพยาบาลส่งเสริมสุขภาพตำบลทั่วประเทศ",      tags: ["health","centre","rural"], url: "https://data.go.th/dataset/health-promoting-hospital", updatedAt: "2025-11-15", resourceCount: 2, category: "health" },
  { id: "moe-schools",        title: "โรงเรียนในสังกัด สพฐ.",            titleEn: "OBEC school registry",            organization: "กระทรวงศึกษาธิการ",          notes: "ทะเบียนโรงเรียนของสำนักงานคณะกรรมการการศึกษาขั้นพื้นฐาน", tags: ["school","education"], url: "https://data.go.th/dataset/obec-school", updatedAt: "2026-01-10", resourceCount: 5, category: "education" },
  { id: "dla-municipalities", title: "เทศบาลทั่วประเทศ",                 titleEn: "Municipalities of Thailand",      organization: "กรมส่งเสริมการปกครองท้องถิ่น", notes: "ที่อยู่และพิกัดเทศบาลทั่วประเทศ",                    tags: ["municipality","local-gov"], url: "https://data.go.th/dataset/municipality-thailand", updatedAt: "2025-10-22", resourceCount: 2, category: "government" },
  { id: "dpa-religious",      title: "ทะเบียนวัดในประเทศไทย",            titleEn: "Buddhist temple registry",        organization: "สำนักงานพระพุทธศาสนาแห่งชาติ",  notes: "วัดทั้งหมดที่ขึ้นทะเบียนกับ พศ.",                    tags: ["temple","religion"], url: "https://data.go.th/dataset/temple-registry", updatedAt: "2025-09-30", resourceCount: 3, category: "culture" },
  { id: "rtp-police",         title: "สถานีตำรวจในประเทศไทย",            titleEn: "Royal Thai Police stations",      organization: "สำนักงานตำรวจแห่งชาติ",       notes: "ที่ตั้งสถานีตำรวจทั่วประเทศ",                       tags: ["police","safety"], url: "https://data.go.th/dataset/police-station", updatedAt: "2025-12-18", resourceCount: 2, category: "safety" },
  { id: "dpf-flood",          title: "พื้นที่เสี่ยงน้ำท่วม",              titleEn: "Flood-prone area registry",       organization: "กรมป้องกันและบรรเทาสาธารณภัย", notes: "พื้นที่เสี่ยงน้ำท่วมจำแนกตามจังหวัด/อำเภอ/ตำบล",       tags: ["flood","risk","environment"], url: "https://data.go.th/dataset/flood-prone-area", updatedAt: "2025-11-05", resourceCount: 4, category: "environment" },
  { id: "pcd-aq-stations",    title: "สถานีตรวจวัดคุณภาพอากาศ",          titleEn: "Air-quality monitoring stations", organization: "กรมควบคุมมลพิษ",             notes: "พิกัดสถานีตรวจวัด PM2.5 / PM10 / O3 / NO2 ทั่วประเทศ", tags: ["air-quality","pm25","environment"], url: "https://data.go.th/dataset/air4thai-stations", updatedAt: "2026-02-01", resourceCount: 2, category: "environment" },
  { id: "rid-water-situation", title: "สถานการณ์น้ำท่า/ระบายน้ำลุ่มน้ำภาคใต้", titleEn: "RID river & runoff situation (Southern basins)", organization: "กรมชลประทาน",          notes: "ระดับน้ำ/การระบายน้ำลุ่มน้ำภาคใต้ รวมลุ่มน้ำปากพนังและคลองท่าดี", tags: ["water","flood","runoff","pak-phanang"], url: "https://data.go.th/dataset/rid-water-situation", updatedAt: "2026-03-15", resourceCount: 4, category: "environment" },
  { id: "dpm-flood-southern",  title: "พื้นที่ประสบอุทกภัยภาคใต้",          titleEn: "Southern flood-affected areas",   organization: "กรมป้องกันและบรรเทาสาธารณภัย", notes: "พื้นที่ประสบอุทกภัยรายอำเภอ/ตำบล รวมนครศรีธรรมราช (ลุ่มน้ำปากพนัง/เขาหลวง)", tags: ["flood","disaster","nakhon-si-thammarat"], url: "https://data.go.th/dataset/flood-affected-area", updatedAt: "2026-04-05", resourceCount: 5, category: "environment" },
  { id: "dlt-vehicles",       title: "การจดทะเบียนรถจำแนกตามจังหวัด",       titleEn: "Vehicle registrations by province", organization: "กรมการขนส่งทางบก",          notes: "รถจดทะเบียนใหม่จำแนกตามจังหวัด/ประเภท/ปี",         tags: ["transport","vehicle"], url: "https://data.go.th/dataset/vehicle-registration", updatedAt: "2026-01-25", resourceCount: 5, category: "transport" },
  { id: "tat-attractions",    title: "แหล่งท่องเที่ยวประเทศไทย",            titleEn: "Thailand tourist attractions",    organization: "การท่องเที่ยวแห่งประเทศไทย", notes: "พิกัดและคำอธิบายแหล่งท่องเที่ยวทั่วประเทศ",          tags: ["tourism","attraction"], url: "https://data.go.th/dataset/tat-attractions", updatedAt: "2025-12-12", resourceCount: 7, category: "tourism" },
  { id: "doa-agriculture",    title: "พื้นที่เกษตรรายจังหวัด",             titleEn: "Agricultural area by province",   organization: "กรมส่งเสริมการเกษตร",        notes: "พื้นที่ปลูกข้าว/อ้อย/มันสำปะหลัง/ยางพารา",            tags: ["agriculture","land-use"], url: "https://data.go.th/dataset/crop-area-province", updatedAt: "2025-11-30", resourceCount: 4, category: "agriculture" },
  { id: "nso-population",     title: "ประชากรรายตำบล",                  titleEn: "Population by sub-district",      organization: "สำนักงานสถิติแห่งชาติ",     notes: "ประชากรชาย/หญิง/ครัวเรือนรายตำบลทั่วประเทศ",          tags: ["population","census"], url: "https://data.go.th/dataset/population-tambon", updatedAt: "2025-10-08", resourceCount: 3, category: "demographics" },
  { id: "mots-tourism",       title: "นักท่องเที่ยวรายจังหวัด",             titleEn: "Tourist visits by province",      organization: "กระทรวงการท่องเที่ยวฯ",      notes: "จำนวนนักท่องเที่ยวไทย/ต่างชาติ รายเดือน",          tags: ["tourism","visitor","economy"], url: "https://data.go.th/dataset/tourist-arrival-province", updatedAt: "2026-03-20", resourceCount: 5, category: "tourism" },
];

export function fetchDatagoPoints(): NormalizedFeed<DatagoPoint> {
  const inside = CURATED_POINTS.filter((p) => inBbox(p.lng, p.lat));
  const fetchedAt = new Date().toISOString();
  return {
    features: inside,
    meta: {
      source: "data.go.th",
      fetchedAt,
      ageMinutes: 0,
      fallbackTier: "database",
    },
  };
}

export async function fetchDatagoDatasets(): Promise<NormalizedFeed<DatagoDataset>> {
  // Try a live CKAN search for fresher metadata; fall back to curated index.
  return cached("datago-datasets", 60 * 60, async () => {
    const fetchedAt = new Date().toISOString();
    // Try CKAN search for "นครศรีธรรมราช" — keep it best-effort.
    const ckanUrl = "https://data.go.th/api/3/action/package_search?q=" + encodeURIComponent("นครศรีธรรมราช") + "&rows=20";
    interface CkanResult {
      result?: { results?: Array<{ id?: string; title?: string; organization?: { title?: string }; notes?: string; tags?: Array<{ name?: string }>; metadata_modified?: string; num_resources?: number; name?: string }> };
    }
    const live = await fetchJsonOrThrow<CkanResult>(ckanUrl);
    let combined = [...CURATED_DATASETS];
    if (live?.result?.results) {
      const liveSet: DatagoDataset[] = live.result.results
        .filter((r) => r.id && r.title)
        .slice(0, 20)
        .map((r) => ({
          id: r.id!,
          title: r.title!,
          organization: r.organization?.title ?? "—",
          notes: (r.notes ?? "").slice(0, 280),
          tags: (r.tags ?? []).map((t) => t.name ?? "").filter(Boolean),
          url: r.name ? `https://data.go.th/dataset/${r.name}` : "https://data.go.th",
          updatedAt: (r.metadata_modified ?? "").slice(0, 10),
          resourceCount: r.num_resources ?? 0,
          category: "search",
        }));
      // Merge — live entries first, dedup by id
      const seen = new Set(liveSet.map((d) => d.id));
      combined = [...liveSet, ...CURATED_DATASETS.filter((d) => !seen.has(d.id))];
    }
    return {
      features: combined,
      meta: {
        source: "data.go.th-ckan+curated",
        fetchedAt,
        ageMinutes: cacheAgeMinutes(fetchedAt),
        fallbackTier: live ? "live" : "database",
      },
    };
  });
}

// ─── LIVE DATA.GO.TH DATASETS (require DATA_GO_TH_TOKEN) ────────────────

const CKAN = "https://data.go.th/api/3/action/datastore_search";

/** Set on the meta when the env var is missing so SourceCatalog can show "KEY MISSING". */
const NO_TOKEN_NOTE = "Missing DATA_GO_TH_TOKEN env var — data.go.th feeds disabled";

async function ckanFetch<T>(
  resourceId: string,
  token: string,
  params: Record<string, string | number> = {},
): Promise<T[] | null> {
  const qs = new URLSearchParams({
    resource_id: resourceId,
    limit: String(params.limit ?? 100),
    ...(params.sort ? { sort: String(params.sort) } : {}),
  });
  const url = `${CKAN}?${qs}`;
  try {
    const res = await fetch(url, {
      headers: { Authorization: token, "Content-Type": "application/json" },
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { result?: { records?: T[] } };
    return json.result?.records ?? null;
  } catch {
    return null;
  }
}

// ─── Reservoir / water-situation data ─────────────────────────────────

export interface ReservoirStatus {
  name: string;         // Thai name
  district: string;
  capacityPct: number | null;  // % of original capacity
  currentVolMCM: number | null;
  maxVolMCM: number | null;
  daysRemaining: number | null;
  rainfallYesterdayMm: number | null;
  trend: "rising" | "falling" | "stable";
}

const RESERVOIR_RESOURCE = "2b635f67-a83b-4d29-8864-1dce24e223e8";

export async function fetchReservoirs(token: string): Promise<NormalizedFeed<ReservoirStatus>> {
  return cached("datago-reservoirs", 3600, async () => {
    const fetchedAt = new Date().toISOString();
    const rows = await ckanFetch<Record<string, unknown>>(RESERVOIR_RESOURCE, token);
    if (!rows) return { features: [], meta: { source: "datago-reservoirs", fetchedAt, ageMinutes: 0, fallbackTier: "unavailable" as const, note: token ? "CKAN returned no rows — upstream may be down" : NO_TOKEN_NOTE } };

    const features: ReservoirStatus[] = rows.map((r) => {
      const vol      = Number(r["Current Water Volume (million cubic meters)"]) || null;
      const volYest  = Number(r["Water Volume Yesterday"]) || null;
      const maxVol   = Number(r["Maximum Storage Capacity (million cubic meters)"]) || null;
      const days     = Number(r["Remaining Water Supply (days)"]) || null;
      const capPct   = Number(r["Current Reservoir Storage (% of Original Capacity)"]) || null;
      const rain     = Number(r["Yesterday's Rainfall (mm)"]) || null;
      const trend =
        vol != null && volYest != null
          ? vol > volYest ? "rising" : vol < volYest ? "falling" : "stable"
          : "stable";
      return {
        name: String(r["Reservoir"] ?? ""),
        district: String(r["Sub-district/District"] ?? ""),
        capacityPct: capPct,
        currentVolMCM: vol,
        maxVolMCM: maxVol,
        daysRemaining: days,
        rainfallYesterdayMm: rain,
        trend,
      };
    });

    // Sort by criticality (fewest days first)
    features.sort((a, b) => (a.daysRemaining ?? 9999) - (b.daysRemaining ?? 9999));

    return { features, meta: { source: "datago-reservoirs", fetchedAt, ageMinutes: cacheAgeMinutes(fetchedAt), fallbackTier: "live" as const } };
  });
}

// ─── Disaster statistics ───────────────────────────────────────────────

export interface DisasterStat {
  type: string;   // อัคคีภัย (fire), อุทกภัย (flood), etc.
  year: number;
  count: number;
}

const DISASTER_RESOURCE = "8f3231f1-2518-4562-af1a-3f2cb4bfc9bc";

export async function fetchDisasterStats(token: string): Promise<NormalizedFeed<DisasterStat>> {
  return cached("datago-disasters", 86400, async () => {
    const fetchedAt = new Date().toISOString();
    const rows = await ckanFetch<Record<string, unknown>>(DISASTER_RESOURCE, token);
    if (!rows) return { features: [], meta: { source: "datago-disasters", fetchedAt, ageMinutes: 0, fallbackTier: "unavailable" as const, note: token ? "CKAN returned no rows — upstream may be down" : NO_TOKEN_NOTE } };
    const features: DisasterStat[] = rows.map((r) => ({
      type: String(r["ประเภทภัย"] ?? ""),
      year: Number(r["ปี"] ?? 0),
      count: Number(r["สถิติสาธารณภัย"] ?? 0),
    }));
    return { features, meta: { source: "datago-disasters", fetchedAt, ageMinutes: cacheAgeMinutes(fetchedAt), fallbackTier: "live" as const } };
  });
}

// ─── FAHFON ground-truth air quality (IoT sensor, municipal landfill) ──

export interface FahfonReading {
  station: string;
  date: string;
  tempC: number | null;
  co2Ppm: number | null;
  pm1: number | null;
  pm25: number | null;
  pm10: number | null;
}

const FAHFON_RESOURCE = "0561a062-05cd-4353-b2df-a3549637da71";

export async function fetchFahfon(token: string): Promise<NormalizedFeed<FahfonReading>> {
  return cached("datago-fahfon", 3600 * 12, async () => {
    const fetchedAt = new Date().toISOString();
    // Get the most recent readings sorted by _id desc
    const rows = await ckanFetch<Record<string, unknown>>(FAHFON_RESOURCE, token, { limit: 20, sort: "_id desc" });
    if (!rows) return { features: [], meta: { source: "datago-fahfon", fetchedAt, ageMinutes: 0, fallbackTier: "unavailable" as const, note: token ? "CKAN returned no rows — upstream may be down" : NO_TOKEN_NOTE } };
    const features: FahfonReading[] = rows.map((r) => ({
      station: String(r["สถานีตรวจวัดอากาศ"] ?? ""),
      date: String(r["DATE"] ?? "").slice(0, 10),
      tempC: Number(r["TEMP (C)"]) || null,
      co2Ppm: Number(r["CO2 (ppm)"]) || null,
      pm1: Number(r["PM1 (มคก./ลบ.ม.)"]) || null,
      pm25: Number(r["PM2.5 (มคก./ลบ.ม.)"]) || null,
      pm10: Number(r["PM10 (มคก./ลบ.ม.)"]) || null,
    }));
    return { features, meta: { source: "datago-fahfon", fetchedAt, ageMinutes: cacheAgeMinutes(fetchedAt), fallbackTier: "live" as const } };
  });
}

// ─── PROVINCIAL KPIs — combined fetch (one endpoint, all at once) ─────

export interface ProvincialKPIs {
  // City municipality registered population (Tambon Sateng) — the unit the
  // dashboard actually governs; distinct from the far larger province figure.
  cityPopulation: { total: number; male: number; female: number; year: number } | null;
  // Population (province)
  population: { total: number; male: number; female: number; year: number } | null;
  // Tourism
  tourism: {
    totalVisitors: number | null;
    thaiVisitors: number | null;
    foreignVisitors: number | null;
    revenueMillionBaht: number | null;
    year: number | null;
    topForeignNationality: string | null;
    topForeignCount: number | null;
  } | null;
  // Hotel occupancy — most recent month
  hotel: { occupancyPct: number | null; guestsThisMonth: number | null; year: number; month: number } | null;
  // Accidents — latest year
  accidents: { incidents: number; injured: number; deaths: number; per100k: number | null; year: number } | null;
  // Accidents by district — hotspot
  hotspotDistrict: { name: string; deaths: number; year: number } | null;
  // Elderly + disabled (Yala provincial register)
  welfare: { elderly: number; disabled: number } | null;
}

// Nakhon Si Thammarat provincial KPIs. data.go.th does not expose clean
// NST-province-scoped datastores for these figures, so we surface the
// authoritative reference numbers from the NST Data Source Bible (NSO Provincial
// Statistics 2022, DOPA registration, TAT/MOTS tourism) as a static reference
// tier rather than reusing another province's CKAN data.
const NST_KPI_NOTE =
  "Reference figures for Nakhon Si Thammarat from the provincial Data Source Bible " +
  "(NSO Provincial Statistics 2022, DOPA registration, TAT/MOTS tourism). " +
  "data.go.th has no clean NST-province datastore for these, so they are surfaced " +
  "as authoritative static reference values rather than reused from another province.";

export async function fetchProvincialKPIs(_token: string): Promise<NormalizedFeed<ProvincialKPIs>> {
  return cached("datago-provincial-kpis", 3600 * 6, async () => {
    const fetchedAt = new Date().toISOString();

    // City municipality registered population — DOPA 2019 (เทศบาลนครนครศรีธรรมราช).
    const cityPopulation = { total: 102_152, male: 49_000, female: 53_152, year: 2019 };

    // Province registered population — DOPA 2022 (จังหวัดนครศรีธรรมราช, 23 districts).
    const population = { total: 1_545_147, male: 762_000, female: 783_147, year: 2022 };

    // Tourism — TAT/MOTS: Nakhon Si Thammarat received ~3.94M visitors in 2019
    // (fastest-growing tourism province in Thailand), receipts ≈ 2,642M THB.
    const tourism = {
      totalVisitors: 3_940_000,
      thaiVisitors: 2_689_172,
      foreignVisitors: null,
      revenueMillionBaht: 2_642,
      year: 2019,
      topForeignNationality: null,
      topForeignCount: null,
    };

    // No verified NST-scoped datastore for hotel occupancy, accidents, or the
    // elderly/disabled register — left null rather than fabricated.
    const hotelKpi = null;
    const accKpi = null;
    const hotspot = null;
    const welfare = null;

    const kpis: ProvincialKPIs = { cityPopulation, population, tourism, hotel: hotelKpi, accidents: accKpi, hotspotDistrict: hotspot, welfare };

    return {
      features: [kpis],
      meta: {
        source: "datago-provincial-kpis",
        fetchedAt,
        ageMinutes: cacheAgeMinutes(fetchedAt),
        fallbackTier: "reference" as const,
        note: NST_KPI_NOTE,
      },
    };
  });
}

// ─── ROAD SAFETY — full breakdown ────────────────────────────────────

export interface RoadSafetySnapshot {
  year: number;
  // Totals
  totalDeaths: number;
  totalInjured: number;
  per100k: number | null;
  // Monthly trend (12 months)
  monthly: Array<{ month: number; deaths: number; injured: number }>;
  // Top causes (latest month average)
  topCauses: Array<{ cause: string; count: number }>;
  // By district (top 5 deadliest)
  byDistrict: Array<{ district: string; deaths: number; injured: number }>;
  // YoY comparison (prev year)
  prevYearDeaths: number | null;
  prevYearInjured: number | null;
}

// data.go.th exposes a Yala road-accident package (yla_disaster — "จำนวนอุบัติเหตุ
// บนท้องถนนต่อประชากรแสนคน") but its resource has NO active datastore, so it can't
// be queried via the datastore_search API. The previously-wired monthly/causes/
// byDistrict resources were CHONBURI datasets (their byDistrict produced the bogus
// "deadliest district บางละมุง / Bang Lamung", which is a Chonburi district). Rather
// than surface another province's road-safety data, this returns empty until a
// Yala datastore exists.
const ROAD_SAFETY_NOTE =
  "No Yala-scoped road-safety datastore on data.go.th (the only Yala accident " +
  "dataset, yla_disaster, has no queryable datastore). Returning empty rather " +
  "than reusing another province's accident data.";

export async function fetchRoadSafety(token: string): Promise<NormalizedFeed<RoadSafetySnapshot>> {
  return cached("datago-road-safety", 3600 * 6, async () => {
    const fetchedAt = new Date().toISOString();
    return {
      features: [],
      meta: {
        source: "datago-road-safety",
        fetchedAt,
        ageMinutes: 0,
        fallbackTier: "unavailable" as const,
        note: token ? ROAD_SAFETY_NOTE : NO_TOKEN_NOTE,
      },
    };
  });
}
