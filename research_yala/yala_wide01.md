## Facet: Thailand National Government Open Data & APIs

### Key Findings

- **data.go.th** is Thailand's official open government data portal, operated by DGA (Digital Government Development Agency, formerly EGA). It aggregates 11,000+ datasets from ministries, departments, and local administrations using CKAN open-source platform [^1^].
- The portal provides **automatic CKAN APIs** for datasets, data previews, and visualizations. API documentation is at https://opendata.data.go.th/pages/data-go-th-api [^2^].
- **DGA's Government Data Catalog (GD Catalog)** at https://gdcatalog.go.th serves as the central registry for all government datasets, with **156 Agency Data Catalogs** and **76 Provincial Data Catalogs** connected via CKAN API harvesting [^3^].
- The **GDCatalog API** provides authenticated REST endpoints for dataset discovery, resource listing, and data content retrieval at `https://api.gdcatalog.go.th/v1/api/` [^4^].
- **NSO (National Statistical Office)** operates a **Statistics Sharing Hub** (`https://stathub.nso.go.th/`) using SDMX standards, with APIs enabling automated data exchange across 76 provincial statistical offices [^5^].
- **TPMAP (Thai People Map and Analytics Platform)** at https://www.tpmap.in.th integrates Basic Minimum Need data (~36M individuals) from Community Development Department and welfare registrant data (~11.4M) from Ministry of Finance for precision poverty alleviation at tambon-level granularity [^6^].
- **DOPA (Department of Provincial Administration)** manages Thailand's civil registration database (national ID, facial photos, fingerprints) and offers **DOPA API** for identity verification at 3 service levels (Card, Face, ThaiD authentication) [^7^].
- **DEPA (Digital Economy Promotion Agency)** operates the **Smart City Data Platform** at https://www.citydata.in.th, promoting City Data Platform (CDP) standards for municipal data exchange across 7 smart city dimensions [^8^].
- **CGD (Comptroller General's Department)** operates the **e-Government Procurement (e-GP)** system at https://www.gprocurement.go.th, handling 100% of public procurement transactions with estimated annual savings of USD 2.7 billion [^9^].
- **Government spending data** is publicly available through `https://govspending.data.go.th` with dashboards, rankings, and province-level breakdowns [^10^].
- **DBD (Department of Business Development)** maintains business registration data at https://www.dbd.go.th, with the **DBD DataWarehouse** for financial statements. No public API is available - access is manual [^11^].
- **Open Law Data Thailand** at https://www.openlawdatathailand.org provides machine-readable legal database from Royal Gazette dating back to 1885, with community API access [^12^].
- **Land records** are accessible through the **LandsMaps** system, requiring ThaiD/OpenID authentication for detailed parcel data including title deeds, survey numbers, and land tax records [^13^].
- **NDID (National Digital ID)** platform connects 150+ organizations for eKYC, eConsent, and eSignature services, using distributed ledger technology for consent management [^14^].

---

### Major Data Sources & Portals

#### 1. data.go.th — Open Government Data Portal
- **URL**: https://data.go.th (front-end), https://opendata.data.go.th (API)
- **Operator**: DGA (Digital Government Development Agency / สำนักงานพัฒนารัฐบาลดิจิทัล)
- **Data Available**: 11,000+ datasets across economic development, transportation, industry, society, government spending, environment, administrative boundaries
- **Access Method**: CKAN API (`package_search`, `datastore_search`), web download, data preview
- **Update Frequency**: Varies by agency; major datasets updated monthly/quarterly
- **Relevance to Municipal Management**: Core source for demographic, economic, geographic, and administrative data
- **Limitations**: Predominantly historical data rather than real-time; data quality varies across agencies [^1^][^2^]

#### 2. GD Catalog (Government Data Catalog)
- **URL**: https://gdcatalog.go.th (portal), https://directory.gdcatalog.go.th (directory)
- **Operator**: NSO on behalf of DGA
- **Data Available**: Central registry of ALL government datasets from 156 agencies + 76 provinces; metadata records for statistical data, GIS data, unstructured data
- **Access Method**: CKAN API + GDCatalog REST API (`/dataset/list_all`, `/dataset/by_id`, `/dataset/by_department`, etc.)
- **Authentication**: OAuth2 via Keycloak (`https://api.gdcatalog.go.th/v1/api/keycloak`)
- **Relevance**: Discovery layer — find what data exists across government before requesting
- **Limitations**: Catalog records may not always link to actually accessible data [^3^][^4^]

#### 3. NSO Statistics Sharing Hub
- **URL**: https://stathub.nso.go.th/, https://sdmx.nso.go.th/FusionMetadataRegistry/
- **Operator**: National Statistical Office (สำนักงานสถิติแห่งชาติ)
- **Data Available**: Population, labor force, household socio-economic surveys, provincial statistics, SDG indicators, GPP data
- **Access Method**: SDMX API, CKAN API, Power BI dashboards, direct download
- **Format**: SDMX-CSV, SDMX-JSON, SDMX-XML
- **Relevance**: Key source for Yala provincial statistics — GPP, income, employment, demographics
- **Limitations**: SDMX adoption across agencies is uneven; personnel skill gaps noted [^5^]

#### 4. TPMAP (Thai People Map and Analytics Platform)
- **URL**: https://www.tpmap.in.th
- **Operator**: NESDB + NECTEC
- **Data Available**: Poverty indicators at individual/household/tambon/district/province level — healthcare, education, income, living standard, access to public services; BMN data for ~36M individuals
- **Access Method**: Web dashboard with drill-down; government officials get training access
- **Update Frequency**: BMN data collected annually by Community Development Department
- **Relevance**: Critical for Yala Municipality to identify vulnerable populations and target social services
- **Limitations**: Not a fully open API — primarily dashboard-based; data sharing restricted to government use [^6^]

#### 5. govspending.data.go.th (Thailand Government Spending)
- **URL**: https://govspending.data.go.th
- **Operator**: DGA
- **Data Available**: National budget (revenue/expenditure), provincial local revenue, procurement data, disbursement data, fiscal year budget per the Budget Procedure Act
- **Features**: Dashboards, rankings, geographic maps, province-level drill-down
- **Access Method**: Web dashboard + downloadable datasets via data.go.th
- **Relevance**: Essential for municipal budget planning and transparency; Yala Municipality can benchmark against other provinces
- **Limitations**: Data aggregated at provincial level; municipal-level detail may be limited [^10^]

#### 6. CGD e-Government Procurement (e-GP)
- **URL**: https://www.gprocurement.go.th, https://www.eprocurement.go.th
- **Operator**: Comptroller General's Department, Ministry of Finance
- **Data Available**: All public procurement transactions — tender notices, bid awards, contracts, vendor registration, reverse auctions
- **Access Method**: Web portal (mandatory for all government transactions)
- **Update Frequency**: Real-time
- **Relevance**: Yala Municipality procurement data and vendor information
- **Limitations**: No public bulk download API; designed for transactional use [^9^]

#### 7. DBD (Department of Business Development)
- **URL**: https://www.dbd.go.th, https://datawarehouse.dbd.go.th
- **Operator**: Ministry of Commerce
- **Data Available**: Company registration data (name, type, address, capital, status), financial statements (for filing companies), shareholder/director info (paid extracts)
- **Access Method**: Manual web search (free for basic info), paid extracts via DBD e-Service
- **Relevance**: Business intelligence for Yala — number of registered businesses, economic activity
- **Limitations**: No public API; no bulk data download; Thai-language interface primarily; PDPA compliance required for personal data [^11^]

#### 8. DOPA (Department of Provincial Administration)
- **URL**: DOPA services integrated via government platforms
- **Operator**: Ministry of Interior
- **Data Available**: Civil registration database — national ID card data, household registration, population counts
- **Access Method**: DOPA API for authorized agencies (3 levels: Card Verification, Face Verification, ThaiD Authentication)
- **Relevance**: Official population data for Yala; identity verification for municipal services
- **Limitations**: API access restricted to authorized government agencies; PDPA regulated [^7^]

#### 9. DEPA Smart City Data Platform
- **URL**: https://www.citydata.in.th
- **Operator**: Digital Economy Promotion Agency (depa)
- **Data Available**: City profiles, smart city projects, COVID-19 data, sentiment analysis, open city data across 7 dimensions (Environment, Energy, Economy, Governance, Mobility, People, Living)
- **Access Method**: CKAN Data API on catalog.citydata.in.th, web dashboards
- **Relevance**: Model for Yala's own City Data Platform; data standards and CDP framework
- **Limitations**: Not all cities have complete data; Yala not yet listed as participant city [^8^]

#### 10. LandsMaps (Land Records)
- **URL**: Available via gdcatalog.go.th dataset entry and SmartLands app
- **Operator**: Department of Lands (กรมที่ดิน)
- **Data Available**: Parcel maps, title deed numbers, survey pages, land tax records, assessed land values
- **Access Method**: Web search via LandsMaps (authentication required via ThaiD/OpenID/Thang Rath app)
- **Relevance**: Land use planning, property tax assessment, urban planning for Yala Municipality
- **Limitations**: Detailed ownership data requires authentication; not fully open [^13^]

#### 11. Open Law Data Thailand
- **URL**: https://www.openlawdatathailand.org
- **Operator**: Community/DGA collaboration (GitHub: DGA-Thailand/open-law-data)
- **Data Available**: Thai laws from Royal Gazette dating back to 1885 (B.E. 2428), in machine-readable JSONL format with OCR-processed text
- **Access Method**: Free download via Hugging Face, JSONL format, API via community
- **Relevance**: Municipal governance, local administrative laws, building codes, regulations
- **Limitations**: OCR accuracy may vary; not official legal citation source [^12^]

#### 12. Yala Provincial Statistics Office
- **URL**: https://yala.nso.go.th/
- **Operator**: NSO Provincial Office
- **Data Available**: Provincial statistics reports, GPP data, household income/expenditure, population, employment, commodity prices
- **Access Method**: Web download, direct contact
- **Relevance**: Direct source for Yala-specific statistical data
- **Limitations**: Reports may be in PDF; not always API-accessible [^15^]

---

### APIs & Technical Access

#### data.go.th CKAN API
- **Endpoint**: `https://opend.data.go.th/get-ckan/`
- **Documentation**: https://opendata.data.go.th/pages/data-go-th-api
- **Authentication**: API key required (free registration)
- **Key Methods**: `package_search`, `datastore_search`, `datastore_search_sql`
- **Data Format**: JSON
- **R Library**: `thaigov` package by asiripanich on GitHub [^2^]

#### GDCatalog API
- **Base URL**: `https://api.gdcatalog.go.th/v1/api/`
- **Authentication**: OAuth2 (Keycloak) — POST to `/keycloak` with client_id, client_secret, username, password
- **Endpoints**:
  - `/dataset/list_all` — list all datasets
  - `/dataset/by_id` — get dataset by ID
  - `/dataset/by_name` — search by name
  - `/dataset/by_department` — filter by department
  - `/resource/list_all` — list resources
  - `/data/content` — get actual data content
  - `/report/totaldataset_all` — statistics
- **Data Format**: JSON
- **Documentation**: https://gdhelppage.gdcatalog.go.th/data/04/files/gds_api_manual.pdf [^4^]

#### NSO SDMX API
- **Endpoint**: `https://stathub.nso.go.th/` (via .Stat Suite)
- **Metadata Registry**: `https://sdmx.nso.go.th/FusionMetadataRegistry/`
- **Standard**: ISO 17369 (SDMX)
- **Formats**: SDMX-CSV, SDMX-JSON, SDMX-XML
- **Authentication**: Varies by dataset (some public, some restricted)
- **Tools**: Power BI connectors, Python `pandasdmx`, R `rsdmx` [^5^]

#### DOPA e-KYC API
- **Endpoint**: Government-only (DOPA API gateway)
- **Service Levels**:
  - Level 1 (IAL 1.3): Card Verification — ID number + name matching
  - Level 2 (IAL 2.2): Face Verification — facial photo comparison
  - Level 3 (IAL 2.3): ThaiD Authentication — app + face + chip data
- **Authentication**: Government agency authorization required [^7^]

#### NDID Platform API
- **Documentation**: https://ndidplatform.github.io/docs/introduction
- **Architecture**: Decentralized app with HTTP-based API; blockchain (Tendermint) for consent logging; ZMQ for private data
- **Capabilities**: eKYC, eConsent, eSignature
- **Participants**: 150+ organizations (banks, telecoms, government agencies)
- **Certification**: ISO 27001:2022 [^14^]

#### DEPA City Data Platform CKAN API
- **Endpoint**: `https://catalog.citydata.in.th/api/3/action/`
- **Methods**: `datastore_search`, `datastore_search_sql`, `package_search`, `resource_search`
- **Authentication**: API key for some endpoints
- **Format**: JSON [^8^]

---

### Trends & Signals

- **Data-Driven Governance**: DGA is actively pushing a "Data Driven" agenda through the Government Data Catalog, requiring all agencies to maintain data catalogs under the Digital Government Development Plan (2020-2022+) [^3^].
- **SDMX Standardization**: NSO is leading SDMX adoption across 156 government agencies to enable automated statistical data exchange, though cooperation from line ministries remains a challenge [^5^].
- **Smart City Data Platforms**: DEPA is promoting City Data Platform (CDP) as one of 5 pillars of smart city development, with CKAN-based data catalogs and 7 smart city dimensions [^8^].
- **Digital Identity Integration**: NDID and DOPA e-KYC are enabling identity-verified data access, reducing need for repeated document submission across services [^7^][^14^].
- **Open Law Data Movement**: DGA's Open Law Data project is transforming Thai legal documents from unstructured PDFs to machine-readable JSON format, enabling LegalTech innovation [^12^].
- **Blockchain in Procurement**: CGD is integrating blockchain and cloud technology into e-GP systems for tamper-resistant procurement records [^9^].
- **Municipal Open Data**: Local administrations (เทศบาล) are increasingly publishing open data on data.go.th, including elderly databases, local wisdom, water systems [^16^].

---

### Controversies & Limitations

- **Historical vs. Real-Time Data**: data.go.th datasets are predominantly historical, not real-time, limiting operational use cases [^1^].
- **No Unified API**: Despite multiple portals (data.go.th, gdcatalog.go.th, stathub.nso.go.th), there is no single unified API gateway — developers must integrate with multiple endpoints.
- **PDPA Compliance**: The Personal Data Protection Act B.E. 2562 (2022) restricts how municipal governments can collect, store, and share personal data, including citizen registration data [^11^].
- **OCR Quality**: Land records and legal documents digitized via OCR may contain errors, requiring manual verification [^13^].
- **Interoperability Gaps**: Despite OGA framework, actual data interoperability between agencies remains limited due to legacy systems and skill gaps [^5^].
- **Language Barrier**: Most government data portals are primarily in Thai, creating barriers for international users and some technical integrations [^11^].
- **No DBD Public API**: Business registration data — critical for economic analysis — has no public API, requiring manual extraction or commercial intermediaries [^11^].
- **Restricted Access to Sensitive Data**: Population registration (DOPA), detailed land ownership, and welfare beneficiary data require government authorization and are not fully open to the public [^7^].

---

### Recommended Deep-Dive Areas

1. **CKAN API Integration for Yala Municipality**: Build a data pipeline pulling relevant datasets from data.go.th and gdcatalog.go.th using the CKAN API, filtered for Yala province. The `thaigov` R package provides a working reference implementation.

2. **NSO Provincial Statistics Automation**: Connect to NSO's Statistics Sharing Hub via SDMX API to auto-populate Yala's municipal dashboard with official GPP, income, employment, and demographic data from `https://yala.nso.go.th/`.

3. **TPMAP Integration for Social Services**: Explore official channels for Yala Municipality to access TPMAP data/APIs for identifying vulnerable populations and aligning municipal welfare programs with national poverty data.

4. **DEPA Smart City CDP Pathway**: Investigate DEPA's Smart City Data Platform requirements and apply for Yala to become a "depa Smart City Promotional Area" to access CDP infrastructure, funding, and BOI incentives.

5. **Government Spending Transparency**: Integrate `govspending.data.go.th` data for Yala province into the municipal dashboard to show citizens how national budget is allocated locally.

6. **Open Law Data for Municipal Governance**: Use Open Law Data Thailand's machine-readable legal database to build a searchable knowledge base of laws affecting municipal administration.

7. **DOPA API for Identity-Verified Services**: Explore DOPA API authorization process for Yala Municipality to enable e-KYC for municipal service registration.

8. **Land Records Integration**: Work with Department of Lands to integrate LandsMaps parcel data into Yala's geographic dashboard for urban planning and property tax purposes.

---

### Source List

[^1^] https://data.go.th — Thailand's official open government data portal
[^2^] https://opendata.data.go.th/pages/data-go-th-api — data.go.th API documentation
[^3^] https://gdcatalog.go.th — Government Data Catalog portal
[^4^] https://gdhelppage.gdcatalog.go.th/data/04/files/gds_api_manual.pdf — GDCatalog API Manual v1.0
[^5^] https://www.nso.go.th/nsoweb/nso/interactive_view/773 — NSO SDMX Innovation, and https://stathub.nso.go.th — Statistics Sharing Hub
[^6^] https://www.tpmap.in.th/about_en — TPMAP About page
[^7^] https://www.grandlinux.com/en/blogs/dopa-ekyc-digital-id.html — DOPA e-KYC and Digital ID
[^8^] https://www.citydata.in.th — Smart City Data Platform Thailand by depa
[^9^] https://www.gprocurement.go.th — CGD e-Government Procurement
[^10^] https://govspending.data.go.th — Thailand Government Spending portal
[^11^] https://www.businessdataguide.com/blog/jurisdictions/thailand-company-search-guide — Thailand DBD Business Registration Guide
[^12^] https://www.openlawdatathailand.org — Open Law Data Thailand
[^13^] https://gdcatalog.go.th/dataset/gdpublish-mapland-parcel/resource/2a1fca32-4d51-4641-a8af-4487fb996f5c — LandsMaps land parcel data
[^14^] https://ndidplatform.github.io/docs/introduction — NDID Platform Documentation
[^15^] https://yala.nso.go.th/ — NSO Yala Provincial Office
[^16^] https://www.maeyom.go.th/content-84.html — Example municipal open data (Mae Yom Subdistrict)
[^17^] https://catalog-dga.data.go.th/en/dataset/ — DGA datasets on data.go.th
[^18^] https://github.com/asiripanich/thaigov — thaigov R package for data.go.th API
[^19^] https://standard.dga.or.th/ — DGA Standards (Government Data Catalog Guidelines)
[^20^] https://www.unapcict.org/sites/default/files/2019-01/e-Government%20Interoperability%20-%20Overview.pdf — UN E-Government Interoperability Framework
[^21^] https://github.com/DGA-Thailand/open-law-data — Open Law Data GitHub Repository
[^22^] https://busofttech.com/blog/thailand-ndid-national-digital-identity-platform/ — Thailand NDID Platform Overview
[^23^] https://www.slideshare.net/slideshow/thainso-statistics-sharing-hub/254986885 — ThaiNSO Statistics Sharing Hub Presentation
[^24^] https://www.sdmx2023.org/plenary/SESSION_2/Taweesap%20Srikwan%20-%20TNSO%20Innovation%20SDMX%20-%20FINAL.pdf — NSO SDMX Innovation Presentation
[^25^] https://atlas.co/data-portals/data-go-th/ — data.go.th GIS Data Portal listing
[^26^] https://dateno.io/registry/catalog/cdi00001534/ — Open Government Data of Thailand registry
[^27^] https://library.parliament.go.th/en/online-database/open-access-databases — National Assembly Library Open Access Databases
[^28^] https://www.depa.or.th/storage/app/media/file/Smart-City-Thailand-Hitachi-Review-20210624.pdf — Smart City Initiatives in Thailand (DEPA)
[^29^] https://www.citydata.in.th/datacatalog_ckan_api/ — City Data Platform CKAN API Guide
[^30^] https://www.boi.go.th/upload/content/1.%20DEPA.pdf — Thailand Smart Cities in Practice (DEPA)
