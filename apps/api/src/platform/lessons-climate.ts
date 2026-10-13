import type { AcademyLesson } from "@nst/shared";

/**
 * Climate track. The previous lessons restated an internal municipal research
 * pack. Those lessons are not in the public tree. Live flood gauges stay on
 * the map.
 */
export const climateLessons: AcademyLesson[] = [
  {
    id: "climate-flood-01-removed",
    track: "climate-flood",
    order: 1,
    title: "Climate lesson removed",
    titleTh: "บทเรียนภูมิอากาศถูกนำออก",
    summary: "The previous climate lessons restated an internal research pack and have been removed from the public tree.",
    level: "intro",
    durationMin: 1,
    body: "This track used to describe another municipality's flood history from an internal study. That text is not part of the public demo. The map still shows the live flood layers for this deployment. Older git history still has the lessons.",
    keyFacts: ["Live flood readings stay on the map. The research write-up does not."],
    links: [{ label: "Open the Operations lens", lens: "operations" }],
    quiz: [
      {
        q: "What still shows flood conditions after this lesson was removed?",
        choices: [
          "The internal research pack",
          "The live flood layers on the map",
          "A private staff directory",
          "A Cloudflare account id",
        ],
        answer: 1,
        explain: "The lesson text was removed. The map's live flood layers are unchanged.",
      },
    ],
  },
];
