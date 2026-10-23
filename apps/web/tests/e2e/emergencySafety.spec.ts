import { test, expect } from "./fixtures";
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

for (const width of [390, 1024, 1440]) {
  test(`emergency evidence, degraded coverage and keyboard access at ${width}`, async ({ page }) => {
    test.setTimeout(120_000);
    const height = width === 390 ? 844 : 900;
    await page.setViewportSize({ width, height });
    const stamp = new Date().toISOString();
    const meta = { source: "emergency-safety-test", fetchedAt: stamp, ageMinutes: 0, fallbackTier: "live" };
    const water = { id: "safety-gauge", name: "Safety test station", lat: 8.43, lng: 99.96, levelMsl: 1.9, levelPrev: null, warningMsl: null, criticalMsl: null, bankMsl: 2, diffFromBank: -.1, situationLevel: 4, trend: "rising", fullnessPct: 95, riverName: "", amphoe: "เมือง", observedAt: stamp, isKeyStation: false, stationCode: "TEST", dischargeCms: null, qmaxCms: null };
    const ews = { id: "safety-ews", name: "DWR test critical", lat: 8.4, lng: 99.9, type: "rain", tambon: "ทดสอบ", amphoe: "ลานสกา", basin: "test", status: 3, stale: false, rain: null, rain12h: null, rain07h: null, soilMoisture: null, observedAt: stamp };
    let invalid = false;
    await page.route("**/api/water/gauges?**", r => r.fulfill({ json: {meta: {...meta, fetchedAt: invalid ? new Date(Date.parse(stamp)+1000).toISOString() : stamp}, features:[invalid ? {...water, observedAt:"2000-01-01T00:00:00Z"} : water]} }));
    await page.route("**/api/water/rain?**", r => r.fulfill({ json: {meta, features:[{id:"rain", name:"Null reading test", lat:8.4,lng:99.9,amphoe:"เมือง",observedAt:stamp,rain1h:null,rain24h:null}]} }));
    await page.route("**/api/water/ews?**", r => r.fulfill({ json: {meta, features:[ews]} }));
    await page.route("**/api/water/balance?**", r => r.fulfill({json:{meta:{...meta,fallbackTier:"cache",ageMinutes:45},features:[{basinId:"city_tha_dee",nameTh:"cached test",nameEn:"cached test",horizons:[],gauges:[{id:water.id,code:"TEST",name:water.name,etaOvertopH:1,freeboardM:.1,riseMPerH:.1}],worstEtaOvertopH:1,assumptions:[],reservoirs:[]}]}}));
    await page.goto("/");
    const headline = page.getByRole("region", {name:"Right now", exact:true});
    await expect(headline).toContainText("Safety test station", {timeout:30_000});
    await expect(headline).toContainText("overtopping time is not established");
    await expect(headline.getByRole("button", {name:"Show on map"})).toBeInViewport();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    let focus: {tag?: string; outline?: string | null} = {};
    await shot("current");
    await page.keyboard.press("Tab");
    focus = await page.evaluate(() => ({ tag:document.activeElement?.tagName, outline:document.activeElement ? getComputedStyle(document.activeElement).outlineStyle : null }));
    expect(focus.tag).not.toBe("BODY");
    if (width <= 1100) await page.getByRole("tab", {name:/^LAYERS/}).click();
    await page.getByRole("combobox", {name:"Advanced map views",exact:true}).selectOption("flood");
    const dialog = page.getByRole("dialog");
    await expect(dialog).toContainText("DWR test critical", {timeout:20_000});
    await expect(dialog).toContainText("Critical");
    await expect(dialog).toContainText("Contact the duty officer now");
    await expect(dialog.getByRole("link", {name:"Station map · แผนที่สถานี"}).first()).toBeInViewport();
    await expect(dialog).not.toContainText("EVACUATION ORDER");
    await expect(dialog).toContainText("not ONWR FFPI");
    await shot("critical-dwr");
    await page.keyboard.press("Escape");
    await expect(dialog).toHaveCount(0);
    invalid = true;
    await page.reload();
    if (width <= 1100) await page.getByRole("tab", {name:/^BRIEF/}).click();
    await expect(headline).toContainText("No water-gauge data", {timeout:30_000});
    await expect(headline).not.toContainText("No action needed");
    await shot("missing");
    async function shot(state: string) {
      if (!process.env.AUDIT_SCREENSHOTS) return;
      const dir = resolve("../../var/emergency-audit-2026-10-23"); mkdirSync(dir, {recursive:true});
      await page.screenshot({path:`${dir}/${state}-${width}.png`});
      const geometry = await page.evaluate(() => ({
        viewport: {width:innerWidth,height:innerHeight},
        regions: Array.from(document.querySelectorAll(".topbar, .mobile-nav, .bottom-bar, .situation-headline, [role=dialog]")).map(el => {const r=el.getBoundingClientRect();return {class:el.className,top:r.top,bottom:r.bottom,height:r.height,percent:Math.round(r.height/innerHeight*1000)/10};}),
        horizontalOverflow: document.documentElement.scrollWidth > innerWidth,
      }));
      writeFileSync(`${dir}/${state}-${width}.json`, JSON.stringify({state,fixture:"synthetic safety scenario",focus,...geometry},null,2));
    }
  });
}
