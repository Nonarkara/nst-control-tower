import { test, expect } from "@playwright/test";

/**
 * Smoke tests — these are the contracts that, if broken, mean a council
 * briefing fails. Each test is independent and runs against a fresh page.
 *
 * Philosophy: assert structure + behaviour, never assert specific live data
 * values (those depend on upstream APIs / env keys we don't control here).
 *
 * Selector strategy: prefer aria-label exact matches and text content. The
 * dashboard is map-heavy so we give it generous timeouts.
 */

// 90s per test — map + lazy chunks + Vite dev server compile time add up.
// Individual tests pass in ~12–40s; the 60s default flakes once Vite cache warms.
test.setTimeout(90_000);

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
async function ensureSectionOpen(
  page: import("@playwright/test").Page,
  sectionTitle: string,
) {
  const header = page.locator(".sidebar-section__hdr", {
    hasText: new RegExp(sectionTitle, "i"),
  });
  await expect(header).toBeVisible({ timeout: 10_000 });
  const expanded = await header.getAttribute("aria-expanded");
  if (expanded === "false") {
    await header.click();
    await expect(header).toHaveAttribute("aria-expanded", "true", { timeout: 5_000 });
  }
}

test.describe("Dashboard boot", () => {
  test("loads with map host and top bar", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator(".map-host")).toBeVisible({ timeout: 20_000 });
    // Top bar contains the SOURCES button — that's the proof the React tree mounted.
    await expect(page.getByRole("button", { name: "Open source catalog" })).toBeVisible();
  });

  test("does not throw uncaught page errors during initial load", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto("/");
    await expect(page.locator(".map-host")).toBeVisible({ timeout: 20_000 });
    // Give async chunks + map a beat to finish
    await page.waitForTimeout(2_000);
    expect(errors, errors.join("\n")).toEqual([]);
  });
});

test.describe("Lens switching", () => {
  test("INT and FLOOD lens buttons toggle aria-pressed", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator(".map-host")).toBeVisible({ timeout: 20_000 });

    // Lens buttons have label as text content (EXEC / OPS / MOB / FLOOD / etc.) and
    // their aria-label is the long description. Match by exact text inside .lens container.
    const lensPalette = page.locator(".lens");
    const intButton = lensPalette.locator("button", { hasText: /^INT$/ });
    const floodButton = lensPalette.locator("button", { hasText: /^FLOOD$/ });

    await intButton.click();
    await expect(intButton).toHaveAttribute("aria-pressed", "true");

    await floodButton.click();
    await expect(floodButton).toHaveAttribute("aria-pressed", "true");
    await expect(intButton).toHaveAttribute("aria-pressed", "false");
  });
});

test.describe("Source catalog modal", () => {
  test("opens on SOURCES click and closes via ESC", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator(".map-host")).toBeVisible({ timeout: 20_000 });

    const sourcesBtn = page.getByRole("button", { name: "Open source catalog" });
    await sourcesBtn.focus();
    await sourcesBtn.click();

    const dialog = page.getByRole("dialog", { name: /Source catalog/i });
    // SourceCatalog is lazy-loaded — give the chunk time to arrive on first open.
    await expect(dialog).toBeVisible({ timeout: 15_000 });
    // Catalog row count summary is always rendered (even if /api/health hasn't returned)
    await expect(dialog.getByText(/SOURCE CATALOG/i)).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden({ timeout: 5_000 });
  });
});

test.describe("Layer palette — count badge suppression", () => {
  test("Distance grid layer toggle does NOT show a numeric count badge", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator(".map-host")).toBeVisible({ timeout: 20_000 });

    // Layer toggles have role="checkbox". Distance grid lives in the "municipality"
    // group, which is open by default. Expand it explicitly in case a prior preset collapsed it.
    const muniHead = page.getByRole("button", { name: /Municipality layers/i });
    if (await muniHead.getAttribute("aria-expanded") === "false") await muniHead.click();

    const dgRow = page.getByRole("checkbox").filter({ hasText: /Distance grid/i }).first();
    await expect(dgRow).toBeVisible({ timeout: 10_000 });

    // The row must NOT contain the .layer-count element — that's the contract we just shipped.
    const badgeCount = await dgRow.locator(".layer-count").count();
    expect(badgeCount).toBe(0);
  });
});

test.describe("FLOOD lens — panel headers", () => {
  test("WaterPanel and UpstreamWatershed render their PanelHeader eyebrows", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator(".map-host")).toBeVisible({ timeout: 20_000 });

    // Rail defaults these sections to collapsed — open them so the panel
    // eyebrows (WATER MONITORING, WATERSHED) are reachable.
    await ensureSectionOpen(page, "Water & Reservoirs");
    await ensureSectionOpen(page, "Upstream Watershed");

    // WaterPanel and UpstreamWatershed are always rendered in the sidebar
    // (not gated by a specific lens). PanelHeader renders its title immediately,
    // even during loading state — so no API data is required.
    await expect(page.getByText(/WATER MONITORING/i).first()).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(/WATERSHED/i).first()).toBeVisible({ timeout: 10_000 });
    await expect(page.getByLabel("Water to the city")).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(/WATER TO THE CITY/i).first()).toBeVisible();
    await expect(page.getByText(/high → low/i).first()).toBeVisible();
  });
});

test.describe("EAR lens — Earth obs panel header", () => {
  test("EarthAlphaBrief PanelHeader eyebrow is visible in the sidebar", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator(".map-host")).toBeVisible({ timeout: 20_000 });

    // EarthAlphaBrief is always rendered in the sidebar (not lens-gated).
    // PanelHeader renders "EARTH OBS · NASA GIBS + GISTDA" immediately on mount.
    await expect(page.getByText(/EARTH OBS/i).first()).toBeVisible({ timeout: 15_000 });
    // SHEETS status badge is rendered as the actions prop — always visible
    await expect(page.getByText(/SHEETS/i).first()).toBeVisible({ timeout: 5_000 });
  });
});

test.describe("EXEC lens — executive briefing header", () => {
  test("ExecutiveBriefing PanelHeader eyebrow is visible in EXEC lens", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator(".map-host")).toBeVisible({ timeout: 20_000 });

    // ExecutiveBriefing IS gated by lens === "executive". Use hasText (not getByRole name)
    // because lens buttons have aria-label set to the full description, not just the label.
    const execButton = page.locator(".lens").locator("button", { hasText: /^EXEC$/ });
    await execButton.click();
    await expect(execButton).toHaveAttribute("aria-pressed", "true");

    // ExecutiveBriefing renders "EXECUTIVE BRIEF" as its PanelHeader title
    await expect(page.getByText(/EXECUTIVE BRIEF/i).first()).toBeVisible({ timeout: 15_000 });
  });
});

test.describe("Source catalog — filter buttons", () => {
  test("LIVE filter narrows the catalog to live-status entries only", async ({ page }) => {
    // The SourceCatalog is lazy-loaded — give it more time than the default 60s.
    test.setTimeout(90_000);

    await page.goto("/");
    await expect(page.locator(".map-host")).toBeVisible({ timeout: 20_000 });

    // Open the catalog — focus before click so the lazy-loaded chunk has time to start
    const sourcesBtn = page.getByRole("button", { name: "Open source catalog" });
    await sourcesBtn.focus();
    await sourcesBtn.click();
    const dialog = page.getByRole("dialog", { name: /Source catalog/i });
    await expect(dialog).toBeVisible({ timeout: 10_000 });

    // Click the LIVE filter — the button's accessible name IS "LIVE" (text content)
    const liveFilter = dialog.locator("button", { hasText: /^LIVE$/ });
    await liveFilter.click();
    await expect(liveFilter).toHaveAttribute("aria-pressed", "true");

    // Verify filtered view: at least one live entry is visible and the first pill reads LIVE.
    // We don't iterate all pills (race-prone with React re-render timing).
    const statusPills = dialog.locator(".catalog-status");
    await expect(statusPills.first()).toBeVisible({ timeout: 5_000 });
    await expect(statusPills.first()).toHaveText("LIVE");
  });
});

test.describe("ChatBox — open / close", () => {
  test("Ask CTM button opens chat panel; ESC closes it", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator(".map-host")).toBeVisible({ timeout: 20_000 });

    // Chat handle must be visible before opening
    const handle = page.getByRole("button", { name: /Open concierge chat/i });
    await expect(handle).toBeVisible({ timeout: 10_000 });
    await handle.click();

    // Dialog opens — aria-label set in ChatBox
    const chat = page.getByRole("dialog", { name: /Concierge chat/i });
    await expect(chat).toBeVisible({ timeout: 5_000 });

    // Input field and clear button must be present
    await expect(chat.getByRole("textbox")).toBeVisible();

    // ESC closes the panel
    await page.keyboard.press("Escape");
    await expect(chat).toBeHidden({ timeout: 5_000 });
  });
});

test.describe("PART MODELLED chip on municipality ops panel", () => {
  test("PmcuBrief renders its PART MODELLED chip with accessible label", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator(".map-host")).toBeVisible({ timeout: 20_000 });

    const chip = page.getByLabel(/Partly modelled data/i);
    await expect(chip).toBeVisible({ timeout: 15_000 });
    await expect(chip).toHaveText(/PART MODELLED/);
  });
});

test.describe("FLOOD COMMAND — God Mode scenario", () => {
  test("panel renders and the PABUK preset produces an impact readout", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator(".map-host")).toBeVisible({ timeout: 20_000 });

    // Rail defaults the flood-command section to collapsed — open it so
    // the PABUK preset buttons and the impact readout are reachable.
    await ensureSectionOpen(page, "Flood Command");

    // Panel header confirms mount (left rail, always visible inside the body)
    await expect(page.getByText(/FLOOD COMMAND \/\/ GOD MODE/i)).toBeVisible({ timeout: 15_000 });

    // No impact readout while the scenario is off
    await expect(page.locator(".fc-impact")).toHaveCount(0);

    // Click the Pabuk preset — impact arithmetic appears once road levels load
    await page.getByRole("button", { name: /PABUK 2019/ }).click();
    const impact = page.locator(".fc-impact");
    await expect(impact).toBeVisible({ timeout: 15_000 });
    await expect(impact).toContainText(/% of surveyed streets under water/);
    await expect(impact).toContainText(/historical marks/);

    // OFF turns the readout back off
    await page.getByRole("button", { name: /^OFF$/ }).click();
    await expect(page.locator(".fc-impact")).toHaveCount(0);
  });
});

test.describe("EO layer toggles", () => {
  test("clicking a satellite layer toggle flips its aria-pressed state", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator(".map-host")).toBeVisible({ timeout: 20_000 });

    // EarthAlphaBrief is always in the sidebar — wait for its PanelHeader to confirm mount
    await expect(page.getByText(/EARTH OBS/i).first()).toBeVisible({ timeout: 15_000 });

    // Rail defaults the Earth Observation section to collapsed — open it
    // so the layer toggles inside the body are reachable.
    await ensureSectionOpen(page, "Earth Observation");

    // The Rain toggle (satellite-imerg) renders with text "Rain" and a "on"/"off" caption.
    // Its accessible name comes from text content, not aria-label or title.
    const rainToggle = page.locator(".layer-toggle", { hasText: /^Rain/ }).first();
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
test.describe("Language toggle (EN/TH)", () => {
  test("switching to Thai localizes the FLOOD COMMAND panel and back", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator(".map-host")).toBeVisible({ timeout: 20_000 });

    // Rail defaults the flood-command section to collapsed — open it so
    // the localized panel title inside the body is reachable.
    await ensureSectionOpen(page, "Flood Command");

    // Default locale is English — the FLOOD COMMAND header reads in English.
    await expect(page.getByText(/FLOOD COMMAND \/\/ GOD MODE/i)).toBeVisible({ timeout: 15_000 });

    // Click the language toggle (offers "TH" while in EN mode).
    const toThai = page.getByRole("button", { name: /Switch to Thai interface/i });
    await expect(toThai).toBeVisible({ timeout: 10_000 });
    await toThai.click();

    // Panel title flips to Thai — this is the panel that was explicitly
    // deferred as "not yet Thai-localized" in the flood-hardening commit.
    await expect(page.getByText("ศูนย์บัญชาการน้ำท่วม")).toBeVisible({ timeout: 10_000 });

    // Flip back to English.
    const toEnglish = page.getByRole("button", { name: /Switch to English interface/i });
    await toEnglish.click();
    await expect(page.getByText(/FLOOD COMMAND \/\/ GOD MODE/i)).toBeVisible({ timeout: 10_000 });
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

test.describe("SENSOR SITUATION — FloodDash + AirDash board", () => {
  test("situation board renders with Dr.Non attribution", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator(".map-host")).toBeVisible({ timeout: 20_000 });

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

    // Clicking a collapsed heading expands it
    await floodAnalysis.click();
    await expect(floodAnalysis).toHaveAttribute("aria-expanded", "true");
  });
});
