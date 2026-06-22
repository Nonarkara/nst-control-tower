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

