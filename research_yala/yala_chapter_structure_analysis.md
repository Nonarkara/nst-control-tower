# Yala Municipality Data Source Bible — Structural Analysis

## 1. Key Themes

### Theme 1: The Operational-Outcome Data Divide
Yala Municipality operates one of Thailand's most advanced municipal digital infrastructures (3 consecutive DGA awards, dual dashboards, 5 big data systems, LINE OA, drone/MMS data collection), yet critical developmental outcome indicators are absent from decision-making views. The dashboard tracks budget execution, water consumption, and complaint resolution but does not display education outcomes, poverty distribution, health disparities, or economic productivity metrics. This is the central tension that the Data Source Bible must address.

### Theme 2: Education as the Defining Crisis
Education data emerges as the most urgent and complex dimension. Yala ranks 66th nationally on the HAI education dimension, with 44.2% youth enrollment versus 79.3% nationally, O-NET scores 21% below national averages, 30.8% NEET rate, and 12,802 out-of-school children. The 161 pondok institutions (126 registered, 35 unregistered) teaching the majority of secondary students outside the formal system create a massive data blind spot. This is not merely an education issue — it is a demographic, economic, security, and cultural issue requiring integrated data approaches.

### Theme 3: Security-Development Interdependence
Yala's conflict data (22,495+ incidents, 7,594 deaths since 2004, ongoing Emergency Decree) cannot be treated in isolation. Cross-dimensional analysis reveals mental health disorder prevalence at 9.6%, only 9 psychiatrists for the entire province, school disruptions, and investor hesitancy all linked to security conditions. Security data must inform health service planning, education interventions, and economic development — but requires responsible use frameworks that aggregate rather than disaggregate sensitive information.

### Theme 4: Agricultural Productivity Vulnerability
The economic data reveals a severe structural problem: 61.8% of Yala's workforce is in agriculture but agriculture contributes only ~31% of GPP, meaning agricultural workers earn roughly half the per-worker output of non-agricultural workers. With rubber price declines of 16.1% year-over-year and the province dependent on a single commodity, the economy is highly vulnerable to external shocks. The Betong border economy (US$139M+ trade, 400-2,000 daily crossings) offers a diversification opportunity but lacks integrated data.

### Theme 5: Aging Society Without Predictive Planning
Yala entered "Aged Society" status in 2023 (13.89% elderly, aging index 55.09) with 76,338 elderly persons. The dashboard shows elderly/disability allowances as a static line item without predictive modeling. With national projections showing Thailand's 60+ population reaching 31.37% by 2040, and health workforce already strained (9 psychiatrists for entire province, 1:2,906 population-to-doctor ratio in community hospitals), the municipality needs forward-looking demographic scenarios rather than current counts alone.

### Theme 6: Climate and Disaster Risk Escalation
Southern Thailand faces increasing climate risk (World Bank projects 1.0-3.8C warming by 2080-2099). Yala has experienced catastrophic floods (Feb 2022: 3,114 households; Dec 2023 "50-year flood": 15,457 households, 4 deaths; Nov-Dec 2024: 664K+ region-wide). Yet the dashboard has limited climate/disaster risk visualization despite GISTDA flood monitoring, CHIRPS rainfall data, GloFAS forecasts, and Bang Lang Dam level data all being freely available.

### Theme 7: National Infrastructure Underutilization
Multiple free national resources are available but not fully leveraged: GDCC (free government cloud IaaS), GDX (inter-agency data exchange, 194 agencies), CityData.in.th (DEPA platform with 15 datasets but expandable), GD Catalog (156 agency data catalogs), DOPA API (population registration), and NSO StatHub (SDMX statistical feeds). The municipality has built standalone systems (Bellme, Bedrock Analytics) without maximizing national integration, creating data silos and increasing costs.

### Theme 8: Governance Transparency as Both Indicator and Driver
Yala's ITA score of 91.21 (Grade A, Rank #9 of 65 LAOs in province) creates a positive feedback loop: higher ITA requires more published data, which drives better dashboard development. However, the current dashboard optimizes for ITA metrics rather than developmental outcomes. Realigning the dashboard to track both transparency AND outcome metrics serves dual purposes — maintaining ITA performance while adding genuine decision-making value.

---

## 2. Content Priorities

### P0 — Must Appear Front and Center
- Yala's current dashboard infrastructure and its specific gaps (no economic data, no transportation data, no outcome indicators)
- National data portals that can fill gaps immediately (DEPA CityData API, data.go.th CKAN, NSO StatHub SDMX, DOPA API)
- Education crisis data and the pondok system blind spot
- Security data sources with responsible use frameworks
- Free national resources the municipality is not using (GDCC, GDX)

### P1 — Critical Supporting Content
- Health data sources (MOPH HDC, BOE 506, NHSO UCInfo) and workforce shortages
- Economic data (NESDB GPP, OAE agricultural, DBD business registration, Betong border trade)
- Demographic aging data and predictive modeling sources
- Climate/disaster data integration (GISTDA flood API, CHIRPS, GloFAS)
- Geospatial infrastructure (GISTDA Sphere, RTSD boundaries, LandsMaps)

### P2 — Important Context
- Municipal governance data (e-LAAS, ITA, LPA, SAO audits)
- International supplementary data (World Bank, UNDP SDG Profile, HDX, WorldPop)
- Technical architecture standards (TH-e-GIF, PDPA, reference implementations)
- Infrastructure monitoring (PWA, PEA, air quality, waste)

### P3 — Reference Material
- Specific API documentation details
- Authentication procedures
- Detailed code examples
- International comparison frameworks (ASEAN, ESCAP)

---

## 3. Natural Groupings

### Grouping A: The Municipal Foundation (Dim01 + Dim10)
The existing dashboard baseline and municipal governance data form a natural pair — together they describe what Yala already has and how it is governed. Both deal with internal municipal operations: the dashboard (yaladashboard.com) and the governance systems (e-LAAS, ITA, LPA, SAO audits, procurement, council minutes) that produce the data feeding it.

### Grouping B: The National Data Ecosystem (Dim02 + Dim12)
National open data portals and technical architecture are inseparable — the portals provide the data, the architecture provides the means to integrate it. This grouping covers all the national systems (data.go.th, GDX, DOPA, NSO StatHub, GDCC) plus the standards (TH-e-GIF, PDPA) and reference implementations (Phuket, Hat Yai, Khon Kaen) needed to connect them.

### Grouping C: Geospatial Backbone (Dim03 + Dim09)
Geospatial data and infrastructure/environment data are naturally layered. The geospatial stack (GISTDA Sphere, boundaries, DEM, satellite imagery) provides the canvas on which infrastructure (water, electricity, roads, WiFi, building permits) and environmental data (air quality, weather, rainfall, floods, climate projections) are mapped.

### Grouping D: Population and Society (Dim04 + Dim06 + Dim07)
Demographics, health, and education together form the human development picture. These three dimensions are deeply intertwined: aging demographics strain health services, the education crisis feeds into economic productivity gaps, health outcomes are shaped by conflict trauma, and population structure determines service demand across all sectors.

### Grouping E: Economy and Livelihoods (Dim08 + Dim05)
Economic data and security data must be presented together because they are causally linked in Yala's context. Security conditions affect investment, the agricultural economy is vulnerable to commodity shocks, border trade offers economic opportunity, and informal employment dominates. The security data requires special framing as a development planning tool rather than a safety indicator alone.

### Grouping F: International and Supplementary (Dim11)
International data sources stand alone as a supplementary layer — they provide benchmarking, validation, and gap-filling through World Bank indicators, UNDP SDG profiles, HDX humanitarian data, satellite platforms (Copernicus, Google Earth Engine), and population estimates (WorldPop, Meta HRSL).

---

## 4. Suggested Chapter Sequence

### Chapter 1: Yala's Digital Foundation — Where We Are Now
- **Source Dimensions**: Dim01 (Existing Dashboard), Dim10 (Municipal Governance)
- **Content**: Current dashboard inventory (yaladashboard.com), 5 big data systems, organizational structure, IT staffing, budget composition, governance frameworks (ITA, LPA, e-LAAS, SAO audits), and the specific gaps identified (no economic data, no transport data, no outcome indicators)
- **Purpose**: Establish the baseline — what Yala already operates and what is missing

### Chapter 2: The National Data Ecosystem — What's Available
- **Source Dimensions**: Dim02 (National Open Data Portals), Dim12 (Technical Architecture)
- **Content**: data.go.th, DEPA CityData, DOPA API, NSO StatHub, GDX, GD Catalog, GovSpending, e-GP, DBD DataWarehouse; plus TH-e-GIF standards, PDPA compliance, GDCC hosting, and reference architectures from Phuket, Hat Yai, Khon Kaen
- **Purpose**: Map the national data infrastructure available for integration and the technical standards required

### Chapter 3: Building the Geospatial Backbone
- **Source Dimensions**: Dim03 (Geospatial Data), Dim09 (Infrastructure/Environment)
- **Content**: GISTDA Sphere API, administrative boundaries, DEM, THEOS-2 satellite; layered with PWA water, PEA electricity, air quality (air4thai), weather (TMD), rainfall (CHIRPS), flood monitoring (GISTDA/GloFAS), Bang Lang Dam data, roads (DRR/DOH), building permits, and 48 WiFi points
- **Purpose**: Create the spatial foundation for all subsequent data layers

### Chapter 4: Understanding the People — Demographics, Health, and Education
- **Source Dimensions**: Dim04 (Demographics), Dim06 (Health), Dim07 (Education)
- **Content**: DOPA population (552,479), Muslim majority (79.6%), MPI poverty (20.83%), aging society (13.89% elderly), labor force; health workforce (9 psychiatrists, dengue rank #7, malaria, MMR vaccination gaps, mental health 9.6%); education crisis (HAI rank 66th, O-NET gaps, 161 pondok, 30.8% NEET, 12,802 out-of-school)
- **Purpose**: Present the human development picture with data sources for each indicator

### Chapter 5: Tracking the Economy — From Rubber to Border Trade
- **Source Dimensions**: Dim08 (Economic Data), Dim05 (Security/Conflict Data)
- **Content**: NESDB GPP, OAE agricultural production and rubber prices, DBD business registration, Betong border trade (US$139M+), tourism (1.55M visitors), informal economy (198,150 workers); DSW security data, ACLED/UCDP conflict data, SBPAC complaint centers, with responsible use frameworks for each
- **Purpose**: Map economic data sources and security data as a development planning tool

### Chapter 6: International Data — Benchmarking and Gap-Filling
- **Source Dimensions**: Dim11 (International Data)
- **Content**: World Bank indicators, UNDP SDG Profile Yala, HDX HAPI, WorldPop projections, Meta HRSL, Copernicus/Sentinel-2, Google Earth Engine, CHIRPS, GloFAS, Global Forest Watch
- **Purpose**: Provide supplementary sources for benchmarking, validation, and advanced analytics

### Chapter 7: The Integration Roadmap — From Data to Decisions
- **Source Dimensions**: Dim12 (Architecture insights), Cross-dimension insights
- **Content**: The 6-layer reference architecture (Presentation > API Gateway > Application > Data > Collection > Infrastructure), phased 4-stage implementation (Foundation > Integration > Analytics > Advanced), data source priorities per phase, PDPA compliance checklist, data catalog standards
- **Purpose**: Provide the mayor and team with a concrete action plan

---

## 5. Critical Data Points

1. **Yala Province population**: 552,479 (DOPA 2024), 180,582 households, 79.6% Muslim, 20.83% MPI poverty rate. This is the foundational demographic anchor for all planning.

2. **Yala City Municipality population**: 57,640 registered residents (dashboard FY2025) or 61,315 (DOPA 2024). The discrepancy itself matters — it represents approximately 2,600 unregistered or temporary residents not captured in municipal services.

3. **Municipal budget**: 1,190.53 million THB (FY2025), with only 57.13 million THB in tax revenue (~4.8%) and 60-70% from central transfers. This dependency ratio determines fiscal flexibility.

4. **Education HAI rank 66th**: Youth enrollment at 44.2% versus 79.3% nationally, O-NET scores 21% below national, 30.8% NEET rate, and 12,802 out-of-school children. The 161 pondok institutions (126 registered, 35 unregistered) create the data blind spot.

5. **Agricultural productivity gap**: 61.8% of workforce in agriculture but agriculture contributes only ~31% of GPP, meaning agricultural workers earn roughly half the per-worker output of non-agricultural workers. Rubber price decline of 16.1% YoY exacerbates this.

6. **GPP per capita**: 91,815 THB (2018), only 38.8% of the national average (236,815 THB). This is the most direct measure of Yala's economic distance from the rest of Thailand.

7. **Aging society arrived 2023**: 13.89% elderly (76,338 persons), aging index 55.09. With only 9 psychiatrists for the entire province and 1:2,906 population-to-doctor ratio, health workforce capacity is already strained.

8. **Security incident totals**: 22,495+ incidents, 7,594 deaths, 14,122 injuries since 2004 (DSW data). Yala under Emergency Decree (77th extension as of 2024). These numbers frame all other development indicators.

9. **Climate disaster scale**: Feb 2022 floods affected 3,114 households; Dec 2023 "50-year flood" affected 15,457 households with 4 deaths; Nov-Dec 2024 region-wide floods affected 664K+ households. The Pattani River basin receives 1,500-2,200mm annual rainfall.

10. **Three consecutive DGA awards** (2022, 2023, 2024) with ITA score 91.21 (Grade A) demonstrate existing digital capacity. The dashboard already operates 19+ modules but lacks outcome indicators — capacity exists, redirection is needed.

11. **Betong border economy**: US$139M+ in cross-border trade, 400-2,000 daily border crossings, designated model sustainable development city. No integrated trade or mobility dashboard exists.

12. **Informal economy dominance**: 198,150 informal workers (76.5% of employed), with 78% in agriculture. Social Security Office coverage is minimal relative to this population.

13. **Free national resources unutilized**: GDCC (free IaaS, 219 agencies, 3,065 systems), GDX (194 agencies, 35.3M data linkages), 15 datasets on DEPA but expandable, TH-e-GIF compliance framework. The infrastructure exists; connection does not.

14. **Tourism growth**: 1.55 million visitors generating 4,720 million THB revenue (2023), representing ~11% of GPP. Yet no tourism data collection system exists on the dashboard.

15. **Mental health burden**: 9.6% lifetime mental disorder prevalence in Deep South, with only 18.7% of affected individuals seeking help. 9 psychiatrists for the entire province of 552,479 people.

---

## 6. Gaps Noted

### Thin Areas in the Research

1. **Real-time transportation data**: The dashboard public transport module shows "0 trips." No municipal bus system, no real-time transit data feeds, and no IoT deployment on public transport were identified. The research catalogs the absence but has no concrete data source to fill it.

2. **Municipal-level economic data**: GPP data is available only at provincial level. No municipal-level GPP disaggregation exists. Business registration data from DBD is at district level at best. The Bible must work with proxies and estimates.

3. **Pondok student outcomes**: While the number of institutions (161) and enrollment estimates are available, there is no standardized assessment of pondok graduate outcomes — no tracer studies, no employment data, no transition rates to formal education or the workforce.

4. **Cross-border trade detail**: Betong border trade figures (US$139M+) are from a single peak year reference (FY2013). Current trade volumes, commodity breakdowns, and seasonal patterns are not publicly available and would require direct Customs Department engagement.

5. **Household debt at provincial level**: National household debt figures exist (87.2% of GDP) but provincial-level household debt data relies on NSO SES survey cycles (every 2-3 years) with limited disaggregation. The Yala NSO has an infographic but detailed data requires formal request.

6. **Water billing integration**: The water billing system operates on a separate platform (yala.kanam.tech) with no API connection to the dashboard. Research identifies the gap but does not provide an integration pathway.

7. **IT staff capacity**: No dedicated IT staff count was found. IT functions are consolidated within the Strategy Division but the exact headcount, skill mix, and capacity for additional integration work is unknown.

8. **Private health facility data**: Most health data comes from MOPH public facilities. Private hospital data may not be fully captured in public systems, creating a gap in understanding total health service capacity.

9. **Migrant and non-Thai population health data**: IOM 2024 scoping estimated ~2,100 non-Thai residents in assessed Yala communities, but health data for non-Thai populations is incomplete. This group is largely invisible to municipal health planning.

10. **Security impact on education delivery**: While the education crisis and security situation are documented separately, there is no systematic tracking of school closures, teacher transfers, or education service disruption correlated with security incidents.

11. **Recent post-COVID education data**: Most detailed education data is from 2018-2019. Post-pandemic enrollment, dropout, and O-NET data is limited, making it difficult to assess COVID-19's impact on Yala's already-strained education system.

12. **Municipal electricity consumption**: Despite PEA Area 3 headquarters being located in Yala and electricity being a key infrastructure service, no municipal-level electricity consumption data was found for dashboard integration.
