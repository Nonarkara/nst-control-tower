/**
 * Damage Hotspots — Road Restoration Budget After Flood
 *
 * Data source: งบประมาณที่ใช้ฟื้นฟูถนนหลังเกิดอุทกภัย (data.go.th / DPM)
 * Resource ID: f25781e5-ca4e-4ae2-a2b2-d0a16676800f
 *
 * Fetches all records from the CKAN datastore, parses them into
 * RoadRestorationRecord[], then aggregates into DamageHotspotSummary[]
 * grouped by district. No auth required (datastore is open).
 */

import type { NormalizedFeed, RoadRestorationRecord, DamageHotspotSummary } from "@nst/shared";
import { cacheAgeMinutes, cachedWithStale } from "../lib/cache.js";

const CKAN_RESOURCE = "f25781e5-ca4e-4ae2-a2b2-d0a16676800f";
const CKAN_URL = `https://data.go.th/api/3/action/datastore_search?resource_id=${CKAN_RESOURCE}&limit=500`;

// ─── District centroids (Nakhon Si Thammarat) ───────────────────────────────

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

// ─── Raw CKAN row shape ─────────────────────────────────────────────────────

interface CkanRow {
  _id: number;
  ปี: number;
  จังหวัด: string;
  อำเภอ: string;
  หมวดทางหลวง: string;
  ทางหลวงหมายเลข: string;
  ชื่อตอน: string;
  งบประมาณที่ใช้: string;
  หน่วยวัด: string;
  ที่มา: string;
}

// ─── Parse helpers ───────────────────────────────────────────────────────────

/** Strip thousand-separators and parse "255,920.00" → 255920 */
function parseBudget(raw: string): number {
  const cleaned = raw.replace(/,/g, "").trim();
  const n = parseFloat(cleaned);
  return Number.isFinite(n) ? n : 0;
}

function parseRow(r: CkanRow): RoadRestorationRecord {
  return {
    year: r.ปี,
    province: r.จังหวัด,
    district: r.อำเภอ,
    roadCategory: r.หมวดทางหลวง,
    routeNumber: r.ทางหลวงหมายเลข,
    segmentName: r.ชื่อตอน,
    budgetBaht: parseBudget(r.งบประมาณที่ใช้),
    unit: r.หน่วยวัด,
    source: r.ที่มา,
  };
}

// ─── Aggregation ─────────────────────────────────────────────────────────────

function aggregate(raw: RoadRestorationRecord[]): DamageHotspotSummary[] {
  const map = new Map<string, { totalBudgetBaht: number; recordCount: number; latestYear: number }>();

  for (const rec of raw) {
    const key = rec.district;
    const existing = map.get(key);
    if (existing) {
      existing.totalBudgetBaht += rec.budgetBaht;
      existing.recordCount += 1;
      if (rec.year > existing.latestYear) existing.latestYear = rec.year;
    } else {
      map.set(key, {
        totalBudgetBaht: rec.budgetBaht,
        recordCount: 1,
        latestYear: rec.year,
      });
    }
  }

  return Array.from(map.entries())
    .map(([district, agg]) => ({ district, ...agg }))
    .sort((a, b) => b.totalBudgetBaht - a.totalBudgetBaht);
}

// ─── Main fetch ───────────────────────────────────────────────────────────────

export async function fetchDamageHotspots(): Promise<NormalizedFeed<DamageHotspotSummary>> {
  // 7 days cache
  return cachedWithStale("damage-hotspots", 86400 * 7, async () => {
    const fetchedAt = new Date().toISOString();

    let rows: CkanRow[] = [];
    try {
      const res = await fetch(CKAN_URL, { signal: AbortSignal.timeout(15_000) });
      if (!res.ok) throw new Error(`CKAN returned ${res.status}`);
      const json = (await res.json()) as { result?: { records?: CkanRow[] } };
      rows = json.result?.records ?? [];
    } catch (err) {
      const note = `Failed to fetch CKAN datastore: ${(err as Error).message}`;
      return {
        features: [],
        meta: {
          source: "datago.dpm_01",
          fetchedAt,
          ageMinutes: 0,
          fallbackTier: "unavailable",
          note,
        },
      };
    }

    const records = rows.map(parseRow);
    const summaries = aggregate(records);

    return {
      features: summaries,
      meta: {
        source: "datago.dpm_01",
        fetchedAt,
        ageMinutes: cacheAgeMinutes(fetchedAt),
        fallbackTier: "live",
      },
    };
  });
}
