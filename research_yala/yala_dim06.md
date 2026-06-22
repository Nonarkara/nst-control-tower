# Dimension 06: Health Data & Health Services — Yala Municipality

> **Research Date:** July 2025  
> **Geographic Focus:** Yala Province & Yala Municipality (เทศบาลนครยะลา), Southern Thailand  
> **Health Network:** Health Network 12 (เขตสุขภาพที่ 12)  
> **Total Searches Conducted:** 20+

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [MOPH Health Data Center (HDC)](#1-moph-health-data-center-hdc)
3. [HDC Open Data Portal](#2-hdc-open-data-portal)
4. [BOE 506 Surveillance for Yala](#3-boe-506-surveillance-for-yala)
5. [Dengue in Yala](#4-dengue-in-yala)
6. [Malaria in Yala](#5-malaria-in-yala)
7. [Measles/Vaccination in Yala](#6-measlesvaccination-in-yala)
8. [NHSO Yala Data](#7-nhso-yala-data)
9. [Yala Hospital Data](#8-yala-hospital-data)
10. [District Hospitals in Yala](#9-district-hospitals-in-yala)
11. [Tambon Health Promotion Hospitals](#10-tambon-health-promotion-hospitals)
12. [Health Region 12 Data](#11-health-region-12-data)
13. [Mental Health Data](#12-mental-health-data)
14. [Health Workforce in Yala](#13-health-workforce-in-yala)
15. [Maternal & Child Health](#14-maternal--child-health)
16. [Elderly Health Data](#15-elderly-health-data)
17. [Health GIS](#16-health-gis)
18. [Air Quality Data](#17-air-quality-data)
19. [Data Sources Summary Table](#data-sources-summary-table)
20. [Dashboard Application Recommendations](#dashboard-application-recommendations)

---

## Executive Summary

Yala Province (population: 546,355 in 2023) has a multi-layered health data ecosystem managed through the Ministry of Public Health (MOPH), National Health Security Office (NHSO), Bureau of Epidemiology (BOE), and Department of Mental Health (DMH). Health services are delivered through **Health Network 12** (เขตสุขภาพที่ 12), one of 13 health network service areas in Thailand. The province has **1 regional hospital** (Yala Hospital, 558 beds), **at least 5 community/district hospitals**, and **81 Tambon Health Promotion Hospitals (THPHs)** serving as primary care units.

Key health challenges in Yala include:
- **Dengue fever:** Ranked #7 nationally for dengue incidence (21.87 per 100,000 in 2022)
- **Malaria:** Not yet malaria-free; ongoing elimination efforts with remaining pockets in border districts
- **Measles:** Among highest outbreak provinces due to low MMR vaccination coverage (~50.5% MMR1, ~39.8% MMR2 in outbreak areas vs. 95% national target)
- **Mental health:** Conflict-related trauma affects the population; 9.6% lifetime mental disorder prevalence in Deep South
- **Health workforce:** 21 doctors in general hospital (1:2,906 population-to-doctor ratio in community hospitals)

---

## 1. MOPH Health Data Center (HDC)

### Overview
The Health Data Center (HDC) is the central health information warehouse of Thailand's Ministry of Public Health. It collects standardized health data from all public health facilities through 43 standard data files (แฟ้มข้อมูล 43 แฟ้ม).

### Key Details

| Attribute | Value |
|-----------|-------|
| **Source** | MOPH Health Data Center |
| **URL** | https://hdcservice.moph.go.th/hdc/main/index.php |
| **Geographic Level** | Province, District, Sub-district, Facility |
| **Update Frequency** | Real-time (OP data within 15 days; IP data within 45 days of discharge) |
| **Access Method** | Username/password required (for MOPH personnel); public reports via HDC Service |

### Available Health Indicators for Yala

The HDC contains data from 43 standard files covering:

| File Category | Key Indicators Available |
|--------------|------------------------|
| **PERSON** | Population demographics, health insurance coverage |
| **SERVICE** | Outpatient (OP) and Inpatient (IP) service utilization |
| **DIAGNOSIS_OPD/IPD** | Disease diagnoses (ICD-10 coded) |
| **CHRONIC/CHRONICFU** | Chronic disease patient data (diabetes, hypertension) |
| **NCDSCREEN** | NCD screening data |
| **ANC/LABOR/NEWBORN** | Maternal and child health data |
| **EPI** | Vaccination/immunization data |
| **DEATH** | Mortality data with cause of death |
| **SURVEILLANCE** | Notifiable disease reporting |
| **NUTRI** | Nutritional status data |
| **DISABILITY** | Disability data |
| **CARD** | Cardiovascular disease data |
| **POSTNATAL** | Postnatal care data |
| **ACCIDENT** | Injury and accident data |

### HDC Provincial Access
Each province has its own HDC portal. Yala's data flows through the provincial HDC system to the central HDC service. Public reports are accessible at:
- **HDC Service Portal:** https://hdcservice.moph.go.th
- **HISO (Health Information System Office):** https://www.hiso.or.th

### Dashboard Application
- Primary source for **health service utilization metrics** (OP visits, IP admissions, bed occupancy)
- **Disease burden tracking** through ICD-10 coded diagnoses
- **Chronic disease prevalence** estimates for diabetes, hypertension
- **Mortality statistics** by cause

---

## 2. HDC Open Data Portal

### Overview
MOPH provides an Open Data Portal with downloadable datasets from HDC summary tables.

| Attribute | Value |
|-----------|-------|
| **Source** | MOPH Open Data |
| **URL** | https://opendata.moph.go.th |
| **Geographic Level** | National, Provincial, District |
| **Update Frequency** | Monthly/Annual |
| **Access Method** | Public web service and file download |

### Available Datasets for Yala

| Dataset | Description | Access |
|---------|-------------|--------|
| **Summary Data HDC** | Aggregated health indicators from HDC processing | Download via opendata.moph.go.th |
| **Hospital Coordinates** | GIS coordinates of health facilities by province | Web Service |
| **Map Service** | Provincial/district boundary maps | Web Service |
| **OP Service Utilization** | Outpatient visits per capita, monthly | Download |
| **Elderly Screening** | 9-dimension elderly screening data | Download |
| **Child Development (DSPM)** | Percentage of children 0-5 years with age-appropriate development | Download |

### Key Yala Data Points from Open Data
- **Population per health station (ratio):** 6,092 (2023) — Source: Yala Provincial Health Office
- **Population per bed (community hospitals):** 1,549 (2021)
- **Bed occupancy rate (community hospitals):** 115% (2021) — above national average, indicating high demand

### Dashboard Application
- **Health facility mapping** with GIS coordinates
- **Service utilization benchmarking** against national targets
- **Elderly and child health indicator tracking**

---

## 3. BOE 506 Surveillance for Yala

### Overview
The Bureau of Epidemiology (BOE) manages the national disease surveillance system (Report 506), covering approximately 65 notifiable diseases reported by all health facilities.

| Attribute | Value |
|-----------|-------|
| **Source** | Bureau of Epidemiology, DDC |
| **URL** | https://apps-doe.moph.go.th/boeeng/ |
| **Weekly Report URL** | https://wesr.boe.moph.go.th/wesr_new/ |
| **Geographic Level** | National, Regional, Provincial, District |
| **Update Frequency** | Weekly (real-time via DDS) |
| **Access Method** | Public website with annual reports |

### Annual Epidemiological Surveillance Reports (AESR)
Annual reports are published with comprehensive disease data:
- **2020 Report:** https://apps-doe.moph.go.th/boeeng/download/AW_AESR_2563_MIX.pdf
- **Weekly Epidemiological Surveillance Report:** https://wesr.boe.moph.go.th/wesr_new/

### Yala Key Disease Data (2020 Report)
- **Yala weekly reporting completeness:** 25 out of 52 weeks (2020) — lowest in Health Region 12, reflecting security/operational challenges
- **Population (2019):** 534,328 (265,894 male; 268,434 female)

### Notifiable Disease Categories Tracked
1. Dengue fever/DHF/DSS
2. Malaria
3. Chikungunya
4. Lymphatic filariasis
5. Scrub typhus
6. Zika virus
7. Food poisoning
8. Influenza
9. Tuberculosis
10. Leprosy
11. HIV/AIDS (through separate AIDS surveillance)
12. And 50+ additional conditions

### Dashboard Application
- **Weekly disease surveillance dashboard** with provincial rankings
- **Outbreak detection** through trend analysis
- **Epidemiological pattern analysis** for communicable diseases

---

## 4. Dengue in Yala

### Overview
Yala is consistently ranked among the top provinces for dengue fever incidence in Thailand, particularly during rainy season outbreaks.

| Attribute | Value |
|-----------|-------|
| **Source** | BOE Annual Report; DDC |
| **URL** | https://ddc.moph.go.th (Dengue situation reports) |
| **Geographic Level** | Provincial, District |
| **Update Frequency** | Weekly (real-time via DDS) |
| **Access Method** | Public reports |

### Key Data Points

| Year | Dengue Rate (per 100,000) | National Rank |
|------|--------------------------|---------------|
| 2019 | High (major outbreak year) | Top 10 |
| 2022 | 21.87 | #7 nationally |

- **2019 Outbreak:** 523 dengue patients in Yala from January–July, 3x the previous year's count; ranked #7 nationally and #1 in southern region (ReliefWeb, 2019)
- **Age distribution:** Highest incidence in children 10-14 years (724.78 per 100,000 in 2019 national data)
- **2019 national dengue data:** 131,157 cases (199.23 per 100,000), 142 deaths
- **Serotype distribution (2019):** Predominantly DEN-2 and DEN-1

### Yala Dengue Response
- Yala Emergency Dengue Fever Response Center activated during outbreaks
- "1 Search 3 Knocks" campaign: active case finding, household visits, school inspections
- Coordinated through Provincial Public Health Office (สสจ. ยะลา)

### Dashboard Application
- **Dengue risk mapping** with weekly updates
- **Seasonal outbreak prediction** using weather correlation models
- **Vector control activity monitoring**

---

## 5. Malaria in Yala

### Overview
Yala is one of four provinces in Health Region 12 that is **not yet certified malaria-free** (along with Narathiwat, Pattani, and Songkhla). The province borders Malaysia and has complex malaria epidemiology with both local transmission and cross-border movement factors.

| Attribute | Value |
|-----------|-------|
| **Source** | BVBD/DDC; PMI Thailand Malaria Profile |
| **URL** | https://malaria.ddc.moph.go.th |
| **Geographic Level** | Provincial, District, Village (A1/A2 classification) |
| **Update Frequency** | Real-time via Malaria Information System (MIS) |
| **Access Method** | MOPH internal; aggregated data in annual reports |

### Key Data Points

| Year | Yala Province Cases (PCD+ACD) | Bannang Sata District | Bajoh Subdistrict |
|------|------------------------------|----------------------|-------------------|
| 2013 | 4,040 | 776 | 37 |
| 2014 | 4,493 | 720 | 69 |
| 2015 | 1,743 | 501 | 127 |
| 2016 | 4,641 | 1,709 | 423 |
| 2017 | 5,900 | 2,236 | 425 |
| 2018 (Jan-Apr) | 805 | 348 | 21 |

- **API (Annual Parasite Incidence):** 0-5 per thousand (2020-2024 period) — classified as low transmission area
- **Bajoh Model:** Community-based malaria elimination pilot in Bannang Sata District successfully reduced cases through active case detection, community engagement, and SAO collaboration
- **1-3-7 Strategy:** Case notification within 1 day, investigation within 3 days, response within 7 days — feasible in Yala given low case numbers
- **Remaining pockets:** Border areas with Malaysia, forest-fringe communities

### Key Strategies
- Active case detection (ACD) in A1/A2 villages
- Collaboration with military medics for armed forces screening
- Long-lasting insecticidal net (LLIN) distribution
- Indoor residual spraying (IRS)
- Cross-border collaboration with Malaysian health authorities

### Dashboard Application
- **Malaria elimination progress tracking**
- **Village-level risk classification** (A1/A2/B)
- **ACD coverage monitoring**
- **Cross-border case mapping**

---

## 6. Measles/Vaccination in Yala

### Overview
The Deep South provinces including Yala have consistently faced measles outbreaks due to lower-than-target vaccination coverage, making this a priority area for immunization strengthening.

| Attribute | Value |
|-----------|-------|
| **Source** | DDC Measles Elimination Program; EPI-VPD Surveillance |
| **URL** | https://ddc.moph.go.th |
| **Geographic Level** | Provincial, District, Facility |
| **Update Frequency** | Weekly (outbreak); Annual (coverage) |
| **Access Method** | WHO EPI reports; DDC situation updates |

### Key Data Points

#### Measles Outbreaks
- **2018:** Yala had the highest measles incidence rate in Thailand (4 per 100,000); 10 deaths in Yala Province
- **2019:** Continued outbreaks; 125,000 emergency vaccine doses rushed to Yala, Pattani, Narathiwat, Songkhla (Oct-Dec)
- **2024 (Jan-Aug):** 3,962 suspected rash/fever cases nationally; 2,144 lab-confirmed; Pattani highest rate (127.94/100,000); Yala affected with school clusters
- **Deaths (2018):** 10 measles deaths in Yala Province — highest in southern region; cases ages 7 months to 14 years; most unvaccinated

#### Vaccination Coverage (Deep South Outbreak Areas)

| Vaccine | Coverage | National Target |
|---------|----------|-----------------|
| MMR1 | 50.50% | 95% |
| MMR2 | 39.77% | 95% |

- **2024 national MMR1 coverage:** 87.6%; MMR2: 86.5%
- **65 provinces** had MMR2 coverage below 95% standard
- **Root causes:** Vaccine hesitancy in some communities, access challenges in conflict-affected areas, misinformation

#### Response Measures
- National SIA (Supplementary Immunization Activity) planned Q4 2025 for children under 5
- Religious and community leader engagement
- VHV mobilization (over 1 million VHVs nationwide)
- School-entry vaccine checks

### Dashboard Application
- **Vaccination coverage mapping** by district/sub-district
- **Measles outbreak hotspot identification**
- **Immunization gap analysis** for targeted campaigns

---

## 7. NHSO Yala Data

### Overview
The National Health Security Office (NHSO) manages the Universal Coverage Scheme (UCS), which covers the majority of Yala's population. NHSO's UCInfo portal provides population registration and service utilization data.

| Attribute | Value |
|-----------|-------|
| **Source** | NHSO UCInfo |
| **URL** | https://ucinfo.nhso.go.th/ucinfo |
| **Geographic Level** | Provincial, Facility-level |
| **Update Frequency** | Monthly, Annual |
| **Access Method** | Public web portal (some reports require login) |

### Key Data Available

| Report | Description | URL |
|--------|-------------|-----|
| Population by area | UC beneficiaries by province/district | /RptRegisPop-1 |
| Population by age/sex | Demographic breakdown of UC members | /RptRegisPop-2 |
| Population by scheme | UC, SSS, CSMBS coverage by province | /RptRegisPop-3 |
| Population by facility | Beneficiaries registered at each facility | /RptRegisPop-4 |
| Capitation points | UC capitation budget calculation | /RptRegisPop-5 |
| Service utilization | OP/IP visits, procedures | Various reports |

### NHSO Capitation (FY 2022)
- **Total capitation per beneficiary:** 3,798.61 Baht/year
- **OP services:** 1,305.07 Baht/person/year
- **IP services:** 1,460.59 Baht/person/year
- **Health promotion & prevention:** 463.44 Baht/person/year
- **UC beneficiaries (2022):** 47.547 million nationally

### UCS Budget Components
- Medical Services Capitation: 158,294.42 million Baht
- Non-Capitation (specialized groups): 40,597.37 million Baht
  - HIV/AIDS: 3,768.11 million
  - Chronic kidney disease: 9,731.34 million
  - Chronic disease control: 1,154.78 million

### Dashboard Application
- **UC beneficiary registration tracking** by facility
- **Capitation budget monitoring** for Yala facilities
- **Service utilization analysis** by health scheme
- **Access and equity assessment**

---

## 8. Yala Hospital Data

### Overview
Yala Hospital (โรงพยาบาลยะลา) is the main referral hospital for Yala Province, classified as a **Regional Hospital** under MOPH.

| Attribute | Value |
|-----------|-------|
| **Source** | Yala Hospital; MOPH Health Resource Report |
| **URL** | https://www.yalahospital.go.th |
| **Geographic Level** | Facility-level |
| **Update Frequency** | Annual |
| **Access Method** | Hospital reports; MOPH Health Resource Statistics |

### Hospital Profile

| Indicator | Value | Year |
|-----------|-------|------|
| **Type** | Regional Hospital | - |
| **Beds** | 558 | 2024 |
| **Location** | 152 Siroros Rd., Mueang Yala District | - |
| **Health Code** | 11429 | - |
| **Established** | 1949 (as hospital); upgraded to Regional 1987 | - |
| **CPIRD Center** | Trains doctors for Prince of Songkla University | - |
| **Bed Occupancy Rate** | 64% (General Hospital, 2021) | 2021 |
| **Outpatients** | 54,129 | 2021 |
| **OP Visits** | 225,060 | 2021 |

### Specialized Services
- Cardiology, Oncology, Pediatrics, Orthopedics
- Dialysis, Rehabilitation, Dentistry
- 24-hour Emergency Department
- Spine Unit (established 2024)
- Smart Hospital certification (Silver level, 2025)

### Trauma/Conflict Role
Yala Hospital serves as the **primary receiving facility for mass casualties from the southern insurgency**. Between 2004-2008, the hospital declared 118 mass casualty responses. The emergency department handles blast injuries, gunshot wounds, and mass casualty incidents.

### Medical Specialists (2023)

| Specialty | Count |
|-----------|-------|
| Pediatrics | 17 |
| Surgery | 9 |
| Psychiatry | 9 |
| Ophthalmology | 8 |
| Orthopedic Surgery | 7 |
| Anesthesiology | 4 |
| Otolaryngology | 5 |
| Obstetrics & Gynecology | 6 |
| Radiology | 1 |

### Dashboard Application
- **Hospital performance indicators** (bed occupancy, average length of stay)
- **Trauma/emergency readiness monitoring**
- **Specialist capacity tracking**
- **Referral pattern analysis**

---

## 9. District Hospitals in Yala

### Overview
Yala Province has 8 districts, each with at least one community hospital providing secondary care and referring to Yala Hospital.

| Attribute | Value |
|-----------|-------|
| **Source** | MOPH Health Resource Report 2023 |
| **URL** | https://spd.moph.go.th |
| **Geographic Level** | District-level |
| **Update Frequency** | Annual |

### Community Hospitals in Yala (2023)

| Hospital | District | Beds | Health Code |
|----------|----------|------|-------------|
| **Bannang Sata Hospital** | Bannang Sata | 60 | 11432 |
| **Betong Hospital** | Betong | (data not in report) | - |
| **Kabang Hospital** | Kabang | 30 | 13806 |
| **Than To Hospital** | Than To | 36 | 11433 |
| **Yaha Hospital** | Yaha | (data available in THPH data) | - |
| **Krong Pinang Hospital** | Krong Pinang | (available) | - |
| **Raman Hospital** | Raman | (available) | - |
| **Siriroj Hospital** | Mueang Yala | 60 | Private (Siroros Rd.) |

### Community Hospital Statistics (Yala Province, 2021)

| Indicator | Value |
|-----------|-------|
| Total community hospital beds | 348 |
| Population per bed | 1,549 |
| Beds per doctor | 5 |
| Outpatients | 135,504 |
| OP Visits | 544,650 |
| Inpatients | 34,085 |
| Bed Occupancy Rate | 122% |
| Average Length of Stay | 4.5 days |

### Dashboard Application
- **District-level service capacity mapping**
- **Bed occupancy and utilization tracking**
- **Population-to-bed ratio monitoring**

---

## 10. Tambon Health Promotion Hospitals (THPH)

### Overview
Tambon Health Promotion Hospitals (รพ.สต. — โรงพยาบาลส่งเสริมสุขภาพตำบล) serve as the primary care units in Thailand's health system. Each sub-district (tambon) typically has at least one THPH.

| Attribute | Value |
|-----------|-------|
| **Source** | MOPH; Health Resource Report |
| **URL** | https://spd.moph.go.th |
| **Geographic Level** | Sub-district (Tambon) |
| **Update Frequency** | Annual |

### Yala THPH Statistics (2021)

| Indicator | Value |
|-----------|-------|
| **Number of THPHs (DHPHs)** | 81 |
| **Outpatients** | 210,466 |
| **OP Visits** | 707,722 |
| **Average Daily OP Visits** | 2,475 |
| **Coverage** | Average ~5,000 population per THPH |

### THPH Services
- Primary care consultations
- Health promotion and disease prevention
- Maternal and child health services
- Immunization (EPI)
- Chronic disease follow-up
- Basic dental care
- Mental health screening (2Q/9Q)
- Community health activities

### Dashboard Application
- **Primary care access mapping** at tambon level
- **OP service volume tracking**
- **Health screening coverage monitoring**

---

## 11. Health Region 12 Data

### Overview
Yala is part of **Health Network 12** (เขตบริการสุขภาพที่ 12), the southernmost health region covering 7 provinces.

| Attribute | Value |
|-----------|-------|
| **Source** | ODPC Region 12 (สคร. 12) |
| **Coverage** | Trang, Narathiwat, Pattani, Phatthalung, Yala, Songkhla, Satun |
| **Total Population (2023)** | 4,999,325 |

### Health Region 12 — Yala in Context (2023)

| Indicator | Yala | Health Region 12 |
|-----------|------|-----------------|
| Population | 546,355 | 4,999,325 |
| General Hospital Beds | 170 | 2,991 |
| Community Hospital Beds | 348 | 3,694 |
| Total Beds | ~518+ | 10,446 |
| THPHs | 81 | 800 |
| Doctors (Gen Hosp) | 21 | 509 |
| Nurses (Gen Hosp) | 146 | 2,833 |

### Key Comparison
- Yala has a **lower general hospital bed count** relative to population compared to other provinces in the region
- **Population per general hospital bed:** 3,170 (Yala) vs. 1,998 (Region 12 average)
- **Bed occupancy rate (community hospitals):** 115% (Yala, 2021) — among the highest in the region

### Disease Control Region 12
The Office of Disease Prevention and Control Region 12 (สคร. 12 สงขลา) coordinates disease surveillance and outbreak response for the region including Yala.

### Dashboard Application
- **Regional health resource benchmarking**
- **Cross-province disease surveillance**
- **Regional capacity planning**

---

## 12. Mental Health Data

### Overview
The conflict-affected Deep South has unique mental health challenges. The Department of Mental Health (DMH) operates the Violence-related Mental Health Surveillance (VMS) system and provides mental health services through Songkhla Rajanagarindra Psychiatric Hospital.

| Attribute | Value |
|-----------|-------|
| **Source** | DMH; Songkhla Rajanagarindra Psychiatric Hospital |
| **URL** | https://dmh.go.th; https://checkin.dmh.go.th |
| **Geographic Level** | Provincial, Individual (VMS) |
| **Update Frequency** | Real-time (Check-In); Annual reports |

### Key Data Points

#### Mental Health Epidemiological Study (Deep South, 2016)
- **Lifetime mental disorder prevalence:** 9.6%
- **12-month prevalence:** 3.4%
- **Highest category:** Substance use disorders (7.1%), with nicotine dependence (5.2%) most common
- **Treatment seeking:** Only 18.7% of those with disorders sought help; 8.3% consulted health professionals

#### Violence-Related Mental Health Surveillance (VMS)
- **Study population:** 13,467 people affected by unrest (2008-2017)
- **Sample:** 728 randomly selected
- **Key risk factors:** Gender, death of relatives, injury, being in the event, loss of home/property

#### Mental Health Check-In System
- **URL:** https://checkin.dmh.go.th
- **Dashboard:** https://checkin.dmh.go.th/dashboards
- **Screening tools:** 2Q (depression), 8Q, 9Q, 2Q+, RQ, Burnout, ST-5
- Used by VHVs and health staff for community mental health screening

#### Yala-Specific Mental Health Issues
- Drug abuse is a major issue contributing to mental health problems
- Sub-district hospitals refer mental health cases to district/provincial hospitals
- More drug rehabilitation centers needed (IOM 2024 assessment)
- Psychological services available in ~50% of assessed communities

#### DMH Facilities Serving Yala
- **Songkhla Rajanagarindra Psychiatric Hospital:** Regional psychiatric referral center
  - Address: 472 Saiburi Rd., Bo Yang, Mueang Songkhla
  - Phone: 074-317-400
- **DMH Service Search:** https://www.dmh.go.th/service/search.asp

### Dashboard Application
- **Community mental health screening results**
- **Conflict-related trauma tracking**
- **Suicide risk monitoring** (via 2Q+ screening)
- **Substance abuse prevalence tracking**

---

## 13. Health Workforce in Yala

### Overview
Health workforce data for Yala is available through the MOPH Health Resource Report, which provides detailed personnel counts by facility type.

| Attribute | Value |
|-----------|-------|
| **Source** | MOPH Strategy and Planning Division — Health Resource Report 2023 |
| **URL** | https://spd.moph.go.th/wp-content/uploads/2024/07/Report-Health-Resource-2023-670716.pdf |
| **Geographic Level** | Provincial, Facility-type |
| **Update Frequency** | Annual |

### Yala Health Workforce (2023)

#### General Hospital (Yala Hospital)

| Cadre | Count |
|-------|-------|
| Doctors | 21 |
| Dentists | 9 |
| Pharmacists | 12 |
| Professional Nurses | 146 |
| **Total** | **188** |

#### Community Hospitals (All District Hospitals)

| Cadre | Count |
|-------|-------|
| Doctors | 64 |
| Dentists | 24 |
| Pharmacists | 34 |
| Nurses | 361 |
| **Total** | **483** |

#### Private Hospitals

| Cadre | Full-time | Part-time |
|-------|-----------|-----------|
| Doctors | 13 | 61 |
| Nurses | 51 | 32 |
| **Total** | **69** | **97** |

### Key Ratios

| Ratio | Value | Assessment |
|-------|-------|------------|
| Population per doctor (community hospitals) | 2,906 | Better than national rural average |
| Population per doctor (general hospital) | 2,906 | 1:2,906 |
| Population per bed (community hospitals) | 1,549 (2021) | Moderate |
| Bed occupancy (community hospitals) | 122% (2021) | Very high demand |
| Bed occupancy (general hospital) | 64% (2021) | Moderate |

### Thailand National Comparison (2023)
- **National population per doctor:** 1,292
- **Yala general hospital:** 1 doctor per 2,906 population
- **Yala total beds (public):** ~518+ (Yala Hospital 558 + community hospitals 348)

### Dashboard Application
- **Health workforce gap analysis**
- **Population-to-provider ratio mapping**
- **Specialist availability tracking**
- **Workload indicators** (bed occupancy, outpatient volume)

---

## 14. Maternal & Child Health

### Overview
Maternal and child health data for Yala is collected through the HDC system, civil registration, and the NHSO.

| Attribute | Value |
|-----------|-------|
| **Source** | HDC; MOPH Public Health Statistics; Civil Registration |
| **URL** | https://hdcservice.moph.go.th; https://www.nso.go.th |
| **Geographic Level** | Provincial |
| **Update Frequency** | Annual |

### Key Data Points (2024)

| Indicator | Yala Value | Notes |
|-----------|-----------|-------|
| **Live Births** | 8,899 (2024) | 4,526 male; 4,373 female |
| **Birth Rate** | 16.2 per 1,000 | Higher than national average (~10) |
| **Maternal Mortality** | 0 deaths (2024) | 3 deaths in Pattani (neighboring) |
| **Infant Mortality** | 47 deaths | Rate: 5.3 per 1,000 live births |
| **Under-5 Mortality** | 67 deaths | Rate: 7.5 per 1,000 live births |
| **Stillbirth Rate** | - | Data available via HDC |
| **Neonatal Mortality** | - | Data available via HDC |
| **Antenatal Care Coverage** | >95% (estimated) | Standard Thai indicator |
| **MMR Vaccination (outbreak areas)** | 50.5% (MMR1) | Well below 95% target |

### Child Health — Development
- **DSPM (Developmental Screening):** Percentage of children 0-5 with age-appropriate development tracked via HDC
- **Pertussis:** Yala had pertussis incidence of 13.66 per thousand population (2024 data) — highest among Deep South provinces

### Maternal Health Dashboard (HISO)
- HISO provides data visualization for maternal mortality rate in Yala Province
- URL: https://www.hiso.or.th/mdg/en/visualize/Series.php

### Dashboard Application
- **Maternal mortality tracking**
- **Infant and under-5 mortality monitoring**
- **ANC coverage mapping**
- **Birth rate and fertility indicators**

---

## 15. Elderly Health Data

### Overview
Thailand's aging population is a national priority. The MOPH has designated specific initiatives for elderly health screening and care.

| Attribute | Value |
|-----------|-------|
| **Source** | MOPH Department of Health; HDC; Institute of Geriatric Medicine |
| **URL** | https://hdcservice.moph.go.th |
| **Geographic Level** | Provincial, Facility |
| **Update Frequency** | Annual |

### National Elderly Screening Data (2023) — Applicable to Yala

| Screening Type | Number Screened | Abnormal Findings |
|---------------|----------------|-------------------|
| Blood Sugar (Diabetes) | 4.41 million | 16.82% |
| Blood Pressure (Hypertension) | 6.13 million | 14.20% |
| Cardiovascular Risk | 3.19 million | 49.32% |
| Dementia Risk | 7.73 million | 2.75% had cognitive impairment |
| Osteoarthritis | 8.49 million | 5.69% |
| BMI | 6.29 million | 42.62% abnormal |
| Fall Risk | 8.48 million | 5.5% at risk |

### Older Person Clinics
- **853 older person clinics** established in hospitals nationwide
- Services: cancer treatment, heart disease, knee replacement, cataract surgery, chronic disease care
- **Comprehensive geriatric assessment** by multidisciplinary teams

### Elderly in Yala
- Yala Provincial Health Office participates in national elderly screening programs
- Data collected via **Bluebook Application** (national elderly health screening app)
- Chronic diseases are the most common health issue among elderly

### Top Diseases for Elderly Outpatient Visits (National, indicative for Yala)
1. Essential hypertension: 13.2 million visits
2. Non-insulin-dependent diabetes: 6.9 million visits
3. Lipid metabolism disorders: 6.2 million visits

### Dashboard Application
- **Elderly screening coverage tracking**
- **Chronic disease prevalence in elderly**
- **Dementia risk monitoring**
- **Long-term care needs assessment**

---

## 16. Health GIS

### Overview
Multiple GIS platforms provide health facility locations and service area mapping for Yala.

| Attribute | Value |
|-----------|-------|
| **Source** | MOPH GIS Health; MOPH Open Data |
| **URL** | https://gishealth.moph.go.th/healthmap |
| **Geographic Level** | Facility, District, Province |
| **Update Frequency** | Annual (resource data) |

### Available GIS Layers

| Layer | Description | Access |
|-------|-------------|--------|
| **Hospital locations** | Public and private hospital coordinates | gishealth.moph.go.th |
| **Health center locations** | THPH locations | gishealth.moph.go.th |
| **Bed capacity mapping** | Beds by facility | Health Resource Report |
| **Workforce distribution** | Personnel by facility | Health Resource Report |
| **Service area boundaries** | CUP (Contracting Unit for Primary Care) | MOPH internal |
| **Disease incidence maps** | Provincial disease distribution | DDS Dashboard |

### Digital Disease Surveillance (DDS) Dashboard
- **URL:** https://ddsdoe.ddc.moph.go.th/ddss/
- Provides disease situation mapping and business intelligence
- Open data dashboards for timeliness, coverage, disease prioritization, and disease situation

### MOPH Open Data Map Services
- **Health facility coordinates** by province code
- **Hospital locations** by province and district code
- **Map service** for health district boundaries

### Dashboard Application
- **Health facility accessibility mapping**
- **Service area/catchment area visualization**
- **Disease hotspot mapping**
- **Resource allocation planning**

---

## 17. Air Quality Data

### Overview
Yala has air quality monitoring through the national air quality monitoring network.

| Attribute | Value |
|-----------|-------|
| **Source** | air4thai; IQAir; AQI.in |
| **URL** | https://www.iqair.com/th-en/thailand/yala |
| **Geographic Level** | City-level (Yala Municipality) |
| **Update Frequency** | Real-time |
| **Access Method** | Public web/mobile apps |

### Yala Air Quality Data

- **2024 PM2.5 average:** ~20.9 ug/m3 (moderate)
- **Peak month:** September (transboundary haze from Indonesia)
- **Current AQI:** Typically 29-70 (Good to Moderate)
- **Comparison:** 54th out of Thai cities; 836th globally (2019 data)

### Air Quality Cities in Yala Province (Real-time)
| City | AQI (US) | Status |
|------|----------|--------|
| Yala | 70 | Moderate |
| Betong | 67 | Moderate |
| Ka Bang | 65 | Moderate |
| Than To | 64 | Moderate |
| Yaha | 64 | Moderate |
| Ban Nang Sata | 63 | Moderate |
| Krong Pi Nang | 63 | Moderate |
| Raman | 62 | Moderate |

### Dashboard Application
- **Real-time air quality monitoring**
- **Health alert system** for vulnerable populations
- **Respiratory disease correlation analysis**

---

## Data Sources Summary Table

| # | Health Indicator | Source | URL | Geographic Level | Update Frequency | Access Method |
|---|-----------------|--------|-----|-----------------|-----------------|---------------|
| 1 | All-cause mortality, disease diagnoses | HDC | hdcservice.moph.go.th | Province/District | Real-time | Login required |
| 2 | Hospital bed capacity, workforce | Health Resource Report | spd.moph.go.th | Province/Facility | Annual | Public PDF |
| 3 | Notifiable diseases (506) | BOE | apps-doe.moph.go.th | Province/District | Weekly | Public |
| 4 | Dengue incidence | BOE/DDC | ddc.moph.go.th | Province/District | Weekly | Public |
| 5 | Malaria cases/MIS | BVBD/DDC | malaria.ddc.moph.go.th | Province/Village | Real-time | MOPH internal |
| 6 | MMR vaccination coverage | DDC/EPI | ddc.moph.go.th | Province/District | Annual | Public reports |
| 7 | UC beneficiaries, service use | NHSO UCInfo | ucinfo.nhso.go.th | Province/Facility | Monthly | Public |
| 8 | Hospital statistics | Yala Hospital | yalahospital.go.th | Facility | Annual | Public |
| 9 | THPH service data | HDC/Health Resource | hdcservice.moph.go.th | Sub-district | Annual | Login |
| 10 | Mental health screening | DMH Check-In | checkin.dmh.go.th/dashboards | Province/Individual | Real-time | DMH admin |
| 11 | Health workforce ratios | Health Resource Report | spd.moph.go.th | Province | Annual | Public PDF |
| 12 | Maternal/child health | HDC/NSO | hdcservice.moph.go.th | Province | Annual | Login |
| 13 | Elderly screening | HDC/DOH | hdcservice.moph.go.th | Province | Annual | Login |
| 14 | Health facility GIS | GIS Health | gishealth.moph.go.th | Facility | Annual | Public |
| 15 | Air quality | IQAir/air4thai | iqair.com/th-en/thailand/yala | City | Real-time | Public |
| 16 | Disease surveillance dashboard | DDS | ddsdoe.ddc.moph.go.th/ddss/ | Province | Real-time | Public |
| 17 | Open data downloads | MOPH Open Data | opendata.moph.go.th | Province | Monthly | Public |
| 18 | HISO indicators | HISO | hiso.or.th/mdg/en/ | Province | Annual | Public |
| 19 | City municipality data | Yala City Data | citydata.in.th/yala-city-municipality | Municipality | Annual | Public |
| 20 | Population by health rights | NHSO | ucinfo.nhso.go.th | Province | Monthly | Public |

---

## Dashboard Application Recommendations

### Tier 1: High-Priority Dashboard Components (Readily Available Data)

| Component | Data Source | Update Frequency | Key Metrics |
|-----------|-------------|-----------------|-------------|
| **Disease Surveillance Panel** | BOE 506 / DDS | Weekly | Dengue rate, malaria cases, measles alerts, notifiable disease trends |
| **Hospital Performance Panel** | Health Resource Report / HDC | Monthly/Annual | Bed occupancy, OP/IP volumes, ALOS, workforce counts |
| **Vaccination Coverage Map** | DDC EPI / HDC | Annual | MMR1/MMR2 coverage by district, outbreak alerts |
| **Mental Health Screening** | DMH Check-In | Real-time | 2Q/9Q screening results, suicide risk flags |
| **Air Quality Monitor** | IQAir/air4thai | Real-time | PM2.5, AQI, health advisories |

### Tier 2: Medium-Priority Components (Requires Data Integration)

| Component | Data Source | Update Frequency | Key Metrics |
|-----------|-------------|-----------------|-------------|
| **Maternal & Child Health** | HDC / Civil Registration | Annual | Birth rate, infant mortality, ANC coverage |
| **Elderly Health Panel** | HDC / Bluebook App | Annual | Screening coverage, chronic disease prevalence, dementia risk |
| **Health GIS Mapping** | GIS Health / DDS | Annual/Weekly | Facility locations, service areas, disease hotspots |
| **NCD Burden Tracker** | HDC (CHRONIC/NCDSCREEN) | Annual | Diabetes, hypertension prevalence, screening coverage |

### Tier 3: Advanced Analytics (Requires System Integration)

| Component | Data Source | Update Frequency | Key Metrics |
|-----------|-------------|-----------------|-------------|
| **Predictive Disease Modeling** | DDS + Weather Data | Weekly | Dengue outbreak prediction, seasonal disease forecasting |
| **Health Equity Analysis** | NHSO + HDC | Annual | Coverage gaps by district, access inequality |
| **Conflict Health Impact** | VMS + Hospital Data | Annual | Trauma burden, mental health service demand |
| **Cross-Border Health** | BVBD + Immigration | Monthly | Malaria importation, disease screening at border |

---

## Key URLs Reference

| System | URL | Purpose |
|--------|-----|---------|
| HDC Service | https://hdcservice.moph.go.th | Central health data warehouse |
| MOPH Open Data | https://opendata.moph.go.th | Public data downloads |
| BOE Surveillance | https://apps-doe.moph.go.th/boeeng/ | Disease surveillance reports |
| Weekly Surveillance | https://wesr.boe.moph.go.th/wesr_new/ | Weekly epidemiological reports |
| NHSO UCInfo | https://ucinfo.nhso.go.th/ucinfo | Universal Coverage data |
| DDS Dashboard | https://ddsdoe.ddc.moph.go.th/ddss/ | Digital Disease Surveillance |
| DMH Check-In | https://checkin.dmh.go.th/dashboards | Mental health screening dashboard |
| GIS Health | https://gishealth.moph.go.th/healthmap | Health facility GIS |
| Yala Hospital | https://www.yalahospital.go.th | Provincial hospital |
| HISO | https://www.hiso.or.th/mdg/en/ | Health indicators visualization |
| Yala City Data | https://www.citydata.in.th/yala-city-municipality | Municipal data |
| Health Resource Report | https://spd.moph.go.th/wp-content/uploads/2024/07/Report-Health-Resource-2023-670716.pdf | 2023 Health Resource PDF |
| IQAir Yala | https://www.iqair.com/th-en/thailand/yala | Air quality monitoring |
| DDC | https://ddc.moph.go.th | Disease Control Department |
| Malaria Program | https://malaria.ddc.moph.go.th | Malaria elimination program |

---

## Data Limitations & Notes

1. **Security Constraints:** Some health data from conflict-affected areas may have reporting gaps due to security/operational challenges (e.g., 2020 weekly reporting completeness was only 25/52 weeks for Yala)
2. **Data Access:** HDC individual-level data requires MOPH authorization; only aggregated summaries are publicly available
3. **Private Sector:** Private hospital data may not be fully captured in public systems
4. **Migrant Populations:** Health data for non-Thai populations may be incomplete; IOM 2024 scoping estimated ~2,100 non-Thai residents in assessed Yala communities
5. **Timeliness:** Annual reports typically released mid-year for the previous fiscal year
6. **Yala Municipality-specific data:** Most data is available at provincial level; municipality-level disaggregation requires additional processing through HDC

---

## Yala Province Health Quick Reference (2023-2024)

| Indicator | Value |
|-----------|-------|
| **Population (2023)** | 546,355 |
| **Districts** | 8 (Mueang, Betong, Bannang Sata, Yaha, Raman, Than To, Kabang, Krong Pinang) |
| **Sub-districts (Tambon)** | 56 |
| **Main Hospital** | Yala Hospital (558 beds, Regional) |
| **District Hospitals** | 5+ community hospitals |
| **THPHs** | 81 |
| **Doctors (Gen Hosp)** | 21 |
| **Community Hospital Beds** | 348 |
| **Bed Occupancy (Community)** | 115% (2021) |
| **Birth Rate** | 16.2/1,000 |
| **Infant Mortality Rate** | 5.3/1,000 |
| **Dengue Rank (2022)** | #7 nationally |
| **Malaria Status** | Not yet malaria-free |
| **MMR1 Coverage** | ~50.5% (outbreak areas) |
| **HAI Health Rank (2022)** | #47 out of 77 provinces |
| **HAI Overall Rank (2022)** | #11 ("high") |
| **Poverty Rate (2021)** | 17.4% |

---

*Report compiled from 20+ web searches across MOPH, NHSO, BOE, DDC, DMH, HISO, and international sources. All URLs verified as of research date. For the most current data, please consult the live systems referenced above.*
