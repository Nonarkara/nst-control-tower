import type { DataDictionaryEntry } from "@nst/shared";

/**
 * Data Dictionary — plain-language reference for every indicator surfaced in
 * the Yala Knowledge Platform's Data Atlas.
 *
 * One entry per indicator across the nine atlas modules (demographics, fiscal,
 * outcomes, education, health, climate, economy, security, governance). Each
 * entry pairs the real indicator id, label, module id and source (taken
 * verbatim from apps/api/src/data/*.ts) with:
 *   - whatItMeans:  a plain-language explanation of the metric
 *   - howMeasured:  how the value is computed or collected
 *   - goodDirection: whether up / down / neutral is the desirable trend
 *   - caveats:      data-quality notes (jurisdiction mismatch, reference-only
 *                   fallback tier, aggregate-only framing, sparse series, etc.)
 *
 * Every atlas module ships at the "reference" fallback tier — values are static
 * figures digitized from the Yala Municipal Data Source Bible (Jun 2026), not
 * live feeds. That platform-wide caveat is noted per entry where it matters.
 */
export const DATA_DICTIONARY: DataDictionaryEntry[] = [
  // ── Population & Demographics ──────────────────────────────────────────────
  {
    indicatorId: "city-registered-pop",
    label: "City municipality population",
    module: "demographics",
    whatItMeans:
      "The number of people officially registered as residents of the Yala City Municipality — the small unit (Tambon Sateng, 19.4 km²) the dashboard actually governs, distinct from the much larger district and province.",
    howMeasured:
      "Civil-registration headcount of registered residents pulled from the Yala City Municipality registry published on yaladashboard.com.",
    goodDirection: "neutral",
    source: "Yala City Municipality Civil Registration (yaladashboard.com)",
    caveats:
      "City-jurisdiction figure (57,640), not the province (552,479) — do not conflate. Registry-based, so it counts registered residents rather than de-facto population. Slowly declining vs FY2024.",
  },
  {
    indicatorId: "province-registered-pop",
    label: "Provincial population",
    module: "demographics",
    whatItMeans:
      "Total registered population of Yala Province — the broader context the city sits inside.",
    howMeasured:
      "DOPA national population-registration count for 2024: 274,467 male + 278,012 female across 180,582 households.",
    goodDirection: "neutral",
    source: "DOPA Population Registration System (2024)",
    caveats:
      "Province-level, not the city the dashboard governs. Registration-based count.",
  },
  {
    indicatorId: "elderly-pop",
    label: "Elderly (60+)",
    module: "demographics",
    whatItMeans:
      "Number of people aged 60 and older in the province — a measure of how aged Yala's society has become.",
    howMeasured:
      "NSO elderly-analysis count of residents 60+ (76,338 = 13.89% of the province); aging index 55.09.",
    goodDirection: "neutral",
    source: "NSO Yala — Elderly Analysis Report (Elder 2568)",
    caveats:
      "Province-wide aggregate, not city-only. Yala has been classified an Aged Society since 2023.",
  },
  {
    indicatorId: "registered-disabilities",
    label: "Registered disabilities",
    module: "demographics",
    whatItMeans:
      "People who have formally registered a disability with the state, qualifying them for support — a lower bound on the true disabled population.",
    howMeasured:
      "Count of disability registrations held by MSDHS / the Provincial Social Development Office as of Jun 2022; physical disability is the largest type (46.1%).",
    goodDirection: "neutral",
    source: "MSDHS / Provincial Social Development Office (Jun 2022)",
    caveats:
      "Province-wide and registration-based — undercounts unregistered cases. 36% are aged 60+, so it overlaps the elderly group. 2022 vintage.",
  },
  {
    indicatorId: "pct-muslim",
    label: "Muslim population",
    module: "demographics",
    whatItMeans:
      "Share of the population that is Muslim — the majority Malay-speaking Patani Muslim community that defines much of Yala's social and educational context.",
    howMeasured:
      "Religious-composition share (79.6%) reported by the NSO Yala Provincial Statistics Office.",
    goodDirection: "neutral",
    source: "NSO Yala Provincial Statistics Office",
    caveats: "Provincial composition; stored as a percentage string, not a count.",
  },
  {
    indicatorId: "welfare-card-holders",
    label: "State welfare-card holders",
    module: "demographics",
    whatItMeans:
      "People enrolled in the national low-income welfare-card scheme — a practical proxy for poverty and economic vulnerability.",
    howMeasured:
      "Count of state-welfare-card registrants (Thai citizens 18+ with income ≤ 100,000 THB/yr) from the Ministry of Finance (FPO) cross-referenced with NSO Yala; 143,351 = 25.9% of the province.",
    goodDirection: "down",
    source: "Ministry of Finance (FPO) + NSO Yala — State Welfare Card",
    caveats:
      "Province-wide; a vulnerability proxy, not a poverty rate. Overlaps the elderly group (many elderly also hold cards). Excludes non-citizens and the under-18s.",
  },

  // ── Municipal Fiscal ──────────────────────────────────────────────────────
  {
    indicatorId: "fiscal-total-budget",
    label: "FY2025 total budget",
    module: "fiscal",
    whatItMeans:
      "The total money the Yala City Municipality planned to spend in fiscal year 2025 (฿1.20B) — the size of the city's purse.",
    howMeasured:
      "Budget-plan total (฿1,198,705,500) taken from the Yala Dashboard Budget Breakdown; the revenue side of the same plan is ฿1,190.53M.",
    goodDirection: "neutral",
    source:
      "Yala Municipal Data Bible · Dim01 (Dashboard Baseline) — yaladashboard.com Budget Breakdown",
    caveats:
      "Planned (budgeted) figure, not audited actual spend. City municipality only.",
  },
  {
    indicatorId: "fiscal-revenue",
    label: "FY2025 revenue",
    module: "fiscal",
    whatItMeans:
      "Total income the municipality expects to receive in FY2025 — taxes, fees, and central-government transfers combined.",
    howMeasured:
      "Revenue-side total (฿1,190.53M) from the Yala Dashboard / KPI-Corner ranking, up ฿115.67M from ฿1,074.86M in FY2022.",
    goodDirection: "up",
    source:
      "Yala Municipal Data Bible · Dim10 (Governance/Fiscal) — yaladashboard.com / Finance Bureau",
    caveats:
      "Only FY2022 and FY2025 endpoints are reported, so any trend between them is not measured.",
  },
  {
    indicatorId: "fiscal-tax-collected",
    label: "Local tax collected",
    module: "fiscal",
    whatItMeans:
      "Tax the city actually collected on its own (฿57.13M) — a sign of local fiscal capacity independent of central transfers.",
    howMeasured:
      "Finance Bureau actual collection (฿57.13M) compared against the ฿55.50M estimate, via the Yala Dashboard Tax Detail.",
    goodDirection: "up",
    source:
      "Yala Municipal Data Bible · Dim01 (Dashboard Baseline) — yaladashboard.com Budget Breakdown",
    caveats:
      "Local own-source tax only — a small slice of total revenue, most of which comes from central transfers.",
  },
  {
    indicatorId: "fiscal-central-transfers",
    label: "Central transfers",
    module: "fiscal",
    whatItMeans:
      "How dependent the city is on money sent down from the central government rather than raised locally.",
    howMeasured:
      "Qualitative share (general + specific subsidies estimated at 60–80% of revenue), typical for Thai city municipalities.",
    goodDirection: "neutral",
    source:
      "Yala Municipal Data Bible · Dim10 (Governance/Fiscal) — yaladashboard.com / Finance Bureau",
    caveats:
      "Stored as a range string ('60–80% of revenue'), not a precise figure; an estimate, not an audited number.",
  },

  // ── Development Outcomes ───────────────────────────────────────────────────
  {
    indicatorId: "mpi-poverty",
    label: "MPI poverty rate",
    module: "outcomes",
    whatItMeans:
      "Share of people who are poor across multiple dimensions (health, education, living standards, income), not just by income alone — a fuller picture of deprivation.",
    howMeasured:
      "Thai MPI computed by TPMAP (NESDB + NECTEC) for 2025: 208,274 multidimensionally poor persons over the provincial population = 20.83%.",
    goodDirection: "down",
    source: "TPMAP (NESDB + NECTEC), 2025",
    caveats: "Province-wide rate, not city-specific.",
  },
  {
    indicatorId: "poor-persons",
    label: "Persons in poverty",
    module: "outcomes",
    whatItMeans:
      "The headcount behind the MPI rate — how many people are multidimensionally poor.",
    howMeasured:
      "TPMAP target-population count of the multidimensional poor (208,274) for 2025.",
    goodDirection: "down",
    source: "TPMAP (NESDB + NECTEC), 2025",
    caveats:
      "Province-wide. The same population expressed as the MPI rate indicator — not an additional, separate group.",
  },
  {
    indicatorId: "household-income",
    label: "Avg household income",
    module: "outcomes",
    whatItMeans:
      "Typical monthly income per household — a direct read on living standards and the gap below the national average.",
    howMeasured:
      "NSO Socio-Economic Survey average monthly household income (฿19,182), benchmarked against the ฿28,308 national figure (~32% below).",
    goodDirection: "up",
    source: "NSO Yala / NSO SES, 2024–25",
    caveats:
      "Mixed vintages — Yala 2024 income compared against the 2025 national average. Survey-based estimate; province-level.",
  },
  {
    indicatorId: "hai-overall",
    label: "Human Achievement Index",
    module: "outcomes",
    whatItMeans:
      "A composite of human development across eight life dimensions, expressed as Yala's national rank — a single 'how is life here' summary.",
    howMeasured:
      "NESDB HAI 2022 overall index (0.6617, 'High'), placing Yala 11th of 77 provinces (lower rank = better).",
    goodDirection: "up",
    source: "NESDB HAI, 2022",
    caveats:
      "Strong overall rank is buoyed by employment & transport and masks a deep Education deficit (see hai-education). 2022 vintage; province-level.",
  },
  {
    indicatorId: "hai-education",
    label: "HAI — Education dimension",
    module: "outcomes",
    whatItMeans:
      "Yala's national rank on the education dimension of the Human Achievement Index — the weakest part of an otherwise strong overall score.",
    howMeasured:
      "NESDB HAI 2022 education sub-index national rank (66th of 77; lower rank = better).",
    goodDirection: "up",
    source: "NESDB HAI, 2022",
    caveats:
      "A rank, not an absolute score. The radar chart plots it as (78 − rank) so higher = better. 2022 vintage.",
  },
  {
    indicatorId: "youth-neet",
    label: "Youth NEET rate",
    module: "outcomes",
    whatItMeans:
      "Share of young people who are Not in Employment, Education or Training — disconnected youth at risk of long-term exclusion.",
    howMeasured:
      "ILO Youth Employment 2022 estimate (30.8%), among the highest in Thailand (national ≈ 13%).",
    goodDirection: "down",
    source: "ILO Youth Employment, 2022",
    caveats:
      "Province-level, 2022 vintage. Duplicated as the 'neet' indicator inside the education module.",
  },
  {
    indicatorId: "mental-health-prevalence",
    label: "Lifetime mental-disorder prevalence",
    module: "outcomes",
    whatItMeans:
      "Share of people who have experienced a diagnosable mental disorder at some point in life — and, behind it, how few of them get care.",
    howMeasured:
      "Deep South Mental Health epidemiological study (2016): 9.6% lifetime prevalence; only 18.7% sought help and 8.3% saw a health professional.",
    goodDirection: "down",
    source: "Deep South Mental Health Epidemiological Study, 2016",
    caveats:
      "2016 vintage and Deep-South / province-level. The same indicator id also appears in the health module (with a slightly different note).",
  },

  // ── Education & Human Development ─────────────────────────────────────────
  {
    indicatorId: "onet-p6",
    label: "O-NET P.6 (city avg)",
    module: "education",
    whatItMeans:
      "Standardized national test score for Grade 6 (Prathom 6) students in the city — a benchmark of basic-education quality.",
    howMeasured:
      "NIETS O-NET 2025 academic-year average for Yala City Municipality (31.7), benchmarked against the 35.38 national mean.",
    goodDirection: "up",
    source:
      "Yala Municipal Data Source Bible — Dimension 07 (Education & Cultural Institution Data)",
    caveats:
      "City-municipality average; the broader province scores lower (27.92). Stored without a unit (points out of 100).",
  },
  {
    indicatorId: "education-hai-rank",
    label: "Education HAI rank",
    module: "education",
    whatItMeans:
      "Yala's national standing on the education dimension of the Human Achievement Index — among the worst in Thailand.",
    howMeasured:
      "NESDC Human Achievement Index education-dimension rank (66th of 77).",
    goodDirection: "down",
    source:
      "Yala Municipal Data Source Bible — Dimension 07 (Education & Cultural Institution Data)",
    caveats:
      "A rank (lower is better), so goodDirection is encoded as 'down' here even though the same NESDB measure in the outcomes module is framed as a (78 − rank) score. Province-level.",
  },
  {
    indicatorId: "out-of-school",
    label: "Out-of-school children",
    module: "education",
    whatItMeans:
      "Number of children aged 3–18 who are not enrolled in any school — a direct count of educational exclusion.",
    howMeasured:
      "EEF 2024 count (12,802 in Yala), part of 78,314 across the five Southern Border Provinces.",
    goodDirection: "down",
    source:
      "Yala Municipal Data Source Bible — Dimension 07 (Education & Cultural Institution Data)",
    caveats: "Province-level, 2024 vintage.",
  },
  {
    indicatorId: "youth-enrollment",
    label: "Youth in education system",
    module: "education",
    whatItMeans:
      "Share of youth who are actually enrolled in the formal education system — fewer than half, far below the national rate.",
    howMeasured:
      "ILO/UNICEF 2022 enrollment share (44.2%), benchmarked against the 79.3% national rate.",
    goodDirection: "up",
    source:
      "Yala Municipal Data Source Bible — Dimension 07 (Education & Cultural Institution Data)",
    caveats:
      "Province-level, 2022 vintage. Does not count the large parallel Islamic (pondok) education system.",
  },
  {
    indicatorId: "neet",
    label: "Youth NEET rate",
    module: "education",
    whatItMeans:
      "Share of young people Not in Employment, Education or Training — disconnected youth.",
    howMeasured:
      "ILO/UNICEF 2022 estimate (30.8%), among the highest in Thailand.",
    goodDirection: "down",
    source:
      "Yala Municipal Data Source Bible — Dimension 07 (Education & Cultural Institution Data)",
    caveats:
      "Province-level, 2022 vintage. Same figure as the 'youth-neet' indicator in the outcomes module — counted once per module.",
  },
  {
    indicatorId: "pondok",
    label: "Pondok institutions",
    module: "education",
    whatItMeans:
      "Number of traditional Islamic boarding schools (pondok) — the parallel education system serving the Malay-Muslim majority.",
    howMeasured:
      "OPEC Yala 2024 count: 161 total = 126 registered + 35 unregistered.",
    goodDirection: "neutral",
    source:
      "Yala Municipal Data Source Bible — Dimension 07 (Education & Cultural Institution Data)",
    caveats:
      "35 institutions remain unregistered, so the registered count alone understates the system. Province-level.",
  },
  {
    indicatorId: "unesco-learning-city",
    label: "UNESCO Learning City",
    module: "education",
    whatItMeans:
      "Whether Yala holds UNESCO Learning City recognition — an external endorsement of its lifelong-learning agenda.",
    howMeasured:
      "Boolean status flag: Yala was admitted to the UNESCO Global Network of Learning Cities in 2024.",
    goodDirection: "neutral",
    source:
      "Yala Municipal Data Source Bible — Dimension 07 (Education & Cultural Institution Data)",
    caveats:
      "A yes/no recognition status, not a measured quantity; a bright spot that contrasts with the module's poor outcome metrics.",
  },

  // ── Health & Health Services ───────────────────────────────────────────────
  {
    indicatorId: "yala-hospital-beds",
    label: "Yala Hospital beds",
    module: "health",
    whatItMeans:
      "Inpatient capacity of the province's main regional hospital — the backbone of acute care for the whole area.",
    howMeasured:
      "Licensed bed count (558) for Yala Hospital (health code 11429); 64% bed occupancy reported for 2021.",
    goodDirection: "neutral",
    source: "Yala Municipal Data Source Bible — Dim06 Health (Jul 2025)",
    caveats: "Single-facility capacity; province-serving, not city-only.",
  },
  {
    indicatorId: "community-bed-occupancy",
    label: "Community-hospital bed occupancy",
    module: "health",
    whatItMeans:
      "How full community hospitals are; over 100% means patients are being placed in corridors — a sign of overstretched capacity.",
    howMeasured:
      "Occupancy ratio = inpatient days ÷ available bed-days for community hospitals (122% in 2021), among the highest in Health Region 12.",
    goodDirection: "down",
    source: "Yala Municipal Data Source Bible — Dim06 Health (Jul 2025)",
    caveats: "2021 vintage; aggregate across community hospitals, province-level.",
  },
  {
    indicatorId: "pop-per-gen-hosp-bed",
    label: "Population per general-hospital bed",
    module: "health",
    whatItMeans:
      "How many residents must share each general-hospital bed — a higher number means scarcer acute-care capacity.",
    howMeasured:
      "Provincial population ÷ general-hospital beds (3,170 people per bed in 2023), benchmarked against the Region-12 average of 1,998.",
    goodDirection: "down",
    source: "Yala Municipal Data Source Bible — Dim06 Health (Jul 2025)",
    caveats: "Province-level ratio; 2023 vintage.",
  },
  {
    indicatorId: "dengue-incidence",
    label: "Dengue incidence",
    module: "health",
    whatItMeans:
      "How common dengue fever is relative to population — a recurring, climate-sensitive disease burden in Yala.",
    howMeasured:
      "Reported dengue cases per 100,000 population (21.87 in 2022), ranked #7 of 77 provinces nationally.",
    goodDirection: "down",
    source: "Yala Municipal Data Source Bible — Dim06 Health (Jul 2025)",
    caveats:
      "2022 rate; province-level. Surveillance-based, so it reflects reported (not necessarily all) cases. Was #1 in the southern region during the 2019 outbreak.",
  },
  {
    indicatorId: "mental-health-prevalence",
    label: "Lifetime mental-disorder prevalence",
    module: "health",
    whatItMeans:
      "Share of people with a lifetime mental disorder, set against how thin local psychiatric capacity is.",
    howMeasured:
      "Deep-South conflict-trauma epidemiological study (2016): 9.6% lifetime prevalence; only 18.7% sought help against ~9 psychiatrists province-wide.",
    goodDirection: "down",
    source: "Yala Municipal Data Source Bible — Dim06 Health (Jul 2025)",
    caveats:
      "2016 vintage; Deep-South / province-level. Same indicator id appears in the outcomes module (different source attribution).",
  },
  {
    indicatorId: "covid-vaccination",
    label: "COVID-19 vaccination coverage",
    module: "health",
    whatItMeans:
      "Share of the population vaccinated against COVID-19 — a marker of immunization-program reach.",
    howMeasured:
      "Provincial COVID-19 vaccination coverage (85.62%) from MOPH reporting.",
    goodDirection: "up",
    source: "Yala Municipal Data Source Bible — Dim06 Health (Jul 2025)",
    caveats:
      "No reference year recorded on the indicator; province-level. Coverage definition (doses vs fully vaccinated) not specified.",
  },
  {
    indicatorId: "maternal-mortality",
    label: "Maternal mortality",
    module: "health",
    whatItMeans:
      "Deaths of mothers from pregnancy- or childbirth-related causes — a sensitive indicator of maternal-care quality.",
    howMeasured:
      "Count of maternal deaths recorded in 2024 (zero), contrasted with 3 in neighbouring Pattani.",
    goodDirection: "down",
    source: "Yala Municipal Data Source Bible — Dim06 Health (Jul 2025)",
    caveats:
      "A single-year count (0 in 2024), not a rate — small numbers are volatile year to year. Province-level.",
  },
  {
    indicatorId: "infant-mortality",
    label: "Infant mortality rate",
    module: "health",
    whatItMeans:
      "Deaths of infants before age 1 per 1,000 live births — a core measure of child health and health-system performance.",
    howMeasured:
      "47 infant deaths ÷ 8,899 live births in 2024 = 5.3 per 1,000.",
    goodDirection: "down",
    source: "Yala Municipal Data Source Bible — Dim06 Health (Jul 2025)",
    caveats: "Province-level; 2024 vintage.",
  },
  {
    indicatorId: "pm25",
    label: "PM2.5 annual average",
    module: "health",
    whatItMeans:
      "Average concentration of fine particulate air pollution — the pollutant most linked to respiratory and cardiovascular harm.",
    howMeasured:
      "Annual-mean PM2.5 concentration (20.9 µg/m³, 2024) from air-quality monitoring; peaks in September from transboundary haze.",
    goodDirection: "down",
    source: "Yala Municipal Data Source Bible — Dim06 Health (Jul 2025)",
    caveats:
      "Annual average hides September haze peaks driven by transboundary smoke from Indonesia. Province-level; 2024 vintage.",
  },

  // ── Climate, Water & Flood ─────────────────────────────────────────────────
  {
    indicatorId: "bang-lang-storage",
    label: "Bang Lang Dam storage",
    module: "climate",
    whatItMeans:
      "The water-storage capacity of Bang Lang Dam — the structure that governs both flood control and dry-season water supply for the basin.",
    howMeasured:
      "Reservoir storage capacity (1,420 million cubic metres) of the earth-core rockfill dam in Bannang Sata District (85 m high, ~50 km² surface).",
    goodDirection: "neutral",
    source: "RID / ThaiWater.net — Pattani River Basin & Bang Lang Dam (Dim 09 §8)",
    caveats:
      "Design/structural capacity, not current live storage; the live FLOOD lens carries real-time levels.",
  },
  {
    indicatorId: "bang-lang-capacity",
    label: "Bang Lang hydropower",
    module: "climate",
    whatItMeans:
      "Electricity-generating capacity of the dam — Yala's main renewable-power asset.",
    howMeasured:
      "Installed capacity (72 MW = 3 × 28 MW Francis turbines, EGAT), generating ~289 GWh/yr.",
    goodDirection: "up",
    source: "RID / ThaiWater.net — Pattani River Basin & Bang Lang Dam (Dim 09 §8)",
    caveats: "Nameplate capacity, not actual generation, which varies with reservoir level.",
  },
  {
    indicatorId: "pattani-basin-area",
    label: "Pattani River basin",
    module: "climate",
    whatItMeans:
      "The land area that drains into the Pattani River — the catchment whose rainfall and runoff drive Yala's flood risk.",
    howMeasured:
      "Basin drainage area (3,805 km²) spanning Yala and Pattani; ~715,000 people live in it, with 1,500–2,200 mm/yr of rainfall.",
    goodDirection: "neutral",
    source: "RID / ThaiWater.net — Pattani River Basin & Bang Lang Dam (Dim 09 §8)",
    caveats: "Spans two provinces, so it is not a Yala-only figure.",
  },
  {
    indicatorId: "pattani-river-length",
    label: "Pattani River length",
    module: "climate",
    whatItMeans:
      "Length of the Pattani River — the longest river on the Thai-Malay peninsula and the spine of the local water system.",
    howMeasured: "Channel length (214 km) of the Pattani River.",
    goodDirection: "neutral",
    source: "RID / ThaiWater.net — Pattani River Basin & Bang Lang Dam (Dim 09 §8)",
    caveats: "A fixed geographic constant; spans Yala and Pattani provinces.",
  },
  {
    indicatorId: "wettest-month",
    label: "Wettest month (Nov)",
    module: "climate",
    whatItMeans:
      "How much rain falls in November, Yala's wettest month — the monsoon peak that drives most flooding.",
    howMeasured:
      "November mean monthly rainfall (~312 mm / 12.3 in) from rainfall climatology; the driest month, February, is ~28 mm, with peak wet-day probability 73% on Nov 9.",
    goodDirection: "neutral",
    source: "TMD / CHIRPS Yala rainfall climatology (Dim 09 §6)",
    caveats:
      "Climatological average for one month, not a single observed year. The paired rainfall area chart only encodes the Feb trough and Nov peak — intermediate months are not digitized.",
  },
  {
    indicatorId: "carbon-absorption",
    label: "Carbon absorption",
    module: "climate",
    whatItMeans:
      "How much CO₂ the city's green areas capture each year — a measure of natural climate mitigation.",
    howMeasured:
      "Estimated CO₂ sequestration capacity of municipal green areas (10,630.87 tCO2e) from the Yala Smart City Dashboard, summed across individual parks.",
    goodDirection: "up",
    source: "Yala Smart City Dashboard / Water Supply Bureau (Dim 09 §1)",
    caveats:
      "A modelled capacity estimate, not measured flux. City-municipality scope.",
  },
  {
    indicatorId: "green-space-per-capita",
    label: "Green space / capita",
    module: "climate",
    whatItMeans:
      "Square metres of green space per resident — a livability and heat-resilience indicator.",
    howMeasured:
      "Municipal green-area ÷ city population (15.95 m²/capita), compared against the WHO 9 m²/capita guideline.",
    goodDirection: "up",
    source: "Yala Smart City Dashboard / Water Supply Bureau (Dim 09 §1)",
    caveats:
      "City-municipality scope; depends on the green-area definition and the population denominator used.",
  },

  // ── Economy, Labor & Agriculture ──────────────────────────────────────────
  {
    indicatorId: "gpp-per-capita",
    label: "GPP per capita",
    module: "economy",
    whatItMeans:
      "Average economic output per person — Yala's headline measure of prosperity, far below the national figure.",
    howMeasured:
      "Gross Provincial Product ÷ population (฿91,815/yr, 2018 constant prices = 38.8% of the ฿236,815 national average); Yala GPP ≈ 43,006 M฿.",
    goodDirection: "up",
    source: "NESDB / NESDC GPP Dashboard (GD Catalog)",
    caveats:
      "2018 vintage (the latest available), at constant prices; an average that hides distribution. Province-level.",
  },
  {
    indicatorId: "labor-force",
    label: "Labor force",
    module: "economy",
    whatItMeans:
      "Number of people working or actively seeking work — the active economic population.",
    howMeasured:
      "NSO Labor Force Survey Q2 2025: 260,942 in the labor force out of 387,677 aged 15+ (67.31% participation).",
    goodDirection: "up",
    source: "NSO Labor Force Survey — Yala Provincial Office",
    caveats: "Survey-based estimate; province-level; single-quarter (Q2 2025) snapshot.",
  },
  {
    indicatorId: "unemployment",
    label: "Unemployment rate",
    module: "economy",
    whatItMeans:
      "Share of the labor force without work but seeking it — a near-zero figure that hides a deeper problem.",
    howMeasured:
      "NSO LFS Q2 2025: 2,234 unemployed ÷ 260,942 labor force = 0.86%.",
    goodDirection: "down",
    source: "NSO Labor Force Survey — Yala Provincial Office",
    caveats:
      "The low rate masks heavy underemployment in the informal sector (see informal-workers). Survey-based; single quarter; province-level.",
  },
  {
    indicatorId: "informal-workers",
    label: "Informal workers",
    module: "economy",
    whatItMeans:
      "Workers without formal social protection — the dominant employment form, exposing most of the workforce to economic shocks.",
    howMeasured:
      "Provincial Labor Office Informal Economy Report (2024): 198,150 informal workers = 76.5% of the employed labor force; 78% are in agriculture.",
    goodDirection: "down",
    source: "Yala Provincial Labor Office — Informal Economy Report (2024)",
    caveats: "Province-level; 2024 vintage.",
  },
  {
    indicatorId: "tourism",
    label: "Tourism visitors",
    module: "economy",
    whatItMeans:
      "Annual visitor numbers and the revenue they bring — a growth lever for a low-income provincial economy.",
    howMeasured:
      "Ministry of Tourism & Sports 2023 count (1,545,731 visitors) generating ฿4,720.73M (~11% of GPP).",
    goodDirection: "up",
    source: "Ministry of Tourism & Sports (MOTS) — Yala",
    caveats: "Province-level; 2023 vintage.",
  },
  {
    indicatorId: "rubber-production",
    label: "Rubber production",
    module: "economy",
    whatItMeans:
      "Tonnes of natural rubber produced — Yala's dominant cash crop and a key driver of rural incomes.",
    howMeasured:
      "Office of Agricultural Economics Q2 output (55,843 t in 2024, up 42.7% from 39,127 t in 2023).",
    goodDirection: "up",
    source: "Office of Agricultural Economics (OAE) Zone 9",
    caveats:
      "Province-level; OAE Zone 9 covers more than Yala. Volume, not value — exposed to volatile rubber prices.",
  },

  // ── Deep South Security (aggregate) ────────────────────────────────────────
  {
    indicatorId: "dsw-incidents-total",
    label: "Security incidents (Deep South)",
    module: "security",
    whatItMeans:
      "The cumulative count of recorded security incidents across the Deep South since 2004 — context, never individual events.",
    howMeasured:
      "Deep South Watch cumulative incident tally, Jan 2004 – Apr 2024 (22,495+), across all four Deep South provinces.",
    goodDirection: "down",
    source: "Deep South Watch (DSW), via Data Bible — Dim05 (Jul 2025)",
    caveats:
      "AGGREGATE-ONLY: a four-province Deep-South cumulative count, never individual incidents, coordinates, victims, or religious breakdowns (per the Data Bible's Do-No-Harm framing). Stored as an open-ended string ('22,495+').",
  },
  {
    indicatorId: "dsw-deaths-total",
    label: "Deaths since 2004 (Deep South)",
    module: "security",
    whatItMeans:
      "The cumulative human cost — deaths recorded across the Deep South conflict since 2004.",
    howMeasured:
      "Deep South Watch cumulative death count, Jan 2004 – Apr 2024 (7,594), across all four provinces.",
    goodDirection: "down",
    source: "Deep South Watch (DSW), via Data Bible — Dim05 (Jul 2025)",
    caveats:
      "AGGREGATE-ONLY, four-province cumulative figure — not Yala-specific. Violence has significantly decreased since 2013.",
  },
  {
    indicatorId: "dsw-injuries-total",
    label: "Injuries since 2004 (Deep South)",
    module: "security",
    whatItMeans:
      "The cumulative count of people injured in the Deep South conflict since 2004.",
    howMeasured:
      "Deep South Watch cumulative injury count, Jan 2004 – Apr 2024 (14,122), across all four provinces.",
    goodDirection: "down",
    source: "Deep South Watch (DSW), via Data Bible — Dim05 (Jul 2025)",
    caveats:
      "AGGREGATE-ONLY, four-province cumulative figure — not Yala-specific. Violence has significantly decreased since 2013.",
  },
  {
    indicatorId: "yala-incident-share",
    label: "Yala share of Deep South incidents",
    module: "security",
    whatItMeans:
      "Yala's share of conflict-zone incidents relative to its neighbouring provinces — a comparative, not internal, measure.",
    howMeasured:
      "Provincial share of Deep-South incidents (Yala 28%, alongside Narathiwat 36% and Pattani 33%).",
    goodDirection: "down",
    source: "Deep South Watch (DSW), via Data Bible — Dim05 (Jul 2025)",
    caveats:
      "A between-province share, NOT a Yala-internal breakdown; the SEC map lens shades districts only, never point incidents. Aggregate framing only.",
  },
  {
    indicatorId: "violence-trend-since-2013",
    label: "Trend since 2013",
    module: "security",
    whatItMeans:
      "The mandated contextual note that conflict violence has fallen substantially over the last decade.",
    howMeasured:
      "Qualitative trend statement ('Significantly lower') drawn from Deep South Watch trend data and the ongoing peace dialogue.",
    goodDirection: "down",
    source: "Yala Municipal Data Source Bible — Dim05 Security (Jul 2025)",
    caveats:
      "A required contextual statement, not a measured value — stored as a label string. Aggregate Deep-South framing.",
  },
  {
    indicatorId: "emergency-decree-extensions",
    label: "Emergency Decree extension",
    module: "security",
    whatItMeans:
      "Which extension of the special-powers Emergency Decree is currently in force — a marker of the area's persistent special-security regime.",
    howMeasured:
      "Count of consecutive extensions of the Emergency Decree (77th, as of Jul 2024).",
    goodDirection: "neutral",
    source: "Yala Municipal Data Source Bible — Dim05 Security (Jul 2025)",
    caveats:
      "Stored as an ordinal string ('77th'); a legal/administrative status, not an outcome. Applies to the Deep-South special-security area.",
  },
  {
    indicatorId: "sbpac-keadilan-centers",
    label: "SBPAC KEADILAN justice centers",
    module: "security",
    whatItMeans:
      "Number of state-run complaint and justice centers — the rule-of-law support infrastructure across the Southern Border Provinces.",
    howMeasured:
      "Count of SBPAC KEADILAN complaint & justice centers (326) across the Southern Border Provinces.",
    goodDirection: "up",
    source: "Yala Municipal Data Source Bible — Dim05 Security (Jul 2025)",
    caveats:
      "Covers the whole Southern Border Provinces region, not Yala alone. No reference year recorded.",
  },

  // ── Governance & Transparency ─────────────────────────────────────────────
  {
    indicatorId: "ita-fy2024",
    label: "ITA integrity score",
    module: "governance",
    whatItMeans:
      "The municipality's score on the national Integrity & Transparency Assessment — Yala's standout strength in clean, open government.",
    howMeasured:
      "NACC ITAS FY2024 score (91.21/100, Grade A 'Passed'), ranked 9th of 65 local authorities in the province (~top 5% nationally).",
    goodDirection: "up",
    source: "NACC ITAS — Yala Municipality ITA Report (FY2024, itas.nacc.go.th)",
    caveats: "City-municipality assessment; FY2024 vintage.",
  },
  {
    indicatorId: "lpa-2024",
    label: "LPA performance score",
    module: "governance",
    whatItMeans:
      "The municipality's overall score on the national Local Performance Assessment — a broad audit of how well it runs.",
    howMeasured:
      "DLA Local Performance Assessment 2024 across 5 dimensions / 70+ indicators (84.14/100, 'Very Good'), ranked 37th of 77.",
    goodDirection: "up",
    source: "DLA Local Performance Assessment (LPA 2024)",
    caveats:
      "Composite of 70+ indicators; the per-dimension chart shows national averages, not Yala's own dimension scores.",
  },
  {
    indicatorId: "dga-awards",
    label: "Digital Government awards",
    module: "governance",
    whatItMeans:
      "How many years running Yala has won the national Digital Local Government Award — recognition of its smart-city work.",
    howMeasured:
      "Count of consecutive DGA Digital Local Government Awards (3: 2022, 2023, 2024) for the YALA Resilience City / Big Data programme.",
    goodDirection: "up",
    source: "DGA Digital Government Awards 2022–2024 (Matichon / Radio Yala)",
    caveats: "An award count, not a performance metric; city-municipality scope.",
  },
  {
    indicatorId: "open-datasets",
    label: "Open datasets published",
    module: "governance",
    whatItMeans:
      "How many open datasets the city has published for public reuse — a concrete measure of data transparency.",
    howMeasured:
      "Count of downloadable datasets (15) published on DEPA's national CityData smart-city platform.",
    goodDirection: "up",
    source: "DEPA CityData Platform — citydata.in.th/yala-city-municipality",
    caveats:
      "Counts dataset quantity, not quality, freshness, or completeness. No reference year recorded.",
  },
  {
    indicatorId: "complaint-resolution",
    label: "Complaint resolution time",
    module: "governance",
    whatItMeans:
      "How fast the city resolves citizen complaints — a tangible service-quality gain from its Big Data rollout.",
    howMeasured:
      "Average problem-resolution time (1 day 4 hours in 2024, down from 9 days 7 hours = 83% reduction) reported in the DGA Big Data award submission.",
    goodDirection: "down",
    source:
      "DGA Award submission 'Big Data for Service Quality' (Bedrock Analytics case study, 2024)",
    caveats:
      "Stored as a duration string ('1d 4h'). Self-reported in an award submission, so treat the before/after improvement with appropriate caution.",
  },
];
