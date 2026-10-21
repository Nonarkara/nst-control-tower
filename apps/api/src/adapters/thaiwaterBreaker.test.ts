import { describe, it, expect, vi, afterEach } from "vitest";
import { fetchWaterGauges, fetchRainfall, __resetDirectBreaker } from "./thaiwater";

/** A dead ThaiWater must cost ONE short timeout, not one per feed per cold start. */
describe("direct ThaiWater circuit breaker", () => {
  afterEach(() => { vi.unstubAllGlobals(); __resetDirectBreaker(); });

  it("after the gauges call fails, the rain call goes straight to the relay", async () => {
    const calls: string[] = [];
    vi.stubGlobal("fetch", vi.fn(async (url: string) => {
      calls.push(String(url));
      if (String(url).includes("thaiwater.net")) throw new Error("connect timeout");
      return new Response(JSON.stringify({ generated_at: new Date().toISOString(), water: [], rain: [] }), { status: 200 });
    }));
    await fetchWaterGauges();
    await fetchRainfall();
    expect(calls.filter((u) => u.includes("thaiwater.net"))).toHaveLength(1);
    expect(calls.filter((u) => u.includes("flood.nonarkara.org"))).toHaveLength(2);
  });
});
