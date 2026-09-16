/**
 * LiveCascadeReadout — pure helpers + invariant tests.
 *
 * The component is verified at the visual layer by Playwright; here we lock
 * down the data-shape plumbing so the readout stays honest as feeds change:
 *   - basinBandToLevel: maps FloodDash basin-band → StatusLevel vocabulary
 *   - sourceStatus:    promotes the worst cascade situation to a level
 *   - cascadeTrendGlyph: maps trend enum → glyph
 *
 * The full `<LiveCascadeReadout>` render path lives behind a render test in
 * Playwright; we cover the logic here so a regression shows up in CI even
 * without a browser run.
 */

import { describe, it, expect } from "vitest";
import {
  basinBandToLevel,
  sourceStatus,
  cascadeTrendGlyph,
} from "./LiveCascadeReadout";
import type { ZoneSummary } from "../lib/watershed";

function sum(over: Partial<ZoneSummary>): ZoneSummary {
  return {
    zone: {
      key: "khiri-wong",
      th: "คีรีวง",
      en: "Khiri Wong",
      role: "Tha Dee source",
      river: "คลองท่าดี",
      lat: 8.4338,
      lng: 99.7833,
      amphoe: ["ลานสกา"],
      basinId: "city_tha_dee",
    },
    status: "normal",
    situation: 3,
    levelMsl: 43.1,
    diffFromBank: -0.4,
    rain24h: 12,
    soil: 40,
    ewsStatus: 0,
    rising: false,
    gaugeCount: 1,
    topStation: "Khiri Wong",
    modelled: false,
    ...over,
  };
}

describe("basinBandToLevel", () => {
  it("maps FloodDash basin bands to the StatusLevel vocabulary", () => {
    expect(basinBandToLevel("ok")).toBe("normal");
    expect(basinBandToLevel("tight")).toBe("warning");
    expect(basinBandToLevel("overflow")).toBe("critical");
    expect(basinBandToLevel("unknown")).toBe("unknown");
    expect(basinBandToLevel(undefined)).toBe("unknown");
  });
});

describe("sourceStatus", () => {
  it("returns normal for the calm / low / drought band (situation ≤ 3)", () => {
    expect(sourceStatus([sum({ situation: 0 })])).toBe("normal");
    expect(sourceStatus([sum({ situation: 1 })])).toBe("normal");
    expect(sourceStatus([sum({ situation: 2 })])).toBe("normal");
    expect(sourceStatus([sum({ situation: 3 })])).toBe("normal");
  });

  it("returns warning when at least one station is at HII situation 4 (high)", () => {
    expect(sourceStatus([sum({ situation: 4 })])).toBe("warning");
  });

  it("returns warning when at least one station is at HII situation 5 (overbank)", () => {
    expect(sourceStatus([sum({ situation: 5 })])).toBe("warning");
  });

  it("escalates to critical when status === 'flood' (active flood wave, regardless of situation_level)", () => {
    // Explicit flood band is the worst reading — overbank alone is "warning",
    // but a flood is "critical".
    expect(sourceStatus([sum({ status: "flood", situation: 5 })])).toBe("critical");
    expect(sourceStatus([sum({ status: "flood", situation: 4 })])).toBe("critical");
    expect(sourceStatus([sum({ status: "flood", situation: 3 })])).toBe("critical");
  });

  it("returns normal for an empty cascade (no readings)", () => {
    expect(sourceStatus([])).toBe("normal");
  });
});

describe("cascadeTrendGlyph", () => {
  it("maps the boolean 'rising' to the matching glyph", () => {
    expect(cascadeTrendGlyph(true)).toBe("▲");
    expect(cascadeTrendGlyph(false)).toBe("·");
  });
});
