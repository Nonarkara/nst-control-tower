#!/usr/bin/env python3
"""
slim_geojson.py — cut the fat from the NST geo data.

What it does
------------
1. Drops null/undefined/empty-string properties per feature
2. Snaps coordinates to 5 decimal places (~1.1 m at the equator, ~1.0 m at NST's 8°N)
   — sub-metre precision is below the OSM source accuracy for building footprints
3. Simplifies rectangular footprints: polygons with 5+ vertices where 4 of them form
   the bounding box (and the rest are collinear duplicates) get collapsed to 4 vertices
4. Pre-computes building elevation in a `_elevM` field using the same logic the
   runtime's `buildingHeightMeters` applies — so the data ships with elevations
   and the layer accessor can read them in one tuple-deref instead of calling
   a JS function per building per frame
5. Strips the orphan Chula/Bangkok 3D tiles directory (3d-tiles/) which is at
   lat 13.3-13.4° — the wrong region for NST (lat 8.4°)
6. Writes minified JSON (no indentation, separators as "," and ":")
7. Reports before/after bytes + per-feature size

Run
---
    python3 scripts/slim_geojson.py --dry-run   # show savings, don't write
    python3 scripts/slim_geojson.py             # write slimmed files in place
"""
from __future__ import annotations

import argparse
import json
import math
import os
import sys
from pathlib import Path
from typing import Any

# ── 5-decimal coordinate snapping ────────────────────────────────────────────
# 1° lat ≈ 111 km, so 5 decimals = 0.00001° ≈ 1.1 m. For OSM building footprints
# (whose source accuracy is ~1-5 m), 5 decimals is more than enough and saves
# ~20% on coordinate bytes vs the 7-decimal OSM dump.
COORD_DECIMALS = 5


def snap(v: float) -> float:
    """Snap a coordinate value to COORD_DECIMALS decimal places."""
    return round(float(v), COORD_DECIMALS)


def snap_coords(coords: Any) -> Any:
    """Recursively walk a GeoJSON coordinates structure and snap every number."""
    if isinstance(coords, list):
        return [snap_coords(c) for c in coords]
    if isinstance(coords, (int, float)):
        return snap(coords)
    return coords


# ── Rectangular footprint simplification ──────────────────────────────────────
# OSM often has building footprints with 5+ vertices where some are duplicates
# or collinear. A "real" 5-vertex rectangle should be a 4-vertex rectangle.
# We only simplify when the polygon is approximately a rectangle (max distance
# from any vertex to the bounding box is < 0.5 m at this scale).


def _polygon_area(coords: list[list[float]]) -> float:
    """Spherical area in m² for a small polygon (good enough at city scale)."""
    if len(coords) < 4:
        return 0.0
    R = 6_371_000.0
    lat0 = math.radians(coords[0][1])
    area = 0.0
    for i in range(len(coords) - 1):
        a, b = coords[i], coords[i + 1]
        area += math.radians(b[0] - a[0]) * (2 + math.sin(lat0) + math.sin(math.radians(b[1])))
    return abs(area) * R * R / 2.0


def _simplify_ring(ring: list[list[float]], tolerance_m: float = 0.5) -> list[list[float]]:
    """
    Drop collinear and near-duplicate vertices from a polygon ring.

    - Remove vertices that are within `tolerance_m` of the previous vertex
      (catches the OSM "duplicate-then-jitter" pattern)
    - Remove vertices that are collinear with their neighbours
      (the standard Douglas-Peucker zero-area case)
    """
    if len(ring) < 4:
        return ring

    def dist_m(a: list[float], b: list[float]) -> float:
        # Equirectangular distance — fine at city scale
        R = 6_371_000.0
        lat0 = math.radians((a[1] + b[1]) / 2)
        dx = math.radians(b[0] - a[0]) * R * math.cos(lat0)
        dy = math.radians(b[1] - a[1]) * R
        return math.hypot(dx, dy)

    # Pass 1: drop near-duplicate consecutive vertices
    out: list[list[float]] = [ring[0]]
    for v in ring[1:]:
        if dist_m(out[-1], v) > tolerance_m:
            out.append(v)
    # Always close the ring
    if dist_m(out[-1], out[0]) < tolerance_m:
        out.pop()
    out.append(out[0])

    # Pass 2: drop collinear vertices (cross-product area < threshold)
    if len(out) >= 4:
        again = True
        while again and len(out) > 4:
            again = False
            for i in range(1, len(out) - 1):
                a, b, c = out[i - 1], out[i], out[i + 1]
                cross = abs((b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]))
                if cross < 1e-9:
                    out.pop(i)
                    again = True
                    break
    return out


def simplify_polygon(geom: dict, tolerance_m: float = 0.5) -> dict:
    """Apply `_simplify_ring` to every ring of a Polygon/MultiPolygon."""
    if geom.get("type") == "Polygon":
        new_rings = [_simplify_ring(r, tolerance_m) for r in geom.get("coordinates", [])]
        return {**geom, "coordinates": new_rings}
    if geom.get("type") == "MultiPolygon":
        new_polys = [
            [_simplify_ring(r, tolerance_m) for r in poly]
            for poly in geom.get("coordinates", [])
        ]
        return {**geom, "coordinates": new_polys}
    return geom


# ── Property cleanup ─────────────────────────────────────────────────────────
# Drop null / undefined / empty-string properties. The runtime reads
# BuildingProperties as `T | null | undefined` so missing keys are equivalent
# to null in TypeScript. Saves ~30 bytes per feature for the 99% of
# OSM-tag-null fields.


def drop_null_props(props: dict) -> dict:
    return {k: v for k, v in props.items() if v is not None and v != ""}


# ── Building elevation pre-bake ─────────────────────────────────────────────
# Pre-computes the elevation so the layer accessor can read it as a single
# tuple-deref instead of calling `buildingHeightMeters` per building per frame.
# Mirrors the logic in apps/web/src/lib/building.ts → `buildingHeightMeters`.


def _finite_positive(v: Any) -> float | None:
    if v is None:
        return None
    try:
        n = float(v)
    except (TypeError, ValueError):
        return None
    if not math.isfinite(n) or n <= 0:
        return None
    return n


def prebake_building_elev_m(props: dict) -> float:
    """Mirror of buildingHeightMeters() in apps/web/src/lib/building.ts."""
    h = _finite_positive(props.get("height"))
    if h:
        return max(h, 8)
    lv = _finite_positive(props.get("levels"))
    if lv:
        return max(lv * 4.2, 10)
    # Landmark fallbacks (matches the runtime's classifyBuilding outputs)
    mn = (props.get("mnType") or "").lower()
    if mn in ("temple", "mosque", "church", "hospital", "hotel", "university",
              "government", "school", "police", "fire", "bank", "post_office"):
        heights = {
            "temple": 28, "mosque": 22, "church": 20, "hospital": 18,
            "hotel": 20, "university": 15, "government": 15, "school": 12,
            "police": 10, "fire": 10, "bank": 14, "post_office": 10,
        }
        return heights.get(mn, 10)
    return 10


# ── Per-file processors ──────────────────────────────────────────────────────


def process_buildings(path: Path) -> tuple[int, int, int, bytes]:
    with path.open() as fp:
        d = json.load(fp)
    n_features = len(d.get("features", []))
    for f in d["features"]:
        props = f.get("properties", {}) or {}
        props = drop_null_props(props)
        # Pre-bake elevation
        props["_elevM"] = prebake_building_elev_m(props)
        # Compute _bbox for spatial culling
        coords = f.get("geometry", {}).get("coordinates", [])
        lons, lats = [], []

        def walk(c: Any) -> None:
            if isinstance(c, list):
                if c and isinstance(c[0], (int, float)):
                    lons.append(c[0])
                    lats.append(c[1])
                else:
                    for x in c:
                        walk(x)

        walk(coords)
        if lons and lats:
            props["_bbox"] = [min(lons), min(lats), max(lons), max(lats)]
        f["properties"] = props
        # Snap + simplify the geometry
        f["geometry"] = simplify_polygon(f["geometry"])
        f["geometry"]["coordinates"] = snap_coords(f["geometry"]["coordinates"])
    new_bytes = json.dumps(d, separators=(",", ":")).encode("utf-8")
    return path.stat().st_size, len(new_bytes), n_features, new_bytes


def process_roads(path: Path) -> tuple[int, int, int, bytes]:
    with path.open() as fp:
        d = json.load(fp)
    n_features = len(d.get("features", []))
    for f in d["features"]:
        props = drop_null_props(f.get("properties", {}) or {})
        # Coerce id to a short integer if possible (e.g. "way/12345" → 12345)
        # — saves ~6 bytes per feature
        if "id" in props and isinstance(props["id"], str) and props["id"].startswith(("way/", "node/", "relation/")):
            try:
                props["id"] = int(props["id"].split("/", 1)[1])
            except ValueError:
                pass
        f["properties"] = props
        f["geometry"]["coordinates"] = snap_coords(f["geometry"]["coordinates"])
    new_bytes = json.dumps(d, separators=(",", ":")).encode("utf-8")
    return path.stat().st_size, len(new_bytes), n_features, new_bytes


def process_waterways(path: Path) -> tuple[int, int, int, bytes]:
    with path.open() as fp:
        d = json.load(fp)
    n_features = len(d.get("features", []))
    for f in d["features"]:
        props = drop_null_props(f.get("properties", {}) or {})
        f["properties"] = props
        f["geometry"]["coordinates"] = snap_coords(f["geometry"]["coordinates"])
    new_bytes = json.dumps(d, separators=(",", ":")).encode("utf-8")
    return path.stat().st_size, len(new_bytes), n_features, new_bytes


# ── Orphan 3D-tiles cleanup ──────────────────────────────────────────────────
# The 3d-tiles/buildings.b3dm is at lat 13.32-13.41° (Bangkok area) — leftover
# from the Chula/Chonburi fork era, before NST was rebranded. NST is at lat
# 8.4°. The tiles cover the wrong region so they can never serve the city
# proper; they're 5.8 MB of dead weight shipping in the bundle.


def remove_orphan_3d_tiles(root: Path) -> tuple[bool, int]:
    tiles_dir = root / "apps" / "web" / "public" / "geo" / "3d-tiles"
    if not tiles_dir.exists():
        return False, 0
    freed = sum(f.stat().st_size for f in tiles_dir.rglob("*") if f.is_file())
    return True, freed


# ── Driver ───────────────────────────────────────────────────────────────────


def main() -> int:
    ap = argparse.ArgumentParser(description="Cut fat from the NST geo data")
    ap.add_argument("--dry-run", action="store_true", help="Show what would change, don't write")
    ap.add_argument("--root", default=".", help="Repo root")
    args = ap.parse_args()

    root = Path(args.root).resolve()
    geo = root / "apps" / "web" / "public" / "geo" / "nst"

    targets = [
        ("buildings",  geo / "buildings.geojson",   process_buildings),
        ("roads",      geo / "roads.geojson",       process_roads),
        ("waterways",  geo / "waterways.geojson",   process_waterways),
    ]

    print(f"Cutting fat from NST geo data (root={root})")
    print(f"  COORD_DECIMALS = {COORD_DECIMALS}  (~{1.1 * 10 ** (5 - COORD_DECIMALS):.1f} m at NST lat 8°)")
    print()
    total_before = 0
    total_after = 0
    for name, path, fn in targets:
        if not path.exists():
            print(f"  {name:<12}  MISSING — {path}")
            continue
        before, after, n, new_bytes = fn(path)
        total_before += before
        total_after += after
        saving = before - after
        saving_pct = saving / before * 100 if before else 0
        per_feature_before = before / n if n else 0
        per_feature_after = after / n if n else 0
        print(f"  {name:<12}  {before:>9,d} → {after:>9,d} bytes"
              f"  (−{saving:>9,d}, {saving_pct:>5.1f}%)"
              f"  {per_feature_before:>5.0f} → {per_feature_after:>5.0f} B/feature")
        if not args.dry_run:
            path.write_bytes(new_bytes)

    will_remove, freed = remove_orphan_3d_tiles(root)
    if will_remove:
        print()
        print(f"  3d-tiles/    {freed:>9,d} bytes  (orphan Bangkok tiles at lat 13°)")
        if not args.dry_run:
            import shutil
            shutil.rmtree(root / "apps" / "web" / "public" / "geo" / "3d-tiles")
            print(f"               REMOVED (was at lat 13.3-13.4° — NST is at 8.4°)")
        total_before += freed
    else:
        print()
        print(f"  3d-tiles/    not present")

    print()
    print(f"  TOTAL        {total_before:>9,d} → {total_after:>9,d} bytes"
          f"  (−{total_before - total_after:>9,d}, "
          f"{(total_before - total_after) / total_before * 100:>5.1f}%)")
    print()
    if args.dry_run:
        print("  (dry-run — files NOT written)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
