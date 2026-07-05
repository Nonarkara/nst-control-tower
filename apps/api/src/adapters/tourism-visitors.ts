/**
 * Tourism Visitor Numbers — จำนวนนักท่องเที่ยวจังหวัดนครศรีธรรมราช
 *
 * Source: สำนักงานการท่องเที่ยวและกีฬาจังหวัดนครศรีธรรมราช (สทกจ.)
 * Portal: data.go.th — CKAN resource 7d1b4e0e-66d8-4748-a765-199763db7270
 *
 * Data is datastore-active — no API token required.
 * Annual visitor totals only (BE year, no transport-mode breakdown).
 * Cached for 30 days — tourism figures are released annually.
 */

import type { NormalizedFeed, TourismYearRecord } from "@nst/shared";
import { cacheAgeMinutes, cached } from "../lib/cache.js";
import { fetchJsonOrNull } from "./common.js";

const CKAN_API = "https://data.go.th/api/3/action/datastore_search";
const RESOURCE_ID = "7d1b4e0e-66d8-4748-a765-199763db7270";
const CACHE_TTL_SECONDS = 30 * 24 * 60 * 60; // 30 days — annual release cadence

interface CkanDatastoreRow {
  _id: number;
  "ปี": number;
  "จำนวนผู้มาเยือน": number;
  "หน่วย": string;
  "ที่มา": string;
}

interface CkanResponse {
  result?: {
    records?: CkanDatastoreRow[];
    fields?: Array<{ id: string }>;
  };
}

/** Fetch raw CKAN records — returns null on network/API error. */
async function fetchCkanRows(): Promise<CkanDatastoreRow[] | null> {
  const url = `${CKAN_API}?resource_id=${RESOURCE_ID}&limit=50`;
  const json = await fetchJsonOrNull<CkanResponse>(url);
  return json?.result?.records ?? null;
}

export interface TourismFeedRecord extends TourismYearRecord {
  /** Year-over-year change in visitors, in percentage points. null for the oldest year. */
  yoyPct: number | null;
}

export async function fetchTourismVisitors(): Promise<NormalizedFeed<TourismFeedRecord>> {
  return cached("tourism-visitors", CACHE_TTL_SECONDS, async () => {
    const fetchedAt = new Date().toISOString();
    const rows = await fetchCkanRows();

    if (!rows || rows.length === 0) {
      return {
        features: [],
        meta: {
          source: "data.go.th/tourism",
          fetchedAt,
          ageMinutes: cacheAgeMinutes(fetchedAt),
          fallbackTier: "unavailable",
          note: "CKAN returned no rows for tourism-visitors resource — data.go.th may be unavailable",
        },
      };
    }

    // Parse and sort by year descending (newest first)
    const parsed: TourismYearRecord[] = rows
      .map((r) => ({
        yearBE: Number(r["ปี"]),
        visitors: Number(r["จำนวนผู้มาเยือน"]) || 0,
        unit: String(r["หน่วย"] ?? "(คน)"),
        source: String(r["ที่มา"] ?? "").trim(),
        visitorsMillions: (Number(r["จำนวนผู้มาเยือน"]) || 0) / 1_000_000,
      }))
      .filter((r) => Number.isFinite(r.yearBE) && r.yearBE > 2500)
      .sort((a, b) => b.yearBE - a.yearBE); // descending

    // Compute YoY change
    const features: TourismFeedRecord[] = parsed.map((r, i) => {
      const prev = parsed[i + 1]; // next in list = previous year (descending order)
      const yoyPct =
        prev && prev.visitors > 0
          ? ((r.visitors - prev.visitors) / prev.visitors) * 100
          : null;
      return { ...r, yoyPct };
    });

    return {
      features,
      meta: {
        source: "data.go.th/tourism",
        fetchedAt,
        ageMinutes: cacheAgeMinutes(fetchedAt),
        fallbackTier: "live",
      },
    };
  });
}
