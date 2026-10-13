import type { AcademyLesson } from "@nst/shared";

/**
 * Data-literacy track. The previous lessons restated figures from an internal
 * municipal research pack. Those lessons are not in the public tree.
 */
export const dataLiteracyLessons: AcademyLesson[] = [
  {
    id: "data-literacy-01-removed",
    track: "data-literacy",
    order: 1,
    title: "Data-literacy lesson removed",
    titleTh: "บทเรียนการอ่านข้อมูลถูกนำออก",
    summary: "The previous data-literacy lessons copied figures from an internal research pack and have been removed from the public tree.",
    level: "intro",
    durationMin: 1,
    body: "This track used to teach indicator reading with figures taken from an internal municipal study. That text is not part of the public demo. Older git history still has it.",
    keyFacts: ["Read a number together with its source, its geography, and its date."],
    links: [{ label: "Open the Operations lens", lens: "operations" }],
    quiz: [
      {
        q: "What happened to the previous data-literacy lessons?",
        choices: [
          "They were removed from the public tree",
          "They are a live gauge feed",
          "They replace the flood panel",
          "They are the census law",
        ],
        answer: 0,
        explain: "The lessons restated an internal research pack and were replaced with this notice.",
      },
    ],
  },
];
