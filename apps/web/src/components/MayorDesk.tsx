import { useEffect, useState } from "react";
import { MAYOR_DESK_RETENTION_MS, ageMayorDesk, mayorDeskAction, mayorDeskText } from "@nst/shared";
import type { DeskLevel, DeskNewsItem, DeskPart, MayorDesk } from "@nst/shared";
import { API_BASE } from "../lib/apiBase";
import { useFeed } from "../hooks/useFeed";
import { FLOOD_BULLETIN } from "../lib/floodBulletin";
import "../styles/mayor-desk.css";

/** A compact evidence ledger: situation, verification action, then source readings.
 * Missing evidence keeps its own status and original clocks. */

const date = (s: string | null | undefined) =>
  s && Number.isFinite(Date.parse(s))
    ? new Date(s).toLocaleString("th-TH", { timeZone: "Asia/Bangkok", day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", hour12: false })
    : "ไม่มีเวลาอ้างอิง";

const ageText = (observedAt: string | null, now: number, staleAfterMs: number): { text: string; stale: boolean } | null => {
  if (!observedAt) return null;
  const ms = now - Date.parse(observedAt);
  if (!Number.isFinite(ms)) return { text: "เวลาอ่านไม่ได้", stale: true };
  if (ms < -5 * 60_000) return { text: "เวลาอยู่ในอนาคต", stale: true };
  const min = Math.max(0, Math.round(ms / 60_000));
  const text = min < 1 ? "เมื่อสักครู่" : min < 120 ? `${min} นาทีที่แล้ว` : min < 48 * 60 ? `${Math.round(min / 60)} ชม.ที่แล้ว` : `${Math.round(min / 1440)} วันที่แล้ว`;
  return ms > staleAfterMs ? { text: `เก่า · ${text}`, stale: true } : { text, stale: false };
};

const LEVEL_TH: Record<DeskLevel, string> = {
  good: "ไม่พบสัญญาณ",
  watch: "เฝ้าระวัง",
  alert: "เตือน",
  critical: "วิกฤติ",
  unknown: "ไม่ครบ",
};

const KIND_TH: Record<DeskPart["kind"], string> = {
  measured: "วัดจริง",
  official: "ข้อมูลหน่วยงาน",
  report: "รายงาน",
  model: "แบบจำลอง",
};

function Chip({ level, children }: { level: DeskLevel; children: React.ReactNode }) {
  return <span className={`desk-chip desk-chip--${level}`}>{children}</span>;
}

function PartLine({ part, now }: { part: DeskPart; now: number }) {
  const age = ageText(part.observedAt, now, part.staleAfterMs);
  const sourceAge = ageText(part.sourceFetchedAt ?? null, now, 60_000);
  const evidence = part.evidence.slice(["river", "rain", "forecast"].includes(part.key) || part.declared ? 1 : 0);
  return (
    <div className={`desk-part desk-reading${evidence.length ? " desk-reading--with-evidence" : ""}`}>
      <div className="desk-part__head">
        <span className="desk-part__title">{part.titleTh}</span>
        <span className="desk-part__kind">{KIND_TH[part.kind]}</span>
        <Chip level={part.level}>{LEVEL_TH[part.level]}</Chip>
      </div>
      <div className="desk-reading__description">
        <p className={`desk-part__line${part.level === "unknown" ? " desk-part__line--muted" : ""}`}>{part.th}</p>
        <p className="desk-part__source">
          {part.sourceTh}
          {age && <span className={age.stale ? "desk-stale" : undefined}> · วัด/อ้างอิง {age.text}</span>}
          {sourceAge && <span> · ดึงข้อมูล {sourceAge.text}</span>}
          {part.sourceTier && part.sourceTier !== "live" && <span className="desk-stale"> · {part.sourceTier === "cache" ? "ข้อมูลเก็บล่าสุด ไม่ใช่ข้อมูลสด" : "แหล่งข้อมูลไม่พร้อม"}</span>}
        </p>
      </div>
      {evidence.length > 0 && (
        <ul className="desk-evidence">
          {evidence.map((e, i) => {
            const split = e.indexOf(" — ");
            const [value, ...notes] = split < 0 ? [] : e.slice(split + 3).split(" · ");
            return <li key={i}>{split < 0 ? e : <>
              <span>{e.slice(0, split)}</span>
              <span className="desk-evidence__value">
                <span>{value}</span>
                {notes.map((note, j) => <span className="desk-evidence__note" key={j}> · {note.split(" (").map((phrase, k) => <span key={k}>{k > 0 ? ` (${phrase}` : phrase}</span>)}</span>)}
              </span>
            </>}</li>;
          })}
        </ul>
      )}

    </div>
  );
}

function NewsRow({ item }: { item: DeskNewsItem }) {
  return (
    <li className="desk-news__item">
      <a className="desk-news__headline" href={item.url} target="_blank" rel="noreferrer">{item.titleTh}</a>
      {item.translated && <span className="desk-news__translation">แปลอัตโนมัติ ยังไม่ยืนยัน — ตรวจต้นฉบับก่อนใช้อ้างอิง</span>}
      {item.translated && (
        <span className="desk-news__original" lang={item.language === "en" ? "en" : undefined}>{item.originalTitle}</span>
      )}
      <span className="desk-news__meta">
        <span className="desk-news__why">{item.whyTh}</span>
        <span>{item.source}</span>
        <span>{date(item.publishedAt)}</span>
      </span>
    </li>
  );
}

export default function MayorDesk() {
  const feed = useFeed<MayorDesk>(`${API_BASE}/api/mayor-desk`, 60_000, 25_000, MAYOR_DESK_RETENTION_MS);
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    document.documentElement.lang = "th";
    document.title = "โต๊ะทำงานนายกฯ | NST";
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

  const [copyState, setCopyState] = useState("");
  const data = feed.data[0] ? ageMayorDesk(feed.data[0], now) : undefined;
  const copyBrief = async () => {
    if (!data) return;
    try { await navigator.clipboard.writeText(mayorDeskText(data, Date.now())); setCopyState("คัดลอกแล้ว"); }
    catch { setCopyState("คัดลอกไม่ได้ กรุณาใช้พิมพ์สรุป"); }
  };
  const parts = data?.parts ?? [];
  const rivers = parts.find(p => p.key === "river");
  const official = parts.find(p => p.key === "official");
  const rain = parts.find(p => p.key === "rain");
  const forecast = parts.find(p => p.key === "forecast");
  const bulletinExpired = now >= Date.parse(FLOOD_BULLETIN.recheckAt);

  return (
    <main className="desk" lang="th">
      <header className="desk-head">
        <a href="/" className="desk-head__back">← แผนที่เมือง</a>
        <span className="desk-head__place">โต๊ะทำงานนายกฯ · เทศบาลนครนครศรีธรรมราช</span>
        <span className="desk-head__actions">
          <button type="button" className="desk-btn" onClick={() => void feed.refetch()} disabled={feed.fallbackTier === "loading"}>ปรับปรุง</button>
          <button type="button" className="desk-btn" onClick={() => void copyBrief()} disabled={!data}>คัดลอกส่ง LINE</button>
          <button type="button" className="desk-btn" onClick={() => window.print()} disabled={!data}>พิมพ์สรุป</button>
        </span>
      </header>
      {copyState && <p className="desk-copy-status" role="status">{copyState}</p>}

      {feed.error && <p className="desk-error" role="status">อ่านโต๊ะทำงานไม่ได้ — {feed.error} (ไม่ใช่การยืนยันว่าปกติ)</p>}
      {!data && !feed.error && <p className="desk-error" role="status">กำลังอ่านข้อมูล…</p>}

      {data && (
        <>
          <section className="desk-answer" aria-label="สรุปสถานการณ์">
            <div className="desk-answer__head">
              <span className="desk-answer__label">สถานการณ์ ณ ตอนนี้</span>
              <Chip level={data.level}>{LEVEL_TH[data.level]}</Chip>
            </div>
            <p className="desk-answer__text">{data.answerTh}</p>
            <div className="desk-answer__support">
              <p className="desk-answer__action"><strong>ตรวจสอบต่อ:</strong> {mayorDeskAction(data)}</p>
              <p className="desk-answer__meta">
                ประมวลผล {date(data.generatedAt)}
                {data.missing > 0 && <span className="desk-stale"> · {data.missing} แหล่งข้อมูลไม่พร้อมหรือครอบคลุมไม่ครบ</span>}
                {" · "}<a href="/flood-ops">ดูหลักฐานฉบับเต็ม</a>
              </p>
            </div>
          </section>

          <div className={`desk-readings${official?.declared && data.answerTh.startsWith(official.titleTh) ? " desk-readings--official-first" : ""}`}>
            <section className="desk-cell desk-cell--rivers" aria-label="ระดับน้ำที่สถานีวัด">
              {rivers && <PartLine part={rivers} now={now} />}
            </section>

            <section className="desk-cell desk-cell--rain" aria-label="ฝนที่วัดได้">
              {rain && <PartLine part={rain} now={now} />}
            </section>

            <section className="desk-cell desk-cell--official" aria-label="ประกาศและเตือนภัยจากหน่วยงานรัฐ">
              {official && <PartLine part={official} now={now} />}

            </section>
            <section className="desk-cell desk-cell--forecast" aria-label="พยากรณ์ฝน">
              {forecast && <PartLine part={forecast} now={now} />}
            </section>
          </div>

          <section className="desk-notice-rail" aria-label="ประกาศและข้อมูลอ้างอิงจากกรมอุตุนิยมวิทยา">
              <details className="desk-part desk-part--notice">
                <summary>{bulletinExpired ? "ประกาศ TMD ที่อ้างอิง (หมดอายุ)" : "ประกาศ TMD ที่อ้างอิง"}</summary>
                <div className="desk-part__head">
                  <span className="desk-part__title">ประกาศล่าสุดที่อ้างอิง</span>
                  <span className="desk-part__kind">อ้างอิง</span>
                </div>
                <p className="desk-part__line">
                  {FLOOD_BULLETIN.title} ออก {date(FLOOD_BULLETIN.issuedAt)}
                  {bulletinExpired && <span className="desk-stale"> · ถึงรอบประกาศใหม่แล้ว — ข้อความนี้เป็นอดีต</span>}
                </p>
                <p className="desk-part__note">{FLOOD_BULLETIN.summary}</p>
                <p className="desk-part__source">
                  <a href={FLOOD_BULLETIN.source} target="_blank" rel="noreferrer">อ่านประกาศล่าสุดจาก อต.</a>
                  {" · ปภ. 1784 · อต. 1182 · อปท."}
                </p>
              </details>
              <a className="desk-notice-latest" href={FLOOD_BULLETIN.source} target="_blank" rel="noreferrer">อ่านประกาศล่าสุด</a>
              <p className="desk-part__source">หน้านี้ยังไม่ยืนยันประกาศรอบปัจจุบัน</p>
          </section>

          <section className="desk-cell desk-cell--news" aria-label="ข่าววันนี้">
            <div className="desk-part">
              <div className="desk-part__head">
                <span className="desk-part__title">ข่าวที่ต้องรู้วันนี้</span>
                <span className="desk-part__kind">อันดับ</span>
              </div>
              {data.news.length > 0 ? (
                <ul className="desk-news">
                  {data.news.slice(0, 3).map(item => <NewsRow key={item.id} item={item} />)}
                </ul>
              ) : (
                <p className="desk-part__line desk-part__line--muted">ไม่มีข่าวใน 36 ชั่วโมงที่ผ่านมา — ไม่ใช่การยืนยันว่าไม่มีเหตุการณ์</p>
              )}
              {data.news.length > 3 && <details className="desk-news-more"><summary>ข่าวเพิ่มเติม {data.news.length - 3} เรื่อง</summary><ul className="desk-news">{data.news.slice(3).map(item => <NewsRow key={item.id} item={item} />)}</ul></details>}
              {data.translationIncomplete && (
                <p className="desk-part__source desk-stale">
                  {data.translationNote ?? "บางพาดหัวยังไม่ได้แปลเป็นภาษาไทย — ดูต้นฉบับได้ที่ลิงก์"}
                </p>
              )}
            </div>
          </section>

          {data.gaps.length > 0 && (
            <section className="desk-gaps" aria-label="ช่องว่างข้อมูล">
              <h2>ช่องว่างที่ต้องรู้</h2>
              <ul>{data.gaps.map((g, i) => <li key={i}>{g}</li>)}</ul>
            </section>
          )}
        </>
      )}

      <footer className="desk-foot">
        <p>สรุปสถานีระดับน้ำ ฝน DWR แบบจำลอง และข่าว · ข้อมูลเปลี่ยนตามเวลา กรุณาระบุเวลาบันทึกเมื่อส่งต่อ</p>
        <nav aria-label="เอกสารและแผนที่ประกอบ">
          <a href="/?demo=city" aria-label="บินชมเมือง 3D และเทียบระดับถนน">ชมเมือง 3D</a>
          <a href="/flood-ops" aria-label="บันทึกฉบับเต็มสำหรับนายกฯ">บันทึกฉบับเต็ม</a>
        </nav>
        <p>ไม่ใช่ประกาศราชการหรือการคาดการณ์น้ำท่วมรายถนน</p>
      </footer>
    </main>
  );
}
