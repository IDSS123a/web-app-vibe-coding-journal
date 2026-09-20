/**
 * The whole planned Prompt School course, mapped onto the Director's book "Mastering Prompt Engineering".
 * By her rule (2026-09-20) the School covers the COMPLETE book and skips no segment, so this outline has a
 * chapter for every part of the book: the foreword and eleven chapters, and the six appendices (A glossary,
 * B fifteen blueprints, C Markdown manual, D techniques quick reference, E further reading, F platforms).
 * `plannedLessons` is an estimate that grows or shrinks as each chapter is written from the source text; the
 * segment-by-segment coverage is tracked in book-map.ts and enforced by the content test.
 *
 * Every chapter is listed so the learner sees the road ahead; `available` chapters have authored lessons and
 * practice. Chapters are written in batches (specs/prompt-school/TASKS.md) and flipped to available when their
 * content is added to content/index.ts.
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
  { slug: "craft-of-prompting", level: "beginner", title: "The Prompt Engineer's Craft", summary: "The dawn of the prompt engineer, why prompting is a craft, thinking on paper first, thinking like an engineer, and learning by experiment.", bookRef: "Foreword and Chapter 1", plannedLessons: 5, available: true },
  { slug: "five-pillars", level: "beginner", title: "The Five Pillars", summary: "The anatomy of an effective prompt: context, instructions, examples, constraints and delimiters, ending in a full repair workshop.", bookRef: "Chapter 2", plannedLessons: 8, available: true },
  { slug: "foundational-techniques", level: "beginner", title: "Foundational Techniques", summary: "Zero-shot prompting, few-shot learning and gold star examples, with seven worked examples and a telegraph to recipe card workshop.", bookRef: "Chapter 3", plannedLessons: 5, available: true },
  { slug: "markdown-for-prompts", level: "beginner", title: "Formatting Prompts Clearly", summary: "The Markdown manual: headings, emphasis, lists, code, quotes, rules, tables and escaping, the carpenter's marking tools for prompts.", bookRef: "Appendix C", plannedLessons: 5, available: true },
  // Intermediate
  { slug: "reasoning-techniques", level: "intermediate", title: "Making the Model Think", summary: "Chain of thought, tree of thoughts and knowledge distillation for harder problems, with a full case study.", bookRef: "Chapter 4", plannedLessons: 6, available: true },
  { slug: "structure-and-protection", level: "intermediate", title: "Structuring and Protecting Interaction", summary: "Structured output with tags, delimiters as defensive boundaries, adversarial inputs, and a hands-on protection workshop.", bookRef: "Chapter 5", plannedLessons: 7, available: true },
  { slug: "code-and-research", level: "intermediate", title: "Prompting for Code and Research", summary: "Domain prompts: coding assistance at the forge, and research and analysis through the archivist's lens.", bookRef: "Chapter 6", plannedLessons: 7, available: true },
  { slug: "optimize-and-debug", level: "intermediate", title: "Optimizing and Debugging Prompts", summary: "Iterative refinement, A/B testing, tracing seven common failures to their cause, and a complete refinement workshop.", bookRef: "Chapter 7", plannedLessons: 7, available: true },
  // Advanced
  { slug: "ethics-and-bias", level: "advanced", title: "Ethics, Responsibility and Bias", summary: "Guiding principles for systems, detecting and reducing bias in prompts and outputs, and a bias audit workshop.", bookRef: "Chapter 8", plannedLessons: 5, available: true },
  { slug: "tools-and-multimodal", level: "advanced", title: "Tools, Multimodal and Co-Creation", summary: "Tool use and orchestration, multimodal prompting and collaborative markdown.", bookRef: "Chapter 9", plannedLessons: 5, available: true },
  { slug: "case-studies", level: "advanced", title: "Real-World Case Studies", summary: "A customer service chatbot and a scientific research assistant, worked through iteration by iteration.", bookRef: "Chapter 10", plannedLessons: 5, available: true },
  { slug: "the-future", level: "advanced", title: "The Future of Prompting", summary: "How systems learn preferences, emerging trends and possibilities, and the principles that stay.", bookRef: "Chapter 11", plannedLessons: 4, available: true },
  { slug: "blueprints-1", level: "advanced", title: "Blueprint Workshops, Part 1", summary: "Ready-made prompt designs: sales and marketing, warehouse dispatch, production flow, banking and lesson planning.", bookRef: "Appendix B, blueprints 1 to 5", plannedLessons: 6, available: true },
  { slug: "blueprints-2", level: "advanced", title: "Blueprint Workshops, Part 2", summary: "Retail replenishment, pharmaceutical market analysis, call center quality, personal finance and to-do management.", bookRef: "Appendix B, blueprints 6 to 10", plannedLessons: 5, available: true },
  { slug: "blueprints-3", level: "advanced", title: "Blueprint Workshops, Part 3", summary: "Language learning, laboratory tracking, fitness assessment, investigative journalism and scientific paper writing, and the closing on turning blueprints into bespoke tools.", bookRef: "Appendix B, blueprints 11 to 15", plannedLessons: 6, available: true },
  { slug: "techniques-reference", level: "advanced", title: "Techniques Quick Reference", summary: "Advanced prompt engineering methods at a glance: each technique with its scenario and how to apply it.", bookRef: "Appendix D", plannedLessons: 4, available: true },
  { slug: "glossary", level: "advanced", title: "The Prompt Engineer's Lexicon", summary: "The glossary from Alignment to Zero-Shot, learned in groups with practice.", bookRef: "Appendix A", plannedLessons: 7, available: true },
  { slug: "resources-and-platforms", level: "advanced", title: "Resources, Platforms and Tools", summary: "Further reading to continue the journey, and how to choose your prompting platform and workbench.", bookRef: "Appendices E and F", plannedLessons: 4, available: true },
];

export const PROMPT_SCHOOL_LEVELS: Array<{ id: PromptSchoolLevel; label: string; blurb: string }> = [
  { id: "beginner", label: "Beginner", blurb: "Write clear prompts that work the first time." },
  { id: "intermediate", label: "Intermediate", blurb: "Handle harder tasks, structure output and defend your prompts." },
  { id: "advanced", label: "Advanced", blurb: "Design responsible, tool-using prompts, work through real projects and keep the full reference library." },
];

export const PLANNED_LESSON_TOTAL = PROMPT_SCHOOL_OUTLINE.reduce((n, c) => n + c.plannedLessons, 0);
