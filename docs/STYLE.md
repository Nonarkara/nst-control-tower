# Visual Story — Style Guide

This repo explains a municipal smart-city dashboard to **two audiences at once**:

- **Laypeople (Thai)** — through *pictures*. Every concept (purpose, how it works, proof,
  who benefits) is told as a clean diagram with Thai labels. No wall of text.
- **Developers / AI (English)** — through *prose*. All `.md`/`.txt` files and code comments
  are English, because that is what machines parse most reliably.

So: **Thai lives in the SVGs. English lives in the Markdown.** The README is English prose
that embeds the Thai picture-story.

## The look — "clean flat infographic" (เรียบ ชัด เข้าใจง่าย)

Professional, calm, legible — like a well-made govtech explainer slide. **No characters, no
mascots, no faces, no hand-drawn organic shapes** — only clean geometry: rounded cards, simple
line+fill icons, arrows, and big Thai labels. (Earlier mascot/cartoon directions were dropped.)

- **Warm and airy.** Background `#FAF8F1` (warm off-white) with white cards. Generous
  whitespace, tidy alignment on a grid.
- **Thin, refined lines.** Card borders are 2px `#DED9CE` — never heavy black outlines.
- **Cards.** White fill, 2px `#DED9CE` border, radius 18, a 6px colored top bar, and a numbered
  circle badge sitting in a soft-color chip.
- **Icon rows.** A 40×40 soft-colored rounded chip holds a small 2.4px-stroke geometric icon,
  followed by a bold label and a small muted subtitle.
- **One idea per element.** Fewer, larger, well-aligned pieces beat clutter.

### Palette — the **YALA** palette (earthy: green · gold · brown)

Source palette: forest green `#4A773C` · Yala gold `#F1BE48` · dark brown `#4E3629` ·
light gray `#D9D9D6` · black. Below are the working tokens (with legible text variants and
soft chip tints) derived from it.

| Token | Hex | Soft tint | Use |
|---|---|---|---|
| ink | `#2C2418` | — | titles, body (warm near-black) |
| ink-soft | `#4A3C2C` | — | labels |
| muted | `#9A8F80` | — | subtitles |
| line | `#DED9CE` | — | card borders |
| panel | `#F4F1E9` | — | grouping panels |
| bg | `#FAF8F1` | — | page background |
| darkscreen | `#241B11` | — | map screen / promise pill (warm near-black) |
| **green** (primary) | `#4A773C` | `#E3EDDA` | data / live / primary |
| **gold** (signature) | `#D6A12A` text · `#F1BE48` fills | `#FBEFCB` | Yala accent / highlight / title underline |
| **brown** | `#6E4A33` | `#EBE2D9` | info / people |
| moss | `#7E8A3A` | `#EDF0DC` | success / decision |
| terracotta | `#B14A2B` | `#F3E0D7` | problem / alert |
| teal-green | `#2F6B5A` | `#DCE8E2` | secondary category |

> Gold is the signature — used bright (`#F1BE48`) for the title underline and fills, and a
> deeper gold (`#D6A12A`) for text/numbers so it stays legible on the warm background.

### Typography

- Thai labels: `font-family="'Noto Sans Thai','Sarabun','Tahoma',sans-serif"` (Noto Sans Thai
  first, per the project font). To guarantee identical rendering on GitHub it would need to be
  embedded as a base64 web-font subset; for now the system fallback covers it.
- Latin / numbers: `'Inter','Helvetica Neue',sans-serif`.
- Big bold Thai titles (~38), card titles (~22 bold), labels (~17 bold), subtitles (~12.5 gray).
- Keep labels short. One idea per label.

### Title block (every diagram)

Top-left: a big bold Thai title, a small English subtitle, and a short gold underline
(`#F59E0B`, ~80×6, radius 3).

### SVG conventions (render well on GitHub + stay editable)

- Standalone files, **hardcoded hex colors** (no CSS variables — GitHub renders SVG as a static
  image, so variables would not resolve).
- Always include `role="img"` + `<title>` + `<desc>` for accessibility.
- `viewBox` width 1200; height to fit (≈520–700). No `<script>`, no external refs, no raster.
- One diagram = one idea. Validate with an XML parser before committing.

## The picture-story (the four P's + chapters)

| # | Thai | English | Answers |
|---|---|---|---|
| Purpose | ทำไม | Why | Why does this need to exist? |
| Practical | ทำงานยังไง | How | How does data become a decision? |
| Proof | พิสูจน์ | Proof | How do we know it works? |
| People | ใครได้อะไร | Incentives | Who benefits, and why will they keep it alive? |

Plus chapters: the map, lenses, mobile, the digital twin, data sources, resilience, trust, and
"fork it for your city", and a developer architecture diagram — same clean visual language.
