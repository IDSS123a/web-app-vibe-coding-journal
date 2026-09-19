/**
 * The whole planned Prompt School course (specs/prompt-school/, about 45 lessons in 12 chapters),
 * mapped onto the Director's book "Mastering Prompt Engineering". Every chapter is listed so the
 * learner sees the road ahead; `available` chapters have authored lessons and practice. The rest are
 * written in batches (see TASKS.md) and flipped to available when their content is added.
 */
import type { PromptSchoolLevel } from "../domain";

export interface ChapterOutline {
  slug: string;
  level: PromptSchoolLevel;
  title: string;
  summary: string;
  bookRef: string;
  plannedLessons: number;
  available: boolean;
}

export const PROMPT_SCHOOL_OUTLINE: ChapterOutline[] = [
  // Beginner
  { slug: "craft-of-prompting", level: "beginner", title: "The Prompt Engineer's Craft", summary: "Why prompting is a craft: thinking on paper first, thinking like an engineer, and learning by experiment.", bookRef: "Chapter 1", plannedLessons: 4, available: false },
  { slug: "five-pillars", level: "beginner", title: "The Five Pillars", summary: "The anatomy of an effective prompt: context, instructions, examples, constraints and delimiters.", bookRef: "Chapter 2", plannedLessons: 6, available: true },
  { slug: "foundational-techniques", level: "beginner", title: "Foundational Techniques", summary: "Zero-shot prompting, few-shot learning and quality sampling, and when to use each.", bookRef: "Chapter 3", plannedLessons: 4, available: false },
  { slug: "markdown-for-prompts", level: "beginner", title: "Formatting Prompts Clearly", summary: "Markdown and tags that make a prompt easy to read for people and for models.", bookRef: "Appendix C", plannedLessons: 4, available: false },
  // Intermediate
  { slug: "reasoning-techniques", level: "intermediate", title: "Making the Model Think", summary: "Chain of thought, tree of thoughts and knowledge distillation for harder problems.", bookRef: "Chapter 4", plannedLessons: 4, available: false },
  { slug: "structure-and-protection", level: "intermediate", title: "Structuring and Protecting Interaction", summary: "Structured output with tags, delimiters as defensive boundaries, and understanding adversarial inputs.", bookRef: "Chapter 5", plannedLessons: 4, available: false },
  { slug: "code-and-research", level: "intermediate", title: "Prompting for Code and Research", summary: "Domain prompts: coding assistance and research and analysis.", bookRef: "Chapter 6", plannedLessons: 4, available: false },
  { slug: "optimize-and-debug", level: "intermediate", title: "Optimizing and Debugging Prompts", summary: "Iterative refinement, A/B testing and tracing common failures to their cause.", bookRef: "Chapter 7", plannedLessons: 4, available: false },
  // Advanced
  { slug: "ethics-and-bias", level: "advanced", title: "Ethics, Responsibility and Bias", summary: "Guiding principles for systems, and detecting and reducing bias in prompts and outputs.", bookRef: "Chapter 8", plannedLessons: 3, available: false },
  { slug: "tools-and-multimodal", level: "advanced", title: "Tools, Multimodal and Co-Creation", summary: "Tool use and orchestration, multimodal prompting and collaborative markdown.", bookRef: "Chapter 9", plannedLessons: 3, available: false },
  { slug: "case-studies", level: "advanced", title: "Real-World Case Studies", summary: "Customer service chatbots and scientific research, worked through end to end.", bookRef: "Chapter 10", plannedLessons: 3, available: false },
  { slug: "blueprint-workshops", level: "advanced", title: "Blueprint Workshops and the Future", summary: "Capstone workshops built on the book's ready-made blueprints, and where prompting is heading.", bookRef: "Chapter 11 and Appendix B", plannedLessons: 4, available: false },
];

export const PROMPT_SCHOOL_LEVELS: Array<{ id: PromptSchoolLevel; label: string; blurb: string }> = [
  { id: "beginner", label: "Beginner", blurb: "Write clear prompts that work the first time." },
  { id: "intermediate", label: "Intermediate", blurb: "Handle harder tasks, structure output and defend your prompts." },
  { id: "advanced", label: "Advanced", blurb: "Design responsible, tool-using prompts and complete real projects." },
];

export const PLANNED_LESSON_TOTAL = PROMPT_SCHOOL_OUTLINE.reduce((n, c) => n + c.plannedLessons, 0);
