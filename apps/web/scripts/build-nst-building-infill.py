#!/usr/bin/env python3
"""NST satellite-derived infill; OSM geometry wins on overlap.

Run from apps/web with Python + shapely:
  python3 scripts/build-nst-building-infill.py --scratch /Volumes/Data/agent-scratch/nst-buildings
Downloads only the two intersecting Microsoft tiles, sequentially. Source heights
are not available here: null remains null. No roof shape is inferred by this job.
"""
import argparse
import csv
import gzip
import hashlib
import io
import json
import math
import pathlib
import urllib.request

from shapely.geometry import shape, box, MultiPoint
from shapely.strtree import STRtree

BBOX = (99.91, 8.375, 100.04, 8.495)  # city + immediately adjoining urban blocks
INDEX = "https://bfppub.blob.core.windows.net/%24web/2026-08-13/dataset-links.csv"
KEYS = {"132221132", "132221310"}


def request(url):
    return urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": "NST-building-coverage/1.0"}), timeout=30)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--scratch", type=pathlib.Path, required=True)
    args = parser.parse_args()
    args.scratch.mkdir(parents=True, exist_ok=True)
    out = pathlib.Path("public/geo/nst")
    original = json.loads((out / "buildings.geojson").read_text())["features"]
    municipality = shape(json.loads((out / "boundary.geojson").read_text())["features"][0]["geometry"])
    survey = json.loads((out / "hii/road-levels.geojson").read_text())["features"]
    # Infill covers the actual municipality and the eastern road-survey window,
    # not a large provincial rectangle. This hull is a download scope, not a flood extent.
    study_area = municipality.union(MultiPoint([f["geometry"]["coordinates"] for f in survey]).convex_hull)
    # Grounds/search extents are not roof footprints; do not suppress buildings inside them.
    osm = []
    for f in original:
        p, g = f["properties"], shape(f["geometry"])
        area = g.area * 111320 * 110574 * math.cos(math.radians(g.centroid.y))
        named = " ".join(str(p.get(k) or "") for k in ("name", "nameTh", "nameEn"))
        compound = area > 6000 and (p.get("building") in {"temple", "religious", "monastery", "church", "mosque"} or any(w in named.lower() for w in ("วัด", "กำแพง", "compound", "grounds")))
        if g.is_valid and not compound and not str(p.get("id", "")).startswith("hand/"):
            osm.append(g)
    tree = STRtree(osm)
    with request(INDEX) as response:
        index = response.read(20_000_000).decode()
    tiles = [r for r in csv.DictReader(io.StringIO(index)) if r["Location"] == "Thailand" and r["QuadKey"] in KEYS]
    if len(tiles) != 2:
        raise ValueError("Expected both pinned NST tiles; refusing a partial replacement")
    envelope = box(*BBOX)
    features, sources = [], []
    excluded = {"outside": 0, "overlap": 0, "invalid": 0}
    for tile in tiles:
        target = args.scratch / (tile["QuadKey"] + ".gz")
        if not target.exists():
            with request(tile["Url"]) as response, target.open("wb") as dest:
                total = 0
                while chunk := response.read(256 * 1024):
                    total += len(chunk)
                    if total > 25_000_000:
                        raise ValueError("Tile exceeded bounded download")
                    dest.write(chunk)
        sources.append({**tile, "sha256": hashlib.sha256(target.read_bytes()).hexdigest()})
        with gzip.open(target, "rt") as source:
            for line in source:
                f = json.loads(line)
                g = shape(f["geometry"])
                if not g.is_valid or g.is_empty:
                    excluded["invalid"] += 1
                    continue
                if not envelope.covers(g.centroid):
                    excluded["outside"] += 1
                    continue
                if not study_area.covers(g.centroid):
                    excluded["outside"] += 1
                    continue
                if any(g.intersection(osm[i]).area / min(g.area, osm[i].area) > .35 for i in tree.query(g, predicate="intersects")):
                    excluded["overlap"] += 1
                    continue
                # Stable geometry-derived IDs; never invent measured heights or roof tags.
                geometry = f["geometry"]
                token = hashlib.sha256(json.dumps(geometry, sort_keys=True).encode()).hexdigest()[:16]
                f["properties"] = {"id": "ms/" + token, "building": "yes", "height": None, "levels": None, "source": "ms-footprints"}
                features.append(f)
        print(tile["QuadKey"], "infill so far", len(features), flush=True)
    # Resolve rare cross-tile/ML overlaps as well, preserving reviewed IDs.
    reviewed = {o["id"] for o in json.loads(pathlib.Path("src/data/roofObservations.json").read_text())["observations"]}
    features.sort(key=lambda f: (f["properties"]["id"] not in reviewed, -shape(f["geometry"]).area, f["properties"]["id"]))
    geometries = [shape(f["geometry"]) for f in features]
    infill_tree, removed = STRtree(geometries), set()
    for i, g in enumerate(geometries):
        if i in removed:
            continue
        for k in infill_tree.query(g, predicate="intersects"):
            if k > i and k not in removed and g.intersection(geometries[k]).area / min(g.area, geometries[k].area) > .35:
                removed.add(k)
    excluded["selfOverlap"] = len(removed)
    features = [f for i, f in enumerate(features) if i not in removed]
    features.sort(key=lambda f: f["properties"]["id"])
    fc = {"type": "FeatureCollection", "features": features}
    (out / "buildings-infill.geojson").write_text(json.dumps(fc, separators=(",", ":")))
    report = {"source": "Microsoft Global ML Building Footprints", "license": "CDLA-Permissive-2.0", "sourceUrl": "https://github.com/microsoft/GlobalMLBuildingFootprints", "index": INDEX, "bbox": BBOX, "scope": "municipal boundary plus eastern HII road-survey convex hull; hull is an extraction window, not inundation", "sourceTiles": sources, "originalFootprints": len(original), "addedFootprints": len(features), "excluded": excluded, "method": "Satellite-derived footprint detections; OSM wins when overlap exceeds35% of the smaller polygon. Not a complete survey. Image dates, roof shapes and heights unverified; source heights remain null."}
    (out / "building-coverage.json").write_text(json.dumps(report, indent=2) + "\n")
    print(json.dumps({k: report[k] for k in ("originalFootprints", "addedFootprints", "excluded")}))


if __name__ == "__main__":
    main()
