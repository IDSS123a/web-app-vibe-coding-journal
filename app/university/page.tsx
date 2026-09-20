/**
 * Vibe-Coding University — course list, now chapter-gated (2026-09-15
 * amendment). Premium-only (PremiumGuard). Client-rendered like the
 * admin pages -- auth session lives in the browser, so per-user
 * progress has to be fetched client-side against
 * /api/university/courses with the session token.
 */

"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSession } from "@/lib/auth/use-session";
import { PremiumGuard } from "@/components/PremiumGuard";
import type { Course } from "@/lib/validation/schemas";

interface ChapterWithState {
  id: string;
  slug: string;
  title: string;
  order_index: number;
  unlocked: boolean;
  quizAvailable: boolean;
  quizPassed: boolean;
  lessons: Array<{ id: string; slug: string; title: string; completed: boolean }>;
}

type CourseWithChapters = Course & {
  chapters: ChapterWithState[];
  levelTestUnlocked: boolean;
  levelTestPassed: boolean;
  supplementaryLessons: Array<{ id: string; slug: string; title: string; completed: boolean }>;
};

function CourseList() {
  const { token, loading: sessionLoading } = useSession();
  const [courses, setCourses] = useState<CourseWithChapters[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (sessionLoading || !token) return;
    let active = true;
    fetch("/api/university/courses", { headers: { authorization: `Bearer ${token}` } })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((d: { courses: CourseWithChapters[] }) => {
        if (active) setCourses(d.courses);
      })
      .catch(() => {
        if (active) setError("Failed to load courses.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [token, sessionLoading]);

  return (
    <div className="min-h-dvh bg-white px-4 py-12 md:px-12">
      <div className="mx-auto max-w-4xl xl:max-w-5xl">
        <div className="mb-12 border-b-4 border-black pb-8">
          <p className="mb-2 text-xs font-bold uppercase tracking-widest text-[#FF3000]">Premium</p>
          <h1 className="break-words text-4xl font-black uppercase tracking-tighter text-black md:text-5xl">
            Vibe-Coding University - <span lang="grc" className="normal-case">Στοά</span>
          </h1>
          <p className="mt-2 text-sm text-black">
            25 core lessons per level across 5 chapters. Pass each chapter&apos;s quiz to unlock the
            next, then clear the level final test.
          </p>
          <Link
            href="/dictionary"
            className="mt-4 inline-flex min-h-11 items-center text-xs font-bold uppercase tracking-widest text-black underline decoration-2 underline-offset-4 transition-colors duration-150 ease-out hover:text-[#FF3000]"
          >
            Browse the Dictionary →
          </Link>
        </div>

        {loading && <p className="text-sm text-black opacity-60">Loading…</p>}
        {error && <p className="border-2 border-[#FF3000] p-3 text-sm text-[#FF3000]">{error}</p>}

        <div className="space-y-16">
          {courses.map((course) => (
            <div key={course.id}>
              <div className="mb-6 flex items-center justify-between border-b-2 border-black pb-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-[#FF3000]">
                    {course.level}
                  </p>
                  <h2 className="text-2xl font-black uppercase tracking-tight text-black">
                    {course.title}
                  </h2>
                </div>
                {course.levelTestUnlocked && (
                  <a
                    href={`/university/level-test/${course.level}`}
                    className={`border-4 px-4 py-2 text-xs font-bold uppercase tracking-widest transition-colors duration-150 ease-out ${
                      course.levelTestPassed
                        ? "border-black text-black"
                        : "border-black bg-black text-white hover:border-[#FF3000] hover:bg-[#FF3000]"
                    }`}
                  >
                    {course.levelTestPassed ? "Level Test: Passed ✓" : "Take Level Final Test"}
                  </a>
                )}
              </div>
              <p className="mb-6 text-sm text-black">{course.description}</p>

              <div className="space-y-4">
                {course.chapters.map((chapter) => (
                  <div
                    key={chapter.id}
                    className={`border-4 p-6 ${chapter.unlocked ? "border-black" : "border-black opacity-50"}`}
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-black uppercase tracking-tight text-black">
                        {chapter.order_index}. {chapter.title}
                      </h3>
                      {!chapter.unlocked && (
                        <span className="text-xs font-bold uppercase tracking-widest text-black">🔒 Locked</span>
                      )}
                      {chapter.quizPassed && (
                        <span className="border-2 border-black px-2 py-0.5 text-xs font-bold uppercase tracking-widest text-black">
                          Quiz Passed ✓
                        </span>
                      )}
                    </div>
                    {chapter.unlocked && (
                      <>
                        <ul className="mt-4 space-y-2">
                          {chapter.lessons.map((lesson) => (
                            <li key={lesson.id}>
                              <a
                                href={`/university/${course.slug}/${lesson.slug}`}
                                className="flex min-h-11 items-center gap-3 text-sm text-black transition-colors duration-150 ease-out hover:text-[#FF3000]"
                              >
                                <span
                                  className={`inline-block h-3 w-3 shrink-0 border-2 border-black ${lesson.completed ? "bg-black" : "bg-white"}`}
                                  aria-hidden
                                />
                                {lesson.title}
                              </a>
                            </li>
                          ))}
                        </ul>
                        {chapter.quizAvailable && !chapter.quizPassed && (
                          <a
                            href={`/university/chapters/${chapter.id}/quiz`}
                            className="mt-4 inline-flex h-11 items-center justify-center border-4 border-black bg-black px-4 text-xs font-bold uppercase tracking-widest text-white transition-colors duration-150 ease-out hover:border-[#FF3000] hover:bg-[#FF3000]"
                          >
                            Take Chapter Quiz
                          </a>
                        )}
                      </>
                    )}
                  </div>
                ))}
              </div>

              {course.supplementaryLessons.length > 0 && (
                <div className="mt-8">
                  <p className="mb-3 text-xs font-bold uppercase tracking-widest text-[#FF3000]">
                    Supplementary
                  </p>
                  <ul className="space-y-2">
                    {course.supplementaryLessons.map((lesson) => (
                      <li key={lesson.id}>
                        <a
                          href={`/university/${course.slug}/${lesson.slug}`}
                          className="flex min-h-11 items-center gap-3 text-sm text-black transition-colors duration-150 ease-out hover:text-[#FF3000]"
                        >
                          <span
                            className={`inline-block h-3 w-3 shrink-0 border-2 border-black ${lesson.completed ? "bg-black" : "bg-white"}`}
                            aria-hidden
                          />
                          {lesson.title}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function UniversityPage() {
  return (
    <PremiumGuard>
      <CourseList />
    </PremiumGuard>
  );
}
