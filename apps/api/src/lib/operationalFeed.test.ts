import { describe, it, expect } from "vitest";
import { ageOperationalFeed } from "./operationalFeed";
import type { NormalizedFeed } from "@nst/shared";
const now = Date.parse("2026-10-23T08:00:00Z");
const snapshot = (offset: number): NormalizedFeed<number> => ({features:[1],meta:{source:"test",fetchedAt:new Date(now-offset).toISOString(),ageMinutes:0,fallbackTier:"live"}});
describe("operational feed clock after all cache layers",()=>{
  it("retains original clocks and changes live to cache during repeated stale fallback",()=>{
    const feed=snapshot(0);
    for(const minutes of [1,30,119]) {
      const aged=ageOperationalFeed(feed,now+minutes*60_000);
      expect(aged.features).toEqual([1]);
      expect(aged.meta).toMatchObject({fetchedAt:feed.meta.fetchedAt,ageMinutes:minutes,fallbackTier:"cache"});
    }
    expect(ageOperationalFeed(feed,now+121*60_000).features).toEqual([]);
  });
  it("rejects expired, future and invalid clocks even if the outer cache says live",()=>{
    for(const feed of [snapshot(121*60_000),snapshot(-6*60_000),{...snapshot(0),meta:{...snapshot(0).meta,fetchedAt:"invalid"}}]) {
      expect(ageOperationalFeed(feed,now)).toMatchObject({features:[],meta:{fallbackTier:"unavailable"}});
    }
  });
  it("does not promote a cache or scenario feed to live",()=>{
    for(const fallbackTier of ["cache","scenario"] as const) expect(ageOperationalFeed({...snapshot(0),meta:{...snapshot(0).meta,fallbackTier}},now).meta.fallbackTier).toBe(fallbackTier);
  });
});
