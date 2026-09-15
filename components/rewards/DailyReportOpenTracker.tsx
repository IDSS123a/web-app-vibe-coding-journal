"use client";

/**
 * Gamification Wave 2: fires the `open_daily_report` reward once per
 * report (dedupeKey = report.id, same idempotency pattern
 * bookmark_article already uses with article ids), the first time a
 * user views it. Renders nothing -- app/dashboard/page.tsx is a server
 * component and can't call award() itself, so this is the smallest
 * possible client boundary for that one side effect, following the
 * same "small client component embedded in a server page" shape as
 * ArticleListWithBookmarks already uses.
 */

import { useEffect, useRef } from "react";
import { useRewards } from "./RewardsProvider";

export function DailyReportOpenTracker({ reportId }: { reportId: string }) {
  const { award } = useRewards();
  const firedFor = useRef<string | null>(null);

  useEffect(() => {
    if (firedFor.current === reportId) return;
    firedFor.current = reportId;
    void award("open_daily_report", reportId);
  }, [reportId, award]);

  return null;
}
