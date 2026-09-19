"use client";

/**
 * Gamification Wave 2: fires the `open_daily_report` reward once per
 * report (dedupeKey = report.id, same idempotency pattern
 * bookmark_article already uses with article ids), the first time a
 * user views it. Renders nothing; a tiny component so the one reward side
 * effect stays out of the dashboard page's rendering logic.
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
