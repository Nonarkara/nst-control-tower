/**
 * App.tsx source-text invariants for province-scale layer zoom-gating.
 *
 * The province-scale watershed layers (cascade subway, Khao Luang pyramid,
 * bay disc, named canals, regional rivers, historical floods, district
 * boundaries, hydro flow arrows, watershed nodes + metro subway, picture
 * book) draw at full geographic size — a ~50 km cascade path, a 1835 m
 * mountain pyramid, a 230 km river, ~117k-household flood polygons.
 *
 * At city zoom (zoomBucket >= 1) those shapes crowd the real city buildings
 * + streets. The gates in this test guard the inversion that came in after
 * the user saw the cascade + Khao Luang + bay + canals + flood washes
 * drawn over the city.
 *
 * Implementation: read apps/web/src/App.tsx as text and assert each gated
 * layer's pull-request-style conditional ends with `&& zoomBucket === 0` (or
 * equivalent — `const bucketCondition = ...`). We do not parse TypeScript —
 * a brittle-but-honest string assertion is enough to catch a future PR that
 * silently removes one of these gates.
 */

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const appSource = readFileSync(
  fileURLToPath(new URL("./App.tsx", import.meta.url)),
  "utf8",
);

/**
 * Lines that gate the given layer flags AND the `zoomBucket === 0` check.
 * We sweep a 12-line window after each enabledLayers.has("...") occurrence
 * for the gate; the comment block right above is allowed to mention
 * "zoomBucket" without false-positiving because we look at enabledLayers
 * occurrences specifically.
 */
function gatingOk(layerName: string): boolean {
  const flag = `enabledLayers.has("${layerName}")`;
  let idx = appSource.indexOf(flag);
  while (idx !== -1) {
    // Look at a 600-char window AFTER the flag — the gate sits in the same
    // `if (...)` body that contains `enabledLayers.has(...)`. A data-fetch
    // arm like `enabledLayers.has("foo") ? "/geo/x.geojson" : null` is a
    // false positive if we look at the window before; the after-window
    // covers the actual conditional gate.
    const window = appSource.slice(idx, idx + 600);
    if (window.includes("zoomBucket === 0")) {
      return true;
    }
    idx = appSource.indexOf(flag, idx + flag.length);
  }
  return false;
}

describe("App.tsx province-scale layer zoom-gating", () => {
  const provinceOnlyLayers = [
    "watershed-nodes",
    "district-boundaries",
    "hydro-flow-arrows",
    "named-canals",
    "regional-rivers",
    "historical-floods",
  ];

  it.each(provinceOnlyLayers)(
    "gates %s to zoomBucket === 0 (province scale)",
    (layerName) => {
      expect(gatingOk(layerName)).toBe(true);
    },
  );

  it("gates the picture-book cartoon (mountain/city/bay icons) to zoomBucket === 0", () => {
    // The water-pictures layer carries the mountain / city / bay icons +
    // flood-story + ffpi-pins. It's province-only — at city zoom it draws a
    // ~4.4 km grey cartoon slab over several real city blocks.
    expect(gatingOk("water-pictures")).toBe(true);
  });

  it("does not invert the cascade + metro subway at city zoom", () => {
    // After the inversion: the allLayers.push(...) arm that renders the
    // watershed cascade + metro subway line must contain
    // `zoomBucket === 0` — NOT `zoomBucket !== 0`. There are upstream
    // occurrences of `enabledLayers.has("watershed-nodes")` for the
    // `visible:` toggle on the always-rendered layer (those don't gate by
    // zoom). Search for "metroRouteLayer" instead, which only appears in
    // the gated block — that's the unique anchor for the cascade render.
    const anchor = "metroRouteLayer(";
    const idx = appSource.indexOf(anchor);
    expect(idx).toBeGreaterThanOrEqual(0);
    const window = appSource.slice(idx, idx + 800);
    expect(window).toContain("zoomBucket === 0");
    expect(window).not.toContain("zoomBucket !== 0");
  });
});
