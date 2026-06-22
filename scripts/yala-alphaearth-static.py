#!/usr/bin/env python3
"""Heuristic AlphaEarth-style static generator for Yala — NO auth required.

This is the graceful-degradation deliverable. It produces the same GeoJSON
schema as the real GEE pipeline (scripts/alphaearth-extract-yala.py) so the
dashboard's AlphaEarth/flood layers render today, before any Google Earth Engine
credentials exist.

Outputs (to apps/web/public/geo/yala/alphaearth/):
  * landcover.geojson  — rubber-plantation / forest / built-up / water / paddy
  * floodprone.geojson — high / med / low flood-susceptibility corridors

Method (clearly DERIVED, not live GEE):
  * Land cover: pull OSM landuse/natural polygons for the basin via Overpass and
    map their tags to Yala-relevant classes. If Overpass is unreachable, fall
    back to a small built-in set of plausible polygons keyed to the real
    geography (rubber estates on the hills, forest reserve, urban core, the
    Pattani River, paddy on the floodplain).
  * Flood-prone: build a corridor of polygons along the Pattani River from
    Bang Lang Dam downstream through the city, bucketed high/med/low by
    proximity to the channel and the urban floodplain.

Run:
    python scripts/yala-alphaearth-static.py            # try OSM, fall back
    python scripts/yala-alphaearth-static.py --offline  # built-in polygons only
"""

from __future__ import annotations

import json
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT_DIR = ROOT / "apps" / "web" / "public" / "geo" / "yala" / "alphaearth"

# Basin bbox (matches yala_config.BASIN_BBOX).
BBOX = {"west": 101.20, "south": 6.10, "east": 101.35, "north": 6.60}

OVERPASS_URL = "https://overpass-api.de/api/interpreter"
OVERPASS_TIMEOUT = 60

# Land-cover classes + colors (shared with the GEE pipeline).
CLASS_COLORS = {
    "rubber-plantation": "#8d6e3a",
    "forest": "#1b7837",
    "built-up": "#d73027",
    "water": "#2c7fb8",
    "paddy": "#c2e699",
}

# OSM tag → Yala land-cover class.
TAG_CLASS = {
    "landuse=plantation": "rubber-plantation",
    "landuse=farmland": "paddy",
    "landuse=farmyard": "paddy",
    "landuse=paddy": "paddy",
    "landuse=orchard": "rubber-plantation",
    "landuse=forest": "forest",
    "natural=wood": "forest",
    "natural=scrub": "forest",
    "landuse=residential": "built-up",
    "landuse=commercial": "built-up",
    "landuse=retail": "built-up",
    "landuse=industrial": "built-up",
    "natural=water": "water",
    "water": "water",
    "landuse=reservoir": "water",
    "waterway=riverbank": "water",
}

RISK_COLORS = {"high": "#cb181d", "med": "#fd8d3c", "low": "#fee08b"}

BANG_LANG_DAM = {"lng": 101.2736, "lat": 6.1564}
YALA_CENTER = {"lng": 101.2831, "lat": 6.5425}


# ── OSM / Overpass land cover ─────────────────────────────────────────────────
def fetch_osm_landcover() -> list[dict] | None:
    """Return landcover Features from OSM, or None if Overpass is unreachable."""
    try:
        import requests
    except ImportError:
        print("  requests not installed — using built-in polygons.", flush=True)
        return None

    s, w, n, e = BBOX["south"], BBOX["west"], BBOX["north"], BBOX["east"]
    query = f"""
[out:json][timeout:{OVERPASS_TIMEOUT}];
(
  way["landuse"~"plantation|farmland|farmyard|orchard|forest|residential|commercial|retail|industrial|reservoir"]({s},{w},{n},{e});
  way["natural"~"wood|scrub|water"]({s},{w},{n},{e});
  way["water"]({s},{w},{n},{e});
  relation["landuse"~"forest|reservoir"]({s},{w},{n},{e});
  relation["natural"~"water|wood"]({s},{w},{n},{e});
);
out geom;
""".strip()

    try:
        print("  Querying Overpass for basin landuse …", flush=True)
        r = requests.post(
            OVERPASS_URL,
            data={"data": query},
            headers={"User-Agent": "YalaDashboard/1.0", "Accept": "application/json"},
            timeout=OVERPASS_TIMEOUT + 10,
        )
        r.raise_for_status()
        data = r.json()
    except Exception as exc:  # noqa: BLE001
        print(f"  Overpass unavailable ({exc}) — using built-in polygons.", flush=True)
        return None

    features: list[dict] = []
    for el in data.get("elements", []):
        geom = el.get("geometry")
        if not geom or len(geom) < 4:
            continue
        klass = _classify(el.get("tags", {}))
        if klass is None:
            continue
        ring = [[g["lon"], g["lat"]] for g in geom if "lon" in g and "lat" in g]
        if len(ring) < 4:
            continue
        if ring[0] != ring[-1]:
            ring.append(ring[0])
        features.append(_landcover_feature(klass, [ring], source="osm-overpass"))

    print(f"  OSM landcover features: {len(features)}", flush=True)
    return features if features else None


def _classify(tags: dict) -> str | None:
    for key in ("landuse", "natural", "waterway", "water"):
        val = tags.get(key)
        if val:
            combo = f"{key}={val}"
            if combo in TAG_CLASS:
                return TAG_CLASS[combo]
    if tags.get("water"):
        return "water"
    return None


def _landcover_feature(klass: str, coords: list, source: str) -> dict:
    return {
        "type": "Feature",
        "geometry": {"type": "Polygon", "coordinates": coords},
        "properties": {
            "class": klass,
            "color": CLASS_COLORS[klass],
            "source": source,
            "note": "derived",
        },
    }


def _rect(w: float, s: float, e: float, n: float) -> list:
    return [[[w, s], [e, s], [e, n], [w, n], [w, s]]]


def builtin_landcover() -> list[dict]:
    """Plausible land cover keyed to real Yala basin geography (fallback)."""
    return [
        # Forest reserve on the western hills.
        _landcover_feature("forest", _rect(101.20, 6.30, 101.26, 6.60), "heuristic"),
        # Rubber plantations on the rolling terrain east + south of the city.
        _landcover_feature("rubber-plantation", _rect(101.30, 6.42, 101.35, 6.60), "heuristic"),
        _landcover_feature("rubber-plantation", _rect(101.24, 6.18, 101.32, 6.34), "heuristic"),
        # Urban core (Yala circular city).
        _landcover_feature("built-up", _rect(101.265, 6.525, 101.305, 6.565), "heuristic"),
        # Reservoir behind Bang Lang Dam.
        _landcover_feature("water", _rect(101.24, 6.11, 101.29, 6.20), "heuristic"),
        # Pattani River channel (thin corridor through the city, see flood gen).
        _landcover_feature("water", _rect(101.278, 6.20, 101.290, 6.58), "heuristic"),
        # Paddy on the floodplain north of the city.
        _landcover_feature("paddy", _rect(101.255, 6.565, 101.315, 6.60), "heuristic"),
        _landcover_feature("paddy", _rect(101.295, 6.46, 101.33, 6.52), "heuristic"),
    ]


# ── Flood-prone corridor ──────────────────────────────────────────────────────
def build_floodprone() -> list[dict]:
    """Corridor along the Pattani River, dam → city, bucketed by risk.

    The channel runs roughly N–S near lng 101.284. We lay down stacked latitude
    bands and widen the high/med/low buffers around the channel. Downstream of
    the dam and through the low-lying urban floodplain is highest risk.
    """
    channel_lng = 0.5 * (BANG_LANG_DAM["lng"] + YALA_CENTER["lng"])  # ~101.278
    features: list[dict] = []

    # Latitude bands from just below the dam up past the city.
    bands = [
        # (south, north, risk, note)
        (6.15, 6.25, "high", "immediately downstream of Bang Lang Dam — release-surge corridor"),
        (6.25, 6.40, "med", "mid-reach Pattani River floodplain"),
        (6.40, 6.50, "med", "approach to Yala city, narrowing valley"),
        (6.50, 6.57, "high", "Yala urban floodplain — low-lying riverside districts"),
        (6.57, 6.60, "med", "downstream of city, paddy floodplain"),
    ]
    half_width = {"high": 0.020, "med": 0.045, "low": 0.075}

    for s, n, risk, note in bands:
        hw = half_width[risk]
        w, e = channel_lng - hw, channel_lng + hw
        features.append({
            "type": "Feature",
            "geometry": {"type": "Polygon", "coordinates": _rect(w, s, e, n)},
            "properties": {
                "risk": risk,
                "color": RISK_COLORS[risk],
                "note": f"derived — {note}",
            },
        })
        # A wider low-risk apron around the med/high core.
        lw = half_width["low"]
        features.append({
            "type": "Feature",
            "geometry": {
                "type": "Polygon",
                "coordinates": _rect(channel_lng - lw, s, channel_lng + lw, n),
            },
            "properties": {
                "risk": "low",
                "color": RISK_COLORS["low"],
                "note": "derived — outer floodplain fringe",
            },
        })

    return features


# ── Main ──────────────────────────────────────────────────────────────────────
def main() -> None:
    offline = "--offline" in sys.argv
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    print("Yala AlphaEarth static generator (derived / reference — NOT live GEE)")
    print(f"  Basin bbox: {BBOX}")

    osm_features = None if offline else fetch_osm_landcover()
    if osm_features:
        # OSM in this rural basin is patchy: it carries built-up + water well but
        # rarely tags rubber estates, forest reserve, or paddy. Augment the OSM
        # features with built-in regional polygons for the classes OSM under-
        # represents so the basin reads as the rubber/forest/paddy landscape it is.
        present = {f["properties"]["class"] for f in osm_features}
        augment = [
            f for f in builtin_landcover()
            if f["properties"]["class"] in {"rubber-plantation", "paddy", "forest"}
            and f["properties"]["class"] not in present
            or f["properties"]["class"] in {"rubber-plantation", "paddy"}
        ]
        lc_features = osm_features + augment
        lc_source = "osm-overpass+heuristic"
    else:
        lc_features = builtin_landcover()
        lc_source = "heuristic"

    landcover = {
        "type": "FeatureCollection",
        "properties": {
            "derived": True,
            "live": False,
            "source": lc_source,
            "note": "DERIVED reference data, not live Google Earth Engine. "
                    "Replace via scripts/alphaearth-extract-yala.py when GEE creds exist.",
            "generated": datetime.now(timezone.utc).isoformat(),
        },
        "features": lc_features,
    }
    (OUT_DIR / "landcover.geojson").write_text(json.dumps(landcover, separators=(",", ":")))
    print(f"  landcover.geojson  ({len(lc_features)} features, source={lc_source})")

    fp_features = build_floodprone()
    floodprone = {
        "type": "FeatureCollection",
        "properties": {
            "derived": True,
            "live": False,
            "source": "heuristic — Pattani River corridor + Bang Lang Dam downstream",
            "note": "DERIVED reference data, not live Google Earth Engine. "
                    "Replace via scripts/alphaearth-extract-yala.py when GEE creds exist.",
            "generated": datetime.now(timezone.utc).isoformat(),
        },
        "features": fp_features,
    }
    (OUT_DIR / "floodprone.geojson").write_text(json.dumps(floodprone, separators=(",", ":")))
    print(f"  floodprone.geojson ({len(fp_features)} features)")

    counts: dict[str, int] = {}
    for f in lc_features:
        c = f["properties"]["class"]
        counts[c] = counts.get(c, 0) + 1
    print(f"  Landcover class counts: {counts}")


if __name__ == "__main__":
    main()
