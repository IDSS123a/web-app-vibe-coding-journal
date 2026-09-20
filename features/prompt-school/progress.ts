/**
 * Per-learner state of every published chapter: lessons done, practice score, and whether the chapter is
 * open. One function so the overview and every guarded route decide "open or locked" the same way (M-7).
 */
import { LEVEL_TEST_PASS_SCORE, chapterScore, isChapterComplete, isChapterUnlocked, isLevelTestUnlocked, isPracticeAvailable, type PromptSchoolLevel } from "./domain";
import { getBestScores, getCompletedLessonIds, getExerciseStubs, getLessonStubs, getLevelTestCounts, getLevelTestHistory, getPublishedChapters, type PsChapter } from "./repository";

export interface ChapterState {
  chapter: PsChapter;
  lessonIds: string[];
  exerciseIds: string[];
  lessonsDone: number;
  score: number;
  practiceAvailable: boolean;
  completed: boolean;
  started: boolean;
  unlocked: boolean;
  /** Title of the chapter that must be completed first, when this one is locked. */
  waitingFor: string | null;
}

export async function getChapterStates(userId: string): Promise<ChapterState[]> {
  const [chapters, lessons, exercises, done, best] = await Promise.all([
    getPublishedChapters(),
    getLessonStubs(),
    getExerciseStubs(),
    getCompletedLessonIds(userId),
    getBestScores(userId),
  ]);
  const ordered = [...chapters].sort((a, b) => a.order_index - b.order_index);
  const states: ChapterState[] = [];
  ordered.forEach((chapter, i) => {
    const lessonIds = lessons.filter((l) => l.chapter_id === chapter.id).map((l) => l.id);
    const exerciseIds = exercises.filter((e) => e.chapter_id === chapter.id).map((e) => e.id);
    const lessonsDone = lessonIds.filter((id) => done.has(id)).length;
    const score = chapterScore(best, exerciseIds);
    const practiceAvailable = isPracticeAvailable(lessonIds, done);
    const started = lessonsDone > 0 || exerciseIds.some((id) => best[id] !== undefined);
    const previous = states[i - 1];
    const unlocked = isChapterUnlocked(i, previous?.completed ?? false, started);
    states.push({
      chapter,
      lessonIds,
      exerciseIds,
      lessonsDone,
      score,
      practiceAvailable,
      completed: isChapterComplete(practiceAvailable, exerciseIds.length, score),
      started,
      unlocked,
      waitingFor: unlocked ? null : (previous?.chapter.title ?? null),
    });
  });
  return states;
}

export async function getChapterState(userId: string, slug: string): Promise<ChapterState | null> {
  return (await getChapterStates(userId)).find((s) => s.chapter.slug === slug) ?? null;
}

// ---------- level tests ----------

export interface LevelTestState {
  level: PromptSchoolLevel;
  questionCount: number;
  unlocked: boolean;
  /** Titles of the chapters of this level that are not complete yet, when the test is locked. */
  remainingChapters: string[];
  attempts: number;
  bestScore: number;
  passed: boolean;
  passScore: number;
}

export const PROMPT_SCHOOL_LEVEL_IDS: PromptSchoolLevel[] = ["beginner", "intermediate", "advanced"];

/** One function for the overview and the level test routes, so both decide "open or locked" the same way (M-7). */
export async function getLevelTestStates(userId: string): Promise<LevelTestState[]> {
  const [states, counts, history] = await Promise.all([getChapterStates(userId), getLevelTestCounts(), getLevelTestHistory(userId)]);
  return PROMPT_SCHOOL_LEVEL_IDS.map((level) => {
    const chapters = states.filter((s) => s.chapter.level === level);
    const h = history[level];
    return {
      level,
      questionCount: counts[level] ?? 0,
      unlocked: (counts[level] ?? 0) > 0 && isLevelTestUnlocked(chapters.map((c) => c.completed)),
      remainingChapters: chapters.filter((c) => !c.completed).map((c) => c.chapter.title),
      attempts: h?.attempts ?? 0,
      bestScore: h?.bestScore ?? 0,
      passed: h?.passed ?? false,
      passScore: LEVEL_TEST_PASS_SCORE,
    };
  });
}
