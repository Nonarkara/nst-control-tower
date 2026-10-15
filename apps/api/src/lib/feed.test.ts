import { afterEach, expect, it, vi } from "vitest";
import { safeFeed } from "./feed.js";

afterEach(() => vi.useRealTimers());

it("ages a cached feed at response time without changing the cached object", async () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-10-15T12:30:00Z"));
  const original = { features: [{ value: 1 }], meta: {
    source: "test-feed", fetchedAt: "2026-10-15T12:00:00Z", ageMinutes: 0, fallbackTier: "live" as const,
  } };
  const headers = new Headers();
  const res = await safeFeed({
    header: (key, value) => headers.set(key, value),
    json: (value, status) => Response.json(value, { status, headers }),
  }, async () => original);
  expect(res.headers.get("x-age-minutes")).toBe("30");
  expect((await res.json() as typeof original).meta.ageMinutes).toBe(30);
  expect(original.meta.ageMinutes).toBe(0);
});
