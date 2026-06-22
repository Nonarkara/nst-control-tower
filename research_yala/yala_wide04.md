## Facet: Municipal Governance & Local Government Data Systems

*Research compiled for the City Municipality of Yala (เทศบาลนครยะลา) — comprehensive exploration of Thai municipal governance structure, data systems, smart city implementations, and policy frameworks.*

---

### Key Findings

1. **Yala City Municipality ALREADY has an operational dashboard system**: Yala won the "YALA Resilience City" Digital Local Government Award in 2022 (DGTi Awards) [^107^] [^108^]. The system includes a Mayor Dashboard, Citizen Dashboard, and Chatbot accessible via LINE (@yalacity), mobile app, and www.yaladashboard.com [^62^] [^107^]. Population as of 2023: approximately 61,315 residents within 19.4 km² [^38^] [^42^].

2. **Thailand has a national smart city framework with 7 dimensions**: Smart Environment, Smart Mobility, Smart Living, Smart People, Smart Energy, Smart Economy, and Smart Governance — managed by DEPA (Digital Economy Promotion Agency) [^2^] [^113^].

3. **All Thai municipalities must report financial data to central government via e-LAAS** (Electronic Local Authority Accounting System), but only ~1,200 out of 7,853 LAOs were using it as of 2010 due to connectivity, capacity, and enforceability problems [^63^] [^64^].

4. **Traffy Fondue is the dominant citizen engagement platform** across Thai municipalities, used by 1,754+ organisations, 577 municipality offices, with 940,000+ complaints recorded and 77% success rate [^2^] [^85^].

5. **Thailand's Personal Data Protection Act (PDPA)** came into full force on June 1, 2022, significantly impacting how municipalities can collect, use, and disclose citizen data [^110^] [^116^].

6. **The Integrity and Transparency Assessment (ITA)** is an annual evaluation of all 8,299+ government agencies including local administrative organisations, with open data as one of 10 indicators [^33^] [^35^].

---

### Thai Municipal Structure & Data Responsibilities

#### 1. City Municipality (Thesaban Nakhon / เทศบาลนคร)
- **Qualification**: Provincial capital OR population of at least 50,000 [^20^] [^22^]
- **Governance**: Elected mayor (นายกเทศมนตรี) and council (สภาเทศบาล) with 24+ members depending on population
- **Data collected**: Resident registration, property tax records, building permits, public health data, road/infrastructure inventory, waste management data, water/sewage system data, market oversight records, local ordinance compliance data [^20^]
- **Reporting to central government**: Financial data via e-LAAS, performance data via Local Quality Management (LQM) system, quarterly loan repayment status to DLA and PDMO [^13^] [^63^]
- **Services**: Urban planning, water/sewage systems, solid waste collection, local road upkeep, public health, resident registration, market oversight, fire prevention [^20^]

#### 2. Town Municipality (Thesaban Mueang / เทศบาลเมือง)
- **Qualification**: Population 10,000-50,000 OR annual revenue exceeding 60 million baht [^20^]
- **Governance**: Elected mayor and council with 12-24 members [^20^]
- **Data collected**: Similar to city municipalities but smaller scale; district headquarters serve as regional administrative and commercial hubs
- **Thailand has 179 town municipalities** as of 2020 data [^20^]

#### 3. Subdistrict Municipality (Thesaban Tambon / เทศบาลตำบล)
- **Qualification**: Upgraded from former sanitary districts (sukhaphiban) since 1999 [^22^] [^18^]
- **Governance**: Elected mayor and smaller council
- **Data collected**: Basic municipal service data, population registration, limited infrastructure data
- **Thailand has 1,020+ subdistrict municipalities** [^18^]

#### 4. Provincial Administrative Organization (PAO / องค์การบริหารส่วนจังหวัด)
- **Role**: Covers entire province except Bangkok; divided into legislative (assembly) and executive (chairman) branches [^22^]
- **Data collected**: Provincial-level development data, health and education service data (where devolved), provincial transport and infrastructure data
- **One PAO in every province except BMA** [^18^]

#### 5. Tambon Administrative Organization (TAO / องค์การบริหารส่วนตำบล)
- **Role**: Rural subdistrict-level administration, Thailand has 5,770+ TAOs [^63^]
- **Data collected**: Basic village-level development data, rural infrastructure, agricultural extension data

#### 6. Bangkok Metropolitan Administration (BMA)
- **Special status**: Directly controlled, not a municipality; has greater fiscal autonomy and data infrastructure [^22^]
- **Data systems**: BMA Traffic CCTV (bmatraffic.com), open data portal, Traffy Fondue integration [^2^]

---

### Existing Smart City/Municipal Dashboards in Thailand

#### 1. **Yala City Municipality — YALA Resilience City** (CRITICAL REFERENCE)
- **URL**: https://www.yaladashboard.com (Citizen Dashboard) + internal Mayor Dashboard [^62^] [^40^]
- **Awards**: Digital Local Government Award (DGTi) 2022 — "Best/Excellence" category; Digital Government Awards 2022 from the Prime Minister [^107^] [^111^]
- **Platform components**:
  - Mayor Dashboard (ระบบรวมศูนย์ข้อมูลสำหรับผู้บริหาร) — consolidated executive decision-making data
  - Citizen Dashboard (แดชบอร์ดประชาชน) — public-facing data including population statistics [^40^]
  - Chatbot — automated citizen interaction
  - LINE Official Account: @yalacity [^107^]
  - Yala Mobile Application [^107^]
- **Problem it solved**: Yala's organisational structure was fragmented (data stored independently across departments), leaving executives without integrated data for decision-making and citizens without easy access to municipal information [^107^]
- **Data displayed**: Population statistics from civil registration (births, deaths, migration trends), municipal project tracking [^40^]
- **Contact**: Strategy Division (กองยุทธศาสตร์), 073-223666, info@yalacity.go.th [^40^]
- **Lessons for Yala**: Build on existing infrastructure; the dashboard exists but could be enhanced with more real-time data streams, geospatial layers, and integration with DEPA's City Data Platform.

#### 2. **Hat Yai Municipality — DEPA Smart City Data Platform**
- **URL**: https://www.citydata.in.th/hatyai/en/dashboard-public-en/ [^65^]
- **Platform**: DEPA Smart City Data Platform (citydata.in.th) with ArcGIS integration [^117^]
- **Datasets available**:
  - Smart Energy: Energy consumption overview (WEIS Big Data)
  - Smart Living: Air pollution management
  - Smart Economy: Rubber farmer information (NSO data)
  - Smart Environment: Waste management information
  - City Data Information: Basic demographic information (NSO)
  - Smart People: Educational institution counts [^65^]
- **Area**: 21 km², ~158,000 population, density ~7,542 persons/km² [^67^]
- **GIS**: Public Green Space GIS project using EPIC Model with Thammasat University; uses aerial photography, site surveys, ArcGIS overlay analysis [^61^]
- **Lessons for Yala**: The DEPA platform provides a ready-made template with standardised smart city indicators across all 7 dimensions. Hat Yai shows how a southern Thai municipality can deploy the platform effectively.

#### 3. **Phuket City Data Platform (PCDP)** — Thailand's FIRST Smart City (2016)
- **Platform**: City Data Platform with Intelligence Operation Center [^88^] [^91^]
- **Infrastructure**: 
  - 14 IoT sensors (temperature, rainfall, humidity, water level, CO, water oxygen saturation)
  - 300+ CCTV cameras at Disaster Command Center (some with OCR/facial recognition)
  - LoRaWAN and NB-IoT networks, 1,000 public free WiFi access points
  - 5G coverage (70% of area) [^88^] [^89^]
- **Data analytics**: Tourist behaviour analysis, safety/environment monitoring, investor information [^91^]
- **Cloud**: Hosted on CAT Telecom cloud [^88^]
- **Investment**: US$11 million from Thai government [^16^]
- **Lessons for Yala**: Phuket demonstrates the full-stack smart city approach with IoT sensors, CCTV analytics, and a central command centre. However, Yala can adopt a lighter, more cost-effective approach focusing on citizen needs rather than tourism monitoring.

#### 4. **Nakhon Si Thammarat — @NakhonCity Platform**
- **URL**: https://www.nakhoncity.org/ [^87^]
- **Platform**: "My City" app (Line-based) developed by Siam Inno City startup [^87^] [^128^]
- **Features**: Citizen complaint reporting, real-time flood camera access, pet registration, CCTV live feeds [^124^]
- **Impact**: 38,000 complaints resolved in 3 years, 70%+ population adoption, $500,000 operational savings, pothole repair reduced from 15 days to 48 hours [^127^]
- **Recognition**: Won multiple smart city awards globally [^124^]
- **Lessons for Yala**: NST shows that a Line-based platform achieves maximum citizen adoption (95% of Thai smartphone users have LINE). The @NakhonCity model is extremely replicable for Yala's context. DEPA aims to scale this to 7,000+ municipalities by 2027 [^128^].

#### 5. **Khon Kaen — Smart Bus & Transportation Hub**
- **URL**: Part of ASEAN Smart Cities Network [^15^]
- **Focus**: Smart Bus project with 24-hour service, smart card ticketing, Khon Kaen University electric bus pilot [^15^]
- **Aspirations**: Medical hub, transportation hub, MICE city [^16^]
- **Technology**: IoT, GPS tracking, smart card integration [^16^]
- **Lessons for Yala**: Khon Kaen demonstrates focusing on one strong use case (transportation) rather than trying to implement all 7 smart dimensions simultaneously.

#### 6. **Chiang Mai — Smart Agriculture & Environment**
- **Focus**: Smart agriculture (80% of area is agricultural), air pollution/haze monitoring, AR tourism app [^16^] [^24^]
- **Technology partnership**: Maejo University for wireless farm irrigation sensors [^16^]
- **Budget**: 36.5 million baht smart city project [^24^]
- **Lessons for Yala**: Chiang Mai's university-municipality partnership model is highly relevant. Yala could partner with Prince of Songkla University or Yala Rajabhat University for agricultural and environmental monitoring.

#### 7. **Bangkok — Traffy Fondue & BMA Open Data**
- **BMA Traffic CCTV**: http://www.bmatraffic.com/index.aspx [^2^]
- **Traffy Fondue**: https://www.traffy.in.th/ / https://fondue.traffy.in.th/teamchadchart [^83^] [^85^]
  - 927,480+ complaints processed, 80%+ success rate
  - Average resolution time: 6.2 hours (reduced from days)
  - Cost savings: 78 million THB annually
  - Open API available for researchers and developers [^83^]
  - 14 complaint categories: cleanliness, electricity/water, streetlights, roads/sidewalks, buildings, equipment, risk points, disasters, trees/smells, registration, help, health, corruption clues, others [^83^]
- **Lessons for Yala**: Bangkok proves that complaint-driven data collection works at scale. Yala should integrate Traffy Fondue (available free to municipalities until September 2025) with its existing Yala Dashboard.

#### 8. **Wangchan Valley Smart City (Rayong)**
- **URL**: https://www.citydata.in.th/wangchan/en/reports/smart-city/ [^112^]
- **Platform**: DEPA-certified smart city in "new city" category
- **Seven dimensions**: Smart Environment, Smart Governance, Smart Mobility, Smart Energy, Smart Economy, Smart Living, Smart People [^112^]
- **City Data Platform**: collects, stores, and manages city data for decision-making [^112^]
- **Lessons for Yala**: Wangchan Valley shows the DEPA certification pathway and how a City Data Platform can serve as the central nervous system for smart city development.

---

### Relevant Policies & Mandates

#### 1. **Municipal Administration Act B.E. 2496 (1953) — as amended**
- **What it is**: Foundational law establishing municipalities in Thailand, defining compulsory and optional functions [^20^] [^123^]
- **Compulsory functions**: Maintaining roads/waterways, keeping public spaces clean, maintaining public peace, preventing infectious diseases, providing clean water, sewage disposal [^123^]
- **Data implications**: Municipalities must maintain records of all these service areas; Section 50(3) mandates road cleaning and pathway sanitation [^20^]

#### 2. **Decentralization Plan and Procedure Acts (1999)**
- **What it is**: Implemented 1997 constitution's decentralization mandates; upgraded all sanitary districts to subdistrict municipalities [^22^]
- **Data implications**: Required establishment of local administrative accounting and reporting systems

#### 3. **Local Administration Act (1999) — as amended**
- **What it is**: Governs all local administrative organisations; empowers elected mayors and councils to enact bylaws and budgets [^20^]
- **Data implications**: Subject to DLA audits for compliance; requires transparent financial reporting

#### 4. **e-LAAS (Electronic Local Authority Accounting System)**
- **What it is**: Full enterprise resource planning system for budgetary management; hosted by DLA [^63^]
- **Mandate**: Subnational governments required by law to input revenue and expenditure data daily [^13^]
- **Current state**: Only ~1,200 of 7,853 LAOs using the system due to connectivity, capacity, and enforceability issues [^63^] [^64^]
- **Implications for Yala**: Yala should ensure e-LAAS compliance and use the data to populate its Mayor Dashboard with financial indicators

#### 5. **Thailand Smart City Development Framework (DEPA)**
- **What it is**: National framework defining 7 smart city dimensions and requiring City Data Platform as one of 5 development guidelines [^113^]
- **CDP Definition**: "A source of digital data that supports the connection and exchange of information between public and private agencies and citizens in the city, systematically, ready to use, safe, and protect personal information" [^113^]
- **5 guidelines for smart city development**: (1) Geographic boundary and smart city vision, (2) Infrastructure plan, (3) City data platform with cyber security, (4) Smart city solutions and services, (5) Sustainable management model [^91^]

#### 6. **Personal Data Protection Act B.E. 2562 (2019)**
- **Full enforcement**: June 1, 2022 [^110^] [^116^]
- **Key requirements for municipalities**:
  - Must obtain consent for collecting personal data (unless for public interest tasks)
  - Must appoint Data Protection Officer (DPO) if processing sensitive personal data or large-scale monitoring [^116^]
  - Data breach notification within 72 hours to regulator [^110^]
  - Must allow data subjects to access, correct, erase their data
  - Fines up to THB 5 million for administrative violations, up to 1 year imprisonment for criminal violations [^116^]
- **Implications for Yala**: Any citizen dashboard collecting personal information must be PDPA-compliant. Yala's Chatbot and LINE OA must include privacy notices and consent mechanisms. The existing system at yaladashboard.com should be reviewed for PDPA compliance.

#### 7. **Integrity and Transparency Assessment (ITA)**
- **What it is**: Annual assessment of all 8,299+ government organisations by NACC [^33^] [^35^]
- **Three components**:
  - IIT (Internal Integrity and Transparency): 5 indicators — performance of duty, budget expenditure, exercise of power, management of government property, corruption mitigation
  - EIT (External Integrity and Transparency): 3 indicators — service quality, communication efficiency, improvement of work processes
  - OIT (Open Data Integrity and Transparency): 2 indicators — disclosure of information, corruption prevention [^33^] [^35^]
- **Target**: All agencies expected to score at least 85% in ITA by 2027 [^33^]
- **Implications for Yala**: Yala's dashboard directly supports OIT indicators. Maintaining and expanding open data publication improves ITA scores, which is linked to national anti-corruption strategy.

#### 8. **Open Government Data Policy**
- **Portal**: https://data.go.th and https://api.data.go.th [^2^]
- **Mandate**: Central government agencies must publish open data; local government encouraged but not universally mandated
- **Relevant datasets**: Population statistics (NSO), education statistics, local government consumption data, trade data [^2^]
- **Implications for Yala**: No explicit legal mandate for municipalities to publish open data, but ITA assessment incentivises it. Yala is already ahead of most municipalities by having yaladashboard.com.

---

### Trends & Signals

1. **Shift from technology-driven to human-centric smart cities**: DEPA has pivoted from "greenfield masterplan" to community-driven approach emphasising citizen engagement [^128^]. Dr Non Arkara of DEPA: "Too often, new smart cities are designed in a top-down manner with fancy technologies but minimal citizen engagement. We flipped the script." [^128^]

2. **LINE as the dominant citizen engagement channel**: All successful Thai municipal platforms (Traffy Fondue, @NakhonCity, Yala's @yalacity) use LINE as the primary interface, capitalising on 92.8% penetration among Thai internet users [^83^] [^127^]. Building standalone apps is less effective.

3. **City Data Platforms becoming mandatory infrastructure**: DEPA's CDP is now one of five required components for smart city certification, with ArcGIS integration offered as a standard solution [^117^] [^113^].

4. **IoT sensor deployment accelerating**: Phuket has 14+ environmental IoT sensors; Hat Yai has air quality monitoring. GISTDA provides satellite data through Sphere platform (sphere.gistda.or.th) for all municipalities [^88^] [^2^].

5. **Citizen complaint data as primary smart city data source**: Unlike Western cities that rely on sensor networks, Thai smart cities derive much of their operational data from citizen complaints via Traffy Fondue and similar platforms [^2^] [^83^].

6. **Free platforms available to municipalities**: Traffy Fondue is free for local administrations (MoU between NSTDA and DLA, valid until September 2025) [^85^]. DEPA's citydata.in.th platform is also available at no cost.

7. **Data protection compliance becoming critical**: PDPA enforcement since 2022 means all municipal data collection must include consent mechanisms, DPO appointment, and breach notification protocols [^110^] [^116^].

8. **Academic partnerships as enablers**: Hat Yai works with Thammasat University; Chiang Mai with Maejo University; Nakhon Si Thammarat with Rajamangala University of Technology Srivijaya [^61^] [^16^]. Yala should leverage nearby universities similarly.

9. **Growing expectation for real-time municipal data**: Citizens increasingly expect to track complaint resolution status, view real-time traffic conditions, access population statistics, and monitor environmental conditions through municipal dashboards [^124^] [^40^].

10. **AI-enhanced analysis emerging**: The @NakhonCity platform now incorporates AI for structuring unstructured citizen reports [^127^]. BMA uses AI for complaint categorisation in Traffy Fondue [^83^].

---

### Controversies & Limitations

1. **e-LAAS adoption failure**: Despite being mandatory, only ~15% of LAOs use e-LAAS after 15+ years of implementation, revealing deep capacity and connectivity gaps in Thai local government [^63^] [^64^]. Yala may face similar challenges with advanced dashboard technologies.

2. **Fragmented data across departments**: Yala's own case study highlights this — data stored independently across departments in "separate silos" that don't interconnect, leaving executives without integrated data for decision-making [^107^]. This is a nationwide problem.

3. **Small administrative organisations and southern region have lowest ITA scores**: "Small administrative organisations and those in the south and north-eastern regions had the lowest scores, reflecting potentially lower implementing capacity than larger authorities" [^33^]. Yala falls into this category.

4. **Digital divide concerns**: Bangkok Governor Chadchart acknowledged that digital platforms "might create some inequalities — some people don't have access to platforms" [^87^]. Yala must complement digital dashboards with face-to-face community meetings and non-digital channels.

5. **Municipal fiscal constraints**: Local authorities must run balanced budgets and face highly constrained tax autonomy [^13^]. Smart city investments require central government subsidies or DEPA funding.

6. **Limited actual smart city data utilisation**: Research found that while datasets are marked as "used in city operation," their primary application is for reporting rather than real operational decision-making [^2^].

7. **PDPA compliance burden**: For smaller municipalities like Yala, appointing a DPO and implementing PDPA-compliant data systems represents significant administrative burden [^110^].

8. **Overlapping jurisdictions**: Many infrastructure elements (electricity by MEA, arterial roads by Ministry of Interior) are not under municipal control, limiting the scope of data that can be collected and acted upon [^87^].

9. **University-municipality gaps**: Research found that even in Chiang Mai (a smart city pilot), the local Maejo municipality website "does not provide sufficient information and most information is not up to date," with strategic plans still focusing on basic infrastructure needs rather than smart city integration [^24^].

10. **National policy vs local implementation gap**: "During the implementation stage, there were some obstacles such as unclear of the policy, lack of readiness, lack of understanding, insufficient budget, poor infrastructure, and lack of concrete guidelines" [^24^].

---

### Recommended Deep-Dive Areas

1. **Yala's existing dashboard technical architecture**: Understanding the current tech stack, data sources, and integration points of yaladashboard.com to plan enhancements. **Why**: Yala already has a foundation that most Thai municipalities lack; building on it is more efficient than starting fresh.

2. **DEPA City Data Platform integration**: How to connect Yala's existing dashboard with DEPA's national citydata.in.th platform for standardised indicator reporting. **Why**: DEPA provides the certification pathway, technical support, and national visibility.

3. **Traffy Fondue integration**: How to integrate Yala's complaint management with Traffy Fondue's national platform. **Why**: Free until September 2025; already used by 577+ municipalities; provides open data API for analytics.

4. **PDPA compliance for municipal dashboards**: Specific requirements for Yala's Chatbot, LINE OA, and citizen dashboard to comply with data protection law. **Why**: Non-compliance carries fines up to 5 million THB and potential criminal liability.

5. **GISTDA Sphere geospatial integration**: How to incorporate satellite imagery, aerial survey data, and geospatial analytics from GISTDA's platform into Yala's dashboard. **Why**: GISTDA provides free/affordable geospatial data that can dramatically enhance urban planning capabilities.

6. **Southern Thailand municipal data ecosystem**: Exploring partnerships with Hat Yai, Nakhon Si Thammarat, Songkhla, and Pattani municipalities for shared data standards and cross-regional benchmarking. **Why**: Regional cooperation can reduce costs and accelerate learning.

7. **e-LAAS data extraction for dashboard visualisation**: How to pull financial data from e-LAAS into Yala's Mayor Dashboard for real-time budget monitoring. **Why**: Financial transparency is a key ITA indicator and citizen trust builder.

8. **Open data standards and interoperability**: Which international standards (OpenGov, CKAN, OGC WMS/WFS) are most applicable for Yala's context. **Why**: Standards ensure data can be shared across systems and with central government platforms.

---

### Yala City Municipality Profile Summary

| Attribute | Detail |
|-----------|--------|
| **Full name** | เทศบาลนครยะลา (Yala City Municipality) |
| **Status** | City Municipality (Thesaban Nakhon) — upgraded 1995 (B.E. 2538) [^38^] |
| **Area** | 19.4 km² [^38^] |
| **Population** | ~61,315 (2023 NSO data) [^42^]; ~60,617 (2019 census) [^38^] |
| **Density** | ~3,190 persons/km² [^38^] |
| **District** | Mueang Yala, Yala Province |
| **Mayor** | พงษ์ศักดิ์ ยิ่งชนม์เจริญ (Phongsak Yingchoncharoen) [^32^] |
| **Municipal Clerk** | สมหมาย ลูกอินทร์ (Sommai Luk-in) [^32^] |
| **Communities** | 43 communities (ชุมชน) [^32^] |
| **Active projects** | 342 [^32^] |
| **Website** | https://www.yalacity.go.th [^32^] |
| **Dashboard** | https://www.yaladashboard.com [^40^] |
| **LINE OA** | @yalacity [^107^] |
| **Motto** | "เมืองแห่งพหุวัฒนธรรม สร้างสรรค์นวัตกรรม สู่คุณภาพชีวิตที่ดี" (City of multiculturalism, creative innovation, towards good quality of life) [^32^] |
| **Vision** | Smart City full implementation with data-driven governance [^107^] |
| **Awards** | DGTi Local Government Award 2022 (Excellence), Digital Government Awards 2022 [^107^] [^111^] |
| **Ethnic composition** | Thai Malay Muslims, Thai Buddhists, Chinese Muslims (Khor Suay/Kaek), Indian Sikhs [^38^] |
| **Key challenges** | Decentralised organisational structure with independent data silos; citizen access to municipal information [^107^] |

---

### Source List

[^1^] https://www.nso.go.th/nsoweb/index — National Statistical Office of Thailand

[^2^] https://www.frontiersin.org/journals/sustainable-cities/articles/10.3389/frsc.2024.1473123/full — Hansen et al. (2025), "How can data contribute to Smart City innovation: a study from Thailand's Smart City initiatives"

[^13^] https://www.citycred.org/sites/default/files/2024-12/Thailand%2009.19.pdf — City Creditworthiness Initiative, Thailand Local Government Finance

[^15^] https://asean.org/wp-content/uploads/2024/10/2024-ASCN-ME-Report-Final_25Sep2024-for-public.pdf — ASEAN Smart Cities Network Monitoring & Evaluation Report 2024

[^16^] https://theaseanpost.com/article/thailands-smart-cities-herald-thailand-40 — The ASEAN Post, "Thailand's smart cities to herald in Thailand 4.0" (2018)

[^17^] https://www.info.gov.hk/gia/general/201912/31/P2019123100542.htm — Hong Kong Government, city dashboard announcement

[^20^] https://grokipedia.com/page/List_of_municipalities_in_Thailand — List of municipalities in Thailand (comprehensive overview)

[^22^] https://www.gold.uclg.org/sites/default/files/Thailand_0.pdf — UCLG, Kingdom of Thailand Local Government Profile

[^24^] https://pdfs.semanticscholar.org/a975/046080e9d8f5c0b88cf10b3ce6869736b5db.pdf — Case Study on Phuket, Khon Kaen, Chiang Mai Smart Cities

[^32^] https://www.yalacity.go.th/frontpage — Yala City Municipality Official Website

[^33^] https://www.oecd.org/content/dam/oecd/en/publications/reports/2026/03/advancing-public-integrity-in-thailand_16412239/91fa1cd8-en.pdf — OECD, "Advancing Public Integrity in Thailand" (2026)

[^35^] https://itas.nacc.go.th/file/download/189827 — NACC, "Thailand's Integrity and Transparency Assessment 2019"

[^37^] https://www.chula.ac.th/en/news/256660/ — Chulalongkorn University ITA 2025 Score Announcement

[^38^] https://th.wikipedia.org/wiki/%E0%B9%80%E0%B8%97%E0%B8%A8%E0%B8%9A%E0%B8%B2%E0%B8%A5%E0%B8%99%E0%B8%84%E0%B8%A3%E0%B8%A2%E0%B8%B0%E0%B8%A5%E0%B8%B2 — Wikipedia: Yala City Municipality (Thai)

[^39^] https://openjicareport.jica.go.jp/pdf/12395703.pdf — JICA, "Data Collection Survey on Enhancing Strategic Geospatial Information"

[^40^] https://www.yaladashboard.com/citizen/population/ — Yala Dashboard: Population Data

[^41^] https://inter.nesdc.go.th/wp-content/uploads/2024/03/OECD-Public-Integrity-Review-of-Thailand-2018.pdf — OECD, "Integrity Review of Thailand" (2018)

[^42^] https://yala.nso.go.th/images/report/social/1/4.pdf — NSO Yala Province, Population and Housing Statistics

[^43^] https://www.unescap.org/sites/default/d8files/event-documents/Thailand%20.pdf — UN ESCAP, Thailand Country Statement on Geospatial Data

[^60^] https://inter.nesdc.go.th/wp-content/uploads/2024/03/Budgeting-in-Thailand-Full-Report-2019.pdf — NESDC, "Budgeting in Thailand" (2019)

[^61^] https://www.epicn.org/stories/hat-yai-municipality/ — EPICN, "Public Green Space GIS in Hat Yai Municipality"

[^62^] https://radioyala.prd.go.th/th/content/category/detail/id/9/iid/137061 — Radio Yala PRD, "YALA Resilience City Award"

[^63^] https://documents1.worldbank.org/curated/en/132321468308958485/txt/674860v20WP0P10overnment01201102012.txt — World Bank, "Central-Local Government Relations in Thailand" (PER 2012)

[^64^] https://openknowledge.worldbank.org/server/api/core/bitstreams/be65745b-19aa-5874-b141-6ae294775035/content — World Bank, "Thailand Public Financial Management Report" (2012)

[^65^] https://www.citydata.in.th/hatyai/en/dashboard-public-en/ — DEPA Smart City Data Platform: Hat Yai Public Dashboard

[^67^] https://www.citydata.in.th/hatyai/en/homepage/ — DEPA Smart City Data Platform: Hat Yai Profile

[^83^] https://www.frontiersin.org/journals/sustainable-cities/articles/10.3389/frsc.2025.1491621/full — "Traffy Fondue: a smart city citizen engagement" (2025)

[^85^] https://www.undp.org/sites/g/files/zskgke326/files/2025-10/rethinking_urban_governance_single_pages_compressed.pdf — UNDP, "Rethinking Urban Governance for Tomorrow's Cities"

[^87^] https://kyotoreview.org/issue-37/platform-governance-in-post-coup-thailand/ — Kyoto Review, "Platform governance in post-coup Thailand"

[^88^] https://www.depa.or.th/storage/app/media/image-article/Article-8_A-Case%20Study-Phuket-City-Data-Platform.pdf — DEPA, "A Case Study: Phuket City Data Platform"

[^89^] http://cald.org/wp-content/uploads/2019/08/Phuket-Smart-City-by-Dr-Monthip-Sriratana.pdf — Dr. Monthip Sriratana, "Phuket Smart City"

[^91^] https://www.jasca2021.jp/ascnjapan2020/dl/document/pracha_asawateera.pdf — Asawateera, "Phuket City Data Platform"

[^107^] https://radioyala.prd.go.th/th/content/category/detail/id/9/iid/137061 — Radio Yala PRD, YALA Resilience City Award Details

[^108^] https://me-d.dga.or.th/innovation/yala-resilience-city/ — DGA "me-d", Yala Resilience City Innovation Profile

[^110^] https://www.dlapiperdataprotection.com/index.html?t=law&c=TH — DLA Piper, "Data protection laws in Thailand"

[^111^] https://poonamtongtin.com/%E0%B8%99%E0%B8%84%E0%B8%A3%E0%B8%A2%E0%B8%B0%E0%B8%A5%E0%B8%B2%E0%B9%80%E0%B8%88%E0%B9%8B%E0%B8%87-%E0%B8%84%E0%B8%A7%E0%B9%89%E0%B8%B2%E0%B8%A3%E0%B8%B2%E0%B8%87%E0%B8%A7%E0%B8%B1%E0%B8%A5/ — Poonam Tongtin, "Yala City wins Digital Government Award 2022"

[^112^] https://www.citydata.in.th/wangchan/en/reports/smart-city/ — DEPA, Wangchan Valley Smart City

[^113^] https://www.citydata.in.th/en/about-us-en/ — DEPA, "About the Smart City Data Platform"

[^116^] https://www.linklaters.com/en/insights/data-protected/data-protected---thailand — Linklaters, "Data Protected: Thailand"

[^117^] https://www.citydata.in.th/en/our-services/ — DEPA, "Geo City Data Platform with ArcGIS"

[^124^] https://www.depa.or.th/en/article-view/nakhon-si-thammarat-smart-city — DEPA, "How Nakhon Si Thammarat Became a Model Smart City"

[^127^] https://nonarkara.github.io/asean-csco-app/ — ASEAN CSCO Handbook: "The Citizen-First City"

[^128^] https://govinsider.asia/intl-en/article/a-bottom-up-smart-city-thailands-evolving-approach-to-smart-city-development — GovInsider, "Thailand's evolving approach to smart city development"

[^130^] https://www.jouav.com/case-study/cw-15-urban-mapping-thailand.html — JOUAV, "High-Accuracy Mapping for 3 Thai Cities" (GISTDA project)

[^131^] https://www.saensukcity.go.th/en/departments.html — Saensuk City (Bang Saen) Municipality Organizational Structure

[^43^] https://sunlightfoundation.com/opendataguidelines/ — Sunlight Foundation, "Open Data Policy Guidelines"

[^68^] https://communities.sunlightfoundation.com/wwc/ — Sunlight Foundation, "Resources for What Works Cities"

---

*Report compiled: June 2025*
*Total independent searches conducted: 15 (English and Thai)*
*Sources documented: 45+*
