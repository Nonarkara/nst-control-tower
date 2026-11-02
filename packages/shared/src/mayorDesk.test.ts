import {it,expect} from "vitest";
import {ageMayorDesk,mayorDeskText,buildDeskAnswer,type MayorDesk,type DeskPart} from "./mayorDesk";
const now=Date.parse("2026-10-26T03:00:00Z");
const part:DeskPart={key:"river",kind:"measured",level:"alert",titleTh:"น้ำ",titleEn:"Water",th:"ใกล้ตลิ่ง",en:"near bank",sourceTh:"HII",sourceEn:"HII",evidence:[],observedAt:new Date(now-119*60_000).toISOString(),staleAfterMs:120*60_000,sourceTier:"live",sourceFetchedAt:new Date(now).toISOString()};
const desk:MayorDesk={generatedAt:new Date(now).toISOString(),parts:[part],level:"alert",answerTh:"",answerEn:"",news:[],notice:null,missing:0,gaps:[],translationIncomplete:false};
it("an offline long-open page and copied brief stop making current claims",()=>{
 expect(ageMayorDesk(desk,now).level).toBe("alert");
 expect(ageMayorDesk(desk,now+2*60_000).level).toBe("unknown");
 expect(mayorDeskText(desk,now+6*60_000)).toContain("ข้อมูลเดิม");
 expect(mayorDeskText(desk,now+6*60_000)).toContain("ไม่ใช่ประกาศราชการหรือคำสั่งอพยพ");
});
it("source cache retains a measured warning and adds incomplete coverage",()=>{
 const d=ageMayorDesk({...desk,parts:[{...part,observedAt:new Date(now-30*60_000).toISOString()}]},now+61_000);
 expect(d.level).toBe("alert");expect(d.missing).toBe(1);expect(d.parts[0].sourceTier).toBe("cache");
});
it("a frozen generated clock cannot keep even recent-looking parts current",()=>{
 expect(ageMayorDesk({...desk,parts:[{...part,observedAt:new Date(now+6*60_000).toISOString()}]},now+6*60_000).level).toBe("unknown");
});

it("keeps rain coverage and exclusions in evidence and copied brief without duplicating them in the headline",()=>{
 const rain:DeskPart={...part,key:"rain",kind:"measured",titleTh:"ฝนที่วัดได้ 24 ชม.",level:"watch",coverageIncomplete:true,
  th:"มากสุด 59.0 มม./24 ชม. ที่ สะพานคีรีวง (ลานสกา) · ฝนหนัก 1 สถานี · 138/138 สถานีรายงาน · อีก 35 สถานีไม่มีข้อมูลที่ใช้ได้",observedAt:new Date(now-30*60_000).toISOString()};
 const before=JSON.stringify(rain);const answer=buildDeskAnswer([rain]);
 expect(answer.th).toBe("ฝนที่วัดได้ 24 ชม.: มากสุด 59.0 มม./24 ชม. ที่ สะพานคีรีวง (ลานสกา)");
 expect(answer.missing).toBe(1);expect(answer.level).toBe("watch");
 const copied=mayorDeskText({...desk,parts:[rain]},now);
 expect(copied).toContain("138/138");expect(copied).toContain("อีก 35 สถานี");
 expect(JSON.stringify(rain)).toBe(before);
 expect(ageMayorDesk({...desk,parts:[rain]},now+6*60_000).level).toBe("unknown");
});
