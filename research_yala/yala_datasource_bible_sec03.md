## 3. Population and Demographic Data Sources

Accurate population and demographic data form the analytical foundation of municipal governance. For Yala City Municipality, this layer is complicated by the distinction between provincial and municipal jurisdictional boundaries, multiple population counting methodologies, and a distinctive sociocultural composition that demands culturally responsive service planning. This chapter catalogues the authoritative sources the municipality should integrate, organized by function: core population registration and census data (Section 3.1), poverty and welfare analytics (Section 3.2), and social and cultural demographic indicators (Section 3.3).

### 3.1 Population Registration and Census Data

The Department of Provincial Administration (DOPA, กรมการปกครอง) maintains Thailand's civil registration database. The public statistics portal at `stat.bora.dopa.go.th` provides real-time registered population data disaggregated by province, district (amphoe), subdistrict (tambon), and municipality [^1^]. For Yala Province, the 2024 registration totals 552,479 persons across 180,582 households; Yala City Municipality accounts for 61,315 registered persons (29,242 male / 32,073 female) [^2^]. Monthly and annual downloads are available in Excel format. Registration data reflects *de jure* (legal residence) rather than *de facto* (physical presence) population—a distinction that matters given Yala's cross-border labour mobility.

The DOPA API, accessible via the Government Data Exchange (GDX) at `api.egov.go.th/ws/dopa/`, provides four tiers of identity verification: simple profile (name, ID number, birth date), normal (+ address), full (+ demographic details), and extra (+ additional attributes), plus household registration queries [^3^]. Authentication requires OAuth 2.0 with DGA-issued credentials; all queries require citizen consent under PDPA.

The 2025 Population and Housing Census, conducted April 1–June 19, 2025, represents Thailand's first complete enumeration in 15 years. Provincial-level results for Yala are expected October–December 2025 [^4^]. Historical 2010 census microdata—a 1% sample of 538,463 cases with 83 variables—remains available through the ILO Microdata Repository and IHSN catalog [^5^]. For spatial analysis, WorldPop provides 100-metre resolution gridded population estimates with age/sex disaggregation for 2015–2030 projections via HDX and Google Earth Engine [^6^].

| Data Source | Base URL | Granularity | Update Frequency | Authentication | Primary Use Case |
|-------------|----------|-------------|------------------|----------------|------------------|
| DOPA Statistics Portal | `stat.bora.dopa.go.th` | Municipal | Monthly/Annual | None (public) | Real-time registered population counts [^1^] |
| DOPA API (GDX) | `api.egov.go.th/ws/dopa/` | Individual | Real-time | OAuth 2.0 + DGA Consumer-Key | Identity verification for e-services [^3^] |
| 2025 Census (NSO) | `nso.go.th/nsoweb/main/summano/aE` | Subdistrict | Decadal | None (public) | Comprehensive demographic baseline; expected Oct–Dec 2025 [^4^] |
| Census 2010 Microdata | `ilo.org/microdata` | Individual (1% sample) | Static | Free registration | Historical demographic analysis [^5^] |
| WorldPop Gridded | `hub.worldpop.org` | 100m grid | Annual projections | None (public) | Spatial population mapping [^6^] |

Table 1 presents the five primary population data sources. DOPA registration data should serve as the operational baseline, while the 2025 Census will provide the most comprehensive demographic profile upon release. WorldPop fills the spatial analysis gap at finer resolution than administrative boundaries permit.

### 3.2 Poverty and Social Welfare Data

The Thai People Map and Analytics Platform (TPMAP, ระบบสารสนเทศเพื่อการขจัดความยากจนแบบแม่นยำ), developed by NECTEC/NSTDA in partnership with NESDB, applies a Multidimensional Poverty Index (MPI) across five dimensions using 36 million individual records updated annually [^7^]. For Yala Province, TPMAP reports an MPI poverty rate of 20.83%, affecting 208,274 persons. The public dashboard at `tpmap.in.th` enables drill-down to tambon and village levels; registered officials can access household-level views through the TPMAP Logbook module.

The State Welfare Card programme, administered by the Ministry of Finance through the Low-Income Earner Registration (LIER) database, recorded 143,351 welfare card holders in Yala as of 2022, with 248,144 participants in the Khon La Khrueng co-payment programme [^8^]. District-level breakdowns are available through the Provincial Social Development and Human Security Office.

The NESDB Human Achievement Index (HAI) provides a composite benchmark across eight dimensions. Yala ranks 11th nationally with a score of 0.6617 ("High"), though this masks severe disparities: Employment ranks 6th and Transport 9th, while Education ranks 66th [^9^]. The HAI is published at `nesdc.go.th/main.php?filename=develop_hai`.

The Community Development Department (CDD, กรมการพัฒนาชุมชน) Basic Minimum Needs (BMN, จปฐ.) survey feeds TPMAP's MPI calculation. In 2024, CDD staff surveyed 102,076 households across Yala using 38 indicators across five categories [^10^]. Raw data is accessible through `ebmn.cdd.go.th` (government login); processed results appear on TPMAP.

| Data Source | Base URL | Key Indicators | Geographic Level | Access Method |
|-------------|----------|----------------|------------------|---------------|
| TPMAP | `tpmap.in.th` | MPI poverty rate (20.83%), 5 deprivation dimensions | Village | Public dashboard; TPMAP Logbook for officials [^7^] |
| Welfare Card / LIER | `yala.nso.go.th` (visualizations) | 143,351 card holders; 248,144 Khon La Khrueng participants | District | Provincial Social Development Office request [^8^] |
| NESDB HAI | `nesdc.go.th/main.php?filename=develop_hai` | 8-dimension composite; Yala rank 11th (0.6617) | Provincial | Public website [^9^] |
| CDD BMN (จปฐ.) | `ebmn.cdd.go.th` | 38 indicators; 102,076 households surveyed (2024) | Village | Government login; Provincial CDD Office [^10^] |

Table 2 consolidates Yala's four principal poverty and welfare data sources. These systems operate as an integrated pipeline: CDD BMN collects household data, TPMAP processes it into MPI scores, and welfare card eligibility derives from the same indicators. Yala Municipality should establish a quarterly review comparing TPMAP poverty maps with municipal service coverage to identify underserved tambon.

### 3.3 Social and Cultural Demographics

Yala's demographic profile demands culturally responsive planning. The province is 79.6% Muslim, predominantly from the Patani Malay community that speaks Jawi as a first language [^11^]. Approximately 3,900 mosques are registered nationally with significant Yala concentration; mosque locations function as both religious institutions and community service delivery points. The Provincial Islamic Council of Yala (สภาอิสลามจังหวัดยะลา) maintains institutional records, though no centralized online database exists. Municipal planners should coordinate with the Council, as mosque committees serve as effective channels for public health outreach and welfare dissemination.

Yala entered "Aged Society" status in 2023, with an aging index of 55.09 [^12^]. NSO Yala reports 76,338 elderly persons (13.89%), of whom 58,312 (79.64%) receive elderly allowance payments [^13^]. Critically, 7,601 elderly (10.86%) live alone and 2,590 elderly couples care for each other without external support. The municipality should expand its current elderly allowance dashboard to include predictive modelling using WorldPop age-cohort projections linked with DOPA trends.

The Department of Empowerment of Persons with Disabilities registers 14,236 persons with disabilities in Yala as of June 2022: physical disability 46.1% (6,563), hearing/communication 15.2% (2,158), and psychiatric/behavioural 12.1% (1,727) [^14^]. Persons aged 60+ account for 36.0% of registered persons with disabilities. The IOM 2024 scoping study identified approximately 2,100 non-Thai residents in Yala, primarily from Myanmar (~1,400) and Cambodia (~370), including approximately 130 Myanmar Muslims/Rohingya of whom 110 were undocumented [^15^]. The Betong Point of Entry records 400–500 crossings on weekdays and approximately 2,000 on weekends [^15^]. Academic research found that 4.1% of adults in the Southern Border Provinces undertook first international migration to Malaysia between 2014–2016, with historical migration patterns and insurgency impacts driving cumulative outmigration [^16^].

| Domain | Key Indicators | Data Source | Access Method |
|--------|---------------|-------------|---------------|
| Religious Demographics | 79.6% Muslim; ~3,900 mosques nationally | Provincial Islamic Council; Provincial Administration | Direct coordination with สภาอิสลามจังหวัดยะลา [^11^] |
| Aging Society | 76,338 elderly (13.89%); aging index 55.09 | NSO Yala; DOPA | `yala.nso.go.th/images/plan/Elder_2568_Analysis.pdf` [^12^] [^13^] |
| Disability | 14,236 registered PWDs; 46.1% physical | DEP / Provincial Social Development Office | Provincial Social Development Office request [^14^] |
| Migration & Cross-Border | ~2,100 non-Thai residents; Betong 400–2,000 crossings/day | IOM Thailand; Immigration Bureau; NSO | `thailand.iom.int` (2024 report) [^15^] [^16^] |

Table 3 summarizes the social and cultural demographic data sources. These domains require sensitive handling under PDPA, particularly in the Southern Border Provinces context. The municipality should use aggregated indicators for dashboard display and establish data-sharing protocols through formal memoranda of understanding. Integration priorities should follow a clear sequence: automate DOPA population pulls through GDX for a real-time baseline; layer TPMAP poverty maps with CDD BMN indicators for targeted intervention planning; incorporate aging projections and disability registration for predictive social service modelling.
