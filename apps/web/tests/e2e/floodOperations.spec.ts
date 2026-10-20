import { test, expect } from "./fixtures";

const stamp = new Date().toISOString();
const meta = { source: "fixture", fetchedAt: stamp, ageMinutes: 0, fallbackTier: "live" };
const observation = {
  generatedAt: stamp,
  gauges: [{ id: "g1", name: "ปากนคร (ทดสอบ)", lat: 8.43, lng: 100.03, stationCode: "PTTEP3", levelMsl: .62, diffFromBank: -.11, situationLevel: 4, fullnessPct: 97.89, riverName: "คลองปากนคร", amphoe: "เมือง", trend: "falling", observedAt: stamp }],
  rain: [{ id: "r1", name: "ปากพนัง (ทดสอบ)", lat: 8.3, lng: 100.1, amphoe: "ปากพนัง", rain24h: 136.6, rain1h: 1.4, observedAt: stamp }],
  waterMeta: meta, rainMeta: meta, weather: [], weatherFetchedAt: stamp, tide: null,
  context: { fetchedAt: stamp, wetness: { api: 900, band: "saturated", asOf: stamp }, rainTrend: null, tmd: null, errors: [] },
  cameraCounts: { total: 0, online: 0, unknown: 0 }, gaps: [],
};

test("mayor flood watch separates observations and models without starting cameras", async ({ page }) => {
  let cameraNegotiations = 0;
  page.on("request", r => { if (r.method() === "POST" && new URL(r.url()).pathname.endsWith("/whep")) cameraNegotiations++; });
  await page.route("**/api/flood/operations?**", r => r.fulfill({ json: { features: [observation], meta } }));
  await page.route("**/api/cctv/nst-municipality?**", r => r.fulfill({ json: { features: [{ id: "camera-1", name: "คลองทดสอบ", lat: 8.43, lng: 99.96, vendor: "nst-municipality", category: "water", status: "online", embedUrl: "https://nstcctv.nakhoncity.org/cam/WL005_sub/" }], meta } }));
  await page.goto("/flood-ops");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("เฝ้าระวังต้นน้ำ");
  await expect(page.locator(".flood-watch-focal")).toContainText("11 ซม.");
  await expect(page.locator(".flood-watch-main")).toContainText("136.6");
  await expect(page.locator(".flood-watch-table").first()).toContainText("0.11");
  await expect(page.getByRole("button", { name: "คัดลอกส่งนายกฯ" })).toBeEnabled();
  await expect(page.getByText("กล้องจะไม่เชื่อมต่อจนกดเปิดรับภาพ")).toBeVisible();
  expect(cameraNegotiations).toBe(0);
});

test("mobile watch remains readable and missing observations never become an all-clear", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.route("**/api/flood/operations?**", r => r.fulfill({ json: { features: [{ ...observation, gauges: [], rain: [], gaps: ["No observations"] }], meta } }));
  await page.goto("/flood-ops");
  await expect(page.getByText("ไม่มีสถานีน้ำอายุไม่เกิน 90 นาที — ห้ามอ่านว่าแม่น้ำปกติ")).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test("mobile map menu opens the flood watch without clipping", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.locator('[aria-controls="topbar-more-menu"]').click();
  const watch = page.getByRole("button", { name: "Flood watch / เฝ้าระวังน้ำท่วม" });
  await watch.click();
  await expect(page).toHaveURL(/\/flood-ops$/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("เฝ้าระวังต้นน้ำ");
});
