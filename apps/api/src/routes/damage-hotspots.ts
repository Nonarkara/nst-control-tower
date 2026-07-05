import { Hono } from "hono";
import { fetchDamageHotspots } from "../adapters/damage-hotspots.js";

const app = new Hono();

app.get("/", async (c) => {
  const feed = await fetchDamageHotspots();
  return c.json(feed);
});

export default app;
