# SPRINT_03 — Quality Engine, Classifier, Review Queue
# Vibe-Coding Journal
# Status: IN PROGRESS

---

## Scope — IN

### 1. Quality Engine (`features/pipeline/`)
   - **Confidence scoring:** Rule-based heuristic scoring (0-1) on each article
     - Source reliability (well-known sources get higher score)
     - Content freshness (recent publications > old)
     - Title/summary quality (length, readability)
     - Overall: confidence_score field (P-4) populated before Daily Report generation
   - **Domain logic:** scoreArticle(article) → confidence: 0-1
   - **Repository:** updateArticleConfidence(articleId, score)
   - **Threshold:** P-5 decision (min confidence to auto-publish) — logged in DECISION_LOG.md PDL-004

### 2. Hype-word Filter (P-3: Editorial Voice)
   - **Banned words:** "revolutionary", "game changer", "groundbreaking", "unprecedented", "disrupts", "changes everything"
   - **Domain logic:** `containsHypeWords(text: string) → boolean`
   - **Repository:** Flag articles with hype words (quality_flag = "clickbait"?) for review
   - **Enforcement:** Articles with hype words → review_status = held_for_review (P-6)

### 3. Classifier (Category Assignment)
   - **Categories:** Per project brief §5 (e.g., "Tool Release", "Research", "Best Practices", etc.)
   - **Domain logic:** classifyArticle(article) → category: string
   - **Repository:** updateArticleCategory(articleId, category)
   - **Default:** If classification confidence is low, leave category null (don't guess per M-4)

### 4. Review Queue (P-6: Quality Gate)
   - **Interrupt conditions (auto-publish is halted):**
     1. Confidence score below threshold (P-5 decision)
     2. Hype-word filter match (P-3)
     3. Daily sanity check fails (article count out of expected range — P-5)
     4. Source unreachable (already handled in Sprint 2)
   - **Response:** Create DailyReport with review_status = "held_for_review"
   - **Notification:** Send review queue alert (email via Resend)
   - **Previous report stays live:** Until approval or next cron run (P-6)

### 5. Email Notifications (Resend Integration)
   - **Trigger:** When Daily Report is held_for_review
   - **Template:** Simple alert: "Daily digest review required — [article count] articles, [issues]"
   - **Recipient:** Admin email (configured via environment variable REVIEW_QUEUE_EMAIL)
   - **Retry:** Resend handles retries; we just fire and log

### 6. Cron Orchestration Update (`/api/cron/daily-digest`)
   - **Add Phase 3:** Quality Engine
     - Score all non-duplicate articles
     - Flag hype words
     - Classify articles
   - **Add Phase 4:** Daily Report Generation
     - Aggregate articles by category/section
     - Generate markdown
     - Check sanity thresholds (P-5)
     - Decide: auto-publish or held_for_review
     - Send email if held_for_review
   - **Return:** Expanded response with all phases

---

## Scope — OUT (explicitly, do not build)

- Full ML-based classification (use simple rules for MVP)
- Advanced NLP for confidence scoring (use heuristics, not LLMs yet)
- Admin UI for review queue (endpoints only, no dashboard yet)
- Bulk approval/rejection (single approval per held report, manual)
- Personalization based on review queue feedback (Sprint 5+)
- Monthly self-audit (P-11) — Sprint 5+

---

## Constitution References

- **P-3** (Editorial Voice): Hype-word filter, no guessing on categories
- **P-5** (Quality Thresholds): Confidence threshold is a decision (PDL-004)
- **P-6** (Review Queue): Auto-publish is halted when conditions are met
- **P-1.1** (Fail Loudly): Low confidence → review, not silent drop
- **M-4** (Anti-Hallucination): Don't invent categories; null is OK
- **M-3** (Decision Hierarchy): Data Integrity (confidence) > Developer Convenience

---

## Definition of Done

Full Commander DONE_CHECKLIST.md applies, plus Sprint 03 specifics:

- [ ] `npx tsc --noEmit` zero errors
- [ ] Quality scoring tested with sample articles (confidence_score populated correctly)
- [ ] Hype-word filter tested (articles with banned words marked correctly)
- [ ] Classifier tested with sample articles (category assigned or null if low confidence)
- [ ] Review queue logic tested: articles below threshold → review_status = held_for_review
- [ ] Email notification sent successfully on test (curl cron with held_for_review scenario)
- [ ] Confidence threshold logged in DECISION_LOG.md PDL-004
- [ ] Daily Report generation produces valid markdown (tested with sample data)
- [ ] Cron endpoint returns: { success, phases: { ... Quality Engine ..., Daily Report ... } }
- [ ] `next build` successful
- [ ] corrections/SPRINT_03_LESSONS.md created with learnings
- [ ] No articles with category = null unless classification was uncertain (M-4 compliance)

---

## Handoff Note Template (fill at sprint end)

```
HANDOFF NOTE — Sprint 03
Completed: [...]
Not completed: [...]
Open risks: [...]
Technical debt: [...]
Next sprint: [recommended: Sprint 04 — Scheduler + Admin Panel]
```

---

*Vibe-Coding Journal — Sprint 03 — governed by Commander v1.2*
