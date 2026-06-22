import type { AcademyLesson } from "@nst/shared";

/**
 * Academy track: "city-systems" — Yala as a city.
 *
 * Covers the planned concentric-circular city (Wongwian ring roads, Kilometre
 * Zero), the municipality's digital service stack (5 Big-Data systems,
 * yaladashboard.com, citydata.in.th, 15 open datasets), its governance
 * strength (ITA, three consecutive DGA awards), and the 9-department
 * organisation that produces the data.
 *
 * Every figure below is drawn from the Yala Municipal Data Bible research
 * dimensions 01 (Existing Dashboard & Municipal Baseline) and 10 (Governance,
 * Fiscal & Performance). Sources are cited inline in keyFacts/body. Deep South
 * content is kept neutral and descriptive.
 */
export const citySystemsLessons: AcademyLesson[] = [
  {
    id: "city-systems-01-circular-city",
    track: "city-systems",
    order: 1,
    title: "The Circular City: how Yala was planned",
    titleTh: "เมืองผังวงเวียน: ยะลาถูกวางผังอย่างไร",
    summary:
      "Yala is one of Thailand's few deliberately planned cities — concentric rings radiating from a Kilometre Zero, with spider-web roads laid out in the 1910s. Understanding the plan explains how everything else (services, data, wards) is organised.",
    level: "intro",
    durationMin: 6,
    body: `## A city laid out on purpose

Most Thai towns grew organically. Yala did not. The present city was planned during the term of **Phra Rattakit Wijarn (Sawat Na Nakhon), the 10th governor of Yala Province (1913–1915)**, who established a **"Kilometre Zero"** and laid the streets out in **concentric circles connected by radial spider-web roads** — often described as Thailand's most beautiful spider-web (วงเวียน / *wongwian*) road pattern (dim01, §10.3).

The city had been **relocated four times** historically before this final, deliberate layout was set (dim01, §10.3).

## What the municipality covers today

- **Total area:** 19.4 square kilometres, covering the *entire* Tambon Sateng (ตำบลสะเตง) (dim01, §10.1).
- **Established:** 11 February 1936 (B.E. 2479) as Yala Town Municipality; upgraded in 1966 (B.E. 2509) to the present 19.4 km² extent, and later granted City Municipality (เทศบาลนคร) status (dim01, §10.1).
- **Neighbours:** bordered by Tambon Yupo and Tambon Sateng Nok in Mueang Yala, and to the north by Amphoe Yarang in **Pattani Province** — a reminder that the city sits inside a wider provincial fabric (dim01, §10.2).

## Why the plan still matters

The ring-and-radial geometry is not just heritage. It shapes how wards, traffic circles, and service routes are organised, and it is the spatial frame the municipality's GIS, drone surveys, and ward-level dashboards are built on. When you read a Yala map lens, you are reading a city that was drawn before it was built.`,
    keyFacts: [
      "The current city was planned under Phra Rattakit Wijarn, the 10th governor of Yala (1913–1915), with a Kilometre Zero and concentric spider-web roads (dim01, §10.3).",
      "Yala City Municipality covers 19.4 km², the entire Tambon Sateng; established 1936, expanded to its current extent in 1966 (dim01, §10.1).",
      "The city had been relocated four times historically before this final planned layout (dim01, §10.3).",
    ],
    links: [
      { label: "Open the Operations lens", lens: "operations" },
      { label: "Yala City Municipality — general info", url: "https://www.yalacity.go.th/content/general" },
    ],
    quiz: [
      {
        q: "What is distinctive about how Yala city was laid out?",
        choices: [
          "It grew organically with no central plan",
          "It was deliberately planned in concentric circles with spider-web roads around a Kilometre Zero",
          "It follows a strict north–south grid",
          "It was designed by a foreign colonial administration",
        ],
        answer: 1,
        explain:
          "Yala was deliberately planned during the term of the 10th governor (1913–1915), with a Kilometre Zero and concentric spider-web roads (dim01, §10.3).",
      },
      {
        q: "How large is Yala City Municipality, and what does it cover?",
        choices: [
          "Roughly 100 km², covering several districts",
          "19.4 km², covering the entire Tambon Sateng",
          "5 km², covering only the old town centre",
          "The whole of Yala Province",
        ],
        answer: 1,
        explain:
          "The municipality covers 19.4 km² and encompasses the entire Tambon Sateng sub-district (dim01, §10.1).",
      },
    ],
  },
  {
    id: "city-systems-02-municipal-services",
    track: "city-systems",
    order: 2,
    title: "The digital municipality: 5 Big-Data systems and open data",
    titleTh: "เทศบาลดิจิทัล: 5 ระบบบิ๊กดาตา และข้อมูลเปิด",
    summary:
      "Yala runs one of Thailand's most advanced local-government digital stacks: five integrated Big-Data systems, a dual dashboard at yaladashboard.com, and 15 open datasets on DEPA's citydata.in.th. This lesson is the map of those services.",
    level: "core",
    durationMin: 9,
    body: `## The "YALA Resilience City" stack

Under Mayor **Pongsak Yingchoncharoen** (in office since 2019), the municipality built an integrated smart-city ecosystem in partnership with **Bedrock Analytics**, using drone (UAV) surveys and Mobile Mapping Systems (MMS) to digitise the whole 19.4 km² area (dim01, §5.1–5.2).

### The 5 integrated Big-Data systems (dim01, §5.1)

1. **City Digital Data Platform (CDDP)** — central collection, storage and visualisation across all 9 departments.
2. **Disaster Management System** — predictive analytics and emergency-response coordination.
3. **Bellme** — online complaint & incident reporting with GPS coordinates and status tracking.
4. **Smart Municipal Tax System** — land/building/billboard survey with AI-assisted assessment.
5. **Smart Building Permit System** — end-to-end online permit application with AI-assisted review.

### Where citizens see the data

- **yaladashboard.com** — a *dual* dashboard: a Mayor (executive) view for decision-making and a Citizen (public) view for transparency. The public dashboard spans **4 sections** (Municipal, Quality-of-Life, Population, Service data) with **19+ data modules** (dim01, §1.1, §3.1).
- **citydata.in.th** — Yala publishes **15 downloadable open datasets** on DEPA's Smart City Data Platform, classified across Smart Economy, Environment, Governance and Living (dim01, §2.1–2.2).
- **Three citizen channels:** LINE OA **@yalacity**, the **Yala Mobile Application**, and the website (dim01, §3.2).

## Why it counts as "resilience"

The flagship result: average problem-resolution time fell from **9 days 7 hours to 1 day 4 hours — an 83% reduction** — between May and June 2023, the headline metric in the 2024 DGA award submission (dim01, §13.3). Known gaps remain: the public-transport module currently shows **0 trips** (no live feed), and there is no economic/trade data yet (dim01, §8.1).`,
    keyFacts: [
      "Five integrated Big-Data systems run the municipality: CDDP, Disaster Management, Bellme complaints, Smart Tax, and Smart Building Permit (dim01, §5.1).",
      "Yala publishes 15 open datasets on DEPA's citydata.in.th and runs a dual (Mayor + Citizen) dashboard at yaladashboard.com with 19+ modules (dim01, §1.1, §2.1).",
      "Average problem-resolution time fell 83%, from 9 days 7 hours to 1 day 4 hours (May→June 2023), per the 2024 DGA submission (dim01, §13.3).",
      "Known data gaps: the public-transport module shows 0 trips (no live feed) and no economic/trade data is dashboarded yet (dim01, §8.1).",
    ],
    links: [
      { label: "Operations lens (live services)", lens: "operations" },
      { label: "Yala Citizen Dashboard", url: "https://www.yaladashboard.com" },
      { label: "DEPA CityData — Yala open datasets", url: "https://www.citydata.in.th/yala-city-municipality/en/dashboard-public-en/" },
    ],
    quiz: [
      {
        q: "Which of these is one of Yala's five integrated Big-Data systems?",
        choices: [
          "A nationwide social-media monitor",
          "Bellme — the GPS-tagged online complaint and incident system",
          "A stock-trading platform",
          "A provincial election system",
        ],
        answer: 1,
        explain:
          "Bellme is the online complaint & incident system; the other four are CDDP, Disaster Management, Smart Tax, and Smart Building Permit (dim01, §5.1).",
      },
      {
        q: "How many open datasets does Yala publish on DEPA's citydata.in.th?",
        choices: ["5", "9", "15", "48"],
        answer: 2,
        explain:
          "Yala publishes 15 downloadable datasets on the DEPA Smart City Data Platform (dim01, §2.1).",
      },
      {
        q: "What was the headline service-improvement metric in the 2024 DGA award submission?",
        choices: [
          "Tax revenue doubled",
          "Average problem-resolution time fell 83%, from 9 days 7 hours to 1 day 4 hours",
          "Population grew by 83%",
          "Water consumption dropped by half",
        ],
        answer: 1,
        explain:
          "Resolution time fell from 9 days 7 hours to 1 day 4 hours — an 83% reduction — between May and June 2023 (dim01, §13.3).",
      },
    ],
  },
  {
    id: "city-systems-03-governance-strength",
    track: "city-systems",
    order: 3,
    title: "Governance strength: ITA, LPA and three DGA awards",
    titleTh: "ความเข้มแข็งด้านธรรมาภิบาล: ITA, LPA และรางวัล DGA สามปีซ้อน",
    summary:
      "Yala's standing rests on measured transparency: an ITA score of 91.21 (Grade A), a Local Performance Assessment score, and the DGA Digital Local Government award three years running. This lesson explains what those scores mean.",
    level: "core",
    durationMin: 8,
    body: `## Transparency, measured

Thai local governments are scored every year on transparency and performance. Yala's numbers sit near the top.

### ITA — Integrity & Transparency Assessment

Conducted by the **National Anti-Corruption Commission (NACC)** across 10 indicators (information disclosure and corruption prevention). Yala's results (dim10, §3):

- **FY2024: 91.21, Grade A**, ranked **#9 of 65** in the province (~top 5% nationally).
- FY2023: 88.23 (A); **FY2022: 94.21** (A) — the higher 94.21 figure that sometimes circulates is the FY2022 score, not the latest (dim10, §3, note).

### LPA — Local Performance Assessment

The DLA's assessment across 5 dimensions and 70+ indicators. The Yala City dashboard records an **LPA score of 87.87 ("Very Good")** (dim01, §1.1 Section A). At provincial level, Yala scored 84.14, ranking #37 of 77 provinces in 2024 (dim10, §4).

### Three consecutive DGA awards (dim01, §13.1)

| Year | Award | Project |
|------|-------|---------|
| 2022 | DGTi Local Government Award — Excellent (1 of 3 nationally) | YALA Resilience City |
| 2023 | Digital Government Award — Excellent | YALA Resilience City |
| 2024 | Digital Local Government — Excellent | Big Data for Service Quality |

## Reading scores honestly

A high ITA score measures *disclosure and process*, not lived outcomes — it tells you the municipality publishes its budget, procurement and complaint statistics, not whether every service is perfect. The LPA module on the public dashboard, for instance, is noted as currently inactive (dim10, §4). Treat these as governance-process indicators, read alongside the outcome data in the Atlas.`,
    keyFacts: [
      "Yala's FY2024 ITA (transparency) score is 91.21, Grade A, ranked #9 of 65 in the province; the 94.21 figure sometimes cited is the FY2022 score (dim10, §3).",
      "Local Performance Assessment (LPA) score of 87.87 ('Very Good') is recorded on the city dashboard (dim01, §1.1).",
      "Yala won the DGA Digital Local Government award three years running — 2022, 2023 and 2024 (dim01, §13.1).",
      "ITA measures disclosure and process (budget, procurement, complaint statistics), not lived service outcomes (dim10, §3).",
    ],
    links: [
      { label: "Governance module (Atlas)", atlasModule: "governance" },
      { label: "Fiscal module (Atlas)", atlasModule: "fiscal" },
      { label: "Yala ITA detail page", url: "https://yalacity.go.th/ita68" },
    ],
    quiz: [
      {
        q: "What is Yala's most recent (FY2024) ITA transparency score?",
        choices: ["94.21", "91.21", "87.87", "84.14"],
        answer: 1,
        explain:
          "The latest FY2024 ITA score is 91.21 (Grade A). The 94.21 figure is the older FY2022 score (dim10, §3).",
      },
      {
        q: "For how many consecutive years has Yala won the DGA Digital Local Government award?",
        choices: ["One", "Two", "Three (2022, 2023, 2024)", "Five"],
        answer: 2,
        explain:
          "Yala won the award in 2022, 2023 and 2024 — three consecutive years (dim01, §13.1).",
      },
      {
        q: "What does a high ITA score primarily measure?",
        choices: [
          "Lived quality of every municipal service",
          "Disclosure and anti-corruption process (e.g. publishing budgets and complaint stats)",
          "Population growth",
          "Tourism revenue",
        ],
        answer: 1,
        explain:
          "ITA evaluates information disclosure and corruption-prevention process, not service outcomes; read it alongside outcome data (dim10, §3).",
      },
    ],
  },
  {
    id: "city-systems-04-nine-departments",
    track: "city-systems",
    order: 4,
    title: "Who runs it: the 9 departments and the data engine room",
    titleTh: "ใครเป็นผู้ขับเคลื่อน: 9 หน่วยงาน และห้องเครื่องข้อมูล",
    summary:
      "Behind every number on the dashboard is a department that collects it. This deep-dive maps the 9 departments, shows why the Strategy & Budget Division is the data engine room, and flags the staffing risks that come with centralisation.",
    level: "deep",
    durationMin: 11,
    body: `## Nine departments, one data spine

Yala City Municipality is organised into **9 departments** (dim01, §4.1). Each owns the data that feeds specific dashboard modules:

1. **Public Health & Environment Bureau** — health, vaccination, sanitation, PM2.5.
2. **Finance Bureau (สำนักคลัง)** — tax collection, budget execution, e-LAAS.
3. **Engineering Bureau (สำนักช่าง)** — roads, drainage, public-works GIS.
4. **Education Bureau** — school data, O-NET scores, enrolment.
5. **Municipal Clerk Bureau** — administration, council records, civil registration.
6. **Strategy & Budget Division (กองยุทธศาสตร์และงบประมาณ)** — **the central data unit**: dashboard, IT, Smart City, statistics, open data.
7. **Water Supply Division** — consumption, water quality (NTU), billing.
8. **Social Welfare Division** — elderly and disability allowances.
9. **Personnel Division** — HR and organisational development.

## The engine room

Almost everything platform-facing routes through the **Strategy & Budget Division**, which houses the **Statistics, Data & IT Unit (ฝ่ายสถิติข้อมูลและสารสนเทศ)** — running the network, backend systems, the Mobile App and LINE OA, and Smart City coordination. Its director also serves as the **provincial-level PCIO/CIO committee assistant** (dim01, §11.1, §9.1).

## The scale of the organisation

- **Total staff (all departments):** an estimated **500–800** people; the Education Division alone employs ~430, including 221 permanent teachers across **6 municipal schools** and 5 childcare centres (dim10, §9).
- **FY2025 budget:** **1,190.53 million THB**, with Community & Social Services the largest slice at 54.96% (658.82M THB) (dim01, §1.1, §12.1).

## The risk in the design

Centralising data in one division is what makes Yala fast and coherent — and also fragile. The research flags the IT function as **likely understaffed**, with **no dedicated IT budget line** (spending embedded in "Other Operations"), data-science capability relying on the external Bedrock Analytics partnership, and a single unit supporting all 9 departments — a genuine **bottleneck and key-person risk** (dim01, §11.2, §12.3). Strong governance scores do not, by themselves, remove that operational exposure.`,
    keyFacts: [
      "Yala City Municipality has 9 departments; the Strategy & Budget Division is the central data unit running the dashboard, IT and open data (dim01, §4.1, §11.1).",
      "Total staff across all departments is estimated at 500–800; the Education Division alone has ~430 staff across 6 municipal schools (dim10, §9).",
      "FY2025 budget is 1,190.53M THB, with Community & Social Services the largest category at 54.96% (658.82M THB) (dim01, §1.1, §12.1).",
      "The research flags a bottleneck risk: IT likely understaffed, no dedicated IT budget line, and data-science reliant on the external Bedrock Analytics partner (dim01, §11.2, §12.3).",
    ],
    links: [
      { label: "Operations lens (services & departments)", lens: "operations" },
      { label: "Fiscal module (budget breakdown)", atlasModule: "fiscal" },
      { label: "Governance module (org & oversight)", atlasModule: "governance" },
      { label: "Yala Municipality — organisational structure", url: "https://www.yalacity.go.th/content/structure" },
    ],
    quiz: [
      {
        q: "Which department is the municipality's central data unit?",
        choices: [
          "The Finance Bureau",
          "The Engineering Bureau",
          "The Strategy & Budget Division",
          "The Personnel Division",
        ],
        answer: 2,
        explain:
          "The Strategy & Budget Division houses the Statistics, Data & IT Unit and runs the dashboard, IT systems and open data (dim01, §4.1, §11.1).",
      },
      {
        q: "What is the FY2025 total budget, and which category is largest?",
        choices: [
          "57.13M THB; Tax Collection",
          "1,190.53M THB; Community & Social Services at ~55%",
          "263.35M THB; General Administration",
          "84.14M THB; Economic Development",
        ],
        answer: 1,
        explain:
          "The FY2025 budget is 1,190.53M THB; Community & Social Services is the largest slice at 54.96% (658.82M THB) (dim01, §12.1).",
      },
      {
        q: "What operational risk does the research flag in Yala's data setup?",
        choices: [
          "Too many competing IT departments",
          "A single, likely-understaffed unit with no dedicated IT budget and reliance on an external analytics partner",
          "No internet connectivity",
          "An oversized data-science team",
        ],
        answer: 1,
        explain:
          "Centralising data in one division creates a bottleneck/key-person risk: likely understaffed IT, no dedicated IT budget line, and reliance on Bedrock Analytics (dim01, §11.2, §12.3).",
      },
    ],
  },
];
