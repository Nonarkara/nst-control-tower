import { afterEach, beforeEach, expect, it, vi } from "vitest";
import type { RelayResponse } from "./floodDashRelay.js";
vi.mock("./floodDashRelay.js", async importOriginal => ({
  ...await importOriginal<typeof import("./floodDashRelay.js")>(),
  fetchRelay: vi.fn(),
}));
import { fetchRelay } from "./floodDashRelay.js";
import { fetchFloodObservations } from "./floodOperations.js";
import { buildDeskAnswer, riverPart, withSource } from "./mayorDesk.js";

const now = Date.parse("2026-10-29T00:20:00Z");
const observation = "2026-10-29T00:10:00.000Z";
const fetchedAt = "2026-10-29T00:18:00.000Z";
const water = { key: "current", name_th: "Test gauge", lat: 8.43, lng: 99.96,
  obs_time: observation, age_min: 10, meta: { min_bank: 3 }, wl_msl: 1 };
const rain = { key: "current-rain", name_th: "Test rain", lat: 8.43, lng: 99.96,
  obs_time: observation, age_min: 10, rain_24h: 0 };
beforeEach(() => { vi.useFakeTimers({ toFake: ["Date"] }); vi.setSystemTime(now); });
afterEach(() => vi.useRealTimers());

it("carries excluded stations through normalization into the mayor's coverage and wording", async () => {
  const relay: RelayResponse = { generated_at: fetchedAt, relayFetchedAt: fetchedAt,
    water: [water, { ...water, key: "silent", age_min: 361 }, { ...water, key: "unplaced", lat: null }],
    rain: [rain, { ...rain, key: "silent-rain", age_min: 361 }],
  };
  vi.mocked(fetchRelay).mockResolvedValue(relay);
  const feeds = await fetchFloodObservations();
  expect(feeds.water.features).toHaveLength(1);
  const part = withSource(riverPart(feeds.water.features, now), feeds.water.meta);
  expect(part.level).toBe("good"); // preserve the measurement at the reporting gauge
  expect(part.coverageIncomplete).toBe(true);
  expect(part.th).toContain("อีก 2 สถานี");
  expect(part.en).toContain("2 station(s) excluded");
  expect(buildDeskAnswer([part])).toMatchObject({ level: "unknown", missing: 1 });
  expect(feeds.water.meta).toMatchObject({ excludedStationCount: 2, fetchedAt, fallbackTier: "live" });
  expect(feeds.rain.meta).toMatchObject({ excludedStationCount: 1, fetchedAt });
  expect(feeds.water.features[0].observedAt).toBe(observation);
});

it("does not invent missing stations when every relayed row is usable", async () => {
  vi.mocked(fetchRelay).mockResolvedValue({ generated_at: fetchedAt, water: [water], rain: [rain] });
  const feeds = await fetchFloodObservations();
  expect(feeds.water.meta).toMatchObject({ excludedStationCount: 0 });
  const part = withSource(riverPart(feeds.water.features, now), feeds.water.meta);
  expect(part.coverageIncomplete).toBe(false);
  expect(part.th).not.toContain("สถานีไม่มีข้อมูลที่ใช้ได้");
});
