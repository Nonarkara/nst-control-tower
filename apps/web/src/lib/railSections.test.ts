import { describe, expect, test } from "vitest";
import { LENSES } from "../map/presets";
import { RAIL_SECTIONS, RIGHT_RAIL_KEYS, sectionDefaultOpen, sectionVisible, type RailSectionKey } from "./railSections";

const KEYS = Object.keys(RAIL_SECTIONS) as RailSectionKey[];
const LEFT = KEYS.filter((k) => !RIGHT_RAIL_KEYS.includes(k));

describe("rail sections per lens", () => {
  test("a section only opens in lenses where it is shown", () => {
    for (const key of KEYS) {
      for (const lens of RAIL_SECTIONS[key].openIn) expect(sectionVisible(key, lens)).toBe(true);
    }
  });

  test.each(LENSES.map((l) => l.id))("lens %s opens at most three left-rail sections and shows at least one", (lens) => {
    const shown = LEFT.filter((k) => sectionVisible(k, lens));
    const open = shown.filter((k) => sectionDefaultOpen(k, lens));
    expect(shown.length).toBeGreaterThan(0);
    expect(open.length).toBeLessThanOrEqual(3);
  });

  test("the flood lens carries the flood operations stack; operations does not", () => {
    for (const key of ["water-balance", "flood-command", "upstream-watershed", "water-panel"] as const) {
      expect(sectionVisible(key, "flood")).toBe(true);
      expect(sectionVisible(key, "operations")).toBe(false);
    }
  });

  test("CCTV and news are reachable from every lens", () => {
    for (const lens of LENSES.map((l) => l.id)) {
      expect(sectionVisible("right-cctv", lens)).toBe(true);
      expect(sectionVisible("right-news", lens)).toBe(true);
    }
  });
});
