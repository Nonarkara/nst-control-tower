/**
 * Prepared-tables tab: filter chips, search and one card per parsed table.
 * A card is a single button — it opens the table itself.
 */

import { useMemo, useState } from "react";
import { TABLE_FILTERS, countByFilter, filterTables, fmtInt, type TableFilter } from "./workbenchLib";
import type { TableSummary, WorkbenchIndex } from "./workbenchTypes";

const PAGE = 48;

interface Props {
  index: WorkbenchIndex;
  domain: string | null;
  onOpen: (id: string) => void;
}

export function TableBadges({ t }: { t: TableSummary }) {
  return (
    <span className="dwb-badges">
      {t.hasCoords ? <span className="dwb-badge dwb-badge--geo">พิกัด · COORDINATES</span> : null}
      {t.hasPlace ? <span className="dwb-badge dwb-badge--geo">ฟิลด์ตำแหน่ง · LOCATION FIELDS</span> : null}
      {t.hasTime ? <span className="dwb-badge">เวลา · TIME</span> : null}
      {t.numeric > 0 ? <span className="dwb-badge">ตัวเลข · {t.numeric} NUMERIC</span> : null}
      {t.truncated ? <span className="dwb-badge dwb-badge--warn">ตัดตัวอย่าง · SAMPLED</span> : null}
      {t.otherProvince ? <span className="dwb-badge dwb-badge--warn">ข้อมูลจังหวัดอื่น · OTHER PROVINCE</span> : null}
    </span>
  );
}

export function TableCatalog({ index, domain, onOpen }: Props) {
  const [filter, setFilter] = useState<TableFilter>("all");
  const [query, setQuery] = useState("");
  const [limit, setLimit] = useState(PAGE);

  const inDomain = useMemo(
    () => (domain ? index.tables.filter((t) => t.domain === domain) : index.tables),
    [index.tables, domain],
  );
  const counts = useMemo(() => countByFilter(inDomain), [inDomain]);
  const shown = useMemo(() => filterTables(inDomain, { filter, query, domain: null }), [inDomain, filter, query]);
  const domainName = new Map(index.domains.map((d) => [d.key, d.th]));

  return (
    <div className="dwb-catalog">
      <div className="dwb-controls">
        <div className="chip-row" role="group" aria-label="ตัวกรอง / Filter">
          {TABLE_FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              className="chip"
              aria-pressed={filter === f.key}
              onClick={() => {
                setFilter(f.key);
                setLimit(PAGE);
              }}
            >
              {f.th} <span className="dwb-sub">{f.en}</span> <span className="num">{counts[f.key]}</span>
            </button>
          ))}
        </div>
        <label className="field dwb-search">
          <span className="field__label">ค้นหา / Search</span>
          <input
            className="field__input"
            type="search"
            value={query}
            placeholder="ชื่อชุดข้อมูล หน่วยงาน หรือชื่อคอลัมน์ · title, publisher, column"
            onChange={(e) => {
              setQuery(e.target.value);
              setLimit(PAGE);
            }}
          />
        </label>
      </div>

      <p className="note" aria-live="polite">
        แสดง {fmtInt(Math.min(limit, shown.length))} จาก {fmtInt(shown.length)} ตาราง · showing {fmtInt(shown.length)} tables
        {domain ? ` · หมวด ${domainName.get(domain) ?? domain}` : ""}
      </p>

      {shown.length === 0 ? (
        <p className="note dwb-empty">ไม่พบตารางที่ตรงเงื่อนไข / No table matches.</p>
      ) : (
        <ul className="dwb-cards">
          {shown.slice(0, limit).map((t) => (
            <li key={t.id}>
              <button type="button" className="dwb-card" onClick={() => onOpen(t.id)}>
                <span className="dwb-card__domain">{domainName.get(t.domain) ?? t.domain}</span>
                <span className="dwb-card__title">{t.title}</span>
                {t.resource && t.resource !== t.title ? (
                  <span className="dwb-card__res">
                    {t.resource}
                    {t.sheet ? ` · ชีต ${t.sheet}` : ""}
                  </span>
                ) : t.sheet ? (
                  <span className="dwb-card__res">ชีต {t.sheet}</span>
                ) : null}
                <span className="dwb-card__org">{t.org || "—"}</span>
                <span className="dwb-card__meta num">
                  {fmtInt(t.sourceRows)} แถว rows · {t.columns.length} คอลัมน์ fields · {t.format}
                </span>
                <TableBadges t={t} />
              </button>
            </li>
          ))}
        </ul>
      )}

      {shown.length > limit ? (
        <button type="button" className="btn dwb-more" onClick={() => setLimit((n) => n + PAGE)}>
          แสดงเพิ่ม / Show more ({fmtInt(shown.length - limit)})
        </button>
      ) : null}
    </div>
  );
}
