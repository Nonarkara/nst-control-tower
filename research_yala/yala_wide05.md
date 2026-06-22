## Facet: Sector-Specific Data Sources

### Key Findings

- **Yala City Municipality operates a depa-funded Smart City Data Platform** (`citydata.in.th`) that publishes downloadable datasets on population, water supply, waste collection, PM2.5, green areas, carbon absorption, elderly/disability allowances, and citizen complaints [^1^].
- **Thailand's Universal Health Coverage (UHC) covers 99.95% of the population**, with the National Health Security Office (NHSO) managing the Universal Coverage Scheme (UCS) covering ~72% of the population [^2^]. NHSO maintains comprehensive utilization data, payment records, and service provider networks.
- **The Health Data Center (HDC)** at `hdcservice.moph.go.th` aggregates hospital-level health data from all 76 provinces and provides summary health indicators via MoPH Open Data portal [^3^].
- **The Bureau of Epidemiology (BOE)** operates digital disease surveillance (DDS) and publishes annual epidemiological surveillance reports with provincial-level breakdowns for ~65 notifiable diseases [^4^].
- **The Education Management Information System (EMIS)** at `data.bopp-obec.info/emis` contains comprehensive school data including enrollment, teachers, infrastructure, and GIS locations for ~30,800+ OBEC schools [^5^].
- **The Provincial Electricity Authority (PEA) Area 3 (Southern Region)** is headquartered in Yala Province and serves Yala, Pattani, Narathiwat, Songkhla, Satun, and Phatthalung, with 22.06 million customers nationwide and 100% village electrification [^6^].
- **The DBD Data Warehouse** at `datawarehouse.dbd.go.th` provides free public access to company registration data, financial statements (B/S and P/L), and director/shareholder information for all registered businesses in Thailand [^7^].
- **GISTDA Sphere platform** (`sphere.gistda.or.th`) is Thailand's open geospatial platform providing air quality data (PM2.5), flood monitoring, forest fire tracking, drought monitoring, and agricultural data, integrated with `air4thai.net` air quality data [^8^].
- **The Pollution Control Department (PCD)** operates air4thai (`air4thai.pcd.go.th`) with 77 monitoring stations across 46 provinces and provides real-time PM2.5, PM10, O3, CO, NO2, SO2 data [^9^].
- **The Department of Disaster Prevention and Mitigation (DDPM)** collects disaster statistics (floods, landslides, storms, droughts, fires) at provincial/district level with 49+ indicator categories, though data integration challenges persist [^10^].

---

### Health Data Sources

#### 1. Ministry of Public Health (MOPH) - Health Data Center (HDC)
- **URL**: `https://hdcservice.moph.go.th/hdc/main/index.php` (HDC Service); `https://opendata.moph.go.th/` (Open Data Portal)
- **Data available**: Hospital service utilization (OP/IP), maternal health, child development, elderly screening, disease prevalence, health service coverage indicators. Summary data processed through HDC from source hospitals across all provinces.
- **Geographic granularity**: Provincial and Health Region (13 health regions)
- **Access method**: Web dashboard (HDC Service) and downloadable files (Open Data Portal). Some reports require authentication.
- **Update frequency**: Monthly to annual depending on indicator
- **Relevance to Yala**: Direct access to Yala Provincial Health Office data (Health Region 12). Critical for monitoring health service delivery and disease burden in Yala municipality.

#### 2. Bureau of Epidemiology, Department of Disease Control (BOE/DDC) - Disease Surveillance
- **URL**: `https://apps-doe.moph.go.th/boeeng/` (BOE Apps); `https://ddsdoe.ddc.moph.go.th/ddss/` (Digital Disease Surveillance)
- **Data available**: Epidemiological Surveillance Report (506 system) covering ~65 notifiable diseases including dengue, malaria, influenza, leptospirosis, food poisoning, measles, chickenpox, tuberculosis. Weekly surveillance summaries and annual reports with provincial breakdowns.
- **Geographic granularity**: National, Health Region, Provincial
- **Access method**: Public web portal with annual reports downloadable as PDF. Digital Disease Surveillance system for authorized health personnel.
- **Update frequency**: Weekly (surveillance), Annual (comprehensive reports)
- **Relevance to Yala**: Yala-specific disease incidence rates available. In 2022, Yala ranked #7 nationally for chickenpox incidence (38.96 per 100,000) and #7 for cholera rate (21.87) [^4^]. Measles outbreaks concentrated in southern provinces (Yala, Pattani, Narathiwat, Songkhla) due to lower vaccination coverage.

#### 3. National Health Security Office (NHSO) - Universal Coverage Scheme
- **URL**: `https://www.nhso.go.th/` (Thai); `https://eng.nhso.go.th/` (English)
- **Data available**: UCS member registration data, health service utilization (OP visits 3.74/person/year, IP 0.127/person/year in 2018), provider payment data, beneficiary satisfaction surveys, healthcare unit locations, capitation budgets, high-cost service utilization (HIV, diabetes, hypertension, chronic kidney disease, cataract, stroke).
- **Geographic granularity**: National, Health Region, Provincial
- **Access method**: Annual reports downloadable as PDF. Some data via `data.nhso.go.th` (if available). Data sharing policy noted as needing improvement.
- **Update frequency**: Annual reports; some data quarterly
- **Relevance to Yala**: NHSO includes specific compensation provisions for "Remote and Hardship Areas and Southern Border Provinces" [^2^]. Yala falls under NHSO Health Region 12. Critical for understanding health access, utilization patterns, and health financing in Yala municipality.

#### 4. Bureau of Policy and Strategy (MOPH) - Health Statistics
- **URL**: `https://bps.moph.go.th/` (implied); data also via GHDx
- **Data available**: Thailand Public Health Statistics series (since 1962), health indicators, vital registration data, epidemiological surveillance, inpatient/outpatient statistics. Thailand Health Profile reports.
- **Geographic granularity**: National, subnational (province-level for some indicators)
- **Access method**: Published reports; some historical data available via Global Health Data Exchange (GHDx)
- **Update frequency**: Annual
- **Relevance to Yala**: Provincial-level health statistics for Yala available in annual reports. Key source for mortality, morbidity, and health system capacity indicators.

#### 5. Provincial Public Health Office Yala (สสจ. ยะลา)
- **URL**: Likely `https://yala.moph.go.th/` or similar (Provincial Health Office)
- **Data available**: Local health service statistics, communicable disease control programs, health promotion activities, community health center data, provincial health development plan indicators.
- **Geographic granularity**: Provincial, District, Sub-district
- **Access method**: Direct contact with Yala Provincial Health Office; some data reported upward to HDC and BOE
- **Update frequency**: Monthly/Quarterly
- **Relevance to Yala**: Primary source for Yala-specific health data not available in national portals. Includes data from Yala Hospital (provincial hospital), district hospitals, and tambon health promotion hospitals.

#### 6. Disease Surveillance System (506) - Digital Platform
- **URL**: `https://ddsdoe.ddc.moph.go.th/ddss/`
- **Data available**: Real-time reporting of notifiable diseases from 1,416+ healthcare facilities. Coverage: 90.25% of hospitals reporting; timeliness: 92.94%. Includes dengue, malaria, influenza-like illness, diarrhea, food poisoning, leptospirosis, and emerging infectious diseases.
- **Geographic granularity**: Health facility, District, Provincial, National
- **Access method**: Internal system for authorized public health personnel. Weekly summaries published publicly.
- **Update frequency**: Real-time reporting; weekly analysis
- **Relevance to Yala**: All health facilities in Yala (hospitals, clinics) report through this system. Critical for disease outbreak detection and response in Yala municipality.

---

### Education Data Sources

#### 7. OBEC Education Management Information System (EMIS)
- **URL**: `https://data.bopp-obec.info/emis/`
- **Data available**: School profiles (30,816 schools in 2015), enrollment by grade level (6.98 million students in 2015), teacher statistics (399,799 teachers), classroom counts, infrastructure data, computer/internet connectivity, GIS school locations, student-teacher ratios, special education data. Includes individual school data with photographs and contact information.
- **Geographic granularity**: School-level, Educational Service Area, Provincial, National
- **Access method**: Public web portal with school search functionality. Data exportable. Some student-level data requires security clearance.
- **Update frequency**: Annual (aligned with academic year)
- **Relevance to Yala**: Yala has 2 Primary Education Service Area Offices (ESA 1 and ESA 2). In 2015, Yala had 36 large government primary schools with 77 physical education teachers [^5^]. In 2022, only 44.2% of young people in Yala were enrolled in formal education vs. 79.3% national average [^11^]. EMIS provides disaggregated data for Yala municipality schools.

#### 8. Ministry of Education - Individual Student Data System (DMC)
- **URL**: `https://portal.bopp-obec.info/obec66/` (URL changes by academic year)
- **Data available**: Individual student records, enrollment by school, student movement tracking, dropout data.
- **Geographic granularity**: School-level, District, Provincial
- **Access method**: Restricted access for education officials
- **Update frequency**: Academic year cycle (May enrollment period)
- **Relevance to Yala**: Student-level enrollment data for Yala municipality schools; dropout tracking critical given Yala's low enrollment rate.

#### 9. Office of Private Education Commission (OPEC)
- **URL**: `http://www.opec.go.th/` (implied)
- **Data available**: Private school registration data, including Islamic private schools (pondok), school locations, enrollment, and operational status.
- **Geographic granularity**: School-level, Provincial, National
- **Access method**: Contact OPEC directly; some data integrated with EMIS
- **Update frequency**: Annual
- **Relevance to Yala**: Yala has significant private Islamic education sector (pondok schools). In 2015, Southern Thailand had 322 large primary schools across 14 provinces. OPEC data is needed to capture private Islamic schools not under OBEC jurisdiction.

#### 10. Educational Outcome Assessment Data (NT, O-NET, PISA)
- **URL**: `https://www.niets.or.th/` (National Institute of Educational Testing Service)
- **Data available**: National Test (NT) results, O-NET scores, PISA results by school and province.
- **Geographic granularity**: School-level, Provincial, National
- **Access method**: Public reports via NIETS website
- **Update frequency**: Annual (testing cycle)
- **Relevance to Yala**: Educational outcomes for Yala consistently below national average. Assessment data needed to benchmark Yala municipality schools.

---

### Infrastructure & Utilities Data Sources

#### 11. Provincial Waterworks Authority (PWA)
- **URL**: `https://www.pwa.co.th/` (headquarters); Regional office in Southern Thailand
- **Data available**: Water production volume, system input volume, billed consumption, water loss/non-revenue water (26.52% in sample), customer counts, water quality parameters (pH, turbidity, residual chlorine), DMA (District Metering Area) data, pipe network length. PWA serves 233 waterworks across 74 provinces (excluding Bangkok, Samut Prakan, Nonthaburi).
- **Geographic granularity**: Waterworks-level (branch office), Regional, National
- **Access method**: Annual reports; some operational data may require direct request to PWA regional office
- **Update frequency**: Monthly operational; Annual reports
- **Relevance to Yala**: PWA provides water services to Yala municipality. Yala City's smart city platform publishes water supply consumption data from the Water Supply Bureau [^1^]. PWA water quality data critical for municipal water management.

#### 12. Provincial Electricity Authority (PEA) - Area 3 (Southern Region, Yala)
- **URL**: `https://www.pea.co.th/` (headquarters)
- **Data available**: Electricity sales by region (Southern: 17.32% of total), customer counts (22.06 million nationwide), village electrification (100% of permitted villages), system loss (5.03% in 2024), distribution network length (890,699 circuit-km), number of offices (948), revenue (648,030 million baht in 2024). PEA has 16.6 million residential meters.
- **Geographic granularity**: Branch office, Area (Yala Area 3 serves 6 southern provinces), Regional, National
- **Access method**: Annual reports publicly available; billing data requires research collaboration
- **Update frequency**: Monthly billing; Annual reports
- **Relevance to Yala**: PEA Area 3 (Southern Region) headquartered in Yala Province specifically serves Yala, Pattani, Narathiwat, Songkhla, Satun, and Phatthalung [^6^]. PEA maintains 68 offices in the Southern Region (3 large, 10 medium, 21 small, 34 extra-small). Electricity consumption patterns from PEA billing data correlate 83% with household expenditure, serving as proxy for household wealth [^12^].

#### 13. Metropolitan Electricity Authority (MEA) / PEA Smart Grid
- **URL**: `https://www.mea.co.th/` (MEA - Bangkok only); `https://www.pea.co.th/` (PEA - rest of Thailand)
- **Data available**: Power outage data (SAIDI/SAIFI), smart meter data, electricity demand forecasts, renewable energy integration data.
- **Geographic granularity**: Provincial, Area, National
- **Access method**: Annual reports; some data via PEA customer service
- **Update frequency**: Real-time (outage data); Annual reports
- **Relevance to Yala**: PEA manages all electricity distribution in Yala. Outage data and reliability metrics relevant for municipal planning.

#### 14. Department of Public Works and Town & Country Planning (DPT)
- **URL**: `https://www.dpt.go.th/`
- **Data available**: Building permits, construction licenses, urban planning maps, zoning regulations, land use plans. Construction permits mandatory for new builds, renovations, and demolitions under Building Control Act and Town Planning Act B.E. 2518 (1975).
- **Geographic granularity**: Municipal/District, Provincial, National
- **Access method**: Applications via local municipality office (OrBorTor). Zoning maps available at DPT provincial office.
- **Update frequency**: Real-time (permit applications); Annual statistics
- **Relevance to Yala**: Yala City Municipality issues building permits. DPT provincial office in Yala maintains urban planning maps. In 2025, Thailand tracked 241,225 construction units nationally. Permit data indicates construction activity and development trends in Yala city.

#### 15. Waste Management Data - Department of Local Administration (DLA)
- **URL**: `https://www.dla.go.th/` (implied)
- **Data available**: Municipal solid waste generation (24.98 million tons/year nationwide in 2022), waste disposal methods (sanitary landfills: 116 sites, dumpsites: 1,707), waste utilization (7.98 million tons), remaining waste (4.25 million tons), waste management expenditure (2,800 million baht/year).
- **Geographic granularity**: Municipality, Provincial, National
- **Access method**: Reports from DLA; Yala City Municipality publishes garbage collection data on smart city platform [^1^]
- **Update frequency**: Annual
- **Relevance to Yala**: Yala City Municipality publishes downloadable garbage collection datasets covering general and infectious solid waste storage/disposal [^1^]. Yala has ~80,000 population. Waste management remains challenging - no sanitary landfill, composting plant, or incinerator existed historically [^13^]. Community-based waste separation programs ("Garbage for Eggs") tested in Yala [^14^].

---

### Economic Data Sources

#### 16. Department of Business Development (DBD) - Data Warehouse
- **URL**: `https://datawarehouse.dbd.go.th/` ; `https://www.dbd.go.th/`
- **Data available**: Company registration data (all juristic persons), business status, registered capital, directors/shareholders, financial statements (balance sheet, P/L - up to 9 years), business objectives, branch locations, foreign business licenses. DBD Biz Regist digital platform launched July 2025 for fully electronic registration.
- **Geographic granularity**: Company-level (with provincial address), Provincial aggregated statistics, National
- **Access method**: Free public web search by company name or 13-digit Tax ID. No registration required. English and Thai versions available. Data downloadable in PDF or Excel.
- **Update frequency**: Real-time (registration changes); Financial data updated annually
- **Relevance to Yala**: All businesses registered in Yala Province searchable. Key for understanding local economic structure, business density, investment flows, and employment. DBD data on Yala businesses can identify dominant sectors and economic trends.

#### 17. National Statistical Office (NSO) - Labor Force Survey
- **URL**: `https://www.nso.go.th/` ; Labor force data via Bank of Thailand: `https://app.bot.or.th/BTWS_STAT/`
- **Data available**: Quarterly Labor Force Survey with employment by sector (agriculture, manufacturing, construction, wholesale/retail, transportation, etc.), unemployment, underemployment, labor force participation. Population 15 years and over: ~19.1 million; Labor force: ~13.9 million; Employment: ~13.75 million.
- **Geographic granularity**: National, Regional, Provincial
- **Access method**: Public data portal and BOT statistics page
- **Update frequency**: Quarterly
- **Relevance to Yala**: Provincial-level labor force data for Yala available. ILO report on Yala labor market shows economy driven by agriculture (35% GPP, high employment share) and wholesale/retail [^15^]. Youth employment challenges significant - labor supply projected to contract 5.5% between 2023-2027.

#### 18. ILO Yala Labor Market Analysis
- **URL**: `https://www.ilo.org/media/534141/download`
- **Data available**: Comprehensive labor market situation analysis for Yala including demographics, employment by sector (agriculture 35%, wholesale/retail high share), occupational skill levels, job vacancies (average 444/quarter), youth unemployment, education/training gaps.
- **Geographic granularity**: Provincial
- **Access method**: Public PDF report (2022)
- **Update frequency**: One-time report (2022) with projections to 2027
- **Relevance to Yala**: Most detailed labor market analysis available for Yala. Key findings: agriculture and wholesale/retail dominate; limited job vacancies; youth (especially males) prefer religious study over vocational training; labor supply expected to contract 5.5% by 2027.

#### 19. Department of Employment - Job Vacancy Data
- **URL**: `https://www.doe.go.th/` (implied)
- **Data available**: Job vacancy registrations by sector, job seeker registrations, employment services utilization.
- **Geographic granularity**: Provincial Employment Office, National
- **Access method**: Employment office data; some via NSO integration
- **Update frequency**: Monthly/Quarterly
- **Relevance to Yala**: Yala Employment Office data on job vacancies available. Average 444 vacancies per quarter between Q1 2020-Q1 2023, with agriculture accounting for ~50% [^15^].

---

### Environmental Data Sources

#### 20. Pollution Control Department (PCD) - air4thai
- **URL**: `https://air4thai.pcd.go.th/` (Web); Mobile app "Air4Thai"
- **Data available**: Real-time air quality monitoring for PM2.5, PM10, O3, CO, NO2, SO2. 77 monitoring stations across 46 provinces. National Ambient Air Quality Standards: PM2.5 24-hr limit 37.5 ug/m3 (updated June 2023), annual 15 ug/m3. Historical data available.
- **Geographic granularity**: Monitoring station (individual), Provincial, Regional, National
- **Access method**: Free public web and mobile app. Real-time data with 3-day forecasts for some areas.
- **Update frequency**: Hourly (real-time); Historical data updated daily
- **Relevance to Yala**: Yala City Municipality's smart city platform publishes PM2.5 level data from PCD's Air Quality and Noise Management Division [^1^]. PCD monitoring station data critical for Yala municipal air quality management.

#### 21. GISTDA Sphere - Open Geo-spatial Platform
- **URL**: `https://sphere.gistda.or.th/`
- **Data available**: PM2.5 satellite monitoring (hourly), flood monitoring (`flood.gistda.or.th`), forest fire tracking (`fire.gistda.or.th`), drought monitoring (`drought.gistda.or.th`), agricultural monitoring (GISAgro), forest encroachment, oil spill monitoring, coastal radar, solar potential maps, COVID-19 iMap, road traffic injury data, poverty maps. Uses NASA GEOS model and satellite data (MODIS, VIIRS, THEOS).
- **Geographic granularity**: Point, District, Provincial, National, Regional (Mekong)
- **Access method**: Free public web platform; Map APIs available; QGIS plugin for base maps
- **Update frequency**: Near real-time (hourly for PM2.5); Daily/semi-automatic for disaster monitoring
- **Relevance to Yala**: GISTDA's PM2.5 management platform provides complete coverage of Thailand including Yala. Flood monitoring critical during monsoon season - southern Thailand experienced severe flooding in November 2025 affecting Yala among 12 provinces [^16^]. Sphere integrates air4thai data for comprehensive environmental monitoring.

#### 22. Department of Disaster Prevention and Mitigation (DDPM)
- **URL**: `https://www.disaster.go.th/` (implied); `https://adinet.ahacentre.org/` (ASEAN Disaster Information Network)
- **Data available**: Disaster statistics (floods, landslides, storms, droughts, fires, tsunamis) with 49+ indicators: affected persons, deaths, injuries, damaged houses, damaged infrastructure (dams, bridges, roads), economic losses, assistance provided. Provincial flood emergency response plans. 2,137 waste disposal sites catalogued nationally.
- **Geographic granularity**: Village, Sub-district, District, Provincial, National
- **Access method**: Emergency Disaster Report format (local to provincial); Disaster Data Center System (internal DDPM); Some data via ASEAN Disaster Information Network (ADINet)
- **Update frequency**: Real-time (during events); Annual compilation
- **Relevance to Yala**: Yala experienced severe flooding in November 2025 affecting 12 southern provinces [^16^]. DDPM collects disaster data at district/sub-district level. Key for Yala municipal disaster risk reduction and emergency planning. Flood statistics available by village (Province-level).

#### 23. Thai Meteorological Department (TMD)
- **URL**: `https://www.tmd.go.th/` (main); `https://data.tmd.go.th/api/index1.php` (API)
- **Data available**: Daily weather observations (07:00), 3-hourly measurements, 7-day forecasts by province, monthly rainfall data, climate normals (1981-2010), seismic events, weather warnings, seasonal forecasts. Available via TMD API requiring registration.
- **Geographic granularity**: Weather station, Provincial, Regional, National
- **Access method**: Free public website; API access requires registration at `data.tmd.go.th/api/registerPre.php`; also available via `envilink.go.th` open data portal
- **Update frequency**: Hourly to daily (observations); 4x daily (forecasts)
- **Relevance to Yala**: TMD weather stations in southern Thailand provide rainfall, temperature, and humidity data for Yala. Critical for flood early warning, agricultural planning, and heat health action plans. Climate normals provide baseline for Yala's climate characteristics.

#### 24. Royal Irrigation Department (RID)
- **URL**: `https://www.rid.go.th/` (implied)
- **Data available**: River water levels, reservoir levels, irrigation water allocation, water discharge rates, drought indices.
- **Geographic granularity**: Station (gauge), River basin, Provincial, National
- **Access method**: Public website; some data via GISTDA flood monitoring integration
- **Update frequency**: Daily (water levels); Real-time during floods
- **Relevance to Yala**: RID data on water resources in Yala province critical for flood management (especially during monsoon) and agricultural water planning.

---

### Trends & Signals

- **Smart City Data Democratization**: Yala City Municipality's `citydata.in.th` platform (funded by depa - Digital Economy Promotion Agency) represents a pioneering effort to publish municipal data as downloadable open datasets. This model is being replicated across Thailand's smart cities. The platform covers 15+ data categories directly relevant to municipal management [^1^].

- **Digital Disease Surveillance Maturation**: Thailand transitioned from paper-based 506 reporting to fully digital DDS. National coverage reached 90.25% of hospitals with 92.94% timeliness in 2025, exceeding targets [^4^]. However, data fragmentation between MOPH, NHSO, SSO, and local government systems remains a challenge [^17^].

- **GISTDA Earth Observation Integration**: GISTDA's Sphere platform, THEOS-2 satellite, and AI/ML integration provide near real-time environmental monitoring at unprecedented scale. PM2.5 satellite monitoring now covers all of Thailand hourly, complementing ground station networks [^8^].

- **Educational Disparity in Southern Border Provinces**: Yala's formal education enrollment rate (44.2%) is dramatically below the national average (79.3%) [^11^]. Vaccine hesitancy in southern provinces (Yala, Pattani, Narathiwat, Songkhla) has led to concentrated measles outbreaks, with >94% of confirmed cases unvaccinated or unknown status [^18^].

- **Energy Consumption as Wealth Proxy**: PEA billing data research demonstrates that electricity consumption correlates 83% with household expenditure, providing a high-resolution proxy for wealth inequality at postal-code level [^12^]. This data could be leveraged for Yala municipal poverty targeting.

- **Waste Management Transition**: Thailand generates 24.98 million tons of municipal solid waste annually, with only 5.43% disposed at sanitary landfills [^19^]. Yala municipality has been a pioneer in community-based waste separation ("Garbage for Eggs" program), though long-term sustainability remains challenging [^14^].

- **Labor Market Contraction**: Yala's labor supply is projected to contract 5.5% between 2023-2027, with disproportionate declines in higher-education workers (-5.8%) [^15^]. Water supply and waste management sectors are projected to grow (+10.3%), while construction and education decline.

---

### Controversies & Limitations

- **Data Integration Challenges**: The Health Data Center acknowledged that "other data sources, such as local government systems or private software used by some hospitals, are not integrated. This fragmentation prevents us from consolidating nationwide data into a single system" [^17^]. NHSO data "has not been linked with other agencies to shape broader public health strategies" [^20^].

- **Measles Outbreaks in Southern Provinces**: Vaccine hesitancy in Yala and neighboring provinces has created a persistent public health challenge. In 2024, 10,496 suspected measles cases were reported nationally, with 4,397 laboratory-confirmed. Yala, Pattani, Narathiwat, and Songkhla bore the highest burden. 205 outbreaks occurred, concentrated in schools, hospitals, and factories [^18^].

- **Disaster Data Standardization Gaps**: DDPM disaster statistics face challenges: "Data collected by different agencies are not fully standardized or integrated. Some datasets are incomplete, inconsistent, or not updated regularly. There is a shortage of trained personnel in data management at local levels. A fully integrated national disaster data center has not yet been established" [^10^].

- **Education System Fragmentation**: The presence of both Thai-medium government schools and Malay-medium Islamic schools (pondok) creates parallel education systems with limited data integration. Islamic schools are regulated by OPEC, not OBEC, making comprehensive education statistics for Yala incomplete.

- **DBD Data Currency**: Not all companies file financial statements on time. Companies with outdated financial statements (e.g., 2018 latest in 2024) are flagged as higher risk [^7^]. Some ownership data, particularly for limited companies, remains incomplete.

- **Air Quality Monitoring Gaps**: While PCD operates 77 stations across 46 provinces, Yala province may have limited ground monitoring. GISTDA satellite data complements but does not fully substitute ground measurements for municipal-level air quality management.

- **Waste Data Incomplete**: Only 5.43% of Thailand's 2,137 waste disposal sites are sanitary landfills. Yala municipality's data on smart city platform represents a positive step, but national waste data lacks comprehensive municipal-level coverage [^19^].

---

### Recommended Deep-Dive Areas

1. **Yala City Municipality Smart City Data Platform (`citydata.in.th`)**: This is the most directly relevant data source for Yala municipal management. It already publishes 15+ downloadable datasets. A deep dive should catalog all available datasets, their update frequency, data formats, and gaps that need to be filled from national sources.

2. **NHSO Health Service Utilization Data for Yala**: NHSO manages detailed beneficiary-level data on health service utilization under UCS. Understanding Yala-specific utilization patterns, provider networks, and health outcomes would be critical for municipal health planning. Data access may require formal request to NHSO.

3. **EMIS School-Level Data for Yala Municipality**: EMIS contains comprehensive data on every OBEC school including enrollment, teachers, infrastructure, and GIS coordinates. Extracting Yala municipality-specific data would enable education planning and school resource allocation.

4. **PEA Electricity Consumption Data for Yala**: PEA's billing data provides high-resolution proxies for household wealth and economic activity at the municipality level. Research collaboration with PEA could unlock valuable socioeconomic indicators.

5. **GISTDA Sphere + air4thai Environmental Integration**: The combination of GISTDA satellite data and PCD ground monitoring provides comprehensive environmental data for Yala. A deep dive should map available environmental datasets (air quality, flood, drought, forest fire) to Yala's specific needs.

6. **Islamic Private Schools (Pondok) Data**: Given Yala's predominantly Malay-Muslim population and the low formal education enrollment rate (44.2% vs. 79.3% national), understanding the role and scale of private Islamic education institutions is critical. OPEC data combined with field surveys needed.

7. **DDPM Disaster Risk Data for Yala**: Yala's exposure to floods (as demonstrated by November 2025 events), landslides, and forest fires requires detailed disaster risk assessment. DDPM's village-level disaster statistics and TMD climate data should be integrated for Yala's disaster risk reduction planning.

8. **DBD Business Registration Data for Yala**: DBD Data Warehouse enables analysis of all registered businesses in Yala province. Sectoral composition, business registrations/dissolutions, and capital investment patterns would inform economic development strategy.

---

### Source List

[^1^] Yala City Municipality Smart City Data Platform. Public Dashboard. https://www.citydata.in.th/yala-city-municipality/en/dashboard-public-en/

[^2^] National Health Security Office (NHSO), Thailand. Overview of Universal Health Coverage. https://www.boi.go.th/upload/content/20230727EN_NHSO.pdf

[^3^] Ministry of Public Health Open Data Portal. https://opendata.moph.go.th/

[^4^] Bureau of Epidemiology, Department of Disease Control. Epidemiological Surveillance Report and BOE Apps. https://apps-doe.moph.go.th/boeeng/ ; https://ddsdoe.ddc.moph.go.th/ddss/

[^5^] Office of Basic Education Commission (OBEC). Education Management Information System (EMIS). https://data.bopp-obec.info/emis/

[^6^] Provincial Electricity Authority (PEA). Annual Report 2024. https://www.pea.co.th/sites/default/files/annual-report/2025/PEA%20AR%202024_ai%20translation.pdf

[^7^] Department of Business Development (DBD). Data Warehouse. https://datawarehouse.dbd.go.th/ ; https://www.dbd.go.th/

[^8^] Geo-Informatics and Space Technology Development Agency (GISTDA). Sphere Platform. https://sphere.gistda.or.th/

[^9^] Pollution Control Department. Air4Thai Air Quality Monitoring. https://air4thai.pcd.go.th/

[^10^] Department of Disaster Prevention and Mitigation (DDPM). Disaster Data Center System and statistical framework. Source: UNSIAP Country Report on Disaster Statistics - Thailand.

[^11^] International Labour Organization (2022). Promoting Youth Employment in Songkhla and Yala, Thailand: A Situation Analysis. https://www.ilo.org/media/534141/download

[^12^] Apaitan, T. and Wibulpolprasert, W. (2018). Stylized Facts on Thailand's Residential Electricity Consumption: Evidence from the Provincial Electricity Authority. Puey Ungphakorn Institute for Economic Research Discussion Paper No. 107. https://www.pier.or.th/files/dp/pier_dp_107.pdf

[^13^] Yala Project, University of Calgary. Solid Waste Management in Yala. https://www.ucalgary.ca/ev/designresearch/projects/2000/cuc/tp/2.fact%20sheet%20yala%20project.pdf

[^14^] Community-based solid waste management initiative in Yala municipality. https://architexturez.net/doc/az-cf-198728

[^15^] ILO (2022). Yala Labour Market Analysis - Employment, job vacancies, and projections. In: Promoting Youth Employment in Songkhla and Yala.

[^16^] ASEAN Disaster Information Network (ADINet) / ECHO. Thailand Floods - Nov 2025. https://reliefweb.int/disaster/fl-2025-000209-tha

[^17^] Tobacco Induced Diseases (2025). Qualitative evaluation of Thailand's National Tobacco Control Strategy 2022-2027. https://www.tobaccoinduceddiseases.org/

[^18^] WHO (2025). Independent External Review of EPI-VPD Surveillance in Thailand. https://iris.who.int/

[^19^] Department of Local Administration (DLA), Ministry of Interior. Solid Waste Management Statistics 2022. https://www.iges.or.jp/sites/default/files/inline-files/14_P2.%20DLA%20Thailand.pdf

[^20^] TDRI (2025). Keeping Universal Healthcare Strong. https://tdri.or.th/en/2025/09/keeping-universal-healthcare-strong/

[^21^] PWA Water Utility Management. https://neda.or.th/2023//upload/download/file/file-1518421996216-Thai-562.pdf

[^22^] Thailand Meteorological Department. TMD API for weather data. https://data.tmd.go.th/api/index1.php ; https://www.tmd.go.th/

[^23^] Yala Primary Education Service Area Office 2. EMIS Data. https://data.bopp-obec.info/emis/school.php?Area_CODE=9502

[^24^] Bureau of Epidemiology. Annual Epidemiological Surveillance Report 2022 (Thai). https://apps-doe.moph.go.th/boeeng/annual.php

[^25^] Health Data Center (HDC) Service. https://hdcservice.moph.go.th/hdc/main/index.php

[^26^] GISTDA Sphere Open Geo-spatial Platform. https://sphere.gistda.or.th/terms

[^27^] Thailand Country Report on Disaster Statistics (UNSIAP). https://www.unsiap.or.jp/on_line/2025/DIS_KOR/Country_Thailand.pdf

[^28^] DBD Data Warehouse Guide. https://corpusx.bol.co.th/blogs/how-to-use-dbd-datawarehouse/

[^29^] PCD air quality standards and PM2.5 management. https://apctt.org/sites/default/files/attachment/2024-02/Bangkok%20%28Report%201%29Technological%20Interventions%20and%20%20Gaps%20in%20Air%20Pollution%20Control%20in%20Bangkok%2C%20Thailand.pdf

[^30^] envilink.go.th - TMD weather data API portal. https://envilink.go.th/en/dataset/tmdapi-1
