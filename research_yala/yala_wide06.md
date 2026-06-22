## Facet: International & Regional Open Data Sources

**Research Date:** 2025-07-18
**Researcher:** AI Research Agent
**Scope:** International and regional open data platforms, development data, climate data, and global initiatives providing data on Thailand with relevance to Yala City Municipality

---

### Key Findings

- **UN ESCAP SDG Gateway** provides comprehensive SDG indicator tracking for Thailand across all 17 goals, with data available at [data.unescap.org](https://data.unescap.org) [^1^]. The Asia-Pacific SDG Progress Report 2025 highlights that the region is off track on all 17 SDGs and based on current progress it will take 32 more years to meet the goals [^2^].

- **UNDP Thailand SDG Profiles** have been created for 15 pilot provinces including **Yala, Pattani, and Narathiwat**, providing provincial-level SDG indicator analysis aligned with provincial development plans [^3^]. The SDG Profile Narathiwat (adjacent to Yala) reveals poverty rates of 28.74% (below national poverty line), significantly higher than the national average [^4^].

- **World Bank Open Data / WDI** provides country-level indicators for Thailand; API access at `https://api.worldbank.org/v2/` returns data for 16,000+ indicators, but subnational data is limited [^5^]. The Subnational Population Database offers provincial-level population estimates [^6^].

- **World Bank Climate Change Knowledge Portal** provides climate projections for Thailand showing warming trends of 1.0-3.8°C by 2080-2099 depending on emissions scenarios, with strongest warming projected in southern Thailand [^7^].

- **CHIRPS rainfall data** (Climate Hazards Group) provides 0.05° resolution (~5.5km) precipitation data from 1981 to near-present, available via API, Google Earth Engine (`UCSB-CHG/CHIRPS/DAILY`), and download [^8^]. WFP publishes CHIRPS-derived dekadal rainfall indicators at subnational level on HDX for Thailand [^9^].

- **Global Forest Watch (WRI)** provides 30m resolution tree cover loss data (Hansen et al. 2013, updated to 2024), VIIRS/MODIS active fire alerts, and a REST API for geospatial queries on forest change [^10^]. Thailand-specific dashboards are available at the province and district level.

- **Copernicus Data Space Ecosystem** provides free, open access to Sentinel-1 (SAR), Sentinel-2 (10m optical), Sentinel-3, and Sentinel-5P atmospheric data for all of Thailand via `dataspace.copernicus.eu`, with API access via OData, STAC, and Sentinel Hub APIs [^11^].

- **GloFAS (Global Flood Awareness System)** provides global river discharge forecasts and historical data at 0.1° resolution; data accessible via Copernicus Early Warning Data Store API with free registration [^12^].

- **Meta/Facebook Data for Good** High Resolution Population Density Maps for Thailand (30m resolution) with demographic breakdowns (age/sex) available on HDX [^13^].

- **WorldPop** provides 100m resolution population estimates for Thailand (2015-2030 projections) with age/sex disaggregation, available via HDX and Google Earth Engine [^14^].

- **OpenAQ** aggregates air quality data from Thailand monitoring stations including PM2.5, PM10, NO2, SO2, CO, O3; accessible via open API (`https://api.openaq.org/v3/`) [^15^].

- **UCDP (Uppsala Conflict Data Program)** provides georeferenced conflict event data for Southern Thailand at individual-event level with village-level coordinates, available via downloadable datasets and API [^16^].

- **HDX (Humanitarian Data Exchange)** hosts 152+ datasets for Thailand including administrative boundaries, population data, rainfall indicators, displacement data, and COVID-19 statistics [^17^].

- **NASA SEDAC GPWv4** provides global population density estimates at 30 arc-second (~1km) resolution for 2000, 2005, 2010, 2015, and 2020, accessible via STAC API [^18^].

- **OpenStreetMap / HOTOSM** provides crowdsourced geospatial data for Thailand including roads, buildings, and points of interest; data extractable via HOT Export Tool (`export.hotosm.org`) and Overpass API [^19^].

---

### Major International Data Platforms

#### 1. World Bank Open Data / World Development Indicators (WDI)
- **URL:** https://data.worldbank.org/country/thailand [^5^]
- **API:** https://api.worldbank.org/v2/country/THA/indicator/{indicator_code} [^5^]
- **Data available:** 16,000+ indicators including GDP, population, poverty, health, education, infrastructure, environment, climate. Country-level only for Thailand; no subnational/provincial breakdown in main WDI.
- **Subnational data:** World Bank Subnational Population Database provides first-level administrative division (province/state) population estimates [^6^]. Poverty and inequality data available via Poverty and Inequality Platform.
- **Geographic coverage:** Thailand national; limited subnational datasets
- **Access method:** Free REST API (JSON/XML), bulk download CSV/Excel, DataBank interactive tool
- **License:** Creative Commons BY 4.0
- **Update frequency:** Annual (most indicators)
- **Relevance to Yala dashboard:** High for national context indicators; limited for municipal-level analysis. Climate Change Knowledge Portal provides additional Thailand-specific climate projections [^7^].

#### 2. UN ESCAP Asia-Pacific SDG Gateway
- **URL:** https://data.unescap.org [^1^]
- **Data Explorer:** https://dataexplorer.unescap.org [^1^]
- **Data available:** SDG indicators for all 17 goals across 58 Asia-Pacific member states. Includes data on poverty, hunger, health, education, gender, water, energy, inequality, cities, climate, land, peace, and partnerships.
- **Geographic coverage:** Thailand national; no subnational disaggregation
- **Access method:** Interactive data explorer, downloadable data tables, annual SDG Progress Reports
- **License:** UN open data
- **Update frequency:** Annual (SDG Progress Report published yearly)
- **Relevance to Yala dashboard:** High for benchmarking Thailand's SDG progress against regional peers. Key for national development context.

#### 3. UNDP Human Development Reports / SDG Profiles
- **URL:** https://www.undp.org/thailand/publications [^3^]
- **SDG Profile Narathiwat:** https://www.undp.org/publications/SDG-profile-narathiwat [^4^]
- **SDG Profile Pattani:** https://www.undp.org/publications/SDG-profile-pattani [^3^]
- **Data available:** SDG Profiles for 15 pilot provinces including **Yala**, Pattani, Narathiwat, Bangkok, Chiang Mai, etc. Each profile covers 50+ indicators across all SDGs with provincial-level data compared against national averages. Includes poverty rates, health indicators, education metrics, economic indicators, disaster vulnerability, and public perception surveys.
- **Geographic coverage:** Provincial level - **directly includes Yala Province**
- **Access method:** PDF downloads; structured data tables within reports
- **License:** UN open access
- **Update frequency:** 2024 (current round)
- **Relevance to Yala dashboard:** **Very High** - The SDG Profile for Yala Province provides direct baseline data for municipal planning. Key indicators: poverty line (28.74% in Narathiwat reference, similar profile expected for Yala), undernourishment, health worker density, road access, disaster-affected persons, and renewable energy capacity. The report also includes public perception data on development priorities and government service gaps.

#### 4. UN OCHA HDX (Humanitarian Data Exchange)
- **URL:** https://data.humdata.org/group/tha [^17^]
- **Data available:** 152+ datasets for Thailand including:
  - Administrative boundaries (country, province, district, subdistrict)
  - Population data (Meta HRPD, WorldPop, UNFPA)
  - CHIRPS-derived rainfall indicators at subnational level (WFP) [^9^]
  - COVID-19 statistics
  - Humanitarian funding flows (FTS)
  - Internal displacement data (IDMC)
  - HDX HAPI standardized humanitarian indicators
- **Geographic coverage:** National to subnational (province/district level)
- **Access method:** Bulk download (CSV, GeoJSON, GeoTIFF, Shapefile), HDX API, HDX HAPI (Humanitarian API)
- **License:** Varies by dataset (most CC-BY or public domain)
- **Update frequency:** Varies by dataset (rainfall: every 10 days; boundaries: annual)
- **Relevance to Yala dashboard:** **Very High** - Provides downloadable administrative boundaries, population data, and climate/rainfall indicators that can be directly used for municipal dashboard baselining.

#### 5. ASEANstats / ASEAN Data Portal
- **URL:** https://data.aseanstats.org/ [^20^]
- **Secondary:** https://www.aseanstats.org/ [^20^]
- **Data available:** Trade in goods/services, FDI, macroeconomic indicators (GDP, inflation), transport statistics, visitor arrivals, labour statistics, SDG indicators progress report. ASEAN Key Figures annual publication.
- **Geographic coverage:** ASEAN member states (including Thailand); national-level only
- **Access method:** Web-based data portal, download statistical tables, interactive dashboards
- **License:** ASEAN open data
- **Update frequency:** Annual for Key Figures; periodic for specialized datasets
- **Relevance to Yala dashboard:** Medium - provides regional economic context for Thailand and border trade dynamics with Malaysia. No subnational data.

---

### Climate & Disaster Data Sources

#### 6. World Bank Climate Change Knowledge Portal
- **URL:** https://climateknowledgeportal.worldbank.org [^7^]
- **Thailand Country Profile PDF:** Available for download [^7^]
- **Data available:** Historical climate observations (temperature, precipitation), CMIP5/CMIP6 climate projections (2020-2099) under RCP 2.6, 4.5, 8.5, extreme event projections (heatwaves, droughts, floods), sectoral climate impacts (agriculture, water, health, energy).
- **Key findings for Thailand:** Warming trends of 1.0-3.8°C by 2080-2099; strongest warming in southern Thailand; projected increase in wet season rainfall; increased flood risk (2 million+ additional people affected by 2035-2044) [^7^].
- **Geographic coverage:** Thailand national; no subnational/provincial projections
- **Access method:** Interactive web portal, data download, country profiles
- **License:** Free and open
- **Update frequency:** Periodic (updated with new IPCC assessment cycles)
- **Relevance to Yala dashboard:** High for understanding climate risks affecting Yala. Floods identified as greatest natural hazard for Thailand. Southern provinces face compound climate-security risks.

#### 7. CHIRPS Precipitation Data (Climate Hazards Center, UCSB)
- **URL:** https://www.chc.ucsb.edu/data/chirps [^8^]
- **Download:** https://data.chc.ucsb.edu/products/CHIRPS-2.0/ [^8^]
- **Google Earth Engine:** `UCSB-CHG/CHIRPS/DAILY` and `UCSB-CHG/CHIRPS/PENTAD` [^8^]
- **API Client (R):** `ropensci/chirps` package [^8^]
- **Data available:** Daily and pentad (5-day) precipitation data at 0.05° resolution (~5.5km), 1981 to near-present (45-day lag). Combines satellite infrared imagery with in-situ station data. CHIRPS-GEFS provides 10-day forecasts.
- **Geographic coverage:** Global (50°S-50°N); fully covers Thailand and Yala Province
- **Access method:** Direct download (GeoTIFF), Google Earth Engine API, R/Python API clients, Climate Engine web interface
- **License:** Public domain (CC0) [^8^]
- **Update frequency:** Daily (with ~45 day lag for final)
- **Relevance to Yala dashboard:** **Very High** - Primary data source for flood risk assessment, rainfall trend analysis, and drought monitoring in Yala. WFP provides CHIRPS-derived dekadal rainfall indicators aggregated to subnational administrative units on HDX [^9^].

#### 8. GloFAS (Global Flood Awareness System) - Copernicus EMS
- **URL:** https://www.globalfloods.eu/ [^12^]
- **Copernicus EMS:** https://data.jrc.ec.europa.eu/collection/id-0069 [^12^]
- **Data available:** Global river discharge forecasts (daily, up to 30 days ahead), probabilistic flood forecasts, historical river discharge data (archive from 1997), flood hazard maps, threshold exceedance alerts.
- **Geographic coverage:** Global; includes all river systems in Thailand
- **Access method:** GloFAS web viewer (registration required), FTP service (on request), NetCDF format, Copernicus Climate Data Store API
- **License:** Free (Copernicus open data); registration required
- **Update frequency:** Daily (forecasts); monthly (historical consolidation)
- **Relevance to Yala dashboard:** High for real-time flood monitoring and early warning. GloFAS provides river discharge data for major rivers near Yala. Spatial resolution is 0.1° (~11km), which may limit local municipal-scale analysis.

#### 9. Dartmouth Flood Observatory (DFO)
- **URL:** https://floodobservatory.colorado.edu/ [^21^]
- **Data available:** Global flood events database (1985-present), near-real-time MODIS/VIIRS satellite-derived flood inundation mapping, satellite river discharge measurements, 3-day water extent products (MODIS and VIIRS).
- **Geographic coverage:** Global; historical flood events recorded for Thailand
- **Access method:** Web-based flood portal, WMS services, downloadable shapefiles/GeoTIFFs
- **License:** Free and open
- **Update frequency:** Daily (near-real-time); annual (historical database updates)
- **Relevance to Yala dashboard:** Medium - provides historical flood event context for the Thailand-Malaysia border region and near-real-time flood monitoring capabilities.

#### 10. Global Forest Watch (WRI)
- **URL:** https://www.globalforestwatch.org/ [^10^]
- **Data API:** https://data-api.globalforestwatch.org/ [^10^]
- **Data available:** 
  - Hansen/UMD Global Forest Change: 30m resolution tree cover loss (2000-2024), tree cover gain, annual loss year
  - VIIRS and MODIS active fire detections (near-real-time)
  - GLAD alerts (weekly forest loss alerts at 30m)
  - Above-ground biomass/carbon stocks
  - Protected areas, indigenous territories, concessions
- **Geographic coverage:** Global; Thailand-specific dashboards available at province/district level
- **Access method:** Interactive web dashboard, REST API (JSON/GeoJSON), bulk download, Google Earth Engine integration
- **License:** CC BY 4.0 (most datasets)
- **Update frequency:** Annual (tree cover loss); weekly (GLAD alerts); daily (active fires)
- **Relevance to Yala dashboard:** **Very High** - Yala Province contains significant forest cover. GFW provides deforestation trends, fire alerts (critical during dry season), and forest carbon stock estimates. The API allows querying by custom geometry (e.g., Yala municipal boundary).

#### 11. OpenAQ (Open Air Quality)
- **URL:** https://openaq.org/ [^15^]
- **API Docs:** https://docs.openaq.org/ [^15^]
- **Data available:** PM2.5, PM10, SO2, NO2, CO, O3, BC, temperature, relative humidity from monitoring stations worldwide. Aggregates data from reference monitors and low-cost sensors.
- **Geographic coverage:** Global; includes Thailand monitoring stations (77 official stations across 46 provinces per PCD, plus low-cost sensors)
- **Access method:** Open REST API v3, bulk download, interactive map
- **License:** Open data (public domain)
- **Update frequency:** Hourly (near-real-time), with ~7 million measurements ingested daily
- **Relevance to Yala dashboard:** Medium-High - provides air quality context for Yala region. Note: OpenAQ coverage in Southern Thailand is limited compared to Bangkok/Chiang Mai. The Pollution Control Department operates 77 stations across 46 provinces; Yala may have limited or no coverage in OpenAQ.

---

### Demographic & Social Data

#### 12. Meta / Facebook Data for Good - High Resolution Population Density Maps
- **URL (HDX):** https://data.humdata.org/dataset/thailand-high-resolution-population-density-maps-demographic-estimates [^13^]
- **Methodology:** https://ai.meta.com/ai-for-good/datasets/high-resolution-population-density-maps/ [^13^]
- **Data available:** 30m resolution population density maps for Thailand with demographic breakdowns (women, men, youth <18, children <5, women of reproductive age 15-49, elderly 60+). Based on satellite imagery analysis with CIESIN.
- **Geographic coverage:** Full coverage of Thailand including **Yala Province**
- **Access method:** GeoTIFF download via HDX, AWS Open Data Registry
- **License:** Open data (attribution required)
- **Update frequency:** Irregular (current version: 2019-2023 data)
- **Relevance to Yala dashboard:** **Very High** - 30m resolution population data enables precise population mapping within Yala municipality boundaries, critical for service planning, disaster response, and demographic analysis.

#### 13. WorldPop - Global Population Data
- **URL:** https://hub.worldpop.org/geodata/summary?id=6439 [^14^]
- **HDX:** https://data.humdata.org/organization/worldpop [^14^]
- **Google Earth Engine:** Available as community catalog [^14^]
- **Data available:** 100m (3 arc-second) resolution population estimates for Thailand: total population and age/sex disaggregation (2015-2030). Uses Random Forest-based dasymetric redistribution.
- **Geographic coverage:** Full coverage of Thailand including **Yala Province**
- **Access method:** GeoTIFF download, HDX, Google Earth Engine, STAC API
- **License:** CC BY 4.0 / Open Data
- **Update frequency:** Annual projections
- **Relevance to Yala dashboard:** **Very High** - Provides fine-scale population distribution data with demographic breakdowns. The 100m resolution and age/sex disaggregation support detailed municipal planning. Available for 2020 (current) and projections to 2030.

#### 14. NASA SEDAC Gridded Population of the World (GPWv4)
- **URL:** https://sedac.ciesin.columbia.edu/data/collection/gpw-v4 [^18^]
- **GHG Center API:** https://earth.gov/ghgcenter/api/stac [^18^]
- **Data available:** Population density estimates for 2000, 2005, 2010, 2015, 2020 at 30 arc-second (~1km) resolution. Based on national census data with proportional allocation gridding.
- **Geographic coverage:** Global; includes all of Thailand
- **Access method:** Direct download (NetCDF/GeoTIFF), STAC API, US GHG Center API
- **License:** NASA open data
- **Update frequency:** Every 5 years
- **Relevance to Yala dashboard:** Medium - coarser resolution (1km) than WorldPop/Meta but provides longer time series for population change analysis.

#### 15. OpenStreetMap / HOTOSM
- **URL:** https://www.openstreetmap.org/relation/2067731 [^19^]
- **HOT Export Tool:** https://export.hotosm.org/ [^19^]
- **Data available:** Crowdsourced geospatial data including roads, buildings, waterways, land use, points of interest, administrative boundaries. Quality varies by area.
- **Geographic coverage:** Full coverage of Thailand; building/road density varies by area
- **Access method:** HOT Export Tool (custom extracts), Overpass API, bulk downloads from Geofabrik, QGIS plugin
- **License:** ODbL (Open Database License)
- **Update frequency:** Continuous (crowdsourced)
- **Relevance to Yala dashboard:** **High** - Provides detailed road networks, building footprints, and points of interest for Yala municipality. Data quality may be lower in Southern Border Provinces compared to Bangkok. HOTOSM has conducted mapping activities in Thailand for disaster response.

---

### Economic & Development Data

#### 16. IOM Displacement Tracking Matrix (DTM)
- **URL:** https://dtm.iom.int/ [^22^]
- **Data available:** Population Mobility Monitoring reports along Thailand's borders (Myanmar, Lao PDR, Cambodia borders). Includes Points of Entry mapping, flow monitoring, health screening capacity assessments. Currently focuses on Tak, Ranong, Nong Khai, Sa Kaeo, Chanthaburi - **not yet active in Yala/Malaysia border**.
- **Geographic coverage:** Border provinces; **Yala not currently covered**
- **Access method:** PDF reports, maps
- **License:** IOM open data
- **Update frequency:** Periodic (annual/seasonal)
- **Relevance to Yala dashboard:** Low-Medium - provides methodology reference for mobility monitoring but does not currently cover the Thailand-Malaysia border region. IOM has published scoping reports on migrant communities in Southern Border Provinces.

#### 17. UCDP (Uppsala Conflict Data Program)
- **URL:** https://ucdp.uu.se/ [^16^]
- **GED (Georeferenced Event Dataset):** https://ucdp.uu.se/downloads/ged/ [^16^]
- **Data available:** Georeferenced conflict event dataset at individual-event level, coded to village coordinates. Covers state-based conflict, non-state conflict, and one-sided violence. For Southern Thailand: 2001-present conflict in Pattani, Yala, Narathiwat, and Songkhla provinces. Includes date, location (lat/lon), fatalities, actors, conflict type.
- **Geographic coverage:** Global; **event-level data available for Yala Province**
- **Access method:** Bulk download (CSV, shapefile), web database search, API
- **License:** Free academic/open data (attribution required)
- **Update frequency:** Annual (with monthly pre-releases)
- **Relevance to Yala dashboard:** **Very High** - Provides the most detailed spatial dataset on conflict incidents in Yala at individual-event level with coordinates. Critical for understanding security geography in the municipality. UCDP data is the global standard for conflict research [^16^].

#### 18. ACLED (Armed Conflict Location & Event Data)
- **URL:** https://acleddata.com/
- **Data available:** Real-time data on political violence and protests across Thailand including Southern Border Provinces. Covers 2018-present with daily updates.
- **Geographic coverage:** Event-level data for all of Thailand including **Yala Province**
- **Access method:** Bulk download (via dashboard), API
- **License:** Free for non-commercial use; subscription for commercial use
- **Update frequency:** Weekly (real-time data collection)
- **Relevance to Yala dashboard:** **High** - Real-time conflict event tracking for Yala with detailed actor and event type classification.

#### 19. AidData / Development Gateway
- **URL:** https://www.aiddata.org/
- **Data available:** Global development finance tracking including donor projects in Thailand. Geocoded aid projects with location data.
- **Geographic coverage:** National to subnational (geocoded project locations)
- **Access method:** Bulk download, API, interactive map
- **License:** Open data
- **Update frequency:** Periodic
- **Relevance to Yala dashboard:** Medium - provides context on development funding flows to Southern Thailand provinces. May not have specific Yala-municipal level data.

---

### Satellite & Remote Sensing Data

#### 20. Copernicus Data Space Ecosystem (ESA)
- **URL:** https://dataspace.copernicus.eu/ [^11^]
- **Documentation:** https://documentation.dataspace.copernicus.eu/ [^11^]
- **Data available:**
  - Sentinel-1: C-band SAR (radar) - all-weather imaging
  - Sentinel-2: Multispectral optical (10m resolution) - vegetation, land cover, water quality
  - Sentinel-3: Ocean and land surface monitoring
  - Sentinel-5P: Atmospheric composition (air quality, greenhouse gases)
  - Copernicus DEM: Digital elevation model
  - Copernicus Global Land Cover (WorldCover)
- **Geographic coverage:** Full coverage of Thailand; archives from 2014 (Sentinel-1) and 2015 (Sentinel-2) to present
- **Access method:** Copernicus Browser (interactive), OData API, STAC API, S3 API, Sentinel Hub API, openEO, JupyterLab
- **License:** Free and open (Copernicus data policy)
- **Update frequency:** Sentinel-2: 5-day revisit at equator; Sentinel-1: 6-day repeat
- **Relevance to Yala dashboard:** **Very High** - Primary source for satellite imagery of Yala. Use cases: land cover/land use mapping, vegetation monitoring (NDVI), urban expansion tracking, flood inundation mapping (radar), air quality monitoring. Cloud computing capabilities allow processing without downloading.

#### 21. Sentinel Hub
- **URL:** https://www.sentinel-hub.com/ [^11^]
- **Data available:** Streamlined access to Sentinel, Landsat, and other satellite imagery via API. Pre-configured EO products, multi-temporal processing, custom scripting.
- **Geographic coverage:** Global; full Thailand coverage
- **Access method:** WMS/WFS/WCS services, REST API, QGIS plugin. Free trial available; paid plans for extensive use.
- **License:** Commercial service (with free tier)
- **Update frequency:** Near-real-time (within hours of satellite acquisition)
- **Relevance to Yala dashboard:** High - provides easiest API access to Sentinel data for dashboard integration. Suitable for time-series analysis and change detection.

#### 22. Google Earth Engine (GEE)
- **URL:** https://earthengine.google.com/
- **Data Catalog:** https://developers.google.com/earth-engine/datasets/
- **Data available:** Multi-petabyte catalog of satellite imagery and geospatial datasets including:
  - CHIRPS daily rainfall [^8^]
  - MODIS vegetation indices (NDVI/EVI, 250m, 2000-present)
  - Landsat (30m, 1984-present)
  - Sentinel-1 and Sentinel-2
  - WorldPop population data [^14^]
  - Hansen Global Forest Change [^10^]
  - SRTM/NASADEM elevation data
  - Nighttime lights (VIIRS DNB)
- **Geographic coverage:** Full coverage of Thailand
- **Access method:** Cloud-based API (JavaScript/Python); free for research/non-profit use
- **License:** Free for non-commercial use; commercial licensing available
- **Update frequency:** Continuous (datasets updated as new imagery available)
- **Relevance to Yala dashboard:** **Very High** - Single platform integrating multiple data sources. Enables complex spatial analysis (zonal statistics, time-series, change detection) without local computing infrastructure. Ideal for processing satellite data for Yala municipality boundaries.

---

### Trends & Signals

- **Data gap for municipal-level indicators:** Most international databases provide Thailand national-level data only. The UNDP SDG Profiles represent a significant advancement by providing **provincial-level** SDG data for Yala, Pattani, and Narathiwat [^3^]. However, **municipal (thesaban)-level data is largely absent** from international sources.

- **Climate-security nexus in Southern Border Provinces:** The World Bank Climate Change Knowledge Portal identifies southern Thailand as facing compound risks from climate change (flooding, temperature rise) and ongoing conflict [^7^]. This intersection is critical for Yala's municipal planning but is poorly captured by single-domain datasets.

- **High-resolution population data availability:** Meta Data for Good (30m) [^13^] and WorldPop (100m with age/sex) [^14^] provide unprecedented detail for population distribution mapping in Yala, enabling detailed service planning and vulnerability assessment at sub-municipal scale.

- **Emerging open data ecosystem:** The combination of HDX [^17^], Copernicus Data Space [^11^], and Google Earth Engine creates a powerful open data ecosystem where administrative boundaries, population data, satellite imagery, and climate data can be integrated for comprehensive municipal analysis without proprietary software.

- **Forest monitoring capabilities:** Global Forest Watch's 30m resolution tree cover loss data [^10^] reveals deforestation trends in Yala that are critical for environmental management. GLAD alerts provide near-real-time forest loss detection, enabling rapid response to illegal logging or fire events.

- **Conflict data at event level:** UCDP's Georeferenced Event Dataset [^16^] provides the most granular conflict data available for Southern Thailand, with individual events coded to village-level coordinates. This enables precise spatial analysis of conflict patterns within and around Yala municipality.

---

### Limitations

- **Subnational data scarcity:** The vast majority of international data platforms (World Bank WDI, UN ESCAP, ASEANstats) provide Thailand national-level data only. Provincial-level data is rare; municipal-level data is virtually non-existent. The UNDP SDG Profiles are a notable exception but are available for only 15 pilot provinces [^3^].

- **Yala-specific data gaps:** No international database provides data specifically for Yala City Municipality (thesaban). All subnational analysis requires aggregation or extraction from gridded datasets (CHIRPS, WorldPop, Meta HRPD) using municipal boundary files.

- **Temporal mismatch:** Many international datasets have significant time lags. WorldPop projections to 2030 are model-based [^14^]; CHIRPS data has a ~45 day lag for final products [^8^]. Real-time municipal indicators are not available from international sources.

- **Air quality station coverage:** OpenAQ and other air quality platforms have limited coverage in Southern Thailand. The Pollution Control Department operates 77 stations across 46 provinces [^15^], but Yala Province may not have continuous monitoring station data available through international APIs.

- **Data integration challenges:** Different datasets use different administrative boundary vintages, coordinate systems, and resolution levels, requiring significant preprocessing for integration into a unified municipal dashboard.

- **Conflict data sensitivity:** While UCDP and ACLED provide conflict event data, local interpretation requires contextual knowledge. Events may be underreported in certain areas due to access restrictions for journalists and researchers.

- **License restrictions:** While most sources are open data, some (ACLED for commercial use, Sentinel Hub for extensive use) have license restrictions that must be reviewed for dashboard deployment.

---

### Recommended Deep-Dive Areas

1. **UNDP SDG Profile for Yala Province:** The Yala-specific SDG Profile [^3^] contains detailed baseline data across all SDGs with provincial-level indicators. This should be extracted and digitized into structured format for the municipal dashboard. Key indicators include poverty rates, health metrics, education outcomes, infrastructure access, and disaster vulnerability.

2. **CHIRPS + GloFAS Integration for Flood Risk:** Combining CHIRPS historical rainfall [^8^] with GloFAS river discharge data [^12^] would enable comprehensive flood risk assessment for Yala municipality. Google Earth Engine can be used to compute rainfall statistics within municipal boundaries.

3. **Global Forest Watch for Environmental Monitoring:** The GFW API [^10^] should be integrated for real-time forest fire alerts and deforestation monitoring in Yala Province's forested areas. Critical for disaster risk management during the dry season (February-April).

4. **Copernicus Sentinel-2 for Land Use Mapping:** Sentinel-2's 10m multispectral data [^11^] can be used to create detailed land cover/land use maps for Yala municipality through supervised classification. Available free via Google Earth Engine or Copernicus Data Space.

5. **UCDP + ACLED Conflict Data Integration:** Combining UCDP's historical conflict data [^16^] with ACLED's real-time events would provide comprehensive security incident mapping for Yala. Event-level data should be aggregated to municipal-level indicators (incidents per year, fatalities, event types).

6. **Meta HRPD + WorldPop Population Baseline:** The 30m Meta population data [^13^] and 100m WorldPop age/sex data [^14^] should be combined to create a detailed demographic baseline for Yala municipality, including population distribution, age structure, and gender breakdowns at sub-municipal scale.

---

### Source List

[^1^] UN ESCAP Asia-Pacific SDG Gateway - https://data.unescap.org/

[^2^] ESCAP Asia-Pacific SDG Progress Report 2025 - https://www.unescap.org/our-work/statistics/sdg

[^3^] UNDP Thailand SDG Profiles - 15 Pilot Provinces - https://www.undp.org/thailand/publications/sdg-profiles-15-pilot-provinces-thailand

[^4^] UNDP SDG Profile - Narathiwat - https://www.undp.org/publications/SDG-profile-narathiwat

[^5^] World Bank Open Data API Documentation - https://datahelpdesk.worldbank.org/knowledgebase/articles/889392-about-the-indicators-api-documentation

[^6^] World Bank Subnational Population Database - https://datahelpdesk.worldbank.org/knowledgebase/articles/843492-what-is-the-subnational-population-database

[^7^] World Bank Climate Change Knowledge Portal - Thailand Profile PDF - https://climateknowledgeportal.worldbank.org/sites/default/files/country-profiles/15853-WB_Thailand%20Country%20Profile-WEB_0.pdf

[^8^] CHIRPS Data - Climate Hazards Center, UCSB - https://www.chc.ucsb.edu/data/chirps

[^9^] WFP CHIRPS Rainfall Indicators at Subnational Level - Thailand (HDX) - https://data.humdata.org/dataset/?q=second+administrative+level&sort=score+desc%2C+metadata_modified+desc&ext_page_size=25&groups=tha

[^10^] Global Forest Watch Data API - https://data-api.globalforestwatch.org/

[^11^] Copernicus Data Space Ecosystem - https://dataspace.copernicus.eu/

[^12^] GloFAS - JRC Data Catalogue - https://data.jrc.ec.europa.eu/collection/id-0069

[^13^] Meta Data for Good - Thailand HRPD (HDX) - https://data.humdata.org/dataset/thailand-high-resolution-population-density-maps-demographic-estimates

[^14^] WorldPop Thailand 100m Population - https://hub.worldpop.org/geodata/summary?id=6439

[^15^] OpenAQ API Documentation - https://docs.openaq.org/

[^16^] UCDP Georeferenced Event Dataset - https://ucdp.uu.se/downloads/ged/ged261.pdf

[^17^] HDX Thailand Datasets - https://data.humdata.org/group/tha

[^18^] NASA SEDAC GPWv4 Population Density - https://www.earthdata.nasa.gov/data/catalog/sedac-ciesin-sedac-gpwv4-popdens-r11-4.11

[^19^] HOT Export Tool - https://export.hotosm.org/

[^20^] ASEAN Statistics Data Portal - https://data.aseanstats.org/

[^21^] Dartmouth Flood Observatory - https://floodobservatory.colorado.edu/

[^22^] IOM Displacement Tracking Matrix - https://dtm.iom.int/

[^23^] World Bank DataBank - https://databank.worldbank.org/Asean-countries-/id/964566cf

[^24^] UNDP HDRO on HDX - https://data.humdata.org/organization/undp-human-development-reports-office

[^25^] Global Forest Change 2000-2024 Data Download - https://storage.googleapis.com/earthenginepartners-hansen/GFC-2024-v1.12/download.html

[^26^] Sentinel Hub - https://www.sentinel-hub.com/

[^27^] UCDP - Uppsala Conflict Data Program - https://www.uu.se/en/websites/ucdp---uppsala-conflict-data-program

[^28^] Meta AI for Good - Population Density Methodology - https://ai.meta.com/ai-for-good/datasets/high-resolution-population-density-maps/

[^29^] WorldPop Global Population Data on GEE - https://gee-community-catalog.org/projects/worldpop/

[^30^] NIDA - UNDP SDG Profiles Project Launch - https://nida.ac.th/nida-undp-tdri-launched-the-sdg-profiles-project/
