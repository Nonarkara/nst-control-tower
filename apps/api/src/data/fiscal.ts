import type { AtlasModule } from "@nst/shared";

const SRC_DLA = "DLA e-LAAS / Local Government Fiscal Report — NST City Municipality";
const SRC_DEPA = "DEPA Smart City Grant — NST Flood Early Warning (2025)";
const SRC_MOPH = "MOPH / Ministerial budget allocation — Maharaj Hospital";

export const fiscalModule: AtlasModule = {
  id: "fiscal",
  title: "Municipal Fiscal",
  titleTh: "การคลังเทศบาล",
  summary:
    "NST City Municipality's budget data is not yet published via a public dashboard — this module surfaces the known structural picture: DLA formula transfers, DEPA smart-city grants, and the post-flood reconstruction burden.",
  accent: "gold",
  indicators: [
    {
      id: "fiscal-transfers",
      label: "Central-transfer dependence",
      labelTh: "การพึ่งพาเงินอุดหนุนส่วนกลาง",
      value: "60–80% of revenue",
      status: "watch",
      goodDirection: "neutral",
      source: SRC_DLA,
      year: 2025,
      note: "Typical for Thai city municipalities: DLA formula transfers (general + specific subsidies) dominate revenue. Local tax collection covers ≈15–20%.",
    },
    {
      id: "depa-smart-city-grant",
      label: "DEPA Smart City grant",
      labelTh: "เงินทุน DEPA Smart City",
      value: "Awarded",
      status: "good",
      goodDirection: "up",
      source: SRC_DEPA,
      year: 2025,
      note: "DEPA awarded NST City Municipality a Smart City development grant for flood early-warning IoT + open data platform.",
    },
    {
      id: "flood-reconstruction-2025",
      label: "2025 flood reconstruction budget",
      labelTh: "งบซ่อมแซมน้ำท่วม 2568",
      value: 33960,
      unit: "M THB (estimated loss)",
      status: "critical",
      goodDirection: "neutral",
      source: SRC_DLA,
      year: 2025,
      note: "Estimated economic loss from Nov 2025 flood (DDPM); triggers emergency central disbursements + NDPF claims.",
    },
    {
      id: "hospital-budget",
      label: "Maharaj Hospital annual budget",
      labelTh: "งบประมาณ รพ.มหาราช",
      value: 2800,
      unit: "M THB",
      status: "neutral",
      goodDirection: "neutral",
      source: SRC_MOPH,
      year: 2024,
      note: "MOPH allocation for Maharaj Nakhon Si Thammarat Hospital (844 beds). Largest health institution in the province.",
    },
    {
      id: "data-gap",
      label: "Municipal budget dashboard",
      labelTh: "แดชบอร์ดงบประมาณเทศบาล",
      value: "Not published",
      status: "alert",
      goodDirection: "up",
      source: SRC_DLA,
      note: "NST City Municipality has not yet published a public budget breakdown dashboard (contrast: Yala which publishes via yaladashboard.com). Wire DLA/e-LAAS integration to populate.",
    },
  ],
  charts: [
    {
      kind: "donut",
      title: "Municipal revenue structure (typical)",
      unit: "%",
      centerLabel: "Revenue",
      data: [
        { name: "Central transfers", nameTh: "เงินอุดหนุนส่วนกลาง", value: 70, color: "blue", note: "DLA formula" },
        { name: "Local taxes", nameTh: "ภาษีท้องถิ่น", value: 17, color: "teal", note: "Land, signage, VAT share" },
        { name: "Own revenue", nameTh: "รายได้อื่น", value: 13, color: "gold", note: "Fees, fines, services" },
      ],
      note: "Estimated structural split for NST City Municipality based on DLA national norms. Actual breakdown requires e-LAAS integration.",
    },
    {
      kind: "bar",
      title: "Key budget data gaps to close",
      data: [
        { name: "Annual budget total", value: 0, note: "Pending e-LAAS/DLA integration" },
        { name: "Tax collected vs estimate", value: 0, note: "Pending Finance Bureau feed" },
        { name: "Expenditure by function", value: 0, note: "Pending Budget Bureau feed" },
      ],
      note: "Zero bars indicate data gaps — not zero values. Wire e-LAAS/DLA API to populate. Priority: municipal annual budget, tax, and expenditure breakdown.",
    },
  ],
  meta: {
    source: "NST Municipal Data Source Bible — Fiscal (DLA e-LAAS, DEPA, MOPH)",
    fetchedAt: "2026-06-19T00:00:00.000Z",
    ageMinutes: 0,
    fallbackTier: "reference",
    note: "Static reference data digitized from the NST Municipal Data Source Bible (Jun 2026). Fiscal dashboard integration is a high-priority gap.",
  },
};
