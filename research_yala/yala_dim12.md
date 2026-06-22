# Dimension 12: Integration Architecture, Standards & Data Governance

## Yala Municipality Integrated Database & Geographic Dashboard — Technical Standards Deep-Dive

**Research Date:** July 2025
**Scope:** Technical standards, architecture patterns, and data governance frameworks for Yala Municipality's integrated database and geographic dashboard
**Sources:** 25+ web searches across Thai government standards, open-source documentation, international standards, and reference implementations

---

## Table of Contents

1. [TH-e-GIF v2.0 — Thailand e-Government Interoperability Framework](#1-th-e-gif-v20)
2. [SDMX — Statistical Data and Metadata eXchange](#2-sdmx-statistical-data-exchange)
3. [PDPA Compliance for Municipalities](#3-pdpa-compliance-for-municipalities)
4. [Data Protection Officer (DPO) Requirements](#4-data-protection-officer-dpo)
5. [GDCC — Government Data Center and Cloud Service](#5-gdcc-government-cloud)
6. [GeoNode — Open-Source GIS Platform](#6-geonode-gis-platform)
7. [CKAN — Open Data Catalog](#7-ckan-open-data-catalog)
8. [PostgreSQL + PostGIS + TimescaleDB](#8-postgresql-postgis-timescaledb)
9. [Kong API Gateway](#9-kong-api-gateway)
10. [Metabase vs Apache Superset — Dashboard Frameworks](#10-metabase-vs-superset)
11. [Grafana — IoT Monitoring Dashboard](#11-grafana-iot-monitoring)
12. [ODK/KoboToolbox — Mobile Data Collection](#12-odk-kobotoolbox)
13. [ThaiD — Digital Identity Authentication](#13-thaid-digital-identity)
14. [Data Catalog Best Practices & Metadata Standards](#14-data-catalog-metadata-standards)
15. [Interoperability with National Systems](#15-interoperability-national-systems)
16. [Reference Architectures — Khon Kaen, Hat Yai, Phuket](#16-reference-architectures)
17. [Executive Summary & Recommended Architecture](#17-executive-summary)

---

## 1. TH-e-GIF v2.0

### Component | Standard/Technology | Documentation URL | Implementation Complexity | Cost | Compliance Requirement | Recommended Approach

**Government Interoperability Framework** | **TH-e-GIF v2.0 (Thailand e-Government Interoperability Framework)** | https://www.dga.or.th (Digital Government Development Agency) | **Medium** — requires API standardization across all municipal systems | **Free** (standard adoption) | **MANDATORY** — All Thai government IT systems must comply per Digital Government Development Plan 2025-2027 | Adopt RESTful APIs + JSON + OAuth 2.0 + OpenAPI 3.0 for all municipal system interfaces

### Full Specification Details

TH-e-GIF v2.0 is the foundational technical standards framework for connecting and exchanging data between Thai government agencies, developed by DGA since 2006 (B.E. 2549). It defines 6 standard domains:

| Domain | Standard | Details |
|--------|----------|---------|
| **Interconnection** | TCP/IP, HTTP/HTTPS | Network connectivity standards |
| **Data Exchange** | RESTful API (primary), SOAP (legacy) | API communication patterns |
| **Web Technology** | HTML5, CSS3, JavaScript | Frontend standards |
| **Data Integration** | JSON (primary), XML | Data format standards |
| **Security** | OAuth 2.0, OIDC, HTTPS/TLS 1.2+ | Authentication & encryption |
| **Document Exchange** | XML Signature, JWS, Digital Signature | Document integrity |

### API Standards Under TH-e-GIF (Mandatory)

| Topic | Required Standard | Implementation for Yala |
|-------|-------------------|------------------------|
| API Style | RESTful API (primary) / SOAP (legacy) | All new systems use RESTful |
| Data Format | JSON (primary) / XML | JSON for all new APIs |
| Authentication | OAuth 2.0 / OpenID Connect | ThaiD / DGA Digital ID integration |
| Encryption | HTTPS / TLS 1.2+ | Mandatory for all endpoints |
| Digital Signature | XML Signature / JWS | For critical documents |
| Encoding | UTF-8 | Full Thai language support |
| API Documentation | OpenAPI 3.0 (Swagger) | Every API must have docs |

### Connection to National Policy
- Digital Government Development Plan 2025-2027 designates data interoperability as core strategy
- Key goals: One Stop Service, Zero Copy (no duplicate documents), Data-Driven Government, Open API
- Thai government agencies operate 1,500+ IT systems; TH-e-GIF reduces custom connectors from tens of thousands to standard APIs
- **Source:** https://www.grandlinux.com/en/blogs/th-e-gif.html

---

## 2. SDMX — Statistical Data and Metadata eXchange

### Component | Standard/Technology | Documentation URL | Implementation Complexity | Cost | Compliance Requirement | Recommended Approach

**Statistical Data Exchange** | **SDMX (ISO 17369:2013)** | https://sdmx.org, https://stathub.nso.go.th | **Medium-High** — requires data modeling expertise | **Free** (open standard) | **RECOMMENDED** — Required for data shared with NSO; used by StatHub | Structure municipal statistical data using SDMX Data Structure Definitions (DSDs); use .Stat Suite for dissemination

### SDMX Implementation in Thailand

The Thailand National Statistical Office (NSO) has adopted SDMX as the standard to drive digital transformation of government agencies:

- **Statistics Sharing Hub (StatHub):** https://stathub.nso.go.th — central platform for SDMX-conforming datasets
- **Coverage:** International indicators, national strategic statistics, and official statistics
- **Technology:** .Stat Suite — open-source, SDMX-native platform for statistical data production and dissemination
- **NSO Data Portal:** https://www.unescap.org/sites/default/d8files/event-documents/Thai_NSO_TS_Data_Portal_Stats_Cafe_21Feb2022.pdf

### Key SDMX Artefacts for Yala Municipality

| Artefact | Purpose | Yala Application |
|------------|---------|----------------|
| Data Structure Definition (DSD) | Define dimensions, attributes, measures | Municipal KPIs, population data, economic indicators |
| Concept Scheme | Standardized concepts and definitions | Align with NSO official statistics |
| Code Lists | Standardized categories | Geographic codes, service types, demographics |
| Data Flow | Link provider to DSD | Each municipal dataset registers a data flow |

### SDMX Data Portal Process
```
Data Provider (Yala Municipality)
    → Data Model (DSD: Dimensions + Attributes + Measures)
    → Statistics Sharing Hub (.Stat Suite)
    → Dissemination (API, Excel, Power BI, R, Python)
```

### Challenges
- Applying SDMX standard to government agency statistical data
- Dissemination in non-machine readable formats
- Personnel skill gaps
- No agreement on common codelist standards
- **Source:** https://www.unescap.org/sites/default/d8files/event-documents/Thai_NSO_TS_Data_Portal_Stats_Cafe_21Feb2022.pdf

---

## 3. PDPA Compliance for Municipalities

### Component | Standard/Technology | Documentation URL | Implementation Complexity | Cost | Compliance Requirement | Recommended Approach

**Data Protection** | **PDPA (Personal Data Protection Act B.E. 2562, enforced June 2022)** | https://www.pdpa.guide/, https://www.siam-legal.com/cybercrime-law/data-privacy/thailand-personal-data-protection-act/ | **High** — comprehensive organizational change required | **Free** compliance framework; consultant costs 50,000-500,000 THB | **MANDATORY** — Full enforcement since June 2022; fines up to THB 5 million | Conduct PDPA Gap Assessment → appoint DPO → implement data inventory → establish consent workflows → security measures → regular audit

### PDPA Penalties for Non-Compliance

| Violation | Fine/Penalty |
|-----------|-------------|
| Failure to inform data subject of collection | THB 1 Million |
| Failure to implement security measures | THB 3 Million |
| Unauthorized cross-border data transfer | THB 5 Million |
| Violation of data subject rights | Up to THB 5 Million |
| Disclosing personal data from official duty | Up to 6 months + THB 500,000 |
| Collecting sensitive data without lawful basis | Up to 1 year + THB 1 Million |

### PDPA Compliance Checklist for Yala Municipality

**Phase 1: Data Collection**
- [ ] Consent forms clearly separated from other documents
- [ ] Specific purpose stated for each data collection activity
- [ ] Mechanism for consent withdrawal (equal ease to giving consent)
- [ ] Records maintained of who consented, when, and scope
- [ ] Explicit consent for sensitive data (biometric, health, religion)
- [ ] Parental consent for minors (under 20)

**Phase 2: Data Processing**
- [ ] Purpose consistency verification
- [ ] Data minimization assessment
- [ ] Anonymization/pseudonymization where possible
- [ ] Human oversight for AI/automated decisions
- [ ] Profiling notification procedures

**Phase 3: Data Storage & Deletion**
- [ ] Retention periods established per data category
- [ ] Regular deletion/anonymization of expired data
- [ ] Backup data retention policies
- [ ] Cross-border transfer safeguards (if applicable)

**Phase 4: Data Subject Rights**
- [ ] Right of Access — provide data within 30 days
- [ ] Right of Rectification — update/correct data
- [ ] Right of Erasure — delete data on request
- [ ] Right to Data Portability — export in structured format
- [ ] Right to Object — handle objection procedures

**Phase 5: Governance**
- [ ] Records of Processing Activities maintained
- [ ] Access logs for all personal data
- [ ] Regular PDPA compliance audits
- [ ] Data breach notification within 72 hours
- [ ] Written contracts with data processors (Article 40)

### Key Legal Bases for Municipal Data Processing

| Basis | Municipal Application |
|-------|----------------------|
| Public task | Census, public safety, disaster management |
| Legal obligation | Tax collection, civil registration |
| Contract | Utility services, permit applications |
| Vital interest | Emergency response, public health |
| Consent | Optional services, surveys, marketing |

**Sources:**
- https://unimon.co.th/en/blog/thailand-pdpa-ai-compliance-checklist
- https://www.siam-legal.com/cybercrime-law/data-privacy/thailand-personal-data-protection-act/
- https://www.onetrust.com/blog/the-ultimate-guide-to-thai-pdpa-compliance/
- https://www.wfw.com/articles/thailands-personal-data-protection-act-a-business-checklist/

---

## 4. Data Protection Officer (DPO)

### Component | Standard/Technology | Documentation URL | Implementation Complexity | Cost | Compliance Requirement | Recommended Approach

**Data Protection Governance** | **DPO Appointment per PDPA Section 41** | https://pdpathailand.com/news-article/pdpa-focus-data-protection-officer-dpo/ | **Medium** — requires trained personnel | **Training:** 15,000-50,000 THB; **Salary:** 25,000-60,000 THB/month | **MANDATORY** — Required if processing sensitive data as main activity OR processing 100,000+ data subjects | Appoint internal DPO (municipal IT officer with PDPA training) or outsource to certified DPO service provider

### DPO Mandatory Appointment Criteria

An organization MUST appoint a DPO if:
- Processing sensitive personal data as a **main activity**
- Processing personal data of **100,000+ data subjects**
- Advertising via search engines or social media with wide user base
- Using personal data for life/financial insurance
- Operating as a Type 3 telecom licensee
- Other cases as determined by the PDPC

### DPO Responsibilities (PDPA Section 42)

| Responsibility | Description |
|----------------|-------------|
| Legal advice | Provide advice on PDPA compliance to data controller/processor |
| Data oversight | Oversee collection, use, disclosure of personal data |
| Government liaison | Coordinate with Personal Data Protection Committee |
| Record keeping | Maintain records of processing activities |
| Confidentiality | Protect confidentiality of personal data |

### DPO Qualifications

| Qualification | Details |
|---------------|---------|
| Education | Bachelor's degree in IT security, computer science, or law |
| Experience | 5+ years in privacy/compliance/risk management |
| Certifications | CIPP (Certified Information Privacy Professional), CIPM, or Thai T-DPO certification |
| Key skills | PDPA law expertise, IT infrastructure understanding, communication skills |
| Independence | Must not have conflict of interest with data processing roles |

### DPO Training Programs in Thailand

| Program | Provider | Level |
|---------|----------|-------|
| T-DPO (Thailand Data Protection Officer) | DCT (Thailand Digital Technology Council) | Advanced |
| TDPP (Thailand PDPA Data Protection Practitioner) | Certified training centers | Practitioner |
| CIPP/E + CIPM | IAPP (International Association of Privacy Professionals) | International |
| PDPA Compliance Training | Various private providers | Basic to Advanced |

**Sources:**
- https://pdpathailand.com/news-article/pdpa-focus-data-protection-officer-dpo/
- https://pdpacore.com/th/blogs/it-has-begun-organizations-that-must-appoint-a-dpo-under-the-pdpa-law
- https://ecs-support.github.io/pages/knowledge/iso/law/pdpa-2566-05/
- https://www.dct.or.th/en/our-service/detail/172

---

## 5. GDCC — Government Data Center and Cloud Service

### Component | Standard/Technology | Documentation URL | Implementation Complexity | Cost | Compliance Requirement | Recommended Approach

**Government Cloud Infrastructure** | **GDCC (Government Data Center and Cloud Service)** | https://gdcc.onde.go.th/, https://portal.opendata.go.th/ | **Medium** — requires application and migration | **FREE IaaS** for government agencies; Pay-per-use for PaaS/SaaS | **RECOMMENDED** — Part of MDES 7 Flagship Digital Initiatives; Cloud First Policy | Register at portal.opendata.go.th → request IaaS VMs → deploy PostgreSQL+PostGIS+GeoNode+CKAN stack on GDCC

### GDCC Key Statistics

| Metric | Value |
|--------|-------|
| Agencies using GDCC | 219 agencies |
| Systems served | 3,065 systems |
| Annual budget savings | 850 million THB |
| Infrastructure provider | NT (National Telecom) |
| Supervising authority | MDES (Ministry of Digital Economy and Society) |
| Availability SLA | 99.95% |

### GDCC Services Available

| Service | Description | Yala Application |
|---------|-------------|------------------|
| **IaaS** (Free) | Virtual Machines, Storage, Network | Host PostgreSQL, GeoNode, CKAN |
| **PaaS** (Pay-per-use) | Database, Web Server, App Server | Managed PostgreSQL, Redis |
| **e-Office** (Free) | Electronic correspondence system | Municipal office digitization |
| **Government Data Lake** | Big Data storage and analytics | Municipal data analytics |
| **DRaaS** | Disaster Recovery as a Service | Data backup and recovery |
| **GDCC Open Data** | Multi-cloud SaaS/PaaS | Advanced cloud services |

### GDCC Certifications
- ISO 27001 (Information Security)
- ISO 20000 (IT Service Management)
- ISO 22301 (Business Continuity)
- ISO 27701 (Privacy Information Management)
- CSA STAR (Cloud Security Alliance)

### Application Process for Yala Municipality

1. **Register** at https://portal.opendata.go.th/
2. **Fill in service details** — specify CPU, RAM, Storage requirements
3. **Wait for approval** — GDCC reviews the application
4. **Access cloud services** — provision VMs and deploy applications
5. **Contact:** 02-024-1999 ext 2, helpdesk@gdcc.onde.go.th

### Data Center Locations
- Primary data centers located in Thailand (domestic sovereignty)
- All citizen data stored within the Kingdom under Thai law
- Multi-location redundancy for disaster recovery

### 7 Flagship Digital Initiatives (MDES)
1. Cloud First Policy — GDCC as primary choice
2. Government Data Integration
3. Digital ID (ThaiD)
4. e-Government Services
5. Cybersecurity
6. Digital Workforce
7. Smart City Infrastructure

**Sources:**
- https://www.grandlinux.com/en/blogs/gdcc-cloud.html
- https://www.longtunman.com/60094
- https://techsauce.co/tech-and-biz/gdcc-thailand-government-cloud-digital-transformation-open-data
- https://gdcc.onde.go.th/

---

## 6. GeoNode — Open-Source GIS Platform

### Component | Standard/Technology | Documentation URL | Implementation Complexity | Cost | Compliance Requirement | Recommended Approach

**GIS Platform** | **GeoNode (Open-Source)** | https://geonode.org/, https://docs.geonode.org/ | **Medium** — requires Linux administration skills | **Free** (open-source); Hosting ~3,000-10,000 THB/month on GDCC | **RECOMMENDED** — DGA-recommended open-source GIS platform for government | Deploy GeoNode on GDCC VM using Docker; integrate with PostGIS backend; configure Thai language support

### GeoNode Key Features

| Feature | Description | Yala Application |
|---------|-------------|------------------|
| Layer management | Upload, manage, share geospatial layers | Municipal boundary, infrastructure, land use |
| Map composition | Create multi-layer interactive maps | Service delivery maps, planning maps |
| Metadata management | ISO 19139/ISO 19115 metadata | Standards-compliant data documentation |
| User management | Role-based access control | Municipal staff, public access |
| OGC services | WMS, WFS, WCS, CSW | Interoperability with national GIS |
| Document management | Upload PDFs, images, documents | Related municipal documents |

### Deployment Specifications

| Requirement | Minimum | Recommended |
|-------------|---------|-------------|
| CPU | 2 cores | 4+ cores |
| RAM | 4 GB | 8+ GB |
| Storage | 60 GB | 200+ GB (with raster data) |
| OS | Ubuntu 20.04/22.04 LTS | Ubuntu 22.04 LTS |
| Dependencies | PostgreSQL 13+, PostGIS 3+, GeoServer, Django, Nginx |

### Deployment Options

| Option | Complexity | Best For |
|--------|-----------|----------|
| Docker deployment | Low-Medium | Quick setup, development |
| Full manual install | High | Production, customization |
| Managed hosting (Kartoza/GSH) | Low | Organizations without GIS admins |

### GeoNode for Thai Municipalities
- GeoNode supports Thai language via Transifex translation project
- Can be branded with Yala Municipality logo and styling
- Integrates with PostGIS for spatial data storage
- Supports Thai coordinate systems (UTM Zone 47N/48N for southern Thailand)
- OGC-compliant for interoperability with national GIS systems

### Time Estimate
- Basic setup: Several hours
- Simple customization: ~5 days (HTML/CSS/Python skills)
- Full production deployment: 2-4 weeks

**Sources:**
- https://www.gfdrr.org/sites/default/files/publication/GeoNode_Deployment_Guide-New_Branding-Single_Sheets-1.pdf
- https://kartoza.github.io/GeoHosting-Documentation/
- https://docs.geonode.org/

---

## 7. CKAN — Open Data Catalog

### Component | Standard/Technology | Documentation URL | Implementation Complexity | Cost | Compliance Requirement | Recommended Approach

**Open Data Catalog** | **CKAN Open-D (Thai Government Edition)** | https://ckan.org/, https://gdcatalog.go.th/ | **Medium** — requires CKAN sysadmin skills | **Free** (open-source); ~2,000-5,000 THB/month hosting on GDCC | **RECOMMENDED** — Standard platform for Thai Government Data Catalog (114 agency sites, 76 area sites) | Deploy CKAN Open-D on GDCC → configure Thai GDC → harvest to gdcatalog.go.th → publish open datasets to data.go.th

### CKAN in Thailand's Government Data Ecosystem

| Component | URL | Purpose |
|-----------|-----|---------|
| data.go.th | https://data.go.th | National open data portal (CKAN-based) |
| GD Catalog | https://gdcatalog.go.th | Central government data catalog |
| Agency Data Catalog | 114 sites | Ministry/agency-level catalogs |
| Area Data Catalog | 76 sites | Provincial/municipal-level catalogs |
| CKAN Open-D | Thai Government Edition | Standardized CKAN for Thai government |
| Thai GDC | Version 1.4 | Government Data Catalog standard |

### CKAN Technical Stack

| Component | Technology | Purpose |
|-----------|-----------|---------|
| Backend | Python/Flask | Web application |
| Database | PostgreSQL | Metadata storage |
| Search | Solr | Full-text search |
| Cache | Redis | Caching, session store |
| Frontend | Jinja2 templates | HTML rendering |

### CKAN Deployment Specifications

| Requirement | Minimum | Recommended |
|-------------|---------|-------------|
| CPU | 2 cores | 4+ cores |
| RAM | 4 GB | 8+ GB |
| Storage | 60 GB | 100+ GB |
| Database | PostgreSQL 13+ | PostgreSQL 15+ |
| Additional | Redis, Solr | Redis, Solr, Nginx |

### CKAN API for Municipal Integration

```
CKAN API Endpoints:
- GET /api/3/action/package_list — List all datasets
- GET /api/3/action/package_show — Get dataset details
- GET /api/3/action/group_list — List organizations
- GET /api/3/action/group_show — Get organization details
- POST /api/3/action/package_create — Create new dataset
```

### CKAN-DCAT Extension for Metadata Standards
- ckanext-dcat enables DCAT standard compliance
- Supports DCAT-AP v3 (latest)
- Exposes datasets as RDF/JSON-LD
- Enables federation with other data catalogs
- **Source:** https://ckan.org/blog/enhancing-dcat-support-in-ckan-dcat-ap-v3-scheming-integration-and-more

### Deployment Steps for Yala Municipality
1. Deploy CKAN using Docker on GDCC VM
2. Configure PostgreSQL + Redis + Solr
3. Install Thai GDC extension (ckanext-thai-gdc)
4. Configure organization profile (Yala Municipality)
5. Create datasets with proper metadata
6. Enable harvesting to GD Catalog
7. Publish open datasets to data.go.th

**Sources:**
- https://docs.klutch.sh/guides/open-source-software/ckan/
- https://datos.gob.es/sites/default/files/documentacion/files/guide-publish-opendata-with-ckan_0.pdf
- https://gdhelppage.gdcatalog.go.th/data/0_01/files/utilization.pdf

---

## 8. PostgreSQL + PostGIS + TimescaleDB

### Component | Standard/Technology | Documentation URL | Implementation Complexity | Cost | Compliance Requirement | Recommended Approach

**Database Engine** | **PostgreSQL 15 + PostGIS 3.4 + TimescaleDB 2.11** | https://www.postgresql.org/, https://postgis.net/, https://www.timescale.com/ | **Medium** — requires DBA skills for optimization | **Free** (open-source); GDCC IaaS free | **RECOMMENDED** — Industry standard for GIS + time-series data | Deploy PostgreSQL+PostGIS+TimescaleDB as single Docker container on GDCC; create separate databases for GIS, IoT sensor data, and application data

### Database Architecture for Yala Municipality

```
PostgreSQL Instance (GDCC VM)
├── postgis_db (Spatial Data)
│   ├── municipal_boundaries
│   ├── road_network
│   ├── building_footprints
│   ├── land_use_zones
│   ├── public_facilities
│   └── environmental_zones
├── timeseries_db (IoT Sensor Data)
│   ├── air_quality_sensors (hypertable)
│   ├── water_level_sensors (hypertable)
│   ├── traffic_counters (hypertable)
│   └── weather_stations (hypertable)
└── app_db (Application Data)
    ├── user_accounts
    ├── service_requests
    ├── permits
    └── audit_logs
```

### PostgreSQL Configuration

```dockerfile
FROM timescale/timescaledb-ha:pg15-latest
COPY init.sql /docker-entrypoint-initdb.d/
EXPOSE 5432
```

### Initialization Script

```sql
-- Enable extensions
CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;
CREATE EXTENSION IF NOT EXISTS postgis;

-- Create spatial data table
CREATE TABLE municipal_facilities (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    facility_type TEXT,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    geom GEOGRAPHY(Point, 4326),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_facilities_geom ON municipal_facilities USING GIST (geom);

-- Create IoT sensor hypertable
CREATE TABLE sensor_readings (
    time TIMESTAMPTZ NOT NULL,
    sensor_id TEXT NOT NULL,
    reading_type TEXT,
    value DOUBLE PRECISION,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    location GEOGRAPHY(Point, 4326)
);
SELECT create_hypertable('sensor_readings', 'time');
CREATE INDEX idx_sensor_readings ON sensor_readings (sensor_id, time DESC);
```

### Kubernetes Deployment (for production)

| Component | Configuration |
|-----------|--------------|
| ConfigMap | init.sql for database setup |
| Deployment | TimescaleDB pods with persistent volume |
| Service | Internal cluster access |
| Storage | Persistent Volume Claim for data |

### Performance Benefits

| Feature | Benefit |
|---------|---------|
| PostGIS | Spatial queries, indexing, OGC compliance |
| TimescaleDB | Automatic partitioning, time-series optimization |
| Combined | "Where" + "When" analytics in single query |

**Sources:**
- https://medium.com/@marcoscedenillabonet/optimizing-geospatial-and-time-series-queries-with-timescaledb-and-postgis-4978ea2ef8af
- https://dev.to/tigerdata/postgresql-extensions-using-postgis-for-geospatial-and-time-series-data-ja5

---

## 9. Kong API Gateway

### Component | Standard/Technology | Documentation URL | Implementation Complexity | Cost | Compliance Requirement | Recommended Approach

**API Gateway** | **Kong Gateway (Open Source)** | https://konghq.com/, https://docs.konghq.com/gateway/ | **Medium** — requires API management expertise | **Free** (open-source); Enterprise ~$3,000/month | **RECOMMENDED** — Standard for Thai government API management; aligns with TH-e-GIF | Deploy Kong Gateway on GDCC in DB-less mode with declarative config; configure rate limiting, authentication (OAuth 2.0), logging plugins

### Kong Gateway Features

| Feature | Plugin | Yala Application |
|---------|--------|-----------------|
| Authentication | JWT, OAuth 2.0, Key Auth | Secure municipal APIs |
| Authorization | ACL, Bot Detection | Access control |
| Traffic Control | Rate Limiting, Proxy Caching | Protect backend services |
| Monitoring | Prometheus, Datadog | API analytics |
| Logging | File Log, HTTP Log, Syslog | Audit trail (PDPA compliance) |
| Transformation | Request/Response Transformer | Data format conversion |

### Kong Deployment Modes

| Mode | Use Case | Yala Recommendation |
|------|----------|-------------------|
| DB-less | Simple, lightweight, GitOps | **Recommended** for initial deployment |
| DB Mode (PostgreSQL) | Complex, multi-admin | For production scale |
| Hybrid | Control plane + data plane | For distributed deployments |
| Kubernetes | Container orchestration | Future scalability |

### Kong Docker Deployment

```bash
# DB-less mode (simplest)
docker run -d --name kong \
  -e KONG_DATABASE=off \
  -e KONG_DECLARATIVE_CONFIG=/kong/declarative/kong.yml \
  -e KONG_PROXY_ACCESS_LOG=/dev/stdout \
  -e KONG_ADMIN_ACCESS_LOG=/dev/stdout \
  -e KONG_PROXY_ERROR_LOG=/dev/stderr \
  -e KONG_ADMIN_ERROR_LOG=/dev/stderr \
  -p 8000:8000 \
  -p 8443:8443 \
  -p 8001:8001 \
  -p 8444:8444 \
  kong:latest
```

### Kong API Gateway Configuration for Yala

```yaml
# kong.yml — declarative configuration
services:
  - name: gis-api
    url: http://geonode:8000
    routes:
      - name: gis-routes
        paths: ["/api/gis"]
    plugins:
      - name: rate-limiting
        config:
          minute: 100
      - name: jwt
  - name: data-catalog-api
    url: http://ckan:5000
    routes:
      - name: catalog-routes
        paths: ["/api/catalog"]
    plugins:
      - name: key-auth
```

**Sources:**
- https://konghq.com/blog/engineering/4-ways-to-deploy-kong-gateway
- https://developer.konghq.com/gateway/
- https://medium.com/@nanditasahu031/a-comprehensive-guide-to-kong-api-gateway-11cc374c1ce5

---

## 10. Metabase vs Apache Superset — Dashboard Frameworks

### Component | Standard/Technology | Documentation URL | Implementation Complexity | Cost | Compliance Requirement | Recommended Approach

**Dashboard Framework** | **Metabase (Open Source)** | https://www.metabase.com/, https://github.com/metabase/metabase | **Low** — non-technical users can create dashboards | **Free** (open-source); Cloud $85/month | **RECOMMENDED** — Easier deployment, better for mixed technical/non-technical municipal teams | Deploy Metabase on GDCC; connect to PostgreSQL; configure Thai locale; enable SSO via ThaiD

**Dashboard Framework (Alternative)** | **Apache Superset** | https://superset.apache.org/, https://github.com/apache/superset | **Medium-High** — requires SQL knowledge | **Free** (open-source); Preset Cloud $20-500/month | **ALTERNATIVE** — More advanced visualizations, requires technical expertise | Deploy if complex custom visualizations needed; requires dedicated data team

### Comparison Matrix

| Criteria | Metabase | Apache Superset |
|----------|----------|-----------------|
| **Setup time** | < 5 minutes | Hours to days |
| **User skill level** | Non-technical friendly | SQL knowledge required |
| **Query builder** | Visual + SQL | SQL Lab + Visual |
| **Chart library** | Good (40+ charts) | Excellent (Apache ECharts) |
| **Drill-down** | One-click | More complex |
| **Thai language** | Available (community i18n) | Available (Flask-Babel) |
| **Deployment** | Docker, JAR | Docker, Kubernetes |
| **Performance** | Fast | Moderate |
| **Alerting** | Built-in | Requires setup |
| **Embedding** | Simple iframe | Signed embedding |
| **SSO support** | SAML, LDAP, JWT, OAuth | Flask-AppBuilder auth |

### Metabase Thai Language Support
- Metabase has community-driven i18n support
- Thai translation available through POEditor/Weblate
- Admin interface available in Thai for end-users
- Setup wizard supports Thai for non-technical municipal staff
- **Source:** https://www.metabase.com/blog/Metabase-in-your-language

### Metabase Deployment (Docker)

```bash
docker run -d -p 3000:3000 \
  --name metabase \
  -e "MB_DB_TYPE=postgres" \
  -e "MB_DB_DBNAME=metabase" \
  -e "MB_DB_PORT=5432" \
  -e "MB_DB_USER=metabase" \
  -e "MB_DB_PASS=password" \
  -e "MB_DB_HOST=postgres" \
  metabase/metabase:latest
```

### Metabase + PostgreSQL/PostGIS Integration
- Direct connection to PostgreSQL with PostGIS
- Automatic schema scanning
- Geospatial visualization ( choropleth maps, pin maps)
- Time-series charting with TimescaleDB
- Dashboard sharing via public links or embedded

### Recommendation for Yala Municipality
- **Primary: Metabase** — for 80% of municipal dashboards (ease of use, fast deployment)
- **Supplemental: Superset** — if advanced custom analytics needed (tourism analytics, complex forecasting)

**Sources:**
- https://www.metabase.com/lp/metabase-vs-superset
- https://www.metabase.com/blog/Metabase-in-your-language
- https://github.com/apache/superset
- https://superset.apache.org/

---

## 11. Grafana — IoT Monitoring Dashboard

### Component | Standard/Technology | Documentation URL | Implementation Complexity | Cost | Compliance Requirement | Recommended Approach

**IoT Monitoring** | **Grafana (Open Source)** | https://grafana.com/, https://github.com/grafana/grafana | **Medium** — requires data source configuration | **Free** (open-source); Cloud ~$0-500/month | **RECOMMENDED** — Industry standard for real-time monitoring; ideal for IoT sensor networks | Deploy Grafana on GDCC; connect to TimescaleDB (PostgreSQL) for sensor data; configure alerts for threshold violations

### Grafana + IoT Stack for Yala Municipality

```
IoT Sensors (Air Quality, Water Level, Traffic)
    → MQTT Broker (Mosquitto) / LavinMQ
    → Data Ingestion (Node-RED / Telegraf)
    → TimescaleDB (PostgreSQL+PostGIS)
    → Grafana (Dashboard + Alerts)
```

### Grafana Dashboard Components

| Panel Type | Municipal Use Case |
|-----------|-------------------|
| Time Series | Temperature trends, humidity over time |
| Gauge | Current water level, air quality index |
| Map (Geomap) | Sensor locations on municipal map |
| Alert List | Active threshold violations |
| Stat | Latest sensor readings |

### Grafana + TimescaleDB Data Source Configuration

```
Data Source: PostgreSQL
Host: timescaledb:5432
Database: timeseries_db
User: grafana_reader
SSL Mode: require
```

### Sample Alert Rules for Yala

| Alert | Condition | Action |
|-------|-----------|--------|
| Flood warning | Water level > 2.5m | Send LINE/Email to disaster team |
| Air quality | PM2.5 > 50 μg/m³ | Public notification |
| Traffic congestion | Vehicle count > threshold | Notify traffic management |
| System health | Database connection lost | Notify IT administrator |

### Grafana Docker Deployment

```yaml
version: '3'
services:
  grafana:
    image: grafana/grafana:latest
    ports:
      - "3000:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=secure_password
      - GF_INSTALL_PLUGINS=grafana-clock-panel
    volumes:
      - grafana-storage:/var/lib/grafana
```

**Sources:**
- https://github.com/Opikadash/Environment-monitoring-system
- https://lavinmq.com/blog/iot-data-pipeline-lavinmq-to-prometheus-to-grafana

---

## 12. ODK / KoboToolbox — Mobile Data Collection

### Component | Standard/Technology | Documentation URL | Implementation Complexity | Cost | Compliance Requirement | Recommended Approach

**Mobile Data Collection** | **KoboToolbox (Open Source)** | https://www.kobotoolbox.org/, https://github.com/kobotoolbox/kobo-install | **Low-Medium** — form design is user-friendly | **Free** (self-hosted); Hosted: Free (humanitarian), ~$3,000/year (research) | **RECOMMENDED** — Most widely used in humanitarian/development sector; XLSForm standard | Self-host KoboToolbox on GDCC using Docker; use KoboCollect mobile app for field surveys; export to PostgreSQL

### ODK vs KoboToolbox Comparison

| Feature | ODK | KoboToolbox |
|---------|-----|-------------|
| **Open source** | Yes (Apache 2.0) | Yes (AGPL) |
| **Self-hosted** | Yes (ODK Central) | Yes (Docker) |
| **Hosted service** | ODK Cloud (paid) | Kobo humanitarian server (free) |
| **Form builder** | ODK Build + XLSForm | Web-based + XLSForm |
| **Mobile app** | ODK Collect | KoboCollect / ODK Collect |
| **GPS/Geospatial** | Points, lines, shapes | Points, lines, shapes |
| **Offline capable** | Yes | Yes |
| **Multi-language** | Yes | Yes |
| **API** | OData + REST | REST API |
| **Integration** | PostgreSQL direct | PostgreSQL + MongoDB |

### KoboToolbox Self-Hosted Deployment

```bash
# Requirements: Ubuntu 22.04, Docker, Docker Compose, Python 3.12+
git clone https://github.com/kobotoolbox/kobo-install
cd kobo-install
python3 run.py
```

**Options configured during setup:**
- Installation type: `Server` (accessible from internet)
- Domain: `kobo.yala.go.th`
- Subdomains: `kf.kobo.yala.go.th`, `kc.kobo.yala.go.th`, `ee.kobo.yala.go.th`
- HTTPS: Yes (Let's Encrypt)
- Database: PostgreSQL (included)
- Backups: Yes (AWS S3 optional)

### Municipal Use Cases for ODK/KoboToolbox

| Survey Type | Data Collected | Frequency |
|-------------|---------------|-----------|
| Infrastructure audit | Road condition, building status, GPS location | Annual |
| Public service feedback | Citizen satisfaction, location-tagged | Quarterly |
| Environmental monitoring | Water quality, tree count, pollution sources | Monthly |
| Disaster assessment | Damage assessment, photo evidence, GPS | Event-based |
| Census/commercial survey | Business registration, tax assessment | Annual |

### Key Features for Municipal Data Collection
- **GPS integration:** Automatic location capture
- **Photo/media attachments:** Visual documentation
- **Offline-first:** Works without internet, syncs when connected
- **XLSForm standard:** Compatible with ODK ecosystem
- **Real-time dashboard:** Monitor submission progress live
- **Data export:** CSV, XLS, KML, SPSS, direct PostgreSQL

**Sources:**
- https://getodk.org/
- https://github.com/kobotoolbox/kobo-install
- https://humanitarian.atlassian.net/wiki/spaces/imtoolbox/pages/3190980609
- https://www.arqaam.org/resources/mobile-data-collection-applications/

---

## 13. ThaiD — Digital Identity Authentication

### Component | Standard/Technology | Documentation URL | Implementation Requirement | Cost | Compliance Requirement | Recommended Approach

**Authentication** | **ThaiD (DGA Digital ID) + OAuth 2.0 / OpenID Connect** | https://connect.egov.go.th, https://www.dga.or.th/en/our-services/digital-platform-services/digitalid/ | **Medium** — requires API integration development | **Free** for government agencies | **RECOMMENDED** — Mandatory for government digital services per Digitalization of Public Administration Act B.E. 2562 | Integrate DGA Digital ID (ThaiD) for citizen authentication; use DOPA e-KYC Level 1 for identity verification

### ThaiD/Digital ID Service Levels

| Level | Verification Method | IAL | Best For |
|-------|-------------------|-----|----------|
| Level 1: Card Verification | ID number + name verification | IAL 1.3 | Basic data verification |
| Level 2: Face Verification | Facial photo comparison | IAL 2.2 | Account opening, employee verification |
| Level 3: ThaiD Authentication | ThaiD app + Face + ID chip | IAL 2.3 | Critical system login, financial transactions |

### ThaiD Technical Integration

| Component | Standard | Details |
|-----------|----------|---------|
| Protocol | OAuth 2.0 / OpenID Connect | Token-based authentication |
| Identity Provider | DGA Digital ID | https://connect.egov.go.th |
| Alternative | NDID | National Digital ID platform |
| e-KYC | DOPA API | 3 levels of identity verification |

### Integration Architecture

```
Citizen → Yala Municipality Web Portal
    → Redirect to ThaiD Login (connect.egov.go.th)
    → Authenticate via ThaiD App
    → OAuth callback with token
    → Municipal system verifies token
    → Access granted based on role
```

### ThaiD Statistics (as of 2026)
- 162.63 million cumulative digital ID accounts created
- 1,797 government e-services connected
- 28 licensed digital ID service providers
- 9.2 million NDID users (as of March 2023)

### DPOA e-KYC Integration for Yala Municipality
- **Level 1 (Card Verification):** Verify citizen identity for service requests
- **Level 2 (Face Verification):** Verify for sensitive transactions (permits, licenses)
- **PDPA Compliance Required:** Must obtain consent before every verification request

### Related Laws
- Digitalization of Public Administration and Service Delivery Act B.E. 2562
- Digital Identity Verification Act B.E. 2565 (2022)
- PDPA B.E. 2562

**Sources:**
- https://www.dga.or.th/en/our-services/digital-platform-services/digitalid/
- https://www.grandlinux.com/en/blogs/dopa-ekyc-digital-id.html
- https://thedocs.worldbank.org/en/doc/c9160dd8065d1300384d8ab790742165-0070012025
- https://ndid.co.th/en/

---

## 14. Data Catalog Best Practices & Metadata Standards

### Component | Standard/Technology | Documentation URL | Implementation Complexity | Cost | Compliance Requirement | Recommended Approach

**Metadata Standard** | **DCAT-AP (Data Catalog Vocabulary — Application Profile)** | https://www.w3.org/TR/vocab-dcat/, https://github.com/ckan/ckanext-dcat | **Medium** — requires metadata schema design | **Free** (W3C open standard) | **RECOMMENDED** — Align with data.go.th and international best practices | Use CKAN with ckanext-dcat extension; define Thai municipal metadata profile based on DCAT-AP v3

### DCAT-AP Metadata Elements for Yala Municipality

| Element | Property | Description | Example |
|---------|----------|-------------|---------|
| Title | dct:title | Dataset name | "Yala Municipal Road Network 2025" |
| Description | dct:description | Detailed description | "Geospatial data of all roads within Yala municipality..." |
| Publisher | dct:publisher | Data owner | "Yala Municipality" |
| Contact Point | dcat:contactPoint | Contact person | "GIS Unit, Yala Municipality" |
| Identifier | dct:identifier | Unique ID | "YALA-ROAD-2025-001" |
| Spatial | dct:spatial | Geographic coverage | "Yala Province, Thailand" |
| Temporal | dct:temporal | Time coverage | "2025-01-01 to 2025-12-31" |
| Theme | dcat:theme | Category | "Transportation" |
| Format | dct:format | Data format | "GeoJSON, Shapefile" |
| License | dct:license | Usage license | "Open Government License" |
| Update Frequency | dct:accrualPeriodicity | Update schedule | "Quarterly" |

### Metadata Schema Mapping

| Standard | Yala Application |
|----------|-----------------|
| DCAT-AP v3 | Primary metadata profile |
| GeoDCAT-AP | Geospatial dataset extension |
| StatDCAT-AP | Statistical dataset extension |
| CKAN Internal Schema | For CKAN-specific features |
| Thai Government Data Catalog (Thai GDC) | National interoperability |

### Best Practices for Municipal Data Inventory

1. **Mandatory metadata fields:** Title, description, publisher, license, format, spatial/temporal coverage
2. **Consistent naming:** Use standardized naming conventions (Thai + English)
3. **Categorized themes:** Use standard government data categories
4. **Regular updates:** Review and update metadata quarterly
5. **Version control:** Track dataset versions
6. **Quality documentation:** Include data quality statements
7. **API endpoints:** Provide programmatic access via CKAN API

**Sources:**
- https://ckan.org/blog/enhancing-dcat-support-in-ckan-dcat-ap-v3-scheming-integration-and-more
- https://resources.data.gov/resources/podm-field-mapping/
- https://www.etsi.org/deliver/etsi_en/304100_304199/304199/01.00.00_20/en_304199v010000ev.pdf

---

## 15. Interoperability with National Systems

### Component | Standard/Technology | Documentation URL | Implementation Complexity | Cost | Compliance Requirement | Recommended Approach

**National Data Integration** | **GDX (Government Data Exchange) + data.go.th API + GD Catalog** | https://data.go.th/, https://gdcatalog.go.th/ | **High** — requires government authorization and API integration | **Free** for government agencies | **RECOMMENDED** — Required for national data sharing and open data compliance | Register as GDX data provider → implement CKAN Open-D → harvest metadata to GD Catalog → publish open data to data.go.th

### National Data Ecosystem Architecture

```
Yala Municipality Data Platform
    → CKAN Open-D (Agency Data Catalog)
    → GD Catalog (gdcatalog.go.th) [Harvesting]
    → data.go.th (Open Data Portal) [Public access]
    → GDX (Government Data Exchange) [Inter-agency sharing]
    → StatHub (stathub.nso.go.th) [Statistical reporting]
```

### Integration Points

| National System | URL | Integration Method | Data Type |
|-----------------|-----|-------------------|-----------|
| data.go.th | https://data.go.th | CKAN API harvest | Open datasets |
| GD Catalog | https://gdcatalog.go.th | Thai GDC catalog federation | Metadata |
| GDX | Internal government network | RESTful API (OAuth 2.0) | Inter-agency data |
| StatHub | https://stathub.nso.go.th | SDMX API | Statistical data |
| DOPA API | Internal | REST API (e-KYC) | Identity verification |
| DGA Digital ID | https://connect.egov.go.th | OpenID Connect | Authentication |

### GDX (Government Data Exchange) Integration

| Aspect | Current State | Recommended Improvement |
|--------|--------------|------------------------|
| Authentication | Static tokens (60-min expiry) | OAuth 2.0 with refresh tokens |
| API Design | Synchronous GET requests | RESTful with versioning |
| Data Format | JSON | JSON + SDMX for statistics |
| Audit | Basic logs | Comprehensive SIEM logging |

### CKAN Harvesting Configuration

```python
# Yala Municipality CKAN → GD Catalog harvest
{
    "name": "yala-municipality",
    "title": "Yala Municipality Data Catalog",
    "url": "https://catalog.yala.go.th",
    "type": "ckan",
    "frequency": "DAILY",
    "config": {
        "api_version": 3,
        "default_tags": ["municipal", "yala", "southern-thailand"]
    }
}
```

**Sources:**
- https://data.go.th/en/
- https://uat.data.go.th/en/
- https://gdhelppage.gdcatalog.go.th/data/0_01/files/utilization.pdf
- https://thedocs.worldbank.org/en/doc/c9160dd8065d1300384d8ab790742165-0070012025

---

## 16. Reference Architectures — Khon Kaen, Hat Yai, Phuket

### Component | Standard/Technology | Documentation URL | Implementation Complexity | Cost | Compliance Requirement | Recommended Approach

**Reference Implementation** | **Phuket City Data Platform + Hat Yai Smart City + Khon Kaen Provincial Dashboard** | https://depa.or.th/, https://www.hatyaicity.go.th/water_tracking | **High** — full smart city platform deployment | **3-50 million THB** depending on scope | **REFERENCE** — Models for Yala's architecture design | Adopt Phuket CDP architecture pattern (IoT → Cloud → API → Dashboard); implement incrementally starting with data platform

### 16.1 Phuket City Data Platform (CDP)

**Architecture:**
```
Central Nervous System (Brain)
    → City Operation Centre
    → Cloud Data Center
Peripheral Nervous System (Body)
    → City IoT Network (LoRaWAN, NB-IoT)
    → City Communication Network
```

**Digital Infrastructure:**
| Component | Scale |
|-----------|-------|
| Public Free WiFi | 1,000 APs |
| LoRaWAN Coverage | 543 sq. km |
| NB-IoT Stations | Province-wide |
| Fibre Optic | Full coverage for CCTV |
| 5G Coverage | 70% of area |

**City Data Platform Features:**
- Tourist behaviour analytics
- Safety/Environment monitoring
- Investor information portal
- 3D Digital Twin (co-developed with Prince of Songkla University)
- Real-time dashboard for flood monitoring
- API-based data sharing between agencies
- WiFi data analytics

**Seven Smart Pillars:**
1. Smart Living (CCTV, ambulance, marine safety)
2. Smart Environment (IoT sensors, waste management)
3. Smart Economy (innovation park, startup boost)
4. Smart Mobility (smart bus, LRT)
5. Smart Governance (disaster command center, CDP)
6. Smart People (schools database, training)
7. Smart Energy

**Source:** https://depa.or.th/storage/app/media/SmartCity/Tab_SmartCity/13_Phuket%20Smart%20City.pdf

### 16.2 Hat Yai Smart City

**Key Projects:**
| Project | Technology | Status |
|---------|-----------|--------|
| Smart Traffic Signals | AI-adaptive traffic control | Deployed |
| AI CCTV | 1,503 cameras (expanded from 721) | Deployed |
| Single Command Center | Central monitoring hub | Operational |
| Smart IoT Street Lighting | Automated street lights | Deployed |
| Water Tracking System | Real-time flood monitoring | Live: https://www.hatyaicity.go.th/water_tracking |
| One Stop Service | Online complaint system | Operational |
| Online Approval | Digital permit system | Operational |
| Open Data | Municipal database | Developing |

**Governance Structure:**
- Committee 1: Strategic Committee (Mayor + Advisors)
- Committee 2: Project Management (Deputy Mayor + Directors)
- Committee 3: Working Group (Cross-departmental staff)

**Source:** https://kb.psu.ac.th/server/api/core/bitstreams/5ecbb68b-6cfa-4270-880b-acbebf746131/content

### 16.3 Khon Kaen Provincial Dashboard

**Architecture Pattern:**
- Provincial-level data integration
- Multi-agency data sharing
- Expandable to municipal level
- KPI dashboard for provincial administration
- GIS integration for spatial analytics

### Architecture Comparison for Yala Municipality

| Feature | Phuket (Comprehensive) | Hat Yai (Focused) | Yala (Recommended) |
|---------|----------------------|-------------------|-------------------|
| IoT Network | Full (LoRaWAN + NB-IoT) | Partial | Start with key sensors |
| Data Platform | Full CDP | Basic | PostgreSQL+PostGIS+CKAN |
| GIS | 3D Digital Twin | Basic maps | GeoNode + PostGIS |
| Dashboard | Custom CDP | Water tracking + basic | Metabase + Grafana |
| CCTV/AI | 2,000+ cameras | 1,503 cameras | Phase 1: 50-100 cameras |
| Open Data | Integrated | Developing | CKAN Open-D |
| Budget | 50M+ THB | 10-20M THB | 3-5M THB (Phase 1) |

### Recommended Phased Approach for Yala

**Phase 1 (Months 1-6): Data Foundation**
- Deploy PostgreSQL+PostGIS+TimescaleDB on GDCC
- Set up GeoNode for GIS data management
- Deploy CKAN Open-D for data catalog
- Deploy Metabase for dashboards

**Phase 2 (Months 6-12): IoT & Monitoring**
- Install IoT sensors (water level, air quality)
- Deploy Grafana for real-time monitoring
- Integrate ODK/KoboToolbox for field data
- Set up Kong API Gateway

**Phase 3 (Months 12-18): Integration & Intelligence**
- Connect to national systems (data.go.th, GD Catalog)
- Implement SDMX for statistical reporting
- Deploy ThaiD authentication
- Advanced analytics and forecasting

---

## 17. Executive Summary & Recommended Architecture

### Recommended Technology Stack for Yala Municipality

| Layer | Component | Technology | Cost |
|-------|-----------|-----------|------|
| **Cloud Infrastructure** | Government Cloud | GDCC (IaaS) | FREE |
| **Database** | Spatial + Time-Series | PostgreSQL + PostGIS + TimescaleDB | FREE |
| **GIS Platform** | Map publishing | GeoNode | FREE |
| **Data Catalog** | Open data portal | CKAN Open-D | FREE |
| **API Gateway** | API management | Kong Gateway (OSS) | FREE |
| **Dashboards** | BI & Analytics | Metabase | FREE |
| **IoT Monitoring** | Real-time monitoring | Grafana | FREE |
| **Field Data** | Mobile collection | KoboToolbox | FREE |
| **Authentication** | Digital ID | ThaiD / DGA Digital ID | FREE |
| **Standards** | Interoperability | TH-e-GIF v2.0 + SDMX + DCAT-AP | FREE |

### Total Estimated Costs

| Item | Cost (THB) |
|------|-----------|
| GDCC IaaS (VMs) | FREE |
| Personnel (GIS developer + DBA + DPO) | 120,000-200,000/month |
| Training (PDPA, GIS, CKAN) | 50,000-100,000 (one-time) |
| IoT sensors (Phase 1: 20-30 units) | 100,000-300,000 |
| SSL certificates (Let's Encrypt) | FREE |
| **Phase 1 Total (6 months)** | **~1-2 million THB** |
| **Full deployment (18 months)** | **~3-5 million THB** |

### Compliance Checklist

| Standard | Status | Priority |
|----------|--------|----------|
| TH-e-GIF v2.0 | Must implement | HIGH |
| PDPA B.E. 2562 | Must implement | HIGH |
| DPO Appointment | Required | HIGH |
| ThaiD Authentication | Recommended | HIGH |
| SDMX (ISO 17369) | Recommended | MEDIUM |
| DCAT-AP Metadata | Recommended | MEDIUM |
| data.go.th Integration | Recommended | MEDIUM |
| GDCC Cloud | Recommended | MEDIUM |
| ISO 27001 (via GDCC) | Inherited | LOW |

### Critical Success Factors

1. **Executive sponsorship** — Mayor and municipal council commitment
2. **Skilled personnel** — Hire/train GIS developer, database admin, DPO
3. **GDCC adoption** — Register and utilize free government cloud
4. **Standards compliance** — Implement TH-e-GIF from day one
5. **PDPA readiness** — Appoint DPO, conduct gap assessment
6. **Phased approach** — Start small, iterate, expand
7. **National integration** — Plan for data.go.th and GD Catalog connection
8. **Community engagement** — Include citizens in dashboard design

---

## Appendix: Key URLs & Resources

### Government Standards & Policy
- DGA (Digital Government Development Agency): https://www.dga.or.th
- TH-e-GIF Standards: https://www.dga.or.th/en/standards/
- data.go.th: https://data.go.th
- GD Catalog: https://gdcatalog.go.th
- GDCC Portal: https://portal.opendata.go.th/
- ThaiD Digital ID: https://connect.egov.go.th
- PDPA Resources: https://www.pdpa.guide/

### Open Source Technologies
- PostgreSQL: https://www.postgresql.org/
- PostGIS: https://postgis.net/
- TimescaleDB: https://www.timescale.com/
- GeoNode: https://geonode.org/
- CKAN: https://ckan.org/
- Kong Gateway: https://konghq.com/
- Metabase: https://www.metabase.com/
- Apache Superset: https://superset.apache.org/
- Grafana: https://grafana.com/
- ODK: https://getodk.org/
- KoboToolbox: https://www.kobotoolbox.org/

### Reference Implementations
- Phuket Smart City: https://depa.or.th/
- Hat Yai Municipality: https://www.hatyaicity.go.th/
- Khon Kaen Provincial Dashboard: Search "Khon Kaen smart city dashboard"

### Training & Certification
- DCT Thailand DPO Training: https://www.dct.or.th/
- IAPP Certifications: https://iapp.org/
- DGA Training: https://www.dga.or.th/en/training/

---

*Research compiled from 25+ authoritative sources including Thai government agencies (DGA, MDES, NSO, DEPA), international standards bodies (W3C, ISO, SDMX), open-source project documentation, and academic research. All URLs verified as of July 2025.*
