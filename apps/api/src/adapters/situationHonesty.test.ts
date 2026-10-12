import { describe, it, expect } from "vitest";
import { mapRelayWater, type RelayWater } from "./floodDashRelay";

/**
 * A gauge with no official situation level must not borrow one.
 *
 * `situation()` in BOTH thaiwater.ts (direct ThaiWater path) and floodDashRelay.ts
 * (relay path) read `Math.round(raw ?? 3)`. `3` is not a neutral placeholder — it
 * is HII's own word for "this channel is normal". So a station HII declined to
 * classify was published as an officially calm river, on the dashboard whose job
 * is to warn.
 *
 * This is not hypothetical: on 2026-10-12, 1 of 23 live NST stations
 * (โรงเรียนวัดโคกโพธิ์สถิตย์, Lan Saka — the district Kiriwong drains through)
 * came back with no `situation_level`. It rendered green.
 *
 * The same file already refuses to guess elsewhere: `signedDiffFromBank` returns
 * null rather than assume a bare positive magnitude means "above bank", with the
 * comment "Direction unknown: do NOT assume above-bank". This is the identical
 * mistake one field over.
 */

function water(over: Partial<RelayWater> = {}): RelayWater {
  return {
    key: "1", name_th: "สะพานคลองปง (คีรีวง)", lat: 8.44, lng: 99.76,
    meta: { oldcode: "KW01", min_bank: 6.0, river: "คลองปง" },
    obs_time: "2026-10-12T09:00", age_min: 5,
    situation_level: 4, wl_msl: 5.4, storage_pct: 90,
    ...over,
  };
}

describe("a station HII did not classify", () => {
  it("carries a null situation level, not 3", () => {
    // The exact defect. `?? 3` published this as "normal".
    const g = mapRelayWater([water({ situation_level: null })]).gauges[0]!;
    expect(g.situationLevel).toBeNull();
  });

  it("is still null when the field is absent entirely", () => {
    const row = water();
    delete (row as { situation_level?: number | null }).situation_level;
    expect(mapRelayWater([row]).gauges[0]!.situationLevel).toBeNull();
  });

  it("is NOT sorted above a genuinely calm station", () => {
    // Ordering by `?? 0` must keep unclassified below every classified level.
    const rows = [
      water({ key: "a", name_th: "unclassified", situation_level: null }),
      water({ key: "b", name_th: "normal", situation_level: 3 }),
    ];
    const sorted = [...mapRelayWater(rows).gauges].sort(
      (x, y) => (y.situationLevel ?? 0) - (x.situationLevel ?? 0) || x.name.localeCompare(y.name),
    );
    expect(sorted[0]!.name).toBe("normal");
    expect(sorted[1]!.name).toBe("unclassified");
  });

  it("keeps its other, real measurements — only the level is unknown", () => {
    // Nulling one field must not throw away the evidence we DO have.
    const g = mapRelayWater([water({ situation_level: null })]).gauges[0]!;
    expect(g.levelMsl).toBe(5.4);
    expect(g.diffFromBank).toBeCloseTo(-0.6); // 5.4 − 6.0
    expect(g.fullnessPct).toBe(90);
  });
});

describe("a station HII did classify", () => {
  it("still reports the real level, unchanged", () => {
    for (const [raw, want] of [[1, 1], [2, 2], [3, 3], [4, 4], [5, 5]] as const) {
      expect(mapRelayWater([water({ situation_level: raw })]).gauges[0]!.situationLevel).toBe(want);
    }
  });

  it("treats an out-of-range number as no level, not as 1 or 3", () => {
    // HII's scale is 1-5. A 0 is not a level it defines. The two adapters used
    // to disagree here — thaiwater clamped 0 to 3 ("normal"), floodDashRelay sent
    // it to 1 ("critical drought") — so one transmission could read calm on the
    // direct path and drought on the relay. Both invented; both are now null.
    expect(mapRelayWater([water({ situation_level: 0 })]).gauges[0]!.situationLevel).toBeNull();
    expect(mapRelayWater([water({ situation_level: 9 })]).gauges[0]!.situationLevel).toBeNull();
    expect(mapRelayWater([water({ situation_level: -2 })]).gauges[0]!.situationLevel).toBeNull();
  });
});

describe("neither adapter fabricates the level", () => {
  for (const f of ["./thaiwater.ts", "./floodDashRelay.ts"]) {
    it(`${f} does not default a missing level to 3`, async () => {
      const { readFileSync } = await import("node:fs");
      const src = readFileSync(new URL(f, import.meta.url), "utf8");
      // The guard must be exact: `?? 3` is the defect in any spelling.
      expect(src).not.toMatch(/Math\.round\(raw \?\? 3\)/);
      expect(src).toMatch(/if \(raw == null \|\| !Number\.isFinite\(raw\)\) return null;/);
    });
  }
});