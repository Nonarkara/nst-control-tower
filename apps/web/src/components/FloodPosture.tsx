import type { WaterGauge, RainfallStation, EwsStation, DamStatus, PrecipNowcast, FallbackTier } from "@nst/shared";
import { PanelHeader } from "./PanelHeader";
import { MixedText } from "./MixedText";
import { summarizeFloodEvidence } from "../lib/floodPosture";
import { STATUS, type StatusLevel } from "../lib/status";

interface Props {
  waterGauges: WaterGauge[];
  rainfall: RainfallStation[];
  ews?: EwsStation[];
  dam: DamStatus | null;
  precip: PrecipNowcast | null;
  ageMinutes?: number | null;
  fallbackTier?: FallbackTier;
}
const EWS_LEVEL: StatusLevel[] = ["normal", "watch", "warning", "critical"];
export function FloodPosture({ waterGauges, rainfall, ews = [], ageMinutes, fallbackTier }: Props) {
  const evidence = summarizeFloodEvidence(waterGauges, rainfall, ews);
  return <section className="panel" aria-label="Flood evidence for operator assessment">
    <PanelHeader title="FLOOD EVIDENCE // OPERATOR ASSESSMENT" source="HII · DWR observations" ageMinutes={ageMinutes} fallbackTier={fallbackTier} />
    <p className="flood-posture-body">ข้อมูลระดับจังหวัด · Provincial observations span separate catchments. These readings do not establish water arrival in the city or issue an evacuation order. Confirm affected locations and actions with the duty officer.</p>
    <dl className="flood-stats flood-stats--2">
      <div className="flood-stat"><dt className="flood-label">River evidence ≤ 2 h old</dt><dd className="flood-value">{evidence.assessedWaterCount ? `${evidence.overbankCount} at/over bank` : "Unknown"}</dd><dd className="flood-meta">{evidence.assessedWaterCount} assessable of {evidence.waterCount} recent stations; incomplete coverage is not an all-clear.</dd></div>
      <div className="flood-stat"><dt className="flood-label">Highest measured 24 h rain</dt><dd className="flood-value">{evidence.rain24hMax == null ? "Unknown" : `${evidence.rain24hMax.toFixed(1)} mm`}</dd><dd className="flood-meta">{evidence.rainCount} reporting stations; one-station maximum, not an area average.</dd></div>
    </dl>
    <p className="flood-label">DWR station alerts · สถานะสถานีเตือนภัย</p>
    {evidence.warnings.length ? <ul className="flood-list">{evidence.warnings.slice(0, 5).map(e => {
      const status = STATUS[EWS_LEVEL[e.status] ?? "unknown"];
      return <li key={e.id}><span className="flood-name"><MixedText text={`${e.name} · ${e.amphoe}`} /></span><span style={{color: status.color}}>{status.th} · {status.en}</span><span className="flood-meta">{e.observedAt}</span></li>;
    })}</ul> : <p className="flood-empty">No recent DWR observations. Check the official warning channel and field reports; this is not a normal status.</p>}
  </section>;
}
