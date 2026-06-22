## 5. Environmental and Climate Data

### 5.1 Air Quality and Pollution

The air quality monitoring landscape for Yala Municipality draws from three distinct tiers: a national ground-station network, satellite-derived estimates, and an international open-data aggregator. The Pollution Control Department (PCD) operates **air4thai** (air4thai.pcd.go.th), a network of 77 stations across 46 provinces measuring PM2.5, PM10, O3, CO, NO2, and SO2 on an hourly basis.[^1^] Yala's station currently reports AQI values between 38 and 69 (Good to Moderate) with PM2.5 around 21 µg/m³.[^1^] The platform exposes JSON and XML APIs through the Envilink government data catalog (envilink.go.th), enabling hourly polling for the Yala station record.[^1^]

**GISTDA Sphere** complements ground data with satellite-derived PM2.5 estimates at pm25.gistda.or.th, integrating aerosol optical depth (AOD) from polar-orbiting satellites with meteorological dispersion models.[^2^] These estimates fill spatial gaps between ground stations and are particularly valuable during transboundary haze episodes — common in the southern region during dry months — when pollutant plumes from biomass burning may not be captured by a single municipal station.[^2^] **OpenAQ** provides a third-layer aggregation through its stable v3 API (released October 2024). The `/v3/locations` endpoint lists monitoring stations with geospatial metadata, while `/v3/measurements` returns raw pollutant values filtered by location, parameter, and time range.[^3^] OpenAQ harvests from Thailand's national PCD network and standardizes units and timestamps, making it useful for cross-border comparison with Malaysian stations in Kelantan and Perak.[^3^]

| Source | Base URL / API Endpoint | Parameters | Spatial Coverage | Update Frequency | Authentication |
|---|---|---|---|---|---|
| air4thai (PCD) | air4thai.pcd.go.th/webV3/; JSON via envilink.go.th | PM2.5, PM10, O3, CO, NO2, SO2, AQI | 77 stations, 46 provinces | Hourly | None |
| GISTDA PM2.5 | pm25.gistda.or.th | Satellite PM2.5, AOD | Thailand nationwide | Daily | None (web); API key (REST) |
| OpenAQ v3 | api.openaq.org/v3/ | PM2.5, PM10, O3, CO, NO2, SO2, BC | Station-level globally | Hourly | API key recommended |

The current Yala Smart City Dashboard displays PM2.5 as a single value without pollutant breakdown or forecasting.[^4^] Integrating the full six-parameter suite from air4thai and adding TMD 24–48 hour AQI forecasts would transform this into a decision-support tool for vulnerable populations — particularly the 76,338 elderly residents (13.89% of the province) for whom PM2.5 exposure carries elevated respiratory risk.[^4^]

### 5.2 Weather and Climate

The Thai Meteorological Department (กรมอุตุนิยมวิทยา) operates 10+ stations across Yala Province — Yala Agrometeorological Station, Betong Weather Observing Station, and AWS units at Raman, Mueang Yala, Krong Pinang, Kabang, Bannang Sata, Yaha, and Than To.[^5^] The TMDAPI (data.tmd.go.th/api) provides 15-minute AWS data, 7-day forecasts, weather warnings, and climate normals in JSON/XML. Free registration at data.tmd.go.th/api/registerPre.php is required.[^5^]

CHIRPS (Climate Hazards Group InfraRed Precipitation with Station data) delivers the longest satellite-gauge blended rainfall record for Yala at 0.05-degree resolution (~5.5 km), covering 1981 to near-present on a daily timestep.[^6^] GISTDA validated CHIRPS over Thailand through a 40-year analysis (1981–2020), confirming its reliability for detecting the extreme rainfall events that trigger southern Thailand flooding.[^6^] Access is available through three pathways: the ClimateSERV web portal (climateserv.servirglobal.net), direct HTTP download from the UCSB data server (data.chc.ucsb.edu/products/CHIRPS-2.0/), and the Google Earth Engine ImageCollection `UCSB-CHG/CHIRPS/DAILY` for server-side analysis.[^6^] The 5.5 km resolution is coarse relative to Yala's 19.4 km² municipal area but adequate for watershed-scale Pattani River Basin analysis (3,805.65 km²), where rainfall accumulation over 24–72 hours is the primary flood trigger.

The World Bank Climate Change Knowledge Portal provides CMIP6 projections across five SSP scenarios, projecting 1.0–3.8°C warming by 2080–2099 for Thailand, with the strongest warming in the southern region alongside intensifying wet-season precipitation.[^7^] GISTDA's drought portal (drought.gistda.or.th) publishes standardized drought indices from NDVI, NDWI, and SMAP observations, with an agricultural assessment API at cropsdrought.gistda.or.th providing sub-district resolution risk indices.[^8^]

| Source | Base URL / API Endpoint | Data Type | Spatial Resolution | Temporal Coverage | Authentication |
|---|---|---|---|---|---|
| TMD API | data.tmd.go.th/api | Weather, forecasts, warnings | 10+ station locations | Real-time; 7-day forecast | Free registration |
| CHIRPS | GEE: UCSB-CHG/CHIRPS/DAILY; data.chc.ucsb.edu | Daily rainfall (mm) | ~5.5 km | 1981–near-present | None |
| World Bank Climate Portal | climateknowledgeportal.worldbank.org/country/thailand | CMIP6 projections | 0.5-degree grid | 1995–2100 (projected) | None |
| GISTDA Drought | cropsdrought.gistda.or.th/api-docs | Drought indices, soil moisture | Sub-district | 2000–present | API key |

### 5.3 Disaster and Flood Risk

GISTDA's disaster platform (disaster.gistda.or.th) is the most critical environmental data source for Yala's dashboard.[^9^] Satellite-derived flood extent maps from MODIS (twice daily), Sentinel-1 SAR (1–2 day revisit), and high-resolution optical imagery are exposed through REST JSON, WMS, WMTS, and TMS endpoints.[^9^] The Open API at `api-gateway.gistda.or.th/api/2.0/resources` serves 1-day, 3-day, 7-day, and 30-day flood layers; historical archives are catalogued through a STAC endpoint at `disaster-vallaris.gistda.or.th/core/api/stac/1.0/Flood/` with collections for 2022, 2023, and 2024.[^9^]

The Global Flood Awareness System (GloFAS), operated by the Copernicus Emergency Management Service, provides Pattani River Basin discharge forecasts at ~5 km resolution (0.1-degree grid) through the Open-Meteo Flood API (`flood-api.open-meteo.com/v1/flood`).[^10^] The API exposes 30-day ensemble forecasts with parameters including ensemble mean, median, minimum, and maximum river discharge in m³/s, alongside 2-year, 5-year, and 20-year return-period thresholds that enable automated alert triggering.[^10^] Bang Lang Dam (เขื่อนบังลัง), located in Bannang Sata District approximately 56 km from Yala city, is the primary flood control infrastructure for the Pattani River Basin.[^11^] The earth-core rockfill dam has a storage capacity of 1,420 million cubic meters (MCM), an installed hydropower capacity of 72 MW, and provides irrigation water for approximately 380,000 rai (60,800 hectares).[^11^] Real-time water level, storage percentage, and inflow data are available through the ThaiWater.net API (standard.thaiwater.net/docs/) with hourly telemetry updates.[^11^] Dashboard integration should display current storage percentage alongside GloFAS discharge forecasts to provide 24–48 hours of predictive flood warning.

Recent flood history provides empirical calibration data: February 2022 (3,114 households affected), December 2023 — a "50-year flood" (15,457 households, 4 deaths, railway disruption, 100+ schools closed), and November–December 2024 (664,000+ households region-wide, 21,800 hectares agricultural damage).[^12^] These events underscore the urgency of integrating GloFAS forecasts, GISTDA flood extent, and Bang Lang Dam telemetry with TPMAP poverty layers for risk-based evacuation planning.

| Source | Base URL / API Endpoint | Data Type | Spatial Resolution | Update Frequency | Authentication |
|---|---|---|---|---|---|
| GISTDA Flood API | disaster.gistda.or.th; api-gateway.gistda.or.th/api/2.0/resources | Flood extent, frequency layers | 10–30 m (SAR/optical) | Daily (near real-time) | API key |
| GISTDA Flood STAC | disaster-vallaris.gistda.or.th/core/api/stac/1.0/Flood/ | Historical flood archives | 10–30 m | Annual collections | API key |
| GloFAS / Open-Meteo | flood-api.open-meteo.com/v1/flood | River discharge forecasts | ~5 km (0.1° grid) | Daily (30-day forecast) | None |
| Bang Lang Dam | thaiwater.net; standard.thaiwater.net/docs/ | Reservoir level, storage %, inflow | Point (telemetry) | Hourly | None |
| DDPM Reports | ddpm.go.th; adinet.ahacentre.org | Event impacts, damage assessments | District/village | Event-driven | None |

### 5.4 Forest and Land Cover

Global Forest Watch (GFW) provides the foundational forest cover dataset for Yala: Hansen Global Forest Change at 30 m resolution (2001–present), weekly GLAD deforestation alerts at 30 m, and daily VIIRS/MODIS fire alerts.[^13^] The GFW REST API (`production-api.globalforestwatch.org/v1/`) supports zonal statistics queries, enabling automated calculation of tree cover loss within municipal boundaries.[^13^] GISTDA's fire portal (fire.gistda.or.th) supplements this with MODIS (1 km) and VIIRS (375 m) hotspot detection, dispatching SMS alerts to district officers within 20 minutes.[^14^] API endpoints follow the same disaster platform pattern as the flood system. For the dashboard, VIIRS alert layers should be overlaid on GFW tree cover data to distinguish fire risk zones by forest density and populated-area proximity.

The Copernicus Sentinel-2 constellation delivers 10 m multispectral imagery with a 5-day revisit through the Copernicus Data Space STAC API (`stac.dataspace.copernicus.eu/v1`), supporting CQL2 filtering for cloud cover and date ranges.[^15^] Google Earth Engine serves as the integration platform for multi-source environmental analysis, hosting a multi-petabyte catalog including Sentinel-2, Landsat, CHIRPS, MODIS NDVI, SRTM elevation, and the Dynamic World V1 land cover product — a 10 m near real-time classifier into 9 classes (water, trees, grass, flooded vegetation, crops, scrub/shrub, built area, bare ground, snow/ice) with per-pixel probability scores.[^16^] For Yala, two analytical workflows are immediately relevant. First, NDVI change detection using Sentinel-2 composites: filtering the `COPERNICUS/S2_SR_HARMONIZED` collection by cloud cover (<20%), calculating median composites for two periods, and subtracting NDVI rasters to produce a vegetation change map.[^16^] Second, running the Dynamic World classifier annually from 2016 to present produces a time series of urban expansion, agricultural conversion, and forest loss within the 19.4 km² municipal area — directly supporting land use planning, green space monitoring (currently 15.95 m² per capita), and flood vulnerability assessment when combined with SRTM-derived elevation and slope data.[^16^]

| Source | Base URL / API Endpoint | Data Type | Spatial Resolution | Update Frequency | Authentication |
|---|---|---|---|---|---|
| Global Forest Watch | production-api.globalforestwatch.org/v1/ | Tree cover loss, GLAD alerts, fire | 30 m (Hansen/GLAD); 375 m (VIIRS) | Annual (loss); Weekly (alerts); Daily (fire) | API token |
| GISTDA Fire | fire.gistda.or.th; disaster.gistda.or.th | Hotspot detection (MODIS/VIIRS) | 1 km (MODIS); 375 m (VIIRS) | 20-minute SMS alerts | API key |
| Copernicus Sentinel-2 | stac.dataspace.copernicus.eu/v1 | Multispectral imagery (13 bands) | 10 m (RGB/NIR) | 5-day revisit | Free account |
| Google Earth Engine | code.earthengine.google.com | Multi-petabyte analysis; Dynamic World | Varies; 10 m (land cover) | Near real-time | Application |
