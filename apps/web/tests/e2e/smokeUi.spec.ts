import { test, expect } from "@playwright/test";
import { ensureSectionOpen, selectLens } from "./floodSmokeHelpers";

test.setTimeout(90_000);

test.describe("PART MODELLED chip on municipality ops panel", () => {
  test("PmcuBrief renders its PART MODELLED chip with accessible label", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator(".map-host")).toBeVisible({ timeout: 20_000 });

    const chip = page.getByLabel(/Partly modelled data/i);
    await expect(chip).toBeVisible({ timeout: 15_000 });
    await expect(chip).toHaveText(/PART MODELLED/);
  });
});

test.describe("EO layer toggles", () => {
  test("clicking a satellite layer toggle flips its aria-pressed state", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator(".map-host")).toBeVisible({ timeout: 20_000 });

    // Rail sections are lens-driven (lib/railSections.ts) — open the lens that owns this panel.
    await selectLens(page, "EAR");

    // EarthAlphaBrief lives in the EAR lens rail — wait for its PanelHeader to confirm mount
    await expect(page.getByText(/EARTH OBS/i).first()).toBeVisible({ timeout: 15_000 });

    // Rail defaults the Earth Observation section to collapsed — open it
    // so the layer toggles inside the body are reachable.
    await ensureSectionOpen(page, "Earth Observation");

    // The Rain toggle (satellite-imerg) renders with text "Rain" and a "on"/"off" caption.
    // Its accessible name comes from text content, not aria-label or title. EAR's
    // Imagery group now also carries a "Rain radar (live nowcast)" toggle
    // (precip-radar) — exclude it so the plain-/^Rain/ match stays pinned to
    // this one, not whichever happens to sit first in DOM order.
    const rainToggle = page.locator(".layer-toggle", { hasText: /^Rain(?!\s*radar)/ }).first();
    await expect(rainToggle).toBeVisible({ timeout: 10_000 });

    const initialState = await rainToggle.getAttribute("aria-pressed");
    await rainToggle.click();
    const newState = await rainToggle.getAttribute("aria-pressed");

    // State must have flipped
    expect(newState).not.toBe(initialState);
  });
});

test.describe("Responsive layout", () => {
  test("collapses to a single-column mobile shell at phone width", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 }); // iPhone 12/13/14
    await page.goto("/");

    const shell = page.locator(".shell");
    await expect(shell).toBeVisible({ timeout: 20_000 });
    // Below the 900px breakpoint the shell gets the .mobile modifier (single column).
    await expect(shell).toHaveClass(/mobile/, { timeout: 10_000 });
    // Map must still be present and dominant on mobile.
    await expect(page.locator(".map-host")).toBeVisible({ timeout: 20_000 });
  });

  test("holds a three-column shell with a dominant map at ultra-wide width", async ({ page }) => {
    await page.setViewportSize({ width: 2880, height: 1620 }); // ~100" wall / 4K-ish
    await page.goto("/");

    const shell = page.locator(".shell");
    await expect(shell).toBeVisible({ timeout: 20_000 });
    await expect(shell).not.toHaveClass(/mobile/);
    await expect(page.locator(".map-host")).toBeVisible({ timeout: 20_000 });

    // The map column must dominate: wider than either rail.
    const map = page.locator(".map-area, .map-host").first();
    const mapBox = await map.boundingBox();
    expect(mapBox).not.toBeNull();
    // On a 2880px-wide display the map area should be well over half the width.
    expect(mapBox!.width).toBeGreaterThan(1400);
  });
});

test.describe("TopBar — theme toggle", () => {
  test("dark/light theme toggle changes aria-label and body class", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator(".map-host")).toBeVisible({ timeout: 20_000 });

    const themeBtn = page.getByRole("button", { name: /Switch to (light|dark) theme/i });
    await expect(themeBtn).toBeVisible({ timeout: 5_000 });

    // Theme is stored as data-theme on <html> ("dark" or "light")
    const html = page.locator("html");
    const initialTheme = await html.getAttribute("data-theme");
    expect(["dark", "light"]).toContain(initialTheme);

    // Click the toggle
    await themeBtn.click();

    // data-theme must have flipped
    const newTheme = await html.getAttribute("data-theme");
    expect(newTheme).not.toBe(initialTheme);
    expect(["dark", "light"]).toContain(newTheme);

    // Button label must now reference the other theme
    const newLabel = await themeBtn.getAttribute("aria-label");
    expect(newLabel).toContain(initialTheme!); // e.g. "Switch to dark theme" → initial was light
  });
});

test.describe("Map camera — programmatic flights", () => {
  // Guards the uncontrolled-camera refactor: after switching DeckGL to
  // initialViewState, a REPEATED command (same-shape object) was silently
  // dropped by deck's deepEqual, so the +/− zoom buttons became single-shot.
  // The fix stamps a monotonic nonce + syncs the live-camera mirror; this test
  // fails loudly if either regresses. Reads the dev-only __mapCam probe.
  test("repeated zoom-in clicks each advance the zoom (not single-shot)", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator(".map-host")).toBeVisible({ timeout: 20_000 });

    const zoomIn = page.getByRole("button", { name: /^Zoom in$/ });
    await expect(zoomIn).toBeVisible({ timeout: 10_000 });

    // First click seeds the probe with the commanded zoom.
    await zoomIn.click();
    const z1 = await page.evaluate(() => (window as unknown as { __mapCam?: { zoom: number } }).__mapCam?.zoom);
    expect(z1).toBeGreaterThan(0);

    // Two more clicks must each advance the commanded zoom — the exact behavior
    // the regression broke (clicks 2+ were deep-equal no-ops).
    await zoomIn.click();
    const z2 = await page.evaluate(() => (window as unknown as { __mapCam?: { zoom: number } }).__mapCam?.zoom);
    expect(z2).toBeGreaterThan(z1!);

    await zoomIn.click();
    const z3 = await page.evaluate(() => (window as unknown as { __mapCam?: { zoom: number } }).__mapCam?.zoom);
    expect(z3).toBeGreaterThan(z2!);
  });
});

test.describe("WATER BALANCE — basin ledger + Flood Ops board", () => {
  test("panel renders basin rows and OPS BOARD opens the full-screen board", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator(".map-host")).toBeVisible({ timeout: 20_000 });

    // Rail sections are lens-driven (lib/railSections.ts) — open the lens that owns this panel.
    await selectLens(page, "FLOOD");

    // Rail panel mounts with its PanelHeader eyebrow
    await expect(page.getByText(/^WATER BALANCE$/)).toBeVisible({ timeout: 15_000 });

    // The basin ledger depends on HII ThaiWater / RID / WRF feeds which can
    // be slow on a cold CI cache. The panel falls back to "LOADING LEDGER…"
    // until the first basins payload lands; wait for one of the two states
    // — either a basin row (happy path) or the loading line (slow upstream).
    // The contract we're testing is the panel's interaction, not the API SLA.
    const firstRow = page.locator(".wb-row").first();
    const loading = page.getByText(/LOADING LEDGER/i);
    await expect(firstRow.or(loading)).toBeVisible({ timeout: 45_000 });

    // If the upstream feeds never landed in CI, skip the rest — the contract
    // is already proven (panel mounted, fallback path is honest).
    test.skip((await firstRow.count()) === 0, "ledger feed did not land in time");

    // OPS BOARD button opens the full-screen overlay
    await page.getByRole("button", { name: /OPS BOARD/ }).click();
    const board = page.getByRole("dialog", { name: /Flood operations board/i });
    await expect(board).toBeVisible({ timeout: 15_000 });
    await expect(board.getByText(/FLOOD OPS/)).toBeVisible();
    // Basin cards render inside the board
    await expect(board.locator(".ops-card").first()).toBeVisible({ timeout: 15_000 });

    // ESC closes it
    await page.keyboard.press("Escape");
    await expect(board).toHaveCount(0);
  });
});

test.describe("CCTV directory", () => {
  test("filters by purpose with pressed-state chips and switches list/wall views", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator(".map-host")).toBeVisible({ timeout: 20_000 });

    // right-cctv no longer opens by default in the operations lens (it now
    // only auto-opens in mobility/safety/flood — see lib/railSections.ts;
    // full-city CCTV browsing moved to CCTV mode). Open it explicitly.
    await ensureSectionOpen(page, "CCTV");
    const directory = page.getByRole("region", { name: "CCTV cameras" });
    await expect(directory).toBeVisible({ timeout: 15_000 });

    const purpose = directory.getByRole("group", { name: "Camera purpose" });
    const all = purpose.getByRole("button", { name: /^All/ });
    await expect(all).toHaveAttribute("aria-pressed", "true");

    const view = directory.getByRole("group", { name: "View" });
    const wall = view.getByRole("button", { name: "Wall" });
    await wall.click();
    await expect(wall).toHaveAttribute("aria-pressed", "true");
    await view.getByRole("button", { name: "List" }).click();
  });
});

test.describe("TopBar — More menu", () => {
  test("opens with aria-expanded and closes on Escape, returning focus", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator(".map-host")).toBeVisible({ timeout: 20_000 });

    const more = page.getByRole("button", { name: /^More/ });
    await more.click();
    await expect(more).toHaveAttribute("aria-expanded", "true");
    await expect(page.getByRole("button", { name: "Keyboard shortcuts" })).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(more).toHaveAttribute("aria-expanded", "false");
    await expect(more).toBeFocused();
  });
});
