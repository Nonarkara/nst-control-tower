import type { LayerId } from "./presetsLenses";
import { ALL_LAYERS_PART_A } from "./presetsLayersA";
import { ALL_LAYERS_PART_B } from "./presetsLayersB";

export const ALL_LAYERS = [...ALL_LAYERS_PART_A, ...ALL_LAYERS_PART_B];

export const COMPUTED_LAYERS: ReadonlySet<LayerId> = new Set<LayerId>([
  "distance-grid",
  "building-roofs",
  "wrf-rain-grid", // one API grid feature — a count badge would read as "1" and mislead
  "cu-map-2015",
  "maritime-overlay",
  "tile3d-buildings",
  "heritage-old-town",
  "heritage-temple-spires",
  // All GIBS + Esri + Google satellite rasters
  "google-satellite",
  "google-traffic",
  "satellite-esri",
  "satellite-true-color",
  "satellite-viirs-truecolor",
  "satellite-night",
  "satellite-ndvi",
  "satellite-lst",
  "satellite-aerosol",
  "satellite-no2",
  "satellite-terrain",
  "satellite-himawari",
  "satellite-imerg",
  // New raster / animated / decorative layers
  "terrain-3d",
  "precip-radar",
  "air-waqi-field",
  "waterway-flow", // animated dot cloud — a count badge would be meaningless
]);
