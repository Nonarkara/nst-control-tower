# Dimension 02: Thailand National Open Data Portals & APIs
## Comprehensive Deep-Dive for Yala Municipality Integration

**Research Date:** 2026-06-18
**Searches Conducted:** 25+
**Sources Consulted:** 60+

---

## Table of Contents
1. [Executive Summary](#1-executive-summary)
2. [data.go.th CKAN API](#2-datagoth-ckan-api)
3. [GD Catalog REST API](#3-gd-catalog-rest-api)
4. [NSO Yala Provincial Office](#4-nso-yala-provincial-office)
5. [NSO StatHub SDMX API](#5-nso-stathub-sdmx-api)
6. [TPMAP Access](#6-tpmap-access)
7. [DOPA API](#7-dopa-api)
8. [DEPA CityData Platform](#8-depa-citydata-platform)
9. [Government Spending Data](#9-government-spending-data)
10. [e-GP Procurement](#10-e-gp-procurement)
11. [DBD DataWarehouse](#11-dbd-datawarehouse)
12. [Open Law Data](#12-open-law-data)
13. [NDID Integration](#13-ndid-integration)
14. [DGA Data Exchange (GDX)](#14-dga-data-exchange-gdx)
15. [Authentication Requirements](#15-authentication-requirements)
16. [Dataset Quality Assessment](#16-dataset-quality-assessment)
17. [Quick Reference Summary Table](#17-quick-reference-summary-table)

---

## 1. Executive Summary

This report documents 16 national-level open data portals and APIs available for Yala Municipality integration. Thailand's digital government infrastructure has matured significantly, with DGA serving as the central coordinator for open data (data.go.th), inter-agency data exchange (GDX), and digital identity (DGA Digital ID). For Yala Municipality, the highest-priority integrations are:

1. **DEPA CityData Platform** - Yala already has an active portal at citydata.in.th/yala-city-municipality/ with 15+ datasets; this is the immediate foundation for the municipal dashboard
2. **data.go.th CKAN API** - 11,000+ datasets with full search/filter capabilities for Yala-relevant data
3. **DOPA API** - Essential for citizen identity verification in municipal services (3 service tiers available)
4. **NSO StatHub SDMX API** - Comprehensive provincial-level statistics including Yala-specific dataflows
5. **GDX (Government Data Exchange)** - Inter-agency data sharing enabling Yala to access population, business, and other government data

**Key Finding:** Yala Municipality already has an operational DEPA CityData platform with 15+ published datasets. The recommended approach is to build the municipal dashboard on top of this existing infrastructure while integrating additional national data sources via their respective APIs.

---

## 2. data.go.th CKAN API

### Source Name
Open Government Data of Thailand (data.go.th)

### URL
- Portal: https://data.go.th/
- API Base: https://opendata.data.go.th/
- API Documentation: https://opendata.data.go.th/pages/data-go-th-api

### API Endpoint
The portal uses CKAN (Comprehensive Knowledge Archive Network) API:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `https://opendata.data.go.th/api/3/action/package_list` | GET | List all dataset names |
| `https://opendata.data.go.th/api/3/action/package_search` | GET/POST | Search datasets with Solr query |
| `https://opendata.data.go.th/api/3/action/package_show` | GET | Show specific dataset metadata |
| `https://opendata.data.go.th/api/3/action/group_list` | GET | List all data categories |
| `https://opendata.data.go.th/api/3/action/tag_list` | GET | List all tags |
| `https://opendata.data.go.th/api/3/action/resource_search` | GET | Search for resources |
| `https://opendata.data.go.th/api/3/action/organization_list` | GET | List all publishing organizations |

### Authentication
- **API Key Required:** Yes, for higher rate limits
- **Registration:** Register at https://opendata.data.go.th/ to obtain API key
- **Default Rate Limit:** 1,000 requests/hour per IP (no key required for basic access)
- **With API Key:** Higher limits available upon request

### Example Queries for Yala
```
# Search for Yala-related datasets
https://opendata.data.go.th/api/3/action/package_search?q=Yala&rows=100

# Search by organization
https://opendata.data.go.th/api/3/action/package_search?fq=organization:yala-city-municipality

# Search for population data
https://opendata.data.go.th/api/3/action/package_search?q=population+Yala

# Search for budget/fiscal data
https://opendata.data.go.th/api/3/action/package_search?q=budget+province+Yala
```

### Data Available
- 11,000+ datasets from 150+ government agencies
- Categories include: population, education, health, economy, agriculture, environment, transportation
- Yala-specific datasets from Yala City Municipality, NSO, and other agencies
- Data formats: CSV, XLS, XLSX, JSON, XML, PDF, GeoJSON, Shapefile

### Update Frequency
- Varies by agency; typically annual for statistics, quarterly for fiscal data
- No guaranteed update schedule; agencies publish at their own pace

### Integration Complexity
- **Level:** Low-Medium
- CKAN is well-documented, open-source, with SDKs in Python, R, JavaScript
- R package `thaigov` available: `devtools::install_github("asiripanich/thaigov")`
- Python library: `ckanapi` available via pip

### Priority for Yala
- **HIGH** - Primary source for discovering and accessing government datasets

### Practical Integration Notes
- Use `package_search` with Solr parameters for filtering
- The `rows` parameter controls pagination (default: 10, max: typically 1000)
- Use `fq` (filter query) with `organization:` prefix to filter by publishing agency
- Metadata includes update frequency, data steward contact, and license information
- Datasets can be previewed and downloaded directly or accessed via DataStore API for structured data

---

## 3. GD Catalog REST API

### Source Name
Government Data Catalog (GD Catalog)

### URL
- Portal: https://gdcatalog.go.th/
- API Portal: https://api.gdcatalog.go.th/
- Help Page: https://gdhelppage.gdcatalog.go.th/

### API Endpoint
GD Catalog uses CKAN Open-D and Thai GDC platforms with REST APIs:

| Endpoint | Description |
|----------|-------------|
| `https://api.gdcatalog.go.th/api/3/action/package_list` | List datasets |
| `https://api.gdcatalog.go.th/api/3/action/package_search` | Search datasets |
| `https://api.gdcatalog.go.th/api/3/action/package_show` | Dataset details |

### Authentication
- **OAuth2:** Supported for API access
- **CKAN API Key:** Available for registered users
- The system supports both public and private dataset access

### Data Available
- 156 agency catalogs (114 Agency Data Catalogs, 76 Area Data Catalogs at provincial level)
- 1 central GD Catalog
- Metadata registry with standardized data descriptions
- Datasets are harvested from agency catalogs into the central catalog
- 97% public data, 3% personal data

### Update Frequency
- Harvesting occurs on scheduled intervals (typically daily or weekly)
- Depends on individual agency update schedules

### Integration Complexity
- **Level:** Medium
- Requires understanding of CKAN API + OAuth2 flow
- Good documentation available at gdhelppage.gdcatalog.go.th

### Priority for Yala
- **MEDIUM** - Useful for discovering which agencies have Yala-related data

### Practical Integration Notes
- GD Catalog serves as the "union catalog" of all government data
- Can discover data that may not be published on data.go.th
- Provincial Area Data Catalogs (76 sites) may have Yala-specific data not available nationally
- API documentation PDF: https://gdhelppage.gdcatalog.go.th/data/04/files/other/ckan-data-api.pdf

---

## 4. NSO Yala Provincial Office

### Source Name
National Statistical Office (NSO) - Yala Provincial Statistical Office

### URL
- NSO Central: https://www.nso.go.th/
- Yala Provincial Office: http://yala.nso.go.th/
- Data Services Email: services@nso.go.th
- Service Line: 0 2141 7500

### Contact Information
**Yala Provincial Statistical Office**
- Phone: 073-212-703
- Website: http://yala.nso.go.th/
- Parent Organization: National Statistical Office, Ministry of Digital Economy and Society
- Central NSO Address: The Government Complex, Building C, Chaeng Watthana Rd, Laksi, Bangkok 10210

### Data Available
The Yala Provincial Statistical Office is responsible for:
1. Managing important statistical data to support local development
2. Conducting censuses and surveys at the local level
3. Provincial-level data production and dissemination
4. Supporting the Government Data Catalog at the local level
5. Smart City data platform support

**Available Surveys for Yala:**
- Labor Force Survey
- Household Socio-Economic Survey
- Multiple Indicator Cluster Survey (MICS) - includes Yala among 17 vulnerable provinces
- Business and Industrial Census
- Survey of Older Persons in Thailand
- COVID-19 Impact surveys
- Surveys as requested by the Governor

### Direct Data Request Process
1. Contact the Yala Provincial Statistical Office directly at 073-212-703
2. Submit formal data request via NSO service line: 0 2141 7500
3. Email: services@nso.go.th
4. Some data may require official letter from Yala Municipality
5. Cost: Generally free for government use; may vary for extensive custom requests

### Update Frequency
- Annual for most major surveys
- Quarterly for labor force statistics
- Ad-hoc for special surveys

### Integration Complexity
- **Level:** Medium
- Direct contact required for provincial-level data
- Not all provincial data is available via online APIs
- May require formal MOU for regular data feeds

### Priority for Yala
- **HIGH** - Essential source for authoritative provincial statistics

### Practical Integration Notes
- The Yala NSO office can provide disaggregated data not available on national platforms
- NSO is implementing the Government Data Catalog at the area level - Yala can request support
- NSO actively supports Smart City initiatives and City Data Platforms

---

## 5. NSO StatHub SDMX API

### Source Name
NSO Statistics Sharing Hub (StatHub)

### URL
- Portal: https://stathub.nso.go.th/
- API Endpoint: https://ns1-stathub.nso.go.th/rest/
- Alternative: https://ns2-stathub.nso.go.th/rest/

### API Endpoint (SDMX 2.1)

| Endpoint | Description |
|----------|-------------|
| `https://ns1-stathub.nso.go.th/rest/dataflow` | List all available dataflows |
| `https://ns1-stathub.nso.go.th/rest/dataflow/{agency}/{id}/{version}` | Specific dataflow details |
| `https://ns1-stathub.nso.go.th/rest/data/{dataflow}/{key}` | Query actual data |
| `https://ns1-stathub.nso.go.th/rest/datastructure` | List DSDs (Data Structure Definitions) |
| `https://ns1-stathub.nso.go.th/rest/codelist` | List code lists (dimensions) |

### Authentication
- **Public Access:** Most dataflows available without authentication
- **Registration:** Not required for basic queries
- Rate limits apply but are generous for public access

### Querying Provincial-Level Data for Yala
SDMX uses dimension keys to filter data. For Yala province, the Area dimension code would be `TH.YLA` or similar provincial code.

```
# List all dataflows
GET https://ns1-stathub.nso.go.th/rest/dataflow

# Query specific dataflow with Yala filter
GET https://ns1-stathub.nso.go.th/rest/data/{DF_ID}/...TH.YLA...

# Example: Population data for Yala
GET https://ns1-stathub.nso.go.th/rest/data/DF_POP/...TH.YLA..
```

### Data Available
- 100+ dataflows covering economic, social, demographic, and environmental statistics
- Key dimensions: Area (province, district), Sex, Age group, Time period, Frequency
- SDMX flavour: Flat Time series
- Output formats: SDMX-ML, JSON, CSV

### Integration Complexity
- **Level:** High
- Requires understanding of SDMX standard
- Must first discover the correct dataflow IDs and dimension codes
- Use the interactive dashboard at stathub.nso.go.th to explore before API queries

### Priority for Yala
- **HIGH** - Authoritative source for time-series statistics at provincial level

### Practical Integration Notes
1. First browse https://stathub.nso.go.th/ to identify relevant dataflows
2. Use the interactive query builder to construct queries
3. The visual dashboard uses Power BI for interactive exploration
4. Microsoft Power BI can connect directly via SDMX link
5. DSDs (Data Structure Definitions) describe each dataflow's dimensions
6. Provincial dimension codes follow Thai administrative divisions

---

## 6. TPMAP Access

### Source Name
Thai People Map and Analytics Platform (TPMAP)

### URL
- Portal: https://www.tpmap.in.th/
- About: https://www.tpmap.in.th/about
- Developer: NECTEC (National Electronics and Computer Technology Center)
- Policy Partner: Office of the National Economic and Social Development Board (NESDB)

### Access Method
- **Public Dashboard:** Open access via web browser
- **Data Download:** Provincial-level, district-level, and subdistrict-level data available via download buttons on the portal
- **Granularity:** Individual, household, community, local, provincial, national levels
- **No formal API** identified for automated access

### How Yala Municipality Can Access TPMAP Data
1. **Direct Web Access:** Visit https://www.tpmap.in.th/ and navigate to Yala province
2. **Data Download:** Use download buttons at top-right of the dashboard for CSV/Excel data
3. **Available Granularity:** Provincial, district, and subdistrict levels
4. **Training:** Contact NECTEC at 02-564-6900 ext. 2330-2340
5. **Data Sharing:** For household-level data, formal data sharing agreement with NESDB/NECTEC required

### Data Available
TPMAP uses Multidimensional Poverty Index (MPI) with 5 dimensions:
1. **Health** - Healthcare access, health conditions
2. **Education** - Educational attainment, school attendance
3. **Finance** - Income, assets, debt
4. **Living Conditions** - Housing quality, sanitation, electricity
5. **Access to Government Services** - Welfare registration status

**For Yala specifically:**
- Poverty mapping at subdistrict level
- Comparative year-over-year analysis
- Targeted population identification
- Policy intervention recommendations

### Update Frequency
- Annual updates based on survey data
- Real-time integration with welfare registration systems

### Integration Complexity
- **Level:** Low-Medium
- Web dashboard is user-friendly
- Downloadable data can be integrated into municipal dashboard
- No API for automated integration; manual download required

### Priority for Yala
- **HIGH** - Critical for poverty alleviation and social welfare targeting

### Practical Integration Notes
- TPMAP data can be downloaded and integrated into the municipal dashboard
- Contact NECTEC for training on using TPMAP for municipal planning
- The MPI indicators can inform municipal social welfare programs
- Data is available for Yala at district and subdistrict granularity

---

## 7. DOPA API

### Source Name
Department of Provincial Administration (DOPA) API - also known as BORA (Bureau of Registration Administration)

### URL
- GDX Portal: https://gdx.dga.or.th/
- API Access: https://api.egov.go.th/ws/dopa/
- Developer Portal: https://dev.egov.go.th/ (requires registration)
- DOPA: https://www.dopa.go.th/

### API Endpoint

| Service Level | Endpoint | Description |
|--------------|----------|-------------|
| **Level 1: Card Verification** | `https://api.egov.go.th/ws/dopa/verification/personal` | Verify ID number + name + laser code |
| **Level 2: Face Verification** | `https://api.egov.go.th/ws/dopa/verification/face` | Facial photo comparison |
| **Level 3: ThaiD Authentication** | Via ThaiD app | Full authentication with IAL 2.3 |

### Authentication
- **OAuth 2.0 Flow:** Required
- **Consumer-Key & ConsumerSecret:** Issued by DGA upon registration
- **Registration Process:**
  1. Municipality applies to DGA via https://dev.egov.go.th/
  2. Submit application form with agency details
  3. Receive Consumer-Key and ConsumerSecret via email
  4. Implement OAuth 2.0 token exchange
  5. Register server IP addresses (IP Whitelist)

### Request Flow
```
1. Request token: POST /ws/auth/validate
   Headers: Consumer-Key, ConsumerSecret
   Returns: Token (valid for 60 minutes)

2. Query citizen data: GET /ws/dopa/verification/personal
   Headers: Consumer-Key, Token
   Parameters: CitizenID, FirstName, LastName, BEBirthDate, LaserCode
```

### Data Available

| API | Data Returned |
|-----|--------------|
| `personal/profile/simple` | Name, ID number, birth date |
| `personal/profile/normal` | + Address information |
| `personal/profile/full` | + Full demographic details |
| `personal/profile/extra` | + Additional attributes |
| `house/profile` | Household registration details |
| `house/person` | Persons in household |

### What Municipalities Can Access
- **Civil registration verification** (IAL 1.3): Match ID + name + birth date
- **Address verification**: Confirm current registered address
- **Household information**: List persons in household
- **Biometric verification**: Face matching (if authorized)
- **All operations require citizen consent** (PDPA compliance)

### Cost
- Government-to-government pricing: Low/Free
- Processing fees may apply for high-volume usage

### Integration Complexity
- **Level:** Medium-High
- Requires OAuth 2.0 implementation
- IP whitelisting required
- Consent logging mandatory (PDPA)
- SSL/TLS mandatory
- Rate limits apply

### Priority for Yala
- **HIGH** - Essential for citizen identity verification in municipal services

### Practical Integration Notes
- DOPA API is Thailand's most authoritative identity verification source
- All municipal services requiring citizen ID verification should use this
- The Laser Code API requires the 12-digit code on the back of the ID card
- Full source code examples in C#, Java, PHP available at sc.ega.or.th
- Contact: contact@dga.or.th or 02-612-6060 for registration

---

## 8. DEPA CityData Platform

### Source Name
DEPA Smart City Data Platform (CityData)

### URL
- Yala Portal: https://www.citydata.in.th/yala-city-municipality/en/
- Yala Public Dashboard: https://www.citydata.in.th/yala-city-municipality/en/dashboard-public-en/
- CKAN API Guide: https://www.citydata.in.th/datacatalog_ckan_api/
- DEPA Services: https://www.citydata.in.th/en/our-services/
- Contact: [email protected] or 0-2026-2333 ext. 1068

### API Endpoint (CKAN Data API)

| Endpoint | Description |
|----------|-------------|
| `https://catalog.citydata.in.th/api/3/action/package_list` | List all datasets |
| `https://catalog.citydata.in.th/api/3/action/package_search` | Search datasets |
| `https://catalog.citydata.in.th/api/3/action/datastore_search` | Query data in DataStore |
| `https://catalog.citydata.in.th/api/3/action/datastore_search_sql` | SQL queries on DataStore |

### Authentication
- **User Token:** Required for CKAN Data API
- Registration on the citydata.in.th platform
- `api-key` header required for API calls

### Data Currently Available for Yala Municipality
The Yala City Municipality portal already has **15+ datasets** published:

1. **City Data Information** - Yala Municipality area boundaries
2. **Tax Information** - Tax collection from Finance Bureau
3. **Budget Information** - Income/expenses by type (latest fiscal year)
4. **Public Health Services** - Usage statistics (from HDC)
5. **Online Public Service** - OA/Facebook Messenger service info
6. **Free Wi-Fi Service** - Usage from 48 signal points
7. **Complaint System** - Citizen complaints through system
8. **Elderly Allowance** - Recipients by age
9. **Disability Allowance** - Recipients by disability type
10. **Population Data** - From civil registration system
11. **Garbage Collection** - General and infectious waste
12. **Carbon Adsorption** - CO2 absorption capacity of green areas
13. **Water Supply** - Consumption and service data
14. **Green Area Information** - Proportion of green/natural areas
15. **PM2.5 Level** - Air quality data from Pollution Control Department

### Integration Complexity
- **Level:** LOW
- Yala Municipality ALREADY HAS an active platform
- CKAN API is standard and well-documented
- Data can be queried directly via DataStore API
- SQL query support for complex filtering

### Priority for Yala
- **HIGHEST** - Immediate foundation for municipal dashboard

### Practical Integration Notes
- Yala's citydata portal was developed with Boonmee Lab support (2021)
- DEPA provides the platform FREE to municipalities
- To add new datasets, contact DEPA Digital Platform and Services Promotion Department
- Service form: https://short.depa.or.th/YchqL
- Data can be downloaded as CSV or accessed via API
- The platform supports CKAN Data API for structured data querying

### Sample API Call
```bash
# Search Yala datasets
curl -H 'api-key: <TOKEN>' \
  'https://catalog.citydata.in.th/api/3/action/datastore_search?resource_id=<RESOURCE_ID>&limit=5'

# SQL query
curl -H 'api-key: <TOKEN>' \
  'https://catalog.citydata.in.th/api/3/action/datastore_search_sql?sql=SELECT * FROM "<RESOURCE_ID>" WHERE column=value'
```

---

## 9. Government Spending Data

### Source Name
Thailand Government Spending ("Where does tax go?")

### URL
- Portal: https://govspending.data.go.th/
- API Documentation: https://govspending.data.go.th/api/documentation
- API Base: https://govspendingapi.data.go.th/api/service/

### API Endpoint

| Endpoint | Description |
|----------|-------------|
| `https://govspendingapi.data.go.th/api/service/bbagc` | Budget by agency |
| `https://govspendingapi.data.go.th/api/service/expense` | Expenditure data |
| `https://govspending.data.go.th/api/get/egp/purchase_method` | Procurement methods |

### Authentication
- **User Token:** Required
- Register at https://api.data.go.th/ (shared token system)
- Two tokens available: DGAOpenData and APIgovspending
- Limit: 1,000 requests/day per user

### Example Query for Yala
```
# Budget data for Yala
https://govspendingapi.data.go.th/api/service/bbagc?user_token=XXX&year=2567&agc_name=ยะลา&offset=0&limit=20

# Expenditure data
https://govspendingapi.data.go.th/api/service/expense?user_token=XXX&year=2567&province=ยะลา
```

### Data Available
- Budget allocation by ministry/agency
- Expenditure tracking (budget vs. actual spending)
- Procurement data from e-GP
- Provincial-level budget breakdown
- Fiscal years 2559-2568 (2016-2025)

### Update Frequency
- Budget data: Annual
- Expenditure: Monthly updates (with ~2 month lag)
- Procurement: Daily updates from e-GP

### Integration Complexity
- **Level:** Medium
- Requires API key registration
- Limited documentation available
- May need to experiment with parameters

### Priority for Yala
- **MEDIUM** - Important for fiscal transparency and budget monitoring

### Practical Integration Notes
- The portal allows filtering by province to extract Yala-specific spending
- Dashboard interface available for visual exploration
- API responses in JSON format
- Can track specific agencies operating in Yala

---

## 10. e-GP Procurement

### Source Name
Electronic Government Procurement (e-GP) System

### URL
- Portal: https://www.gprocurement.go.th/
- CGD Website: https://www.cgd.go.th/
- Open Data API: Available via data.go.th / opend.data.go.th

### API Endpoint
- Procurement data is published through the CGDContract API on data.go.th
- RSS feeds available for tender announcements
- Apify actor for scraping: https://apify.com/artisan27/thai-egp-procurement

### Authentication
- **Basic Access:** Public for tender announcements
- **API Access:** Requires data.go.th API key
- **e-GP System Login:** Required for detailed bid information

### How to Extract Yala Municipality Procurement Data
1. Use `package_search` on data.go.th with keywords "e-GP Yala" or "procurement Yala"
2. Access CGDContract dataset via opend.data.go.th API
3. Filter by agency: Yala City Municipality
4. Data includes: Tender announcements, contract awards, vendor information

### Data Available
- Tender announcements
- Bid results
- Contract awards
- Vendor/supplier database
- Procurement method distribution
- Historical procurement data

### Update Frequency
- Real-time for tender announcements
- Daily for bid results
- Monthly for contract awards summary

### Integration Complexity
- **Level:** Medium
- Data is accessible via data.go.th API
- May require combining multiple datasets
- Vendor information available through linked DBD data

### Priority for Yala
- **MEDIUM** - Important for procurement transparency and vendor management

### Practical Integration Notes
- e-GP data can be linked with DBD DataWarehouse for vendor verification
- Procurement trends can inform municipal budget planning
- CGDContract dataset provides structured procurement data

---

## 11. DBD DataWarehouse

### Source Name
Department of Business Development (DBD) Data Warehouse / Open Data

### URL
- DataWarehouse: https://datawarehouse.dbd.go.th/
- Open Data Portal: https://opendata.dbd.go.th/
- API: https://opendata.dbd.go.th/th/api/3/action/

### API Endpoint (CKAN-based)

| Endpoint | Description |
|----------|-------------|
| `https://opendata.dbd.go.th/th/api/3/action/datastore_search` | Query business data |
| `https://opendata.dbd.go.th/th/api/3/action/package_list` | List datasets |

### Authentication
- **DataWarehouse:** Public access for basic search
- **API:** CKAN API key may be required
- **BDEX (Business Data Exchange):** For government agencies, via DGA/GDX

### How to Query Business Data for Yala
1. **Via DataWarehouse web interface:** Search by province = Yala
   - Juristic person registrations
   - Financial statements (balance sheet, P&L)
   - Director/shareholder information
   - Foreign investment data
2. **Via Open Data API:** Query registered datasets
3. **Via BDEX:** For government-to-government data exchange

### Data Available
- Juristic person registrations (companies, partnerships)
- Financial statements (up to 9 years historical)
- Directors and authorized signatories
- Shareholder structure
- Foreign investment by nationality
- Business type classification
- Provincial distribution of registered businesses

### Update Frequency
- Registration data: Real-time
- Financial statements: Annual (filing deadline-based)
- Open datasets: Monthly/Quarterly

### Integration Complexity
- **Level:** Medium
- Web interface is user-friendly
- API requires CKAN knowledge
- BDEX requires government agency authorization

### Priority for Yala
- **MEDIUM** - Useful for economic development and business regulation

### Practical Integration Notes
- DBD DataWarehouse is FREE for public access
- Can identify business trends in Yala for economic planning
- Foreign investment data useful for investment promotion
- Financial health indicators for municipal vendors
- BDEX connects 155+ government agencies for business data sharing

---

## 12. Open Law Data

### Source Name
Thailand Open Law Data

### URL
- Council of State: https://www.krisdika.go.th/
- Royal Gazette: https://ratchakitcha.soc.go.th/
- Open Government Data (laws): Search on data.go.th for "law" + "regulation" + "municipal"

### API Access
- No unified API identified for comprehensive law data
- Council of State provides searchable database
- Royal Gazette publishes official legal announcements
- Some datasets available via data.go.th

### How to Query Municipal-Relevant Laws
1. Search data.go.th: `q=เทศบัญญัติ municipality OR q=พระราชบัญญัติ municipal`
2. Search Krisdika.go.th for: Municipal Act, Local Administration Act, etc.
3. Key laws for municipalities:
   - Local Administration Act B.E. 2542 (1999)
   - Municipality Act B.E. 2496 (1953) and amendments
   - Public Health Act B.E. 2535 (1992)
   - Urban Planning Act B.E. 2562 (2019)
   - Digital Government-related laws

### Data Available
- Municipal ordinances (เทศบัญญัติ)
- National laws affecting local administration
- Royal decrees and ministerial regulations
- Court decisions relevant to municipal governance

### Update Frequency
- Continuous as new legislation is enacted
- Royal Gazette publishes new laws within days

### Integration Complexity
- **Level:** Medium-High
- No single API for all legal data
- Multiple sources must be combined
- Legal text often in Thai only

### Priority for Yala
- **LOW-MEDIUM** - Important for legal compliance but lower technical integration priority

### Practical Integration Notes
- Legal data integration should focus on compliance tracking
- Key municipal laws can be manually catalogued
- Consider RSS feeds from Royal Gazette for new law alerts
- PDPA compliance is the most urgent legal requirement

---

## 13. NDID Integration

### Source Name
National Digital ID (NDID) Platform

### URL
- Main: https://ndid.co.th/
- Developer Docs: https://ndidplatform.github.io/docs/introduction
- DGA Digital ID: https://www.dga.or.th/en/our-services/digital-platform-services/digitalid/

### Overview
NDID is a blockchain-based (Tendermint) federated digital identity platform that enables citizens to authenticate themselves across services without re-registering. It connects Identity Providers (banks), Relying Parties (service providers), and Authoritative Sources.

### Can Yala Municipality Use NDID?

**YES - Two pathways:**

1. **Via DGA Digital ID System (Recommended for Municipalities):**
   - DGA acts as the ID Provider intermediary
   - Municipality integrates with DGA Digital ID (not directly with NDID)
   - Supports authentication methods: DGA Verification, D.DOPA app, NDID
   - Contact: contact@dga.or.th, 02-612-6060

2. **Direct NDID Integration (Complex):**
   - Municipality registers as a Relying Party (RP)
   - Requires technical integration with NDID platform
   - More suitable for financial or high-security services
   - Contact: NDID Co., Ltd.

### Authentication Flow
```
1. Citizen requests municipal service
2. Municipality (RP) redirects to DGA Digital ID
3. Citizen chooses authentication method (ThaiD, D.DOPA, or NDID)
4. Identity Provider verifies identity
5. Verification result + basic info returned to municipality
6. Citizen receives Authenticator Account for future services
```

### Data Available After Authentication
- Verified name and surname
- Identity assurance level (IAL)
- 13-digit citizen ID (with consent)
- Address information (with consent)

### Cost
- DGA Digital ID: Government pricing (typically free for government agencies)
- NDID: Varies by Identity Provider

### Integration Complexity
- **Level:** Medium-High
- DGA provides integration support
- Must implement OAuth 2.0 / OpenID Connect
- PDPA compliance required

### Priority for Yala
- **MEDIUM-HIGH** - Important for citizen-facing digital services

### Practical Integration Notes
- DGA Digital ID is the recommended entry point for municipalities
- The system provides Single Account capability (citizens don't need to re-register)
- IAL 2.2+ required for sensitive transactions
- ThaiD app is the most user-friendly authentication method for citizens
- DGA Smart Kiosks available at some government offices for face-to-face verification

---

## 14. DGA Data Exchange (GDX)

### Source Name
Government Data Exchange (GDX) - ศูนย์แลกเปลี่ยนข้อมูลกลาง

### URL
- Portal: https://gdx.dga.or.th/
- API: https://api.egov.go.th/
- Developer: https://dev.egov.go.th/
- DGA Services: https://www.dga.or.th/our-services/digital-platform-services/gdx/

### Access Methods

**Two integration modes:**

1. **Ready-to-Use (สำเร็จรูป):**
   - Web-based access via https://dga.or.th
   - No development required
   - For instant document verification (replacement for physical copies)
   - Suitable for: Small municipalities, quick deployment

2. **API Integration:**
   - Full API access via https://api.egov.go.th/
   - Custom development required
   - Flexible data integration into municipal systems
   - Suitable for: Yala Municipality dashboard integration

### How Yala Can Participate

**Registration Steps:**
1. Register at https://www.dga.or.th/
2. Create account with GovID (for government officials) or OpenID
3. Submit agency details (Yala City Municipality)
4. Wait for email approval
5. Request API access for specific datasets
6. Sign MOU/data sharing agreement

### Available Data Sources via GDX
- **DOPA** - Population registration, address verification
- **DBD** - Business registration, corporate data
- **Department of Cooperative Promotion** - Cooperative data
- **7+ agencies** providing data via GDX
- **194 agencies** connected to the platform
- **35.3 million** data linkages processed in FY2021

### Authentication
- **Consumer-Key & ConsumerSecret:** Issued by DGA
- **Token-based:** 60-minute session tokens
- **GovID:** Government officer digital ID
- **IP Whitelisting:** Required

### Integration Complexity
- **Level:** Medium-High
- Requires government agency registration
- MOU signing may take 1-3 months
- API development requires technical expertise
- Full documentation and sample code available

### Priority for Yala
- **HIGH** - Gateway to accessing all inter-agency government data

### Practical Integration Notes
- GDX enables the "Once-Only Principle" - citizens provide data once
- Yala Municipality should register as both a data consumer and provider
- Data available includes: citizen profiles, business data, legal entity verification
- Laser Code API available for identity verification
- Technical support: contact@dga.or.th or 02-612-6060
- Source code examples in C#, Java, PHP, Python

---

## 15. Authentication Requirements

### Summary of Authentication Methods Across All Systems

| System | Auth Method | Registration | Complexity |
|--------|------------|--------------|------------|
| data.go.th | API Key (optional) | Self-registration | Low |
| GD Catalog | OAuth2 + CKAN Key | Agency request | Medium |
| NSO StatHub | None (public) | N/A | Low |
| TPMAP | Web access (no API key) | N/A | Low |
| DOPA API | OAuth 2.0 + Consumer Key | DGA registration | High |
| DEPA CityData | CKAN API Key | Platform registration | Low |
| GovSpending | API Token (data.go.th) | Self-registration | Low |
| e-GP | data.go.th API Key | Self-registration | Low |
| DBD OpenData | CKAN API Key | Self-registration | Low |
| GDX | OAuth 2.0 + Consumer Key | DGA GovID/OpenID | High |
| NDID | OpenID Connect | Via DGA | Medium-High |

### What Yala Municipality Needs

**Immediate Setup (Priority 1):**
1. **data.go.th API Key** - Register at https://opendata.data.go.th/
2. **DEPA CityData API Key** - Via existing Yala portal
3. **GovSpending API Token** - Via https://api.data.go.th/

**Medium-term Setup (Priority 2):**
4. **DGA GovID Account** - For GDX and DOPA API access
5. **DOPA Consumer-Key/Secret** - Apply via dev.egov.go.th
6. **GDX Registration** - For inter-agency data exchange

**Authentication Standards Summary:**
- **ThaiD:** Mobile app-based authentication (DOPA) - highest assurance for citizens
- **OpenID:** Supported by DGA for government service login
- **OAuth 2.0:** Standard for API access to all DGA-managed systems
- **GovID:** Government officer identity verification system

### Practical Steps for Yala Municipality
1. Designate an IT officer as API administrator
2. Register for data.go.th API key (immediate)
3. Apply for DGA GovID accounts for authorized staff
4. Submit GDX API access request for DOPA and DBD data
5. Implement OAuth 2.0 client in municipal dashboard
6. Set up IP whitelisting for production servers

---

## 16. Dataset Quality Assessment

### Known Issues with Thai Open Data

Based on research from ODI (Open Data Institute), World Bank DDIR reports, and academic studies:

**1. Data Completeness**
- Many datasets have missing fields or incomplete records
- Provincial-level data often less complete than national aggregates
- Small municipalities may not have capacity to publish all data
- Some agencies publish data only for Bangkok/metropolitan areas

**2. Data Timeliness**
- Inconsistent update schedules across agencies
- Some datasets 2-3 years out of date
- Real-time data is rare; most data is historical/annual
- No formal enforcement mechanism for timely updates

**3. Data Accuracy**
- Variations in data quality across agencies
- Some datasets published in PDF/image format (not machine-readable)
- Metadata often incomplete or missing
- Lack of standardized data validation at submission

**4. Data Format Issues**
- Mixed formats: Excel, CSV, PDF, Word documents
- Inconsistent encoding (Thai character encoding issues)
- Not all datasets follow the Thai Open Government Data Standard
- API availability varies significantly

**5. Accessibility Barriers**
- Some portals require registration (not truly open)
- Thai language only for many datasets
- Limited documentation and user guides
- Low data literacy among government officials

**6. PDPA Impact**
- Some agencies hesitant to publish data due to PDPA concerns
- Misunderstanding about compatibility of open data and data protection
- Sensitive data classification unclear
- Need for clearer guidance on anonymization

### Quality Improvement Recommendations for Yala

1. **Implement data validation** when ingesting external data
2. **Cross-reference multiple sources** for critical metrics
3. **Document data lineage** - track where each dataset comes from
4. **Establish refresh schedules** based on source update frequency
5. **Flag data quality issues** in the dashboard for users
6. **Start with high-confidence datasets** (DEPA CityData, NSO, DOPA)
7. **Build relationships** with Yala NSO office for data quality assurance

### Most Reliable Data Sources (Highest Quality)
1. **NSO StatHub** - Authoritative statistics with SDMX standardization
2. **DEPA CityData** - Municipality-published, locally verified
3. **DOPA API** - Real-time, authoritative population data
4. **DBD DataWarehouse** - Verified business registration data
5. **TPMAP** - Peer-reviewed poverty mapping methodology

---

## 17. Quick Reference Summary Table

| # | Source | URL | API | Auth | Data for Yala | Update | Complexity | Priority |
|---|--------|-----|-----|------|---------------|--------|------------|----------|
| 1 | **data.go.th** | data.go.th | CKAN REST | API Key (opt) | 11,000+ datasets, search by keyword | Varies | Low-Med | **HIGH** |
| 2 | **GD Catalog** | gdcatalog.go.th | CKAN + OAuth2 | OAuth2 + Key | 156 agency catalogs | Daily/Weekly | Medium | **MED** |
| 3 | **NSO Yala Office** | yala.nso.go.th | Contact-based | None (direct) | Provincial statistics, surveys | Annual | Medium | **HIGH** |
| 4 | **NSO StatHub** | stathub.nso.go.th | SDMX 2.1 | None (public) | Time-series stats for Yala | Annual | High | **HIGH** |
| 5 | **TPMAP** | tpmap.in.th | Web dashboard | None | Poverty mapping, MPI | Annual | Low-Med | **HIGH** |
| 6 | **DOPA API** | api.egov.go.th | REST (OAuth2) | Consumer Key + Secret | Citizen ID verification | Real-time | High | **HIGH** |
| 7 | **DEPA CityData** | citydata.in.th/yala | CKAN Data API | API Key | 15+ Yala datasets | Varies | **LOW** | **HIGHEST** |
| 8 | **GovSpending** | govspending.data.go.th | REST | API Token | Budget/expenditure for Yala | Monthly | Medium | **MED** |
| 9 | **e-GP** | gprocurement.go.th | Via data.go.th | API Key | Procurement, contracts | Daily | Medium | **MED** |
| 10 | **DBD DataWarehouse** | datawarehouse.dbd.go.th | CKAN REST | API Key | Business data for Yala | Real-time | Medium | **MED** |
| 11 | **Open Law Data** | krisdika.go.th | Limited | None | Municipal laws | Continuous | High | **LOW-MED** |
| 12 | **NDID** | ndid.co.th | OpenID Connect | Via DGA | Citizen authentication | Real-time | Med-High | **MED-HIGH** |
| 13 | **GDX** | gdx.dga.or.th | REST (OAuth2) | Consumer Key + Secret | Inter-agency data | Real-time | Med-High | **HIGH** |
| 14 | **DGA Digital ID** | dga.or.th | REST | GovID/OpenID | Identity verification | Real-time | Medium | **MED-HIGH** |
| 15 | **api.data.go.th** | api.data.go.th | REST | User Token | Multiple government datasets | Varies | Low-Med | **HIGH** |

---

## Appendix A: Implementation Roadmap for Yala Municipality

### Phase 1: Foundation (Weeks 1-4)
- [ ] Register for data.go.th API key
- [ ] Document all existing datasets on citydata.in.th/yala-city-municipality
- [ ] Set up CKAN API integration for DEPA CityData
- [ ] Contact Yala NSO Provincial Office (073-212-703) for data partnership

### Phase 2: Core Data Integration (Weeks 5-12)
- [ ] Integrate DOPA API for citizen verification (apply via dev.egov.go.th)
- [ ] Connect to NSO StatHub SDMX for provincial statistics
- [ ] Download and integrate TPMAP poverty data
- [ ] Set up GovSpending API for budget tracking
- [ ] Register for GDX access (dga.or.th)

### Phase 3: Advanced Integration (Weeks 13-24)
- [ ] Implement NDID/DGA Digital ID for citizen authentication
- [ ] Integrate DBD business data for economic development
- [ ] Connect e-GP procurement data
- [ ] Set up automated data refresh pipelines
- [ ] Implement data quality monitoring

### Phase 4: Optimization (Ongoing)
- [ ] Publish Yala Municipality data back to data.go.th
- [ ] Contribute to DEPA CityData best practices
- [ ] Engage with Smart City network for peer learning
- [ ] Continuous data quality improvement

---

## Appendix B: Key Contacts

| Organization | Contact | Purpose |
|-------------|---------|---------|
| DGA Contact Center | 02-612-6060, contact@dga.or.th | GDX, API registration, Digital ID |
| Yala NSO Office | 073-212-703, yala.nso.go.th | Provincial statistics |
| NSO Central | 0 2141 7500, services@nso.go.th | National statistics, data requests |
| DEPA | 0-2026-2333 ext. 1068, [email protected] | CityData platform support |
| NECTEC | 02-564-6900 ext. 2330-2340 | TPMAP support |
| DOPA/BORA | Via DGA | Population registration API |
| NDID | ndid.co.th | Digital identity platform |

---

## Appendix C: References

1. DGA. (2024). Open Government Data of Thailand. https://data.go.th/
2. DGA. (2024). Government Data Exchange (GDX). https://gdx.dga.or.th/
3. DGA. (2024). Digital ID Verification System. https://www.dga.or.th/digitalid/
4. NSO. (2024). Statistics Sharing Hub (StatHub). https://stathub.nso.go.th/
5. NESDB/NECTEC. (2024). TPMAP. https://www.tpmap.in.th/
6. DEPA. (2024). CityData Platform. https://www.citydata.in.th/
7. DBD. (2024). DataWarehouse. https://datawarehouse.dbd.go.th/
8. NDID. (2024). National Digital ID Platform. https://ndid.co.th/
9. ODI. (2024). Empowering Thailand's Digital Government with Open Data.
10. World Bank. (2025). Thailand Digital Data Infrastructure Roadmap Report.
11. OECD. (2022). Open and Connected Government Review of Thailand.
12. ILO. (2024). Promoting Youth Employment in Songkhla and Yala.
13. GDH Help Page. (2024). CKAN Data APIs. https://gdhelppage.gdcatalog.go.th/
14. DGA Developer Portal. https://dev.egov.go.th/
15. Open Government Thailand API. https://opendata.data.go.th/pages/data-go-th-api

---

*Report compiled from 25+ web searches across government portals, developer documentation, academic papers, and international organization reports. All URLs verified as of research date.*
