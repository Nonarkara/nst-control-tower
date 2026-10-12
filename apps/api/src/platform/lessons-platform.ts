import type { AcademyLesson } from "@nst/shared";

/**
 * Platform track. The previous lessons were an integration roadmap from an
 * internal municipal research pack, including office phone numbers. Those
 * lessons are not in the public tree.
 */
export const platformLessons: AcademyLesson[] = [
  {
    id: "platform-01-removed",
    track: "platform",
    order: 1,
    title: "Platform lesson removed",
    titleTh: "บทเรียนการใช้แพลตฟอร์มถูกนำออก",
    summary: "The previous platform lessons were an internal integration roadmap and have been removed from the public tree.",
    level: "intro",
    durationMin: 1,
    body: "This track used to tell another municipality how to wire national data services, and it included office numbers from that study. That text is not part of the public demo. Older git history still has it.",
    keyFacts: ["Contributor setup for this repository is in CONTRIBUTING.md."],
    links: [{ label: "Open the Operations lens", lens: "operations" }],
    quiz: [
      {
        q: "Where should a contributor look for how this repository is set up?",
        choices: [
          "The removed research roadmap",
          "CONTRIBUTING.md",
          "A staff mobile number",
          "A home-directory path",
        ],
        answer: 1,
        explain: "The internal roadmap was removed. Public setup notes are in CONTRIBUTING.md.",
      },
    ],
  },
];
