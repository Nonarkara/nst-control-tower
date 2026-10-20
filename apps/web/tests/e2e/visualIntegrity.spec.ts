import { test, expect } from "./fixtures";
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";
const stamp = new Date().toISOString();
const meta = { source: "geometry-fixture", fetchedAt: stamp, ageMinutes: 0, fallbackTier: "live" };
for (const width of [1440, 1024, 390]) {
  test(`quantitative reference marks and compact composition at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.route("**/api/water/gauges?**", r => r.fulfill({ json: { meta, features: [{ id: "g1", stationCode: "PTTEP3", name: "Pak Nakhon test", lat: 8.43, lng: 100.03, levelMsl: .62, fullnessPct: 95.6, diffFromBank: -.11, situationLevel: 4, trend: "falling", amphoe: "City", observedAt: stamp }] } }));
    await page.route("**/api/water/rain?**", r => r.fulfill({ json: { meta, features: [{ id: "r1", name: "Rain test", lat: 8.43, lng: 99.96, rain24h: 104.2, rain1h: 1, amphoe: "City", observedAt: stamp }] } }));
    await page.route("**/api/air-quality/air4thai?**", r => r.fulfill({ json: { meta, features: [{ id: "a1", station: "Air test", lat: 8.43, lng: 99.96, pm25: 12.9, aqi: 22, category: "good", observedAt: stamp }] } }));
    await page.addInitScript(() => localStorage.setItem("nst:theme", "dark"));
    await page.goto("/");
    if (width < 900) await page.getByRole("tab", { name: /^BRIEF/ }).click();
    const situation = page.getByRole("region", { name: "Sensor situation", exact: true });
    const water = situation.locator(".reference-gauge").filter({ hasText: "Fullest channel" });
    await expect(water).toContainText("4.4 percentage points below Bank", { timeout: 15_000 });
    await expect(water.locator('[data-threshold="100"]')).toBeVisible();
    const geometry = await water.evaluate(el => {
      const track = el.querySelector(".reference-gauge__track")!.getBoundingClientRect();
      const threshold = el.querySelector('[data-threshold="100"]')!.getBoundingClientRect();
      const fill = el.querySelector(".reference-gauge__fill")!.getBoundingClientRect();
      return { bank: (threshold.left - track.left) / track.width, fill: fill.width / track.width };
    });
    expect(geometry.bank).toBeCloseTo(.8, 2);
    expect(geometry.fill).toBeCloseTo(95.6 / 125, 2);
    expect(geometry.fill).toBeLessThan(geometry.bank);
    const stats = await situation.locator(".pc-stats").first().locator(":scope > div").evaluateAll(items => items.map(x => { const b = x.getBoundingClientRect(); return { x: Math.round(b.x), y: Math.round(b.y) }; }));
    expect(new Set(stats.map(p => p.x)).size).toBe(2);
    expect(new Set(stats.map(p => p.y)).size).toBe(2);
    const rain = situation.locator(".reference-gauge").filter({ hasText: "Most rain in 24 h" });
    await expect(rain).toContainText("Very heavy: reached; 14.1 mm above");
    if (width < 900) {
      const row = page.locator(".mobile-brief-feeds");
      const bounds = await row.locator(".feed-chip").evaluateAll(items => items.map(x => x.getBoundingClientRect().top));
      expect(new Set(bounds.map(Math.round)).size).toBe(1);
      expect(await row.locator(".feed-chip").first().evaluate(el => parseFloat(getComputedStyle(el).fontSize))).toBeGreaterThanOrEqual(12);
      expect(await row.evaluate(el => el.getBoundingClientRect().height)).toBeLessThan(45);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    if (process.env.SPATIAL_SCREENSHOTS) {
      const dir = resolve("../../var/spatial-integrity-2026-10-20"); mkdirSync(dir, { recursive: true });
      if (width < 900) await page.locator(".mobile-brief-feeds").screenshot({ path: `${dir}/feeds-${width}.png` });
      await situation.screenshot({ path: `${dir}/gauges-${width}.png` });
      await page.screenshot({ path: `${dir}/page-${width}.png` });
    }
    if (width === 1440) {
      await page.getByRole("button", { name: "Open source catalog" }).click();
      const domains = page.locator(".sources-domains .sources-domain");
      await expect(domains.first()).toBeVisible();
      const marks = await domains.evaluateAll(items => items.map(el => ({
        count: Number(el.querySelector(".num")!.textContent),
        percent: parseFloat((el.querySelector(".sources-domain__bar > span") as HTMLElement).style.width),
      })));
      for (const mark of marks) expect(Math.abs(mark.percent - mark.count / marks[0].count * 100)).toBeLessThanOrEqual(.51);
    }
  });
}
