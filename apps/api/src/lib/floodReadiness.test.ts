import { describe, it, expect } from "vitest";
import type { NormalizedFeed } from "@nst/shared";
import { assessFloodFeed } from "./floodReadiness";
const now = Date.parse("2026-10-23T07:00:00Z");
const feed = (observedAt: string, tier = "live"): NormalizedFeed<{observedAt: string; value: number | null}> => ({ features: [{observedAt, value: 0}], meta: { source: "test", fetchedAt: new Date(now).toISOString(), ageMinutes: 0, fallbackTier: tier as "live" } });
const usable = (row: {value: number | null}) => row.value != null && Number.isFinite(row.value);
describe("flood readiness uses observation age, never envelope age alone", () => {
  it("accepts measured zero but rejects missing values and empty coverage", () => {
    const f = feed(new Date(now).toISOString());
    expect(assessFloodFeed(f, usable, now).available).toBe(true);
    f.features[0].value = null;
    expect(assessFloodFeed(f, usable, now).available).toBe(false);
    f.features = [];
    expect(assessFloodFeed(f, usable, now).oldestObservationMinutes).toBeNull();
  });
  it("rejects stale, future, invalid and scenario observations even in a fresh envelope", () => {
    for (const at of ["bad", new Date(now-121*60_000).toISOString(), new Date(now+6*60_000).toISOString()]) expect(assessFloodFeed(feed(at), usable, now).available).toBe(false);
    expect(assessFloodFeed(feed(new Date(now).toISOString(), "scenario"), usable, now).available).toBe(false);
  });
  it("requires recent source contact as well as recent readings", () => {
    const f = feed(new Date(now).toISOString()); f.meta.fetchedAt = new Date(now-6*60_000).toISOString();
    expect(assessFloodFeed(f, usable, now).available).toBe(false);
  });
});
