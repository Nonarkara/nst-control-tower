import { describe, it, expect } from "vitest";
import type { WaterGauge, RainfallStation, EwsStation } from "@nst/shared";
import { summarizeFloodEvidence } from "./floodPosture";
const now = Date.parse("2026-10-23T07:00:00Z");
const at = new Date(now).toISOString();
describe("flood evidence — no inferred municipal orders", () => {
  it("retains missing measurements as unknown, never measured zero", () => {
    const e = summarizeFloodEvidence([], [{ observedAt: at, rain24h: null } as RainfallStation], [], now);
    expect(e.rain24hMax).toBeNull();
    expect(e.assessedWaterCount).toBe(0);
    expect(e).not.toHaveProperty("level");
  });
  it("rejects stale, future and nonfinite readings on the observation clock", () => {
    const rain = [null, "invalid", new Date(now-121*60_000).toISOString(), new Date(now+6*60_000).toISOString()].map(observedAt => ({observedAt, rain24h: 100} as RainfallStation));
    expect(summarizeFloodEvidence([], rain, [], now).rainCount).toBe(0);
  });
  it("preserves DWR critical without rainfall and counts measured overbank", () => {
    const e = summarizeFloodEvidence([{observedAt: at, situationLevel: null, diffFromBank: 0.3} as WaterGauge], [{observedAt: at, rain24h: 0} as RainfallStation], [{observedAt: at, status: 3, stale: false} as EwsStation], now);
    expect(e.overbankCount).toBe(1);
    expect(e.rain24hMax).toBe(0);
    expect(e.warnings[0].status).toBe(3);
  });
});
