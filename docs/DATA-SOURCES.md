# Data sources

> English, for developers. Every source is pulled by an adapter and returned as a
> `NormalizedFeed<T>` with a freshness tier — see [`ARCHITECTURE.md`](ARCHITECTURE.md).

The in-app **SOURCES** catalog is the live source of truth (47 entries). This page is the
developer-facing overview.

## By category

| Category | Sources (examples) |
|---|---|
| Weather & air | Open-Meteo forecast + precipitation nowcast, AQICN, Open-Meteo AQ |
| Flood & water | Open-Meteo Flood (GloFAS river discharge), IMERG rainfall, waterways, reservoirs (DDPM/MWA) |
| Earth observation | NASA GIBS (VIIRS, MODIS, Himawari IR, NDVI, LST, AOD, NO₂, flood), NASA POWER, GISTDA |
| Traffic & mobility | iTIC/Longdo incidents, CCTV, transit |
| Maritime & coastal | Open-Meteo Marine (waves/SST/swell/current), AIS vessels, fishery zones, tides |
| Civic & reports | Traffy Fondue citizen reports, city-reporter, civic POIs |
| Government open data | data.go.th catalog + curated POIs |
| Social & news | municipal Facebook page (Meta page plugin), news feeds, Google Trends |
| Markets (context) | SET / indices / forex / oil via FMP + FRED |

## Optional API keys

Everything has a free tier or a graceful fallback. Nothing is hardcoded — keys are read from
`apps/api/.env` (which is git-ignored).

| Env var | Service | Without it |
|---|---|---|
| `GEMINI_API_KEY` | Google Gemini (AI concierge) | chat disabled |
| `AISSTREAM_TOKEN` | AISStream.io (vessels) | AIS layer hidden |
| `FACEBOOK_PAGE_TOKEN` + `FACEBOOK_PAGE_ID` | Meta Graph API | the no-auth page-plugin iframe still works |
| `FMP_API_KEY` | Financial Modeling Prep | markets hidden |
| `FRED_API_KEY` | Federal Reserve (FRED) | forex/macro hidden |
| `SUPABASE_DB_URL` / `DATABASE_URL` | Postgres for the twin | twin runs in memory |

> Security: the repo contains **no secrets**. `.env` / `.env.*` are git-ignored; only
> `.env.example` is tracked. When you change an adapter that needs a new env var, set
> `meta.note` when it is missing and assert it in `apps/api/src/adapters/<name>.test.ts`.

## Fork it for your city

The engine is geography-agnostic. To re-point it:

1. **Campus config** — edit `packages/shared/src/campus.ts`: city name, `center`,
   `innerBounds` / `outerBounds`, and `defaultView` (longitude, latitude, zoom, pitch, bearing).
2. **Buildings** — drop your city's OSM building GeoJSON at
   `apps/web/public/geo/<city>/buildings.geojson`.
3. **News / keywords** — update the keyword filters in the relevant adapters to your city's name.
4. **Source catalog** — trim or extend `apps/api/src/data/sourceCatalog.ts` for what your city has.

```ts
// packages/shared/src/campus.ts
export const YALA: CampusConfig = {
  id: "your-city",
  name: { en: "Your City Municipality", th: "เทศบาลเมืองของคุณ" },
  center: [YOUR_LNG, YOUR_LAT],
  innerBounds: [[LNG_SW, LAT_SW], [LNG_NE, LAT_NE]],
  outerBounds: [[LNG_SW_WIDE, LAT_SW_WIDE], [LNG_NE_WIDE, LAT_NE_WIDE]],
  defaultView: { longitude: YOUR_LNG, latitude: YOUR_LAT, zoom: 14, pitch: 60, bearing: 0 },
};
```

Yala, Chonburi, and a university campus already run on this same engine.
