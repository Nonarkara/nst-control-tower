/**
 * cityPois — invariant tests for the 48 hand-authored POIs from the
 * official NST City Municipality Map.
 *
 * The city POIs are the city-scale landmarks the operator needs to find
 * without searching: hotels, temples, hospitals, markets, important
 * places, tourist attractions, restaurants. Each POI must be category-
 * coded so the colour legend is readable.
 */

import { describe, it, expect } from "vitest";
import type { FeatureCollection, Point } from "geojson";
import { ScatterplotLayer, TextLayer } from "@deck.gl/layers";
import { cityPoisLayer } from "./cityPois";

function makeCollection(): FeatureCollection<Point, { id: string; name: string; nameEn: string; nameTh: string; category: string }> {
  return {
    type: "FeatureCollection",
    features: [
      { type: "Feature", id: "temple/mahatat", properties: { id: "temple/mahatat", name: "Wat Phra Mahathat", nameEn: "Wat Phra Mahathat", nameTh: "วัดพระมหาธาตุฯ", category: "landmark" }, geometry: { type: "Point", coordinates: [99.9638, 8.4367] } },
      { type: "Feature", id: "temple/chamao", properties: { id: "temple/chamao", name: "Wat Chamao", nameEn: "Wat Chamao", nameTh: "วัดชนาสวรรค์", category: "temple" }, geometry: { type: "Point", coordinates: [99.9670, 8.4290] } },
      { type: "Feature", id: "hotel/sakon", properties: { id: "hotel/sakon", name: "Sakon Hotel", nameEn: "Sakon Hotel", nameTh: "โรงแรมสากล", category: "hotel" }, geometry: { type: "Point", coordinates: [99.9610, 8.4430] } },
      { type: "Feature", id: "hospital/nakhon", properties: { id: "hospital/nakhon", name: "Nakhon Hospital", nameEn: "Nakhon Hospital", nameTh: "โรงพยาบาลนครฯ", category: "hospital" }, geometry: { type: "Point", coordinates: [99.9610, 8.4480] } },
      { type: "Feature", id: "market/sombun", properties: { id: "market/sombun", name: "Sombun Market", nameEn: "Sombun Market", nameTh: "ตลาดสมบูรณ์", category: "market" }, geometry: { type: "Point", coordinates: [99.9615, 8.4385] } },
      { type: "Feature", id: "gov/stadium", properties: { id: "gov/stadium", name: "Provincial Stadium", nameEn: "Provincial Stadium", nameTh: "สนามกีฬาจังหวัด", category: "government" }, geometry: { type: "Point", coordinates: [99.9610, 8.4650] } },
      { type: "Feature", id: "tour/city-pillar", properties: { id: "tour/city-pillar", name: "City Pillar Shrine", nameEn: "City Pillar Shrine", nameTh: "ศาลหลักเมือง", category: "tourist" }, geometry: { type: "Point", coordinates: [99.9650, 8.4375] } },
      { type: "Feature", id: "restaurant/dang-a", properties: { id: "restaurant/dang-a", name: "Dang-a Restaurant", nameEn: "Dang-a Restaurant", nameTh: "ร้านดาคารา", category: "restaurant" }, geometry: { type: "Point", coordinates: [99.9650, 8.4350] } },
    ],
  };
}

describe("cityPoisLayer", () => {
  it("renders a colour-coded ScatterplotLayer + Thai-name labels = 2 layers", () => {
    const layers = cityPoisLayer(makeCollection());
    expect(layers.length).toBe(2);
    expect(layers[0]).toBeInstanceOf(ScatterplotLayer);
    expect(layers[1]).toBeInstanceOf(TextLayer);
  });

  it("skips hotel labels (15 hotels would crowd the city view)", () => {
    const fc: FeatureCollection<Point, { id: string; name: string; nameEn: string; nameTh: string; category: string }> = {
      type: "FeatureCollection",
      features: Array.from({ length: 15 }, (_, i) => ({
        type: "Feature", id: `hotel/${i}`, properties: { id: `hotel/${i}`, name: `Hotel ${i}`, nameEn: `Hotel ${i}`, nameTh: `โรงแรม ${i}`, category: "hotel" },
        geometry: { type: "Point", coordinates: [99.96 + i * 0.001, 8.43] },
      })),
    };
    const layers = cityPoisLayer(fc);
    // Still 2 layers (dots + empty labels array)
    expect(layers.length).toBe(2);
    const labelLayer = layers[1] as unknown as { props: { data: unknown[] } };
    expect(labelLayer.props.data.length).toBe(0);
  });

  it("colours landmarks larger than temples/hotels (Mahatat pops)", () => {
    const fc = makeCollection();
    const layers = cityPoisLayer(fc);
    const dots = layers[0] as unknown as { props: { getRadius: (f: { properties: { category: string } }) => number } };
    const landmark = dots.props.getRadius({ properties: { category: "landmark" } });
    const temple = dots.props.getRadius({ properties: { category: "temple" } });
    const hotel = dots.props.getRadius({ properties: { category: "hotel" } });
    expect(landmark).toBeGreaterThan(temple);
    expect(landmark).toBeGreaterThan(hotel);
  });

  it("colours each category distinctly (8 categories, 8 different colours)", () => {
    const fc = makeCollection();
    const layers = cityPoisLayer(fc);
    const dots = layers[0] as unknown as { props: { getFillColor: (f: { properties: { category: string } }) => [number, number, number, number] } };
    const cats: string[] = ["landmark", "temple", "hotel", "hospital", "market", "government", "tourist", "restaurant"];
    const seen = new Set<string>();
    for (const c of cats) {
      const col = dots.props.getFillColor({ properties: { category: c } });
      seen.add(col.slice(0, 3).join(","));
    }
    expect(seen.size).toBe(cats.length);
  });

  it("returns 2 layers (with empty labels) for an empty collection", () => {
    const fc: FeatureCollection<Point, never> = { type: "FeatureCollection", features: [] };
    const layers = cityPoisLayer(fc as unknown as FeatureCollection<Point, { id: string; name: string; nameEn: string; nameTh: string; category: string }>);
    expect(layers.length).toBe(2); // dots + empty labels
  });

  it("labels every POI except hotels", () => {
    const fc = makeCollection();
    const layers = cityPoisLayer(fc);
    const labelLayer = layers[1] as unknown as { props: { data: { text: string }[] } };
    const labels = labelLayer.props.data.map((d) => d.text);
    // 8 features total - 1 hotel = 7 labels
    expect(labels.length).toBe(7);
    expect(labels).not.toContain("โรงแรมสากล"); // hotel label should be skipped
    expect(labels).toContain("วัดพระมหาธาตุฯ"); // landmark labelled
  });
});
