/** Static asset contract: reject broken payloads before declaring coverage ready. */
export function validGeoAsset(value: unknown, path: string): boolean {
  if (!value || typeof value !== "object") return false;
  const fc = value as { type?: string; features?: unknown[] };
  if (fc.type !== "FeatureCollection" || !Array.isArray(fc.features)) return false;
  const roads = path.endsWith("/road-levels.geojson");
  const buildings = path.endsWith("/buildings-infill.geojson");
  if ((roads || buildings) && !fc.features.length) return false;
  return fc.features.every(item => {
    const f = item as { type?: string; geometry?: { type?: string; coordinates?: unknown }; properties?: Record<string, unknown> } | null;
    if (!f || f.type !== "Feature") return false;
    if (!roads && !buildings) return true;
    if (!f.geometry || !f.properties || !Array.isArray(f.geometry.coordinates)) return false;
    if (roads) return f.geometry.type === "Point" && f.geometry.coordinates.length >= 2
      && f.geometry.coordinates.every(Number.isFinite) && Number.isFinite(f.properties.z) && (typeof f.properties.route === "string" || Number.isFinite(f.properties.route));
    const validCoords = (c: unknown): boolean => Array.isArray(c) && c.length > 0 && (typeof c[0] === "number" ? c.length >= 2 && c.every(Number.isFinite) : c.every(validCoords));
    return ["Polygon", "MultiPolygon"].includes(f.geometry.type ?? "") && typeof f.properties.id === "string" && validCoords(f.geometry.coordinates);
  });
}
