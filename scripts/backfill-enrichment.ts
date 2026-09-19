/**
 * Works the enrichment queue from a workstation instead of waiting for hourly runs.
 * Same code path as the cron (features/pipeline/enrichment.ts): triage, batched
 * relevance, then confidence / category / summary for the relevant ones.
 *
 *   npx tsx --env-file=.env.local scripts/backfill-enrichment.ts [minutes=10] [limit=150]
 *
 * Stops when the queue is empty, the time is up, or the AI quota is exhausted.
 */
import { ensureAIProviderInitialized } from "../lib/ai/init";
import { runEnrichment } from "../features/pipeline/enrichment";

const minutes = Number(process.argv[2] ?? 10);
const limit = Number(process.argv[3] ?? 150);
const endAt = Date.now() + minutes * 60_000;

async function main() {
  ensureAIProviderInitialized();
  let round = 0;
  const total = { scored: 0, summarized: 0, triage: 0, batchCalls: 0 };
  while (endAt - Date.now() > 45_000) {
    round++;
    const started = Date.now();
    const r = await runEnrichment({ limit, deadlineAt: Math.min(endAt, started + 200_000) });
    total.scored += r.articlesScored;
    total.summarized += r.articlesSummarized;
    total.triage += r.triageSkipped;
    total.batchCalls += r.batchCalls;
    console.log(
      `round ${round}: scored ${r.articlesScored}, summarized ${r.articlesSummarized}, triage ${r.triageSkipped}, batches ${r.batchCalls}, ` +
        `${Math.round((Date.now() - started) / 1000)}s, budgetStop=${r.stoppedForBudget}, aiUnavailable=${r.aiUnavailableCount}, errors=${r.errors.length}` +
        (r.errors[0] ? ` first: ${r.errors[0].slice(0, 120)}` : ""),
    );
    if (r.aiUnavailableCount > 0) {
      console.log("AI quota exhausted, stopping.");
      break;
    }
    if (r.articlesScored === 0 && r.articlesSummarized === 0 && !r.stoppedForBudget) {
      console.log("Queue empty (nothing left to score).");
      break;
    }
  }
  console.log("TOTAL", JSON.stringify(total));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
