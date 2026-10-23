import { withCacheLifetime } from "../lib/cache";
import { describe, it, expect, vi, afterEach } from "vitest";
import { fetchRelay, relaySnapshotMeta, RELAY_URL, RELAY_TIMEOUT_MS } from "./floodDashRelay";

const payload = { generated_at: "2026-10-21T00:00:00Z", water: [{key:"test",wl_msl:1,name_th:"test",lat:8.4,lng:99.9,obs_time:new Date().toISOString(),age_min:0}], rain: [{key:"rain",name_th:"rain",lat:8.4,lng:99.9,obs_time:new Date().toISOString(),age_min:0,rain_1h:1}] };

function fakeCaches() {
  const store = new Map<string, Response>();
  return {
    store,
    default: {
      match: async (r: Request) => store.get(r.url)?.clone(),
      put: async (r: Request, res: Response) => { store.set(r.url, res); },
    },
  };
}

describe("FloodDash relay — shared edge cache + patient timeout", () => {
  afterEach(() => { vi.unstubAllGlobals(); });

  it("waits longer than FloodDash's measured cold compute", () => {
    // Measured 23 Oct 2026 against the live origin: 13.7 s and 14.8 s on
    // cache misses. The budget must outlast that with room to spare — a
    // timeout here leaves the shared cache empty, so the next request pays
    // the same timeout and fails the same way. The 16 s budget that was
    // here until then left a 6 % margin on it, and the margin is what was
    // spent: the 23 Oct outage logged requests failing "around 16.2–16.4 s".
    expect(RELAY_TIMEOUT_MS).toBeGreaterThan(20_000);
  });

  it("asks FloodDash once, then serves later callers from the edge cache", async () => {
    vi.stubGlobal("caches", fakeCaches());
    const f = vi.fn(async () => new Response(JSON.stringify(payload), { status: 200 }));
    vi.stubGlobal("fetch", f);
    await fetchRelay();
    await fetchRelay();
    await fetchRelay();
    expect(f).toHaveBeenCalledTimes(1);
  });

  it("a corrupt cache entry is ignored, not trusted", async () => {
    const c = fakeCaches();
    c.store.set("https://flood.nonarkara.org/api/province/stations?code=80", new Response(JSON.stringify({ nope: 1 })));
    vi.stubGlobal("caches", c);
    const f = vi.fn(async () => new Response(JSON.stringify(payload), { status: 200 }));
    vi.stubGlobal("fetch", f);
    const out = await fetchRelay();
    expect(out.water).toEqual(payload.water);
    expect(f).toHaveBeenCalledTimes(1);
  });

  it("works with no Cache API at all (node/tests/older runtimes)", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify(payload), { status: 200 })));
    await expect(fetchRelay()).resolves.toBeTruthy();
  });

  it("a failed fetch is logged and rethrown so the stale snapshot is served", async () => {
    vi.stubGlobal("caches", fakeCaches());
    vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("boom"); }));
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    await expect(fetchRelay()).rejects.toThrow();
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it("a timed-out cold-cache read still leaves a repair attempt running", async () => {
    // The shared cache is written only after a successful fetch, so a cold
    // read that times out leaves it empty and the next request repeats the
    // same timeout. One more attempt must survive the failed read.
    const c = fakeCaches();
    vi.stubGlobal("caches", c);
    let calls = 0;
    vi.stubGlobal("fetch", vi.fn(async () => {
      calls++;
      if (calls === 1) throw new Error("Upstream timed out after 25000ms");
      return Response.json(payload);
    }));
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const work: Promise<unknown>[] = [];
    await withCacheLifetime(p => { work.push(p); }, async () => {
      await expect(fetchRelay()).rejects.toThrow();
    });
    await Promise.all(work);
    expect(calls).toBe(2);
    expect(c.store.has(RELAY_URL)).toBe(true);
    warn.mockRestore();
  });

  it("an empty reply is a stable condition — it is not retried", async () => {
    // The origin answered; it simply had nothing. Another attempt would
    // double the load on an origin that is already struggling.
    const c = fakeCaches();
    vi.stubGlobal("caches", c);
    let calls = 0;
    vi.stubGlobal("fetch", vi.fn(async () => {
      calls++;
      return Response.json({ generated_at: new Date().toISOString(), water: [], rain: [] });
    }));
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const work: Promise<unknown>[] = [];
    await withCacheLifetime(p => { work.push(p); }, async () => {
      await expect(fetchRelay()).rejects.toThrow();
    });
    await Promise.all(work);
    expect(calls).toBe(1);
    warn.mockRestore();
  });
});

it("a hung cache read cannot indefinitely block live relay fallback", async () => {
  vi.useFakeTimers();
  vi.stubGlobal("caches", {default:{match: () => new Promise(() => {}), put: async () => {}}});
  vi.stubGlobal("fetch", vi.fn(async () => Response.json(payload)));
  try {
    const work = fetchRelay();
    await vi.advanceTimersByTimeAsync(1_001);
    expect(await work).toMatchObject(payload);
    expect(fetch).toHaveBeenCalledTimes(1);
  } finally { vi.useRealTimers(); vi.unstubAllGlobals(); }
});


describe("shared last-good snapshot survives cold-isolate source outages", () => {
  afterEach(() => {vi.unstubAllGlobals(); vi.restoreAllMocks();});
  it("returns the aged snapshot immediately while failed refresh stays attached to its request", async () => {
    const c = fakeCaches(); const storedAt = new Date(Date.now()-120_000).toISOString();
    c.store.set(RELAY_URL, Response.json({...payload,relayFetchedAt:storedAt}));
    vi.stubGlobal("caches", c);
    let rejectFetch!: (err: Error) => void;
    vi.stubGlobal("fetch", vi.fn(() => new Promise<Response>((_resolve,reject) => {rejectFetch=reject;})));
    const work: Promise<unknown>[] = [];
    const snapshot = await withCacheLifetime(p => {work.push(p);}, () => fetchRelay());
    expect(snapshot.relayFromCache).toBe(true);
    expect(relaySnapshotMeta(snapshot)).toMatchObject({fetchedAt:storedAt,ageMinutes:2,fallbackTier:"cache"});
    expect(snapshot.water).toEqual(payload.water);
    rejectFetch(new Error("origin unavailable")); await Promise.all(work);
    expect((await c.store.get(RELAY_URL)!.clone().json() as {relayFetchedAt:string}).relayFetchedAt).toBe(storedAt);
  });
  it("an empty HTTP200 refresh cannot replace a useful snapshot", async () => {
    const c = fakeCaches();const storedAt = new Date(Date.now()-120_000).toISOString();
    c.store.set(RELAY_URL,Response.json({...payload,relayFetchedAt:storedAt}));
    vi.stubGlobal("caches",c);vi.stubGlobal("fetch",vi.fn(async()=>Response.json({generated_at:new Date().toISOString(),water:[],rain:[]})));
    const work:Promise<unknown>[]=[];
    const old = await withCacheLifetime(p=>{work.push(p);},()=>fetchRelay()); await Promise.all(work);
    expect(old.relayFromCache).toBe(true);
    expect((await c.store.get(RELAY_URL)!.clone().json() as {relayFetchedAt:string}).relayFetchedAt).toBe(storedAt);
  });
  it("rejects expired and future snapshots rather than renewing their clocks", async () => {
    for (const offset of [-121*60_000,6*60_000]) {
      const c=fakeCaches();c.store.set(RELAY_URL,Response.json({...payload,relayFetchedAt:new Date(Date.now()+offset).toISOString()}));
      vi.stubGlobal("caches",c);vi.stubGlobal("fetch",vi.fn(async()=>{throw new Error("down");}));
      await expect(fetchRelay()).rejects.toThrow();
    }
  });
});

it("partial or invalid refresh cannot erase either shared last-good feed", async () => {
  const c = fakeCaches(); const storedAt = new Date(Date.now()-120_000).toISOString();
  vi.stubGlobal("caches", c);
  try {
    for (const water of [[], [{...payload.water[0],obs_time:"invalid"}]]) {
      c.store.set(RELAY_URL,Response.json({...payload,relayFetchedAt:storedAt}));
      vi.stubGlobal("fetch",vi.fn(async()=>Response.json({...payload,water})));
      const work:Promise<unknown>[]=[];
      await withCacheLifetime(p=>{work.push(p);},()=>fetchRelay()); await Promise.all(work);
      expect(await c.store.get(RELAY_URL)!.clone().json()).toMatchObject({water:payload.water,rain:payload.rain,relayFetchedAt:storedAt});
    }
  } finally {vi.unstubAllGlobals();}
});
