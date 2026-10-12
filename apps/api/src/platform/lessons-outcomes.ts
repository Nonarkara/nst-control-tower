import type { AcademyLesson } from "@nst/shared";

/**
 * Outcomes track. The previous lessons restated an internal municipal research
 * pack. Those lessons are not in the public tree.
 */
export const outcomesLessons: AcademyLesson[] = [
  {
    id: "outcomes-01-removed",
    track: "outcomes",
    order: 1,
    title: "Outcomes lesson removed",
    titleTh: "บทเรียนผลลัพธ์ถูกนำออก",
    summary: "The previous outcomes lessons restated an internal research pack and have been removed from the public tree.",
    level: "intro",
    durationMin: 1,
    body: "This track used to publish poverty, education, and health readings compiled in an internal study. That text is not part of the public demo. Older git history still has it.",
    keyFacts: ["Outcome write-ups from the internal study are not published here."],
    links: [{ label: "Open the executive lens", lens: "executive" }],
    quiz: [
      {
        q: "Why is this outcomes lesson a notice instead of the old text?",
        choices: [
          "The old text was an internal research write-up",
          "The flood gauges are offline",
          "The map failed to load",
          "The census was cancelled",
        ],
        answer: 0,
        explain: "The lessons restated an internal research pack and were replaced with this notice.",
      },
    ],
  },
];
