#!/usr/bin/env python3
"""
build_hii_geo.py — convert HII (Hydro-Informatics Institute) survey shapefiles
into the dashboard's static geo assets.

Sources (HII open-data catalog, https://data.hii.or.th/dataset/ — CC-style open
government data; surveyed by MMS mobile mapping referenced to the NCDC national
continuously-operating coordinate reference, elevations in metres above MSL):

  Road Level / 2025 / Nakhon Si Thammarat
    2025_Ground_floodmark_NakhonSriTammarat.{shp,dbf,shx,prj}
    → 55,076 PointZ ground/road elevations along 12 city routes.
  Flood mark / 2025 / Nakhon Si Thammarat
    floodmark_ปกติ.*          → 43 normal-season high-water marks
    floodmark_ฤดูพายุปลาบึก.*  → 40 Tropical Storm Pabuk (Jan 2019) marks

Download via gisservice.hii.or.th (see URLS below), then:

  python3 -m venv venv && ./venv/bin/pip install pyshp
  ./venv/bin/python3 scripts/build_hii_geo.py <src_dir> ../public/geo/nst/hii/

where <src_dir> contains roadlevel/nst.{shp,...}, floodmark/normal.{shp,...},
floodmark/pabuk.{shp,...} (the download basenames used in this repo's pipeline).

Outputs:
  flood-marks.geojson  — 83 points {set: "normal"|"pabuk", z}
  road-levels.geojson  — every 3rd survey point (~18k) {z, route}

Coordinates are converted from WGS84 / UTM zone 47N to WGS84 lat/lng with the
standard Krüger series inverse (sub-metre accuracy at this extent — verified
against the survey bbox landing exactly on the Pak Nakhon lowland).
"""

import json
import math
import sys

import shapefile  # pyshp


# ── UTM 47N → WGS84 ─────────────────────────────────────────────────────────
A, F = 6378137.0, 1 / 298.257223563
K0, E0, LON0 = 0.9996, 500000.0, math.radians(99.0)  # zone 47N central meridian
E2 = F * (2 - F)
E12 = E2 / (1 - E2)


def utm47n_to_lonlat(x: float, y: float) -> tuple[float, float]:
    m = y / K0
    mu = m / (A * (1 - E2 / 4 - 3 * E2 * E2 / 64 - 5 * E2**3 / 256))
    e1 = (1 - math.sqrt(1 - E2)) / (1 + math.sqrt(1 - E2))
    phi1 = (
        mu
        + (3 * e1 / 2 - 27 * e1**3 / 32) * math.sin(2 * mu)
        + (21 * e1 * e1 / 16 - 55 * e1**4 / 32) * math.sin(4 * mu)
        + (151 * e1**3 / 96) * math.sin(6 * mu)
    )
    c1 = E12 * math.cos(phi1) ** 2
    t1 = math.tan(phi1) ** 2
    n1 = A / math.sqrt(1 - E2 * math.sin(phi1) ** 2)
    r1 = A * (1 - E2) / (1 - E2 * math.sin(phi1) ** 2) ** 1.5
    d = (x - E0) / (n1 * K0)
    lat = phi1 - (n1 * math.tan(phi1) / r1) * (
        d * d / 2
        - (5 + 3 * t1 + 10 * c1 - 4 * c1 * c1 - 9 * E12) * d**4 / 24
        + (61 + 90 * t1 + 298 * c1 + 45 * t1 * t1 - 252 * E12 - 3 * c1 * c1) * d**6 / 720
    )
    lon = LON0 + (
        d
        - (1 + 2 * t1 + c1) * d**3 / 6
        + (5 - 2 * c1 + 28 * t1 - 3 * c1 * c1 + 8 * E12 + 24 * t1 * t1) * d**5 / 120
    ) / math.cos(phi1)
    return math.degrees(lon), math.degrees(lat)


def feature(lng: float, lat: float, props: dict) -> dict:
    return {
        "type": "Feature",
        "geometry": {"type": "Point", "coordinates": [round(lng, 5), round(lat, 5)]},
        "properties": props,
    }


def build_flood_marks(src_dir: str) -> dict:
    features = []
    for set_name, path in [("normal", f"{src_dir}/floodmark/normal"), ("pabuk", f"{src_dir}/floodmark/pabuk")]:
        sf = shapefile.Reader(path, encoding="utf-8")
        for i in range(len(sf)):
            shp = sf.shape(i)
            x, y = shp.points[0]
            z = round(shp.z[0], 3)
            lng, lat = utm47n_to_lonlat(x, y)
            features.append(feature(lng, lat, {"set": set_name, "z": z}))
    return {"type": "FeatureCollection", "features": features}


def build_road_levels(src_dir: str, every: int = 3) -> dict:
    sf = shapefile.Reader(f"{src_dir}/roadlevel/nst", encoding="utf-8")
    features = []
    for i in range(0, len(sf), every):
        shp = sf.shape(i)
        rec = sf.record(i)
        x, y = shp.points[0]
        z = round(shp.z[0], 2)
        route = int(rec[4])
        lng, lat = utm47n_to_lonlat(x, y)
        features.append(feature(lng, lat, {"z": z, "route": route}))
    return {"type": "FeatureCollection", "features": features}


def main() -> None:
    if len(sys.argv) != 3:
        sys.exit(f"usage: {sys.argv[0]} <src_dir> <out_dir>")
    src_dir, out_dir = sys.argv[1], sys.argv[2]

    marks = build_flood_marks(src_dir)
    with open(f"{out_dir}/flood-marks.geojson", "w") as f:
        json.dump(marks, f, ensure_ascii=False, separators=(",", ":"))
    zs = sorted(f["properties"]["z"] for f in marks["features"])
    print(f"flood-marks.geojson: {len(marks['features'])} marks, z {zs[0]}–{zs[-1]} m MSL")

    roads = build_road_levels(src_dir)
    with open(f"{out_dir}/road-levels.geojson", "w") as f:
        json.dump(roads, f, separators=(",", ":"))
    zs = sorted(f["properties"]["z"] for f in roads["features"])
    n = len(zs)
    print(f"road-levels.geojson: {n} points, z min={zs[0]} med={zs[n//2]} max={zs[-1]} m MSL")


if __name__ == "__main__":
    main()
