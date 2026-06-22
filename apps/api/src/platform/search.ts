import type { SearchResult, SearchResponse, SearchDocType } from "@nst/shared";
import { ATLAS_MODULES, ATLAS_SOURCES } from "../data/index.js";
import { ALL_LESSONS, GLOSSARY, DATA_DICTIONARY } from "./content.js";

/**
 * Unified keyword search across the whole knowledge corpus — atlas indicators,
 * the 215-source catalog, academy lessons, the glossary, and the data
 * dictionary. Pure TS scoring (no deps, Worker-safe); the Node daemon can layer
 * SQLite FTS5 on top for fuzzier matching.
 */

interface Doc {
  id: string;
  type: SearchDocType;
  title: string;
  /** Searchable haystack (lowercased on build). */
  text: string;
  snippet: string;
  domain?: string;
  deepLink?: SearchResult["deepLink"];
}

let CORPUS: Doc[] | null = null;

function buildCorpus(): Doc[] {
  const docs: Doc[] = [];

  for (const mod of ATLAS_MODULES) {
    for (const ind of mod.indicators) {
      docs.push({
        id: `indicator:${mod.id}:${ind.id}`,
        type: "indicator",
        title: `${ind.label}: ${ind.value}${ind.unit ? " " + ind.unit : ""}`,
        text: `${ind.label} ${ind.value} ${ind.unit ?? ""} ${ind.source} ${ind.note ?? ""} ${mod.title}`,
        snippet: `${mod.title} · ${ind.source}${ind.year ? " " + ind.year : ""}${ind.note ? " · " + ind.note : ""}`,
        domain: mod.title,
        deepLink: { kind: "atlasModule", id: mod.id },
      });
    }
  }

  for (const s of ATLAS_SOURCES) {
    docs.push({
      id: `source:${s.id}`,
      type: "source",
      title: s.name,
      text: `${s.name} ${s.domain} ${s.auth} ${s.format} ${s.note ?? ""} ${s.url ?? ""}`,
      snippet: `${s.domain} · ${s.format} · ${s.status}${s.note ? " · " + s.note : ""}`,
      domain: s.domain,
      deepLink: s.url ? { kind: "url", id: s.url } : { kind: "source", id: s.id },
    });
  }

  for (const l of ALL_LESSONS) {
    docs.push({
      id: `lesson:${l.id}`,
      type: "lesson",
      title: l.title,
      text: `${l.title} ${l.titleTh ?? ""} ${l.summary} ${l.keyFacts.join(" ")} ${l.body}`,
      snippet: l.summary,
      domain: l.track,
      deepLink: { kind: "lesson", id: l.id },
    });
  }

  for (const g of GLOSSARY) {
    docs.push({
      id: `glossary:${g.term}`,
      type: "glossary",
      title: g.term,
      text: `${g.term} ${g.termTh ?? ""} ${g.termYawi ?? ""} ${g.definition} ${g.domain}`,
      snippet: g.definition,
      domain: g.domain,
    });
  }

  for (const d of DATA_DICTIONARY) {
    docs.push({
      id: `dict:${d.indicatorId}`,
      type: "indicator",
      title: `${d.label} — definition`,
      text: `${d.label} ${d.whatItMeans} ${d.howMeasured} ${d.source} ${d.caveats ?? ""}`,
      snippet: d.whatItMeans,
      domain: d.module,
      deepLink: { kind: "atlasModule", id: d.module },
    });
  }

  // pre-lowercase haystacks once
  for (const d of docs) d.text = d.text.toLowerCase();
  return docs;
}

const TITLE_BOOST = 6;
const EXACT_PHRASE_BOOST = 8;

function scoreDoc(doc: Doc, terms: string[], phrase: string): number {
  let score = 0;
  const title = doc.title.toLowerCase();
  for (const t of terms) {
    if (!t) continue;
    if (title.includes(t)) score += TITLE_BOOST;
    // count occurrences in text (capped)
    let idx = 0, hits = 0;
    while ((idx = doc.text.indexOf(t, idx)) !== -1 && hits < 5) { hits++; idx += t.length; }
    score += hits;
  }
  if (phrase.length > 2 && doc.text.includes(phrase)) score += EXACT_PHRASE_BOOST;
  return score;
}

export function searchCorpus(query: string, opts: { type?: SearchDocType; limit?: number } = {}): SearchResponse {
  if (!CORPUS) CORPUS = buildCorpus();
  const phrase = query.trim().toLowerCase();
  const terms = phrase.split(/\s+/).filter((t) => t.length > 1);
  const limit = opts.limit ?? 30;

  const scored = CORPUS
    .filter((d) => !opts.type || d.type === opts.type)
    .map((d) => ({ d, score: terms.length ? scoreDoc(d, terms, phrase) : 0 }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  const results: SearchResult[] = scored.map(({ d, score }) => ({
    id: d.id,
    type: d.type,
    title: d.title,
    snippet: d.snippet,
    score,
    domain: d.domain,
    deepLink: d.deepLink,
  }));

  return {
    query,
    results,
    total: results.length,
    engine: "static",
    meta: {
      source: "yala-search",
      fetchedAt: "2026-06-17T00:00:00.000Z",
      ageMinutes: 0,
      fallbackTier: "reference",
    },
  };
}

/** Top-k retrieval used by the AI concierge. */
export function retrieve(query: string, k = 6): SearchResult[] {
  return searchCorpus(query, { limit: k }).results;
}
