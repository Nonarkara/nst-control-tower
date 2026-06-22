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
