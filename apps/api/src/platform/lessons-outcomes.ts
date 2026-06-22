import type { AcademyLesson } from "@nst/shared";

/**
 * Academy track "outcomes" — development outcomes & equity for Yala province.
 *
 * Covers the three "outcome" gaps that the HAI strengths (employment, transport)
 * mask: poverty, education, and health. Every number is drawn from the Yala
 * Municipal Data Bible research dimensions:
 *   - dim04 (Demographic, Population & Social) — poverty, HAI, welfare
 *   - dim06 (Health Data & Health Services)    — mental health, dengue, workforce
 *   - dim07 (Education & Cultural Institutions) — O-NET, NEET, pondok, dropout
 *
 * Tone: empathetic and constructive. These are gaps to close, not verdicts on a
 * community. Deep South content is kept factual and neutral.
 */
export const outcomesLessons: AcademyLesson[] = [
  {
    id: "outcomes-01-what-is-an-outcome-gap",
    track: "outcomes",
    order: 1,
    title: "What is an outcome gap, and why does Yala have them?",
    titleTh: "ช่องว่างของผลลัพธ์การพัฒนาคืออะไร",
    summary:
      "Yala ranks 11th of 77 on the overall Human Achievement Index, yet poverty, education and health lag badly. This lesson explains why headline ranks can hide the gaps that matter most.",
    level: "intro",
    durationMin: 7,
    body: `## A high overall rank can hide real gaps

On the NESDB **Human Achievement Index (HAI) 2022**, Yala ranks **11th of 77 provinces** overall — classified "High" (score 0.6617). That sounds like a success story. But the overall rank is a composite of eight dimensions, and the average smooths over sharp differences (dim04).

### Strengths carry the average
Yala scores **6th nationally in Employment** and **9th in Transport** (dim04). Those strong dimensions pull the composite up.

### "Outcome" dimensions lag far behind
Look underneath and the picture changes:

- **Education: rank 66 of 77** — among the lowest in Thailand (dim04)
- **Health: rank 47** — somewhat low
- **Income: rank 38** — average, despite strong employment

We call education, health and poverty *outcome* gaps because they measure how people actually fare in life — not just whether jobs or roads exist. A province can have near-full employment and still struggle if the work is low-paid informal labour and schools underperform.

### Why this matters for planning
If a dashboard only shows the overall rank, a planner might conclude Yala is doing fine. The disaggregated view tells the truer story: the employment win sits next to an education emergency. Good municipal decisions depend on reading **both** the strength **and** the gap, then directing resources where the gap is widest.

The next three lessons go deep on each outcome gap — poverty, education, and health — and how to act on them.`,
    keyFacts: [
      "Yala ranks 11th of 77 on overall HAI 2022 (High, 0.6617) but 66th on the Education dimension (dim04).",
      "Strong dimensions — Employment 6th, Transport 9th — pull the composite rank up while outcomes lag (dim04).",
      "Income ranks only 38th despite a 0.43% unemployment rate, signalling low-paid and informal work (dim04).",
    ],
    links: [
      {
        label: "Open the Outcomes atlas module",
        atlasModule: "outcomes",
      },
      {
        label: "Executive overview lens",
        lens: "executive",
      },
      {
        label: "NESDB Human Achievement Index",
        url: "https://www.nesdc.go.th/main.php?filename=develop_hai",
      },
    ],
    quiz: [
      {
        q: "Yala ranks 11th of 77 overall on the HAI 2022. What is its Education dimension rank?",
        choices: ["6th", "38th", "66th", "11th"],
        answer: 2,
        explain:
          "Education ranks 66th of 77 — among the lowest in Thailand — even though the overall composite is 11th (dim04).",
      },
      {
        q: "Why can a high overall HAI rank hide serious problems?",
        choices: [
          "The HAI only measures income",
          "Strong dimensions like Employment and Transport pull the composite average up",
          "The HAI excludes the Deep South provinces",
          "Ranks are randomly assigned",
        ],
        answer: 1,
        explain:
          "The composite averages eight dimensions, so Yala's 6th-place Employment and 9th-place Transport mask weak Education, Health and Income (dim04).",
      },
    ],
  },
  {
    id: "outcomes-02-poverty-and-equity",
    track: "outcomes",
    order: 2,
    title: "Poverty and equity: reading the MPI behind the numbers",
    titleTh: "ความยากจนและความเสมอภาค",
    summary:
      "About 1 in 5 people in Yala live below the poverty line on the multidimensional measure. This lesson explains the MPI, household income gaps, and how welfare data points to who needs help.",
    level: "core",
    durationMin: 8,
    body: `## One in five, measured across five dimensions

The **Thai People Map and Analytics Platform (TPMAP)** reports a **multidimensional poverty rate of 20.83% for Yala — 208,274 people below the poverty line** (dim04). This is not just an income line: the **Multidimensional Poverty Index (MPI)** scores households across five dimensions — Health, Living Standard, Education, Income, and Access to Public Services.

### Income tells part of the story
- Average household income in Yala: **19,182 Baht/month** (2024) — well below the national 28,308 Baht (dim04)
- Average household expenditure: **14,928 Baht/month** (dim04)
- Provincial product (GPP) growth was just **0.31%** in 2024 (dim04)

### The informal-work trap
Yala has near-full employment (0.43% unemployment), but **198,150 workers are informal** — about three quarters of them in agriculture (dim04). Informal work means low and unstable pay with little social protection, which is why strong employment and high poverty can coexist.

### Who the welfare data flags
- **143,351 people hold State Welfare Cards** (income ≤ 100,000 Baht/year) in Yala (dim04)
- **102,076 households** were surveyed in 2024 via the CDD Basic Minimum Need (จปฐ.) system, feeding the MPI (dim04)

### How to act on it
The MPI's five dimensions are a built-in action list. A household poor in *Living Standard* needs water and housing help; one poor in *Education* needs school support. Because TPMAP resolves to the **village and subdistrict** level, the municipality can target the specific tambon where poverty concentrates rather than spreading thin.`,
    keyFacts: [
      "Yala's multidimensional poverty rate is 20.83% — 208,274 people below the poverty line (TPMAP, dim04).",
      "Average household income is 19,182 Baht/month vs 28,308 nationally; expenditure is 14,928 Baht (dim04).",
      "198,150 workers are informal (≈75% agricultural), explaining how near-full employment coexists with poverty (dim04).",
      "143,351 residents hold State Welfare Cards and 102,076 households were surveyed via CDD BMN in 2024 (dim04).",
    ],
    links: [
      {
        label: "Open the poverty lens",
        lens: "poverty",
      },
      {
        label: "Outcomes atlas module",
        atlasModule: "outcomes",
      },
      {
        label: "TPMAP poverty dashboard",
        url: "https://www.tpmap.in.th/",
      },
    ],
    quiz: [
      {
        q: "What does Yala's MPI poverty rate of 20.83% represent?",
        choices: [
          "208,274 people below the poverty line across five dimensions",
          "The unemployment rate",
          "The share of informal workers",
          "Households without electricity",
        ],
        answer: 0,
        explain:
          "TPMAP's multidimensional measure puts 208,274 people (20.83%) below the line, scored across Health, Living Standard, Education, Income and Access to Services (dim04).",
      },
      {
        q: "How can Yala have 0.43% unemployment yet 20.83% poverty?",
        choices: [
          "The figures are from different countries",
          "Most jobs are low-paid informal work — 198,150 informal workers, mostly in agriculture",
          "Poverty is measured only in cities",
          "Unemployment data is missing",
        ],
        answer: 1,
        explain:
          "Near-full employment is dominated by informal agricultural labour with low, unstable pay, so working and being poor are not mutually exclusive (dim04).",
      },
      {
        q: "Why is TPMAP useful for targeting help?",
        choices: [
          "It only reports a single national number",
          "It resolves poverty to village and subdistrict level across five dimensions",
          "It tracks stock prices",
          "It replaces the census",
        ],
        answer: 1,
        explain:
          "Village/subdistrict resolution and five-dimension scoring let planners target the specific tambon and the specific need (dim04).",
      },
    ],
  },
  {
    id: "outcomes-03-education-gap",
    track: "outcomes",
    order: 3,
    title: "The education gap: O-NET, NEET, and a parallel school system",
    titleTh: "ช่องว่างทางการศึกษา",
    summary:
      "Yala's Education dimension ranks 66th nationally. This lesson reads the O-NET shortfall, the 30.8% youth NEET rate, and the 161 pondok institutions that form a parallel education system — without judgment.",
    level: "core",
    durationMin: 9,
    body: `## The widest outcome gap

Education is Yala's lowest HAI dimension — **66th of 77** (dim04). The supporting indicators are stark, and worth reading carefully and without blame.

### Standardised scores fall below the national mean
- **O-NET Primary-6 (2025):** Yala province **27.92** vs national **35.38** — about 21% below the national mean (dim07)
- Upper-secondary pass rates (>50 points) are far below national: Thai language **8.3% vs 37.7%**, Maths **1.8% vs 9.9%** (dim07)

### Young people out of school and out of work
- **NEET rate: 30.8%** — among the highest in Thailand (dim07)
- Only **44.2% of youth** were in the formal education system in 2022, vs **79.3% nationally** (dim07)
- **12,802 out-of-school children** in Yala alone (EEF 2024) (dim07)
- The leading cause of dropout in 2018 was **family migration** (431 of 560 cases), not lack of interest (dim07)

### A parallel, community-rooted system
Yala has **161 pondok institutions** (126 registered + 35 unregistered), **32 private Islamic schools**, and **19 Hafiz institutions** (dim07). These serve the Malay-Muslim majority and are valued community institutions; many young males choose religious study at a pondok over formal schooling, which partly explains the enrolment gap. This is context, not a deficiency to be erased.

### How to act on it
The province is already a **UNESCO Learning City (2024)** and runs the EEF **Zero Dropout** initiative and the **Partner Schools** policy pairing public schools with pondok and tadika (dim07). Constructive levers include Yawi-language and culturally relevant teaching, specialist teachers in maths/science/English, and flexible pathways for the 12,802 out-of-school children — meeting families where they are.`,
    keyFacts: [
      "Education is Yala's weakest HAI dimension at 66th of 77; O-NET P.6 is 27.92 vs 35.38 nationally (dim04, dim07).",
      "Youth NEET rate is 30.8% and only 44.2% of youth were in formal education in 2022 vs 79.3% nationally (dim07).",
      "12,802 children are out of school in Yala (EEF 2024); the top dropout cause in 2018 was family migration (dim07).",
      "Yala has 161 pondok (126 registered, 35 unregistered), 32 private Islamic schools and 19 Hafiz institutions (dim07).",
    ],
    links: [
      {
        label: "Open the Education atlas module",
        atlasModule: "education",
      },
      {
        label: "Outcomes atlas module",
        atlasModule: "outcomes",
      },
      {
        label: "Poverty lens (dropout & poverty link)",
        lens: "poverty",
      },
      {
        label: "Yala City O-NET dashboard",
        url: "https://www.yaladashboard.com/citizen/o-net/",
      },
    ],
    quiz: [
      {
        q: "How does Yala's 2025 O-NET Primary-6 score compare with the national average?",
        choices: [
          "27.92 in Yala vs 35.38 nationally — about 21% lower",
          "Higher than the national average",
          "Exactly equal",
          "Only English was tested",
        ],
        answer: 0,
        explain:
          "Yala's provincial P.6 average of 27.92 sits roughly 21% below the national mean of 35.38 (dim07).",
      },
      {
        q: "What was the leading cause of school dropout in Yala in 2018?",
        choices: ["Crime", "Family migration", "Illness", "School fees"],
        answer: 1,
        explain:
          "Family migration accounted for 431 of 560 documented dropouts — far ahead of poverty or family problems (dim07).",
      },
      {
        q: "What are the 161 pondok institutions in Yala?",
        choices: [
          "Public hospitals",
          "Islamic educational institutions forming a parallel, community-rooted school system",
          "Government welfare offices",
          "Vocational colleges only",
        ],
        answer: 1,
        explain:
          "Pondok are Islamic educational institutions (126 registered + 35 unregistered) serving the Malay-Muslim majority; they are valued community institutions, presented here as context (dim07).",
      },
    ],
  },
  {
    id: "outcomes-04-health-and-wellbeing",
    track: "outcomes",
    order: 4,
    title: "Health & wellbeing: mental health, dengue, and a stretched workforce",
    titleTh: "สุขภาพและความเป็นอยู่ที่ดี",
    summary:
      "Yala's Health dimension ranks 47th. This deep lesson connects conflict-related mental health, recurring dengue, and a thin specialist workforce — and how each gap can be narrowed.",
    level: "deep",
    durationMin: 10,
    body: `## Health is a quieter outcome gap — but a real one

Yala ranks **47th of 77 on the Health dimension** of the HAI (dim04). Three threads explain the strain, and each has a path forward.

### Mental health and the conflict context
A 2016 epidemiological study of the Deep South found a **lifetime mental disorder prevalence of 9.6%** and a 12-month prevalence of 3.4% (dim06). Critically, **only 18.7% of those with a disorder sought help**, and just 8.3% consulted a health professional (dim06). Yala Hospital lists only **9 psychiatrists** on staff (dim06). The Department of Mental Health runs a community screening system (2Q/9Q tools) that can widen the door to care — presented factually, this is a service-capacity gap, not a statement about the community.

### Recurring dengue
Yala is consistently a dengue hotspot, ranked **#7 nationally** for incidence in 2022 (**21.87 per 100,000**) and #1 in the southern region during the 2019 outbreak (523 patients Jan–Jul) (dim06). The response — the "1 Search 3 Knocks" campaign of active case-finding and household visits — is a model for weekly, map-driven vector control.

### A stretched workforce and high demand
- **Yala Hospital** (558 beds, regional) employs just **21 doctors** in its general-hospital count — about **1 doctor per 2,906 people**, vs the national **1:1,292** (dim06)
- Community-hospital **bed occupancy hit 122% in 2021** — demand exceeding capacity (dim06)
- The hospital is the primary receiver of mass casualties from the southern insurgency, declaring **118 mass-casualty responses (2004–2008)** (dim06)

### How to act on it
The levers are concrete: expand community mental-health screening and referral to close the 18.7% treatment-seeking gap; sustain weekly dengue surveillance with seasonal prediction; and use workforce data to argue for more doctors and beds where occupancy runs over 100%.`,
    keyFacts: [
      "Yala's Health dimension ranks 47th of 77 on the HAI 2022 (dim04).",
      "Deep South lifetime mental-disorder prevalence is 9.6%, but only 18.7% of those affected seek help; Yala Hospital has 9 psychiatrists (dim06).",
      "Yala ranked #7 nationally for dengue in 2022 (21.87 per 100,000) and #1 in the south during the 2019 outbreak (dim06).",
      "Yala Hospital (558 beds) has ~21 doctors — 1:2,906 vs 1:1,292 nationally — and community-hospital occupancy hit 122% (2021) (dim06).",
    ],
    links: [
      {
        label: "Open the Health atlas module",
        atlasModule: "health",
      },
      {
        label: "Outcomes atlas module",
        atlasModule: "outcomes",
      },
      {
        label: "DMH mental-health screening dashboard",
        url: "https://checkin.dmh.go.th/dashboards",
      },
      {
        label: "Yala Hospital",
        url: "https://www.yalahospital.go.th",
      },
    ],
    quiz: [
      {
        q: "In the Deep South, what share of people with a mental disorder sought help?",
        choices: ["18.7%", "96.0%", "50.0%", "9.6%"],
        answer: 0,
        explain:
          "Only 18.7% of those with a disorder sought help and just 8.3% consulted a health professional — a treatment-seeking gap, against a 9.6% lifetime prevalence (dim06).",
      },
      {
        q: "How does Yala Hospital's doctor-to-population ratio compare nationally?",
        choices: [
          "Better than the national average",
          "About 1:2,906 vs 1:1,292 nationally — roughly half the national density",
          "Exactly the national average",
          "No data exists",
        ],
        answer: 1,
        explain:
          "Yala's ~1 doctor per 2,906 people is well below the national 1:1,292, and community-hospital occupancy hit 122% in 2021 (dim06).",
      },
      {
        q: "What was Yala's national dengue rank in 2022?",
        choices: ["#1", "#7", "#47", "#66"],
        answer: 1,
        explain:
          "Yala ranked #7 nationally for dengue incidence in 2022 at 21.87 per 100,000, and #1 in the southern region during the 2019 outbreak (dim06).",
      },
    ],
  },
];
