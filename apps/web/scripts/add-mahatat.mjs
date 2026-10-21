#!/usr/bin/env node
/** Rebuild only the schematic chedi search footprint at the aerial-checked mapped chedi
 * footprint center. Never author an invented compound wall. Run from apps/web. */
import fs from "node:fs/promises";
const reference = JSON.parse(await fs.readFile(new URL("../src/data/mahatatReference.json", import.meta.url), "utf8"));
const file = new URL("../public/geo/nst/buildings.geojson", import.meta.url);
const fc = JSON.parse(await fs.readFile(file, "utf8"));
const old = fc.features.find(f => f.properties?.id === "hand/mahatat-chedi");
if (!old) throw new Error("Chedi search feature missing; do not invent a replacement compound");
const x = reference.widthM / 2 / (111320 * Math.cos(reference.lat * Math.PI / 180));
const y = reference.widthM / 2 / 110574;
const { lng, lat } = reference;
old.geometry = { type: "Polygon", coordinates: [[[lng-x,lat-y],[lng+x,lat-y],[lng+x,lat+y],[lng-x,lat+y],[lng-x,lat-y]]] };
old.properties.height = reference.heightM;
old.properties._elevM = reference.heightM;
old.properties._bbox = [lng-x,lat-y,lng+x,lat+y];
old.properties.source = "hand-authored search extent; aerial-checked OSM chedi footprint center";
fc.features = fc.features.filter(f => f.properties?.id !== "hand/mahatat-cloister");
await fs.writeFile(file, JSON.stringify(fc));
console.log("Updated chedi search footprint; all traced buildings preserved");
