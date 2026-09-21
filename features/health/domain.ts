/**
 * Daily health check (PDL-081): pure rules for "is the Journal still being produced". The job that calls it sends the admin one
 * e-mail when something is wrong and stays silent when everything is fine, so an e-mail always means something.
 */

export interface HealthInput {
  now: Date;
  /** When the newest Daily Report was last written, or null if there is none. */
  latestReportAt: Date | null;
  /** Articles collected in the last 24 hours. */
  articlesLast24h: number;
  /** Payment events flagged for a person to look at, in the last 24 hours. */
  ambiguousPaymentsLast24h: number;
}

export interface HealthProblem {
  code: "no_report" | "report_stale" | "no_articles" | "payments_need_attention";
  message: string;
}

/** A report is expected every day, so anything older than 36 hours means a whole day was missed. */
export const REPORT_STALE_AFTER_HOURS = 36;

export function evaluateHealth(input: HealthInput): HealthProblem[] {
  const problems: HealthProblem[] = [];

  if (!input.latestReportAt) {
    problems.push({ code: "no_report", message: "There is no Daily Report at all." });
  } else {
    const hours = (input.now.getTime() - input.latestReportAt.getTime()) / 3_600_000;
    if (hours > REPORT_STALE_AFTER_HOURS) {
      problems.push({ code: "report_stale", message: `The newest Daily Report was written ${Math.floor(hours)} hours ago. A report is expected every day.` });
    }
  }

  if (input.articlesLast24h === 0) {
    problems.push({ code: "no_articles", message: "No article was collected in the last 24 hours. The sources or the collection job may be failing." });
  }

  if (input.ambiguousPaymentsLast24h > 0) {
    problems.push({ code: "payments_need_attention", message: `${input.ambiguousPaymentsLast24h} payment event(s) in the last 24 hours need a person to look at them (Admin, Payments).` });
  }

  return problems;
}
