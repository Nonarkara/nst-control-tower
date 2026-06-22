import type { AtlasModule } from "@nst/shared";

const SRC_ITA = "NACC ITAS — NST City Municipality ITA Report (FY2024, itas.nacc.go.th)";
const SRC_LPA = "DLA Local Performance Assessment (LPA 2024)";
const SRC_DEPA = "DEPA Smart City Certification — NST City Municipality";
const SRC_TRAFFY = "Traffy Fondue citizen-report platform (traffy.in.th)";
const SRC_NACC = "nakhoncity.org — official municipal portal";

export const governanceModule: AtlasModule = {
  id: "governance",
  title: "Governance & Transparency",
  titleTh: "ธรรมาภิบาล",
  summary:
    "NST City Municipality is building its digital governance layer: DEPA smart-city grant awarded, Traffy Fondue integrated, and nakhoncity.org as the citizen portal. ITA and open-data publishing are the next targets to match peer cities.",
  accent: "teal",
  indicators: [
    {
      id: "ita-fy2024",
      label: "ITA integrity score",
      labelTh: "คะแนน ITA",
      value: "Grade A",
      unit: "/100",
      benchmark: { label: "Classification", value: "ผ่าน (Pass)" },
      status: "good",
      goodDirection: "up",
      source: SRC_ITA,
      year: 2024,
      note: "NACC ITAS FY2024; exact score pending public publication. NST City Municipality targets top-quartile LAO ranking.",
    },
    {
      id: "depa-smart-city",
      label: "DEPA Smart City certification",
      labelTh: "การรับรอง Smart City DEPA",
      value: "Awarded",
      status: "good",
      goodDirection: "up",
      source: SRC_DEPA,
      year: 2025,
      note: "DEPA awarded NST City Municipality Smart City development grant — flood early-warning IoT sensors and open data platform.",
    },
    {
      id: "traffy-fondue",
      label: "Traffy Fondue reports (province)",
      labelTh: "รายงาน Traffy Fondue",
      value: 3200,
      unit: "reports",
      status: "good",
      goodDirection: "up",
      source: SRC_TRAFFY,
      year: 2025,
      note: "Citizen issue-reporting via Traffy integrated into the dashboard. Flood, road, and waste complaints dominate.",
    },
    {
      id: "open-data",
      label: "Open datasets (DEPA platform)",
      labelTh: "ชุดข้อมูลเปิด",
      value: 8,
      unit: "datasets",
      status: "watch",
      goodDirection: "up",
      source: SRC_DEPA,
      note: "8 downloadable datasets published on DEPA's national Smart City data platform. Target: 20+ by 2027.",
    },
    {
      id: "citizen-portal",
      label: "Citizen portal",
      labelTh: "พอร์ทัลประชาชน",
      value: "nakhoncity.org",
      status: "good",
      goodDirection: "neutral",
      source: SRC_NACC,
      note: "Official NST City Municipality website; Facebook page @nakhoncity is the primary citizen-comms channel.",
    },
    {
      id: "lpa-2024",
      label: "LPA performance score",
      labelTh: "คะแนน LPA",
      value: 82,
      unit: "/100",
      benchmark: { label: "Classification", value: "Good" },
      status: "good",
      goodDirection: "up",
      source: SRC_LPA,
      year: 2024,
      note: "DLA Local Performance Assessment 2024. Target: move to 'Very Good' (85+) by integrating real-time open data.",
    },
  ],
  charts: [
    {
      kind: "bar",
      title: "Digital governance signals",
      data: [
        { name: "Open datasets (DEPA)", nameTh: "ชุดข้อมูลเปิด", value: 8 },
        { name: "Traffy reports (hundreds)", nameTh: "รายงาน Traffy (ร้อยเรื่อง)", value: 32 },
        { name: "DEPA Smart City grant", nameTh: "ทุน DEPA", value: 1 },
        { name: "IoT flood sensors (planned)", nameTh: "เซ็นเซอร์ IoT น้ำท่วม", value: 24 },
      ],
      note: "Counts (unit varies per bar). Traffy shown in hundreds. IoT sensors: target for 2026 DEPA project delivery.",
    },
    {
      kind: "bar",
      title: "Governance maturity targets",
      unit: "/100",
      data: [
        { name: "ITA current (est.)", nameTh: "ITA ปัจจุบัน", value: 85 },
        { name: "ITA target (2027)", nameTh: "ITA เป้าหมาย 2570", value: 92 },
        { name: "LPA current", nameTh: "LPA ปัจจุบัน", value: 82 },
        { name: "LPA target (2027)", nameTh: "LPA เป้าหมาย 2570", value: 88 },
      ],
      note: "Current vs 2027 targets for ITA and LPA scores. Source: NST Smart City Programme roadmap.",
    },
  ],
  meta: {
    source: "NST Municipal Data Source Bible — Governance (NACC ITAS, DLA LPA, DEPA, Traffy)",
    fetchedAt: "2026-06-19T00:00:00.000Z",
    ageMinutes: 0,
    fallbackTier: "reference",
    note: "Static reference data digitized from the NST Municipal Data Source Bible (Jun 2026)",
  },
};
