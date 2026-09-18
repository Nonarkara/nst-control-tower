import { describe, expect, test } from "vitest";
import { fetchIsochrone } from "./isochrone";

describe("fetchIsochrone", () => {
  test("missing key returns unavailable with an explanatory note (never a throw)", async () => {
    const feed = await fetchIsochrone(99.96, 8.43, 15, "walk", undefined);
    expect(feed.features).toEqual([]);
    expect(feed.meta.fallbackTier).toBe("unavailable");
    expect(feed.meta.note).toMatch(/GEOAPIFY_API_KEY/);
  });

  test("empty-string key behaves like a missing key", async () => {
    const feed = await fetchIsochrone(99.96, 8.43, 15, "drive", "");
    expect(feed.meta.fallbackTier).toBe("unavailable");
    expect(feed.meta.note).toBeTruthy();
  });
});
