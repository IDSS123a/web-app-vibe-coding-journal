# SPRINT_09 — Branding & Contact Form
# Vibe-Coding Journal
# Status: DRAFT — scope only, awaiting Director review. No code written.

---

## ⚠ Read this before anything else — the PDL-016 precondition

`DECISION_LOG.md` PDL-016, already live-verified, is directly relevant to
this sprint's Contact form item:

> Resend rejected delivery to `ai-hero-studio@outlook.com` (P-15's stated
> contact address) with a live `403 validation_error` —
> *"You can only send testing emails to your own email address
> (mulalic.davor@outlook.com)."* This is Resend's standard
> unverified-domain sandbox restriction. `REVIEW_QUEUE_EMAIL` stays
> `mulalic.davor@outlook.com` for now, the only address Resend will
> currently deliver to. Resolution requires verifying a domain with
> Resend — needs a Director decision on which domain and DNS access.

A Contact form that "delivers to `ai-hero-studio@outlook.com`" (P-15's
literal wording) **will silently fail every submission** under the
current unverified-domain restriction, exactly the same way it would
have for `REVIEW_QUEUE_EMAIL` — this sprint must not repeat that mistake.
See Decision 1 below; this needs resolving (or knowingly deferring, same
pattern as P-18 in Sprint 08) before Contact form code is written, not
discovered live afterward.

---

## Scope — IN

### 1. Public brand name wired in, currently entirely absent

P-15 states the public brand is **"Prompt Hero Studio™"**, used in
footer, About section, and any public credit line — with the internal
repo name ("Vibe-Coding Journal") explicitly not required to match.
Checked this session: the string "Prompt Hero Studio" does not appear
**anywhere** in the codebase yet, including the page `<title>`/metadata
in `app/layout.tsx`, which still reads "Vibe-Coding Journal — Daily
Intelligence Digest" (the internal name, in the one place a real visitor
sees first — the browser tab). Scope: wire the public brand name into
page metadata, and into a new footer (see item 2) and About section (see
item 3).

### 2. Footer component — does not exist yet

`app/layout.tsx` currently renders `{children}` directly inside `<body>`
with no footer at all. P-15 expects the brand name to appear "in footer
[...] and any public credit line," which presumes a footer exists.
Scope: a real footer component, rendered site-wide via the root layout,
carrying the brand name and (Decision 2, below) whatever else belongs
there.

### 3. About section/page — does not exist yet

P-15 references an "About section" as a place the brand name appears;
no About route or section exists in the current app structure. Scope:
create it — exact placement (dedicated `/about` route vs. a section on
the home page) and content are Decisions Needed (see below), not
invented here per M-4/M-13.

### 4. Favicon — provided, but never actually committed

P-15 says the favicon (`public/favicon.png`) is "already present on disk,
provided by the Director. Do not regenerate, replace, or modify without
explicit instruction." Checked this session: the file **is** present on
disk, but `git status` shows it as untracked — it has never been
committed. That means it has never actually been part of any deployed
build via the GitHub → Vercel pipeline; production may not be serving the
intended favicon at all. Scope: commit the existing file as-is (no
regeneration, no modification, per P-15's own explicit instruction) so
it's genuinely part of the deployed site.

### 5. Contact form (P-15's "single contact channel")

A Contact form delivering to the P-15 contact address, subject to the
PDL-016 precondition above being resolved or knowingly deferred first.
"Single contact channel" per P-15 — no separate support alias, no public
display of the admin email address elsewhere on the site.

---

## Scope — OUT (explicitly, do not touch this sprint)

- **Resend domain verification itself** — a Director-side action (DNS
  access, choosing which domain) referenced by PDL-016, not something
  this sprint can complete unilaterally; this sprint only needs a
  decision on how to proceed *given* the current restriction (see
  Decision 1).
- **Chatbot (P-19)** — unrelated, still far-future/deferred, unchanged
  from every prior sprint's exclusion.
- **Archive / Bookmarks pages** — still don't exist as routes; unrelated
  to branding/contact, not touched here.
- **Any further PayPal/payment work** — Sprint 08 is closed; nothing
  payment-related is in scope here.
- **Pricing, tier, or subscription logic changes** — unrelated to this
  sprint's subject.
- **Social media links, press kit, or any P-15 content beyond what's
  explicitly listed above** — if the Director wants these, they're a
  scope addition to be stated explicitly, not assumed.

---

## Decisions Needed (Director — not invented here, per M-4/M-13)

1. **Contact form delivery target, given PDL-016.** Options as this
   session sees them (not exhaustive, Director may have another):
   (a) send Contact form submissions to `mulalic.davor@outlook.com` for
   now, same workaround as `REVIEW_QUEUE_EMAIL`, with the Contact page
   itself still *displaying* `ai-hero-studio@outlook.com` as the stated
   channel (matches P-15's public-facing wording, differs only in the
   private delivery mechanism); (b) hold the Contact form itself until a
   domain is verified with Resend, so delivery target and displayed
   address always match; (c) something else. This session recommends (a)
   as the lower-friction option, matching the existing `REVIEW_QUEUE_EMAIL`
   precedent exactly, but this is the Director's call.
2. **About section placement and content.** Dedicated `/about` route, a
   section on the home page, or something else? What should it actually
   say about the project/brand? Not guessed here.
3. **Footer scope.** Beyond the brand name itself (P-15's explicit
   requirement), does the footer need anything else — a copyright line,
   a link to the About section/Contact form, a privacy policy link (none
   exists yet), social links? Keeping this minimal (brand name + Contact
   link only) unless the Director wants more.

---

## Constitution References

- **P-15** (Branding & Public Identity) — this sprint's entire subject.
- **PDL-016** (`DECISION_LOG.md`) — the live-verified Resend
  unverified-domain restriction directly blocking real delivery to the
  P-15 contact address; this sprint's explicit precondition, same
  pattern as P-18 was for Sprint 08.

---

## Definition of Done (draft — none of this is done yet)

- [ ] Decision 1 (Contact form delivery target, given PDL-016) explicitly
      answered and recorded before Contact form code is written.
- [ ] Decision 2 (About section placement/content) explicitly answered.
- [ ] Decision 3 (footer scope) explicitly answered.
- [ ] Public brand name "Prompt Hero Studio™" appears in page
      metadata/title, footer, and About section — live-verified in a
      real browser, not just code review.
- [ ] `public/favicon.png` committed as-is (no regeneration/modification)
      and confirmed live-verified as the actual served favicon in
      production.
- [ ] Contact form live-verified: a real submission actually reaches
      wherever Decision 1 says it should, not assumed to work because the
      code compiles.
- [ ] No public display of the admin email address anywhere except
      through the Contact form itself, per P-15's "single contact
      channel" rule.
- [ ] `tsc --noEmit` / `next build` clean.
- [ ] Naming-discipline audit clean on every new/changed file before
      commit.
- [ ] `corrections/SPRINT_09_LESSONS.md` and a handoff note created at
      close.

---

## Approval Record

*(Awaiting Director review — nothing approved yet, no code should be
written until this section is filled in.)*

---

## Handoff Note Template (fill at sprint end)

```
HANDOFF NOTE — Sprint 09
Completed: [...]
Not completed: [...]
Open risks: [...]
Technical debt: [...]
Next sprint: [...]
```

---

*Vibe-Coding Journal — Sprint 09 — governed by Commander v1.4.*
