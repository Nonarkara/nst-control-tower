import { test, expect } from "@playwright/test";

/**
 * The mayor's desk. The rules that matter here are the ones a reader
 * depends on: the answer comes first, a part that could not be read says so
 * instead of looking calm, a foreign headline arrives in Thai, and a
 * headline that could not be translated is marked rather than passed off.
 */
const stamp = new Date().toISOString();

const part = (over: Record<string, unknown> = {}) => ({
  key: "river", level: "watch", kind: "measured", titleTh: "ระดับน้ำที่สถานีวัด",
  titleEn: "River levels at gauges", th: "ยังไม่ถึงเกณฑ์ 30 ซม. แต่ใกล้ที่สุด PTTEP3 เหลือถึงตลิ่ง 0.52 ม.",
  en: "Closest gauge 0.52 m below bank", evidence: ["PTTEP3 — เหลือถึงตลิ่ง 0.52 ม. · กำลังลด"],
  sourceTh: "HII ThaiWater ผ่าน FloodDash", sourceEn: "HII via FloodDash",
  observedAt: new Date().toISOString(), staleAfterMs: 7200000, ...over,
});

const desk = (over: Record<string, unknown> = {}) => ({
  features: [{
    generatedAt: new Date().toISOString(),
    level: "watch",
    answerTh: "ระดับน้ำที่สถานีวัด: ยังไม่ถึงเกณฑ์ 30 ซม. แต่ใกล้ที่สุด PTTEP3 เหลือถึงตลิ่ง 0.52 ม.",
    answerEn: "River levels at gauges: closest gauge 0.52 m below bank",
    parts: [
      part(),
      part({ key: "official", level: "good", kind: "official", titleTh: "ประกาศเตือน DWR", th: "ไม่มีประกาศเตือนจาก DWR · ใกล้เกณฑ์ที่สุด บ้านนางเอื้อย เหลือ 1.06 ม.", evidence: [] }),
      part({ key: "rain", level: "watch", kind: "measured", titleTh: "ฝนที่วัดได้ 24 ชม.", th: "มากสุด 88.0 มม./24 ชม. ที่ ลานสกา", evidence: [] }),
      part({ key: "forecast", level: "unknown", kind: "model", titleTh: "พยากรณ์ฝน 24 ชม.", th: "ยังไม่มีแบบจำลองพยากรณ์ฝน", evidence: [] }),
    ],
    news: [
      { id: "n1", titleTh: "น้ำท่วมต่อเนื่อง 16 จังหวัด 2 เขต กทม", originalTitle: "Floods persist in 16 provinces, two districts of Bangkok", language: "en", translated: true, source: "Bangkok Post", url: "https://example.test/a", publishedAt: stamp, placeName: null, whyTh: "เรื่องน้ำท่วม", whyEn: "Flooding" },
      { id: "n2", titleTh: "Floods continue in the north", originalTitle: "Floods continue in the north", language: "en", translated: false, source: "Reuters", url: "https://example.test/b", publishedAt: stamp, placeName: null, whyTh: "ข่าวต่างประเทศ", whyEn: "National" },
    ],
    notice: null,
    missing: 1,
    gaps: [],
    translationIncomplete: true,
  }],
  meta: { source: "test", fetchedAt: stamp, ageMinutes: 0, fallbackTier: "live" },
  ...over,
});

test("the desk answers first, in Thai, with the evidence under it", async ({ page }) => {
  await page.route("**/api/mayor-desk?**", r => r.fulfill({ json: desk() }));
  await page.goto("/mayor-desk");
  await expect(page.locator(".desk-answer__text")).toContainText("ระดับน้ำที่สถานีวัด");
  await expect(page.locator(".desk-answer__text")).toContainText("PTTEP3");
  // the four compartments, each with the content it was built for
  await expect(page.locator(".desk-cell")).toHaveCount(4);
  await expect(page.locator(".desk-cell--rivers")).toContainText("0.52 ม.");
  await expect(page.locator(".desk-cell--official")).toContainText("ไม่มีประกาศเตือนจาก DWR");
  await expect(page.locator(".desk-cell--rain")).toContainText("88.0 มม.");
  await expect(page.locator(".desk-cell--news")).toContainText("น้ำท่วมต่อเนื่อง 16 จังหวัด");
});

test("a part that could not be read says so — it is never dropped and never calm", async ({ page }) => {
  await page.route("**/api/mayor-desk?**", r => r.fulfill({ json: desk() }));
  await page.goto("/mayor-desk");
  const forecast = page.locator(".desk-cell--rain").getByText("พยากรณ์ฝน 24 ชม.");
  await expect(forecast).toBeVisible();
  await expect(page.locator(".desk-cell--rain")).toContainText("ยังไม่มีแบบจำลองพยากรณ์ฝน");
  // and the chip for it is the neutral "not complete" one, not a severity fill
  const unknown = page.locator(".desk-chip--unknown");
  await expect(unknown).toHaveCount(1);
  await expect(unknown).toHaveText("ไม่ครบ");
});

test("a translated headline keeps its original underneath, and an untranslated one is marked", async ({ page }) => {
  await page.route("**/api/mayor-desk?**", r => r.fulfill({ json: desk() }));
  await page.goto("/mayor-desk");
  await expect(page.locator(".desk-news__headline").first()).toHaveText("น้ำท่วมต่อเนื่อง 16 จังหวัด 2 เขต กทม");
  await expect(page.locator(".desk-news__original")).toHaveCount(1);
  await expect(page.locator(".desk-news__original")).toHaveText("Floods persist in 16 provinces, two districts of Bangkok");
  await expect(page.locator(".desk-cell--news")).toContainText("บางพาดหัวยังไม่ได้แปลเป็นภาษาไทย");
});

test("no signal is a neutral chip, never a green one", async ({ page }) => {
  await page.route("**/api/mayor-desk?**", r => r.fulfill({ json: desk() }));
  await page.goto("/mayor-desk");
  const good = page.locator(".desk-chip--good");
  await expect(good).toHaveCount(1);
  const bg = await good.evaluate(el => getComputedStyle(el).backgroundColor);
  expect(bg).toBe("rgba(0, 0, 0, 0)");
});

test("the desk fits a phone without sideways scroll", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.route("**/api/mayor-desk?**", r => r.fulfill({ json: desk() }));
  await page.goto("/mayor-desk");
  await expect(page.locator(".desk-answer__text")).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  // the answer is in the first screen
  const bottom = await page.locator(".desk-answer").evaluate(el => el.getBoundingClientRect().bottom);
  expect(bottom).toBeLessThanOrEqual(844);
});

test("the mayor can copy a timestamped Thai brief and print it", async ({page,context})=>{
 await context.grantPermissions(["clipboard-read","clipboard-write"]);
 await page.route("**/api/mayor-desk?**",r=>r.fulfill({json:desk()}));
 await page.goto("/mayor-desk");await expect(page.locator(".desk-answer__action")).toContainText("ตรวจสอบต่อ");
 await page.getByRole("button",{name:"คัดลอกส่ง LINE"}).click();
 await expect(page.getByRole("status")).toContainText("คัดลอกแล้ว");
 const copied=await page.evaluate(()=>navigator.clipboard.readText());
 expect(copied).toContain("ไม่ใช่ประกาศราชการหรือคำสั่งอพยพ");expect(copied).toContain("ประมวลผล");
 await page.evaluate(()=>{window.print=()=>{document.body.dataset.printed="yes";};});
 await page.getByRole("button",{name:"พิมพ์สรุป"}).click();expect(await page.locator("body").getAttribute("data-printed")).toBe("yes");
});
test("a long-open stalled desk cannot keep its current headline",async({page})=>{
 await page.clock.install({time:new Date()});const payload=desk();
 await page.route("**/api/mayor-desk?**",r=>r.fulfill({json:payload}));
 await page.goto("/mayor-desk");await expect(page.locator(".desk-answer__text")).toContainText("PTTEP3");
 await page.clock.fastForward(6*60_000);
 await expect(page.locator(".desk-answer__text")).toContainText("ยังตอบไม่ครบ");
 await expect(page.locator(".desk-cell--rivers")).toContainText("ข้อมูลเดิม");
});
test("initial failure still allows the mayor to retry",async({page})=>{
 await page.route("**/api/mayor-desk?**",r=>r.abort());await page.goto("/mayor-desk");
 await expect(page.getByRole("button",{name:"ปรับปรุง",exact:true})).toBeEnabled({timeout:35000});
});

test("tablet rain follows river evidence without inheriting the official panel height",async({page})=>{
 await page.setViewportSize({width:1024,height:900});const payload=desk();
 payload.features[0].parts.find(p=>p.key==="official")!.evidence=Array.from({length:12},(_,i)=>`สถานี ${i} — ระดับน้ำเทียบเกณฑ์หน่วยงาน`);
 await page.route("**/api/mayor-desk?**",r=>r.fulfill({json:payload}));await page.goto("/mayor-desk");
 await expect(page.locator(".desk-answer")).toBeVisible();
 const gap=await page.evaluate(()=>document.querySelector('.desk-cell--rain')!.getBoundingClientRect().top-document.querySelector('.desk-cell--rivers')!.getBoundingClientRect().bottom);
 expect(gap).toBeGreaterThanOrEqual(0);expect(gap).toBeLessThanOrEqual(20);
 await expect(page.locator('.desk-news__translation')).toContainText('ยังไม่ยืนยัน');
});
