"""Yala City geography + forecast configuration.

Yala is inland/mountainous in Thailand's Deep South. The Pattani River runs
through the planned circular city; Bang Lang Dam sits upstream (south) in
Bannang Sata. The headline municipal concern is FLOODING — monsoon rainfall
plus dam-release / river-discharge spikes.

All coordinates are WGS84 (lng, lat).
"""

from __future__ import annotations

from dataclasses import dataclass

# ── Key locations ─────────────────────────────────────────────────────────────
YALA_CENTER = {"lng": 101.2831, "lat": 6.5425}        # circular city center
BANG_LANG_DAM = {"lng": 101.2736, "lat": 6.1564}      # upstream, Bannang Sata

# City bounding box (the dense urban core).
CITY_BBOX = {"minLng": 101.25, "minLat": 6.50, "maxLng": 101.32, "maxLat": 6.58}

# Basin bounding box — extends south to the reservoir / dam so flood modelling
# captures upstream inflow along the Pattani River.
BASIN_BBOX = {"minLng": 101.20, "minLat": 6.10, "maxLng": 101.35, "maxLat": 6.60}

PLACE_NAME = "Yala"
PLACE_NAME_TH = "ยะลา"
RIVER_NAME = "Pattani River"
RIVER_NAME_TH = "แม่น้ำปัตตานี"

# Timezone for display / Open-Meteo queries (Thailand = UTC+7).
TIMEZONE = "Asia/Bangkok"


@dataclass(frozen=True)
class OpenMeteoQuery:
    """A point to query Open-Meteo for, tagged with the twin object_id it maps to."""

    name: str
    object_id: str
    lat: float
    lng: float


# Open-Meteo query points. The city center drives precipitation; the dam point
# drives upstream river-discharge so we can lead-time downstream flood risk.
OPEN_METEO_POINTS: list[OpenMeteoQuery] = [
    OpenMeteoQuery("Yala city center", "city", YALA_CENTER["lat"], YALA_CENTER["lng"]),
    OpenMeteoQuery("Bang Lang Dam (upstream)", "bang_lang_dam", BANG_LANG_DAM["lat"], BANG_LANG_DAM["lng"]),
]
