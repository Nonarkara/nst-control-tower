import {it,expect} from "vitest";
import {ageMayorDesk,mayorDeskText,type MayorDesk,type DeskPart} from "./mayorDesk";
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
