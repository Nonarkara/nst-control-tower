# Data Source Bible for the City Municipality of Yala: A Comprehensive Guide to APIs, Open Data, and Information Systems for Geographic Dashboards and Data-Driven Governance

## Executive Summary
### Yala's Digital Maturity Assessment
#### Yala City Municipality operates YALA Resilience City dashboard (yaladashboard.com) with 19+ data modules, winning 3 consecutive DGA Digital Government Awards (2022-2024)
#### Critical gap identified: operational data is well-tracked (budget, water, complaints) but developmental outcome data (poverty, education, health disparities) is missing from the dashboard
#### This bible catalogs 200+ data sources across 12 domains with API endpoints, access methods, and integration priorities

### Priority Integration Opportunities
#### Immediate (0-3 months): GDCC free cloud registration, GDX inter-agency data exchange, DEPA CityData API expansion, DOPA population data API
#### Short-term (3-6 months): GISTDA Sphere geospatial integration, TPMAP poverty mapping, MOPH health data, NSO SDMX feeds
#### Medium-term (6-12 months): Climate risk modeling, pondok education GIS mapping, border trade analytics, predictive aging service demand

## 1. Yala's Digital Foundation — Current Infrastructure and Gaps (~1,500 words, 3 tables)
### 1.1 Existing Dashboard Systems
#### 1.1.1 YALA Resilience City platform architecture: Mayor Dashboard, Citizen Dashboard (yaladashboard.com), LINE OA (@yalacity), mobile app, chatbot
#### 1.1.2 DEPA CityData platform integration: 15+ published datasets covering population, budget, tax, health, complaints, waste, water, green areas, PM2.5
#### 1.1.3 Five big data systems developed with Bedrock Analytics: CDDP, Disaster Management, Bellme Complaints, Smart Tax, Smart Building Permits
#### 1.1.4 Performance metrics: ITA score 91.21 (Grade A, Rank #9/65 LAOs in Yala Province), 83% reduction in problem resolution time

### 1.2 Municipal Data Responsibilities and Structure
#### 1.2.1 Thesaban Nakhon governance structure: 9 departments (4 สำนัก + 5 กอง), jurisdiction over 19.4 km² covering Tambon Sateng, population ~57,640-60,291
#### 1.2.2 Data collected mandatorily: e-LAAS financial reporting, ITA transparency disclosure, LQM performance assessment, resident registration
#### 1.2.3 Budget context: FY2025 total 1,190.53M THB (60-70% from central transfers, tax revenue 57.13M THB, ~4.8% self-generated)
#### 1.2.4 Organizational data maturity: Strategy Division (กองยุทธศาสตร์) handles all IT functions, no dedicated data/GIS team identified

### 1.3 Gap Analysis — What the Dashboard Misses
#### 1.3.1 Operational-outcome divide: dashboard tracks process metrics (budget spent, water delivered, complaints resolved) but not developmental outcomes (poverty reduced, education improved, health enhanced)
#### 1.3.2 Critical data gaps by sector: education outcomes absent, health disparities unmapped, economic productivity not tracked, climate risk not visualized, security data not responsibly integrated
#### 1.3.3 Technical gaps: public transport shows 0 trips (no real-time data), water billing on separate platform, no cross-municipal data sharing with Betong or Yala PAO
#### 1.3.4 National resource underutilization: GDCC free cloud, GDX data exchange (194 agencies), GD Catalog (156 agency catalogs) all available but not leveraged

## 2. National Government Data Infrastructure — The Open Data Ecosystem (~1,800 words, 4 tables)
### 2.1 Central Data Portals and Catalogs
#### 2.1.1 data.go.th: Thailand's official CKAN-based open data portal with 11,000+ datasets, API at opendata.data.go.th, EGA Open Government Licence, 1,000 req/day rate limit
#### 2.1.2 GD Catalog (gdcatalog.go.th): Central registry of all government datasets from 156 agencies + 76 provinces, REST API with OAuth2 authentication via Keycloak
#### 2.1.3 Government Data Exchange (GDX): Inter-agency data sharing platform connecting 194 agencies, 2 access modes (web + API), gateway to population registration, business data, and cross-agency datasets
#### 2.1.4 Government Spending Portal (govspending.data.go.th): Provincial-level fiscal data, budget rankings, disbursement tracking with drill-down maps

### 2.2 Statistical Data Systems
#### 2.2.1 NSO Statistics Sharing Hub (stathub.nso.go.th): SDMX 2.1 API for official statistics, 76 provincial offices, Power BI direct connection, CKAN API available
#### 2.2.2 NSO Yala Provincial Office: Direct contact 073-212-703, provincial statistical publications, data request process, GPP and income statistics for Yala province
#### 2.2.3 2025 Population and Housing Census: Data collection completed April-June 2025, provincial results expected October-December 2025, decennial census with subdistrict-level granularity
#### 2.2.4 Household Socio-Economic Survey (SES): Annual income/expenditure data, Yala average income 19,182 THB/month vs national 28,308 THB/month

### 2.3 Authentication and Access Framework
#### 2.3.1 Thai National Digital ID (ThaiD): 162M+ accounts, OAuth 2.0/OIDC authentication, 3 levels of e-KYC via DOPA API, required for accessing sensitive government datasets
#### 2.3.2 NDID platform: 150+ organizations connected for eKYC, eConsent, eSignature using distributed ledger technology
#### 2.3.3 API authentication matrix: API Key (data.go.th), OAuth 2.0 (GD Catalog, DOPA, GDX), Consumer Key/Secret (GDX), ThaiD/OpenID (Land Department, sensitive data)
#### 2.3.4 Registration requirements and process summary for Yala Municipality (table: system, URL, auth method, registration process, estimated timeline)

## 3. Population and Demographic Data Sources (~1,200 words, 3 tables)
### 3.1 Population Registration and Census Data
#### 3.1.1 DOPA population registration: Real-time data at stat.bora.dopa.go.th, Yala Province 552,479 persons (2024), 180,582 households, DOPA Geospatial Portal for subdistrict-level shapefiles
#### 3.1.2 DOPA API: 4-tier identity verification (simple/normal/full/extra profiles), OAuth2 authentication, population registration data accessible to municipalities
#### 3.1.3 Census 2010 microdata: 1% sample (538,463 cases, 83 variables) available via ILO and IHSN data catalogs; 2025 Census results expected late 2025
#### 3.1.4 WorldPop gridded population: 100m resolution population estimates for Thailand (2015-2030 projections) with age/sex disaggregation via HDX and Google Earth Engine

### 3.2 Poverty and Social Welfare Data
#### 3.2.1 TPMAP (Thai People Map and Analytics Platform): Precision poverty mapping at tambon/village level, 20.83% MPI poverty in Yala (208,274 persons), 36M individual records
#### 3.2.2 Welfare Card data: 143,351 welfare card holders in Yala (2022), 248,144 Khon La Khrueng program participants, accessible through Ministry of Finance systems
#### 3.2.3 NESDB Human Achievement Index (HAI): Yala ranks 11th nationally (0.6617) with strengths in Employment (6th) and Transport (9th), critical weakness in Education (66th)
#### 3.2.4 Community Development Department (CDD) Basic Minimum Needs: 102,076 households surveyed (2024), 38 indicators across 5 categories, feeds TPMAP MPI calculation

### 3.3 Social and Cultural Demographics
#### 3.3.1 Religious demographics: 79.6% Muslim (Patani Malay community), Jawi language widely spoken, ~3,900 mosques nationally with significant Yala concentration
#### 3.3.2 Aging society data: Yala entered "Aged Society" 2023, 76,338 elderly (13.89%), aging index 55.09, elderly/disability allowance data on current dashboard
#### 3.3.3 Disability data: 14,236 registered persons with disabilities (June 2022), 46.1% physical disability, Special Education Center Zone 2 coverage
#### 3.3.4 Migration and cross-border movement: IOM 2024 scoping study, ~2,100 non-Thai residents, Betong border crossing 400-2,000 persons/day, significant Thai-Malay labor mobility

## 4. Economic, Business, and Labor Data (~1,400 words, 3 tables)
### 4.1 Business and Trade Data
#### 4.1.1 DBD DataWarehouse (datawarehouse.dbd.go.th): Free public access to all registered businesses in Yala, query by province and district, financial statements, ISIC sector codes
#### 4.1.2 Business registration trends: New registrations time series, sectoral composition, formal/informal economy estimates for Yala municipality
#### 4.1.3 Betong border trade: US$139M Thai exports (FY2013), designated model sustainable development city, 400-2,000 daily border crossings, airport development planned
#### 4.1.4 SSO Data Catalog (catalog.sso.go.th): 53 statistical datasets with provincial breakdowns, Sections 33/39/40 insured persons data

### 4.2 Labor Market and Employment
#### 4.2.1 Labor Force Survey Q2 2025: LFPR 67.31%, unemployment 0.86%, 61.8% in agriculture, 198,150 informal workers (76.5% of employed)
#### 4.2.2 NESDB Gross Provincial Product: Yala GPP 43,006M THB (2018 constant prices), per capita 91,815 THB vs national 236,815 THB (38.8%), sectoral composition
#### 4.2.3 Agricultural productivity gap: 61.8% workforce in agriculture but agriculture contributes ~31% of GPP — rubber dominates (55,843 tons) with -16.1% price decline YoY
#### 4.2.4 Banking data (BOT): 16 bank branches in Yala, deposits 23,362M THB, loans 12,548M THB, net depositor province (funds flow out)

### 4.3 Tourism and Diversification
#### 4.3.1 Tourism statistics: 1.55M visitors (2023), 4,720M THB revenue (~11% of GPP), key attractions Hala-Bala, Betong Hot Springs, community tourism
#### 4.3.2 OSP SME data: Small and medium enterprise promotion data for Yala province
#### 4.3.3 Department of Employment: Job vacancy registrations, job seekers, employment services for Yala
#### 4.3.4 Productivity analysis: Agricultural GPP share (~31%) vs agricultural employment (~62%) reveals severe productivity gap requiring diversification tracking

## 5. Environmental and Climate Data (~1,600 words, 4 tables)
### 5.1 Air Quality and Pollution
#### 5.1.1 air4thai (air4thai.pcd.go.th): Real-time PM2.5, PM10, O3, CO, NO2, SO2 from 77 stations across 46 provinces, JSON API available, hourly data
#### 5.1.2 GISTDA Sphere air quality integration: PM2.5 mapping, hotspot monitoring, integration with satellite-derived aerosol data
#### 5.1.3 OpenAQ API: Aggregated air quality data from Thailand monitoring stations including historical data, new stable v3 API (October 2024)
#### 5.1.4 Yala municipality air quality: Current dashboard tracks PM2.5 but lacks pollutant breakdown, health impact correlation, and forecasting

### 5.2 Weather and Climate
#### 5.2.1 Thai Meteorological Department (TMD) API: 10+ weather stations across Yala Province, weather forecasts, historical climate data, TMDAPI public endpoint
#### 5.2.2 CHIRPS rainfall data: 0.05° resolution (~5.5km), 1981 to near-present, available via API, Google Earth Engine, and direct download — critical for flood trend analysis
#### 5.2.3 World Bank Climate Change Knowledge Portal: Climate projections for Thailand, 1.0-3.8°C warming by 2080-2099, strongest warming in southern Thailand
#### 5.2.4 GISTDA drought monitoring: Standardized drought indices, agricultural drought assessment, seasonal forecasting

### 5.3 Disaster and Flood Risk
#### 5.3.1 GISTDA flood monitoring API (disaster.gistda.or.th): Real-time flood extent mapping, 1/3/7/30-day flood layers, STAC catalog for archives, REST JSON + WMS/WMTS
#### 5.3.2 GloFAS flood forecasting: Global river discharge forecasts at 5km resolution for Yala River Basin, 30-day forecasts via Open-Meteo API
#### 5.3.3 Bang Lang Dam data: Pattani River reservoir, 1,420 MCM capacity, 72 MW hydropower, irrigation for 380,000 rai — critical infrastructure for Yala flood management
#### 5.3.4 Historical flood events: Feb 2022 (3,114 households), Dec 2023 "50-year flood" (15,457 households, 4 deaths), Nov-Dec 2024 (664K+ region-wide) — all need to inform risk modeling

### 5.4 Forest and Land Cover
#### 5.4.1 Global Forest Watch (WRI): 30m tree cover loss data (Hansen et al., updated 2024), VIIRS/MODIS active fire alerts, weekly GLAD alerts, REST API
#### 5.4.2 GISTDA forest fire monitoring: MODIS (1km) + VIIRS (375m) near real-time, SMS alerts within 20 minutes, API endpoints
#### 5.4.3 Copernicus Sentinel-2: 10m multispectral imagery, 5-day revisit, free access via Copernicus Data Space STAC API — for land use/land cover classification
#### 5.4.4 Google Earth Engine: Complete code examples for Yala NDVI change detection, Dynamic World land cover, multi-petabyte analysis platform

## 6. Health and Social Welfare Data (~1,300 words, 3 tables)
### 6.1 Health Information Systems
#### 6.1.1 MOPH Health Data Center (HDC): 43 standard data files, hospital-level health data from all 76 provinces, monthly to annual indicators, login required for detailed access
#### 6.1.2 Bureau of Epidemiology (BOE) 506 surveillance: ~65 notifiable diseases tracked weekly, Yala had 25/52 weeks reporting completeness in 2020, dengue ranked #7 nationally
#### 6.1.3 NHSO Universal Coverage Scheme: 99.95% UHC coverage, UCS member registration, service utilization (OP 3.74/person/year), capitation budgets, Yala under Health Region 12
#### 6.1.4 Yala Hospital: 558 beds, Regional Hospital status, 21 doctors (1:2,906 ratio), 64% bed occupancy, Smart Hospital Silver certified, 9 psychiatrists

### 6.2 Disease Priorities for Yala
#### 6.2.1 Dengue: Yala ranked #7 nationally (21.87/100,000 in 2022), major 2019 outbreak (523 cases Jan-Jul), seasonal patterns require predictive modeling
#### 6.2.2 Measles and vaccination: MMR1 coverage only 50.5% in outbreak areas vs 95% target, 10 measles deaths in Yala 2018, concentrated in southern provinces
#### 6.2.3 Malaria: Not yet malaria-free, 4,641 cases in 2016 declining to ~805 by 2018, border districts remain at risk
#### 6.2.4 Mental health: 9.6% lifetime mental disorder prevalence in Deep South, only 9 psychiatrists at Yala Hospital, conflict-related trauma services needed

### 6.3 Health Service Delivery Data
#### 6.3.1 District and community hospitals: 5+ community hospitals with 348 beds, 122% bed occupancy (very high demand), 81 THPHs, 707,722 OP visits annually
#### 6.3.2 Maternal and child health: 8,899 live births (2024), infant mortality 5.3/1,000, 0 maternal deaths, CDD child development indicators
#### 6.3.3 Health workforce: 21 doctors in general hospital, 188 personnel in community hospitals, 81 primary care units — distribution and gap mapping needed
#### 6.3.4 Digital Disease Surveillance (DDS): Real-time reporting from 1,416+ facilities, weekly surveillance summaries, annual epidemiological reports

## 7. Education and Human Development Data (~1,000 words, 2 tables)
### 7.1 Formal Education Data
#### 7.1.1 EMIS (data.bopp-obec.info/emis): 30,800+ schools nationwide, enrollment/teacher/infrastructure data, GIS locations, queryable for Yala province
#### 7.1.2 NIETS O-NET scores: Yala scores 21% below national average (27.92 vs 35.38), pass rates catastrophic in Thai (8.3% vs 37.7%) and Math (1.8% vs 9.9%)
#### 7.1.3 OBEC Yala Educational Service Areas: 3 primary education area offices (สพป.ยะลา 1/2/3) + 1 secondary (สพม.ยะลา) — local performance data
#### 7.1.4 Yala City O-NET Dashboard: Local test visualization already exists, should be integrated into municipal dashboard

### 7.2 Islamic and Non-Formal Education
#### 7.2.1 Pondok institutions: 161 total (126 registered + 35 unregistered), 32 Islamic private schools, 19 Hafiz institutions, 1,221 Tadika schools — massive data blind spot
#### 7.2.2 OPEC (opec.go.th): Private/Islamic school registration data, Excel files for Yala, 80% of secondary students attend private institutions
#### 7.2.3 Education crisis indicators: 44.2% youth enrollment vs 79.3% national, 30.8% NEET rate, 12,802 out-of-school children (EEF 2024), education HAI rank 66th
#### 7.2.4 Yala Rajabhat University and PSU Pattani Campus: Higher education data sources, community program tracking, research partnerships

## 8. Public Safety, Security, and Disaster Management (~1,200 words, 3 tables)
### 8.1 Security Incident Data
#### 8.1.1 Deep South Watch (DSW): 4 databases (CID, PBP, POP, SEP), 15,000+ geocoded incidents since 2004, monthly reports public, full access requires institutional partnership with CSCD at Prince of Songkla University
#### 8.1.2 ACLED (Armed Conflict Location & Event Data): Free registration at developer.acleddata.com, weekly updates, R package available, Thailand coverage via English-language sources
#### 8.1.3 UCDP (Uppsala Conflict Data Program): Free download at ucdp.uu.se, CC BY 4.0, monthly GED candidate releases, REST API with token
#### 8.1.4 Responsible data use framework: Aggregate only, never display individual incident coordinates, choropleth maps at district level minimum, SBPAC consultation mandatory, Emergency Decree context noted

### 8.2 Complaint and Justice Data
#### 8.2.1 SBPAC KEADILAN Center API: Real-time complaint data at opendata.sbpac.go.th/API/SRT_01_01.aspx, 6 complaint categories, district-level, Open Data Common license
#### 8.2.2 SBPAC Data Catalog: 24 datasets at catalog.sbpac.go.th covering relief/compensation, complaints, CSOs, Hajj data, JSON format
#### 8.2.3 Traffy Fondue: citydata.traffy.in.th with 24 complaint categories, real-time open data API via gdcatalog.go.th, 89% national satisfaction rate
#### 8.2.4 Royal Thai Police Region 9: Crime statistics via formal request, traffic accident stats published at police9.go.th

### 8.3 Disaster Management Integration
#### 8.3.1 DDPM disaster statistics: 49+ indicator categories at provincial/district level, flood/landslide/storm/drought/fire data, integration challenges noted
#### 8.3.2 AHA Centre / ASEAN disaster data: Regional disaster monitoring, early warning systems
#### 8.3.3 Historical disaster impact for Yala: Three catastrophic flood events 2022-2024 affecting 18,000+ households total, infrastructure damage data via DDPM
#### 8.3.4 Integration guidelines: Security and disaster data should inform health service planning, education interventions, and economic development — not just operational response

## 9. Geospatial Data and GIS Infrastructure (~1,500 words, 4 tables)
### 9.1 National Geospatial Platforms
#### 9.1.1 GISTDA Sphere (sphere.gistda.or.th): Thailand's national geospatial platform, WMS/WMTS/TMS/REST APIs, API key authentication, 5+ base map layers, JavaScript/Native SDKs
#### 9.1.2 GISTDA APIs detailed: Geocoding, routing, POI search, elevation, satellite imagery (THEOS-2 0.5m PAN/2m MS), disaster recurring endpoints, live CCTV feeds
#### 9.1.3 Royal Thai Survey Department (RTSD): 1:50,000 topo maps (L7018 series, 830 sheets), DEM, FLDB GIS vector data, 100+ CORS stations, map request via official letter
#### 9.1.4 Land Department LandsMaps: WMS endpoint at 110.164.49.68:8081/geoserver/WMSDOL/wms, 34M+ parcels, 14+ attributes per parcel, ThaiD/OpenID authentication

### 9.2 Satellite and Remote Sensing Data
#### 9.2.1 THEOS-2: 0.5m panchromatic / 2m multispectral, 74,000 km²/day coverage, government pricing via usd@gistda.or.th
#### 9.2.2 Sentinel-2 (Copernicus): 10m multispectral, 5-day revisit, free via Copernicus Data Space STAC API — ideal for land use monitoring
#### 9.2.3 DEM sources comparison: ALOS AW3D30 (30m, 3-5m accuracy, recommended), SRTM (30m/90m), RTSD (most accurate, paid) — download procedures for each
#### 9.2.4 Google Earth Engine: Multi-petabyte catalog, Python/JavaScript APIs, code examples for Yala NDVI change detection and Dynamic World land cover

### 9.3 Base Geographic Data for Yala
#### 9.3.1 Administrative boundaries: HDX RTSD boundaries preferred over GADM (official source), tambon-level available, Yala City = 19.4 km² covering Tambon Sateng
#### 9.3.2 OpenStreetMap Thailand: Geofabrik daily PBF extract (~308 MB), free ODbL license, road networks, buildings, POIs — import to PostGIS workflow
#### 9.3.3 Road network data: DRR rural roads (dataportal.drr.go.th) + DOH highways + OSM urban roads — shapefile downloads, combined network for Yala
#### 9.3.4 Yala City Plan (ผังเมืองรวม): DPT land use zoning, PDF available, shapefile requires formal request to DPT Yala office

### 9.4 Water and Environmental GIS
#### 9.4.1 RID water data: Real-time reservoir, rainfall, river levels at app.rid.go.th/reservoir, Bang Lang Dam monitoring, watershed boundaries
#### 9.4.2 Royal Irrigation Department GIS: 25+ categories including watersheds, flood-prone areas, river networks, dams, weirs
#### 9.4.3 Watershed and hydrology: Pattani River basin data, irrigation zones, cross-section data for flood modeling
#### 9.4.4 Land use/land cover: GISTDA national land cover, Dynamic World (10m, Google/EE), ESA WorldCover — comparison and integration approach

## 10. Utilities and Infrastructure Data (~1,000 words, 2 tables)
### 10.1 Water and Electricity
#### 10.1.1 Provincial Waterworks Authority (PWA) Yala: Water production, consumption, coverage, GIS-based pipeline management, DMA zones, loss target <26.3%
#### 10.1.2 PEA Area 3 (Southern Region): Headquartered in Yala Province, serves 6 provinces with 68 offices, 22.06M customers nationwide, 17.32% of national electricity sales
#### 10.1.3 Yala dashboard water data: Current system tracks water supply (2.10 NTU turbidity) but consumption analytics, coverage gaps, and quality trends need enhancement
#### 10.1.4 Smart grid and outage data: PEA smart meter rollout, outage notification systems, not publicly available at provincial level

### 10.2 Telecommunications and Digital Infrastructure
#### 10.2.1 Free public WiFi: 48 signal points across Yala Municipality (Siam Innovation Company), usage data on dashboard
#### 10.2.2 Mobile coverage: All 3 operators (AIS, True, DTAC) provide 4G/5G in Yala, nPerf crowdsourced coverage maps available
#### 10.2.3 NBTC telecommunications data: Regulatory coverage requirements, spectrum allocation, infrastructure sharing data
#### 10.2.4 Building permits and urban planning: DPT e-PP system, not publicly aggregated for Yala — requires DPT office access

## 11. International and Regional Data Sources (~1,200 words, 3 tables)
### 11.1 United Nations and Development Data
#### 11.1.1 UNDP SDG Profile for Yala: Full 22.8 MB PDF covering all 17 SDGs benchmarked against national averages, aligned with Provincial Development Plan (2022-2027)
#### 11.1.2 World Bank Open Data API: 16,000+ indicators, free REST API (JSON/XML), CC BY 4.0 license, subnational poverty data available
#### 11.1.3 UN ESCAP SDG Portal: Asia-Pacific SDG indicators, country-level Thailand data, no subnational disaggregation
#### 11.1.4 UN OCHA HDX: 152+ datasets for Thailand including admin boundaries, population, rainfall, conflict events, COVID-19 statistics; HDX HAPI daily API

### 11.2 Climate and Environmental Data
#### 11.2.1 CHIRPS rainfall: 5.5km resolution, 1981-present, API and GEE access — critical for Yala flood trend analysis and early warning
#### 11.2.2 GloFAS flood forecasting: 5km resolution for Yala River Basin, 30-day forecasts via Open-Meteo API, river discharge predictions
#### 11.2.3 Global Forest Watch: 30m tree cover loss, weekly GLAD alerts, daily fire alerts, REST API with token authentication
#### 11.2.4 NASA SEDAC GPWv4: 1km population density grids for 2000-2020, STAC API access through US GHG Center

### 11.3 Population and Demographic Estimates
#### 11.3.1 Meta High Resolution Population Density: 30m resolution with demographic breakdowns (age/sex), available via HDX download and Google Earth Engine
#### 11.3.2 WorldPop: 100m resolution population estimates with full demographic breakdowns, projections to 2030, via HDX and GEE
#### 11.3.3 IOM DTM: Displacement tracking at Thailand borders, no dedicated Yala operations currently but methodology applicable
#### 11.3.4 OpenAQ: Aggregated air quality from Thailand stations, new stable v3 API, historical data available

## 12. Technical Architecture and Integration Standards (~1,500 words, 3 tables)
### 12.1 Government Standards and Compliance
#### 12.1.1 TH-e-GIF v2.0: 6 standard domains, RESTful API + JSON + OAuth 2.0 + OpenAPI 3.0 + HTTPS/TLS 1.2 mandatory, developed by DGA since 2006
#### 12.1.2 SDMX (ISO 17369): Thailand NSO-adopted standard for statistical data exchange, StatHub platform, proposed as national standard to Digital Government Development Committee
#### 12.1.3 PDPA compliance (B.E. 2562/2019): Full enforcement since June 2022, fines up to THB 5-7M, Data Protection Officer required for 100,000+ data subjects, 72-hour breach notification
#### 12.1.4 PDPA 5-phase compliance checklist for Yala Municipality: assessment, policy, DPO appointment, technical measures, audit

### 12.2 Recommended Technology Stack
#### 12.2.1 Database layer: PostgreSQL + PostGIS (spatial) + TimescaleDB (time-series) in single container, Docker/Kubernetes deployment configs
#### 12.2.2 GIS platform: GeoNode (DGA-recommended open-source SDI) combining GeoServer + PostGIS + MapStore + pyCSW, Thai language support, UTM Zone 47N for Yala
#### 12.2.3 Data catalog: CKAN Open-D (Thai-localized variant), 114 agency + 76 area catalogs, DCAT-AP v3 metadata support with GeoDCAT-AP and StatDCAT-AP extensions
#### 12.2.4 API gateway: Kong (DB-less mode recommended) with OAuth 2.0, rate limiting, JWT plugins — aligns with TH-e-GIF

### 12.3 Dashboard and Visualization Framework
#### 12.3.1 Primary dashboard: Metabase (recommended — easier setup, Thai i18n) or Apache Superset (advanced analytics), deployment configurations for both
#### 12.3.2 IoT/monitoring layer: Grafana for real-time sensor data, integrates with TimescaleDB, alert rules for flood/air quality thresholds
#### 12.3.3 Mobile data collection: ODK Collect (offline-capable, GPS, photos) or KoboToolbox (quick-start), self-hosted via Docker, XLSForm standard
#### 12.3.4 Cloud infrastructure: GDCC Government Cloud — FREE IaaS for government agencies, ISO 27001/27701 certified, 219 agencies, 3,065 systems, register at portal.opendata.go.th

## 13. Implementation Roadmap — From Data to Decisions (~1,300 words, 2 tables)
### 13.1 Phase 1: Foundation (Months 1-3)
#### 13.1.1 Register for GDCC free government cloud hosting and deploy PostgreSQL+PostGIS+TimescaleDB database
#### 13.1.2 Set up GeoNode GIS platform with Yala administrative boundaries, GISTDA base maps, and OSM extract
#### 13.1.3 Register for GDX data exchange access and DOPA API (Consumer-Key via DGA)
#### 13.1.4 Harvest existing DEPA CityData datasets (15+) into municipal CKAN catalog

### 13.2 Phase 2: Core Integration (Months 4-6)
#### 13.2.1 Integrate NSO StatHub SDMX feeds for automatic statistical updates (population, labor, GPP)
#### 13.2.2 Connect TPMAP poverty data and MOPH HDC health indicators to dashboard
#### 13.2.3 Deploy GISTDA Sphere flood monitoring, air4thai PM2.5, and TMD weather APIs
#### 13.2.4 Launch Metabase dashboard with outcome indicators (poverty, education, health, economic productivity)

### 13.3 Phase 3: Advanced Analytics (Months 7-12)
#### 13.3.1 Deploy ODK mobile collection for pondok GIS mapping and field asset inventory
#### 13.3.2 Integrate CHIRPS rainfall + GloFAS flood forecasting for predictive climate risk module
#### 13.3.3 Layer WorldPop demographic projections with NHSO elderly health data for aging service demand forecasting
#### 13.3.4 Develop border trade analytics module with DFT Betong crossing data

### 13.4 Governance and Sustainability
#### 13.4.1 Data governance framework: ownership, update schedules, quality standards, PDPA compliance monitoring
#### 13.4.2 Municipal data team: recommended structure (data manager, GIS specialist, API developer, data protection officer)
#### 13.4.3 Partnership strategy: SBPAC for security data, PSU Pattani for research collaboration, DEPA for smart city funding
#### 13.4.4 Continuous improvement: annual data source audit, ITA alignment, citizen feedback integration

# References
## Research Dimension Files
- **Type**: Deep-dive research reports (12 files)
- **Path**: /mnt/agents/output/research/yala_dim01.md through yala_dim12.md

## Cross-Verification Report
- **Type**: Confidence classification and conflict analysis
- **Path**: /mnt/agents/output/research/yala_cross_verification.md

## Insight Extraction
- **Type**: Cross-dimension strategic insights
- **Path**: /mnt/agents/output/research/yala_insight.md

## Wide Exploration Files
- **Type**: Broad research scans (8 files)
- **Path**: /mnt/agents/output/research/yala_wide01.md through yala_wide08.md
