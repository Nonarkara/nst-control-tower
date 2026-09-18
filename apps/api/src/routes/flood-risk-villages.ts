/**
 * Flood Risk Villages API route — /api/flood-risk-villages
 */
import { Hono } from "hono";
import { fetchFloodRiskVillages } from "../adapters/flood-risk-villages.js";
import { safeFeed } from "../lib/feed.js";

const app = new Hono();

app.get("/", async (c) => safeFeed(c, fetchFloodRiskVillages, "flood-risk-villages"));

export default app;
