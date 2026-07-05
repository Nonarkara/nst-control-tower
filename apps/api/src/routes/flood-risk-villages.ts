/**
 * Flood Risk Villages API route — /api/flood-risk-villages
 */
import { Hono } from "hono";
import { fetchFloodRiskVillages } from "../adapters/flood-risk-villages.js";

const app = new Hono();

app.get("/", async (c) => {
  const feed = await fetchFloodRiskVillages();
  return c.json(feed);
});

export default app;
