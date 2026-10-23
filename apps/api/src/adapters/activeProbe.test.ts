import { describe, it, expect, vi, afterEach } from "vitest";
import { probeWaterGauges, probeRainfall, __resetDirectBreaker } from "./thaiwater";
import { probeEwsStations } from "./dwrEws";

/**
 * The readiness endpoint has to measure the ORIGIN. Read through the
 * adapters' stale-serving cache it measured the cache's patience instead:
 * the verdict depended on whether a background refresh had landed. Four
 * probes six seconds apart returned 503, 503, 503, 200 against identical
 * data, with the reported snapshot age swinging between 104 and 4 minutes.
 *
 * A sign-off endpoint that flips on a timer cannot be signed off against.
 */
describe("active probes contact the origin, not the cache", () => {
  afterEach(() => { vi.unstubAllGlobals(); __resetDirectBreaker(); });

  it("a probe goes to the origin every time, and does not read a cached snapshot", async () => {
    const calls: string[] = [];
    vi.stubGlobal("fetch", vi.fn(async (url: string) => {
      calls.push(String(url));
      if (String(url).includes("thaiwater.net")) throw new Error("connect timeout");
      return new Response(JSON.stringify({ generated_at: new Date().toISOString(), water: [], rain: [] }), { status: 200 });
    }));
    // Two probes in a row: the second must still reach the origin rather
    // than being answered by the first one's cached result.
    await expect(probeWaterGauges()).rejects.toThrow();
    await expect(probeWaterGauges()).rejects.toThrow();
    expect(calls.filter((u) => u.includes("flood.nonarkara.org"))).toHaveLength(2);
  });

  it("a probe failure is a failed probe — it is not softened into a calm empty feed", async () => {
    vi.stubGlobal("fetch", vi.fn(async (url: string) => {
      if (String(url).includes("thaiwater.net")) throw new Error("connect timeout");
      throw new Error("relay origin unavailable");
    }));
    // The ordinary read path softens an outage into an explicit "unavailable"
    // feed so the dashboard can say so. A probe must not: it has to report
    // the failure, or the endpoint cannot tell "the origin is down" from
    // "the cache had nothing in it".
    await expect(probeWaterGauges()).rejects.toThrow("relay origin unavailable");
  });

  it("the rain probe also reaches the origin", async () => {
    const calls: string[] = [];
    vi.stubGlobal("fetch", vi.fn(async (url: string) => {
      calls.push(String(url));
      if (String(url).includes("thaiwater.net")) throw new Error("connect timeout");
      return new Response(JSON.stringify({ generated_at: new Date().toISOString(), water: [], rain: [] }), { status: 200 });
    }));
    await expect(probeRainfall()).rejects.toThrow();
    expect(calls.filter((u) => u.includes("flood.nonarkara.org"))).toHaveLength(1);
  });

  it("the EWS probe reaches the origin", async () => {
    let called = 0;
    vi.stubGlobal("fetch", vi.fn(async () => {
      called++;
      return new Response(JSON.stringify([]), { status: 200 });
    }));
    await expect(probeEwsStations()).rejects.toThrow();
    expect(called).toBeGreaterThan(0);
  });
});
