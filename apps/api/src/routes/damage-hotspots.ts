/**
 * Damage Hotspots API route — /api/damage-hotspots
 */
import { Hono } from "hono";
import { fetchDamageHotspots } from "../adapters/damage-hotspots.js";
import { safeFeed } from "../lib/feed.js";

const app = new Hono();

app.get("/", async (c) => safeFeed(c, fetchDamageHotspots, "damage-hotspots"));

export default app;
