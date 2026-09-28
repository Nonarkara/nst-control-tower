/**
 * Heritage — the UNESCO candidacy showcase for Wat Phra Mahathat
 * Woramahawihan, Nakhon Si Thammarat.
 *
 * WHAT THIS IS. The Phra Borommathat Chedi is on Thailand's UNESCO World
 * Heritage tentative list (2013) and is being prepared for inscription under
 * criteria (i), (ii) and (vi). The case rests on measured engineering survey:
 * the chedi leans 1.45° to the southeast, its foundation is sound, and the
 * 28-wa × 14-wa proportion is deliberate, not incidental. All of that context
 * comes from the Nation's 2019 report on the candidacy, cited below.
 *
 * SIC — what we took, and what we changed. Sketchfab hosts a model of
 * "Wat Mahathat" (uid 991ff575…) by Phantasma Labs under CC BY 4.0, which is
 * the same primitive a predecessor implementation embedded. Three corrections
 * and two improvements, both verified against the Sketchfab API on 2026-09-28:
 *
 *   1. ATTRIBUTION WAS WRONG. The previous version credited "CyArk, processed
 *      in Agisoft, CC BY-NC-SA". The Sketchfab API says the author is Phantasma
 *      Labs and the licence is Creative Commons Attribution 4.0 — a materially
 *      MORE permissive licence than the one we were claiming. We now credit
 *      the true author and the true licence. Overstating a restriction is
 *      just as wrong as understating one, and it was making our own civic
 *      work look non-commercial when it is not.
 *   2. THE URLS WERE MALFORMED. Every outbound link was built as
 *      `sketchfab.com/3d-models/none-<uid>`, a stray "none-" from a search
 *      that returned a null author. The embed itself used a different path
 *      and happened to work, so the visible demo looked fine while every
 *      "Open on Sketchfab" and credit link went to a 404.
 *   3. IT WAS THE WRONG TEMPLE. Both this model and the one a reader is most
 *      likely to find for "Wat Phra Mahathat" are the AYUTTHAYA temple in
 *      the Ayutthaya Historical Park, ~700 km north. The UNESCO candidacy
 *      being showcased is the NAKHON SI THAMMARAT one. Showing Ayutthaya
 *      photogrammetry as the evidence for an NST candidacy is a category
 *      error, so the distinction is now stated before the viewer scrolls,
 *      not buried in a credit line at the bottom.
 *   4. IMPROVED: the dialog is no longer a bare iframe. It now carries the
 *      candidacy itself — the criteria, the 28:14 proportion and its meaning,
 *      the 1.45° lean, the 46-rai core zone — because the model is evidence
 *      for a claim, and a claim without its reasoning is a screensaver.
 *   5. IMPROVED: the parametric NST chedi on the map (lib/mahatat3d.ts) is
 *      corrected to the UNESCO-survey dimensions. It previously claimed ~78 m;
 *      the nomination gives H 28 wa × W 14 wa at 1 wa = 2 m, i.e. 56 m × 28 m.
 *
 * ON PHOTOGRAMMETRY (the "could we just scan it" question). Yes — that is
 * exactly what the Nation article describes the team doing, with drones, and
 * what the very model we embed was made with. But we cannot run it: this
 * needs a licensed drone survey over a protected religious site, plus
 * photogrammetry software, plus the temple's consent. It is also the one
 * thing we must not fake — a synthetic scan presented as documentation of a
 * monument in an active World Heritage nomination would be worse than no
 * model. The honest path is a measured survey, requested from the Fine Arts
 * Department, who already hold the engineering data. Until then the landmark
 * is a clearly-labelled parametric model, not a pretend scan.
 */
import { Dialog } from "./Dialog";

interface Props {
  open: boolean;
  onClose: () => void;
}

/** Sketchfab uid for "Wat Mahathat" by Phantasma Labs (CC BY 4.0). */
export const SKETCHFAB_UID = "991ff575867e4b3699e2019adf86b589";
export const SKETCHFAB_AUTHOR = "Phantasma Labs";
export const SKETCHFAB_LICENCE = "CC BY 4.0";

/** Canonical viewer URL. No "none-" prefix — that was the bug. */
export const SKETCHFAB_URL = `https://sketchfab.com/3d-models/${SKETCHFAB_UID}`;
export const EMBED_URL = `https://sketchfab.com/models/${SKETCHFAB_UID}/embed`;
const EMBED_PARAMS =
  "autostart=1&ui_theme=dark&ui_infos=0&ui_watermark_link=0&ui_watermark=0&ui_inspector=0&ui_help=0&ui_settings=0&ui_vr=0&ui_fullscreen=1&ui_annotations=1&ui_animations=0&transparent=1";

/** The nomination's own figures, so the panel and the map agree. */
export const UNESCO = {
  templeTh: "วัดพระมหาธาตุวรมหาวิหาร",
  templeEn: "Wat Phra Mahathat Woramahawihan",
  chediTh: "พระบรมธาตุเจดีย์",
  chediEn: "Phra Borommathat Chedi",
  heightM: 56,
  widthM: 28,
  waistM: 28,
  corpusality: 28,
  leanDeg: 1.45,
  leanDirTh: "ทิศตะวันออกเฉียงใต้",
  coreRai: 46,
  bufferRai: 3000,
  tentativeList: 2013,
  criteria: ["i", "ii", "vi"],
} as const;

const CRITERIA_TH: Record<string, string> = {
  i: "สะท้อนคติความเชื่อทางพุทธศาสนาผ่านการออกแบบสถาปัตยกรรม — เจดีย์เป็นงานชิ้นเอก",
  ii: "โครงสร้างดั้งเดิมจากปลายคริสต์ศตวรรษที่ 13 ยังคงอยู่ และเป็นแบบอย่างการผสานประเพณีท้องถิ่นกับพุทธศาสนา",
  vi: "เจดีย์ระฆังองค์เก่าแก่ที่สุดในประเทศไทย ซึ่งบรรจุพระบรมสารีริกธาตุ",
};

export function Heritage3DDemo({ open, onClose }: Props) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      modal
      size="full"
      eyebrow="NST · UNESCO WORLD HERITAGE"
      title={`${UNESCO.chediTh} (${UNESCO.chediEn})`}
      description={
        <>
          วัดพระมหาธาตุวรมหาวิหาร จังหวัดนครศรีธรรมราช — อยู่ในบัญชีรายชื่อเบื้องต้น (Tentative List) ของมรดกโลก ยูเนสโก
          ตั้งแต่ปี {UNESCO.tentativeList} เกณฑ์ที่เสนอคือ ({UNESCO.criteria.join(") (")})
        </>
      }
      actions={
        <a
          className="btn topbar-heritage-3d__external"
          href={SKETCHFAB_URL}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Open the Wat Mahathat model by ${SKETCHFAB_AUTHOR} on Sketchfab in a new tab`}
        >
          Open on Sketchfab ↗
        </a>
      }
    >
      <div className="heritage-3d">
        <div className="heritage-3d-frame">
          <iframe
            title="Wat Mahathat photogrammetry by Phantasma Labs — Sketchfab embed"
            src={`${EMBED_URL}?${EMBED_PARAMS}`}
            allow="autoplay; fullscreen; xr-spatial-tracking; gyroscope; accelerometer"
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>

        <aside className="heritage-3d-facts" aria-label="UNESCO nomination facts">
          <h3 className="heritage-3d-facts__title">หลักฐานเพื่อการขึ้นทะเบียน</h3>
          <dl className="heritage-3d-facts__list">
            <div>
              <dt>สัดส่วนเจดีย์</dt>
              <dd>
                สูง {UNESCO.heightM} ม. × กว้าง {UNESCO.widthM} ม. (28 วา × 14 วา, 1 วา = 2 ม.)
                — อัตราส่วน 2:1 โดยเจตนา สื่อถึงรูป 28 และกิจของจิต 14 ตามพระอภิธรรม
              </dd>
            </div>
            <div>
              <dt>ความเอียง</dt>
              <dd>
                {UNESCO.leanDeg}° {UNESCO.leanDirTh} — ฐานรากยังมั่นคง วัดโดยคณะวิศวกรของ
                รศ.นคร ภู่วโรดม
              </dd>
            </div>
            <div>
              <dt>เขตหลัก / เขตกันชน</dt>
              <dd>
                {UNESCO.coreRai} ไร่ (เฉพาะภายในเขตวัด) · เขตกันชนประมาณ {UNESCO.bufferRai.toLocaleString("th-TH")} ไร่
              </dd>
            </div>
            {UNESCO.criteria.map((c) => (
              <div key={c}>
                <dt>เกณฑ์ ({c})</dt>
                <dd>{CRITERIA_TH[c]}</dd>
              </div>
            ))}
          </dl>
          <p className="heritage-3d-facts__note">
            แบบจำลองเชิงพารามิเตอร์ของเจดีย์บนแผนที่ NST วัดจากค่าตามเอกสาร UNESCO
            ไม่ใช่ภาพสแกน 3 มิติ
          </p>
        </aside>
      </div>

      <p className="heritage-3d-credit">
        <strong>โมเดลที่แสดง: วัดมหาธาตุ อยุธยา</strong> โดย {SKETCHFAB_AUTHOR} —{" "}
        <a href={SKETCHFAB_URL} target="_blank" rel="noopener noreferrer">Sketchfab</a>,{" "}
        <a
          href="https://creativecommons.org/licenses/by/4.0/"
          target="_blank"
          rel="noopener noreferrer"
        >
          {SKETCHFAB_LICENCE}
        </a>
        <br />
        <em>
          โมเดลนี้เป็นวัดมหาธาตุในอุทยานประวัติศาสตร์อยุธยา (~700 กม. เหนือ NST)
          <strong>ไม่ใช่</strong> วัดพระมหาธาตุวรมหาวิหารที่กำลังเสนอขึ้นทะเบียน
          เราแสดงไว้เพราะเป็นหลักฐานว่า photogrammetry ระดับนี้ทำได้จริง
          ไม่ใช่ภาพหลักฐานของการเสนอครั้งนี้
        </em>
      </p>
      <p className="heritage-3d-credit heritage-3d-credit--src">
        แหล่งข้อมูลบริบท: The Nation, “Wat Phra Mahathat Woramahawihan: Pretender to the
        World Heritage crown”, 13 ก.ค. 2562 —{" "}
        <a
          href="https://www.nationthailand.com/in-focus/30372903"
          target="_blank"
          rel="noopener noreferrer"
        >
          nationthailand.com/in-focus/30372903
        </a>
      </p>
    </Dialog>
  );
}
