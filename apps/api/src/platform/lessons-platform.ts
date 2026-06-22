import type { AcademyLesson } from "@nst/shared";

/**
 * Academy track: "platform" — how to USE the Yala Knowledge Platform.
 *
 * These lessons teach the dashboard itself: the map lenses, the Data Atlas,
 * the search / archive / academy / ask tools, how data flows from sources to
 * the API to the map and atlas, and how a new data source gets integrated
 * following the Municipal Data Bible roadmap (GDX, GDCC, DOPA, GISTDA Sphere,
 * TPMAP, citydata.in.th CKAN).
 *
 * Every fact is drawn from the Yala Municipal Data Bible (Section 00,
 * Executive Summary). Citations point back to that source in keyFacts and body.
 */
export const platformLessons: AcademyLesson[] = [
  {
    id: "platform-orientation",
    track: "platform",
    order: 1,
    title: "Orientation: Two Layers, One City",
    titleTh: "ทำความรู้จักแพลตฟอร์ม: สองชั้น เมืองเดียว",
    summary:
      "What this platform is, why it exists, and the gap it closes — Yala tracks process with precision but is largely blind to developmental outcomes.",
    level: "intro",
    durationMin: 6,
    body: `# Two layers, one city

Yala City Municipality (เทศบาลนครยะลา) runs one of Thailand's most digitally mature local-government platforms. The YALA Resilience City ecosystem — a dual-dashboard system at yaladashboard.com, **five integrated big-data systems**, and **15 published datasets** on the DEPA Smart City Data Platform — has earned **three consecutive Digital Government Awards (2022–2024)** and an Integrity & Transparency Assessment (ITA) score of **91.21 (Grade A)**, ranking 9th of 65 Local Administrative Organizations in the province (Yala Municipal Data Bible, Sec. 00).

## The paradox this platform addresses

That operational sophistication hides a structural gap. The municipality tracks **process** with precision — budget execution, water consumption (497,838 m³/month), and complaint resolution (down to 1 day 4 hours, an 83% reduction). But it remains largely blind to **developmental outcomes** — poverty reduced, education improved, health enhanced, climate risk mitigated (Sec. 00).

The Bible frames it bluntly: Yala is **data-rich in operational metrics but information-poor in outcome indicators**. The dashboard knows how fast complaints close, but not whether resolution reduced repeat complaints.

## Two layers you will use

- **The dashboard (operational layer)** — live map *lenses* for operations, mobility, flood, environment, security and more. This is the "what's happening now" view.
- **The Knowledge Platform (outcome layer)** — the **Data Atlas** (poverty, education, health, climate, governance modules), unified **search**, an **archive / time-machine**, this **academy**, and an **ask** concierge.

The whole point of the platform is to connect the strong presentation layer to the missing **outcome-data layer** — turning display into decision support. The good news from the Bible: *closing this gap does not require building new systems*, only connecting existing infrastructure to free national and open platforms.`,
    keyFacts: [
      "Yala won three consecutive Digital Government Awards (2022–2024) and scored ITA 91.21 (Grade A), 9th of 65 LAOs in the province (Bible Sec. 00).",
      "The municipality runs 5 big-data systems and 19+ dashboard modules, and publishes 15 datasets on the DEPA CityData platform (Bible Sec. 00).",
      "Central paradox: Yala is data-rich in operational metrics (e.g. 83% faster complaint resolution) but information-poor in outcome indicators like poverty, education, and health (Bible Sec. 00).",
    ],
    links: [
      { label: "Open the Executive lens", lens: "executive" },
      { label: "Open the Operations lens", lens: "operations" },
      { label: "Atlas: Governance module", atlasModule: "governance" },
    ],
    quiz: [
      {
        q: "What does the Yala Municipal Data Bible identify as the platform's central paradox?",
        choices: [
          "The dashboard is slow and hard to use",
          "Yala is data-rich in operational metrics but information-poor in outcome indicators",
          "There are too many datasets to process",
          "The municipality has no digital infrastructure",
        ],
        answer: 1,
        explain:
          "The Bible's Executive Summary states Yala tracks process (budget, water, complaints) with precision but lacks outcome data on poverty, education, health, and climate.",
      },
      {
        q: "How many consecutive Digital Government Awards has Yala earned, per the Bible?",
        choices: ["One (2024)", "Two (2023–2024)", "Three (2022–2024)", "Five (2020–2024)"],
        answer: 2,
        explain: "The Bible (Sec. 00) credits Yala with three consecutive Digital Government Awards, 2022–2024.",
      },
    ],
  },
  {
    id: "platform-tools-lenses-atlas",
    track: "platform",
    order: 2,
    title: "The Lenses, the Atlas, and the Four Tools",
    titleTh: "เลนส์ แอตลาส และเครื่องมือทั้งสี่",
    summary:
      "A guided tour of the map lenses, the Data Atlas modules, and the four platform tools — search, archive, academy, and ask — and when to reach for each.",
    level: "core",
    durationMin: 8,
    body: `# Knowing which surface to use

The platform gives you several ways into the same body of Yala data. Picking the right one saves time.

## Map lenses — "what is happening, where"

Lenses are themed live views on the city map. Reach for a lens when your question is **spatial and current**:

- **Flood** — flood extent and risk. Yala has seen **three catastrophic floods since 2022**, affecting **18,000+ households**, yet flood forecasting was historically absent from the dashboard (Bible Sec. 00).
- **Environment** — PM2.5 and air quality, already tracked operationally.
- **Poverty** — geographic need. The provincial **MPI poverty rate is 20.83% (208,274 persons)**, data the original dashboard did not visualize (Bible Sec. 00).
- Plus operations, mobility, security, and executive overviews.

## The Data Atlas — "what is the outcome, over time"

The Atlas organizes ~145 hard outcome statistics into governance-domain modules: **demographics, fiscal, outcomes, education, health, climate, economy, security, governance**. Reach for the Atlas when your question is about **levels, trends, and disparities** rather than a live map — e.g. education's HAI rank of **66th** or mental-health prevalence of **9.6%** against just **9 psychiatrists for 552,479 people** (Bible Sec. 00).

## The four tools

- **Search** — one box across indicators, sources, lessons, glossary, and datasets. Static index everywhere; live full-text search when the Mac daemon is online.
- **Archive (time-machine)** — accumulating snapshots of metrics (e.g. \`aqi.pm25\`, \`flood.dam.outflow\`) so you can scrub history.
- **Academy** — these lessons.
- **Ask** — a retrieval-augmented concierge that cites its sources; it falls back to retrieval-only when no LLM is available.`,
    keyFacts: [
      "The Data Atlas groups ~145 outcome statistics across 12 governance domains into modules: demographics, fiscal, outcomes, education, health, climate, economy, security, governance (Bible Sec. 00).",
      "Provincial MPI poverty is 20.83% (208,274 persons) and education ranks 66th on the HAI — outcome data the original dashboard did not visualize (Bible Sec. 00).",
      "Yala recorded three catastrophic floods since 2022 affecting 18,000+ households, with no predictive flood integration at the time (Bible Sec. 00).",
    ],
    links: [
      { label: "Open the Flood lens", lens: "flood" },
      { label: "Atlas: Poverty & outcomes", atlasModule: "outcomes" },
      { label: "Atlas: Education module", atlasModule: "education" },
      { label: "Atlas: Health module", atlasModule: "health" },
    ],
    quiz: [
      {
        q: "You want to compare education outcomes and trends across domains, not view a live map. Which surface fits best?",
        choices: ["A map lens", "The Data Atlas", "The archive time-machine", "The ask concierge"],
        answer: 1,
        explain:
          "The Atlas is built for outcome levels, trends, and disparities by governance domain (e.g. the HAI education rank of 66th), while lenses are for live spatial questions.",
      },
      {
        q: "According to the Bible, what is Yala province's MPI poverty rate?",
        choices: ["9.6%", "20.83%", "30.8%", "66%"],
        answer: 1,
        explain:
          "The MPI poverty rate is 20.83% (208,274 persons). 9.6% is mental-health prevalence and 30.8% is the NEET youth figure cited in Sec. 00.",
      },
      {
        q: "What does the 'ask' concierge do when no LLM is available?",
        choices: [
          "Returns an error",
          "Falls back to retrieval-only results with citations",
          "Switches to the archive",
          "Disables search entirely",
        ],
        answer: 1,
        explain:
          "The concierge is retrieval-augmented; when an LLM cannot synthesize an answer it degrades gracefully to retrieval-only, still surfacing cited sources.",
      },
    ],
  },
  {
    id: "platform-data-flow",
    track: "platform",
    order: 3,
    title: "How Data Flows: Sources → API → Map & Atlas",
    titleTh: "เส้นทางข้อมูล: แหล่งข้อมูล → API → แผนที่และแอตลาส",
    summary:
      "Trace a data point from its origin in a national or open platform, through the API normalization layer, to the lens and atlas surfaces — and why some pieces degrade gracefully offline.",
    level: "core",
    durationMin: 7,
    body: `# Following a data point through the system

Every number you see on a lens or in the Atlas travels the same path: **source → API → map / atlas**.

## 1. Sources

Data originates in external systems. Some are already wired in (PM2.5 air quality, budget, water, complaints via the five big-data systems). Many high-value outcome sources are *available but underutilized* — the Bible's whole thesis is that connecting them "does not require building new systems," only integration (Sec. 00). Examples on the roadmap:

- **DOPA** population API — real-time registration counts (552,479 provincial residents) by tambon.
- **TPMAP** — MPI poverty at tambon/village drill-down (20.83% rate).
- **GISTDA Sphere** — flood/fire/drought/PM2.5 geospatial layers.
- **MOPH HDC** — disease prevalence and health-workforce gaps.

## 2. The API (normalization layer)

The API ingests each source, validates and normalizes it into shared shapes, and exposes it through stable endpoints. This is where a vendor's raw JSON or a CKAN dataset becomes a consistent record the front-end can trust. The Bible's reference stack for this layer is fully open-source — **PostgreSQL + PostGIS + TimescaleDB**, **CKAN Open-D** for the catalog, **Kong Gateway** for API management — and **TH-e-GIF v2.0 compliant** (Sec. 00).

## 3. Map & Atlas (presentation)

Normalized data fans out to two presentation surfaces: **map lenses** for spatial/live questions and the **Data Atlas** for outcome modules.

## Static vs. live — graceful degradation

Static content (academy, glossary, data dictionary, computed insights, a static search index) is served everywhere. The **live, stateful pieces** — the accumulating archive, live full-text search, and the LLM concierge — are served by the Mac Node daemon and **degrade gracefully when it is offline**. So search still works (static index) and the archive simply stops accumulating until the daemon returns.`,
    keyFacts: [
      "Data flows source → API → map/atlas; the API normalizes each external source into shared shapes before it reaches a lens or atlas module (platform architecture).",
      "The Bible's recommended integration stack is open-source and TH-e-GIF v2.0 compliant: PostgreSQL + PostGIS + TimescaleDB, CKAN Open-D catalog, Kong Gateway (Bible Sec. 00).",
      "Live pieces (archive, live FTS, LLM concierge) run on the Mac Node daemon and degrade gracefully offline; static content (academy, glossary, search index) is served everywhere.",
    ],
    links: [
      { label: "See it on the Environment lens", lens: "environment" },
      { label: "Atlas: Climate module", atlasModule: "climate" },
      { label: "Atlas: Demographics module", atlasModule: "demographics" },
    ],
    quiz: [
      {
        q: "In what order does a data point move through the platform?",
        choices: [
          "Map → API → source",
          "Source → API → map / atlas",
          "Atlas → source → API",
          "API → source → map",
        ],
        answer: 1,
        explain:
          "A point originates in an external source, is normalized by the API, then fans out to the map lenses and the Data Atlas.",
      },
      {
        q: "Which components run on the Mac Node daemon and degrade gracefully when it is offline?",
        choices: [
          "The academy lessons and glossary",
          "The accumulating archive, live full-text search, and the LLM concierge",
          "The static search index",
          "The map lenses",
        ],
        answer: 1,
        explain:
          "Static content is served everywhere; the stateful archive, live FTS, and LLM concierge depend on the Node daemon and fail soft when it's down.",
      },
    ],
  },
  {
    id: "platform-integrate-new-source",
    track: "platform",
    order: 4,
    title: "Deep Dive: Integrating a New Data Source",
    titleTh: "เจาะลึก: การเชื่อมต่อแหล่งข้อมูลใหม่",
    summary:
      "Walk the Bible's integration roadmap — GDCC, GDX, citydata.in.th CKAN, DOPA, GISTDA Sphere, and TPMAP — phased from zero-budget immediate wins to medium-term modeling.",
    level: "deep",
    durationMin: 11,
    body: `# Adding a source, the Bible's way

The Municipal Data Bible turns "integrate a new source" into a phased roadmap. The headline finding: the **immediate-phase actions require zero budget beyond existing staff time** — GDCC, GDX, DEPA CityData CKAN, and the DOPA API are all **free government services** (Sec. 00). The only prerequisite is registration and configuration by the Strategy Division's Statistics, Data & IT Unit.

## Immediate (0–3 months) — free, no external partnership

- **GDCC** (gdcc.go.th) — register for free cloud IaaS; deploy a PostgreSQL + PostGIS instance. ISO 27001/27701 certified, 219 agencies hosted. Removes vendor hosting dependency.
- **GDX** (gdx.dga.or.th) — activate inter-agency data exchange. **194 agencies, 35.3M+ linkages/year, OAuth 2.0**. This is the pipe through which DOPA and business-registration pulls flow.
- **citydata.in.th CKAN** — expand DEPA CityData from 15 published datasets to full **CKAN API harvesting** for programmable, federatable access.
- **DOPA** population API (via GDX) — real-time population by tambon (552,479 provincial residents), eliminating manual entry.

## Short-term (3–6 months) — formal registration

- **GISTDA Sphere** (sphere.gistda.or.th) — free API key; WMS/WMTS/REST flood/fire/drought/PM2.5 layers for the climate-resilience module.
- **TPMAP** (tpmap.in.th) — layer the 20.83% MPI poverty data with tambon/village drill-down onto the dashboard for need-based service targeting.

## Medium-term (6–12 months) — modeling & coordination

Predictive flood warning (GloFAS + CHIRPS + Bang Lang Dam telemetry), pondok education GIS (161 institutions: 126 registered + 35 unregistered), and a predictive aging-service-demand model (WorldPop 100m projections).

## The integration checklist

For any new source, the Bible's pattern is: confirm it's free/authorized → register & authenticate (often OAuth 2.0 via GDX) → harvest via API/CKAN → normalize in the API layer → surface on the right lens or atlas module → ensure PDPA compliance. Support: DGA registration desk at 02-612-6060; NSO Yala at 073-212-703.`,
    keyFacts: [
      "Immediate-phase integrations (GDCC, GDX, DEPA CityData CKAN, DOPA API) require zero budget beyond staff time — all are free government services (Bible Sec. 00).",
      "GDX connects 194 agencies with 35.3M+ linkages/year over OAuth 2.0; GDCC is ISO 27001/27701 certified and hosts 219 agencies (Bible Sec. 00).",
      "The roadmap phases sources: immediate (GDCC/GDX/CKAN/DOPA), short-term (GISTDA Sphere, TPMAP), medium-term (flood modeling, pondok GIS, WorldPop aging model) (Bible Sec. 00).",
      "Registration support: DGA at 02-612-6060 and NSO Yala Provincial Office at 073-212-703 (Bible Sec. 00).",
    ],
    links: [
      { label: "Result on the Flood lens", lens: "flood" },
      { label: "Result on the Poverty lens", lens: "poverty" },
      { label: "Atlas: Fiscal & governance", atlasModule: "fiscal" },
      { label: "GISTDA Sphere portal", url: "https://sphere.gistda.or.th" },
    ],
    quiz: [
      {
        q: "Which integration platform is the OAuth 2.0 inter-agency 'pipe' for pulling DOPA population data?",
        choices: ["GDCC", "GDX", "TPMAP", "GISTDA Sphere"],
        answer: 1,
        explain:
          "GDX (gdx.dga.or.th) provides inter-agency data exchange over OAuth 2.0 — 194 agencies, 35.3M+ linkages/year — and is the channel for automated DOPA pulls.",
      },
      {
        q: "According to the Bible, what budget do the immediate-phase integrations require?",
        choices: [
          "A large capital outlay for new servers",
          "Zero budget beyond existing staff time — they are free government services",
          "A paid vendor contract",
          "International grant funding",
        ],
        answer: 1,
        explain:
          "GDCC, GDX, DEPA CityData CKAN, and the DOPA API are all free government services; the only prerequisite is registration and configuration.",
      },
      {
        q: "Which source is the right short-term integration for layering MPI poverty data with tambon/village drill-down?",
        choices: ["GISTDA Sphere", "TPMAP", "MOPH HDC", "WorldPop"],
        answer: 1,
        explain:
          "TPMAP (tpmap.in.th) carries the 20.83% MPI poverty rate with tambon/village drill-down, enabling need-based service targeting.",
      },
    ],
  },
];
