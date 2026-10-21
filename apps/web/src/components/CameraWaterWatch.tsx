import "../styles/camera-water-watch.css";
import { useEffect, useRef, useState } from "react";
import type { CctvCamera } from "../map/layers";
import { useWhepFrame } from "../lib/cctvCapturePool";

import { framePixels } from "../lib/gaugeWatch";
import { compareBoundary, readMarkedBoundary, type BoundaryReading } from "../lib/cameraBoundary";

export function CameraWaterWatch({ cameras, compact = false }: { cameras: CctvCamera[]; compact?: boolean }) {
  const ordered = [...cameras].filter(c => c.category === "water").sort((a, b) => Number(b.status === "online") - Number(a.status === "online") || Number(b.name.includes("คลอง")) - Number(a.name.includes("คลอง")) || a.name.localeCompare(b.name, "th"));
  const [now, setNow] = useState(Date.now);
  const [reading, setReading] = useState<BoundaryReading | null>(null);
  const [chosen, setChosen] = useState("");
  const camera = ordered.find(c => c.id === chosen) ?? ordered[0];
  const [enabled, setEnabled] = useState(false);
  const [mark, setMark] = useState<{ x: number; y: number } | null>(null);
  const reference = useRef<{ cameraId: string; at: number; reading: BoundaryReading } | null>(null);
  const [message, setMessage] = useState("ยังไม่ได้ตรวจภาพ — ไม่ได้หมายความว่าไม่มีน้ำท่วม");
  const [baselineImage, setBaselineImage] = useState<string | null>(null);
  const frame = useWhepFrame(camera?.id ?? "none", camera?.embedUrl ? camera.embedUrl.replace(/\/?$/, "/") + "whep" : undefined, enabled && camera?.status !== "offline");
  useEffect(() => {
    if (!enabled) return;
    const id = window.setInterval(() => setNow(Date.now()), 15_000);
    setNow(Date.now());
    return () => window.clearInterval(id);
  }, [enabled]);
  useEffect(() => { reference.current = null; setReading(null); setMark(null); setBaselineImage(null); setMessage("เลือกจุดตัดขอบน้ำ/เสาอ้างอิงในภาพเพื่อเริ่มเทียบ ไม่แสดงระดับน้ำเป็นเมตร"); }, [camera?.id]);
  useEffect(() => {
    let cancelled = false;
    if (!mark || !frame.frame || !camera) return;
    const current = frame.frame; const cameraId = camera.id;
    void framePixels(current.dataUrl).then(pixels => {
      if (cancelled || !pixels) return;
      if (Date.now() - current.capturedAt > 90_000) { setMessage("ภาพที่ได้รับเก่า — ประเมินไม่ได้"); return; }
      const reading = readMarkedBoundary(pixels.data, pixels.w, pixels.h, mark);
      setReading(reading);
      if (!reading) { setMessage("แสง/ขอบภาพไม่ชัด — CV ประเมินไม่ได้ ให้ดูภาพสดและยืนยันภาคสนาม"); return; }
      if (!reference.current || reference.current.cameraId !== cameraId) {
        reference.current = { cameraId, at: current.capturedAt, reading }; setBaselineImage(current.dataUrl);
        setMessage("บันทึกภาพอ้างอิงแล้ว รอภาพถัดไป (~1 นาที) — ไม่ถือว่าภาพแรกเป็นสภาพปกติ"); return;
      }
      const state = compareBoundary(reference.current.reading, reading, current.capturedAt - reference.current.at);
      const labels = { unknown: "ภาพ/แสงเปลี่ยน หรืออ้างอิงหมดอายุ — ประเมินไม่ได้ ตั้งอ้างอิงใหม่", repeat: "ภาพซ้ำ — อาจเป็นภาพค้าง ไม่ใช้ยืนยันว่าน้ำคงที่", "inspect-rise": "ขอบภาพสูงขึ้น ≥4% ของความสูงภาพ — ให้เจ้าหน้าที่เปิดภาพสดตรวจยืนยันว่าเป็นน้ำ", "no-significant-change": "ไม่พบการเปลี่ยนขอบภาพถึงเกณฑ์ — ไม่ใช่การยืนยันว่าปลอดภัย" };
      setMessage(labels[state]);
    });
    return () => { cancelled = true; };
  }, [mark, frame.frame, camera?.id]);
  const clockNow = Math.max(now, Date.now());
  const stale = !!frame.frame && (clockNow - frame.frame.capturedAt > 90_000 || frame.frame.capturedAt > clockNow + 5_000);
  const status = !enabled ? "หยุดตรวจภาพ — ไม่ได้เฝ้าระวังอยู่ และไม่ยืนยันว่าปลอดภัย" : stale ? "ภาพเก่าหรือเวลาภาพผิดปกติ — ประเมินไม่ได้ เปิดภาพสดและยืนยันภาคสนาม" : frame.kind === "error" ? "รับภาพไม่สำเร็จ — เปิดภาพสดต้นทางหรือติดต่อเจ้าหน้าที่ประจำจุด" : message;
  return <section className="flood-watch-cameras camera-water-watch" aria-label="ตรวจภาพน้ำจากกล้อง">
    <h2>ดูน้ำจริงจากกล้องเทศบาล</h2>
    <p>CV ช่วยเทียบขอบภาพที่เจ้าหน้าที่เลือก อาจช่วยเมื่อแสงและขอบชัด แต่ยังไม่ผ่านการสอบเทียบกลางคืน ภาพมืด สะท้อน กล้องหมุน หรือภาพค้างต้องให้คนตรวจ ไม่แปลงพิกเซลเป็นเซนติเมตร</p>
    {!compact && <label>เลือกจุดเฝ้าระวัง <select value={camera?.id ?? ""} onChange={e => setChosen(e.target.value)}>{ordered.map(c => <option key={c.id} value={c.id}>{c.name} · {c.status ?? "unknown"}</option>)}</select></label>}
    <div className="flood-watch-actions"><button type="button" onClick={() => setEnabled(v => !v)} disabled={!camera?.embedUrl || camera.status === "offline"}>{enabled ? "หยุดรับภาพ" : "เปิดรับภาพและ CV เฉพาะกล้องนี้"}</button>{camera?.embedUrl && <a href={camera.embedHdUrl ?? camera.embedUrl} target="_blank" rel="noreferrer">เปิดภาพสดต้นทาง</a>}<button type="button" onClick={() => { reference.current = null; setReading(null); setMark(null); setBaselineImage(null); setMessage("เลือกจุดอ้างอิงใหม่ในภาพ"); }}>ตั้งจุดอ้างอิงใหม่</button></div>
    <p role="status">{status}</p>
    {frame.frame ? <div className="flood-watch-frames"><figure><div className="flood-watch-image" role="button" tabIndex={0} aria-label="เลือกจุดอ้างอิงขอบน้ำในภาพ กด Enter เพื่อเลือกกลางภาพ" onKeyDown={e => { if (e.key === "Enter") { reference.current = null; setMark({ x: .5, y: .6 }); } }} onClick={e => { const r = e.currentTarget.getBoundingClientRect(); reference.current = null; setMark({ x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height }); }}><img src={frame.frame.dataUrl} alt={`ภาพล่าสุดที่ได้รับจาก ${camera?.name}`} />{reading && enabled && !stale && <i className="camera-water-watch__boundary" style={{ top: `${reading.y * 100}%` }} aria-label="Detected image boundary — unverified water" />}{mark && <span style={{ left: `${mark.x * 100}%`, top: `${mark.y * 100}%` }}>+</span>}</div><figcaption>รับภาพ {new Date(frame.frame.capturedAt).toLocaleTimeString("th-TH", { timeZone: "Asia/Bangkok" })} — เวลาได้รับภาพ ไม่ใช่นาฬิกาต้นทาง · คลิกจุดขอบน้ำเพื่อเทียบ</figcaption></figure>{baselineImage && <figure><img src={baselineImage} alt="ภาพอ้างอิงที่เจ้าหน้าที่เลือก" /><figcaption>ภาพอ้างอิงของกล้องนี้ · เก็บบนอุปกรณ์นี้เท่านั้น</figcaption></figure>}</div> : <p>{camera?.status === "offline" ? "ต้นทางแจ้งออฟไลน์ — เลือกกล้องอื่น" : enabled ? "กำลังขอภาพ…" : "กล้องจะไม่เชื่อมต่อจนกดเปิดรับภาพ"}</p>}
    <p>ทำงานเฉพาะเมื่อเปิดหน้านี้และเปิดรับภาพ ไม่ใช่บริการเฝ้ากล้องเบื้องหลัง 24 ชั่วโมง · ผล CV เป็นเพียงสัญญาณให้ตรวจสอบ ไม่ใช่ประกาศราชการ ไม่ใช่หลักฐานว่าเกิด/ไม่เกิดน้ำท่วม · ปภ. 1784</p>
  </section>;
}
