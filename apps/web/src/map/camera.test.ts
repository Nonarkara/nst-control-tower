import { describe, expect, it } from "vitest";
import { NST } from "@nst/shared";
import {
  MAP_MAX_ZOOM,
  MAP_MIN_ZOOM,
  boundsLngSpanDeg,
  cityCenterDeltaDeg,
  viewportFillsBounds,
  viewportLngSpanDeg,
} from "./camera";

describe("map camera — pan room", () => {
  it("default view sits on the city, not a locked province overview", () => {
    expect(cityCenterDeltaDeg(NST.defaultView)).toBeLessThan(0.05);
    expect(NST.defaultView.zoom).toBeGreaterThanOrEqual(13);
    expect(NST.defaultView.zoom).toBeLessThan(16);
  });

  it("min zoom is below the old clamp that locked pan at boot", () => {
    expect(MAP_MIN_ZOOM).toBeLessThan(8);
    expect(MAP_MAX_ZOOM).toBeGreaterThan(NST.defaultView.zoom);
  });

  it("boot zoom leaves pan room inside the data outerBounds", () => {
    expect(viewportFillsBounds(NST.defaultView.zoom, NST.outerBounds)).toBe(false);
  });

  it("the old province boot (zoom 8.4 + tight outerBounds) DID fill the viewport", () => {
    // Regression lock: that combo is why drag felt frozen.
    expect(viewportFillsBounds(8.4, NST.outerBounds)).toBe(true);
    expect(boundsLngSpanDeg(NST.outerBounds)).toBeLessThan(viewportLngSpanDeg(8.4));
  });

  it("viewport span shrinks as zoom increases", () => {
    expect(viewportLngSpanDeg(14)).toBeLessThan(viewportLngSpanDeg(8.4));
  });
});
