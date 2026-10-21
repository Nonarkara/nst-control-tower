import { test, expect } from "./fixtures";
import { ensureSectionOpen } from "./floodSmokeHelpers";
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";
for (const width of [1440, 390]) {
  test(`water-camera image comparison is explicit and local at${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.clock.setFixedTime(new Date("2026-10-21T20:00:00+07:00"));
    await page.route("**/api/cctv?**", r => r.fulfill({ json: { features: [{ id: "wl-fixture", sourceId: "WLTEST", name: "Canal camera test", lat: 8.411, lng: 99.966, category: "water", status: "online", embedUrl: "https://camera.example.test/wl/" }], meta: { source: "fixture", fetchedAt: new Date().toISOString(), ageMinutes: 0, fallbackTier: "live" } } }));
    await page.route("https://camera.example.test/**", r => r.fulfill({ body: "Test camera source" }));
    await page.goto("/");
    if (width < 900) await page.getByRole("tab", { name: /^LAYERS/ }).click();
    await ensureSectionOpen(page, "CCTV");
    await page.getByRole("region", { name: "CCTV cameras" }).getByRole("button", { name: /Canal camera test/ }).click();
    const dialog = page.getByRole("dialog", { name: "Canal camera test" });
    await dialog.getByRole("button", { name: "Compare water images · CV" }).click();
    await expect(dialog.locator("iframe")).toHaveCount(0);
    const watch = dialog.getByRole("region", { name: "ตรวจภาพน้ำจากกล้อง" });
    await expect(watch.getByRole("status")).toContainText("หยุดตรวจภาพ");
    await expect(watch.getByRole("button", { name: "เปิดรับภาพและ CV เฉพาะกล้องนี้" })).toBeVisible();
    await expect(watch.locator("select")).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    if (process.env.BUILDING_SCREENSHOTS) {
      const dir = resolve("../../var/hero-temple-2026-10-21"); mkdirSync(dir, { recursive: true });
      await page.screenshot({ path: `${dir}/camera-watch-${width}.png` });
    }
  });
}
