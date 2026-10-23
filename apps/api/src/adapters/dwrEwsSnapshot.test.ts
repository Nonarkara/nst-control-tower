import {afterEach,describe,it,expect,vi} from "vitest";
const stamp=new Date(Date.now()-120_000).toISOString();
const observation=new Date(Date.now()-30*60_000).toISOString();
const snapshot={features:[{id:"critical",status:3,stale:false,observedAt:observation}],meta:{source:"dwr-ews",fetchedAt:stamp,ageMinutes:0,fallbackTier:"live"}};
function cachesFor(key:string,body:unknown){const store=new Map([[key,Response.json(body)]]);return{store,default:{match:async(r:Request)=>store.get(r.url)?.clone(),put:async(r:Request,s:Response)=>{store.set(r.url,s);}}};}
afterEach(()=>{vi.unstubAllGlobals();vi.restoreAllMocks();});
describe("DWR snapshots across cold workers",()=>{
 it("preserves a critical warning and its original clocks during a522 refresh",async()=>{
  vi.resetModules();
  const {fetchEwsStations,DWR_SNAPSHOT_KEY}=await import("./dwrEws");
  const {withCacheLifetime}=await import("../lib/cache");
  const c=cachesFor(DWR_SNAPSHOT_KEY,snapshot);vi.stubGlobal("caches",c);
  vi.stubGlobal("fetch",vi.fn(async()=>new Response("origin timeout",{status:522})));
  const work:Promise<unknown>[]=[];
  const feed=await withCacheLifetime(p=>{work.push(p);},()=>fetchEwsStations());
  await Promise.all(work);
  expect(feed.meta).toMatchObject({fetchedAt:stamp,ageMinutes:2,fallbackTier:"cache"});
  expect(feed.features[0]).toMatchObject({status:3,observedAt:observation});
  expect((await c.store.get(DWR_SNAPSHOT_KEY)!.clone().json() as typeof snapshot).meta.fetchedAt).toBe(stamp);
 });
 it("does not turn expired or future snapshots into fresh normal observations",async()=>{
  for(const offset of [-121*60_000,6*60_000]){
   vi.resetModules();const {fetchEwsStations,DWR_SNAPSHOT_KEY}=await import("./dwrEws");
   vi.stubGlobal("caches",cachesFor(DWR_SNAPSHOT_KEY,{...snapshot,meta:{...snapshot.meta,fetchedAt:new Date(Date.now()+offset).toISOString()}}));
   vi.stubGlobal("fetch",vi.fn(async()=>new Response("down",{status:522})));
   const feed=await fetchEwsStations();expect(feed.meta.fallbackTier).toBe("unavailable");expect(feed.features).toEqual([]);
  }
 });
 it("an empty source response cannot overwrite a last-good warning",async()=>{
  vi.resetModules();const {fetchEwsStations,DWR_SNAPSHOT_KEY}=await import("./dwrEws");const {withCacheLifetime}=await import("../lib/cache");
  const c=cachesFor(DWR_SNAPSHOT_KEY,snapshot);vi.stubGlobal("caches",c);vi.stubGlobal("fetch",vi.fn(async()=>Response.json([])));
  const work:Promise<unknown>[]=[];const feed=await withCacheLifetime(p=>{work.push(p);},()=>fetchEwsStations());await Promise.all(work);
  expect(feed.features[0].status).toBe(3);expect(feed.meta.fallbackTier).toBe("cache");expect((await c.store.get(DWR_SNAPSHOT_KEY)!.clone().json() as typeof snapshot).meta.fetchedAt).toBe(stamp);
 });
});
