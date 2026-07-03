// Per-isolate in-memory cache with TTL + promise dedup.
// In Cloudflare Workers, this lives for the lifetime of the isolate (minutes
// to hours per region). On cold start it's empty — adapters refetch.

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const MAX_ENTRIES = 200;
// When a background stale-while-revalidate refresh fails, we re-cache the
// stale data with this SHORT cooldown instead of the full staleTtlSeconds.
// Otherwise a permanently broken upstream (decommissioned endpoint, revoked
// key) would re-stamp the same stale entry with a fresh ~24h expiry on every
// failed attempt, and the outage becomes invisible (fast-path cache hit,
// no error, no retry) for up to a full day, repeating forever.
const STALE_REFRESH_RETRY_COOLDOWN_MS = 60_000;
// Map iteration order = insertion order, and `Map.set()` on an EXISTING key
// does NOT move it. We rely on that for LRU: every read and every write
// deletes-then-re-inserts the key so it always lands at the "newest" end.
// That makes `store.keys()` order genuinely oldest-used → newest-used, so
// evictIfNeeded() below can just delete from the front.
const store = new Map<string, CacheEntry<unknown>>();
const pending = new Map<string, Promise<unknown>>();

/** Move `key` to the "most recently used" end of the store, if present. */
function touch(key: string): void {
  const entry = store.get(key);
  if (entry === undefined) return;
  store.delete(key);
  store.set(key, entry);
}

function evictIfNeeded() {
  if (store.size < MAX_ENTRIES) return;
  const toDelete = store.size - MAX_ENTRIES + 1;
  let i = 0;
  for (const key of store.keys()) {
    if (i >= toDelete) break;
    store.delete(key);
    i++;
  }
}

export function setCache<T>(key: string, data: T, ttlSeconds: number): void {
  // A write to an existing key counts as a "use" — drop the old slot first
  // so the re-insert below lands at the MRU end instead of staying put.
  store.delete(key);
  evictIfNeeded();
  store.set(key, { data, expiresAt: Date.now() + ttlSeconds * 1000 });
}

export async function cached<T>(
  key: string,
  ttlSeconds: number,
  compute: () => Promise<T>,
): Promise<T> {
  const entry = store.get(key);
  if (entry && Date.now() <= entry.expiresAt) {
    touch(key);
    return entry.data as T;
  }
  if (entry) store.delete(key);

  const inflight = pending.get(key);
  if (inflight) return inflight as Promise<T>;

  const promise = compute()
    .then((result) => {
      setCache(key, result, ttlSeconds);
      pending.delete(key);
      return result;
    })
    .catch((err) => {
      pending.delete(key);
      throw err;
    });

  pending.set(key, promise);

  // Safety: if compute hangs forever, don't leak beyond 60 s
  let timer: ReturnType<typeof setTimeout> | null = null;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      pending.delete(key);
      reject(new Error(`Cache compute timeout for ${key}`));
    }, 60_000);
  });

  const clearTimer = () => {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
  };

  return Promise.race([promise.then((v) => { clearTimer(); return v; }).catch((e) => { clearTimer(); throw e; }), timeout]);
}

export function cacheAgeMinutes(fetchedAt: string): number {
  const t = new Date(fetchedAt).getTime();
  if (Number.isNaN(t)) return 0;
  return Math.max(0, Math.round((Date.now() - t) / 60000));
}

/**
 * Stale-tolerant variant: if compute throws, fall back to the previously
 * cached value (even if expired). Use for upstream APIs with tight rate
 * limits so the dashboard keeps showing the last known value.
 *
 * Like `cached`, it deduplicates concurrent in-flight requests via `pending`
 * so a burst of requests at cache-expiry time triggers only one upstream call.
 */
export async function cachedWithStale<T>(
  key: string,
  ttlSeconds: number,
  compute: () => Promise<T>,
  staleTtlSeconds: number = 86400,
  /** Serve an EXPIRED entry immediately and refresh in the background — for
   *  slow upstreams (e.g. the multi-candidate WRF run discovery) where
   *  pinning a request for tens of seconds behind the refresh is worse than
   *  momentarily-older data. */
  serveStaleWhileRevalidate: boolean = false,
): Promise<T> {
  const entry = store.get(key);
  if (entry && Date.now() <= entry.expiresAt) {
    touch(key);
    return entry.data as T;
  }

  if (entry && serveStaleWhileRevalidate && !pending.has(key)) {
    // Kick the refresh (deduplicated via `pending`) but answer NOW.
    const refresh = compute()
      .then((fresh) => {
        setCache(key, fresh, ttlSeconds);
        pending.delete(key);
        return fresh;
      })
      .catch(() => {
        pending.delete(key);
        // Keep the stale entry alive so future reads still have it, but only
        // for a short cooldown — NOT the full staleTtlSeconds. Re-stamping
        // with staleTtlSeconds here would silently lock in a broken upstream
        // for up to a full day; a short cooldown means the next request
        // after ~60s triggers another background retry instead.
        setCache(key, entry.data, STALE_REFRESH_RETRY_COOLDOWN_MS / 1000);
        return entry.data as T;
      });
    pending.set(key, refresh as Promise<unknown>);
    return entry.data as T;
  }
  if (entry && serveStaleWhileRevalidate) return entry.data as T; // refresh already in flight

  // Deduplicate: if a refresh is already in-flight, share it
  const inflight = pending.get(key);
  if (inflight) {
    return inflight.catch(() => {
      // If the shared promise failed, return stale if available
      if (entry) return entry.data as T;
      throw new Error(`No data available for ${key}`);
    }) as Promise<T>;
  }

  const staleEntry = entry; // capture before async gap
  const promise = compute()
    .then((fresh) => {
      setCache(key, fresh, ttlSeconds);
      pending.delete(key);
      return fresh;
    })
    .catch((err) => {
      pending.delete(key);
      if (staleEntry) {
        // Reinstate stale entry briefly so subsequent reads don't re-fail
        setCache(key, staleEntry.data, staleTtlSeconds);
        return staleEntry.data as T;
      }
      throw err;
    });

  pending.set(key, promise as Promise<unknown>);
  return promise;
}

/**
 * Snapshot of the live in-memory cache, used by the Node persistence layer
 * to flush to disk. Returns a JSON-serialisable plain object.
 */
export function snapshotCache(): Record<string, { data: unknown; expiresAt: number }> {
  const out: Record<string, { data: unknown; expiresAt: number }> = {};
  const now = Date.now();
  for (const [k, v] of store.entries()) {
    if (v.expiresAt > now) out[k] = { data: v.data, expiresAt: v.expiresAt };
  }
  return out;
}
