import type { AcademyLesson } from "@nst/shared";

/**
 * City-systems track. The previous lessons restated an internal municipal
 * research pack (contacts, vendor notes, budget readings, and staffing
 * judgments). Those lessons are not in the public tree.
 */
export const citySystemsLessons: AcademyLesson[] = [
  {
    id: "city-systems-01-removed",
    track: "city-systems",
    order: 1,
    title: "City systems lesson removed",
    titleTh: "บทเรียนระบบเมืองถูกนำออก",
    summary: "The previous city-systems lessons were an internal research write-up and have been removed from the public tree.",
    level: "intro",
    durationMin: 1,
    body: "This track used to restate an internal source study for another municipality. That text is not part of the public demo. Older git history still has it.",
    keyFacts: ["No internal research notes are published in this lesson."],
    links: [{ label: "Open the Operations lens", lens: "operations" }],
    quiz: [
      {
        q: "Where did the previous city-systems lessons go?",
        choices: [
          "They are still the recommended operating procedure",
          "They were removed from the public tree",
          "They are a live sensor feed",
          "They are the municipal budget law",
        ],
        answer: 1,
        explain: "The lessons restated an internal research pack and were replaced with this notice.",
      },
    ],
  },
];
