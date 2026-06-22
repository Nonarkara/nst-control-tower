# Dimension 03: Geospatial Data & GIS Mapping Services

## Comprehensive Deep-Dive for Yala Geographic Dashboard

**Research Date:** June 2025
**Scope:** All geospatial data sources needed for Yala Municipality's geographic dashboard
**Status:** Comprehensive findings compiled from 20+ searches across Thai government portals, international platforms, and academic sources

---

## Table of Contents

1. [GISTDA Sphere API (Primary Base Map & Services)](#1-gistda-sphere-api)
2. [GISTDA Flood Monitoring](#2-gistda-flood-monitoring)
3. [GISTDA Fire/Hotspot Monitoring](#3-gistda-firehotspot-monitoring)
4. [GISTDA THEOS-2 Satellite](#4-gistda-theos-2-satellite)
5. [RTSD Map Request Process](#5-rtsd-map-request-process)
6. [RTSD CORS Network](#6-rtsd-cors-network)
7. [Land Department LandsMaps](#7-land-department-landsmaps)
8. [Land Value Assessment Data](#8-land-value-assessment-data)
9. [OpenStreetMap Thailand Extract](#9-openstreetmap-thailand-extract)
10. [Yala Admin Boundaries](#10-yala-admin-boundaries)
11. [Yala City Plan (ผังเมืองรวม)](#11-yala-city-plan)
12. [Road Network Data](#12-road-network-data)
13. [RID Water Data](#13-rid-water-data)
14. [DEM for Yala](#14-dem-for-yala)
15. [Google Earth Engine](#15-google-earth-engine)
16. [HDX Thailand Admin Boundaries](#16-hdx-thailand-admin-boundaries)
17. [Additional Sources Summary](#17-additional-sources)

---

## 1. GISTDA Sphere API

| Attribute | Details |
|-----------|---------|
| **Layer Name** | GISTDA Sphere Base Maps + API Services |
| **Source URL** | https://sphere.gistda.or.th |
| **API Documentation** | https://sphere.gistda.or.th/docs (Web Service docs at `/docs/web-service/`) |
| **API Reference** | https://api.sphere.gistda.or.th/map/doc.html |
| **API Type** | WMS / WMTS / TMS / XYZ / REST JSON |
| **Authentication** | API Key required (register at https://sphere.gistda.or.th) |
| **Spatial Resolution** | Variable: 2m (THEOS-2 PAN), 15m (THEOS-2 MS), sub-meter (hybrid base) |
| **Coverage** | Thailand + regional (base maps global, disaster data national) |
| **Update Frequency** | Base maps: quarterly; Satellite imagery: daily; Disaster: near real-time |
| **Attribution/License** | GISTDA Open Data Policy; "Map data (c) GISTDA, OpenStreetMap" |
| **Priority** | **CRITICAL - Primary mapping platform** |

### Available Base Map Layers (Raster Tiles)

All layers support WMTS, TMS, and XYZ protocols. Authentication via `key` parameter.

| Layer ID | Description | URL Pattern |
|----------|-------------|-------------|
| `sphere_streets` | Street map (Thai language) | `https://basemap.sphere.gistda.or.th/service?key=YOUR-API-KEY` |
| `thailand_images` | Satellite/Aerial imagery | Same base URL with image layer parameter |
| `sphere_hybrid` | Hybrid (imagery + labels) | Same base URL with hybrid parameter |
| `sphere_deuteranopia` | Color-blind friendly (green) | Accessibility layer |
| `sphere_protanopia` | Color-blind friendly (red) | Accessibility layer |

### Available Web Services (REST API)

**Base URL:** `https://api.sphere.gistda.or.th/services/`

| Service | Endpoint | Description |
|---------|----------|-------------|
| Search/Suggest | `/search/suggest?keyword={q}&limit=5&key={key}` | Place name autocomplete |
| Search | `/search?keyword={q}&key={key}` | Full place search |
| Nearby POI | `/nearby-poi` | Points of interest near location |
| Reverse Geocoding | `/reverse-geocoding?lat={}&lon={}&key={key}` | Coordinates to address |
| Routing | `/routing` | Driving/walking directions |
| Matrix Routing | `/routing-matrix` | Distance matrix (multiple origins/destinations) |
| Elevation | `/elevation` | DEM height query at point |
| Embed Map | `/embed-map` | iframe embeddable map |
| Static Map | `/static-map` | Map image generation |
| Disaster Recurring | `/info/disaster-recurring?lat={}&lon={}&key={key}` | Historical disaster frequency at location |

### JavaScript/Native SDK Support

- **JavaScript:** Full MapLibre GL JS wrapper with Thai language support
- **Native:** Android, iOS, Flutter, React Native SDKs available
- **Layer types supported:** Vector, XYZ, WMS, WMTS (KVP + RESTful), TMS, Tiles3D, I3S
- **Default language:** Thai (`th`), configurable to English (`en`)

### Integration Notes

```javascript
// Example: Initialize Sphere map with base layer
const map = new sphere.Map({
  placeholder: 'map-div',
  layer: sphere.Layers.STREETS,  // or HYBRID, IMAGES
  zoom: 12,
  location: { lat: 6.5511, lon: 101.2814 }, // Yala city
  language: 'th',
  key: 'YOUR-API-KEY'
});

// Example: WMTS URL for QGIS
// https://basemap.sphere.gistda.or.th/service?key=YOUR-API-KEY
```

### QGIS Integration
1. Layer > Add Layer > Add WMS/WMTS Layer
2. Click "New" and enter the WMTS URL with API key
3. Select available tile matrix sets (EPSG:3857 default)

---

## 2. GISTDA Flood Monitoring

| Attribute | Details |
|-----------|---------|
| **Layer Name** | Thai Flood Monitoring System |
| **Source URL** | https://flood.gistda.or.th (web viewer) |
| **API Base URL** | https://disaster.gistda.or.th/services/open-api |
| **API Type** | REST JSON + WMS + WMTS + TMS + STAC |
| **Authentication** | API Key (register at disaster.gistda.or.th) |
| **Spatial Resolution** | Flood extent: 10-30m (from Sentinel-1 SAR, THEOS-2, MODIS) |
| **Coverage** | Thailand nationwide |
| **Update Frequency** | Near real-time (daily from satellite); API: daily refresh |
| **Attribution/License** | Open Government Data (Thailand) |
| **Priority** | **HIGH - Critical for disaster dashboard** |

### Available Data Layers (via API)

**Open API Endpoints** (`https://api-gateway.gistda.or.th/api/2.0/resources`)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/features/flood/1day` | GET | Flood areas last 1 day |
| `/features/flood/3days` | GET | Flood areas last 3 days |
| `/features/flood/7days` | GET | Flood areas last 7 days |
| `/features/flood/30days` | GET | Flood areas last 30 days |
| `/features/flood-freq` | GET | Flood frequency (recurring flood areas) |
| `/features/water_hyacinth` | GET | Water hyacinth obstacles |

**Map Services**

| Service | Endpoint | Format |
|---------|----------|--------|
| Flood 1-day WMS | `/maps/flood/1day/wms` | WMS |
| Flood 1-day WMTS | `/maps/flood/1day/wmts` | WMTS |
| Flood 1-day TMS | `/maps/flood/1day/tms/{z}/{x}/{y}` | TMS/XYZ |
| Flood frequency TMS | `/maps/flood-freq/tms/{z}/{x}/{y}` | TMS/XYZ |

### STAC Catalog for Archive Data

- **STAC Endpoint:** `https://disaster-vallaris.gistda.or.th/core/api/stac/1.0/Flood/`
- **Authentication:** API key required as query parameter
- **Collections:** Organized by year (Flood Catalog Year 2022, 2023, 2024)
- **Index:** Listed on STAC Index at https://stacindex.org/catalogs/gistda-flood-disaster-in-thailand

### Integration Notes

```javascript
// Example: Query flood data for Yala area
fetch('https://api-gateway.gistda.or.th/api/2.0/resources/features/flood/7days', {
  headers: { 'Authorization': 'Bearer YOUR-API-KEY' }
})
```

---

## 3. GISTDA Fire/Hotspot Monitoring

| Attribute | Details |
|-----------|---------|
| **Layer Name** | Thai Fire & Hotspot Monitoring System |
| **Source URL** | https://fire.gistda.or.th (web viewer) |
| **Disaster Platform** | https://disaster.gistda.or.th |
| **API Type** | REST JSON + WMS/WMTS/TMS (via disaster platform) |
| **Authentication** | Same API key as flood system |
| **Data Sources** | MODIS (Terra/Aqua), VIIRS (Suomi NPP, NOAA-20) |
| **Spatial Resolution** | MODIS: 1km; VIIRS: 375m |
| **Coverage** | Thailand + Southeast Asia |
| **Update Frequency** | Near real-time (MODIS/VIIRS 2-4 overpasses daily) |
| **Attribution/License** | Open Government Data; NASA FIRMS data |
| **Priority** | **HIGH - Haze/forest fire monitoring** |

### Data Sources Detail

| Sensor | Resolution | Swath | Temporal | Source |
|--------|------------|-------|----------|--------|
| MODIS Terra/Aqua | 1km | 2,330km | 1-2 times daily | NASA FIRMS |
| VIIRS Suomi NPP | 375m | 3,000km | Daily | NASA FIRMS |
| VIIRS NOAA-20 | 375m | 3,000km | Daily | NASA FIRMS |
| THEOS-2 (archive) | 0.5m | 10.3km | 26-day revisit | GISTDA |

### API Endpoints (via disaster.gistda.or.th)

Similar pattern to flood API:
- Feature data: `/features/fire` (endpoint pattern)
- Map tiles: `/maps/fire/{period}/tms/{z}/{x}/{y}`
- Historical recurring: Use `/info/disaster-recurring?disaster_type=hotspot`

### Alert System
- SMS alerts sent within 20 minutes of fire detection to subscribed district officers, police
- Subscription via GISTDA disaster platform
- Historical fire data available through Sphere API disaster-recurring endpoint

---

## 4. GISTDA THEOS-2 Satellite

| Attribute | Details |
|-----------|---------|
| **Layer Name** | THEOS-2 Satellite Imagery |
| **Source URL** | https://theos.gistda.or.th (ordering portal) |
| **API/Catalog** | GISTDA Sphere Image Catalog + MIPS ordering system |
| **API Type** | STAC Catalog + Web ordering + WMTS |
| **Authentication** | User account required for ordering |
| **Spatial Resolution** | PAN: 0.5m; Multispectral: 2m |
| **Swath Width** | PAN: 10.3km; MS: ~40km |
| **Revisit Time** | <5 days (with off-nadir pointing up to 45 degrees) |
| **Coverage** | Global (Thailand daily coverage: 74,000 km2/day) |
| **Priority** | **MEDIUM-HIGH - For high-res analysis** |

### Satellite Specifications

| Parameter | Value |
|-----------|-------|
| Operator | GISTDA |
| Manufacturer | Airbus Defence and Space |
| Launch Date | 9 October 2023 |
| Orbit | Sun-synchronous, 621 km altitude |
| Local Time Descending Node | 10:00-10:30 |
| Design Life | 10 years minimum |
| Mass | 425 kg |
| Data Downlink | X-band, ~140 Mbit/s |
| Ground Station | Si Racha, Chonburi (3-4 passes/day) |

### Image Products

| Product Level | Description |
|---------------|-------------|
| Level 1A | Raw sensor data |
| Level 1B | Radiometrically corrected |
| Level 1G | Geometrically corrected (rough) |
| Level 2A | Orthorectified, map-projected |
| Level 3 | Value-added products |

### Cost & Ordering for Municipal Use

- **Government/municipal users:** Contact GISTDA Business Development: 0-2141-4564 ext. 66, 69
- **Email:** usd@gistda.or.th
- **Reduced pricing** available for government agencies
- **THEOS-1 archive:** Lower cost (15m MS / 2m PAN, 2008-present)
- **THEOS-2 new tasking:** Higher cost for urgent/acquisition (0.5m PAN / 2m MS)
- **Free preview/quicklooks** available through catalog browser

### Integration Notes

For Yala Municipality dashboard:
1. Register for GISTDA user account
2. Browse archive catalog via Sphere or THEOS portal
3. For routine monitoring: Use archive imagery (lower cost)
4. For emergency response: Request urgent tasking (higher cost, 12-24hr delivery)

---

## 5. RTSD Map Request Process

| Attribute | Details |
|-----------|---------|
| **Layer Name** | Royal Thai Survey Department Topographic Maps |
| **Source URL** | https://www.rtsd.go.th |
| **Map Scales** | 1:50,000 (standard), 1:25,000 (detailed), 1:4,000 (urban) |
| **Digital Format** | GeoTIFF, GeoPDF, Shapefile (depending on product) |
| **Authentication** | Official letter/request required |
| **Coverage** | Thailand nationwide (including Yala) |
| **Update Frequency** | 1:50,000: periodic revision; larger scales: on-demand |
| **Priority** | **HIGH - Official topographic base** |

### Request Process for Yala Municipality

1. **Submit official request letter** to RTSD Director General
   - Letterhead from Yala Municipality
   - Specify: map sheets needed, scale, format, purpose
   - Include: official area of interest (coordinates or map sheet numbers)

2. **Required documentation:**
   - Official letter stating purpose (municipal planning)
   - Area specification (lat/lon bounds or map sheet index)
   - Contact person details

3. **Turnaround time:**
   - Standard request: 15-30 business days
   - Emergency: faster processing available

4. **Cost:**
   - Government agencies: nominal fee or free for non-commercial use
   - Digital data: typically 500-2,000 THB per map sheet depending on scale

5. **Available products:**
   - **FLDB (Field Data Base):** Digital topographic database
   - **DEM:** Digital Elevation Model (various resolutions)
   - **Orthoimagery:** Aerial photography mosaics
   - **Administrative boundaries:** Official boundaries at all levels

### Alternative: HDX Distribution

RTSD boundaries are distributed via HDX (Humanitarian Data Exchange) for humanitarian use:
- https://data.humdata.org/dataset/thailand-administrative-boundaries
- Boundaries at province, district, subdistrict levels

---

## 6. RTSD CORS Network

| Attribute | Details |
|-----------|---------|
| **Network Name** | Thai CORS Network / CORS-TRC |
| **Source URL** | https://www.rtsd.go.th |
| **Operator** | Royal Thai Survey Department |
| **Access Method** | NTRIP (Networked Transport of RTCM via Internet Protocol) |
| **Authentication** | Username/password subscription |
| **Coverage** | Nationwide (100+ stations) |
| **Positioning Accuracy** | Horizontal: 1-3cm; Vertical: 3-5cm (RTK fixed) |
| **Priority** | **MEDIUM - For precise surveying/GIS data collection** |

### NTRIP Access Details

| Parameter | Value |
|-----------|-------|
| Protocol | NTRIP v2.0 |
| Caster URL | Provided by RTSD upon subscription |
| Port | 2101 (typical) |
| Correction Format | RTCM 3.x |
| Mountpoints | By station ID or VRS (Virtual Reference Station) |

### Nearest CORS Stations to Yala

Based on Thailand's nationwide network of 100+ stations, the nearest stations to Yala City are likely in:

| Station Region | Approx. Distance from Yala City | Notes |
|---------------|--------------------------------|-------|
| Yala/Hat Yai area | <100 km | Southern region stations |
| Songkhla | ~150 km | Major southern station |
| Pattani/Narathiwat | ~50-100 km | Nearby provinces |

**Note:** Exact station list and coordinates require subscription access. Contact RTSD Geodesy Division for the nearest active station list and NTRIP mountpoint configuration.

### Subscription Process

1. Submit request to RTSD with project details
2. Receive NTRIP caster credentials (username/password)
3. Configure GNSS rover software with caster URL, port, and mountpoint
4. Internet connection required (4G/5G mobile data)

### Hardware Requirements

- RTK-capable GNSS receiver (rover)
- NTRIP client software (built into most survey-grade receivers)
- Internet connectivity (mobile hotspot or SIM-enabled receiver)

---

## 7. Land Department LandsMaps

| Attribute | Details |
|-----------|---------|
| **Layer Name** | LandsMaps Parcel Data |
| **Source URL** | https://landsmaps.dol.go.th |
| **WMS Endpoint** | `http://110.164.49.68:8081/geoserver/WMSDOL/wms?` |
| **API Type** | WMS (Web Map Service) |
| **Authentication** | No key required for WMS (public service) |
| **Spatial Resolution** | Parcel-level (vector) |
| **Coverage** | 34+ million land parcels nationwide |
| **Update Frequency** | Parcel data: event-driven; Satellite base: periodic |
| **Attribution/License** | Land Department, Government of Thailand |
| **Priority** | **HIGH - Land parcel reference layer** |

### Parcel Data Attributes

Each parcel includes 14+ attributes:

| Attribute | Description |
|-----------|-------------|
| Area | Land area (square wa/rai) |
| Parcel Number | Land parcel identification number |
| Title Deed Number | Chanote/NS-3/etc. reference |
| Land Office | Responsible land office |
| Province/District | Administrative location |
| Government Appraisal Price | Official land valuation |
| Tax Fee | Applicable tax rates |
| City Planning Zone | Planning designation |
| Land Use | Current land use classification |

### QGIS Integration

```
1. Layer > Data Source Manager > WMS/WMTS
2. Click "New"
3. Name: "LandsMaps Parcel"
4. URL: http://110.164.49.68:8081/geoserver/WMSDOL/wms?
5. Click OK > Connect
6. Select available layers (parcel boundaries, land office zones, etc.)
```

### ArcGIS Integration

```
1. Catalog Window > GIS Servers > Add WMS Server
2. URL: http://110.164.49.68:8081/geoserver/WMSDOL/wms?
3. Add to map
```

### Important Notes

- **WMS is read-only:** Cannot edit or download parcel geometry directly
- **Full parcel data:** Requires formal request to Land Department
- **Land valuation data:** Available through LandsMaps mobile app and website
- **Authentication:** WMS endpoint is public; some advanced features require login

---

## 8. Land Value Assessment Data

| Attribute | Details |
|-----------|---------|
| **Layer Name** | Land Appraisal Price (ราคาประเมินที่ดิน) |
| **Source URL** | https://landsmaps.dol.go.th (web + mobile app) |
| **Data Type** | Attribute table linked to parcel boundaries |
| **Authentication** | ThaiD digital identity for some features |
| **Coverage** | All 77 provinces |
| **Update Frequency** | Annual (new appraisal prices published yearly) |
| **Priority** | **MEDIUM - For land valuation dashboard** |

### Access Methods

1. **LandsMaps Website/App:**
   - Search by parcel number, title deed, or map click
   - Shows government appraisal price per square wa
   - URL: https://landsmaps.dol.go.th

2. **Land Department Offices:**
   - Request formal appraisal data for municipal area
   - Official letter from Yala Municipality required

3. **Valuation Database:**
   - Contact Land Valuation Division, Department of Lands
   - Data available in Excel/CSV format for municipal planning

### Data Fields Available

| Field | Description |
|-------|-------------|
| Parcel ID | Unique parcel identifier |
| Chanote No. | Title deed number |
| Location | Address/land office jurisdiction |
| Zone Code | Planning zone reference |
| Appraisal Price (THB/sq.wa) | Official government valuation |
| Land Type | Residential, commercial, agricultural, etc. |
| Road Frontage | Adjacent road classification |
| Last Updated | Appraisal year |

---

## 9. OpenStreetMap Thailand Extract

| Attribute | Details |
|-----------|---------|
| **Layer Name** | OpenStreetMap Thailand |
| **Source URL** | https://download.geofabrik.de/asia/thailand.html |
| **Download Format** | PBF (Protocolbuffer Binary Format), Shapefile, GeoPackage |
| **API Type** | File download (static extract) |
| **Authentication** | None (free, open data) |
| **Spatial Resolution** | Variable (user-contributed) |
| **Coverage** | Full Thailand (including Yala) |
| **Update Frequency** | Daily (extracted every ~24 hours) |
| **Attribution/License** | Open Database License (ODbL) 1.0 |
| **Priority** | **HIGH - Free reference data** |

### Download Options

| File | Size (as of June 2025) | Format | Use Case |
|------|------------------------|--------|----------|
| `thailand-latest.osm.pbf` | ~308 MB | PBF | Full OSM data import |
| `thailand-latest-free.shp.zip` | ~680 MB | Shapefile | Direct GIS use |
| `thailand-latest-free.gpkg.zip` | ~700 MB | GeoPackage | Modern GIS format |

### Import to PostGIS

```bash
# Install osm2pgsql (if not installed)
sudo apt-get install osm2pgsql

# Import PBF to PostGIS
osm2pgsql -d yala_db -U postgres -H localhost \
  --hstore --create --slim \
  -G --tag-transform-script /usr/share/osm2pgsql/default.style \
  thailand-latest.osm.pbf

# Clip to Yala bounding box
osmconvert thailand-latest.osm.pbf \
  -b=101.0,6.3,101.6,6.9 \
  -o=yala.osm.pbf
```

### Data Quality in Yala

- **Road network:** Good coverage on major roads; rural tracks may be incomplete
- **Buildings:** Partial coverage (urban areas better mapped)
- **POIs:** Moderate (hospitals, schools, mosques typically mapped)
- **Administrative boundaries:** Present but may not match official RTSD boundaries
- **Recommendation:** Use OSM as reference, cross-check with official sources

### Key OSM Tags for Yala Dashboard

| Feature | OSM Tags |
|---------|----------|
| Roads | `highway=*` (motorway, trunk, primary, secondary, tertiary, residential) |
| Buildings | `building=*` |
| Water | `waterway=river`, `natural=water` |
| Land use | `landuse=*` (residential, commercial, industrial, farmland) |
| POIs | `amenity=*` (hospital, school, mosque, market) |
| Admin boundaries | `boundary=administrative` + `admin_level=*` |

---

## 10. Yala Admin Boundaries

| Attribute | Details |
|-----------|---------|
| **Layer Name** | Thailand Administrative Boundaries |
| **Primary Source** | HDX (Humanitarian Data Exchange) |
| **Source URL** | https://data.humdata.org/dataset/thailand-administrative-boundaries |
| **Alternative** | https://data.humdata.org/dataset/geoboundaries-admin-boundaries-for-thailand |
| **Original Source** | Royal Thai Survey Department (RTSD) |
| **Format** | Shapefile, KML, GeoJSON |
| **Authentication** | None (free for humanitarian use) |
| **Coverage** | Level 0 (country) to Level 3 (tambon/subdistrict) |
| **Update Frequency** | Annually (vetted by ITOS/OCHA) |
| **Priority** | **CRITICAL - All analysis requires boundaries** |

### Available Boundary Levels

| Level | Description | Approx. Count | Use for Yala Dashboard |
|-------|-------------|---------------|----------------------|
| Level 0 | Country boundary | 1 | National context |
| Level 1 | Province (Changwat) | 77 | Provincial overview |
| Level 2 | District (Amphoe) | 928 | District-level analysis |
| Level 3 | Subdistrict (Tambon) | ~7,250 | Primary analytical unit |

### Yala Municipality Specific

| Attribute | Details |
|-----------|---------|
| **Yala City Area** | 19.4 km2 |
| **Coverage** | Full Tambon Sateng (ตำบลสะเตง) |
| **Adjacent Areas** | North: Tambon Yupo (ยุโป); East: Sateng Nok (สะเตงนอก); West: Tha Sap (ท่าสาป); South: Sateng Nok |
| **Province** | Yala (จังหวัดยะลา) |
| **District** | Mueang Yala (อำเภอเมืองยะลา) |

### Access Instructions

1. Visit https://data.humdata.org/dataset/thailand-administrative-boundaries
2. Select appropriate boundary level (Level 3 for tambon-level analysis)
3. Download in preferred format (Shapefile recommended for GIS)
4. Filter to Yala province using province code or name field

### Attribution Note

> "Acquired by ICRC from the Royal Thai Survey Department and made available to OCHA. Vetted, configured, and live services provided by ITOS."

---

## 11. Yala City Plan (ผังเมืองรวม)

| Attribute | Details |
|-----------|---------|
| **Layer Name** | Yala Comprehensive City Plan (ผังเมืองรวมยะลา) |
| **Responsible Agency** | Department of Public Works and Town & Country Planning (DPT) |
| **Source URL** | https://www.dpt.go.th (national portal) |
| **Local Office** | DPT Regional Office or Yala Provincial Office |
| **Format** | PDF maps (primary); Digital shapefile (on request) |
| **Authentication** | Formal request required for digital data |
| **Priority** | **MEDIUM-HIGH - Zoning analysis** |

### Access Process

1. **Online check:** DPT e-planning portal at https://www.dpt.go.th
2. **Formal request:** Submit letter to DPT Yala Provincial Office
   - Specify: purpose (municipal GIS dashboard)
   - Request: digital shapefile of zoning layers + map legend
3. **Alternative:** Visit DPT office in person for map review

### Available Zoning Information

| Zone Type | Typical Color Code | Land Use |
|-----------|-------------------|----------|
| Red | Commercial zone | Shops, markets, offices |
| Yellow | Residential zone | Housing |
| Purple | Industrial zone | Factories, warehouses |
| Green | Agricultural/open space | Farms, parks |
| Blue | Public facilities | Schools, hospitals, government |
| White | Undesignated/transition | Mixed use |

### Digital Availability

- **PDF format:** Available from DPT website or provincial office
- **Shapefile format:** Requires formal request (typically approved for government use)
- **Coordinate system:** Indian 1975 or WGS84 (verify with DPT)
- **Scale:** Typically 1:4,000 for urban areas

### Related DPT Data

| Data | Description |
|------|-------------|
| Building control areas | Height restrictions |
| Road alignment | Planned road expansions |
| Public utility corridors | Water, sewer, electricity |
| Environmental zones | Flood-prone, protected areas |

---

## 12. Road Network Data

### 12A: DRR (Department of Rural Roads) Rural Roads

| Attribute | Details |
|-----------|---------|
| **Layer Name** | Rural Road Network (ทางหลวงชนบท) |
| **Source URL** | https://dataportal.drr.go.th |
| **API Type** | WMS + Shapefile download + REST API |
| **Authentication** | Free registration for download |
| **Format** | Shapefile (.shp), GeoJSON, WMS |
| **Coverage** | All rural roads nationwide |
| **Update Frequency** | Annual survey cycle |
| **Priority** | **HIGH - Road network completeness** |

#### Access Methods

1. **Web Map (MDMS):** https://localkc.drr.go.th (Map Display and Management System)
2. **Data Portal:** https://dataportal.drr.go.th - Search "โครงข่ายทางหลวงชนบท"
3. **Shapefile Download:** Available from data portal with filtering by province
4. **WMS Service:** Available for direct map integration

#### Data Fields

| Field | Description |
|-------|-------------|
| Road ID | Unique road identifier |
| Road Name | Thai road name |
| Road Class | Classification (local, connector, etc.) |
| Surface Type | Paved, unpaved, concrete, asphalt |
| Road Width | Width in meters |
| Length | Segment length |
| Province/District | Administrative location |
| Condition | Pavement condition rating |

### 12B: DOH (Department of Highways) National Highways

| Attribute | Details |
|-----------|---------|
| **Layer Name** | National Highway Network |
| **Source URL** | https://bmm.doh.go.th/website/ |
| **API Type** | Shapefile download + Web map |
| **Authentication** | Free for viewing; download may require request |
| **Format** | Shapefile |
| **Coverage** | All national highways (1-digit, 2-digit, 3-digit, rural highways) |
| **Priority** | **HIGH - Major road network** |

#### Access

- Web map: https://bmm.doh.go.th/website/index.php/road-maintenance-statistics/control-distance-map
- Shapefile: Available from DOH data portal
- GDCatalog: https://gdcatalog.go.th (search "กรมทางหลวง")

### 12C: Combined Road Network Strategy

For Yala dashboard, combine three sources:

| Source | Road Type | Coverage |
|--------|-----------|----------|
| DOH | Highways ( Hwy 409, 410, 418, etc.) | National roads |
| DRR | Rural roads (local connectors) | Inter-village roads |
| OSM | Urban streets, alleys | City-level completeness |

---

## 13. RID Water Data

| Attribute | Details |
|-----------|---------|
| **Agency** | Royal Irrigation Department (กรมชลประทาน) |
| **Source URL** | https://www.rid.go.th |
| **Data Portal** | https://app.rid.go.th/reservoir/ |
| **API Type** | Web tables + REST (HTML) + Some WMS |
| **Authentication** | None for public data |
| **Coverage** | All RID stations nationwide |
| **Update Frequency** | Real-time (hourly for some stations) |
| **Priority** | **MEDIUM - Flood/drought monitoring** |

### Available Data for Yala

| Data Type | URL/Access | Description |
|-----------|-----------|-------------|
| Reservoir levels | https://app.rid.go.th/reservoir/ | Current storage % for all reservoirs |
| Daily rainfall | https://hyd-app-db.rid.go.th/hydro1d_admsl.html | Daily rain gauges |
| 7-day rainfall | https://hyd-app-db.rid.go.th/hydro7d_admsl.html | Weekly rainfall accumulation |
| River levels | https://hyd-app-db.rid.go.th/hydro2d_admsl.html | Real-time water level |
| Flood warnings | https://water.rid.go.th/flood/flood/res_table.htm | Flood alert status |

### Yala-Specific Water Infrastructure

| Reservoir/Project | Province | Capacity | Status |
|-------------------|----------|----------|--------|
| Yala Irrigation Project | Yala | 1.200 MCM | Active |
| Bang Lang Dam | Yala | 1,380 MCM | Major reservoir |

### RID Station Types

| Type | Description | Update Frequency |
|------|-------------|------------------|
| Rain gauge | Precipitation measurement | Daily |
| Water level gauge | River stage | Hourly (telemetry) |
| Reservoir gauge | Dam storage level | Daily |
| Runoff station | Flow measurement | Daily |
| Telemetric station | Automated real-time | Hourly |

### Integration Notes

- RID data is primarily in HTML tables; some stations have API access
- For GIS dashboard: Scrape or manually download station coordinates and current readings
- Contact RID Regional Office 10 (Southern Region) for Yala-specific data
- Station locations may need to be geocoded from address lists

---

## 14. DEM for Yala

### Comparison of Available DEM Sources

| Source | Resolution | Vertical Accuracy | Coverage | Cost | Best For |
|--------|-----------|-------------------|----------|------|----------|
| **ALOS AW3D30** | 30m | 3-5m RMSE | Global incl. Yala | Free | **Best overall for Yala** |
| **SRTM 1-Arc-Second** | 30m | 5-7m RMSE | Global incl. Yala | Free | General topography |
| **ASTER GDEM v3** | 30m | 8-12m RMSE | Global | Free | Backup only (noise issues) |
| **TanDEM-X 90m** | 90m | 4m RMSE | Global | Free (90m) | Regional analysis |
| **NASADEM** | 30m | 5m RMSE | Global | Free | Improved SRTM |
| **RTSD DEM** | Variable | Varies | Thailand | On request | Official government use |

### Recommended: ALOS AW3D30

| Attribute | Details |
|-----------|---------|
| **Full Name** | ALOS World 3D - 30m |
| **Source** | JAXA (Japan Aerospace Exploration Agency) |
| **Download URL** | https://www.eorc.jaxa.jp/ALOS/en/dataset/aw3d30/aw3d30_e.htm |
| **Resolution** | 1 arc-second (~30m at equator) |
| **Vertical Accuracy** | 3.28m RMSE (Takaku et al. study) |
| **Format** | GeoTIFF |
| **Tiles** | 1 degree x 1 degree |
| **Registration** | Required (free) |
| **Priority** | **HIGH - Best free DEM for Yala** |

### Download Process

1. **Register** at JAXA AW3D30 portal (free)
2. **Receive** login credentials via email
3. **Navigate** to download page
4. **Select** tile(s) covering Yala area
   - Yala coordinates: ~6.3-6.9 N, 101.0-101.6 E
   - Download tile: N06E101 (covers Yala city)
5. **Download** as .tar.gz (contains DSM, mask, quality files)
6. **Extract** GeoTIFF and import to GIS

### Files in Download Package

| File | Description |
|------|-------------|
| `DSM` | Digital Surface Model (elevation GeoTIFF) |
| `MSK` | Mask (cloud/snow/valid flags) |
| `STK` | Stack number (scenes used) |
| `QAI` | Quality assurance information |
| `HDR` | Metadata header |

### Alternative: SRTM via USGS EarthExplorer

| Attribute | Details |
|-----------|---------|
| **Source** | NASA/USGS |
| **URL** | https://earthexplorer.usgs.gov |
| **Product** | SRTM 1 Arc-Second Global |
| **Cost** | Free |
| **Registration** | Required (free USGS account) |

---

## 15. Google Earth Engine

| Attribute | Details |
|-----------|---------|
| **Platform** | Google Earth Engine (GEE) |
| **URL** | https://code.earthengine.google.com |
| **Access** | Cloud-based (JavaScript/Python API) |
| **Registration** | Required (free for research/non-profit) |
| **Data Available** | Landsat (1984+), Sentinel-2 (2015+), MODIS, SRTM, and 500+ datasets |
| **Processing** | Server-side (Google infrastructure) |
| **Priority** | **HIGH - For time-series analysis & change detection** |

### Code Example: Yala Land Use Change Detection

```javascript
// ============================================
// Google Earth Engine - Yala Land Use Change
// ============================================

// Define Yala Municipality area (approximate)
var yalaCity = ee.Geometry.Rectangle([101.25, 6.52, 101.35, 6.62]);

// Function: Get cloud-free Sentinel-2 composite for a year
function getS2Composite(year) {
  return ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED')
    .filterBounds(yalaCity)
    .filterDate(year + '-01-01', year + '-12-31')
    .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 20))
    .median()
    .clip(yalaCity)
    .select(['B2', 'B3', 'B4', 'B8', 'B11', 'B12']);
}

// Get composites for two periods
var s2_2019 = getS2Composite(2019);
var s2_2024 = getS2Composite(2024);

// Calculate NDVI for both periods
function addNDVI(image) {
  return image.addBands(
    image.normalizedDifference(['B8', 'B4']).rename('NDVI')
  );
}

var ndvi_2019 = addNDVI(s2_2019).select('NDVI');
var ndvi_2024 = addNDVI(s2_2024).select('NDVI');

// Calculate NDVI change
var ndviChange = ndvi_2024.subtract(ndvi_2019).rename('NDVI_Change');

// Visualization parameters
var ndviVis = {min: -0.5, max: 0.5, palette: ['red', 'white', 'green']};
var rgbVis = {bands: ['B4', 'B3', 'B2'], min: 0, max: 3000};

// Display
Map.centerObject(yalaCity, 13);
Map.addLayer(s2_2024, rgbVis, 'S2 2024 RGB');
Map.addLayer(ndviChange, ndviVis, 'NDVI Change (2024-2019)');

// ============================================
// Dynamic World Land Cover Classification
// ============================================

var dw2024 = ee.ImageCollection('GOOGLE/DYNAMICWORLD/V1')
  .filterBounds(yalaCity)
  .filterDate('2024-01-01', '2024-12-31')
  .select('label')
  .mode()
  .clip(yalaCity);

var dwVis = {
  min: 0, max: 8,
  palette: ['419BDF', '397D49', '88B053', '7A87C6', 
            'E49635', 'DFC35A', 'C4281B', 'A59B8F', 'B39FE1']
};
Map.addLayer(dw2024, dwVis, 'Dynamic World 2024 Land Cover');
```

### Key Datasets for Yala in GEE

| Dataset | ID | Resolution | Start Date | Use Case |
|---------|-----|-----------|------------|----------|
| Sentinel-2 L2A | `COPERNICUS/S2_SR_HARMONIZED` | 10m | 2017 | Land cover, vegetation |
| Landsat 8/9 | `LANDSAT/LC08/C02/T1_L2` | 30m | 2013 | Long-term change |
| Dynamic World | `GOOGLE/DYNAMICWORLD/V1` | 10m | 2016 | Land cover classification |
| SRTM | `USGS/SRTMGL1_003` | 30m | 2000 | Elevation, slope |
| CHIRPS Rainfall | `UCSB-CHG/CHIRPS/DAILY` | ~5km | 1981 | Precipitation analysis |
| ERA5 Climate | `ECMWF/ERA5_LAND/HOURLY` | ~9km | 1950 | Climate variables |
| VIIRS Fire | `NOAA/VIIRS/001/VNP14IMGTDL_NRT` | 375m | 2012 | Active fire detection |
| MODIS NDVI | `MODIS/061/MOD13Q1` | 250m | 2000 | Vegetation index |

---

## 16. HDX Thailand Admin Boundaries

| Attribute | Details |
|-----------|---------|
| **Platform** | Humanitarian Data Exchange (HDX) |
| **Primary URL** | https://data.humdata.org/dataset/thailand-administrative-boundaries |
| **Alternative** | https://data.humdata.org/dataset/geoboundaries-admin-boundaries-for-thailand |
| **Source** | RTSD (original), OCHA/ITOS (vetted) |
| **Format** | Shapefile, KML, GeoJSON |
| **Authentication** | Free HDX account (optional for download) |
| **License** | Humanitarian use (check terms) |
| **Priority** | **HIGH - Recommended over GADM for official use** |

### Comparison: GADM vs HDX vs FAO GAUL

| Criterion | GADM | HDX (RTSD) | FAO GAUL |
|-----------|------|------------|----------|
| **Source** | Compiled academic | Official RTSD | FAO compilation |
| **Accuracy** | Good | **Best (official)** | Moderate |
| **Update** | Annual | Annual (OCHA vetted) | Discontinued (2015) |
| **Resolution** | Detailed | **Official** | Coarse |
| **License** | Academic/non-commercial | Humanitarian use | Public domain |
| **Thai names** | Yes | Yes | Limited |
| **Level 3 (Tambon)** | Yes | **Yes (official)** | Limited |

### Recommendation for Yala Dashboard

**Use HDX RTSD boundaries** as the authoritative source. Reasons:
1. Directly sourced from Royal Thai Survey Department
2. Vetted and maintained by OCHA/ITOS
3. Official boundaries recognized by Thai government
4. Available at tambon level (critical for municipal analysis)

### Download Instructions

1. Visit https://data.humdata.org/dataset/thailand-administrative-boundaries
2. Navigate to "Data Resources" section
3. Download:
   - `tha_admbnda_adm3_rtsd_20220121.shp` (Tambon level)
   - `tha_admbnda_adm2_rtsd_20220121.shp` (District level)
   - `tha_admbnda_adm1_rtsd_20220121.shp` (Province level)
4. Filter to Yala province (`ADM1_EN == 'Yala'` or `ADM1_TH == 'ยะลา'`)

---

## 17. Additional Sources Summary

### 17A: GISTDA Drought Monitoring

| Attribute | Details |
|-----------|---------|
| **URL** | https://cropsdrought.gistda.or.th |
| **API** | https://cropsdrought.gistda.or.th/api-docs |
| **Type** | REST API + Web map |
| **Data** | Drought risk index, soil moisture, ET, crop water use |
| **Use** | Agricultural drought assessment |

### 17B: GISTDA Forest Monitoring (GFMS)

| Attribute | Details |
|-----------|---------|
| **URL** | https://gfms.gistda.or.th |
| **Type** | Web map + data download |
| **Data** | Forest cover change, deforestation alerts |
| **Source** | THEOS-2, Landsat, Sentinel-2 |

### 17C: TMD Weather Data

| Attribute | Details |
|-----------|---------|
| **Agency** | Thai Meteorological Department |
| **URL** | https://www.tmd.go.th |
| **Data** | Weather stations, rainfall, temperature, forecasts |
| **GIS Data** | Station coordinates available; weather as attributes |

### 17D: NASA FIRMS (Fire Supplement)

| Attribute | Details |
|-----------|---------|
| **URL** | https://firms.modaps.eosdis.nasa.gov |
| **Type** | WMS + Download + Email alerts |
| **Data** | MODIS/VIIRS active fire detections |
| **Format** | CSV, SHP, KML, WMS |
| **Cost** | Free |

### 17E: Copernicus Data Space

| Attribute | Details |
|-----------|---------|
| **URL** | https://dataspace.copernicus.eu |
| **Type** | STAC API + Direct download |
| **Data** | Sentinel-1, Sentinel-2, Sentinel-3 |
| **Cost** | Free |
| **API** | STAC-compliant REST API |

### 17F: Sentinel Hub / GISTDA Access

| Attribute | Details |
|-----------|---------|
| **Type** | WMTS/WMS endpoint |
| **Data** | Sentinel-2 imagery served via GISTDA infrastructure |
| **Access** | Through GISTDA Sphere or Sentinel Hub |

---

## Integration Architecture Summary

### Recommended Layer Stack for Yala Dashboard

| Priority | Layer | Source | API Type |
|----------|-------|--------|----------|
| 1 | Base Map | GISTDA Sphere | WMTS/XYZ |
| 2 | Admin Boundaries | HDX (RTSD) | Shapefile |
| 3 | Parcel Boundaries | LandsMaps WMS | WMS |
| 4 | Road Network | DRR + DOH + OSM | Shapefile/WMS |
| 5 | Flood Areas | GISTDA Disaster | WMS/REST API |
| 6 | Fire Hotspots | GISTDA Fire/NASA FIRMS | WMS/REST API |
| 7 | DEM / Terrain | ALOS AW3D30 | GeoTIFF |
| 8 | Satellite Imagery | GISTDA Sphere/THEOS-2 | WMTS |
| 9 | Land Cover | Google Earth Engine | GEE API |
| 10 | Water Data | RID | Web scrape/API |
| 11 | City Plan Zones | DPT | Shapefile (on request) |
| 12 | Land Values | LandsMaps | REST/WMS |

### API Authentication Summary

| Service | Auth Type | How to Obtain |
|---------|-----------|---------------|
| GISTDA Sphere | API Key | Register at sphere.gistda.or.th |
| GISTDA Disaster | API Key | Register at disaster.gistda.or.th |
| LandsMaps WMS | None | Public endpoint |
| DRR Data Portal | Free account | Register at dataportal.drr.go.th |
| RTSD Maps | Official letter | Submit to RTSD |
| RTSD CORS | Subscription | Contact RTSD Geodesy |
| JAXA AW3D30 | Free registration | Register at JAXA EORC |
| Google Earth Engine | Application | Apply at signup (free) |
| HDX | Free account | Register at data.humdata.org |
| USGS EarthExplorer | Free account | Register at earthexplorer.usgs.gov |
| Copernicus Data Space | Free account | Register at dataspace.copernicus.eu |

---

## References

1. GISTDA Sphere API Documentation: https://sphere.gistda.or.th/docs
2. GISTDA Sphere API Reference: https://api.sphere.gistda.or.th/map/doc.html
3. GISTDA Disaster Platform API: https://disaster.gistda.or.th/services/open-api
4. GISTDA Flood STAC Catalog: https://stacindex.org/catalogs/gistda-flood-disaster-in-thailand
5. THEOS-2 Satellite Information: https://www.eoportal.org/satellite-missions/theos-2
6. GISTDA News - THEOS-2 Update: https://www.gistda.or.th/news_view.php?n_id=8552&lang=EN
7. LandsMaps WMS (Land Department): http://110.164.49.68:8081/geoserver/WMSDOL/wms?
8. OpenStreetMap Geofabrik Thailand: https://download.geofabrik.de/asia/thailand.html
9. HDX Thailand Boundaries: https://data.humdata.org/dataset/thailand-administrative-boundaries
10. HDX GeoBoundaries Thailand: https://data.humdata.org/dataset/geoboundaries-admin-boundaries-for-thailand
11. DRR Data Portal: https://dataportal.drr.go.th
12. RID Reservoir Data: https://app.rid.go.th/reservoir/
13. JAXA ALOS AW3D30: https://www.eorc.jaxa.jp/ALOS/en/dataset/aw3d30/aw3d30_e.htm
14. USGS EarthExplorer: https://earthexplorer.usgs.gov
15. Google Earth Engine: https://code.earthengine.google.com
16. Yala City Municipality Info: https://www.yalacity.go.th/content/general
17. DPT Bangkok Planning Portal (reference): https://webportal.bangkok.go.th/cpud
18. GISTDA Drought API: https://cropsdrought.gistda.or.th/api-docs
19. Copernicus Data Space STAC API: https://documentation.dataspace.copernicus.eu/APIs/STAC.html
20. NASA FIRMS Fire Data: https://firms.modaps.eosdis.nasa.gov

---

*Report compiled from 20+ web searches across Thai government portals, international satellite data platforms, GIS data repositories, and academic sources. All URLs verified as of June 2025.*
