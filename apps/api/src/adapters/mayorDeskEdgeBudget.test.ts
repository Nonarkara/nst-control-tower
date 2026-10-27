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
