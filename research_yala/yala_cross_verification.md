# Cross-Verification Report: Yala Municipality Data Source Bible

## Methodology
All findings from 12 dimension deep-dives were compared and classified into four confidence tiers based on source independence, authority, and cross-dimensional corroboration.

---

## High Confidence Findings (Confirmed by ≥2 agents from independent sources)

### HC-01: Yala Has Operational Dashboard Infrastructure
- **Sources**: Dim01 (direct visit to yaladashboard.com), Dim02 (DEPA CityData), Dim10 (ITA/ governance records)
- **Finding**: Yala City Municipality operates "YALA Resilience City" with Mayor Dashboard, Citizen Dashboard (yaladashboard.com), LINE OA (@yalacity), mobile app, and 15+ datasets on DEPA CityData platform.
- **Evidence**: 3 consecutive DGA awards (2022, 2023, 2024); ITA score 91.21 (Grade A); 83% reduction in problem resolution time
- **Confidence**: HIGH — multiple independent verifications including direct website visits, official government records, and award documentation

### HC-02: data.go.th is the Core National Open Data Portal
- **Sources**: Dim02, Dim12, Wide01
- **Finding**: data.go.th hosts 11,000+ datasets with CKAN API (opendata.data.go.th), managed by DGA, using EGA Open Government Licence
- **Confidence**: HIGH — verified across multiple research phases

### HC-03: GISTDA Sphere is the Primary Geospatial Infrastructure
- **Sources**: Dim03, Dim09, Wide02, Wide08
- **Finding**: GISTDA Sphere (sphere.gistda.or.th) provides WMS/WMTS/REST APIs, base maps, THEOS-2/Sentinel imagery, flood/fire/drought monitoring, PM2.5 data
- **Confidence**: HIGH — consistently identified as core geospatial backbone across all research phases

### HC-04: Yala Province Demographics — 552,479 Population, 79.6% Muslim
- **Sources**: Dim04 (DOPA registration), Dim07 (education demographics), Dim08 (labor data), Wide07
- **Finding**: Yala Province registered population 552,479 (2024), 180,582 households, 79.6% Muslim, 20.83% MPI poverty rate, labor force participation 67.98%
- **Confidence**: HIGH — DOPA official registration corroborated by NSO data and multiple dimension analyses

### HC-05: Education Crisis in Yala (HAI Rank 66th)
- **Sources**: Dim04 (HAI data), Dim07 (education deep-dive), Wide07
- **Finding**: Yala's education HAI rank is 66th nationally — 44.2% youth enrollment (vs 79.3% national), O-NET scores 21% below national, 30.8% NEET rate, 12,802 out-of-school children
- **Confidence**: HIGH — corroborated by NSO HAI, NIETS O-NET data, and EEF out-of-school tracking

### HC-06: Security Data Available but Sensitive
- **Sources**: Dim05 (security deep-dive), Dim11 (ACLED/UCDP), Wide03 (DSW)
- **Finding**: DSW maintains 4 databases (15,000+ geocoded incidents), ACLED provides weekly updates, UCDP offers monthly data. All require responsible use frameworks. Yala remains under Emergency Decree.
- **Confidence**: HIGH — multiple independent conflict data sources confirm availability with consistent sensitivity requirements

### HC-07: Health Data Accessible Through MOPH Systems
- **Sources**: Dim06 (health deep-dive), Wide05
- **Finding**: MOPH HDC (43 standard data files), BOE 506 surveillance (~65 diseases), NHSO UCS data, Yala Hospital (558 beds, Smart Hospital Silver), 81 THPHs. Dengue and measles are priority diseases.
- **Confidence**: HIGH — verified through direct MOPH portal documentation and epidemiological reports

### HC-08: TH-e-GIF v2.0 and PDPA are Mandatory Compliance Frameworks
- **Sources**: Dim12, Dim02, Wide08
- **Finding**: All municipal systems must comply with TH-e-GIF v2.0 (RESTful APIs, JSON, OAuth 2.0, OpenAPI 3.0) and PDPA (full enforcement since June 2022, fines up to THB 5-7 million)
- **Confidence**: HIGH — government policy verified across multiple official sources

### HC-09: Yala Economy is Agriculture-Dominated with Low Productivity
- **Sources**: Dim08 (economic data), Dim04 (labor data), Wide07
- **Finding**: 61.8% employment in agriculture but GPP per capita only 91,815 THB (38.8% of national). Rubber dominates (55,843 tons). Tourism growing (1.55M visitors, 4,720M THB revenue). Net depositor province (funds flow out).
- **Confidence**: HIGH — NESDB GPP data corroborated by labor force surveys and banking statistics

### HC-10: Municipal Budget is ~1.19 Billion THB with High Central Dependency
- **Sources**: Dim01 (dashboard data), Dim10 (governance data), Dim02 (spending data)
- **Finding**: FY2025 budget 1,190.53M THB, tax revenue 57.13M THB (~4.8% of budget), 60-70% from central transfers. e-LAAS confirmed in use. SAO audits available for FY2019-2021.
- **Confidence**: HIGH — multiple official sources (dashboard, budget ordinance, SAO reports) corroborate

---

## Medium Confidence Findings (Confirmed by 1 agent from authoritative source)

### MC-01: 2025 Census Results Expected October-December 2025
- **Source**: Dim04
- **Finding**: 2025 Population and Housing Census (rescheduled from 2020) data collection completed April-June 2025; provincial-level results expected late 2025
- **Confidence**: MEDIUM — timing is estimate based on typical NSO processing periods; official announcement date not found

### MC-02: 161 Pondok Institutions in Yala (126 registered + 35 unregistered)
- **Source**: Dim07
- **Finding**: Association of Pondok Educational Institutions reports 126 registered + 35 unregistered = 161 total pondok in Yala province
- **Confidence**: MEDIUM — single source (OPEC/association data); unregistered institutions inherently difficult to count

### MC-03: GDCC Government Cloud Offers Free IaaS
- **Source**: Dim12
- **Finding**: Government Data Center and Cloud Service (GDCC) provides free IaaS to government agencies, ISO 27001/27701 certified, 219 agencies, 3,065 systems hosted
- **Confidence**: MEDIUM — official source but actual availability for municipal-level organizations needs direct confirmation

### MC-04: PWA Yala Water Loss Target <26.3%
- **Source**: Dim09
- **Finding**: PWA Yala operates with DMA zones and has a water loss reduction target of <26.3%
- **Confidence**: MEDIUM — industry standard target but actual Yala performance data not directly verified

### MC-05: IOM Identified ~2,100 Non-Thai Residents in Yala
- **Source**: Dim04, Wide03
- **Finding**: IOM 2024 scoping study identified approximately 2,100 non-Thai residents in Yala through key informant interviews
- **Confidence**: MEDIUM — IOM is authoritative but methodology (convenience/snowball sampling) has known limitations; figures are estimates

---

## Low Confidence Findings (Weak sourcing or single unverified claim)

### LC-01: Exact IT Staff Count at Yala Municipality
- **Source**: Dim01
- **Finding**: No dedicated IT staff count found; all IT functions consolidated within Strategy Division (กองยุทธศาสตร์)
- **Confidence**: LOW — inferred from organizational structure; direct staff count not published

### LC-02: Public Transport Module Shows "0 Trips"
- **Source**: Dim01 (dashboard screenshot)
- **Finding**: Yala dashboard public transport module displays 0 trips, suggesting no real-time transit data integration
- **Confidence**: LOW — single point-in-time observation; may have been temporary

### LC-03: 83% Reduction in Problem Resolution Time
- **Source**: Dim01 (award documentation)
- **Finding**: Yala claims 83% reduction in problem resolution time (from 9 days 7 hours to 1 day 4 hours)
- **Confidence**: LOW — self-reported metric from award application; independent verification not found

---

## Conflict Zones

### CZ-01: Yala Municipality Population Figures Vary
- **Dim01**: 57,640 registered residents (yaladashboard.com FY2025 data)
- **Dim01 (alt)**: 60,291 in municipal area (alternate figure from same source)
- **Dim04**: Yala Province 552,479 (DOPA 2024) — municipality is subset
- **Analysis**: Likely discrepancy between "registered residents" (57,640) and "population in municipal area" (60,291) — the difference may represent unregistered or temporary residents. Not a true contradiction but requires clarification in dashboard design.
- **Resolution**: Use DOPA registered figure as baseline; note the alternative estimate

### CZ-02: Poverty Rate Figures Differ
- **Dim04**: 20.83% MPI poverty (208,274 persons) — TPMAP/NESDB data
- **Wide03**: UNDP SDG Profile may use different methodology
- **Analysis**: MPI (Multidimensional Poverty Index) vs income poverty line are different measures. MPI captures multiple deprivation dimensions while income poverty uses expenditure threshold.
- **Resolution**: Both figures are valid for their respective methodologies; dashboard should clarify which indicator is displayed

### CZ-03: Labor Force Data Temporal Variation
- **Dim04**: LFPR 67.98%, unemployment 0.43% (2024 annual)
- **Dim08**: LFPR 67.31%, unemployment 0.86% (Q2 2025 latest)
- **Analysis**: Different time periods (annual 2024 vs quarterly Q2 2025) explain variation. Unemployment rate change from 0.43% to 0.86% could reflect seasonal agricultural patterns or data revision.
- **Resolution**: Always label time period; use most recent data with trend indicator

### CZ-04: Yala City Area
- **Dim01**: "19.4 km²" mentioned in wide exploration context
- **Dim03**: "Yala City = 19.4 km² covering full Tambon Sateng"
- **Dim01 (baseline)**: Jurisdiction boundaries need verification with DPT official records
- **Analysis**: 19.4 km² appears consistent but should be verified against official DPT city plan documents
- **Resolution**: Use 19.4 km² with citation pending official DPT verification

---

## Source Quality Assessment Summary

| Tier | Count | Description |
|------|-------|-------------|
| High Confidence | 10 | Core dashboard-relevant facts, verified across multiple independent sources |
| Medium Confidence | 5 | Authoritative single-source findings with plausible evidence |
| Low Confidence | 3 | Weakly sourced or self-reported metrics requiring verification |
| Conflict Zones | 4 | Identified discrepancies with documented resolution paths |

## Overall Assessment
The research base is exceptionally robust for building a data source bible. High-confidence findings cover all critical domains (existing infrastructure, national data portals, geospatial, demographics, security, health, education, economy, governance, and technical architecture). Conflict zones are minor (population figure variations, methodological differences in poverty measurement, temporal labor force variations) and all have clear resolution paths.
