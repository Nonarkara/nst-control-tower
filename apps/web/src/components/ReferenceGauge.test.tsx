import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { ReferenceGauge, type ReferenceGaugeProps } from "./ReferenceGauge";
import { RainfallSection } from "./WaterPanel";
import type { RainfallStation } from "@nst/shared";
const props: ReferenceGaugeProps = { label: "Channel", value: 95.6, unit: "%", max: 125, ticks: [0, 50, 100, 125], thresholds: [{ at: 85, label: "Review", level: "warning" }, { at: 100, label: "Bank", level: "critical" }], basis: "HII bank; dashboard review policy" };
describe("reference gauges preserve physical meaning", () => {
  it("puts the bank inside the scale and distinguishes review from bank crossing", () => {
    const html = renderToStaticMarkup(<ReferenceGauge {...props} />);
    expect(html).toContain('data-threshold="100" style="left:80%');
    expect(Number(html.match(/class="reference-gauge__fill" style="width:([\d.]+)%/)?.[1])).toBeCloseTo(76.48, 4);
    expect(html).toContain("4.4 percentage points below Bank");
    expect(html).toContain("Review: reached");
    expect(html).not.toContain("Bank: reached");
  });
  it("announces equality, exceedance and off-scale values instead of silently clipping", () => {
    const equal = renderToStaticMarkup(<ReferenceGauge {...props} value={100} />);
    expect(equal).toContain("Bank: reached");
    const above = renderToStaticMarkup(<ReferenceGauge {...props} value={156} />);
    expect(above).toContain('data-overflow="true"');
    expect(above).toContain("156.0 %");
    expect(above).toContain("Above plotted range");
    expect(above).toContain("56 percentage points above");
  });
  it.each([null, NaN, Infinity, -1])("does not draw missing/invalid readings as measured zero (%s)", value => {
    const html = renderToStaticMarkup(<ReferenceGauge {...props} value={value} />);
    expect(html).toContain('data-reading-state="unknown"');
    expect(html).toContain("not zero");
    expect(html).not.toContain('class="reference-gauge__fill"');
  });
  it("retains a valid zero reading", () => {
    const html = renderToStaticMarkup(<ReferenceGauge {...props} value={0} />);
    expect(html).toContain("0.0 %");
    expect(html).toContain('data-reading-state="below"');
  });
});
const station = (rain24h: number | null): RainfallStation => ({ id: String(rain24h), name: "Rain", rain24h, rain1h: null, lat: 8, lng: 99, amphoe: "", observedAt: "2026-10-20T15:00:00Z" });
it("rainfall absence cannot become an all-clear or dilute the reporting-station mean", () => {
  const absent = renderToStaticMarkup(<RainfallSection rain={[station(null)]} />);
  expect(absent).toContain("unknown, not zero rain");
  expect(absent).not.toContain("no rain across all");
  const partial = renderToStaticMarkup(<RainfallSection rain={[station(null), station(40)]} />);
  expect(partial).toContain("avg 40.0 mm/24h");
});

import { WaterPanel } from "./WaterPanel";
import { FloodRiskPanel } from "./FloodRiskPanel";
import { FloodAnalysisPanel } from "./FloodAnalysisPanel";
import type { WaterGauge, FloodRiskVillage, HistoricalRainfallRecord } from "@nst/shared";
it("a datum shift preserves the warning gap and never produces an elevation ratio bar", () => {
  for (const offset of [0, 100]) {
    const g = { id: "g", name: "Gauge", lat: 8, lng: 99, levelMsl: 5 + offset, warningMsl: 10 + offset, diffFromBank: -7, situationLevel: 3, trend: "stable", amphoe: "", observedAt: "" } as WaterGauge;
    const html = renderToStaticMarkup(<WaterPanel reservoirs={[]} ridReservoirs={[]} waterGauges={[g]} waterRain={[]} loading={false} />);
    expect(html).toContain("5.00");
    expect(html).toContain("below");
    expect(html).toContain("warning");
    expect(html).not.toContain('class="flood-bar"');
    expect(html).not.toContain('class="reference-gauge__fill"');
  }
});
it("unclassified villages occupy an explicit unknown segment of the same total", () => {
  const village: FloodRiskVillage = { year: 2569, month: "Oct", riskLevel: "สูง", province: "NST", district: "City", subdistrict: "Test", villageNumber: 1, standingWater: false, riverOverflow: true, flashFlood: false };
  const html = renderToStaticMarkup(<FloodRiskPanel villages={[village, { ...village, villageNumber: 2, riskLevel: "" }]} />);
  expect(html).toContain("Unknown 1");
  expect(html).toContain('title="Unknown: 1"');
  expect(html.match(/width:50%/g)).toHaveLength(2);
});
it("monthly zero and missing rainfall have zero-area marks, with no fabricated cause shares", () => {
  const rainfall = { annualSummaries: [{ year: 2025, totalMm: 100, wetSeasonMm: 100, drySeasonMm: 0, maxDailyMm: 10, rainDays: 10 }], monthlyNormals: [{ month: 1, avgMm: 0 }, { month: 2, avgMm: null }, { month: 3, avgMm: 100 }] } as unknown as HistoricalRainfallRecord;
  const html = renderToStaticMarkup(<FloodAnalysisPanel rainfall={rainfall} rainfallAge={0} rainfallFallback="reference" floodProne={null} unosat={null} unosatAge={null} unosatFallback={null} />);
  expect(html.match(/height:0%/g)).toHaveLength(2);
  expect(html).toContain("overlapping causes, not measured shares");
  expect(html).not.toContain("45%");
});
