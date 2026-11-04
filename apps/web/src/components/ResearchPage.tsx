/**
 * /research — the preprint about this system, readable in place and downloadable.
 *
 * The reader's task is one of three: read the paper, take the PDF away, or cite
 * it. The accessible HTML reader is the dominant element; the left column
 * carries only what someone needs before deciding to read — what it found and
 * how to cite it. Phones get no embedded viewer: mobile browsers render a PDF
 * in a frame as a single page or a blank box, so they get "Open" instead.
 */
import { useEffect, useState } from "react";
import "../styles/research.css";
import paperHtml from "../../../../paper/paper.html?raw";

export const PAPER = {
  pdf: "/research/nst-last-mile-preprint-v1.pdf",
  html: "/research/nst-last-mile-preprint-v1.html",
  title: "The Last Mile Is Institutional: Why Thailand’s Smart Cities Stall Between Monitoring and Action, and What One City Built to Cross It",
  subtitle: "Evidence from a flood and haze control tower in Nakhon Si Thammarat",
  status: "Preprint · not peer reviewed · version 1 · 4 November 2026",
  authors: [
    { name: "Poon Thiengburanathum", th: "ปุ่น เที่ยงบูรณธรรม", affil: "Faculty of Engineering, Chiang Mai University · Research and Innovation Acceleration Agency for Competitiveness and Area Development (RCAD)" },
    { name: "Non Arkaraprasertkul", th: "นน อัครประเสริฐกุล", affil: "Digital Economy Promotion Agency (depa) · corresponding author" },
  ],
  pages: 8,
} as const;

/** Each finding is a number the paper measured, with the sentence that gives it meaning. */
export const FINDINGS = [
  { value: "7", unit: "agency codes", text: "appear in one aggregated provincial rain snapshot. Different operators alone do not prove an absence of data sharing." },
  { value: "32", unit: "selected entries", text: "match the stated hazard title rule. Only 63 of their 242 resources downloaded; failed or skipped resources cannot establish an absence of live services." },
  { value: "41%", unit: "21 of 51 water records", text: "had observations within two hours at the 4 November snapshot. Separately, 2,230 of 10,412 FloodDash health-audit records were stale (21.4%)." },
  { value: "145 min", unit: "between audit checks", text: "separate a threshold/status mismatch and a recorded watch status on 26 October. This is not a measured alert-issuance or notification delay." },
] as const;

export const CITATION_APA =
  "Thiengburanathum, P., & Arkaraprasertkul, N. (2026). The last mile is institutional: Why Thailand’s smart cities stall between monitoring and action, and what one city built to cross it [Preprint]. Nakhon Si Thammarat Control Tower Research Series, No. 1. https://nst.nonarkara.org/research";

export const CITATION_BIBTEX = `@misc{thiengburanathum2026lastmile,
  title  = {The Last Mile Is Institutional: Why Thailand's Smart Cities Stall Between Monitoring and Action, and What One City Built to Cross It},
  author = {Thiengburanathum, Poon and Arkaraprasertkul, Non},
  year   = {2026},
  month  = nov,
  note   = {Preprint, not peer reviewed. Nakhon Si Thammarat Control Tower Research Series, No. 1},
  url    = {https://nst.nonarkara.org/research}
}`;

export default function ResearchPage() {
  const [copied, setCopied] = useState<"" | "apa" | "bibtex" | "error">("");

  useEffect(() => {
    document.title = "Research · The last mile is institutional | NST";
  }, []);

  const copy = async (kind: "apa" | "bibtex") => {
    try {
      await navigator.clipboard.writeText(kind === "apa" ? CITATION_APA : CITATION_BIBTEX);
      setCopied(kind);
    } catch {
      setCopied("error");
    }
  };

  return (
    <main className="research" lang="en">
      <header className="research-head">
        <a href="/" className="research-head__back" aria-label="Back to the city map">← City map</a>
        <span className="research-head__place">Research · <span lang="th">งานวิจัย</span></span>
      </header>

      <div className="research-body">
        <article className="research-paper" aria-labelledby="paper-title">
          <p className="research-status">{PAPER.status}</p>
          <h1 id="paper-title" className="research-title">The Last Mile Is Institutional</h1>
          <p className="research-subtitle">{PAPER.subtitle}</p>
          <ul className="research-authors">
            {PAPER.authors.map((a) => (
              <li key={a.name}>
                <b>{a.name}</b> <span lang="th">({a.th})</span>
                <span className="research-affil">{a.affil}</span>
              </li>
            ))}
          </ul>

          <div className="research-actions">
            <a className="btn btn--primary" href={PAPER.pdf} download>Download PDF · {PAPER.pages} pages</a>
            <a className="btn" href={PAPER.html} target="_blank" rel="noopener">Read HTML ↗</a>
            <a className="btn" href={PAPER.pdf} target="_blank" rel="noopener">Open PDF ↗</a>
          </div>

          <section aria-labelledby="findings-title">
            <h2 id="findings-title" className="research-h2">What it measured</h2>
            <dl className="research-findings">
              {FINDINGS.map((f) => (
                <div key={f.text}>
                  <dt><span className="num">{f.value}</span>{f.unit && <span className="research-findings__unit"> {f.unit}</span>}</dt>
                  <dd>{f.text}</dd>
                </div>
              ))}
            </dl>
          </section>

          <p className="research-prose">These are dated research observations, not the current flood situation. <a href="/mayor-desk">Open the current mayor’s desk →</a></p>

          <section aria-labelledby="question-title">
            <h2 id="question-title" className="research-h2">The question</h2>
            <p className="research-prose">
              Is the failure of smart city promotion and digital government in Thailand a failure of inter-agency coordination,
              of technological procurement, of data-driven responsiveness and of the end-to-end chain from monitoring to push —
              rain to drainage, haze to shelter — and can a working system that bypasses those failures be built and used now?
            </p>
          </section>

          <section aria-labelledby="cite-title">
            <h2 id="cite-title" className="research-h2">How to cite</h2>
            <p className="research-prose research-cite">{CITATION_APA}</p>
            <p className="research-prose"><a href="/research/evidence-v1.json" target="_blank" rel="noopener">Evidence summary and source hashes ↗</a></p>
            <div className="research-actions">
              <button type="button" className="btn" onClick={() => void copy("apa")}>Copy citation</button>
              <button type="button" className="btn" onClick={() => void copy("bibtex")}>Copy BibTeX</button>
              <span className="research-copied" role="status">
                {copied === "apa" ? "Citation copied." : copied === "bibtex" ? "BibTeX copied." : copied === "error" ? "Could not copy — select the text instead." : ""}
              </span>
            </div>
          </section>
        </article>

        <section className="research-viewer" aria-label="Paper (accessible HTML)">
          {/* Static, script-free reading pane: production keeps X-Frame-Options DENY.
              A network iframe would be blocked; sandboxed srcDoc needs no framing exception. */}
          <iframe title="The last mile is institutional — accessible preprint" srcDoc={paperHtml} sandbox="" />
        </section>
      </div>
    </main>
  );
}
