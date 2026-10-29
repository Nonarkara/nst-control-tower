import manifest from "../data/roofObservations.json";
export type RoofShape = "flat" | "gabled" | "hipped" | "temple-tiered" | "unknown";
export interface RoofObservation { id: string; area: string; label: number; shape: RoofShape; note: string; color?: number[]; reviewedAt?: string; openAir?: boolean }
export const ROOF_STUDY = manifest.source;
export const CLASSIFIED_ROOF_COUNT = manifest.observations.filter(o => o.shape !== "unknown").length;
const byId = new Map((manifest.observations as RoofObservation[]).map(o => [o.id, o]));
export const roofObservation = (id: string) => byId.get(id);
export const hasReviewedRoof = (id: string) => { const o = byId.get(id); return !!o && o.shape !== "unknown"; };
