import { describe, it, expect } from "vitest";
import { NST, YALA, CHONBURI, NST_PROVINCE_BBOX } from "./campus";

describe("NST campus config", () => {
  it("YALA/CHONBURI are legacy aliases for NST", () => {
    expect(YALA).toBe(NST);
    expect(CHONBURI).toBe(NST);
  });

  it("has center inside Nakhon Si Thammarat's latitude band", () => {
    const [lng, lat] = NST.center;
    expect(lat).toBeGreaterThan(8);
    expect(lat).toBeLessThan(9);
    expect(lng).toBeGreaterThan(99);
    expect(lng).toBeLessThan(100);
  });

  it("outerBounds enclose the center point", () => {
    const [[minLng, minLat], [maxLng, maxLat]] = NST.outerBounds;
    const [lng, lat] = NST.center;
    expect(minLng).toBeLessThan(lng);
    expect(maxLng).toBeGreaterThan(lng);
    expect(minLat).toBeLessThan(lat);
    expect(maxLat).toBeGreaterThan(lat);
  });

  it("outerBounds enclose innerBounds", () => {
    const [[oMinLng, oMinLat], [oMaxLng, oMaxLat]] = NST.outerBounds;
    const [[iMinLng, iMinLat], [iMaxLng, iMaxLat]] = NST.innerBounds;
    expect(oMinLng).toBeLessThanOrEqual(iMinLng);
    expect(oMaxLng).toBeGreaterThanOrEqual(iMaxLng);
    expect(oMinLat).toBeLessThanOrEqual(iMinLat);
    expect(oMaxLat).toBeGreaterThanOrEqual(iMaxLat);
  });

  it("defaultView is inside outerBounds at a reasonable zoom", () => {
    const [[minLng, minLat], [maxLng, maxLat]] = NST.outerBounds;
    const { longitude, latitude, zoom } = NST.defaultView;
    expect(longitude).toBeGreaterThanOrEqual(minLng);
    expect(longitude).toBeLessThanOrEqual(maxLng);
    expect(latitude).toBeGreaterThanOrEqual(minLat);
    expect(latitude).toBeLessThanOrEqual(maxLat);
    // City-scale boot: tight enough to pan, close enough to read the Old Town.
    expect(zoom).toBeGreaterThanOrEqual(13);
    expect(zoom).toBeLessThan(16);
    expect(Math.hypot(longitude - NST.center[0], latitude - NST.center[1])).toBeLessThan(0.05);
  });

  it("province bbox encloses the city center", () => {
    const [[minLng, minLat], [maxLng, maxLat]] = NST_PROVINCE_BBOX;
    const [lng, lat] = NST.center;
    expect(lng).toBeGreaterThanOrEqual(minLng);
    expect(lng).toBeLessThanOrEqual(maxLng);
    expect(lat).toBeGreaterThanOrEqual(minLat);
    expect(lat).toBeLessThanOrEqual(maxLat);
  });

  it("has trilingual name fields", () => {
    expect(NST.name.en).toBeTruthy();
    expect(NST.name.th).toBeTruthy();
    expect(NST.name.zh).toBeTruthy();
  });
});
