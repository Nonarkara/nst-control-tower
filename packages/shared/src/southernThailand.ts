/** Southern Thailand region — Flooddash analytics scope for the NST dashboard. */

/** HII region label on ThaiWater geocode rows. */
export const SOUTHERN_REGION_EN = "South";
export const SOUTHERN_REGION_TH = "ภาคใต้";

/** Approximate southern peninsula bbox [west, south, east, north] for map focus. */
export const SOUTHERN_THAILAND_BBOX: [number, number, number, number] = [
  98.3, 5.5, 102.2, 11.0,
];

/** Province codes in the southern peninsula — verified from ThaiWater region=South (14 provinces). */
export const SOUTHERN_PROVINCE_CODES = new Set([
  "80", "81", "82", "83", "84", "85", "86",
  "90", "91", "92", "93", "94", "95", "96",
]);

export function isSouthernRegion(regionEn: string | null | undefined, regionTh: string | null | undefined): boolean {
  if (regionEn === SOUTHERN_REGION_EN) return true;
  if (regionTh?.includes(SOUTHERN_REGION_TH)) return true;
  return false;
}

export function isSouthernProvinceCode(code: string | null | undefined): boolean {
  return code != null && SOUTHERN_PROVINCE_CODES.has(code);
}
