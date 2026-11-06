import {afterEach,describe,it,expect,vi} from "vitest";
const stamp=new Date(Date.now()-120_000).toISOString();
const observation=new Date(Date.now()-30*60_000).toISOString();
const snapshot={features:[{id:"critical",status:3,stale:false,observedAt:observation}],meta:{source:"dwr-ews",fetchedAt:stamp,ageMinutes:0,fallbackTier:"live"}};
function cachesFor(key:string,body:unknown){const store=new Map([[key,Response.json(body)]]);return{store,default:{match:async(r:Request)=>store.get(r.url)?.clone(),put:async(r:Request,s:Response)=>{store.set(r.url,s);}}};}
afterEach(()=>{vi.useRealTimers();vi.unstubAllGlobals();vi.restoreAllMocks();});
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
 it.each([3,6])("keeps %s-hour-old warning evidence without declaring it current",async(hours)=>{
  const now=Date.now();vi.spyOn(Date,"now").mockReturnValue(now);
  vi.resetModules();const {fetchEwsStations,DWR_SNAPSHOT_KEY}=await import("./dwrEws");
  const {withCacheLifetime}=await import("../lib/cache");const {officialPart}=await import("./mayorDesk");
  const oldStamp=new Date(now-hours*3600_000).toISOString();
  const oldObservation=new Date(now-(hours+1)*3600_000).toISOString();
  const old={...snapshot,features:[{...snapshot.features[0],observedAt:oldObservation}],meta:{...snapshot.meta,fetchedAt:oldStamp}};
  const c=cachesFor(DWR_SNAPSHOT_KEY,old);vi.stubGlobal("caches",c);
  vi.stubGlobal("fetch",vi.fn(async()=>new Response("down",{status:522})));
  const work:Promise<unknown>[]=[];
  const feed=await withCacheLifetime(p=>work.push(p),()=>fetchEwsStations());await Promise.all(work);
  expect(feed.meta).toMatchObject({fetchedAt:oldStamp,ageMinutes:hours*60,fallbackTier:"cache"});
  expect(feed.features[0]).toMatchObject({status:3,observedAt:oldObservation,stale:true});
  expect(officialPart(feed.features,Date.now())).toMatchObject({level:"unknown"});
  expect(officialPart(feed.features,Date.now()).declared).not.toBe(true);
  expect((await c.store.get(DWR_SNAPSHOT_KEY)!.clone().json() as typeof old).meta.fetchedAt).toBe(oldStamp);
  vi.mocked(Date.now).mockReturnValue(now+(6-hours)*3600_000+1);
  const expiredWork:Promise<unknown>[]=[];
  const expired=await withCacheLifetime(p=>expiredWork.push(p),()=>fetchEwsStations());await Promise.all(expiredWork);
  expect(expired.features).toEqual([]);
  expect(expired.meta).toMatchObject({fetchedAt:oldStamp,fallbackTier:"unavailable"});
 });
 it("ages each observation independently of a recent snapshot retrieval",async()=>{
  const now=Date.now();vi.spyOn(Date,"now").mockReturnValue(now);
  vi.resetModules();const {fetchEwsStations,DWR_SNAPSHOT_KEY}=await import("./dwrEws");
  const {withCacheLifetime}=await import("../lib/cache");
  const features=[-120*60_000,-120*60_000-1,6*60_000,null].map((offset,i)=>({
    ...snapshot.features[0],id:`clock-${i}`,observedAt:offset==null?"invalid":new Date(now+offset).toISOString(),
  }));
  vi.stubGlobal("caches",cachesFor(DWR_SNAPSHOT_KEY,{...snapshot,features,meta:{...snapshot.meta,fetchedAt:new Date(now-120_000).toISOString()}}));
  vi.stubGlobal("fetch",vi.fn(async()=>new Response("down",{status:522})));
  const work:Promise<unknown>[]=[];
  const feed=await withCacheLifetime(p=>work.push(p),()=>fetchEwsStations());await Promise.all(work);
  expect(feed.features.map(s=>s.stale)).toEqual([false,true,true,true]);
  expect(feed.features.map(s=>s.status)).toEqual([3,3,3,3]);
  expect(feed.features.map(s=>s.observedAt)).toEqual(features.map(s=>s.observedAt));
 });
 it("stores fresh snapshots for six hours without changing their clocks",async()=>{
  vi.useFakeTimers();vi.setSystemTime(new Date("2026-11-06T08:00:00Z"));
  vi.resetModules();const {probeEwsStations,DWR_SNAPSHOT_KEY}=await import("./dwrEws");
  const c=cachesFor(DWR_SNAPSHOT_KEY,snapshot);vi.stubGlobal("caches",c);
  vi.stubGlobal("fetch",vi.fn(async()=>Response.json([{stn:"TEST",province:"นครศรีธรรมราช",latitude:"8.4",longitude:"99.9",date:"06/11/69 09:30 น.",status:"3"}])));
  const feed=await probeEwsStations();const saved=c.store.get(DWR_SNAPSHOT_KEY)!;
  expect(feed.features[0].stale).toBe(true); // recent retrieval cannot revive an old observation
  expect(saved.headers.get("cache-control")).toBe("public, max-age=21600");
  expect((await saved.clone().json() as typeof snapshot).meta.fetchedAt).toBe(feed.meta.fetchedAt);
 });
 it("does not turn expired or future snapshots into fresh normal observations",async()=>{
  for(const offset of [-361*60_000,6*60_000,null]){
   vi.resetModules();const {fetchEwsStations,DWR_SNAPSHOT_KEY}=await import("./dwrEws");
   vi.stubGlobal("caches",cachesFor(DWR_SNAPSHOT_KEY,{...snapshot,meta:{...snapshot.meta,fetchedAt:offset==null?"invalid":new Date(Date.now()+offset).toISOString()}}));
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
