import { describe, it, expect, vi } from "vitest";
import { cached, cachedWithStale, setCache, cacheAgeMinutes, snapshotCache } from "./cache";

function nextKey(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

describe("cache: basic cached()", () => {
  it("returns the computed value on first call and caches it", async () => {
    const key = nextKey("basic");
    let calls = 0;
    const compute = async () => {
      calls++;
      return { value: 42 };
    };
    const a = await cached(key, 60, compute);
    const b = await cached(key, 60, compute);
    expect(a).toEqual({ value: 42 });
    expect(b).toEqual({ value: 42 });
    expect(calls).toBe(1);
  });

  it("deduplicates concurrent in-flight requests", async () => {
    const key = nextKey("dedup");
    let calls = 0;
    const compute = async () => {
      calls++;
      await new Promise((r) => setTimeout(r, 30));
      return { value: calls };
    };
    const [a, b, c] = await Promise.all([
      cached(key, 60, compute),
      cached(key, 60, compute),
      cached(key, 60, compute),
    ]);
    expect(calls).toBe(1);
    expect(a).toEqual(b);
    expect(b).toEqual(c);
  });

  it("re-fetches after the TTL expires", async () => {
    const key = nextKey("ttl");
    let calls = 0;
    await cached(key, 0, async () => { calls++; return calls; });
    // TTL = 0 → entry is "expired" the moment we try to read it again
    await new Promise((r) => setTimeout(r, 5));
    await cached(key, 0, async () => { calls++; return calls; });
    expect(calls).toBe(2);
  });
});

describe("cache: cachedWithStale()", () => {
  it("returns stale value when compute throws", async () => {
    const key = nextKey("stale");
    // Seed a fresh value
    await cachedWithStale(key, 0, async () => ({ value: "fresh" }));
    await new Promise((r) => setTimeout(r, 5));
    // Now compute fails → should return the stale value
    const result = await cachedWithStale(key, 0, async () => {
      throw new Error("upstream down");
    });
    expect(result).toEqual({ value: "fresh" });
  });

  it("dedups concurrent calls — burst at expiry triggers ONE upstream call", async () => {
    const key = nextKey("stale-dedup");
    let upstream = 0;
    const compute = async () => {
      upstream++;
      await new Promise((r) => setTimeout(r, 20));
      return { value: upstream };
    };
    const [a, b, c] = await Promise.all([
      cachedWithStale(key, 60, compute),
      cachedWithStale(key, 60, compute),
      cachedWithStale(key, 60, compute),
    ]);
    expect(upstream).toBe(1);
    expect(a).toEqual({ value: 1 });
    expect(b).toEqual({ value: 1 });
    expect(c).toEqual({ value: 1 });
  });

  it("throws if no stale value AND compute throws", async () => {
    const key = nextKey("stale-fail");
    await expect(
      cachedWithStale(key, 60, async () => { throw new Error("first call failed"); }),
    ).rejects.toThrow();
  });

  it("serveStaleWhileRevalidate: a failed background refresh re-caches with a SHORT cooldown, not the full staleTtlSeconds", async () => {
    const key = nextKey("stale-swr-fail");
    const staleTtlSeconds = 86400; // 24h — should NOT end up as the new expiry

    // Seed an entry, then let it expire.
    await cachedWithStale(key, 0, async () => ({ value: "fresh" }), staleTtlSeconds, true);
    await new Promise((r) => setTimeout(r, 5));

    // Trigger a background refresh that fails. The call returns the stale
    // value immediately; we need to wait for the background .catch() to run.
    const result = await cachedWithStale(
      key,
      0,
      async () => {
        throw new Error("upstream permanently down");
      },
      staleTtlSeconds,
      true,
    );
    expect(result).toEqual({ value: "fresh" });

    // Let the background refresh's .catch() handler run and re-cache.
    await new Promise((r) => setTimeout(r, 20));

    const snap = snapshotCache();
    const reCached = snap[key];
    expect(reCached).toBeDefined();
    // The bug: re-stamping with staleTtlSeconds gives ~24h left. The fix:
    // the new expiry should be close to the short retry cooldown (~60s),
    // definitely under a couple of minutes — nowhere near 24h.
    const msRemaining = (reCached?.expiresAt ?? 0) - Date.now();
    expect(msRemaining).toBeGreaterThan(0);
    expect(msRemaining).toBeLessThanOrEqual(60_000);
  });
});

describe("cache: cacheAgeMinutes", () => {
  it("returns 0 for the current moment", () => {
    expect(cacheAgeMinutes(new Date().toISOString())).toBe(0);
  });

  it("returns roughly N minutes for an N-min-old timestamp", () => {
    const ten = new Date(Date.now() - 10 * 60_000).toISOString();
    expect(cacheAgeMinutes(ten)).toBe(10);
  });

  it("returns 0 for an invalid timestamp", () => {
    expect(cacheAgeMinutes("not-a-date")).toBe(0);
  });
});

describe("cache: LRU eviction", () => {
  it("evicts the least-recently-USED entry, not the oldest-inserted one", async () => {
    // Fill the store to MAX_ENTRIES (200) with a unique prefix, then touch
    // the very first key via a fresh cached() read so it's no longer the
    // least-recently-used entry. Insert one more to force eviction: under
    // pure FIFO the touched key would be evicted anyway (it was inserted
    // first); under LRU it survives because the touch moved it to the MRU
    // end, and the entry right after it (never touched) is evicted instead.
    const prefix = nextKey("lru");
    const keys: string[] = [];
    for (let i = 0; i < 200; i++) {
      const k = `${prefix}-${i}`;
      keys.push(k);
      setCache(k, { i }, 60);
    }

    // Touch the oldest-inserted key — this should move it to the MRU end.
    const touched = await cached(keys[0], 60, async () => ({ i: 0 }));
    expect(touched).toEqual({ i: 0 });

    // One more insert pushes size to 201 → evictIfNeeded() removes exactly
    // one entry: whichever is now least-recently-used.
    setCache(`${prefix}-overflow`, { overflow: true }, 60);

    const snap = snapshotCache();
    expect(snap[keys[0]]).toBeDefined(); // survived because it was touched
    expect(snap[keys[1]]).toBeUndefined(); // now the LRU victim instead
  });

  it("setCache on an existing key also counts as a use (moves it to MRU)", () => {
    const prefix = nextKey("lru-write");
    const keys: string[] = [];
    for (let i = 0; i < 200; i++) {
      const k = `${prefix}-${i}`;
      keys.push(k);
      setCache(k, { i }, 60);
    }

    // Re-write (refresh) the oldest key — should move it to MRU end.
    setCache(keys[0], { i: 0, refreshed: true }, 60);

    // Force eviction.
    setCache(`${prefix}-overflow`, { overflow: true }, 60);

    const snap = snapshotCache();
    expect(snap[keys[0]]).toBeDefined();
    expect(snap[keys[1]]).toBeUndefined();
  });
});

describe("cache: setCache + snapshotCache", () => {
  it("setCache → snapshotCache round-trips a value", () => {
    const key = nextKey("snap");
    setCache(key, { hello: "world" }, 60);
    const snap = snapshotCache();
    expect(snap[key]?.data).toEqual({ hello: "world" });
    expect(snap[key]?.expiresAt).toBeGreaterThan(Date.now());
  });

  it("snapshotCache excludes already-expired entries", () => {
    const key = nextKey("expired");
    setCache(key, "old", 0);
    // Wait one tick so Date.now() exceeds expiresAt
    return new Promise<void>((resolve) => setTimeout(() => {
      const snap = snapshotCache();
      expect(snap[key]).toBeUndefined();
      resolve();
    }, 5));
  });
});

// Regression coverage for a bug seen live in production: a Promise.all of two
// upstream fetches never settled inside a Cloudflare Workers isolate even
// though each individual fetch has its own AbortController timeout — the
// caller hung indefinitely because cachedWithStale's cold-start path had no
// safety net of its own (unlike cached(), which already raced a 60s timeout).
describe("cache: hang safety (compute() that never settles)", () => {
  it("cached() rejects with a timeout instead of hanging forever", async () => {
    vi.useFakeTimers();
    const key = nextKey("hang-cached");
    const compute = () => new Promise<never>(() => {}); // never settles

    const promise = cached(key, 60, compute);
    const assertion = expect(promise).rejects.toThrow(/Cache compute timeout/);
    await vi.advanceTimersByTimeAsync(60_000);
    await assertion;

    vi.useRealTimers();
  });

  it("cachedWithStale() on a cold start (no stale entry) rejects with a timeout instead of hanging forever", async () => {
    vi.useFakeTimers();
    const key = nextKey("hang-stale-cold");
    const compute = () => new Promise<never>(() => {}); // never settles

    const promise = cachedWithStale(key, 60, compute);
    const assertion = expect(promise).rejects.toThrow(/Cache compute timeout/);
    await vi.advanceTimersByTimeAsync(60_000);
    await assertion;

    vi.useRealTimers();
  });

  it("cachedWithStale() with a stale entry still serves it promptly even if the background refresh never settles", async () => {
    const key = nextKey("hang-stale-serve");
    setCache(key, { value: "stale-but-good" }, -1); // already-expired stale entry
    const compute = () => new Promise<never>(() => {}); // background refresh never settles

    const result = await cachedWithStale(key, 60, compute, 86400, true);
    expect(result).toEqual({ value: "stale-but-good" });
  });
});
