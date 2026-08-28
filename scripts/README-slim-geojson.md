# slim_geojson.py — cut the fat from NST geo data

## Why

The NST dashboard was shipping **12.6 MB of GeoJSON** at first load — 7.1 MB of which
was used by the default OPS lens. The bulk was:

| File | Size | Why it was fat |
|------|------|---------------|
| `apps/web/public/geo/3d-tiles/buildings.b3dm` | 5.83 MB | Orphan tiles from a previous-city fork, covering **lat 13.3–13.4°** (Bangkok). NST is at **lat 8.4°** — the tiles could never serve the right city. |
| `roads.geojson` | 3.35 MB | 5,564 features with 7-decimal coordinates (sub-millimetre precision at city scale) and 7 property keys, most of them null. |
| `waterways.geojson` | 2.30 MB | 843 features, same precision + null issue. |
| `buildings.geojson` | 1.17 MB | 2,457 features with 13 property keys, only 1 had a `height` value, only 3 had `levels`. The runtime computed heights per-frame. |

This was a real problem on a 4G phone in Southern Thailand during a flood event:
**3–5 s of data download before the user could pan/zoom the map.**

The dashboard's existing arnismc.com workflow showed what "skinny" looks like —
OSM Overpass + a rule-based extrusion pipeline that produces a tight dataset.
The same discipline applied to the static GeoJSON: drop nulls, snap coordinates,
pre-bake derived fields.

## What the tool does

`scripts/slim_geojson.py` runs in ~2 s and applies 6 transformations:

1. **Drop null/undefined/empty-string properties** per feature. The runtime reads
   `T | null | undefined` so missing keys are equivalent to null. Saves ~30 bytes
   per feature for the 99% of OSM-tag-null fields.

2. **Snap coordinates to 5 decimal places** (~1.1 m at NST's 8°N latitude).
   OSM's source accuracy is ~1–5 m, so 7 decimals (the raw Overpass dump) is
   below the noise floor of the data anyway.

3. **Simplify rectangular footprints** by dropping near-duplicate and collinear
   vertices. A "real" 5-vertex rectangle is a 4-vertex rectangle.

4. **Pre-bake building heights** in a `_elevM` field, mirroring the
   `buildingHeightMeters()` logic in `apps/web/src/lib/building.ts`. The runtime
   layer accessor now reads a pre-computed tuple-deref instead of calling a
   JS function per building per frame.

5. **Pre-compute `_bbox`** for each building so the GPU can cull off-screen
   features with a single AABB check.

6. **Coerce OSM `way/12345` IDs to integers** (saves ~6 bytes/feature on roads).

The script also removes the orphan Bangkok 3D tiles.

## Result

```
  buildings     1,172,636 →   868,218 bytes  (−  304,418,  26.0%)    477 →   353 B/feature
  roads         3,353,265 → 2,737,612 bytes  (−  615,653,  18.4%)    603 →   492 B/feature
  waterways     2,296,621 → 1,907,618 bytes  (−  389,003,  16.9%)   2724 → 2263 B/feature

  3d-tiles/    5,829,583 bytes  (orphan Bangkok tiles at lat 13°)
               REMOVED (was at lat 13.3-13.4° — NST is at 8.4°)

  TOTAL        12,652,105 → 5,513,448 bytes  (−7,138,657,  56.4%)
```

| Before | After | Saving |
|--------|-------|--------|
| 12.6 MB shipped | 5.5 MB shipped | **−7.1 MB (−56%)** |
| 7.1 MB on default OPS lens | 3.6 MB on default OPS lens | **−3.5 MB** |
| `getElevation` called JS function per building per frame | Reads pre-baked `_elevM` tuple | **per-frame work ↓** |
| `classifyBuilding` called 3× per building per frame | Computed once at layer creation, cached in `WeakMap` | **per-frame work ↓** |
| `waterways.geojson` fetched for every lens | Fetched only on FLOOD/ENV/EAR/SAF/INT | **−1.9 MB on 4 lenses** |
| `transit-lines.geojson` fetched for every lens | Fetched only on MOB | **−88 KB on 8 lenses** |
| 5.8 MB orphan Bangkok 3D tiles | Removed | **−5.8 MB** |

## Runtime changes the slim enabled

Three render-time changes that depend on the slimmed data:

- `apps/web/src/map/layers.ts` — `buildingsLayer()` and `buildingRoofsLayer()`
  now read `_elevM` from the feature instead of calling `buildingHeightMeters()`
  per frame. They also pre-compute the `classifyBuilding` result + base colour
  in a `WeakMap` at layer creation, so `getFillColor` / `getLineColor` /
  `getLineWidth` are single property reads on every frame. Net: ~2.2 M
  classification calls/sec → ~0 (one-time pass at layer creation).

- `apps/web/src/App.tsx` — `waterways` and `transit-lines` are now
  lens-gated fetches. The hook already supported `path: string | null` for
  this; the only change was to pass `null` on the lenses that don't need them.

- `apps/web/src/App.tsx` — `transitLines` was hoisted to after the `lens`
  state declaration so the gating expression can read it (TS caught a
  "used before declaration" error on the first build attempt).

## Running

```bash
# Dry-run — show what would change, don't write
python3 scripts/slim_geojson.py --dry-run

# Run for real
python3 scripts/slim_geojson.py
```

The script is idempotent — running it twice on already-slimmed data is a no-op
(the second pass drops no nulls, snaps already-snapped coordinates, etc.).

## When to re-run

- When the OSM data is refreshed (the NST data lives in
  `apps/web/public/geo/nst/` and is built from the
  `scripts/build-*-nst.mjs` OSM extractors).
- When a new city fork is added — copy `apps/api/src/lib/cache.ts` and
  `scripts/slim_geojson.py` to the new fork; the per-file slimmer is
  fork-agnostic.

## What I did NOT do

- **Did not move roads to lazy-load.** Most lenses (EXEC, OPS, MOB) need roads
  and it's only 2.7 MB. The benefit wasn't worth the conditional logic.
- **Did not pre-tile the data** (e.g. vector tiles with H3 / quadkey indexes).
  The savings would be real (only the in-viewport tiles ship) but it's a
  larger architecture change — the right next step if 5.5 MB is still too
  much on a 4G connection.
- **Did not simplify building footprints below 5 vertices.** Some buildings
  are 13 vertices because they're L-shaped or T-shaped. A 4-vertex bounding
  box would lose the shape information that's actually meaningful.
- **Did not bake the heritage roof colours into the data.** The colour maps
  are runtime-controlled by the lens (e.g. flood lens washes the city in
  blue, executive lens is in landmark colours). Baking them would require
  per-lens data exports.
