/**
 * Full source ledger: every dataset found on data.go.th and what happened to
 * each of its files — parsed, list-only, oversize, failed — with the reason.
 * Nothing is hidden.
 */

import { useMemo, useState } from "react";
import { safeUrl } from "../../lib/safeUrl";
import { filterLedger, fmtInt } from "./workbenchLib";
import type { LedgerResource, ResourceStatus, WorkbenchIndex } from "./workbenchTypes";

const PAGE = 40;

export const STATUS_LABEL: Record<ResourceStatus, { th: string; en: string; tone: string }> = {
  parsed: { th: "อ่านเป็นตารางแล้ว", en: "Parsed", tone: "good" },
  duplicate: { th: "ซ้ำกับไฟล์อื่น", en: "Duplicate", tone: "quiet" },
  "list-only": { th: "มีแต่รายการ", en: "List-only", tone: "quiet" },
  oversize: { th: "ไฟล์ใหญ่เกิน", en: "Oversize", tone: "warn" },
  "fetch-failed": { th: "ดาวน์โหลดไม่ได้", en: "Fetch failed", tone: "bad" },
  "parse-failed": { th: "อ่านไม่ได้", en: "Parse failed", tone: "bad" },
  "out-of-scope": { th: "จังหวัดอื่น", en: "Other province", tone: "quiet" },
};

const STATUS_ORDER: (ResourceStatus | "all")[] = ["all", "parsed", "list-only", "duplicate", "oversize", "fetch-failed", "parse-failed", "out-of-scope"];

interface Props {
  index: WorkbenchIndex;
  domain: string | null;
  onOpen: (id: string) => void;
}

export function SourceLedger({ index, domain, onOpen }: Props) {
  const [status, setStatus] = useState<ResourceStatus | "all">("all");
  const [query, setQuery] = useState("");
  const [limit, setLimit] = useState(PAGE);
  const shown = useMemo(() => filterLedger(index.ledger, { query, status, domain }), [index.ledger, query, status, domain]);
  const byStatus = index.stats.byStatus;

  return (
    <div className="dwb-ledger">
      <p className="note">
        ทุกชุดข้อมูลที่ค้นพบ และผลการอ่านไฟล์ทุกไฟล์ · Every dataset found and the outcome for each of its{" "}
        {fmtInt(index.stats.resources)} files. ชุดข้อมูลระดับประเทศแยกไฟล์รายจังหวัด — เราอ่านเฉพาะไฟล์นครศรีธรรมราช
        ส่วน {fmtInt(index.stats.outOfScope)} ไฟล์ของจังหวัดอื่นยังแสดงไว้ · National datasets split by province: only the
        นครศรีธรรมราช file is read; the other provinces' files stay listed.
      </p>
      <div className="dwb-controls">
        <div className="chip-row" role="group" aria-label="สถานะไฟล์ / File status">
          {STATUS_ORDER.map((s) => (
            <button
              key={s}
              type="button"
              className="chip"
              aria-pressed={status === s}
              onClick={() => {
                setStatus(s);
                setLimit(PAGE);
              }}
            >
              {s === "all" ? "ทั้งหมด" : STATUS_LABEL[s].th}{" "}
              <span className="dwb-sub">{s === "all" ? "All" : STATUS_LABEL[s].en}</span>{" "}
              <span className="num">{s === "all" ? index.stats.resources : byStatus[s] ?? 0}</span>
            </button>
          ))}
        </div>
        <label className="field dwb-search">
          <span className="field__label">ค้นหา / Search</span>
          <input
            className="field__input"
            type="search"
            value={query}
            placeholder="ชื่อชุดข้อมูล หน่วยงาน หรือชื่อไฟล์ · title, publisher, file"
            onChange={(e) => {
              setQuery(e.target.value);
              setLimit(PAGE);
            }}
          />
        </label>
      </div>
      <p className="note" aria-live="polite">
        {fmtInt(shown.length)} ชุดข้อมูล · datasets
      </p>

      <ol className="dwb-ledger-list">
        {shown.slice(0, limit).map((d) => (
          <li key={d.id} className="dwb-ledger-item">
            <div className="dwb-ledger-item__head">
              <h3 className="dwb-ledger-item__title">{d.title}</h3>
              <a className="link dwb-ledger-item__src" href={d.sourceUrl} target="_blank" rel="noopener noreferrer">
                data.go.th ↗
              </a>
            </div>
            <p className="dwb-ledger-item__org">
              {d.org || "—"} · แก้ไขล่าสุด {d.updated || "—"} · {d.tables} ตาราง
            </p>
            <ResourceList resources={d.resources.filter((r) => r.status !== "out-of-scope")} onOpen={onOpen} />
            {d.resources.some((r) => r.status === "out-of-scope") ? (
              <details className="dwb-other" open={status === "out-of-scope"}>
                <summary>
                  ไฟล์ของจังหวัดอื่น {d.resources.filter((r) => r.status === "out-of-scope").length} ไฟล์{" "}
                  <span className="dwb-sub">Other provinces' files</span>
                </summary>
                <ResourceList resources={d.resources.filter((r) => r.status === "out-of-scope")} onOpen={onOpen} />
              </details>
            ) : null}
          </li>
        ))}
      </ol>

      {shown.length > limit ? (
        <button type="button" className="btn dwb-more" onClick={() => setLimit((n) => n + PAGE)}>
          แสดงเพิ่ม / Show more ({fmtInt(shown.length - limit)})
        </button>
      ) : null}
    </div>
  );
}

function ResourceList({ resources, onOpen }: { resources: LedgerResource[]; onOpen: (id: string) => void }) {
  if (resources.length === 0) return null;
  return (
    <ul className="dwb-res-list">
      {resources.map((r) => (
        <li key={r.idx} className="dwb-res">
          <span className={`dwb-status dwb-status--${STATUS_LABEL[r.status].tone}`}>
            {STATUS_LABEL[r.status].th} <span className="dwb-sub">{STATUS_LABEL[r.status].en}</span>
          </span>
          <span className="dwb-res__fmt">{r.format}</span>
          <span className="dwb-res__name">
            {r.name}
            {r.reason ? <span className="dwb-res__reason"> — {r.reason}</span> : null}
          </span>
          <span className="dwb-res__actions">
            {r.tables.map((tid, i) => (
              <button key={tid} type="button" className="btn dwb-res__open" onClick={() => onOpen(tid)}>
                เปิดตาราง{r.tables.length > 1 ? ` ${i + 1}` : ""} / Open
              </button>
            ))}
            {safeUrl(r.url) ? (
              <a className="link" href={safeUrl(r.url) ?? undefined} target="_blank" rel="noopener noreferrer">
                ไฟล์ต้นทาง ↗
              </a>
            ) : null}
          </span>
        </li>
      ))}
    </ul>
  );
}
