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
