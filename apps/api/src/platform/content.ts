import type { AcademyLesson, GlossaryTerm, DataDictionaryEntry, AcademyTrack } from "@nst/shared";
import { dataLiteracyLessons } from "./lessons-dataliteracy.js";
import { citySystemsLessons } from "./lessons-citysystems.js";
import { climateLessons } from "./lessons-climate.js";
import { outcomesLessons } from "./lessons-outcomes.js";
import { platformLessons } from "./lessons-platform.js";
import { GLOSSARY } from "./glossary.js";
import { DATA_DICTIONARY } from "./dataDictionary.js";

/** All academy lessons across tracks, ordered by track then lesson order. */
export const ALL_LESSONS: AcademyLesson[] = [
  ...dataLiteracyLessons,
  ...citySystemsLessons,
  ...climateLessons,
  ...outcomesLessons,
  ...platformLessons,
].sort((a, b) => a.track.localeCompare(b.track) || a.order - b.order);

export { GLOSSARY, DATA_DICTIONARY };

export interface AcademyTrackInfo {
  id: AcademyTrack;
  title: string;
  lessons: AcademyLesson[];
}

const TRACK_TITLES: Record<AcademyTrack, string> = {
  "deep-south": "Deep South Context",
  "data-literacy": "Data Literacy",
  "city-systems": "City Systems",
  "climate-flood": "Climate & Flood",
  "outcomes": "Development Outcomes",
  "platform": "Using the Platform",
};

export function academyTracks(): AcademyTrackInfo[] {
  const byTrack = new Map<AcademyTrack, AcademyLesson[]>();
  for (const l of ALL_LESSONS) {
    if (!byTrack.has(l.track)) byTrack.set(l.track, []);
    byTrack.get(l.track)!.push(l);
  }
  return [...byTrack.entries()].map(([id, lessons]) => ({
    id,
    title: TRACK_TITLES[id] ?? id,
    lessons: lessons.sort((a, b) => a.order - b.order),
  }));
}

export function getLesson(id: string): AcademyLesson | undefined {
  return ALL_LESSONS.find((l) => l.id === id);
}
