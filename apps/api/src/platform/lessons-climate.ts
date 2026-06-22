import type { AcademyLesson } from "@nst/shared";

/**
 * Academy track: "climate-flood" — Flood & climate for Yala.
 *
 * Covers the Pattani River basin, Bang Lang Dam, the monsoon, the three
 * catastrophic floods of 2022–2024, how flood forecasting works (GloFAS /
 * CHIRPS), and what the FLOOD lens surfaces on the dashboard.
 *
 * Every figure here is sourced from the Yala Municipal Data Bible research
 * dimensions 09 (Infrastructure, Utilities & Environment) and 11
 * (International & Regional Supplementary Data Sources). Citations appear
 * inline in the body and in keyFacts.
 */
export const climateLessons: AcademyLesson[] = [
  {
    id: "climate-flood-01-pattani-basin",
    track: "climate-flood",
    order: 1,
    title: "The Pattani River Basin: Yala's Water Geography",
    titleTh: "ลุ่มน้ำปัตตานี: ภูมิศาสตร์น้ำของยะลา",
    summary:
      "Why flooding defines Yala: the Pattani River basin, its size and population, and the monsoon that fills it.",
    level: "intro",
    durationMin: 6,
    body: `## The basin that shapes Yala

Almost everything about flood risk in Yala starts with one watershed: the **Pattani River basin**. It covers **3,805.65 km²** across Yala and Pattani provinces and drains the **longest river on the Thai–Malay Peninsula — 214 km** end to end (Data Bible, Dim 09 §8). Roughly **715,000 people** live inside the basin, so when the river rises, it rises against a dense population.

### A monsoon climate

Yala has a **tropical monsoon climate**. The wet season runs **May to December** — about 7.6 months of the year (Dim 09 §6):

- **Wettest month: November**, averaging ~**312 mm** (12.3 inches) of rain.
- **Driest month: February**, ~**28 mm** (1.1 inches).
- **Peak wet-day probability: 73% on 9 November** — the single rainiest date of the year.

Annual rainfall in the basin runs **1,500–2,200 mm** (Dim 09 §8), among the highest in Thailand.

### Two monsoons, one funnel

Southern Thailand sits between two monsoon systems (Dim 09 §6):

- The **northeast monsoon** (Nov–Feb) drives moisture in off the Gulf of Thailand — the dominant flood driver here.
- The **southwest monsoon** (May–Oct) brings the early wet season.
- **Tropical depressions and cyclones** can stack heavy rain on top of either.

The basin's tributaries — the **Yaha River** and **Nong Chik River** — feed the main stem. Because the catchment concentrates this rain into one river system, the November peak is exactly when forecasters and the city watch the water most closely. The next lesson looks at the structure that sits at the top of this basin: Bang Lang Dam.`,
    keyFacts: [
      "The Pattani River basin spans 3,805.65 km² across Yala and Pattani and hosts ~715,000 people (Data Bible Dim 09 §8).",
      "The Pattani River is the longest on the Thai–Malay Peninsula at 214 km (Dim 09 §8).",
      "November is the wettest month (~312 mm); the peak wet-day probability is 73% on 9 November (Dim 09 §6).",
      "Annual basin rainfall is 1,500–2,200 mm, driven mainly by the northeast monsoon over the Gulf of Thailand (Dim 09 §6, §8).",
    ],
    links: [
      { label: "Open the FLOOD lens", lens: "flood" },
      { label: "Climate module in the Atlas", atlasModule: "climate" },
      { label: "Earth / satellite lens", lens: "earth" },
    ],
    quiz: [
      {
        q: "How large is the Pattani River basin?",
        choices: ["1,420 km²", "3,805.65 km²", "214 km²", "50 km²"],
        answer: 1,
        explain:
          "The basin covers 3,805.65 km² across Yala and Pattani provinces (Data Bible Dim 09 §8). 1,420 is the dam's storage in MCM; 214 km is the river's length; 50 km² is the reservoir surface.",
      },
      {
        q: "Which month is wettest in Yala?",
        choices: ["February", "July", "November", "April"],
        answer: 2,
        explain:
          "November averages ~312 mm and carries a 73% wet-day probability on the 9th. February is the driest month at ~28 mm (Dim 09 §6).",
      },
    ],
  },
  {
    id: "climate-flood-02-bang-lang-dam",
    track: "climate-flood",
    order: 2,
    title: "Bang Lang Dam: Storage, Power, and Flood Control Upstream",
    titleTh: "เขื่อนบางลาง: การกักเก็บ พลังงาน และการควบคุมน้ำ",
    summary:
      "The 1,420-MCM reservoir at the top of the basin — what it stores, the power it makes, and why its outflow matters downstream.",
    level: "core",
    durationMin: 8,
    body: `## The structure at the top of the basin

Sitting upstream in **Bannang Sata District** is **Bang Lang Dam** (6°9′23″N, 101°16′25″E), the single largest piece of water infrastructure in the basin (Data Bible Dim 09 §8).

### The specifications

| Feature | Value |
|---|---|
| Type | Earth-core rockfill dam |
| Height | 85 m |
| Crest length | 422 m |
| **Storage capacity** | **1,420 million m³ (MCM)** |
| Reservoir surface | ~50 km² (31,250 rai) |
| Catchment area | 2,080 km² |
| **Installed power** | **72 MW** (3 × 28 MW Francis turbines) |
| Annual generation | ~289 million kWh |
| Irrigation coverage | ~380,000 rai (60,800 ha) |
| Completed | June 1981 |
| Operators | EGAT (power) + RID (water) |

### Why the dam matters for flooding

The dam is **dual-purpose**: EGAT runs it for electricity while the Royal Irrigation Department (RID) manages it for water supply and flood buffering. Its **2,080 km² catchment** captures upstream monsoon rain before it reaches the city, and its **1,420 MCM** of storage gives operators room to hold water back — or, when the reservoir fills, to release it.

That release is the key signal. The dashboard tracks a metric of the form \`flood.dam.outflow\` precisely because **outflow from Bang Lang propagates downstream** through Yala city. Below the main dam, the **Pattani Dam** acts as a downstream diversion structure, part of the broader Pattani River Basin Development Plan (Dim 09 §8).

### Where to watch it live

Reservoir storage and river levels are published with **automated telemetry** by RID through **ThaiWater.net** — hourly water levels and daily reservoir storage, with flood and drought alerts (Dim 09 §8). On the dashboard, the **FLOOD lens** surfaces reservoir status and river-level gauges so you can read dam state against downstream risk in one view.`,
    keyFacts: [
      "Bang Lang Dam stores 1,420 MCM and generates 72 MW from three 28 MW Francis turbines (Data Bible Dim 09 §8).",
      "It is an 85 m earth-core rockfill dam in Bannang Sata District, completed June 1981, with a 2,080 km² catchment (Dim 09 §8).",
      "It is dual-operated: EGAT for electricity and the Royal Irrigation Department (RID) for water and flood management (Dim 09 §8).",
      "Reservoir storage and river levels stream via automated telemetry on ThaiWater.net — hourly levels, daily storage (Dim 09 §8).",
    ],
    links: [
      { label: "Reservoir status in the FLOOD lens", lens: "flood" },
      { label: "Climate module in the Atlas", atlasModule: "climate" },
      { label: "Earth / satellite lens", lens: "earth" },
    ],
    quiz: [
      {
        q: "What is Bang Lang Dam's reservoir storage capacity?",
        choices: ["72 MCM", "289 MCM", "1,420 MCM", "3,805 MCM"],
        answer: 2,
        explain:
          "Storage capacity is 1,420 million m³. The 72 is the dam's installed power in MW; 289 million kWh is annual generation (Dim 09 §8).",
      },
      {
        q: "Which two agencies operate Bang Lang Dam?",
        choices: [
          "GISTDA (satellites) and TMD (weather)",
          "EGAT (power) and RID (water)",
          "PEA (electricity) and PWA (water supply)",
          "DDPM (disaster) and DPT (planning)",
        ],
        answer: 1,
        explain:
          "EGAT runs the 72 MW generating plant while the Royal Irrigation Department (RID) manages water storage and flood buffering (Dim 09 §8).",
      },
      {
        q: "Why does the dam's outflow matter for the city?",
        choices: [
          "It changes the local air quality",
          "Releases propagate downstream through Yala city, raising river levels",
          "It controls the electricity price",
          "It has no downstream effect",
        ],
        answer: 1,
        explain:
          "When the reservoir fills, releases flow downstream through Yala — which is why the dashboard tracks a flood.dam.outflow signal on the FLOOD lens (Dim 09 §8).",
      },
    ],
  },
  {
    id: "climate-flood-03-three-floods",
    track: "climate-flood",
    order: 3,
    title: "Three Catastrophic Floods: 2022, 2023, 2024",
    titleTh: "สามมหาอุทกภัย: 2565, 2566, 2567",
    summary:
      "The flood record that the dashboard exists to track — what happened in Feb 2022, December 2023, and November 2024, with the household and casualty counts.",
    level: "core",
    durationMin: 9,
    body: `## A documented record of escalating floods

Flood is the **#1 disaster in Thailand**, and Yala's recent record shows why this dashboard treats it as critical (Data Bible Dim 09 §16). The Department of Disaster Prevention and Mitigation (DDPM) logs events by district, household, and casualty. Here is the verified sequence (Dim 09 §7):

### February 2022 — flash floods
- **4 districts, 38 tambons, 136 villages** affected.
- **3,114 households** hit.
- The early-season warning shot.

### December 2022 — Southern Thailand floods
- **90 households** affected in Yala — a comparatively light year locally.
- Context: across the border region, Narathiwat recorded **545.4 mm in 24 hours** that month (Dim 09 §6).

### December 2023 — the "50-year flood"
- **15,457 households** affected in Yala at peak — the worst single event in the record.
- **4 deaths** in Yala province.
- **Cause:** a strong northeast monsoon plus a low-pressure system over Sumatra and the Andaman (Dim 09 §7).
- **Impact:** the Yala–Su-ngai Kolok railway was disrupted and **100+ schools** temporarily closed.
- Regional relief was mobilised through the AHA Centre's DELSA warehouse.

### November–December 2024 — 10-province flood
- Yala was among **10 southern provinces** hit (alongside Pattani, Narathiwat, Songkhla, and others).
- **664,000+ households** affected across the south; **25 deaths** regionally.
- **21,800 hectares** of farmland damaged in southern Thailand.
- **Cause:** 300–500 mm of rain in 24 hours. In the wider event, Hat Yai saw its heaviest rainfall in 300 years — **335 mm in 24 h** (Dim 09 §6, §7).

### Reading the trend

The progression — 3,114 households (Feb 2022) → 15,457 (Dec 2023) → a 10-province regional event (2024) — is exactly the pattern the **FLOOD lens** maps with historical flood-event markers and damage assessment. The next lesson covers how forecasting tries to get ahead of the next one.`,
    keyFacts: [
      "December 2023's '50-year flood' affected 15,457 households in Yala with 4 deaths — the worst single event on record (Data Bible Dim 09 §7).",
      "February 2022 flash floods hit 4 districts, 38 tambons, 136 villages and 3,114 households (Dim 09 §7).",
      "The November–December 2024 flood spanned 10 southern provinces, 664,000+ households, and 25 deaths regionally (Dim 09 §7).",
      "Flood is the #1 disaster in Thailand; DDPM records events by district, household, and casualty (Dim 09 §16, §7).",
    ],
    links: [
      { label: "Historical flood markers in the FLOOD lens", lens: "flood" },
      { label: "Climate module in the Atlas", atlasModule: "climate" },
      { label: "DDPM disaster portal", url: "https://www.ddpm.go.th" },
      { label: "AHA Centre regional reports", url: "https://adinet.ahacentre.org" },
    ],
    quiz: [
      {
        q: "How many households did the December 2023 '50-year flood' affect in Yala?",
        choices: ["90", "3,114", "15,457", "664,000"],
        answer: 2,
        explain:
          "15,457 households were affected at peak, with 4 deaths — the worst single event in Yala's recent record. 3,114 was Feb 2022; 90 was Dec 2022; 664,000+ was the 2024 regional total (Dim 09 §7).",
      },
      {
        q: "What was the primary cause cited for the December 2023 flood?",
        choices: [
          "A dam failure at Bang Lang",
          "A strong northeast monsoon plus low pressure over Sumatra/Andaman",
          "A tropical cyclone landfall",
          "Snowmelt upstream",
        ],
        answer: 1,
        explain:
          "The Data Bible attributes it to a strong northeast monsoon combined with low pressure over Sumatra and the Andaman (Dim 09 §7).",
      },
      {
        q: "How many southern provinces were affected in the November–December 2024 flood?",
        choices: ["3", "10", "38", "77"],
        answer: 1,
        explain:
          "Ten provinces including Yala, Pattani, Narathiwat and Songkhla were affected — 664,000+ households and 25 deaths regionally (Dim 09 §7).",
      },
    ],
  },
  {
    id: "climate-flood-04-forecasting",
    track: "climate-flood",
    order: 4,
    title: "How Flood Forecasting Works: GloFAS, CHIRPS & the FLOOD Lens",
    titleTh: "การพยากรณ์น้ำท่วมทำงานอย่างไร: GloFAS, CHIRPS",
    summary:
      "The satellite-and-model stack behind early warning — rainfall from CHIRPS, river-discharge forecasts from GloFAS, return-period thresholds, and how the dashboard fuses them.",
    level: "deep",
    durationMin: 12,
    body: `## From raindrop to early warning

Forecasting a flood means estimating two things ahead of time: **how much rain will fall**, and **how high the river will rise** in response. The Yala platform draws on a layered stack of open data to do both (Data Bible Dim 11 §5, §6).

### Step 1 — Rainfall: CHIRPS

**CHIRPS** (Climate Hazards Group InfraRed Precipitation with Stations) fuses satellite infrared estimates with ground-station gauges to produce daily rainfall (Dim 11 §5):

- **Resolution:** 0.05° (~5.5 km at the equator) — fine enough to resolve the basin.
- **Record:** 1981 to near-present — a 40+ year baseline for trend and drought analysis.
- **Latency:** a preliminary product about 2 days after each pentad; a final product once monthly.
- **License:** CC0 (public domain), accessible via Google Earth Engine (\`UCSB-CHG/CHIRPS/DAILY\`) or direct GeoTIFF download.

GISTDA has validated CHIRPS over Thailand across 1981–2020 (Dim 09 §6), which is why it anchors the rainfall layer.

### Step 2 — River discharge: GloFAS

Rain is the input; **river discharge** is what floods. The **Global Flood Awareness System (GloFAS)** turns forecast rainfall into ensemble river-discharge forecasts (Dim 11 §6):

- **Forecast horizon:** up to **30 days** ahead, as an ensemble (mean, median, min, max).
- **Resolution:** 0.1° grids (~5 km); reanalysis back to 1984.
- **Access:** the Open-Meteo Flood API (\`flood-api.open-meteo.com/v1/flood\`) returns \`river_discharge\` in m³/s for a lat/lon — e.g. Yala city at **6.55, 101.28**.

### Step 3 — Thresholds: return periods

GloFAS expresses severity as **return-period thresholds** — how rare a given discharge is (Dim 11 §6):

- **2-year** return period → minor flooding
- **5-year** return period → moderate flooding
- **20-year** return period → severe flooding

A 5 km grid is coarse for a specific channel, so the Data Bible notes coordinates may need a ~0.1° nudge to land on a representative river cell (Dim 11 §6).

### Step 4 — Observed extent: GISTDA Sphere

For what's actually flooded *right now*, **GISTDA's Sphere platform** delivers satellite-derived flood-extent maps from MODIS (2×/day), SAR (1–2 day), and on-demand optical imagery, served as WMS/KML/shapefile layers via the Sphere API (Dim 09 §9).

### How the FLOOD lens fuses it

The dashboard's **FLOOD lens** combines all four: CHIRPS rainfall accumulation, GloFAS discharge forecasts against return-period thresholds, Bang Lang reservoir status from ThaiWater telemetry, and GISTDA real-time flood-extent overlays — turning a chain of open APIs into one operational early-warning picture for Yala.`,
    keyFacts: [
      "CHIRPS provides daily rainfall at 0.05° (~5.5 km) from 1981 to near-present under a CC0 license (Data Bible Dim 11 §5).",
      "GloFAS forecasts river discharge (m³/s) up to 30 days ahead as an ensemble, reachable via the Open-Meteo Flood API (Dim 11 §6).",
      "GloFAS return-period thresholds map severity: 2-year = minor, 5-year = moderate, 20-year = severe flooding (Dim 11 §6).",
      "GISTDA's Sphere platform supplies real-time satellite flood-extent maps (MODIS, SAR, optical) via its API (Dim 09 §9).",
    ],
    links: [
      { label: "Live early-warning view: FLOOD lens", lens: "flood" },
      { label: "Satellite imagery: Earth lens", lens: "earth" },
      { label: "Climate module in the Atlas", atlasModule: "climate" },
      { label: "GloFAS Global Flood Awareness System", url: "https://www.globalfloods.eu" },
    ],
    quiz: [
      {
        q: "What does CHIRPS measure, and at what resolution?",
        choices: [
          "River discharge at 0.1° grids",
          "Daily rainfall at 0.05° (~5.5 km)",
          "Flood extent at 10 m resolution",
          "Reservoir storage in MCM",
        ],
        answer: 1,
        explain:
          "CHIRPS fuses satellite infrared with station gauges to produce daily rainfall at 0.05° (~5.5 km), from 1981 to near-present (Dim 11 §5). River discharge is GloFAS; flood extent is GISTDA.",
      },
      {
        q: "In GloFAS, which return period corresponds to severe flooding?",
        choices: ["2-year", "5-year", "20-year", "100-year"],
        answer: 2,
        explain:
          "GloFAS thresholds are 2-year (minor), 5-year (moderate), and 20-year (severe) return periods (Dim 11 §6).",
      },
      {
        q: "How far ahead can GloFAS forecast river discharge for Yala?",
        choices: ["6 hours", "3 days", "Up to 30 days", "1 year"],
        answer: 2,
        explain:
          "GloFAS produces ensemble river-discharge forecasts up to 30 days ahead, available via the Open-Meteo Flood API for Yala (6.55, 101.28) (Dim 11 §6).",
      },
    ],
  },
];
