import type { Coordinates } from "./types";

export interface CampusConfig {
  id: string;
  name: { en: string; th: string; zh: string };
  center: Coordinates;
  innerBounds: [Coordinates, Coordinates];
  outerBounds: [Coordinates, Coordinates];
  surroundingRoads: string[];
  defaultView: {
    longitude: number;
    latitude: number;
    zoom: number;
    pitch: number;
    bearing: number;
  };
}

export const NST: CampusConfig = {
  id: "nst-city",
  name: {
    en: "Nakhon Si Thammarat City Municipality",
    th: "เทศบาลนครนครศรีธรรมราช",
    zh: "那空是贪玛叻市",
  },
  // เทศบาลนครนครศรีธรรมราช (Nakhon Si Thammarat City Municipality) — ~22.6 km².
  // A long, narrow N–S historic city: the Old Town spine (Ratchadamnoen Rd) runs
  // along the medieval city-wall axis, anchored by Wat Phra Mahathat Woramahawihan
  // (UNESCO tentative). The Khao Luang massif (1,835 m, Southern Thailand's highest
  // peak) rises to the west and is the source of the recurrent flash floods; the
  // Pak Phanang river basin drains to the Gulf in the south-east.
  center: [99.9631, 8.4364], // [lng, lat] — Old Town / Wat Phra Mahathat axis (the focus)
  // innerBounds = the ~22.6 km² City Municipality (the subject in focus).
  innerBounds: [
    [99.948, 8.408], // SW
    [99.978, 8.470], // NE
  ],
  // outerBounds = the MAP COVERAGE area: the whole Nakhon Si Thammarat province
  // (Khao Luang range in the west → Gulf coast in the east, Khanom/Sichon in the
  // north → the Phatthalung border in the south). Kept just inside the feed bbox
  // so live feeds always cover at least the visible map. The City Municipality
  // stays the focus (branding, KPIs, distance grid, weather all keyed to `center`).
  outerBounds: [
    [99.33, 7.83], // SW
    [100.32, 9.42], // NE
  ],
  surroundingRoads: [
    "Ratchadamnoen Road",          // Old Town spine (N–S)
    "Highway 401 / 4012",          // arterial approach from the north
    "Karom Road",
    "Phatthanakan Khukhwang Road",
    "Si Thammasok Road",
  ],
  // Default camera frames the WHOLE PROVINCE (zoom ~8.4) so the map opens on the
  // full provincial extent with the city visible; zoom in past ~13 for the Old
  // Town building fabric. pitch kept gentle for the province overview.
  defaultView: {
    longitude: 99.83,
    latitude: 8.62,
    zoom: 8.4,
    pitch: 25,
    bearing: 0,
  },
};

/**
 * Province-wide bounding box (SW, NE) for province-scale adapters/layers — flood
 * gauges, data.go.th POIs, air4thai, GISTDA. Nakhon Si Thammarat province spans the
 * Khao Luang range (west) to the Gulf coast (east), Khanom/Sichon (north) to the
 * Phatthalung border (south). 23 districts, ~9,942 km².
 */
export const NST_PROVINCE_BBOX: [Coordinates, Coordinates] = [
  [99.30, 7.80], // SW
  [100.35, 9.45], // NE
];

// Legacy aliases — keep stray YALA/CHONBURI/CHULA references building during migration.
export const YALA = NST;
export const CHONBURI = NST;
export const CHULA = NST;
