import { describe, it, expect } from "vitest";
import { summarizeRainWind } from "./floodOperations";
const now = Date.parse("2026-10-20T13:45:00Z");
const time = Array.from({ length: 60 }, (_, i) => Date.parse("2026-10-20T00:00:00Z") / 1000 + i * 3600);
describe("operational hourly forecast windows", () => {
  it("sums only upcoming full hours, not today's elapsed rain", () => {
    const r = summarizeRainWind({ hourly: { time, precipitation: time.map((_, i) => i < 14 ? 999 : 2), wind_direction_10m: time.map(() => 120), wind_speed_10m: time.map(() => 7) } }, now);
    expect(r.rain6hMm).toBe(12); expect(r.rain12hMm).toBe(24); expect(r.rain24hMm).toBe(48);
    expect(r.hours[0].at).toBe("2026-10-20T14:00:00.000Z");
    expect(r.hours).toHaveLength(24);
  });
  it("does not call missing, negative or incomplete rain zero", () => {
    expect(summarizeRainWind({ hourly: { time, precipitation: time.map(() => null) } }, now).rain24hMm).toBeNull();
    expect(summarizeRainWind({ hourly: { time: time.slice(0, 15), precipitation: time.map(() => 0) } }, now).rain6hMm).toBeNull();
    expect(summarizeRainWind({ hourly: { time, precipitation: time.map(() => -1) } }, now).rain6hMm).toBeNull();
    expect(summarizeRainWind({ hourly: { time, precipitation: time.map(() => 0) } }, now).rain24hMm).toBe(0);
  });
});
