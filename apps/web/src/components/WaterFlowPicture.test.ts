/**
 * WaterFlowPicture — pure helpers + invariant tests.
 *
 * The component itself is verified by the SVG render in Playwright; here we
 * lock down the data-shape plumbing so the picture stays honest as feeds
 * change:
 *
 *   - levelToStatus:   HII situation_level (1..5) → Status (the same
 *                      vocabulary the rest of the app uses — never an
 *                      invented colour)
 *   - stationRow:      Step → PictureNode mapping (id/label/level/status)
 */

import { describe, it, expect } from "vitest";
import {
  levelToStatus,
  stationRow,
} from "./WaterFlowPicture";
import type { FlowStep } from "../lib/sensorSituation";

// Stable FlowStep shape — keep the helper tests honest across schema churn.
function flowStep(over: Partial<FlowStep>): FlowStep {
  return {
    name: "คีรีวง",
    nameEn: "Khiri Wong",
    levelM: 42.3,
    freeboardM: 0.8,
    situationLevel: 3,
    trend: "rising",
    lng: 99.78,
    lat: 8.45,
    ...over,
  };
}

describe("levelToStatus", () => {
  it("maps HII situation_level 1..5 to our Status vocabulary", () => {
    expect(levelToStatus(1)).toBe("watch");    // drought → watch
    expect(levelToStatus(2)).toBe("watch");    // low    → watch
    expect(levelToStatus(3)).toBe("normal");   // nominal
    expect(levelToStatus(4)).toBe("high");     // high   → alert
    expect(levelToStatus(5)).toBe("overbank"); // overbank
  });

  it("returns unknown for any value outside 1..5", () => {
    expect(levelToStatus(0)).toBe("unknown");
    expect(levelToStatus(6)).toBe("unknown");
    expect(levelToStatus(-1)).toBe("unknown");
  });

  it("keeps the picture stable when the feed drops a station (5 → unknown)", () => {
    // The component renders a fallback shape (mountains + city + bay) when
    // no cascade data is present — the helper itself just needs to be a
    // pure function so the SVG can pass whatever it has through unchanged.
    for (const v of [-1, 0, 6, 99, Number.NaN]) {
      const s = levelToStatus(v as number);
      expect(["unknown", "watch"]).toContain(s);
    }
  });
});

describe("stationRow", () => {
  it("populates labelEn + labelTh from the FlowStep name fields", () => {
    const row = stationRow(flowStep({}), 1);
    expect(row.id).toBe("khiri-wong");
    expect(row.labelEn).toBe("Khiri Wong");
    expect(row.labelTh).toBe("คีรีวง");
    expect(row.kind).toBe("station");
  });

  it("formats levelM as a one-decimal-metre string", () => {
    expect(stationRow(flowStep({ levelM: 0.0 }), 1).level).toBe("0.0 m");
    expect(stationRow(flowStep({ levelM: null }), 1).level).toBe("—");
  });

  it("derives Status from situation_level via levelToStatus", () => {
    expect(stationRow(flowStep({ situationLevel: 5 }), 1).status).toBe("overbank");
    expect(stationRow(flowStep({ situationLevel: 4 }), 1).status).toBe("high");
    expect(stationRow(flowStep({ situationLevel: 3 }), 1).status).toBe("normal");
    expect(stationRow(flowStep({ situationLevel: 1 }), 1).status).toBe("watch");
  });
});
