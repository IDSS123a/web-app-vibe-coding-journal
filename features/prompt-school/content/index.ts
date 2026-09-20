/**
 * Every authored chapter, in course order. To add a chapter: write its content file, list it here,
 * and set `available: true` on its entry in outline.ts. The seed script (scripts/seed-prompt-school.ts)
 * and the content test both read this list, so a chapter cannot be half added.
 */
import { FIVE_PILLARS_EXERCISES, FIVE_PILLARS_LESSONS, type ExerciseWithSamples, type LessonContent } from "./five-pillars";
import { CRAFT_EXERCISES, CRAFT_LESSONS } from "./craft-of-prompting";
import { FOUNDATIONAL_EXERCISES, FOUNDATIONAL_LESSONS } from "./foundational-techniques";

export interface AuthoredChapter {
  slug: string;
  lessons: LessonContent[];
  exercises: ExerciseWithSamples[];
}

export const AUTHORED_CHAPTERS: AuthoredChapter[] = [
  { slug: "craft-of-prompting", lessons: CRAFT_LESSONS, exercises: CRAFT_EXERCISES },
  { slug: "five-pillars", lessons: FIVE_PILLARS_LESSONS, exercises: FIVE_PILLARS_EXERCISES },
  { slug: "foundational-techniques", lessons: FOUNDATIONAL_LESSONS, exercises: FOUNDATIONAL_EXERCISES },
];
