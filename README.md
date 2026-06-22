<div align="center">

# Yala Smart City · ยะลา สมาร์ทซิตี้
### Dr Non's Yala Super Dashboard — แดชบอร์ดเมืองอัจฉริยะ เทศบาลนครยะลา

**A free, open-source, real-time intelligence dashboard for Yala City Municipality, in Thailand's Deep South.**

[![React 19](https://img.shields.io/badge/Web-React%2019%20+%20Vite-blue)](https://react.dev)
[![deck.gl](https://img.shields.io/badge/Map-deck.gl%209%20+%20MapLibre-blue)](https://deck.gl)
[![Hono](https://img.shields.io/badge/API-Hono-orange)](https://hono.dev)
[![Tests](https://img.shields.io/badge/tests-521%20passing-2DAA9E)](#proof)
[![License: MIT](https://img.shields.io/badge/license-MIT-1A1A1A)](LICENSE)

**[🇹🇭 อ่านภาษาไทย → README.th.md](README.th.md)** · 🇬🇧 English (this page)

</div>

> **How to read this repo.** The *pictures* are in Thai, for residents and officials. The
> *words* (this README, the docs, the code) are in English, because that is what machines and
> developers read most reliably. So scroll for the story, read for the detail.

![Overview — real data, one screen, a decision](docs/story/00-overview.svg)

---

## The story in four pictures

Four questions a non-technical person asks — answered with one diagram each. Captions in English; the diagrams themselves are in Thai.

### 1 · Why does this exist? — ทำไม
The whole city used to live in scattered files, PDFs, and chat threads across many agencies.
By the time anyone assembled the picture, the moment had passed. In the Deep South — floods,
safety, the local economy — "knowing late" is not an option.

![Why](docs/story/01-why.svg)

### 2 · How does it work? — ทำงานยังไง
Every source is pulled by an **adapter**, reshaped into one common **NormalizedFeed**, written
into a live **digital twin** of the city, and rendered on the **dashboard**. It runs itself,
24/7, refreshing every 2–30 minutes.

![How](docs/story/02-how.svg)

### 3 · How do we know it's real? — พิสูจน์ <a id="proof"></a>
Not a slideshow. **15,148** tappable buildings, **47** connected sources, **live** auto-refreshing
feeds, **521** automated tests passing, **3** mobile pages, fully **open source**. Every number
traces back to running code.

![Proof](docs/story/03-proof.svg)

### 4 · Who benefits, and why does it last? — ใครได้อะไร
The mayor, officials, citizens, and partners (depa et al.) each **give** something and **get**
something. Because everyone is paid back, the loop sustains itself — it is not a one-off demo.

![People](docs/story/04-people.svg)

---

## More chapters

The same picture-story continues — each a single clean diagram, Thai labels, captions in English.
All live in [`docs/story/`](docs/story/); the visual style is defined in [`docs/STYLE.md`](docs/STYLE.md).

**The 3D city map** — แผนที่เมือง 3 มิติ · 2D/3D, buildings coloured by type, compass, live coordinates, tap-to-add-data.
![Map](docs/story/05-map.svg)

**One city, many lenses** — เมืองเดียว หลายมุมมอง · EXEC · OPS · MOB · MAR · ENV · EAR · SAF · VIB · INT.
![Lenses](docs/story/06-lenses.svg)

**Map-first mobile** — ใช้บนมือถือ · three clean, thumb-friendly pages: Map · Brief · Layers.
![Mobile](docs/story/07-mobile.svg)

**Digital twin** — แฝดดิจิทัล · every building has a stable id and can hold data (sensors, reports, type).
![Digital twin](docs/story/08-twin.svg)

**47 data sources, by category** — แหล่งข้อมูล · weather, flood, satellite, traffic, maritime, gov & social.
![Sources](docs/story/09-sources.svg)

**Graceful degradation** — ความทนทาน · live → cache → modelled → unavailable. The screen never goes blank.
![Resilience](docs/story/10-resilience.svg)

**Trust & transparency** — เชื่อใจได้ · public data only, no secrets, open source, every number traceable.
![Trust](docs/story/11-trust.svg)

**Fork it for your city** — ทำเมืองของคุณได้ · clone → set your city → deploy.
![Fork](docs/story/12-fork.svg)

**Architecture (for developers)** — สถาปัตยกรรม · a pnpm monorepo: `apps/api` · `apps/web` · `packages/shared`.
![Architecture](docs/story/13-architecture.svg)

---

## What is this? <a id="what"></a>

Yala Smart City is a **municipal "control tower"**: it folds dozens of live data feeds —
weather, air quality, flood & river discharge, traffic incidents, maritime/coastal data,
satellite earth-observation, citizen reports, and government open data — onto a single 3D map
of the city, and answers the only question that matters during a busy day:
**"What do I need to do right now?"**

It is a sibling of [`chonburi-control-tower`](https://github.com/Nonarkara/chonburi-control-tower)
— the same engine, re-pointed at Yala (เทศบาลนครยะลา) in Thailand's Deep South.

## Features <a id="features"></a>

- **3D city map** — all 15,148 OSM building footprints, extruded. Toggle **2D / 3D / 3D-substructure**.
- **Color by type** — buildings tint by category (hospital, temple, school, market…) with an on-map legend; untyped footprints stay neutral. Per-building data can be attached via the digital-twin API.
- **Compass + live coordinates** — a needle that resets north, and a lat/long readout under the cursor.
- **Lenses** — one city, many views: `EXEC · OPS · MOB · MAR · ENV · EAR · SAF · VIB · INT`.
- **Map-first mobile** — three clean, thumb-friendly pages: **Map · Brief · Layers**.
- **Graceful degradation** — every feed reports its freshness tier (live → cache → modelled → unavailable). The dashboard never goes blank; it tells you how stale a number is.
- **No secrets in the repo** — all keys are environment variables; the source is safe to read.

## Quick start <a id="quickstart"></a>

```bash
pnpm install
pnpm dev                 # all workspaces
# or individually:
pnpm --filter web dev    # frontend  → http://localhost:5173
pnpm --filter api dev    # API       → http://localhost:3000
```

Useful checks:

```bash
pnpm tsc --noEmit                       # type check
pnpm --filter @yala/web test            # 521 web unit tests
pnpm --filter @yala/web test:e2e        # Playwright smoke tests
```

## Architecture <a id="architecture"></a>

A pnpm monorepo:

| Workspace | What it is |
|---|---|
| `apps/api/` | **Hono** API — data adapters, each returning a typed `NormalizedFeed<T>`; the digital-twin store. |
| `apps/web/` | **React 19 + Vite + deck.gl + MapLibre** dashboard — lenses, map layers, panels. |
| `packages/shared/` | Shared TypeScript types + utilities (`types.ts`, `locale.ts`). |

Deeper notes: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) ·
[`docs/DATA-SOURCES.md`](docs/DATA-SOURCES.md) · conventions in [`CLAUDE.md`](CLAUDE.md).

## Fork it for your city <a id="fork"></a>

This is built to be re-pointed. Clone it, swap the campus config (center, bounds, building
GeoJSON, source catalog), and you have a control tower for *your* municipality. Yala, Chonburi,
and a university campus already run on this same engine. See
[`docs/DATA-SOURCES.md`](docs/DATA-SOURCES.md#fork-it-for-your-city).

## License & credits

MIT. Built by **Dr Non Arkaraprasertkul** ([nonarkara.org](https://nonarkara.org)) for the
[SLIC Index](https://github.com/Nonarkara/SLIC-Index) smart-city programme, with depa and
partners. Data belongs to its respective providers (NASA, GISTDA, Open-Meteo, data.go.th,
OpenStreetMap, and others — see the in-app SOURCES catalog).
