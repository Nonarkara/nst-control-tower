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
 * WHY THERE ARE TWO VIEWERS. Neither model Sketchfab hosts is a survey of
 * this monument, and they are not the same kind of object:
 *
 *   1. THE NAKHON SI THAMMARAT CHEDI — by armszx. A CG model of the NST
 *      chedi: bell body, stepped square base, tall spire, which is the right
 *      building in the right province. The author describes it as practice
 *      work ("จะฝึกฝนเรื่อยๆครับ"). It is a stylised reconstruction, NOT
 *      photogrammetry and NOT a measured survey, and it is labelled as such —
 *      it is an illustration of the form, not evidence of the dimensions.
 *   2. THE AYUTTHAYA COMPLEX — by PeterGlenn. This one is titled "Wat Phra
 *      Mahathat Woramahawihan, Nakhon Si Thammarat" and tagged
 *      `worldheritage`, but its own description says outright that it is the
 *      AYUTTHAYA temple in the Ayutthaya Historical Park, and the model is a
 *      photogrammetry scan of that complex — the Buddha head in the bodhi
 *      roots, the ring of small stupas, all of it Ayutthaya. It is shown as a
 *      demonstration of what monument-grade photogrammetry looks like, which
 *      is the only honest use of it here.
 *
 * The category error this panel previously committed — presenting Ayutthaya
 * photogrammetry as the evidence for the Nakhon Si Thammarat candidacy — is
 * the reason the distinction is now in the model list itself rather than in a
 * credit line at the bottom of a scroller.
 *
 * ON LICENCE. Both models return an EMPTY `license` object from the Sketchfab
 * API (verified 2026-09-29). Sketchfab requires an author to pick a licence at
 * upload; an empty object means none is on record, so we state that plainly
 * instead of asserting a Creative Commons grant that was never made. Embedding
 * goes through Sketchfab's own embed player, which is the path their terms
 * contemplate. A previous version of this file claimed "CC BY 4.0" for a
 * different model — that one did carry a licence; these two do not.
 *
 * ON PHOTOGRAMMETRY (the "could we just scan it" question). A real survey of
 * this chedi is what the nomination team did with drones, per the Nation
 * article. We cannot: it needs a licensed drone survey over a protected
 * religious site, the temple's consent, and photogrammetry software. It is
 * also the one thing we must not fake. The honest path is to request the
 * measured survey from the Fine Arts Department, who already hold the
 * engineering data. Until then the map model is a clearly-labelled parametric
 * build from the nomination's own figures.
 */
import { Dialog } from "./Dialog";

interface Props {
  open: boolean;
  onClose: () => void;
}

export interface SketchfabModel {
  uid: string;
  /** Path segment on sketchfab.com, which is NOT the bare uid. */
  slug: string;
  titleTh: string;
  titleEn: string;
  author: string;
  authorUrl: string;
  /** What the model actually IS — the thing a viewer must not be misled about. */
  isNst: boolean;
  kindTh: string;
  noteTh: string;
}

/**
 * Verified against the live Sketchfab API on 2026-09-29. Both `license`
 * objects came back empty, so no licence is asserted for either.
 */
export const SKETCHFAB_MODELS: readonly SketchfabModel[] = [
  {
    uid: "67d8526c53b144bd8304060919b3186e",
    slug: "pratat-67d8526c53b144bd8304060919b3186e",
    titleTh: "พระบรมธาตุเจดีย์ วัดพระมหาธาตุวรมหาวิหาร (แบบจำลอง)",
    titleEn: "Phra Borommathat Chedi — reconstruction model",
    author: "armszx",
    authorUrl: "https://sketchfab.com/armszx",
    isNst: true,
    kindTh: "แบบจำลอง 3 มิติ (CG)",
    noteTh:
      "เป็นเจดีย์ของนครศรีธรรมราชจริงตามรูปร่าง แต่เป็นงานจำลองเชิงกราฟิก " +
      "ไม่ใช่ภาพสแกนและไม่ใช่ผลการวัดจริง ผู้ทำระบุว่าเป็นงานฝึกฝนมือ",
  },
  {
    uid: "1baec87da8aa45c4ba029f927feafc7b",
    slug: "1baec87da8aa45c4ba029f927feafc7b",
    titleTh: "วัดมหาธาตุ อยุธยา (พระพุทธหัวในรากพระโพธิ์)",
    titleEn: "Wat Phra Mahathat, Ayutthaya — photogrammetry",
    author: "PeterGlenn",
    authorUrl: "https://sketchfab.com/PeterGlenn",
    isNst: false,
    kindTh: "โมเดล photogrammetry",
    noteTh:
      "ชื่อโมเดลระบุนครศรีธรรมราช แต่คำอธิบายของผู้ทำระบุว่าเป็น " +
      "วัดมหาธาตุในอุทยานประวัติศาสตร์อยุธยา (~700 กม. เหนือ NST) " +
      "เราแสดงไว้เพื่อเป็นตัวอย่างคุณภาพของ photogrammetry ระดับโบราณสถาน " +
      "ไม่ใช่หลักฐานของการเสนอครั้งนี้",
  },
] as const;

/** The model the panel leads with: the one that is actually this monument. */
export const PRIMARY_MODEL = SKETCHFAB_MODELS[0];

export const sketchfabUrl = (m: SketchfabModel) => `https://sketchfab.com/3d-models/${m.slug}`;
export const sketchfabEmbedUrl = (m: SketchfabModel) => `https://sketchfab.com/models/${m.uid}/embed`;

const EMBED_PARAMS =
  "autostart=1&ui_theme=dark&ui_infos=0&ui_watermark_link=0&ui_watermark=0&ui_inspector=0&ui_help=0&ui_settings=0&ui_vr=0&ui_fullscreen=1&ui_annotations=1&ui_animations=0&transparent=1";

/** Sketchfab's API returns an empty licence object for both of these models. */
export const SKETCHFAB_LICENCE_NOTE =
  "ไม่ได้ระบุสัญญาอนุญาตบน Sketchfab (API คืนค่า license ว่างเปล่า) เราจึงไม่อ้างสัญญาอนุญาตใด ๆ";

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
    >
      <div className="heritage-3d">
        <div className="heritage-3d-views">
          {SKETCHFAB_MODELS.map((m) => (
            <figure key={m.uid} className="heritage-3d-view">
              <div className="heritage-3d-frame">
                <iframe
                  title={`${m.titleEn} by ${m.author} — Sketchfab embed`}
                  src={`${sketchfabEmbedUrl(m)}?${EMBED_PARAMS}`}
                  allow="autoplay; fullscreen; xr-spatial-tracking; gyroscope; accelerometer"
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
              <figcaption className="heritage-3d-view__cap">
                <strong>{m.titleTh}</strong>
                <span className={`heritage-3d-view__badge${m.isNst ? " is-nst" : " is-other"}`}>
                  {m.isNst ? "นครศรีธรรมราช" : "อยุธยา — ไม่ใช่ NST"}
                </span>
                <p className="heritage-3d-view__meta">
                  {m.kindTh} · โดย{" "}
                  <a href={m.authorUrl} target="_blank" rel="noopener noreferrer">
                    {m.author}
                  </a>{" "}
                  ·{" "}
                  <a href={sketchfabUrl(m)} target="_blank" rel="noopener noreferrer">
                    Sketchfab ↗
                  </a>
                </p>
                <p className="heritage-3d-view__note">{m.noteTh}</p>
              </figcaption>
            </figure>
          ))}
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
                {UNESCO.coreRai} ไร่ (เฉพาะภายในเขตวัด) · เขตกันชนประมาณ{" "}
                {UNESCO.bufferRai.toLocaleString("th-TH")} ไร่
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
            ไม่ใช่ภาพสแกน 3 มิติ — โมเดลทั้งสองข้างบนเป็นงานของผู้ใช้ Sketchfab
            ไม่ใช่ผลการวัดของ NST
          </p>
        </aside>
      </div>

      <p className="heritage-3d-credit">
        สัญญาอนุญาต: {SKETCHFAB_LICENCE_NOTE} —{" "}
        <a href="https://sketchfab.com/terms" target="_blank" rel="noopener noreferrer">
          sketchfab.com/terms
        </a>
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
