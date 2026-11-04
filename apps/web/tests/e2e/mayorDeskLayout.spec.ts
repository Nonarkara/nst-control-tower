import {test, expect} from "@playwright/test";
import {readFileSync, mkdirSync, writeFileSync} from "node:fs";
import path from "node:path";

// Recorded public source response, with its ORIGINAL clocks. Freeze the test
// clock rather than making historical observations look freshly observed.
const fixture = JSON.parse(readFileSync(new URL("../fixtures/mayor-desk-populated.json",import.meta.url),"utf8"));
// Synthetic partial-coverage variant, not a revised historical source capture.
const partialRain = "มากสุด 59.0 มม./24 ชม. ที่ สะพานคีรีวง (ลานสกา) · ฝนหนัก 1 สถานี · 39/138 สถานีในชุดข้อมูล: ฝน 24 ชม. วัดภายใน 2 ชม. · อีก 35 สถานีไม่มีข้อมูลที่ใช้ได้ จึงยังยืนยันสภาพไม่ได้";
function partialCoverageResponse() {
  const response=structuredClone(fixture);
  const rain=response.features[0].parts.find((p:{key:string})=>p.key==="rain");
  rain.th=partialRain;
  rain.coverageIncomplete=true;
  return response;
}
for (const width of [390,1024,1440]) {
  test(`evidence ledger retains readings, clocks and usable focus at ${width}px`, async ({page}) => {
    test.setTimeout(60_000);
    await page.setViewportSize({width,height:width===390?844:900});
    await page.clock.install({time:new Date("2026-11-02T19:33:00Z")});
    let response = partialCoverageResponse();
    await page.route("**/api/mayor-desk?**",r=>r.fulfill({json:response}));
    await page.goto("/mayor-desk");
    await expect(page.locator(".desk-answer__text")).toContainText("PTTEP3");
    await expect(page.locator(".desk-cell--official")).toContainText("บ้านท่าเจริญ");
    await expect(page.locator(".desk-cell--rain")).toContainText("27.0");
    await expect(page.locator(".desk-cell--rivers")).toContainText("ข้อมูลเก็บล่าสุด ไม่ใช่ข้อมูลสด");
    await page.evaluate(()=>document.fonts.ready);
    const geometry=await page.evaluate(()=>({width:innerWidth,height:innerHeight,pageHeight:document.documentElement.scrollHeight,scrollWidth:document.documentElement.scrollWidth,header:document.querySelector('.desk-head')!.getBoundingClientRect().toJSON(),answer:document.querySelector('.desk-answer')!.getBoundingClientRect().toJSON(),parts:Array.from(document.querySelectorAll('.desk-reading,.desk-cell')).map(el=>({class:el.className,rect:el.getBoundingClientRect().toJSON()})),newsTop:document.querySelector('.desk-cell--news')!.getBoundingClientRect().top,minText:Math.min(...Array.from(document.querySelectorAll('.desk-part__line,.desk-part__source,.desk-evidence')).map(el=>parseFloat(getComputedStyle(el).fontSize)))}));
    expect(geometry.scrollWidth).toBeLessThanOrEqual(width);
    expect(geometry.answer.bottom).toBeLessThan(844);
    expect(geometry.minText).toBeGreaterThanOrEqual(13);
    if(!process.env.NST_DESK_BASELINE && width>=1024) {
      // A source comparison and today's news should not require a second
      // screen of empty panel geometry for this representative real reply.
      expect(geometry.newsTop).toBeLessThan(850);
    }
    if(process.env.NST_DESK_ARTIFACT_DIR) {
      const dir=process.env.NST_DESK_ARTIFACT_DIR;mkdirSync(dir,{recursive:true});
      const label=process.env.NST_DESK_BASELINE?'before':'after';
      writeFileSync(path.join(dir,`${label}-${width}.json`),JSON.stringify(geometry,null,2));
      await page.screenshot({path:path.join(dir,`${label}-${width}.png`),fullPage:true});
      await page.screenshot({path:path.join(dir,`${label}-first-${width}.png`)});
    }
    await page.getByRole('button',{name:'ปรับปรุง',exact:true}).press('Tab');
    await expect(page.getByRole('button',{name:'คัดลอกส่ง LINE',exact:true})).toBeFocused();
    expect(await page.evaluate(()=>getComputedStyle(document.activeElement!).outlineStyle)).toBe('solid');
    await page.getByText('ข่าวเพิ่มเติม 5 เรื่อง',{exact:true}).click();
    await expect(page.locator('.desk-news-more[open]')).toBeVisible();
    if(process.env.NST_DESK_ARTIFACT_DIR) await page.screenshot({path:path.join(process.env.NST_DESK_ARTIFACT_DIR,`${process.env.NST_DESK_BASELINE?'before':'after'}-expanded-${width}.png`),fullPage:true});
    if (!process.env.NST_DESK_BASELINE) {
      // Losing one optional source must release its content space rather
      // than leave a source-sized blank area reserved by another feed.
      await page.locator(".desk-news-more summary").click();
      await expect(page.locator(".desk-news-more[open]")).toHaveCount(0);
      const fullHeight=await page.locator('.desk').evaluate(el=>el.getBoundingClientRect().height);
      response=partialCoverageResponse();
      const model=response.features[0].parts.find((p:{key:string})=>p.key==="forecast");
      model.level="unknown";model.th="แบบจำลองไม่มีข้อมูลรอบปัจจุบัน";model.evidence=[];model.observedAt=null;
      response.features[0].generatedAt=response.meta.fetchedAt="2026-11-02T19:32:57Z";
      await page.reload();
      await expect(page.locator('.desk-cell--forecast')).toContainText('แบบจำลองไม่มีข้อมูลรอบปัจจุบัน');
      const missingHeight=await page.locator('.desk').evaluate(el=>el.getBoundingClientRect().height);
      expect(missingHeight).toBeLessThan(fullHeight-24);
      if(process.env.NST_DESK_ARTIFACT_DIR) await page.screenshot({path:path.join(process.env.NST_DESK_ARTIFACT_DIR,`after-model-missing-${width}.png`),fullPage:true});
      response=partialCoverageResponse();
      await page.emulateMedia({colorScheme:"dark"});
      await page.reload();
      await expect(page.locator(".desk-answer__text")).toContainText("PTTEP3");
      await expect(page.locator("html")).toHaveAttribute("data-theme","dark");
      if(process.env.NST_DESK_ARTIFACT_DIR) await page.screenshot({path:path.join(process.env.NST_DESK_ARTIFACT_DIR,`after-dark-${width}.png`),fullPage:true});
      await page.locator(".desk-part--notice summary").click();
      await expect(page.locator(".desk-part--notice[open]")).toContainText("ข้อความนี้เป็นอดีต");
      if(process.env.NST_DESK_ARTIFACT_DIR) await page.screenshot({path:path.join(process.env.NST_DESK_ARTIFACT_DIR,`after-notice-${width}.png`),fullPage:true});
      if(width===1440) {
        await page.emulateMedia({media:"print"});
        expect(await page.locator(".desk-part__line").first().evaluate(el=>getComputedStyle(el).color)).toBe("rgb(17, 17, 17)");
        expect(await page.locator(".desk-stale").first().evaluate(el=>getComputedStyle(el).color)).toBe("rgb(92, 68, 0)");
        expect(await page.getByRole("link",{name:"อ่านประกาศล่าสุด",exact:true}).evaluate(el=>getComputedStyle(el).color)).toBe("rgb(23, 74, 139)");
        expect(await page.locator("body").evaluate(el=>getComputedStyle(el).backgroundColor)).toBe("rgb(255, 255, 255)");
        await expect(page.locator(".desk-cell--news")).not.toBeVisible();
        if(process.env.NST_DESK_ARTIFACT_DIR) await page.screenshot({path:path.join(process.env.NST_DESK_ARTIFACT_DIR,"after-print-dark.png"),fullPage:true});
        await page.emulateMedia({media:"screen"});
      }
      response=partialCoverageResponse();
      const official=response.features[0].parts.find((p:{key:string})=>p.key==="official");
      official.declared=true;official.level="alert";
      official.th="ประกาศเตือนจาก DWR ในข้อมูลทดสอบลำดับการอ่าน — ไม่ใช่ประกาศจริง";official.evidence=[];
      response.features[0].level="alert";
      response.features[0].answerTh=`${official.titleTh}: ประกาศเตือนจากหน่วยงาน — ทดสอบลำดับการอ่าน`;
      response.features[0].generatedAt=response.meta.fetchedAt="2026-11-02T19:32:58Z";
      await page.reload();
      await expect(page.locator(".desk-readings--official-first")).toBeVisible();
      const priority=await page.evaluate(()=>({official:document.querySelector('.desk-cell--official')!.getBoundingClientRect().toJSON(),river:document.querySelector('.desk-cell--rivers')!.getBoundingClientRect().toJSON()}));
      expect(priority.official.top < priority.river.top || (Math.abs(priority.official.top-priority.river.top)<1 && priority.official.left<priority.river.left)).toBe(true);
      if(process.env.NST_DESK_ARTIFACT_DIR) await page.screenshot({path:path.join(process.env.NST_DESK_ARTIFACT_DIR,`after-official-first-${width}.png`),fullPage:true});
      response=partialCoverageResponse();
      response.features[0].generatedAt=response.meta.fetchedAt="2026-11-02T19:32:59Z";
      response.features[0].level="unknown";response.features[0].missing=3;
      response.features[0].answerTh="ยังตอบไม่ครบ — ระดับน้ำ ฝน และ DWR ไม่มีข้อมูลปัจจุบัน ไม่ใช่การยืนยันว่าปลอดภัย";
      response.features[0].gaps=["FloodDash relay unavailable","DWR EWS unavailable"];
      response.features[0].parts=response.features[0].parts.map((p:{key:string})=>p.key==="forecast"?p:{...p,level:"unknown",th:"ข้อมูลขาดช่วง — ยังยืนยันสภาพปัจจุบันไม่ได้",evidence:[],observedAt:null,sourceFetchedAt:null,sourceTier:"unavailable"});
      await page.reload();
      await expect(page.locator(".desk-answer__text")).toContainText("ยังตอบไม่ครบ");
      await expect(page.locator(".desk-reading .desk-chip--unknown")).toHaveCount(3);
      await expect(page.locator(".desk-gaps")).toContainText("FloodDash relay unavailable");
      expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
      if(process.env.NST_DESK_ARTIFACT_DIR) await page.screenshot({path:path.join(process.env.NST_DESK_ARTIFACT_DIR,`after-missing-${width}.png`),fullPage:true});
    }

  });
}


test("rain headline states the reading once while keeping coverage and exclusions in evidence",async({page})=>{
 test.setTimeout(60_000);
 await page.setViewportSize({width:390,height:844});
 await page.clock.install({time:new Date("2026-11-02T19:33:00Z")});
 const response=partialCoverageResponse();
 response.features[0].parts.find((p:{key:string})=>p.key==="river").level="good";
 await page.route("**/api/mayor-desk?**",r=>r.fulfill({json:response}));
 await page.goto("/mayor-desk");
 await expect(page.locator('.desk-answer__text')).toContainText('59.0');
 await expect(page.locator('.desk-answer__text')).not.toContainText('39/138');
 await expect(page.locator('.desk-cell--rain')).toContainText('39/138');
 await expect(page.locator('.desk-cell--rain')).toContainText('35 สถานี');
 if(process.env.NST_DESK_ARTIFACT_DIR) await page.screenshot({path:path.join(process.env.NST_DESK_ARTIFACT_DIR,'after-rain-headline-390.png'),fullPage:true});
});
