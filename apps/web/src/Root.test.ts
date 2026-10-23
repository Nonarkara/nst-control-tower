/**
 * Root.tsx loading-state invariants.
 *
 * Every route here is a lazy() chunk. While one is arriving, Suspense paints
 * the fallback, and the fallback IS the entire screen — there is no header, no
 * nav, and no content behind it.
 *
 * What it used to be:
 *   /            <div style={{ position: "fixed", inset: 0, background: "var(--paper)" }} />
 *   /data        the same empty rectangle
 *   /flood-ops   a lone <p> — and no <LocaleProvider>, while useLocale() throws
 *                without one (hooks/useLocale.tsx).
 *
 * On production that meant a blank paper page — reproduced live on
 * nst.nonarkara.org while the ~3 MB App chunk loaded. It is not a cosmetic
 * nit: /api/water/gauges takes ~22 s cold, so the operator can sit in front
 * of an empty screen with no idea whether the site is broken.
 *
 * Implementation: read Root.tsx as text (same approach, and the same honesty,
 * as App.test.ts) and assert every <Suspense> paints a <RouteFallback>.
 */

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const rootSource = readFileSync(
  fileURLToPath(new URL("./Root.tsx", import.meta.url)),
  "utf8",
);

/**
 * The source of one route branch — from the route's own condition to the
 * end of the Suspense boundary it opens.
 *
 * Anchoring on the condition rather than the first mention of the path
 * matters: a comment that names a route would otherwise capture the slice,
 * and the branch under test would be a different one entirely. The
 * condition is the only place the path is followed by the regex tail
 * "(\/|$)/", so it is the only unambiguous anchor.
 */
function routeBranch(path: string): string {
  const at = rootSource.indexOf(`${path}(`);
  expect(at, `no route condition for ${path}`).toBeGreaterThan(-1);
  const start = rootSource.lastIndexOf("if (", at);
  const end = rootSource.indexOf("</Suspense>", at);
  expect(end, `no Suspense boundary for ${path}`).toBeGreaterThan(-1);
  return rootSource.slice(start, end);
}

describe("route loading states", () => {
  it("paints no empty full-bleed rectangle while a chunk loads", () => {
    // The defect, verbatim. If this string returns, the blank page is back.
    expect(rootSource).not.toMatch(/<div style=\{\{ position: "fixed"/);
  });

  it("gives every Suspense boundary a RouteFallback", () => {
    const suspenseCount = (rootSource.match(/<Suspense/g) || []).length;
    // Whitespace-tolerant: two of these fallbacks are multi-line JSX.
    const fallbackCount =
      (rootSource.match(/fallback=\{[\s\n]*<RouteFallback/g) || []).length;

    expect(suspenseCount).toBeGreaterThan(0);
    // A count, not a smoke test: one bare fallback re-added anywhere fails here.
    expect(fallbackCount).toBe(suspenseCount);
  });

  it("orients the reader during the load — place and what-is-arriving", () => {
    // Two different strings, so a fallback cannot collapse back to "…".
    const place = rootSource.match(/place="[^"]+"/g) || [];
    const what = rootSource.match(/what="[^"]+"/g) || [];

    expect(place.length).toBeGreaterThanOrEqual(2);
    expect(what.length).toBeGreaterThanOrEqual(2);
    // Every place must be paired with its own what.
    expect(place.length).toBe(what.length);
  });

  it("keeps an escape hatch on the deep link (/flood-ops)", () => {
    // A deep link whose chunk fails leaves the reader with no way home,
    // because the header that carries the nav is inside the chunk that failed.
    const branch = routeBranch("/flood-ops");

    expect(branch).toMatch(/backHref="\/"/);
    expect(branch).toMatch(/backLabel=/);
  });

  it("wraps /flood-ops in LocaleProvider — useLocale() throws without one", () => {
    const branch = routeBranch("/flood-ops");

    expect(branch).toMatch(/<LocaleProvider>/);
    // And it must open before FloodWatchPage, not after it.
    expect(branch.indexOf("<LocaleProvider>")).toBeLessThan(
      branch.indexOf("<FloodWatchPage"),
    );
  });

  it("wraps /mayor-desk the same way — it is a lazy route like any other", () => {
    const branch = routeBranch("/mayor-desk");

    expect(branch).toMatch(/<LocaleProvider>/);
    expect(branch).toMatch(/<MayorDesk/);
    expect(branch.indexOf("<LocaleProvider>")).toBeLessThan(
      branch.indexOf("<MayorDesk"),
    );
    // And it must paint a fallback, so a deep link is never a blank screen.
    expect(branch).toMatch(/<RouteFallback/);
    expect(branch).toMatch(/backHref="\/"/);
  });
});