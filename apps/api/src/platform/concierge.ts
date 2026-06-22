import type { ConciergeAnswer, SearchResult } from "@nst/shared";
import { retrieve } from "./search.js";

/**
 * AI concierge — retrieval-augmented answering over the Yala knowledge corpus.
 * Retrieves the most relevant indicators / sources / lessons / glossary terms,
 * then (if GEMINI_API_KEY is set) asks Gemini to synthesize a grounded,
 * cited answer. Without a key it degrades to a retrieval-only summary, so it is
 * always useful and never blank.
 */

const GEMINI_MODEL = "gemini-2.5-flash";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

const SYSTEM = [
  "You are the Yala Knowledge Concierge for the Yala City Municipality (เทศบาลนครยะลา) dashboard, Thailand's Deep South.",
  "Answer ONLY from the provided context snippets. Cite figures with their source. Be concise, factual and neutral.",
  "For Deep South security topics, use aggregate framing and neutral language — never sensationalize.",
  "If the context does not contain the answer, say so and suggest which dashboard lens or atlas module to open.",
].join(" ");

function buildContext(citations: SearchResult[]): string {
  return citations
    .map((c, i) => `[${i + 1}] (${c.type}) ${c.title} — ${c.snippet}`)
    .join("\n");
}

function retrievalOnlyAnswer(question: string, citations: SearchResult[]): string {
  if (citations.length === 0) {
    return `I couldn't find anything in the Yala knowledge base for "${question}". Try the Data Atlas (◷ ATLAS) or a broader term — e.g. "poverty", "flood", "education", "Bang Lang Dam".`;
  }
  const top = citations.slice(0, 4);
  const lines = top.map((c) => `• ${c.title}${c.snippet ? ` — ${c.snippet}` : ""}`).join("\n");
  return `Here's what the Yala knowledge base has on "${question}":\n${lines}\n\nOpen the linked atlas module or lens for the full picture. (Set GEMINI_API_KEY for a synthesized answer.)`;
}

async function synthesize(question: string, citations: SearchResult[], apiKey: string): Promise<string | null> {
  try {
    const prompt = `${SYSTEM}\n\nContext:\n${buildContext(citations)}\n\nQuestion: ${question}\n\nAnswer (cite snippet numbers like [1]):`;
    const res = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.2, maxOutputTokens: 600 },
      }),
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
    const text = json.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
    return text.trim() || null;
  } catch {
    return null;
  }
}

export async function askConcierge(question: string, env: { GEMINI_API_KEY?: string }): Promise<ConciergeAnswer> {
  const q = (question ?? "").trim();
  const citations = retrieve(q, 6);
  let answer: string;
  let usedLLM = false;

  if (env.GEMINI_API_KEY && q.length > 0 && citations.length > 0) {
    const synth = await synthesize(q, citations, env.GEMINI_API_KEY);
    if (synth) { answer = synth; usedLLM = true; }
    else answer = retrievalOnlyAnswer(q, citations);
  } else {
    answer = retrievalOnlyAnswer(q, citations);
  }

  return {
    question: q,
    answer,
    citations,
    usedLLM,
    meta: {
      source: usedLLM ? "gemini+retrieval" : "retrieval",
      fetchedAt: "2026-06-17T00:00:00.000Z",
      ageMinutes: 0,
      fallbackTier: usedLLM ? "live" : "reference",
      note: usedLLM ? undefined : "Retrieval-only — set GEMINI_API_KEY to enable synthesized answers.",
    },
  };
}
