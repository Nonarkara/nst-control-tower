import type { IntelligenceItem, NormalizedFeed } from "@nst/shared";
import { cacheAgeMinutes, cachedWithStale as cached } from "../lib/cache.js";
import { fetchTextOrNull } from "./common.js";
// Archive is Node-only (uses fs). Dynamic import keeps Workers happy.
async function tryArchive(items: IntelligenceItem[]): Promise<void> {
  if (typeof process === "undefined" || !process.versions?.node) return;
  try {
    const mod = await import("../lib/newsArchive.js");
    await mod.archiveNewsItems(items);
  } catch {
    // archive is best-effort; never block the feed on it
  }
}

const TTL_SECONDS = 180; // 3 min

interface Feed {
  id: string;
  label: string;
  url: string;
  trust: number; // 0..1
}

const FEEDS: Feed[] = [
  {
    id: "google-news-nst-en",
    label: "Google News (EN)",
    // Nakhon Si Thammarat — EN. Query: (Nakhon Si Thammarat OR "Pak Phanang" OR นครศรีธรรมราช) + Thailand.
    url:
      "https://news.google.com/rss/search?q=" +
      encodeURIComponent('(Nakhon Si Thammarat OR "Pak Phanang" OR นครศรีธรรมราช) Thailand') +
      "&hl=en-TH&gl=TH&ceid=TH:en",
    trust: 0.75,
  },
  {
    id: "google-news-nst-th",
    label: "Google News (TH)",
    // นครศรีธรรมราช OR ปากพนัง OR เขาหลวง OR ลานสกา OR ท่าศาลา
    url:
      "https://news.google.com/rss/search?q=" +
      encodeURIComponent("นครศรีธรรมราช OR ปากพนัง OR เขาหลวง OR ลานสกา OR ท่าศาลา") +
      "&hl=th&gl=TH&ceid=TH:th",
    trust: 0.78,
  },
  {
    id: "google-news-nst-flood-th",
    label: "Google News Flood (TH)",
    // Flood-scoped: น้ำท่วม/อุทกภัย/ฝนตกหนัก/ดินถล่ม + นครศรีธรรมราช
    url:
      "https://news.google.com/rss/search?q=" +
      encodeURIComponent("(น้ำท่วม OR อุทกภัย OR ฝนตกหนัก OR ดินถล่ม) นครศรีธรรมราช") +
      "&hl=th&gl=TH&ceid=TH:th",
    trust: 0.80,
  },
  {
    id: "bangkok-post-thailand",
    label: "Bangkok Post",
    url: "https://www.bangkokpost.com/rss/data/thailand.xml",
    trust: 0.85,
  },
  {
    id: "thai-pbs-news",
    label: "Thai PBS",
    url: "https://news.thaipbs.or.th/rss/news.xml",
    trust: 0.82,
  },
  {
    id: "matichon-online",
    label: "Matichon",
    url: "https://www.matichon.co.th/feed",
    trust: 0.78,
  },
  {
    id: "prachatai",
    label: "Prachatai",
    // Independent desk with strong regional / environmental coverage.
    url: "https://prachatai.com/rss.xml",
    trust: 0.80,
  },
  {
    id: "khaosod-english",
    label: "Khaosod English",
    url: "https://www.khaosodenglish.com/feed/",
    trust: 0.78,
  },
];

// Reject news older than this many days — the mayor should not see month-old
// stories that are embarrassing or irrelevant.
const MAX_AGE_DAYS = 7;

const FIELD_RE = (tag: string) => new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i");
const CDATA_RE = /<!\[CDATA\[([\s\S]*?)\]\]>/;

function pick(block: string, tag: string): string {
  const m = block.match(FIELD_RE(tag));
  if (!m) return "";
  const raw = m[1].trim();
  const cdata = raw.match(CDATA_RE);
  return (cdata ? cdata[1] : raw).trim();
}

function stripHtml(s: string): string {
  return s
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/\s+/g, " ")
    .trim();
}

function parseDate(raw: string, now: Date): Date {
  if (!raw) return now;
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return now;
  return d;
}

function scoreItem(item: { title: string; summary: string }, trust: number): number {
  const text = `${item.title} ${item.summary}`.toLowerCase();
  let s = trust * 50;
  for (const kw of [
    "nakhon si thammarat", "นครศรีธรรมราช",
    "pak phanang", "ปากพนัง", "tha sala", "ท่าศาลา",
    "khao luang", "เขาหลวง", "lan saka", "ลานสกา",
    "tha dee", "ท่าดี", "municipality", "เทศบาล",
  ]) {
    if (text.includes(kw)) s += 8;
  }
  for (const kw of ["accident", "อุบัติเหตุ", "flood", "น้ำท่วม", "inundation", "อุทกภัย", "landslide", "ดินถล่ม", "heavy rain", "ฝนตกหนัก", "protest", "ประท้วง", "haze", "ฝุ่น", "fire", "ไฟไหม้", "runoff", "น้ำหลาก"]) {
    if (text.includes(kw)) s += 6;
  }
  return Math.min(100, Math.round(s));
}

// ── Location extraction ───────────────────────────────────────────────
// Known places inside Nakhon Si Thammarat City Municipality (+ key province
// sites) that the mayor cares about. Extracted from news text and pinned on
// the map so the mayor can see "market fire = THIS market", "flood at THIS
// canal", etc.

interface KnownPlace {
  name: string;
  aliases: string[];
  lat: number;
  lng: number;
}

const KNOWN_PLACES: KnownPlace[] = [
  { name: "Wat Phra Mahathat Woramahawihan", aliases: ["วัดพระมหาธาตุวรมหาวิหาร", "วัดพระมหาธาตุ", "wat phra mahathat", "phra borommathat", "พระบรมธาตุ"], lat: 8.4112, lng: 99.9667 },
  { name: "Nakhon Si Thammarat City Hall", aliases: ["เทศบาลนครนครศรีธรรมราช", "city hall", "city municipality", "เทศบาลนคร", "nakhon si thammarat municipality"], lat: 8.4304, lng: 99.9631 },
  { name: "Nakhon Si Thammarat Railway Station", aliases: ["สถานีรถไฟนครศรีธรรมราช", "nakhon si thammarat railway station", "railway station", "สถานีรถไฟ"], lat: 8.4326, lng: 99.9577 },
  { name: "Maharaj Nakhon Si Thammarat Hospital", aliases: ["โรงพยาบาลมหาราชนครศรีธรรมราช", "maharaj hospital", "maharaj nakhon si thammarat hospital", "รพ.มหาราช"], lat: 8.4189, lng: 99.9706 },
  { name: "Nakhon Si Thammarat Municipality Hospital", aliases: ["โรงพยาบาลเทศบาลนครนครศรีธรรมราช", "municipality hospital", "รพ.เทศบาล"], lat: 8.428, lng: 99.964 },
  { name: "Nakhon Si Thammarat Rajabhat University", aliases: ["มหาวิทยาลัยราชภัฏนครศรีธรรมราช", "nstru", "rajabhat nakhon si thammarat", "ราชภัฏนครศรีธรรมราช"], lat: 8.6418, lng: 99.8970 },
  { name: "Nakhon Si Thammarat Bus Terminal", aliases: ["สถานีขนส่งนครศรีธรรมราช", "bus terminal", "ka rom", "ขนส่ง", "ถนนกะโรม"], lat: 8.428, lng: 99.957 },
  { name: "City Pillar Shrine", aliases: ["ศาลหลักเมืองนครศรีธรรมราช", "city pillar shrine", "lak mueang", "หลักเมือง"], lat: 8.4189, lng: 99.9620 },
  { name: "Tha Dee Canal", aliases: ["คลองท่าดี", "tha dee", "tha dee canal", "คลองท่าดี"], lat: 8.44, lng: 99.93 },
  { name: "Pak Phanang River", aliases: ["แม่น้ำปากพนัง", "pak phanang", "pak phanang river", "ปากพนัง"], lat: 8.35, lng: 100.20 },
  { name: "Khao Luang", aliases: ["เขาหลวง", "khao luang", "อุทยานแห่งชาติเขาหลวง", "khao luang national park"], lat: 8.5167, lng: 99.7667 },
  { name: "Nakhon Si Thammarat Airport", aliases: ["ท่าอากาศยานนครศรีธรรมราช", "nakhon si thammarat airport", "airport", "vtsf"], lat: 8.5396, lng: 99.9447 },
];

function extractLocation(text: string): { lat: number; lng: number; placeName: string } | null {
  const lower = text.toLowerCase();
  for (const place of KNOWN_PLACES) {
    for (const alias of place.aliases) {
      if (lower.includes(alias.toLowerCase())) {
        return { lat: place.lat, lng: place.lng, placeName: place.name };
      }
    }
  }
  return null;
}

/**
 * Mayor's Action classifier — tag news items with the action the mayor
 * should consider taking. Each tag is a 2-char code shown in the news desk
 * so the mayor can scan headlines for "do I need to do something?".
 *
 * Tags (priority order):
 *   FU = funeral · attend or send wreath / representative
 *   EM = emergency · flood, fire, accident — go to scene / coordinate response
 *   PO = police-citizen friction · consider mediation on behalf of citizens
 *   HO = honor · congratulate, award presentation, achievement
 *   FE = festival / celebration · attend opening
 *   IN = infrastructure issue · road, drainage, lighting — chase the dept
 *   SEC = security · crime / unrest (rare in NST; kept for cross-province parity)
 *   FL = flood · flooding / inundation / overflow events (the dominant NST concern)
 *   PU = public-health · congratulate hospital staff, visit patients
 *
 * Pattern uses both TH + EN. Multiple tags allowed per item.
 */
const ACTION_PATTERNS: Array<{ tag: string; patterns: RegExp[] }> = [
  { tag: "FU", patterns: [
    /\b(funeral|cremation|wake|condolence|memorial)\b/i,
    /(งานศพ|ฌาปนกิจ|พระราชทานเพลิง|รดน้ำศพ|สวดอภิธรรม|ไว้อาลัย)/,
  ]},
  { tag: "EM", patterns: [
    /\b(flood|fire|earthquake|landslide|tsunami|drown|collapse|explosion|chemical leak|oil spill)\b/i,
    /(น้ำท่วม|ไฟไหม้|เพลิงไหม้|พังถล่ม|แผ่นดินไหว|จมน้ำ|สึนามิ|รั่วไหล|ดินถล่ม|พายุ|น้ำขัง)/,
  ]},
  { tag: "PO", patterns: [
    /\b(arrested|raid|crackdown|protest|complaint against|police violence|brutality)\b/i,
    /(จับกุม|ตำรวจรวบ|ร้องเรียนตำรวจ|ปะทะ|ปราบปราม|กวาดล้าง|กระทำเกินกว่าเหตุ|ประท้วง)/,
  ]},
  { tag: "HO", patterns: [
    /\b(award|prize|honour|honored|graduate|champion|win|recognition|distinguished)\b/i,
    /(รางวัล|สำเร็จการศึกษา|ปริญญา|ได้รับการยกย่อง|แชมป์|ชนะเลิศ|เกียรติยศ|ยกย่อง)/,
  ]},
  { tag: "FE", patterns: [
    /\b(festival|opening ceremony|inauguration|grand opening|celebration|anniversary|new year|songkran|loy krathong)\b/i,
    /(เทศกาล|พิธีเปิด|พิธีวางศิลาฤกษ์|ครบรอบ|ฉลอง|สงกรานต์|ลอยกระทง|วันชาติ)/,
  ]},
  { tag: "IN", patterns: [
    /\b(road damage|pothole|sewer|drainage|lighting|water supply|outage|sinkhole|blackout)\b/i,
    /(ถนนชำรุด|ท่อระบายน้ำ|น้ำประปา|ไฟดับ|ไฟฟ้าดับ|หลุมยุบ|ซ่อมแซมถนน|ปรับปรุง)/,
  ]},
  { tag: "SEC", patterns: [
    /\b(bombing|ied|shooting|gunmen|gunman|ambush|insurgent|militant|separatist|raid|curfew|martial law|roadside bomb|car bomb)\b/i,
    /(ระเบิด|ลอบยิง|ยิง|คนร้าย|ก่อความไม่สงบ|กลุ่มก่อการ|ปิดล้อม|ตรวจค้น|กฎอัยการศึก|ลอบวางระเบิด|คาร์บอมบ์)/,
  ]},
  { tag: "FL", patterns: [
    /\b(flood|flooding|inundat|overflow|deluge)\b/i,
    /(น้ำท่วม|น้ำหลาก|อุทกภัย|น้ำล้นตลิ่ง)/,
  ]},
  { tag: "PU", patterns: [
    /\b(hospital|doctor|nurse|patient|outbreak|vaccination|public health)\b/i,
    /(โรงพยาบาล|แพทย์|พยาบาล|ผู้ป่วย|วัคซีน|สาธารณสุข|ระบาด)/,
  ]},
];

function actionTags(item: { title: string; summary: string }): string[] {
  const text = `${item.title} ${item.summary}`;
  const tags: string[] = [];
  for (const { tag, patterns } of ACTION_PATTERNS) {
    if (patterns.some((p) => p.test(text))) tags.push(tag);
  }
  return tags;
}

async function parseFeed(feed: Feed): Promise<IntelligenceItem[]> {
  // 6s per-feed cap. With 6 feeds fanned out in parallel, the worst case is
  // still ~6s; the prior 25s default meant one slow feed pinned the whole
  // /api/news response to 25s.
  const xml = await fetchTextOrNull(feed.url, undefined, 6_000);
  if (!xml) return [];
  const itemRe = /<item>([\s\S]*?)<\/item>/g;
  const items: IntelligenceItem[] = [];
  const now = new Date();
  const cutoff = new Date(now.getTime() - MAX_AGE_DAYS * 24 * 60 * 60 * 1000);
  let match: RegExpExecArray | null;
  while ((match = itemRe.exec(xml)) !== null) {
    const block = match[1];
    const title = stripHtml(pick(block, "title"));
    const link = pick(block, "link");
    const description = stripHtml(pick(block, "description"));
    const pubDate = pick(block, "pubDate");
    const source = pick(block, "source") || feed.label;

    if (!title || !link) continue;

    const parsedDate = parseDate(pubDate, now);
    // Freshness gate — reject stale items so the mayor never sees
    // month-old embarrassing stories.
    if (parsedDate < cutoff) continue;

    const tags = actionTags({ title, summary: description });
    const loc = extractLocation(`${title} ${description}`);
    const it: IntelligenceItem = {
      id: `${feed.id}-${link}`,
      title,
      summary: description.slice(0, 280),
      source,
      sourceUrl: link,
      publishedAt: parsedDate.toISOString(),
      tags,
      score: 0,
      kind: "news",
      lat: loc?.lat ?? null,
      lng: loc?.lng ?? null,
      placeName: loc?.placeName ?? null,
    };
    it.score = scoreItem(it, feed.trust);
    // Boost actionable items so they float to the top of the news desk.
    // FL (flood) + EM (emergency/environment) are the dominant NST concerns.
    if (tags.includes("FL") || tags.includes("EM")) it.score += 20;
    if (tags.includes("FU")) it.score += 15;
    // Boost geolocated items — the mayor can see them on the map
    if (loc) it.score += 10;
    items.push(it);
  }
  return items;
}

export async function fetchNews(): Promise<NormalizedFeed<IntelligenceItem>> {
  const result = await cached<NormalizedFeed<IntelligenceItem> & { _dedup?: IntelligenceItem[] }>(
    "news",
    TTL_SECONDS,
    async () => {
      const fetchedAt = new Date().toISOString();
      const settled = await Promise.allSettled(FEEDS.map(parseFeed));
      const items: IntelligenceItem[] = [];
      for (const r of settled) {
        if (r.status === "fulfilled") items.push(...r.value);
      }

      const seen = new Set<string>();
      const dedup = items.filter((it) => {
        const key = it.title.toLowerCase().replace(/\s+/g, " ");
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      dedup.sort((a, b) => b.score - a.score || b.publishedAt.localeCompare(a.publishedAt));
      const top = dedup.slice(0, 30);

      return {
        features: top,
        meta: {
          source: "google-news+bangkok-post+prachatai",
          fetchedAt,
          ageMinutes: cacheAgeMinutes(fetchedAt),
          fallbackTier: top.length > 0 ? "live" : "scenario",
        },
        _dedup: dedup,
      };
    },
  );

  void tryArchive(result._dedup ?? result.features);

  return {
    features: result.features,
    meta: { ...result.meta, ageMinutes: cacheAgeMinutes(result.meta.fetchedAt) },
  };
}
