# Dimension 05: Security, Conflict & Rule of Law Data for Yala Province

## Research Date: July 2025
### Classification: CRITICAL AND SENSITIVE

---

## Executive Summary

This document catalogs data sources for security, conflict, and rule of law information specific to Yala Province in Thailand's Southern Border Provinces (SBPs). The conflict since January 2004 has resulted in **22,495+ security incidents** (as of April 2024), **7,594 deaths**, and **14,122 injuries** across the Deep South. Yala accounts for approximately **28% of total incidents** in the conflict zone. This dimension is flagged as **CRITICAL AND SENSITIVE** due to the politically charged nature of conflict data, the ongoing peace dialogue process, and potential security risks from data misuse.

**Key Statistics:**
- Total incidents (Jan 2004 - Apr 2024): 22,495 (Deep South Watch)
- Total deaths: 7,594; Total injuries: 14,122 (Deep South Watch)
- Yala's share: ~28% of all incidents (Narathiwat 36%, Pattani 33%, Yala 28%)
- Emergency Decree extensions: 77th extension as of July 2024
- SBPAC KEADILAN (Justice) Centers: 326 offices across SBPs

---

## Table of Contents

1. [Deep South Watch (DSW) - Primary Conflict Data Source](#1-deep-south-watch-dsw)
2. [DSW Monthly Reports](#2-dsw-monthly-reports)
3. [DSW-PBP (Public Budget Database)](#3-dsw-pbp)
4. [DSW-POP (Public Opinion Database)](#4-dsw-pop)
5. [DSW-SEP (Socio-Economic Database)](#5-dsw-sep)
6. [ACLED - Armed Conflict Location & Event Data](#6-acled)
7. [UCDP - Uppsala Conflict Data Program](#7-ucdp)
8. [SBPAC Data Access](#8-sbpac-data)
9. [SBPAC KEADILAN Justice Centers](#9-sbpac-keadilan)
10. [Crime Statistics - Royal Thai Police](#10-crime-statistics)
11. [Justice Statistics](#11-justice-statistics)
12. [Emergency Call Center 191](#12-emergency-call-center)
13. [Traffy Fondue](#13-traffy-fondue)
14. [National Human Rights Commission](#14-nhrc)
15. [Responsible Data Use Frameworks](#15-responsible-data-use)
16. [Dashboard Integration Considerations](#16-dashboard-integration)

---

## 1. Deep South Watch (DSW) - Primary Conflict Data Source

| Attribute | Details |
|-----------|---------|
| **Data Type** | Conflict Incident Database (CID/DSID) |
| **Source** | Deep South Watch (DSW) / Center for Conflict Studies and Cultural Diversity (CSCD), Prince of Songkla University, Pattani Campus |
| **URL** | https://deepsouthwatch.org (main site); https://dswdatabase.info (database portal - currently intermittent) |
| **Geographic Granularity** | Village-level (Village ID, Sub-district, District, Province) with GIS coordinates |
| **Temporal Coverage** | January 2004 - present (15,000+ geocoded incidents) |
| **Access Method** | Registration + partnership agreement for full database; monthly summary reports are public |
| **Restrictions** | Full CID database access requires institutional partnership and data use agreement |
| **Sensitivity Level** | **HIGH** - Individual incident records with location data |
| **Recommended Dashboard Use** | Aggregated trends only; never display individual incident coordinates |

### Description
DSW is the primary authoritative source for conflict incident data in Thailand's Deep South. The Deep South Incident Database (DSID) was originally developed at Prince of Songkla University, Pattani in March 2004. Since 2014, DSW/CSCD has collaborated with the World Bank and The Asia Foundation to strengthen the database (DSID 2.0), which required recoding approximately 15,000 incidents.

### Database Structure (CID - Conflict Incident Dataset)
The database comprises three major components:
- **Incidents**: Date, time, location (Province/District/Sub-district/Village/Military GIS/Civilian GIS), type of violence, cause, weapon used
- **Perpetrators**: Actor information, one-sided or two-sided
- **Victims**: Human impact (deaths/injuries by religious background, occupation, age, gender)

### Access Process for Full CID Database

**Step 1: Initial Contact**
- Contact DSW via email: dsw.data@gmail.com
- Tel/Fax: 073-312-302 (Pattani office)
- Address: Center for Conflict Studies and Cultural Diversity, Prince of Songkla University, Pattani Campus

**Step 2: Partnership Requirements**
- Academic/research institution affiliation required
- Purpose of research must be stated
- Data use agreement must be signed
- Institutional endorsement letter recommended

**Step 3: Data Use Agreement Terms**
- Data cannot be redistributed without permission
- Raw data cannot be published in identifiable form
- Acknowledgment of DSW/CSCD required in all outputs
- Findings must be shared with DSW

**Step 4: Access Methods**
- Web portal: dswdatabase.info (login credentials provided after approval)
- Monthly summary reports available publicly at: https://deepsouthwatch.org/en/node
- API access may be available for institutional partners

### Codebook Access
The CID Codebook (Version 5) is publicly available:
- English: https://deepsouthwatch.org/sites/default/files/2025/codebook/CID_Codebook-5-eng.pdf
- Thai: https://deepsouthwatch.org/sites/default/files/2025/codebook/CID_Codebook-5-thai.pdf

### Monthly Summary Statistics
Monthly reports include:
- Number of incidents by type (shooting, bombing, assault, sabotage)
- Deaths and injuries by religion (Buddhist/Muslim)
- Deaths and injuries by occupation (teacher, soldier, police, civilian, etc.)
- Hard target vs. soft target breakdown
- Cause analysis (separatism, drug-related, unclear)
- Trend data (monthly comparisons)

---

## 2. DSW Monthly Reports

| Attribute | Details |
|-----------|---------|
| **Data Type** | Monthly summary statistics of incidents |
| **Source** | Deep South Watch |
| **URL** | https://deepsouthwatch.org/en/node (English summaries) |
| **Geographic Granularity** | Provincial level (Pattani, Yala, Narathiwat, 4 districts of Songkhla) |
| **Temporal Coverage** | Monthly since January 2004 |
| **Access Method** | Public download (PDF format) |
| **Restrictions** | None for summary reports; full granular data requires partnership |
| **Sensitivity Level** | **LOW-MEDIUM** - Aggregated data |
| **Recommended Dashboard Use** | Monthly trend lines, year-over-year comparisons |

### Report Content
Each monthly report includes:
- Total incidents for the month
- Deaths and injuries breakdown
- Incident type distribution (shooting, bombing, assault, sabotage)
- Victim demographics (religion, age, gender)
- Target type (hard/soft)
- Causal categorization (separatism, drug-related, unclear, crime)

### Automation Feasibility
Monthly reports are published by the 5th of the following month. They are available as downloadable PDFs. For automated collection:
- **Method**: Web scraping of the deepsouthwatch.org/en/node listing page
- **Format**: PDF downloads
- **Schedule**: Check on the 5th of each month
- **Historical archive**: Reports dating back to 2017 are available on the website

### Key URL Pattern
```
https://deepsouthwatch.org/en/node?page={page_number}
```
Monthly summary reports are tagged and downloadable from the node listing.

---

## 3. DSW-PBP (Public Budget Database)

| Attribute | Details |
|-----------|---------|
| **Data Type** | Government budget and projects database |
| **Source** | Deep South Watch |
| **URL** | Codebook: https://deepsouthwatch.org/sites/default/files/2025/codebook/PBP-Codebook-3.pdf |
| **Geographic Granularity** | Provincial/District level |
| **Temporal Coverage** | Multi-year (specific period in codebook) |
| **Access Method** | Part of DSW database system; requires partnership |
| **Restrictions** | Same as CID database |
| **Sensitivity Level** | **MEDIUM** - Government spending data |
| **Recommended Dashboard Use** | Budget allocation comparisons, development spending trends |

### Description
DSW-PBP tracks government budgets and projects related to the Southern Border Provinces. It records budget allocations, disbursements, and project implementation at the provincial and district levels.

### Data Elements
- Budget allocations by ministry/agency
- Project-level data
- Geographic distribution of spending
- Temporal trends in budget allocation

### Access
Full access requires the same partnership process as the CID database. Contact DSW directly for specific PBP data requests related to Yala province.

---

## 4. DSW-POP (Public Opinion Database)

| Attribute | Details |
|-----------|---------|
| **Data Type** | Public opinion and participation survey data |
| **Source** | Deep South Watch |
| **URL** | Codebook: https://deepsouthwatch.org/sites/default/files/2025/codebook/POP-Codebook-3.pdf |
| **Geographic Granularity** | Sub-district/District level |
| **Temporal Coverage** | Multiple survey rounds |
| **Access Method** | Part of DSW database system; requires partnership |
| **Restrictions** | Survey microdata may have additional restrictions |
| **Sensitivity Level** | **MEDIUM-HIGH** - Individual survey responses |
| **Recommended Dashboard Use** | Aggregated sentiment indicators, participation rates |

### Description
DSW-POP collects public opinion and civic participation data in the Southern Border Provinces. Surveys cover attitudes toward governance, peace process, security, and daily life concerns.

### Survey Topics Include
- Attitudes toward peace dialogue
- Trust in government institutions
- Experience with violence
- Human rights perceptions
- Local governance preferences
- Identity and belonging

### Access
Contact DSW directly for access to POP data. Public reports based on POP data may be available in DSW publications.

---

## 5. DSW-SEP (Socio-Economic Database)

| Attribute | Details |
|-----------|---------|
| **Data Type** | Socio-economic, education, and population indicators |
| **Source** | Deep South Watch |
| **URL** | Codebook: https://deepsouthwatch.org/sites/default/files/2025/codebook/SEP-Codebook-3.pdf |
| **Geographic Granularity** | District/Sub-district level |
| **Temporal Coverage** | Multi-year time series |
| **Access Method** | Part of DSW database system; requires partnership |
| **Restrictions** | Same as other DSW databases |
| **Sensitivity Level** | **LOW-MEDIUM** - Secondary data compilation |
| **Recommended Dashboard Use** | Development indicators, comparative analysis with security data |

### Description
DSW-SEP compiles socio-economic, education, and population data for the Southern Border Provinces, drawn from official government statistics and other sources.

### Data Elements
- Population demographics
- Educational attainment and enrollment
- Economic indicators (income, employment)
- Poverty indicators
- Health statistics
- Infrastructure data

---

## 6. ACLED - Armed Conflict Location & Event Data Project

| Attribute | Details |
|-----------|---------|
| **Data Type** | Georeferenced political violence and protest events |
| **Source** | ACLED (Raleigh, NC-based non-profit) |
| **URL** | https://acleddata.com |
| **Geographic Granularity** | Event-level with lat/long coordinates (precision codes 1-3) |
| **Temporal Coverage** | Thailand: 1997-present (real-time, weekly updates) |
| **Access Method** | Free registration required; API key provided |
| **Restrictions** | Terms of Use & Attribution Policy must be followed |
| **Sensitivity Level** | **MEDIUM** - Event-level data but aggregated presentation |
| **Recommended Dashboard Use** | Event counts, fatality trends, actor-type analysis |

### Access Process

**Step 1: Register**
- Visit https://developer.acleddata.com/
- Create account with email, organization, and intended use description
- Verify email address

**Step 2: Generate API Key**
- Login to dashboard
- Click "Add New Key"
- Copy and securely store the key (shown only once)

**Step 3: Access Data**
- **Data Export Tool**: https://acleddata.com/data-export-tool/
- **Curated Data Files**: Regional and country-specific downloads
- **API**: https://acleddata.com/api/acled/
- **R Package**: `acled.api` on CRAN

### API Query Parameters for Thailand
```
Base URL: https://acleddata.com/api/acled/read?format=json
Parameters:
- key={api_key}
- email={registered_email}
- iso=764 (Thailand ISO code)
- admin1=Yala (province filter)
- event_date={yyyy-mm-dd} or range
- event_type={type}
```

### Key ACLED Thailand Details
- **Region code**: Southeast Asia (9)
- **Country**: Thailand
- **ISO**: 764
- **Sources**: Bangkok Post, The Nation, Khaosod English, local media
- **Event types**: Battles, Protests, Riots, Explosions/Remote Violence, Violence against Civilians, Strategic Developments
- **Sub-event types**: 25 categories (e.g., armed clash, peaceful protest, remote explosive/IED, abduction)
- **Actor types**: State Forces, Rebel Forces, Militia Groups, Communal/Identity Groups, Rioters, Protesters, Civilians, Foreign/Others
- **Note**: ACLED coverage for Thailand relies mainly on English-language national newspapers. This is acknowledged as a limitation compared to DSW's local-language monitoring.

### R Code Example
```r
library(acled.api)
data <- acled.api(
  email.address = Sys.getenv("ACLED_EMAIL"),
  access.key = Sys.getenv("ACLED_KEY"),
  country = "Thailand",
  start.date = "2024-01-01",
  end.date = "2024-12-31"
)
```

---

## 7. UCDP - Uppsala Conflict Data Program

| Attribute | Details |
|-----------|---------|
| **Data Type** | Georeferenced event dataset (GED) for organized violence |
| **Source** | Uppsala Conflict Data Program, Uppsala University |
| **URL** | https://ucdp.uu.se/downloads/ |
| **Geographic Granularity** | Event-level with coordinates |
| **Temporal Coverage** | Thailand: 1989-present (State-based conflict); Non-state: varies |
| **Access Method** | Free download, no registration required |
| **Restrictions** | CC BY 4.0 license; citation required |
| **Sensitivity Level** | **MEDIUM** - Event-level conflict data |
| **Recommended Dashboard Use** | Year-over-year conflict trends, fatality comparisons |

### Access Process
1. Visit https://ucdp.uu.se/downloads/
2. Select UCDP Georeferenced Event Dataset (GED)
3. Download in preferred format: CSV, Excel, R Data Frame, or STATA
4. No registration required

### API Access
- RESTful API available at https://ucdp.uu.se/apidocs/
- Machine-to-machine communication supported
- Filter and subset data on UCDP servers

### Thailand Coverage
- **State-based conflict**: Thailand-Malay Muslim separatist conflict
- **Event types**: State-based armed conflict, non-state conflict, one-sided violence
- **Fatality threshold**: Minimum 1 direct death per event
- **Sources**: Global newswires (AP, BBC, Reuters), Bangkok Post, The Nation
- **Note**: UCDP captures significantly fewer events than DSW due to reliance on international/national English-language sources vs. DSW's local Thai/Malay-Jawi monitoring

### Key Datasets Available
- UCDP GED (Georeferenced Event Dataset) - Version 25.1
- UCDP/PRIO Armed Conflict Dataset (country-year, 1946-present)
- UCDP Candidate Events Dataset (monthly updates)
- UCDP Actor Dataset

### Comparative Note
According to Asia Foundation research (2016), DSW's DSID captures significantly more events than UCDP-GED for Thailand's Deep South due to:
- DSW uses local Thai and Malay-Jawi language sources
- UCDP relies primarily on English-language international/national media
- DSW monitors all physical violence; UCDP focuses on organized political violence
- For Thailand 2014, UCDP used only 5 English-language sources (AP, BBC, Reuters, Bangkok Post, The Nation)

---

## 8. SBPAC Data Access

| Attribute | Details |
|-----------|---------|
| **Data Type** | SBPAC development indicators, budget, complaints, CSO data |
| **Source** | Southern Border Provinces Administration Center (SBPAC) |
| **URL** | Main: https://www.sbpac.go.th/; Data Catalog: https://catalog.sbpac.go.th/ |
| **Geographic Granularity** | Provincial, District, Sub-district |
| **Temporal Coverage** | Varies by dataset; multi-year |
| **Access Method** | Open Data portal with JSON API; some datasets require login |
| **Restrictions** | Open Data Common license for most datasets |
| **Sensitivity Level** | **LOW-MEDIUM** - Administrative data |
| **Recommended Dashboard Use** | Budget data, complaint statistics, CSO activity indicators |

### Data Catalog Content
The SBPAC Data Catalog (https://catalog.sbpac.go.th/) hosts **24 datasets** organized into:

1. **Relief/Compensation Data** (12 datasets)
   - Compensation budget for unrest incidents
   - Assistance by type (death, injury, disability, property damage)
   - Annual budget data

2. **Complaints & Justice** (3 datasets)
   - Complaint statistics by district
   - Complaint types and resolution rates
   - Access channels (in-person, hotline 1880, mail, web, Facebook)

3. **Hajj Pilgrimage** (7 datasets)
   - Selection data for Hajj pilgrims

4. **Civil Society Organizations** (2 datasets)
   - CSOs receiving SBPAC budget support
   - Budget allocation by province

### Open Data API
- **Format**: JSON
- **Datasets**: Available via API endpoints
- **Registration**: Not required for public datasets
- **License**: Open Data Common

### SBPAC Website Data
The main SBPAC website (www.sbpac.go.th) publishes:
- Annual budget execution reports
- Procurement summaries (monthly and annual)
- Staffing and HR data
- Service statistics

### Key Yala Office Contact
- Address: 60 Sukhyang Road, Sateng Sub-district, Mueang District, Yala 95000
- Tel: 0-7320-3872 or 1880 hotline
- Email: saraban@sbpac.go.th

---

## 9. SBPAC KEADILAN (Justice) Centers - Complaint Data

| Attribute | Details |
|-----------|---------|
| **Data Type** | Citizen complaints, grievances, justice requests |
| **Source** | SBPAC Complaint and Justice Center |
| **URL** | Data Catalog: https://catalog.sbpac.go.th/dataset/srt_01_01 |
| **API URL** | https://opendata.sbpac.go.th/API/SRT_01_01.aspx |
| **Geographic Granularity** | District level |
| **Temporal Coverage** | Real-time updates (historical from 2022) |
| **Access Method** | Open Data JSON API + data catalog download |
| **Restrictions** | Open Data Common license |
| **Sensitivity Level** | **MEDIUM** - Individual complaint records aggregated |
| **Recommended Dashboard Use** | Complaint volumes by type and district, resolution rates |

### Dataset: "Number of Complaints and Justice Administration in SBPs"

**Primary Dataset (srt_01_01)**
- Total views: 7,021
- Format: JSON
- API: https://opendata.sbpac.go.th/API/SRT_01_01.aspx
- Update frequency: Real-time
- Geographic scope: District-level

**Secondary Dataset (srt_02_01)**
- Resolved/closed complaints
- 4,827 views
- Shows complaints that SBPAC has investigated and coordinated resolution

**Complaint Form Dataset (srt_01_02)**
- Form template for complainants
- PDF format
- 5,799 views

### Complaint Categories
1. Request for assistance (ขอความช่วยเหลือ)
2. Request for justice (ขอความเป็นธรรม)
3. Complaint about government official behavior (ร้องเรียนพฤติกรรมเจ้าหน้าที่รัฐ)
4. Tip/informant (แจ้งเบาะแส)
5. Legal consultation (ให้คำปรึกษากฎหมาย)
6. Information inquiry (สอบถามข้อมูล)

### Access Channels
- In-person at SBPAC offices
- Hotline: 1880 (SBPAC hotline "อุ่นใจ")
- Mail
- Website: www.sbpac.go.th
- Facebook Messenger

### Resolution Data
The resolved complaints dataset (srt_02_01) tracks:
- Cases where SBPAC has conducted fact-finding
- Cases coordinated with other agencies
- Cases resolved/closed

---

## 10. Crime Statistics - Royal Thai Police

| Attribute | Details |
|-----------|---------|
| **Data Type** | Crime statistics, traffic incidents |
| **Source** | Royal Thai Police (RTP), Provincial Police Region 9 |
| **URL** | Yala Provincial Police: https://police9.go.th/ |
| **Geographic Granularity** | Provincial/District |
| **Temporal Coverage** | Current year primarily |
| **Access Method** | Website + formal data request |
| **Restrictions** | Official government data; FOI request may be required for detailed statistics |
| **Sensitivity Level** | **MEDIUM** - Official crime data |
| **Recommended Dashboard Use** | General crime trends, traffic accident data |

### Access Points
- **Provincial Police Region 9**: https://police9.go.th/ - covers Yala, Pattani, Narathiwat, Satun, Songkhla
- **Yala Provincial Police**: Sub-site under police9.go.th
- **Mueang Yala Police Station**: https://mueangyala.yala.police.go.th/

### Traffic Statistics Available
Yala Provincial Police publishes accident statistics:
- Accident frequency by district
- Casualty numbers
- Primary causes (speeding, reckless driving)
- Monthly/quarterly summaries

### Formal Data Request Process
For detailed crime statistics:
1. Submit written request to Provincial Police Commander
2. Specify data period, geographic scope, and purpose
3. Allow 15-30 working days for response
4. Some data may be classified for security reasons

### Note on Conflict-Related Crime
Royal Thai Police statistics distinguish between:
- **Ordinary crime**: Theft, assault, traffic violations
- **Security incidents**: Conflict/insurgency-related (classified separately, may not be publicly available)

---

## 11. Justice Statistics

| Attribute | Details |
|-----------|---------|
| **Data Type** | Court cases, prison data, judicial proceedings |
| **Source** | Office of the Courts of Justice; Department of Corrections |
| **URL** | Various (see below) |
| **Geographic Granularity** | Provincial |
| **Temporal Coverage** | Annual reports |
| **Access Method** | Annual reports + formal request |
| **Restrictions** | Case-level data restricted; aggregate statistics may be available |
| **Sensitivity Level** | **MEDIUM-HIGH** - Individual case data; aggregate statistics lower |
| **Recommended Dashboard Use** | Case volume trends, disposition rates |

### Sources

**1. Office of the Courts of Justice Annual Report**
- Contains statistics on cases filed, pending, and resolved
- Some data available by province
- Access: Request from Yala Provincial Court or Office of the Courts of Justice website

**2. Department of Corrections**
- Prison population statistics available in annual reports
- Yala Central Prison data included
- Reference: FIDH Thailand Annual Prison Report 2025 (contains Yala-specific data)

**3. Department of Special Investigation (DSI)**
- Annual Report with case statistics
- URL: https://www.dsi.go.th/
- Special case categories including national security cases

### Yala-Specific Justice Issues
- **Post-mortem inquests**: Between 2003-2010, Yala Provincial Court handled 77 post-mortem inquests; relatives rarely appointed lawyers for cross-examination
- **Islamic Law**: Act on the Use of Islamic Law in Pattani, Narathiwat, Yala and Satun B.E. 2489 (1946) applies to family and inheritance matters
- **Military courts**: Cases involving security offenses may be processed through military courts under Martial Law and Emergency Decree

---

## 12. Emergency Call Center 191

| Attribute | Details |
|-----------|---------|
| **Data Type** | Emergency calls, incident reports |
| **Source** | Royal Thai Police Emergency Call Center (Ministry of Interior) |
| **URL** | No public data portal identified |
| **Geographic Granularity** | Call center jurisdiction (Provincial) |
| **Temporal Coverage** | Real-time |
| **Access Method** | Formal request to Ministry of Interior |
| **Restrictions** | **Highly restricted** - Security-sensitive data |
| **Sensitivity Level** | **HIGH** - Real-time incident response data |
| **Recommended Dashboard Use** | Aggregate call volume trends only (if accessible) |

### Description
Thailand's Emergency Call Center (191) is operated by the Royal Thai Police. All emergency calls (police, fire, medical) are routed through this system. In Yala, the emergency call center is a critical data source for both criminal and security incidents.

### Data Available
- Call volume by type (police, fire, medical)
- Response times
- Incident locations (for dispatch)
- **Note**: Detailed call data is not publicly available due to security and privacy concerns

### Access Method
- **Formal request** to Ministry of Interior, Department of Provincial Administration
- Must demonstrate official/government purpose
- Data sharing agreement required
- **Yala Provincial Office** may provide aggregate statistics upon request

### Alternative: Yala Provincial Emergency Data
- Contact Yala Provincial Hall (ศาลากลางจังหวัดยะลา)
- Provincial Disaster Prevention and Mitigation Office may have aggregated emergency data
- Annual reports may contain summary statistics

---

## 13. Traffy Fondue

| Attribute | Details |
|-----------|---------|
| **Data Type** | Citizen complaints about municipal/city problems |
| **Source** | NECTEC-NSTDA / Traffy Fondue Platform |
| **URL** | https://citydata.traffy.in.th; LINE: @traffyfondue |
| **Geographic Granularity** | GPS coordinates (sub-district level) |
| **Temporal Coverage** | Real-time |
| **Access Method** | LINE chatbot for reporting; Dashboard for officials |
| **Restrictions** | Public complaint data; official statistics upon request |
| **Sensitivity Level** | **LOW** - Municipal service complaints |
| **Recommended Dashboard Use** | Service complaint volumes, resolution times, problem type analysis |

### Platform Description
Traffy Fondue is an AI-powered municipal complaint management platform developed by NECTEC-NSTDA. Citizens report city problems via LINE (@traffyfondue) with photos and GPS coordinates. The system uses AI to classify and route complaints to responsible agencies.

### Statistics Available (from system)
- Complaint volume by type and location
- Resolution times
- Agency response rates
- Satisfaction ratings

### Open Data
- Government Data Catalog entry: "จำนวนเรื่องร้องเรียนผ่าน App Traffy Fondue"
- Available at: gdcatalog.go.th
- Formats: CSV, TSV, JSON, XML
- Data API available

### 24 Problem Categories
1. Roads/potholes (ถนน/หลุม)
2. Sidewalks (ทางเท้า)
3. Streetlights (ไฟฟ้าแสงสว่าง)
4. Water pipes (ท่อประปา)
5. Drainage/flooding (ระบายน้ำ/น้ำท่วม)
6. Garbage (ขยะ)
7. Dangerous trees (ต้นไม้อันตราย)
8. Smells (กลิ่นรบกวน)
9. Noise (เสียงรบกวน)
10. Stray animals (สัตว์จรจัด)
11. Canals/waterways (คลอง/แม่น้ำ)
12. Signs (ป้าย)
13. Fences/railings (รั้ว/ราวกั้น)
14. Illegal parking (จอดรถผิดกฎหมาย)
15. Illegal construction (สร้างลักษณะ)
16. Black smoke (ควันดำ)
17. Narcotics (ยาเสพติด)
18. Wildfire (ไฟป่า)
19. Building damage (อาคารสถานที่ชำรุด)
20. Registration/survey (ขึ้นทะเบียน/สำรวจ)
21. Health/Gold Card (สุขภาพ/บัตรทอง)
22. Corruption (ทุจริต)
23. Suggestions (เสนอแนะ)
24. Other (อื่นๆ)

### Performance Statistics (National)
- Used by 1,754+ organizations
- 96 disaster prevention offices, 577 municipalities, 459 SAOs
- Average resolution time improvement: 6.2 hours per case
- Cost savings: 78.14 million THB
- User satisfaction: 89%

---

## 14. National Human Rights Commission (NHRC)

| Attribute | Details |
|-----------|---------|
| **Data Type** | Human rights reports, complaint investigations |
| **Source** | National Human Rights Commission of Thailand (NHRCT) |
| **URL** | https://www.nhrc.or.th |
| **Geographic Granularity** | Provincial |
| **Temporal Coverage** | Annual reports and special reports |
| **Access Method** | Public reports on website |
| **Restrictions** | Public documents |
| **Sensitivity Level** | **MEDIUM** - Human rights findings |
| **Recommended Dashboard Use** | Contextual information on rights situation |

### Relevant Reports

**1. NHRCT UPR Submission (2021)**
- Documents human rights situation in Southern Border Provinces
- Covers: arbitrary detention, torture allegations, DNA collection, Emergency Decree
- URL: https://upr-info.org/sites/default/files/documents/2021-10/nhrct_upr39_tha_e_main.pdf

**2. CESCR Submission (2014)**
- Detailed report on economic, social, cultural rights in SBPs
- Covers: teachers killed (146), health workers killed (33), schools attacked (204)
- Land issues (Budo Sungai Padi National Park)
- Women's access to justice
- URL: https://tbinternet.ohchr.org/

**3. ICJ Report (2024)**
- "Thailand: 19 Years On, Emergency Measures in Deep South Must Be Lifted"
- Between Jan 2019 - Dec 2023: 721 alleged cases of arbitrary detention
- 2022: 40 former detainees interviewed, 10 alleged torture
- URL: https://www.icj.org/thailand-19-years-on-emergency-measures-in-deep-south-must-be-lifted/

**4. FIDH Annual Prison Report 2025**
- Contains Yala Central Prison data
- Notes: Muslim prisoners face discriminatory practices
- Former prisoners at Yala Central Prison reported limited Islamic religious books
- URL: https://www.fidh.org/IMG/pdf/thailand_annual_prison_report_2025_-_en.pdf

### NHRC Sub-committee on SBPs
- Subcommittee on operational strategies regarding human rights in SBPs
- Conducts monitoring and investigation
- Publishes findings and recommendations to government

---

## 15. Responsible Data Use Frameworks

### A. Why This Matters for Yala

Displaying conflict and security data on a municipal dashboard in Yala requires **extraordinary care**. The data involves:
- An ongoing armed conflict with active peace negotiations
- Deeply polarized religious and ethnic identities
- Sensitive locations of incidents that could identify informants or victims
- Potential for data to be misused to inflame tensions
- Security risks to communities if incident locations are precisely mapped

### B. Core Framework: "Do No Harm" (Conflict Sensitivity)

**Definition (Global Protection Cluster / UN):**
> Conflict sensitivity is the capacity of an organisation to understand its operating context, understand the interaction between its interventions and the context, and act upon this understanding to avoid negative impacts and maximise positive impacts on conflict factors.

**Key Principles:**
1. **Humanity**: Address human suffering without taking sides
2. **Neutrality**: Do not engage in controversies of political, racial, religious nature
3. **Impartiality**: Base action on needs alone
4. **Operational Independence**: Maintain autonomy from political/military objectives

### C. OCHA Data Responsibility Guidelines (2021)

**Key Principles for Yala Context:**
- **Accountability**: Clear responsibility for data use decisions
- **Confidentiality**: Protect sensitive data at all times
- **Data Security**: Appropriate technical and organizational safeguards
- **Defined Purpose**: Collect only what is necessary
- **Necessity and Proportionality**: Balance transparency against risk
- **Personal Data Protection**: Comply with Thailand's PDPA
- **Quality**: Ensure accuracy and appropriate disaggregation
- **Retention and Destruction**: Define data lifecycle
- **Transparency**: Be open about data practices

### D. IASC Operational Guidance on Data Responsibility (2021)

**Recommended Actions:**
1. Conduct a **data responsibility diagnostic**
2. Develop a **data asset registry**
3. Establish **data sharing agreements** for transfers
4. Create **standard operating procedures** for data incidents
5. Classify data by **sensitivity level**
6. Assess **risks, harms, and benefits** before any data release

### E. Data Sensitivity Classification for Yala Dashboard

| Level | Description | Examples |
|-------|-------------|----------|
| **PUBLIC** | Low risk of harm | Monthly incident counts, budget data, general trends |
| **INTERNAL** | Moderate risk | District-level incident counts, complaint categories |
| **RESTRICTED** | Significant risk | Sub-district incident data, victim demographics by religion |
| **CONFIDENTIAL** | High risk | Individual incident coordinates, informant data, victim identities |

### F. OECD Good Practice Principles for Data Ethics in Public Sector

**Relevant Principles:**
- Build procedures to address potential deviations
- Promote peer-to-peer assessments for data-driven projects
- Perform regular data audits
- Enable external auditors to review data practices
- Retain control over data inputs used for decisions
- Establish human oversight for decisions with human rights impact

---

## 16. Dashboard Integration Considerations

### A. General Principles for Security Data on Municipal Dashboards

1. **Aggregate, Never Disaggregate**: Show trends, not individual incidents
2. **Use Choropleth, Not Point Maps**: District-level shading, not precise coordinates
3. **Provide Context**: Always include explanatory narrative
4. **Show Improvements**: Highlight positive trends (declining violence)
5. **Update Regularly**: Stale data undermines credibility
6. **Mobile-First**: Over 60% of residents access via phone

### B. Recommended Display Elements

**APPROPRIATE for Public Dashboard:**
- Monthly incident count trend (line chart, 12+ months)
- Year-over-year comparison (bar chart)
- District-level incident distribution (choropleth map, no precise coordinates)
- Victim type breakdown (aggregate pie/bar chart)
- Complaint statistics (SBPAC KEADILAN data)
- Resolution rates

**NOT APPROPRIATE for Public Dashboard:**
- Individual incident locations (GPS coordinates)
- Victim names or identifying information
- Religious breakdown of victims in small numbers
- Specific tactics or methods (could aid perpetrators)
- Security force deployment patterns
- Anything that could identify informants or witnesses

### C. Conflict-Sensitive Visualization Guidelines

1. **Avoid Stigmatization**: Do not present data in ways that stigmatize particular communities
2. **Balanced Presentation**: Show both violence AND positive developments (peace dialogue, declining trends)
3. **Historical Context**: Always note that violence has significantly decreased since 2013
4. **Multiple Perspectives**: Acknowledge different interpretations of the conflict
5. **Language Neutrality**: Use neutral terminology ("incidents" not "terrorist attacks")

### D. Technical Implementation Recommendations

1. **Data Refresh**: Monthly updates sufficient; real-time feeds NOT recommended
2. **Caching**: Store processed aggregates, not raw event data
3. **Access Control**: Implement role-based access for detailed data
4. **Audit Logging**: Track who accesses sensitive data
5. **Data Retention**: Define clear retention and destruction policies
6. **Encryption**: Encrypt all data at rest and in transit
7. **Backup**: Secure off-site backups of dashboard data

### E. Stakeholder Consultation

Before publishing any security data on a Yala municipal dashboard:
1. **Consult SBPAC**: They are the lead government agency for SBPs
2. **Consult DSW**: They are the primary data collectors
3. **Consult Local Communities**: Include Muslim, Buddhist, and other stakeholders
4. **Consult Security Officials**: Provincial Police, Internal Security Operations Command
5. **Review with NHRC**: Ensure human rights compliance

### F. Emergency Decree Context

**CRITICAL NOTE**: As of July 2024, Yala Province remains under the Emergency Decree (77th extension). This means:
- Special security laws apply
- Data collection and publication may be subject to additional restrictions
- The government maintains broad authority over information related to security
- Any dashboard should be coordinated with SBPAC and local authorities

---

## Quick Reference: All Sources Summary Table

| # | Data Type | Source | URL | Geographic Level | Temporal | Access | Sensitivity |
|---|-----------|--------|-----|------------------|----------|--------|-------------|
| 1 | Conflict Incidents | DSW-CID | deepsouthwatch.org | Village/GIS | 2004-present | Partnership | HIGH |
| 2 | Monthly Summaries | DSW | deepsouthwatch.org/en/node | Province | 2004-present | Public | LOW-MED |
| 3 | Budget Data | DSW-PBP | deepsouthwatch.org | District | Multi-year | Partnership | MEDIUM |
| 4 | Survey Data | DSW-POP | deepsouthwatch.org | Sub-district | Multi-year | Partnership | MED-HIGH |
| 5 | Socio-Economic | DSW-SEP | deepsouthwatch.org | District | Multi-year | Partnership | LOW-MED |
| 6 | Global Conflict | ACLED | acleddata.com | Event/GIS | 1997-present | Free reg. | MEDIUM |
| 7 | Organized Violence | UCDP-GED | ucdp.uu.se/downloads | Event/GIS | 1989-present | Free no reg. | MEDIUM |
| 8 | SBPAC Admin Data | SBPAC | catalog.sbpac.go.th | District | Multi-year | Open Data | LOW-MED |
| 9 | Complaints | SBPAC | opendata.sbpac.go.th | District | Real-time | Open API | MEDIUM |
| 10 | Crime Stats | RTP | police9.go.th | Province | Current | Request | MEDIUM |
| 11 | Justice Stats | Courts | Formal request | Province | Annual | Request | MED-HIGH |
| 12 | Emergency Calls | MoI 191 | Formal request | Provincial | Real-time | Restricted | HIGH |
| 13 | Municipal Issues | Traffy Fondue | citydata.traffy.in.th | GPS/Sub-district | Real-time | Public | LOW |
| 14 | Human Rights | NHRC | nhrc.or.th | Province | Annual reports | Public | MEDIUM |

---

## Data Access Priority Matrix for Yala Dashboard

| Priority | Data Source | Ease of Access | Dashboard Value | Sensitivity | Recommendation |
|----------|-------------|---------------|-----------------|-------------|----------------|
| 1 | DSW Monthly Reports | Easy (public) | High | Low-Med | **START HERE** |
| 2 | SBPAC Open Data API | Easy (open) | High | Low-Med | Primary source |
| 3 | SBPAC Complaints | Easy (API) | High | Medium | Include |
| 4 | Traffy Fondue | Medium | Medium | Low | Include for municipal issues |
| 5 | ACLED | Medium (reg) | Medium | Medium | Cross-reference with DSW |
| 6 | UCDP | Easy (free) | Low-Medium | Medium | Supplementary |
| 7 | DSW Full Databases | Hard (partner) | High | High | For internal analysis only |
| 8 | Crime Stats (RTP) | Hard (request) | Medium | Medium | Formal request required |
| 9 | Emergency 191 | Very hard | Low | High | Not recommended for public dash |

---

## Key Contacts

| Organization | Contact | Purpose |
|-------------|---------|---------|
| DSW/CSCD | dsw.data@gmail.com; 073-312-302 | Conflict data access |
| SBPAC Data Catalog | saraban@sbpac.go.th; 0-7320-3872 | Open data, complaints |
| SBPAC Hotline | 1880 | Citizen complaints |
| ACLED Helpdesk | access@acleddata.com | API/registration support |
| UCDP | ucdp@pcr.uu.se | Dataset questions |
| NHRC | info@nhrc.or.th | Human rights reports |

---

## Responsible Data Use Checklist

Before implementing any security/conflict data on a Yala municipal dashboard:

- [ ] Consult with SBPAC on data appropriateness
- [ ] Conduct conflict sensitivity analysis
- [ ] Classify all data by sensitivity level
- [ ] Implement data aggregation (no individual incidents)
- [ ] Use choropleth maps, never point coordinates
- [ ] Establish access controls and audit logging
- [ ] Define data retention and destruction schedule
- [ ] Include contextual narrative with all visualizations
- [ ] Show positive trends alongside negative data
- [ ] Review visualization with diverse community stakeholders
- [ ] Ensure compliance with Thailand PDPA
- [ ] Document data sources and methodologies
- [ ] Plan for regular sensitivity review
- [ ] Establish incident response procedure for data misuse

---

## Sources and References

1. Deep South Watch. "Deep South Incident Database (DSID) Codebook v5." https://deepsouthwatch.org/th/codebook
2. World Bank. "Deep South Incident Database: Context, Development, Applications, and Impacts." KM Note 11, 2017.
3. ACLED. "ACLED Codebook." https://acleddata.com/methodology/acled-codebook
4. ACLED. "API User Guide." https://acleddata.com/api-documentation/getting-started
5. UCDP. "UCDP Georeferenced Event Dataset Codebook v25.1." https://ucdp.uu.se/downloads/ged/ged251.pdf
6. UCDP. "Dataset Download Center." https://ucdp.uu.se/downloads/
7. SBPAC. "Data Catalog." https://catalog.sbpac.go.th/
8. SBPAC. "Open Data API for Complaints." https://opendata.sbpac.go.th/API/SRT_01_01.aspx
9. The Asia Foundation. "Understanding Violence in Southeast Asia." 2016.
10. ICJ. "Thailand: 19 Years On, Emergency Measures in Deep South Must Be Lifted." 2024.
11. NHRCT. "Human Rights Situation in Thailand" (UPR Submission). 2021.
12. OCHA. "Data Responsibility Guidelines." 2021.
13. IASC. "Operational Guidance on Data Responsibility in Humanitarian Action." 2021.
14. OECD. "Good Practice Principles for Data Ethics in the Public Sector." 2021.
15. FIDH. "Thailand: Annual Prison Report 2025." 2025.
16. NSTDA/NECTEC. "Traffy Fondue Platform." https://citydata.traffy.in.th
17. Jitpiromsri, S. "The Deep South of Thailand: 15 Years in Fields of Open Conflict." 2021.

---

*Document prepared for Yala Provincial Municipality Data Ecosystem Mapping*
*Classification: Research - Confidential (due to sensitive nature of conflict data sources)*
*Last updated: July 2025*
