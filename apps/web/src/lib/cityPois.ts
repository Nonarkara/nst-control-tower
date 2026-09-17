/**
 * cityPois — important places in NST Old Town.
 *
 * Hand-authored from the official Nakhon Si Thammarat City Municipality
 * Map (1:50,000 scale). 48 POIs across 7 categories — hotels, temples,
 * hospitals, markets, important places, tourist attractions, and
 * restaurants. Drawn as a colour-coded layer that city zoom users see
 * over the basemap so they can find specific destinations without
 * searching by name.
 *
 * Colour palette is the Okabe–Ito categorical set so each category reads
 * distinctly against both the dark Carto basemap and the light OpenTopoMap.
 */

import type { FeatureCollection, Point } from "geojson";
import { ScatterplotLayer, TextLayer } from "@deck.gl/layers";
import type { Layer } from "@deck.gl/core";

// ─── Category palette (Okabe-Ito friendly) ──────────────────────────────
// Each category gets a unique colour + radius so it reads distinctly on
// the basemap. Landmarks (Wat Phra Mahathat) get the largest radius +
// gold colour to read as the city-defining point.
const CATEGORY_STYLE: Record<string, { color: [number, number, number]; radius: number; alpha: number }> = {
  landmark:    { color: [255, 195, 0],   radius: 16, alpha: 250 }, // gold (Mahatat)
  temple:      { color: [240, 165, 60],  radius: 9,  alpha: 240 }, // temple gold
  hotel:       { color: [80, 130, 230],  radius: 7,  alpha: 230 }, // hotel blue
  hospital:    { color: [220, 50, 47],   radius: 9,  alpha: 240 }, // hospital red
  market:      { color: [240, 130, 30],  radius: 8,  alpha: 240 }, // market orange
  government:  { color: [100, 110, 130], radius: 9,  alpha: 235 }, // slate (civic)
  tourist:     { color: [60, 165, 90],   radius: 8,  alpha: 235 }, // tourist green
  restaurant:  { color: [220, 80, 130],  radius: 7,  alpha: 235 }, // restaurant pink
};

export interface CityPoisProps {
  id: string;
  name: string | null;
  nameEn: string | null;
  nameTh: string | null;
  category: string;
}

/**
 * Render the city POIs as a colour-coded ScatterplotLayer + Thai-name
 * labels. Visible from city zoom down — labels drop the label-noise at
 * street zoom so the buildings don't compete with the dots.
 */
export function cityPoisLayer(
  collection: FeatureCollection<Point, CityPoisProps>,
): Layer[] {
  const out: Layer[] = [];

  // Dot scatter — colour-coded by category, larger for landmarks.
  type PointFeat = {
    geometry: { type: "Point"; coordinates: [number, number] };
    properties: CityPoisProps;
  };
  const features: PointFeat[] = collection.features as unknown as PointFeat[];
  out.push(
    new ScatterplotLayer<PointFeat>({
      id: "city-pois-dots",
      data: collection as unknown as PointFeat[],
      getPosition: (f) => f.geometry.coordinates as [number, number],
      getFillColor: (f) => {
        const style = CATEGORY_STYLE[f.properties.category] ?? CATEGORY_STYLE.tourist!;
        return [style.color[0], style.color[1], style.color[2], style.alpha] as [number, number, number, number];
      },
      getLineColor: [255, 255, 255, 240] as [number, number, number, number],
      getRadius: (f) => {
        const style = CATEGORY_STYLE[f.properties.category] ?? CATEGORY_STYLE.tourist!;
        return style.radius;
      },
      radiusUnits: "pixels",
      radiusMinPixels: 4,
      radiusMaxPixels: 18,
      stroked: true,
      getLineWidth: 1.5,
      lineWidthUnits: "pixels",
      lineWidthMinPixels: 1,
      pickable: true,
      parameters: { depthWriteEnabled: false, depthCompare: "always" },
    }) as Layer,
  );

  // Thai name labels — only show at city zoom (zoomBucket >= 1) so the
  // dots don't drown in label noise at province scale. Hotels (15 of
  // them) only label at street zoom to avoid clutter; landmarks + temples
  // + tourist + hospital label at city zoom.
  const labelFeatures: { pos: [number, number]; text: string; category: string }[] = [];
  for (const f of collection.features) {
    const cat = f.properties.category;
    if (cat === "hotel") continue; // skip hotel labels at city zoom — too many
    const coords = f.geometry.coordinates as [number, number];
    labelFeatures.push({
      pos: coords,
      text: f.properties.nameTh ?? f.properties.nameEn ?? "",
      category: cat,
    });
  }
  // Always push the labels layer — when there are no labels (empty
  // collection or all-hotels) deck.gl draws nothing, but the layer
  // is consistently present so consumers don't need to defensively
  // check for its absence.
  out.push(
    new TextLayer<{ pos: [number, number]; text: string; category: string }>({
      id: "city-pois-labels",
      data: labelFeatures,
      getPosition: (d) => d.pos,
      getText: (d) => d.text,
      getSize: 11,
      getColor: (d) => {
        const style = CATEGORY_STYLE[d.category] ?? CATEGORY_STYLE.tourist!;
        return [style.color[0] / 2, style.color[1] / 2, style.color[2] / 2, 245] as [number, number, number, number];
      },
      fontFamily: "'IBM Plex Sans Thai', 'Inter', sans-serif",
      fontWeight: 700,
      characterSet: "auto",
      background: true,
      backgroundPadding: [2, 1],
      getBackgroundColor: [255, 255, 255, 215],
      billboard: true,
      getPixelOffset: [0, -16],
      parameters: { depthWriteEnabled: false, depthCompare: "always" },
      pickable: false,
    }) as Layer,
  );

  return out;
}
