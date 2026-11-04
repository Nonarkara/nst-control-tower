import { describe, test, expect } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { renderToString } from "react-dom/server";
import ResearchPage, { PAPER, FINDINGS, CITATION_APA, CITATION_BIBTEX } from "./ResearchPage";

const paperHtml = readFileSync(new URL("../../../../paper/paper.html", import.meta.url), "utf8");

describe("/research", () => {
  test("Poon is first author, Non second — on the page, in the citation and in the paper", () => {
    expect(PAPER.authors.map((a) => a.name)).toEqual(["Poon Thiengburanathum", "Non Arkaraprasertkul"]);
    expect(CITATION_APA.startsWith("Thiengburanathum, P., & Arkaraprasertkul, N.")).toBe(true);
    expect(CITATION_BIBTEX).toContain("author = {Thiengburanathum, Poon and Arkaraprasertkul, Non}");
    expect(paperHtml.indexOf("Poon Thiengburanathum")).toBeLessThan(paperHtml.indexOf("Non Arkaraprasertkul"));
  });

  test("the downloadable PDF ships with the site", () => {
    expect(existsSync(new URL(`../../public${PAPER.pdf}`, import.meta.url))).toBe(true);
  });

  test("published evidence keeps distinct denominators, partial retrieval and timing limits", () => {
    const evidence = JSON.parse(readFileSync(new URL("../../public/research/evidence-v1.json", import.meta.url), "utf8"));
    expect(Object.values(evidence.catalog.retrieval).reduce((a: number, b) => a + Number(b), 0)).toBe(evidence.catalog.resources);
    expect(evidence.catalog.retrieval.ok).toBe(485);
    expect(new Set(evidence.catalog.hazardSelection.map((d: {id: string}) => d.id)).size).toBe(32);
    expect(evidence.catalog.hazardSelection.some((d: {id: string}) => d.id === "dataset_ag_14")).toBe(false);
    expect(evidence.registry.recordCount).toBe(10414);
    expect(evidence.registry.healthRecords).toBe(10412);
    expect(evidence.registry.stalePercent).toBeCloseTo(21.4, 1);
    expect(Math.round(evidence.province.waterRecent2h / evidence.province.waterRecords * 100)).toBe(41);
    expect(evidence.auditChecks.intervalMinutes).toBe(145);
    expect(FINDINGS[3].text).toContain("not a measured alert-issuance or notification delay");
    expect(paperHtml).toContain("Failed and skipped resources remain unclassified");
  });

  test("renders the title, both authors, a download link and the embedded viewer", () => {
    const html = renderToString(<ResearchPage />);
    expect(html).toContain("The Last Mile Is Institutional");
    expect(html).toContain("Poon Thiengburanathum");
    expect(html).toContain(`href="${PAPER.pdf}"`);
    expect(html).toContain("download");
    expect(html).toContain("<iframe");
  });
});
