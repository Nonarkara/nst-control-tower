import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { cachedWithStale, hasCacheEntry, setCache, withCacheLifetime } from "./cache";

const MAX_AGE = 15 * 60_000;
type Evidence = { generatedAt: number; value: string };
const retain = (v: Evidence) => Date.now() - v.generatedAt <= MAX_AGE;
const entry = (age = 0): Evidence => ({ generatedAt: Date.now() - age, value: "last observation" });
let serial = 0;
const key = () => `retention-${++serial}`;
beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(new Date("2026-11-02T18:00:00Z")); });
afterEach(() => vi.useRealTimers());

it("rejects an over-age snapshot even during a future cache/cooldown expiry", async () => {
  const k = key(), old = entry(MAX_AGE + 1), fresh = entry();
  setCache(k, old, 3600);
  const compute = vi.fn(async () => fresh);
  expect(await cachedWithStale(k, 60, compute, 900, true, retain)).toBe(fresh);
  expect(compute).toHaveBeenCalledOnce();
});
it("does not let an expired entry suppress edge reseeding after persistence hydration", () => {
  const k = key();
  setCache(k, entry(MAX_AGE + 1), 3600); // a restored/retried TTL cannot renew evidence time
  expect(hasCacheEntry(k, retain)).toBe(false);
  expect(hasCacheEntry(k)).toBe(false);
});
it("does not extend evidence retention with repeated failed refresh cooldowns", async () => {
  const k = key(), old = entry(MAX_AGE - 1000);
  setCache(k, old, -1);
  const life: Promise<unknown>[] = [];
  expect(await withCacheLifetime(p => life.push(p), () => cachedWithStale(k, 60, async () => { throw new Error("down"); }, 900, true, retain))).toBe(old);
  await Promise.allSettled(life);
  await vi.advanceTimersByTimeAsync(2000);
  await expect(cachedWithStale(k, 60, async () => { throw new Error("still down"); }, 900, true, retain)).rejects.toThrow();
});
it("cannot return stale evidence when a foreground failure crosses its age limit", async () => {
  const k = key(); setCache(k, entry(MAX_AGE - 1000), -1);
  let fail!: (e: Error) => void;
  const work = cachedWithStale(k, 60, () => new Promise<Evidence>((_, reject) => { fail = reject; }), 900, false, retain);
  const assertion = expect(work).rejects.toThrow();
  await vi.advanceTimersByTimeAsync(2000); fail(new Error("down")); await assertion;
});
it("rechecks a shared refresh result against the waiting caller's retention policy", async () => {
  const k = key(), old = entry(MAX_AGE - 1000); setCache(k, old, -1);
  let fail!: (e: Error) => void;
  const owner = cachedWithStale(k, 60, () => new Promise<Evidence>((_, reject) => { fail = reject; }));
  const waiter = cachedWithStale(k, 60, async () => entry(), 900, false, retain);
  const result = Promise.allSettled([owner, waiter]);
  await vi.advanceTimersByTimeAsync(2000); fail(new Error("down"));
  expect(await result).toMatchObject([{ status: "fulfilled", value: old }, { status: "rejected" }]);
});
it("keeps existing stale behavior for callers without a retention policy", async () => {
  const k = key(), old = entry(MAX_AGE * 5); setCache(k, old, -1);
  expect(await cachedWithStale(k, 60, async () => { throw new Error("down"); })).toBe(old);
});
it("a background refresh crossing the age bound releases pending work without an unhandled rejection", async () => {
  const k = key(), old = entry(MAX_AGE - 1000); setCache(k, old, -1);
  let fail!: (e: Error) => void;
  expect(await cachedWithStale(k, 60, () => new Promise<Evidence>((_, reject) => { fail = reject; }), 900, true, retain)).toBe(old);
  await vi.advanceTimersByTimeAsync(2000); fail(new Error("down"));
  await vi.advanceTimersByTimeAsync(1);
  const fresh = entry();
  expect(await cachedWithStale(k, 60, async () => fresh, 900, true, retain)).toBe(fresh);
});
