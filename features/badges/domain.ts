/**
 * Badges (PDL-075): a small, fixed set of milestones that are awarded once, on the server, next to the coins.
 * Pure catalogue and mapping functions only; storage is in repository.ts, orchestration in award.ts.
 * A badge never pays coins itself (the step that earned it already did), it is recognition, not currency.
 */

export type BadgeGroup = "start" | "prompt-school" | "university" | "habit";

export interface Badge {
  id: string;
  title: string;
  description: string;
  group: BadgeGroup;
}

export const BADGES: readonly Badge[] = [
  { id: "first-lesson", title: "First lesson", description: "Finished your first lesson, in Prompt School or the University.", group: "start" },
  { id: "first-chapter", title: "First chapter", description: "Completed your first chapter: passed a chapter's practice or a chapter quiz.", group: "start" },
  { id: "ps-beginner", title: "Prompter", description: "Passed the Prompt School beginner level test.", group: "prompt-school" },
  { id: "ps-intermediate", title: "Prompt engineer", description: "Passed the Prompt School intermediate level test.", group: "prompt-school" },
  { id: "ps-advanced", title: "Prompt architect", description: "Passed the Prompt School advanced level test.", group: "prompt-school" },
  { id: "ps-graduate", title: "Prompt School graduate", description: "Completed every chapter of Prompt School, from the foreword to the appendices.", group: "prompt-school" },
  { id: "uni-beginner", title: "Vibe-coder", description: "Passed the University beginner level test.", group: "university" },
  { id: "uni-intermediate", title: "Builder", description: "Passed the University intermediate level test.", group: "university" },
  { id: "uni-expert", title: "Expert", description: "Passed the University expert level test.", group: "university" },
  { id: "streak-7", title: "Seven days running", description: "Opened the Daily Report seven days in a row.", group: "habit" },
  { id: "streak-30", title: "Thirty days running", description: "Opened the Daily Report thirty days in a row.", group: "habit" },
  { id: "book-finder", title: "Book finder", description: "Found the book behind Prompt School.", group: "habit" },
];

const BY_ID = new Map(BADGES.map((b) => [b.id, b]));

export function badgeById(id: string): Badge | undefined {
  return BY_ID.get(id);
}

export type LevelName = "beginner" | "intermediate" | "advanced" | "expert";

/** The badge for passing a Prompt School level test. */
export function promptSchoolLevelBadge(level: string): string | null {
  return level === "beginner" || level === "intermediate" || level === "advanced" ? `ps-${level}` : null;
}

/** The badge for passing a University level test (its top level is called expert). */
export function universityLevelBadge(level: string): string | null {
  return level === "beginner" || level === "intermediate" || level === "expert" ? `uni-${level}` : null;
}

/** The badge for a streak milestone, when there is one (only 7 and 30 days have a badge). */
export function streakBadge(milestone: number | null): string | null {
  return milestone === 7 ? "streak-7" : milestone === 30 ? "streak-30" : null;
}
