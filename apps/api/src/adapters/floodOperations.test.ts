import { describe, it, expect, vi } from "vitest";
import { summarizeRainWind, withinOperationsDeadline } from "./floodOperations";
const now = Date.parse("2026-10-20T13:45:00Z");
const time = Array.from({ length: 60 }, (_, i) => Date.parse("2026-10-20T00:00:00Z") / 1000 + i * 3600);
describe("operational hourly forecast windows", () => {
  it("settles a hanging source before the browser deadline without losing other sources", async () => {
    vi.useFakeTimers();
    try {
      const results = Promise.allSettled([
        withinOperationsDeadline(new Promise<never>(() => {})),
        withinOperationsDeadline(Promise.resolve("observed gauge")),
      ]);
      await vi.advanceTimersByTimeAsync(18_000);
      const [missing, observed] = await results;
      expect(missing.status).toBe("rejected");
      expect(observed).toEqual({ status: "fulfilled", value: "observed gauge" });
      expect(vi.getTimerCount()).toBe(0);
    } finally { vi.useRealTimers(); }
  });
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
