/**
 * Heritage3DDemo — the attribution and dimension contract.
 *
 * This file exists because the previous version of the heritage panel was
 * confidently, visibly wrong in three ways at once, and none of them broke a
 * test: it credited "CyArk / Agisoft / CC BY-NC-SA" for a model the Sketchfab
 * API attributes to Phantasma Labs under CC BY 4.0; it built every outbound
 * link as `sketchfab.com/3d-models/none-<uid>`, so the credit and the
 * "Open on Sketchfab" button 404'd while the embed still worked; and it
 * presented AYUTTHAYA photogrammetry as evidence for the NAKHON SI THAMMARAT
 * World Heritage candidacy. A green suite is not a correctness argument.
 *
 * Verified against the live Sketchfab API on 2026-09-28.
 */
import { describe, it, expect } from "vitest";
import {
  SKETCHFAB_UID,
  SKETCHFAB_AUTHOR,
  SKETCHFAB_LICENCE,
  SKETCHFAB_URL,
  UNESCO,
} from "./Heritage3DDemo";
import { CHEDI_HEIGHT_M, CHEDI_WIDTH_M } from "../lib/mahatat3d";

describe("the model we actually credit", () => {
  it("names the real author, not the one previously claimed", () => {
    // Sketchfab API: user.displayName = "Phantasma Labs"
    expect(SKETCHFAB_AUTHOR).toBe("Phantasma Labs");
    expect(SKETCHFAB_AUTHOR).not.toMatch(/cyark|agisoft/i);
  });

  it("states the real licence, CC BY 4.0", () => {
    // Sketchfab API: license.fullName = "Creative Commons Attribution"
    expect(SKETCHFAB_LICENCE).toBe("CC BY 4.0");
    expect(SKETCHFAB_LICENCE).not.toMatch(/nc|noncommercial/i);
  });

  it("builds a clean viewer URL with no stray placeholder prefix", () => {
    // The old code emitted ".../3d-models/none-<uid>". "none" was a search
    // result placeholder for a null author, and it shipped into the href.
    expect(SKETCHFAB_URL).toBe(`https://sketchfab.com/3d-models/${SKETCHFAB_UID}`);
    expect(SKETCHFAB_URL).not.toMatch(/none-/);
    expect(SKETCHFAB_UID).toMatch(/^[0-9a-f]{32}$/);
  });
});

describe("the UNESCO candidacy figures the panel publishes", () => {
  it("matches the nomination: H 28 wa x W 14 wa at 1 wa = 2 m", () => {
    expect(UNESCO.heightM).toBe(56);
    expect(UNESCO.widthM).toBe(28);
    expect(UNESCO.heightM / UNESCO.widthM).toBe(2); // the deliberate 2:1
  });

  it("carries the tilt and the zoning, which are the engineering claims", () => {
    expect(UNESCO.leanDeg).toBe(1.45);
    expect(UNESCO.coreRai).toBe(46);
    expect(UNESCO.bufferRai).toBe(3000);
    expect(UNESCO.tentativeList).toBe(2013);
    expect(UNESCO.criteria).toEqual(["i", "ii", "vi"]);
  });
});

describe("the map's chedi agrees with the panel's chedi", () => {
  it("the modelled chedi is the nominated size, not a stylised one", () => {
    // Guards the exact regression: the model summed to 48 m and was then
    // multiplied by the buildings layer's 1.65 elevationScale, so it drew a
    // World Heritage monument 40% too tall.
    expect(CHEDI_HEIGHT_M).toBeCloseTo(UNESCO.heightM, 1);
    expect(CHEDI_WIDTH_M).toBe(UNESCO.widthM);
  });
});
