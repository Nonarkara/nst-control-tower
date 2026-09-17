export type LensId = "operations" | "mobility" | "flood" | "environment" | "earth" | "security" | "poverty" | "safety" | "vibes" | "executive" | "intelligence";

export type LayerId =
  // Municipality core
  | "municipality-boundary"
  | "municipality-buildings"
  | "neighborhood-buildings"
  | "road-network"
  // Maritime (new)
  | "maritime-overlay"
  | "port-infrastructure"
  | "ferry-terminals"
  | "ais-vessels"
  | "navigation-aids"
  | "distance-grid"
  // Transit
  | "transit-stations"
  | "transit-lines"
  // Live ops
  | "traffic-heatmap"
  | "incidents-itic"
  | "incidents-city-reports"
  | "cctv-cameras"
  | "cctv-water-level"
  // Open data
  | "datago-points"
  // Civic
  | "civic-points"
  | "waterways"
  // Marine + risk
  | "fisheries"
  | "flood-risk-zones"
  // National waterways + flood analysis
  | "national-waterways"
  | "national-flood-prone"
  | "hii-tambon-risk"
  | "unosat-2021-exposure"
  // Yala — Deep South security
  | "conflict-incidents"
  | "conflict-choropleth"
  | "security-news"
  // Yala — outcome choropleths
  | "poverty-choropleth"
  // Yala — flood / hydrology
  | "flood-gauges"
  | "dam-status"
  | "river-buffer"
  | "watershed-nodes"
  | "water-pictures"
  | "ffpi-pins"
  | "flood-risk-overlay"
  // NST — HII survey + WRF model
  | "flood-marks"
  | "street-flood-sim"
  | "wrf-rain-grid"
  // Flooddash southern analytics
  | "south-province-watch"
  | "south-river-cascade"
  // Yala — circular-city signature + EO
  | "ring-roads"
  | "alphaearth-landcover"
  | "alphaearth-floodprone"
  // 3D Tiles
  | "tile3d-buildings"
  // Air quality
  | "air4thai-stations"
  | "air-heatmap"
  // Sensor concentration washes (FloodDash water · AirDash air)
  | "water-heatmap"
  // GISTDA
  | "gistda-pois"
  | "gistda-solar"
  | "gistda-landuse"
  // News
  | "news-pins"
  // Imagery
  | "satellite-esri"
  | "satellite-viirs-truecolor"
  | "satellite-night"
  | "satellite-imerg"
  | "satellite-aerosol"
  | "satellite-no2"
  | "satellite-true-color"
  | "satellite-himawari"
  | "satellite-ndvi"
  | "satellite-lst"
  | "satellite-flood"
  | "satellite-terrain"
  | "google-satellite"
  | "google-traffic"
  // (legacy IDs kept as no-op for backward compat — empty rendering)
  | "campus-boundary"
  | "campus-buildings"
  | "campus-gates"
  | "cu-lands"
  | "cu-map-2015"
  | "bma-pois"
  | "bma-parks"
  | "bma-aq-stations"
  | "cu-shuttle-routes"
  | "cu-shuttle-1"
  | "cu-shuttle-2"
  | "cu-shuttle-3"
  | "cu-shuttle-4"
  | "cu-shuttle-5"
  | "cu-shuttle-stops"
  | "cu-shuttle-vehicles"
  | "utility-electricity"
  | "utility-water"
  | "utility-drainage"
  | "utility-wifi-heat"
  | "utility-wifi-points"
  | "building-roofs"
  | "municipality-boundary-line"
  | "municipality-boundary-fill"
  | "heritage-old-town"
  | "heritage-temple-spires"
  | "water-gauges"
  | "rain-stations"
  | "ews-stations"
  | "terrain-3d"
  | "waterway-flow"
  | "precip-radar"
  | "air-waqi-field"
  | "level-posts"
  | "flood-extent-2025"
  // 3D parametric landmarks — the great chedi at Wat Phra Mahathat
  // (bell + spire + ubosot + wihan + prang + ho trai + 8 satellite chedis)
  | "mahatat-3d"
  // Province-scale hydrology: district boundaries + flow arrows on every river
  | "district-boundaries"
  | "hydro-flow-arrows"
  // Hand-authored major canals — Tha Dee, Tha Wang, Royal Project Canal
  // (under construction), Pak Phanang, Cha Uat, etc.
  | "named-canals"
  // Hand-authored regional rivers (Tapi, etc.) — cross-province hydrology
  | "regional-rivers"
  // Hand-authored historical floods (GISTDA Sentinel-1 SAR, Dec 2024)
  | "historical-floods"
  // Hand-authored city POIs from the official NST City Municipality Map
  | "city-pois"
  // Hand-authored provincial highways from the panteethai.com road map
  | "provincial-roads";

export type MapViewState =
  | { kind: "lens"; lensId: LensId }
  | { kind: "custom"; label: string };

export function layerCanEnable(_id: LayerId): boolean {
  return true;
}

export interface Lens {
  id: LensId;
  label: string;
  describe: string;
  layers: LayerId[];
}

export const LENSES: Lens[] = [
  {
    id: "executive",
    label: "EXEC",
    describe:
      "Strategic — municipal boundary, the historic Old Town axis (Ratchadamnoen Rd), high-res satellite, transit + open-data POIs. Focused on Nakhon Si Thammarat City Municipality (~22.6 km²).",
    layers: [
      "municipality-boundary-line",
      "municipality-buildings",
      "ring-roads",
      "satellite-esri",
      "transit-stations",
      "road-network",
      "datago-points",
      "gistda-pois",
      // Provincial highways — the executive briefing points at major
      // transport corridors so it answers "which roads can be used
      // for evacuation?" alongside the city's institutions.
      "provincial-roads",
      // City POIs — the executive briefing needs to point at the Old Town
      // landmarks by name (Wat Phra Mahathat, City Hall, the stadium, etc.).
      // City-scale only — won't crowd the province view.
      "city-pois",
      // The 3D Mahatat model is the EXEC lens's "city heartbeat" — without
      // it the executive briefing shows an empty old-town rectangle. With
      // it the briefing reads as "this is the city, and this is its
      // defining landmark" in a single glance.
      "mahatat-3d",
      // Historical floods — the executive briefing includes the
      // "where it flooded last time" overlay (Dec 2024 SAR-derived
      // GISTDA data) so the briefing answers "is the current forecast
      // aligned with a known risk zone?"
      "historical-floods",
      // Provincial highways — the executive briefing points at major
      // transport corridors so the briefing answers "which roads are
      // affected / can be used for evacuation?" alongside the flood risk.
      "provincial-roads",
    ],
  },
  {
    id: "operations",
    label: "OPS",
    describe: "Operations — every building in 3D, the Old Town axis, road network, civic POIs (hospitals/police/fire/schools/temples/markets), live traffic, incidents, CCTV. The default day-to-day view for the municipality. Carries the kid-readable watershed cascade (mountain → upstream → city → bay) so the day-to-day view tells the water story too, not just the road story.",
    layers: [
      // Province-scale topographic basemap — OpenTopoMap hillshade +
      // contour lines so the operator sees the mountain rising behind the
      // cascade (Khao Luang, 1,835m, is the source of every river in NST).
      // This is the "topographic lines" the user asked for.
      "satellite-terrain",
      "municipality-boundary-line",
      "municipality-buildings",
      "ring-roads",
      "road-network",
      "civic-points",
      // City POIs — the 48 important places from the official NST City
      // Municipality Map (hotels, temples, hospitals, markets, etc.).
      // City-scale visibility so the day-to-day view shows the city places
      // without a search.
      "city-pois",
      // Province-scale hydrology: every river + every district + flow arrows
      // so the operator sees "water comes from Khao Luang, flows through the
      // cascade, into Pak Phanang Bay" the moment they open the dashboard.
      // This is the Songkhla-style printed watershed view the operator asked
      // for — district boundaries dashed + labelled, rivers as blue lines,
      // red arrows pointing downstream every ~3 km.
      "district-boundaries",
      "hydro-flow-arrows",
      "named-canals",
      "regional-rivers",
      "historical-floods",
      "provincial-roads",
      "flood-risk-overlay",
      // The iconic 3D model of Wat Phra Mahathat — the city-defining landmark.
      // Renders as a parametric stacked-primitive bell chedi + ubosot + wihan +
      // prang + ho trai + 8 satellite chedis, anchored at the canonical Old
      // Town coordinates. Without this on the default lens the city reads as
      // "buildings + traffic" with no recognisable heart.
      "mahatat-3d",
      // Kid-readable water ecosystem on the default lens — the cascade subway
      // line, animated flow dots, and the mountain / city / bay pictogram all
      // appear at province zoom out of the box. A 5-year-old opening the
      // dashboard sees "water comes from the mountain, flows through the
      // cascade, into the bay" without reading a single label. Operators
      // who only ever live on OPS also get the flash-flood risk pins.
      "watershed-nodes",
      "waterway-flow",
      "water-pictures",
      "ffpi-pins",
      "traffic-heatmap",
      "incidents-city-reports",
      "incidents-itic",
      "cctv-cameras",
      "gistda-pois",
      "news-pins",
    ],
  },
  {
    id: "flood",
    label: "FLOOD",
    describe: "Flood — the headline risk. Pak Phanang + Tha Dee river corridors + buffer, the upstream→city watershed cascade (ทุ่งสง · คีรีวง · ลานสกา → city), river/canal gauges (GloFAS), Khao Luang runoff, surveyed flood marks + street elevations (HII 2025) with the FLOOD COMMAND scenario, hand-authored flood-risk polygons, WRF-ROMS forecast rain.",
    // Esri imagery + the flood-prone fill as the single colorizer + flood
    // vectors (risk zones, river buffer, gauges). Tap IMERG rainfall to swap the
    // colorizer to live rain — it replaces the flood-prone fill, so the map never
    // shows competing blue + orange washes.
    layers: [
      "municipality-boundary-line",
      "satellite-esri",
      "river-buffer",
      "waterways",
      // Province hydrology baseline — districts + flow arrows so the FLOOD
      // lens also reads as a printed watershed map.
      "district-boundaries",
      "hydro-flow-arrows",
      "named-canals",
      "regional-rivers",
      "historical-floods",
      "provincial-roads",
      // The iconic 3D model of Wat Phra Mahathat — the city-defining landmark
      // sits in the flood plain and the basin cascade ends here, so FLOOD lens
      // must carry the temple silhouette as a recognisable backdrop.
      "mahatat-3d",
      // Animated flow dots — the primary "direction" visual a reader sees on
      // the map. ENV/EAR already pull this in; FLOOD needs it too because
      // surface flow direction is the key piece of the water-ecosystem view.
      "waterway-flow",
      // Kid-readable flood overlay — every river + canal painted with the
      // status colour of its nearest upstream WaterGauge (cyan = calm,
      // orange = warning, red = critical, width-scaled 4–12 px so a
      // 5-year-old sees "this river is dangerous today". The headline risk
      // lens must carry it by default.
      "flood-risk-overlay",
      "watershed-nodes",
      "ffpi-pins",
      "water-heatmap",
      "water-gauges",
      "rain-stations",
      "ews-stations",
      "cctv-water-level",
      "level-posts",
      "flood-gauges",
      "dam-status",
      "flood-marks",
      // street-flood-sim is opt-in: the 2.1 MB / 18k-point HII road survey
      // freezes the main thread if it lands on every FLOOD lens entry. Flood
      // Command (and the layer toggle) pull it in when a scenario is armed.
      // NOT flood-risk-zones by default: five hand-drawn 5-vertex boxes
      // (public/geo/nst/flood-risk.geojson) — they read as random rectangles
      // over the real map. The GISTDA SAR footprint below is the real thing.
      "flood-extent-2025",
      "alphaearth-floodprone",
      "national-waterways",
      "national-flood-prone",
      "hii-tambon-risk",
      "unosat-2021-exposure",
      // NOT south-province-watch by default: it fills the whole province with
      // a ~80%-alpha status colour, which at the lens's default zoom is the
      // entire viewport painted orange. Still a toggle for regional context.
      "south-river-cascade",
      // NOT precip-radar here: alphaearth-floodprone above is this lens's one
      // MAP_COLORIZE_LAYERS member already (see the exclusivity comment on
      // that const) — a second one just re-creates the stacked-colorizer mud
      // bug presets.test.ts guards against for this lens. Rain radar lives in
      // EAR (its own description already promises it) instead.
    ],
  },
  {
    id: "mobility",
    label: "MOB",
    describe: "Mobility — road network, the Old Town axis, the SRT rail terminus + bus terminal + airport links, traffic heatmap, iTIC events, CCTV. For dispatch + routing across the long N–S city.",
    layers: [
      "municipality-boundary-line",
      "ring-roads",
      "road-network",
      "transit-lines",
      "transit-stations",
      "traffic-heatmap",
      "incidents-itic",
      "cctv-cameras",
    ],
  },
  {
    id: "environment",
    label: "ENV",
    describe: "Environment — Esri high-res satellite, flood-risk polygons, waterways with live flow direction, AlphaEarth land cover (rubber/oil-palm vs forest), the AirDash air-quality field + stations, solar rooftop potential. Opt into MODIS NDVI/LST/AOD when zoomed out.",
    layers: [
      "municipality-boundary-line",
      "municipality-buildings",
      "satellite-esri",
      "alphaearth-landcover",
      "flood-risk-zones",
      "waterways",
      "waterway-flow",
      "air-waqi-field",
      "air-heatmap",
      "air4thai-stations",
      "gistda-solar",
    ],
  },
  {
    id: "earth",
    label: "EAR",
    describe: "EarthAlpha — earth-observation lens for rain, flood, heat, haze, greenery, land use, waterways, terrain relief, and AlphaEarth embeddings around Nakhon Si Thammarat, the Khao Luang massif, and the Pak Phanang basin.",
    // 3D terrain relief as the base (the massif is the whole story here) + ONE
    // colorizer (NDVI greenery) by default. Rain radar, IMERG, heat, haze, NO₂,
    // land cover are one tap away in the Imagery group and swap in cleanly.
    layers: [
      "municipality-boundary-line",
      "terrain-3d",
      "waterways",
      "waterway-flow",
      "air4thai-stations",
      "precip-radar",
    ],
  },
  {
    id: "safety",
    label: "SAF",
    describe: "Safety — flood-risk zones, surveyed flood marks, citizen reports (Traffy), iTIC, CCTV, waterways for drainage, hospitals + fire + police, MODIS flood detection.",
    layers: [
      "municipality-boundary-line",
      "municipality-buildings",
      "civic-points",
      "waterways",
      "flood-risk-zones",
      "flood-marks",
      "water-gauges",
      "ews-stations",
      "incidents-city-reports",
      "incidents-itic",
      "cctv-cameras",
    ],
  },
  {
    id: "vibes",
    label: "VIB",
    describe: "Vibes — pretty view. Municipal boundary + the Old Town axis + MODIS true-color satellite. Use this when presenting Nakhon Si Thammarat at a glance.",
    layers: ["municipality-boundary-line", "ring-roads", "satellite-true-color"],
  },
  {
    id: "intelligence",
    label: "INT",
    describe: "Integrated Intelligence — TimesFM rainfall/flood forecast alerts wired to Earth Observation. Click any forecast metric in the left rail to activate its map layer. Pairs with the Predictive Intelligence and Earth Obs panels.",
    layers: [
      "municipality-boundary-line",
      "satellite-imerg",
      "satellite-ndvi",
      "flood-risk-zones",
      "flood-gauges",
      "incidents-city-reports",
      "waterways",
      // NOT precip-radar here — satellite-imerg above is already this lens's
      // MAP_COLORIZE_LAYERS member; see the same note on the FLOOD lens.
    ],
  },
];

// ─── Layer exclusivity ─────────────────────────────────────────────────
// Some layers tint the ENTIRE map. Stacking several translucent ones turns the
// map into unreadable mud (rainfall blue + vegetation green + heat orange + a
// flood fill, all at ~70% opacity). So two groups behave like radio buttons:
// at most ONE base satellite and ONE full-area "colorize" overlay at a time.

/** The map background. Pick exactly one. */
export const SATELLITE_BASE_LAYERS: LayerId[] = [
  "satellite-esri",
  "satellite-true-color",
  "satellite-viirs-truecolor",
  "satellite-night",
  "satellite-himawari",
  "satellite-terrain",
  "terrain-3d",
];

/** Full-area data overlays that colour the whole map. Pick at most one. */
export const MAP_COLORIZE_LAYERS: LayerId[] = [
  "satellite-imerg",        // rainfall (satellite rain-rate estimate)
  "precip-radar",           // rainfall (live radar nowcast) — same family as IMERG,
                             // stacking both washes the map in redundant blue
  "satellite-ndvi",         // vegetation
  "satellite-lst",          // land temperature
  "satellite-aerosol",      // haze / AOD
  "satellite-no2",          // air pollution
  "satellite-flood",        // MODIS flood detection
  "alphaearth-landcover",   // land classification
  "alphaearth-floodprone",  // flood-prone areas
];

const EXCLUSIVE_GROUPS: LayerId[][] = [SATELLITE_BASE_LAYERS, MAP_COLORIZE_LAYERS];

/** The exclusive group a layer belongs to, or null if it stacks freely. */
export function exclusiveGroupOf(id: LayerId): LayerId[] | null {
  return EXCLUSIVE_GROUPS.find((g) => g.includes(id)) ?? null;
}

/**
 * Keep the map readable by allowing at most one member of each exclusive group.
 * `prefer` (e.g. a just-toggled layer) wins within its group; otherwise the
 * first one encountered in `ids` is kept.
 */
export function enforceLayerExclusivity(ids: Iterable<LayerId>, prefer?: LayerId): Set<LayerId> {
  const out = new Set<LayerId>(ids);
  for (const group of EXCLUSIVE_GROUPS) {
    const present = group.filter((g) => out.has(g));
    if (present.length <= 1) continue;
    const keep = prefer && present.includes(prefer) ? prefer : present[0];
    for (const g of present) if (g !== keep) out.delete(g);
  }
  return out;
}

export type LayerGroup = "municipality" | "security" | "maritime" | "mobility" | "incidents" | "open-data" | "imagery" | "environment";

export const LAYER_GROUP_LABEL: Record<LayerGroup, string> = {
  municipality: "Municipality",
  security:     "Security (legacy)",
  maritime:     "Maritime (legacy)",
  mobility:     "Mobility",
  incidents:    "Incidents",
  "open-data":  "Open data",
  imagery:      "Imagery",
  environment:  "Environment",
};

// ─── Satellite freshness ───────────────────────────────────────────────
// NASA GIBS products have different latency between the satellite pass
// and tile publication. Numbers below are the typical "delay in days"
// from the user's local now → the publicly served tile.
const SATELLITE_DELAY_DAYS: Partial<Record<LayerId, number>> = {
  "satellite-true-color":         1,    // MODIS Terra ~24-36 h
  "satellite-viirs-truecolor":    1,    // VIIRS NOAA-20 ~24 h
  "satellite-night":              1,    // VIIRS Day/Night Band ~24 h
  "satellite-himawari":           0,    // Himawari Band 13 — 10 min
  "satellite-imerg":              0,    // IMERG half-hourly, ~6 h delay
  "satellite-ndvi":               8,    // MODIS NDVI 8-day composite
  "satellite-lst":                1,    // MODIS LST day ~36 h
  "satellite-aerosol":            1,    // MAIAC AOD ~24 h
  "satellite-no2":                1,    // OMI NO2 ~24 h
  "satellite-flood":              3,    // MODIS 3-day combined flood
  "satellite-esri":               0,    // Esri mosaic — not date-specific
  "satellite-terrain":            0,    // OpenTopoMap — vector, static
};

export function satelliteFreshness(id: LayerId): { label: string; date: string } | null {
  const d = SATELLITE_DELAY_DAYS[id];
  if (d == null) return null;
  const t = new Date();
  t.setUTCDate(t.getUTCDate() - d);
  const date = t.toISOString().slice(0, 10);
  if (d === 0) return { label: "LIVE", date };
  if (d === 1) return { label: "Y’DAY", date };
  return { label: `${d}D AGO`, date };
}
