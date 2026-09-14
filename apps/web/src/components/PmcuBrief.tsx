import type { IncidentFeature } from "@nst/shared";
import { PanelHeader } from "./PanelHeader";
import { hourlyLoad, zoneOccupancy, type ParkingZone } from "../lib/pmcu";
import { STATUS, type StatusLevel } from "../lib/status";
import { StatusText, loadStatus, statusStyle } from "../lib/cityStatus";

interface Props {
  hour: number;
  isWeekend: boolean;
  iticEvents: IncidentFeature[];
  cityReports: IncidentFeature[];
  trafficSampleCount: number;
}

interface Corridor {
  id: string;
  name: string;
  base: number;
}
const CORRIDORS: Corridor[] = [
  { id: "ratchadamnoen", name: "Ratchadamnoen Rd", base: 0.60 },
  { id: "phatthanakan",  name: "Phatthanakan Rd",  base: 0.50 },
  { id: "klang",         name: "Klang Mueang Rd",  base: 0.45 },
  { id: "phanat",        name: "Pha Nat Road",     base: 0.42 },
];


const PARKING_ZONES: ParkingZone[] = [
  { id: "P1", name: "Municipal Hall · North",   capacity: 320 },
  { id: "P2", name: "Market District · East",   capacity: 480 },
  { id: "P3", name: "Sanam Na Mueang · West",   capacity: 260 },
  { id: "P4", name: "Hospital Complex · South", capacity: 410 },
];


interface FleetEntry {
  id: string;
  label: string;
  count: number;
  unit: string;
  note: string;
}
const FLEET: FleetEntry[] = [
  { id: "muni-bus",  label: "Municipal Bus",   count: 12, unit: "buses",   note: "3 routes · scheduled" },
  { id: "songthaew", label: "Songthaew",       count: 45, unit: "vehicles", note: "city centre routes" },
  { id: "tuk-tuk",   label: "Tuk-tuk",         count: 80, unit: "vehicles", note: "market + tourist areas" },
  { id: "moto-taxi", label: "Moto-taxi",        count: 120, unit: "drivers", note: "licensed stands" },
];

interface Development {
  id: string;
  name: string;
  status: "open" | "in-progress" | "planned";
  describe: string;
}
const DEVELOPMENTS: Development[] = [
  { id: "smart-city",    name: "Smart City Hub",       status: "in-progress", describe: "DEPA-backed IoT + open data infrastructure" },
  { id: "flood-infra",   name: "Flood Retention Basin",status: "in-progress", describe: "Urban drainage upgrade · Tha Dee canal flood mitigation" },
  { id: "digital-svc",   name: "Digital Services",     status: "open",        describe: "Online permits, payments, citizen reporting" },
  { id: "rail-corridor", name: "Rail Corridor Upgrade", status: "planned",     describe: "Southern Line modernisation — passenger + freight through NST city" },
];
const DEV_STATUS: Record<Development["status"], StatusLevel> = {
  open: "normal",
  "in-progress": "watch",
  planned: "unknown",
};

function LoadRow({ name, title, share, level, value }: { name: string; title?: string; share: number; level: StatusLevel; value: string }) {
  return (
    <li className="ops-row">
      <span className="ops-row__name" title={title}>{name}</span>
      <span className="pc-bar" aria-hidden="true">
        <span className="pc-bar__fill" style={{ ...statusStyle(level), width: `${Math.round(share * 100)}%` }} />
      </span>
      <span className="ops-row__val num">
        <span className="pc-glyph" style={statusStyle(level)} aria-hidden="true">{STATUS[level].glyph}</span>
        {value}
        {level !== "normal" && <span className="visually-hidden"> {STATUS[level].en}</span>}
      </span>
    </li>
  );
}

export function PmcuBrief({ hour, isWeekend, iticEvents, cityReports, trafficSampleCount }: Props) {
  const load = hourlyLoad(hour, isWeekend);

  const totalParkingCapacity = PARKING_ZONES.reduce((s, z) => s + z.capacity, 0);
  const totalOccupied = PARKING_ZONES.reduce((s, z) => s + Math.round(z.capacity * zoneOccupancy(z, hour, isWeekend)), 0);
  const totalOccupancyPct = Math.round((totalOccupied / totalParkingCapacity) * 100);

  const openIncidents = cityReports.filter((r) => r.status !== "resolved").length + iticEvents.length;

  return (
    <section className="panel" aria-label="Municipality operations">
      <PanelHeader
        title="MUNICIPALITY OPS"
        fallbackTier="scenario"
        source="live-incidents·model"
        actions={
          <span
            className="mono caption data-age--warn"
            title="Arterial load and parking occupancy are sinusoidal models. Incident counts are live."
            aria-label="Partly modelled data"
          >
            PART MODELLED
          </span>
        }
      />
      {/* ── Municipality overview ── */}
      <section className="pc-section" aria-labelledby="ops-overview">
        <header className="pc-spread">
          <h3 className="pc-label" id="ops-overview">Municipality overview</h3>
          <span className="pc-meta" lang="th">เทศบาลนครนครศรีธรรมราช</span>
        </header>
        <dl className="pc-stats pc-stats--pair pc-stats--xl">
          <div>
            <dt>Road samples</dt>
            <dd className="num">{trafficSampleCount || "—"}</dd>
          </div>
          <div>
            <dt>Open incidents</dt>
            <dd className="num">{openIncidents}</dd>
          </div>
        </dl>
      </section>

      {/* ── Arterial load ── */}
      <section className="pc-section" aria-labelledby="ops-arterial">
        <header className="pc-spread">
          <h3 className="pc-label" id="ops-arterial">Arterial load</h3>
          <span className="pc-meta num">hour {String(hour).padStart(2, "0")}{isWeekend ? " · weekend" : ""}</span>
        </header>
        <ul className="pc-list">
          {CORRIDORS.map((c) => {
            const pct = Math.min(1, c.base * load * 1.4);
            return (
              <LoadRow
                key={c.id}
                name={c.name}
                share={pct}
                level={loadStatus(pct, 0.6, 0.8)}
                value={`${Math.round(pct * 100)}%`}
              />
            );
          })}
        </ul>
        <p className="pc-meta num">
          {trafficSampleCount} road samples · modeled · iTIC live: {iticEvents.length}
        </p>
      </section>

      {/* ── Parking zones ── */}
      <section className="pc-section" aria-labelledby="ops-parking">
        <header className="pc-spread">
          <h3 className="pc-label" id="ops-parking">Parking zones</h3>
          <span className="pc-meta num">{totalOccupied}/{totalParkingCapacity} · {totalOccupancyPct}%</span>
        </header>
        <ul className="pc-list">
          {PARKING_ZONES.map((zone) => {
            const occ = zoneOccupancy(zone, hour, isWeekend);
            const filled = Math.round(zone.capacity * occ);
            return (
              <LoadRow
                key={zone.id}
                name={zone.id}
                title={zone.name}
                share={occ}
                level={loadStatus(occ, 0.75, 0.9)}
                value={`${filled}/${zone.capacity}`}
              />
            );
          })}
        </ul>
        <p className="pc-meta">modeled · sensor feed pending integration</p>
      </section>

      {/* ── Transport fleet ── */}
      <section className="pc-section" aria-labelledby="ops-fleet">
        <header className="pc-spread">
          <h3 className="pc-label" id="ops-fleet">Transport fleet</h3>
          <span className="pc-meta">Nakhon Si Thammarat city area</span>
        </header>
        <ul className="pc-list">
          {FLEET.map((f) => (
            <li key={f.id} className="ops-fleet">
              <span>{f.label}</span>
              <span className="ops-fleet__count num">
                {f.count} <span className="pc-meta">{f.unit}</span>
              </span>
              <span className="ops-fleet__note">{f.note}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* ── Active developments ── */}
      <section className="pc-section" aria-labelledby="ops-dev">
        <header className="pc-spread">
          <h3 className="pc-label" id="ops-dev">Active developments</h3>
          <span className="pc-meta">municipal pipeline</span>
        </header>
        <ul className="pc-list">
          {DEVELOPMENTS.map((d) => (
            <li key={d.id} className="ops-dev">
              <span className="pc-spread">
                <span className="ops-dev__name">{d.name}</span>
                <StatusText level={DEV_STATUS[d.status]}>{d.status}</StatusText>
              </span>
              <span className="pc-meta">{d.describe}</span>
            </li>
          ))}
        </ul>
        <p className="pc-meta">municipal pipeline · data: official comms</p>
      </section>
    </section>
  );
}
