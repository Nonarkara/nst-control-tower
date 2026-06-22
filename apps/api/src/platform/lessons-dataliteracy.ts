import type { AcademyLesson } from "@nst/shared";

/**
 * Academy track: "data-literacy" — how to read the dashboard data.
 *
 * Teaches the mental model a citizen or official needs to read the Yala
 * Knowledge Platform correctly: indicators vs. ranks vs. benchmarks, how to
 * read a choropleth, the city/province population distinction, what an MPI
 * poverty rate actually measures, how to read data freshness and fallback
 * tiers, and the "data-rich but outcome-poor" paradox the numbers reveal.
 *
 * Every figure is sourced from the Yala Municipal Data Bible research dossiers
 * (Dimension 04: Demographic & Social Data; Dimension 10: Municipal Governance,
 * Fiscal & Performance Data) and cited inline.
 */
export const dataLiteracyLessons: AcademyLesson[] = [
  {
    id: "dl-01-indicators-ranks-benchmarks",
    track: "data-literacy",
    order: 1,
    title: "Indicators, ranks, and benchmarks: what the numbers actually mean",
    titleTh: "ตัวชี้วัด อันดับ และเกณฑ์เทียบ",
    summary:
      "The three kinds of number on the dashboard — a raw indicator, a rank against other provinces, and a benchmark you compare against — and why mixing them up leads to the wrong conclusion.",
    level: "intro",
    durationMin: 6,
    body: `## Three kinds of number, three different questions

Almost every figure on the dashboard is one of three types. Reading them correctly starts with knowing which one you are looking at.

### 1. An **indicator** — a raw measurement
An indicator answers *"what is the value?"* On its own it has no judgement attached. For example, Yala's average monthly income is **19,182 Baht per household** (NSO Yala, 2024) and average monthly expenditure is **14,928 Baht** (NSO Yala, 2024). Those are just measurements.

### 2. A **rank** — position against peers
A rank answers *"compared to whom?"* Thailand has **77 provinces**, so a rank only means something once you know the denominator. On the NESDB Human Achievement Index (HAI) 2022, Yala's **overall HAI is 11th of 77 (score 0.6617, "High")** — but its **Education dimension ranks 66th of 77**, among the lowest in the country (NESDB HAI 2022). Same province, two very different stories, depending on which dimension you rank.

### 3. A **benchmark** — a reference line to compare against
A benchmark answers *"is this good or bad?"* by giving you a yardstick. The natural benchmark for Yala income is the **national** average household income of **28,308 Baht/month (2025)** versus Yala's **19,182 Baht** — Yala sits well below the national line (NSO SES; NSO Yala).

## Why the distinction matters
A high rank does not mean a high raw value, and a raw value means nothing without a benchmark. Yala ranks **6th of 77 on Employment** yet **38th on Income** (NESDB HAI 2022): people are working, but earning less. Always read the indicator, the rank, *and* the benchmark together before drawing a conclusion.`,
    keyFacts: [
      "Ranks are out of 77 provinces; Yala's overall HAI is 11th (0.6617, 'High') but Education is 66th — NESDB HAI 2022.",
      "Yala average household income is 19,182 Baht/month vs. the national benchmark of 28,308 Baht/month — NSO Yala 2024 / NSO SES 2025.",
      "Yala ranks 6th on Employment but 38th on Income (NESDB HAI 2022): a high rank in one dimension does not imply high values elsewhere.",
    ],
    links: [
      {
        label: "Outcomes atlas: human development indicators",
        atlasModule: "outcomes",
      },
      {
        label: "Demographics atlas: income & population baselines",
        atlasModule: "demographics",
      },
      {
        label: "Executive lens: ranks & benchmarks at a glance",
        lens: "executive",
      },
    ],
    quiz: [
      {
        q: "Yala ranks 11th of 77 on overall HAI but 66th on Education. What does this best illustrate?",
        choices: [
          "The data is contradictory and one rank must be wrong",
          "A high overall rank can hide a very low rank in a specific dimension",
          "Education does not affect the overall HAI score",
          "Yala has the best education in Thailand",
        ],
        answer: 1,
        explain:
          "Overall HAI (11th) is a composite across eight dimensions. A strong composite can mask a weak component — here Education at 66th of 77 (NESDB HAI 2022).",
      },
      {
        q: "Yala's average household income is 19,182 Baht/month. To judge whether that is high or low, you most need a…",
        choices: ["rank", "benchmark", "choropleth", "fallback tier"],
        answer: 1,
        explain:
          "A raw indicator needs a reference line. The national average of 28,308 Baht/month (NSO SES 2025) is the benchmark that shows Yala sits below it.",
      },
    ],
  },
  {
    id: "dl-02-city-vs-province-population",
    track: "data-literacy",
    order: 2,
    title: "City vs. province: the 57,640 / 552,479 trap",
    titleTh: "เมืองกับจังหวัด: กับดักของตัวเลขประชากร",
    summary:
      "The single most common mistake reading Yala data: confusing the City Municipality population with the whole province. They differ by nearly ten times, and using the wrong one breaks every per-capita number.",
    level: "intro",
    durationMin: 7,
    body: `## Two populations, one province, a 10× difference

Yala data lives at two very different geographic levels, and the dashboard always labels which one a figure belongs to.

### The **province** — the big number
The whole of **Yala Province** had **552,479 registered persons** in 2024 (274,467 male / 278,012 female), across **180,582 households** (DOPA Population Registration, 2024). This covers all districts — Mueang Yala, Betong, Raman, Yaha and the rest.

### The **City Municipality** — the small number
**Yala City Municipality** (เทศบาลนครยะลา) is one urban local-government unit *inside* Mueang Yala district. Its registered population is roughly **57,640–61,315 persons** (NSO Yala records the municipality at **61,315** for 2024). That is barely **one ninth** of the province.

> Rule of thumb: if a figure is about budgets, council, taxes, or city services it is almost always **CITY**. If it is about poverty rates, the labour force, or the HAI it is almost always **PROVINCE**.

## Why this trap is dangerous
Per-capita maths breaks instantly if you divide a province total by the city population, or vice versa. The municipality's **FY2025 budget of 1,190.53 million THB** (Yala Dashboard / Finance Division) serves the ~57,640-person *city*, not all 552,479 provincial residents — so "budget per resident" is a city calculation, not a provincial one.

Likewise, the **labour force of 262,638 persons** (NSO Labour Force Survey, Q3/2024) is a **provincial** figure. You cannot put it next to the city population and compute a participation rate; the **67.98% participation rate** is provincial by construction (NSO LFS, 2024).

Always check the CITY / PROVINCE tag before you combine two numbers.`,
    keyFacts: [
      "Yala Province: 552,479 registered persons across 180,582 households in 2024 — DOPA Population Registration.",
      "Yala City Municipality: ~57,640–61,315 persons (NSO Yala records 61,315 for 2024) — roughly one ninth of the province.",
      "Municipal FY2025 budget of 1,190.53 million THB (Yala Dashboard) serves the CITY; the 262,638-person labour force (NSO LFS Q3/2024) is PROVINCE.",
    ],
    links: [
      {
        label: "Demographics atlas: city & province population",
        atlasModule: "demographics",
      },
      {
        label: "Fiscal atlas: municipal budget (city scope)",
        atlasModule: "fiscal",
      },
      {
        label: "DOPA Population Registration portal",
        url: "https://stat.bora.dopa.go.th/stat/statnew/statMenu/newStat/home.php",
      },
    ],
    quiz: [
      {
        q: "The dashboard shows a poverty rate, a labour-force count, and a 1,190.53M THB budget. Which is a CITY-level figure?",
        choices: [
          "The poverty rate",
          "The labour-force count",
          "The 1,190.53M THB budget",
          "All three are province-level",
        ],
        answer: 2,
        explain:
          "The FY2025 budget of 1,190.53M THB belongs to Yala City Municipality (Dimension 10). Poverty rate and labour force are provincial figures (Dimension 04).",
      },
      {
        q: "Roughly how does the City Municipality population (~57,640) compare to the whole province (552,479)?",
        choices: [
          "About the same",
          "About one ninth of the province",
          "About half of the province",
          "Larger than the province",
        ],
        answer: 1,
        explain:
          "552,479 ÷ ~57,640 ≈ 9.6, so the city is roughly one ninth of the province. Mixing the two breaks any per-capita calculation.",
      },
      {
        q: "You want 'budget spent per resident served'. Which population do you divide the municipal budget by?",
        choices: [
          "552,479 (province)",
          "180,582 (households)",
          "~57,640 (city municipality)",
          "262,638 (labour force)",
        ],
        answer: 2,
        explain:
          "The municipal budget funds city services, so it is divided by the city population (~57,640), not the province total.",
      },
    ],
  },
  {
    id: "dl-03-reading-choropleth-mpi",
    track: "data-literacy",
    order: 3,
    title: "Reading the choropleth and the MPI poverty map",
    titleTh: "อ่านแผนที่สีและดัชนีความยากจนหลายมิติ",
    summary:
      "A choropleth shades areas by value, and 'MPI poverty 20.83%' is not about income alone. Learn what the colours encode and what the five dimensions behind the poverty figure actually measure.",
    level: "core",
    durationMin: 9,
    body: `## What a choropleth actually shows

A **choropleth** is a map where each area — here, usually a subdistrict (tambon) — is shaded by the value of one indicator. Darker (or warmer) usually means a higher value. Two things to check before you trust the colours:

- **The classification.** Are the breaks equal-interval, quantile, or natural-break? The same data can look alarming or calm depending on the cut points.
- **The denominator.** A subdistrict shaded for "poor persons" is showing a *rate* or a *count*; a sparsely populated tambon can look dark on counts but light on rates.

The poverty layer draws on **TPMAP** (Thai People Map and Analytics Platform), the only source with poverty data down to **subdistrict and village** level for Yala (Dimension 04 §5).

## What "MPI poverty 20.83%" means

The headline poverty figure is **20.83% — about 208,274 persons below the poverty line** in Yala Province (TPMAP, 2025). The "M" is the key letter: **MPI = Multidimensional Poverty Index**. It is *not* income alone. TPMAP scores each household across **five dimensions**:

1. **Health** — birth weight, food hygiene, exercise, medicine use
2. **Living Standard** — housing safety, drinking water, sanitation
3. **Education** — early-childhood care, compulsory schooling, literacy
4. **Income** — employment status, average income
5. **Access to Public Services** — elderly care, disability care

A household can be counted as poor for failing on health or education even with adequate income. The underlying data comes from the **CDD Basic Minimum Need (BMN / จปฐ.) survey**, which covered **102,076 households in Yala in 2024** (Dimension 04 §16), feeding TPMAP's MPI calculation.

## How to read it responsibly
A dark tambon on the poverty map means "high measured multidimensional deprivation", not "lazy" or "poor people". Click through to see *which* dimension drives the colour — often it is Education or Access to Services, not Income.`,
    keyFacts: [
      "Yala MPI poverty rate is 20.83% — about 208,274 persons below the poverty line (TPMAP, 2025).",
      "MPI is multidimensional: five dimensions (Health, Living Standard, Education, Income, Access to Public Services), not income alone — TPMAP.",
      "Underlying data is the CDD Basic Minimum Need (จปฐ.) survey covering 102,076 Yala households in 2024 — Dimension 04 §16.",
      "TPMAP is the only source with poverty data at subdistrict (tambon) and village level for Yala.",
    ],
    links: [
      {
        label: "Poverty lens: the MPI choropleth",
        lens: "poverty",
      },
      {
        label: "Outcomes atlas: MPI poverty breakdown",
        atlasModule: "outcomes",
      },
      {
        label: "TPMAP public poverty dashboard",
        url: "https://www.tpmap.in.th/",
      },
    ],
    quiz: [
      {
        q: "'MPI poverty 20.83%' in Yala primarily measures…",
        choices: [
          "Only household income below a baht threshold",
          "Multidimensional deprivation across five dimensions including health and education",
          "The unemployment rate",
          "The share of welfare-card holders",
        ],
        answer: 1,
        explain:
          "MPI = Multidimensional Poverty Index. TPMAP scores Health, Living Standard, Education, Income, and Access to Public Services — income is just one of five.",
      },
      {
        q: "On a choropleth, why can a sparsely populated subdistrict look misleadingly dark?",
        choices: [
          "Colours are random",
          "It may be shaded on a raw count rather than a rate",
          "Choropleths only work for cities",
          "MPI cannot be mapped",
        ],
        answer: 1,
        explain:
          "A small-population area can have a high count but low rate (or vice versa). Always check whether the shading encodes a count or a rate, and which classification is used.",
      },
    ],
  },
  {
    id: "dl-04-freshness-fallback-paradox",
    track: "data-literacy",
    order: 4,
    title: "Freshness, fallback tiers, and the data-rich / outcome-poor paradox",
    titleTh: "ความสดของข้อมูล ชั้นสำรอง และข้อขัดแย้งข้อมูลมาก-ผลลัพธ์น้อย",
    summary:
      "How to read a data point's freshness and which fallback tier it came from, and why Yala can be unusually transparent and well-governed on paper while outcomes like education stay among the country's weakest.",
    level: "deep",
    durationMin: 10,
    body: `## Reading freshness and fallback tiers

Not every number is equally current or equally direct. The platform tags each figure so you can weigh it.

### Freshness — how old is it?
Update cadence varies enormously by source:
- **Real-time / monthly:** DOPA population registration updates monthly; the municipal water dashboard was last updated **June 17, 2025** (Dimension 10 §11).
- **Quarterly:** the NSO Labour Force Survey — Yala's figures use **Q3/2024** as the annual proxy (Dimension 04 §7).
- **Annual:** TPMAP poverty, ITA, and LPA scores refresh once a year.
- **Decadal:** the **2025 Population & Housing Census** is Thailand's first in 15 years, with results due **October–December 2025** (Dimension 04 §1).

A 2022 HAI rank sitting next to a June-2025 water reading are not "as of" the same moment — freshness tells you which is provisional.

### Fallback tiers — how direct is it?
When a city-level number is unavailable, the platform falls back to a broader scope and labels it:
- **Tier 1 — direct municipal/city measurement** (e.g. the FY2025 municipal budget, 1,190.53M THB).
- **Tier 2 — provincial figure used for the city** (e.g. the 262,638-person labour force, a provincial number).
- **Tier 3 — national benchmark as a proxy** (e.g. the 28,308 Baht national household income used as a comparison line).

A lower tier is still useful — it just means "this is the closest reliable scope we have", not a direct city measurement.

## The data-rich but outcome-poor paradox

Read together, the two dossiers reveal a genuine tension. Yala is **data-rich and, on governance metrics, strong**:
- Municipal **ITA (transparency) score 91.21, Grade A** for FY2024 (Dimension 10 §3).
- Provincial **LPA performance 84.14, "Very Good", ranked 37th of 77** (Dimension 10 §4).
- Overall **HAI 11th of 77** and **Employment 6th of 77** (NESDB HAI 2022).

Yet the lived **outcomes** remain among Thailand's weakest:
- **Education ranks 66th of 77** on the HAI (Dimension 04 §15).
- **MPI poverty is 20.83%** — roughly one in five residents (TPMAP).
- Household income (**19,182 Baht/month**) sits well below the national **28,308 Baht** benchmark.

The lesson for reading this dashboard: a strong *process* metric (transparency, an award-winning data portal, high employment) does not guarantee a strong *outcome* metric (income, education, poverty). Good data and good governance are necessary but not sufficient — which is exactly why measuring the outcomes matters. Present both, neutrally, and let the gap speak for itself.`,
    keyFacts: [
      "Update cadence ranges from monthly (DOPA population; water dashboard last updated 17 Jun 2025) to decadal (2025 Census, results Oct–Dec 2025).",
      "Fallback tiers: city-direct (e.g. 1,190.53M THB budget) > provincial proxy (262,638 labour force) > national benchmark (28,308 Baht income).",
      "Strong process metrics: ITA 91.21 Grade A (FY2024), LPA 84.14 'Very Good' (37th/77), HAI 11th/77 — Dimensions 04 & 10.",
      "Weak outcome metrics: Education 66th/77 (HAI 2022), MPI poverty 20.83%, income below the national average — the data-rich / outcome-poor paradox.",
    ],
    links: [
      {
        label: "Executive lens: governance scores & freshness",
        lens: "executive",
      },
      {
        label: "Governance atlas: ITA & LPA performance",
        atlasModule: "governance",
      },
      {
        label: "Poverty lens: MPI outcome map",
        lens: "poverty",
      },
      {
        label: "Outcomes atlas: education & poverty gaps",
        atlasModule: "outcomes",
      },
    ],
    quiz: [
      {
        q: "A figure labelled 'Tier 2 — provincial proxy' means…",
        choices: [
          "It is wrong and should be ignored",
          "It is a direct city measurement",
          "No city-level figure was available, so a provincial number is used as the closest reliable scope",
          "It is a national benchmark",
        ],
        answer: 2,
        explain:
          "Tier 2 is a provincial figure standing in where a city-level one is missing — e.g. the 262,638-person labour force is provincial. Still useful, just not city-direct.",
      },
      {
        q: "Which pairing best captures the 'data-rich but outcome-poor' paradox?",
        choices: [
          "High ITA transparency (91.21, Grade A) alongside Education ranked 66th of 77",
          "Low budget alongside low population",
          "High rainfall alongside low temperature",
          "Real-time water data alongside monthly population data",
        ],
        answer: 0,
        explain:
          "Yala scores strongly on governance/transparency (ITA 91.21) yet its education outcome ranks 66th of 77 (HAI 2022). Strong process metrics do not guarantee strong outcomes.",
      },
      {
        q: "Two figures sit side by side: a 2022 HAI rank and a water reading from June 2025. What should freshness tell you?",
        choices: [
          "They are equally current",
          "The HAI is more reliable because it is older",
          "They are 'as of' very different moments, so the older one is more provisional for today",
          "Freshness does not matter for ranks",
        ],
        answer: 2,
        explain:
          "Freshness is the 'as of' date. A 2022 annual rank and a June-2025 monthly reading describe different moments; treat the older figure as more provisional for current decisions.",
      },
    ],
  },
];
