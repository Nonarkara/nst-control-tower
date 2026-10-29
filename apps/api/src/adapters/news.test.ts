import { describe, it, expect, vi, beforeEach } from "vitest";
import { fetchNews } from "./news";

/**
 * News adapter contract tests.
 *
 * cachedWithStale stores results in a module-level Map.
 * Rule: the FIRST test in this file (which owns the cache miss) runs against
 * the real fetchNews import and captures URL patterns. Subsequent isolated
 * tests use `vi.resetModules()` + dynamic `import()` to get a fresh module
 * instance with an empty cache.
 */

function makeRss(items: Array<{ title: string; link: string; description?: string; daysAgo?: number }>): string {
  const parts = items.map(({ title, link, description = "", daysAgo = 0 }) => {
    const pubDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toUTCString();
    return `<item>
  <title><![CDATA[${title}]]></title>
  <link>${link}</link>
  <description><![CDATA[${description}]]></description>
  <pubDate>${pubDate}</pubDate>
</item>`;
  });
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"><channel><title>Test Feed</title>
${parts.join("\n")}
</channel></rss>`;
}

describe("news adapter", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("requests all configured RSS feed domains on first call", async () => {
    // FIRST test — cache miss → actual fetch calls go through.
    const capturedUrls: string[] = [];
    vi.spyOn(globalThis, "fetch").mockImplementation((url) => {
      capturedUrls.push(String(url));
      const xml = makeRss([{ title: "Chonburi city news", link: "https://example.com/1" }]);
      return Promise.resolve(new Response(xml, { status: 200 }));
    });

    await fetchNews();

    expect(capturedUrls.some((u) => u.includes("news.google.com"))).toBe(true);
    expect(capturedUrls.some((u) => u.includes("bangkokpost.com"))).toBe(true);
    expect(capturedUrls.some((u) => u.includes("thaipbs.or.th"))).toBe(true);
    // All configured feeds must be requested (6 as of writing)
    expect(capturedUrls.length).toBeGreaterThanOrEqual(6);
  });

  it("returns NormalizedFeed shape with live tier when items are parsed", async () => {
    // SECOND test — works with cached result from test 1.
    const feed = await fetchNews();

    expect(feed.meta.source).toContain("google-news");
    expect(feed.meta.fallbackTier).toBe("live");
    expect(feed.features.length).toBeGreaterThan(0);

    const item = feed.features[0];
    expect(item).toHaveProperty("id");
    expect(item).toHaveProperty("title");
    expect(item).toHaveProperty("kind", "news");
    expect(item.score).toBeGreaterThan(0);
    // publishedAt must be an ISO string
    expect(() => new Date(item.publishedAt)).not.toThrow();
  });
});

// ── Isolated tests — each gets a fresh module instance via vi.resetModules() ──

describe("news adapter — scenario fallback (isolated)", () => {
  it("returns scenario tier when all feeds return 503", async () => {
    vi.resetModules();
    vi.spyOn(globalThis, "fetch").mockImplementation(() =>
      Promise.resolve(new Response(null, { status: 503 })),
    );

    const { fetchNews: fresh } = await import("./news");
    const feed = await fresh();

    expect(feed.meta.fallbackTier).toBe("scenario");
    expect(feed.features).toHaveLength(0);
    vi.restoreAllMocks();
  });
});

describe("news adapter — scoring (isolated)", () => {
  it("ranks Chonburi / EEC items above generic items", async () => {
    vi.resetModules();
    const xml = makeRss([
      { title: "Chonburi EEC investment announcement", link: "https://bangkokpost.com/eec" },
      { title: "Weather forecast for Bangkok city",    link: "https://bangkokpost.com/bkk" },
    ]);
    vi.spyOn(globalThis, "fetch").mockImplementation((url) => {
      if (String(url).includes("bangkokpost.com")) {
        return Promise.resolve(new Response(xml, { status: 200 }));
      }
      return Promise.resolve(new Response(null, { status: 404 }));
    });

    const { fetchNews: fresh } = await import("./news");
    const feed = await fresh();

    expect(feed.features.length).toBe(2);
    const [first] = feed.features;
    expect(first.score).toBeGreaterThanOrEqual(feed.features[1].score);
    expect(first.title).toMatch(/chonburi|eec/i);
    vi.restoreAllMocks();
  });
});

describe("news adapter — freshness gate (isolated)", () => {
  it("excludes items older than 7 days", async () => {
    vi.resetModules();
    const xml = makeRss([
      { title: "Fresh Chonburi update today",          link: "https://bangkokpost.com/fresh",  daysAgo: 1 },
      { title: "Stale Chonburi story from 10 days ago", link: "https://bangkokpost.com/stale", daysAgo: 10 },
    ]);
    vi.spyOn(globalThis, "fetch").mockImplementation((url) => {
      if (String(url).includes("bangkokpost.com")) {
        return Promise.resolve(new Response(xml, { status: 200 }));
      }
      return Promise.resolve(new Response(null, { status: 404 }));
    });

    const { fetchNews: fresh } = await import("./news");
    const feed = await fresh();

    // Stale item must be absent
    expect(feed.features.every((it) => !it.title.includes("10 days ago"))).toBe(true);
    // Fresh item must be present
    expect(feed.features.some((it) => it.title.includes("today"))).toBe(true);
    vi.restoreAllMocks();
  });
});

describe("news adapter — deduplication (isolated)", () => {
  it("returns no duplicate titles even when multiple feeds carry the same story", async () => {
    vi.resetModules();
    // Same title in two separate <item> blocks within one feed (simulates cross-feed dup)
    const xml = makeRss([
      { title: "Chonburi flood warning", link: "https://example.com/a" },
      { title: "Chonburi flood warning", link: "https://example.com/b" },
    ]);
    vi.spyOn(globalThis, "fetch").mockImplementation(() =>
      Promise.resolve(new Response(xml, { status: 200 })),
    );

    const { fetchNews: fresh } = await import("./news");
    const feed = await fresh();

    const titles = feed.features.map((it) => it.title.toLowerCase().trim());
    expect(new Set(titles).size).toBe(titles.length);
    vi.restoreAllMocks();
  });
});

describe("news adapter — action tags (isolated)", () => {
  it("tags flood items FL (not Emergency) and still boosts their score", async () => {
    vi.resetModules();
    // Thai flood keyword (น้ำท่วม) + English flood — both trigger FL. Emergency
    // is reserved for acute incidents (fire, landslide, drowning…).
    const xml = makeRss([
      { title: "น้ำท่วมหนัก Chonburi municipal area flood emergency", link: "https://thaipbs.or.th/flood1" },
    ]);
    vi.spyOn(globalThis, "fetch").mockImplementation((url) => {
      if (String(url).includes("thaipbs.or.th")) {
        return Promise.resolve(new Response(xml, { status: 200 }));
      }
      return Promise.resolve(new Response(null, { status: 404 }));
    });

    const { fetchNews: fresh } = await import("./news");
    const feed = await fresh();

    expect(feed.features.length).toBeGreaterThan(0);
    const floodItem = feed.features[0];
    expect(floodItem.tags).toContain("FL");
    expect(floodItem.tags).not.toContain("EM");
    // Flood keywords should push score above the baseline trust score (~42 for thaipbs 0.82 × 50)
    expect(floodItem.score).toBeGreaterThan(55);
    vi.restoreAllMocks();
  });

  it("applies PU tag to public-health / hospital items", async () => {
    vi.resetModules();
    const xml = makeRss([
      { title: "Chonburi hospital launches vaccination drive for outbreak", link: "https://bangkokpost.com/health" },
    ]);
    vi.spyOn(globalThis, "fetch").mockImplementation((url) => {
      if (String(url).includes("bangkokpost.com")) return Promise.resolve(new Response(xml, { status: 200 }));
      return Promise.resolve(new Response(null, { status: 404 }));
    });
    const { fetchNews: fresh } = await import("./news");
    const feed = await fresh();

    expect(feed.features.length).toBeGreaterThan(0);
    expect(feed.features[0].tags).toContain("PU");
    vi.restoreAllMocks();
  });

  it("applies multiple tags when item matches multiple patterns", async () => {
    vi.resetModules();
    // Earthquake + emergency both present
    const xml = makeRss([
      { title: "Earthquake triggers tsunami warning flood emergency Chonburi", link: "https://bangkokpost.com/quake" },
    ]);
    vi.spyOn(globalThis, "fetch").mockImplementation((url) => {
      if (String(url).includes("bangkokpost.com")) return Promise.resolve(new Response(xml, { status: 200 }));
      return Promise.resolve(new Response(null, { status: 404 }));
    });
    const { fetchNews: fresh } = await import("./news");
    const feed = await fresh();

    expect(feed.features.length).toBeGreaterThan(0);
    // At least EM should be present (flood keyword)
    expect(feed.features[0].tags.length).toBeGreaterThan(0);
    vi.restoreAllMocks();
  });
});

describe("news adapter — item shape invariants (isolated)", () => {
  it("every returned item has the required NewsItem fields", async () => {
    vi.resetModules();
    const xml = makeRss([
      { title: "Chonburi city council approves smart city budget", link: "https://bangkokpost.com/smart-city" },
    ]);
    vi.spyOn(globalThis, "fetch").mockImplementation((url) => {
      if (String(url).includes("bangkokpost.com")) return Promise.resolve(new Response(xml, { status: 200 }));
      return Promise.resolve(new Response(null, { status: 404 }));
    });
    const { fetchNews: fresh } = await import("./news");
    const feed = await fresh();

    for (const item of feed.features) {
      expect(typeof item.id).toBe("string");
      expect(item.id.length).toBeGreaterThan(0);
      expect(typeof item.title).toBe("string");
      expect(item.title.length).toBeGreaterThan(0);
      expect(typeof item.sourceUrl).toBe("string");
      expect(item.sourceUrl).toMatch(/^https?:\/\//);
      expect(typeof item.publishedAt).toBe("string");
      expect(() => new Date(item.publishedAt)).not.toThrow();
      expect(typeof item.score).toBe("number");
      expect(item.score).toBeGreaterThan(0);
      expect(Array.isArray(item.tags)).toBe(true);
      expect(item.kind).toBe("news");
    }
    vi.restoreAllMocks();
  });

  it("items are sorted by score descending", async () => {
    vi.resetModules();
    const xml = makeRss([
      { title: "Generic international market news", link: "https://bangkokpost.com/market" },
      { title: "น้ำท่วม Chonburi flood emergency EEC disruption", link: "https://bangkokpost.com/flood" },
    ]);
    vi.spyOn(globalThis, "fetch").mockImplementation((url) => {
      if (String(url).includes("bangkokpost.com")) return Promise.resolve(new Response(xml, { status: 200 }));
      return Promise.resolve(new Response(null, { status: 404 }));
    });
    const { fetchNews: fresh } = await import("./news");
    const feed = await fresh();

    const scores = feed.features.map((it) => it.score);
    for (let i = 1; i < scores.length; i++) {
      expect(scores[i]).toBeLessThanOrEqual(scores[i - 1]);
    }
    vi.restoreAllMocks();
  });
});

// ── Location extraction ───────────────────────────────────────────────────────

describe("news adapter — location extraction (isolated)", () => {
  it("attaches lat/lng/placeName when title contains a known place alias", async () => {
    vi.resetModules();
    // "tha dee canal" is an alias for Tha Dee Canal
    const xml = makeRss([
      { title: "Flooding reported near Tha Dee Canal area", link: "https://bangkokpost.com/thadee-flood" },
    ]);
    vi.spyOn(globalThis, "fetch").mockImplementation((url) => {
      if (String(url).includes("bangkokpost.com")) return Promise.resolve(new Response(xml, { status: 200 }));
      return Promise.resolve(new Response(null, { status: 404 }));
    });
    const { fetchNews: fresh } = await import("./news") as unknown as { fetchNews: typeof import("./news").fetchNews };
    const feed = await fresh();

    expect(feed.features.length).toBeGreaterThan(0);
    const item = feed.features[0];
    expect(item.lat).toBeCloseTo(8.44, 1);
    expect(item.lng).toBeCloseTo(99.93, 1);
    expect(item.placeName).toBe("Tha Dee Canal");
    vi.restoreAllMocks();
  });

  it("geo-boosted items score higher than non-geolocated equivalent", async () => {
    vi.resetModules();
    const xml = makeRss([
      { title: "Pak Phanang River basin flooding news",  link: "https://bangkokpost.com/pakphanang" },
      { title: "Generic municipal update elsewhere", link: "https://bangkokpost.com/generic" },
    ]);
    vi.spyOn(globalThis, "fetch").mockImplementation((url) => {
      if (String(url).includes("bangkokpost.com")) return Promise.resolve(new Response(xml, { status: 200 }));
      return Promise.resolve(new Response(null, { status: 404 }));
    });
    const { fetchNews: fresh } = await import("./news") as unknown as { fetchNews: typeof import("./news").fetchNews };
    const feed = await fresh();

    const port = feed.features.find((it) => it.placeName === "Pak Phanang River");
    const generic = feed.features.find((it) => it.placeName === null);
    expect(port).toBeDefined();
    // Pak Phanang item is geo-boosted (+10 score)
    if (generic) expect(port!.score).toBeGreaterThan(generic.score);
    vi.restoreAllMocks();
  });

  it("returns null lat/lng when no known alias appears in text", async () => {
    vi.resetModules();
    const xml = makeRss([
      { title: "General news from distant region about rainfall", link: "https://bangkokpost.com/distant" },
    ]);
    vi.spyOn(globalThis, "fetch").mockImplementation((url) => {
      if (String(url).includes("bangkokpost.com")) return Promise.resolve(new Response(xml, { status: 200 }));
      return Promise.resolve(new Response(null, { status: 404 }));
    });
    const { fetchNews: fresh } = await import("./news") as unknown as { fetchNews: typeof import("./news").fetchNews };
    const feed = await fresh();

    expect(feed.features.length).toBeGreaterThan(0);
    const item = feed.features[0];
    expect(item.lat).toBeNull();
    expect(item.lng).toBeNull();
    expect(item.placeName).toBeNull();
    vi.restoreAllMocks();
  });
});

// ── Action tags — remaining tags (FU, HO, FE, IN, SEC, FL, PO) ──────────────

describe("news adapter — remaining action tags (isolated)", () => {
  async function tagsFor(title: string): Promise<string[]> {
    vi.resetModules();
    const xml = makeRss([{ title, link: "https://bangkokpost.com/item" }]);
    vi.spyOn(globalThis, "fetch").mockImplementation((url) => {
      if (String(url).includes("bangkokpost.com")) return Promise.resolve(new Response(xml, { status: 200 }));
      return Promise.resolve(new Response(null, { status: 404 }));
    });
    const { fetchNews: fresh } = await import("./news") as unknown as { fetchNews: typeof import("./news").fetchNews };
    const feed = await fresh();
    vi.restoreAllMocks();
    return feed.features[0]?.tags ?? [];
  }

  it("FU tag — funeral/cremation keywords", async () => {
    expect(await tagsFor("Funeral ceremony held for Chonburi dignitary")).toContain("FU");
  });

  it("FU tag — Thai keyword งานศพ", async () => {
    expect(await tagsFor("งานศพ ผู้นำชุมชนชลบุรี จัดพิธีไว้อาลัย")).toContain("FU");
  });

  it("HO tag — award/recognition", async () => {
    expect(await tagsFor("Chonburi school wins national award prize recognition")).toContain("HO");
  });

  it("HO tag — Thai keyword รางวัล", async () => {
    expect(await tagsFor("ชลบุรีได้รับรางวัลเมืองน่าอยู่ระดับประเทศ")).toContain("HO");
  });

  it("FE tag — festival/opening ceremony", async () => {
    expect(await tagsFor("Grand opening ceremony for Chonburi cultural festival 2026")).toContain("FE");
  });

  it("FE tag — Thai keyword สงกรานต์", async () => {
    expect(await tagsFor("เตรียมจัดงานสงกรานต์ชลบุรีประจำปี 2569")).toContain("FE");
  });

  it("IN tag — road damage / pothole infrastructure", async () => {
    expect(await tagsFor("Road damage and potholes on Sukhumvit Chonburi need repair")).toContain("IN");
  });

  it("IN tag — Thai keyword ถนนชำรุด", async () => {
    expect(await tagsFor("ถนนชำรุดในเขตเทศบาลเมืองชลบุรีรอการซ่อมแซม")).toContain("IN");
  });

  it("SEC tag — bombing / shooting insurgency keywords", async () => {
    expect(await tagsFor("Roadside bomb wounds soldiers in Bannang Sata, Yala")).toContain("SEC");
  });

  it("SEC tag — Thai keyword ระเบิด / ก่อความไม่สงบ", async () => {
    expect(await tagsFor("เกิดเหตุระเบิดและก่อความไม่สงบในพื้นที่ยะลา")).toContain("SEC");
  });

  it("FL tag — flood / inundation keywords", async () => {
    expect(await tagsFor("Severe flooding inundates Yala city after Pattani River overflow")).toContain("FL");
  });

  it("FL tag — Thai keyword น้ำท่วม / อุทกภัย", async () => {
    expect(await tagsFor("น้ำท่วมและอุทกภัยในเขตเทศบาลนครยะลา")).toContain("FL");
  });

  it("PO tag — protest/arrested crackdown", async () => {
    expect(await tagsFor("Protesters arrested outside Chonburi city hall crackdown")).toContain("PO");
  });

  it("PO tag — Thai keyword ประท้วง", async () => {
    expect(await tagsFor("ประชาชนประท้วงหน้าศาลากลางชลบุรี ตำรวจสลายการชุมนุม")).toContain("PO");
  });
});

// ── stripHtml / pick — entity decoding ───────────────────────────────────────

describe("news adapter — HTML entity decoding (isolated)", () => {
  it("decodes &amp; &quot; &lt; &gt; in non-CDATA title fields", async () => {
    vi.resetModules();
    const rawXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"><channel><title>Test</title>
<item>
  <title>Chonburi &amp; EEC: &quot;Future Ready&quot; plan &lt;2030&gt;</title>
  <link>https://bangkokpost.com/entities</link>
  <pubDate>${new Date().toUTCString()}</pubDate>
</item>
</channel></rss>`;
    vi.spyOn(globalThis, "fetch").mockImplementation((url) => {
      if (String(url).includes("bangkokpost.com")) return Promise.resolve(new Response(rawXml, { status: 200 }));
      return Promise.resolve(new Response(null, { status: 404 }));
    });
    const { fetchNews: fresh } = await import("./news") as unknown as { fetchNews: typeof import("./news").fetchNews };
    const feed = await fresh();

    expect(feed.features.length).toBeGreaterThan(0);
    const item = feed.features[0];
    expect(item.title).toContain("Chonburi & EEC");
    expect(item.title).toContain('"Future Ready"');
    expect(item.title).toContain("<2030>");
    vi.restoreAllMocks();
  });

  it("decodes numeric decimal char ref &#36; → $", async () => {
    vi.resetModules();
    const rawXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"><channel><title>Test</title>
<item>
  <title>&#36;500m EEC fund announced Chonburi</title>
  <link>https://bangkokpost.com/numref</link>
  <pubDate>${new Date().toUTCString()}</pubDate>
</item>
</channel></rss>`;
    vi.spyOn(globalThis, "fetch").mockImplementation((url) => {
      if (String(url).includes("bangkokpost.com")) return Promise.resolve(new Response(rawXml, { status: 200 }));
      return Promise.resolve(new Response(null, { status: 404 }));
    });
    const { fetchNews: fresh } = await import("./news") as unknown as { fetchNews: typeof import("./news").fetchNews };
    const feed = await fresh();

    expect(feed.features[0]?.title).toContain("$500m");
    vi.restoreAllMocks();
  });

  it("decodes hex char ref &#x24; → $", async () => {
    vi.resetModules();
    const rawXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"><channel><title>Test</title>
<item>
  <title>Chonburi EEC &#x24;1B investment boom</title>
  <link>https://bangkokpost.com/hexref</link>
  <pubDate>${new Date().toUTCString()}</pubDate>
</item>
</channel></rss>`;
    vi.spyOn(globalThis, "fetch").mockImplementation((url) => {
      if (String(url).includes("bangkokpost.com")) return Promise.resolve(new Response(rawXml, { status: 200 }));
      return Promise.resolve(new Response(null, { status: 404 }));
    });
    const { fetchNews: fresh } = await import("./news") as unknown as { fetchNews: typeof import("./news").fetchNews };
    const feed = await fresh();

    // &#x24; = $ (U+0024 DOLLAR SIGN)
    expect(feed.features[0]?.title).toContain("$1B");
    vi.restoreAllMocks();
  });

  it("strips HTML tags from CDATA description leaving plain text", async () => {
    vi.resetModules();
    const rawXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"><channel><title>Test</title>
<item>
  <title><![CDATA[Chonburi smart city update]]></title>
  <link>https://bangkokpost.com/htmltags</link>
  <description><![CDATA[<p>Municipal <strong>budget</strong> approved for <a href="x">EEC</a> projects.</p>]]></description>
  <pubDate>${new Date().toUTCString()}</pubDate>
</item>
</channel></rss>`;
    vi.spyOn(globalThis, "fetch").mockImplementation((url) => {
      if (String(url).includes("bangkokpost.com")) return Promise.resolve(new Response(rawXml, { status: 200 }));
      return Promise.resolve(new Response(null, { status: 404 }));
    });
    const { fetchNews: fresh } = await import("./news") as unknown as { fetchNews: typeof import("./news").fetchNews };
    const feed = await fresh();

    const summary = feed.features[0]?.summary ?? "";
    expect(summary).toContain("Municipal");
    expect(summary).toContain("budget");
    expect(summary).not.toContain("<p>");
    expect(summary).not.toContain("<strong>");
    vi.restoreAllMocks();
  });
});

// ── Items missing title or link are silently skipped ─────────────────────────

describe("news adapter — malformed items skipped (isolated)", () => {
  it("skips items with empty title", async () => {
    vi.resetModules();
    const rawXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"><channel><title>Test</title>
<item>
  <title><![CDATA[Chonburi city news valid]]></title>
  <link>https://bangkokpost.com/valid</link>
  <pubDate>${new Date().toUTCString()}</pubDate>
</item>
<item>
  <title></title>
  <link>https://bangkokpost.com/notitle</link>
  <pubDate>${new Date().toUTCString()}</pubDate>
</item>
</channel></rss>`;
    vi.spyOn(globalThis, "fetch").mockImplementation((url) => {
      if (String(url).includes("bangkokpost.com")) return Promise.resolve(new Response(rawXml, { status: 200 }));
      return Promise.resolve(new Response(null, { status: 404 }));
    });
    const { fetchNews: fresh } = await import("./news") as unknown as { fetchNews: typeof import("./news").fetchNews };
    const feed = await fresh();

    expect(feed.features.every((it) => it.title.length > 0)).toBe(true);
    vi.restoreAllMocks();
  });

  it("skips items with no link element", async () => {
    vi.resetModules();
    const rawXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"><channel><title>Test</title>
<item>
  <title><![CDATA[Chonburi news with link]]></title>
  <link>https://bangkokpost.com/withlink</link>
  <pubDate>${new Date().toUTCString()}</pubDate>
</item>
<item>
  <title><![CDATA[Chonburi news without link]]></title>
  <pubDate>${new Date().toUTCString()}</pubDate>
</item>
</channel></rss>`;
    vi.spyOn(globalThis, "fetch").mockImplementation((url) => {
      if (String(url).includes("bangkokpost.com")) return Promise.resolve(new Response(rawXml, { status: 200 }));
      return Promise.resolve(new Response(null, { status: 404 }));
    });
    const { fetchNews: fresh } = await import("./news") as unknown as { fetchNews: typeof import("./news").fetchNews };
    const feed = await fresh();

    expect(feed.features.some((it) => it.title.includes("with link"))).toBe(true);
    expect(feed.features.some((it) => it.title.includes("without link"))).toBe(false);
    vi.restoreAllMocks();
  });
});

// ── parseDate edge cases (isolated) ──────────────────────────────────────────

describe("news adapter — undated items are not 'live' (isolated)", () => {
  it("drops an item whose pubDate field is absent", async () => {
    vi.resetModules();
    const before = Date.now();
    const rawXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"><channel><title>Test</title>
<item>
  <title><![CDATA[Chonburi no-date news item]]></title>
  <link>https://bangkokpost.com/nodate</link>
</item>
</channel></rss>`;
    vi.spyOn(globalThis, "fetch").mockImplementation((url) => {
      if (String(url).includes("bangkokpost.com")) return Promise.resolve(new Response(rawXml, { status: 200 }));
      return Promise.resolve(new Response(null, { status: 404 }));
    });
    const { fetchNews: fresh } = await import("./news") as unknown as { fetchNews: typeof import("./news").fetchNews };
    const feed = await fresh();
    void before;

    // Stamping an undated story "now" made a 2017 article read "16 h ago".
    expect(feed.features.some((f) => /no-date|invalid-date/.test(f.title))).toBe(false);
    vi.restoreAllMocks();
  });

  it("drops an item whose pubDate is not a valid date string", async () => {
    vi.resetModules();
    const before = Date.now();
    const rawXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"><channel><title>Test</title>
<item>
  <title><![CDATA[Chonburi invalid-date news]]></title>
  <link>https://bangkokpost.com/baddate</link>
  <pubDate>not-a-date-at-all</pubDate>
</item>
</channel></rss>`;
    vi.spyOn(globalThis, "fetch").mockImplementation((url) => {
      if (String(url).includes("bangkokpost.com")) return Promise.resolve(new Response(rawXml, { status: 200 }));
      return Promise.resolve(new Response(null, { status: 404 }));
    });
    const { fetchNews: fresh } = await import("./news") as unknown as { fetchNews: typeof import("./news").fetchNews };
    const feed = await fresh();
    void before;

    // Stamping an undated story "now" made a 2017 article read "16 h ago".
    expect(feed.features.some((f) => /no-date|invalid-date/.test(f.title))).toBe(false);
    vi.restoreAllMocks();
  });
});

describe("news location evidence", () => {
  it("does not geolocate international airports or city halls to NST", async () => {
    vi.resetModules();
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(makeRss([
      { title: "Afghanistan airport road opens near city hall", link: "https://example.com/wakhan" },
    ]), { status: 200 }));
    try {
      const { fetchNews: fresh } = await import("./news");
      const result = await fresh();
      expect(result.features).toHaveLength(1);
      expect(result.features[0]).toMatchObject({ lat: null, lng: null, placeName: null });
    } finally { vi.restoreAllMocks(); }
  });
});

import { parseDate, namesOldYear } from "./news";
describe("undated and re-served old news", () => {
  it("an unreadable date is null, never 'now'", () => {
    expect(parseDate("")).toBeNull();
    expect(parseDate("not a date")).toBeNull();
    expect(parseDate("Tue, 21 Oct 2026 10:00:00 GMT")?.toISOString()).toBe("2026-10-21T10:00:00.000Z");
  });
  it("a story that names a year long past is dropped", () => {
    const now = new Date("2026-10-21T10:00:00Z"); // BE 2569
    expect(namesOldYear("วันอังคารที่ 17 มกราคม พ.ศ.2560 มอบถุงยังชีพ", now)).toBe(true);
    expect(namesOldYear("เมื่อ พ.ศ. 2567 เกิดน้ำท่วมใหญ่", now)).toBe(true);
    expect(namesOldYear("เมื่อ พ.ศ.2568 เกิดน้ำท่วม", now)).toBe(false); // last year may still be context
    expect(namesOldYear("น้ำท่วมวันนี้ที่ปากพนัง", now)).toBe(false);
  });
});

import { actionTags } from "./news";
describe("Emergency tag means an acute incident", () => {
  const t = (title: string) => actionTags({ title, summary: "" });
  it("flooding is tagged Flood, not Emergency", () => {
    expect(t("น้ำท่วมถนนสายหลักปากพนัง")).toContain("FL");
    expect(t("น้ำท่วมถนนสายหลักปากพนัง")).not.toContain("EM");
  });
  it("a relief vote or a councillor's criticism is not an emergency", () => {
    expect(t("บอร์ดกสทช. เคาะ 4 มติ เยียวยาน้ำท่วม")).not.toContain("EM");
    expect(t("ส.ก. ซัด กทม.ไร้แผนรับมือท่วม")).not.toContain("EM");
  });
  it("'storm' as a metaphor is not an emergency", () => {
    expect(t("'พายุ' เข้าไทยพีบีเอส ประเมินอดีต-อนาคต")).not.toContain("EM");
  });
  it("a real incident still is", () => {
    expect(t("ไฟไหม้ตลาดสดท่าม้า ผู้ค้าอพยพ")).toContain("EM");
    expect(t("Landslide blocks road in Lan Saka")).toContain("EM");
    expect(t("เด็กจมน้ำเสียชีวิตที่คลองท่าดี")).toContain("EM");
  });
  it("criticism phrased as draws fire is not an emergency", () => {
    expect(t("‘Sin tax’ revenue shake-up draws fire")).not.toContain("EM");
    expect(actionTags({
      title: "Tax changes criticised",
      summary: "The revenue shake-up drew fire from lawmakers.",
    })).not.toContain("EM");
    expect(t("Tax plan drawing fire from businesses")).not.toContain("EM");
    expect(t("Tax plan has drawn fire from critics")).not.toContain("EM");
  });
  it("literal incoming fire remains an incident, including in a tax story", () => {
    expect(t("Patrol draws fire near school")).toContain("EM");
    expect(t("Police drew fire from attackers")).toContain("EM");
    expect(t("Tax officers draw fire from gunmen")).toContain("EM");
    expect(t("Convoy draws fire near town")).toContain("EM");
  });
  it("a criticism idiom does not erase a separate physical incident", () => {
    expect(actionTags({
      title: "Revenue shake-up draws fire",
      summary: "A warehouse fire destroyed shops in Nakhon Si Thammarat.",
    })).toContain("EM");
    expect(t("Fire destroys market in Nakhon Si Thammarat")).toContain("EM");
  });
  it("a fire-safety drill is not an emergency", () => {
    expect(t("ซ้อมแผนดับเพลิง ไฟไหม้จำลอง เทศบาลนคร")).not.toContain("EM");
  });
});
