/**
 * Seasonal flood-risk calendar — Mueang Nakhon Si Thammarat's 16 tambons.
 *
 * Source: HII open-data "พื้นที่เสี่ยงน้ำท่วม" (monthly-flood-risk-area.csv,
 * https://data.hii.or.th/dataset/flood-area) — per-tambon per-month risk classes
 * derived from GISTDA satellite-detected flood extents over the 17 years
 * 2005–2021 (พ.ศ. 2548–2564). Static historical statistics, refreshed only when
 * HII republishes; regenerate with apps/web/scripts/build_hii_geo.py's
 * companion extraction (see script header).
 *
 * risk[i] = January..December, 0 = no recorded flooding that month,
 * 1 = low (1–3 events/17y), 2 = medium (4–8), 3 = high (9+).
 * peakFloods17y = the tambon's worst month's event count over the record.
 */

export interface TambonFloodSeason {
  geocode: string;
  th: string;
  en: string;
  /** Jan..Dec risk class 0–3. */
  risk: number[];
  peakFloods17y: number;
}

export const SEASONAL_FLOOD_RISK: TambonFloodSeason[] = [
  { geocode: "800101", th: "ในเมือง", en: "Nai Mueang", risk: [1, 0, 1, 1, 0, 0, 0, 0, 0, 0, 2, 2], peakFloods17y: 6 },
  { geocode: "800102", th: "ท่าวัง", en: "Tha Wang", risk: [1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 2, 2], peakFloods17y: 8 },
  { geocode: "800103", th: "คลัง", en: "Khlang", risk: [1, 0, 1, 1, 0, 0, 0, 0, 0, 0, 1, 1], peakFloods17y: 2 },
  { geocode: "800106", th: "ท่าไร่", en: "Tha Rai", risk: [1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 2, 3], peakFloods17y: 12 },
  { geocode: "800107", th: "ปากนคร", en: "Pak Nakhon", risk: [1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 2, 3], peakFloods17y: 12 },
  { geocode: "800108", th: "นาทราย", en: "Na Sai", risk: [2, 1, 1, 1, 0, 0, 0, 0, 0, 0, 2, 3], peakFloods17y: 12 },
  { geocode: "800112", th: "กำแพงเซา", en: "Kamphaeng Sao", risk: [0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0], peakFloods17y: 1 },
  { geocode: "800113", th: "ไชยมนตรี", en: "Chai Montri", risk: [1, 0, 1, 1, 0, 0, 0, 0, 0, 0, 2, 2], peakFloods17y: 5 },
  { geocode: "800114", th: "มะม่วงสองต้น", en: "Mamuang Song Ton", risk: [1, 0, 1, 1, 0, 0, 0, 0, 0, 0, 2, 2], peakFloods17y: 7 },
  { geocode: "800115", th: "นาเคียน", en: "Na Khian", risk: [2, 1, 1, 1, 0, 0, 0, 0, 0, 0, 2, 3], peakFloods17y: 11 },
  { geocode: "800116", th: "ท่างิ้ว", en: "Tha Ngio", risk: [2, 1, 1, 1, 0, 0, 0, 0, 0, 0, 2, 3], peakFloods17y: 12 },
  { geocode: "800118", th: "โพธิ์เสด็จ", en: "Pho Sadet", risk: [1, 0, 1, 1, 0, 0, 0, 0, 0, 0, 2, 2], peakFloods17y: 7 },
  { geocode: "800119", th: "บางจาก", en: "Bang Chak", risk: [2, 1, 1, 1, 0, 0, 0, 0, 0, 0, 2, 3], peakFloods17y: 12 },
  { geocode: "800120", th: "ปากพูน", en: "Pak Phun", risk: [1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 2, 3], peakFloods17y: 12 },
  { geocode: "800121", th: "ท่าซัก", en: "Tha Sak", risk: [1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 2, 3], peakFloods17y: 11 },
  { geocode: "800122", th: "ท่าเรือ", en: "Tha Ruea", risk: [2, 1, 1, 1, 0, 0, 0, 0, 0, 0, 2, 3], peakFloods17y: 12 },
];

export const SEASONAL_RISK_SOURCE = "hii.or.th flood-area · GISTDA satellite record 2005–2021";
