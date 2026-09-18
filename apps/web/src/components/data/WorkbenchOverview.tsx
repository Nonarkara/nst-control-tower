/**
 * Hero, preparation rule, stat grid and domain bars for the workbench.
 */

import { fmtInt } from "./workbenchLib";
import type { WorkbenchIndex } from "./workbenchTypes";

interface Props {
  index: WorkbenchIndex;
  domain: string | null;
  onDomain: (key: string | null) => void;
}

interface Stat {
  th: string;
  en: string;
  value: number;
  sub?: string;
  tone?: "bad";
}

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" });
}

export function WorkbenchOverview({ index, domain, onDomain }: Props) {
  const s = index.stats;
  const stats: Stat[] = [
    { th: "ชุดข้อมูลที่พบ", en: "Sources found", value: s.datasets, sub: `${fmtInt(s.inScope)} ไฟล์/ลิงก์ของจังหวัด · files & links` },
    { th: "ตารางที่อ่านได้", en: "Machine-readable tables", value: s.tables },
    { th: "แถวจากแหล่ง", en: "Source rows", value: s.sourceRows, sub: `แสดงได้ ${fmtInt(s.sampledRows)} แถว · rows shown` },
    { th: "พร้อมเชิงพื้นที่", en: "Spatial-ready", value: s.spatial },
    { th: "มีพิกัด", en: "With coordinates", value: s.coords },
    { th: "อนุกรมเวลา", en: "Time series", value: s.time },
    { th: "มีคอลัมน์ตัวเลข", en: "Numeric", value: s.numeric },
    { th: "มีแต่รายการ", en: "List-only (no table)", value: s.noTable, sub: "ชุดข้อมูล · datasets" },
    { th: "อ่านไม่สำเร็จ", en: "Failed to read", value: s.failed, sub: "ไฟล์ · files", tone: "bad" },
  ];
  const max = Math.max(1, ...index.domains.map((d) => d.datasets));

  return (
    <>
      <section className="dwb-hero" aria-labelledby="dwb-hero-title">
        <p className="dwb-eyebrow">
          data.go.th · ค้นคำว่า “{index.query}” · กวาดล่าสุด {fmtDate(index.crawledAt)}
        </p>
        <h1 id="dwb-hero-title" className="dwb-hero__title">
          ข้อมูลทุกชุดต้องค้นได้ ตรวจสอบได้ และพร้อมใช้ต่อ
        </h1>
        <p className="dwb-hero__en">Every dataset searchable, auditable and ready to reuse.</p>
        <p className="dwb-hero__body">
          หน้านี้กวาดแคตตาล็อก data.go.th ทั้งหมดของจังหวัดนครศรีธรรมราช อ่านไฟล์ที่อ่านได้ (CSV, Excel, JSON)
          ให้เป็นตารางมาตรฐาน ตรวจหาคอลัมน์พื้นที่ เวลา และตัวเลข และเก็บลิงก์ต้นทางของทุกชุดไว้เสมอ
          ไฟล์ที่อ่านไม่ได้ไม่ถูกซ่อน — ยังอยู่ในทะเบียนตรวจสอบพร้อมเหตุผล
        </p>
        <p className="dwb-hero__body dwb-sub">
          We sweep the whole data.go.th catalog for the province, parse readable files into standard tables, detect
          spatial, time and numeric columns, and keep the source link for every dataset. Files we cannot read stay
          visible in the audit ledger with the reason.
        </p>
      </section>

      <aside className="dwb-rule" aria-labelledby="dwb-rule-title">
        <h2 id="dwb-rule-title" className="dwb-rule__title">
          กติกาการเตรียมข้อมูล <span className="dwb-sub">Preparation rule</span>
        </h2>
        <ul className="dwb-rule__list">
          <li>
            <strong>พร้อมเชิงพื้นที่</strong> = พบคอลัมน์พิกัด (lat/lng) หรือชื่อสถานที่ (อำเภอ ตำบล หมู่บ้าน ชุมชน) —{" "}
            <em>ยังไม่ได้แปลงเป็นพิกัด (not geocoded)</em>
          </li>
          <li>
            ตารางใหญ่แสดงตัวอย่างไม่เกิน {fmtInt(index.maxRows)} แถว พร้อมจำนวนแถวจริงจากแหล่ง และป้าย “ตัดตัวอย่าง”
            ชัดเจน · Large tables are sampled to {fmtInt(index.maxRows)} rows with the source row count and a clear
            truncation label. ตารางที่กว้างมากแสดงแถวน้อยลง และเก็บไว้ไม่เกิน 80 คอลัมน์แรก · Very wide tables show fewer rows
            and keep their first 80 columns.
          </li>
          <li>
            ตัวเลขที่มีจุลภาค (1,530,435) ถูกอ่านเป็นตัวเลข · ข้อความภาษาไทยที่เข้ารหัสผิดถูกแก้เมื่อแก้ได้เท่านั้น
          </li>
        </ul>
      </aside>

      <section aria-labelledby="dwb-stats-title">
        <h2 id="dwb-stats-title" className="visually-hidden">
          สรุปตัวเลข / Summary
        </h2>
        <dl className="dwb-stats">
          {stats.map((st) => (
            <div key={st.en} className="dwb-stat">
              <dt className="dwb-stat__label">
                {st.th} <span className="dwb-sub">{st.en}</span>
              </dt>
              <dd className={`dwb-stat__value num${st.tone === "bad" ? " dwb-stat__value--bad" : ""}`}>{fmtInt(st.value)}</dd>
              {st.sub ? <dd className="dwb-stat__sub">{st.sub}</dd> : null}
            </div>
          ))}
        </dl>
      </section>

      <section className="dwb-domains" aria-labelledby="dwb-domains-title">
        <div className="dwb-section-head">
          <h2 id="dwb-domains-title" className="dwb-h2">
            หมวดข้อมูล <span className="dwb-sub">Data domains</span>
          </h2>
          {domain ? (
            <button type="button" className="btn btn--quiet" onClick={() => onDomain(null)}>
              ล้างหมวด / Clear
            </button>
          ) : null}
        </div>
        <p className="note">จัดหมวดอัตโนมัติจากชื่อ คำอธิบาย และหน่วยงาน · Auto-classified from title, description and publisher. แตะเพื่อกรอง / tap to filter.</p>
        <ul className="dwb-domain-list">
          {index.domains.map((d) => (
            <li key={d.key}>
              <button
                type="button"
                className="dwb-domain"
                aria-pressed={domain === d.key}
                onClick={() => onDomain(domain === d.key ? null : d.key)}
              >
                <span className="dwb-domain__name">
                  {d.th} <span className="dwb-sub">{d.en}</span>
                </span>
                <span className="dwb-domain__count num">
                  {d.datasets} ชุด · {d.tables} ตาราง
                </span>
                <span className="dwb-domain__bar" aria-hidden="true">
                  <span style={{ width: `${(d.datasets / max) * 100}%` }} />
                </span>
              </button>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
