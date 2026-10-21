import type { LayerId, LayerGroup } from "./presetsLenses";

type LayerEntry = {
  id: LayerId;
  label: string;
  swatch: string;
  group: LayerGroup;
  describe: string;
};

export const ALL_LAYERS_PART_A: LayerEntry[] = [

  // ─── Municipality ──────────────────────────────────────────────────────
  { id: "municipality-boundary",  label: "Municipal boundary",        swatch: "#C8C8C8", group: "municipality",
    describe: "Nakhon Si Thammarat City Municipality boundary (เทศบาลนครนครศรีธรรมราช)." },
  { id: "municipality-buildings", label: "Buildings (OSM, 3D by type)",  swatch: "#E69F00", group: "municipality",
    describe: "OSM footprints: category colours in 2D; neutral masonry and schematic roofs in 3D at 1:1 height. Source height/storey tags take precedence over type/area estimates. Selected roofs use aerial-reviewed gabled, hipped, flat or tiered temple forms; unknown and complex roofs keep neutral caps, not confirmed flat roofs. No roof is inferred from a temple POI alone. Roof dimensions/materials are schematic, not photogrammetry. Types use OSM tags and civic POI joins." },
  { id: "tile3d-buildings",       label: "Photorealistic 3D (Google)", swatch: "#7DD3FC", group: "municipality",
    describe: "Google Photorealistic 3D Tiles — real textured city mesh streamed via deck.gl. Full coverage over Bangkok and major metros; provincial towns may show coarse terrain only. Requires a Google Maps key." },

  // ─── Maritime (NEW) ────────────────────────────────────────────────────
  { id: "maritime-overlay",       label: "OpenSeaMap overlay",        swatch: "#22D3EE", group: "maritime",
    describe: "OpenSeaMap raster overlay — shows shipping lanes, depth contours, anchorage zones, mooring buoys for the Gulf of Thailand." },
  { id: "port-infrastructure",    label: "Port infrastructure",        swatch: "#E69F00", group: "maritime",
    describe: "NST coastal port infrastructure — fishing harbours, piers, and anchorages along the Gulf of Thailand coast (Pak Phanang, Tha Sala, Sichon). From OSM way[harbour], landuse=port." },
  { id: "ferry-terminals",        label: "Ferry / pier terminals",     swatch: "#F1CA73", group: "maritime",
    describe: "Pier and ferry terminal POIs along the NST Gulf coast (Pak Phanang, Tha Sala, Sichon piers)." },
  { id: "navigation-aids",        label: "Lighthouses + nav aids",     swatch: "#F0E442", group: "maritime",
    describe: "Lighthouses, beacons, navigation buoys along the NST Gulf of Thailand coastline." },
  { id: "ais-vessels",            label: "AIS vessels (live)",         swatch: "#009E73", group: "maritime",
    describe: "Live vessel positions from AIS (Automatic Identification System) — cargo, tanker, fishing, passenger. Requires AISSTREAM_TOKEN; placeholder otherwise." },
  { id: "distance-grid",          label: "Distance grid (1·5·10 km)",  swatch: "#EBEBEB", group: "municipality",
    describe: "Concentric rings at 1 km / 5 km / 10 km from the municipal centroid. Reads as 'how far can the mayor / fire / ambulance get to'." },

  // ─── Mobility ──────────────────────────────────────────────────────────
  { id: "road-network",      label: "Road network (classified)", swatch: "#EBEBEB", group: "mobility",
    describe: "OSM road network in neutral greys, scaled by class: motorway/primary thick and bright, secondary/tertiary medium grey, residential/lane thin and dark." },
  { id: "traffic-heatmap",   label: "Traffic — by hour",       swatch: "#F57C00", group: "mobility",
    describe: "Modelled traffic intensity weighted by hour-of-day + weekday/weekend. Drives the orange/red glow on arterials." },
  { id: "transit-stations",  label: "Bus / transit stops",     swatch: "#56B4E9", group: "mobility",
    describe: "Bus stops + transit nodes inside the municipality from OSM." },
  { id: "transit-lines",     label: "Transit lines (where mapped)", swatch: "#057B43", group: "mobility",
    describe: "Polyline tracks for any rail / metro lines reaching the EEC corridor (e.g. proposed BTS extension)." },
  { id: "cctv-cameras",      label: "CCTV cameras",            swatch: "#E69F00", group: "mobility",
    describe: "Every municipal camera on nstcctv.nakhoncity.org (222: traffic orange · school zone yellow · safety zone pink · canal water level blue) plus Longdo public cameras. A dark disc with a coloured ring = offline. Click for the live stream." },
  { id: "cctv-water-level",  label: "Canal water-level cameras", swatch: "#56B4E9", group: "environment",
    describe: "The 30 municipal cameras aimed at canals and drains (nstcctv.nakhoncity.org, WL group) — see the water itself beside the gauge numbers. Ring-only = offline. Click for the live stream." },

  // ─── Incidents ─────────────────────────────────────────────────────────
  { id: "incidents-itic",    label: "iTIC traffic events",     swatch: "#D55E00", group: "incidents",
    describe: "Live iTIC / Longdo traffic events: accidents, closures, breakdowns. Bbox-filtered to Nakhon Si Thammarat." },
  { id: "incidents-city-reports", label: "Citizen reports (Traffy)", swatch: "#CC79A7", group: "incidents",
    describe: "Live citizen complaints from Traffy Fondue — Thailand's nationwide 311 channel." },

  // ─── Open data ─────────────────────────────────────────────────────────
  { id: "datago-points",     label: "data.go.th points",        swatch: "#56B4E9", group: "open-data",
    describe: "Government POIs from data.go.th filtered to Nakhon Si Thammarat: schools, hospitals, health centres, government offices, temples, markets." },

  // ─── Civic (OSM, province-wide) ────────────────────────────────────────
  { id: "civic-points",      label: "Civic POIs (color-coded)", swatch: "#D55E00", group: "municipality",
    describe: "Hospitals (✚ vermillion) · clinics (light vermillion) · schools (🅢 pink) · police (P sky) · fire stations (🜂 dark vermillion) · government (blue) · temples (卐 yellow) · markets (▦ orange) · post offices · substations · water works. Hover for name. From OSM province-wide." },
  { id: "waterways",         label: "Canals + rivers + drains",  swatch: "#0072B2", group: "municipality",
    describe: "Hydrology network: rivers (blue, thick), canals (sky, medium), streams (pale sky, thin), drains (green) / ditches (dark green). Critical for flood-prevention planning + identifying drainage backbone. Line style is an ordinal proxy for conveyance capacity (river > canal > stream > drain/ditch) derived from OSM classification only — no width/condition/capacity survey data exists for these segments; treat as illustrative, not measured throughput." },
  { id: "waterway-flow",     label: "River arrows (direction + amount)", swatch: "#56B4E9", group: "environment",
    describe: "Blinking arrows on every river and canal showing which way water runs (downhill, high → low from a DEM). Arrow thickness / pulse rate = live discharge (or channel fullness × qmax) when a nearby HII gauge rates the reach; MODELLED from slope × channel type otherwise. Typography names the waterways, marks HIGH/LOW elevation, and shows how many m³/s are arriving at Nakhon Si Thammarat — the LOW end of คลองท่าดี is the flood destination. A directional cue, not a hydraulic routing result." },
  { id: "fisheries",         label: "Fishing + aquaculture zones", swatch: "#F0E442", group: "maritime",
    describe: "Coastal fishing economy: Pak Phanang basin · Gulf of Thailand artisanal · Sichon coast · Tha Sala fishing piers · NST province aquaculture zones. Click for boat count + yield." },
  { id: "flood-risk-zones",  label: "Coastal flood-risk zones",   swatch: "#DC2626", group: "environment",
    describe: "Hand-authored polygons of historical flood-prone areas (king-tide, storm-surge, drainage-backflow). Hover for severity + household count. Replace with municipal GIS when supplied." },

  { id: "air4thai-stations", label: "Air4Thai PCD stations",     swatch: "#2EA05E", group: "environment",
    describe: "Official Thai government air-quality monitors — PCD stations across Nakhon Si Thammarat province. Coloured by PM2.5, labelled with live national AQI. Public source, no key. Click a station for its readings. AirDash station layer." },
  { id: "air-heatmap",       label: "Air concentration (AirDash)", swatch: "#F0B429", group: "environment",
    describe: "PM2.5 / AQI concentration heatmap over Air4Thai + AQICN points — AirDash field view. Shows where air quality thickens across the province, not just discrete station dots." },
  { id: "water-heatmap",     label: "Water concentration (FloodDash)", swatch: "#BBE1F6", group: "environment",
    describe: "Water-level concentration heatmap weighted by channel fullness / situation level — FloodDash intensity wash so operators see WHERE the gauge network is stressing." },

  // ─── GISTDA ────────────────────────────────────────────────────────────
  { id: "gistda-pois",       label: "GISTDA POI Digital Twin",   swatch: "#E69F00", group: "open-data",
    describe: "Thailand GISTDA POI Digital Twin — 1,000 authoritative points: government offices, schools, temples, hospitals, hotels, banks, restaurants, shopping, transport, sport. Thai + English names, disabled-access flags." },
  { id: "gistda-solar",      label: "GISTDA Solar LOD2",         swatch: "#F0E442", group: "environment",
    describe: "GISTDA LOD2 building solar irradiance for NST city centre — real measured height, footprint area, and monthly solar potential (kWh/m²). Blue=low, orange=medium, yellow=high, pale yellow=excellent rooftop solar." },
  { id: "gistda-landuse",    label: "GISTDA Land Use",           swatch: "#009E73", group: "open-data",
    describe: "GISTDA land use / land cover classification for Nakhon Si Thammarat — residential, commercial, industrial, agricultural, forest, water, transport, recreation. Colour-coded by category." },

  // ─── News ──────────────────────────────────────────────────────────────
  { id: "news-pins",         label: "Geocoded news pins",        swatch: "#D55E00", group: "incidents",
    describe: "News headlines that mention a known location (market, mosque, hospital, etc.) are pinned on the map so the mayor can see exactly where the incident was." },

  // ─── Deep South Security ─────────────────────────────────────────────────
  // ─── Flood / hydrology ───────────────────────────────────────────────────
  { id: "river-buffer",      label: "Pak Phanang / Tha Dee corridor", swatch: "#56B4E9", group: "environment",
    describe: "The Pak Phanang and Tha Dee river centrelines and inundation buffer — the primary flood vectors carrying Khao Luang runoff through the city and the Pak Phanang basin." }
];
