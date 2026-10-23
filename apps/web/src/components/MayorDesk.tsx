import { useEffect, useState } from "react";
import type { DeskLevel, DeskNewsItem, DeskPart, MayorDesk } from "@nst/shared";
import { API_BASE } from "../lib/apiBase";
import { useFeed } from "../hooks/useFeed";
import { FLOOD_BULLETIN } from "../lib/floodBulletin";
import "../styles/mayor-desk.css";

/**
 * The mayor's desk — one screen, most important first.
 *
 * The espresso of the morning: the answer, the parts that make it, the
 * day's news in plain Thai, and the notice that is in force. Four
 * compartments, sized by what they hold, and a bento rather than a buffet:
 * nothing here is padding, and every line carries its source and its age.
 *
 * It is not the flood briefing (/flood-ops), which is the full evidence —
 * tables, camera comparison, the copy-paste record for the file. The desk
 * answers "what is the situation and what do I need to know today"; the
 * briefing answers "show me the evidence".
 *
 * The house system is the Chiang Mai operations war room's: the worst
 * signal names the answer, every part keeps its own provenance, a part that
 * could not be read says so with its reason, and "below threshold" is never
 * painted green — a green chip reads as an all-clear, and nothing on a
 * flood desk can certify one.
 */

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
  official: "ประกาศ",
  report: "รายงาน",
  model: "แบบจำลอง",
};

function Chip({ level, children }: { level: DeskLevel; children: React.ReactNode }) {
  return <span className={`desk-chip desk-chip--${level}`}>{children}</span>;
}

function PartLine({ part, now }: { part: DeskPart; now: number }) {
  const age = ageText(part.observedAt, now, part.staleAfterMs);
  return (
    <div className="desk-part">
      <div className="desk-part__head">
        <span className="desk-part__title">{part.titleTh}</span>
        <span className="desk-part__kind">{KIND_TH[part.kind]}</span>
        <Chip level={part.level}>{LEVEL_TH[part.level]}</Chip>
      </div>
      <p className={`desk-part__line${part.level === "unknown" ? " desk-part__line--muted" : ""}`}>{part.th}</p>
      {part.evidence.length > 0 && (
        <ul className="desk-evidence">
          {part.evidence.map((e, i) => <li key={i}>{e}</li>)}
        </ul>
      )}
      <p className="desk-part__source">
        {part.sourceTh}
        {age && <span className={age.stale ? "desk-stale" : undefined}> · {age.text}</span>}
      </p>
    </div>
  );
}

function NewsRow({ item }: { item: DeskNewsItem }) {
  return (
    <li className="desk-news__item">
      <a className="desk-news__headline" href={item.url} target="_blank" rel="noreferrer">{item.titleTh}</a>
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
  const feed = useFeed<MayorDesk>(`${API_BASE}/api/mayor-desk`, 60_000, 25_000);
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    document.documentElement.lang = "th";
    document.title = "โต๊ะทำงานนายกฯ | NST";
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

  const data = feed.data[0];
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
          <a className="desk-btn" href="/flood-ops">บันทึกเต็ม</a>
          <button type="button" className="desk-btn" onClick={() => void feed.refetch()} disabled={!data}>ปรับปรุง</button>
        </span>
      </header>

      {feed.error && <p className="desk-error" role="status">อ่านโต๊ะทำงานไม่ได้ — {feed.error} (ไม่ใช่การยืนยันว่าปกติ)</p>}
      {!data && !feed.error && <p className="desk-error" role="status">กำลังอ่านข้อมูล…</p>}

      {data && (
        <>
          <section className="desk-answer" aria-label="สรุปสถานการณ์">
            <div className="desk-answer__head">
              <span className="desk-answer__label">สถานการณ์ ณ ตอนนี้</span>
              <Chip level={data.level}>{LEVEL_TH[data.level]}</Chip>
            </div>            <p className="desk-answer__text">{data.answerTh}</p>
            <p className="desk-answer__meta">
              ประมวลผล {date(data.generatedAt)}
              {data.missing > 0 && <span className="desk-stale"> · {data.missing} แหล่งข้อมูลไม่พร้อยหรือครอบคลุมไม่ครบ</span>}
              {" · "}<a href="/flood-ops">ดูหลักฐานฉบับเต็ม</a>
            </p>
          </section>

          <div className="desk-bento">
            <section className="desk-cell desk-cell--rivers" aria-label="ระดับน้ำที่สถานีวัด">
              {rivers && <PartLine part={rivers} now={now} />}
            </section>

            <section className="desk-cell desk-cell--official" aria-label="ประกาศและเตือนภัยจากหน่วยงานรัฐ">
              {official && <PartLine part={official} now={now} />}
              <div className="desk-part desk-part--notice">
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
              </div>
            </section>

            <section className="desk-cell desk-cell--rain" aria-label="ฝนที่วัดได้และพยากรณ์">
              {rain && <PartLine part={rain} now={now} />}
              {forecast && <PartLine part={forecast} now={now} />}
            </section>

            <section className="desk-cell desk-cell--news" aria-label="ข่าววันนี้">
              <div className="desk-part">
                <div className="desk-part__head">
                  <span className="desk-part__title">ข่าวที่ต้องรู้วันนี้</span>
                  <span className="desk-part__kind">อันดับ</span>
                </div>
                {data.news.length > 0 ? (
                  <ul className="desk-news">
                    {data.news.map(item => <NewsRow key={item.id} item={item} />)}
                  </ul>
                ) : (
                  <p className="desk-part__line desk-part__line--muted">ไม่มีข่าวใน 36 ชั่วโมงที่ผ่านมา — ไม่ใช่การยืนยันว่าไม่มีเหตุการณ์</p>
                )}
                {data.translationIncomplete && (
                  <p className="desk-part__source desk-stale">บางพาดหัวยังไม่ได้แปลเป็นภาษาไทย — ดูต้นฉบับได้ที่ลิงก์</p>
                )}
              </div>
            </section>
          </div>

          {data.gaps.length > 0 && (
            <section className="desk-gaps" aria-label="ช่องว่างข้อมูล">
              <h2>ช่องว่างที่ต้องรู้</h2>
              <ul>{data.gaps.map((g, i) => <li key={i}>{g}</li>)}</ul>
            </section>
          )}
        </>
      )}

      <footer className="desk-foot">
        โต๊ะนี้รวมแหล่งข้อมูลของระบบทั้งหมดในจุดเดียว — ข้อมูลเปลี่ยนตามเวลา กรุณาระบุเวลาบันทึกเมื่อส่งต่อ
        {" · "}<a href="/flood-ops">บันทึกฉบับเต็มสำหรับนายกฯ</a>
        {" · "}<a href="https://www.tmd.go.th/warning-and-events/warning-storm">ประกาศ อต.</a>
        {" · ไม่ใช่ประกาศราชการ และไม่ใช่การคาดการณ์น้ำท่วมรายถนน"}
      </footer>
    </main>
  );
}
