import { expect, type Page } from "@playwright/test";

/**
 * Expand a collapsible rail section if it isn't already open.
 * The rail defaults most sections to collapsed to fit a flood-ops board on
 * one screen; tests that probe inside the body of a section must call this
 * with the section's HEADER title (e.g. "Water & Reservoirs"), not the
 * inner panel eyebrow (e.g. "WATER MONITORING") — the header sits outside
 * the body and is what carries the click-to-expand behaviour.
 *
 * The header button also contains the chevron glyph (▾/▸) so we don't anchor
 * the regex — we just match the title as a substring of the header's text.
 */
export async function ensureSectionOpen(
  page: Page,
  sectionTitle: string,
) {
  const header = page.locator(".sidebar-section__hdr", {
    hasText: new RegExp(sectionTitle, "i"),
  });
  await expect(header).toBeVisible({ timeout: 15_000 });
  // Treat anything other than "true" as collapsed — including a missing/empty
  // attribute if a remount races the read.
  if ((await header.getAttribute("aria-expanded")) !== "true") {
    // Nested left-rail scroll + map WebGL can make Playwright's pointer click
    // hang for tens of seconds even with force:true (GPU process pegged after
    // a FLOOD lens entry). The contract is the button's onClick — fire it via
    // the DOM so we still assert expand behaviour without pointer starvation.
    await header.evaluate((el) => (el as HTMLButtonElement).click());
    await expect(header).toHaveAttribute("aria-expanded", "true", { timeout: 15_000 });
  }
}

/** Switch lens by its visible label (EXEC / OPS / FLOOD / EAR …). */
export async function selectLens(page: Page, label: string) {
  const button = page.locator(".lens").locator("button", { hasText: new RegExp(`^${label}$`) });
  // Lens buttons sit in the top bar — same WebGL starvation can stall pointer
  // clicks after a prior FLOOD visit in the same worker; DOM click is fine.
  await button.evaluate((el) => (el as HTMLButtonElement).click());
  await expect(button).toHaveAttribute("aria-pressed", "true", { timeout: 30_000 });
  // Lens switches remount the rail. Wait for at least one section header so
  // ensureSectionOpen isn't racing the unmount of the previous lens.
  await expect(page.locator(".sidebar-section__hdr").first()).toBeVisible({ timeout: 15_000 });
}

/** Serve the tiny HII fixtures so FLOOD COMMAND / PABUK never pulls the 2.1 MB survey. */
export async function stubHiiSurvey(page: Page) {
  await page.route("**/geo/nst/hii/road-levels.geojson", async (route) => {
    await route.fulfill({ path: "tests/e2e/fixtures/road-levels.mini.geojson", contentType: "application/geo+json" });
  });
  await page.route("**/geo/nst/hii/flood-marks.geojson", async (route) => {
    await route.fulfill({ path: "tests/e2e/fixtures/flood-marks.mini.geojson", contentType: "application/geo+json" });
  });
  // Empty waterways FC — the real 1.9 MB extract is what pegs the GPU after
  // selectLens(FLOOD) and starves every subsequent click in CI / headless.
  await page.route("**/geo/nst/waterways.geojson", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/geo+json",
      body: JSON.stringify({ type: "FeatureCollection", features: [] }),
    });
  });
}
