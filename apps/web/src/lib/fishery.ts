/**
 * Pure fishery zone assessment logic — no React, no I/O.
 *
 * Extracted from FisheryPanel so it can be unit-tested without a DOM or
 * React rendering environment. FisheryPanel imports from here.
 */

export interface MarineSnapshot {
  waveHeightM: number | null;
  windKmh: number | null;
  sstC: number | null;
  swellHeightM: number | null;
  thermalStress: boolean;
  smallBoatSafe: boolean;
}

export interface TideSnapshot {
  springTide: boolean;
  heightM: number;
}

export interface FisheryZone {
  id: string;
  nameTh: string;
  nameEn: string;
  type: "oyster" | "shrimp" | "mussel" | "artisanal" | "offshore";
  /** Wave threshold for safe operations (m) */
  waveThreshold: number;
  /** SST upper limit for stock health (°C) */
  sstLimit: number;
}

// NST Gulf-of-Thailand coast, running north→south: Khanom · Sichon · Tha Sala ·
// Mueang/Pak Nakhon · Pak Phanang estuary. Tha Sala is known for oyster culture,
// Pak Phanang bay for shrimp aquaculture + blood-cockle beds; Sichon for artisanal
// inshore fishing; the open Gulf for offshore trawlers.
export const ZONES: FisheryZone[] = [
  { id: "thasala",     nameTh: "หอยนางรมท่าศาลา",  nameEn: "Tha Sala oyster",    type: "oyster",    waveThreshold: 0.8, sstLimit: 31 },
  { id: "pakphanang",  nameTh: "กุ้งปากพนัง",       nameEn: "Pak Phanang shrimp", type: "shrimp",    waveThreshold: 0.6, sstLimit: 32 },
  { id: "cockle",      nameTh: "หอยแครงปากพนัง",    nameEn: "Pak Phanang cockle", type: "mussel",    waveThreshold: 0.9, sstLimit: 31 },
  { id: "sichon",      nameTh: "ประมงพื้นบ้านสิชล",  nameEn: "Sichon artisanal",   type: "artisanal", waveThreshold: 1.5, sstLimit: 34 },
  { id: "offshore",    nameTh: "อ่าวไทยนอกฝั่ง",     nameEn: "Gulf offshore",      type: "offshore",  waveThreshold: 2.5, sstLimit: 35 },
];

// Seasonal calendar — months when stock is most at risk or protected
// (simplified; based on Thai Fisheries Dept seasonal advisories)
export const SEASON_NOTES: Record<FisheryZone["type"], { month: number; note: string }[]> = {
  oyster:    [{ month: 3,  note: "Pre-spawn — avoid stirring substrate" },
              { month: 4,  note: "Spawning — harvesting restricted" },
              { month: 10, note: "Post-monsoon — best oyster quality" }],
  shrimp:    [{ month: 5,  note: "Rainy season — disease risk rises" },
              { month: 11, note: "Cool season — peak growth" }],
  mussel:    [{ month: 4,  note: "Summer stress — high mortality risk above 31°C" }],
  artisanal: [{ month: 6,  note: "Monsoon — restrict small-boat operations" },
              { month: 7,  note: "Monsoon — restrict small-boat operations" }],
  offshore:  [{ month: 7,  note: "Tropical cyclone season — monitor TMD" },
              { month: 8,  note: "Tropical cyclone season — monitor TMD" }],
};

export function zoneStatus(
  zone: FisheryZone,
  marine: MarineSnapshot | null,
  tide: TideSnapshot | null,
  precipMm: number | null,
): { level: "go" | "caution" | "hold"; reason: string } {
  if (!marine) return { level: "caution", reason: "No marine data" };

  const wave   = marine.waveHeightM ?? 0;
  const sst    = marine.sstC ?? 28;
  const rain   = precipMm ?? 0;
  const spring = tide?.springTide ?? false;

  const reasons: string[] = [];
  if (wave > zone.waveThreshold)                           reasons.push(`wave ${wave.toFixed(1)}m`);
  if (sst > zone.sstLimit)                                 reasons.push(`SST ${sst.toFixed(1)}°C`);
  if (rain > 20 && zone.type !== "offshore")               reasons.push("runoff risk");
  if (spring && zone.type !== "offshore")                  reasons.push("spring tide");

  if (reasons.length === 0) return { level: "go", reason: "All clear" };

  if (wave > zone.waveThreshold * 1.5 || sst > zone.sstLimit + 1)
    return { level: "hold", reason: reasons.join(" · ") };

  return { level: "caution", reason: reasons.join(" · ") };
}
