import { test, expect } from "./fixtures";
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { openMore } from "./floodSmokeHelpers";

for (const width of [1440, 1024, 390]) {
  test(`3D buildings render grounded roofs without WebGL errors at${width}px`, async ({ page }) => {
    test.setTimeout(90_000);
    const errors: string[] = [];
    page.on("pageerror", e => errors.push(e.message));
    page.on("console", m => { if (m.type() === "error" && /mahatat|building-roofs|municipality-buildings|shader|tessellat/i.test(m.text())) errors.push(m.text()); });
    await page.setViewportSize({ width, height: 1000 });
    await page.addInitScript(() => localStorage.setItem("nst:theme", "dark"));
    await page.goto("/");
    await expect(page.locator(".map-host")).toBeVisible({ timeout: 20_000 });
    if (width <= 1100) await page.getByRole("tab", { name: /^MAP/ }).click();
    await page.getByRole("button", { name: "Show Wat Mahathat in 3D", exact: true }).click();
    await expect.poll(async () => page.evaluate(() => (window as unknown as { __mapCam?: { latitude: number } }).__mapCam?.latitude)).toBeCloseTo(8.4109925, 5);
    // The way back to 2D has to exist at every width. Below 1100px the shell
    // is the mobile form: the display preferences — the 2D/3D switch among
    // them — live in the More menu, so the way back is one menu away. It is
    // not gone, and it must not be.
    if (width <= 1100) {
      await openMore(page);
      await expect(page.getByRole("button", { name: "Switch to 2D view", exact: true })).toBeVisible();
      await page.keyboard.press("Escape");
    } else {
      await expect(page.getByRole("button", { name: "Switch to 2D view", exact: true })).toBeVisible();
    }
    const search = page.getByRole("combobox", { name: "Search buildings by name" });
    await page.waitForTimeout(1800);
    expect(errors).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    if (process.env.BUILDING_SCREENSHOTS) {
      const dir = resolve("../../var/hero-temple-2026-10-21");
      mkdirSync(dir, { recursive: true });
      await page.screenshot({ path: `${dir}/buildings-${width}.png` });
    }
    // Exercise the ordinary Buildings toggle too: roofs are an integral part
    // of that layer, not an unreachable legacy building-roofs setting.
    if (width <= 1100) await page.getByRole("tab", { name: /^LAYERS/ }).click();
    await page.getByRole("combobox", { name: "Advanced map views", exact: true }).selectOption("operations");
    await page.getByRole("checkbox", { name: /^Buildings \(OSM/ }).check();
    if (width <= 1100) await page.getByRole("tab", { name: /^MAP/ }).click();
    await search.fill("Wat Srariang");
    await page.getByRole("option", { name: /Wat Srariang/ }).click();
    await page.keyboard.press("Escape");
    await page.waitForTimeout(1800);
    expect(errors).toEqual([]);
    if (process.env.BUILDING_SCREENSHOTS) {
      const dir = resolve("../../var/hero-temple-2026-10-21");
      await page.screenshot({ path: `${dir}/city-halls-${width}.png` });
    }
  });
}
