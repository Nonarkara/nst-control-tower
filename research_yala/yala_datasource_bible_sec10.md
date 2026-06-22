## 10. Utilities and Infrastructure Data

Utility infrastructure data in Yala Municipality is distributed across several national agencies and one municipal bureau, with no consolidated API for water, electricity, or telecommunications. The Provincial Waterworks Authority (PWA — การประปานคร) operates the piped water supply, the Provincial Electricity Authority (PEA — การไฟฟ้าส่วนภูมิภาค) manages the distribution grid, and the National Broadcasting and Telecommunications Commission (NBTC — คณะกรรมการกิจการกิจการโทรคมนาคมแห่งชาติ) regulates telecoms. Each maintains its own data systems and access protocols, requiring municipal officers to navigate multiple portals and direct agency contacts.

### 10.1 Water and Electricity

#### 10.1.1 Provincial Waterworks Authority (PWA) Yala

PWA maintains 233 branch offices nationwide, providing piped water to 74 provinces (3.60 million households, 16.0 million population) [^1^]. PWA Yala Branch manages water production, distribution pipelines, and customer records. All branches deploy GIS-based pipeline management systems for asset tracking and hydrologic accounting. District Metering Area (DMA) zones with boundary flowmeters monitor water loss; PWA's national loss reduction target is below 26.30% for 2025 [^1^]. Yala Municipality's Water Supply Bureau (สำนักการประปา) operates separately, feeding consumption data into the Yala Smart City Dashboard. No public API exists for PWA data; access requires direct coordination with PWA Yala Branch or extraction from dashboard CSV downloads [^1^][^3^].

#### 10.1.2 PEA Area 3 (Southern Region)

PEA Area 3 (Southern Region) is headquartered at 59/27 Yala-Pattani Road, Yarang District, Pattani 94160, serving six provinces — Yala, Pattani, Narathiwat, Songkhla, Satun, and Phatthalung — through 68 offices [^4^][^5^]. PEA nationwide served 22.06 million customers in 2024 with 156,838 million kWh in sales; the Southern Region accounted for 17.32% of sales, growing 9.31% year-over-year [^5^]. PEA achieved 100% village electrification. For Yala, district-level consumption data is available through the EPPO electricity statistics portal and the PEA Smart Plus mobile app [^6^][^7^].

#### 10.1.3 Yala Dashboard Water Data

The Yala Smart City Dashboard water module tracks raw water turbidity (2.10 NTU), supply volume, and downloadable consumption datasets from the municipal Water Supply Bureau [^2^][^3^]. Coverage gap mapping, per-capita consumption trends, and water quality parameter histories remain underdeveloped. Officers seeking enhanced analytics must request internal reports from the Water Supply Bureau or aggregate PWA branch data separately.

#### 10.1.4 Smart Grid and Outage Data

PEA's smart meter rollout and outage notification system operate through the PEA Smart Plus platform [^7^]. Outage data aggregated at the provincial or municipal level is not publicly available; grid reliability metrics must be requested directly from PEA Area 3 headquarters. The PEA e-Service API is private and requires institutional access agreements [^4^].

| Data Source | Organization | Indicators Available | Update Frequency | Access Method | Geographic Coverage |
|-------------|-------------|---------------------|-----------------|---------------|-------------------|
| PWA Yala Branch | Provincial Waterworks Authority | Water production, consumption, pipeline GIS, DMA zones, loss rates | Daily production; periodic GIS | Direct contact; no public API [^1^] | Yala Municipality + surrounding districts |
| PEA Area 3 (Southern) | Provincial Electricity Authority | Electricity sales, distribution losses, customer count, outage notifications | Daily billing; monthly reports | PEA Smart Plus app; EPPO portal; direct request [^4^][^5^][^6^] | 6 southern provinces |
| Yala Smart City Dashboard — Water | Yala Municipality Water Supply Bureau | Water supply volume, turbidity (2.10 NTU), consumption datasets | Periodic CSV updates | CSV download via yaladashboard.com [^2^][^3^] | Yala Municipality only |
| PEA Smart Plus / e-Service | Provincial Electricity Authority | Individual usage history, outage alerts, billing | Real-time (app) | Mobile app; e-Service portal [^7^] | Individual customer-level |

The table above reveals a critical gap: operational utility data held by PWA and PEA at the branch level does not automatically flow into municipal analytics displayed on the Yala Dashboard. No programmatic API bridges these systems, requiring manual extraction and reconciliation.

### 10.2 Telecommunications and Digital Infrastructure

#### 10.2.1 Free Public WiFi

Yala Municipality operates 48 free public WiFi signal points across the city, branded "YALA Free Wi-Fi" and managed by Siam Innovation Company [^8^]. Usage statistics are available as downloadable datasets on the Yala Smart City Dashboard. Hotspot locations include Yala Central Mosque, Yala Cultural Centre, Yala Railway Station, municipal offices, and public parks [^8^]. Monthly usage reports are provided, though no real-time connection metrics or bandwidth utilization data is publicly accessible.

#### 10.2.2 Mobile Coverage

All three major operators — AIS (~44-46% market share, ~46.5 million subscribers), True Corporation (~38-40%, ~50 million subscribers post-DTAC merger), and National Telecom (NT) — provide 4G and 5G coverage in Yala [^9^]. National 4G population coverage exceeds 97-98% for the two major operators. nPerf crowdsourced maps show 4G as the standard in Yala with 5G limited to urban centers; Yala's flat terrain (elevation ~1.2 m) aids signal propagation [^9^]. Cell tower locations can be queried via CellMapper [^13^], though official site registration data is held by NBTC and not published at the tower level.

#### 10.2.3 NBTC Telecommunications Data

NBTC regulates spectrum allocation, coverage obligations, and infrastructure sharing frameworks, requiring service in all 77 provinces [^10^]. However, granular coverage maps, tower coordinates, and infrastructure sharing agreements are not published at the provincial level. Regulatory decisions appear as commission orders on the NBTC website. Municipal officers seeking telecom infrastructure data for urban planning should file information requests with NBTC's Office of the Secretary-General [^10^].

#### 10.2.4 Building Permits and Urban Planning

The Department of Public Works and Town and Country Planning (DPT — กรมโยธาธิการและผังเมือง) oversees building permits through the e-PP (Electronic Public Participation) system [^11^][^12^]. Under the Town Planning Act B.E. 2562 (2019), permits in municipal (Thesaban) areas are issued by the Municipal Office. No publicly aggregated building permit statistics for Yala were identified; officers must access records through Yala Municipal Office or the DPT Yala Provincial Office [^11^]. Building permit data has no public API and requires in-person or formal written request.

| Data Source | Organization | Indicators Available | Update Frequency | Access Method | Coverage |
|-------------|-------------|---------------------|-----------------|---------------|----------|
| YALA Free WiFi | Yala Municipality / Siam Innovation Company | 48 hotspot locations, usage statistics, connection counts | Monthly | CSV download via Yala Dashboard [^8^] | Yala Municipality |
| nPerf Coverage Maps | nPerf (crowdsourced) | 4G/5G signal strength by operator, speed test results | Hourly | Web portal; data purchase available [^9^] | Yala Province / Municipality |
| NBTC Regulatory Data | NBTC | Spectrum allocation, coverage obligations, infrastructure sharing rules | Ad hoc | NBTC website; direct request [^10^] | National (77 provinces) |
| DPT e-PP System | DPT | Town planning documents, building permit records | Monthly/Quarterly | e-PP portal; DPT office access required [^11^][^12^] | Yala Municipality |
| ISP Coverage Maps | AIS, True, NT, 3BB | Fixed broadband / fiber availability, speeds | Static | Provider websites [^16^][^17^] | Yala Municipality |

The telecommunications landscape follows a pattern characteristic of Thai municipalities: consumer-facing coverage tools (nPerf, provider websites) are readily accessible, while regulatory and planning data (NBTC tower locations, DPT permit statistics) remains siloed within agencies. For municipal planning, the most actionable sources are the Yala Dashboard WiFi usage datasets and nPerf's crowdsourced coverage maps, both providing georeferenced infrastructure performance data without inter-agency coordination [^8^][^9^]. Detailed telecom infrastructure planning and building permit analysis require direct engagement with NBTC and DPT respectively, as no public APIs or aggregated datasets exist for these domains at the municipal level [^10^][^11^].
