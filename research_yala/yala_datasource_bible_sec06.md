## 6. Health and Social Welfare Data

Yala Province's health data ecosystem spans four institutional layers: the Ministry of Public Health (MOPH) collects clinical and epidemiological data through the Health Data Center (HDC) and Bureau of Epidemiology (BOE); the National Health Security Office (NHSO) tracks Universal Coverage Scheme (UCS) enrollment and utilization; the Department of Mental Health (DMH) monitors psychological wellbeing in a conflict-affected population; and the Department of Disease Control (DDC) operates disease-specific surveillance. Health services are delivered through Health Region 12 (เขตบริการสุขภาพที่ 12), covering seven southern provinces with 4.99 million people.[^1^]

### 6.1 Health Information Systems

The MOPH Health Data Center (HDC) at `https://hdcservice.moph.go.th` collects standardized data from all public facilities through 43 standard data files (แฟ้มข้อมูล 43 แฟ้ม) covering demographics, outpatient (OP) and inpatient (IP) utilization, ICD-10-coded diagnoses, chronic disease records, maternal and child health, vaccination coverage, mortality, and disability.[^2^] Access is tiered: MOPH personnel query individual-level data through the HDC Service Portal; the public downloads aggregated indicators from `https://opendata.moph.go.th`. OP data updates within 15 days, IP data within 45 days of discharge. Geographic disaggregation runs from province to individual facility, though municipality-level extraction requires authorized access.[^2^]

The Bureau of Epidemiology (BOE) manages Report 506 surveillance covering approximately 65 notifiable diseases reported weekly by all health facilities, accessible at `https://apps-doe.moph.go.th/boeeng/` with weekly reports at `https://wesr.boe.moph.go.th/wesr_new/`.[^3^] The 2020 Annual Epidemiological Surveillance Report recorded Yala's weekly reporting completeness at 25 of 52 weeks — the lowest in Health Region 12, reflecting operational challenges in conflict-affected districts.[^3^]

The NHSO UCInfo portal at `https://ucinfo.nhso.go.th/ucinfo` provides UCS beneficiary data including population by area (`/RptRegisPop-1`), age and sex distribution (`/RptRegisPop-2`), scheme coverage (`/RptRegisPop-3`), facility registration (`/RptRegisPop-4`), and capitation budgets (`/RptRegisPop-5`).[^4^] For FY2022, total capitation was 3,798.61 THB per beneficiary annually — allocated as 1,305.07 THB for OP, 1,460.59 THB for IP, and 463.44 THB for health promotion.[^4^] Yala falls under Health Region 12 for budget allocation.

The Digital Disease Surveillance (DDS) platform at `https://ddsdoe.ddc.moph.go.th/ddss/` provides real-time reporting from 1,416-plus facilities, with weekly summaries, disease situation mapping, and open data layers.[^5^] For Yala, DDS serves as the primary early-warning system, with weekly notifications triggering automatic alerts to the Provincial Public Health Office (สสจ. ยะลา).[^5^]

| System | Administrator | Base URL | Data Scope | Update Frequency | Access Method |
|--------|--------------|----------|------------|------------------|---------------|
| HDC (43 files) | MOPH | hdcservice.moph.go.th | Diagnoses, services, chronic disease, maternal health, mortality | Near real-time | MOPH login; public summaries via opendata.moph.go.th [^2^] |
| BOE 506 | DDC/BOE | apps-doe.moph.go.th | ~65 notifiable diseases, weekly reports | Weekly | Public website and annual PDF [^3^] |
| NHSO UCInfo | NHSO | ucinfo.nhso.go.th | UCS registration, capitation, utilization | Monthly/Annual | Public web portal [^4^] |
| DDS Dashboard | DDC | ddsdoe.ddc.moph.go.th/ddss/ | 1,416+ facilities, outbreak alerts | Real-time/Weekly | Public dashboard [^5^] |
| Yala Hospital | MOPH | yalahospital.go.th | 558 beds, 64% occupancy, 225,060 OP (2021) | Annual | Hospital reports [^6^] |

These five systems are complementary: HDC provides the deepest clinical data but requires authorization; BOE 506 offers the most comprehensive infectious disease tracking with full public access; NHSO UCInfo links enrollment to financial flows; DDS delivers real-time outbreak alerts; and Yala Hospital publishes facility-level performance indicators. The recommended municipal access pathway begins with DDS for disease surveillance, NHSO UCInfo for population coverage, and the MOPH Open Data portal for aggregate indicators requiring no login.

### 6.2 Disease Priorities for Yala

**Dengue fever.** Yala ranked seventh nationally for dengue incidence in 2022 at 21.87 per 100,000.[^7^] The 2019 outbreak recorded 523 patients between January and July — triple the prior year's count — placing Yala first in the southern region. Highest incidence occurs in children aged 10–14 years. Serotype distribution was predominantly DEN-2 and DEN-1. Weekly case data is available through DDC at `https://ddc.moph.go.th`.[^7^]

**Measles and vaccination coverage.** In outbreak areas, MMR1 coverage stands at 50.5% and MMR2 at 39.8%, versus the 95% national target.[^8^] Yala had Thailand's highest measles incidence in 2018 at 4 per 100,000, with 10 deaths — the highest in the southern region. Most victims were unvaccinated children aged 7 months to 14 years. In response, 125,000 emergency vaccine doses were rushed to the Deep South in late 2019. A National Supplementary Immunization Activity is planned for Q4 2025.[^8^]

**Malaria.** Yala is one of four provinces in Health Region 12 not yet certified malaria-free. Cases peaked at 4,641 in 2016, declining to approximately 805 by early 2018.[^9^] The Annual Parasite Incidence for 2020–2024 was 0–5 per thousand (low-transmission). Remaining pockets concentrate in Malaysia-border districts and forest-fringe communities. The "Bajoh Model" community elimination pilot in Bannang Sata District demonstrated case reduction through active case detection and SAO collaboration. Village-level risk classification (A1/A2/B) is tracked at `https://malaria.ddc.moph.go.th`.[^9^]

**Mental health.** A 2016 Deep South study found 9.6% lifetime mental disorder prevalence and 3.4% twelve-month prevalence.[^10^] Substance use disorders were most common at 7.1%, with nicotine dependence at 5.2%. Only 18.7% of affected individuals sought help.[^10^] Yala Hospital employs 9 psychiatrists among 21 total doctors — roughly 1 psychiatrist per 60,700 residents. The DMH Check-In platform at `https://checkin.dmh.go.th` provides depression and suicide risk screening tools for community health volunteers.

| Disease/Condition | Key Metric (Yala) | National/Regional Context | Data Source | Access URL |
|-------------------|-------------------|---------------------------|-------------|------------|
| Dengue fever | 21.87/100,000 (2022); Rank #7 | 131,157 national cases (2019); ages 10-14 highest | BOE/DDC | ddc.moph.go.th [^7^] |
| Measles (MMR) | MMR1: 50.5%; MMR2: 39.8% (outbreak areas) | Target 95%; 10 Yala deaths (2018) | DDC/EPI | ddc.moph.go.th [^8^] |
| Malaria | 4,641 cases (2016) → ~805 (2018); API 0-5/1,000 | 1 of 4 Region 12 provinces not malaria-free | BVBD/DDC | malaria.ddc.moph.go.th [^9^] |
| Mental disorders | 9.6% lifetime prevalence; 9 psychiatrists | Treatment-seeking 18.7%; nicotine dependence 5.2% | DMH/VMS | checkin.dmh.go.th [^10^] |

These four priorities create distinct data integration demands. Dengue requires seasonal modeling correlated with rainfall (Chapter 9). Measles demands subdistrict-level coverage mapping to identify vaccine hesitancy pockets. Malaria elimination requires cross-border coordination with Malaysian authorities. Mental health — the most resource-constrained priority — needs integration with security incident data (Chapter 5) to map conflict-related trauma demand against the province's 81 Tambon Health Promotion Hospital locations.

### 6.3 Health Service Delivery Data

Yala Province operates at least five community hospitals across eight districts — Bannang Sata (60 beds), Kabang (30 beds), Than To (36 beds) — with 348 beds total.[^11^] In 2021, community hospitals recorded 544,650 OP visits, 34,085 inpatients, and 122% bed occupancy, signaling demand substantially exceeding capacity. Average length of stay was 4.5 days.[^11^] In contrast, Yala Hospital reported 64% occupancy with 225,060 OP visits — demand concentrates at the district level while the 558-bed referral hospital maintains spare capacity.[^6^] Yala Hospital holds Smart Hospital Silver certification and serves as the primary receiving facility for mass casualties from the southern insurgency.[^6^]

The 81 Tambon Health Promotion Hospitals (THPHs) form the primary care frontline, recording 707,722 OP visits in 2021 (approximately 2,475 per day).[^11^] Each THPH serves roughly 5,000–6,000 residents, providing consultations, maternal and child health, immunization, chronic disease follow-up, mental health screening (2Q/9Q), and community health activities.[^11^]

In 2024, Yala recorded 8,899 live births (birth rate 16.2 per 1,000, above the ~10 national average), infant mortality of 5.3 per 1,000, and zero maternal deaths.[^12^] Pertussis incidence was 13.66 per thousand — the highest among Deep South provinces. Child development is tracked through the DSPM module in HDC. Antenatal care coverage exceeds 95%.[^12^]

The 2023 MOPH Health Resource Report documents 188 personnel at Yala Hospital (21 doctors, 9 dentists, 12 pharmacists, 146 nurses) and 483 at community hospitals (64 doctors, 24 dentists, 34 pharmacists, 361 nurses).[^13^] The population-to-doctor ratio in community hospitals is 1:2,906 — better than the national rural average but masking severe specialist shortages: 9 psychiatrists and 1 radiologist for 546,355 people. The national population-per-doctor ratio is 1:1,292, placing Yala at roughly 55% of the national standard.[^13^]

| Service Level | Facilities | Beds/Bed Occupancy | Annual OP Visits | Key Workforce |
|---------------|-----------|--------------------|------------------|---------------|
| General Hospital (Yala Hospital) | 1 (Regional, 558 beds) | 64% occupancy (2021) | 225,060 (2021) | 21 doctors, 146 nurses, 9 psychiatrists [^6^] |
| Community Hospitals (5+ districts) | 5+ (348 beds total) | 122% occupancy (2021) | 544,650 (2021) | 64 doctors, 361 nurses [^11^] |
| THPHs (Primary Care) | 81 | N/A (OP only) | 707,722 (2021); ~2,475/day | Community health workers, nurses [^11^] |
| Maternal/Child Health (2024) | All levels | 0 maternal deaths; IMR 5.3/1,000 | 8,899 live births | Midwives, pediatricians [^12^] |

The 122% community hospital bed occupancy — the most critical metric in this dataset — indicates a system under severe demand pressure. Combined with 64% occupancy at Yala Hospital, this suggests a mismatch between where patients seek care and where capacity exists. Two data integration opportunities emerge. First, linking THPH volumes with DMH Check-In screening data could identify subdistricts where primary care demand is driven by conflict-related distress. Second, overlaying maternal health indicators (birth rate 16.2/1,000) with TPMAP poverty data (Chapter 4) enables targeting of maternal and child health interventions to the poorest households. The HDC's 43 standard files provide the technical infrastructure for both analyses, provided MOPH authorization for municipality-level extraction is obtained through the Provincial Health Office.

