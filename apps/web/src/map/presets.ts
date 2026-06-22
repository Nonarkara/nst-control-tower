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
  // Open data
  | "datago-points"
  // Civic
  | "civic-points"
  | "waterways"
  // Marine + risk
  | "fisheries"
  | "flood-risk-zones"
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
  // Yala — circular-city signature + EO
  | "ring-roads"
  | "alphaearth-landcover"
  | "alphaearth-floodprone"
  // 3D Tiles
  | "tile3d-buildings"
  // Air quality
  | "air4thai-stations"
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
  | "heritage-temple-spires";

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
    ],
  },
  {
    id: "operations",
    label: "OPS",
    describe: "Operations — every building in 3D, the Old Town axis, road network, civic POIs (hospitals/police/fire/schools/temples/markets), live traffic, incidents, CCTV. The default day-to-day view for the municipality.",
    layers: [
      "municipality-boundary-line",
      "municipality-buildings",
      "ring-roads",
      "road-network",
      "civic-points",
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
    describe: "Flood — the headline risk. Pak Phanang + Tha Dee river corridors + buffer, the upstream→city watershed cascade (ทุ่งสง · คีรีวง · ลานสกา → city), river/canal gauges (GloFAS), Khao Luang runoff, hand-authored flood-risk polygons, IMERG rainfall + MODIS flood detection, AlphaEarth flood-prone land classification.",
    // Esri imagery + the flood-prone fill as the single colorizer + flood
    // vectors (risk zones, river buffer, gauges). Tap IMERG rainfall to swap the
    // colorizer to live rain — it replaces the flood-prone fill, so the map never
    // shows competing blue + orange washes.
    layers: [
      "municipality-boundary-line",
      "satellite-esri",
      "river-buffer",
      "waterways",
      "watershed-nodes",
      "flood-gauges",
      "dam-status",
      "flood-risk-zones",
      "alphaearth-floodprone",
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
    describe: "Environment — Esri high-res satellite, flood-risk polygons, waterways, AlphaEarth land cover (rubber/oil-palm vs forest), air-quality stations, solar rooftop potential. Opt into MODIS NDVI/LST/AOD when zoomed out.",
    layers: [
      "municipality-boundary-line",
      "municipality-buildings",
      "satellite-esri",
      "alphaearth-landcover",
      "flood-risk-zones",
      "waterways",
      "air4thai-stations",
      "gistda-solar",
    ],
  },
  {
    id: "earth",
    label: "EAR",
    describe: "EarthAlpha — earth-observation lens for rain, flood, heat, haze, greenery, land use, waterways, and AlphaEarth embeddings around Nakhon Si Thammarat, the Khao Luang massif, and the Pak Phanang basin.",
    // One base (Esri) + ONE colorizer (NDVI greenery) by default. The other
    // earth-obs overlays (rain, heat, haze, NO₂, land cover) are one tap away in
    // the Imagery group and swap in cleanly — never five rasters at once.
    layers: [
      "municipality-boundary-line",
      "municipality-buildings",
      "satellite-esri",
      "satellite-ndvi",
      "waterways",
      "air4thai-stations",
    ],
  },
  {
    id: "safety",
    label: "SAF",
    describe: "Safety — flood-risk zones, citizen reports (Traffy), iTIC, CCTV, waterways for drainage, hospitals + fire + police, MODIS flood detection.",
    layers: [
      "municipality-boundary-line",
      "municipality-buildings",
      "civic-points",
      "waterways",
      "flood-risk-zones",
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
];

/** Full-area data overlays that colour the whole map. Pick at most one. */
export const MAP_COLORIZE_LAYERS: LayerId[] = [
  "satellite-imerg",        // rainfall
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
  security:     "Deep South Security",
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

export const ALL_LAYERS: {
  id: LayerId;
  label: string;
  swatch: string;
  group: LayerGroup;
  describe: string;
}[] = [
  // ─── Municipality ──────────────────────────────────────────────────────
  { id: "municipality-boundary",  label: "Municipal boundary",        swatch: "#0EA5E9", group: "municipality",
    describe: "Chonburi Town Municipality outer boundary (เทศบาลเมืองชลบุรี)." },
  { id: "municipality-buildings", label: "Buildings (OSM + MS, 3D)",  swatch: "#0EA5E9", group: "municipality",
    describe: "20,877 building footprints — OSM/Bing named landmarks (hospitals, temples, hotels) plus Microsoft Building Footprints for the full fabric. Height from levels tag or 2-storey default. Colour-coded by type in 3D." },
  { id: "tile3d-buildings",       label: "Buildings (3D Tiles)",       swatch: "#7DD3FC", group: "municipality",
    describe: "Experimental OGC 3D Tiles stream for Chonburi city centre. Toggle on to compare against the GeoJSON layer." },

  // ─── Maritime (NEW) ────────────────────────────────────────────────────
  { id: "maritime-overlay",       label: "OpenSeaMap overlay",        swatch: "#22D3EE", group: "maritime",
    describe: "OpenSeaMap raster overlay — shows shipping lanes, depth contours, anchorage zones, mooring buoys for the Gulf of Thailand." },
  { id: "port-infrastructure",    label: "Port infrastructure",        swatch: "#F59E0B", group: "maritime",
    describe: "Laem Chabang port + Si Racha tanker anchorage + Chonburi harbour piers (from OSM way[harbour], landuse=port)." },
  { id: "ferry-terminals",        label: "Ferry / pier terminals",     swatch: "#FBBF24", group: "maritime",
    describe: "Pier and ferry terminal POIs (Bang Saen, Si Racha, Koh Si Chang ferry)." },
  { id: "navigation-aids",        label: "Lighthouses + nav aids",     swatch: "#FACC15", group: "maritime",
    describe: "Lighthouses, beacons, navigation buoys around the Eastern Seaboard." },
  { id: "ais-vessels",            label: "AIS vessels (live)",         swatch: "#10B981", group: "maritime",
    describe: "Live vessel positions from AIS (Automatic Identification System) — cargo, tanker, fishing, passenger. Requires AISSTREAM_TOKEN; placeholder otherwise." },
  { id: "distance-grid",          label: "Distance grid (1·5·10 km)",  swatch: "#0EA5E9", group: "municipality",
    describe: "Concentric rings at 1 km / 5 km / 10 km from the municipal centroid. Reads as 'how far can the mayor / fire / ambulance get to'." },

  // ─── Mobility ──────────────────────────────────────────────────────────
  { id: "road-network",      label: "Road network (classified)", swatch: "#FB7185", group: "mobility",
    describe: "OSM road network coloured + scaled by class: motorway/primary thick warm, secondary/tertiary medium cyan, residential/lane thin." },
  { id: "traffic-heatmap",   label: "Traffic — by hour",       swatch: "#F87171", group: "mobility",
    describe: "Modelled traffic intensity weighted by hour-of-day + weekday/weekend. Drives the orange/red glow on arterials." },
  { id: "transit-stations",  label: "Bus / transit stops",     swatch: "#38BDF8", group: "mobility",
    describe: "Bus stops + transit nodes inside the municipality from OSM." },
  { id: "transit-lines",     label: "Transit lines (where mapped)", swatch: "#057B43", group: "mobility",
    describe: "Polyline tracks for any rail / metro lines reaching the EEC corridor (e.g. proposed BTS extension)." },
  { id: "cctv-cameras",      label: "CCTV cameras",            swatch: "#E5E7EB", group: "mobility",
    describe: "Public traffic cameras from Longdo inside the Chonburi bbox. Click for the live JPG/HLS stream." },

  // ─── Incidents ─────────────────────────────────────────────────────────
  { id: "incidents-itic",    label: "iTIC traffic events",     swatch: "#F59E0B", group: "incidents",
    describe: "Live iTIC / Longdo traffic events: accidents, closures, breakdowns. Bbox-filtered to Chonburi." },
  { id: "incidents-city-reports", label: "Citizen reports (Traffy)", swatch: "#A78BFA", group: "incidents",
    describe: "Live citizen complaints from Traffy Fondue — Thailand's nationwide 311 channel." },

  // ─── Open data ─────────────────────────────────────────────────────────
  { id: "datago-points",     label: "data.go.th points",        swatch: "#C084FC", group: "open-data",
    describe: "Government POIs from data.go.th filtered to Chonburi: schools, hospitals, health centres, government offices, temples, markets." },

  // ─── Civic (OSM, province-wide) ────────────────────────────────────────
  { id: "civic-points",      label: "Civic POIs (color-coded)", swatch: "#EF4444", group: "municipality",
    describe: "Hospitals (✚ red) · clinics (pink) · schools (🅢 violet) · police (P cyan) · fire stations (🜂 orange) · government (cerulean) · temples (卐 gold) · markets (▦ green) · post offices · substations · water works. Hover for name. From OSM province-wide." },
  { id: "waterways",         label: "Canals + rivers + drains",  swatch: "#0EA5E9", group: "municipality",
    describe: "Hydrology network: rivers (sky blue, thick), canals (cerulean, medium), streams (pale sky, thin), drains/ditches (teal). Critical for flood-prevention planning + identifying drainage backbone." },
  { id: "fisheries",         label: "Fishing + aquaculture zones", swatch: "#FBBF24", group: "maritime",
    describe: "Coastal fishing economy: Ang Sila oysters · Bang Saen shrimp · Bang Phra mussels · Chonburi Bay artisanal · Koh Si Chang offshore. Click for boat count + yield." },
  { id: "flood-risk-zones",  label: "Coastal flood-risk zones",   swatch: "#EF4444", group: "environment",
    describe: "Hand-authored polygons of historical flood-prone areas (king-tide, storm-surge, drainage-backflow). Hover for severity + household count. Replace with municipal GIS when supplied." },

  { id: "air4thai-stations", label: "Air4Thai PCD stations",     swatch: "#22C55E", group: "environment",
    describe: "Official Thai government air-quality monitors across the Eastern Seaboard — Chonburi (Laem Chabang, Si Racha / Bo Win, Mueang) plus the Rayong / Map Ta Phut industrial belt. Coloured by PM2.5, labelled with live national AQI. Public source, no key. Click a station for its readings." },

  // ─── GISTDA ────────────────────────────────────────────────────────────
  { id: "gistda-pois",       label: "GISTDA POI Digital Twin",   swatch: "#F59E0B", group: "open-data",
    describe: "Thailand GISTDA POI Digital Twin — 1,000 authoritative points: government offices, schools, temples, hospitals, hotels, banks, restaurants, shopping, transport, sport. Thai + English names, disabled-access flags." },
  { id: "gistda-solar",      label: "GISTDA Solar LOD2",         swatch: "#FBBF24", group: "environment",
    describe: "GISTDA LOD2 building solar irradiance for Chonburi city centre — real measured height, footprint area, and monthly solar potential (kWh/m²). Blue=low, green=medium, yellow=high, red=excellent rooftop solar." },
  { id: "gistda-landuse",    label: "GISTDA Land Use",           swatch: "#34D399", group: "open-data",
    describe: "GISTDA land use / land cover classification for Chonburi Town — residential, commercial, industrial, agricultural, forest, water, transport, recreation. Colour-coded by category." },

  // ─── News ──────────────────────────────────────────────────────────────
  { id: "news-pins",         label: "Geocoded news pins",        swatch: "#EF4444", group: "incidents",
    describe: "News headlines that mention a known location (market, mosque, hospital, etc.) are pinned on the map so the mayor can see exactly where the incident was." },

  // ─── Deep South Security ─────────────────────────────────────────────────
  // ─── Flood / hydrology ───────────────────────────────────────────────────
  { id: "river-buffer",      label: "Pak Phanang / Tha Dee corridor", swatch: "#0EA5E9", group: "environment",
    describe: "The Pak Phanang and Tha Dee river centrelines and inundation buffer — the primary flood vectors carrying Khao Luang runoff through the city and the Pak Phanang basin." },
  { id: "flood-gauges",      label: "River / canal gauges",      swatch: "#38BDF8", group: "environment",
    describe: "Water-level / discharge gauges on the Pak Phanang and Tha Dee rivers and feeder canals, coloured by status (normal / watch / warning / flood). Source: GloFAS / Open-Meteo flood proxy + RID where a station exists." },
  { id: "watershed-nodes",   label: "Watershed (upstream→city)", swatch: "#38BDF8", group: "environment",
    describe: "The Tha Dee flow cascade made geographic — ทุ่งสง / คีรีวง / ลานสกา upstream nodes feeding the city, with a flow line down คลองท่าดี (คีรีวง → ลานสกา → city). Each node is coloured by live status (gauges + rainfall + DWR EWS soil). Upstream rises here lead the city by hours." },
  { id: "dam-status",        label: "Khao Luang runoff",         swatch: "#22D3EE", group: "environment",
    describe: "Khao Luang watershed runoff trend — NST has no major regulating dam, so flash flooding tracks upstream discharge directly. Rising discharge precedes downstream flooding in the city + Pak Phanang lowlands." },
  { id: "alphaearth-landcover", label: "AlphaEarth land cover",  swatch: "#34D399", group: "environment",
    describe: "Google DeepMind AlphaEarth Foundations embeddings classified into land cover (rubber / oil-palm plantation vs forest vs built-up vs water) for the Nakhon Si Thammarat basin. Pre-computed from Earth Engine; ships as static GeoJSON." },
  { id: "alphaearth-floodprone", label: "AlphaEarth flood-prone", swatch: "#60A5FA", group: "environment",
    describe: "AlphaEarth + DEM-derived flood-prone / historically-inundated land classification around the Pak Phanang basin and the Tha Dee / Khao Luang runoff corridor." },

  // ─── Old Town signature ────────────────────────────────────────────────────
  { id: "ring-roads",        label: "Old Town axis (Ratchadamnoen)", swatch: "#FBBF24", group: "municipality",
    describe: "Nakhon Si Thammarat's defining feature — the long N–S historic Old Town spine along Ratchadamnoen Rd, tracing the medieval city-wall axis from the north gate past Wat Phra Mahathat Woramahawihan (UNESCO tentative)." },

  // ─── Imagery ───────────────────────────────────────────────────────────
  { id: "satellite-esri",    label: "Satellite (Esri HD)",      swatch: "#60A5FA", group: "imagery",
    describe: "Esri World Imagery — high-res aerial / satellite mosaic. Good detail up to zoom 19." },
  { id: "satellite-terrain", label: "OpenTopoMap (zoom < 14)",  swatch: "#A3E635", group: "imagery",
    describe: "OpenTopoMap with contour lines and hillshade. Useful at regional zoom." },
  { id: "satellite-viirs-truecolor", label: "VIIRS true-color", swatch: "#A5F3FC", group: "imagery",
    describe: "VIIRS NOAA-20 corrected reflectance — daily, sharper than MODIS." },
  { id: "satellite-night",   label: "VIIRS night lights",       swatch: "#FACC15", group: "imagery",
    describe: "VIIRS Day/Night Band — Earth at night. The Eastern Seaboard glows along Sukhumvit and the port belt." },
  { id: "satellite-true-color", label: "MODIS true-color",      swatch: "#93C5FD", group: "imagery",
    describe: "MODIS Terra corrected reflectance — daily 250 m global mosaic. Best at zoom < 10." },
  { id: "satellite-himawari", label: "Himawari IR",             swatch: "#C7D2FE", group: "imagery",
    describe: "Himawari-9 Band 13 infrared — geostationary cloud loop, 10-min refresh. Best for monsoon fronts over the Gulf." },
  { id: "satellite-imerg",   label: "IMERG rainfall",           swatch: "#06B6D4", group: "imagery",
    describe: "NASA IMERG half-hourly global precipitation rate. Watch monsoon cells move across the Gulf." },
  { id: "satellite-ndvi",    label: "NDVI greenery",            swatch: "#34D399", group: "imagery",
    describe: "MODIS NDVI 8-day composite — vegetation greenness." },
  { id: "satellite-lst",     label: "Land surface temp",        swatch: "#F97316", group: "imagery",
    describe: "MODIS LST (day) — urban heat island. Chonburi city core typically reads 3–5 °C hotter than surrounding shrimp ponds." },
  { id: "satellite-aerosol", label: "Aerosol optical depth",    swatch: "#F472B6", group: "imagery",
    describe: "MODIS MAIAC AOD — proxy for PM2.5 + haze / industrial plumes from Laem Chabang." },
  { id: "satellite-no2",     label: "NO₂ pollution (OMI)",      swatch: "#EF4444", group: "imagery",
    describe: "OMI tropospheric NO₂ — traffic + power-plant nitrogen dioxide. Bright along the Sukhumvit corridor." },
];

/**
 * Layers whose render output is computed or decorative — no backing FeatureCollection,
 * so the per-layer "feature count" badge is meaningless (always 0) and misleads operators
 * into thinking the data feed has failed. The palette suppresses the count badge for
 * these IDs and falls back to a plain "on/off" indicator.
 *
 * Includes: programmatic geometry (distance grid), supplementary 3D extrusions
 * (building roofs), and all raster tile layers (satellite imagery, maritime overlay,
 * historical map, 3D tiles).
 */
export const COMPUTED_LAYERS: ReadonlySet<LayerId> = new Set<LayerId>([
  "distance-grid",
  "building-roofs",
  "cu-map-2015",
  "maritime-overlay",
  "tile3d-buildings",
  "heritage-old-town",
  "heritage-temple-spires",
  // All GIBS + Esri satellite rasters
  "satellite-esri",
  "satellite-true-color",
  "satellite-viirs-truecolor",
  "satellite-night",
  "satellite-ndvi",
  "satellite-lst",
  "satellite-aerosol",
  "satellite-no2",
  "satellite-terrain",
  "satellite-himawari",
  "satellite-imerg",
]);
