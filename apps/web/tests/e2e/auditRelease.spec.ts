import { test, expect } from "./fixtures";
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { openMore } from "./floodSmokeHelpers";
for (const width of [1440, 1024, 390]) {
  test(`operational source comparison and navigation at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    const observedAt = new Date().toISOString();
    const meta = { source: "audit-fixture", fetchedAt: observedAt, ageMinutes: 0, fallbackTier: "live" };
    await page.route("**/api/air-quality?**", r => r.fulfill({ json: { meta, features: [{ lat: 8.43, lng: 99.96, station: "Open-Meteo grid test", source: "open-meteo", pm25: 4.2, aqi: 20, observedAt }] } }));
    await page.route("**/api/air-quality/air4thai?**", r => r.fulfill({ json: { meta, features: [{ lat: 8.43, lng: 99.96, station: "PCD station test", source: "air4thai", pm25: 14, aqi: 25, observedAt }] } }));
    await page.goto("/");
    if (width <= 1100) await page.getByRole("tab", { name: /^LAYERS/ }).click();
    const views = page.getByRole("group", { name: "Map views", exact: true });
    await views.getByRole("button", { name: "Air", exact: true }).click();
    await expect(page.getByRole("combobox", { name: "Advanced map views" })).toHaveValue("environment");
    await expect(views.getByRole("button", { name: "Air", exact: true })).toHaveAttribute("aria-pressed", "true");
    await openMore(page);
    const menu = page.locator("#topbar-more-menu");
    const rect = await menu.boundingBox();
    expect(rect!.y + rect!.height).toBeLessThanOrEqual(1000);
    if (process.env.AUDIT_SCREENSHOTS) await shot("navigation");
    await page.getByRole("button", { name: "Analyst data view", exact: true }).click();
    const terminal = page.getByRole("main", { name: "Analyst data view" });
    await expect(terminal.getByRole("heading", { name: "Air · source comparison" })).toBeVisible();
    await expect(terminal).toContainText("PCD station test");
    await expect(terminal).toContainText("4.2");
    await expect(terminal).toContainText("14");
    await expect(terminal).toContainText("Open-Meteo · model grid estimate");
    await expect(terminal).toContainText(observedAt);
    await expect(terminal).not.toContainText("FMP_API_KEY");
    await expect(terminal).not.toContainText("20.83");
    await expect(terminal).not.toContainText("dam outflow");
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    expect(await terminal.locator(".term-grid").evaluate(el => parseFloat(getComputedStyle(el).columnGap))).toBeGreaterThanOrEqual(16);
    if (process.env.AUDIT_SCREENSHOTS) await shot("analyst");
    await page.getByRole("button", { name: "MAP", exact: true }).click();
    await expect(terminal).toHaveCount(0);
    await page.goto("/flood-ops");
    await page.getByRole("button", { name: "English summary", exact: true }).click();
    await expect(page.getByRole("region", { name: "English operational summary" })).toContainText("Incomplete observations");
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    if (process.env.AUDIT_SCREENSHOTS) await shot("briefing-english");
    async function shot(name: string) { const dir = resolve("../../var/maintenance-2026-10-21"); mkdirSync(dir, { recursive: true }); await page.screenshot({ path: `${dir}/${name}-${width}.png` }); }
  });
}
