/**
 * Are the 3D layers actually ON the map, or merely implemented?
 *
 * This file exists because of a specific, embarrassing failure. `mahatat3d.ts`
 * contained a full parametric model of the Phra Borommathat Chedi, dimensioned
 * to the UNESCO nomination, with 17 passing unit tests asserting its geometry
 * — and nothing imported it. It never rendered. The map showed flat 14 m amber
 * discs where the one real Nakhon Si Thammarat monument should be, and the
 * whole time the suite was green.
 *
 * A unit test on an exported function proves the function is correct. It says
 * nothing about whether anyone calls it. These tests read the actual source of
 * App.tsx and assert the layers are referenced in the layer-building code, which
 * is the only place that can answer the question a user is asking: "why can't
 * I see it?"
 *
 * The check is deliberately textual rather than a render test. A deck.gl layer
 * array needs a WebGL context and a loaded 15k-feature GeoJSON to assert
 * against; a source-level assertion is instant and fails for the exact reason
 * that matters (the wiring was never written).
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";

const APP = readFileSync(new URL("../App.tsx", import.meta.url), "utf8");
const PRESETS = readFileSync(new URL("./presetsLenses.ts", import.meta.url), "utf8");

/** Extract the `layers: [...]` array of one lens from presetsLenses.ts. */
function lensLayers(id: string): string[] {
  const i = PRESETS.indexOf(`    id: "${id}",`);
  expect(i, `lens "${id}" not found in presetsLenses.ts`).toBeGreaterThan(-1);
  // `layers: [` sits on its own line but the opening bracket is followed
  // directly by the first entry on the next line, so the `\n` belongs after
  // the bracket, not before it.
  const m = PRESETS.slice(i, i + 20_000).match(/layers:\s*\[([\s\S]*?)\n\s*\],/);
  expect(m, `could not parse layers for lens "${id}"`).toBeTruthy();
  return m![1]
    .split("\n")
    .map((l) => l.replace(/\/\/.*/, "").replace(/["',]/g, "").trim())
    .filter(Boolean);
}

describe("the 3D relief is enabled where the terrain answers the question", () => {
  // Without terrain-3d the map has extruded buildings on a flat plane, and
  // "which areas will be affected" is unanswerable: the whole risk surface of
  // Nakhon Si Thammarat is the Khao Luang watershed draining onto a plain.
  for (const lens of ["operations", "flood", "safety"]) {
    it(`lens "${lens}" ships terrain-3d by default`, () => {
      expect(lensLayers(lens)).toContain("terrain-3d");
    });
  }
});

describe("the great chedi is wired, not just written", () => {
  // CORRECTION. An earlier draft of this file asserted the chedi was dead
  // code. That was wrong, and wrong in an instructive way: the audit ran on
  // branch cursor/river-flow-arrows-f627, where mahatat3DLayer genuinely had
  // no caller. On main it has been wired for some time behind a `mahatat-3d`
  // layer id, in the EXEC lens. The lesson generalises past this file: a
  // missing reference is evidence about the branch you are standing on, not
  // about the repository. Check the branch before declaring anything absent.
  it("App.tsx calls mahatat3DLayer in the layer builder", () => {
    expect(APP).toMatch(/out\.push\(\.\.\.\(mahatat3DLayer\(/);
  });

  it("the call is gated on the mahatat-3d layer toggle", () => {
    expect(APP).toMatch(/mahatat3DLayer\(enabledLayers\.has\("mahatat-3d"\)/);
  });

  it("the chedi renders at TRUE size, not the buildings layer's 1.65x", () => {
    // The regression this pins: 56.0 m x 1.65 = 79 m, i.e. a World Heritage
    // monument drawn 40% too tall, and the 2:1 H:W ratio the nomination argues
    // from made unreadable.
    expect(APP).not.toMatch(/mahatat3DLayer\([^)]*1\.65/);
    expect(APP).toMatch(/mahatat3DLayer\(enabledLayers\.has\("mahatat-3d"\), 1\)/);
  });

  it("mahatat-3d is a registered layer, so the toggle exists", () => {
    const LAYERS = readFileSync(new URL("./presetsLayersB.ts", import.meta.url), "utf8");
    expect(LAYERS).toMatch(/id: "mahatat-3d"/);
  });

  it("an executive can actually reach the chedi without hunting for the toggle", () => {
    // It lives in EXEC by default, which is the one lens a mayor opens.
    const LENSES = readFileSync(new URL("./presetsLenses.ts", import.meta.url), "utf8");
    const exec = LENSES.slice(LENSES.indexOf('    id: "executive",'), LENSES.indexOf('    id: "operations",'));
    expect(exec).toMatch(/"mahatat-3d"/);
  });
});

describe("the model's dimensions still match the nomination", () => {
  // Guards against someone editing the segment table and the published figure
  // together, or neither. 28 wa x 2 m tall, 14 wa x 2 m wide.
  //
  // Asserted against the model itself, not against App.tsx: the call site
  // passes a scale, not dimensions, and an earlier draft of this test
  // "verified" the constants by grepping App.tsx for their names — which
  // passes for an import that has nothing to do with what is drawn.
  it("the chedi is 56.0 m tall — 28 wa at 1 wa = 2 m", async () => {
    const { CHEDI_HEIGHT_M } = await import("../lib/mahatat3d");
    expect(CHEDI_HEIGHT_M).toBeCloseTo(56, 1);
  });

  it("the chedi is 28 m across — 14 wa at 1 wa = 2 m, the deliberate 2:1", async () => {
    const { CHEDI_WIDTH_M, CHEDI_HEIGHT_M } = await import("../lib/mahatat3d");
    expect(CHEDI_WIDTH_M).toBe(28);
    expect(CHEDI_HEIGHT_M / CHEDI_WIDTH_M).toBeCloseTo(2, 2);
  });
});
