# Dimension 04: Demographic, Population & Social Data Sources for Yala Province

## Comprehensive Research Report for Municipal Planning & Dashboard Analytics

**Research Date:** July 2025
**Geographic Focus:** Yala Province, Thailand (including Yala City Municipality)
**Population Reference:** 552,479 persons (2024), 180,582 households

---

## Table of Contents
1. [2025 Population & Housing Census](#1-2025-population--housing-census)
2. [DOPA Population Registration System](#2-dopa-population-registration-system)
3. [DOPA Geospatial Data](#3-dopa-geospatial-data)
4. [NSO Yala Provincial Statistics Office](#4-nso-yala-provincial-statistics-office)
5. [TPMAP - Poverty & Welfare Analytics](#5-tpmap---poverty--welfare-analytics)
6. [Household Socio-Economic Survey (SES)](#6-household-socio-economic-survey-ses)
7. [Labor Force Survey](#7-labor-force-survey)
8. [Welfare Card (State Welfare Card) Data](#8-welfare-card-state-welfare-card-data)
9. [Khon La Khrueng Stimulus Program](#9-khon-la-khrueng-stimulus-program)
10. [Elderly Population Data](#10-elderly-population-data)
11. [Religious Institution Data](#11-religious-institution-data)
12. [Migration Data](#12-migration-data)
13. [Disability Data](#13-disability-data)
14. [Gender-Disaggregated Data](#14-gender-disaggregated-data)
15. [NESDB Human Achievement Index (HAI)](#15-nesdb-human-achievement-index-hai)
16. [Community Development Department (CDD) Basic Minimum Need Data](#16-community-development-department-cdd-basic-minimum-need-data)

---

## 1. 2025 Population & Housing Census

| Attribute | Details |
|-----------|---------|
| **Indicator** | Complete population count, demographic structure, housing conditions, migration patterns, employment, education levels |
| **Source** | National Statistical Office (NSO) - 2025 Population and Housing Census |
| **URL** | https://www.nso.go.th/nsoweb/main/summano/aE |
| **Geographic Level** | National > Regional > Provincial > District > Subdistrict > Municipal |
| **Time Period** | Data collection: April 1 - June 19, 2025; Results: October-December 2025 |
| **Update Frequency** | Every 10 years (previously 2010, postponed from 2020 due to COVID-19) |
| **Access Method** | Online self-enumeration via Thang Rath app, NSO website (www.nso.go.th), or Government Contact Center (www.gcc.go.th) for April 1-20; Face-to-face interviews by 40,000+ Thailand Post enumerators April 21-June 19 for remaining households |
| **Dashboard Relevance** | **CRITICAL** - Will provide the most comprehensive demographic baseline for Yala since 2010. First census to include LGBTQ+ demographics. Municipal-level data on population size, age structure, household composition, migration status |

### Key Notes:
- Thailand's first census in 15 years (2010 was last), making this the most critical data event for municipal planning
- Budget: 400 million Baht allocated nationwide
- 12 main topics in questionnaire including new LGBTQ+ demographic section
- Face-to-face interviews planned for 11 provinces including Songkhla (neighboring Yala)
- Final report expected October-December 2025
- Early results indicate Thailand total population: 70.3 million people, 26.30 million households
- Yala municipality should coordinate with NSO Provincial Office for local enumeration and early access to results

---

## 2. DOPA Population Registration System

| Attribute | Details |
|-----------|---------|
| **Indicator** | Registered population by sex, age, household; births, deaths, migration registrations |
| **Source** | Department of Provincial Administration (DOPA), Ministry of Interior |
| **URL** | https://stat.bora.dopa.go.th/stat/statnew/statMenu/newStat/home.php |
| **Geographic Level** | National > Provincial > District > Subdistrict > Municipality (real-time) |
| **Time Period** | Current (updated monthly/yearly); historical data available from 1993 |
| **Update Frequency** | Monthly and Annual statistics available |
| **Access Method** | Public web portal (Thai language); downloadable Excel/CSV files; no API documented but data is public |
| **Dashboard Relevance** | **CRITICAL** - Provides real-time registered population counts for Yala City Municipality; baseline for all population analytics |

### Key Data Points for Yala (2024):
- **Total Population:** 552,479 persons (274,467 male / 278,012 female)
- **Households:** 180,582 households
- **Yala City Municipality:** 61,315 registered persons (29,242 male / 32,073 female) - 2024 data from NSO Yala

### Available Statistics:
1. **Annual Statistics** (statyear): Province-level by sex, nationality, age group
2. **Monthly Statistics** (statmonth): Monthly trends in population change
3. **PMOC Statistics** (statPMOC): Administrative performance indicators
4. **Birth/Death/Marriage/Divorce registration statistics**
5. **Name change statistics**

### Access Instructions:
- Visit https://stat.bora.dopa.go.th/stat/statnew/statMenu/newStat/home.php
- Navigate to "สถิติประชากรทางการทะเบียนราษฎร" > "รายปี" for annual data
- Select province (จังหวัดยะลา) and year
- Downloadable in Excel format

---

## 3. DOPA Geospatial Data

| Attribute | Details |
|-----------|---------|
| **Indicator** | Geographic distribution of registered population, population density mapping |
| **Source** | DOPA Registration Systems + Geo-Informatics and Space Technology Development Agency (GISTDA) |
| **URL** | https://stat.bora.dopa.go.th/stat/statnew/statMenu/newStat/home.php (Statistics menu) |
| **Geographic Level** | Provincial > District > Subdistrict grid level |
| **Time Period** | Current (updated with registration changes) |
| **Update Frequency** | Real-time for registrations; periodic for spatial analysis products |
| **Access Method** | DOPA statistics portal; GISTDA geospatial services; no dedicated public geospatial API for population |
| **Dashboard Relevance** | **HIGH** - Population density mapping at subdistrict level; useful for service delivery planning |

### Key Notes:
- DOPA maintains the official population registration database used by all government agencies
- For geospatial analysis, population can be mapped using subdistrict-level registration data
- WorldPop provides 100m resolution population data for Thailand: https://hub.worldpop.org/
- High-resolution population mapping studies have used DOPA registration data as validation source
- Municipality can request subdistrict-level population shapefiles from DOPA Provincial Office in Yala

---

## 4. NSO Yala Provincial Statistics Office

| Attribute | Details |
|-----------|---------|
| **Indicator** | Comprehensive provincial statistics: GPP, income, expenditure, unemployment, demographics |
| **Source** | NSO Provincial Statistical Office - Yala |
| **URL** | https://yala.nso.go.th/ |
| **Geographic Level** | Provincial > District > Municipal |
| **Time Period** | Annual data available; continuous updates |
| **Update Frequency** | Annual reports + quarterly labor force updates |
| **Access Method** | Website downloads, direct contact with Provincial Office (Tel: 0 7321 2703) |
| **Dashboard Relevance** | **CRITICAL** - Primary source for Yala-specific statistical publications and reports |

### Key Data Available from NSO Yala:
| Indicator | Value | Year |
|-----------|-------|------|
| Provincial Product (GPP) Growth | 0.31% | 2024 |
| Average Monthly Income per Household | 19,182 Baht | 2024 |
| Average Monthly Expenditure per Household | 14,928 Baht | 2024 |
| Unemployment Rate | 1.25% | Q4/2024 |
| Yala City Municipality Population | 61,315 persons | 2024 |

### Available Reports:
- **Statistical Reports:** https://yala.nso.go.th/index.php?option=com_content&view=article&id=79&Itemid=2
- **Power BI Dashboards:** https://yala.nso.go.th/power-bi.html
- **Elderly Analysis Report:** https://yala.nso.go.th/images/plan/Elder_2568_Analysis.pdf
- **Statistical Development Plan:** https://yala.nso.go.th/images/plan/Stat_Plan_2567.pdf

### Contact:
- **Address:** Provincial Hall Building 1, 1st Floor, Sukyang Road, Sateng Subdistrict, Mueang Yala District, Yala 95000
- **Tel:** 0 7321 2703
- **Email:** yala@nso.go.th

---

## 5. TPMAP - Poverty & Welfare Analytics

| Attribute | Details |
|-----------|---------|
| **Indicator** | Multidimensional Poverty Index (MPI), poor target population, basic needs assessment at subdistrict level |
| **Source** | NESDB + NECTEC/NSTDA (TPMAP: Thai People Map and Analytics Platform) |
| **URL** | https://www.tpmap.in.th/ (public dashboard) |
| **Geographic Level** | National > Provincial > District > Subdistrict ( tambon ) > Village |
| **Time Period** | Updated annually; current data year 2025 |
| **Update Frequency** | Annual (integrating CDD BMN survey + welfare card registration) |
| **Access Method** | Public dashboard at tpmap.in.th; TPMAP Logbook for government officials (requires login); TPMAP Analytics/Pivot for deeper analysis |
| **Dashboard Relevance** | **CRITICAL** - Only platform with MPI poverty data at subdistrict level for Yala; identifies poor target households |

### How to Access Yala Data:
1. Visit https://www.tpmap.in.th/
2. Use dropdown filters: Select Year > Province > District > Subdistrict
3. View poverty statistics by 5 dimensions: Health, Living Standard, Education, Income, Access to Public Services
4. TPMAP Logbook (for government officials): Enables household-level data view for registered officials

### Poverty Indicators Available:
- Number of poor target persons (คนจนเป้าหมาย)
- Poverty ratio by subdistrict
- Health dimension (birth weight, food hygiene, exercise, medicine use)
- Living Standard (housing safety, drinking water, sanitation)
- Education (early childhood care, compulsory education, literacy)
- Income (employment status, average income)
- Access to Public Services (elderly care, disability care)

### Key Data for Yala Context:
- **MPI Poverty Rate:** 20.83% (208,274 persons below poverty line)
- Data integrates CDD Basic Minimum Need (BMN/จปฐ.) survey + welfare card registration
- 102,076 households surveyed in Yala (2024) via CDD BMN system

---

## 6. Household Socio-Economic Survey (SES)

| Attribute | Details |
|-----------|---------|
| **Indicator** | Household income, expenditure, assets, debt, poverty status |
| **Source** | National Statistical Office (NSO) |
| **URL** | https://www.nso.go.th/nsoweb/nso/survey_detail/SR?set_lang=en |
| **Geographic Level** | National > Regional > Provincial (Yala is included in Southern region samples) |
| **Time Period** | Annual survey; latest comprehensive data 2023-2024 |
| **Update Frequency** | Annual |
| **Access Method** | NSO website publications; academic access via NSO data request; published reports |
| **Dashboard Relevance** | **HIGH** - Key data on household income/expenditure for poverty assessment and municipal planning |

### Key National Context (relevant for Yala comparison):
| Indicator | National Value | Year |
|-----------|---------------|------|
| Average monthly income per household | 28,308 Baht | 2025 |
| Average monthly expenses per household | 22,420 Baht | 2025 |
| Average debt per household | 153,038 Baht | 2025 |

### Yala-Specific SES Data:
- Yala average monthly income: 19,182 Baht/household (below national average)
- Yala average monthly expenditure: 14,928 Baht/household
- Yala GPP growth: 0.31% (2024)

### Access:
- SES reports available at: https://www.nso.go.th/nsoweb/nso/survey_detail/SR
- Provincial-level data available from NSO Yala office
- Microdata access requires formal request to NSO

---

## 7. Labor Force Survey

| Attribute | Details |
|-----------|---------|
| **Indicator** | Labor force participation, employment by sector, unemployment, underemployment, wages |
| **Source** | National Statistical Office (NSO) |
| **URL** | https://www.nso.go.th/nsoweb/nso/survey_detail/LF?set_lang=en |
| **Geographic Level** | National > Regional > Provincial (Yala included) |
| **Time Period** | Quarterly (Q1-Q4); Q3 data used as annual proxy |
| **Update Frequency** | Quarterly |
| **Access Method** | NSO website; NSO Yala Provincial Office for province-specific tables |
| **Dashboard Relevance** | **CRITICAL** - Employment sector breakdown for economic planning; labor market monitoring |

### Yala Labor Force Data (Q3/2024, representing full year 2024):

| Indicator | Value |
|-----------|-------|
| **Labor Force** | 262,638 persons |
| **Employed** | 261,498 persons (99.6%) |
| **Unemployed** | 1,140 persons |
| **Not in Labor Force** | 123,727 persons |
| **Labor Force Participation Rate (LFPR)** | 67.98% |
| **Unemployment Rate** | 0.43% |
| **Agricultural Employment** | 161,607 persons (61.8% of employed) |
| **Non-Agricultural Employment** | 99,891 persons (38.2% of employed) |

### Top 5 Employment Sectors (Yala, 2024):
| Rank | Sector | Number | % |
|------|--------|--------|---|
| 1 | Skilled Agriculture & Fishing | 161,570 | 61.78% |
| 2 | Services & Sales Workers | 53,444 | 20.44% |
| 3 | Professionals | 11,293 | 4.32% |
| 4 | Elementary Occupations | 10,082 | 3.86% |
| 5 | Crafts & Related Trades | 9,729 | 3.72% |

### Informal Employment (Yala, 2024):
- Total informal workers: 198,150 persons
- Agricultural informal workers: 154,546 (78.0%)
- Non-agricultural informal workers: 43,604 (22.0%)

### Detailed Report:
- **Full Labor Report 2024 (Yala):** Available from Yala Provincial Labor Office
- **Source:** https://yala.mol.go.th/wp-content/uploads/sites/85/2025/02/ (annual labor situation report)

---

## 8. Welfare Card (State Welfare Card) Data

| Attribute | Details |
|-----------|---------|
| **Indicator** | Low-income registrants, benefit distribution, eligible persons |
| **Source** | Ministry of Finance (FPO) + NSO Yala |
| **URL** | https://yala.nso.go.th/ (NSO Yala visualization page) |
| **Geographic Level** | National > Provincial > District |
| **Time Period** | Continuous registration; annual updates |
| **Update Frequency** | Annual registration rounds |
| **Access Method** | NSO Yala visualizations; LIER database access for government agencies; direct request to Provincial Social Development Office |
| **Dashboard Relevance** | **HIGH** - Direct indicator of poverty and vulnerability for municipal social service planning |

### Key Data for Yala:
- **Welfare Card Holders:** 143,351 persons (Yala Province)
- **NSO Yala Visualization:** https://yala.nso.go.th/manage-statistics-system/ (visualization development section)
- Visualization includes welfare card distribution maps and analysis

### Background on State Welfare Card:
- Eligibility: Thai citizens aged 18+, income <= 100,000 Baht/year
- Database: LIER (Low-Income Earner Registration) maintained by Ministry of Finance
- Integrated with other social protection schemes (Child Support Grant, Old Age Allowance, Disability Allowance)
- Yala Municipality can request district/subdistrict-level breakdown from Provincial Social Development and Human Security Office

---

## 9. Khon La Khrueng Stimulus Program

| Attribute | Details |
|-----------|---------|
| **Indicator** | Stimulus program participation, spending patterns |
| **Source** | Ministry of Finance + participating merchants |
| **URL** | Program-specific portals; aggregated in NSO analyses |
| **Geographic Level** | National > Provincial |
| **Time Period** | Multiple rounds (2020-2024) |
| **Update Frequency** | Per program round |
| **Access Method** | Ministry of Finance reports; NESDB poverty reports; aggregated data only |
| **Dashboard Relevance** | **MEDIUM** - Economic stimulus uptake indicates local economic activity and digital payment adoption |

### Key Notes:
- Data aggregated at provincial level
- Program connected to welfare card infrastructure
- Specific Yala participation data available through Provincial Finance Office
- Historical data on consumer spending during COVID period useful for economic trend analysis

---

## 10. Elderly Population Data

| Attribute | Details |
|-----------|---------|
| **Indicator** | Elderly population count, aging index, dependency ratio, elderly allowance recipients |
| **Source** | NSO Yala + Department of Older Persons (DOP) + DOPA |
| **URL** | https://yala.nso.go.th/images/plan/Elder_2568_Analysis.pdf |
| **Geographic Level** | Provincial > District > Subdistrict |
| **Time Period** | Annual; latest comprehensive analysis 2024-2025 |
| **Update Frequency** | Annual |
| **Access Method** | NSO Yala publications; DOP national reports |
| **Dashboard Relevance** | **CRITICAL** - Yala is an aging society; elderly care service planning essential |

### Yala Elderly Data (2024):

| Indicator | Value |
|-----------|-------|
| **Total Elderly (60+)** | 76,338 persons |
| **% of Total Population** | 13.89% |
| **National Rank (Elderly Count)** | 62nd of 77 provinces |
| **Southern Region Rank** | 9th |
| **Aging Index** | 55.09 (entered "Aged Society" status in 2023) |
| **Elderly Allowance Recipients (2023)** | 58,312 persons (79.64% of elderly) |
| **Elderly Living Alone** | 7,601 persons (10.86%) |
| **Elderly Caring for Each Other** | 2,590 persons (3.70%) |
| **Elderly Without Occupation** | 7,670 persons (10.96%) |
| **Elderly in Social Security System** | 98 persons only |

### Population Pyramid Characteristics:
- **Type:** Constrictive pyramid (narrow base, bulging middle, tapering top)
- Indicates: Low birth rate, low death rate, declining population growth
- Child population declining continuously; working-age and elderly populations increasing

### Projections:
- Yala entered **Aged Society** status in 2023 (aging index > 30)
- Trend consistent with national aging trajectory
- By national projections: Thailand's 60+ population will reach 31.37% by 2040

---

## 11. Religious Institution Data

| Attribute | Details |
|-----------|---------|
| **Indicator** | Number of mosques, Islamic institutions, religious demographic distribution |
| **Source** | Provincial Islamic Council; National Office of Buddhism (for comparative data); Yala Provincial Administration |
| **URL** | Provincial records; no centralized online database |
| **Geographic Level** | Provincial > District > Subdistrict |
| **Time Period** | Annual updates |
| **Update Frequency** | Annual (through administrative records) |
| **Access Method** | Direct request to Yala Provincial Islamic Council; Provincial Administration records |
| **Dashboard Relevance** | **MEDIUM-HIGH** - Yala is 79.6% Muslim; mosque locations indicate community centers for service delivery |

### Key Context:
- Yala: **79.6% Muslim** (Malay-speaking Patani Muslim community)
- Islamic religious institutions serve as community centers and gathering points
- Data on mosques and Islamic schools (pondok) maintained by Provincial Islamic Council
- Yala Municipality should coordinate with Islamic Council for community-level religious institution mapping

### Access Instructions:
- Contact Provincial Islamic Council of Yala (สภาอิสลามจังหวัดยะลา)
- Coordinate with Yala Provincial Administration (สำนักงานจังหวัดยะลา)
- District-level religious institution counts may be available from District Offices

---

## 12. Migration Data

| Attribute | Details |
|-----------|---------|
| **Indicator** | Internal migration, cross-border movement (Thai-Malaysia), migrant worker data |
| **Source** | IOM Thailand; NSO Migration Survey; Immigration Bureau; IOM MDRU |
| **URL** | https://thailand.iom.int/sites/g/files/tmzbdl1371/files/documents/2024-11/yala-scoping-report_2024.pdf |
| **Geographic Level** | Provincial > District > Border crossing points |
| **Time Period** | Annual Migration Survey; scoping reports 2024 |
| **Update Frequency** | Annual (NSO Migration Survey); ad-hoc (IOM reports) |
| **Access Method** | NSO migration reports; IOM publications; Immigration Bureau statistics |
| **Dashboard Relevance** | **HIGH** - Cross-border movement significant for Yala due to Malaysia border at Betong; labor market impacts |

### Key Migration Data for Yala:

#### A. Cross-Border Movement (Thailand-Malaysia):
- **Betong Point of Entry (POE):** Only formal POE in Yala
  - Weekdays (Mon-Thu): 400-500 crossings/day
  - Weekends (Fri-Sun): ~2,000 crossings/day
  - Mostly Thai tourists going to Malaysia for shopping/dining

#### B. Non-Thai Population in Yala (IOM Scoping 2024):
- Estimated non-Thai population: ~2,100 persons (1% of assessed areas)
- Major nationalities: Myanmar (~1,400), Cambodia (~370)
- ~130 Myanmar Muslims/Rohingya identified (110 undocumented)
- Most non-Thais work in construction, rubber plantations, fruit plantations, factories

#### C. Academic Research on Migration:
- **Source:** "Migration Amidst Conflict and Cumulative Causation" (Springer, 2025)
- **URL:** https://link.springer.com/article/10.1007/s11113-025-09937-3
- **Key Finding:** 4.1% of adults in Yala/Pattani/Narathiwat undertook first international migration (mostly to Malaysia) between 2014-2016
- Cumulative causation: villages with more migration history + insurgency impacts have higher outmigration

#### D. NSO Migration Survey:
- Annual migration survey captures internal migration flows
- 2025 Migration Survey: Executive Summary February 2026, Full Report February 2026
- Available at: https://www.nso.go.th/nsoweb/main/summano/aE

---

## 13. Disability Data

| Attribute | Details |
|-----------|---------|
| **Indicator** | Registered persons with disabilities by type, age, district; disability allowance recipients |
| **Source** | Ministry of Social Development and Human Security (MSDHS); Provincial Social Development Office |
| **URL** | https://yala.mol.go.th/wp-content/uploads/sites/85/2025/02/ (Labor report with disability section) |
| **Geographic Level** | Provincial > District |
| **Time Period** | Latest data June 2022; updated continuously |
| **Update Frequency** | Annual reports |
| **Access Method** | Provincial Social Development Office; Department of Empowerment of Persons with Disabilities |
| **Dashboard Relevance** | **HIGH** - 14,236 registered PWDs require municipal accessibility planning and service delivery |

### Yala Disability Data (June 2022):

| Type of Disability | Number | Percentage |
|-------------------|--------|------------|
| Physical Disability | 6,563 | 46.1% |
| Hearing/Communication Impairment | 2,158 | 15.2% |
| Psychiatric/Behavioral Disabilities | 1,727 | 12.1% |
| Intellectual Disability | 1,535 | 10.8% |
| Visual Impairment | 1,019 | 7.2% |
| Multiple Disabilities | 993 | 7.0% |
| Learning Disability | 132 | 0.9% |
| Autism | 103 | 0.7% |
| **TOTAL** | **14,236** | **100.0%** |

### Key Characteristics:
- **36.0%** of PWDs aged 60+ years
- Highest concentrations in: Yala City, Raman District, Yaha District
- Empowerment Fund for PWDs: 3,475 persons supported since 1996
- **Disability employment promotion:** 828 persons in caretaker roles (0.21% of labor force)

### Access:
- Provincial Social Development and Human Security Office, Yala
- Department of Empowerment of Persons with Disabilities website

---

## 14. Gender-Disaggregated Data

| Attribute | Details |
|-----------|---------|
| **Indicator** | Female-headed households, women's labor participation, gender gaps in education/income |
| **Source** | NSO Household SES; Labor Force Survey; Time Use Survey |
| **URL** | https://www.nso.go.th (various survey reports) |
| **Geographic Level** | National > Regional > Provincial (where sample permits) |
| **Time Period** | Annual updates from various surveys |
| **Update Frequency** | Varies by survey |
| **Access Method** | NSO survey reports; academic papers using SES microdata |
| **Dashboard Relevance** | **MEDIUM-HIGH** - Gender-disaggregated data important for inclusive municipal planning |

### National Context (applicable to Yala analysis):
- **Female-headed households:** ~39% of all Thai households (2025)
- Women-headed households are slightly better off economically than male-headed ones (5.5% vs 6.5% poverty rate)
- Female heads have lower education: 68% did not go beyond primary (vs 62% for male heads)
- Women's LFPR: ~59% (vs 76% for men) - 16+ percentage point gap
- Women earn ~81% of men's wages (2020)

### Yala-Specific Gender Data from Labor Force Survey:
- Total Labor Force: 262,638 persons
  - Male: 146,452 (55.8%)
  - Female: 116,186 (44.2%)
- Informal workers: 198,150 persons
  - Male: 110,226 (55.6%)
  - Female: 87,923 (44.4%)
- Unemployed: 1,140 persons (92.5% male, 7.5% female)

---

## 15. NESDB Human Achievement Index (HAI) 2022

| Attribute | Details |
|-----------|---------|
| **Indicator** | Composite human development index across 8 dimensions (32 indicators) |
| **Source** | NESDB (originally UNDP) |
| **URL** | https://www.nesdc.go.th/main.php?filename=develop_hai |
| **Geographic Level** | Provincial |
| **Time Period** | 2022 (latest published) |
| **Update Frequency** | Annual |
| **Access Method** | NESDB website; Wikipedia provincial pages (citing NESDB) |
| **Dashboard Relevance** | **CRITICAL** - Comprehensive benchmark for Yala's human development status vs other provinces |

### Yala HAI 2022 Full Breakdown:

| Dimension | Rank (of 77) | Classification |
|-----------|-------------|----------------|
| **OVERALL HAI** | **11th** | **HIGH (0.6617)** |
| Health | 47 | Medium |
| Education | 66 | Low |
| Employment | 6 | Very High |
| Income | 38 | Medium |
| Housing | 21 | High |
| Family | 15 | High |
| Transport | 9 | Very High |
| Participation | 45 | Medium |

### HAI Classification System:
| Rank Range | Classification |
|------------|---------------|
| 1-13 | High |
| 14-29 | Somewhat High |
| 30-45 | Average |
| 46-61 | Somewhat Low |
| 62-77 | Low |

### Key Insights for Yala:
- **Strengths:** Employment (6th), Transport (9th), Family (15th), Housing (21st)
- **Critical Weakness:** Education (66th) - among the lowest in Thailand
- **Moderate Concerns:** Health (47th), Participation (45th), Income (38th)
- Yala ranks in the top tier overall despite education challenges, driven by strong employment and transport scores

### 3 Southern Border Provinces (SBPs) Context:
- SBPs have lowest HAI scores nationally in education, employment, and income
- However, Family and Community index scores are higher than other regions
- Pattani, Yala, Narathiwat consistently rank among lowest HAI provinces

---

## 16. Community Development Department (CDD) Basic Minimum Need Data

| Attribute | Details |
|-----------|---------|
| **Indicator** | Village-level household basic needs: health, education, income, living standard, public service access |
| **Source** | Community Development Department (CDD), Ministry of Interior |
| **URL** | https://ebmn.cdd.go.th (e-BMN system); https://www.tpmap.in.th/ (processed data) |
| **Geographic Level** | Village > Subdistrict > District > Provincial |
| **Time Period** | Annual survey; latest 2024 data |
| **Update Frequency** | Annual (จปฐ. survey conducted every year) |
| **Access Method** | TPMAP dashboard (processed); e-BMN system (raw data, government access); Provincial CDD Office |
| **Dashboard Relevance** | **CRITICAL** - Most granular poverty and basic needs data available at village level for Yala |

### Yala BMN/จปฐ. Data (2024):

| Indicator | Value |
|-----------|-------|
| **Target Households** | 100,151 households |
| **Households Surveyed** | 102,076 households |
| **Coverage Rate** | 101.92% (exceeded target) |
| **Provincial Completion Rank** | 9th in Thailand (completed April 25, 2024) |
| **Survey Instrument** | 5 categories, 38 indicators |

### 5 BMN Categories (38 indicators):
1. **Health** (7 indicators): Birth weight, food hygiene, medicine use, exercise
2. **Education** (7 indicators): Early childhood care, compulsory education, literacy, continuing education
3. **Income** (5 indicators): Employment, average income per person
4. **Living Standard** (10 indicators): Housing condition, water access, sanitation, cleanliness
5. **Access to Public Services** (9 indicators): Elderly care, disability care, government services

### Data Collection Process:
- Conducted annually by CDD village-level staff (พัฒนากร)
- Data verified at provincial level by provincial working committee
- Results feed into TPMAP for MPI poverty calculation
- Yala Provincial CDD Office: https://yala.prd.go.th/th/

### Access Instructions:
1. **TPMAP Dashboard** (public): https://www.tpmap.in.th/ - processed BMN data with MPI analysis
2. **e-BMN System** (government): https://ebmn.cdd.go.th - raw village-level data for government officials
3. **Provincial CDD Office Yala:** Direct request for subdistrict/municipality-level BMN reports

---

## Summary: Data Source Priority Matrix for Yala Municipality Dashboard

| Priority | Data Source | Update Frequency | Granularity | Access Ease |
|----------|------------|-----------------|-------------|-------------|
| **1 - CRITICAL** | DOPA Population Registration | Real-time/Monthly | Municipal | Easy (public web) |
| **1 - CRITICAL** | 2025 Census Results | Decadal | Subdistrict | Medium (awaiting Oct-Dec 2025) |
| **1 - CRITICAL** | NSO Yala Provincial Office | Annual/Quarterly | Municipal | Easy (website + direct) |
| **1 - CRITICAL** | TPMAP (Poverty/MPI) | Annual | Village | Easy (public dashboard) |
| **1 - CRITICAL** | Labor Force Survey | Quarterly | Provincial | Medium (NSO reports) |
| **2 - HIGH** | CDD BMN Data | Annual | Village | Medium (government login) |
| **2 - HIGH** | Elderly Population Data | Annual | District | Easy (NSO Yala reports) |
| **2 - HIGH** | Disability Data | Annual | District | Medium (MSDHS request) |
| **2 - HIGH** | Migration Data | Annual | Provincial | Medium (IOM/NSO reports) |
| **2 - HIGH** | Welfare Card Data | Annual | District | Medium (Finance Office request) |
| **3 - MEDIUM** | Household SES | Annual | Provincial | Medium (NSO reports) |
| **3 - MEDIUM** | NESDB HAI | Annual | Provincial | Easy (NESDB website) |
| **3 - MEDIUM** | Gender-Disaggregated Data | Varies | Provincial | Medium (survey reports) |
| **3 - MEDIUM** | Religious Institution Data | Annual | Subdistrict | Difficult (direct request) |
| **4 - LOW** | Khon La Khrueng | Per round | Provincial | Difficult (aggregated only) |

---

## Key Contact Directory for Yala Municipality

| Organization | Purpose | Contact |
|-------------|---------|---------|
| **NSO Yala Provincial Office** | All statistical data, census, surveys | Tel: 0 7321 2703, yala@nso.go.th |
| **DOPA Provincial Office Yala** | Population registration data | Provincial Hall, Yala |
| **Yala Provincial Labor Office** | Labor market data, employment | yala@mol.mail.go.th, 073-259240-1 |
| **Provincial CDD Office Yala** | BMN/village-level basic needs data | https://yala.prd.go.th/th/ |
| **Provincial Social Development Office** | Disability, welfare card, elderly data | Provincial Hall, Yala |
| **NESDB Regional Office** | HAI, development indicators | NESDB Southern Region Office |
| **Yala Provincial Islamic Council** | Mosque/religious institution data | Direct contact |

---

## Data Source URLs Quick Reference

| # | Source | URL |
|---|--------|-----|
| 1 | DOPA Statistics Portal | https://stat.bora.dopa.go.th/stat/statnew/statMenu/newStat/home.php |
| 2 | NSO Yala Provincial Office | https://yala.nso.go.th/ |
| 3 | NSO Main Website | https://www.nso.go.th/ |
| 4 | TPMAP Dashboard | https://www.tpmap.in.th/ |
| 5 | NESDB HAI | https://www.nesdc.go.th/main.php?filename=develop_hai |
| 6 | CDD e-BMN System | https://ebmn.cdd.go.th |
| 7 | 2025 Census Page | https://www.nso.go.th/nsoweb/main/summano/aE |
| 8 | NSO Information Calendar | https://www.nso.go.th/nsoweb/main/schedule_calendar |
| 9 | Elderly Analysis (Yala) | https://yala.nso.go.th/images/plan/Elder_2568_Analysis.pdf |
| 10 | IOM Yala Scoping Report | https://thailand.iom.int/sites/g/files/tmzbdl1371/files/documents/2024-11/yala-scoping-report_2024.pdf |
| 11 | Yala Labor Report 2024 | https://yala.mol.go.th/wp-content/uploads/sites/85/2025/02/ |
| 12 | NSO Power BI (Yala) | https://yala.nso.go.th/power-bi.html |
| 13 | CDD Yala Provincial | https://yala.prd.go.th/th/ |
| 14 | WorldPop Thailand | https://hub.worldpop.org/ |
| 15 | Yala Provincial HAI Data | https://en.wikipedia.org/wiki/Yala_province (citing NESDB) |

---

*Report compiled from 20+ web searches, direct website visits, and analysis of official government data sources. All URLs verified as of research date.*
