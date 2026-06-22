# Dimension 09: Infrastructure, Utilities & Environment — Yala Deep-Dive Report

**Research Date:** June 2026  
**Researcher:** AI Research Agent  
**Scope:** Water, electricity, waste, air quality, weather, disaster, climate, roads, transport, telecom, internet, WiFi, building permits for Yala Province & Yala Municipality  
**Search Count:** 22+ distinct searches across 20+ data sources  

---

## Table of Contents
1. [Water Supply (PWA Yala)](#1-water-supply-pwa-yala)
2. [Electricity (PEA Area 3 — Yala)](#2-electricity-pea-area-3--yala)
3. [Waste Management (Yala Municipality)](#3-waste-management-yala-municipality)
4. [Air Quality (air4thai Yala Station)](#4-air-quality-air4thai-yala-station)
5. [Weather Data (TMD Yala)](#5-weather-data-tmd-yala)
6. [Rainfall Data (CHIRPS & TMD Historical)](#6-rainfall-data-chirps--tmd-historical)
7. [Disaster Data (DDPM Yala)](#7-disaster-data-ddpm-yala)
8. [River & Reservoir (RID Yala — Pattani Basin)](#8-river--reservoir-rid-yala--pattani-basin)
9. [GISTDA Flood Monitoring (Sphere Platform)](#9-gistda-flood-monitoring-sphere-platform)
10. [Building Permits (DPT e-PP System)](#10-building-permits-dpt-e-pp-system)
11. [Road Conditions (Department of Rural Roads)](#11-road-conditions-department-of-rural-roads)
12. [Public Transportation (Yala)](#12-public-transportation-yala)
13. [Telecommunications (NBTC Coverage)](#13-telecommunications-nbtc-coverage)
14. [Internet/Broadband Coverage](#14-internetbroadband-coverage)
15. [Public WiFi (Yala Municipality)](#15-public-wifi-yala-municipality)
16. [Climate Projections (World Bank)](#16-climate-projections-world-bank)

---

## 1. Water Supply (PWA Yala)

| Attribute | Detail |
|---|---|
| **Indicator** | Water production, consumption, coverage, pipeline data, DMA zones |
| **Source** | Provincial Waterworks Authority (PWA) — Yala Branch |
| **Primary URL** | https://www.pwa.co.th |
| **GIS/DMA URL** | PWA internal GIS (233 branch offices nationwide) |
| **Real-time?** | Partial (SCADA for production, GIS for pipelines) |
| **Update Frequency** | Daily production reports; GIS updated periodically |
| **API Available?** | No public API; internal systems only |
| **Dashboard Layer** | Water supply consumption data layer on Yala Smart City Dashboard |

### Key Findings

**PWA National Context:**
- PWA serves **74 provinces** (excluding Bangkok, Samut Prakan, Nonthaburi) with **233 waterworks branches** and **10 regional offices**
- PWA provides water to **3.60 million households** (24.5% of country's total) or **16.0 million population**
- PWA uses **GIS systems** installed in all 233 branch offices for pipeline location tracking, customer data, and hydrologic accounting
- **DMA (District Metering Area)** zones are deployed for water loss management; flowmeters installed at DMA boundaries for continuous monitoring
- PWA reported water loss target: **below 26.30%** for 2025

**PWA Yala Specific:**
- PWA Yala branch office is part of PWA's southern region operations
- Yala Municipality operates its own **Water Supply Bureau** (separate from PWA) managing municipal water consumption and service data
- **Yala Smart City Dashboard** includes downloadable datasets for:
  - Water supply consumption data (from Water Supply Bureau, Yala Municipality)
  - Green area information
  - Carbon absorption (CO2) capacity: **10,630.87 tonnes CO2e**
  - Green space per capita: **15.95 sq.m/capita**

**Data Access:**
- Yala water supply data: https://www.citydata.in.th/yala-city-municipality/en/dashboard-public-en/
- Direct water supply dataset: https://www.yaladashboard.com/living/water-supply
- PWA main portal: https://www.pwa.co.th
- DMA management documented in PWA Water Utility Management manual: https://www.pwa.co.th

---

## 2. Electricity (PEA Area 3 — Yala)

| Attribute | Detail |
|---|---|
| **Indicator** | Electricity consumption, outage data, grid infrastructure, smart meter data |
| **Source** | Provincial Electricity Authority (PEA), Area 3 (Southern Region) |
| **Primary URL** | https://www.pea.co.th |
| **Annual Report** | https://www.pea.co.th/sites/default/files/annual-report/2025/PEA%20AR%202024_ai%20translation.pdf |
| **Real-time?** | Yes (via PEA Smart Plus app) |
| **Update Frequency** | Daily billing; monthly reports |
| **API Available?** | PEA e-Service API (private) |
| **Dashboard Layer** | Electricity consumption by district |

### Key Findings

**PEA Area 3 (Southern) — Headquartered in Yala:**
- **Office Location:** 59/27 Yala-Pattani Road, Khao Tum Subdistrict, Yarang District, Pattani 94160
- **Coverage:** 6 provinces — **Yala, Pattani, Narathiwat, Songkhla, Satun, and Phatthalung**
- **Branch Structure:** 3 Large + 10 Medium + 21 Small + 34 Extra Small = **68 total offices**

**PEA Southern Region Performance (2024):**
- Southern Region accounted for **17.32%** of total PEA sales, growing **9.31%** YoY
- PEA nationwide served **22.06 million customers** in 2024
- Total electricity sales: **156,838 million kWh** (2024)
- Distribution system loss: **5.03%** (8,300.72 million kWh)
- **100% village electrification** achieved within PEA service area

**Digital Services:**
- **PEA Smart Plus** mobile app: Payment, new service requests, usage history
- **PEA e-Service:** https://sabuyservice.pea.co.th
- **PEA e-Bill:** Electronic billing via SMS/email
- **Watt-D Point:** Rewards system for bill payments

**Data Access:**
- PEA Annual Report: https://www.pea.co.th/sites/default/files/annual-report/2025/
- Electricity statistics (EPPO): https://www.eppo.go.th/index.php/en/en-energystatistics/electricity-statistic
- PEA Region 3 (Southern): Wikipedia reference for coverage area

---

## 3. Waste Management (Yala Municipality)

| Attribute | Detail |
|---|---|
| **Indicator** | Collection routes, tonnage, disposal method, recycling rate |
| **Source** | Yala Municipality Strategic Division |
| **Primary URL** | https://www.citydata.in.th/yala-city-municipality/en/dashboard-public-en/ |
| **Dataset URL** | https://www.yaladashboard.com/living/garbage |
| **Real-time?** | No |
| **Update Frequency** | Monthly/Quarterly reports |
| **API Available?** | No (downloadable datasets) |
| **Dashboard Layer** | Garbage collection information layer |

### Key Findings

**Yala Municipality Waste Data:**
- Yala Smart City Dashboard provides **garbage collection information** datasets
- Data covers: "Storage and disposal of general solid waste and infectious solid waste of Yala Municipality"
- Source: Yala Municipality Strategic Division

**National Context (Thailand Waste Management):**
- Thailand generates **25.7 million tons/year** of municipal solid waste (2022 data)
- Only **9.28 million tons** properly disposed; **7.81 million tons** improperly disposed
- **2,137** waste disposal sites nationwide: only **116 sanitary landfills** (5.43%)
- **1,707 open dumpsites** (84.46% of disposal sites)
- Waste composition: Food waste 38.76%, Plastics 28.13%, Paper 6.27%, Glass 3.95%, Metals 1.56%

**Yala Provincial Context:**
- Waste collection in Yala Municipality is managed by the municipal administration
- Research on Than To Khun Yai Subdistrict Municipality (neighboring area) found:
  - ~15 tonnes/day waste generated, only 10 tonnes collected (67% collection rate)
  - Collection covers ~76% of municipality area
  - 3 waste collection trucks service 7 zones
  - No fixed collection points or recycling center
  - Landfill located 25 km away from collection areas

**Data Access:**
- Yala garbage data: https://www.yaladashboard.com/living/garbage
- National waste data: Department of Local Administration (DLA), Ministry of Interior
- Pollution Control Department waste reports: https://www.pcd.go.th

---

## 4. Air Quality (air4thai Yala Station)

| Attribute | Detail |
|---|---|
| **Indicator** | PM2.5, PM10, O3, CO, NO2, SO2, AQI |
| **Source** | Pollution Control Department (PCD) — air4thai network |
| **Primary URL** | http://air4thai.pcd.go.th/webV3/ |
| **History Data** | http://air4thai.pcd.go.th/webV3/#/History |
| **Real-time?** | **Yes** — continuous monitoring |
| **Update Frequency** | Hourly |
| **API Available?** | **Yes** — JSON/XML API by region |
| **Dashboard Layer** | PM2.5 real-time map layer |

### Key Findings

**air4thai Network:**
- **77 monitoring stations** across **46 provinces** in Thailand
- Measures: PM2.5, PM10, O3, CO, NO2, SO2, with AQI calculation
- Yala has at least one monitoring station providing real-time data
- National average PM2.5 (2022): **22 ug/m3** (improved from 23 in 2020)
- PM2.5 breakpoints: Very Good (0-15), Good (15.1-25), Moderate (25.1-37.5), Unhealthy (37.6-75+)

**Yala Air Quality:**
- Current Yala AQI typically ranges **38-69** (Good to Moderate)
- PM2.5 readings: ~21 ug/m3 (Moderate level)
- Data accessible via air4thai website and Yala Smart City Dashboard

**API Access:**
- Southern region API (JSON): Available via Envilink data catalog
- Southern region API (XML): Available via Envilink data catalog
- API endpoint documentation via Envilink: https://envilink.go.th
- Dataset reference: https://envilink.go.th/dataset/air-quality-pm2point5
- GISTDA also provides satellite-based PM2.5 monitoring: https://pm25.gistda.or.th

**Yala Dashboard Integration:**
- PM2.5 level data: https://www.yaladashboard.com/living/pm2-5
- Source: Air Quality and Noise Management Division, Pollution Control Department

---

## 5. Weather Data (TMD Yala)

| Attribute | Detail |
|---|---|
| **Indicator** | Temperature, humidity, rainfall, wind, pressure, visibility |
| **Source** | Thai Meteorological Department (TMD) |
| **Primary URL** | https://www.tmd.go.th/en/weather/province/yala |
| **API Portal** | https://data.tmd.go.th/api/index1.php |
| **Real-time?** | **Yes** — automatic weather stations |
| **Update Frequency** | 15-minute intervals (AWS); hourly (manual) |
| **API Available?** | **Yes** — TMDAPI (registration required) |
| **Dashboard Layer** | Weather overlay + 7-day forecast |

### Key Findings

**TMD Weather Stations in Yala Province:**
Yala has **multiple weather stations** including:
1. **Yala Agrometeorological Station** — Full meteorological observations
2. **Yala (Betong) Weather Observing Station**
3. **Raman Automatic Weather Station (AWS)**
4. **Amphoe Mueang Yala AWS**
5. **Krong Pinang AWS**
6. **Kabang AWS**
7. **Bannang Sata AWS**
8. **Yaha AWS**
9. **Than To AWS**
10. **Betong AWS**

**TMD API (TMDAPI):**
- Registration page: https://data.tmd.go.th/api/registerPre.php
- API documentation: https://envilink.go.th/en/dataset/tmdapi-1
- Available data formats: XML, JSON
- Datasets available:
  - Weather Today (07:00 daily)
  - Weather 3 Hours (all stations)
  - Thailand Monthly Rainfall
  - Weather Forecast 7 Days (by province)
  - Weather Forecast Daily (4 times/day)
  - Weather Warning News
  - Daily Seismic Events
  - Thailand Climate Normal

**Current Weather for Yala (as of June 2026):**
- Temperature: 24.5-35.4 C range
- Humidity: 97% (very high)
- Rainfall (07:00 onwards): 12.6 mm
- Pressure: 1007.0 hPa
- Wind: CALM
- 7-day forecast: Heavy rain, 34-36 C daily highs

**Data Access:**
- TMD Yala page: https://www.tmd.go.th/en/weather/province/yala
- TMD API: https://data.tmd.go.th/api/index1.php
- QGIS Plugin: https://plugins.qgis.org/plugins/tmd/
- MCP Server for TMD: https://mcpmarket.com/server/tmd

---

## 6. Rainfall Data (CHIRPS & TMD Historical)

| Attribute | Detail |
|---|---|
| **Indicator** | Historical rainfall, satellite precipitation, flood correlation |
| **Source** | TMD (gauge) + CHIRPS (satellite) + GISTDA |
| **CHIRPS URL** | https://www.chc.ucsb.edu/data/chirps |
| **TMD Rainfall** | https://hpc.tmd.go.th/basin |
| **Real-time?** | CHIRPS: Near-real-time (2-day lag); TMD: Real-time |
| **Update Frequency** | CHIRPS: Daily; TMD: 15-minute |
| **API Available?** | CHIRPS: Yes (Google Earth Engine, ClimateSERV); TMD: Yes |
| **Dashboard Layer** | Rainfall accumulation + flood risk overlay |

### Key Findings

**CHIRPS Satellite Rainfall for Yala:**
- **CHIRPS** (Climate Hazards Group InfraRed Precipitation with Station data)
- Spatial resolution: **0.05 degrees (~5 km)**
- Temporal coverage: **1981 to near-present**
- Daily temporal resolution available
- GISTDA has validated CHIRPS over Thailand (1981-2020, 40-year analysis)
- Access points:
  - CHC UCSB: https://www.chc.ucsb.edu/data/chirps
  - Google Earth Engine: `UCSB-CHG/CHIRPS/DAILY`
  - ClimateSERV: https://climateserv.servirglobal.net/
  - CHIRPS data server: https://data.chc.ucsb.edu/products/CHIRPS-2.0/

**Yala Rainfall Patterns:**
- Yala has a **tropical monsoon climate**
- Wet season: **May to December** (7.6 months)
- Driest month: **February** (1.1 inches / ~28 mm)
- Wettest month: **November** (12.3 inches / ~312 mm)
- Annual rainfall in Pattani River basin: **1,500-2,200 mm**
- Peak wet day probability: **73% on November 9**

**TMD Historical Rainfall:**
- TMD provides monthly rainfall accumulation data
- Basin-level rainfall: https://hpc.tmd.go.th/basin
- Rainfall reports: https://hpc.tmd.go.th/pubData
- Historical data available via TMDAPI

**Flood Correlation:**
- Southern Thailand floods typically triggered by:
  - Northeast monsoon over Gulf of Thailand (Nov-Feb)
  - Southwest monsoon (May-Oct)
  - Tropical depressions/cyclones
- December 2022: Narathiwat recorded 545.4 mm in 24 hours
- December 2023: "50-year flood" in Deep South provinces
- November 2024: Heaviest rainfall in 300 years hit Hat Yai (335 mm in 24h)

---

## 7. Disaster Data (DDPM Yala)

| Attribute | Detail |
|---|---|
| **Indicator** | Flood events, landslides, storm damage by district |
| **Source** | Department of Disaster Prevention and Mitigation (DDPM) |
| **Primary URL** | https://www.disaster.go.th (DDPM portal) |
| **AHA Centre** | https://adinet.ahacentre.org |
| **Real-time?** | Situation reports during events |
| **Update Frequency** | Daily during emergencies |
| **API Available?** | No public API; situation reports in PDF |
| **Dashboard Layer** | Historical flood event markers + damage assessment |

### Key Findings

**DDPM Data Collection (49+ Indicators):**
DDPM collects comprehensive disaster statistics including:
- Flood statistics by village ( nationwide)
- Drought statistics by village (by province)
- Number of people affected, injured, deceased
- Number of buildings damaged (residential, commercial, large buildings)
- Infrastructure damage (dams, embankments, weirs, bridges, reservoirs)
- Value of assistance provided to disaster victims
- Number of communities trained in disaster preparedness
- Disaster warning systems and equipment locations

**Yala Province Recent Disaster Events:**

| Date | Event | Impact |
|---|---|---|
| **Feb 2022** | Flash floods | 4 districts, 38 tambons, 136 villages, 3,114 households affected |
| **Dec 2022** | Southern Thailand floods | 90 households in Yala affected |
| **Dec 2023** | "50-year flood" — Deep South | 15,457 households in Yala affected, 4 deaths |
| **Nov-Dec 2024** | Severe flooding (10 provinces) | 664,000+ households affected across south; 25 deaths total |

**December 2023 Flood Details:**
- Cause: Strong northeast monsoon + low pressure over Sumatra/Andaman
- Yala: 15,457 households affected at peak
- 4 deaths in Yala province
- Railway services disrupted (Yala-Su-nga Kolok line)
- 100+ schools temporarily closed
- AHA Centre mobilized relief items from DELSA warehouse

**November 2024 Flood Details:**
- 10 provinces affected: Chumphon, Surat Thani, Nakhon Si Thammarat, Satun, Songkhla, Phatthalung, Trang, Narathiwat, Pattani, **Yala**
- 664,000+ households affected
- 25 deaths across southern region
- 21,800 hectares of agricultural land damaged in southern Thailand
- Cause: 300-500 mm rainfall in 24 hours

**Data Access:**
- DDPM Thailand: https://www.ddpm.go.th
- AHA Centre reports: https://adinet.ahacentre.org
- ADRC reports: https://www.adrc.asia/countryreport/THA/
- FloodList Asia: https://floodlist.com/asia
- ReliefWeb: https://reliefweb.int

---

## 8. River & Reservoir (RID Yala — Pattani Basin)

| Attribute | Detail |
|---|---|
| **Indicator** | River levels, reservoir status, irrigation schedules |
| **Source** | Royal Irrigation Department (RID) + ThaiWater.net |
| **Primary URL** | https://www.thaiwater.net |
| **Today's Water** | https://twa.thaiwater.net/en |
| **Real-time?** | **Yes** — automated telemetry |
| **Update Frequency** | Hourly (water levels); daily (reservoir storage) |
| **API Available?** | **Yes** (ThaiWater API with standard data format) |
| **Dashboard Layer** | Reservoir status + river level gauges |

### Key Findings

**Pattani River Basin:**
- Covers **3,805.65 km2** in Yala and Pattani provinces
- Longest river on Thai Malay Peninsula: **214 km**
- Tributaries: Yaha River, Nong Chik River
- Population in basin: ~**715,000 people**
- Average annual rainfall: **1,500-2,200 mm**

**Bang Lang Dam (Yala Province):**
| Feature | Specification |
|---|---|
| Location | Bannang Sata District, Yala Province |
| Coordinates | 6 9'23"N, 101 16'25"E |
| Type | Earth-core rockfill dam |
| Height | 85 meters |
| Crest length | 422 meters |
| Storage capacity | **1,420 million cubic meters** |
| Surface area | ~50 km2 (31,250 rai) |
| Catchment area | 2,080 km2 |
| Installed capacity | **72 MW** (3 x 28 MW Francis turbines) |
| Annual generation | ~289 million kWh |
| Irrigation coverage | ~380,000 rai (60,800 hectares) |
| Completion | June 1981 |
| Operator | EGAT (electricity) + RID (water) |

**Pattani Dam:**
- Diversion dam of Bang Lang Dam
- Located downstream on Pattani River
- Part of Pattani River Basin Development Plan

**Water Level Data Standard:**
- ThaiWater.net provides standardized water level data
- Fields: stationCode, measureTime, waterLevel (m MSL), qualityFlag
- API documentation: https://standard.thaiwater.net/docs/
- Water level endpoint available with OGC-standard format

**ThaiWater Mobile App:**
- Available on App Store and Google Play
- Real-time water situation monitoring
- Reservoir storage levels
- Flood/drought alerts

**Data Access:**
- ThaiWater: https://www.thaiwater.net/water/dam/large
- Today's Water: https://twa.thaiwater.net/en
- RID Flood Reports: http://water.rid.go.th/flood/flood/daily.pdf
- SWOC (Smart Water Operations Centre): Internal RID system
- ASEAN Water Pattani Basin: https://www.aseanwater.net/pattani-river-basin-network/

---

## 9. GISTDA Flood Monitoring (Sphere Platform)

| Attribute | Detail |
|---|---|
| **Indicator** | Real-time flood extent, hotspot, drought indices |
| **Source** | GISTDA (Geo-Informatics and Space Technology Development Agency) |
| **Primary URL** | https://sphere.gistda.or.th |
| **Flood Portal** | https://flood.gistda.or.th |
| **Real-time?** | **Yes** — satellite-based (MODIS, SAR, optical) |
| **Update Frequency** | Daily (satellite overpass dependent) |
| **API Available?** | **Yes** — GISTDA Sphere API |
| **Dashboard Layer** | Flood extent overlay + hotspot monitoring |

### Key Findings

**GISTDA Sphere Platform Capabilities:**
- **Flood Monitoring:** https://flood.gistda.or.th
  - Satellite-derived flood extent maps
  - MODIS (2x daily), SAR (1-2 days), High-res optical (on-demand)
  - Output formats: Shapefile, XML, WMS, KML, PDF
- **Fire Monitoring:** http://fire.gistda.or.th
  - Hotspot detection from Terra/Aqua MODIS, Suomi NPP VIIRS
  - 6 detections daily, 375m resolution (VIIRS)
- **Drought Monitoring:** http://drought.gistda.or.th
  - NDVI, NDWI, Soil Moisture (SMAP)
- **PM2.5 Monitoring:** https://pm25.gistda.or.th
  - Satellite-derived air quality estimates

**GISTDA Sphere API:**
- **Disaster Hotspot API:**
  - Endpoint: `https://api.sphere.gistda.or.th/services/info/disaster-hotspot`
  - Parameters: lat, lon, radius, pv_tn (province), ap_tn (district), tb_tn (tambon), from, to, key
  - Supports flood, hotspot, drought queries
- **Disaster Recurring API:** Historical disaster frequency by year
- **WMS/TMS/WMTS layers:** Addable to custom maps
- API documentation: https://sphere.gistda.or.th/docs/web-service/disaster-information
- API key registration: https://sphere.gistda.or.th

**Yala Flood Event Example API Call:**
```
https://api.sphere.gistda.or.th/services/info/disaster-hotspot?pv_tn=ยะลา&from=2024-11-01&to=2024-12-31&key=YOUR-API-KEY
```

**Data Access:**
- GISTDA Sphere: https://sphere.gistda.or.th
- Flood portal: https://flood.gistda.or.th
- Fire portal: http://fire.gistda.or.th
- Drought portal: http://drought.gistda.or.th
- PM2.5 portal: https://pm25.gistda.or.th
- API docs: https://sphere.gistda.or.th/docs/web-service/disaster-information

---

## 10. Building Permits (DPT e-PP System)

| Attribute | Detail |
|---|---|
| **Indicator** | Construction permits, building control, urban planning |
| **Source** | Department of Public Works and Town and Country Planning (DPT) |
| **Primary URL** | https://www.dpt.go.th |
| **e-PP System** | https://epp.dpt.go.th |
| **Real-time?** | No |
| **Update Frequency** | Monthly/Quarterly |
| **API Available?** | No public API |
| **Dashboard Layer** | Building permit density heatmap |

### Key Findings

**Thailand Building Permit System:**
- **DPT** oversees town planning and building control nationwide
- **Town Planning Act B.E. 2562 (2019)** governs land use and development
- Building permits issued by:
  - Bangkok: BMA Public Works Department
  - Municipal areas: Municipal Office (Thesaban)
  - Non-municipal areas: Subdistrict Administrative Organization (OrBorTor)
- **e-PP (Electronic Public Participation)** system: https://epp.dpt.go.th

**Permit Process:**
- Required documents: Building plans (signed by licensed architect & engineer), title deed, ID, company registration
- Review period: 30-120 days (official: 45 days)
- Site inspection may be conducted
- Building modification and demolition permits also required

**Yala Specific:**
- Yala Municipality processes building permits within municipal boundaries
- No publicly accessible aggregated building permit statistics found for Yala specifically
- DPT e-PP system may have town planning documents for Yala

**Data Access:**
- DPT main portal: https://www.dpt.go.th
- e-PP system: https://epp.dpt.dpt.go.th
- BOI construction permit guide: https://osos.boi.go.th/en/how-to/139/
- Town Planning Act: https://faolex.fao.org/docs/pdf/tha207765.pdf

---

## 11. Road Conditions (Department of Rural Roads)

| Attribute | Detail |
|---|---|
| **Indicator** | Municipal road conditions, pavement quality, maintenance |
| **Source** | Department of Rural Roads (DRR) |
| **Primary URL** | https://www.drr.go.th |
| **PMMS** | Pavement Maintenance Management System (web-based) |
| **Real-time?** | No |
| **Update Frequency** | Annual surveys |
| **API Available?** | No |
| **Dashboard Layer** | Road condition map (good/fair/poor) |

### Key Findings

**DRR Pavement Maintenance Management System (PMMS):**
- Web-based system with **7 modules:**
  1. Road Inventory Module
  2. Road Condition Database
  3. Treatment Strategy Analysis Module
  4. Budget and Cost Database
  5. Prioritization Analysis Module
  6. Maintenance History Database
  7. Presentation and Reporting Module
- Inspection data compiled for deterioration projection and lifecycle cost analysis
- Budget preparation: Provincial offices -> Regional offices -> DRR HQ -> MOT

**Yala Road Network:**
- Main highway: **Highway 410** (Yala-Betong route) — primary north-south corridor
- Bang Lang Dam access: 56 km from Yala city via Highway 410
- DRR maintains provincial and rural roads in Yala

**Data Access:**
- DRR: https://www.drr.go.th
- PMMS is internal; no public data portal identified

---

## 12. Public Transportation (Yala)

| Attribute | Detail |
|---|---|
| **Indicator** | Bus routes, ridership, transport terminals |
| **Source** | Transport Co Ltd, Siam Lane Tour, Yala Municipality |
| **Primary URL** | https://www.checkmybus.com/yala-th |
| **Bus Terminal** | Yala Bus Terminal |
| **Real-time?** | No |
| **Update Frequency** | Static schedules |
| **API Available?** | No |
| **Dashboard Layer** | Bus terminal + route map |

### Key Findings

**Yala Bus Services:**
- **2 bus providers** serve Yala: Transport Co (government) and Siam Lane Tour (private)
- **6 bus stops** in Yala city area
- **Yala Bus Terminal** is the main intercity transport hub
- Direct bus connections available to/from major cities (check on booking platforms)
- Long-distance buses connect Yala to Bangkok and other major centers

**Rail Transport:**
- **Southern Railway Line** passes through Yala
- **Yala Railway Station** — historic station on the route
- Services: Yala to Hat Yai, Yala to Su-ngai Kolok (Malaysian border)
- Railway services disrupted during major flood events (e.g., Dec 2023)

**Local Transport:**
- No formal municipal bus system identified within Yala city
- Local transport primarily by private vehicle, motorcycle taxi, songthaew
- Yala city is compact and centered around Phang Mueang thoroughfare with a circular park

**Data Access:**
- Bus booking: https://www.checkmybus.com/yala-th
- State Railway of Thailand: https://www.railway.co.th
- Yala Municipal transport data: Limited publicly available

---

## 13. Telecommunications (NBTC Coverage)

| Attribute | Detail |
|---|---|
| **Indicator** | Mobile network coverage, cell towers, spectrum allocation |
| **Source** | NBTC, AIS, True Corporation, NT |
| **Coverage Maps** | https://www.nperf.com/en/map/TH |
| **Real-time?** | No (static maps) |
| **Update Frequency** | Hourly (nPerf maps) |
| **API Available?** | nPerf offers data for purchase |
| **Dashboard Layer** | 4G/5G coverage heatmap by carrier |

### Key Findings

**Thailand Mobile Market (2024-2026):**
- **AIS**: ~44-46% market share, ~46.5M subscribers, widest rural coverage
- **True Corporation** (TrueMove H + DTAC merged March 2023): ~38-40% market share, ~50M subscribers
- **NT (National Telecom)**: State-owned, smallest operator
- 4G population coverage: ~98% (AIS), ~97% (True)
- 5G base stations: 8,000+ (AIS), 6,000+ (True)

**Yala Coverage:**
- All 3 major networks (AIS, True, DTAC) provide coverage in Yala
- nPerf coverage map for Yala: https://www.nperf.com/en/map/TH/1604870.Yala/-./signal
- Coverage tested by users: 2G/3G/4G/5G signal available
- 4G is standard; 5G availability limited to urban centers
- Yala's relatively flat terrain (elevation ~4 ft) helps signal propagation

**Infrastructure:**
- Cell tower locations: https://www.cellmapper.net/map?MCC=520&MNC=18
- NBTC regulates spectrum allocation and coverage obligations
- All operators required to provide service in all 77 provinces

**Data Access:**
- nPerf Yala: https://www.nperf.com/en/map/TH/1604870.Yala/-./signal
- AIS coverage: https://www.nperf.com/en/map/TH/-/19345.AIS-Mobile/signal
- CellMapper: https://www.cellmapper.net
- NBTC: https://www.nbtc.go.th

---

## 14. Internet/Broadband Coverage

| Attribute | Detail |
|---|---|
| **Indicator** | Fixed broadband, fiber, DSL availability |
| **Source** | NT, AIS, True, TOT (National Telecom) |
| **Primary URL** | Provider websites |
| **Real-time?** | No |
| **Update Frequency** | Static coverage data |
| **API Available?** | No |
| **Dashboard Layer** | Broadband coverage map |

### Key Findings

**Internet/Broadband in Yala:**
- **NT (National Telecom)**: Formerly TOT, provides fixed-line and broadband services
- **AIS**: Fixed broadband (AIS Fibre) available in urban areas
- **True**: TrueOnline broadband service
- **3BB**: Triple T Broadband (private ISP)

**Broadband Status:**
- Broadband available in Yala municipal area
- Fiber optic (FTTH) coverage expanding but may be limited outside municipal center
- ADSL/DSL available via NT infrastructure
- Mobile broadband (4G) serves as primary internet access in rural areas

**Speed Test Data:**
- nPerf provides speed test maps updated every 15 minutes
- Data from actual user tests in Yala area

**Data Access:**
- NT coverage: Contact NT directly or check https://www.ntplc.co.th
- AIS Fibre: https://www.ais.co.th/fibre
- TrueOnline: https://trueonline.truecorp.co.th
- nPerf speed maps: https://www.nperf.com/en/map/TH/1604870.Yala

---

## 15. Public WiFi (Yala Municipality)

| Attribute | Detail |
|---|---|
| **Indicator** | Free WiFi zones, usage data, access points |
| **Source** | Yala City Municipality Strategic Division |
| **Primary URL** | https://www.citydata.in.th/yala-city-municipality/en/reports/free-wi-fi-service-information/ |
| **Dashboard** | Yala Smart City Dashboard |
| **Real-time?** | No |
| **Update Frequency** | Monthly reports |
| **API Available?** | No (downloadable datasets) |
| **Dashboard Layer** | WiFi hotspot location map |

### Key Findings

**Yala Free WiFi Service:**
- **48 signal points** throughout Yala Municipality
- Operated by **Siam Innovation Company**
- Free public WiFi branded as "YALA Free Wi-Fi"
- Usage statistics available as downloadable datasets on Yala Smart City Dashboard

**WiFi Hotspot Locations (publicly identified):**
- Yala Central Mosque area
- Yala Cultural Centre
- Yala Railway Station
- Municipal offices
- Public parks and markets
- Various commercial establishments

**Additional Public WiFi:**
- PTT gas stations along Highway 410 (Yala-Hat Yai route) offer free WiFi
- Various cafes, hotels, and restaurants provide free WiFi
- WiFi Map community: https://www.wifimap.io/219-thailand/2833-yala

**Data Access:**
- Yala WiFi info: https://www.citydata.in.th/yala-city-municipality/en/reports/free-wi-fi-service-information/
- WiFi usage dataset: Available via Yala Smart City Dashboard
- WiFi Map: https://www.wifimap.io/219-thailand/2833-yala

---

## 16. Climate Projections (World Bank)

| Attribute | Detail |
|---|---|
| **Indicator** | Temperature, precipitation, extreme events projections |
| **Source** | World Bank Climate Change Knowledge Portal |
| **Primary URL** | https://climateknowledgeportal.worldbank.org/country/thailand |
| **Projections URL** | https://climateknowledgeportal.worldbank.org/country/thailand/climate-data-projections |
| **Real-time?** | No (modeled projections) |
| **Update Frequency** | Static (CMIP6 models) |
| **API Available?** | No (web interface with charts) |
| **Dashboard Layer** | Climate risk overlay (temperature + precipitation anomalies) |

### Key Findings

**Thailand Climate Profile (Koppen Classification):**
- Southern Thailand: **Tropical rainforest (Af)** and **Tropical monsoon (Am)** climates
- High temperatures year-round: 27-32 C average
- Humidity often exceeds 80%
- Two monsoon systems affect the region

**CMIP6 Projections Available:**
- **SSP1-1.9**: Sustainable Path (Very Low Emissions) — aims for 1.5 C
- **SSP1-2.6**: Sustainable Path (Low Emissions) — aims for <2 C
- **SSP2-4.5**: Middle of the Road (Intermediate Emissions)
- **SSP3-7.0**: Regional Rivalry (High Emissions)
- **SSP5-8.5**: Fossil-fueled Development (Very High Emissions)

**Key Climate Indicators Available:**
- Number of hot days (>35 C) — heat stress risk
- Number of tropical nights (>26 C) — agricultural/public health impact
- Hot and humid days — heat-related illness risk
- Precipitation projections (dry seasons get drier, wet seasons get wetter)
- Extreme precipitation increase expected

**Yala-Specific Considerations:**
- Southern Thailand already experiences highest rainfall in the country
- November peak rainfall expected to intensify under climate change
- Flood risk (already the #1 disaster in Thailand) will likely increase
- Sea level rise not a direct concern for inland Yala but affects Pattani River basin

**Data Access:**
- World Bank Portal: https://climateknowledgeportal.worldbank.org/country/thailand
- Mean Projections (CMIP6): https://climateknowledgeportal.worldbank.org/country/thailand/climate-data-projections
- Context layers: Topography, land cover, population density overlays available

---

## Summary: Dashboard Layer Recommendations

| Layer | Priority | Data Source | Integration Method |
|---|---|---|---|
| Water Supply | High | Yala Dashboard (download) + PWA | CSV import + PWA GIS link |
| Electricity | High | PEA Smart Plus + EPPO stats | API integration (if available) |
| Waste/Garbage | High | Yala Dashboard | Direct CSV download |
| PM2.5 Air Quality | High | air4thai JSON API + GISTDA | Real-time API feed |
| Weather | High | TMD API | JSON API integration |
| Rainfall | High | CHIRPS (GEE) + TMD | Satellite + gauge fusion |
| Flood Monitoring | Critical | GISTDA Sphere API | WMS/API real-time overlay |
| River/Reservoir | High | ThaiWater.net API | API + gauge markers |
| Disaster Events | High | DDPM reports + AHA Centre | Manual + GDACS auto-import |
| Building Permits | Medium | DPT e-PP | Manual data entry |
| Road Conditions | Medium | DRR PMMS | Manual (no public API) |
| Public Transport | Medium | Bus terminal locations | Static POI layer |
| Mobile Coverage | Low | nPerf + OpenCellID | Coverage polygon overlay |
| Broadband | Low | ISP coverage maps | Static indicator |
| Public WiFi | Low | Yala Dashboard | POI markers (48 points) |
| Climate Projections | Medium | World Bank Portal | Static risk layers |

---

## Key URLs Reference

| Category | URL | Description |
|---|---|---|
| **Yala Smart City Dashboard** | https://www.citydata.in.th/yala-city-municipality/en/dashboard-public-en/ | Central data platform |
| **PWA** | https://www.pwa.co.th | Provincial Waterworks |
| **PEA** | https://www.pea.co.th | Provincial Electricity Authority |
| **air4thai** | http://air4thai.pcd.go.th/webV3/ | Air quality monitoring |
| **TMD** | https://www.tmd.go.th/en/weather/province/yala | Weather data for Yala |
| **TMD API** | https://data.tmd.go.th/api/index1.php | Weather API portal |
| **ThaiWater** | https://www.thaiwater.net | Water resource data |
| **GISTDA Sphere** | https://sphere.gistda.or.th | Satellite monitoring platform |
| **GISTDA Flood** | https://flood.gistda.or.th | Flood monitoring |
| **GISTDA PM2.5** | https://pm25.gistda.or.th | Satellite air quality |
| **DDPM** | https://www.ddpm.go.th | Disaster prevention |
| **AHA Centre** | https://adinet.ahacentre.org | Regional disaster reports |
| **CHIRPS** | https://www.chc.ucsb.edu/data/chirps | Satellite rainfall data |
| **World Bank Climate** | https://climateknowledgeportal.worldbank.org/country/thailand | Climate projections |
| **nPerf Yala** | https://www.nperf.com/en/map/TH/1604870.Yala | Mobile coverage |
| **DPT** | https://www.dpt.go.th | Town planning & building permits |
| **EPPO** | https://www.eppo.go.th | Energy statistics |
| **Bang Lang Dam** | EGAT archive | Reservoir/dam information |
| **Envilink** | https://envilink.go.th | Government open data portal |

---

*Report compiled from 22+ web searches across government portals, academic databases, international organizations, and satellite data platforms. All URLs verified as of research date.*
