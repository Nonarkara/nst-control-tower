import {it,expect,vi,afterEach} from "vitest";
const state=vi.hoisted(()=>({release:undefined as undefined|((value:unknown)=>void)}));
vi.mock("./floodOperations.js",()=>({
 fetchFloodWeather:()=>new Promise(resolve=>{state.release=resolve;}),
 fetchFloodOperations:vi.fn(()=>{throw new Error("Optional camera/context bundle must never be requested");}),
 fetchFloodObservations:async()=>({
  water:{features:[{id:"danger",name:"Measured dangerous water",stationCode:"TEST",diffFromBank:.2,trend:"rising",levelPrev:1,observedAt:new Date().toISOString()}],meta:{source:"HII",fetchedAt:new Date().toISOString(),ageMinutes:0,fallbackTier:"live"}},
  rain:{features:[{id:"rain",name:"Rain",amphoe:"Test",rain24h:0,observedAt:new Date().toISOString()}],meta:{source:"HII",fetchedAt:new Date().toISOString(),ageMinutes:0,fallbackTier:"live"}},
 }),
}));
vi.mock("./dwrEws.js",()=>({fetchEwsStations:async()=>({features:[],meta:{source:"DWR",fetchedAt:new Date().toISOString(),ageMinutes:0,fallbackTier:"unavailable"}})}));
vi.mock("./news.js",()=>({fetchNews:async()=>({features:[],meta:{source:"news",fetchedAt:new Date().toISOString(),ageMinutes:0,fallbackTier:"live"}})}));
afterEach(()=>{vi.useRealTimers();});
it("fast hazardous water survives stalled camera/context synthesis within the response budget",async()=>{
 vi.useFakeTimers();
 const {fetchMayorDesk}=await import("./mayorDesk.js");const {withCacheLifetime}=await import("../lib/cache.js");
 const lifetime:Promise<unknown>[]=[];
 const result=withCacheLifetime(p=>{lifetime.push(p);},()=>fetchMayorDesk());
 await vi.advanceTimersByTimeAsync(14_001);
 const feed=await result;const desk=feed.features[0];
 expect(desk.level).toBe("critical");expect(desk.answerTh).toContain("Measured dangerous water");
 expect(desk.parts.find(p=>p.key==="river")?.sourceTier).toBe("live");
 expect(desk.parts.find(p=>p.key==="forecast")?.level).toBe("unknown");
 expect(desk.gaps).toContain("Rain forecast source unavailable or exceeded its deadline");
 const {fetchFloodOperations}=await import("./floodOperations.js");expect(fetchFloodOperations).not.toHaveBeenCalled();
 state.release?.({features:[],meta:{}});await Promise.all(lifetime);
});
