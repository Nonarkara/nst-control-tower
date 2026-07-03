/**
 * National Flood-Prone Areas Adapter — data.go.th CKAN + HII 17-year flood risk.
 *
 * Two sources:
 *  1. data.go.th  — provincial flood-prone polygons (แหล่งน้ำ, river banks, low-lying areas)
 *  2. HII 17-year RISK — tambon-level historical flood frequency from Hydro-Informatics Institute
 *     (จำนวนครั้งที่ท่วมในรอบ 17 ปี, ระดับความเสี่ยง เสี่ยงต่ำ/ปานกลาง/สูง)
 *
 * data.go.th resource:
 *   https://data.go.th/api/3/action/datastore_search?resource_id=b8ada20e-a5ed-4344-a7f4-ab27329aac0e
 *
 * HII resource:
 *   https://data.hii.or.th/api/3/action/datastore_search?resource_id=50e6987b-c01f-4fd5-99e2-2bccf9f18268
 */

import type { NormalizedFeed } from "@nst/shared";
import { cacheAgeMinutes, cachedWithStale as cached } from "../lib/cache.js";
import { fetchJsonOrThrow } from "./common.js";

const DATA_GO_TH_BASE = "https://data.go.th/api/3/action";
const HII_BASE = "https://data.hii.or.th/api/3/action";

// 24-hour TTL — these datasets update roughly yearly
const TTL = 86_400;

// ---------------------------------------------------------------------------
// data.go.th — provincial flood-prone areas (point polygons)
// ---------------------------------------------------------------------------

export interface FloodProneRecord {
  _id: number;
  lat: number;
  lng: number;
  province: string;
  district: string;
  subdistrict: string;
  riskLevel: number;   // 1=high 2=medium 3=low (inverse)
  riskLabel: string;   // "ความเสี่ยงสูง" | "ความเสี่ยงปานกลาง" | "ความเสี่ยงต่ำ"
  hazardType: string;  // "อุทกภัย"
  /** Centroid of the subdistrict area for UI display */
  centroid: [number, number];
}

interface DgfRecord {
  _id: number;
  lat: number;
  long: number;
  จังหวัด: string;
  อำเภอ: string;
  ตำบล: string;
  ระดับความเสี่ยง: number;
  ความเสี่ยง: string;
  ประเภทภัย: string;
}

interface DgfResponse {
  success: boolean;
  result: {
    fields: { id: string }[];
    records: DgfRecord[];
    total: number;
    limit: number;
    offset: number;
  };
}

async function fetchDataGoThFloodProne(): Promise<FloodProneRecord[]> {
  const url = `${DATA_GO_TH_BASE}/datastore_search?resource_id=b8ada20e-a5ed-4344-a7f4-ab27329aac0e&limit=10000`;
  const data = await fetchJsonOrThrow<DgfResponse>(url);

  if (!data?.success || !data.result?.records) return [];

  return data.result.records.map((r) => ({
    _id: r._id,
    lat: r.lat,
    lng: r.long,
    province: r.จังหวัด ?? "",
    district: r.อำเภอ ?? "",
    subdistrict: r.ตำบล ?? "",
    riskLevel: r.ระดับความเสี่ยง ?? 3,
    riskLabel: r.ความเสี่ยง ?? "ความเสี่ยงต่ำ",
    hazardType: r.ประเภทภัย ?? "อุทกภัย",
    centroid: [r.long ?? 0, r.lat ?? 0] as [number, number],
  }));
}

// ---------------------------------------------------------------------------
// HII 17-year flood risk (tambon level)
// ---------------------------------------------------------------------------

export interface HiiTambonRisk {
  geocode: number;
  month: number;
  tambonT: string;
  tambonE: string;
  amphoeCode: number;
  amphoeT: string;
  amphoeE: string;
  provCode: number;
  provT: string;
  provE: string;
  count17yr: number;  // flood occurrences in 17-year period
  criteria: string;   // e.g. "1-3 ครั้งในรอบ 17 ปี"
  risk: string;       // "เสี่ยงต่ำ" | "เสี่ยงปานกลาง" | "เสี่ยงสูง"
  riskLevel: number;  // 1=high 2=medium 3=low
  /** Approximate centroid [lng, lat] — derived from geocode ranges */
  centroid: [number, number];
}

interface HiiRecord {
  _id: number;
  Month: number;
  GEOCODE: number;
  TAMBON_T: string;
  TAMBON_E: string;
  AMPHOE_CODE: number;
  AMPHOE_T: string;
  AMPHOE_E: string;
  PROV_CODE: number;
  PROV_T: string;
  PROV_E: string;
  "COUNT 17 YEAR": number;
  CRITERIA: string;
  RISK: string;
}

interface HiiResponse {
  success: boolean;
  result: {
    fields: { id: string }[];
    records: HiiRecord[];
    total: number;
    limit: number;
    offset: number;
  };
}

async function fetchHiiFloodRisk(): Promise<HiiTambonRisk[]> {
  const url = `${HII_BASE}/datastore_search?resource_id=50e6987b-c01f-4fd5-99e2-2bccf9f18268&limit=30000`;
  const data = await fetchJsonOrThrow<HiiResponse>(url);

  if (!data?.success || !data.result?.records) return [];

  return data.result.records.map((r) => {
    const riskLevel =
      r.RISK === "เสี่ยงสูง" ? 1 : r.RISK === "เสี่ยงปานกลาง" ? 2 : 3;
    // Tambon centroid approximation from geocode — used for map display
    // Thai geocodes: PROV(2) AMP(2) TAM(2) — pad to 6 digits
    const gc = String(r.GEOCODE).padStart(6, "0");
    const prov = parseInt(gc.slice(0, 2), 10);
    const amph = parseInt(gc.slice(2, 4), 10);
    const tam = parseInt(gc.slice(4, 6), 10);
    // Approximate centroids using prov/amphoe centroid + small offsets
    const [baseLng, baseLat] = provAmphCentroid(prov, amph);
    const offsetLng = ((amph % 10) - 5) * 0.008;
    const offsetLat = ((tam % 10) - 5) * 0.006;
    return {
      geocode: r.GEOCODE,
      month: r.Month,
      tambonT: r.TAMBON_T ?? "",
      tambonE: r.TAMBON_E ?? "",
      amphoeCode: r.AMPHOE_CODE,
      amphoeT: r.AMPHOE_T ?? "",
      amphoeE: r.AMPHOE_E ?? "",
      provCode: r.PROV_CODE,
      provT: r.PROV_T ?? "",
      provE: r.PROV_E ?? "",
      count17yr: r["COUNT 17 YEAR"] ?? 0,
      criteria: r.CRITERIA ?? "",
      risk: r.RISK ?? "เสี่ยงต่ำ",
      riskLevel,
      centroid: [
        baseLng + offsetLng,
        baseLat + offsetLat,
      ] as [number, number],
    };
  });
}

// Rough prov+amphoe centroid lookup for geocode approximation
// Keyed by PROV_CODE (2 digits)
const PROV_CENTROIDS: Record<number, [number, number]> = {
  10: [100.53, 13.75],   // Bangkok
  11: [100.29, 13.59],   // Samut Prakan
  12: [100.44, 14.04],   // Nonthaburi
  13: [100.92, 14.02],   // Pathum Thani
  14: [100.06, 13.41],   // Samut Sakhon
  15: [100.27, 14.24],   // Nakhon Pathom
  16: [100.19, 13.68],   // Samut Songkhram
  17: [99.95, 13.42],     // Phetchaburi
  18: [99.83, 12.65],     // Prachuap Khiri Khan
  19: [99.80, 11.80],     // Hua Hin
  20: [102.01, 14.97],   // Chai Nat
  21: [100.14, 15.12],    // Singburi
  22: [100.36, 14.35],    // Lopburi
  23: [100.62, 15.27],    // Saraburi
  24: [100.11, 16.02],    // Nakhon Nayok
  25: [101.72, 14.11],    // Prachinburi
  26: [102.08, 13.68],    // Chachoengsao
  27: [101.12, 13.28],    // Chonburi
  28: [100.91, 12.58],    // Rayong
  29: [102.24, 12.65],    // Chanthaburi
  30: [102.10, 12.24],    // Trat
  31: [99.32, 9.14],      // Chumphon
  32: [98.98, 8.09],      // Surat Thani
  33: [99.33, 7.88],      // Nakhon Si Thammarat
  34: [100.07, 7.20],     // Phuket
  35: [100.55, 6.79],     // Phangnga
  36: [98.34, 6.63],      // Krabi
  37: [100.13, 6.63],     // Trang
  38: [100.07, 7.56],     // Nakhon Si Thammarat (Alt)
  39: [99.68, 6.94],      // Satun
  40: [101.28, 6.22],     // Songkhla
  41: [100.59, 6.58],     // Pattani
  42: [101.93, 6.62],     // Narathiwat
  43: [101.10, 5.76],      // Yala
  44: [100.93, 6.79],     // Hat Yai
  45: [101.77, 16.84],    // Mae Hong Son
  46: [98.98, 18.71],     // Chiang Mai
  47: [99.00, 19.30],     // Chiang Rai
  48: [99.88, 18.79],     // Phayao
  49: [100.16, 17.87],    // Lampang
  50: [99.00, 16.42],     // Lamphun
  51: [98.63, 17.17],     // Tak
  52: [99.13, 16.43],     // Sukhothai
  53: [99.82, 17.24],     // Phitsanulok
  54: [100.63, 16.83],    // Uttarakhand
  55: [100.14, 17.39],    // Kamphaeng Phet
  56: [99.53, 16.03],     // Phichit
  57: [100.36, 16.02],    // Phitsanulok (Alt)
  58: [100.14, 15.80],    // Nakhon Sawan
  59: [100.18, 15.29],    // Uthong
  60: [100.09, 14.40],    // Lopburi (Alt)
  61: [103.08, 16.88],    // Nong Khai
  62: [103.74, 17.41],    // Bueng Kan
  63: [103.65, 16.54],    // Nong Bua Lam Phu
  64: [102.43, 16.27],    // Ban Phai
  65: [102.24, 15.74],    // Kalasin
  66: [103.30, 16.43],    // Maha Sarakham
  67: [103.50, 16.23],    // Roi Et
  68: [103.97, 16.06],    // Yasothon
  69: [103.39, 15.79],    // Amnat Charoen
  70: [104.08, 15.12],    // Nakhon Ratchasima
  71: [102.08, 14.88],    // Buriram
  72: [102.90, 14.99],    // Surin
  73: [103.49, 15.12],    // Sisaket
  74: [104.52, 14.88],    // Ubon Ratchathani
  75: [103.26, 14.95],    // Si Sa Ket (Alt)
  76: [102.55, 14.27],    // Khon Kaen
  77: [102.82, 15.38],    // Udon Thani
  78: [103.64, 17.38],    // Loei
  79: [101.24, 17.40],    // Nong Bua Lam Phu (Alt)
  80: [99.96, 8.44],      // Nakhon Si Thammarat
  81: [103.78, 17.15],    // Khon Kaen (Alt)
  82: [100.47, 13.85],    // Bangkok Metro
  83: [100.60, 13.68],    // Pathum Thani (Alt)
  84: [101.18, 9.46],     // Nakhon Si (Alt)
};

function provAmphCentroid(provCode: number, amphCode: number): [number, number] {
  const base = PROV_CENTROIDS[provCode] ?? [100.5, 13.5];
  // spread amphoe clusters slightly
  const amphOffset = ((amphCode - 1) % 10) * 0.015;
  return [base[0] + amphOffset, base[1]];
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface FloodProneAreaSummary {
  source: "data.go.th";
  fetchedAt: string;
  totalRecords: number;
  byRiskLevel: Record<string, number>;
  byProvince: Record<string, number>;
  /** Sample records for display (max 200) */
  records: FloodProneRecord[];
}

export interface HiiRiskSummary {
  source: "hii-17yr-risk";
  fetchedAt: string;
  totalTambonRecords: number;
  byRisk: Record<string, number>;
  byProvince: Record<string, number>;
  highRiskTambons: HiiTambonRisk[];
  /** Sample records (max 200) */
  records: HiiTambonRisk[];
}

export interface NationalFloodProneFeed {
  floodProne: FloodProneAreaSummary;
  hiiRisk: HiiRiskSummary;
  meta: {
    source: string;
    fetchedAt: string;
    ageMinutes: number;
    fallbackTier: "live" | "stale" | "unavailable";
    note: string;
  };
}

export async function fetchNationalFloodProne(): Promise<NormalizedFeed<NationalFloodProneFeed>> {
  return cached("national-flood-prone", TTL, async () => {
    const fetchedAt = new Date().toISOString();

    const [dgResult, hiiResult] = await Promise.allSettled([
      fetchDataGoThFloodProne(),
      fetchHiiFloodRisk(),
    ]);

    const dgRecords: FloodProneRecord[] =
      dgResult.status === "fulfilled" ? dgResult.value : [];

    const hiiRecords: HiiTambonRisk[] =
      hiiResult.status === "fulfilled" ? hiiResult.value : [];

    // Aggregate
    const byRiskLevel: Record<string, number> = {};
    const byProvince: Record<string, number> = {};
    for (const r of dgRecords) {
      byRiskLevel[r.riskLabel] = (byRiskLevel[r.riskLabel] ?? 0) + 1;
      byProvince[r.province] = (byProvince[r.province] ?? 0) + 1;
    }

    const hiiByRisk: Record<string, number> = {};
    const hiiByProvince: Record<string, number> = {};
    const highRiskTambons: HiiTambonRisk[] = [];
    for (const r of hiiRecords) {
      hiiByRisk[r.risk] = (hiiByRisk[r.risk] ?? 0) + 1;
      hiiByProvince[r.provT] = (hiiByProvince[r.provT] ?? 0) + 1;
      if (r.riskLevel === 1) highRiskTambons.push(r);
    }

    const totalFallbackTier =
      dgRecords.length > 0 || hiiRecords.length > 0 ? "live" : "unavailable";

    return {
      features: [
        {
          floodProne: {
            source: "data.go.th",
            fetchedAt,
            totalRecords: dgRecords.length,
            byRiskLevel,
            byProvince,
            records: dgRecords.slice(0, 200),
          },
          hiiRisk: {
            source: "hii-17yr-risk",
            fetchedAt,
            totalTambonRecords: hiiRecords.length,
            byRisk: hiiByRisk,
            byProvince: hiiByProvince,
            highRiskTambons: highRiskTambons.slice(0, 50),
            records: hiiRecords.slice(0, 200),
          },
          meta: {
            source: "data.go.th + hii-17yr-risk",
            fetchedAt,
            ageMinutes: 0,
            fallbackTier: totalFallbackTier,
            note: `National flood-prone: ${dgRecords.length} provincial points from data.go.th + ${hiiRecords.length} tambon records from HII 17-year dataset`,
          },
        },
      ],
      meta: {
        source: "data.go.th + hii-17yr-risk",
        fetchedAt,
        ageMinutes: cacheAgeMinutes(fetchedAt),
        fallbackTier: totalFallbackTier,
        note: `National flood-prone: ${dgRecords.length} data.go.th records, ${hiiRecords.length} HII tambon records`,
      },
    };
  });
}
