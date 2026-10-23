import { describe, it, expect, vi, afterEach } from "vitest";
import { fetchRelay, RELAY_TIMEOUT_MS } from "./floodDashRelay";

const payload = { generated_at: "2026-10-21T00:00:00Z", water: [], rain: [] };

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

  it("waits longer than FloodDash's measured 10 s cold compute", () => {
    expect(RELAY_TIMEOUT_MS).toBeGreaterThan(15_000);
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
    expect(out.water).toEqual([]);
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
});

it("a hung cache read cannot indefinitely block live relay fallback", async () => {
  vi.useFakeTimers();
  vi.stubGlobal("caches", {default:{match: () => new Promise(() => {}), put: async () => {}}});
  vi.stubGlobal("fetch", vi.fn(async () => Response.json(payload)));
  try {
    const work = fetchRelay();
    await vi.advanceTimersByTimeAsync(1_001);
    expect(await work).toEqual(payload);
    expect(fetch).toHaveBeenCalledTimes(1);
  } finally { vi.useRealTimers(); vi.unstubAllGlobals(); }
});
