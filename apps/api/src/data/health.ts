import type { AtlasModule } from "@nst/shared";

const SOURCE = "NST Municipal Data Source Bible — Health (MOPH HDC, MoPH 2024)";
const SRC_MOPH = "Ministry of Public Health (MOPH) Health Data Center (HDC)";
const SRC_HOSPITAL = "MOPH Hospital Information System (HIS) — NST Health Region 11";
const SRC_AQ = "Open-Meteo Air Quality API + AQICN NST station";

export const healthModule: AtlasModule = {
  id: "health",
  title: "Health & Health Services",
  titleTh: "สาธารณสุข",
  summary:
    "NST's health backbone: Maharaj Hospital (844 beds) + City Municipality Hospital (479 beds) anchor a regional network. Main pressures are flood-related illness, dengue, NCDs, and air quality gaps from no permanent PCD station.",
  accent: "green",
  indicators: [
    {
      id: "maharaj-beds",
      label: "Maharaj Hospital beds",
      labelTh: "เตียง รพ.มหาราชนครศรีธรรมราช",
      value: 844,
      unit: "beds",
      status: "neutral",
      goodDirection: "up",
      source: SRC_HOSPITAL,
      year: 2024,
      note: "Regional hospital, health code 11101; the primary referral centre for NST and lower south.",
    },
    {
      id: "city-hospital-beds",
      label: "City Municipality Hospital beds",
      labelTh: "เตียง รพ.เทศบาลนคร",
      value: 479,
      unit: "beds",
      status: "neutral",
      goodDirection: "up",
      source: SRC_HOSPITAL,
      year: 2024,
      note: "NST City Municipality Hospital (code 11414); serves the urban core.",
    },
    {
      id: "total-beds",
      label: "Total hospital beds (city)",
      labelTh: "เตียงรวม (ในเขตเมือง)",
      value: 1323,
      unit: "beds",
      benchmark: { label: "Maharaj + City Hosp", value: "844 + 479" },
      status: "good",
      goodDirection: "up",
      source: SRC_HOSPITAL,
      year: 2024,
      note: "Combined bed count for the two city-area hospitals; additional district hospitals in the province.",
    },
    {
      id: "dengue-incidence",
      label: "Dengue incidence",
      labelTh: "อัตราป่วยไข้เลือดออก",
      value: 38,
      unit: "/100k",
      status: "alert",
      goodDirection: "down",
      source: SRC_MOPH,
      year: 2023,
      note: "NST ranks in the upper quartile nationally for dengue; monsoon flooding concentrates vector breeding sites.",
    },
    {
      id: "pm25",
      label: "PM2.5 annual average",
      labelTh: "ค่าเฉลี่ย PM2.5",
      value: 18,
      unit: "µg/m³",
      status: "watch",
      goodDirection: "down",
      source: SRC_AQ,
      year: 2024,
      note: "Estimate from Open-Meteo AQ + AQICN nearest station. NST has no permanent PCD monitoring station — a documented data gap.",
    },
    {
      id: "flood-related-disease",
      label: "Flood-related illness burden",
      labelTh: "โรคจากน้ำท่วม",
      value: "High",
      status: "alert",
      goodDirection: "down",
      source: SRC_MOPH,
      year: 2024,
      note: "Nov 2025 flood event: 223,221 households affected across 22 districts; leptospirosis, skin disease, and diarrhoea spike post-flood.",
    },
    {
      id: "covid-vaccination",
      label: "COVID-19 vaccination coverage",
      labelTh: "ความครอบคลุมวัคซีนโควิด",
      value: 82,
      unit: "%",
      status: "good",
      goodDirection: "up",
      source: SRC_MOPH,
      note: "Provincial COVID-19 vaccination coverage.",
    },
  ],
  charts: [
    {
      kind: "hbar",
      title: "Hospital capacity (city area)",
      unit: "beds",
      data: [
        { name: "Maharaj Hospital", nameTh: "รพ.มหาราช", value: 844 },
        { name: "City Municipality Hospital", nameTh: "รพ.เทศบาลนคร", value: 479 },
      ],
      note: "Two primary hospitals serving the NST city municipality. Source: MOPH HIS 2024.",
    },
    {
      kind: "hbar",
      title: "Key health risks",
      unit: "severity (1–5)",
      data: [
        { name: "Flood-related illness", nameTh: "โรคจากน้ำท่วม", value: 5, note: "Leptospirosis, skin, diarrhoea" },
        { name: "Dengue fever", nameTh: "ไข้เลือดออก", value: 4, note: "Upper-quartile nationally" },
        { name: "NCDs (hypertension, DM)", nameTh: "โรคไม่ติดต่อ", value: 4, note: "Aging population driver" },
        { name: "Air quality (PM2.5)", nameTh: "คุณภาพอากาศ", value: 2, note: "No permanent PCD station — data gap" },
      ],
      note: "Qualitative severity ranking from Data Source Bible. Not a standardised index.",
    },
    {
      kind: "hbar",
      title: "NST hospital network — bed capacity by facility type",
      unit: "beds",
      data: [
        { name: "Maharaj (regional)", value: 844, color: "var(--accent)" },
        { name: "City Municipality Hosp.", value: 479, color: "var(--good)" },
        { name: "Tha Sala Hospital", value: 120 },
        { name: "Pak Phanang Hospital", value: 120 },
        { name: "Sichon Hospital", value: 90 },
        { name: "Nopphitam (community)", value: 30 },
      ],
      note: "NST Health Region 11 network. Maharaj is the primary referral for the lower south. Source: MOPH HIS 2024.",
    },
    {
      kind: "grouped-bar",
      title: "NST vs national health benchmarks",
      note: "Sources: MOPH HDC 2023–24; WHO Thailand benchmarks.",
      groups: [
        {
          label: "Beds / 10k pop",
          values: [
            { name: "NST", value: 8.6, color: "var(--accent)" },
            { name: "National", value: 7.2 },
          ],
        },
        {
          label: "Dengue / 100k",
          values: [
            { name: "NST", value: 38, color: "var(--bad)" },
            { name: "National", value: 22 },
          ],
        },
        {
          label: "COVID vacc. %",
          values: [
            { name: "NST", value: 82, color: "var(--accent)" },
            { name: "National", value: 79 },
          ],
        },
      ],
    },
  ],
  meta: {
    source: SOURCE,
    fetchedAt: "2026-06-19T00:00:00.000Z",
    ageMinutes: 0,
    fallbackTier: "reference",
    note: "Static reference data digitized from the NST Municipal Data Source Bible (Jun 2026)",
  },
};
