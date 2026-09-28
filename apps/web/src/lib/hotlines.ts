/**
 * Emergency hotlines — the numbers to call in a flood.
 *
 * Stolen, with credit, from FloodDash `server/hotlines.js` (its list is
 * verified against each agency's own published directory, and it removed one
 * number it could not verify — "an unverified emergency number is worse than
 * none"). Only the national numbers that apply in Nakhon Si Thammarat are
 * copied; FloodDash's Bangkok-only lines (1555, 02-248-5115, MEA 1130) are
 * deliberately left out. Do not add a local number here unless it is checked
 * against the agency's own page — a wrong number in an emergency is the one
 * bug that cannot be fixed in a follow-up release.
 */

export interface Hotline {
  number: string;
  agencyTh: string;
  agencyEn: string;
  forTh: string;
  forEn: string;
  primary: boolean;
}

export const HOTLINES: readonly Hotline[] = [
  { number: "1784", agencyTh: "ปภ.", agencyEn: "DDPM", forTh: "น้ำท่วม กู้ภัย อพยพ", forEn: "flood, rescue, evacuation", primary: true },
  { number: "1669", agencyTh: "การแพทย์ฉุกเฉิน", agencyEn: "Emergency medical", forTh: "เจ็บป่วย บาดเจ็บ ไฟดูด", forEn: "illness, injury, electric shock", primary: true },
  { number: "199", agencyTh: "ดับเพลิงและกู้ภัย", agencyEn: "Fire and rescue", forTh: "ไฟไหม้ กู้ภัย", forEn: "fire, rescue", primary: false },
  { number: "191", agencyTh: "ตำรวจ", agencyEn: "Police", forTh: "เหตุด่วนเหตุร้าย", forEn: "police emergencies", primary: false },
  { number: "1129", agencyTh: "กฟภ.", agencyEn: "PEA", forTh: "ไฟฟ้าขัดข้อง สายไฟลงน้ำ", forEn: "power emergency, live wires in water", primary: false },
];

export const PRIMARY_HOTLINES = HOTLINES.filter((h) => h.primary);

/** Phrases that mean someone may need rescue now — the chat shows hotlines
 *  before anything else. Also stolen from FloodDash's chat (น้ำ.aiya.ai had
 *  it first; FloodDash's wave-2 report credits it): "water in the house,
 *  elderly or bedridden person → give 1669 / 1784 immediately". */
const EMERGENCY_RE =
  /ติดเตียง|ผู้ป่วย|คนแก่|ผู้สูงอายุ|คนชรา|ช่วยด้วย|ช่วยที|ติดอยู่|ออกไม่ได้|น้ำเข้าบ้าน|น้ำท่วมบ้าน|จมน้ำ|หมดสติ|ไฟดูด|บาดเจ็บ|ฉุกเฉิน|help me|trapped|stranded|drowning|bedridden|injured|emergency|rescue/i;

export function isEmergencyMessage(text: string): boolean {
  return EMERGENCY_RE.test(text);
}
