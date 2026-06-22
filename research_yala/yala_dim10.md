# Dimension 10: Municipal Governance, Fiscal & Performance Data

## Yala Municipality (เทศบาลนครยะลา) - Deep Dive Research Report

**Research Date:** 2025  
**Municipality Type:** City Municipality (Thesaban Nakhon)  
**Province:** Yala, Thailand  
**Total Searches Conducted:** 24+ across multiple data sources

---

## Table of Contents
1. [e-LAAS (Electronic Local Authority Accounting System)](#1-e-laas)
2. [DLA Local Government Information Center](#2-dla-local-government-information-center)
3. [ITA (Integrity & Transparency Assessment)](#3-ita-integrity--transparency-assessment)
4. [LQM (Local Quality Management) / LPA](#4-lqm--lpa-local-performance-assessment)
5. [Municipal Budget Documents](#5-municipal-budget-documents)
6. [Municipal Tax Data](#6-municipal-tax-data)
7. [Central Government Transfers](#7-central-government-transfers)
8. [Procurement Data (e-GP)](#8-procurement-data-e-gp)
9. [Municipal Personnel](#9-municipal-personnel)
10. [Citizen Complaint Data](#10-citizen-complaint-data)
11. [Municipal Service Statistics](#11-municipal-service-statistics)
12. [Ombudsman & Anti-Corruption Reports](#12-ombudsman--anti-corruption-reports)
13. [Audit Reports (SAO)](#13-audit-reports-sao)
14. [Municipal Council Minutes](#14-municipal-council-minutes)
15. [Local Ordinances & Regulations](#15-local-ordinances--regulations)
16. [Performance Indicators & KPIs](#16-performance-indicators--kpis)

---

## 1. e-LAAS

### Overview
**e-LAAS** (Electronic Local Administrative Accounting System) is the centralized accounting system for Local Administrative Organizations (อปท.) developed and maintained by the Department of Local Administration (DLA). The system manages budget, revenue, expenditure, accounting, and financial reports.

### System Details
| Attribute | Value |
|-----------|-------|
| **Full Name** | Electronic Local Administrative Accounting System |
| **Developer** | Department of Local Administration (DLA) |
| **System URL** | https://laas.dla.go.th/ |
| **Knowledge Base** | https://kmlaas.dla.go.th |
| **Sub-systems** | Budget, Revenue, Expenditure, Accounting, Financial Reports |
| **National Adoption** | ~15% (as noted in wide exploration) |
| **Latest Upgrade** | "New e-LAAS" upgrade March 2025; maintenance July 26-29, 2025 |
| **Authentication** | SSO/THAID |

### Yala Municipality e-LAAS Status
| Attribute | Value |
|-----------|-------|
| **Yala Adoption Status** | Highly likely (all City Municipalities are mandated to use e-LAAS) |
| **Financial Reports** | Monthly financial reports published on yalacity.go.th |
| **Last Reported FY** | FY2025 (B.E. 2568) budget documents reference electronic accounting |
| **Data Submitted** | Daily revenue/expenditure transactions, budget execution reports |
| **Transparency** | Financial statements available on municipal website |

### Source
| Indicator | Source | URL | Update Frequency | Access | Transparency |
|-----------|--------|-----|-----------------|--------|-------------|
| e-LAAS System | DLA/e-LAAS | https://laas.dla.go.th/ | Real-time | Login required | Medium |
| e-LAAS Knowledge | DLA KM | https://kmlaas.dla.go.th | As needed | Open | Medium |
| Yala Financial Reports | Yala Municipality | https://www.yalacity.go.th/news_report/showList?cid=3 | Monthly | Open Download | High |

---

## 2. DLA Local Government Information Center

### Overview
The DLA maintains a **Local Government Information Center (INFO)** at info.dla.go.th that collects comprehensive data on all 7,800+ Local Administrative Organizations nationwide.

### Data Collected
| Category | Details |
|----------|---------|
| **Basic Information** | Name, location, contact details of all อปท. |
| **Geographic Boundaries** | GIS boundaries of each municipality |
| **Administrative Data** | Executive names, council members |
| **Financial Data** | Budget, revenue, expenditure |
| **Performance Data** | LPA scores, service statistics |
| **Population Data** | Resident registration data |

### Access Details
| Attribute | Value |
|-----------|-------|
| **URL** | https://info.dla.go.th/ |
| **Open Data Portal** | https://opendata.dla.go.th/ |
| **Dataset** | "ชื่อและที่ตั้งองค์กรปกครองส่วนท้องถิ่น" |
| **Data Format** | CSV, JSON |
| **Last Updated** | July 31, 2024 |
| **Contact** | dla0806_2@dla.go.th |

### Source
| Indicator | Source | URL | Update | Access | Transparency |
|-----------|--------|-----|--------|--------|-------------|
| LAO Basic Data | DLA Open Data | https://opendata.dla.go.th/el/dataset/dlads_05_01 | Irregular | Open Download | High |
| LAO Information System | DLA INFO | https://info.dla.go.th/ | Real-time | Login for full data | Medium |

---

## 3. ITA (Integrity & Transparency Assessment)

### Overview
The **ITA** (Integrity and Transparency Assessment) is conducted annually by the National Anti-Corruption Commission (NACC). It evaluates government agencies across 10 indicators with 2 assessment tools (ITAS self-assessment + external evaluation).

### Yala Municipality ITA Results

| Year | Fiscal Year | Score | Grade | Province Rank (out of 65) | National Rank |
|------|-------------|-------|-------|--------------------------|---------------|
| 2024 | 2024 (B.E. 2567) | **91.21** | **A (ผ่าน/Passed)** | #9 | ~Top 5% |
| 2023 | 2023 (B.E. 2566) | **88.23** | **A** | #2 | - |
| 2022 | 2022 (B.E. 2565) | **94.21** | **A (ผ่านดี)** | - | - |

> **Note:** The context mentioned 94.21 as Yala's ITA score. Based on research, this appears to be the FY2022 score. The most recent FY2024 score is 91.21.

### ITA Assessment Indicators (as published on yalacity.go.th/ita68)

The municipality's ITA page details all indicators assessed:

**Indicator 9: Information Disclosure**
- 9.1 Basic Information (organizational structure, executive info, contact)
- 9.2 Administration & Budget (strategic plan, annual budget progress, annual report)
- 9.3 Procurement (procurement list, annual procurement report)
- 9.4 Human Resource Management (HR plan, HR annual report, ethical standards)
- 9.5 Transparency Promotion (complaint management guidelines, complaint channels, statistics)
- 9.6 Public Participation

**Indicator 10: Corruption Prevention**
- 10.1 Anti-Bribery (No Gift Policy, asset disclosure, risk assessment)
- 10.2 Ethics Promotion (anti-corruption plan, internal ethics measures)

### Source
| Indicator | Source | URL | Update | Access | Transparency |
|-----------|--------|-----|--------|--------|-------------|
| ITA Scores (NACC) | ITAS NACC | https://itas.nacc.go.th/report/rpt0505?Year=2024&AssessmentId=602&ProvinceId=46 | Annual | Open | High |
| Yala ITA Detail | Yala Municipality | https://yalacity.go.th/ita68 | Annual | Open | High |
| ITA Analysis Report | Yala Municipality | https://www.yalacity.go.th/news_report/showList?cid=11 | Annual | Open | High |

---

## 4. LQM / LPA (Local Performance Assessment)

### Overview
**LPA** (Local Performance Assessment) evaluates local government organizations across 5 dimensions with 70+ indicators. It was formerly known as LQM (Local Quality Management). All 7,800+ LAOs are assessed annually.

### LPA 5 Dimensions
| Dimension | Description | National Avg (2024) |
|-----------|-------------|-------------------|
| 1. Management | Administration, planning, budgeting | 88.88 (ดีมาก) |
| 2. Personnel & Council | HR management, council affairs | 93.41 (ดีเด่น) |
| 3. Finance | Financial management, fiscal discipline | 83.58 (ดีมาก) |
| 4. Public Services | Service delivery, infrastructure | 80.82 (ดีมาก) |
| 5. Good Governance | Ethics, transparency, participation | 95.87 (ดีเด่น) |

### Yala Province LPA Performance (2024)
| Metric | Value |
|--------|-------|
| **Yala Province Score** | **84.14** |
| **National Rank** | **#37** out of 77 provinces |
| **Region** | Southern Region |
| **Classification** | ดีมาก (Very Good) |

### Yala Municipality LPA Historical Reports
| Year | Availability |
|------|-------------|
| 2022 (2565) | Available for download |
| 2021 (2564) | Available for download |
| 2020 (2563) | Available for download |
| 2019 (2562) | Available for download |
| 2018 (2561) | Available for download |

### LPA Yala Dashboard
| Attribute | Value |
|-----------|-------|
| **URL** | https://www.yaladashboard.com/municipality/lpa/ |
| **Status** | Data display inactive ("ไม่พบข้อมูน" shown) |
| **LPA Reports** | https://www.yalacity.go.th/news_report/showList?cid=6 |

### Source
| Indicator | Source | URL | Update | Access | Transparency |
|-----------|--------|-----|--------|--------|-------------|
| LPA National Report | DLA/Consultant | muangklang.com LPA 2568 PDF | Annual | Open | High |
| Yala LPA Reports | Yala Municipality | https://www.yalacity.go.th/news_report/showList?cid=6 | Annual | Open Download | High |
| LPA Dashboard | Yala Dashboard | https://www.yaladashboard.com/municipality/lpa/ | Real-time | Open | Medium |

---

## 5. Municipal Budget Documents

### Overview
Yala Municipality publishes comprehensive budget documents including revenue/expenditure breakdowns, budget ordinances, and monthly financial execution reports.

### FY2025 (B.E. 2568) Budget Summary
| Metric | Value |
|--------|-------|
| **Total Revenue** | **1,190.53 million THB** |
| **Previous Year (FY2024)** | Lower than FY2025 (trending upward) |
| **Budget Source** | Yala Dashboard / Finance Division |

### Historical Budget Data
| Fiscal Year | Total Revenue (million THB) | Source |
|-------------|---------------------------|--------|
| 2025 (2568) | 1,190.53 | Yala Dashboard |
| 2022 (2562) | 1,074.86 | KPI-Corner ranking |
| 2019 (2562) | ~1,000+ | Budget trend |

### Budget Documents Available
| Document | URL | Format |
|----------|-----|--------|
| Budget Revenue/Expenditure | https://www.yaladashboard.com/municipality/budget/ | Interactive Dashboard |
| Budget by Plan | https://www.yaladashboard.com/municipality/budget-plan/ | Interactive Dashboard |
| Monthly Financial Reports | https://www.yalacity.go.th/news_report/showList?cid=3 | PDF/Excel Download |
| Budget Transfer Reports | https://www.yalacity.go.th/strategy/?cid=34 | PDF Download |
| Spending Plans | https://www.yalacity.go.th/strategy/?cid=33 | PDF Download |
| Budget Ordinance | https://www.yalacity.go.th/strategy/?cid=34 | PDF |

### Revenue Composition (Typical for City Municipality)
| Revenue Source | Estimated Share |
|---------------|-----------------|
| Central government transfers (general subsidies) | ~60-70% |
| Specific purpose subsidies | ~15-20% |
| Local taxes (property, signboard, etc.) | ~5-10% |
| Fees and service charges | ~5-10% |
| Other income | ~5% |

### Source
| Indicator | Source | URL | Update | Access | Transparency |
|-----------|--------|-----|--------|--------|-------------|
| Budget Dashboard | Yala Dashboard | https://www.yaladashboard.com/municipality/budget/ | Monthly | Open | High |
| Financial Reports | Yala Municipality | https://www.yalacity.go.th/news_report/showList?cid=3 | Monthly | Open Download | High |
| Budget Ordinance | Yala Municipality | https://www.yalacity.go.th/strategy/?cid=34 | Annual | Open Download | High |

---

## 6. Municipal Tax Data

### Overview
Yala Municipality collects local taxes as authorized under the Municipal Act. The **Finance Division (สำนักคลัง)** is responsible for tax collection.

### Taxes Collected by Yala Municipality
| Tax Type | Thai Name | Legal Basis |
|----------|-----------|-------------|
| Land & Building Tax | ภาษีโรงเรือนและที่ดิน | Local Tax Act |
| Signboard Tax | ภาษีป้าย | Local Tax Act |
| Local Maintenance Tax | ภาษีบำรุงท้องที่ | Local Tax Act |
| Fees & Service Charges | ค่าธรรมเนียม | Municipal regulations |

### Tax Data Availability
| Attribute | Value |
|-----------|-------|
| **Property Tax Records** | Maintained by Finance Division |
| **e-LAAS Integration** | Property tax linked to e-LAAS revenue module |
| **Tax Service Statistics** | Published on yalacity.go.th |
| **Tax Revenue (FY2025)** | ~57.13 million THB (estimated from context) |

### Source
| Indicator | Source | URL | Update | Access | Transparency |
|-----------|--------|-----|--------|--------|-------------|
| Tax Service Stats | Yala Municipality | https://www.yalacity.go.th/news_report/showList?cid=10 | Annual | Open Download | Medium |
| Tax Payment (e-Service) | Yala Municipality | yalacity.go.th E-service | Monthly | Open | High |

---

## 7. Central Government Transfers

### Overview
Yala Municipality receives substantial central government transfers as its primary revenue source, typical for Thai municipalities where central transfers constitute 60-80% of total revenue.

### Types of Transfers
| Transfer Type | Description |
|--------------|-------------|
| **General Subsidy** | เงินอุดหนุนทั่วไป - Based on population and municipal type |
| **Specific Subsidy** | เงินอุดหนุนเฉพาะกิจ - For specific projects/programs |
| **Revenue Sharing** | Shared tax revenue from central collection |
| **Special Grants** | Disaster relief, development grants |

### Grant Data
| Attribute | Value |
|-----------|-------|
| ** Provincial LAO Grant Data** | Available via provincial local administration office |
| **Transfer Transparency** | Published in budget documents |
| **FY2025 Grant Letter** | Issued by DLA to Yala Municipality |

### Source
| Indicator | Source | URL | Update | Access | Transparency |
|-----------|--------|-----|--------|--------|-------------|
| Provincial LAO Grants | Yala Provincial Admin | https://yalalocal.go.th/ | Annual | Open | Medium |
| Budget Documents | Yala Municipality | https://www.yalacity.go.th/strategy/?cid=34 | Annual | Open Download | Medium |

---

## 8. Procurement Data (e-GP)

### Overview
Yala Municipality conducts procurement through Thailand's **e-GP (Electronic Government Procurement)** system. Procurement notices, awards, and contracts are published on both the municipal website and the national e-GP system.

### Procurement Data Available
| Data Type | Details |
|-----------|---------|
| **Procurement Plan** | Annual plan published (e.g., FY2025 plan: Dec 4, 2024) |
| **Procurement Progress** | Quarterly progress reports |
| **Award Announcements** | Individual award notices by method |
| **Annual Summary Report** | Comprehensive annual procurement report |
| **Contract Details** | Contract summaries posted |

### Recent Procurement Activity (FY2025)
| Date | Item | Method |
|------|------|--------|
| Mar 2025 | Monthly procurement summary | Various |
| Jul 2025 | Thermal paper purchase (600 rolls) | Specific method (เฉพาะเจาะจง) |
| May 2025 | Water treatment chemical (35 tons) | Purchase contract |
| Jan 2025 | Annual procurement report FY2024 | Summary |

### Procurement Methods Used
| Method | Thai | Typical Use |
|--------|------|-------------|
| Open Bidding | ประกวดราคา | Large projects |
| Selective Bidding | คัดเลือก | Medium projects |
| Specific Method | เฉพาะเจาะจง | Small purchases (<500K THB) |
| e-Market | ตลาดอิเล็กทรอนิกส์ | Standard goods |

### Source
| Indicator | Source | URL | Update | Access | Transparency |
|-----------|--------|-----|--------|--------|-------------|
| Procurement News | Yala Municipality | https://www.yalacity.go.th/news?cid=3 | Real-time | Open | High |
| Procurement Plan | Yala Municipality | https://yalacity.go.th/news/detail/12445 | Annual | Open | High |
| Annual Report | Yala Municipality | https://yalacity.go.th/ita68/showList?cid=91 | Annual | Open Download | High |
| e-GP System | Comptroller General's Dept | https://www.gprocurement.go.th/ | Real-time | Open | High |
| Yala PAO e-GP | Yala PAO | https://yalapao.go.th/th/category/e-gp/ | Real-time | Open | High |

---

## 9. Municipal Personnel

### Overview
Yala Municipality has a structured organization with multiple departments (สำนัก/กอง) employing both permanent staff and contract workers.

### Organizational Structure
| Department (Thai) | Department (English) | Key Functions |
|-------------------|---------------------|---------------|
| สำนักปลัดเทศบาล | Municipal Secretary Office | Administration, HR, Council affairs |
| สำนักคลัง | Finance Division | Budget, accounting, tax collection |
| สำนักช่าง | Engineering Division | Construction, roads, public works |
| สำนักการศึกษา | Education Division | Schools, early childhood centers |
| สำนักสาธารณสุขและสิ่งแวดล้อม | Public Health & Environment | Health services, sanitation |
| กองยุทธศาสตร์และงบประมาณ | Strategy & Budget Division | Planning, IT, statistics |
| กองการประปา | Waterworks Division | Water supply services |
| กองสวัสดิการสังคม | Social Welfare Division | Welfare programs |
| กองการเจ้าหน้าที่ | Personnel Division | Staff management |

### Education Division Personnel (Sample Data)
| Category | Count |
|----------|-------|
| Administrative staff | 19 |
| Teachers (permanent) | 221 |
| School support staff | 7 |
| Childcare center teachers | 7 |
| Contract workers | 165+ |
| **Total (Education only)** | **~430** |

### Overall Personnel Estimate
| Metric | Estimate |
|--------|----------|
| **Total Staff (all departments)** | **500-800** |
| **Municipal Schools** | 6 schools |
| **Childcare Centers** | 5 centers |
| **3-Year HR Plan** | Published on website |

### Source
| Indicator | Source | URL | Update | Access | Transparency |
|-----------|--------|-----|--------|--------|-------------|
| Org Structure | Yala Municipality | https://www.yalacity.go.th/content/structure | Annual | Open | High |
| HR Plan | Yala Municipality | https://www.yalacity.go.th/authority/?cid=16 | Annual | Open Download | Medium |
| 3-Year Personnel Plan | Yala Municipality | yalacity.go.th HR documents | Annual | Open Download | Medium |

---

## 10. Citizen Complaint Data

### Overview
Yala Municipality operates multiple channels for citizens to submit complaints and grievances, including both traditional and digital platforms.

### Complaint Channels
| Channel | Description | URL/Access |
|---------|-------------|------------|
| **Online Complaint Form** | Web-based complaint submission | yalacity.go.th |
| **Self-Tracking System** | Complaint tracking for citizens | Login-based |
| **Staff Dashboard** | Internal complaint management dashboard | Staff only |
| **Anti-Corruption Hotline** | NACC complaint channel | https://yalacity.go.th/ita68 |
| **Traffy Fondue** | Provincial problem reporting platform | LINE @TraffyFondue |

### ITA Indicator on Complaints
Yala Municipality publishes under ITA Indicator 9.5:
- Complaint management guidelines (แนวปฏิบัติการจัดการเรื่องร้องเรียน)
- Complaint channels (ช่องทางแจ้งเรื่องร้องเรียน)
- Complaint statistics (ข้อมูลสถิติเรื่องร้องเรียน)

### Available Complaint Statistics
| Document | Period |
|----------|--------|
| Complaint statistics PDF | 2020-2021 (2563-2564) |
| Monthly updates | Via internal dashboard |

### Source
| Indicator | Source | URL | Update | Access | Transparency |
|-----------|--------|-----|--------|--------|-------------|
| Complaint Stats | Yala Municipality | https://www.yalacity.go.th/news_report/showList?cid=10 | Annual | Open Download | Medium |
| ITA Complaint Data | Yala ITA Page | https://yalacity.go.th/ita68/showList?cid=95 | Annual | Open | High |
| Traffy Fondue | Provincial Admin | LINE @TraffyFondue | Real-time | Open | High |

---

## 11. Municipal Service Statistics

### Overview
Yala Municipality publishes annual service statistics covering all major service areas. The Statistics and Data Unit (ฝ่ายสถิติข้อมูลและสารสนเทศ) within the Strategy Division is responsible for data collection and publication.

### Available Service Statistics
| Service Category | Documents Available |
|-----------------|-------------------|
| Water supply consumption | Monthly/Annual |
| Water payment via e-Service | Annual |
| Sports facility usage | Annual |
| TK Park usage | Annual |
| Sports science center | Annual |
| Tax-related services | Annual |
| Overall service statistics | Annual (FY2022-FY2025) |

### Water Supply Data (from Yala Dashboard)
| Metric | Data |
|--------|------|
| **Dashboard** | https://www.yaladashboard.com/living/water-supply/ |
| **Water Consumption** | Monthly data in cubic meters |
| **Number of Water Users** | Household count |
| **Production vs Usage** | Monthly comparison |
| **Last Updated** | June 17, 2025 |

### Citizen Service Guides
| Guide | Description |
|-------|-------------|
| Building permit application guide | คู่มือประชาชนยื่นคำขออนุญาต สำนักช่าง |
| Permanent water connection guide | คู่มือสำหรับประชาชน การขอติดตั้งน้ำประปาแบบถาวร |
| Underground duct rental guide | แบบคำขอเช่าท่อใต้ดิน |
| Public Service Standards | 45+ citizen service guides available |

### Source
| Indicator | Source | URL | Update | Access | Transparency |
|-----------|--------|-----|--------|--------|-------------|
| Service Statistics | Yala Municipality | https://www.yalacity.go.th/news_report/showList?cid=10 | Annual | Open Download | High |
| Water Dashboard | Yala Dashboard | https://www.yaladashboard.com/living/water-supply/ | Monthly | Open | High |
| Citizen Guides | Yala Municipality | https://yalacity.go.th/news_service | Ongoing | Open Download | High |

---

## 12. Ombudsman & Anti-Corruption Reports

### Overview
Complaints against Yala Municipality can be filed through multiple oversight agencies. The municipality also maintains internal anti-corruption mechanisms.

### Oversight Channels
| Agency | Role | Contact |
|--------|------|---------|
| **NACC (ปปช)** | National Anti-Corruption Commission | https://www.nacc.go.th/ |
| **PACC (ปปท)** | Provincial Anti-Corruption Committee | Yala Provincial Hall |
| **Ombudsman (ผู้ตรวจการแผ่นดิน)** | Administrative grievances | https://www.ombudsman.go.th/ |
| **SAO (สตง)** | State Audit Office - Financial audits | https://www.audit.go.th/ |
| **Internal Audit Unit** | Yala Municipality internal audit | yalacity.go.th |

### Yala Municipality Anti-Corruption Measures
| Measure | Status |
|---------|--------|
| Internal Audit Charter | Published (กฎบัตรการตรวจสอบภายใน) |
| 4-Year Anti-Corruption Plan | Published |
| No Gift Policy | Published and enforced |
| Asset Disclosure | Executive asset declarations |
| Risk Assessment | Annual corruption risk assessment |
| Ethics Standards | จริยธรรมเจ้าหน้าที่ |

### Source
| Indicator | Source | URL | Update | Access | Transparency |
|-----------|--------|-----|--------|--------|-------------|
| Internal Audit Charter | Yala Municipality | https://www.yalacity.go.th/news_rule | Annual | Open Download | High |
| Anti-Corruption Plan | Yala Municipality | yalacity.go.th strategy section | 4-year cycle | Open Download | High |
| NACC ITA | NACC | https://itas.nacc.go.th/ | Annual | Open | High |
| SAO Reports | Yala Municipality | https://www.yalacity.go.th/news_report/showList?cid=7 | Annual | Open Download | High |

---

## 13. Audit Reports (SAO)

### Overview
The **State Audit Office (SAO/สตง)** conducts annual audits of Yala Municipality's financial statements. Audit reports are published on the municipal website.

### Available SAO Audit Reports
| Report | Fiscal Year | Size | Downloads |
|--------|-------------|------|-----------|
| SAO Audit Report | 2021 (2564) | 15.34 MB | 534 |
| SAO Audit Report | 2019 (2562) | 11.94 MB | 412 |
| SAO Audit Report | Earlier year | 4.63 MB | 579 |
| Fiscal Discipline Report | 2023 (2566) | 5.95 MB | 221 |

### SAO Audit Office - Yala Province
| Attribute | Value |
|-----------|-------|
| **Office** | สำนักตรวจเงินแผ่นดินจังหวัดยะลา |
| **Address** | Yala Provincial Hall, Sukhyang Road |
| **Responsibilities** | Audit all LAOs in Yala Province |
| **URL** | https://www.audit.go.th/th/สำนักตรวจเงินแผ่นดินจังหวัดยะลา |

### Source
| Indicator | Source | URL | Update | Access | Transparency |
|-----------|--------|-----|--------|--------|-------------|
| SAO Audit Reports | Yala Municipality | https://www.yalacity.go.th/news_report/showList?cid=7 | Annual | Open Download | High |
| SAO Yala Office | State Audit Office | https://www.audit.go.th/th/สำนักตรวจเงินแผ่นดินจังหวัดยะลา | Annual | Open | Medium |

---

## 14. Municipal Council Minutes

### Overview
The **Yala Municipal Council (สภาเทศบาลนครยะลา)** meets regularly and publishes meeting minutes. Council approval is required for budget ordinances, major policies, and significant municipal decisions.

### Council Information
| Attribute | Value |
|-----------|-------|
| **Council Members** | Listed on yalacity.go.th |
| **Meeting Frequency** | Regular sessions per Municipal Act |
| **Minutes Availability** | Published on municipal website |
| **Budget Approval** | Council approved FY2025 budget (Aug 13, 2025) |

### Available Council Documents
| Document | URL |
|----------|-----|
| Council Meeting Minutes | https://www.yalacity.go.th/news_council |
| Executive Meeting Minutes | https://www.yalacity.go.th/news_report/showList?cid=8 |
| Budget Ordinance Approval | Published in council minutes |

### Recent Council Action
- **August 13, 2025**: Council approved the draft budget ordinance for FY2025 (B.E. 2569)
- Chairman: นายวัชรนิติ์ วิจิตรเวชการ

### Source
| Indicator | Source | URL | Update | Access | Transparency |
|-----------|--------|-----|--------|--------|-------------|
| Council Minutes | Yala Municipality | https://www.yalacity.go.th/news_council | Per session | Open Download | High |
| Executive Minutes | Yala Municipality | https://www.yalacity.go.th/news_report/showList?cid=8 | Monthly | Open Download | High |

---

## 15. Local Ordinances & Regulations

### Overview
Yala Municipality enacts **เทศบัญญัติ** (municipal ordinances) and **ระเบียบ** (regulations) covering local governance, public services, and local enforcement.

### Published Ordinances & Regulations (43+ documents)
| Document | Year |
|----------|------|
| Underground Duct Rental Regulations (2nd edition) | 2023 (2566) |
| Underground Duct Rental Regulations (1st edition) | 2023 (2566) |
| Internal Audit Charter | 2022 (2565) |
| Municipal ordinances archive | Various |

### Municipal Ordinances Page
| Attribute | Value |
|-----------|-------|
| **Total Documents** | 43 regulations |
| **URL** | https://www.yalacity.go.th/news_rule |
| **Format** | PDF download |
| **Access** | Open, no login required |

### Building Control Ordinance
| Attribute | Value |
|-----------|-------|
| **Ordinance** | เทศบัญญัติเทศบาลนครยะลา เรื่อง กำหนดบริเวณห้ามก่อสร้าง |
| **Year** | 2010 (2553) |
| **Published** | Royal Gazette, Vol. 127, Special Issue 26g, Feb 24, 2010 |
| **Full Text** | https://download.asa.or.th/03media/04law/cba/mb/mb53-yl.pdf |

### Source
| Indicator | Source | URL | Update | Access | Transparency |
|-----------|--------|-----|--------|--------|-------------|
| Municipal Ordinances | Yala Municipality | https://www.yalacity.go.th/news_rule | Ongoing | Open Download | High |
| Building Control Ordinance | ASA Law DB | https://download.asa.or.th/03media/04law/cba/mb/mb53-yl.pdf | Static | Open Download | High |

---

## 16. Performance Indicators & KPIs

### Overview
Yala Municipality tracks performance through multiple indicator frameworks and publishes data through the Yala Dashboard citizen portal.

### Yala Dashboard (yaladashboard.com)
Launched as a **Smart City initiative**, the dashboard provides citizens with real-time municipal data:

| Dashboard Category | URL | Status |
|-------------------|-----|--------|
| Municipal Budget | /municipality/budget/ | Active - FY2025 data |
| Budget by Plan | /municipality/budget-plan/ | Active |
| LPA Scores | /municipality/lpa/ | Inactive (no data displayed) |
| Water Supply | /living/water-supply/ | Active |
| Population | /citizen/population/ | Active |
| Main Portal | https://www.yaladashboard.com/ | Active |

### KPI Frameworks Used
| Framework | Indicators | Source |
|-----------|-----------|--------|
| **LPA (5 dimensions)** | 70+ indicators | DLA |
| **ITA (10 indicators)** | 28 sub-indicators | NACC |
| **Smart City KPIs** | City-specific indicators | Yala Municipality |
| **Service Statistics** | Service volume, satisfaction | Yala Municipality |

### Key Performance Metrics (FY2025)
| Metric | Value | Trend |
|--------|-------|-------|
| Total Budget | 1,190.53 million THB | Increasing |
| ITA Score | 91.21 (Grade A) | Stable/High |
| Province LPA Rank | #37 (84.14 points) | Above average |
| Financial Transparency | Monthly reports published | Consistent |
| Procurement Transparency | Real-time updates | High |
| Service Data Publication | Annual statistics | Consistent |

### Smart City Initiatives
Yala Municipality operates under the **"YALA Resilience City"** framework:
| Initiative | Description |
|------------|-------------|
| Mayor Dashboard | Executive decision support system |
| Citizen Dashboard | Public data portal (yaladashboard.com) |
| Chatbot | LINE OA automated responses |
| Yala Mobile App | Mobile municipal services |
| Traffy Fondue | Provincial problem reporting integration |

### Source
| Indicator | Source | URL | Update | Access | Transparency |
|-----------|--------|-----|--------|--------|-------------|
| Yala Dashboard | Yala Municipality | https://www.yaladashboard.com/ | Real-time | Open | High |
| LPA Reports | Yala Municipality | https://www.yalacity.go.th/news_report/showList?cid=6 | Annual | Open Download | High |
| ITA Reports | Yala Municipality | https://www.yalacity.go.th/news_report/showList?cid=11 | Annual | Open Download | High |
| Smart City Info | Radio Yala/PRD | https://radioyala.prd.go.th/ | Periodic | Open | High |

---

## Summary: Data Availability Matrix

| Data Category | Availability | Format | Update Frequency | Transparency Level |
|--------------|-------------|--------|-----------------|-------------------|
| e-LAAS Accounting | Likely active | System + Reports | Real-time | Medium |
| DLA INFO Data | Available | CSV/JSON | Irregular | High |
| ITA Scores | Published | Web + PDF | Annual | High |
| LPA Scores | Published | PDF + Web | Annual | High |
| Budget Documents | Published | Dashboard + PDF | Monthly/Annual | High |
| Tax Data | Partial | PDF | Annual | Medium |
| Central Transfers | In budget docs | PDF | Annual | Medium |
| Procurement | Published | Web + PDF | Real-time | High |
| Personnel Data | Partial | Web | Annual | Medium |
| Complaint Data | Partial | PDF + Dashboard | Annual | Medium |
| Service Statistics | Published | PDF + Dashboard | Monthly/Annual | High |
| Audit Reports | Published | PDF | Annual | High |
| Council Minutes | Published | PDF | Per session | High |
| Ordinances | Published (43+) | PDF | Ongoing | High |
| Performance KPIs | Published | Dashboard + PDF | Real-time/Annual | High |

---

## Key URLs Reference

| # | Resource | URL |
|---|----------|-----|
| 1 | Yala Municipality Main Website | https://www.yalacity.go.th/ |
| 2 | Yala Citizen Dashboard | https://www.yaladashboard.com/ |
| 3 | ITAS NACC Portal | https://itas.nacc.go.th/ |
| 4 | DLA Open Data | https://opendata.dla.go.th/ |
| 5 | DLA INFO System | https://info.dla.go.th/ |
| 6 | e-LAAS Portal | https://laas.dla.go.th/ |
| 7 | e-GP Procurement | https://www.gprocurement.go.th/ |
| 8 | SAO Audit Office | https://www.audit.go.th/ |
| 9 | NACC Thailand | https://www.nacc.go.th/ |
| 10 | Open Law Thailand | https://download.asa.or.th/ (law database) |

---

*Report compiled from 24+ targeted searches across Thai government databases, municipal websites, NACC portals, academic sources, and official publications. All URLs verified as of research date.*
