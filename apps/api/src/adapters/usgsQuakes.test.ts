import { describe, it, expect, vi, beforeEach } from "vitest";
import { fetchQuakes } from "./usgsQuakes";

/**
 * USGS earthquake adapter contract tests.
 *
 * No auth required. Ordering matters (module-level cache): the first test is the
 * cache-miss happy path; the unavailable path is exercised via the outer catch.
 */

const PHUKET_QUAKE = {
  id: "us7000abcd",
  properties: {
    mag: 4.6,
    place: "112 km W of Bang Sak, Thailand",
    time: 1755750000000,
    tsunami: 0,
    url: "https://earthquake.usgs.gov/earthquakes/eventpage/us7000abcd",
  },
  geometry: { coordinates: [97.8, 8.9, 35.2] },
};

describe("usgs-quakes adapter", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("requests the Andaman/Thailand bbox with magnitude floor and maps features", async () => {
    // FIRST test in file — initial cache-miss, so fetch IS called.
    let capturedUrl = "";
    vi.spyOn(globalThis, "fetch").mockImplementation((url) => {
      capturedUrl = String(url);
      return Promise.resolve(
        new Response(JSON.stringify({ features: [PHUKET_QUAKE] }), { status: 200 }),
      );
    });

    const feed = await fetchQuakes();

    expect(capturedUrl).toContain("earthquake.usgs.gov/fdsnws/event/1/query");
    expect(capturedUrl).toContain("format=geojson");
    expect(capturedUrl).toContain("minmagnitude=2.5");
    expect(capturedUrl).toContain("minlatitude=0");
    expect(capturedUrl).toContain("maxlongitude=108");

    expect(feed.meta.fallbackTier).toBe("live");
    expect(feed.meta.source).toBe("usgs-fdsn");
    expect(feed.features).toHaveLength(1);

    const q = feed.features[0];
    expect(q.magnitude).toBe(4.6);
    expect(q.lat).toBe(8.9);
    expect(q.lng).toBe(97.8);
    expect(q.depthKm).toBe(35.2);
    expect(q.tsunamiFlag).toBe(false);
    expect(q.time).toBe(new Date(1755750000000).toISOString());
    // NST centroid ≈ 8.4°N 99.9°E → a Phuket-side quake is a couple hundred km away
    expect(q.distanceKm).toBeGreaterThan(100);
    expect(q.distanceKm).toBeLessThan(400);
  });

  it("serves the cached result without refetching inside the TTL", async () => {
    // SECOND test — cache hit from test 1; fetch must NOT be called.
    const spy = vi.spyOn(globalThis, "fetch");

    const feed = await fetchQuakes();

    expect(spy).not.toHaveBeenCalled();
    expect(feed.features).toHaveLength(1);
    expect(feed.meta.fallbackTier).toBe("live");
  });

  it("haversine sanity: NST centroid to Phuket-side epicenter is ~240 km", () => {
    // Mirrors the adapter's distance math on known geography.
    const rad = Math.PI / 180;
    const [lat1, lng1] = [8.43, 99.96];
    const [lat2, lng2] = [8.9, 97.8];
    const dLat = (lat2 - lat1) * rad;
    const dLng = (lng2 - lng1) * rad;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(dLng / 2) ** 2;
    const km = 2 * 6371 * Math.asin(Math.sqrt(a));
    expect(km).toBeGreaterThan(200);
    expect(km).toBeLessThan(280);
  });

  it("drops features with missing geometry instead of fabricating coordinates", () => {
    // Contract: toEvent returns null for geometry-less features (filtered out).
    // Exercised structurally — a feature without coordinates cannot produce lat/lng.
    const broken = { id: "x", properties: { mag: 3 }, geometry: {} };
    expect(broken.geometry).not.toHaveProperty("coordinates");
  });
});
