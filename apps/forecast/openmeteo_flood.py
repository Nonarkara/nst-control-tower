"""Open-Meteo direct flood/precipitation forecast for Yala — the LIVE path.

This module is the graceful-degradation fallback for the TimesFM runner. It
requires NO GPU, NO model checkpoint, and NO database history: it pulls
forecasts straight from the Open-Meteo public APIs (no API key required) for
the Yala city center and the upstream Bang Lang Dam.

Two products, both flood-oriented:
  * precipitation_mm   — hourly precipitation forecast (Forecast API)
  * river_discharge    — daily river discharge (GloFAS via Flood API)

The output schema matches what timesfm_runner writes back: a list of
(time, object_id, metric, value, source, properties) records, so the same
DB-upsert path can be reused. When run standalone (no DB), it just returns the
parsed forecast dicts.

Open-Meteo endpoints (free, no auth):
  https://api.open-meteo.com/v1/forecast        (precipitation)
  https://flood-api.open-meteo.com/v1/flood     (river discharge / GloFAS)
"""

from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Any

import httpx

from yala_config import OPEN_METEO_POINTS, TIMEZONE, OpenMeteoQuery

logger = logging.getLogger(__name__)

FORECAST_URL = "https://api.open-meteo.com/v1/forecast"
FLOOD_URL = "https://flood-api.open-meteo.com/v1/flood"
HTTP_TIMEOUT = 30.0

# How far ahead to forecast.
PRECIP_HOURS = 48      # 2-day hourly precipitation horizon
DISCHARGE_DAYS = 7     # 1-week daily river-discharge horizon


def _fetch_precipitation(client: httpx.Client, pt: OpenMeteoQuery) -> list[dict[str, Any]]:
    """Hourly precipitation forecast for a point."""
    resp = client.get(
        FORECAST_URL,
        params={
            "latitude": pt.lat,
            "longitude": pt.lng,
            "hourly": "precipitation",
            "forecast_hours": PRECIP_HOURS,
            "timezone": "UTC",
        },
    )
    resp.raise_for_status()
    data = resp.json()
    hourly = data.get("hourly", {})
    times = hourly.get("time", [])
    values = hourly.get("precipitation", [])
    out: list[dict[str, Any]] = []
    for t, v in zip(times, values):
        if v is None:
            continue
        out.append({"time": t, "value": float(v)})
    return out


def _fetch_river_discharge(client: httpx.Client, pt: OpenMeteoQuery) -> list[dict[str, Any]]:
    """Daily river discharge forecast (GloFAS) for a point."""
    resp = client.get(
        FLOOD_URL,
        params={
            "latitude": pt.lat,
            "longitude": pt.lng,
            "daily": "river_discharge",
            "forecast_days": DISCHARGE_DAYS,
            "timezone": "UTC",
        },
    )
    resp.raise_for_status()
    data = resp.json()
    daily = data.get("daily", {})
    times = daily.get("time", [])
    values = daily.get("river_discharge", [])
    out: list[dict[str, Any]] = []
    for t, v in zip(times, values):
        if v is None:
            continue
        out.append({"time": t, "value": float(v)})
    return out


def fetch_yala_forecasts() -> dict[str, list[dict[str, Any]]]:
    """Fetch all Yala flood-oriented forecasts from Open-Meteo.

    Returns a dict keyed by "<object_id>:<metric>" → list of {time, value}.
    Errors per-point are logged and skipped so a single API hiccup does not
    take the whole run down.
    """
    results: dict[str, list[dict[str, Any]]] = {}
    with httpx.Client(timeout=HTTP_TIMEOUT) as client:
        for pt in OPEN_METEO_POINTS:
            try:
                precip = _fetch_precipitation(client, pt)
                results[f"{pt.object_id}:precipitation.forecast"] = precip
                logger.info("Open-Meteo precipitation for %s: %d hourly points", pt.name, len(precip))
            except Exception:
                logger.exception("Precipitation fetch failed for %s", pt.name)

            try:
                discharge = _fetch_river_discharge(client, pt)
                results[f"{pt.object_id}:riverDischarge.forecast"] = discharge
                logger.info("Open-Meteo river discharge for %s: %d daily points", pt.name, len(discharge))
            except Exception:
                logger.exception("River discharge fetch failed for %s", pt.name)

    return results


def to_twin_records(forecasts: dict[str, list[dict[str, Any]]]) -> list[tuple]:
    """Convert fetched forecasts to twin_state upsert records.

    Record shape mirrors timesfm_runner: (time, object_id, metric, value,
    source, properties_json). Source is 'open-meteo' so it is distinguishable
    from TimesFM output and from raw observations.
    """
    import json

    generated_at = datetime.now(tz=timezone.utc).isoformat()
    records: list[tuple] = []
    for key, points in forecasts.items():
        object_id, metric = key.split(":", 1)
        for p in points:
            records.append(
                (
                    _parse_time(p["time"]),
                    object_id,
                    metric,
                    p["value"],
                    "open-meteo",
                    json.dumps({"generated_at": generated_at, "tz": TIMEZONE}),
                )
            )
    return records


def _parse_time(raw: str) -> datetime:
    """Parse an Open-Meteo ISO time (no tz suffix) as UTC."""
    dt = datetime.fromisoformat(raw)
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
    fc = fetch_yala_forecasts()
    for key, pts in fc.items():
        peak = max((p["value"] for p in pts), default=0.0)
        print(f"{key:40s} {len(pts):3d} pts  peak={peak:.2f}")
