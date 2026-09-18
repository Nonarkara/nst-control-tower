import { test, expect } from "@playwright/test";
import { ensureSectionOpen, selectLens, stubHiiSurvey } from "./floodSmokeHelpers";

test.setTimeout(90_000);

test.describe("FLOOD lens — panel headers", () => {
  test("WaterPanel and UpstreamWatershed render their PanelHeader eyebrows", async ({ page }) => {
    await stubHiiSurvey(page);
    await page.goto("/");
    await expect(page.locator(".map-host")).toBeVisible({ timeout: 20_000 });

    // Rail sections are lens-driven (lib/railSections.ts) — open the lens that owns this panel.
    await selectLens(page, "FLOOD");

    // Rail defaults these sections to collapsed — open them so the panel
    // eyebrows (WATER MONITORING, WATERSHED) are reachable.
    await ensureSectionOpen(page, "Water & Reservoirs");
    await ensureSectionOpen(page, "Upstream Watershed");

    // WaterPanel and UpstreamWatershed live in the FLOOD lens rail. PanelHeader renders its title immediately,
    // even during loading state — so no API data is required.
    await expect(page.getByText(/WATER MONITORING/i).first()).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(/WATERSHED/i).first()).toBeVisible({ timeout: 10_000 });
  });
});

test.describe("FLOOD COMMAND — God Mode scenario", () => {
  test("panel renders and the PABUK preset produces an impact readout", async ({ page }) => {
    await stubHiiSurvey(page);
    await page.goto("/");
    await expect(page.locator(".map-host")).toBeVisible({ timeout: 20_000 });

    // Rail sections are lens-driven (lib/railSections.ts) — open the lens that owns this panel.
    await selectLens(page, "FLOOD");

    // Rail defaults the flood-command section to collapsed — open it so
    // the PABUK preset buttons and the impact readout are reachable.
    await ensureSectionOpen(page, "Flood Command");

    // Panel header confirms mount (left rail, always visible inside the body)
    await expect(page.getByText(/FLOOD COMMAND \/\/ GOD MODE/i)).toBeVisible({ timeout: 15_000 });

    // No impact readout while the scenario is off
    await expect(page.locator(".fc-impact")).toHaveCount(0);

    // Click the Pabuk preset — impact arithmetic appears once road levels load
    await page.getByRole("button", { name: /PABUK 2019/ }).evaluate((el) => (el as HTMLButtonElement).click());
    const impact = page.locator(".fc-impact");
    await expect(impact).toBeVisible({ timeout: 15_000 });
    await expect(impact).toContainText(/% of surveyed streets under water/);
    await expect(impact).toContainText(/historical marks/);

    // OFF turns the readout back off
    await page.getByRole("button", { name: /^OFF$/ }).evaluate((el) => (el as HTMLButtonElement).click());
    await expect(page.locator(".fc-impact")).toHaveCount(0);
  });
});

test.describe("Language toggle (EN/TH)", () => {
  test("switching to Thai localizes the FLOOD COMMAND panel and back", async ({ page }) => {
    await stubHiiSurvey(page);
    await page.goto("/");
    await expect(page.locator(".map-host")).toBeVisible({ timeout: 20_000 });

    // Rail sections are lens-driven (lib/railSections.ts) — open the lens that owns this panel.
    await selectLens(page, "FLOOD");

    // Rail defaults the flood-command section to collapsed — open it so
    // the localized panel title inside the body is reachable.
    await ensureSectionOpen(page, "Flood Command");

    // Default locale is English — the FLOOD COMMAND header reads in English.
    await expect(page.getByText(/FLOOD COMMAND \/\/ GOD MODE/i)).toBeVisible({ timeout: 15_000 });

    // Click the language toggle (offers "TH" while in EN mode).
    const toThai = page.getByRole("button", { name: /Switch to Thai interface/i });
    await expect(toThai).toBeVisible({ timeout: 10_000 });
    await toThai.evaluate((el) => (el as HTMLButtonElement).click());

    // Panel title flips to Thai — this is the panel that was explicitly
    // deferred as "not yet Thai-localized" in the flood-hardening commit.
    await expect(page.getByText("ศูนย์บัญชาการน้ำท่วม")).toBeVisible({ timeout: 10_000 });

    // Flip back to English.
    const toEnglish = page.getByRole("button", { name: /Switch to English interface/i });
    await toEnglish.evaluate((el) => (el as HTMLButtonElement).click());
    await expect(page.getByText(/FLOOD COMMAND \/\/ GOD MODE/i)).toBeVisible({ timeout: 10_000 });
  });
});

test.describe("SENSOR SITUATION — FloodDash + AirDash board", () => {
  test("situation board renders with Dr.Non attribution", async ({ page }) => {
    await stubHiiSurvey(page);
    await page.goto("/");
    await expect(page.locator(".map-host")).toBeVisible({ timeout: 20_000 });

    // Rail sections are lens-driven (lib/railSections.ts) — open the lens that owns this panel.
    await selectLens(page, "FLOOD");

    await expect(page.getByText(/^SENSOR SITUATION$/).first()).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(/Powered by/i).first()).toBeVisible();
    await expect(page.getByText(/FloodDash/i).first()).toBeVisible();
    await expect(page.getByText(/AirDash/i).first()).toBeVisible();
    await expect(page.getByText(/Dr\.Non/i).first()).toBeVisible();

    // Non-critical sections start collapsed (chevron ▸, aria-expanded=false)
    const floodAnalysis = page.locator('.sidebar-section__hdr:has-text("Flood Analysis")');
    await expect(floodAnalysis).toHaveAttribute("aria-expanded", "false");
    const waterBalance = page.locator('.sidebar-section__hdr:has-text("Water Balance")');
    await expect(waterBalance).toHaveAttribute("aria-expanded", "true");

    // Clicking a collapsed heading expands it (DOM click — see ensureSectionOpen)
    await floodAnalysis.evaluate((el) => (el as HTMLButtonElement).click());
    await expect(floodAnalysis).toHaveAttribute("aria-expanded", "true");
  });
});

test.describe("PEOPLE FIRST — who to move first", () => {
  test("ranks the village register and states where its numbers come from", async ({ page }) => {
    await stubHiiSurvey(page);
    await page.goto("/");
    await expect(page.locator(".map-host")).toBeVisible({ timeout: 20_000 });
    await selectLens(page, "FLOOD");

    const panel = page.getByRole("region", { name: "Who to move first" });
    await expect(panel).toBeVisible({ timeout: 15_000 });
    // The register is a static file, so the summary renders even with no backend.
    await expect(panel.getByText(/villages to move now/)).toBeVisible({ timeout: 15_000 });
    // Honesty contract: estimates are labelled and names stay with the health office.
    await expect(panel.getByText(/so they are estimates/)).toBeVisible();
    await expect(panel.getByText(/held by the local health office/)).toBeVisible();
  });
});
