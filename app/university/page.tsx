/**
 * Vibe-Coding University — course list. Premium-only (PremiumGuard).
 * Client-rendered like the admin pages -- auth session lives in the
 * browser, so per-user progress has to be fetched client-side against
 * /api/university/courses with the session token.
 */

"use client";

import { useEffect, useState } from "react";
import { useSession } from "@/lib/auth/use-session";
import { PremiumGuard } from "@/components/PremiumGuard";
import type { Course } from "@/lib/validation/schemas";

type CourseWithProgress = Course & {
  publishedLessonCount: number;
  completedCount: number;
  status: "not_started" | "in_progress" | "completed";
  lessons: Array<{ id: string; slug: string; title: string; completed: boolean }>;
};

const STATUS_LABEL: Record<CourseWithProgress["status"], string> = {
  not_started: "Not Started",
  in_progress: "In Progress",
  completed: "Completed",
};

function CourseList() {
  const { token, loading: sessionLoading } = useSession();
  const [courses, setCourses] = useState<CourseWithProgress[]>([]);
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
      .then((d: { courses: CourseWithProgress[] }) => {
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
    <div className="min-h-screen bg-white px-4 py-12 md:px-12">
      <div className="mx-auto max-w-4xl">
        <div className="mb-12 border-b-4 border-black pb-8">
          <p className="mb-2 text-xs font-bold uppercase tracking-widest text-[#FF3000]">Premium</p>
          <h1 className="text-4xl font-black uppercase tracking-tighter text-black md:text-5xl">
            Vibe-Coding University
          </h1>
          <p className="mt-2 text-sm text-black">
            From scratch to expert level, one lesson at a time. New lessons added weekly as the
            article base grows.
          </p>
          <a
            href="/dictionary"
            className="mt-4 inline-block text-xs font-bold uppercase tracking-widest text-black underline decoration-2 underline-offset-4 transition-colors duration-150 ease-out hover:text-[#FF3000]"
          >
            Browse the Dictionary →
          </a>
        </div>

        {loading && <p className="text-sm text-black opacity-60">Loading…</p>}
        {error && <p className="border-2 border-[#FF3000] p-3 text-sm text-[#FF3000]">{error}</p>}

        <div className="space-y-12">
          {courses.map((course) => (
            <div key={course.id}>
              <div className="mb-4 flex items-center justify-between border-b-2 border-black pb-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-[#FF3000]">
                    {course.level}
                  </p>
                  <h2 className="text-2xl font-black uppercase tracking-tight text-black">
                    {course.title}
                  </h2>
                </div>
                <span className="border-2 border-black px-3 py-1 text-xs font-bold uppercase tracking-widest text-black">
                  {STATUS_LABEL[course.status]} · {course.completedCount}/{course.publishedLessonCount}
                </span>
              </div>
              <p className="text-sm text-black">{course.description}</p>
              {course.lessons.length === 0 ? (
                <p className="mt-3 text-xs italic text-black opacity-60">
                  Lessons for this level are being written — check back soon.
                </p>
              ) : (
                <ul className="mt-4 space-y-2">
                  {course.lessons.map((lesson) => (
                    <li key={lesson.id}>
                      <a
                        href={`/university/${course.slug}/${lesson.slug}`}
                        className="flex items-center gap-3 text-sm text-black transition-colors duration-150 ease-out hover:text-[#FF3000]"
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
