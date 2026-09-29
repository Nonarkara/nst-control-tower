import { test, expect, type Page } from "@playwright/test";
import { stubHiiSurvey } from "./floodSmokeHelpers";

test.setTimeout(90_000);

/**
 * The heritage panel's interactive contract.
 *
 * This panel has been confidently wrong three times, and none of the failures
 * broke a test: it credited CyArk/Agisoft/CC BY-NC-SA for a model Sketchfab
 * attributes to someone else; every outbound link carried a stray "none-"
 * prefix and 404'd while the embed still worked; and it framed Ayutthaya
 * photogrammetry as evidence for the Nakhon Si Thammarat World Heritage
 * candidacy.
 *
 * The third failure is the one that is easiest to reintroduce, because the
 * second Ayutthaya model is TITLED "Wat Phra Mahathat Woramahawihan, Nakhon
 * Si Thammarat" and TAGGED worldheritage. Only its description and its render
 * say Ayutthaya. So the UI test asserts the badge a reader actually sees, not
 * the constant behind it.
 */
test.describe("UNESCO heritage showcase", () => {
  // Every test waits this long for the dialog, not just the first: the cost is
  // cold — Vite's first compile of the map plus the lazy() chunk for
  // Heritage3DDemo behind <Suspense fallback={null}> — and which test pays it
  // varies run to run, so a per-test budget only moved the flakiness around.
  const DIALOG_TIMEOUT = 60_000;

  const openDialog = async (page: Page) => {
    await stubHiiSurvey(page);
    await page.goto("/");
    await expect(page.locator(".map-host")).toBeVisible({ timeout: 20_000 });
    await page.getByRole("button", { name: /heritage 3D demo/i }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible({ timeout: DIALOG_TIMEOUT });
    return dialog;
  };

  test("the 3D heritage button opens the nomination, not a bare model", async ({ page }) => {
    const dialog = await openDialog(page);
    await expect(dialog.getByText(/พระบรมธาตุเจดีย์/).first()).toBeVisible();
    await expect(dialog.getByText(/มรดกโลก|ยูเนสโก/).first()).toBeVisible();
    await expect(dialog.getByText(/1\.45/).first()).toBeVisible();
  });

  test("both Sketchfab viewers are present and each is captioned", async ({ page }) => {
    const dialog = await openDialog(page);
    const views = dialog.locator(".heritage-3d-view");
    await expect(views).toHaveCount(2);
    await expect(dialog.locator(".heritage-3d-frame iframe")).toHaveCount(2);
    // Each caption names its own author — a single shared credit line cannot
    // tell the reader which canvas is which.
    await expect(dialog.getByText("armszx")).toBeVisible();
    await expect(dialog.getByText("PeterGlenn")).toBeVisible();
  });

  test("the Ayutthaya model is badged as NOT the Nakhon Si Thammarat temple", async ({ page }) => {
    // The category error, in the form it actually takes now: a model titled
    // "Wat Phra Mahathat ... Nakhon Si Thammarat" that is Ayutthaya. A reader
    // must be able to tell which canvas is which without opening Sketchfab.
    const dialog = await openDialog(page);
    await expect(dialog.getByText("นครศรีธรรมราช").first()).toBeVisible();
    await expect(dialog.getByText(/อยุธยา\s*—\s*ไม่ใช่\s*NST/)).toBeVisible();
  });

  test("the links carry the model's own slug, not a bare uid or a placeholder", async ({ page }) => {
    const dialog = await openDialog(page);
    // One of the two is NOT addressable by uid alone — its path carries a
    // "pratat-" prefix. A link built as /3d-models/<uid> 404s for it, exactly
    // as the old "none-" links did. Asserted against the two real URLs rather
    // than a shape, because a shape that accepts a slug also happily accepts
    // "none-<uid>" — the exact bug this panel already shipped once.
    const links = dialog.locator('.heritage-3d-view__meta a[href*="sketchfab.com/3d-models/"]');
    await expect(links).toHaveCount(2);
    const hrefs = (await links.evaluateAll((els) => els.map((e) => (e as HTMLAnchorElement).href))).sort();
    expect(hrefs).toEqual([
      "https://sketchfab.com/3d-models/1baec87da8aa45c4ba029f927feafc7b",
      "https://sketchfab.com/3d-models/pratat-67d8526c53b144bd8304060919b3186e",
    ]);
  });

  test("no licence is claimed, and the wrongly-attributed names stay gone", async ({ page }) => {
    const dialog = await openDialog(page);
    // Both models return an empty `license` object from the Sketchfab API, so
    // asserting a Creative Commons grant would be asserting something the
    // authors never made.
    await expect(dialog.getByText(/ไม่ได้ระบุสัญญาอนุญาต/)).toBeVisible();
    await expect(dialog.getByText(/CC BY/)).toHaveCount(0);
    await expect(dialog.getByText(/CyArk/)).toHaveCount(0);
    await expect(dialog.getByText(/Agisoft/)).toHaveCount(0);
  });
});
