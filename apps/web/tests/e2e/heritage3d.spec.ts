import { test, expect } from "@playwright/test";
import { stubHiiSurvey } from "./floodSmokeHelpers";

test.setTimeout(90_000);

/**
 * The heritage panel's interactive contract.
 *
 * The previous implementation shipped three defects that no test caught: it
 * credited CyArk/Agisoft/CC BY-NC-SA for a model the Sketchfab API attributes
 * to Phantasma Labs under CC BY 4.0; every outbound link carried a stray
 * "none-" prefix and 404'd; and it framed Ayutthaya photogrammetry as evidence
 * for the Nakhon Si Thammarat World Heritage candidacy. This suite pins the
 * fixes at the UI level, because the unit tests only cover the constants.
 */
test.describe("UNESCO heritage showcase", () => {
  // Every test here waits this long for the dialog, not just the first. The
  // cause is cold cost — Vite's first compile of the map plus the lazy() chunk
  // for Heritage3DDemo behind <Suspense fallback={null}> — but which test pays
  // it varies run to run, so a per-test budget just moved the flakiness around.
  // 25s failed 3 of 4 on one run and passed 3 of 4 on the next. One honest
  // budget; CI's retries: 2 absorbs genuine regressions.
  const DIALOG_TIMEOUT = 60_000;

  test("the 3D heritage button opens the nomination, not a bare model", async ({ page }) => {
    await stubHiiSurvey(page);
    await page.goto("/");
    await expect(page.locator(".map-host")).toBeVisible({ timeout: 20_000 });

    await page.getByRole("button", { name: /heritage 3D demo/i }).click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible({ timeout: DIALOG_TIMEOUT });

    // The dialog must name the monument under nomination, in Thai.
    await expect(dialog.getByText(/พระบรมมาศเจดีย์/).first()).toBeVisible();

    // The nomination context — this is the part that was missing entirely.
    await expect(dialog.getByText(/มรดกโลก|ยูเนสโก/).first()).toBeVisible();
    await expect(dialog.getByText(/1\.45/).first()).toBeVisible();
  });

  test("the external link is well-formed — no 'none-' placeholder", async ({ page }) => {
    await stubHiiSurvey(page);
    await page.goto("/");
    await expect(page.locator(".map-host")).toBeVisible({ timeout: 20_000 });

    await page.getByRole("button", { name: /heritage 3D demo/i }).click();
    const dialog = page.getByRole("dialog");
    // The panel is lazy()-loaded behind <Suspense fallback={null}>, so the first
    // test in a cold run pays for the chunk fetch on top of the map boot.
    // 10s was not enough there; 25s matches the rest of this suite's waits.
    await expect(dialog).toBeVisible({ timeout: DIALOG_TIMEOUT });

    // Match the aria-label, not the visible text: the button reads
    // "Open the Wat Mahathat model by Phantasma Labs on Sketchfab in a new tab",
    // so a /Open on Sketchfab/ name filter finds nothing even though the link
    // is right there. The href is what this test is actually asserting.
    const link = dialog.getByRole("link", { name: /Phantasma Labs on Sketchfab/i });
    await expect(link).toHaveAttribute("href", /^https:\/\/sketchfab\.com\/3d-models\/[0-9a-f]{32}$/);
  });

  test("the credit names the real author and the real licence", async ({ page }) => {
    await stubHiiSurvey(page);
    await page.goto("/");
    await expect(page.locator(".map-host")).toBeVisible({ timeout: 20_000 });

    await page.getByRole("button", { name: /heritage 3D demo/i }).click();
    const dialog = page.getByRole("dialog");
    // The panel is lazy()-loaded behind <Suspense fallback={null}>, so the first
    // test in a cold run pays for the chunk fetch on top of the map boot.
    // 10s was not enough there; 25s matches the rest of this suite's waits.
    await expect(dialog).toBeVisible({ timeout: DIALOG_TIMEOUT });

    await expect(dialog.getByText("Phantasma Labs")).toBeVisible();
    await expect(dialog.getByText("CC BY 4.0")).toBeVisible();
    // The wrongly-attributed names must not reappear.
    await expect(dialog.getByText(/CyArk/)).toHaveCount(0);
    await expect(dialog.getByText(/Agisoft/)).toHaveCount(0);
  });

  test("it says the model is Ayutthaya, not the NST temple", async ({ page }) => {
    // The category error the old version made: Ayutthaya photogrammetry
    // presented as the NST nomination's evidence. A viewer must be told.
    await stubHiiSurvey(page);
    await page.goto("/");
    await expect(page.locator(".map-host")).toBeVisible({ timeout: 20_000 });

    await page.getByRole("button", { name: /heritage 3D demo/i }).click();
    const dialog = page.getByRole("dialog");
    // The panel is lazy()-loaded behind <Suspense fallback={null}>, so the first
    // test in a cold run pays for the chunk fetch on top of the map boot.
    // 10s was not enough there; 25s matches the rest of this suite's waits.
    await expect(dialog).toBeVisible({ timeout: DIALOG_TIMEOUT });

    await expect(dialog.getByText(/อยุธยา/).first()).toBeVisible();
  });
});
