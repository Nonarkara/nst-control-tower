import { describe, it, expect, vi, beforeEach } from "vitest";
import { fetchPrecipNowcast, fetchZonePrecipNowcast } from "./precipNowcast";

/**
 * Precipitation nowcast adapter contract tests.
 *
 * Tests verify URL construction, NormalizedFeed shape, intensity
 * classification, firstSignificantAt / minutesToSignificant derivation,
 * and unavailable fallback tier on API failure.
 *
 * URL-capture test is FIRST — subsequent tests use the cached result.
 */

const NOW_ISO = "2026-01-01T08:00:00+07:00";
const NOW_MS = new Date(NOW_ISO).getTime();

// Bangkok is UTC+7. The adapter does `new Date(at + "+07:00")` to parse Open-Meteo
// timestamps, so we must generate times in Bangkok local time — not UTC.
const BANGKOK_OFFSET_MS = 7 * 60 * 60_000;

/** Build a minutely_15 block with N 15-min steps starting from nowMs (Bangkok time). */
function makeSeries(mmValues: number[], probValues?: number[]) {
  const times: string[] = [];
  const precipitation: number[] = [];
  const precipitation_probability: number[] = [];
  const pad = (n: number) => String(n).padStart(2, "0");
  for (let i = 0; i < mmValues.length; i++) {
    // Shift to Bangkok local time so getUTC* returns Bangkok hours/minutes.
    const t = new Date(NOW_MS + i * 15 * 60_000 + BANGKOK_OFFSET_MS);
    // Format as "YYYY-MM-DDTHH:MM" — adapter will append "+07:00" before parsing.
    times.push(
      `${t.getUTCFullYear()}-${pad(t.getUTCMonth() + 1)}-${pad(t.getUTCDate())}T${pad(t.getUTCHours())}:${pad(t.getUTCMinutes())}`
    );
    precipitation.push(mmValues[i]);
    precipitation_probability.push(probValues?.[i] ?? 50);
  }
  return { time: times, precipitation, precipitation_probability };
}

/**
 * The adapter now makes ONE multi-location Open-Meteo call covering all 4
 * WATERSHED_FORECAST_POINTS points (thung-song, khiri-wong, lan-saka, city —
 * that order), which Open-Meteo answers with an ARRAY of 4 per-point objects.
 * fetchPrecipNowcast() reads only the LAST ("city") entry, so these tests put
 * the scenario under test there and leave the 3 upstream points flat/dry —
 * matching what fetchZonePrecipNowcast's own tests exercise separately.
 */
function makeMinutely(mmValues: number[], probValues?: number[]) {
  const citySeries = makeSeries(mmValues, probValues);
  const drySeries = makeSeries(mmValues.map(() => 0));
  return [
    { minutely_15: drySeries },
    { minutely_15: drySeries },
    { minutely_15: drySeries },
    { minutely_15: citySeries },
  ];
}

describe("precipNowcast adapter", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.setSystemTime(NOW_MS);
  });

  it("requests Open-Meteo minutely_15 endpoint for Nakhon Si Thammarat", async () => {
    let capturedUrl = "";
    vi.spyOn(globalThis, "fetch").mockImplementation((url) => {
      capturedUrl = String(url);
      return Promise.resolve(
        new Response(JSON.stringify(makeMinutely([0, 0, 0, 0, 0, 0, 0, 0])), { status: 200 }),
      );
    });

    await fetchPrecipNowcast();

    expect(capturedUrl).toContain("open-meteo.com");
    expect(capturedUrl).toContain("minutely_15=precipitation");
    // Yala lat/lng approx
    expect(capturedUrl).toMatch(/latitude=8\./);
    expect(capturedUrl).toMatch(/longitude=99\./);
  });

  it("returns NormalizedFeed with live tier and correct shape on success", async () => {
    // Uses cached result from first test
    const feed = await fetchPrecipNowcast();

    expect(feed.meta.source).toBe("open-meteo-minutely");
    expect(feed.meta.fallbackTier).toBe("live");
    expect(feed.features.length).toBe(1);

    const s = feed.features[0];
    expect(s).toHaveProperty("nowMm");
    expect(s).toHaveProperty("total2hMm");
    expect(s).toHaveProperty("peakMm");
    expect(s).toHaveProperty("intensity");
    expect(s).toHaveProperty("points");
  });
});

describe("precipNowcast adapter — intensity classification (isolated)", () => {
  beforeEach(() => {
    vi.setSystemTime(NOW_MS);
  });

  it("classifies dry when all mm = 0", async () => {
    vi.resetModules();
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify(makeMinutely([0, 0, 0, 0, 0, 0, 0, 0])), { status: 200 }),
    );
    const { fetchPrecipNowcast: fresh } = await import("./precipNowcast");
    const feed = await fresh();
    expect(feed.features[0].intensity).toBe("dry");
    expect(feed.features[0].firstSignificantAt).toBeNull();
    vi.restoreAllMocks();
  });

  it("classifies light when peak mm in [0.1, 1)", async () => {
    vi.resetModules();
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify(makeMinutely([0, 0.3, 0.4, 0, 0, 0, 0, 0])), { status: 200 }),
    );
    const { fetchPrecipNowcast: fresh } = await import("./precipNowcast");
    const feed = await fresh();
    expect(feed.features[0].intensity).toBe("light");
    vi.restoreAllMocks();
  });

  it("classifies moderate when peak mm in [1, 5)", async () => {
    vi.resetModules();
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify(makeMinutely([0, 1.5, 2.0, 1.0, 0, 0, 0, 0])), { status: 200 }),
    );
    const { fetchPrecipNowcast: fresh } = await import("./precipNowcast");
    const feed = await fresh();
    expect(feed.features[0].intensity).toBe("moderate");
    vi.restoreAllMocks();
  });

  it("classifies heavy when peak mm >= 5", async () => {
    vi.resetModules();
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify(makeMinutely([0, 0, 5.5, 3.0, 2.0, 0, 0, 0])), { status: 200 }),
    );
    const { fetchPrecipNowcast: fresh } = await import("./precipNowcast");
    const feed = await fresh();
    expect(feed.features[0].intensity).toBe("heavy");
    vi.restoreAllMocks();
  });
});

describe("precipNowcast adapter — minutesToSignificant (isolated)", () => {
  beforeEach(() => {
    vi.setSystemTime(NOW_MS);
  });

  it("sets firstSignificantAt at the first step >= 0.5 mm and minutesToSignificant=0 when it's the first slot", async () => {
    vi.resetModules();
    // First slot (i=0) has 0.6 mm → minutesToSignificant = (0+1)*15 - 15 = 0
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify(makeMinutely([0.6, 0, 0, 0, 0, 0, 0, 0])), { status: 200 }),
    );
    const { fetchPrecipNowcast: fresh } = await import("./precipNowcast");
    const feed = await fresh();
    const s = feed.features[0];
    expect(s.firstSignificantAt).not.toBeNull();
    expect(s.minutesToSignificant).toBe(0);
    vi.restoreAllMocks();
  });

  it("sets minutesToSignificant=30 when significant rain starts at index 2", async () => {
    vi.resetModules();
    // Indices 0,1 are dry; index 2 has 0.8 mm → minutesToSignificant = (2+1)*15 - 15 = 30
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify(makeMinutely([0, 0, 0.8, 0.5, 0, 0, 0, 0])), { status: 200 }),
    );
    const { fetchPrecipNowcast: fresh } = await import("./precipNowcast");
    const feed = await fresh();
    const s = feed.features[0];
    expect(s.minutesToSignificant).toBe(30);
    vi.restoreAllMocks();
  });
});

describe("precipNowcast adapter — unavailable fallback (isolated)", () => {
  beforeEach(() => {
    vi.setSystemTime(NOW_MS);
  });

  it("returns unavailable tier when API fails", async () => {
    vi.resetModules();
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(null, { status: 500 }),
    );
    const { fetchPrecipNowcast: fresh } = await import("./precipNowcast");
    const feed = await fresh();
    expect(feed.meta.fallbackTier).toBe("unavailable");
    expect(feed.features).toHaveLength(0);
    vi.restoreAllMocks();
  });

  it("returns unavailable tier when API returns no minutely_15 data", async () => {
    vi.resetModules();
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ latitude: 13.36, longitude: 100.98 }), { status: 200 }),
    );
    const { fetchPrecipNowcast: fresh } = await import("./precipNowcast");
    const feed = await fresh();
    expect(feed.meta.fallbackTier).toBe("unavailable");
    expect(feed.features).toHaveLength(0);
    vi.restoreAllMocks();
  });
});

describe("precipNowcast — stale fallback on upstream outage (isolated)", () => {
  it("keeps serving the LAST GOOD SNAPSHOT when Open-Meteo dies after the cache expires", async () => {
    vi.resetModules();
    vi.setSystemTime(NOW_MS);
    let upstreamDown = false;
    vi.spyOn(globalThis, "fetch").mockImplementation(() =>
      Promise.resolve(
        upstreamDown
          ? new Response(null, { status: 503 })
          : new Response(JSON.stringify(makeMinutely([0, 6, 4, 0, 0, 0, 0, 0])), { status: 200 }),
      ),
    );
    const { fetchPrecipNowcast: fresh, fetchZonePrecipNowcast: freshZones } = await import("./precipNowcast");

    const first = await fresh();
    expect(first.meta.fallbackTier).toBe("live");
    expect(first.features[0].intensity).toBe("heavy");

    // 31 minutes later (past the 30 min TTL) Open-Meteo is down mid-flood.
    upstreamDown = true;
    vi.setSystemTime(NOW_MS + 31 * 60_000);
    const second = await fresh();
    expect(second.meta.fallbackTier).toBe("live"); // stale good data, not a blank outage
    expect(second.features[0].intensity).toBe("heavy");
    const zones = await freshZones();
    expect(zones.features).toHaveLength(3);
    vi.restoreAllMocks();
  });
});

describe("fetchZonePrecipNowcast — upstream watershed zones (isolated)", () => {
  beforeEach(() => {
    vi.setSystemTime(NOW_MS);
  });

  it("requests one multi-location call and returns the 3 upstream zones (city excluded)", async () => {
    vi.resetModules();
    let capturedUrl = "";
    vi.spyOn(globalThis, "fetch").mockImplementation((url) => {
      capturedUrl = String(url);
      return Promise.resolve(
        new Response(JSON.stringify(makeMinutely([0, 0, 0, 0, 0, 0, 0, 0])), { status: 200 }),
      );
    });
    const { fetchZonePrecipNowcast: fresh } = await import("./precipNowcast");
    const feed = await fresh();

    // One call, 4 comma-joined coordinates — not 4 separate requests.
    expect(capturedUrl).toMatch(/latitude=8\.175,8\.4338,8\.4012,8\.4364/);
    expect(feed.features).toHaveLength(3);
    expect(feed.features.map((f) => f.zoneKey).sort()).toEqual(
      ["khiri-wong", "lan-saka", "thung-song"].sort(),
    );
    expect(feed.meta.fallbackTier).toBe("live");
    vi.restoreAllMocks();
  });

  it("distinguishes rain per zone — a wet thung-song point doesn't leak into khiri-wong/lan-saka", async () => {
    vi.resetModules();
    const wetThungSong = makeSeries([0, 6, 4, 0, 0, 0, 0, 0]); // heavy
    const dry = makeSeries([0, 0, 0, 0, 0, 0, 0, 0]);
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify([
          { minutely_15: wetThungSong }, // thung-song
          { minutely_15: dry },          // khiri-wong
          { minutely_15: dry },          // lan-saka
          { minutely_15: dry },          // city
        ]),
        { status: 200 },
      ),
    );
    const { fetchZonePrecipNowcast: fresh } = await import("./precipNowcast");
    const feed = await fresh();

    const thungSong = feed.features.find((f) => f.zoneKey === "thung-song");
    const khiriWong = feed.features.find((f) => f.zoneKey === "khiri-wong");
    expect(thungSong?.intensity).toBe("heavy");
    expect(khiriWong?.intensity).toBe("dry");
    vi.restoreAllMocks();
  });

  it("returns unavailable tier when the API fails", async () => {
    vi.resetModules();
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(null, { status: 500 }));
    const { fetchZonePrecipNowcast: fresh } = await import("./precipNowcast");
    const feed = await fresh();
    expect(feed.meta.fallbackTier).toBe("unavailable");
    expect(feed.features).toHaveLength(0);
    vi.restoreAllMocks();
  });
});
