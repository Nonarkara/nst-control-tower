import {it,expect,vi,afterEach} from "vitest";
vi.mock("./floodOperations.js",()=>({fetchFloodObservations:async()=>({water:{features:[]},rain:{features:[]}}),fetchFloodWeather:async()=>({points:[],fetchedAt:new Date().toISOString()})}));
vi.mock("./dwrEws.js",()=>({fetchEwsStations:async()=>({features:[],meta:{source:"DWR",fetchedAt:new Date().toISOString(),fallbackTier:"unavailable"}})}));
vi.mock("./news.js",()=>({fetchNews:async()=>({features:[]})}));
afterEach(()=>{vi.useRealTimers();vi.unstubAllGlobals();vi.restoreAllMocks();vi.resetModules();});
for(const hung of ["read","body"]){
 it(`a hung edge ${hung} cannot block a usable partial desk`,async()=>{
  vi.resetModules();vi.useFakeTimers();
  vi.stubGlobal("caches",{default:{match:()=>hung==="read"?new Promise(()=>{}):Promise.resolve({json:()=>new Promise(()=>{})}),put:async()=>{}}});
  vi.spyOn(console,"warn").mockImplementation(()=>{});
  const {fetchMayorDesk}=await import("./mayorDesk");
  let result:Awaited<ReturnType<typeof fetchMayorDesk>>|undefined;
  const work=fetchMayorDesk().then(v=>{result=v;});
  await vi.advanceTimersByTimeAsync(1_001);
  expect(result?.features[0]?.parts).toHaveLength(4);
  expect(result?.features[0]?.level).toBe("unknown");
  await work;
 });
}
it("a hung edge write runs in the request lifetime without holding the response",async()=>{
 vi.resetModules();vi.useFakeTimers();
 vi.stubGlobal("caches",{default:{match:async()=>undefined,put:()=>new Promise(()=>{})}});vi.spyOn(console,"warn").mockImplementation(()=>{});
 const {fetchMayorDesk}=await import("./mayorDesk");const {withCacheLifetime}=await import("../lib/cache");
 const lifetime:Promise<unknown>[]=[];let result:unknown;
 const work=withCacheLifetime(p=>{lifetime.push(p);},()=>fetchMayorDesk().then(v=>{result=v;}));
 await vi.advanceTimersByTimeAsync(1);
 expect(result).toBeTruthy();expect(lifetime).toHaveLength(5);
 await vi.advanceTimersByTimeAsync(1_001);await work;await Promise.all(lifetime);
});
it("a malformed cached desk falls through instead of breaking current synthesis",async()=>{
 vi.resetModules();vi.stubGlobal("caches",{default:{match:async()=>Response.json({features:[{generatedAt:new Date().toISOString()}],meta:{fetchedAt:new Date().toISOString()}}),put:async()=>{}}});
 const {fetchMayorDesk}=await import("./mayorDesk");
 const result=await fetchMayorDesk();expect(result.features[0].parts).toHaveLength(4);expect(result.features[0].level).toBe("unknown");
});

it("future/expired edge snapshots cannot renew their clocks",async()=>{
 vi.resetModules();
 const first=await (await import("./mayorDesk")).fetchMayorDesk();
 for(const offset of [-31*60_000,6*60_000]){
  vi.resetModules();const stamp=new Date(Date.now()+offset).toISOString();
  const stale={...first,features:[{...first.features[0],generatedAt:stamp}],meta:{...first.meta,fetchedAt:stamp}};
  vi.stubGlobal("caches",{default:{match:async()=>Response.json(stale),put:async()=>{}}});
  const result=await (await import("./mayorDesk")).fetchMayorDesk();
  expect(result.features[0].generatedAt).not.toBe(stamp);
 }
});

it("four valid parts plus a corrupt extra row cannot seed a crashing snapshot",async()=>{
 vi.resetModules();
 const first=await (await import("./mayorDesk")).fetchMayorDesk();
 vi.resetModules();
 vi.stubGlobal("caches",{default:{match:async()=>Response.json({...first,features:[{...first.features[0],parts:[...first.features[0].parts,null]}]}),put:async()=>{}}});
 const result=await (await import("./mayorDesk")).fetchMayorDesk();
 expect(result.features[0].parts).toHaveLength(4);
});

it("expired in-memory/cooldown evidence cannot block a newer edge seed",async()=>{
 vi.resetModules();vi.useFakeTimers();vi.setSystemTime(new Date("2026-11-03T00:00:00Z"));
 const {fetchMayorDesk,DESK_RETENTION_MS}=await import("./mayorDesk");
 const first=await fetchMayorDesk();
 await vi.advanceTimersByTimeAsync(DESK_RETENTION_MS+1);
 const stamp=new Date().toISOString();
 const newer={...first,features:[{...first.features[0],generatedAt:stamp}],meta:{...first.meta,fetchedAt:stamp}};
 const match=vi.fn(async()=>Response.json(newer));
 vi.stubGlobal("caches",{default:{match,put:async()=>{}}});
 const {setCache,withCacheLifetime}=await import("../lib/cache");
 setCache("mayor-desk",first,3600); // model disk hydration/retry extending cache TTL
 const lifetime:Promise<unknown>[]=[];
 const result=await withCacheLifetime(p=>lifetime.push(p),()=>fetchMayorDesk());
 expect(match).toHaveBeenCalledOnce();expect(result.features[0].generatedAt).toBe(stamp);
 await Promise.allSettled(lifetime);
});
it("Mayor retention uses both original clocks, including after a TTL renewal",async()=>{
 const {fetchMayorDesk,canRetainDesk,DESK_RETENTION_MS}=await import("./mayorDesk");
 const first=await fetchMayorDesk();
 expect(canRetainDesk(first)).toBe(true);
 const old=new Date(Date.now()-DESK_RETENTION_MS-1).toISOString();
 expect(canRetainDesk({...first,features:[{...first.features[0],generatedAt:old}]})).toBe(false);
 expect(canRetainDesk({...first,meta:{...first.meta,fetchedAt:old}})).toBe(false);
});
