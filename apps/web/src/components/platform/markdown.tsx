import type { ReactNode } from "react";

/**
 * Minimal, dependency-free markdown renderer for academy lesson bodies.
 * Supports: ## / ### headings, - and * bullet lists, 1. ordered lists,
 * **bold**, *italic*, `code`, and paragraphs. Good enough for our authored
 * lesson content; intentionally not a full CommonMark implementation.
 */

function inline(text: string, keyBase: string): ReactNode[] {
  const out: ReactNode[] = [];
  // tokenize on **bold**, *italic*, `code`
  const re = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g;
  let last = 0, m: RegExpExecArray | null, i = 0;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const tok = m[0];
    if (tok.startsWith("**")) out.push(<strong key={`${keyBase}-${i}`}>{tok.slice(2, -2)}</strong>);
    else if (tok.startsWith("`")) out.push(<code key={`${keyBase}-${i}`}>{tok.slice(1, -1)}</code>);
    else out.push(<em key={`${keyBase}-${i}`}>{tok.slice(1, -1)}</em>);
    last = m.index + tok.length;
    i++;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

export function Markdown({ source }: { source: string }): ReactNode {
  const lines = source.replace(/\r\n/g, "\n").split("\n");
  const blocks: ReactNode[] = [];
  let list: { ordered: boolean; items: string[] } | null = null;
  let para: string[] = [];
  let key = 0;

  const flushPara = () => {
    if (para.length) { blocks.push(<p key={key++}>{inline(para.join(" "), `p${key}`)}</p>); para = []; }
  };
  const flushList = () => {
    if (list) {
      const items = list.items.map((it, i) => <li key={i}>{inline(it, `li${key}-${i}`)}</li>);
      blocks.push(list.ordered ? <ol key={key++}>{items}</ol> : <ul key={key++}>{items}</ul>);
      list = null;
    }
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    if (!line.trim()) { flushPara(); flushList(); continue; }
    const h = /^(#{2,4})\s+(.*)$/.exec(line);
    if (h) {
      flushPara(); flushList();
      const lvl = h[1].length;
      const txt = inline(h[2], `h${key}`);
      blocks.push(lvl === 2 ? <h4 key={key++}>{txt}</h4> : <h5 key={key++}>{txt}</h5>);
      continue;
    }
    const ul = /^[-*]\s+(.*)$/.exec(line);
    const ol = /^\d+\.\s+(.*)$/.exec(line);
    if (ul || ol) {
      flushPara();
      const ordered = !!ol;
      if (!list || list.ordered !== ordered) { flushList(); list = { ordered, items: [] }; }
      list.items.push((ul ?? ol)![1]);
      continue;
    }
    flushList();
    para.push(line.trim());
  }
  flushPara(); flushList();
  return <div className="md">{blocks}</div>;
}
