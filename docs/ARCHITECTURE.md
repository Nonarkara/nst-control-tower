# Architecture

> English, for developers and AI. The Thai picture-story lives in [`story/`](story/);
> the visual style in [`STYLE.md`](STYLE.md).

Yala Smart City is a **pnpm monorepo**. One engine, re-pointable at any city.

```
apps/api/         Hono API — data adapters + the digital-twin store
apps/web/         React 19 + Vite + deck.gl + MapLibre dashboard
packages/shared/  Shared TypeScript types + utilities (types.ts, locale.ts, campus.ts)
```

## The data contract — `NormalizedFeed<T>`

Every API route returns the same envelope. Panels never see a raw upstream payload.

```ts
interface NormalizedFeed<T> {
  features: T[];
  meta: SourceMeta;   // source, fetchedAt, ageMinutes, fallbackTier
}
```

This is the spine of the system: a panel only has to understand one shape, and every feed
can be rendered, aged, and health-checked uniformly.

## Adapters

Each upstream source has one adapter in `apps/api/src/adapters/<name>.ts`. An adapter:

1. fetches the upstream source (with a timeout),
2. reshapes it into typed `features`,
3. stamps `meta` (source name, fetch time, age, and a `fallbackTier`),
4. degrades — on error it returns the best available tier rather than throwing.

Adding a source = adding one adapter + one route, with a unit test asserting its contract.

## Fallback tiers — graceful degradation

The dashboard never goes blank. Every feed declares how fresh it is, and the UI colours it:

| Tier | Meaning | UI |
|---|---|---|
| `live` | fresh from upstream | green |
| `cache` | last good value, still recent | gold |
| `modelled` | synthesised / estimated | orange, labelled `MODELLED` |
| `unavailable` | source down, env var missing | red, with a `meta.note` explaining why |

`safeFeed` treats `unavailable` as a health error so it surfaces in the SOURCES catalog.

## The digital twin

Buildings (and other city objects) are hydrated into an in-memory twin store
(`apps/api/src/lib/twinStore.ts`) from the building GeoJSON, and optionally persisted to
Postgres/PostGIS. Each object has a stable id (the OSM way/relation id), a properties bag,
relations, and time-series state — exposed under `/api/twin/*`. This is what lets a single
building **hold data**: sensors, reports, a municipal type, live readings.

To persist: create a Postgres (e.g. Supabase) database, enable `postgis`, run
`apps/api/src/lib/twinSchema.sql`, and set `SUPABASE_DB_URL` (or `DATABASE_URL`) in
`apps/api/.env`. Without a database the twin runs fully in memory.

## The web layer

- **Map** — `DeckGL` (deck.gl) wrapping `MapLibreMap` (`react-map-gl/maplibre`). Controlled
  `viewState` (pitch/bearing/zoom), rAF-throttled. ~60 layers built in a `useMemo` from the
  enabled-layer set.
- **Lenses** — `apps/web/src/map/presets.ts` maps each lens (`EXEC · OPS · MOB · MAR · ENV ·
  EAR · SAF · VIB · INT`) to a set of layers. One city, many views.
- **Buildings** — a `GeoJsonLayer` (extruded), coloured by type via `lib/building.ts` +
  `map/layers.ts`. Untyped footprints render neutral; a `mnType` override lets curated data
  win over OSM tags. On-map legend in `components/BuildingLegend.tsx`.
- **Panels** — every panel starts with `<PanelHeader>` and consumes a `NormalizedFeed` via an
  SWR hook in `App.tsx`.
- **Mobile** — `useIsMobile` + a three-tab shell (Map · Brief · Layers). The map tab is a
  full-screen map; the world strip, clocks, and feeds relocate into the Brief page.

## Runtime & tests

- The API runs as a long-lived Node process and is also Cloudflare-Worker compatible.
- `pnpm tsc --noEmit` type-checks the whole repo.
- `pnpm --filter @yala/web test` runs 521 web unit tests; `test:e2e` runs Playwright smoke
  tests. CI runs type-check + unit + E2E on every PR.

See [`CLAUDE.md`](../CLAUDE.md) for the full conventions (PanelHeader, design tokens,
freshness classes, file-size limits).
