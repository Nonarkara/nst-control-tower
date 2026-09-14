import { describe, expect, test } from "vitest";
import { STATUS, STATUS_LEVELS, statusRgba, worstStatus } from "./status";

describe("STATUS vocabulary", () => {
  test("every level has a distinct colour token, map colour and glyph", () => {
    const uniq = (xs: string[]) => new Set(xs).size;
    expect(uniq(STATUS_LEVELS.map((l) => STATUS[l].color))).toBe(STATUS_LEVELS.length);
    expect(uniq(STATUS_LEVELS.map((l) => STATUS[l].rgb.join(",")))).toBe(STATUS_LEVELS.length);
    expect(uniq(STATUS_LEVELS.map((l) => STATUS[l].glyph))).toBe(STATUS_LEVELS.length);
  });

  test("every colour is a CSS custom property, never a raw hex", () => {
    for (const l of STATUS_LEVELS) expect(STATUS[l].color).toMatch(/^var\(--[a-z0-9-]+\)$/);
  });
});

describe("worstStatus", () => {
  test("picks the most severe known level", () => {
    expect(worstStatus(["normal", "critical", "watch"])).toBe("critical");
    expect(worstStatus(["unknown", "watch"])).toBe("watch");
  });

  test("is unknown for an empty list or all-unknown input", () => {
    expect(worstStatus([])).toBe("unknown");
    expect(worstStatus(["unknown"])).toBe("unknown");
  });
});

test("statusRgba appends alpha", () => {
  expect(statusRgba("warning", 100)).toEqual([245, 124, 0, 100]);
});
