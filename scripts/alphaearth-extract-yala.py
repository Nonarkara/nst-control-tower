#!/usr/bin/env python3
"""AlphaEarth Foundations extractor for the Yala (Pattani River) basin — GEE.

This is the REAL pipeline, to be run once Google Earth Engine credentials exist.
It consumes Google DeepMind's AlphaEarth Foundations satellite embeddings
(`GOOGLE/SATELLITE_EMBEDDING/V1/ANNUAL`) and derives two flood-oriented products
for the Yala basin:

  1. landcover.geojson  — per-cell land cover (rubber-plantation / forest /
     built-up / water / paddy) via k-means clustering of the 64-dim embedding,
     with clusters labelled against reference signatures.
  2. floodprone.geojson — flood susceptibility (high / med / low) from a low
     elevation + proximity-to-river / downstream-of-Bang-Lang-Dam heuristic,
     using the SRTM DEM (`USGS/SRTMGL1_003`) and JRC surface water.

Output schema matches the static reference files in
apps/web/public/geo/yala/alphaearth/ so the frontend layers are identical
whether data comes from GEE or the heuristic generator.

────────────────────────────────────────────────────────────────────────────
AUTH — required before this script will run (none of it is configured here):

  1. Create a Google Cloud project and enable the Earth Engine API.
  2. Register the project for Earth Engine: https://code.earthengine.google.com/
  3. Authenticate locally (one-time, opens a browser):
        earthengine authenticate
     …or, for a service account / headless host, set:
        export EE_SERVICE_ACCOUNT="ee-sa@PROJECT.iam.gserviceaccount.com"
        export EE_PRIVATE_KEY_FILE="/path/to/key.json"
        export GOOGLE_CLOUD_PROJECT="your-ee-project"
  4. pip install earthengine-api numpy

Run:
    python scripts/alphaearth-extract-yala.py

Until GEE access exists, use the no-auth heuristic generator instead:
    python scripts/yala-alphaearth-static.py
────────────────────────────────────────────────────────────────────────────
"""

from __future__ import annotations

import json
import os
import sys
from datetime import datetime, timezone
from pathlib import Path

# Yala basin bbox (matches yala_config.BASIN_BBOX): south to Bang Lang Dam.
BBOX = {"west": 101.20, "south": 6.10, "east": 101.35, "north": 6.60}

YEAR = 2024                  # AlphaEarth annual embedding year to pull
N_CLUSTERS = 6               # k-means clusters → mapped to land-cover classes
SAMPLE_SCALE_M = 30          # export resolution (SRTM / Sentinel native ~ 10-30 m)

ROOT = Path(__file__).resolve().parent.parent
OUT_DIR = ROOT / "apps" / "web" / "public" / "geo" / "yala" / "alphaearth"

# Land-cover classes relevant to the Deep South / Pattani basin.
CLASS_COLORS = {
    "rubber-plantation": "#8d6e3a",
    "forest": "#1b7837",
    "built-up": "#d73027",
    "water": "#2c7fb8",
    "paddy": "#c2e699",
}

EMBEDDING_COLLECTION = "GOOGLE/SATELLITE_EMBEDDING/V1/ANNUAL"
DEM_ASSET = "USGS/SRTMGL1_003"
JRC_WATER = "JRC/GSW1_4/GlobalSurfaceWater"

# Bang Lang Dam (upstream); river flood risk concentrates downstream of it.
BANG_LANG_DAM = {"lng": 101.2736, "lat": 6.1564}

# Elevation thresholds (m) used to bucket flood susceptibility.
ELEV_HIGH_RISK_M = 30        # below this near the river → high risk
ELEV_MED_RISK_M = 60


def _init_ee():
    """Initialise Earth Engine using env-configured auth. Fail loud if missing."""
    try:
        import ee  # type: ignore
    except ImportError:
        sys.exit("earthengine-api not installed. Run: pip install earthengine-api numpy")

    project = os.environ.get("GOOGLE_CLOUD_PROJECT")
    sa = os.environ.get("EE_SERVICE_ACCOUNT")
    key_file = os.environ.get("EE_PRIVATE_KEY_FILE")

    try:
        if sa and key_file:
            credentials = ee.ServiceAccountCredentials(sa, key_file)
            ee.Initialize(credentials, project=project)
        else:
            ee.Initialize(project=project)
    except Exception as exc:  # noqa: BLE001
        sys.exit(
            f"Earth Engine init failed ({exc}).\n"
            "Authenticate first: `earthengine authenticate`, or set "
            "EE_SERVICE_ACCOUNT + EE_PRIVATE_KEY_FILE + GOOGLE_CLOUD_PROJECT.\n"
            "No GEE access yet? Use scripts/yala-alphaearth-static.py instead."
        )
    return ee


def _region(ee):
    return ee.Geometry.Rectangle(
        [BBOX["west"], BBOX["south"], BBOX["east"], BBOX["north"]]
    )


def build_landcover(ee, region) -> dict:
    """K-means cluster the AlphaEarth embedding, label clusters, vectorise."""
    embedding = (
        ee.ImageCollection(EMBEDDING_COLLECTION)
        .filterDate(f"{YEAR}-01-01", f"{YEAR}-12-31")
        .filterBounds(region)
        .first()
        .clip(region)
    )

    training = embedding.sample(region=region, scale=SAMPLE_SCALE_M, numPixels=5000)
    clusterer = ee.Clusterer.wekaKMeans(N_CLUSTERS).train(training)
    clustered = embedding.cluster(clusterer)

    # NOTE: cluster index → land-cover label mapping must be calibrated against
    # reference points (e.g. known rubber estates, the Pattani River, urban Yala).
    # Provide a CLUSTER_LABELS dict after inspecting cluster signatures; until
    # calibrated, the heuristic static generator is the trusted source.
    cluster_labels = json.loads(os.environ.get("YALA_CLUSTER_LABELS", "{}"))

    vectors = clustered.reduceToVectors(
        geometry=region,
        scale=SAMPLE_SCALE_M,
        geometryType="polygon",
        eightConnected=False,
        labelProperty="cluster",
        maxPixels=1e10,
    )

    fc = vectors.getInfo()
    for feat in fc.get("features", []):
        cluster = str(feat["properties"].get("cluster"))
        klass = cluster_labels.get(cluster, "unclassified")
        feat["properties"] = {
            "class": klass,
            "color": CLASS_COLORS.get(klass, "#999999"),
            "source": "gee-alphaearth",
            "note": "k-means on AlphaEarth embedding",
            "cluster": cluster,
        }
    fc["properties"] = {"derived": False, "source": EMBEDDING_COLLECTION, "year": YEAR}
    return fc


def build_floodprone(ee, region) -> dict:
    """Flood susceptibility from low elevation + permanent-water proximity."""
    dem = ee.Image(DEM_ASSET).clip(region)
    water = (
        ee.Image(JRC_WATER).select("occurrence").gt(50).clip(region)
    )

    # Distance (m) from permanent water — the Pattani River corridor + reservoir.
    water_dist = (
        water.fastDistanceTransform().sqrt().multiply(ee.Image.pixelArea().sqrt())
    )

    high = dem.lt(ELEV_HIGH_RISK_M).And(water_dist.lt(500))
    med = dem.lt(ELEV_MED_RISK_M).And(water_dist.lt(1500)).And(high.Not())
    risk = high.multiply(2).add(med.multiply(1)).rename("risk")  # 2 high / 1 med / 0 low

    vectors = risk.reduceToVectors(
        geometry=region,
        scale=SAMPLE_SCALE_M,
        geometryType="polygon",
        labelProperty="risk",
        maxPixels=1e10,
    )
    fc = vectors.getInfo()
    risk_name = {2: "high", 1: "med", 0: "low"}
    risk_color = {"high": "#cb181d", "med": "#fd8d3c", "low": "#fee08b"}
    for feat in fc.get("features", []):
        lvl = risk_name.get(int(feat["properties"].get("risk", 0)), "low")
        feat["properties"] = {
            "risk": lvl,
            "color": risk_color[lvl],
            "source": "gee-srtm-jrc",
            "note": "low elevation + proximity to Pattani River / Bang Lang reservoir",
        }
    fc["properties"] = {"derived": False, "source": f"{DEM_ASSET}+{JRC_WATER}"}
    return fc


def main() -> None:
    ee = _init_ee()
    region = _region(ee)
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    print("Building land cover from AlphaEarth embeddings …", flush=True)
    lc = build_landcover(ee, region)
    (OUT_DIR / "landcover.geojson").write_text(json.dumps(lc, separators=(",", ":")))
    print(f"  landcover.geojson  ({len(lc['features'])} features)")

    print("Building flood-prone zones from SRTM + JRC water …", flush=True)
    fp = build_floodprone(ee, region)
    (OUT_DIR / "floodprone.geojson").write_text(json.dumps(fp, separators=(",", ":")))
    print(f"  floodprone.geojson ({len(fp['features'])} features)")

    manifest = {
        "available": True,
        "derived": False,
        "source": "Google Earth Engine — AlphaEarth Foundations + SRTM + JRC",
        "bbox": BBOX,
        "year": YEAR,
        "lastGenerated": datetime.now(timezone.utc).isoformat(),
    }
    (OUT_DIR / "manifest.json").write_text(json.dumps(manifest, indent=2))
    print("Done.")


if __name__ == "__main__":
    main()
