/**
 * floodStoryLayout — the 7-stage kid-readable flood story behind the
 * `floodStoryLayer`. Verified at the visual layer by Playwright; here we
 * lock down the data-shape plumbing so the layout stays honest as the
 * cascade evolves:
 *
 *   - 7 stages always, in upstream → outlet order
 *   - Each anchor is the REAL lng/lat of the named watershed point (or
 *     Pak Phanang Bay for the outlet) — never a placeholder
 *   - Empty / partial summaries degrade to an empty array (cold start)
 */

import { describe, it, expect } from "vitest";
import { floodStoryLayout, PAK_PHANANG_BAY_CENTROID } from "./layers";
import type { ZoneSummary } from "../lib/watershed";
import { WATERSHED_FORECAST_POINTS } from "@nst/shared";

function zone(key: string, lng: number, lat: number, status: ZoneSummary["status"] = "normal"): ZoneSummary {
  const isCity = key === "city";
  return {
    zone: {
      key, th: key, en: key, role: "", river: "คลองท่าดี",
      lng, lat, amphoe: [], basinId: "city_tha_dee",
      ...(isCity ? { isCity: true } : {}),
    },
    status,
    situation: 3,
    levelMsl: 42.0,
    diffFromBank: -1.0,
    rain24h: null, soil: null, ewsStatus: 0,
    rising: false, gaugeCount: 1, topStation: key, modelled: false,
  };
}

describe("floodStoryLayout", () => {
  it("returns exactly 7 stages in upstream → outlet order when full cascade is present", () => {
    const summaries = [
      zone("khiri-wong", 99.7833, 8.4338),
      zone("lan-saka",   99.802,  8.4012),
      zone("city",       99.9631, 8.4364),
    ];
    const stages = floodStoryLayout(summaries);
    expect(stages).toHaveLength(7);
    expect(stages.map((s) => s.step)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it("anchors steps 4–6 at the real watershed coords and step 7 at Pak Phanang Bay", () => {
    const kw = WATERSHED_FORECAST_POINTS.find((p) => p.key === "khiri-wong")!;
    const ls = WATERSHED_FORECAST_POINTS.find((p) => p.key === "lan-saka")!;
    const city = WATERSHED_FORECAST_POINTS.find((p) => p.key === "city")!;
    const summaries = [
      zone("khiri-wong", kw.lng, kw.lat),
      zone("lan-saka",   ls.lng, ls.lat),
      zone("city",       city.lng, city.lat),
    ];
    const stages = floodStoryLayout(summaries);
    // Step 4 = Khiri Wong (lat/lng exact)
    expect(stages[3]!.position[0]).toBeCloseTo(kw.lng, 4);
    expect(stages[3]!.position[1]).toBeCloseTo(kw.lat, 4);
    // Step 5 = Lan Saka
    expect(stages[4]!.position[0]).toBeCloseTo(ls.lng, 4);
    expect(stages[4]!.position[1]).toBeCloseTo(ls.lat, 4);
    // Step 6 = City
    expect(stages[5]!.position[0]).toBeCloseTo(city.lng, 4);
    expect(stages[5]!.position[1]).toBeCloseTo(city.lat, 4);
    // Step 7 = Pak Phanang Bay (the outlet)
    expect(stages[6]!.position[0]).toBeCloseTo(PAK_PHANANG_BAY_CENTROID.lng, 4);
    expect(stages[6]!.position[1]).toBeCloseTo(PAK_PHANANG_BAY_CENTROID.lat, 4);
  });

  it("returns an empty array when the cascade is missing stations (cold start)", () => {
    expect(floodStoryLayout([])).toEqual([]);
    expect(floodStoryLayout([zone("khiri-wong", 99.78, 8.43)])).toEqual([]);
    expect(floodStoryLayout([
      zone("khiri-wong", 99.78, 8.43),
      zone("lan-saka",   99.80, 8.40),
    ])).toEqual([]);
  });

  it("carries both EN and Thai labels for every stage (bilingual kid-friendly)", () => {
    const summaries = [
      zone("khiri-wong", 99.78, 8.43),
      zone("lan-saka",   99.80, 8.40),
      zone("city",       99.96, 8.43),
    ];
    const stages = floodStoryLayout(summaries);
    for (const s of stages) {
      expect(s.en.length).toBeGreaterThan(0);
      expect(s.th.length).toBeGreaterThan(0);
    }
  });
});
