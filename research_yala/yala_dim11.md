# Dimension 11: International & Regional Supplementary Data Sources

## Deep-Dive Research: Yala Municipality & Thailand

**Research Date:** June 2026
**Scope:** International and regional data sources providing supplementary data on Yala and Thailand for benchmarking, climate analysis, disaster preparedness, and filling gaps in national data.
**Search Count:** 24+ searches across all sources

---

## Table of Contents

1. [World Bank Indicators API](#1-world-bank-indicators-api)
2. [UNDP SDG Profile Yala](#2-undp-sdg-profile-yala)
3. [UN ESCAP SDG Data Portal](#3-un-escap-sdg-data-portal)
4. [HDX Humanitarian Data Exchange](#4-hdx-humanitarian-data-exchange)
5. [CHIRPS Rainfall Data](#5-chirps-rainfall-data)
6. [GloFAS Flood Forecasting](#6-glofas-global-flood-awareness-system)
7. [Global Forest Watch](#7-global-forest-watch)
8. [OpenAQ Air Quality](#8-openaq-air-quality)
9. [Meta High Resolution Population Density](#9-meta-high-resolution-population-density)
10. [WorldPop Population Estimates](#10-worldpop-population-estimates)
11. [NASA SEDAC GPWv4](#11-nasa-sedac-gpwv4)
12. [Copernicus Data Space](#12-copernicus-data-space)
13. [Google Earth Engine](#13-google-earth-engine)
14. [UCDP/ACLED Conflict Data](#14-ucdpacled-conflict-data)
15. [IOM Displacement Tracking Matrix](#15-iom-displacement-tracking-matrix)
16. [ASEAN Data Portal](#16-asean-data-portal)

---

## 1. World Bank Indicators API

| Attribute | Details |
|-----------|---------|
| **Source Name** | World Bank Open Data - Indicators API |
| **URL** | https://data.worldbank.org |
| **API Documentation** | https://datahelpdesk.worldbank.org/knowledgebase/articles/889392-about-the-indicators-api-documentation |
| **API Endpoint** | `https://api.worldbank.org/v2/country/{country_code}/indicator/{indicator_code}` |
| **Data Type** | Socioeconomic indicators (16,000+ time series) |
| **Geographic Coverage** | Country-level for Thailand; limited subnational data |
| **Update Frequency** | Annual to quarterly, varies by indicator |
| **License** | Creative Commons CC BY 4.0 |
| **Integration Approach** | REST API calls with country code `THA`; returns JSON/XML; no authentication required |

### Key Databases Available
The World Bank Indicators API provides access to over 89 databases including:
- **World Development Indicators (WDI)** - Primary database with 1,400+ indicators
- **Subnational Poverty Database** (ID: 38) - Subnational poverty data
- **Subnational Population** (ID: 50) - Subnational population estimates
- **Subnational Malnutrition Database** (ID: 5)
- **Sustainable Development Goals** (ID: 46) - SDG indicator data
- **Doing Business** - Business environment indicators
- **Human Capital Index** - Human capital metrics
- **Worldwide Governance Indicators** - Governance quality metrics

### API Structure (V2)
```
https://api.worldbank.org/v2/country/THA/indicator/SP.POP.TOTL?format=json
```

### Subnational Data for Thailand
While most World Bank indicators are country-level, two key subnational databases exist:
1. **Subnational Poverty Database** - Province-level poverty data (including Yala province)
2. **Subnational Population Database** - Province-level population counts

**Relevance for Yala:** High - Provides Thailand-level benchmarking data across all major development indicators. Use for national comparison context. Subnational poverty data available for Yala province.

---

## 2. UNDP SDG Profile Yala

| Attribute | Details |
|-----------|---------|
| **Source Name** | UNDP SDG Profile - Yala Province |
| **URL** | https://www.undp.org/publications/SDG-profile-yala |
| **Direct Download (English)** | https://www.undp.org/sites/g/files/zskgke326/files/2024-06/sdg_profile_yala_english.pdf (22.8 MB) |
| **Direct Download (Thai)** | https://www.undp.org/sites/g/files/zskgke326/files/2024-06/sdg_profile_yala_thai.pdf (11.6 MB) |
| **API Endpoint** | No API - PDF report format |
| **Data Type** | Provincial SDG assessment report |
| **Geographic Coverage** | Yala Province (province-level) |
| **Update Frequency** | One-time publication (June 2024) |
| **License** | UNDP Open Access |
| **Integration Approach** | Manual data extraction from PDF; data tables in appendices can be digitized |

### Report Contents
The SDG Profile Yala provides:
- **SDG indicator performance** across all 17 SDGs with province-level data
- **Public perception survey** results on sustainability priorities
- **Alignment analysis** between SDGs and Yala Development Plan (2023-2027)
- **Benchmarking** against national averages (color-coded: above/below national)
- **Key indicators covered:**
  - SDG 1: Poverty rate, social protection coverage
  - SDG 3: Health worker density, under-5 mortality, O-NET scores
  - SDG 4: Education participation rates, student performance
  - SDG 6: Water/sanitation access
  - SDG 7: Renewable energy capacity
  - SDG 8: Employment, informal sector, unemployment rate
  - SDG 9: Road access, technology access
  - SDG 11: Urban development indicators
  - SDG 13: Disaster-affected persons
  - SDG 15: Forest area, protected areas

### Methodology
- Collaborative effort by Ministry of Interior, UNDP, NIDA, and TDRI
- Uses UN official SDG indicators with proxy indicators where needed
- Incorporates public survey data from 15 target provinces
- Benchmarks against national values with 4-level performance rating

### Other Available Province Profiles
Same format available for: Bangkok, Chiang Mai, Chiang Rai, Mae Hong Son, Nakhon Ratchasima, Narathiwat, Pattani, Phetchaburi, Phuket, Songkhla, Surat Thani, Tak, Ubon Ratchathani, Udon Thani

**Relevance for Yala:** Very High - The most comprehensive SDG assessment specifically for Yala province. Directly comparable to national benchmarks.

---

## 3. UN ESCAP SDG Data Portal

| Attribute | Details |
|-----------|---------|
| **Source Name** | Asia-Pacific SDG Gateway (UN ESCAP) |
| **URL** | https://data.unescap.org |
| **Data Explorer** | https://dataexplorer.unescap.org |
| **API Endpoint** | Not publicly documented; data available through web interface |
| **Data Type** | SDG indicators for Asia-Pacific region |
| **Geographic Coverage** | 58 ESCAP member states (country-level only, no subnational) |
| **Update Frequency** | Annual (SDG Progress Report published yearly) |
| **License** | UN Open Data |
| **Integration Approach** | Web-based data explorer; manual download; country-level data only |

### Available Data
- All 17 SDGs with indicator tracking
- Country profiles for Thailand
- Regional and subregional comparison tools
- SDG Progress Snapshot data
- Time series from 2000 to present

### Subnational Disaggregation
**Critical Limitation:** The UN ESCAP SDG Gateway provides data at **country-level only**. No subnational or provincial disaggregation is available for Thailand. The portal acknowledges data limitations: "disaggregation of most indicators at the local level is either incomplete or unavailable."

### Key Reports
- Asia and the Pacific SDG Progress Report 2025: https://repository.unescap.org/server/api/core/bitstreams/26439fa0-1a28-4d16-be2d-4a89d4879f62/content
- Provides regional benchmarking for Thailand across all SDGs

**Relevance for Yala:** Medium - Useful for national-level Thailand benchmarking against Asia-Pacific region, but no Yala-specific data. Use for context on Thailand's national SDG progress.

---

## 4. HDX Humanitarian Data Exchange

| Attribute | Details |
|-----------|---------|
| **Source Name** | HDX - Humanitarian Data Exchange |
| **URL** | https://data.humdata.org |
| **Thailand HAPI Dataset** | https://data.humdata.org/dataset/hdx-hapi-tha |
| **API Endpoint** | https://hapi.humdata.org/ (HDX HAPI) |
| **Data Type** | Humanitarian indicators (conflict, refugees, food security, population, climate) |
| **Geographic Coverage** | Thailand, sub-national (province-level) |
| **Update Frequency** | Daily |
| **License** | CC BY-IGO, CC BY, CC0 (varies by source) |
| **Integration Approach** | HDX HAPI REST API with standardized endpoints; CSV downloads available |

### Available Datasets for Thailand (8 Resources)

| # | Dataset | Source | Size | Format |
|---|---------|--------|------|--------|
| 1 | Refugees & Persons of Concern | UNHCR | 1.4 MB | CSV |
| 2 | Conflict Events | ACLED | 41 KB | CSV |
| 3 | National Risk | INFORM | 309 B | CSV |
| 4 | Food Prices & Market Monitor | WFP | 26.1 KB | CSV |
| 5 | Poverty Rate | OPHI | 2.4 KB | CSV |
| 6 | Baseline Population | UNFPA | 5.9 MB | CSV |
| 7 | Rainfall | WFP | 4.4 MB | CSV |
| 8 | Data Availability | HDX HAPI | 99.3 KB | CSV |

### HDX HAPI API Access
```
Base URL: https://hapi.humdata.org/
Documentation: https://hdx-hapi.readthedocs.io/
```

### Additional HDX Thailand Datasets
Beyond HAPI, HDX hosts 152+ datasets for Thailand including:
- Natural disaster events (EM-DAT)
- Earthquake alerts (GDACS)
- Population displacement data (IDMC)
- ACLED conflict data (country-year and country-month aggregates)
- Food security assessments

**Relevance for Yala:** Very High - Provides standardized humanitarian data including conflict events, population data, and rainfall. Sub-national coverage available. Daily updates via API.

---

## 5. CHIRPS Rainfall Data

| Attribute | Details |
|-----------|---------|
| **Source Name** | CHIRPS (Climate Hazards Group InfraRed Precipitation with Stations) |
| **URL** | https://www.chc.ucsb.edu/data/chirps |
| **CHIRPS v3** | https://www.chc.ucsb.edu/data/chirps3 |
| **Data Download** | https://data.chc.ucsb.edu/products/CHIRPS-2.0/ |
| **API/Access** | Google Earth Engine: `UCSB-CHG/CHIRPS/DAILY`; Direct download via HTTP |
| **Data Type** | Daily rainfall estimates (mm) |
| **Geographic Coverage** | Global, 60degN-60degS (includes all of Thailand/Yala) |
| **Spatial Resolution** | 0.05 degrees (~5.5 km at equator) |
| **Temporal Coverage** | 1981 to near-present |
| **Update Frequency** | Daily (preliminary); Monthly (final) |
| **License** | Creative Commons CC0 (public domain) |
| **Integration Approach** | Google Earth Engine JavaScript/Python API; direct GeoTIFF download; HTTP access |

### CHIRPS v3 Products
- **Preliminary product**: Available 2 days after end of pentad (on 2nd, 7th, 12th, 17th, 22nd, 27th)
- **Final product**: Produced once monthly (third week of following month)
- **Daily products**: Two variants - 'rnl' (ERA5-based) and 'sat' (IMERG-based)
- **Formats**: GeoTIFF, NetCDF, BIL, COG
- **Timesteps**: Daily, pentad, dekad, monthly, annual

### Google Earth Engine Code Example for Yala
```javascript
// Define Yala province bounding box (approximate)
var yala = ee.Geometry.Rectangle([101.0, 5.9, 102.3, 6.7]);

// Load CHIRPS daily rainfall
var chirps = ee.ImageCollection('UCSB-CHG/CHIRPS/DAILY')
  .filterBounds(yala)
  .filterDate('2024-01-01', '2024-12-31')
  .select('precipitation');

// Calculate total annual rainfall
var annualRain = chirps.sum().clip(yala);

// Export
Export.image.toDrive({
  image: annualRain,
  description: 'Yala_Annual_Rainfall_2024',
  scale: 5500,
  region: yala,
  fileFormat: 'GeoTIFF'
});
```

### Direct Download (Python)
```python
import urllib.request
base_url = "https://data.chc.ucsb.edu/products/CHIRPS-2.0/global_daily/tifs/p05/"
file = "chirps.2024.01.01.tif.gz"
urllib.request.urlretrieve(base_url + "2024/" + file, file)
```

**Relevance for Yala:** Very High - Primary rainfall data source for Yala dashboard. 40+ year historical record enables trend analysis and drought monitoring.

---

## 6. GloFAS Global Flood Awareness System

| Attribute | Details |
|-----------|---------|
| **Source Name** | GloFAS (Global Flood Awareness System) |
| **URL** | https://www.globalfloods.eu |
| **Copernicus CDS** | https://cds.climate.copernicus.eu/cdsapp#!/dataset/cems-glofas-historical |
| **Open-Meteo Flood API** | https://open-meteo.com/en/docs/flood-api |
| **API Endpoint** | `https://flood-api.open-meteo.com/v1/flood` |
| **Data Type** | River discharge forecasts, flood alerts |
| **Geographic Coverage** | Global (0.1 degree grids, ~5km at equator) |
| **Temporal Coverage** | Reanalysis: 1984-present; Forecast: up to 30 days ahead |
| **Update Frequency** | Daily |
| **License** | Copernicus Open Data (free) |
| **Integration Approach** | Open-Meteo REST API; Copernicus Climate Data Store API |

### GloFAS Products
- **Flood forecasts**: Up to 30-day ensemble river discharge forecasts
- **Rapid Impact Assessment**: Links streamflow forecasts to inundation estimates, calculates population exposure
- **Seasonal outlooks**: 4-month seasonal flood outlooks
- **Historical reanalysis**: 1984 to present consistent dataset (GloFAS v4)

### Open-Meteo Flood API Example for Yala
```python
import requests
url = "https://flood-api.open-meteo.com/v1/flood"
params = {
    "latitude": 6.55,      # Yala city latitude
    "longitude": 101.28,   # Yala city longitude
    "daily": "river_discharge",
    "forecast_days": 30,
    "ensemble": True
}
response = requests.get(url, params=params)
data = response.json()
```

### Key Parameters
| Parameter | Description |
|-----------|-------------|
| `river_discharge` | River discharge in m³/s |
| `river_discharge_mean` | Ensemble mean discharge |
| `river_discharge_median` | Ensemble median discharge |
| `river_discharge_max` | Maximum ensemble discharge |
| `river_discharge_min` | Minimum ensemble discharge |

### Alert Thresholds
GloFAS uses return period thresholds:
- **2-year return period**: Minor flooding
- **5-year return period**: Moderate flooding
- **20-year return period**: Severe flooding

**Relevance for Yala:** High - Essential for flood early warning. Yala River Basin coverage available. Note: Due to 5km resolution, specific river accuracy may vary; coordinates should be adjusted by 0.1° to find representative discharge.

---

## 7. Global Forest Watch

| Attribute | Details |
|-----------|---------|
| **Source Name** | Global Forest Watch (GFW) |
| **URL** | https://www.globalforestwatch.org |
| **Data API Docs** | https://vizzuality.github.io/gfw-doc-api/ |
| **API Endpoint** | `https://production-api.globalforestwatch.org/v1/` |
| **Data Type** | Forest cover, tree cover loss, deforestation alerts, fire data |
| **Geographic Coverage** | Global (including Yala/Thailand) |
| **Spatial Resolution** | Hansen: 30m; GLAD alerts: 30m; RADD alerts: 10m (tropics) |
| **Temporal Coverage** | Tree cover: 2000 baseline; Loss: 2001-present |
| **Update Frequency** | Annual (tree cover); Weekly (GLAD alerts); Daily (fire alerts) |
| **License** | CC BY 4.0 (Hansen/UMD data) |
| **Integration Approach** | REST API with authentication token; zonal statistics endpoint; area-of-interest queries |

### Available Datasets
1. **Hansen Global Forest Change** - 30m resolution tree cover loss 2001-present
2. **GLAD Alerts** - Weekly 30m deforestation alerts (University of Maryland)
3. **RADD Alerts** - Near-real-time 10m alerts for tropics (Radar-based)
4. **VIIRS/MODIS Active Fires** - Daily fire alerts
5. **Tree Cover Density** - Percent tree cover at 30m (2000 baseline)
6. **Above Ground Biomass** - Carbon stock estimates

### API Authentication
```bash
curl -i -H 'Authorization: Bearer <your-token>' \
  -H 'Content-Type: application/json' \
  -XPOST 'https://production-api.globalforestwatch.org/v1/stats/{dataset-id}' \
  -d '{"geostore": "<geostore-id>"}'
```

### Zonal Statistics for Yala
```bash
# Get tree cover loss statistics for Yala area
curl -X POST https://production-api.globalforestwatch.org/v1/stats/forest_change \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "geostore": "yala-province-geostore-id",
    "additionalAxes": {
      "iso": "THA"
    }
  }'
```

### Key Limitations
- **Note (as of October 2025):** Some GFW data is no longer being updated due to U.S. federal funding disruptions
- Hansen tree cover loss data remains the most reliable historical dataset

**Relevance for Yala:** High - Critical for monitoring forest cover changes in Yala province, fire alerts, and deforestation tracking. Weekly alert system can be integrated into dashboard.

---

## 8. OpenAQ Air Quality

| Attribute | Details |
|-----------|---------|
| **Source Name** | OpenAQ (Open Air Quality) |
| **URL** | https://openaq.org |
| **API Documentation** | https://docs.openaq.org |
| **API Base URL** | `https://api.openaq.org` |
| **Data Type** | Air quality measurements (PM2.5, PM10, SO2, NO2, CO, O3, etc.) |
| **Geographic Coverage** | Global (Thailand coverage includes major stations) |
| **Temporal Coverage** | Historical to near real-time |
| **Update Frequency** | Hourly (near real-time) |
| **License** | Open data; third-party terms apply to original sources |
| **Integration Approach** | REST API v3; locations and measurements endpoints |

### OpenAQ API v3 Endpoints
| Endpoint | Description |
|----------|-------------|
| `GET /v3/locations` | List monitoring stations with metadata |
| `GET /v3/locations/{id}/latest` | Latest measurements for a location |
| `GET /v3/measurements` | Raw measurement values |
| `GET /v3/countries` | Country summary metadata |
| `GET /v3/parameters` | Available pollutant parameters |

### Parameters Available
| Parameter | Unit | Description |
|-----------|------|-------------|
| `pm25` | µg/m³ | Particulate matter < 2.5 µm |
| `pm10` | µg/m³ | Particulate matter < 10 µm |
| `so2` | µg/m³ | Sulfur dioxide |
| `no2` | µg/m³ | Nitrogen dioxide |
| `co` | µg/m³ | Carbon monoxide |
| `o3` | µg/m³ | Ozone |
| `bc` | µg/m³ | Black carbon |

### API Example for Yala
```python
import requests

# Search for stations near Yala (within 100km)
url = "https://api.openaq.org/v3/locations"
params = {
    "coordinates": "6.55,101.28",  # Yala city
    "radius": 100000,              # 100km radius in meters
    "limit": 100
}
headers = {"X-API-Key": "your-api-key"}
response = requests.get(url, params=params, headers=headers)
stations = response.json()

# Get measurements
measurements_url = "https://api.openaq.org/v3/measurements"
params = {
    "location_id": station_id,
    "parameter": "pm25",
    "datetime_from": "2024-01-01T00:00:00Z"
}
```

### Thailand Coverage
OpenAQ has adapters for Thailand's national air quality monitoring network. Air quality data is available from Thai Pollution Control Department stations. Note: Station density in Southern Thailand (including Yala) may be limited compared to Bangkok area.

**Relevance for Yala:** Medium - Air quality data availability depends on proximity of monitoring stations to Yala municipality. May need to use nearest stations (potentially in Hat Yai or other southern cities).

---

## 9. Meta High Resolution Population Density

| Attribute | Details |
|-----------|---------|
| **Source Name** | High Resolution Population Density Maps + Demographic Estimates |
| **URL (HDX)** | https://data.humdata.org (search "High Resolution Population Density") |
| **Methodology** | https://dataforgood.facebook.com/dfg/docs/methodology-high-resolution-population-density-maps |
| **API Endpoint** | No direct API; download via HDX or Google Earth Engine |
| **Data Type** | Population density raster (persons per 30m grid cell) |
| **Geographic Coverage** | Global (Thailand included) |
| **Spatial Resolution** | ~30 meters (1 arc-second) |
| **Temporal Coverage** | Circa 2020 |
| **Update Frequency** | Irregular (major updates) |
| **License** | CC BY International |
| **Integration Approach** | HDX download (GeoTIFF/CSV); Google Earth Engine ImageCollection |

### Available Demographic Categories
For each country, 14 files are available:
1. **Total population** (overall population density)
2. **Male population**
3. **Female population**
4. **Women of reproductive age** (15-49)
5. **Children under 5** (ages 0-5)
6. **Youth** (ages 15-24)
7. **Elderly** (ages 60+)

### Google Earth Engine Access
```javascript
// Load HRSL for Thailand
var hrsl = ee.ImageCollection("projects/sat-io/open-datasets/hrsl/hrslpop");

// Filter to Yala area
var yala = ee.Geometry.Rectangle([101.0, 5.9, 102.3, 6.7]);
var yalaPop = hrsl.filterBounds(yala).mosaic().clip(yala);

// Visualize
Map.addLayer(yalaPop, {min: 0, max: 50, palette: ['white', 'yellow', 'red']}, 'Yala Population');
```

### HDX Download
```
URL: https://data.humdata.org/dataset/high-resolution-population-density-maps-demographic-estimates
Format: GeoTIFF (per country) or CSV (latitude, longitude, population)
Projection: EPSG:4326 / WGS84
```

**Relevance for Yala:** High - 30m resolution population data enables precise population mapping for Yala municipality. Useful for estimating affected population in disaster scenarios and infrastructure planning.

---

## 10. WorldPop Population Estimates

| Attribute | Details |
|-----------|---------|
| **Source Name** | WorldPop Global Population Data 2015-2030 |
| **URL** | https://hub.worldpop.org |
| **HDX Organization** | https://data.humdata.org/organization/worldpop |
| **API Endpoint** | No API; HTTP download from WorldPop Hub or HDX |
| **Data Type** | Gridded population counts (persons per 100m grid cell) |
| **Geographic Coverage** | Global (Thailand included) |
| **Spatial Resolution** | 3 arc-seconds (~100m at equator) |
| **Temporal Coverage** | 2000-2030 (annual estimates) |
| **Update Frequency** | Annual releases (R2025A version current) |
| **License** | CC BY 4.0 |
| **Integration Approach** | HTTP download GeoTIFF; Google Earth Engine ImageCollection |

### Available Data for Thailand
- **Population Count**: Total persons per grid cell (unconstrained and constrained)
- **Population Density**: Persons per km²
- **Age-Sex Disaggregated**: 20 age bands (0-1, 1-4, 5-9, 10-14, ..., 90+) by gender
- ** UN-adjusted**: Totals match UN World Population Prospects

### File Naming Convention
```
{iso}_{gender}_{age_group}_{year}_{type}_{resolution}.tif
Example: tha_t_00_2020_100m.tif (Thailand, total, age 0-1, 2020, 100m)
```

### Download URL Pattern
```
https://hub.worldpop.org/geodata/summary?id={dataset_id}
Thailand 2020 Population: https://hub.worldpop.org/geodata/summary?id=6439
```

### Google Earth Engine
```javascript
// WorldPop 2020 Thailand population
var worldpop = ee.ImageCollection("WorldPop/GP/100m/pop");
var thailandPop = worldpop.filter(ee.Filter.eq('country', 'THA'))
                          .filter(ee.Filter.eq('year', 2020))
                          .first();
```

### Constrained vs Unconstrained
- **Constrained (CN)**: Population allocated to built-settlement areas only (recommended)
- **Unconstrained**: Population distributed across entire land area

**Relevance for Yala:** High - 100m resolution population estimates with demographic breakdowns useful for vulnerability assessment and service planning. Annual projections to 2030 enable future planning.

---

## 11. NASA SEDAC GPWv4

| Attribute | Details |
|-----------|---------|
| **Source Name** | NASA SEDAC Gridded Population of the World v4 |
| **URL** | https://sedac.ciesin.columbia.edu/data/collection/gpw-v4 |
| **Earthdata Catalog** | https://www.earthdata.nasa.gov/data/catalog/sedac-ciesin-sedac-gpwv4-popdens-r11-4.11 |
| **API Endpoint** | STAC API available through US GHG Center |
| **Data Type** | Population counts and density grids |
| **Geographic Coverage** | Global (including Thailand) |
| **Spatial Resolution** | 30 arc-seconds (~1 km at equator) |
| **Temporal Coverage** | 2000, 2005, 2010, 2015, 2020 |
| **Update Frequency** | 5-year intervals |
| **License** | CC BY 4.0 |
| **Integration Approach** | STAC API (RASTER API); direct NetCDF/GeoTIFF download |

### Available Products
| Product | Description |
|---------|-------------|
| Population Count | Number of persons per grid cell |
| Population Density | Persons per km² |
| Population Count (UN WPP-adjusted) | Adjusted to UN World Population Prospects |
| Land Area | Land area per grid cell |
| Water Mask | Water area identification |

### STAC API Access
```python
import requests

RASTER_API_URL = "https://earth.gov/ghgcenter/api/raster"
collection_id = "sedac-popdensity-yeargrid5yr-v4.11"

# Get tile JSON for visualization
tile = requests.get(
    f"{RASTER_API_URL}/collections/{collection_id}/items/"
    f"sedac-popdensity-yeargrid5yr-v4.11-gpw_v4_population_density_rev11_2020_30_sec_2020/"
    f"WebMercatorQuad/tilejson.json?"
    f"&assets=population-density&rescale=0,5000"
).json()
```

### Key Features
- Uses ~13.5 million administrative units globally for disaggregation
- Maintains fidelity to input census data
- Available through US GHG Center STAC API for programmatic access
- Population Estimation Service (PES) for custom area queries

**Relevance for Yala:** Medium - Coarser resolution (1km) than Meta HRSL (30m) or WorldPop (100m), but provides validated population data aligned to official census counts. Best used as a cross-reference/validation source.

---

## 12. Copernicus Data Space

| Attribute | Details |
|-----------|---------|
| **Source Name** | Copernicus Data Space Ecosystem (CDSE) |
| **URL** | https://dataspace.copernicus.eu |
| **API Documentation** | https://documentation.dataspace.copernicus.eu/APIs |
| **STAC API** | `https://stac.dataspace.copernicus.eu/v1` |
| **Sentinel Hub** | `https://sh.dataspace.copernicus.eu/api/v1` |
| **Data Type** | Sentinel satellite imagery (Sentinel-1, 2, 3, 5P) |
| **Geographic Coverage** | Global (Yala full coverage) |
| **Spatial Resolution** | Sentinel-2: 10m (RGB/NIR), 20m (SWIR), 60m (atmospheric) |
| **Temporal Coverage** | Sentinel-2: 2015-present |
| **Revisit Frequency** | Sentinel-2: 5 days (with 2 satellites) |
| **License** | Copernicus Open Access Hub (free) |
| **Integration Approach** | STAC API (pystac-client); Sentinel Hub API; S3 direct access |

### Available Collections
| Collection | Description | Resolution |
|------------|-------------|------------|
| `sentinel-2-l2a` | Surface reflectance (atmospherically corrected) | 10/20/60m |
| `sentinel-2-l1c` | Top-of-atmosphere reflectance | 10/20/60m |
| `sentinel-1-grd` | SAR data (all-weather) | 10m |
| `sentinel-3-olci` | Ocean/land color | 300m |
| `sentinel-5p-l2` | Atmospheric composition | 5.5km |

### STAC API Query Example for Yala
```python
from pystac_client import Client
import stackstac

# Connect to CDSE STAC catalog
cat = Client.open("https://stac.dataspace.copernicus.eu/v1")

# Define Yala area of interest (Yala municipality polygon)
yala_geom = {
    "type": "Polygon",
    "coordinates": [[
        [101.25, 6.52],   # NW
        [101.30, 6.52],   # NE
        [101.30, 6.58],   # SE
        [101.25, 6.58],   # SW
        [101.25, 6.52]    # Close
    ]]
}

# Search Sentinel-2 L2A
params = {
    "max_items": 100,
    "collections": "sentinel-2-l2a",
    "datetime": "2024-01-01/2024-12-31",
    "intersects": yala_geom,
    "filter": {
        "op": "<",
        "args": [{"property": "eo:cloud_cover"}, 15]
    },
    "fields": {
        "include": [
            "id", "properties.datetime", "properties.eo:cloud_cover",
            "assets.B04_10m", "assets.B03_10m", "assets.B02_10m",
            "assets.B08_10m", "assets.B11_20m", "assets.B12_20m",
            "assets.SCL_20m"
        ]
    }
}

items = list(cat.search(**params).items_as_dicts())
print(f"Found {len(items)} Sentinel-2 scenes for Yala")

# Create data cube
stack = stackstac.stack(
    items=items,
    resolution=(10, 10),
    bounds_latlon=(101.25, 6.52, 101.30, 6.58),
    epsg=32647  # UTM Zone 47N for Yala
)
```

### Key API Features
- **STAC Filter Extension**: CQL2 filtering for cloud cover, date ranges
- **Fields Extension**: Request only needed metadata (reduces response size)
- **Sentinel Hub Processing API**: On-the-fly processing (NDVI, composites)
- **OGC API**: WMS/WMTS/WCS for GIS integration
- **S3 Direct Access**: Direct data download from object storage

**Relevance for Yala:** Very High - Primary source for high-resolution satellite imagery of Yala. Enables land use mapping, vegetation monitoring, flood mapping, and urban growth analysis at 10m resolution.

---

## 13. Google Earth Engine

| Attribute | Details |
|-----------|---------|
| **Source Name** | Google Earth Engine (GEE) |
| **URL** | https://earthengine.google.com |
| **Code Editor** | https://code.earthengine.google.com |
| **Data Catalog** | https://developers.google.com/earth-engine/datasets |
| **API** | JavaScript API (Code Editor), Python API (ee module) |
| **Data Type** | Multi-petabyte satellite imagery and geospatial datasets |
| **Geographic Coverage** | Global (Yala fully covered) |
| **License** | Free for research, education, and nonprofit use; commercial license available |
| **Integration Approach** | JavaScript or Python API; cloud-based processing |

### Key Datasets for Yala in GEE Catalog

| Dataset | Description | Resolution | Temporal |
|---------|-------------|------------|----------|
| `LANDSAT/LC08/C02/T1_L2` | Landsat 8 Surface Reflectance | 30m | 2013-present |
| `LANDSAT/LC09/C02/T1_L2` | Landsat 9 Surface Reflectance | 30m | 2021-present |
| `COPERNICUS/S2_SR_HARMONIZED` | Sentinel-2 MSI | 10/20/60m | 2015-present |
| `UCSB-CHG/CHIRPS/DAILY` | Daily rainfall | 5.5km | 1981-present |
| `NASA/GLDAS/V021/NOAH/G025/T3H` | Land surface model | 0.25 deg | 2000-present |
| `MODIS/061/MOD13Q1` | NDVI (vegetation index) | 250m | 2000-present |
| `JAXA/GPM_L3/GSMaP/v6/operational` | GPM rainfall estimates | 0.1 deg | 2014-present |
| `USGS/SRTMGL1_003` | DEM (elevation) | 30m | Static |
| `ESA/WorldCover/v200` | Land cover classification | 10m | 2021 |
| `projects/sat-io/open-datasets/hrsl/hrslpop` | Meta HRSL Population | 30m | ~2020 |

### GEE Python Code Example for Yala
```python
import ee
import geemap

# Initialize
ee.Initialize()

# Define Yala municipality AOI
yala_aoi = ee.Geometry.Rectangle([101.25, 6.52, 101.30, 6.58])

# Get Sentinel-2 imagery for 2024
s2 = (ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED')
      .filterBounds(yala_aoi)
      .filterDate('2024-01-01', '2024-12-31')
      .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 20))
      .median()
      .clip(yala_aoi))

# Calculate NDVI
ndvi = s2.normalizedDifference(['B8', 'B4']).rename('NDVI')

# Export
geemap.ee_export_image_to_drive(
    ndvi, description='Yala_NDVI_2024',
    folder='Yala_Data', region=yala_aoi, scale=10
)
```

### Key GEE Capabilities for Yala Dashboard
- **Time series analysis**: Long-term vegetation, rainfall, temperature trends
- **Change detection**: Urban expansion, deforestation, flood mapping
- **Spectral indices**: NDVI, NDWI, NDBI for land cover monitoring
- **Cloud-based processing**: No local data storage needed
- **Integration**: Export to Google Drive, BigQuery, Cloud Storage

**Relevance for Yala:** Very High - Essential platform for integrating multiple satellite data sources. Cloud-based processing eliminates need for local compute infrastructure. JavaScript code editor enables rapid prototyping.

---

## 14. UCDP/ACLED Conflict Data

### 14a. UCDP (Uppsala Conflict Data Program)

| Attribute | Details |
|-----------|---------|
| **Source Name** | UCDP Georeferenced Event Dataset (GED) |
| **URL** | https://ucdp.uu.se |
| **Downloads** | https://ucdp.uu.se/downloads/ |
| **API Docs** | https://ucdp.uu.se/apidocs/ |
| **API Endpoint** | `https://ucdpapi.pcr.uu.se/api/{dataset}/{version}` |
| **Data Type** | Georeferenced conflict event data |
| **Geographic Coverage** | Global (Thailand included) |
| **Temporal Coverage** | 1989-present (yearly); Daily events (GED) |
| **Update Frequency** | Monthly (GED Candidate); Yearly (stable release) |
| **License** | CC BY 4.0 |
| **Integration Approach** | REST API with token authentication; JSON output |

### UCDP API Details
```
Base URL: https://ucdpapi.pcr.uu.se/api/
Authentication: Token required (free registration)
Format: JSON
Latest GED version: 25.1
Latest GED Candidate: 26.0.4 (monthly)
```

### UCDP Datasets Available via API
| Dataset | API Label | Description |
|---------|-----------|-------------|
| GED Events | `gedevents` | Georeferenced individual events |
| Armed Conflict | `ucdpprioconflict` | Yearly state-based conflicts |
| Non-State Conflict | `nonstate` | Non-state actor conflicts |
| One-Sided Violence | `onesided` | Violence against civilians |
| Battle-Related Deaths | `battledeaths` | Fatalities data |

### UCDP API Example
```python
import requests

# GED events for Thailand (filter by country code)
url = "https://ucdpapi.pcr.uu.se/api/gedevents/25.1"
headers = {"Authorization": "Token YOUR_TOKEN"}
params = {"pagesize": 1000}

response = requests.get(url, headers=headers, params=params)
data = response.json()
# Filter for Thailand events in client code
```

---

### 14b. ACLED (Armed Conflict Location & Event Data Project)

| Attribute | Details |
|-----------|---------|
| **Source Name** | ACLED |
| **URL** | https://acleddata.com |
| **Conflict Data** | https://acleddata.com/conflict-data |
| **Download** | https://acleddata.com/conflict-data/download-data-files |
| **API Registration** | https://developer.acleddata.com |
| **Data Type** | Real-time conflict and protest event data |
| **Geographic Coverage** | Global (Thailand: 2010-present) |
| **Temporal Coverage** | Thailand: 2010-April 2026 |
| **Update Frequency** | Weekly (real-time data) |
| **License** | ACLED Terms of Use (registration required) |
| **Integration Approach** | ACLED API (REST); HDX HAPI; CSV download |

### ACLED API Access
```python
import requests

# ACLED API
url = "https://api.acleddata.com/acled/read"
params = {
    "key": "YOUR_API_KEY",
    "email": "YOUR_EMAIL",
    "country": "Thailand",
    "admin1": "Yala",  # Filter by Yala province
    "format": "json"
}

response = requests.get(url, params=params)
events = response.json()
```

### HDX HAPI ACLED Data (Simplified Access)
```python
# Direct CSV download from HDX (no API key needed)
import pandas as pd
url = "https://data.humdata.org/dataset/ee7a85d6-86a1-456e-90cb-5907edf82dab/resource/14ed3017-e7c5-4e9c-93d1-ce92f655c128/download/hdx_hapi_conflict_event_tha.csv"
df = pd.read_csv(url)
# Filter for Yala
df_yala = df[df['admin1_name'] == 'Yala']
```

### ACLED Event Types
| Event Type | Description |
|------------|-------------|
| Battles | Armed clashes between actors |
| Violence against civilians | Targeted civilian harm |
| Protests | Demonstrations and rallies |
| Riots | Disorderly group violence |
| Strategic developments | Non-violent significant events |
| Explosions/Remote violence | IEDs, bombings, remote attacks |

### Key ACLED Indicators for Yala
- **Event counts** by type and location
- **Fatality estimates**
- **Actor identification** (state forces, rebel groups, etc.)
- **Sub-national admin levels**: Admin1 (province), Admin2 (district), Admin3 (subdistrict)
- **P-coded**: Compatible with humanitarian location codes

**Relevance for Yala:** Very High - ACLED is the primary source for conflict event data in Southern Thailand. HDX HAPI provides simplified weekly access. Critical for safety monitoring and development planning in Yala.

---

## 15. IOM Displacement Tracking Matrix

| Attribute | Details |
|-----------|---------|
| **Source Name** | IOM Displacement Tracking Matrix (DTM) |
| **URL** | https://dtm.iom.int |
| **API** | https://dtm.iom.int/dtm-api |
| **Data Type** | Mobility tracking, flow monitoring, displacement data |
| **Geographic Coverage** | 91 active DTM countries (Thailand included) |
| **Temporal Coverage** | Varies by country/programme |
| **Update Frequency** | Monthly to quarterly |
| **License** | IOM Open Data terms |
| **Integration Approach** | DTM API; report downloads; interactive dashboards |

### DTM Components
| Component | Description |
|-----------|-------------|
| **Mobility Tracking** | Location-based displacement data |
| **Flow Monitoring** | Movement flows at key transit points |
| **Registration** | Individual/household records |
| **Surveys** | Thematic assessments (needs, intentions) |

### Thailand Coverage
- **Flow Monitoring**: Active at Thailand-Myanmar border (Tak, Ranong, Kanchanaburi, Chiang Rai provinces)
- **Population Mobility Monitoring (PMM)**: Implemented at Thailand-Lao and Thailand-Cambodia borders (Nong Khai, Sa Kaeo, Chanthaburi)
- **Myanmar displacement response**: Data on Myanmar nationals entering Thailand

### Key Limitation for Yala
**Direct Yala-specific DTM data is limited.** IOM's DTM activities in Thailand focus primarily on:
- Western border (Myanmar): Tak, Kanchanaburi, Ranong, Chiang Rai
- Northeastern border (Lao PDR): Nong Khai
- Eastern border (Cambodia): Sa Kaeo, Chanthaburi

**No dedicated DTM flow monitoring at the Yala-Malaysia border** is currently documented.

### DTM API
```
URL: https://dtm.iom.int/dtm-api
Documentation: Available through DTM website
```

**Relevance for Yala:** Low-Medium - DTM does not have dedicated Yala operations, but regional reports on southern border provinces may contain relevant mobility data. IOM Global Data Institute may have broader migration data relevant to Yala.

---

## 16. ASEAN Data Portal

| Attribute | Details |
|-----------|---------|
| **Source Name** | ASEAN Statistics Data Portal |
| **URL** | https://data.aseanstats.org |
| **API Endpoint** | No public API; web interface only |
| **Data Type** | Regional economic, trade, FDI, tourism indicators |
| **Geographic Coverage** | 10 ASEAN member states (country-level) |
| **Update Frequency** | Annual |
| **License** | ASEAN Statistics terms |
| **Integration Approach** | Web-based data download; manual extraction |

### Available Indicators
| Category | Indicators |
|----------|------------|
| **Trade** | Intra-ASEAN trade, trade in goods/services, tariff data |
| **FDI** | Foreign direct investment inflows/outflows |
| **Macroeconomic** | GDP, inflation rate, exchange rates |
| **Transport** | Air, road, water transport statistics |
| **Tourism** | Visitor arrivals, intra-ASEAN tourism |
| **Labour** | Employment, labour force statistics |

### Interactive Dashboards
1. ASEAN Visitor Arrivals Dashboard
2. ASEAN Trade in Services Dashboard
3. ASEAN Trade in Goods (IMTS) Dashboard

### ASEAN Integration Indices
The portal provides composite indicators for ASEAN economic integration:
- **Intra-ASEAN Trade Index**: Tracks trade integration progress
- **Intra-ASEAN FDI Index**: Foreign investment integration
- **ASEAN Economic Integration Index**: Overall integration composite

### Thailand-Specific Data
- Thailand's share of intra-ASEAN trade: ~14.5% of GDP (1996-2000 average)
- Thailand's intra-ASEAN FDI share: ~9.3% (1996-2000 average)
- Border trade statistics with Malaysia (relevant for Yala's Betong border crossing)

### Key Limitation
**No subnational data** - ASEAN Statistics Data Portal provides country-level data only. No specific data on Yala's border economy with Malaysia is directly available. However, Thailand-Malaysia bilateral trade data can provide regional context.

**Relevance for Yala:** Medium - Provides regional economic context for Thailand's position in ASEAN. Useful for understanding cross-border trade dynamics, though Yala-specific data not available. Betong border crossing trade would be captured in Thailand-Malaysia bilateral statistics.

---

## Summary Integration Matrix

| # | Source | API Available | Subnational Data | Update Freq | Primary Use for Yala |
|---|--------|---------------|------------------|-------------|---------------------|
| 1 | World Bank API | Yes (REST) | Limited (poverty) | Annual | National benchmarking |
| 2 | UNDP SDG Profile Yala | No (PDF) | Province-level | One-time (2024) | Comprehensive SDG assessment |
| 3 | UN ESCAP SDG Portal | No (web) | No | Annual | Regional SDG context |
| 4 | HDX HAPI | Yes (REST) | Province-level | Daily | Conflict, population, rainfall |
| 5 | CHIRPS Rainfall | Yes (GEE) | 5.5km grid | Daily | Rainfall monitoring, drought |
| 6 | GloFAS | Yes (REST) | 5km grid | Daily | Flood forecasting |
| 7 | Global Forest Watch | Yes (REST) | 30m grid | Weekly alerts | Forest/deforestation monitoring |
| 8 | OpenAQ | Yes (REST v3) | Station-level | Hourly | Air quality tracking |
| 9 | Meta HRSL | Via GEE/HDX | 30m grid | Static (~2020) | Population density mapping |
| 10 | WorldPop | Via GEE/HTTP | 100m grid | Annual | Population projections |
| 11 | NASA SEDAC GPWv4 | Yes (STAC) | 1km grid | 5-year | Population validation |
| 12 | Copernicus Data Space | Yes (STAC) | 10m imagery | 5-day | Satellite imagery, land use |
| 13 | Google Earth Engine | Yes (JS/Python) | Varies by dataset | Near real-time | Multi-source integration |
| 14 | UCDP/ACLED | Yes (REST) | Event-level | Weekly | Conflict monitoring |
| 15 | IOM DTM | Yes (API) | Flow monitoring | Monthly | Migration/displacement |
| 16 | ASEAN Data Portal | No (web) | No | Annual | Regional trade context |

---

## Recommended Integration Priority

### Tier 1: Essential (Immediate Integration)
1. **CHIRPS** - Daily rainfall for flood/drought monitoring
2. **HDX HAPI** - Standardized conflict, population, rainfall data
3. **ACLED** - Real-time conflict events for Yala
4. **Copernicus/Sentinel-2** - High-resolution land use monitoring
5. **Google Earth Engine** - Platform for multi-source integration

### Tier 2: Important (Short-term Integration)
6. **WorldPop** - Detailed population estimates with demographics
7. **Meta HRSL** - 30m population density for Yala municipality
8. **GloFAS** - Flood forecasting for Yala River Basin
9. **Global Forest Watch** - Forest cover and fire alerts
10. **UNDP SDG Profile** - Baseline SDG indicator framework

### Tier 3: Contextual (Medium-term Integration)
11. **World Bank API** - National benchmarking indicators
12. **OpenAQ** - Air quality monitoring
13. **NASA SEDAC** - Population validation/cross-reference
14. **UCDP** - Historical conflict analysis
15. **ASEAN Data Portal** - Regional economic context
16. **IOM DTM** - Migration data (if Yala operations expand)

---

## Data Sources Cited

| Source | Citation |
|--------|----------|
| World Bank | World Bank Open Data, API v2. https://api.worldbank.org/v2 |
| UNDP | SDG Profile Yala (2024). https://www.undp.org/publications/SDG-profile-yala |
| UN ESCAP | Asia-Pacific SDG Gateway. https://data.unescap.org |
| HDX | HDX HAPI Thailand. https://data.humdata.org/dataset/hdx-hapi-tha |
| CHIRPS | Climate Hazards Center, UCSB. https://www.chc.ucsb.edu/data/chirps |
| GloFAS | Copernicus EMS. https://www.globalfloods.eu |
| GFW | World Resources Institute. https://www.globalforestwatch.org |
| OpenAQ | OpenAQ v3 API. https://docs.openaq.org |
| Meta/HRSL | Meta Data for Good. https://dataforgood.facebook.com |
| WorldPop | WorldPop Hub, University of Southampton. https://hub.worldpop.org |
| NASA SEDAC | CIESIN, Columbia University. https://sedac.ciesin.columbia.edu |
| Copernicus | CDSE. https://dataspace.copernicus.eu |
| GEE | Google Earth Engine. https://earthengine.google.com |
| ACLED | ACLED. https://acleddata.com |
| UCDP | Uppsala Conflict Data Program. https://ucdp.uu.se |
| IOM DTM | IOM Displacement Tracking Matrix. https://dtm.iom.int |
| ASEAN | ASEAN Statistics Data Portal. https://data.aseanstats.org |

---

*Report compiled from 24+ web searches and direct API documentation review. All URLs verified as of June 2026.*
