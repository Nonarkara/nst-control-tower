# Data sources

> English, for developers. Every source is pulled by an adapter and returned as a
> `NormalizedFeed<T>` with a freshness tier — see [`ARCHITECTURE.md`](ARCHITECTURE.md).

The in-app **SOURCES** catalog is the live source of truth (68 entries: 27 live / 10 ready / 18 planned / 13 research). This page is the developer-facing overview.

The canonical source list lives in `packages/shared/src/sources.ts` (`SOURCE_CATALOG`). The SOURCES modal in the dashboard reads from this catalog and cross-references live adapter health from `/api/health/detailed`.

## By category

| Category | Sources (examples) |
|---|---|
| **Flood & water** (largest group) | HII ThaiWater river gauges (26 stations), HII ThaiWater rainfall (130 stations), DWR Early Warning System (~86 flash-flood/soil stations), RID reservoirs, Open-Meteo Flood (GloFAS discharge), WRF-ROMS rain forecast (HII ~3 km grid), UNOSAT 2021 exposure, national flood-prone areas, national waterways (OSM) |
| **Weather & air** | Open-Meteo forecast + precipitation nowcast, Air4Thai (PCD), AQICN, Open-Meteo AQ grid + 8h trend, NASA POWER climate readings |
| **Earth observation** | NASA GIBS (MODIS true-color, VIIRS, NDVI, LST, AOD, NO₂, IMERG rain), GISTDA THEOS-2 (50 cm), GISTDA POI Digital Twin (100K+ POIs), GISTDA solar/land-use/waste/LST |
| **Traffic & mobility** | iTIC/Longdo traffic events, Longdo CCTV, NST Airport FIDS (AirLabs), SRT Southern Line |
| **Maritime & coastal** | AIS vessels, OpenSeaMap ports/ferries/nav-aids (OSM) |
| **Civic & reports** | Traffy Fondue citizen reports, city-reporter internal intake |
| **Government open data** | data.go.th CKAN catalog + curated POIs, NSO provincial statistics, DLA open data, depa CityData |
| **Social & news** | Google News RSS, Thai PBS / The Nation RSS, Reddit, Facebook municipality page |
| **Markets (context)** | SET / global indices / forex / commodities via FMP + FRED |
| **Infrastructure** | MQTT telemetry bridge, PEA outages, PWA water (planned) |

## Optional API keys

Everything has a free tier or a graceful fallback. Nothing is hardcoded — keys are read from
the deployment environment (Cloudflare Workers secrets or `apps/api/.env` for Node).

| Env var | Service | Without it |
|---|---|---|
| `GEMINI_API_KEY` | Google Gemini (AI concierge + news summarisation) | chat disabled |
| `AQICN_TOKEN` | World Air Quality Index station readings | AQICN layer hidden |
| `FMP_API_KEY` | Financial Modeling Prep (market data) | markets hidden |
| `FRED_API_KEY` | Federal Reserve (US/Thai macro series) | forex/macro hidden |
| `FACEBOOK_PAGE_TOKEN` + `FACEBOOK_PAGE_ID` | Meta Graph API | the no-auth page-plugin iframe still works |
| `DATA_GO_TH_TOKEN` | data.go.th CKAN (reservoirs, disasters, KPIs) | those datasets hidden |
| `AIRLABS_API_KEY` | AirLabs (NST airport FIDS) | flights hidden |
| `GOOGLE_MAPS_API_KEY` | Google Maps (Street View, Geocoding, Places, Air Quality) | those layers hidden |
| `GISTDA_API_KEY` | GISTDA ArcGIS services | POI/solar/landuse layers hidden |
| `TMD_KEY` | Thai Meteorological Dept. | TMD forecast hidden |
| `SUPABASE_DB_URL` / `DATABASE_URL` | Postgres for the digital twin | twin runs in memory |

> Security: the repo contains **no secrets**. `.env` / `.env.*` are git-ignored; only
> `.env.example` is tracked. When you change an adapter that needs a new env var, set
> `meta.note` when it is missing so the SOURCES catalog shows a `⚠ KEY MISSING` chip.

## Data honesty: real vs simulated

The system explicitly labels every data point with a `fallbackTier`:

| Tier | Meaning |
|---|---|
| `live` | Real sensor/API data, fetched within the adapter's TTL |
| `database` | Persisted to the twin DB (authoritative source of record) |
| `cache` | Previously-fetched data served from browser localStorage |
| `reference` | Historical/statistical data (e.g. UNOSAT 2021, HII 17-year risk) — not live-updating |
| `scenario` | Model output (e.g. the flood "bathtub" simulator, WRF forecast) |
| `unavailable` | Upstream is down and no stale cache exists — shown as an explicit error, never faked |

No simulated data is ever presented as live. If a source fails, the system says so directly.

## Fork it for your city

The engine is geography-agnostic. To re-point it:

1. **Campus config** — edit `packages/shared/src/campus.ts`: city name, `center`,
   `innerBounds` / `outerBounds`, and `defaultView` (longitude, latitude, zoom, pitch, bearing).
2. **Buildings** — drop your city's OSM building GeoJSON at
   `apps/web/public/geo/<city>/buildings.geojson`.
3. **News / keywords** — update the keyword filters in the relevant adapters to your city's name.
4. **Source catalog** — trim or extend `packages/shared/src/sources.ts` for what your city has.
5. **Health mapping** — update `API_PATH_TO_ADAPTER` in `apps/web/src/lib/sourceCatalog.ts` so
   the SOURCES modal can cross-reference adapter health for any new routes you add.

```ts
// packages/shared/src/campus.ts
export const NST: CampusConfig = {
  id: "your-city",
  name: { en: "Your City Municipality", th: "เทศบาลเมืองของคุณ" },
  center: [YOUR_LNG, YOUR_LAT],
  innerBounds: [[LNG_SW, LAT_SW], [LNG_NE, LAT_NE]],
  outerBounds: [[LNG_SW_WIDE, LAT_SW_WIDE], [LNG_NE_WIDE, LAT_NE_WIDE]],
  defaultView: { longitude: YOUR_LNG, latitude: YOUR_LAT, zoom: 14, pitch: 60, bearing: 0 },
};
```

Nakhon Si Thammarat runs on this engine.