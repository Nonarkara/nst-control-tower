## Facet: Technical Platforms, Standards & Reference Architectures

**Research Date:** July 2025
**Scope:** Technical architectures, GIS platforms, dashboard frameworks, data standards, API protocols, and reference implementations for Yala City Municipality
**Searches Conducted:** 14 independent searches (English and Thai)

---

### Key Findings

- **Thailand's National Statistical Office (NSO) has adopted SDMX (ISO 17369)** as the standard for statistical data exchange, with datasets available via the Statistics Sharing Hub (stathub.nso.go.th) [^434^]. TNSO is planning to propose SDMX as the national data exchange standard to the Digital Government Development Committee [^103^].

- **Thailand has a Government Interoperability Framework (TH-e-GIF)** developed by DGA since 2006, currently at Version 2.0, which mandates RESTful APIs, JSON, OAuth 2.0, HTTPS/TLS 1.2+, OpenAPI 3.0 documentation, and UTF-8 encoding for all government systems [^482^].

- **Thai smart cities use a multi-layer architecture**: Sensing Infrastructure (IoT, CCTV) -> Cloud Platform -> Data Analytics (AI) -> Dashboard/Visualization -> Decision Support. Reference implementations exist in Phuket, Chiang Mai, Khon Kaen, and Bangkok [^473^] [^439^].

- **The GISTDA Sphere platform** (sphere.gistda.or.th) provides Thailand's national geospatial data infrastructure with APIs for geocoding, routing, POI search, satellite imagery, traffic data, PM2.5, flood/drought data, and live CCTV feeds [^483^] [^440^].

- **Data.go.th uses CKAN** as its open data catalog platform, managed by DGA. NECTEC has developed Open-D, a localized CKAN variant for Thai government open data [^447^] [^452^].

- **GDCC (Government Data Center and Cloud Service)** is Thailand's official government cloud, operated under MDES by National Telecom (NT), providing free IaaS services to government agencies with data centers located in Thailand [^477^].

- **Thailand's PDPA (Personal Data Protection Act B.E. 2562/2019)** came into full force on June 1, 2022, with maximum administrative fines of THB 5-7 million for non-compliance. Municipal systems collecting citizen data must appoint a Data Protection Officer (DPO) and implement security measures [^445^] [^446^].

- **Khon Kaen Provincial Data Dashboard**, recognized by OPDC, has been authorized for expansion to multiple provinces including Chiang Rai, Songkhla, and Udon Thani, providing empirical data on budgets, drought management, and public safety [^493^] [^472^].

- **GeoNode** is the most complete open-source GIS platform option, combining GeoServer, PostGIS, MapStore, and pyCSW for a full SDI (Spatial Data Infrastructure). It is used by World Bank, UN WFP, UNESCO, and multiple national statistics offices [^359^].

- **For time-series IoT sensor data**, TimescaleDB (PostgreSQL extension) and InfluxDB are the leading options. TimescaleDB offers better SQL compatibility and geospatial support via PostGIS, while InfluxDB excels at high-cardinality time-series ingestion [^491^] [^484^].

---

### Government Data Standards & Policies

#### SDMX (Statistical Data and Metadata eXchange)
- **Standard:** ISO 17369:2013
- **Adoption Status:** Thailand NSO is implementing SDMX under the Government Data Service Framework. Proposing it as the national data exchange standard to the Digital Government Development Committee [^103^].
- **Platform:** Statistics Sharing Hub (https://stathub.nso.go.th) [^434^]
- **Implications for Yala:** Municipal statistical data should follow SDMX structure definitions for compatibility with national systems. NSO provides training and tools for SDMX-compliant data management.
- **Key Components:** Data Structure Definitions (DSDs), metadata registries, Fusion Metadata Registry, web services for automated data exchange

#### TH-e-GIF (Thailand e-Government Interoperability Framework)
- **Developer:** Digital Government Development Agency (DGA)
- **Version:** 2.0 (developed since 2006)
- **6 Standard Domains:** [^482^]
  1. **Interconnection:** TCP/IP, HTTPS, TLS 1.2+, IPv4/IPv6
  2. **Data Exchange:** XML, JSON, CSV, UTF-8 Encoding
  3. **Web Technology:** RESTful API (primary), SOAP/WSDL (legacy), HTML5
  4. **Data Integration:** SQL, LDAP, Dublin Core, Data Catalog
  5. **Security:** OAuth 2.0, OIDC, PKI, Digital Signature, AES-256
  6. **Document Exchange:** PDF/A, ODF, XML Signature
- **API Standards:** RESTful API + JSON + OAuth 2.0 + HTTPS/TLS mandatory; OpenAPI 3.0 (Swagger) for documentation
- **Implications for Yala:** All municipal system APIs must comply with TH-e-GIF for interoperability with other government agencies. This is mandatory for systems that exchange data with provincial or national government.

#### GDX (Government Data Exchange)
- **Purpose:** Central platform for inter-agency data sharing
- **Technology:** RESTful Web Services, HTTPS, JSON format [^485^]
- **Authentication:** Consumer Key/Secret + Token-based (60-minute lifespan)
- **Features:** Linkage Management System, Data Catalog/Dictionary, API documentation
- **Implications for Yala:** Municipal systems can connect to GDX to access population registration, business data, and other inter-agency datasets via APIs

#### OGC Geospatial Standards
- **Standards:** WMS (Web Map Service), WFS (Web Feature Service), WCS (Web Coverage Service), WMTS/TMS (Tile Services), CSW (Catalog Service for the Web) [^17^]
- **Adoption:** GISTDA's NGIS Portal and Sphere platform implement all major OGC standards
- **Implications for Yala:** Municipal GIS must publish services using OGC standards for compatibility with GISTDA and other government systems

#### Open Government Data Policy
- **Platform:** data.go.th (CKAN-based)
- **API:** api.data.go.th
- **License:** Open Data (machine-readable, open license)
- **Implications for Yala:** Municipal datasets should be published on data.go.th or through the municipal open data portal using CKAN standards

---

### GIS & Geospatial Platforms

#### GeoNode (Recommended Primary)
- **Description:** Complete open-source GIS platform providing data management, metadata, mapping, dashboard, and geostory capabilities with no coding required. Built on Django, GeoServer, pyCSW, MapStore, and PostGIS [^359^]
- **URL:** https://geonode.org
- **License:** GPL (OSGeo Core Project)
- **Open Source:** Yes
- **Deployment Model:** Self-hosted or cloud
- **Pros:** Full SDI in one package; modern UI; user/permission management; supports shapefiles, CSV, GeoTiff, PDF, video; time-series visualizations; analytics and monitoring built-in
- **Cons:** Requires significant server resources; learning curve for administration
- **Relevance to Yala:** Ideal as the core GIS platform for Yala. Combines data catalog, map visualization, and dashboard in one system. Used by World Bank, UN agencies, and national statistics offices worldwide.
- **Reference Implementations:** UN WFP, World Bank, UNESCO, UNEP, IGAD, Uganda Bureau of Statistics, Arizona State University

#### GeoServer
- **Description:** Java-based open-source server for sharing and editing geospatial data using open standards (WMS, WFS, WCS, WMTS). Reference implementation for WFS and WCS [^475^]
- **URL:** http://geoserver.org
- **License:** GPL
- **Open Source:** Yes
- **Deployment Model:** Self-hosted (requires Tomcat/Java servlet container)
- **Pros:** Excellent OGC standards compliance; supports PostgreSQL/PostGIS, Oracle, Shapefiles; online editing via WFS-T; free client software (uDig); large user community
- **Cons:** Java-based (heavier resource usage); requires servlet container; less performant than MapServer for simple WMS
- **Relevance to Yala:** Core component of any GIS stack. Use as the OGC services layer behind GeoNode or standalone.

#### MapServer
- **Description:** C-based open-source map rendering engine, highly efficient for WMS and map image generation. Uses mapfile configuration [^471^]
- **URL:** https://mapserver.org
- **License:** MIT-style
- **Open Source:** Yes
- **Deployment Model:** Self-hosted (Apache httpd)
- **Pros:** Very fast WMS performance; lightweight; huge data format support via GDAL/OGR; easy mapfile configuration
- **Cons:** No built-in web admin interface; no transactional WFS (WFS-T); lacks online editing; more developer-oriented
- **Relevance to Yala:** Good choice if primary need is fast map rendering. Can be combined with GeoServer for full functionality.

#### PostGIS
- **Description:** Spatial database extension for PostgreSQL, the most feature-rich spatial database engine. Enables spatial SQL queries, indexing (R-tree, GiST), and advanced geoprocessing [^480^]
- **URL:** https://postgis.net
- **License:** GPL
- **Open Source:** Yes
- **Pros:** Full spatial SQL support; very fast spatial operations; integrates with QGIS, GeoServer, GeoNode; supports routing (pgRouting); geometry clustering
- **Cons:** Requires PostgreSQL expertise; performance tuning needed for large datasets
- **Relevance to Yala:** Essential as the spatial database backend. All municipal geospatial data (parcels, roads, buildings, utilities) should be stored in PostGIS.

#### QGIS Server / QGIS Desktop
- **Description:** Server component of the popular QGIS desktop GIS application. Can publish QGIS projects directly as WMS/WFS services
- **URL:** https://qgis.org
- **License:** GPL
- **Open Source:** Yes
- **Pros:** Direct project publishing from QGIS Desktop; excellent cartography; large Thai user community
- **Cons:** Less scalable than GeoServer/MapServer for high-traffic deployments
- **Relevance to Yala:** Use QGIS Desktop for data editing and map preparation; QGIS Server for simple publishing needs.

#### GISTDA Sphere Platform
- **Description:** Thailand's national geospatial data platform providing map APIs, satellite imagery, traffic data, environmental data (PM2.5, flood, drought), and live CCTV [^43^]
- **URL:** https://sphere.gistda.or.th
- **License:** Government service (terms apply, no bulk downloads)
- **API Services:** Geocoding, routing, POI search, nearby places, satellite imagery, traffic, PM2.5, hotspot, flood/drought data, live CCTV [^494^] [^483^]
- **Relevance to Yala:** Primary source for base map data, satellite imagery, and environmental monitoring. The React wrapper (gistda-sphere-react) shows active developer community engagement.

---

### Dashboard & Visualization Frameworks

#### Apache Superset
- **Description:** Modern, enterprise-ready business intelligence web application from Apache Software Foundation. Rich visualizations, SQL editor, dashboard creation [^454^]
- **URL:** https://superset.apache.org
- **License:** Apache 2.0
- **Pros:** Powerful for data teams; warehouse-scale analytics; rich control over exploration; wide database support; no-code viz builder
- **Cons:** Steeper learning curve than Metabase; requires more technical setup; less polished embedding
- **Relevance to Yala:** Best for advanced analytics use cases where SQL analysts need flexible, powerful visualization tools.

#### Metabase (Recommended for Business Users)
- **Description:** Open-source analytics and dashboarding platform designed for business teams. No-code query builder with SQL option [^454^]
- **URL:** https://www.metabase.com
- **License:** AGPL (open source) + Enterprise Edition
- **Pros:** Easiest entry point for non-technical users; fast dashboard creation; good for internal reporting; approachable interface; embedding support
- **Cons:** Less specialized for infrastructure monitoring; fewer advanced analytics features than Superset
- **Relevance to Yala:** Ideal for municipal staff who need self-service analytics without steep learning curves. Good for KPI tracking and business reporting.

#### Grafana
- **Description:** Leading open-source analytics and monitoring platform, strongest for time-series data and infrastructure monitoring
- **URL:** https://grafana.com
- **License:** AGPL
- **Pros:** Excellent for telemetry/IoT data; most flexible visualization layer; native InfluxDB/TimescaleDB support; alerting built-in; large plugin ecosystem
- **Cons:** Less suited for traditional BI/reporting; requires technical setup
- **Relevance to Yala:** Best for real-time sensor monitoring dashboards (air quality, water levels, traffic). Perfect companion to InfluxDB/TimescaleDB for IoT data.

#### Power BI
- **Description:** Microsoft's business analytics service, widely used in Thai government for data visualization
- **URL:** https://powerbi.microsoft.com
- **License:** Proprietary (free desktop, paid cloud/service)
- **Pros:** Thai government familiarity; excellent data transformation (Power Query); strong DAX analytics; easy sharing via Power BI Service; integrates with Excel
- **Cons:** Proprietary vendor lock-in; licensing costs for sharing; limited open data format support
- **Relevance to Yala:** Good choice if municipal staff already have Microsoft ecosystem skills. NSO supports Power BI API integration [^2^].

#### GeoNode Dashboard / MapStore
- **Description:** Built-in dashboarding within GeoNode GIS platform. MapStore is the OpenLayers-based mapping framework
- **URL:** Part of GeoNode
- **License:** GPL
- **Pros:** Integrated with GIS data; no additional software needed; supports maps, charts, and geostories
- **Cons:** Less flexible than dedicated BI tools
- **Relevance to Yala:** Use for GIS-centric dashboards combining maps with statistical charts.

---

### Data Integration & Pipeline Tools

#### Apache Airflow (Recommended)
- **Description:** Open-source platform to programmatically author, schedule, and monitor workflows. De-facto standard for ETL/ELT pipelines [^455^]
- **URL:** https://airflow.apache.org
- **License:** Apache 2.0
- **Pros:** Tool-agnostic; extensive provider ecosystem; dynamic task generation; scalable; Python-based; strong community; datasets feature for data-driven scheduling
- **Cons:** Steep learning curve; requires Python knowledge; resource-intensive for small deployments
- **Relevance to Yala:** Orchestrate data pipelines from multiple sources (IoT sensors, government APIs, field surveys) into the municipal database. Schedule daily/weekly data refresh jobs.

#### Apache Airbyte
- **Description:** Open-source data integration engine with extensive connector library for ELT pipelines
- **URL:** https://airbyte.com
- **License:** MIT
- **Pros:** 300+ pre-built connectors; easy to use; good for replicating data from various sources
- **Cons:** Less mature than Airflow for complex transformations
- **Relevance to Yala:** Use for ingesting data from standard sources (databases, APIs, files) without custom coding.

#### Pentaho / Hitachi Vantara
- **Description:** Open-source business analytics and data integration platform with visual ETL designer (Pentaho Data Integration/Kettle)
- **URL:** https://www.hitachivantara.com
- **License:** CE (Community Edition) is open source
- **Pros:** Visual drag-and-drop ETL design; comprehensive BI suite; good for non-programmers
- **Cons:** Heavier footprint; community edition limitations
- **Relevance to Yala:** Good option if visual ETL design is preferred over code-based pipelines.

#### dbt (data build tool)
- **Description:** Open-source data transformation tool that enables data analysts to transform data in their warehouses using SQL
- **URL:** https://www.getdbt.com
- **License:** Apache 2.0
- **Pros:** SQL-based transformations; version control; testing; documentation generation
- **Cons:** Requires data warehouse; not a full ETL tool (transformations only)
- **Relevance to Yala:** Use for transforming raw municipal data into analytics-ready models inside PostgreSQL.

---

### Cloud & Infrastructure

#### GDCC (Government Data Center and Cloud Service) - RECOMMENDED
- **Description:** Thailand's official government cloud service, operated under Ministry of Digital Economy and Society (MDES) by National Telecom (NT). Consolidates IT infrastructure for 200+ government agencies [^477^]
- **URL:** https://cloud.dga.or.th
- **Cost:** Free IaaS (basic level) for government agencies
- **Data Center Location:** Thailand (domestic data residency)
- **Pros:** Free for government; PDPA compliant (data stays in Thailand); government security standards; no foreign cloud dependency; interconnects with GFMIS and other government systems
- **Cons:** May have less flexibility than commercial clouds; procurement process required
- **Relevance to Yala:** **Primary recommended hosting option.** Municipal systems should be deployed on GDCC to ensure data sovereignty, PDPA compliance, and interconnection with other government systems.

#### Government Cloud Service (G-Cloud) Access
- **Process:** Agencies register at https://cloud-vpn.dga.or.th with DGA-provided credentials [^481^]
- **Features:** Virtual machines, storage, VPN connectivity to government network
- **Relevance to Yala:** Yala Municipality should register for GDCC access and deploy their GIS/dashboard systems there.

#### Commercial Cloud Alternatives
- **AWS, Azure, GCP:** Available but data residency and PDPA compliance requirements must be carefully evaluated
- **Thai Cloud Providers:** CAT Telecom, True IDC, AIS Cloud - offer local data center options
- **Note:** For sensitive municipal/citizen data, GDCC is strongly preferred over commercial clouds.

---

### Security & Compliance

#### PDPA (Personal Data Protection Act B.E. 2562/2019)
- **Effective Date:** June 1, 2022
- **Enforcement Body:** Personal Data Protection Committee (PDPC)
- **Key Requirements for Municipal Systems:** [^445^] [^446^] [^450^]
  - **Data Protection Officer (DPO):** Required for processing sensitive personal data or large-scale monitoring. Failure to appoint = fine up to THB 1 million [^448^]
  - **Consent Management:** Must inform data subjects of collection purpose, retention period, rights
  - **Security Measures:** Must implement appropriate technical and organizational security measures (fine up to THB 3 million for failure)
  - **Breach Notification:** Must notify PDPC within 72 hours of becoming aware of a breach
  - **Cross-border Transfers:** Restricted; requires adequate protection or appropriate safeguards
  - **Records of Processing:** Must maintain records of all data processing activities
- **Penalties:**
  - Administrative fines: Up to THB 5 million (recent cases up to THB 7 million) [^451^]
  - Criminal penalties: Up to 1 year imprisonment and/or THB 1 million fine
  - Cumulative fines exceeding THB 21.5 million have been levied since enforcement began [^446^]
- **PDPA for Government Agencies:** Applies to all organizations collecting personal data in Thailand, including municipalities. PDPC has fined both public and private sector entities [^450^]

#### Data Classification for Municipal Systems
- **General Personal Data (GPD):** Names, addresses, contact details, citizen IDs
- **Sensitive Personal Data (SPD):** Racial/ethnic origin, religious beliefs, health data, biometric data - requires explicit consent [^448^]
- **Note:** Municipal systems handling citizen complaints, permits, or services will process both GPD and SPD.

#### Security Best Practices
- HTTPS/TLS 1.2+ mandatory (per TH-e-GIF) [^482^]
- OAuth 2.0 / OpenID Connect for authentication
- Role-based access control (RBAC)
- Audit trail for all data access and modifications
- Database encryption at rest and in transit
- Regular security assessments and penetration testing

---

### Mobile Data Collection Tools

#### ODK (Open Data Kit) - RECOMMENDED
- **Description:** Free, open-source suite of tools for mobile data collection. ODK Collect is the Android app for field surveys [^463^]
- **URL:** https://getodk.org
- **License:** Apache 2.0
- **Pros:** Works offline; supports GPS, photos, skip logic, constraints; XLSForm design; open standards; large community
- **Cons:** Requires server setup (ODK Central) or cloud subscription
- **Relevance to Yala:** Ideal for municipal field staff to collect infrastructure data, citizen complaints, census data. Works offline in areas with poor connectivity.

#### KoboToolbox
- **Description:** Free, open-source tool for data collection, based on ODK. Web-based form builder and data management [^459^]
- **URL:** https://www.kobotoolbox.org
- **License:** Open source
- **Pros:** Easy web-based form builder; built-in data management; NGO/humanitarian sector standard; free hosted option
- **Cons:** Less customizable than ODK Central
- **Relevance to Yala:** Quick-start option for mobile data collection without server setup.

---

### API Gateway & Data Exchange

#### Kong - RECOMMENDED
- **Description:** Open-source, lightweight API gateway built on Nginx/OpenResty. Lua-based plugin system [^462^]
- **URL:** https://konghq.com
- **License:** Apache 2.0 (Gateway)
- **Pros:** High performance; scalable; extensive plugin ecosystem; RESTful API management; rate limiting; authentication; logging
- **Cons:** Requires database (PostgreSQL/Cassandra); Lua knowledge for custom plugins
- **Relevance to Yala:** Manage all municipal APIs (data services, GIS services, external integrations) through a unified gateway with authentication, rate limiting, and monitoring.

#### Tyk
- **Description:** Open-source API management platform written in Go. Supports REST, GraphQL [^456^]
- **URL:** https://tyk.io
- **License:** MPL 2.0
- **Pros:** Truly independent (no cloud dependency); AI governance features; multi-deployment options
- **Cons:** Smaller community than Kong

---

### Database Recommendations

#### PostgreSQL + PostGIS (Primary Database) - HIGHLY RECOMMENDED
- **Use Case:** Core municipal database for all structured data, including spatial data
- **Why:** Full SQL support; ACID compliance; PostGIS extension for spatial queries; integrates with GeoServer, GeoNode, QGIS; supports JSONB for semi-structured data; excellent Thai language support (UTF-8); connects to all BI tools
- **Deployment:** On GDCC cloud or on-premises

#### TimescaleDB (Time-Series Extension)
- **Use Case:** IoT sensor data, environmental monitoring, traffic data
- **Why:** PostgreSQL-compatible; full SQL support; time-series optimizations (compression, partitioning); integrates with PostGIS for spatiotemporal queries; better performance for high-cardinality data than InfluxDB [^491^]
- **Note:** Install as a PostgreSQL extension - same database server as primary data

#### InfluxDB (Alternative Time-Series)
- **Use Case:** High-frequency IoT metrics, infrastructure monitoring
- **Why:** Superior ingestion performance; purpose-built for time-series; TIG stack (Telegraf + InfluxDB + Grafana) is proven combination [^484^]
- **Consideration:** Use if IoT data volume is very high and primarily time-series without heavy spatial joins

#### MongoDB (Document Store)
- **Use Case:** Unstructured/semi-structured data, citizen complaints, forms
- **Why:** Flexible schema; JSON-native; good for rapidly changing data structures
- **Consideration:** Use alongside PostgreSQL, not as replacement, for specific use cases requiring schema flexibility

#### Redis (Cache/Session Store)
- **Use Case:** Application caching, session management, real-time data
- **Why:** In-memory performance; pub/sub for real-time features

---

### Trends & Signals

- **SDMX becoming national standard:** TNSO is actively pushing SDMX as Thailand's national data exchange standard, which will affect all government data exchanges [^103^].

- **One Stop Service / Zero Copy:** Thailand's Digital Government Plan 2025-2027 aims for citizens to contact a single point with data flowing automatically between agencies [^482^].

- **Open API for private sector:** Government is promoting Open API strategy for private sector integration [^485^].

- **AI integration in smart city dashboards:** Khon Kaen and other cities are incorporating AI-driven predictive analytics into dashboards [^472^] [^493^].

- **Citizen engagement platforms:** Traffy Fondue platform has been implemented in 77 provinces with 940,000+ complaints and 77% success rate [^2^]. This model of citizen reporting is becoming the standard.

- **International technology transfer:** Thailand's smart city development involves significant international cooperation (South Korean TMS Platform, U.S. smart city partnerships) [^493^] [^436^].

- **Open-source adoption in Thai government:** NXPO and other agencies have successfully adopted open-source ERP systems (Alldo), demonstrating viability for public sector [^492^].

- **Data governance maturation:** Thai government has established Data Catalog requirements and Government Data Service Framework with clear agency roles [^103^].

---

### Controversies & Limitations

- **Interoperability challenges:** Thai smart city data platforms often lack interconnection between different agency systems. DEPA notes that "few of these data sources are interconnected" [^469^].

- **Data sharing culture:** Government agencies encounter challenges in data disclosure due to legal and organizational cultural factors. Knowledge gaps and frequent job rotations require continuous training [^103^].

- **Infrastructure readiness:** Some government agencies lack adequate digital infrastructure for managing data, particularly at municipal level [^103^].

- **GISTDA Sphere licensing restrictions:** GISTDA Sphere has terms that prohibit bulk downloads, commercial use, and derivative works without explicit license [^40^]. Municipal systems must carefully review terms before building on Sphere.

- **PDPA compliance burden:** Municipalities may lack technical expertise for PDPA compliance, particularly regarding Data Protection Officer appointment, security measures, and breach notification procedures. Fines have been levied against both public and private entities [^446^].

- **Custom connector problem:** Thai government agencies operate 1,500+ IT systems. Without interoperability standards, connecting all systems would require tens of thousands of custom connectors [^482^].

- **GeoNode complexity:** Full GeoNode deployment requires significant technical expertise and server resources, which may exceed small municipal IT capacity.

- **Time-series database trade-offs:** No single database is optimal for all use cases. TimescaleDB offers SQL compatibility but InfluxDB may be simpler for pure IoT metrics [^491^].

---

### Recommended Architecture for Yala

#### Core Platform Stack
| Component | Recommended Technology | Rationale |
|-----------|----------------------|-----------|
| **GIS Platform** | GeoNode (with GeoServer + PostGIS) | Complete open-source SDI; OGC compliant; used by World Bank/UN agencies; Thai government compatible |
| **Base Maps & Imagery** | GISTDA Sphere API | National geospatial data source; Thailand-specific layers |
| **Primary Database** | PostgreSQL + PostGIS | Industry standard spatial database; ACID; full GIS integration |
| **Time-Series Data** | TimescaleDB (PostgreSQL extension) | SQL-compatible; spatiotemporal queries; IoT optimized |
| **IoT Monitoring** | InfluxDB + Grafana (optional) | If high-frequency sensor volume justifies separate store |
| **Data Catalog** | CKAN (Open-D variant) | Standard for Thai government open data; used by data.go.th |
| **Dashboard/BI** | Metabase (primary) + Grafana (IoT) | Easy for non-technical staff; open-source; wide DB support |
| **Advanced Analytics** | Apache Superset | For SQL analysts requiring advanced visualization |
| **ETL/Orchestration** | Apache Airflow | Industry standard; Python-based; integrates with all sources |
| **API Gateway** | Kong | Open-source; high performance; Thai government standards |
| **Field Data Collection** | ODK Central + ODK Collect | Works offline; GPS/photo support; open standards |
| **Cloud Hosting** | GDCC (Government Cloud) | Free for government; PDPA compliant; data in Thailand |
| **Authentication** | OAuth 2.0 / OpenID Connect | TH-e-GIF mandatory standard |
| **API Standards** | RESTful + JSON + OpenAPI 3.0 | TH-e-GIF compliant |

#### Architecture Layers
```
PRESENTATION LAYER
  - GeoNode (Maps, Data Catalog, GeoStories)
  - Metabase Dashboards (Municipal KPIs, Reports)
  - Grafana (Real-time IoT Monitoring)
  - Mobile Apps / Web Portal for Citizens

API GATEWAY LAYER
  - Kong API Gateway (Auth, Rate Limiting, Logging)
  - TH-e-GIF Compliant REST APIs
  - OGC Services (WMS, WFS, WCS)

APPLICATION LAYER
  - GeoNode / GeoServer (GIS Services)
  - CKAN (Data Catalog)
  - Apache Airflow (ETL Orchestration)
  - Custom Municipal Applications

DATA LAYER
  - PostgreSQL + PostGIS (Primary Database)
  - TimescaleDB (Time-Series Extension)
  - InfluxDB (IoT Metrics - optional)
  - Redis (Cache)

DATA COLLECTION LAYER
  - ODK Collect (Field Surveys)
  - IoT Sensors (Air Quality, Water Level, Traffic)
  - Government API Integrations (GISTDA, NSO, DGA)
  - Citizen Complaint Systems

INFRASTRUCTURE
  - GDCC Cloud (Government Data Center)
  - Backup & Disaster Recovery
  - PDPA Compliance Framework
```

#### Integration Points with National Systems
| System | Integration Method | Data |
|--------|-------------------|------|
| GISTDA Sphere | REST API | Base maps, satellite imagery, environmental data |
| data.go.th (CKAN) | CKAN API | Open data publishing |
| GDX Platform | REST API + OAuth | Inter-agency data exchange |
| NSO stathub | SDMX API | Statistical data |
| Traffy Fondue | API | Citizen complaint data |
| GDCC Cloud | VPN + API | Government cloud infrastructure |

---

### Source List

[^434^] https://www.youtube.com/watch?v=8AeFyhX_LOo - Thailand NSO SDMX adoption video
[^435^] https://www.youtube.com/watch?v=d3uJXnrW0TY - Thailand NSO SDMX implementation video
[^101^] https://www.slideshare.net/slideshow/thainso-statistics-sharing-hub/254986885 - ThaiNSO Statistics Sharing Hub
[^105^] https://sdmx.org/wp-content/uploads/SDMX_Starter_Kit_Version_23-9-2015.pdf - SDMX Starter Kit
[^103^] https://www.sdmx2023.org/plenary/SESSION_5/Taweesap-%20Enhancing%20Thailand%20Data%20Governance%20for%20Statistical%20Exchange%20by%20using%20SDMX%20Standard.pdf - SDMX Data Governance Thailand
[^437^] https://www.scribd.com/document/940516866/07-Thailand-Experience-Taweesap-Srikwan - Thailand National Data Exchange System
[^441^] https://www.unescap.org/sites/default/d8files/event-documents/Thai_NSO_TS_Data_Portal_Stats_Cafe_21Feb2022.pdf - SDMX Data Portal with .Stat Suite
[^17^] https://www.fig.net/resources/proceedings/2016/2016_10_AP_CDN/1.7_Thailand_GISTDA.pdf - Thailand Geospatial Data Infrastructure Status
[^359^] https://geosolutionsgroup.com/technologies/geonode/ - GeoNode Platform Overview
[^444^] https://geoportal.gov.gy/developer/ - GeoNode Developer Information (OGC Services)
[^475^] https://gis.stackexchange.com/questions/6604/comparing-different-open-source-gis-servers - Open Source GIS Server Comparison
[^471^] https://ikcest-drr.data.ac.cn/tutorial/k9011 - MapServer vs GeoServer Comparison
[^468^] https://nextgis.com/nextgis-web-vs-mapserver/ - NextGIS vs MapServer Comparison
[^474^] https://digital-geography.com/arcgis-server-vs-open-source-gis-solutions/ - ArcGIS vs Open Source GIS
[^480^] https://medium.com/@tjukanov/why-should-you-care-about-postgis - PostGIS Introduction
[^438^] https://bsac.chemcu.org/wp-content/uploads/2022/04/IQPISSP2-Smart-City-Final-Report.pdf - Smart City Tourism Case Study
[^439^] https://www.slideshare.net/slideshow/smart-city-thailand-2pdf/260357344 - Smart City Thailand Framework
[^442^] https://www.citydata.in.th/chiangmai-municipality/en/dashboard-public-en/ - Chiang Mai Smart City Dashboard
[^443^] https://theaseanpost.com/article/thailands-smart-cities-herald-thailand-40 - Thailand Smart Cities Overview
[^440^] https://sphere.gistda.or.th/docs/web-service/disaster-information - GISTDA Sphere API Documentation
[^447^] https://uat.data.go.th/en/ - Data.go.th CKAN Portal
[^452^] https://www.nectec.or.th/opend/ - Open-D (Thai CKAN variant)
[^454^] https://www.fanruan.com/en/blog/open-source-metrics-dashboard-tools - Open Source Dashboard Tools Comparison
[^455^] https://airflow.apache.org/use-cases/etl_analytics/ - Apache Airflow ETL Use Cases
[^457^] https://kestra.io/resources/data/etl-pipeline-tools - ETL Pipeline Tools 2026
[^458^] https://www.ovaledge.com/blog/open-source-etl-tools - Top Open Source ETL Tools
[^456^] https://tyk.io/ - Tyk API Gateway
[^462^] https://www.bbva.com/en/innovation/api-gateways-kong-vs-tyk/ - Kong vs Tyk API Gateway Comparison
[^459^] https://www.unhcr.org/sens/wp-content/uploads/sites/155/2025/01/MDC-Tool-04-MDC-Training-for-Survey-Manager-EN-V11.pdf - ODK/KoboToolbox Mobile Data Collection Guide
[^463^] https://toolbox.hotosm.org/pages/2_field_mapping_prep/2_2_data_collection_applications/ - ODK Data Collection Applications
[^477^] https://www.grandlinux.com/blogs/gdcc-cloud.html - GDCC Government Cloud Thailand
[^481^] https://dds.bangkok.go.th/public_content/files/001/0004920_1.pdf - Bangkok Government Cloud Service Guide
[^445^] https://www.siam-legal.com/cybercrime-law/data-privacy/thailand-personal-data-protection-act/ - Thailand PDPA Compliance Guide
[^446^] https://www.lexology.com/library/detail.aspx?g=9a472dcd-422a-4c00-803c-0e8f9c77909e - Thailand PDPA Enforcement
[^448^] https://www.sangfor.com/blog/cybersecurity/pdpa-thailand-comprehensive-guide-for-business-compliance - PDPA Thailand Comprehensive Guide
[^449^] https://www.kap.co.th/expertise/data-privacy-protection/ - PDPA Compliance Services
[^450^] https://www.dlapiperdataprotection.com/index.html?t=law&c=TH - Data Protection Laws in Thailand
[^451^] https://blancco.com/resources/blog-understanding-thailands-personal-data-protection-act-pdpa/ - Understanding Thailand PDPA
[^453^] https://www.dataguidance.com/sites/default/files/gdpr_v_thailand_v2_updated.pdf - GDPR vs Thailand PDPA Comparison
[^482^] https://www.grandlinux.com/en/blogs/th-e-gif.html - TH-e-GIF Thailand Government Interoperability Framework
[^485^] https://documents1.worldbank.org/curated/en/099120225122096554/pdf/P506116-d380e34f-1660-4004-b91a-26acfee94750.pdf - Thailand Digital Data Infrastructure Roadmap (World Bank)
[^484^] https://www.kern-it.be/en/definitions/influxdb/ - InfluxDB Time-Series Database
[^486^] https://www.diva-portal.org/smash/get/diva2:1947085/FULLTEXT01.pdf - TimescaleDB vs InfluxDB Performance Analysis
[^487^] https://cratedb.com/blog/comparing-databases-industrial-iot-use-case - Database Comparison for IIoT
[^491^] https://www.tigerdata.com/blog/timescaledb-vs-influxdb-for-time-series-data-timescale-influx-sql-nosql-36489299877 - TimescaleDB vs InfluxDB
[^490^] https://pmc.ncbi.nlm.nih.gov/articles/PMC7302557/ - Time Series Databases Comparative Analysis (PMC)
[^494^] https://sphere.gistda.or.th/docs/web-service/nearby-poi - GISTDA Sphere Nearby POI API
[^43^] https://www.unescap.org/sites/default/d8files/event-documents/Thailand%20.pdf - Thailand Country Statement (UNESCAP)
[^483^] https://dulapahv.dev/project/gistda-sphere-react - GISTDA Sphere React Library (Developer Resource)
[^40^] https://sphere.gistda.or.th/terms - GISTDA Sphere Terms of Use
[^436^] https://www.ustda.gov/ustda-helps-thailand-design-smart-cities-2/ - USTDA Thailand Smart Cities
[^469^] https://www.depa.or.th/storage/app/media/image-article/Article-8_A-Case%20Study-Phuket-City-Data-Platform.pdf - DEPA Phuket City Data Platform Case Study
[^470^] https://www.banpunext.co.th/new-progress-phuket-smart-city/ - Banpu NEXT Phuket Smart City
[^473^] https://www.jasca2021.jp/ascnjapan2020/dl/document/pracha_asawateera.pdf - Phuket City Data Platform Technical Paper
[^476^] https://gtg.webhost.uoradea.ro/PDF/GTG-3-2024/gtg.55331-1303.pdf - Phuket Smart City Case Study
[^2^] https://www.frontiersin.org/journals/sustainable-cities/articles/10.3389/frsc.2024.1473123/full - Data Contribution to Smart City Innovation in Thailand
[^472^] https://archive.opengovasia.com/2024/08/27/thailands-approach-to-smart-city-development/ - Thailand's Approach to Smart City Development
[^493^] https://tuengr.com/V17/17A1E.pdf - Smart Urban Design with Intelligent Engineering in Thailand
[^492^] https://www.nxpo.or.th/th/en/24392/ - NXPO Open-Source ERP Experience
[^496^] https://open-research-europe.ec.europa.eu/articles/5-209/pdf - Thailand Public Sector Digitalisation Strategy
[^498^] https://www.mdpi.com/2076-0760/13/12/666 - Digital Transformation of Local Administrative Organizations in Thailand
[^495^] https://medium.com/@toeyetoeyetoeye/from-data-to-insights-analyzing-thailands-tourism-industry-with-power-bi - Power BI Tourism Analysis Example
[^478^] https://www.youtube.com/watch?v=NjNgA5o_Zog - GISTDA Sphere API Tutorial (React/Leaflet)
[^460^] https://arxiv.org/html/2508.14451v1 - AirQo Data Pipeline Design (Airflow Reference)
[^464^] https://medium.com/@jushijun/building-a-weather-data-pipeline-with-apache-airflow-aws-and-amazon-rds - Weather Data Pipeline with Airflow
[^465^] https://upskilldevelopment.com/mobile-data-collection-using-odk-and-kobotoolbox-course - ODK/KoboToolbox Training Course
[^467^] https://projectbist.com/blog/odk-open-data-kit-field-research-guide - ODK Field Research Guide
[^479^] https://www.researchgate.net/figure/Comparison-of-MapServer-GeoServer-and-ArcServer-All-information-seen-below-is_tbl1_259640315 - MapServer vs GeoServer vs ArcServer
[^466^] https://www.imda.gov.sg/resources/innovative-tech-companies-directory/tyk-technologies - Tyk Technologies (IMDA)
[^461^] https://www.research-collection.ethz.ch/server/api/core/bitstreams/f96caa17-bb5f-4143-9800-5bd18236a7ae/content - PostgreSQL Time Series with R
[^488^] https://medium.com/@artemkhrenov/time-series-database-patterns-influxdb-and-timescaledb-for-analytics - Time-Series DB Patterns
[^489^] https://www.youtube.com/watch?v=qsD7-zSFsTc - InfluxDB vs TimescaleDB Explained
[^497^] https://www.mdpi.com/2624-6511/7/5/92 - Smart City IoT Platform Knowledge Model
[^499^] https://ceur-ws.org/Vol-3403/paper38.pdf - Comparative Analysis of Smart City Platforms
