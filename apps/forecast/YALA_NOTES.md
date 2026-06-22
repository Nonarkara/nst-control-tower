# Yala Forecast Service — what's live, what's scenario, what needs creds

Forked from the Chonburi forecast service and rescoped for Yala City
(Pattani River basin, Bang Lang Dam upstream). Yala's headline concern is
**flooding**, so the forecast metrics are precipitation and river discharge,
not the coastal tide/vessel series the Chonburi fork used.

Geography constants live in `yala_config.py`:
- City center: lng 101.2831, lat 6.5425
- Bang Lang Dam (upstream): lng 101.2736, lat 6.1564
- Basin bbox: 101.20–101.35 E, 6.10–6.60 N (extends south to the reservoir)

## Status matrix

| Capability | Status | Needs |
|---|---|---|
| **Open-Meteo precipitation + river discharge** for Yala city & Bang Lang Dam | ✅ LIVE | nothing — public API, no key |
| **TimesFM model forecasting** (quantile bands from DB history) | ⚠️ SCENARIO | `timesfm` + PyTorch installed, ~800 MB checkpoint, ideally a GPU/large-RAM host, and hourly history in `twin_state` |
| **AlphaEarth land cover + flood-prone layers** | 🟡 DERIVED static (committed) | Google Earth Engine creds to go live |

### Live: Open-Meteo (`openmeteo_flood.py`)

No GPU, no model, no DB history. Pulls:
- `precipitation.forecast` — 48 h hourly precipitation (Open-Meteo Forecast API)
- `riverDischarge.forecast` — 7-day daily river discharge (Open-Meteo Flood API / GloFAS)

for both the city center and Bang Lang Dam. Writes to `twin_state` with
`source='open-meteo'`. This is also the automatic fallback when TimesFM can't load.

Smoke-test it standalone (no DB):
```bash
python openmeteo_flood.py
```

### Scenario: TimesFM (`timesfm_runner.py`)

`run_all_forecasts()` tries to load TimesFM first. If the `timesfm` package or
its checkpoint is unavailable, it logs a warning and falls back to the
Open-Meteo path automatically — the service never hard-fails on a missing model.

To enable real model forecasting:
```bash
pip install torch --index-url https://download.pytorch.org/whl/cpu
pip install "timesfm[torch]>=1.2.0"
```
(uncomment the same lines in `render.yaml` / `requirements.txt` and bump the
Render plan above starter). Requires hourly history flowing into `twin_state`
for `precipitation_mm`, `river_discharge`, and `aqi`.

### Derived: AlphaEarth (`../../scripts/`)

Committed static GeoJSON lives at
`apps/web/public/geo/yala/alphaearth/{landcover,floodprone}.geojson` and is
flagged `derived: true, live: false`. Regenerate with no auth:
```bash
python scripts/yala-alphaearth-static.py
```
Real GEE pipeline (auth required, see script header):
```bash
python scripts/alphaearth-extract-yala.py
```

## Running the service

```bash
# Live path only (recommended default — no model deps):
pip install -r requirements.txt
export DATABASE_URL="postgresql://…supabase…"   # or SUPABASE_DB_URL
python main.py            # FastAPI + hourly scheduler, GET /health, POST /run

# One-shot batch (launchd / cron), no HTTP server:
python run_local.py
```

macOS launchd: `com.nonarkara.yala-forecast.plist` (set `DATABASE_URL`, paths
already point at this project).

## Env vars

| Var | Required | Purpose |
|---|---|---|
| `DATABASE_URL` / `SUPABASE_DB_URL` | yes (for DB writes) | Postgres connection string |
| `PORT` | no (default 8000) | HTTP port for `main.py` |
| `HF_HOME` | only with TimesFM | HuggingFace checkpoint cache |
| `PYTORCH_ENABLE_MPS_FALLBACK=1` | only with TimesFM on Apple Silicon | MPS op fallback |
| `GOOGLE_CLOUD_PROJECT`, `EE_SERVICE_ACCOUNT`, `EE_PRIVATE_KEY_FILE` | only for real AlphaEarth | Earth Engine auth |
