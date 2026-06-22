"""TimesFM 2.0 inference runner for Yala municipal flood metrics.

Yala's headline concern is FLOODING (Pattani River + Bang Lang Dam upstream),
so the configured metrics are precipitation and river discharge rather than the
coastal tide/vessel series the Chonburi fork used.

For each configured metric:
  1. Pull the last CONTEXT_LENGTH hourly points from twin_state
  2. Run zero-shot TimesFM forecast for HORIZON steps ahead
  3. Upsert each forecast point back into twin_state with source='timesfm'

The p10/p90 quantile bounds are stored in the JSONB `properties` column so
the frontend can render confidence bands without a schema change.

GRACEFUL DEGRADATION: TimesFM is a heavy dependency (~800 MB checkpoint, slow on
CPU and unavailable without a GPU on some hosts). If the `timesfm` package or its
checkpoint cannot be loaded, this runner falls back to the Open-Meteo direct
forecast (see openmeteo_flood.py), which needs no model and no DB history. That
keeps Yala's live flood/precip layer working everywhere.
"""

from __future__ import annotations

import json
import logging
from concurrent.futures import ThreadPoolExecutor, TimeoutError as FuturesTimeout
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from typing import Any

try:
    import timesfm  # type: ignore
    _TIMESFM_AVAILABLE = True
except Exception:  # ImportError, or missing torch / heavy deps
    timesfm = None  # type: ignore
    _TIMESFM_AVAILABLE = False

import openmeteo_flood

logger = logging.getLogger(__name__)

# Model is loaded once at process startup — ~2 GB on disk, ~800 MB in RAM (CPU).
_tfm: Any | None = None

CONTEXT_LENGTH = 512   # historical hourly points fed to the model
MIN_CONTEXT    = 24    # minimum points before we attempt inference

# Quantile head returns 10 quantile levels (0.1 … 0.9); we want the extremes
# and the median (index 0 = p10, index 4 = p50, index 8 = p90).
Q_LOW, Q_MID, Q_HIGH = 0, 4, 8


@dataclass
class ForecastConfig:
    metric: str          # column name in twin_state (historical source)
    out_metric: str      # metric name written back as forecast
    horizon: int         # steps ahead (each step = 1 hour)
    object_id: str = "city"


# Flood-oriented metrics for Yala. Precipitation (city) and upstream river
# discharge (Bang Lang Dam) are the leading indicators of downstream flood risk
# along the Pattani River. AQI is kept as a general air-quality series.
FORECAST_CONFIGS: list[ForecastConfig] = [
    ForecastConfig("precipitation_mm", "precipitation.forecast", horizon=24, object_id="city"),
    ForecastConfig("river_discharge",  "riverDischarge.forecast", horizon=24, object_id="city"),
    ForecastConfig("river_discharge",  "riverDischarge.forecast", horizon=24, object_id="bang_lang_dam"),
    ForecastConfig("aqi",              "aqi.forecast",            horizon=24, object_id="city"),
]


def _detect_backend() -> str:
    """Pick the best available PyTorch backend.

    On Apple Silicon (M1/M2/M3) with PyTorch ≥ 2.0, MPS is available and
    significantly faster than CPU for matrix ops. TimesFM uses 'torch' as the
    backend name regardless of the underlying device — PyTorch itself selects
    MPS when PYTORCH_ENABLE_MPS_FALLBACK=1 is set and mps.is_available().
    """
    try:
        import torch
        if torch.backends.mps.is_available():
            logger.info("Apple Silicon MPS detected — inference will use Metal GPU cores.")
            return "torch"
        if torch.cuda.is_available():
            logger.info("CUDA GPU detected.")
            return "gpu"
    except Exception:
        pass
    logger.info("No GPU detected — using CPU backend.")
    return "cpu"


def _load_model() -> Any:
    global _tfm
    if _tfm is not None:
        return _tfm
    if not _TIMESFM_AVAILABLE:
        raise RuntimeError("timesfm package unavailable — use Open-Meteo fallback")
    backend = _detect_backend()
    logger.info("Loading TimesFM 2.0 (200M, backend=%s) — first run downloads checkpoint …", backend)
    _tfm = timesfm.TimesFm(
        hparams=timesfm.TimesFmHparams(
            context_length=CONTEXT_LENGTH,
            horizon_length=max(c.horizon for c in FORECAST_CONFIGS),
            backend=backend,
        ),
        checkpoint=timesfm.TimesFmCheckpoint(
            huggingface_repo_id="google/timesfm-2.0-200m-pytorch"
        ),
    )
    logger.info("TimesFM model ready.")
    return _tfm


async def _pull_history(
    conn: Any, *, object_id: str, metric: str, limit: int
) -> list[float]:
    """Return the last `limit` hourly values for a metric, oldest first."""
    rows = await conn.fetch(
        """
        SELECT value FROM twin_state
        WHERE object_id = $1 AND metric = $2 AND source != 'timesfm'
        ORDER BY time DESC
        LIMIT $3
        """,
        object_id,
        metric,
        limit,
    )
    # rows are newest-first; reverse so we feed oldest → newest to the model
    return [float(r["value"]) for r in reversed(rows)]


async def _upsert_forecasts(
    conn: Any,
    *,
    object_id: str,
    metric: str,
    now: datetime,
    p50s: list[float],
    p10s: list[float],
    p90s: list[float],
) -> None:
    generated_at = now.isoformat()
    records = [
        (
            now + timedelta(hours=h + 1),
            object_id,
            metric,
            p50s[h],
            "timesfm",
            json.dumps(
                {
                    "p10": p10s[h],
                    "p90": p90s[h],
                    "generated_at": generated_at,
                }
            ),
        )
        for h in range(len(p50s))
    ]
    await conn.executemany(
        """
        INSERT INTO twin_state (time, object_id, metric, value, source, properties)
        VALUES ($1, $2, $3, $4, $5, $6::jsonb)
        ON CONFLICT (time, object_id, metric)
        DO UPDATE SET value = EXCLUDED.value,
                      source = EXCLUDED.source,
                      properties = EXCLUDED.properties
        """,
        records,
    )


async def _run_openmeteo_fallback(pool: Any) -> dict[str, str]:
    """Pull live Open-Meteo flood/precip forecasts and upsert them.

    Used when TimesFM is unavailable (no model checkpoint / no GPU) or when the
    DB has too little history for inference. Needs no model and no DB history.
    """
    logger.info("Running Open-Meteo direct forecast fallback for Yala …")
    forecasts = openmeteo_flood.fetch_yala_forecasts()
    records = openmeteo_flood.to_twin_records(forecasts)
    if not records:
        return {"open-meteo": "error — no forecast points returned"}

    async with pool.acquire() as conn:
        await conn.executemany(
            """
            INSERT INTO twin_state (time, object_id, metric, value, source, properties)
            VALUES ($1, $2, $3, $4, $5, $6::jsonb)
            ON CONFLICT (time, object_id, metric)
            DO UPDATE SET value = EXCLUDED.value,
                          source = EXCLUDED.source,
                          properties = EXCLUDED.properties
            """,
            records,
        )
    by_metric: dict[str, int] = {}
    for _t, oid, metric, *_rest in records:
        by_metric[f"{oid}:{metric}"] = by_metric.get(f"{oid}:{metric}", 0) + 1
    results = {k: f"ok — {n} points (open-meteo)" for k, n in by_metric.items()}
    logger.info("Open-Meteo fallback wrote %d records: %s", len(records), results)
    return results


async def run_all_forecasts(pool: Any) -> dict[str, str]:
    """Run forecasts for all configured metrics. Returns metric → status map.

    Tries TimesFM first; if the model cannot be loaded, falls back entirely to
    the Open-Meteo direct forecast so the Yala flood layer always has data.
    """
    try:
        model = _load_model()
    except Exception as exc:
        logger.warning("TimesFM unavailable (%s) — falling back to Open-Meteo.", exc)
        return await _run_openmeteo_fallback(pool)

    now   = datetime.now(tz=timezone.utc)
    results: dict[str, str] = {}

    async with pool.acquire() as conn:
        for cfg in FORECAST_CONFIGS:
            try:
                history = await _pull_history(
                    conn,
                    object_id=cfg.object_id,
                    metric=cfg.metric,
                    limit=CONTEXT_LENGTH,
                )
                if len(history) < MIN_CONTEXT:
                    results[cfg.out_metric] = f"skipped — only {len(history)} points (need {MIN_CONTEXT})"
                    logger.warning("Skipping %s: insufficient history (%d < %d)",
                                   cfg.out_metric, len(history), MIN_CONTEXT)
                    continue

                with ThreadPoolExecutor(max_workers=1) as _ex:
                    _fut = _ex.submit(model.forecast, inputs=[history], freq=["H"])
                    try:
                        point_forecast, quantile_forecast = _fut.result(timeout=120)
                    except FuturesTimeout as exc:
                        raise RuntimeError(
                            f"TimesFM inference timed out after 120s for {cfg.out_metric}"
                        ) from exc
                # Slice to the configured horizon for this metric
                p50s = [float(v) for v in point_forecast[0][: cfg.horizon]]
                p10s = [float(quantile_forecast[0][h][Q_LOW])  for h in range(cfg.horizon)]
                p90s = [float(quantile_forecast[0][h][Q_HIGH]) for h in range(cfg.horizon)]

                await _upsert_forecasts(
                    conn,
                    object_id=cfg.object_id,
                    metric=cfg.out_metric,
                    now=now,
                    p50s=p50s,
                    p10s=p10s,
                    p90s=p90s,
                )
                results[cfg.out_metric] = f"ok — {len(p50s)} steps written"
                logger.info("Forecast written: %s (%d steps)", cfg.out_metric, len(p50s))

            except Exception as exc:
                results[cfg.out_metric] = f"error — {exc}"
                logger.exception("Forecast failed for %s", cfg.out_metric)

    return results
