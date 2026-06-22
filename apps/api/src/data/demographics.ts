import type { AtlasModule } from "@nst/shared";

const SRC_CITY = "NST City Municipality Civil Registration (nakhoncity.org)";
const SRC_DOPA = "DOPA Population Registration System (2022)";
const SRC_NSO = "NSO Nakhon Si Thammarat Provincial Statistics Office";
const SRC_ELDER = "NSO NST — Elderly Analysis Report (Elder 2566)";
const SRC_PWD = "MSDHS / NST Provincial Social Development Office (2023)";
const SRC_WELFARE = "Ministry of Finance (FPO) + NSO NST — State Welfare Card";

export const demographicsModule: AtlasModule = {
  id: "demographics",
  title: "Population & Demographics",
  titleTh: "ประชากรและประชากรศาสตร์",
  summary:
    "Who NST serves: a city municipality of 102,152 within a province of 1.55 million — predominantly Buddhist, increasingly aging, with a large but declining rural agricultural population.",
  accent: "teal",
  indicators: [
    {
      id: "city-registered-pop",
      label: "City municipality population",
      labelTh: "ประชากรเทศบาลนครนครศรีธรรมราช",
      value: 102152,
      unit: "persons",
      benchmark: { label: "Province", value: 1545147 },
      status: "neutral",
      goodDirection: "neutral",
      source: SRC_CITY,
      note: "Registered residents of NST City Municipality; excludes the broader Mueang district (≈ 275,000).",
    },
    {
      id: "province-registered-pop",
      label: "Provincial population",
      labelTh: "ประชากรจังหวัดนครศรีธรรมราช",
      value: 1545147,
      unit: "persons",
      benchmark: { label: "households", value: 509812 },
      status: "neutral",
      goodDirection: "neutral",
      source: SRC_DOPA,
      year: 2022,
      note: "DOPA 2022: 742,738 male / 802,409 female across 509,812 households. 23 amphoe.",
    },
    {
      id: "elderly-pop",
      label: "Elderly (60+)",
      labelTh: "ผู้สูงอายุ (60+)",
      value: 207000,
      unit: "persons",
      benchmark: { label: "% of province", value: "13.4%" },
      status: "alert",
      goodDirection: "neutral",
      source: SRC_ELDER,
      year: 2023,
      note: "NST is an Aging Society; elderly share rising with out-migration of working-age adults to Bangkok.",
    },
    {
      id: "registered-disabilities",
      label: "Registered disabilities",
      labelTh: "ผู้พิการที่ขึ้นทะเบียน",
      value: 52000,
      unit: "persons",
      status: "watch",
      goodDirection: "neutral",
      source: SRC_PWD,
      year: 2023,
      note: "Province-wide MSDHS registry. Physical disability is the largest category.",
    },
    {
      id: "pct-buddhist",
      label: "Buddhist population",
      labelTh: "ประชากรพุทธ",
      value: "91%",
      status: "neutral",
      goodDirection: "neutral",
      source: SRC_NSO,
      note: "Predominantly Theravada Buddhist province; home to Wat Phra Mahathat Woramahawihan.",
    },
    {
      id: "welfare-card-holders",
      label: "State welfare-card holders",
      labelTh: "ผู้ถือบัตรสวัสดิการแห่งรัฐ",
      value: 310000,
      unit: "persons",
      benchmark: { label: "% of province", value: "20.1%" },
      status: "alert",
      goodDirection: "down",
      source: SRC_WELFARE,
      note: "Low-income registrants (Thai citizens 18+, income ≤ 100,000 THB/yr). Concentrated in rural flood-prone tambon.",
    },
  ],
  charts: [
    {
      kind: "donut",
      title: "City vs province population",
      unit: "persons",
      centerLabel: "1.55M",
      data: [
        { name: "City Municipality", nameTh: "เทศบาลนคร", value: 102152, color: "teal" },
        { name: "Rest of Province", nameTh: "ส่วนที่เหลือ", value: 1442995, color: "blue" },
      ],
      note: "NST City Municipality (102,152) within the province (1,545,147). Source: DOPA 2022.",
    },
    {
      kind: "hbar",
      title: "Vulnerable groups (province)",
      unit: "persons",
      data: [
        { name: "Welfare-card holders", nameTh: "บัตรสวัสดิการแห่งรัฐ", value: 310000 },
        { name: "Elderly (60+)", nameTh: "ผู้สูงอายุ", value: 207000 },
        { name: "Registered disabilities", nameTh: "ผู้พิการ", value: 52000 },
      ],
      note: "Provincial counts (DOPA / MSDHS / FPO). Groups overlap — many elderly also hold welfare cards.",
    },
    {
      kind: "area",
      title: "Population trend (province)",
      unit: "persons",
      series: [
        {
          name: "Province population",
          color: "teal",
          points: [
            { x: "2015", y: 1530000 },
            { x: "2022", y: 1545147 },
          ],
        },
      ],
      note: "Slow growth from ≈1.53M (2015) to 1.55M (2022). Out-migration of working-age adults moderates growth.",
    },
  ],
  meta: {
    source: "NST Municipal Data Source Bible — Demographics (DOPA, NSO, MSDHS)",
    fetchedAt: "2026-06-19T00:00:00.000Z",
    ageMinutes: 0,
    fallbackTier: "reference",
    note: "Static reference data digitized from the NST Municipal Data Source Bible (Jun 2026)",
  },
};
