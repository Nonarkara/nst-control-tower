/**
 * Nakhon Si Thammarat Flood Risk Village Areas adapter.
 *
 * data.go.th CKAN resource: 13809f57-218d-4eb8-bbf0-03db21b4de8d
 * URL: https://data.go.th/api/3/action/datastore_search?resource_id=13809f57-218d-4eb8-bbf0-03db21b4de8d
 *
 * Dataset: พื้นที่เสี่ยงอุทกภัย (Flood Risk Areas) — village-level flood risk
 * classification for NST province. Refreshes every 2 years (static dataset).
 *
 * Fallback CSV: https://nakhonsithammarat.gdcatalog.go.th/dataset/.../download/ope004.csv
 * 24h TTL is appropriate for a static dataset.
 */

import type { FloodRiskVillage, NormalizedFeed } from "@nst/shared";
import { cacheAgeMinutes, cachedWithStale as cached } from "../lib/cache.js";
import { fetchJsonOrThrow } from "./common.js";

const CKAN_BASE = "https://data.go.th/api/3/action";
const RESOURCE_ID = "13809f57-218d-4eb8-bbf0-03db21b4de8d";
const TTL = 86_400; // 24 hours — static dataset, refreshed every 2 years

// Approximate district centroids for Nakhon Si Thammarat province.
// Sufficient for map display at city scale.
const DISTRICT_CENTROIDS: Record<string, { lat: number; lng: number }> = {
  "เมืองนครศรีธรรมราช": { lat: 8.430, lng: 99.965 },
  "พรหมคีรี": { lat: 8.150, lng: 99.700 },
  "ลานสกา": { lat: 8.050, lng: 99.600 },
  "ฉวาง": { lat: 8.100, lng: 99.500 },
  "พิปูน": { lat: 8.250, lng: 99.550 },
  "ชะอวด": { lat: 8.100, lng: 100.000 },
  "เชียรใหญ่": { lat: 8.050, lng: 100.100 },
  "ท่าศาลา": { lat: 8.500, lng: 99.850 },
  "ปากพนัง": { lat: 8.350, lng: 100.200 },
  "ร่อนพิบูลย์": { lat: 8.200, lng: 100.050 },
  "สิชล": { lat: 8.900, lng: 99.900 },
  "ทุ่งสง": { lat: 7.900, lng: 99.700 },
  "นาแหลม": { lat: 7.800, lng: 99.800 },
  "ชัยบุรี": { lat: 7.700, lng: 99.600 },
  "ศรีนครินทร์": { lat: 7.600, lng: 99.500 },
  "ถ้ำพรรษา": { lat: 7.550, lng: 99.450 },
  "จุฬาภรณ์": { lat: 7.700, lng: 99.750 },
  "ช้างกลาง": { lat: 8.600, lng: 99.450 },
  "หัวไทร": { lat: 8.450, lng: 100.050 },
  "บางนรา": { lat: 8.500, lng: 100.300 },
  "ปลายพระยา": { lat: 8.550, lng: 100.350 },
  "นบพิตำ": { lat: 8.750, lng: 99.700 },
  "ฉลอง": { lat: 8.850, lng: 99.800 },
};

// CKAN datastore_search response shape
interface CkanRecord {
  _id: number;
  ปี: number;
  เดือน: string;
  ระดับความเสี่ยงภัย: string;
  จังหวัด: string;
  อำเภอ: string;
  ตำบล: string;
  หมู่ที่: number;
  น้ำท่วมขัง: string;
  น้ำล้นตลิ่ง: string;
  น้ำป่าท่วมฉับพลัน: string;
}

interface CkanResponse {
  success: boolean;
  result: {
    fields: { id: string }[];
    records: CkanRecord[];
    total: number;
    limit: number;
    offset: number;
  };
}

// Risk level ordering: สูง → ปานกลาง → ต่ำ → ไม่มีความเสี่ยง
const RISK_ORDER: Record<string, number> = {
  สูง: 1,
  ปานกลาง: 2,
  ต่ำ: 3,
  ไม่มีความเสี่ยง: 4,
};

function parseRiskLevel(raw: string): FloodRiskVillage["riskLevel"] {
  if (raw.includes("สูง")) return "สูง";
  if (raw.includes("ปานกลาง")) return "ปานกลาง";
  if (raw.includes("ต่ำ")) return "ต่ำ";
  if (raw.includes("ไม่มีความเสี่ยง")) return "ไม่มีความเสี่ยง";
  return "";
}

export async function fetchFloodRiskVillages(): Promise<NormalizedFeed<FloodRiskVillage>> {
  return cached("flood-risk-villages", TTL, async () => {
    const fetchedAt = new Date().toISOString();

    const url = `${CKAN_BASE}/datastore_search?resource_id=${RESOURCE_ID}&limit=10000`;
    const data = await fetchJsonOrThrow<CkanResponse>(url);

    if (!data?.success || !data.result?.records) {
      return {
        features: [],
        meta: {
          source: "data.go.th",
          fetchedAt,
          ageMinutes: 0,
          fallbackTier: "unavailable",
          note: "CKAN datastore_search returned no records — upstream may be down",
        },
      };
    }

    const records: FloodRiskVillage[] = data.result.records.map((r) => {
      const district = r.อำเภอ ?? "";
      const centroid = DISTRICT_CENTROIDS[district];
      return {
        year: r.ปี ?? 0,
        month: r.เดือน ?? "",
        riskLevel: parseRiskLevel(r.ระดับความเสี่ยงภัย ?? ""),
        province: r.จังหวัด ?? "",
        district,
        subdistrict: r.ตำบล ?? "",
        villageNumber: r.หมู่ที่ ?? 0,
        standingWater: r.น้ำท่วมขัง?.trim() === "x",
        riverOverflow: r.น้ำล้นตลิ่ง?.trim() === "x",
        flashFlood: r.น้ำป่าท่วมฉับพลัน?.trim() === "x",
        lat: centroid?.lat,
        lng: centroid?.lng,
      };
    });

    // Sort: สูง first, then ปานกลาง, ต่ำ, ไม่มีความเสี่ยง, empty
    records.sort((a, b) => {
      const oa = RISK_ORDER[a.riskLevel] ?? 99;
      const ob = RISK_ORDER[b.riskLevel] ?? 99;
      return oa - ob;
    });

    return {
      features: records,
      meta: {
        source: "data.go.th-ckan",
        fetchedAt,
        ageMinutes: cacheAgeMinutes(fetchedAt),
        fallbackTier: "live",
      },
    };
  });
}
