import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { fetchRelay, RELAY_URL } from "./floodDashRelay";
import { withCacheLifetime } from "../lib/cache";
const now = Date.parse("2026-11-03T00:00:00Z");
const snapshot = (age: number, fetchedAge = 0) => ({ generated_at: new Date(now - fetchedAge).toISOString(), relayFetchedAt: new Date(now - fetchedAge).toISOString(),
  water: [{key:"water",wl_msl:1,lat:8.4,lng:99.9,obs_time:new Date(now-age).toISOString(),age_min:age/60_000}],
  rain: [{key:"rain",rain_1h:1,lat:8.4,lng:99.9,obs_time:new Date(now-age).toISOString(),age_min:age/60_000}],
});
beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(now); });
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });
for (const fetchedAge of [10_000, 90*60_000]) {
  it(`awaits current observations when all cached rows expired despite a ${fetchedAge}ms retrieval age`, async () => {
    const old = snapshot(121*60_000, fetchedAge), fresh = snapshot(10*60_000);
    vi.stubGlobal("caches", {default:{match:async()=>Response.json(old),put:async()=>{}}});
    let release!: () => void;
    vi.stubGlobal("fetch", vi.fn(() => new Promise(resolve => { release = () => resolve(Response.json(fresh)); })));
    const lifetime: Promise<unknown>[] = []; let settled = false;
    const work = withCacheLifetime(p=>lifetime.push(p),()=>fetchRelay().then(r=>{settled=true;return r;}));
    await vi.advanceTimersByTimeAsync(1);
    expect(settled).toBe(false);
    release(); const result = await work;
    expect(result.water[0].obs_time).toBe(fresh.water[0].obs_time);
    expect(result.rain[0].obs_time).toBe(fresh.rain[0].obs_time);
    await Promise.allSettled(lifetime);
  });
}
it("keeps a usable cached feed available while refreshing its expired companion",async()=>{
  const old = snapshot(121*60_000,90*60_000);
  old.water = snapshot(10*60_000).water;
  vi.stubGlobal("caches", {default:{match:async(req:Request)=>req.url===RELAY_URL?Response.json(old):undefined,put:async()=>{}}});
  vi.stubGlobal("fetch", vi.fn(async()=>{throw new Error("origin down");}));
  const lifetime: Promise<unknown>[]=[];
  const result=await withCacheLifetime(p=>lifetime.push(p),()=>fetchRelay());
  expect(result.water[0].obs_time).toBe(old.water[0].obs_time);
  expect(result.relayFromCache).toBe(true);
  await Promise.allSettled(lifetime);
});
