import { CHONBURI, NST_PROVINCE_BBOX } from "@nst/shared";

// Visual map clamp — small (municipality only)
export const OUTER_BBOX = {
  minLng: CHONBURI.outerBounds[0][0],
  minLat: CHONBURI.outerBounds[0][1],
  maxLng: CHONBURI.outerBounds[1][0],
  maxLat: CHONBURI.outerBounds[1][1],
};

// Nakhon Si Thammarat province envelope for nationwide feeds (Traffy / iTIC / CCTV).
// Covers the whole province: the Khao Luang range in the west, the Gulf coast in
// the east, Khanom/Sichon in the north down to the Phatthalung border in the south.
export const FEED_BBOX = {
  minLng: NST_PROVINCE_BBOX[0][0],
  minLat: NST_PROVINCE_BBOX[0][1],
  maxLng: NST_PROVINCE_BBOX[1][0],
  maxLat: NST_PROVINCE_BBOX[1][1],
};

export function inBbox(lng: number, lat: number): boolean {
  return (
    lng >= FEED_BBOX.minLng &&
    lng <= FEED_BBOX.maxLng &&
    lat >= FEED_BBOX.minLat &&
    lat <= FEED_BBOX.maxLat
  );
}

// Strict municipality-only check, for visual layers
export function inMunicipality(lng: number, lat: number): boolean {
  return (
    lng >= OUTER_BBOX.minLng &&
    lng <= OUTER_BBOX.maxLng &&
    lat >= OUTER_BBOX.minLat &&
    lat <= OUTER_BBOX.maxLat
  );
}
