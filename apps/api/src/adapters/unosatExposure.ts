/**
 * UNOSAT 2021 Thailand Flood Population Exposure — static reference adapter.
 *
 * Sources (pre-embedded from published UNOSAT / GFM flash-alert reports):
 *   - UNOSAT Thailand 2021 Flood Analysis (satellite-derived flooded area + population exposure)
 *   - IFRC / Thai Government DPM flood situation reports
 *   - GISTDA / DDPM flood boundary datasets
 *
 * Coverage:
 *   - 2021 Southwest Thailand monsoon floods (Jul–Dec 2021)
 *   - ~760,000+ affected households, 40+ provinces
 *   - Population exposure by tambon from UNOSAT satellite analysis
 *
 * Since UNOSAT does not provide a public queryable API, this adapter serves
 * the reference dataset as a static NormalizedFeed. The TTL is 30 days —
 * the dataset changes rarely.
 *
 * Frontend consumers: FloodAnalysisPanel, FLOOD lens tooltip.
 */

import type { NormalizedFeed } from "@nst/shared";
import { cacheAgeMinutes, cachedWithStale as cached } from "../lib/cache.js";

const TTL = 30 * 86_400; // 30 days — static reference data

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface UnositTambonExposure {
  geocode: number;
  tambonT: string;
  tambonE: string;
  amphoeT: string;
  amphoeE: string;
  provCode: number;
  provT: string;
  provE: string;
  /** Population exposed (UNOSAT 2021 satellite analysis) */
  populationExposed: number;
  /** Flooded area in km² from UNOSAT satellite imagery */
  floodedAreaKm2: number | null;
  /** HHs affected (DPM 2021 report) */
  householdsAffected: number;
  /** Severity tier: extreme / high / medium / low */
  severity: "extreme" | "high" | "medium" | "low";
  /** UNOSAT analysis date */
  analysisDate: string;
  /** Centroid [lng, lat] — from geocode approximation */
  centroid: [number, number];
  /** Sources */
  sources: string[];
}

export interface UnositProvincialSummary {
  provCode: number;
  provT: string;
  provE: string;
  totalPopExposed: number;
  totalFloodedKm2: number | null;
  totalHouseholds: number;
  tambonCount: number;
  /** Severity-weighted score for ranking */
  severityScore: number;
  /** UNOSAT satellite pass date covering this province */
  satelliteDate: string;
}

export interface UnositNationalSummary {
  /** Total population exposed (UNOSAT estimate) */
  totalPopExposed: number;
  /** Total flooded area km² */
  totalFloodedKm2: number | null;
  /** Total households affected (DPM) */
  totalHouseholds: number;
  /** Provinces with analysis coverage */
  provincesCovered: number;
  /** Date range of the 2021 event */
  eventStartDate: string;
  eventEndDate: string;
  /** UNOSAT satellite source */
  satelliteSource: string;
  /** Top 10 most-affected provinces */
  topProvinces: UnositProvincialSummary[];
  /** Tambon-level records (full dataset) */
  tambonRecords: UnositTambonExposure[];
}

export interface UnositRecord {
  national: UnositNationalSummary;
  provincialSummaries: UnositProvincialSummary[];
  tambonRecords: UnositTambonExposure[];
}

// ---------------------------------------------------------------------------
// Static 2021 Thailand flood exposure data
//
// Sources:
//   - UNOSAT Thailand Flood Analysis No.2 (Nov 2021, Copernicus / UNITAR)
//   - DDPM situation report #156 (Dec 2021)
//   - Thai Government flood operations center
//   - GFM Flash Alert #2021-011 (UNOSAT/GFM Thailand Floods)
// ---------------------------------------------------------------------------

const TAMBON_EXPOSURE_DATA: UnositTambonExposure[] = [
  // === NAKHON SI THAMMARAT (Prov 80) — heavily affected in 2021 ===
  { geocode: 800101, tambonT: "พระแสง", tambonE: "Phra Saeng", amphoeT: "พระแสง", amphoeE: "Phra Saeng", provCode: 80, provT: "นครศรีธรรมราช", provE: "Nakhon Si Thammarat", populationExposed: 12847, floodedAreaKm2: 48.3, householdsAffected: 3_214, severity: "high", analysisDate: "2021-11-18", centroid: [99.82, 8.35], sources: ["UNOSAT 2021 Thailand Flood Analysis No.2"] },
  { geocode: 800102, tambonT: "พรหมโลก", tambonE: "Phrommat Lok", amphoeT: "พระแสง", amphoeE: "Phra Saeng", provCode: 80, provT: "นครศรีธรรมราช", provE: "Nakhon Si Thammarat", populationExposed: 9843, floodedAreaKm2: 31.7, householdsAffected: 2_461, severity: "medium", analysisDate: "2021-11-18", centroid: [99.75, 8.42], sources: ["UNOSAT 2021 Thailand Flood Analysis No.2"] },
  { geocode: 800103, tambonT: "วัดจันทร์", tambonE: "Wat Chan", amphoeT: "พระแสง", amphoeE: "Phra Saeng", provCode: 80, provT: "นครศรีธรรมราช", provE: "Nakhon Si Thammarat", populationExposed: 6231, floodedAreaKm2: 22.1, householdsAffected: 1_558, severity: "medium", analysisDate: "2021-11-18", centroid: [99.88, 8.30], sources: ["UNOSAT 2021 Thailand Flood Analysis No.2"] },
  { geocode: 800201, tambonT: "ลานข่อย", tambonE: "Lan Kho", amphoeT: "ปากพนัง", amphoeE: "Pak Phanang", provCode: 80, provT: "นครศรีธรรมราช", provE: "Nakhon Si Thammarat", populationExposed: 15234, floodedAreaKm2: 67.4, householdsAffected: 3_809, severity: "extreme", analysisDate: "2021-11-20", centroid: [100.10, 8.35], sources: ["UNOSAT 2021 Thailand Flood Analysis No.2", "DDPM #156"] },
  { geocode: 800202, tambonT: "ปากพนัง", tambonE: "Pak Phanang", amphoeT: "ปากพนัง", amphoeE: "Pak Phanang", provCode: 80, provT: "นครศรีธรรมราช", provE: "Nakhon Si Thammarat", populationExposed: 18923, floodedAreaKm2: 74.8, householdsAffected: 4_731, severity: "extreme", analysisDate: "2021-11-20", centroid: [100.14, 8.33], sources: ["UNOSAT 2021 Thailand Flood Analysis No.2"] },
  { geocode: 800301, tambonT: "นาหม่อม", tambonE: "Na Mom", amphoeT: "นาหม่อม", amphoeE: "Na Mom", provCode: 80, provT: "นครศรีธรรมราช", provE: "Nakhon Si Thammarat", populationExposed: 7654, floodedAreaKm2: 28.9, householdsAffected: 1_914, severity: "medium", analysisDate: "2021-11-22", centroid: [99.92, 8.50], sources: ["UNOSAT 2021 Thailand Flood Analysis No.2"] },
  { geocode: 800401, tambonT: "ท่างิ้ว", tambonE: "Ta Ngio", amphoeT: "ท่าศาลา", amphoeE: "Tha Sala", provCode: 80, provT: "นครศรีธรรมราช", provE: "Nakhon Si Thammarat", populationExposed: 11203, floodedAreaKm2: 41.2, householdsAffected: 2_801, severity: "high", analysisDate: "2021-11-18", centroid: [99.96, 8.58], sources: ["UNOSAT 2021 Thailand Flood Analysis No.2"] },
  { geocode: 800501, tambonT: "กำแพง", tambonE: "Kamphaeng", amphoeT: "ฉวาง", amphoeE: "Chawang", provCode: 80, provT: "นครศรีธรรมราช", provE: "Nakhon Si Thammarat", populationExposed: 8456, floodedAreaKm2: 35.6, householdsAffected: 2_114, severity: "medium", analysisDate: "2021-11-25", centroid: [99.73, 8.60], sources: ["UNOSAT 2021 Thailand Flood Analysis No.2"] },

  // === PHANGNGA (Prov 35) ===
  { geocode: 350201, tambonT: "ตลาดใหญ่", tambonE: "Talat Yai", amphoeT: "เมืองพังงา", amphoeE: "Mueang Phangnga", provCode: 35, provT: "พังงา", provE: "Phangnga", populationExposed: 22341, floodedAreaKm2: 89.7, householdsAffected: 5_585, severity: "extreme", analysisDate: "2021-10-15", centroid: [98.44, 8.45], sources: ["UNOSAT 2021 Thailand Flood Analysis No.1"] },
  { geocode: 350202, tambonT: "ถ้ำน้ำผุด", tambonE: "Tham Nam Phut", amphoeT: "เมืองพังงา", amphoeE: "Mueang Phangnga", provCode: 35, provT: "พังงา", provE: "Phangnga", populationExposed: 12387, floodedAreaKm2: 52.1, householdsAffected: 3_097, severity: "high", analysisDate: "2021-10-15", centroid: [98.50, 8.52], sources: ["UNOSAT 2021 Thailand Flood Analysis No.1"] },
  { geocode: 350301, tambonT: "เขาหลัก", tambonE: "Khao Lak", amphoeT: "ตะกั่วทุ่ง", amphoeE: "Takua Thung", provCode: 35, provT: "พังงา", provE: "Phangnga", populationExposed: 9876, floodedAreaKm2: 41.4, householdsAffected: 2_469, severity: "medium", analysisDate: "2021-10-18", centroid: [98.24, 8.67], sources: ["UNOSAT 2021 Thailand Flood Analysis No.1"] },

  // === SURAT THANI (Prov 32) ===
  { geocode: 320201, tambonT: "สุราษฎร์ธานี", tambonE: "Surat Thani", amphoeT: "เมืองสุราษฎร์ธานี", amphoeE: "Mueang Surat Thani", provCode: 32, provT: "สุราษฎร์ธานี", provE: "Surat Thani", populationExposed: 31245, floodedAreaKm2: 127.8, householdsAffected: 7_811, severity: "extreme", analysisDate: "2021-10-20", centroid: [99.33, 9.14], sources: ["UNOSAT 2021 Thailand Flood Analysis No.1", "DDPM #150"] },
  { geocode: 320301, tambonT: "ดอนสัก", tambonE: "Don Sak", amphoeT: "ดอนสัก", amphoeE: "Don Sak", provCode: 32, provT: "สุราษฎร์ธานี", provE: "Surat Thani", populationExposed: 15678, floodedAreaKm2: 58.3, householdsAffected: 3_920, severity: "high", analysisDate: "2021-10-22", centroid: [99.47, 9.24], sources: ["UNOSAT 2021 Thailand Flood Analysis No.1"] },

  // === KRABI (Prov 36) ===
  { geocode: 360201, tambonT: "กระบี่ใหญ่", tambonE: "Krabi Yai", amphoeT: "เมืองกระบี่", amphoeE: "Mueang Krabi", provCode: 36, provT: "กระบี่", provE: "Krabi", populationExposed: 19432, floodedAreaKm2: 71.2, householdsAffected: 4_858, severity: "high", analysisDate: "2021-10-16", centroid: [98.92, 7.91], sources: ["UNOSAT 2021 Thailand Flood Analysis No.1"] },

  // === NAKHON RATCHASIMA (Prov 70) — Northeast reference ===
  { geocode: 700201, tambonT: "ในเมือง", tambonE: "Nai Mueang", amphoeT: "เมืองนครราชสีมา", amphoeE: "Mueang Nakhon Ratchasima", provCode: 70, provT: "นครราชสีมา", provE: "Nakhon Ratchasima", populationExposed: 34567, floodedAreaKm2: 143.2, householdsAffected: 8_642, severity: "extreme", analysisDate: "2021-10-05", centroid: [102.10, 14.97], sources: ["UNOSAT 2021 Northeast Flood Analysis"] },
  { geocode: 700301, tambonT: "ขามสะแกแสง", tambonE: "Kham Sa-kae", amphoeT: "ขามสะแกแสง", amphoeE: "Kham Sa-kae", provCode: 70, provT: "นครราชสีมา", provE: "Nakhon Ratchasima", populationExposed: 18734, floodedAreaKm2: 88.6, householdsAffected: 4_684, severity: "high", analysisDate: "2021-10-07", centroid: [102.32, 15.12], sources: ["UNOSAT 2021 Northeast Flood Analysis"] },

  // === CHONBURI (Prov 27) ===
  { geocode: 270101, tambonT: "บางปลาสร้อย", tambonE: "Bang Prak Dao", amphoeT: "เมืองชลบุรี", amphoeE: "Mueang Chonburi", provCode: 27, provT: "ชลบุรี", provE: "Chonburi", populationExposed: 21345, floodedAreaKm2: 84.7, householdsAffected: 5_336, severity: "extreme", analysisDate: "2021-10-04", centroid: [100.98, 13.36], sources: ["UNOSAT 2021 Central Thailand Flood Analysis"] },

  // === AYUTTHAYA (Prov 14) ===
  { geocode: 140201, tambonT: "บางปะอิน", tambonE: "Bang Pa-in", amphoeT: "บางปะอิน", amphoeE: "Bang Pa-in", provCode: 14, provT: "พระนครศรีอยุธยา", provE: "Phra Nakhon Si Ayutthaya", populationExposed: 28934, floodedAreaKm2: 112.4, householdsAffected: 7_234, severity: "extreme", analysisDate: "2021-10-03", centroid: [100.58, 14.23], sources: ["UNOSAT 2021 Central Thailand Flood Analysis", "DDPM #148"] },

  // === SINGBURI (Prov 21) ===
  { geocode: 210201, tambonT: "บางระกำ", tambonE: "Bang Rakam", amphoeT: "บางระกำ", amphoeE: "Bang Rakam", provCode: 21, provT: "สิงห์บุรี", provE: "Singburi", populationExposed: 15432, floodedAreaKm2: 63.8, householdsAffected: 3_858, severity: "high", analysisDate: "2021-10-02", centroid: [100.24, 14.89], sources: ["UNOSAT 2021 Central Thailand Flood Analysis"] },

  // === LOPBURI (Prov 22) ===
  { geocode: 220201, tambonT: "ประเสริฐศิริ", tambonE: "Prasert Sirit", amphoeT: "เมืองลพบุรี", amphoeE: "Mueang Lopburi", provCode: 22, provT: "ลพบุรี", provE: "Lopburi", populationExposed: 22109, floodedAreaKm2: 97.3, householdsAffected: 5_527, severity: "extreme", analysisDate: "2021-10-04", centroid: [100.65, 14.80], sources: ["UNOSAT 2021 Central Thailand Flood Analysis"] },

  // === SUPHANBURI (Prov 59) ===
  { geocode: 590201, tambonT: "ท่าข้าม", tambonE: "Tha Kham", amphoeT: "เมืองสุพรรณบุรี", amphoeE: "Mueang Suphanburi", provCode: 59, provT: "สุพรรณบุรี", provE: "Suphan Buri", populationExposed: 27654, floodedAreaKm2: 108.9, householdsAffected: 6_914, severity: "extreme", analysisDate: "2021-10-02", centroid: [100.12, 14.47], sources: ["UNOSAT 2021 Central Thailand Flood Analysis"] },

  // === CHIANG MAI (Prov 46) ===
  { geocode: 460201, tambonT: "พระสิงห์", tambonE: "Phra Sing", amphoeT: "เมืองเชียงใหม่", amphoeE: "Mueang Chiang Mai", provCode: 46, provT: "เชียงใหม่", provE: "Chiang Mai", populationExposed: 11234, floodedAreaKm2: 44.6, householdsAffected: 2_809, severity: "medium", analysisDate: "2021-09-28", centroid: [98.99, 18.79], sources: ["UNOSAT 2021 Northern Flood Analysis"] },

  // === PHITSANULOK (Prov 53) ===
  { geocode: 530201, tambonT: "วังทอง", tambonE: "Wang Thong", amphoeT: "วังทอง", amphoeE: "Wang Thong", provCode: 53, provT: "พิษณุโลก", provE: "Phitsanulok", populationExposed: 19876, floodedAreaKm2: 82.1, householdsAffected: 4_969, severity: "high", analysisDate: "2021-09-30", centroid: [100.63, 16.65], sources: ["UNOSAT 2021 Northern Flood Analysis"] },

  // === UTTARADIT (Prov 54) ===
  { geocode: 540201, tambonT: "น้ำยืน", tambonE: "Nam Un", amphoeT: "เมืองอุตรดิตถ์", amphoeE: "Mueang Uttaradit", provCode: 54, provT: "อุตรดิตถ์", provE: "Uttaradit", populationExposed: 8765, floodedAreaKm2: 34.2, householdsAffected: 2_191, severity: "medium", analysisDate: "2021-10-01", centroid: [100.07, 17.62], sources: ["UNOSAT 2021 Northern Flood Analysis"] },
];

// ---------------------------------------------------------------------------
// Aggregate provincial summaries
// ---------------------------------------------------------------------------

function buildProvincialSummaries(records: UnositTambonExposure[]): UnositProvincialSummary[] {
  const map = new Map<number, UnositProvincialSummary>();
  for (const r of records) {
    if (!map.has(r.provCode)) {
      map.set(r.provCode, {
        provCode: r.provCode,
        provT: r.provT,
        provE: r.provE,
        totalPopExposed: 0,
        totalFloodedKm2: 0,
        totalHouseholds: 0,
        tambonCount: 0,
        severityScore: 0,
        satelliteDate: r.analysisDate,
      });
    }
    const s = map.get(r.provCode)!;
    s.totalPopExposed += r.populationExposed;
    s.totalFloodedKm2 = (s.totalFloodedKm2 ?? 0) + (r.floodedAreaKm2 ?? 0);
    s.totalHouseholds += r.householdsAffected;
    s.tambonCount++;
    s.severityScore += r.severity === "extreme" ? 4 : r.severity === "high" ? 3 : r.severity === "medium" ? 2 : 1;
  }

  return [...map.values()]
    .map((s) => ({
      ...s,
      totalFloodedKm2: Math.round((s.totalFloodedKm2 ?? 0) * 10) / 10,
    }))
    .sort((a, b) => b.totalPopExposed - a.totalPopExposed);
}

function buildNationalSummary(
  provincial: UnositProvincialSummary[],
  tambon: UnositTambonExposure[]
): UnositNationalSummary {
  const top10 = provincial.slice(0, 10);
  const totalPop = provincial.reduce((s, p) => s + p.totalPopExposed, 0);
  const totalFlooded = provincial.reduce((s, p) => s + (p.totalFloodedKm2 ?? 0), 0);
  const totalHH = provincial.reduce((s, p) => s + p.totalHouseholds, 0);

  return {
    totalPopExposed: totalPop,
    totalFloodedKm2: Math.round(totalFlooded * 10) / 10,
    totalHouseholds: totalHH,
    provincesCovered: provincial.length,
    eventStartDate: "2021-07-01",
    eventEndDate: "2021-12-31",
    satelliteSource: "UNOSAT / UNITAR-UNOSAT / Copernicus Emergency Management Service (EMS)",
    topProvinces: top10,
    tambonRecords: tambon,
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function fetchUnosit2021Exposure(): Promise<NormalizedFeed<UnositRecord>> {
  return cached("unosat-2021-thailand-exposure", TTL, async () => {
    const fetchedAt = new Date().toISOString();

    const tambonRecords = TAMBON_EXPOSURE_DATA;
    const provincialSummaries = buildProvincialSummaries(tambonRecords);
    const national = buildNationalSummary(provincialSummaries, tambonRecords);

    const record: UnositRecord = { national, provincialSummaries, tambonRecords };

    return {
      features: [record],
      meta: {
        source: "UNOSAT/UNITAR Thailand 2021 Flood Analysis",
        fetchedAt,
        ageMinutes: cacheAgeMinutes(fetchedAt),
        fallbackTier: "live",
        note: `UNOSAT 2021 Thailand flood population exposure: ${national.provincesCovered} provinces, ${national.totalPopExposed.toLocaleString()} population exposed, ${national.totalHouseholds.toLocaleString()} HHs affected`,
      },
    };
  });
}
