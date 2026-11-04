// Render paper/paper.html to the downloadable preprint PDF.
//   node paper/build.mjs            (run from the repo root)
// Uses the Playwright copy already installed for the web app's browser tests.
import { createRequire } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, resolve } from "node:path";
import { mkdirSync, copyFileSync } from "node:fs";

const here = dirname(fileURLToPath(import.meta.url));
const require = createRequire(resolve(here, "../apps/web/package.json"));
const { chromium } = require("@playwright/test");

const src = pathToFileURL(resolve(here, "paper.html")).href;
const outDir = resolve(here, "../apps/web/public/research");
const out = resolve(outDir, "nst-last-mile-preprint-v1.pdf");
mkdirSync(outDir, { recursive: true });

const footer = `
  <div style="width:100%;font-family:'Helvetica Neue',Arial,sans-serif;font-size:7px;color:#6b6b6b;padding:0 15mm;display:flex;justify-content:space-between">
    <span>Thiengburanathum &amp; Arkaraprasertkul · The last mile is institutional · preprint v1, 4 Nov 2026</span>
    <span><span class="pageNumber"></span> / <span class="totalPages"></span></span>
  </div>`;

const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto(src, { waitUntil: "load" });
await page.emulateMedia({ media: "print" });
await page.pdf({
  path: out,
  format: "A4",
  printBackground: true,
  preferCSSPageSize: true,
  displayHeaderFooter: true,
  headerTemplate: "<span></span>",
  footerTemplate: footer,
});
await browser.close();
copyFileSync(resolve(here, "paper.html"), resolve(outDir, "nst-last-mile-preprint-v1.html"));
console.log(out);
