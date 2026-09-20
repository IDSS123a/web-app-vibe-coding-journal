/**
 * Every authored chapter, in course order. To add a chapter: write its content file, list it here,
 * and set `available: true` on its entry in outline.ts. The seed script (scripts/seed-prompt-school.ts)
 * and the content test both read this list, so a chapter cannot be half added.
 */
import { FIVE_PILLARS_EXERCISES, FIVE_PILLARS_LESSONS, type ExerciseWithSamples, type LessonContent } from "./five-pillars";
import { CRAFT_EXERCISES, CRAFT_LESSONS } from "./craft-of-prompting";
import { FOUNDATIONAL_EXERCISES, FOUNDATIONAL_LESSONS } from "./foundational-techniques";
import { MARKDOWN_EXERCISES, MARKDOWN_LESSONS } from "./markdown-for-prompts";
import { REASONING_EXERCISES, REASONING_LESSONS } from "./reasoning-techniques";
import { STRUCTURE_EXERCISES, STRUCTURE_LESSONS } from "./structure-and-protection";
import { CODE_RESEARCH_EXERCISES, CODE_RESEARCH_LESSONS } from "./code-and-research";
import { OPTIMIZE_EXERCISES, OPTIMIZE_LESSONS } from "./optimize-and-debug";

export interface AuthoredChapter {
  slug: string;
  lessons: LessonContent[];
  exercises: ExerciseWithSamples[];
}

export const AUTHORED_CHAPTERS: AuthoredChapter[] = [
  { slug: "craft-of-prompting", lessons: CRAFT_LESSONS, exercises: CRAFT_EXERCISES },
  { slug: "five-pillars", lessons: FIVE_PILLARS_LESSONS, exercises: FIVE_PILLARS_EXERCISES },
  { slug: "foundational-techniques", lessons: FOUNDATIONAL_LESSONS, exercises: FOUNDATIONAL_EXERCISES },
  { slug: "markdown-for-prompts", lessons: MARKDOWN_LESSONS, exercises: MARKDOWN_EXERCISES },
  { slug: "reasoning-techniques", lessons: REASONING_LESSONS, exercises: REASONING_EXERCISES },
  { slug: "structure-and-protection", lessons: STRUCTURE_LESSONS, exercises: STRUCTURE_EXERCISES },
  { slug: "code-and-research", lessons: CODE_RESEARCH_LESSONS, exercises: CODE_RESEARCH_EXERCISES },
  { slug: "optimize-and-debug", lessons: OPTIMIZE_LESSONS, exercises: OPTIMIZE_EXERCISES },
];
