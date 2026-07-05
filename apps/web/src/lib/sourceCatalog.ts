/**
 * Source catalog display helpers — extracted from SourceCatalog.tsx for testing.
 *
 * adapterNameFor() maps an API path to the adapter name used by
 * /api/health/detailed. Getting it wrong means a degraded adapter shows
 * no warning chip in the SOURCES modal even though the health endpoint
 * reports its status correctly.
 */

import type { SourceCategory, SourceStatus } from "@nst/shared";

export const STATUS_COLOR: Record<SourceStatus, string> = {
  live: "var(--good)",
  ready: "var(--data)",
  planned: "var(--warn)",
  research: "var(--ink-low)",
  stub: "var(--ink-low)",
};

export const CATEGORY_LABEL: Record<SourceCategory, string> = {
  mobility: "MOB",
  incidents: "INC",
  environment: "ENV",
  imagery: "IMG",
  vibes: "VIB",
  infrastructure: "INF",
  maritime: "MAR",
  "open-data": "OPN",
  campus: "LEG",
};

/**
 * Map an apiPath ending segment / pattern → adapter name used by /api/health/detailed.
 * Adapter names come from the second arg of `safeFeed(c, fn, "adapter-name")` in apps/api/src/index.ts.
 * Keep this in sync when new routes are added.
 */
export const API_PATH_TO_ADAPTER: Array<[RegExp, string]> = [
  [/\/api\/incidents\/city-reports$/, "city-reports"],
  [/\/api\/incidents\/itic$/, "itic"],
  [/\/api\/news$/, "news"],
  [/\/api\/weather$/, "weather"],
  [/\/api\/precip-nowcast$/, "precip-nowcast"],
  [/\/api\/air-quality$/, "air-quality"],
  [/\/api\/air-quality\/trend$/, "air-quality-trend"],
  [/\/api\/air-quality\/aqicn$/, "aqicn"],
  [/\/api\/cctv\/longdo$/, "cctv"],
  [/\/api\/trends$/, "trends"],
  [/\/api\/datago\/datasets$/, "datago-datasets"],
  [/\/api\/datago\/reservoirs$/, "reservoirs"],
  [/\/api\/datago\/disasters$/, "disasters"],
  [/\/api\/datago\/fahfon$/, "fahfon"],
  [/\/api\/datago\/points$/, "datago-points"],
  [/\/api\/datago\/provincial-kpis$/, "datago-provincial-kpis"],
  [/\/api\/marine$/, "marine"],
  [/\/api\/tides$/, "tides"],
  [/\/api\/gistda\/poi$/, "gistda-poi"],
  [/\/api\/gistda\/solar$/, "gistda-solar"],
  [/\/api\/gistda\/landuse$/, "gistda-landuse"],
  [/\/api\/nasa\/earth-readings$/, "nasa-power"],
  [/\/api\/social\/facebook$/, "facebook"],
  [/\/api\/markets$/, "markets"],
  [/\/api\/maritime\/ais$/, "ais"],
  // Flood / hydrology — the headline risk for NST
  [/\/api\/flood\/gauges$/, "flood-gauges"],
  [/\/api\/flood\/dam$/, "flood-dam"],
  [/\/api\/water\/gauges$/, "thaiwater-gauges"],
  [/\/api\/water\/rain$/, "thaiwater-rain"],
  [/\/api\/water\/ews$/, "dwr-ews"],
  [/\/api\/water\/reservoirs-rid$/, "rid-reservoirs"],
  // Additional live routes that were missing health-mapping coverage —
  // without these, the SOURCES modal showed no warning chip for degraded adapters.
  [/\/api\/air-quality\/air4thai$/, "air4thai"],
  [/\/api\/flood\/national-prone$/, "national-flood-prone"],
  [/\/api\/flood\/south\/risk$/, "flooddash-south-risk"],
  [/\/api\/flood\/south\/rivers$/, "flooddash-south-rivers"],
  [/\/api\/flood\/unosat-2021$/, "unosat-2021-exposure"],
  [/\/api\/water\/national-waterways$/, "national-waterways"],
  [/\/api\/rainfall\/historical$/, "historical-rainfall"],
  [/\/api\/flights$/, "flights-nst"],
  [/\/api\/wrf\/rain-outlook$/, "wrf-rain-outlook"],
  [/\/api\/wrf\/rain-grid$/, "wrf-rain-grid"],
  [/\/api\/precip-nowcast\/zones$/, "precip-nowcast-zones"],
  [/\/api\/executive$/, "executive"],
];

/**
 * Find the adapter name that owns the given API path.
 * Returns null if the path doesn't match any known adapter.
 */
export function adapterNameFor(apiPath: string | undefined): string | null {
  if (!apiPath) return null;
  for (const [re, name] of API_PATH_TO_ADAPTER) if (re.test(apiPath)) return name;
  return null;
}
