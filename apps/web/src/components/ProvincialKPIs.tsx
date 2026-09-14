/**
 * ProvincialKPIs — real government data from data.go.th.
 * Replaces the stub "MUNICIPALITY OVERVIEW" that showed mocked numbers.
 *
 * Data sources:
 *   Population  — สำนักทะเบียน
 *   Tourism     — สำนักงานการท่องเที่ยวและกีฬาจังหวัดชลบุรี
 *   Hotel       — monthly occupancy %
 *   Accidents   — สถิติอุบัติเหตุรายอำเภอ
 *   Welfare     — ผู้สูงอายุ + ผู้พิการ (Bang Sarae sample)
 */

import { fmtN } from "../lib/provincial";
import { PanelHeader } from "./PanelHeader";
import type { FallbackTier } from "@nst/shared";

const MONTH_TH = ["", "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.",
  "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];

interface Kpi {
  label: string;
  value: string;
  sub?: string;
  /** Mark Thai-script values so they get the Thai face + pronunciation. */
  thaiValue?: boolean;
}

export interface ProvincialKPIs {
  cityPopulation?: { total: number; year: number } | null;
  population: { total: number; year: number } | null;
  tourism: {
    year: number | null;
    totalVisitors: number | null;
    thaiVisitors: number | null;
    foreignVisitors: number | null;
    revenueMillionBaht: number | null;
    topForeignNationality: string | null;
    topForeignCount: number | null;
  } | null;
  hotel: { occupancyPct: number | null; guestsThisMonth: number | null; year: number; month: number } | null;
  accidents: { incidents: number; injured: number; deaths: number; per100k: number | null; year: number } | null;
  hotspotDistrict: { name: string; deaths: number; year: number } | null;
  welfare: { elderly: number; disabled: number } | null;
}

interface Props {
  data: ProvincialKPIs | null;
  loading: boolean;
  ageMinutes?: number | null;
  fallbackTier?: FallbackTier;
}

const TITLE = "NST PROVINCE // DATA.GO.TH";
const THAI_SCRIPT = /[฀-๿]/;

function KpiTile({ label, value, sub, thaiValue }: Kpi) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>
        <span className="num" lang={thaiValue ? "th" : undefined}>{value}</span>
        {sub && <span className="pc-stats__sub" lang={THAI_SCRIPT.test(sub) ? "th" : undefined}>{sub}</span>}
      </dd>
    </div>
  );
}

export function ProvincialKPIs({ data, loading, ageMinutes, fallbackTier }: Props) {
  if (loading && !data) {
    return (
      <section className="panel" aria-busy="true" aria-label="Loading provincial KPIs">
        <PanelHeader title={TITLE} ageMinutes={ageMinutes} fallbackTier={fallbackTier} source="data.go.th" />
        <span className="skeleton pc-skeleton pc-skeleton--tall" />
        <span className="skeleton pc-skeleton pc-skeleton--tall" />
      </section>
    );
  }
  if (!data) return null;

  const { cityPopulation, population, tourism, hotel, accidents, hotspotDistrict, welfare } = data;

  const kpis: Kpi[] = [];

  // Lead with the CITY municipality registry — the unit the dashboard governs.
  if (cityPopulation) {
    kpis.push({
      label: "CITY POPULATION",
      value: fmtN(cityPopulation.total),
      sub: `เทศบาลนคร · DOPA ${cityPopulation.year}`,
    });
  }
  if (population) {
    kpis.push({
      label: cityPopulation ? "PROVINCE POP." : "POPULATION",
      value: fmtN(population.total),
      sub: `23 อำเภอ · DOPA ${population.year}`,
    });
  }

  if (tourism?.totalVisitors) {
    kpis.push({
      label: "VISITORS / YEAR",
      value: fmtN(tourism.totalVisitors),
      sub: tourism.year ? `${tourism.year} · ฿${fmtN(tourism.revenueMillionBaht)}M revenue` : undefined,
    });
  }

  if (tourism?.topForeignNationality && tourism.topForeignNationality !== "—") {
    kpis.push({
      label: "TOP FOREIGN",
      value: tourism.topForeignNationality,
      sub: `#1 · ${fmtN(tourism.topForeignCount)} visitors`,
      thaiValue: THAI_SCRIPT.test(tourism.topForeignNationality),
    });
  }

  if (hotel?.occupancyPct != null) {
    const occ = hotel.occupancyPct;
    kpis.push({
      label: "HOTEL OCCUPANCY",
      value: `${occ.toFixed(1)}%`,
      sub: `${MONTH_TH[hotel.month] ?? hotel.month}/${hotel.year} · ${fmtN(hotel.guestsThisMonth)} guests`,
    });
  }

  if (accidents) {
    kpis.push({
      label: "ROAD DEATHS / YEAR",
      value: String(accidents.deaths),
      sub: `${accidents.incidents} incidents · ${accidents.per100k?.toFixed(1) ?? "—"} per 100K · ${accidents.year}`,
    });
  }

  if (hotspotDistrict && hotspotDistrict.deaths > 0) {
    const name = hotspotDistrict.name.replace("อำเภอ", "").trim() || hotspotDistrict.name;
    kpis.push({
      label: "DEADLIEST DISTRICT",
      value: name,
      sub: `${hotspotDistrict.deaths} deaths · ${hotspotDistrict.year}`,
      thaiValue: THAI_SCRIPT.test(name),
    });
  }

  if (welfare) {
    kpis.push({
      label: "VULNERABLE PERSONS",
      value: fmtN(welfare.elderly + welfare.disabled),
      sub: `${fmtN(welfare.elderly)} elderly · ${fmtN(welfare.disabled)} disabled`,
    });
  }

  return (
    <section className="panel" aria-label="Provincial KPIs">
      <PanelHeader title={TITLE} ageMinutes={ageMinutes} fallbackTier={fallbackTier} source="data.go.th" />
      <dl className="pc-stats pc-stats--pair">
        {kpis.map((k) => <KpiTile key={k.label} {...k} />)}
      </dl>
      <p className="pc-meta">
        SOURCE · DATA.GO.TH · <span lang="th">สำนักงานจังหวัดนครศรีธรรมราช + กระทรวงท่องเที่ยวและกีฬา</span>
      </p>
    </section>
  );
}
