# Data Source Bible for the City Municipality of Yala
## A Comprehensive Guide to APIs, Open Data, and Information Systems for Geographic Dashboards and Data-Driven Governance

**Date:** June 2026
**Prepared for:** Mayor and Leadership Team, City Municipality of Yala (เทศบาลนครยะลา), Southern Thailand

---

## Executive Summary

Yala City Municipality (เทศบาลนครยะลา) operates one of Thailand's most digitally mature local government platforms. The YALA Resilience City ecosystem — comprising a dual-dashboard system at yaladashboard.com, five integrated big data systems, and 15 published datasets on the DEPA Smart City Data Platform — has earned three consecutive Digital Government Awards (2022–2024) and an Integrity and Transparency Assessment (ITA) score of 91.21 (Grade A, 9th of 65 Local Administrative Organizations in Yala Province).[^1^][^2^] Yet this operational sophistication masks a structural limitation that this bible is designed to address: the municipality tracks *process* with precision — budget execution, water consumption, complaint resolution — but remains largely blind to *developmental outcomes* — poverty reduced, education improved, health enhanced, climate risk mitigated.

This document catalogs **200+ data sources across 12 governance domains**, providing API endpoints, access methods, authentication requirements, and integration priorities. It identifies a central paradox: Yala is **data-rich in operational metrics** (19+ dashboard modules, 5 big data systems, 83% reduction in problem resolution time)[^1^] **but information-poor in outcome indicators** (20.83% MPI poverty rate absent from the dashboard, education HAI rank 66th not visualized, 9.6% mental health prevalence unmonitored, three catastrophic floods since 2022 without predictive integration).[^3^][^4^][^5^] Closing this gap does not require building new systems. It requires connecting existing municipal infrastructure to free national platforms and international open data sources that are already operational but underutilized.

### Yala's Digital Maturity — A Quick Assessment

The table below positions Yala Municipality across eight dimensions of digital governance maturity. Strengths concentrate in transparency and operational digitization; gaps cluster in outcome measurement, predictive analytics, and cross-agency data integration.

| Dimension | Current State | Evidence | Gap Severity |
|---|---|---|---|
| **Dashboard infrastructure** | Dual-dashboard (Mayor + Citizen); 19+ modules; mobile app; LINE OA | 3 consecutive DGA awards (2022–2024); yaladashboard.com operational[^1^] | Low — foundation is strong |
| **Operational data** | Budget, water, complaints, waste, carbon, WiFi, elderly/disability registrations tracked in real time | 5 big data systems (CDDP, Bellme, Smart Tax, Smart Permit, Disaster Mgmt)[^1^] | Low — process digitization is mature |
| **Transparency performance** | ITA 91.21 (Grade A); LPA 87.87 (Very Good); 15 datasets on DEPA CityData | Rank #9 of 65 LAOs in province; e-LAAS confirmed in use[^2^] | Low — disclosure exceeds most peers |
| **Poverty & welfare data** | No MPI poverty mapping; no TPMAP integration; no welfare recipient analytics | 20.83% provincial MPI poverty (208,274 persons) not on dashboard[^3^] | **High** — outcome data entirely absent |
| **Education outcomes** | O-NET displayed as single municipal average; no school-level drill-down | HAI education rank 66th; 30.8% NEET; 161 pondok institutions unmapped[^4^] | **High** — dual-system blind spot |
| **Health disparities** | COVID vaccination only; no disease prevalence, mental health, or workforce data | 9.6% mental health prevalence; 9 psychiatrists for 552,479 people[^5^] | **High** — health equity invisible |
| **Climate risk** | PM2.5 tracked; no flood forecasting, rainfall trends, or dam monitoring | 3 catastrophic floods 2022–2024 (18,000+ households); GISTDA flood API available but unused[^6^] | **High** — reactive not predictive |
| **National integration** | Standalone vendor systems (Bedrock Analytics); no GDX, GDCC, or DOPA API use | GDX connects 194 agencies; GDCC hosts 3,065 systems free; DOPA API offers real-time population data[^7^] | **High** — interoperability unrealized |

The pattern is clear: Yala has invested successfully in the *presentation layer* of digital government — dashboards, awards, and citizen-facing applications — but has not yet connected this infrastructure to the *outcome data layer* that would transform display into decision support. The municipality knows how fast complaints are resolved (1 day 4 hours) but not whether resolution reduced repeat complaints. It knows water consumption (497,838 m³/month) but not whether consumption patterns correlate with poverty density by tambon. It knows the elderly population count but not the 10–20 year service demand forecast that WorldPop projections could provide.[^3^][^5^]

### Priority Integration Matrix

The following matrix organizes integration opportunities by timeline, required action, and expected outcome. Immediate priorities (0–3 months) require no external partnership and deliver value through free national resources. Short-term priorities (3–6 months) involve formal inter-agency registration. Medium-term priorities (6–12 months) require system development or multi-party coordination.

| Timeline | Action | Data Sources / APIs | Responsible Unit | Expected Outcome |
|---|---|---|---|---|
| **Immediate (0–3 months)** | Register for GDCC free cloud IaaS; deploy PostgreSQL + PostGIS test instance | GDCC (gdcc.go.th); ISO 27001/27701 certified; 219 agencies hosted[^7^] | Strategy Division (กองยุทธศาสตร์) | Eliminates vendor hosting dependency; provides TH-e-GIF compliant infrastructure |
| **Immediate (0–3 months)** | Activate GDX inter-agency data exchange access | GDX (gdx.dga.or.th); 194 agencies; 35.3M+ linkages/year; OAuth 2.0 auth[^7^] | Strategy Division + Municipal Clerk | Automated DOPA population pulls; DBD business registration access |
| **Immediate (0–3 months)** | Expand DEPA CityData to full CKAN API harvesting | citydata.in.th; CKAN API; 15 datasets currently published[^1^] | Strategy Division (Statistics, Data and IT Unit) | Programmable dataset access; federation to data.go.th |
| **Immediate (0–3 months)** | Integrate DOPA population data API via GDX | stat.bora.dopa.go.th; api.egov.go.th/ws/dopa/; 552,479 provincial registration[^3^] | Strategy Division | Real-time population counts by tambon; eliminates manual data entry |
| **Short-term (3–6 months)** | Integrate GISTDA Sphere geospatial services (WMS/WMTS/REST) | sphere.gistda.or.th; free API key; flood/fire/drought/PM2.5 layers[^6^] | Strategy Division + Engineering Bureau | Base map upgrade; real-time flood extent overlay; climate resilience module |
| **Short-term (3–6 months)** | Layer TPMAP poverty data onto dashboard | tpmap.in.th; 20.83% MPI rate; tambon/village drill-down[^3^] | Social Welfare Division + Strategy Division | Poverty-aware service planning; welfare targeting by geographic need |
| **Short-term (3–6 months)** | Integrate MOPH HDC health indicators | hdcservice.moph.go.th; 43 standard data files; opendata.moph.go.th[^5^] | Public Health Bureau | Disease prevalence mapping; health workforce gap visualization |
| **Short-term (3–6 months)** | Connect NSO StatHub SDMX feeds for auto-statistical updates | stathub.nso.go.th; SDMX 2.1 API; 100+ dataflows; Power BI direct connect[^8^] | Strategy Division | Automated refresh of labor force, income, demographic indicators |
| **Medium-term (6–12 months)** | Build climate risk modeling module (GloFAS + CHIRPS + Bang Lang Dam) | flood-api.open-meteo.com; CHIRPS (GEE); thaiwater.net (hourly dam telemetry)[^6^] | Strategy Division + Engineering Bureau | 24–48 hour predictive flood warning; rainfall trend analysis (1981–present) |
| **Medium-term (6–12 months)** | Deploy pondok education GIS mapping (ODK field collection) | ODK Collect; OPEC registry; 161 institutions (126 registered + 35 unregistered)[^4^] | Education Bureau + Strategy Division | Complete educational landscape map; accurate youth enrollment data |
| **Medium-term (6–12 months)** | Establish border trade analytics for Betong economy | DFT customs data; IB crossing estimates (400–2,000/day); IOM mobility data[^9^] | Strategy Division + Mayor's Office | Trade volume dashboard; infrastructure demand planning |
| **Medium-term (6–12 months)** | Implement predictive aging service demand model | WorldPop 100m projections (2000–2030); DOPA trends; NHSO elderly health data[^3^][^5^] | Social Welfare Division + Strategy Division | 10–20 year elderly care demand forecast; service gap identification |

The immediate-phase actions collectively require **zero budget allocation beyond existing staff time** — GDCC, GDX, DEPA CityData CKAN, and DOPA API are all free government services. The sole prerequisite is registration and configuration, which the Strategy Division's Statistics, Data and IT Unit can execute within its existing mandate. The Digital Government Development Agency (DGA) provides registration support at 02-612-6060; NSO Yala Provincial Office is reachable at 073-212-703 for direct statistical partnership.[^7^][^8^]

This bible provides the technical specifications for every integration listed above: base URLs, authentication methods, endpoint documentation, data structure definitions, PDPA compliance requirements, and reference architectures validated at Phuket, Hat Yai, and Khon Kaen smart city implementations.[^10^] The recommended technology stack — PostgreSQL + PostGIS + TimescaleDB for data, GeoNode for spatial infrastructure, CKAN Open-D for catalog, Kong Gateway for API management, and Metabase for visualization — is fully open-source, deployable on GDCC's free tier, and TH-e-GIF v2.0 compliant.[^10^] All 12 subsequent chapters contain the detailed source catalogs, access instructions, and analytical frameworks that operationalize this roadmap.


---

## 1. Yala's Digital Foundation — Current Infrastructure and Gaps

Yala City Municipality (เทศบาลนครยะลา) operates one of Thailand's most digitally mature local government infrastructures. Under Mayor Pongsak Yingchoncharoen's leadership since 2019, the municipality has deployed the **YALA Resilience City** ecosystem — a dual-dashboard system, five integrated big data platforms, multi-channel citizen engagement tools, and open data publishing on the Digital Economy Promotion Agency (DEPA) Smart City Data Platform.[^1^] Yet this operational sophistication masks a structural limitation: the infrastructure excels at tracking *process* (budget spent, complaints resolved, water delivered) while remaining largely blind to *outcomes* (poverty reduced, education improved, health enhanced). This chapter inventories what Yala has built and identifies the gaps that subsequent chapters map to external data sources.

### 1.1 Existing Dashboard Systems

#### 1.1.1 YALA Resilience City Platform Architecture

The municipality's digital core is a dual-dashboard system at **yaladashboard.com**. The **Mayor Dashboard** provides executives with drill-down budget analytics, property-level tax mapping with AI predictions, GIS-based complaint routing, and predictive disaster analytics.[^2^] The **Citizen Dashboard** offers public access to summary statistics across four categories: municipal data, quality of life, population, and services.[^3^] Access channels include the LINE Official Account **@yalacity**, the Yala Mobile Application (Android/iOS), and direct web access.[^4^] A Facebook Messenger chatbot shares a unified backend with the LINE OA, feeding interaction data to the Strategy Division.[^5^]

The platform has won the **Digital Government Awards (DGTi)** for three consecutive years (2022, 2023, 2024), including the "Excellent" (ยอดเยี่ยม) classification.[^6^] Problem resolution time fell from 9 days 7 hours to 1 day 4 hours (83 percent reduction), attributed to the Bellme system's GPS-based routing.[^7^]

#### 1.1.2 DEPA CityData Platform Integration

Yala publishes **15 downloadable datasets** on the DEPA Smart City Data Platform at **citydata.in.th**, classified across four smart city dimensions: Smart Economy, Smart Environment, Smart Governance, and Smart Living.[^8^] Datasets cover municipal boundaries, tax information, budget income and expenses, public health service usage, online service statistics, WiFi signal points (48 locations), complaint system data, elderly and disability registrations, population data, waste collection, carbon absorption, water supply consumption, green area proportions, and PM2.5 levels.[^9^] All are published as downloadable files; API harvesting via CKAN is not currently implemented — a gap discussed in Section 1.3.4.

#### 1.1.3 Five Big Data Systems

Through partnership with Bedrock Analytics Co., Ltd., Yala developed five integrated big data systems using drone surveys and mobile mapping systems (MMS) for data collection:[^10^]

| System | Purpose | Data Sources | Status |
|--------|---------|-------------|--------|
| City Digital Data Platform (CDDP) | Central data collection, storage, and visualization | All 9 municipal departments | Operational [^10^] |
| Disaster Management System | Predictive analytics and emergency response coordination | Weather, GIS, population data | Operational [^10^] |
| Bellme Complaint & Incident System | Citizen complaint submission with GPS coordinates, auto-routing, status tracking | Mobile app, LINE OA, Facebook | Operational [^7^] |
| Smart Municipal Tax System | Land/building/billboard survey with AI-assisted tax assessment | Drone imagery, MMS, GIS | Operational [^10^] |
| Smart Building Permit System | End-to-end online permit application with AI-assisted review | Application forms, GIS, regulations | Operational [^10^] |

These systems were developed as vendor-built standalone platforms rather than integrations with national infrastructure — a dependency risk discussed in Section 1.3.4. Data collection spans drones (full 19.4 km²), MMS (all roads), manual entry, LINE OA interactions, and mobile app submissions.[^11^]

#### 1.1.4 Performance Metrics

Yala's transparency performance is quantified through the National Anti-Corruption Commission (NACC) Integrity and Transparency Assessment (ITA). For fiscal year 2024, the municipality scored **91.21** (Grade A, ผ่าน), ranking **9th of 65 Local Administrative Organizations (LAOs)** in Yala Province.[^12^] The Local Performance Assessment (LPA) score stood at 87.87 (Very Good), though the LPA dashboard page on yaladashboard.com was inactive at the time of research.[^13^]

### 1.2 Municipal Data Responsibilities and Structure

#### 1.2.1 Thesaban Nakhon Governance Structure

Yala City Municipality is a **Thesaban Nakhon** (City Municipality), the highest tier of Thai local government, covering **19.4 km²** encompassing Tambon Sateng (ตำบลสะเตง).[^14^] The registered population as of FY2025 was **57,640 persons** (27,614 male, 30,026 female), though an alternative estimate of 60,291 persons has also been reported — the difference likely representing unregistered or temporary residents.[^15^]

The municipality is organized into **nine departments** — four bureaus (สำนัก) and five divisions (กอง):[^16^]

| Bureau/Division (Thai) | Bureau/Division (English) | Key Data Collections |
|------------------------|--------------------------|---------------------|
| สำนักสาธารณสุขและสิ่งแวดล้อม | Public Health & Environment Bureau | Health services, vaccination, sanitation |
| สำนักคลัง | Finance Bureau | Tax collection, budget execution, e-LAAS |
| สำนักช่าง | Engineering Bureau | Infrastructure, roads, drainage, works GIS |
| สำนักการศึกษา | Education Bureau | School data, O-NET scores, enrollment |
| สำนักปลัดเทศบาล | Municipal Clerk Bureau | Administration, council records, civil registration |
| กองยุทธศาสตร์และงบประมาณ | Strategy & Budget Division | Dashboard, IT systems, Smart City, open data [^16^] |
| กองการประปา | Water Supply Division | Water consumption, quality (NTU), billing |
| กองสวัสดิการสังคม | Social Welfare Division | Elderly/disability allowances, welfare recipients |
| กองการเจ้าหน้าที่ | Personnel Division | HR data, staff capacity |

#### 1.2.2 Mandatory Data Reporting

As a City Municipality, Yala must submit data to several national systems. The **e-LAAS** (Electronic Local Administrative Accounting System) manages revenue and expenditure transactions.[^17^] The **ITA** requires annual publication across 10 indicators with 28 sub-indicators.[^12^] The **LPA** evaluates all 7,800+ Thai LAOs across five dimensions with 70+ indicators.[^13^] Civil registration feeds into the Department of Provincial Administration (DOPA) national database.

#### 1.2.3 Budget Context

The FY2025 total budget is **1,190.53 million THB**: Community and Social Services (54.96%, 658.82M THB), Other Operations including IT (21.97%, 263.35M THB), General Administration (15.80%, 189.38M THB), and Economic Development (7.27%, 87.16M THB).[^18^] Tax revenue totaled **57.13 million THB** (~4.8 percent of the budget), meaning 60–70 percent of funding derives from central government transfers.[^19^] No dedicated IT budget line exists; ICT spending is embedded within "Other Operations." Estimated IT spending: 24–60 million THB annually (2–5 percent of total budget).

#### 1.2.4 Organizational Data Maturity

All IT functions are centralized within the **Strategy & Budget Division (กองยุทธศาสตร์และงบประมาณ)**, specifically within its Statistics, Data and IT Unit (ฝ่ายสถิติข้อมูลและสารสนเทศ).[^20^] The unit handles network maintenance, system administration (backend systems, mobile app, LINE OA), Smart City coordination, and video conferencing. The Director of the Strategy Division also serves as assistant to the provincial-level IT steering committee (PCIO).[^21^] No dedicated GIS team or data scientist role is identified; the municipality relies on Bedrock Analytics for data science and AI capabilities.[^22^] This concentration of technical expertise in a single unit creates a bottleneck risk: the loss of one or two key personnel could significantly impair system operations.

### 1.3 Gap Analysis — What the Dashboard Misses

#### 1.3.1 Operational-Outcome Divide

Yala's dashboard tracks **process metrics** with precision — budget execution, monthly water consumption (497,838 cubic meters), complaint resolution, waste tonnage, and carbon absorption (10,630.87 tons CO2e).[^23^] What it does not display are **developmental outcomes**: whether spending reduced poverty (20.83% MPI rate provincially), whether education interventions improved O-NET scores (municipal average 31.70 vs. national 35.38), or whether health services addressed the province's 9.6 percent mental health disorder prevalence.[^24^] The dashboard tells the administration *how* the city runs but not *how well* citizens thrive — the "Data Rich, Information Poor" paradox subsequent chapters address.

#### 1.3.2 Critical Data Gaps by Sector

The following table summarizes the most significant gaps between Yala's current digital capabilities and the data requirements for evidence-based municipal governance:

| Gap Category | Current State | Desired State | Priority |
|-------------|--------------|--------------|----------|
| Economic productivity | No business registration, market, or trade statistics on dashboard | Business count, OTOP sales, employment stats, GPP sectoral breakdown | High [^25^] |
| Education outcomes | O-NET scores displayed as single municipal average; no school-level or trend analysis | School-level performance, pondok enrollment mapping, literacy rates by sub-district | High [^24^] |
| Health disparities | COVID vaccination rate only; no disease prevalence, mental health, or facility capacity data | MOPH HDC indicators, DMH service coverage, health workforce density | High [^24^] |
| Climate risk | PM2.5 tracked; no flood hazard visualization, rainfall trends, or dam level monitoring | Real-time flood zones, CHIRPS rainfall integration, Bang Lang Dam levels | High [^26^] |
| Security data | No integration; data exists in DSW/ACLED but not used for development planning | Aggregated district-level impact metrics for health/education service planning | Medium [^27^] |
| Real-time transportation | Public transport module shows 0 trips — no GPS or passenger data feeds | Bus/van GPS tracking, passenger counting, route analytics | Critical [^25^] |
| Water billing integration | Separate platform (yala.kanam.tech); not connected to dashboard | Unified water data: production, consumption, billing, pipe network | High [^25^] |
| Tourism | No visitor statistics, hotel occupancy, or attraction analytics | Visitor counts, revenue, seasonal patterns for Yala and Betong | Medium [^25^] |
| Waste composition | Total tonnage only; no recycling rates or composition breakdown | Waste characterization, recycling rates, carbon footprint by source | Medium [^25^] |
| Cross-municipal sharing | No data exchange with Betong or Yala PAO | Regional southern border province dashboard with harmonized indicators | Low [^25^] |

#### 1.3.3 Technical Gaps

The public transport module has displayed **zero trips** across all vehicle categories (van, bus, air-conditioned bus, songthaew), indicating no real-time telemetry feeds.[^28^] Water billing data resides on a separate platform (yala.kanam.tech), disconnected from the central dashboard.[^29^] The Smart Building Permit System is operational but its pipeline data is not visible on either dashboard view.[^25^] No cross-municipal data sharing protocols exist with Betong Town Municipality (เทศบาลเมืองเบตง) or the Yala Provincial Administrative Organization (อบจ.ยะลา).[^30^]

#### 1.3.4 National Resource Underutilization

Several free national resources remain unutilized. The **Government Data Center and Cloud Service (GDCC)** provides free Infrastructure-as-a-Service (IaaS), ISO 27001/27701 certified, hosting 3,065 systems across 219 agencies.[^31^] The **Government Data Exchange (GDX)** connects 194 agencies for standardized API-based data sharing.[^32^] The **Government Data Catalog** aggregates 156 agency data catalogs.[^32^] The **DOPA API** offers programmatic access to population registration data that Yala currently enters manually.[^33^] Integrating these platforms would reduce vendor dependency and ensure interoperability — a roadmap developed in subsequent chapters.



---

## 2. National Government Data Infrastructure — The Open Data Ecosystem

Thailand's national digital government infrastructure constitutes a mature ecosystem of portals, APIs, and authentication frameworks coordinated by the Digital Government Development Agency (DGA, สำนักงานพัฒนารัฐบาลดิจิทัล). For Yala Municipality — which Insight 5 identified as underutilizing multiple free national resources despite possessing an operational dashboard and five big data systems — this infrastructure represents an immediate, zero-cost expansion path. The following sections catalog every portal, API endpoint, authentication method, and registration pathway relevant to municipal data integration.

### 2.1 Central Data Portals and Catalogs

#### 2.1.1 data.go.th — Thailand's CKAN-Based Open Data Portal

The Open Government Data of Thailand portal at https://data.go.th/ serves as the country's authoritative open data repository, hosting over 11,000 datasets from more than 150 government agencies. The platform runs on CKAN, providing a REST API at `https://opendata.data.go.th/api/3/action/` with endpoints for dataset listing (`package_list`), faceted search (`package_search`), organization discovery (`organization_list`), and resource queries (`resource_search`). All data is published under the EGA Open Government Licence. Access follows a tiered model: anonymous users receive 1,000 requests per day per IP, while registered users obtain API keys with elevated limits. For Yala Municipality, `package_search?q=Yala&rows=100` returns all Yala-related datasets, and `fq=organization:yala-city-municipality` filters to municipal publications. SDKs exist in Python (`ckanapi`), R (`thaigov`), and JavaScript. [^1^]

#### 2.1.2 GD Catalog — The Central Government Data Registry

The Government Data Catalog at https://gdcatalog.go.th/ operates as the union catalog of all government datasets, aggregating metadata from 156 agency-level catalogs (114 agency catalogs plus 76 provincial area catalogs). Its REST API at `https://api.gdcatalog.go.th/api/3/action/` mirrors CKAN conventions but adds OAuth2 authentication via Keycloak for restricted metadata. The catalog classifies approximately 97% of registered datasets as public and 3% as personal data. For Yala Municipality, GD Catalog reveals which agencies maintain Yala-relevant datasets not published on data.go.th, and its provincial Area Data Catalogs provide a pathway for registering Yala's own data holdings at the sub-national level. Documentation is available at https://gdhelppage.gdcatalog.go.th/. [^2^]

#### 2.1.3 Government Data Exchange (GDX) — Inter-Agency Data Sharing

GDX (ศูนย์แลกเปลี่ยนข้อมูลกลาง, https://gdx.dga.or.th/) connects 194 government agencies and processes over 35.3 million data linkages annually. It offers two access modes: Ready-to-Use (สำเร็จรูป), a web interface requiring no development for document verification; and API Integration via `https://api.egov.go.th/` for custom data flows into municipal systems. Through GDX, Yala Municipality can access population registration data from DOPA, business registration data from DBD, and cooperative data — all without requesting physical documents from citizens. Registration requires a DGA GovID account or OpenID, followed by agency verification and MOU execution, typically taking 1-3 months. [^3^]

#### 2.1.4 Government Spending Portal — Provincial Fiscal Transparency

The Government Spending portal at https://govspending.data.go.th/ publishes budget allocation and expenditure data at provincial granularity. Its API at `https://govspendingapi.data.go.th/api/service/` exposes endpoints for budget-by-agency (`bbagc`), expenditure tracking (`expense`), and procurement methods. Authentication uses tokens from https://api.data.go.th/ with a 1,000-request daily limit. Yala Municipality can query fiscal years 2559-2568 (2016-2025) to track central government spending in the province, compare budget rankings, and monitor disbursement patterns through drill-down map interfaces. [^4^]

| Portal | Base URL | API Endpoint | Authentication | Datasets / Agencies | Update Frequency | Access Tier |
|---|---|---|---|---|---|---|
| data.go.th | https://data.go.th/ | `opendata.data.go.th/api/3/action/` | API Key (optional) | 11,000+ / 150+ | Varies by agency | Public |
| GD Catalog | https://gdcatalog.go.th/ | `api.gdcatalog.go.th/api/3/action/` | OAuth2 + CKAN Key | 156 catalogs (114 agency + 76 provincial) | Daily/weekly harvest | Public + Restricted |
| GDX | https://gdx.dga.or.th/ | `api.egov.go.th/` | Consumer Key/Secret (OAuth 2.0) | 194 agencies / 35.3M+ linkages/year | Real-time | Government-only |
| GovSpending | https://govspending.data.go.th/ | `govspendingapi.data.go.th/api/service/` | API Token (shared) | Fiscal data 2016-2025 | Monthly (budget), Daily (procurement) | Public |

These four portals form a hierarchy of data access: data.go.th provides open discovery, GD Catalog offers comprehensive metadata aggregation, GDX enables authenticated inter-agency exchange, and GovSpending delivers fiscal transparency. Yala Municipality should register for all four — data.go.th and GovSpending registrations are self-service and immediate, while GDX requires agency verification. As documented in Insight 5, these free national resources remain underutilized by municipalities that instead build standalone vendor systems, increasing costs and creating data silos. [^5^]

### 2.2 Statistical Data Systems

#### 2.2.1 NSO Statistics Sharing Hub (StatHub) — SDMX 2.1 API

The NSO Statistics Sharing Hub at https://stathub.nso.go.th/ provides authoritative statistical data through an SDMX 2.1 (ISO 17369:2013) compliant API. The primary endpoint `https://ns1-stathub.nso.go.th/rest/` exposes dataflows (`/dataflow`), data queries (`/data/{dataflow}/{key}`), data structure definitions (`/datastructure`), and code lists (`/codelist`) for dimensional filtering. Over 100 dataflows cover economic, social, demographic, and environmental statistics with provincial disaggregation. Output formats include SDMX-ML, JSON, and CSV. The platform offers a Power BI direct connection via SDMX link, enabling non-technical staff to build dashboards without API programming. A secondary endpoint at `ns2-stathub.nso.go.th` provides redundancy. Most dataflows require no authentication. [^6^]

#### 2.2.2 NSO Yala Provincial Office — Direct Data Partnership

The NSO Yala Provincial Statistical Office at http://yala.nso.go.th/ serves as the authoritative local source for official statistics. Direct contact is available at 073-212-703; the central NSO service line is 0 2141 7500. The office conducts the Labor Force Survey (quarterly), Household Socio-Economic Survey (annual), Multiple Indicator Cluster Survey (MICS, covering Yala among 17 vulnerable provinces), Business and Industrial Census, and Survey of Older Persons. Provincial-level publications include the Yala Provincial Statistical Yearbook. Data requests typically require a formal letter from Yala Municipality for disaggregated data not available online; most government-use requests incur no cost. Establishing a direct data partnership with the Yala NSO office should be an early priority, as it enables access to subdistrict-level statistics and custom tabulations unavailable through national APIs. [^7^]

#### 2.2.3 2025 Population and Housing Census

Thailand's 2025 Population and Housing Census — the 12th population census and 6th housing census — represents a landmark transition to Digital Census methodology. Data collection proceeded under a Digital First Approach from April 1 (Census Day) through June 19, 2025. Preliminary national results announced in January 2026 recorded Thailand's resident population at 70.3 million across 26.30 million households, with a record-low growth rate of 0.42% and average household size declining to 2.5 persons. Provincial-level results for Yala are expected in the October-December 2025 window following NSO data processing. This decennial census provides subdistrict (ตำบล)-level granularity on population distribution, age and sex structure, religion, nationality, education, labor force participation, and housing characteristics. The census explicitly covered both Thai nationals and foreign residents based on actual place of residence, making it particularly relevant for Yala given its cross-border economy. [^8^]

#### 2.2.4 Household Socio-Economic Survey (SES)

The NSO conducts the Household Socio-Economic Survey annually, collecting income and expenditure data at provincial granularity. For Yala, the most recent available data indicate average monthly household income of 19,182 THB — approximately 32.2% below the national average of 28,308 THB/month. This disparity reflects the province's agriculture-dominated employment structure (61.8% of the workforce in agriculture) and lower service-sector wages. The SES data provides expenditure breakdowns by category (food, housing, education, health, transportation), enabling the municipality to calibrate social welfare programs, fee structures, and service pricing to local economic realities. [^9^]

| System | URL / Endpoint | Data Type | Authentication | Provincial Granularity | Update Frequency | Yala Contact |
|---|---|---|---|---|---|---|
| NSO StatHub (SDMX) | https://stathub.nso.go.th/ / `ns1-stathub.nso.go.th/rest/` | 100+ dataflows: population, labor, economy, health | None (public) | Province, district | Annual | — |
| NSO Yala Office | http://yala.nso.go.th/ | Custom tabulations, survey data, yearbooks | Direct request | Subdistrict | Quarterly (labor), Annual | 073-212-703 |
| 2025 Census | https://www.census.go.th/ | Full population and housing enumeration | Public release expected | Subdistrict | Decennial | Via NSO central |
| Household SES | Via StatHub + yala.nso.go.th | Income/expenditure by category | None (public) | Provincial | Annual | 073-212-703 |

The statistical infrastructure presents Yala Municipality with a dual-access model: automated API feeds from StatHub for regularly updated indicators, and direct partnerships with the Yala NSO office for granular, customized data. The upcoming 2025 Census provincial results will provide the most comprehensive demographic baseline in a decade and should be integrated into the municipal dashboard upon release. The SES income gap data (19,182 THB vs. 28,308 THB national) underscores the importance of poverty-informed service design documented in Chapter 4.

### 2.3 Authentication and Access Framework

#### 2.3.1 Thai National Digital ID (ThaiD)

ThaiD (ไทยดี), developed by BORA under DOPA, is Thailand's primary digital identity application. As of January 2025, more than 21.4 million citizens have onboarded. ThaiD provides three e-KYC levels: Level 1 (Card Verification — ID number + name + laser code matching, IAL 1.3), Level 2 (Face Verification — facial photo comparison, IAL 2.2), and Level 3 (Full ThaiD Authentication — app + face + ID chip, IAL 2.3). The broader Digital ID ecosystem across platforms (ThaiD, Tang Rath, Mor Prom, Pao Tang, and NDID) totals approximately 162.63 million cumulative accounts as of April 2026, supporting 1,797 government e-services. For Yala Municipality, ThaiD/DGA Digital ID integration enables citizen authentication for municipal services without building a custom identity system. The recommended pathway is through DGA Digital ID at https://connect.egov.go.th, which implements OAuth 2.0 / OpenID Connect. [^10^]

#### 2.3.2 NDID Platform — Distributed Identity Infrastructure

The National Digital ID (NDID) platform at https://ndid.co.th/ operates Thailand's decentralized digital identity ecosystem using distributed ledger (Tendermint blockchain) technology. As of 2026, the platform connects more than 150 participating organizations across banking, insurance, government, and telecommunications sectors, enabling eKYC, eConsent, and eSignature services. NDID allows citizens to authenticate across services without redundant registration — Identity Providers verify identity once, and Relying Parties accept the verification result. For municipalities, direct NDID integration requires registering as a Relying Party and implementing the full technical stack. The recommended municipal pathway is through DGA Digital ID, which mediates NDID, ThaiD, and D.DOPA authentication methods behind a single integration interface. [^11^]

#### 2.3.3 API Authentication Matrix

Thailand's government data ecosystem employs four distinct authentication patterns aligned to data sensitivity. Understanding this matrix is essential for Yala Municipality's IT planning, as different systems require different credential types, registration pathways, and implementation timelines.

| System Category | Authentication Method | Credential Type | Sensitivity Level | Implementation Complexity |
|---|---|---|---|---|
| Open data portals (data.go.th, GovSpending) | API Key | Self-generated token; 1,000 req/day limit | Public | Low — self-registration |
| Catalog systems (GD Catalog, DEPA CityData) | OAuth 2.0 + CKAN API Key | Agency-issued token after registration | Public + metadata restricted | Medium — agency verification |
| Inter-agency exchange (GDX, DOPA) | OAuth 2.0 + Consumer Key/Secret | DGA-issued credentials; IP whitelisting | Government-confidential | High — MOU + technical setup |
| Sensitive/citizen data (Land Department, high-assurance identity) | ThaiD / OpenID Connect | IAL 2.2+ verified identity; citizen consent | Personal data (PDPA-regulated) | High — DGA integration + PDPA compliance |

The progression from API Key to OpenID Connect with e-KYC mirrors the sensitivity gradient from public datasets to personal citizen data. All authentication involving personal data requires PDPA compliance — consent logging, data minimization, and retention policies — enforced since June 2022 with fines up to 5 million THB for unauthorized cross-border transfer. [^12^]

#### 2.3.4 Registration Requirements for Yala Municipality

| System | URL | Auth Method | Registration Process | Timeline | Prerequisites |
|---|---|---|---|---|---|
| data.go.th | https://opendata.data.go.th/ | API Key | Self-register → generate key → immediate use | 1 day | Valid email address |
| GovSpending | https://api.data.go.th/ | API Token | Register at shared token portal → select GovSpending scope | 1 day | data.go.th account |
| DEPA CityData | https://www.citydata.in.th/ | CKAN API Key | Use existing Yala portal → generate token in settings | 1 day | Existing municipal portal |
| GD Catalog | https://gdcatalog.go.th/ | OAuth2 + CKAN Key | Submit agency registration → DGA verification → key issuance | 1-2 weeks | Municipal letterhead, officer ID |
| GDX | https://gdx.dga.or.th/ | Consumer Key/Secret | DGA GovID/OpenID registration → agency details → approval → MOU | 1-3 months | GovID, municipal authorization, IP whitelist |
| DOPA API | https://api.egov.go.th/ | OAuth 2.0 + Consumer Key/Secret | Apply via https://dev.egov.go.th/ → agency form → credentials → IP whitelist | 2-4 weeks | GDX registration |
| DGA Digital ID | https://connect.egov.go.th | OpenID Connect | Contact DGA at 02-612-6060 → agency verification → integration | 2-4 weeks | Technical team |
| NSO StatHub | https://stathub.nso.go.th/ | None (public) | Direct API access; no registration | Immediate | — |
| NSO Yala Office | http://yala.nso.go.th/ | Direct contact | Call 073-212-703 → formal letter for custom data → partnership | 1-2 weeks | Official letter from Mayor |

Priority 1 systems — data.go.th, GovSpending, DEPA CityData, and NSO StatHub — require minimal or no registration and should be integrated within the first month. Priority 2 systems — GDX, DOPA API, and DGA Digital ID — require agency-level verification and MOU execution; these enable the highest-value integrations (real-time population data, citizen identity verification, automated inter-agency data flows) and should be initiated immediately given the 1-3 month lead time. The authentication framework documented here complies with TH-e-GIF v2.0 (Thailand e-Government Interoperability Framework), which mandates RESTful APIs, JSON, OAuth 2.0/OpenID Connect, HTTPS/TLS 1.2+, and OpenAPI 3.0 documentation — all mandatory under the Digital Government Development Plan 2025-2027. [^13^]


---

## 3. Population and Demographic Data Sources

Accurate population and demographic data form the analytical foundation of municipal governance. For Yala City Municipality, this layer is complicated by the distinction between provincial and municipal jurisdictional boundaries, multiple population counting methodologies, and a distinctive sociocultural composition that demands culturally responsive service planning. This chapter catalogues the authoritative sources the municipality should integrate, organized by function: core population registration and census data (Section 3.1), poverty and welfare analytics (Section 3.2), and social and cultural demographic indicators (Section 3.3).

### 3.1 Population Registration and Census Data

The Department of Provincial Administration (DOPA, กรมการปกครอง) maintains Thailand's civil registration database. The public statistics portal at `stat.bora.dopa.go.th` provides real-time registered population data disaggregated by province, district (amphoe), subdistrict (tambon), and municipality [^1^]. For Yala Province, the 2024 registration totals 552,479 persons across 180,582 households; Yala City Municipality accounts for 61,315 registered persons (29,242 male / 32,073 female) [^2^]. Monthly and annual downloads are available in Excel format. Registration data reflects *de jure* (legal residence) rather than *de facto* (physical presence) population—a distinction that matters given Yala's cross-border labour mobility.

The DOPA API, accessible via the Government Data Exchange (GDX) at `api.egov.go.th/ws/dopa/`, provides four tiers of identity verification: simple profile (name, ID number, birth date), normal (+ address), full (+ demographic details), and extra (+ additional attributes), plus household registration queries [^3^]. Authentication requires OAuth 2.0 with DGA-issued credentials; all queries require citizen consent under PDPA.

The 2025 Population and Housing Census, conducted April 1–June 19, 2025, represents Thailand's first complete enumeration in 15 years. Provincial-level results for Yala are expected October–December 2025 [^4^]. Historical 2010 census microdata—a 1% sample of 538,463 cases with 83 variables—remains available through the ILO Microdata Repository and IHSN catalog [^5^]. For spatial analysis, WorldPop provides 100-metre resolution gridded population estimates with age/sex disaggregation for 2015–2030 projections via HDX and Google Earth Engine [^6^].

| Data Source | Base URL | Granularity | Update Frequency | Authentication | Primary Use Case |
|-------------|----------|-------------|------------------|----------------|------------------|
| DOPA Statistics Portal | `stat.bora.dopa.go.th` | Municipal | Monthly/Annual | None (public) | Real-time registered population counts [^1^] |
| DOPA API (GDX) | `api.egov.go.th/ws/dopa/` | Individual | Real-time | OAuth 2.0 + DGA Consumer-Key | Identity verification for e-services [^3^] |
| 2025 Census (NSO) | `nso.go.th/nsoweb/main/summano/aE` | Subdistrict | Decadal | None (public) | Comprehensive demographic baseline; expected Oct–Dec 2025 [^4^] |
| Census 2010 Microdata | `ilo.org/microdata` | Individual (1% sample) | Static | Free registration | Historical demographic analysis [^5^] |
| WorldPop Gridded | `hub.worldpop.org` | 100m grid | Annual projections | None (public) | Spatial population mapping [^6^] |

Table 1 presents the five primary population data sources. DOPA registration data should serve as the operational baseline, while the 2025 Census will provide the most comprehensive demographic profile upon release. WorldPop fills the spatial analysis gap at finer resolution than administrative boundaries permit.

### 3.2 Poverty and Social Welfare Data

The Thai People Map and Analytics Platform (TPMAP, ระบบสารสนเทศเพื่อการขจัดความยากจนแบบแม่นยำ), developed by NECTEC/NSTDA in partnership with NESDB, applies a Multidimensional Poverty Index (MPI) across five dimensions using 36 million individual records updated annually [^7^]. For Yala Province, TPMAP reports an MPI poverty rate of 20.83%, affecting 208,274 persons. The public dashboard at `tpmap.in.th` enables drill-down to tambon and village levels; registered officials can access household-level views through the TPMAP Logbook module.

The State Welfare Card programme, administered by the Ministry of Finance through the Low-Income Earner Registration (LIER) database, recorded 143,351 welfare card holders in Yala as of 2022, with 248,144 participants in the Khon La Khrueng co-payment programme [^8^]. District-level breakdowns are available through the Provincial Social Development and Human Security Office.

The NESDB Human Achievement Index (HAI) provides a composite benchmark across eight dimensions. Yala ranks 11th nationally with a score of 0.6617 ("High"), though this masks severe disparities: Employment ranks 6th and Transport 9th, while Education ranks 66th [^9^]. The HAI is published at `nesdc.go.th/main.php?filename=develop_hai`.

The Community Development Department (CDD, กรมการพัฒนาชุมชน) Basic Minimum Needs (BMN, จปฐ.) survey feeds TPMAP's MPI calculation. In 2024, CDD staff surveyed 102,076 households across Yala using 38 indicators across five categories [^10^]. Raw data is accessible through `ebmn.cdd.go.th` (government login); processed results appear on TPMAP.

| Data Source | Base URL | Key Indicators | Geographic Level | Access Method |
|-------------|----------|----------------|------------------|---------------|
| TPMAP | `tpmap.in.th` | MPI poverty rate (20.83%), 5 deprivation dimensions | Village | Public dashboard; TPMAP Logbook for officials [^7^] |
| Welfare Card / LIER | `yala.nso.go.th` (visualizations) | 143,351 card holders; 248,144 Khon La Khrueng participants | District | Provincial Social Development Office request [^8^] |
| NESDB HAI | `nesdc.go.th/main.php?filename=develop_hai` | 8-dimension composite; Yala rank 11th (0.6617) | Provincial | Public website [^9^] |
| CDD BMN (จปฐ.) | `ebmn.cdd.go.th` | 38 indicators; 102,076 households surveyed (2024) | Village | Government login; Provincial CDD Office [^10^] |

Table 2 consolidates Yala's four principal poverty and welfare data sources. These systems operate as an integrated pipeline: CDD BMN collects household data, TPMAP processes it into MPI scores, and welfare card eligibility derives from the same indicators. Yala Municipality should establish a quarterly review comparing TPMAP poverty maps with municipal service coverage to identify underserved tambon.

### 3.3 Social and Cultural Demographics

Yala's demographic profile demands culturally responsive planning. The province is 79.6% Muslim, predominantly from the Patani Malay community that speaks Jawi as a first language [^11^]. Approximately 3,900 mosques are registered nationally with significant Yala concentration; mosque locations function as both religious institutions and community service delivery points. The Provincial Islamic Council of Yala (สภาอิสลามจังหวัดยะลา) maintains institutional records, though no centralized online database exists. Municipal planners should coordinate with the Council, as mosque committees serve as effective channels for public health outreach and welfare dissemination.

Yala entered "Aged Society" status in 2023, with an aging index of 55.09 [^12^]. NSO Yala reports 76,338 elderly persons (13.89%), of whom 58,312 (79.64%) receive elderly allowance payments [^13^]. Critically, 7,601 elderly (10.86%) live alone and 2,590 elderly couples care for each other without external support. The municipality should expand its current elderly allowance dashboard to include predictive modelling using WorldPop age-cohort projections linked with DOPA trends.

The Department of Empowerment of Persons with Disabilities registers 14,236 persons with disabilities in Yala as of June 2022: physical disability 46.1% (6,563), hearing/communication 15.2% (2,158), and psychiatric/behavioural 12.1% (1,727) [^14^]. Persons aged 60+ account for 36.0% of registered persons with disabilities. The IOM 2024 scoping study identified approximately 2,100 non-Thai residents in Yala, primarily from Myanmar (~1,400) and Cambodia (~370), including approximately 130 Myanmar Muslims/Rohingya of whom 110 were undocumented [^15^]. The Betong Point of Entry records 400–500 crossings on weekdays and approximately 2,000 on weekends [^15^]. Academic research found that 4.1% of adults in the Southern Border Provinces undertook first international migration to Malaysia between 2014–2016, with historical migration patterns and insurgency impacts driving cumulative outmigration [^16^].

| Domain | Key Indicators | Data Source | Access Method |
|--------|---------------|-------------|---------------|
| Religious Demographics | 79.6% Muslim; ~3,900 mosques nationally | Provincial Islamic Council; Provincial Administration | Direct coordination with สภาอิสลามจังหวัดยะลา [^11^] |
| Aging Society | 76,338 elderly (13.89%); aging index 55.09 | NSO Yala; DOPA | `yala.nso.go.th/images/plan/Elder_2568_Analysis.pdf` [^12^] [^13^] |
| Disability | 14,236 registered PWDs; 46.1% physical | DEP / Provincial Social Development Office | Provincial Social Development Office request [^14^] |
| Migration & Cross-Border | ~2,100 non-Thai residents; Betong 400–2,000 crossings/day | IOM Thailand; Immigration Bureau; NSO | `thailand.iom.int` (2024 report) [^15^] [^16^] |

Table 3 summarizes the social and cultural demographic data sources. These domains require sensitive handling under PDPA, particularly in the Southern Border Provinces context. The municipality should use aggregated indicators for dashboard display and establish data-sharing protocols through formal memoranda of understanding. Integration priorities should follow a clear sequence: automate DOPA population pulls through GDX for a real-time baseline; layer TPMAP poverty maps with CDD BMN indicators for targeted intervention planning; incorporate aging projections and disability registration for predictive social service modelling.


---

## 4. Economic, Business, and Labor Data

### 4.1 Business and Trade Data

The Department of Business Development (DBD, กรมพัฒนาธุรกิจการค้า) DataWarehouse at `datawarehouse.dbd.go.th` provides free public access to all registered juristic persons in Yala Province.[^1^] Users query by province (จังหวัดยะลา) and district (อำเภอเมืองยะลา serves as the proxy for Yala City Municipality, since DBD does not maintain a separate municipal-level registry).[^2^] Available fields include registered capital, financial statement summaries, International Standard Industrial Classification (ISIC) sector codes, director and shareholder information (fee-based for certified extracts), and monthly counts of new registrations, amendments, and dissolutions.[^3^] The interface is Thai-language only; no registration is required. For time-series analysis, the DBD Statistics Division publishes monthly reports at `dbd.go.th/common-article/2` under "ข้อมูลนิติบุคคลรายจังหวัด" (Business Registration Statistics by Province).[^4^] The Yala Provincial Commerce Office (สำนักงานพาณิชย์จังหวัดยะลา) can provide supplementary trend analysis upon request.[^5^]

| Source | Base URL | Data Type | Update Frequency | Geographic Level | Access Method |
|---|---|---|---|---|---|
| DBD DataWarehouse | `datawarehouse.dbd.go.th` | Juristic person registrations, ISIC codes, financial statements | Real-time (registrations); Annual (financials) | Province → District | Free public search; Thai-language interface[^1^] |
| DBD Statistics Division | `dbd.go.th/common-article/2` | Monthly/annual new registrations by province | Monthly | Province | Downloadable PDF/Excel[^4^] |
| SSO Data Catalog | `catalog.sso.go.th` | 53 datasets: employer-employee counts, Sections 33/39/40 insured persons, employment injury data | Monthly/Quarterly | Province | Open data portal; XLSX format[^6^] |
| Provincial Commerce Office | `yala.moc.go.th` | Sectoral breakdowns, OTOP registrations, local trade data | Annual | Province | Direct request; FOIA if needed[^5^] |
| Customs Department | `customs.go.th` | Border trade volume, commodities, customs revenue | Monthly | Border checkpoint (Betong) | Department reports; FOIA for checkpoint data[^7^] |
| OSP (SSME) | `ssme.go.th` | SME counts, employment, BDS utilization | Annual | Province | Reports and data portal[^8^] |

The SSO Data Catalog at `catalog.sso.go.th` hosts 53 statistical datasets with provincial breakdowns, including employer-employee counts, Section 33 (private employee), Section 39 (self-employed), and Section 40 (freelance) insured persons data, contribution receipts, and work-related injury statistics — all in XLSX format.[^6^] The SSO Yala Provincial Branch at 64 Sukhyang Road, Sateng provides additional local datasets.[^6^]

Betong District, Yala's southernmost district bordering Malaysia, functions as the province's primary cross-border trade gateway. In FY2013, Thai exports through Betong reached approximately US$139 million, the peak year in available records.[^7^] Betong was designated a model sustainable development city (เมืองต้นแบบการพัฒนาแบบยั่งยืน), with airport development planned.[^9^] The Betong International Border Crossing processes 400–500 crossings on weekdays and approximately 2,000 on weekends.[^10^] Checkpoint-specific trade data requires direct request to Customs; the Provincial Commerce Office may hold aggregated summaries.[^7^]

### 4.2 Labor Market and Employment

The National Statistical Office (NSO, สำนักงานสถิติแห่งชาติ) Labor Force Survey provides the most authoritative labor market data for Yala. For Q2 2025 (April–June), the Labor Force Participation Rate (LFPR, อัตราการเข้าร่วมของกำลังแรงงาน) stood at 67.31%, with unemployment at 0.86% (2,234 persons out of a labor force of 260,942).[^11^] This shifts from Q3 2024 annual figures (LFPR 67.98%, unemployment 0.43%), reflecting seasonal agricultural patterns.[^12^] Of the employed population (258,707 persons), approximately 61.8% work in agriculture — roughly 155,007 persons — followed by wholesale/retail trade at 8.5% and accommodation/food services at 5.0%.[^11^]

| Indicator | Q3 2024 (Annual) | Q2 2025 (Latest) | Source |
|---|---|---|---|
| Labor Force Participation Rate | 67.98% | 67.31% | NSO LFS[^11^][^12^] |
| Unemployment Rate | 0.43% | 0.86% | NSO LFS[^11^][^12^] |
| Employed (total) | 261,498 | 258,707 | NSO LFS[^11^] |
| Agricultural employment share | 61.8% | ~61.8% | NSO LFS[^11^] |
| Informal workers (total) | 198,150 | — | Provincial Labor Office[^13^] |
| Informal workers (% of employed) | 76.5% | — | Provincial Labor Office[^13^] |
| Job vacancies notified (Q2 2025) | — | 441 positions | Provincial Employment Office[^14^] |
| Job seekers registered (Q2 2025) | — | 465 persons | Provincial Employment Office[^14^] |
| Foreign workers — legal (Q2 2025) | — | 4,833 persons | Provincial Employment Office[^14^] |

The informal economy in Yala is substantial: 198,150 informal workers represent approximately 76.5% of the employed labor force, with 78.0% (154,546 persons) concentrated in agriculture.[^13^] Among non-agricultural informal workers (43,604 persons), wholesale/retail trade accounts for 48.6% and accommodation/food services for 28.6%.[^13^] The Provincial Employment Office Yala (สำนักงานจัดหางานจังหวัดยะลา) registered 441 vacancies and 465 job seekers in Q2 2025, achieving 159 placements.[^14^] Legal foreign workers totaled 4,833 persons, of whom 91.3% were Myanmar nationals.[^14^] Skills training in Q2 2025 covered 4,540 participants.[^14^]

The National Economic and Social Development Council (NESDB, สำนักงานสภาพัฒนาการเศรษฐกิจและสังคมแห่งชาติ) publishes Gross Provincial Product (GPP, ผลิตภัณฑ์มวลรวมภูมิภาค) through its GD Catalog dashboard. In 2018 (constant 2002 prices), Yala's GPP reached 43,006 million THB, yielding per capita GPP of 91,815 THB — 38.8% of the national average of 236,815 THB.[^15^] The NESDB GPP Dashboard at `datastudio.google.com/reporting/704fe6c7-aecb-4362-9062-3dc971c75982` enables inter-provincial comparison and sectoral decomposition.[^16^] Sectoral data (2011–2018) shows agriculture contributed approximately 16,260 million THB in 2018, while accommodation/food services grew 55.7% and financial/insurance services expanded 66.6%.[^15^]

The Bank of Thailand (BOT, ธนาคารแห่งประเทศไทย) Web Statistics at `app.bot.or.th/BTWS_STAT` provides provincial banking data updated monthly.[^17^] As of June 2025, Yala hosted 16 bank branches and 16 ATMs serving 31,547 deposit accounts and 1,595 loan accounts. Deposit balances totaled 23,362 million THB against loan balances of 12,548 million THB, producing a deposit-loan ratio of 56.10% — Yala is a net depositor province where capital flows outward rather than being retained for local investment.[^17^]

| Metric | Value | Year | Source |
|---|---|---|---|
| GPP (constant 2018 prices) | 43,006 M THB | 2018 | NESDB[^15^] |
| GPP per capita | 91,815 THB | 2018 | NESDB[^15^] |
| GPP per capita as % of national | 38.8% | 2018 | NESDB[^15^] |
| Agriculture GPP share | ~31.2% | 2018 | NESDB / Provincial Industry Office[^15^][^18^] |
| Agricultural employment share | ~61.8% | 2025 | NSO LFS[^11^] |
| Productivity gap ratio (employment / GPP share) | ~1.98× | — | Calculated from NESDB + NSO[^11^][^15^] |
| Rubber production (Q2) | 55,843 tons | 2024 | OAE Zone 9[^18^] |
| Rubber price change YoY | −16.1% | Q2 2025 | OAE[^19^] |
| Palm oil production | 4,158 tons | Q2 2025 | OAE Zone 9[^18^] |
| Palm oil change YoY | +2.4% | Q2 2025 | OAE[^18^] |
| Bank deposits | 23,362 M THB | Apr 2025 | BOT[^17^] |
| Bank loans | 12,548 M THB | Apr 2025 | BOT[^17^] |
| Deposit-loan ratio | 56.10% | Apr 2025 | BOT[^17^] |
| Tourism visitors | 1,545,731 persons | 2023 | MOTS[^20^] |
| Tourism revenue | 4,720.73 M THB | 2023 | MOTS[^20^] |

### 4.3 Tourism and Diversification

Tourism has emerged as a measurable diversification pathway for Yala's agricultural-dependent economy. The Ministry of Tourism and Sports (MOTS, กระทรวงการท่องเที่ยวและกีฬา) recorded 1.55 million visitors to Yala in 2023, generating 4,720.73 million THB in revenue — approximately 11% of GPP.[^20^] Key attractions include Hala-Bala Wildlife Sanctuary (พื้นที่คุ้มครองสิ่งแวดล้อม ฮาลา-บาลา) for ecotourism, Betong Hot Springs (บ่อน้ำร้อนเบตง), Phra Mahathat Chedi Phra Phutthathammaprakat, and community tourism sites at Ban Na Tham and Ban Bon Nam Ron.[^20^] The MOTS Yala Provincial Office (Tel: 073-213-722, Email: yala@mots.go.th) serves as the primary access point for monthly and annual tourism statistics.[^20^]

The Office of Small and Medium Enterprises Promotion (OSP, สำนักงานส่งเสริมวิสาหกิจขนาดกลางและขนาดย่อม) at `ssme.go.th` maintains SME ecosystem data for Yala.[^8^] In March 2025, SSME signed an MOU with Yala Rajabhat University to establish the Southern Border Province Entrepreneur Development Institute. Programs include Business Development Service (BDS) cost support of 50–80% up to 200,000 THB and low-interest loans at 1% up to 10 million THB per SME.[^8^] The FPRI-SSME MSME Sectoral Indicator Project, launched July 2025, is conducting ecosystem mapping for Yala SMEs.[^8^]

The productivity metrics in Table 3 reveal a structural vulnerability. Agriculture employs approximately 61.8% of Yala's workforce but contributes only about 31.2% of GPP, implying agricultural workers generate roughly half the per-worker output of non-agricultural workers.[^11^][^15^] This gap is amplified by commodity price volatility: rubber prices declined 16.1% year-over-year in Q2 2025 while production remained flat (55,843 tons), compressing farm incomes.[^19^] The OAE Farm Gate Price Index fell 16.1% YoY and the Farmer Income Index 16.9% YoY.[^19^] Palm oil offered marginal counterbalance with production up 2.4% YoY to 4,158 tons.[^18^]

For municipal planners, the divergence between employment composition and output contribution signals that GPP sectoral data from NESDB and labor force data from NSO must be tracked as an integrated panel. The ratio of agricultural employment share to agricultural GPP share — approximately 1.98× — serves as a concise vulnerability indicator: values above 1.5× suggest over-dependence on low-productivity primary-sector employment. Rubber price feeds from the Rubber Authority of Thailand (RAOT, การยางแห่งประเทศไทย) at `raot.co.th`, combined with GISTDA satellite-derived land use data and RID irrigation coverage maps, enable dashboard layers that identify specific subdistricts (ตำบล) where diversification interventions yield the highest marginal returns.[^18^][^21^]


---

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


---

## 6. Health and Social Welfare Data

Yala Province's health data ecosystem spans four institutional layers: the Ministry of Public Health (MOPH) collects clinical and epidemiological data through the Health Data Center (HDC) and Bureau of Epidemiology (BOE); the National Health Security Office (NHSO) tracks Universal Coverage Scheme (UCS) enrollment and utilization; the Department of Mental Health (DMH) monitors psychological wellbeing in a conflict-affected population; and the Department of Disease Control (DDC) operates disease-specific surveillance. Health services are delivered through Health Region 12 (เขตบริการสุขภาพที่ 12), covering seven southern provinces with 4.99 million people.[^1^]

### 6.1 Health Information Systems

The MOPH Health Data Center (HDC) at `https://hdcservice.moph.go.th` collects standardized data from all public facilities through 43 standard data files (แฟ้มข้อมูล 43 แฟ้ม) covering demographics, outpatient (OP) and inpatient (IP) utilization, ICD-10-coded diagnoses, chronic disease records, maternal and child health, vaccination coverage, mortality, and disability.[^2^] Access is tiered: MOPH personnel query individual-level data through the HDC Service Portal; the public downloads aggregated indicators from `https://opendata.moph.go.th`. OP data updates within 15 days, IP data within 45 days of discharge. Geographic disaggregation runs from province to individual facility, though municipality-level extraction requires authorized access.[^2^]

The Bureau of Epidemiology (BOE) manages Report 506 surveillance covering approximately 65 notifiable diseases reported weekly by all health facilities, accessible at `https://apps-doe.moph.go.th/boeeng/` with weekly reports at `https://wesr.boe.moph.go.th/wesr_new/`.[^3^] The 2020 Annual Epidemiological Surveillance Report recorded Yala's weekly reporting completeness at 25 of 52 weeks — the lowest in Health Region 12, reflecting operational challenges in conflict-affected districts.[^3^]

The NHSO UCInfo portal at `https://ucinfo.nhso.go.th/ucinfo` provides UCS beneficiary data including population by area (`/RptRegisPop-1`), age and sex distribution (`/RptRegisPop-2`), scheme coverage (`/RptRegisPop-3`), facility registration (`/RptRegisPop-4`), and capitation budgets (`/RptRegisPop-5`).[^4^] For FY2022, total capitation was 3,798.61 THB per beneficiary annually — allocated as 1,305.07 THB for OP, 1,460.59 THB for IP, and 463.44 THB for health promotion.[^4^] Yala falls under Health Region 12 for budget allocation.

The Digital Disease Surveillance (DDS) platform at `https://ddsdoe.ddc.moph.go.th/ddss/` provides real-time reporting from 1,416-plus facilities, with weekly summaries, disease situation mapping, and open data layers.[^5^] For Yala, DDS serves as the primary early-warning system, with weekly notifications triggering automatic alerts to the Provincial Public Health Office (สสจ. ยะลา).[^5^]

| System | Administrator | Base URL | Data Scope | Update Frequency | Access Method |
|--------|--------------|----------|------------|------------------|---------------|
| HDC (43 files) | MOPH | hdcservice.moph.go.th | Diagnoses, services, chronic disease, maternal health, mortality | Near real-time | MOPH login; public summaries via opendata.moph.go.th [^2^] |
| BOE 506 | DDC/BOE | apps-doe.moph.go.th | ~65 notifiable diseases, weekly reports | Weekly | Public website and annual PDF [^3^] |
| NHSO UCInfo | NHSO | ucinfo.nhso.go.th | UCS registration, capitation, utilization | Monthly/Annual | Public web portal [^4^] |
| DDS Dashboard | DDC | ddsdoe.ddc.moph.go.th/ddss/ | 1,416+ facilities, outbreak alerts | Real-time/Weekly | Public dashboard [^5^] |
| Yala Hospital | MOPH | yalahospital.go.th | 558 beds, 64% occupancy, 225,060 OP (2021) | Annual | Hospital reports [^6^] |

These five systems are complementary: HDC provides the deepest clinical data but requires authorization; BOE 506 offers the most comprehensive infectious disease tracking with full public access; NHSO UCInfo links enrollment to financial flows; DDS delivers real-time outbreak alerts; and Yala Hospital publishes facility-level performance indicators. The recommended municipal access pathway begins with DDS for disease surveillance, NHSO UCInfo for population coverage, and the MOPH Open Data portal for aggregate indicators requiring no login.

### 6.2 Disease Priorities for Yala

**Dengue fever.** Yala ranked seventh nationally for dengue incidence in 2022 at 21.87 per 100,000.[^7^] The 2019 outbreak recorded 523 patients between January and July — triple the prior year's count — placing Yala first in the southern region. Highest incidence occurs in children aged 10–14 years. Serotype distribution was predominantly DEN-2 and DEN-1. Weekly case data is available through DDC at `https://ddc.moph.go.th`.[^7^]

**Measles and vaccination coverage.** In outbreak areas, MMR1 coverage stands at 50.5% and MMR2 at 39.8%, versus the 95% national target.[^8^] Yala had Thailand's highest measles incidence in 2018 at 4 per 100,000, with 10 deaths — the highest in the southern region. Most victims were unvaccinated children aged 7 months to 14 years. In response, 125,000 emergency vaccine doses were rushed to the Deep South in late 2019. A National Supplementary Immunization Activity is planned for Q4 2025.[^8^]

**Malaria.** Yala is one of four provinces in Health Region 12 not yet certified malaria-free. Cases peaked at 4,641 in 2016, declining to approximately 805 by early 2018.[^9^] The Annual Parasite Incidence for 2020–2024 was 0–5 per thousand (low-transmission). Remaining pockets concentrate in Malaysia-border districts and forest-fringe communities. The "Bajoh Model" community elimination pilot in Bannang Sata District demonstrated case reduction through active case detection and SAO collaboration. Village-level risk classification (A1/A2/B) is tracked at `https://malaria.ddc.moph.go.th`.[^9^]

**Mental health.** A 2016 Deep South study found 9.6% lifetime mental disorder prevalence and 3.4% twelve-month prevalence.[^10^] Substance use disorders were most common at 7.1%, with nicotine dependence at 5.2%. Only 18.7% of affected individuals sought help.[^10^] Yala Hospital employs 9 psychiatrists among 21 total doctors — roughly 1 psychiatrist per 60,700 residents. The DMH Check-In platform at `https://checkin.dmh.go.th` provides depression and suicide risk screening tools for community health volunteers.

| Disease/Condition | Key Metric (Yala) | National/Regional Context | Data Source | Access URL |
|-------------------|-------------------|---------------------------|-------------|------------|
| Dengue fever | 21.87/100,000 (2022); Rank #7 | 131,157 national cases (2019); ages 10-14 highest | BOE/DDC | ddc.moph.go.th [^7^] |
| Measles (MMR) | MMR1: 50.5%; MMR2: 39.8% (outbreak areas) | Target 95%; 10 Yala deaths (2018) | DDC/EPI | ddc.moph.go.th [^8^] |
| Malaria | 4,641 cases (2016) → ~805 (2018); API 0-5/1,000 | 1 of 4 Region 12 provinces not malaria-free | BVBD/DDC | malaria.ddc.moph.go.th [^9^] |
| Mental disorders | 9.6% lifetime prevalence; 9 psychiatrists | Treatment-seeking 18.7%; nicotine dependence 5.2% | DMH/VMS | checkin.dmh.go.th [^10^] |

These four priorities create distinct data integration demands. Dengue requires seasonal modeling correlated with rainfall (Chapter 9). Measles demands subdistrict-level coverage mapping to identify vaccine hesitancy pockets. Malaria elimination requires cross-border coordination with Malaysian authorities. Mental health — the most resource-constrained priority — needs integration with security incident data (Chapter 5) to map conflict-related trauma demand against the province's 81 Tambon Health Promotion Hospital locations.

### 6.3 Health Service Delivery Data

Yala Province operates at least five community hospitals across eight districts — Bannang Sata (60 beds), Kabang (30 beds), Than To (36 beds) — with 348 beds total.[^11^] In 2021, community hospitals recorded 544,650 OP visits, 34,085 inpatients, and 122% bed occupancy, signaling demand substantially exceeding capacity. Average length of stay was 4.5 days.[^11^] In contrast, Yala Hospital reported 64% occupancy with 225,060 OP visits — demand concentrates at the district level while the 558-bed referral hospital maintains spare capacity.[^6^] Yala Hospital holds Smart Hospital Silver certification and serves as the primary receiving facility for mass casualties from the southern insurgency.[^6^]

The 81 Tambon Health Promotion Hospitals (THPHs) form the primary care frontline, recording 707,722 OP visits in 2021 (approximately 2,475 per day).[^11^] Each THPH serves roughly 5,000–6,000 residents, providing consultations, maternal and child health, immunization, chronic disease follow-up, mental health screening (2Q/9Q), and community health activities.[^11^]

In 2024, Yala recorded 8,899 live births (birth rate 16.2 per 1,000, above the ~10 national average), infant mortality of 5.3 per 1,000, and zero maternal deaths.[^12^] Pertussis incidence was 13.66 per thousand — the highest among Deep South provinces. Child development is tracked through the DSPM module in HDC. Antenatal care coverage exceeds 95%.[^12^]

The 2023 MOPH Health Resource Report documents 188 personnel at Yala Hospital (21 doctors, 9 dentists, 12 pharmacists, 146 nurses) and 483 at community hospitals (64 doctors, 24 dentists, 34 pharmacists, 361 nurses).[^13^] The population-to-doctor ratio in community hospitals is 1:2,906 — better than the national rural average but masking severe specialist shortages: 9 psychiatrists and 1 radiologist for 546,355 people. The national population-per-doctor ratio is 1:1,292, placing Yala at roughly 55% of the national standard.[^13^]

| Service Level | Facilities | Beds/Bed Occupancy | Annual OP Visits | Key Workforce |
|---------------|-----------|--------------------|------------------|---------------|
| General Hospital (Yala Hospital) | 1 (Regional, 558 beds) | 64% occupancy (2021) | 225,060 (2021) | 21 doctors, 146 nurses, 9 psychiatrists [^6^] |
| Community Hospitals (5+ districts) | 5+ (348 beds total) | 122% occupancy (2021) | 544,650 (2021) | 64 doctors, 361 nurses [^11^] |
| THPHs (Primary Care) | 81 | N/A (OP only) | 707,722 (2021); ~2,475/day | Community health workers, nurses [^11^] |
| Maternal/Child Health (2024) | All levels | 0 maternal deaths; IMR 5.3/1,000 | 8,899 live births | Midwives, pediatricians [^12^] |

The 122% community hospital bed occupancy — the most critical metric in this dataset — indicates a system under severe demand pressure. Combined with 64% occupancy at Yala Hospital, this suggests a mismatch between where patients seek care and where capacity exists. Two data integration opportunities emerge. First, linking THPH volumes with DMH Check-In screening data could identify subdistricts where primary care demand is driven by conflict-related distress. Second, overlaying maternal health indicators (birth rate 16.2/1,000) with TPMAP poverty data (Chapter 4) enables targeting of maternal and child health interventions to the poorest households. The HDC's 43 standard files provide the technical infrastructure for both analyses, provided MOPH authorization for municipality-level extraction is obtained through the Provincial Health Office.



---

## 7. Education and Human Development Data

Yala Province's education system presents a dual-structure challenge unique in Thailand: a state-administered Thai-medium system operating alongside an extensive Islamic education network serving the Malay-Muslim majority. This duality creates significant data gaps that impair municipal planning. The province's **education dimension rank of 66th** on the NESDC Human Achievement Index (HAI) — near the bottom of all 77 provinces — reflects both underperformance and systematic undercounting of students in non-formal Islamic institutions[^1^].

### 7.1 Formal Education Data

The **Education Management Information System (EMIS)** at `data.bopp-obec.info/emis`, operated by the Bureau of Policy and Planning (BOPP), covers **30,800+ schools nationwide** with annual data on enrollment, teacher deployment, and infrastructure[^2^]. For Yala, EMIS records 500 institutions including 334 schools, 2 vocational institutions, and 2 universities, reporting a student-to-teacher ratio of 19:1[^3^]. EMIS captures only Office of the Basic Education Commission (OBEC, สพฐ.) schools and excludes all private Islamic institutions[^4^].

The National Institute of Educational Testing Service (NIETS) administers the **O-NET** annually for Grades 6, 9, and 12 across Thai, Mathematics, Science, Social Studies, and English[^5^]. Yala's P.6 composite for academic year 2025 was **27.92 versus a national average of 35.38** — approximately 21% below the mean[^6^]. Pass rates at upper secondary are catastrophic: Thai language **8.3%** versus 37.7% nationally; Mathematics **1.8%** versus 9.9%; English 1.1% versus 10.6%[^7^]. Results are published through an interactive provincial map at `niets.or.th/en/catalog/view/3133`[^8^].

Yala Province is divided into **three Primary Educational Service Area Offices (สพป.ยะลา เขต 1/2/3)** and **one Secondary Educational Service Area Office (สพม.ยะลา)**. Primary Service Area 1 (`yala1.go.th`) operates a restricted-access big data portal at `bigdata.yala1.go.th` covering 130+ schools in Mueang Yala, Raman, and Krong Pinang districts[^9^]. The Secondary Service Area Office (`sesaoyala.go.th`) at 125 Phiphit Phakdi Road maintains school performance data and O-NET results[^10^]. The Provincial Education Office (`yalapeo.go.th`) coordinates across all service areas and achieved 96.88% of early childhood development targets for 20,091 children aged 3–6 in FY2024[^11^]. Yala City Municipality already maintains an O-NET visualization at `yaladashboard.com/citizen/o-net/` (updated April 2025)[^12^].

**Table 7.1: Formal Education Data Sources — Yala Province**

| Source | Operator | URL | Data Type | Level | Frequency | Access |
|--------|----------|-----|-----------|-------|-----------|--------|
| EMIS | BOPP, MoE | `data.bopp-obec.info/emis`[^2^] | Enrollment, teachers, infrastructure | School–National | Annual | Login required |
| NIETS O-NET | NIETS | `niets.or.th`[^5^] | Standardized test scores (P.6, M.3, M.6) | Provincial | Annual | Public map |
| สพป.ยะลา 1/2/3 | OBEC | `yala1.go.th`[^9^] | School performance, teacher deployment | District–School | Annual | Public |
| สพม.ยะลา | OBEC | `sesaoyala.go.th`[^10^] | Secondary data, budget reports | District–School | Annual | Public |
| ศธจ.ยะลา | Provincial Ed. Office | `yalapeo.go.th`[^11^] | Provincial planning, ECD targets | Provincial | Annual | Public |
| Yala City O-NET | City Municipality | `yaladashboard.com/citizen/o-net/`[^12^] | Local test visualization | Municipal | Annual | Public |

The formal system covers OBEC institutions exclusively, yet **approximately 80% of secondary students in the Deep South attend private institutions** — primarily Islamic schools and pondok — placing them outside EMIS tracking[^13^]. The 19:1 student-to-teacher ratio masks severe subject-specific shortages in mathematics, science, and English, compounded by security concerns that deter outside teacher recruitment[^14^].

### 7.2 Islamic and Non-Formal Education

Yala hosts **161 pondok institutions** (126 registered + 35 unregistered), **32 Islamic private schools**, **19 Hafiz institutions**, and **1,221 Tadika** schools — a parallel system with no integrated database[^15^]. The Office of the Private Education Commission (OPEC, `opec.go.th`) tracks only registered institutions. The OPEC Provincial Office Yala publishes district-level Excel files containing institution names, addresses, enrollment, and instructor counts[^16^]. A Mahidol University–UNICEF alternative care survey (November 2023–May 2024) identified 89 residential care facilities in Yala, including 34 pondok and 19 Hafiz institutions, though this survey focused on child welfare rather than educational outcomes[^17^].

The education crisis indicators are severe: only **44.2% of Yala youth were enrolled in formal education in 2022** versus **79.3% nationally** — a misleading figure since many youth attend Islamic education outside the formal system[^18^]. The **NEET rate is 30.8%**, among Thailand's highest[^19^]. The Equitable Education Fund (EEF) identified **12,802 out-of-school children** in Yala as of 2024[^20^]. Family migration is the primary dropout cause (76.9% of cases)[^21^]. Average education attainment for adults 15+ is 8.7 years, with 24.3% below basic education[^22^]. The Gender Parity Index for upper secondary is 2.0 — nearly twice as many females as males — reflecting young males pursuing pondok education over formal schooling[^23^].

For higher education, **Yala Rajabhat University (YRU, `yru.ac.th`)** is the province's primary institution, offering Islamic Education and Malay Language Teaching programs critical for teacher supply[^24^]. Its Southern Border Research and Development Institute conducts applied education research[^25^]. **Prince of Songkla University Pattani Campus (`psu.ac.th/pattani`)** serves as a regional research hub through its Regional Network on Poverty Eradication (RENPER), with joint research on education intervention and community development[^26^].

**Table 7.2: Islamic and Non-Formal Education Data Sources — Yala Province**

| Source | Operator | URL / Access | Data Type | Coverage | Frequency |
|--------|----------|-------------|-----------|----------|-----------|
| OPEC Provincial Office | OPEC, MoE | `yalaopec.go.th`; Excel by district[^16^] | Registered pondok, Islamic schools | 126 pondok, 32 schools | Annual |
| Assoc. of Pondok Institutions | Association (private) | Via OPEC Yala office | Complete pondok registry | 161 total (incl. 35 unregistered) | Periodic |
| EEF Thailand | Equitable Education Fund | `en.eef.or.th`[^20^] | Out-of-school children, Zero Dropout | 12,802 children (Yala) | Ongoing |
| Mahidol-UNICEF Survey | Mahidol + UNICEF | `bettercarenetwork.org`[^17^] | Residential care facilities | 89 facilities in Yala | One-time (2023–2024) |
| Yala Rajabhat University | YRU (public) | `yru.ac.th`[^24^] | Enrollment, teacher training | Institutional | Annual |
| PSU Pattani Campus | PSU (public) | `psu.ac.th/pattani`[^26^] | Regional education research | 5-province region | Ongoing |
| NIETS I-NET | NIETS | `niets.or.th`[^5^] | Islamic National Educational Test | National–Provincial | Annual |

The dual system creates a **critical data blind spot**: the municipality cannot plan education services without mapping the full landscape including unregistered pondok[^27^]. The 44.2% formal enrollment rate, when interpreted without reference to the parallel Islamic system, fundamentally misrepresents educational participation in Yala. A GIS mapping exercise using OpenDataKit (ODK) mobile data collection to catalog all institutions — OBEC, OPEC-registered, registered pondok, and unregistered pondok — is a recommended priority data integration project requiring partnership with OPEC and the Association of Pondok Educational Institutions[^27^].


---

## 8. Public Safety, Security, and Disaster Management

Yala Municipality operates within a dual-track risk environment: an ongoing security situation in the Southern Border Provinces (SBPs) demanding extraordinary data-handling care, and escalating climate vulnerability that has affected more households since 2022 than any other disruption category. [^1^] This chapter catalogs security incident, complaint, justice, and disaster management data sources with sensitivity frameworks for each domain.

### 8.1 Security Incident Data

#### 8.1.1 Deep South Watch (DSW)

Deep South Watch (DSW), at the Center for Conflict Studies and Cultural Diversity (CSCD), Prince of Songkla University, Pattani Campus, maintains four databases. The Conflict Incident Dataset (CID/DSID) records 15,000+ geocoded incidents since January 2004 with fields for date, time, village-level location, violence type, weapon, perpetrator, and victim demographics. [^1^] The Public Budget Database (PBP) tracks government spending; the Public Opinion Database (POP) holds governance and peace process surveys; and the Socio-Economic Database (SEP) compiles development indicators for correlation with security trends. [^1^] Full database access requires an institutional partnership with CSCD; contact dsw.data@gmail.com. DSW Monthly Reports at deepsouthwatch.org/en/node provide public aggregate data including incident counts, deaths and injuries by religion/occupation, and cause analysis — sufficient for trend visualization without partnership. [^1^]

#### 8.1.2 ACLED

The Armed Conflict Location & Event Data Project offers free weekly updates via registration at developer.acleddata.com, with an `acled.api` R package on CRAN for programmatic retrieval. [^3^] Thailand events are filterable by ISO 764 with admin1-level Yala filtering. ACLED captures fewer Deep South events than DSW because it relies on English-language rather than local Thai and Malay-Jawi sources. [^9^]

#### 8.1.3 UCDP

The Uppsala Conflict Data Program publishes its Georeferenced Event Dataset (GED) under CC BY 4.0 at ucdp.uu.se/downloads with no registration required; a REST API is available at ucdp.uu.se/apidocs/. [^5^] [^6^] A 2016 Asia Foundation analysis found UCDP used only five English-language sources for Thailand in 2014, yielding thinner coverage than DSW, though it provides valuable global cross-validation. [^9^]

#### 8.1.4 Responsible Data Use Framework

Security incident data requires protocols per OCHA Data Responsibility Guidelines (2021) and IASC Operational Guidance: aggregate data only for public display, choropleth maps at district level minimum, and SBPAC consultation before publication. [^12^] [^13^] A four-tier sensitivity classification applies: individual incident coordinates are CONFIDENTIAL; sub-district counts are RESTRICTED; district-level counts are INTERNAL; provincial monthly summaries are PUBLIC. [^12^] The ICJ documented 721 alleged arbitrary detention cases in the Deep South between 2019 and 2023, underscoring the human rights risks of precise location disclosure. [^10^] As of July 2024, Yala remains under the Emergency Decree (77th extension), subjecting security data to additional restrictions. [^10^]

| Source | Base URL | Authentication | Geographic Granularity | Temporal Coverage | Sensitivity |
|--------|----------|---------------|----------------------|-------------------|-------------|
| DSW — CID/DSID | deepsouthwatch.org | Partnership with CSCD | Village-level with GIS | Jan 2004–present | HIGH [^1^] |
| DSW — PBP | deepsouthwatch.org | Partnership with CSCD | Province/District | Multi-year | MEDIUM [^1^] |
| DSW — POP | deepsouthwatch.org | Partnership with CSCD | Sub-district/District | Multi-round | MEDIUM-HIGH [^1^] |
| DSW — SEP | deepsouthwatch.org | Partnership with CSCD | District/Sub-district | Multi-year | LOW-MEDIUM [^1^] |
| DSW Monthly | deepsouthwatch.org/en/node | None | Province | Monthly since 2004 | LOW-MEDIUM [^1^] |
| ACLED | acleddata.com | Free registration | Event-level lat/long | 1997–present, weekly | MEDIUM [^3^] |
| UCDP GED | ucdp.uu.se/downloads | None (CC BY 4.0) | Event-level | 1989–present, monthly | MEDIUM [^5^] |

For Yala's public dashboard, only DSW Monthly Reports and ACLED/UCDP aggregate counts are appropriate. Full DSW access is reserved for internal planning. The DSW-SEP database warrants particular attention because it links security trends with poverty, education, and health indicators at district level. [^1^]

### 8.2 Complaint and Justice Data

#### 8.2.1 SBPAC KEADILAN Center API

SBPAC operates 326 KEADILAN (Justice) Center offices across the SBPs. [^7^] Real-time complaint data is available via the Open Data API at opendata.sbpac.go.th/API/SRT_01_01.aspx, with six categories: request for assistance (ขอความช่วยเหลือ), request for justice (ขอความเป็นธรรม), complaint about official behavior (ร้องเรียนพฤติกรรมเจ้าหน้าที่รัฐ), tip/informant (แจ้งเบาะแส), legal consultation (ให้คำปรึกษากฎหมาย), and information inquiry (สอบถามข้อมูล). [^8^] Intake channels include in-person visits, the 1880 hotline ("อุ่นใจ"), mail, website, and Facebook Messenger. A secondary dataset (srt_02_01) tracks resolved complaints. All data is Open Data Common license. [^8^]

#### 8.2.2 SBPAC Data Catalog

The SBPAC Data Catalog at catalog.sbpac.go.th hosts 24 datasets: 12 relief/compensation datasets, 3 complaint/justice datasets, 7 Hajj datasets, and 2 CSO datasets. [^7^] For municipal planners, compensation datasets provide conflict-impact indicators at district level for correlation with health service demand and education needs. [^22^]

#### 8.2.3 Traffy Fondue

Traffy Fondue, developed by NECTEC-NSTDA, is an AI-powered municipal complaint platform through which citizens report via LINE (@traffy) with photos and GPS coordinates. [^16^] The system classifies complaints into 24 categories including drainage/flooding, roads, streetlights, narcotics, and corruption. Open data is available via gdcatalog.go.th in CSV, JSON, and XML formats, reporting 89% national user satisfaction across 1,754+ organizations. [^16^]

#### 8.2.4 Royal Thai Police Region 9

Provincial Police Region 9 publishes traffic accident statistics at police9.go.th including frequency by district, casualties, and causes. [^1^] Detailed crime statistics require a formal written request to the Provincial Police Commander; security incident data is categorized separately from ordinary crime and is generally not publicly available. [^1^]

| Source | Endpoint / URL | Format | Categories | Geographic Level | Access |
|--------|---------------|--------|-----------|------------------|--------|
| SBPAC KEADILAN (live) | opendata.sbpac.go.th/API/SRT_01_01.aspx | JSON | 6 complaint types | District | Open Data Common [^8^] |
| SBPAC Resolved | opendata.sbpac.go.th/API/SRT_02_01.aspx | JSON | Resolution status | District | Open Data Common [^8^] |
| SBPAC Catalog | catalog.sbpac.go.th | JSON | 24 datasets | Province/District | Open Data Common [^7^] |
| Traffy Fondue | citydata.traffy.in.th | CSV/JSON/XML | 24 municipal problem types | GPS / Sub-district | Open Data [^16^] |
| RTP Region 9 | police9.go.th | HTML/PDF | Traffic accidents, crime | Province/District | Public (formal request for detail) [^1^] |

SBPAC KEADILAN and Traffy Fondue offer complementary lenses: KEADILAN captures SBP-specific justice complaints while Traffy Fondue captures operational service failures, enabling dual-track monitoring. [^22^]

### 8.3 Disaster Management Integration

#### 8.3.1 DDPM Disaster Statistics

The Department of Disaster Prevention and Mitigation (DDPM) collects disaster data across 49+ indicator categories at province and district levels covering flood, landslide, storm, drought, wildfire, and earthquake. [^18^] Indicators include deaths, injuries, affected persons, damaged buildings and infrastructure, villages in hazard-prone areas, and assistance value by disaster type. Access is through the DDPM disaster data catalog (public CKAN-style portal), provincial DDPM offices, and formal requests to Provincial Hall. IOM notes DDPM collects displacement data only at provincial request with no standardized guidelines. [^21^] A fully integrated national disaster data center has not yet been established. [^18^]

#### 8.3.2 AHA Centre / ASEAN Disaster Data

The ASEAN Coordinating Centre for Humanitarian Assistance (AHA Centre) operates two relevant platforms. The Disaster Monitoring and Response System (DMRS) provides real-time multi-hazard tracking with population density overlays, developed with the U.S. Pacific Disaster Center. [^19^] The ASEAN Disaster Information Network (ADINet) is a public repository of verified disaster records since 2012. [^19^] For Yala, the AHA Centre's value lies in regional early warning for transboundary hazards and cross-border coordination with Malaysia's National Disaster Management Agency, particularly for Betong district's shared watersheds.

#### 8.3.3 Historical Disaster Impact for Yala

Three catastrophic flood events between 2022 and 2024 affected over 18,000 households in Yala: February 2022 (3,114 households), December 2023 — a "50-year flood" (15,457 households, 4 deaths), and November–December 2024 (664,000+ people region-wide). [^23^] These events exceeded the household-level impact of security incidents over the same period. DDPM assistance value data and damage assessments are available through the provincial DDPM office.

| Source / System | Data Type | Geographic Coverage | Update Frequency | Access Method |
|----------------|-----------|---------------------|------------------|---------------|
| DDPM Disaster Data Catalog | Warning + event + assistance | Province/District/Village | Event-driven + annual | CKAN-style portal [^18^] |
| DDPM Data Center | Internal reporting | Province/District | Real-time (internal) | Provincial DDPM offices only [^21^] |
| AHA Centre DMRS | Real-time multi-hazard | ASEAN regional | Continuous | ahacentre.org [^19^] |
| AHA Centre ADINet | Verified disaster records | ASEAN regional | Event-driven | ahacentre.org (public) [^19^] |
| Provincial DDPM Yala | Damage assessments | District/Sub-district | Event-driven | Formal request to Provincial Hall [^18^] |
| GISTDA Flood API | Satellite flood monitoring | National/Provincial | Near real-time | GISTDA Sphere (WMS/WMTS) |
| TMD | Weather warnings, rainfall | Station/Province | Real-time | tmd.go.th + API [^18^] |

#### 8.3.4 Integration Guidelines

Security and disaster data should inform health service planning, education interventions, and economic development — not solely emergency response. Yala's 9.6% mental health prevalence and 9 psychiatrists for the province mean trauma service planning should incorporate security incident density as a demand predictor. [^22^] The 30.8% NEET rate correlates with incident frequency at district level, and business registration trends track security trajectories. [^22^] The recommended integration pattern layers KEADILAN complaint density with district-level security trends and health facility locations; overlays DDPM flood-prone village data with poverty indicators and GISTDA flood monitoring; and cross-references Traffy Fondue drainage/flooding complaints with DDPM historical flood zones. Aggregate at district level or higher for public dashboards; sub-district and village-level data should remain restricted to internal planning with access controls and audit logging. [^12^]


---

## 9. Geospatial Data and GIS Infrastructure

A geographic information system (GIS) forms the spatial backbone of Yala Municipality's data dashboard, enabling layering of population, infrastructure, hazard, and administrative data over a common geographic reference. This chapter catalogs national platforms, satellite imagery, base geographic datasets, and environmental GIS layers, with access instructions for each.

### 9.1 National Geospatial Platforms

**GISTDA Sphere** (sphere.gistda.or.th), operated by the Geo-Informatics and Space Technology Development Agency (GISTDA, สทอภ.), is Thailand's primary national geospatial infrastructure. It provides base map layers via WMS, WMTS, TMS, XYZ, and REST JSON protocols, all requiring free API key registration[^3-1^][^3-2^]. Five base map layers are available: `sphere_streets` (Thai-language street map), `thailand_images` (satellite/aerial imagery), `sphere_hybrid` (imagery with labels), and two color-blind accessibility variants. All layers default to Thai (`th`) with English (`en`) as an option, and support EPSG:3857 projection. JavaScript (MapLibre GL JS), Android, iOS, Flutter, and React Native SDKs are provided[^3-1^].

The Sphere REST API exposes nine services: search/suggest, place search, nearby POI, reverse geocoding, routing, matrix routing, elevation, embed map, and static map generation[^3-2^]. The `disaster-recurring` endpoint returns historical disaster frequency at queried locations, enabling flood and fire risk profiling for individual tambon. The elevation service queries GISTDA's DEM for height values at specified coordinates.

The **Royal Thai Survey Department** (RTSD, ราชการสำรวจแห่งประเทศไทย) maintains the L7018 1:50,000 topographic map series (830 sheets nationwide)[^3-9^]. Digital products include GeoTIFF, GeoPDF, shapefiles, the FLDB GIS vector database, DEMs, and orthoimagery. Access requires an official letter to the RTSD Director General specifying map sheets, scale, format, and purpose; turnaround is 15–30 business days with nominal fees for government agencies[^3-9^]. RTSD also operates 100+ CORS stations providing RTK positioning at 1–3 cm horizontal accuracy via NTRIP protocol for precise municipal surveying[^3-9^].

The **Land Department's LandsMaps** system provides parcel-level boundaries through a public WMS endpoint at `http://110.164.49.68:8081/geoserver/WMSDOL/wms?`[^3-7^]. The dataset covers 34 million+ parcels with 14+ attributes per parcel: area (square wa/rai), parcel number, title deed reference (chanote), responsible land office, government appraisal price, tax classification, city planning zone, and land use designation[^3-7^]. No authentication is required for WMS; ThaiD or OpenID unlocks advanced features including the LandsMaps mobile app's valuation lookups.

| Platform | Operator | Base URL / Endpoint | Protocols | Authentication | Key Data for Yala |
|----------|----------|---------------------|-----------|----------------|-------------------|
| GISTDA Sphere | GISTDA | sphere.gistda.or.th | WMS, WMTS, TMS, REST JSON | API key (free) | Base maps, geocoding, routing, elevation, disaster recurring[^3-1^] |
| GISTDA Disaster | GISTDA | disaster.gistda.or.th | REST JSON, WMS, WMTS, STAC | API key (free) | Flood extent, fire hotspots, drought index, PM2.5[^3-3^] |
| RTSD Maps | Royal Thai Survey | rtsd.go.th | GeoTIFF, Shapefile, GeoPDF | Official letter | 1:50,000 topo maps, DEM, FLDB vector, admin boundaries[^3-9^] |
| LandsMaps | Land Department | 110.164.49.68:8081/geoserver/WMSDOL/wms | WMS (read-only) | None for WMS; ThaiD for advanced | 34M+ parcels, 14+ attributes, appraisal prices[^3-7^] |

For Yala's dashboard, the recommended integration sequence uses GISTDA Sphere as the base map, overlays RTSD administrative boundaries, adds LandsMaps parcel boundaries as reference, and activates GISTDA Disaster flood/fire layers during hazard events — providing complete national geospatial coverage at zero licensing cost.

### 9.2 Satellite and Remote Sensing Data

**THEOS-2**, Thailand's earth observation satellite launched 9 October 2023, delivers 0.5 m panchromatic and 2 m multispectral imagery with a 10.3 km swath[^3-5^][^3-6^]. Off-nadir pointing (up to 45°) achieves <5-day revisit over Thailand, with daily coverage of 74,000 km²[^3-5^]. Government users qualify for reduced pricing via GISTDA Business Development (0-2141-4564 ext. 66, 69; usd@gistda.or.th)[^3-6^]. THEOS-1 archive (15 m MS / 2 m PAN, 2008–present) offers a lower-cost alternative for historical analysis.

**Sentinel-2** (Copernicus) provides 10 m multispectral imagery (13 bands) with 5-day revisit, available free via the Copernicus Data Space STAC API[^3-19^]. The harmonized L2A surface reflectance product (`COPERNICUS/S2_SR_HARMONIZED` in Google Earth Engine) is atmospherically corrected and ready for NDVI computation — the preferred source for land use monitoring where THEOS-2 resolution is unnecessary[^3-15^].

**Digital Elevation Model** selection depends on accuracy requirements and budget:

| DEM Source | Resolution | Vertical Accuracy | Cost | Download Method | Recommended Use |
|------------|-----------|-------------------|------|-----------------|-----------------|
| ALOS AW3D30 | 30 m | 3–5 m RMSE | Free | JAXA EORC registration[^3-13^] | **Default for Yala dashboard** |
| SRTM 1-Arc-Second | 30 m | 5–7 m RMSE | Free | USGS EarthExplorer[^3-14^] | General topography, slope analysis |
| NASADEM | 30 m | ~5 m RMSE | Free | USGS EarthExplorer | Improved SRTM with error correction |
| ASTER GDEM v3 | 30 m | 8–12 m RMSE | Free | USGS EarthExplorer | Backup only (noise in vegetated terrain) |
| TanDEM-X 90 m | 90 m | 4 m RMSE | Free (90 m) | DLR registration | Regional watershed analysis |
| RTSD DEM | Variable | Most accurate (undisclosed) | Paid | RTSD request | Engineering-grade applications[^3-9^] |

ALOS AW3D30 is the recommended default: it offers the best accuracy-to-effort ratio among free sources (3.28 m RMSE documented by JAXA)[^3-13^]. Tile N06E101 covers Yala city (6.3–6.9°N, 101.0–101.6°E). Download requires free JAXA EORC registration; the package includes DSM, quality mask, and quality assurance files in GeoTIFF format[^3-13^].

**Google Earth Engine** (GEE) provides a cloud-based platform with a multi-petabyte catalog including Landsat (1984–present), Sentinel-2 (2015–present), MODIS, SRTM, and 500+ datasets[^3-15^]. Free registration is available for government use. For Yala, GEE enables server-side processing of satellite time series without local infrastructure. A JavaScript API workflow for NDVI change detection defines the municipality bounding box (`ee.Geometry.Rectangle([101.25, 6.52, 101.35, 6.62])`), retrieves cloud-filtered Sentinel-2 composites for two periods, computes NDVI via the normalized difference of B8 (near-infrared) and B4 (red) bands, and generates a change raster by subtracting the earlier from the later period[^3-15^]. The Dynamic World V1 dataset (`GOOGLE/DYNAMICWORLD/V1`) provides 10 m near-real-time land cover across nine classes and integrates directly with Sentinel-2 for comprehensive land use mapping[^3-15^].

### 9.3 Base Geographic Data for Yala

**Administrative boundaries** should be sourced from HDX (Humanitarian Data Exchange) RTSD distribution rather than GADM[^3-9^][^3-10^]. HDX provides Level 0 (country) through Level 3 (tambon, ~7,250 units) boundaries derived directly from RTSD and vetted by OCHA/ITOS[^3-9^]. Yala City Municipality (Thesaban Nakhon Yala, เทศบาลนครยะลา) covers 19.4 km² encompassing Tambon Sateng (ตำบลสะเตง), within Amphoe Mueang Yala (อำเภอเมืองยะลา)[^3-16^]. Adjacent tambon are Yupo (ยุโป) to the north, Sateng Nok (สะเตงนอก) to the east and south, and Tha Sap (ท่าสาป) to the west. The recommended download is `tha_admbnda_adm3_rtsd_20220121.shp`, filtered to Yala Province via `ADM1_EN` or `ADM1_TH`[^3-9^].

**OpenStreetMap (OSM)** Thailand provides free road networks, building footprints, and POIs under ODbL 1.0[^3-8^]. Geofabrik publishes daily PBF extracts (~308 MB) with shapefile (~680 MB) and GeoPackage options[^3-8^]. The recommended workflow imports the full Thailand PBF to PostGIS via `osm2pgsql`, then clips to the Yala bounding box (`-b=101.0,6.3,101.6,6.9`) using `osmconvert`[^3-8^]. OSM coverage in Yala is good for major roads and moderate for buildings/POIs, though rural tracks may be incomplete and boundaries may not match RTSD sources[^3-8^].

**Road network completeness** requires three sources: DRR rural roads (dataportal.drr.go.th, shapefile/WMS)[^3-11^], DOH national highways (bmm.doh.go.th, Hw 409/410/418)[^3-8^], and OSM urban streets/alleys[^3-8^]. **Yala City Plan** (ผังเมืองรวมยะลา), maintained by DPT, defines six land use zones — red (commercial), yellow (residential), purple (industrial), green (agricultural/open space), blue (public facilities), and white (undesignated)[^3-17^]. PDF maps are available from the DPT portal; digital shapefiles require formal request to DPT Yala Provincial Office[^3-17^].

| Data Layer | Primary Source | URL / Access | Format | Update Frequency | Coverage |
|------------|---------------|--------------|--------|------------------|----------|
| Admin boundaries (tambon) | HDX (RTSD) | data.humdata.org/dataset/thailand-administrative-boundaries[^3-9^] | Shapefile, KML, GeoJSON | Annual | Level 0–3; filter to Yala |
| Road network (rural) | DRR | dataportal.drr.go.th[^3-11^] | Shapefile, WMS | Annual | All rural roads; filter to Yala |
| Road network (highways) | DOH | bmm.doh.go.th | Shapefile | Periodic | National highways incl. Hw 410 |
| Road network (urban) | OSM | download.geofabrik.de/asia/thailand.html[^3-8^] | PBF (~308 MB) | Daily | Full Thailand; clip to Yala bbox |
| City plan zoning | DPT | dpt.go.th (formal request) | PDF available; Shapefile on request | Per revision | Yala municipal area |
| Buildings / POIs | OSM | Same as above[^3-8^] | PBF | Daily | Variable completeness |
| Parcel boundaries | LandsMaps | 110.164.49.68:8081/geoserver/WMSDOL/wms[^3-7^] | WMS (view only) | Event-driven | 34M+ parcels nationwide |

### 9.4 Water and Environmental GIS

**Royal Irrigation Department (RID, กรมชลประทาน)** water data provides critical inputs for flood risk assessment. Real-time reservoir storage, rainfall, and river levels are accessible via app.rid.go.th/reservoir/ and ThaiWater.net[^3-12^]. For Yala, the Bang Lang Dam (เขื่อนบังลัง) in Bannang Sata District stores 1,420 million m³ with a 2,080 km² catchment and irrigation coverage of ~380,000 rai (60,800 ha)[^9-8^]. The Pattani River Basin covers 3,805.65 km² across Yala and Pattani provinces with ~715,000 population and 1,500–2,200 mm annual rainfall[^9-8^].

The RID GIS catalog contains 25+ categories: watershed boundaries, flood-prone area designations, river networks, dam/weir locations, and irrigation zone polygons[^9-8^]. Watershed boundaries for the Pattani basin, cross-section data for flood modeling, and irrigation zone delineations are available through RID Regional Office 10 upon formal request. The ThaiWater API delivers standardized water level data with station code, timestamp, level (m MSL), and quality flags[^9-8^].

**Land use/land cover** data comes from three complementary sources. GISTDA produces a national land cover classification via the Sphere platform. **Dynamic World V1** (Google/GEE) provides 10 m near-real-time land cover with nine classes, updated as Sentinel-2 imagery arrives[^3-15^]. **ESA WorldCover** offers 10 m global land cover with 11 classes from Sentinel-1/2. The recommended approach uses Dynamic World as the primary near-real-time layer, ESA WorldCover for independent validation, and GISTDA national land cover for alignment with Thai planning standards. All three are free: Dynamic World via GEE (`GOOGLE/DYNAMICWORLD/V1`), ESA WorldCover via its viewer, and GISTDA via Sphere API[^3-15^].

**GISTDA environmental monitoring** extends to operational hazard systems. The Flood Monitoring portal (flood.gistda.or.th) provides satellite-derived flood extents from Sentinel-1 SAR, THEOS-2, and MODIS, with API endpoints for 1/3/7/30-day flood layers plus a flood frequency (recurring areas) layer[^3-3^][^3-4^]. The Fire Monitoring portal (fire.gistda.or.th) delivers near-real-time hotspot detection from MODIS (1 km) and VIIRS (375 m), with SMS alerts dispatched within 20 minutes to subscribed officers[^3-3^]. Historical disaster data for both hazards is queryable through the Sphere `disaster-recurring` endpoint by specifying Yala coordinates or province name[^3-1^]. These layers should integrate into the dashboard's Climate Resilience module, activated during hazard events and available on-demand for risk assessment.

| Environmental Layer | Source | URL / Endpoint | Format | Update Frequency | Spatial Resolution |
|---------------------|--------|---------------|--------|------------------|-------------------|
| Reservoir / river levels | RID | app.rid.go.th/reservoir/[^3-12^] | Web tables, ThaiWater API | Real-time (hourly) | Station points |
| Flood extent | GISTDA | flood.gistda.or.th, disaster.gistda.or.th | WMS, REST JSON, STAC | Daily (satellite) | 10–30 m[^3-3^] |
| Fire / hotspot | GISTDA | fire.gistda.or.th | WMS, REST JSON | Near real-time (20 min alerts) | 375 m (VIIRS), 1 km (MODIS)[^3-3^] |
| Land cover (near-real-time) | Dynamic World | GEE: GOOGLE/DYNAMICWORLD/V1 | GEE API | Per Sentinel-2 overpass | 10 m[^3-15^] |
| Land cover (annual) | ESA WorldCover | WorldCover viewer | GeoTIFF download | Annual | 10 m |
| Land cover (national) | GISTDA | sphere.gistda.or.th | WMS, API | Periodic | Variable |
| Watershed boundaries | RID | Regional Office 10 (request) | Shapefile | Periodic | Basin-scale[^9-8^] |
| DEM / terrain | ALOS AW3D30 | JAXA EORC portal[^3-13^] | GeoTIFF | Static | 30 m |


---

## 10. Utilities and Infrastructure Data

Utility infrastructure data in Yala Municipality is distributed across several national agencies and one municipal bureau, with no consolidated API for water, electricity, or telecommunications. The Provincial Waterworks Authority (PWA — การประปานคร) operates the piped water supply, the Provincial Electricity Authority (PEA — การไฟฟ้าส่วนภูมิภาค) manages the distribution grid, and the National Broadcasting and Telecommunications Commission (NBTC — คณะกรรมการกิจการกิจการโทรคมนาคมแห่งชาติ) regulates telecoms. Each maintains its own data systems and access protocols, requiring municipal officers to navigate multiple portals and direct agency contacts.

### 10.1 Water and Electricity

#### 10.1.1 Provincial Waterworks Authority (PWA) Yala

PWA maintains 233 branch offices nationwide, providing piped water to 74 provinces (3.60 million households, 16.0 million population) [^1^]. PWA Yala Branch manages water production, distribution pipelines, and customer records. All branches deploy GIS-based pipeline management systems for asset tracking and hydrologic accounting. District Metering Area (DMA) zones with boundary flowmeters monitor water loss; PWA's national loss reduction target is below 26.30% for 2025 [^1^]. Yala Municipality's Water Supply Bureau (สำนักการประปา) operates separately, feeding consumption data into the Yala Smart City Dashboard. No public API exists for PWA data; access requires direct coordination with PWA Yala Branch or extraction from dashboard CSV downloads [^1^][^3^].

#### 10.1.2 PEA Area 3 (Southern Region)

PEA Area 3 (Southern Region) is headquartered at 59/27 Yala-Pattani Road, Yarang District, Pattani 94160, serving six provinces — Yala, Pattani, Narathiwat, Songkhla, Satun, and Phatthalung — through 68 offices [^4^][^5^]. PEA nationwide served 22.06 million customers in 2024 with 156,838 million kWh in sales; the Southern Region accounted for 17.32% of sales, growing 9.31% year-over-year [^5^]. PEA achieved 100% village electrification. For Yala, district-level consumption data is available through the EPPO electricity statistics portal and the PEA Smart Plus mobile app [^6^][^7^].

#### 10.1.3 Yala Dashboard Water Data

The Yala Smart City Dashboard water module tracks raw water turbidity (2.10 NTU), supply volume, and downloadable consumption datasets from the municipal Water Supply Bureau [^2^][^3^]. Coverage gap mapping, per-capita consumption trends, and water quality parameter histories remain underdeveloped. Officers seeking enhanced analytics must request internal reports from the Water Supply Bureau or aggregate PWA branch data separately.

#### 10.1.4 Smart Grid and Outage Data

PEA's smart meter rollout and outage notification system operate through the PEA Smart Plus platform [^7^]. Outage data aggregated at the provincial or municipal level is not publicly available; grid reliability metrics must be requested directly from PEA Area 3 headquarters. The PEA e-Service API is private and requires institutional access agreements [^4^].

| Data Source | Organization | Indicators Available | Update Frequency | Access Method | Geographic Coverage |
|-------------|-------------|---------------------|-----------------|---------------|-------------------|
| PWA Yala Branch | Provincial Waterworks Authority | Water production, consumption, pipeline GIS, DMA zones, loss rates | Daily production; periodic GIS | Direct contact; no public API [^1^] | Yala Municipality + surrounding districts |
| PEA Area 3 (Southern) | Provincial Electricity Authority | Electricity sales, distribution losses, customer count, outage notifications | Daily billing; monthly reports | PEA Smart Plus app; EPPO portal; direct request [^4^][^5^][^6^] | 6 southern provinces |
| Yala Smart City Dashboard — Water | Yala Municipality Water Supply Bureau | Water supply volume, turbidity (2.10 NTU), consumption datasets | Periodic CSV updates | CSV download via yaladashboard.com [^2^][^3^] | Yala Municipality only |
| PEA Smart Plus / e-Service | Provincial Electricity Authority | Individual usage history, outage alerts, billing | Real-time (app) | Mobile app; e-Service portal [^7^] | Individual customer-level |

The table above reveals a critical gap: operational utility data held by PWA and PEA at the branch level does not automatically flow into municipal analytics displayed on the Yala Dashboard. No programmatic API bridges these systems, requiring manual extraction and reconciliation.

### 10.2 Telecommunications and Digital Infrastructure

#### 10.2.1 Free Public WiFi

Yala Municipality operates 48 free public WiFi signal points across the city, branded "YALA Free Wi-Fi" and managed by Siam Innovation Company [^8^]. Usage statistics are available as downloadable datasets on the Yala Smart City Dashboard. Hotspot locations include Yala Central Mosque, Yala Cultural Centre, Yala Railway Station, municipal offices, and public parks [^8^]. Monthly usage reports are provided, though no real-time connection metrics or bandwidth utilization data is publicly accessible.

#### 10.2.2 Mobile Coverage

All three major operators — AIS (~44-46% market share, ~46.5 million subscribers), True Corporation (~38-40%, ~50 million subscribers post-DTAC merger), and National Telecom (NT) — provide 4G and 5G coverage in Yala [^9^]. National 4G population coverage exceeds 97-98% for the two major operators. nPerf crowdsourced maps show 4G as the standard in Yala with 5G limited to urban centers; Yala's flat terrain (elevation ~1.2 m) aids signal propagation [^9^]. Cell tower locations can be queried via CellMapper [^13^], though official site registration data is held by NBTC and not published at the tower level.

#### 10.2.3 NBTC Telecommunications Data

NBTC regulates spectrum allocation, coverage obligations, and infrastructure sharing frameworks, requiring service in all 77 provinces [^10^]. However, granular coverage maps, tower coordinates, and infrastructure sharing agreements are not published at the provincial level. Regulatory decisions appear as commission orders on the NBTC website. Municipal officers seeking telecom infrastructure data for urban planning should file information requests with NBTC's Office of the Secretary-General [^10^].

#### 10.2.4 Building Permits and Urban Planning

The Department of Public Works and Town and Country Planning (DPT — กรมโยธาธิการและผังเมือง) oversees building permits through the e-PP (Electronic Public Participation) system [^11^][^12^]. Under the Town Planning Act B.E. 2562 (2019), permits in municipal (Thesaban) areas are issued by the Municipal Office. No publicly aggregated building permit statistics for Yala were identified; officers must access records through Yala Municipal Office or the DPT Yala Provincial Office [^11^]. Building permit data has no public API and requires in-person or formal written request.

| Data Source | Organization | Indicators Available | Update Frequency | Access Method | Coverage |
|-------------|-------------|---------------------|-----------------|---------------|----------|
| YALA Free WiFi | Yala Municipality / Siam Innovation Company | 48 hotspot locations, usage statistics, connection counts | Monthly | CSV download via Yala Dashboard [^8^] | Yala Municipality |
| nPerf Coverage Maps | nPerf (crowdsourced) | 4G/5G signal strength by operator, speed test results | Hourly | Web portal; data purchase available [^9^] | Yala Province / Municipality |
| NBTC Regulatory Data | NBTC | Spectrum allocation, coverage obligations, infrastructure sharing rules | Ad hoc | NBTC website; direct request [^10^] | National (77 provinces) |
| DPT e-PP System | DPT | Town planning documents, building permit records | Monthly/Quarterly | e-PP portal; DPT office access required [^11^][^12^] | Yala Municipality |
| ISP Coverage Maps | AIS, True, NT, 3BB | Fixed broadband / fiber availability, speeds | Static | Provider websites [^16^][^17^] | Yala Municipality |

The telecommunications landscape follows a pattern characteristic of Thai municipalities: consumer-facing coverage tools (nPerf, provider websites) are readily accessible, while regulatory and planning data (NBTC tower locations, DPT permit statistics) remains siloed within agencies. For municipal planning, the most actionable sources are the Yala Dashboard WiFi usage datasets and nPerf's crowdsourced coverage maps, both providing georeferenced infrastructure performance data without inter-agency coordination [^8^][^9^]. Detailed telecom infrastructure planning and building permit analysis require direct engagement with NBTC and DPT respectively, as no public APIs or aggregated datasets exist for these domains at the municipal level [^10^][^11^].


---

## 11. International and Regional Data Sources

International open data sources complement Thailand's national statistical systems by providing cross-country benchmarks, subnational geospatial data, climate monitoring at grid scales finer than province-level, and population estimates between census rounds. For Yala City Municipality (Thesaban Nakhon), these sources fill three gaps: the absence of subnational SDG tracking in most Thai government systems, insufficient historical climate data at municipal resolution for flood risk modelling, and the need for small-area demographic estimates for service planning.

### 11.1 United Nations and Development Data

#### 11.1.1 UNDP SDG Profile for Yala

The UNDP SDG Profile for Yala is a 22.8 MB PDF published in June 2024 covering all 17 Sustainable Development Goals with province-level indicators benchmarked against national averages[^1^]. Produced by the Ministry of Interior, UNDP, NIDA, and TDRI, the report includes public perception survey results from 15 target provinces and alignment analysis with Yala's Provincial Development Plan (2022–2027). Key indicators span poverty rates (SDG 1), health worker density and under-5 mortality (SDG 3), O-NET education scores (SDG 4), water and sanitation access (SDG 6), employment statistics (SDG 8), urban development (SDG 11), disaster-affected persons (SDG 13), and forest area (SDG 15). English and Thai versions are available; there is no API, so data must be extracted manually from PDF tables[^1^].

#### 11.1.2 World Bank Open Data API

The World Bank Indicators API provides over 16,000 time-series indicators via a free REST endpoint (`https://api.worldbank.org/v2/country/THA/indicator/`) returning JSON or XML under CC BY 4.0[^2^]. Relevant databases include World Development Indicators (1,400+ indicators), Subnational Poverty (ID 38), Subnational Population (ID 50), and SDG indicators (ID 46). No authentication is required. Province-level poverty data is available for Yala; most other indicators are country-level only[^2^].

#### 11.1.3 UN ESCAP SDG Portal

The Asia-Pacific SDG Gateway (data.unescap.org) tracks all 17 SDGs across 58 member states with time series from 2000 onward[^3^]. The portal acknowledges that "disaggregation of most indicators at the local level is either incomplete or unavailable" — Thailand data is country-level only, with no provincial breakdown. Its value for Yala is regional benchmarking against ASEAN neighbours[^3^].

#### 11.1.4 UN OCHA HDX

The Humanitarian Data Exchange (HDX) hosts 152+ datasets for Thailand, with eight resources exposed through the HDX HAPI daily API: UNHCR refugee data, ACLED conflict events, INFORM risk scores, WFP food prices, OPHI poverty rates, UNFPA baseline population, WFP rainfall, and metadata availability[^4^]. The HAPI base URL is `https://hapi.humdata.org/`. Province-level subnational coverage is available for most datasets, making this the highest-frequency international feed directly relevant to Yala[^4^].

| Source | Base URL / API Endpoint | Data Type | Geographic Level | Update Frequency | Licence |
|--------|------------------------|-----------|-----------------|-----------------|---------|
| UNDP SDG Profile Yala | `undp.org/publications/SDG-profile-yala` (PDF) | 17 SDG indicators | Province (Yala) | One-time (2024) | UNDP Open Access[^1^] |
| World Bank Indicators API | `api.worldbank.org/v2/country/THA/indicator/` | 16,000+ time series | Country; subnational poverty | Annual | CC BY 4.0[^2^] |
| UN ESCAP SDG Portal | `data.unescap.org` | Asia-Pacific SDG indicators | Country only | Annual | UN Open Data[^3^] |
| HDX HAPI | `hapi.humdata.org` | Conflict, refugees, population, rainfall | Province-level | Daily | CC BY-IGO / CC BY / CC0[^4^] |

The UNDP SDG Profile is the only source providing a comprehensive indicator-by-indicator assessment calibrated specifically to Yala and aligned with the Provincial Development Plan[^1^]. HDX HAPI distinguishes itself through daily programmatic refresh — the only automated pipeline for conflict, population, and rainfall data at province resolution[^4^]. The World Bank and ESCAP sources serve national and regional benchmarking respectively[^2^][^3^].

### 11.2 Climate and Environmental Data

#### 11.2.1 CHIRPS Rainfall

CHIRPS (Climate Hazards Group InfraRed Precipitation with Stations) provides daily rainfall estimates at ~5.5 km resolution from 1981 to the present, distributed as public domain (CC0) data[^5^]. Access channels include direct HTTP download from `data.chc.ucsb.edu` and the Google Earth Engine ImageCollection `UCSB-CHG/CHIRPS/DAILY`. Preliminary pentad products are available two days after each period ends; final monthly products release in the third week of the following month. The 40+ year record enables flood and drought trend analysis for Yala[^5^].

#### 11.2.2 GloFAS Flood Forecasting

The Global Flood Awareness System (GloFAS), operated by Copernicus EMS, provides ensemble river discharge forecasts at ~5 km resolution for the Yala River Basin with 30-day lead times[^6^]. The system includes historical reanalysis from 1984 (GloFAS v4), rapid impact assessments linking streamflow to inundation estimates, and 4-month seasonal outlooks. The Open-Meteo Flood API (`https://flood-api.open-meteo.com/v1/flood`) returns daily discharge in m³/s with ensemble statistics for any coordinate pair without authentication. Return-period thresholds classify minor (2-year), moderate (5-year), and severe (20-year) flooding[^6^].

#### 11.2.3 Global Forest Watch

Global Forest Watch provides 30 m resolution tree cover loss data from 2001 to present, weekly GLAD deforestation alerts, and daily fire alerts[^7^]. The REST API (`https://production-api.globalforestwatch.org/v1/`) requires Bearer token authentication and supports zonal statistics. The Hansen Global Forest Change dataset provides the most reliable historical record of forest cover dynamics for Yala. As of late 2025, some GFW streams have experienced disruption due to U.S. federal funding changes, though the Hansen dataset remains fully available[^7^].

#### 11.2.4 NASA SEDAC GPWv4

NASA SEDAC Gridded Population of the World v4 provides population grids at ~1 km resolution for 2000, 2005, 2010, 2015, and 2020[^8^]. GPWv4 disaggregates census data from ~13.5 million administrative units globally. Programmatic access is through the US GHG Center STAC API (`https://earth.gov/ghgcenter/api/raster`). While coarser than Meta HRSL (30 m) or WorldPop (100 m), its strict alignment to official census counts makes it valuable for cross-reference validation[^8^].

| Source | Base URL / API Endpoint | Resolution | Temporal Coverage | Update Frequency | Primary Use for Yala |
|--------|------------------------|-----------|-------------------|-----------------|----------------------|
| CHIRPS | `UCSB-CHG/CHIRPS/DAILY` (GEE); `data.chc.ucsb.edu` | ~5.5 km | 1981–present | Daily/Monthly | Flood trend analysis; drought monitoring[^5^] |
| GloFAS | `flood-api.open-meteo.com/v1/flood` | ~5 km | 1984–present + 30-day forecast | Daily | Yala River Basin flood early warning[^6^] |
| Global Forest Watch | `production-api.globalforestwatch.org/v1/` | 30 m (tree cover); 10 m (RADD) | 2001–present; Daily (fires) | Weekly/Daily | Forest loss; fire alerts[^7^] |
| NASA SEDAC GPWv4 | `earth.gov/ghgcenter/api/raster` (STAC) | ~1 km | 2000–2020 (5-year) | 5-year | Population validation[^8^] |

CHIRPS and GloFAS are the most operationally urgent given documented flood events affecting thousands of Yala households in 2022, 2023, and 2024[^5^][^6^]. Their ~5 km resolution supports basin-scale early warning sufficient to trigger municipal response protocols. Global Forest Watch complements GISTDA's national fire monitoring with global-standard deforestation tracking[^7^].

### 11.3 Population and Demographic Estimates

#### 11.3.1 Meta High Resolution Population Density

Meta's High Resolution Population Density Maps provide circa-2020 population estimates at ~30 m resolution with demographic breakdowns by age group and sex[^9^]. Fourteen files per country cover total population, male, female, women of reproductive age (15–49), children under 5, youth (15–24), and elderly (60+). Data is accessible via HDX download or Google Earth Engine (`projects/sat-io/open-datasets/hrsl/hrslpop`). The 30 m grid enables precise population mapping within Yala municipality's 19.4 km² boundary for disaster scenario modelling[^9^].

#### 11.3.2 WorldPop

WorldPop provides 100 m resolution gridded population counts for Thailand with annual estimates from 2000 to 2030, including projections[^10^]. The dataset distinguishes 20 age bands by gender and offers constrained (population allocated to built-settlement areas, recommended for municipal planning) and unconstrained variants. Access is via `https://hub.worldpop.org`, HDX, or Google Earth Engine (`WorldPop/GP/100m/pop`). The UN-adjusted variant aligns totals with UN World Population Prospects[^10^].

#### 11.3.3 IOM DTM

The IOM Displacement Tracking Matrix collects mobility data at 91 active country operations including Thailand[^11^]. In Thailand, flow monitoring is active at the Myanmar border (Tak, Ranong, Kanchanaburi, Chiang Rai) and population mobility monitoring at the Lao and Cambodia borders. No dedicated DTM operations exist at the Yala-Malaysia border. The methodology remains relevant should displacement monitoring expand to southern border provinces[^11^].

#### 11.3.4 OpenAQ

OpenAQ aggregates air quality measurements from Thailand's Pollution Control Department network through a stable v3 API (`https://api.openaq.org`)[^12^]. Endpoints include `/v3/locations` for station metadata, `/v3/locations/{id}/latest` for current readings, and `/v3/measurements` for historical data. Parameters span PM2.5, PM10, SO₂, NO₂, CO, O₃, and black carbon. Station density in Southern Thailand is significantly lower than in Bangkok; Yala may need to rely on the nearest available stations, potentially in Hat Yai[^12^].

| Source | Base URL / Access | Resolution | Demographic Detail | Temporal Coverage | Licence |
|--------|------------------|-----------|-------------------|-------------------|---------|
| Meta HRSL | HDX; GEE: `projects/sat-io/open-datasets/hrsl/hrslpop` | ~30 m | Total, male, female, 5 age groups | Circa 2020 | CC BY International[^9^] |
| WorldPop | `hub.worldpop.org`; GEE: `WorldPop/GP/100m/pop` | ~100 m | 20 age bands × 2 genders; constrained/unconstrained | 2000–2030 (annual) | CC BY 4.0[^10^] |
| IOM DTM | `dtm.iom.int/dtm-api` | Flow monitoring points | None | Varies | IOM Open Data[^11^] |
| OpenAQ | `api.openaq.org` (v3) | Station-level | None | Historical to real-time | Open data[^12^] |

Meta HRSL offers the finest spatial resolution (30 m), best suited for mapping population within Yala municipality for flood exposure estimates[^9^]. WorldPop adds temporal depth with projections to 2030 and the most detailed age-sex breakdown from any international source, essential for ageing-society planning[^10^]. IOM DTM currently has no Yala operations but provides a validated methodology expandable to the Malaysia border[^11^]. OpenAQ fills an environmental health gap, though utility depends on station proximity given sparse Southern Thailand coverage[^12^].

Together, the twelve sources catalogued in this chapter — four UN and development databases, four climate and environmental systems, and four population and demographic estimates — provide the international data layer for Yala's municipal dashboard. Where national Thai systems offer administrative data at province or district level, these sources add subnational geospatial granularity, predictive models, and standardised API-accessible feeds.


---

## 12. Technical Architecture and Integration Standards

Building an integrated data platform for Yala Municipality (เทศบาลนครยะลา) requires adherence to national standards, selection of open-source components, and alignment with Thailand's digital government policy framework. This chapter documents the technical standards, architecture patterns, and compliance frameworks that govern the design, deployment, and operation of the municipality's data infrastructure. Each section specifies the governing standard, its mandatory or recommended status, and the concrete implementation approach for Yala's context.

### 12.1 Government Standards and Compliance

#### 12.1.1 TH-e-GIF v2.0 — Thailand e-Government Interoperability Framework

TH-e-GIF v2.0 (Thailand e-Government Interoperability Framework), developed by the Digital Government Development Agency (DGA, สำนักงานพัฒนารัฐบาลดิจิทัล) since 2006 (B.E. 2549), defines six standard domains for inter-agency data exchange in Thailand: Interconnection (TCP/IP, HTTP/HTTPS), Data Exchange (RESTful API as primary, SOAP for legacy), Web Technology (HTML5, CSS3, JavaScript), Data Integration (JSON as primary, XML), Security (OAuth 2.0, OIDC, HTTPS/TLS 1.2+), and Document Exchange (XML Signature, JWS).[^1^] The Digital Government Development Plan 2025–2027 designates data interoperability as a core strategy, with explicit goals of One Stop Service, Zero Copy (no duplicate documents), Data-Driven Government, and Open API across the 1,500+ IT systems operated by Thai government agencies.[^2^]

For Yala Municipality, TH-e-GIF compliance is **mandatory**. All new system interfaces must adopt RESTful APIs with JSON payloads, authenticate via OAuth 2.0 / OpenID Connect (integrating with ThaiD / DGA Digital ID), encrypt all endpoints using HTTPS/TLS 1.2 or higher, document every API using OpenAPI 3.0 (Swagger), and encode all data in UTF-8 for full Thai language support.[^1^] The framework's "Zero Copy" principle is particularly relevant: citizens submitting data once to any government agency should never need to submit the same document to Yala Municipality again.

#### 12.1.2 SDMX (ISO 17369) — Statistical Data and Metadata eXchange

SDMX (ISO 17369:2013) is the internationally standardized format for exchanging statistical data and metadata. Thailand's National Statistical Office (NSO, สำนักงานสถิติแห่งชาติ) has adopted SDMX to drive digital transformation of government statistical reporting through its Statistics Sharing Hub (StatHub, https://stathub.nso.go.th), an open-source .Stat Suite platform that publishes international indicators, national strategic statistics, and official statistics conforming to SDMX Data Structure Definitions (DSDs).[^3^] NSO proposed SDMX as the national statistical data exchange standard to the Digital Government Development Committee.

For Yala Municipality, SDMX compliance is **recommended** for all statistical datasets shared with NSO. The municipality should structure municipal KPIs, population data, and economic indicators using SDMX DSDs, which define dimensions (e.g., geographic codes, time periods), attributes (e.g., data quality flags), and measures (e.g., population counts, poverty rates). Each dataset registers a data flow linking Yala as the data provider to its corresponding DSD, enabling automated publication through StatHub and consumption via API, Excel, Power BI, R, or Python clients.[^3^] Key challenges include the skills gap in SDMX data modeling, the absence of agreed municipal codelist standards, and the need to move away from non-machine-readable dissemination formats such as static PDF tables.

#### 12.1.3 PDPA Compliance (B.E. 2562/2019)

The Personal Data Protection Act (PDPA, พระราชบัญญัติคุ้มครองข้อมูลส่วนบุคคล) B.E. 2562 has been in **full enforcement since June 2022**.[^4^] All Thai government agencies, including municipalities, must comply with its provisions for data collection, processing, storage, subject rights, breach notification, and cross-border transfer. Non-compliance carries substantial penalties: failure to implement security measures incurs fines up to THB 3 million; unauthorized cross-border transfer up to THB 5 million; violation of data subject rights up to THB 5 million; and collecting sensitive data without lawful basis carries criminal penalties of up to one year imprisonment plus THB 1 million in fines.[^5^]

A municipality processing personal data of 100,000 or more data subjects — Yala Province registers 552,479 residents, of which Yala Municipality accounts for approximately 57,640–60,291 — **must appoint a Data Protection Officer (DPO)** under Section 41.[^6^] The DPO must possess a bachelor's degree in IT security, computer science, or law; five or more years of experience in privacy, compliance, or risk management; and relevant certification such as CIPP, CIPM, or Thailand's T-DPO credential offered by the Digital Technology Council (DCT).[^7^] The DPO's responsibilities span legal advice on PDPA compliance, oversight of all collection and disclosure activities, liaison with the Personal Data Protection Committee, maintenance of Records of Processing Activities, and enforcement of the **72-hour breach notification** requirement.

#### 12.1.4 PDPA Five-Phase Compliance Checklist for Yala Municipality

The table below synthesizes the five-phase compliance pathway, mapping each phase to specific municipal actions, legal bases under PDPA, and the responsible unit within Yala Municipality's organizational structure.

| Phase | PDPA Requirement | Municipal Action | Responsible Unit | Legal Basis (PDPA Section) |
|-------|-----------------|------------------|------------------|---------------------------|
| 1. Assessment | Data inventory and gap analysis | Catalog all personal data collected across tax, permits, social services, complaints; classify sensitive data (biometric, health, religion); conduct PDPA gap assessment | Strategy Division (กองยุทธศาสตร์) + DPO | Sec. 39 |
| 2. Policy | Privacy policy and consent workflows | Publish privacy notice; separate consent forms from other documents; implement consent withdrawal mechanism; obtain explicit consent for sensitive data and parental consent for minors | Legal / DPO | Sec. 19–25 |
| 3. DPO Appointment | Data Protection Officer | Appoint internal DPO (municipal IT officer with PDPA training) or outsource to certified DPO service provider; training budget THB 15,000–50,000; monthly salary THB 25,000–60,000 | Municipal Clerk | Sec. 41–42 |
| 4. Technical Measures | Security and access controls | Implement encryption at rest and in transit; role-based access control; activity logging; anonymization/pseudonymization where possible; data retention schedules per category | IT Unit + GDCC | Sec. 37–40 |
| 5. Audit | Continuous monitoring and breach response | Maintain Records of Processing Activities; conduct quarterly PDPA audits; implement 72-hour breach notification; establish written contracts with all data processors | DPO + Internal Audit | Sec. 42, 46–48 |

The five phases should be executed sequentially, with Phases 1 and 2 completed before any new data collection system goes live.[^4^][^6^] For municipal data processing, the primary legal bases under PDPA are: public task (census, public safety, disaster management), legal obligation (tax collection, civil registration), contract (utility services, permit applications), vital interest (emergency response, public health), and consent (optional services, surveys).[^5^] Yala Municipality should map every data collection activity to one of these lawful bases and document the rationale in its Records of Processing Activities.

### 12.2 Recommended Technology Stack

The recommended technology stack draws from validated reference architectures at Phuket City Data Platform, Hat Yai Smart City, and Khon Kaen Provincial Dashboard, combined with TH-e-GIF compliance requirements and GDCC (Government Data Center and Cloud Service, ศูนย์รวมข้อมูลภาครัฐและบริการคลาวด์ภาครัฐ) hosting constraints.[^8^] All components are open-source, deployable on GDCC's free IaaS tier, and interoperable through the TH-e-GIF standards specified in Section 12.1.

| Layer | Component | Technology | Specification | Deployment | TH-e-GIF Alignment |
|-------|-----------|-----------|---------------|------------|-------------------|
| Database (spatial + time-series) | Primary data store | PostgreSQL 15 + PostGIS 3.4 + TimescaleDB 2.11 | Single Docker container (`timescale/timescaledb-ha:pg15-latest`); separate databases for spatial, IoT, and application data | GDCC VM (Ubuntu 22.04 LTS, 4+ cores, 8+ GB RAM, 200+ GB storage) | UTF-8 encoding; RESTful API via PostgREST optional |
| GIS platform | Spatial data infrastructure (SDI) | GeoNode (DGA-recommended) | Combines GeoServer + PostGIS + MapStore + pyCSW; Thai language via Transifex; UTM Zone 47N for southern Thailand | Docker on GDCC; minimum 4 cores, 8 GB RAM | OGC WMS/WFS/WCS/CSW services; JSON output |
| Data catalog | Open data portal | CKAN Open-D (Thai Government Edition) | Python/Flask backend; PostgreSQL metadata; Solr search; Redis cache; Thai GDC extension; DCAT-AP v3 with GeoDCAT-AP and StatDCAT-AP extensions | Docker on GDCC; harvest to gdcatalog.go.th; publish to data.go.th | OpenAPI 3.0 API; DCAT-AP v3 metadata; OAuth 2.0 |
| API gateway | API management | Kong Gateway (Open Source, DB-less mode) | Declarative YAML configuration; rate limiting (100 req/min default); JWT + OAuth 2.0 plugins; HTTP/S proxy on ports 8000/8443 | Docker on GDCC; DB-less mode recommended for initial deployment | OAuth 2.0 auth; HTTPS/TLS 1.2+; JSON request/response |

**Database layer.** PostgreSQL with the PostGIS and TimescaleDB extensions in a single container enables "where" plus "when" analytics in one query — a municipal facility's location (PostGIS `GEOGRAPHY(Point, 4326)`) and its sensor readings over time (TimescaleDB hypertable on `TIMESTAMPTZ`) are queryable together.[^9^] The architecture provisions three logical databases: `postgis_db` for spatial layers (municipal boundaries, road network, building footprints, land use), `timeseries_db` for IoT sensor data (air quality, water level, traffic counters), and `app_db` for application data (user accounts, service requests, permits, audit logs). Kubernetes deployment configs with Persistent Volume Claims should be used for production GDCC deployments.

**GIS platform.** GeoNode is the DGA-recommended open-source spatial data infrastructure, bundling GeoServer for OGC services, PostGIS for spatial storage, MapStore for map composition, and pyCSW for metadata cataloging.[^10^] GeoNode supports Thai language, can be branded with Yala Municipality's identity, and operates using UTM Zone 47N (EPSG:32647) for accurate spatial reference in southern Thailand. Basic setup takes several hours; full production deployment requires 2–4 weeks.

**Data catalog.** CKAN Open-D is the Thai government's standardized CKAN distribution, powering 114 agency-level catalogs and 76 area-level (provincial/municipal) catalogs across Thailand.[^11^] Yala Municipality should deploy CKAN Open-D on GDCC, configure the Thai Government Data Catalog (Thai GDC) extension, and enable harvesting to the central GD Catalog (https://gdcatalog.go.th) and open dataset publication to data.go.th. The ckanext-dcat extension adds DCAT-AP v3 compliance with GeoDCAT-AP for geospatial datasets and StatDCAT-AP for statistical data, enabling federation with international data catalogs.[^12^]

**API gateway.** Kong Gateway in DB-less mode provides a lightweight, GitOps-friendly approach to API management that aligns directly with TH-e-GIF requirements.[^13^] The declarative configuration file (`kong.yml`) defines services, routes, and plugins — rate limiting protects backend capacity, JWT and OAuth 2.0 plugins handle authentication, and file/HTTP logging plugins generate the audit trails required for PDPA compliance. As the platform scales, migration to DB mode (PostgreSQL-backed) or Kubernetes deployment is straightforward.

### 12.3 Dashboard and Visualization Framework

#### 12.3.1 Primary Dashboard — Metabase or Apache Superset

Metabase and Apache Superset represent the two leading open-source business intelligence options for Thai municipalities. Metabase is recommended as Yala's primary dashboard framework due to its sub-five-minute Docker deployment, visual query builder that non-technical municipal staff can operate without SQL knowledge, built-in Thai internationalization (i18n) via community translation, one-click drill-down, and built-in alerting.[^14^] Apache Superset offers more advanced visualizations through Apache ECharts and deeper SQL analytics via SQL Lab, but requires dedicated technical staff and significantly longer setup time (hours to days).[^15^] Yala Municipality should deploy Metabase on GDCC connected to PostgreSQL/PostGIS for the majority of dashboards, reserving Superset only if complex custom analytics (e.g., tourism forecasting models) become necessary.

| Criterion | Metabase (Recommended) | Apache Superset (Alternative) | Implication for Yala |
|-----------|----------------------|------------------------------|---------------------|
| Setup time | < 5 minutes (Docker) | Hours to days | Faster time-to-value for municipal teams |
| User skill level | Non-technical friendly | SQL knowledge required | Municipal officers can build dashboards directly |
| Thai language support | Community i18n available | Flask-Babel i18n available | Both support Thai; Metabase has more mature community translation |
| Chart library | 40+ chart types | Apache ECharts (excellent) | Superset wins for advanced visualizations only |
| Drill-down | One-click | More complex configuration | Metabase better for exploratory analysis |
| Alerting | Built-in thresholds | Requires additional setup | Metabase provides out-of-box flood/air quality alerts |
| SSO integration | SAML, LDAP, JWT, OAuth | Flask-AppBuilder auth | Both align with TH-e-GIF OAuth 2.0 requirement |
| Deployment | Docker, JAR | Docker, Kubernetes | Both deployable on GDCC IaaS |
| Embedding | Simple iframe | Signed embedding | Metabase easier for public-facing dashboards |
| Performance with PostGIS | Fast geospatial queries | Moderate | Metabase's automatic schema scanning optimizes PostGIS queries |

The analytical interpretation is clear: Metabase matches Yala Municipality's current capabilities — a small IT team within the Strategy Division that has demonstrated competence with dashboard deployment (evidenced by the existing yaladashboard.com) but lacks dedicated data engineering staff. Superset's advanced features become relevant only after the municipality builds a dedicated data team, which is a Phase 3 consideration. Metabase's direct connection to PostgreSQL with PostGIS enables automatic schema scanning, choropleth and pin-map visualizations, and time-series charting with TimescaleDB hypertables, covering the majority of municipal use cases identified across Chapters 3–11.

#### 12.3.2 IoT and Real-Time Monitoring — Grafana

Grafana serves as the dedicated real-time monitoring layer for IoT sensor networks. Connected to TimescaleDB via PostgreSQL data source, Grafana provides time-series panels for temperature and humidity trends, gauge panels for current water levels and air quality indices, geomap panels for sensor locations overlaid on municipal boundaries, and alert lists for active threshold violations.[^16^] Critical alert rules for Yala include: water level exceeding 2.5 meters (flood warning, triggering LINE/email notification to the disaster response team), PM2.5 exceeding 50 μg/m³ (public air quality notification), and traffic volume exceeding defined thresholds (traffic management alert). The IoT data pipeline follows the pattern: sensors → MQTT broker (Mosquitto or LavinMQ) → data ingestion (Node-RED or Telegraf) → TimescaleDB → Grafana dashboards and alerts.

#### 12.3.3 Mobile Data Collection — ODK Collect or KoboToolbox

For field data collection — infrastructure audits, public service feedback surveys, environmental monitoring, and disaster damage assessment — KoboToolbox (built on the ODK standard) is recommended. KoboToolbox offers offline-capable mobile forms with automatic GPS capture, photo attachments, multi-language support, and real-time submission dashboards.[^17^] Self-hosting via Docker on GDCC eliminates data sovereignty concerns and keeps all collected data within Thai jurisdiction. The XLSForm standard ensures compatibility with the broader ODK ecosystem and enables complex form logic (skip patterns, validation, calculations) without coding. Municipal survey types include annual infrastructure audits (road condition, building status), quarterly citizen satisfaction surveys, monthly environmental monitoring (water quality, tree count), and event-based disaster damage assessments.

#### 12.3.4 Cloud Infrastructure — GDCC Government Cloud

All components described in Sections 12.2 and 12.3 should be deployed on GDCC, which provides **free IaaS** (virtual machines, storage, network) to Thai government agencies as part of the Ministry of Digital Economy and Society's (MDES) seven Flagship Digital Initiatives.[^18^] GDCC is ISO 27001 (Information Security), ISO 20000 (IT Service Management), ISO 22301 (Business Continuity), and ISO 27701 (Privacy Information Management) certified, with a 99.95% availability SLA.[^19^] As of 2025, 219 agencies host 3,065 systems on GDCC, generating annual budget savings of 850 million THB.[^18^]

Yala Municipality's registration process is straightforward: register at https://portal.opendata.go.th, specify CPU/RAM/storage requirements, await GDCC approval, and provision VMs.[^19^] The municipality should deploy the full stack — PostgreSQL+PostGIS+TimescaleDB, GeoNode, CKAN Open-D, Kong Gateway, Metabase, Grafana, and KoboToolbox — on GDCC IaaS VMs running Ubuntu 22.04 LTS. All citizen data remains stored within the Kingdom under Thai law, satisfying both PDPA data sovereignty requirements and national security considerations. For assistance, GDCC provides helpdesk support at 02-024-1999 ext 2 and helpdesk@gdcc.onde.go.th. The combined Phase 1 deployment (database, GIS, catalog, dashboard, API gateway) on GDCC free IaaS with open-source software carries a total estimated cost of 1–2 million THB over six months, comprising personnel, training, and IoT sensor hardware rather than software licensing or cloud hosting fees.[^8^]


---

## 13. Implementation Roadmap — From Data to Decisions

The preceding twelve chapters have cataloged more than 200 data sources, documented 50+ APIs, and identified a "Data Rich, Information Poor" paradox at the heart of Yala Municipality's digital infrastructure.[^1^] The municipality operates an award-winning dashboard tracking budget execution, complaint resolution, and water consumption with precision, yet remains largely blind to the outcome indicators that matter most: whether 20.83% of its provincial population remains trapped in multidimensional poverty, whether the 30.8% NEET rate is falling, or whether the agricultural productivity gap — 61.8% of labor producing roughly 31% of output — is narrowing.[^2^] This chapter translates those findings into a concrete 12-month implementation roadmap. It specifies what to build, in what order, with which data sources, and who should do it. The table below summarizes the phased approach.

| Phase | Timeline | Primary Deliverables | Key Data Sources / APIs | Dependencies |
|-------|----------|---------------------|------------------------|--------------|
| 1. Foundation | Months 1–3 | GDCC VM provisioned; PostgreSQL+PostGIS+TimescaleDB deployed; GeoNode GIS operational; CKAN catalog live; GDX/DOPA registration initiated | GDCC IaaS; GISTDA Sphere WMS; citydata.in.th CKAN API; DEPA datasets | GDCC approval; DGA GovID account |
| 2. Core Integration | Months 4–6 | NSO StatHub SDMX feeds automated; TPMAP poverty + MOPH HDC health indicators connected; GISTDA flood + air4thai + TMD weather APIs live; Metabase outcome dashboard launched | StatHub SDMX API; TPMAP; MOPH HDC; GISTDA flood API; air4thai; TMD | GDX access approved; partnership letters to MOPH/TPMAP |
| 3. Advanced Analytics | Months 7–12 | ODK pondok GIS mapping completed; CHIRPS+GloFAS climate risk module live; WorldPop aging forecast module deployed; border trade analytics initiated | CHIRPS rainfall; GloFAS forecasts; WorldPop projections; DFT Betong data; ODK/KoboToolbox | Field survey team trained; DFT partnership MOU |

### 13.1 Phase 1: Foundation (Months 1–3)

Phase 1 establishes the technical substrate on which all subsequent integration depends. The immediate priority is securing free government cloud infrastructure and deploying the core data platform.

**Register for GDCC and deploy the database stack.** Register at https://portal.opendata.go.th for Government Data Center and Cloud Service (GDCC, ศูนย์รวมข้อมูลภาครัฐและบริการคลาวด์ภาครัฐ) Infrastructure-as-a-Service (IaaS), which provides free virtual machines to Thai government agencies.[^3^] On the provisioned VM (Ubuntu 22.04 LTS, 4 cores, 8 GB RAM, 200 GB storage), deploy PostgreSQL 15 with PostGIS 3.4 and TimescaleDB 2.11 as a single Docker container.[^4^] Create three logical databases: `postgis_db` for spatial layers, `timeseries_db` for IoT sensor data, and `app_db` for application data. This single container enables "where plus when" analytics — spatial queries and time-series analysis in one engine.

**Set up GeoNode GIS platform.** Deploy GeoNode on a separate GDCC VM with PostGIS as the spatial backend and UTM Zone 47N for southern Thailand accuracy.[^5^] Load Yala's administrative boundaries (Tambon Sateng, 19.4 km²), add GISTDA base maps via WMS from sphere.gistda.or.th, and import an OpenStreetMap extract for Yala Province.[^6^] This GIS platform becomes the geographic canvas for layering poverty, health, flood, and education data in subsequent phases.

**Register for GDX and DOPA API access.** Initiate registration for the Government Data Exchange (GDX, ศูนย์แลกเปลี่ยนข้อมูลกลาง) at https://gdx.dga.or.th/, which connects 194 agencies and processes 35.3 million data linkages annually.[^7^] GDX registration requires a DGA GovID account, agency verification, and MOU execution — a 1–3 month process that should start immediately.[^7^] Apply for DOPA API access via https://dev.egov.go.th/ for population registration data; this depends on GDX registration and adds 2–4 weeks.[^8^]

**Harvest DEPA CityData into CKAN.** Deploy CKAN Open-D (Thai Government Edition) on GDCC with the Thai Government Data Catalog (Thai GDC) extension.[^9^] Harvest the 15 datasets Yala already publishes on citydata.in.th — boundaries, tax, budget, health service usage, WiFi points, complaints, elderly/disability registrations, population, waste, carbon absorption, water supply, green areas, and PM2.5 — into the municipal catalog with DCAT-AP v3 metadata.[^10^] Enable harvesting to the central GD Catalog (https://gdcatalog.go.th) and publication to data.go.th.[^9^]

### 13.2 Phase 2: Core Integration (Months 4–6)

Phase 2 connects the foundation to national data feeds and launches the first outcome-oriented dashboards.

**Integrate NSO StatHub SDMX feeds.** Connect to the NSO Statistics Sharing Hub (StatHub) at https://stathub.nso.go.th via its SDMX 2.1 REST API at `ns1-stathub.nso.go.th/rest/`.[^11^] Configure automated pulls for population estimates, labor force participation and unemployment rates, and GPP sectoral composition — all updated quarterly and requiring no authentication.[^11^] Simultaneously, contact the NSO Yala Provincial Office at 073-212-703 for subdistrict-level tabulations unavailable through the national API.[^12^]

**Connect poverty and health indicators.** Integrate TPMAP (Thailand Poverty Map) poverty data at subdistrict level — the 20.83% MPI poverty rate, 208,274 persons in poverty, and poverty density by district.[^2^] Connect to the MOPH Health Data Center (HDC) for 43 standard data files covering disease prevalence, service utilization, and health workforce indicators.[^13^] These transform the dashboard from operational tracking to outcome monitoring.

**Deploy environmental monitoring APIs.** Integrate three real-time feeds: GISTDA Sphere flood monitoring API for flood extent layers, air4thai PM2.5 monitoring for air quality indices, and the TMD weather API for rainfall forecasts.[^6^] Store time-series readings in TimescaleDB with automatic hypertable partitioning.[^4^] Configure Grafana alerts for flood warnings (water level > 2.5 m triggers LINE/email to disaster response) and PM2.5 > 50 μg/m³.[^14^]

**Launch the Metabase outcome dashboard.** Deploy Metabase on GDCC connected to PostgreSQL/PostGIS.[^15^] Configure four outcome panels: poverty rate by district (TPMAP), education performance (O-NET municipal average vs. national), health service coverage (MOPH HDC), and economic productivity (GPP per capita from NESDB vs. labor composition from NSO).[^2^] These address the "operational-outcome divide" identified in Chapter 1.[^1^] Metabase's visual query builder enables the Strategy Division staff currently managing yaladashboard.com to build dashboards without SQL knowledge.[^15^]

### 13.3 Phase 3: Advanced Analytics (Months 7–12)

Phase 3 adds predictive capabilities, field data collection, and specialized analytics modules.

**Deploy ODK for pondok GIS mapping.** Deploy KoboToolbox (built on the ODK standard) on GDCC for mobile field data collection.[^16^] Design a survey form capturing GPS coordinates, enrollment, and facility conditions for all 161 educational institutions — OBEC schools, OPEC-registered private schools, registered pondok (126), and unregistered pondok (~35) — that educate roughly 80% of Yala's secondary students outside the formal system.[^17^] The ODK Collect app works offline and exports directly to PostGIS, addressing the "dual education system blind spot" identified in Chapter 7.[^17^]

**Integrate climate risk forecasting.** Add CHIRPS rainfall data (5.5 km resolution, 1981–present) and GloFAS river discharge forecasts for predictive flood modeling.[^18^] Layer these with WorldPop demographic projections to identify subdistricts where poverty density overlaps with flood hazard zones.[^19^] This moves the municipality from reactive disaster response to predictive climate resilience planning.

**Develop aging service demand forecasting.** Integrate WorldPop age-sex projections with DOPA registration trends and NHSO elderly health screening data to project aging service demand.[^19^] Yala entered an "Aged Society" in 2023 with 13.89% elderly (76,338 persons);[^20^] the dashboard should project demand for health services, disability support, and social services over 10–20 year horizons. Layer elderly population density with health facility locations to identify gaps — particularly relevant given the province has only 9 psychiatrists.[^21^]

**Develop border trade analytics.** Partner with the Department of Foreign Trade (DFT) for Betong border crossing statistics and create a "Border Economy" module tracking trade volume, commodity composition, and crossing patterns.[^22^] Betong processes 400–2,000 crossings daily and recorded US$139 million in peak Thai exports;[^22^] integrated trade analytics enable infrastructure and workforce planning for cross-border economic activity.

### 13.4 Governance and Sustainability

Technology without governance fails. The following framework ensures the integrated database and geographic dashboard remain operational, compliant, and continuously improving beyond the initial 12-month deployment.

**Data governance framework.** Every dataset requires documented ownership (authoritative department or agency), a defined update schedule, quality standards (completeness thresholds, validation rules), and PDPA compliance status.[^23^] All personal data processing must comply with the Personal Data Protection Act (PDPA) B.E. 2562, in full enforcement since June 2022 with fines up to THB 5 million.[^23^] The framework should specify retention periods, anonymization requirements, and the 72-hour breach notification protocol.

**Municipal data team structure.** The existing Strategy & Budget Division (กองยุทธศาสตร์และงบประมาณ) — currently the sole IT unit — should be augmented with four dedicated roles. The table below specifies each role, its responsibilities, required qualifications, and estimated monthly compensation.

| Role | Key Responsibilities | Required Skills | Est. Monthly Cost (THB) |
|------|---------------------|-----------------|----------------------|
| Data Platform Manager | Overall platform strategy; stakeholder coordination; national agency liaison (DGA, GDX, NSO); annual data source audit | 5+ years IT management; government experience; TH-e-GIF v2.0 knowledge | 45,000–60,000 |
| GIS Specialist | GeoNode administration; spatial data layer management; ODK form design; GISTDA integration; coordinate with DPT for boundary verification | PostGIS/GeoNode; QGIS; ODK/XLSForm; UTM coordinate systems | 35,000–50,000 |
| API Developer | Kong Gateway administration; GDX/DOPA/NSO API integrations; Python/JavaScript scripting; SDMX data modeling; Metabase configuration | RESTful API development; OAuth 2.0; PostgreSQL; Docker; Git | 40,000–55,000 |
| Data Protection Officer (DPO) | PDPA compliance monitoring; consent workflow management; Records of Processing Activities; breach response; liaison with PDPC | PDPA certification (T-DPO/CIPP); IT security background; 5+ years compliance experience | 35,000–50,000 |

This team structure represents an estimated monthly personnel cost of 155,000–215,000 THB — well within the municipality's "Other Operations" budget allocation of 263.35 million THB annually, of which an estimated 24–60 million THB is currently spent on IT.[^24^] The DPO appointment is mandatory under PDPA Section 41 for organizations processing personal data of 100,000+ data subjects; Yala Province registers 552,479 residents.[^23^] Training costs (THB 15,000–50,000 per DPO certification) should be budgeted in Phase 1.[^25^]

**Partnership strategy.** Three partnerships are critical for long-term sustainability. The Southern Border Provinces Administrative Center (SBPAC, ศอ.บต.) provides access to security-sensitive development data — specifically KEADILAN center complaint data via opendata.sbpac.go.th as a proxy for grievance density — and coordinates development funding for the southern border provinces.[^26^] Prince of Songkla University (PSU) Pattani Campus offers research collaboration capacity, particularly for education outcome analysis (given the pondok mapping requirement) and socioeconomic research using municipal data.[^27^] The Digital Economy Promotion Agency (DEPA) administers smart city funding programs; Phuket's 50-million-THB City Data Platform was DEPA-funded, and Hat Yai's water tracking system similarly received DEPA support.[^28^] Yala's existing 15 datasets on citydata.in.th and three consecutive DGA awards position the municipality favorably for DEPA smart city grants.

**Continuous improvement cycle.** The platform requires an annual data source audit to verify that all feeds remain active, metadata is current, and API endpoints have not changed. Each audit cycle should align with the Integrity and Transparency Assessment (ITA) indicator refresh — Yala scored 91.21 (Grade A, Rank 9th of 65 LAOs) in FY2024, and the expanded dashboard with outcome indicators should further strengthen this performance.[^29^] Citizen feedback integration through the existing LINE OA @yalacity and Bellme complaint system channels ensures the dashboard evolves to meet actual user needs rather than administrator assumptions.[^30^] The open-source stack — PostgreSQL, GeoNode, CKAN, Kong, Metabase, Grafana — eliminates vendor licensing costs while enabling the municipality to modify and extend the platform as requirements evolve.

This 12-month roadmap moves Yala Municipality from a process-tracking dashboard to an outcome-oriented data platform using free government cloud infrastructure, open-source software, and data sources that are already available — requiring disciplined execution, strategic hiring, and the sustained political will to govern by evidence rather than intuition.


---

