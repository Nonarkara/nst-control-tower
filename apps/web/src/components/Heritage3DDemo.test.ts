/**
 * Heritage3DDemo — the provenance and dimension contract.
 *
 * This file exists because this panel has been confidently, visibly wrong
 * three separate times, and none of the failures broke a test:
 *
 *  1. It credited "CyArk / Agisoft / CC BY-NC-SA" for a model the Sketchfab
 *     API attributes to Phantasma Labs under CC BY 4.0.
 *  2. It built every outbound link as `sketchfab.com/3d-models/none-<uid>`,
 *     so the credit and the "Open on Sketchfab" button 404'd while the embed
 *     itself still worked — the visible demo looked fine.
 *  3. It presented AYUTTHAYA photogrammetry as the evidence for the NAKHON SI
 *     THAMMARAT World Heritage candidacy.
 *
 * And again on 2026-09-29, when asked to wire in two more models: one of them
 * is titled "Wat Phra Mahathat Woramahawihan, Nakhon Si Thammarat", is
 * tagged `worldheritage`, and is Ayutthaya — its own description says so, and
 * the model is a scan of that complex. Title, tags and thumbnail all said NST.
 * Only the description and the render said otherwise.
 *
 * The rule these tests encode: a model's CLAIMED site is never evidence of its
 * actual site, and an absent licence is never a licence.
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import {
  SKETCHFAB_MODELS,
  PRIMARY_MODEL,
  sketchfabUrl,
  sketchfabEmbedUrl,
  SKETCHFAB_LICENCE_NOTE,
  UNESCO,
} from "./Heritage3DDemo";
import { CHEDI_HEIGHT_M, CHEDI_WIDTH_M } from "../lib/mahatat3d";

describe("every embedded model is labelled with what it actually is", () => {
  it("carries both models the panel promises", () => {
    expect(SKETCHFAB_MODELS).toHaveLength(2);
  });

  it("leads with the one that is the Nakhon Si Thammarat chedi", () => {
    // armszx, uid 67d8526c…, tagged watprathat/thai. Its title and tags name
    // Nakhon Si Thammarat and the render is an NST-style bell stupa.
    expect(PRIMARY_MODEL.uid).toBe("67d8526c53b144bd8304060919b3186e");
    expect(PRIMARY_MODEL.isNst).toBe(true);
  });

  it("marks the Ayutthaya model as NOT Nakhon Si Thammarat", () => {
    // The exact regression. Sketchfab: title = "วัดพระมหาธาตุ วรมหาวิหาร
    // จังหวัดนครศรีธรรมราช", tag = worldheritage, description = "…a royal
    // Temple of the Ayutthaya Kingdom… located in the Ayutthaya Historical
    // Park". Trusting the title would put Ayutthaya back on the NST panel.
    const ayutthaya = SKETCHFAB_MODELS.find((m) => m.uid === "1baec87da8aa45c4ba029f927feafc7b");
    expect(ayutthaya).toBeDefined();
    expect(ayutthaya!.isNst).toBe(false);
    expect(ayutthaya!.noteTh).toMatch(/อยุธยา/);
  });

  it("says out loud that neither model is a survey of this monument", () => {
    // A CG reconstruction and an Ayutthaya scan are not the same kind of
    // object, and neither is evidence for the nomination.
    expect(PRIMARY_MODEL.kindTh).toMatch(/CG/);
    expect(PRIMARY_MODEL.noteTh).toMatch(/ไม่ใช่ภาพสแกน/);
  });

  it("never presents either model as NST-authored data", () => {
    for (const m of SKETCHFAB_MODELS) {
      expect(m.author).not.toMatch(/nst|chonburi| municipality/i);
      expect(m.authorUrl).toMatch(/^https:\/\/sketchfab\.com\//);
    }
  });
});

describe("no licence is claimed that Sketchfab does not record", () => {
  it("states the licence is unspecified instead of asserting one", () => {
    // Both models return `license: {}` from the v3 API. The previous version
    // of this panel claimed "CC BY 4.0" — true of the Phantasma model it was
    // written for, false of these two. Overstating a licence is as much a lie
    // as understating one.
    expect(SKETCHFAB_LICENCE_NOTE).toMatch(/ไม่ได้ระบุสัญญาอนุญาต/);
  });

  it("makes no Creative Commons claim anywhere in the file", () => {
    // Comments are stripped first, because the file's doc comment deliberately
    // NAMES "CC BY 4.0" while explaining that the previous version claimed it
    // wrongly. What must not exist is a claim in code — a licence constant, a
    // licence label, or a link to a Creative Commons deed.
    const src = readFileSync(new URL("./Heritage3DDemo.tsx", import.meta.url), "utf8")
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/\/\/.*$/gm, "");
    expect(src).not.toMatch(/CC BY|creativecommons\.org/i);
  });
});

describe("the links actually resolve", () => {
  it("uses the model's own slug, not a bare uid, for the viewer URL", () => {
    // The earlier version emitted ".../3d-models/none-<uid>", a stray "none-"
    // from a null search result, and every credit link 404'd while the embed
    // worked. One of these two models is also NOT addressable by uid alone:
    // its path carries a "pratat-" prefix.
    expect(sketchfabUrl(PRIMARY_MODEL)).toBe(
      "https://sketchfab.com/3d-models/pratat-67d8526c53b144bd8304060919b3186e",
    );
    for (const m of SKETCHFAB_MODELS) {
      expect(sketchfabUrl(m)).not.toMatch(/none-/);
      expect(sketchfabUrl(m)).toContain(m.uid);
      expect(m.uid).toMatch(/^[0-9a-f]{32}$/);
    }
  });

  it("builds the embed from the bare uid, which is the correct embed form", () => {
    for (const m of SKETCHFAB_MODELS) {
      expect(sketchfabEmbedUrl(m)).toBe(`https://sketchfab.com/models/${m.uid}/embed`);
    }
  });
});

describe("the embed is allowed to load", () => {
  // The heritage viewer shipped as a blank white box twice: index.html's CSP
  // frame-src never listed sketchfab.com, so the browser blocked the iframe
  // while every link and credit test stayed green.
  it("index.html frame-src includes the Sketchfab embed origin", () => {
    const html = readFileSync(new URL("../../index.html", import.meta.url), "utf8");
    const frameSrc = html.match(/frame-src([^;]*);/)?.[1] ?? "";
    for (const m of SKETCHFAB_MODELS) {
      expect(frameSrc.split(/\s+/)).toContain(new URL(sketchfabEmbedUrl(m)).origin);
    }
  });
});

describe("the UNESCO candidacy figures the panel publishes", () => {
  it("matches the nomination: H 28 wa x W 14 wa at 1 wa = 2 m", () => {
    expect(UNESCO.heightM).toBe(56);
    expect(UNESCO.widthM).toBe(28);
    expect(UNESCO.heightM / UNESCO.widthM).toBe(2); // the deliberate 2:1
  });

  it("carries the tilt and the zoning, which are the engineering claims", () => {
    expect(UNESCO.leanDeg).toBe(1.45);
    expect(UNESCO.coreRai).toBe(46);
    expect(UNESCO.bufferRai).toBe(3000);
    expect(UNESCO.tentativeList).toBe(2013);
    expect(UNESCO.criteria).toEqual(["i", "ii", "vi"]);
  });
});

describe("the map's chedi agrees with the panel's chedi", () => {
  it("the modelled chedi is the nominated size, not a stylised one", () => {
    expect(CHEDI_HEIGHT_M).toBeCloseTo(UNESCO.heightM, 1);
    expect(CHEDI_WIDTH_M).toBe(UNESCO.widthM);
  });

  it("the chedi in buildings.geojson uses the same height", () => {
    // The map drew the parametric chedi at the nomination's 56 m while the
    // extruded building footprint behind it extruded to a leftover 78 m — two
    // different chedis, one 39% taller than the other, on the same pad.
    const b = JSON.parse(
      readFileSync(new URL("../../public/geo/nst/buildings.geojson", import.meta.url), "utf8"),
    ) as { features: Array<{ id: string; properties: { height?: number } }> };
    const chedi = b.features.find((f) => f.id === "hand/mahatat-chedi");
    expect(chedi).toBeDefined();
    expect(chedi!.properties.height).toBe(UNESCO.heightM);
  });
});
