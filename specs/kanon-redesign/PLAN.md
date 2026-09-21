# PLAN and TASKS: KANON visual system (PDL-074)

> **Status 2026-09-22: done.** Step 8 (the Director's review, then push) happened and the redesign is live (PDL-074).

Decisions are in PDL-074 (DECISION_LOG.md) and ANALYSIS.md section 4. The rule for every step: change typography, colour,
lines, radii, shadows, and the spacing needed to avoid clipping. Never routes, content hierarchy, structure, interactions, data.

- [x] 0. Decisions asked and recorded (fixed px scale wins over PDL-060; P-20 amended; Console only on admin; University is Campus)
- [x] 1. Foundation: five fonts through `next/font`, token block and Tailwind names (`app/globals.css`), spec breakpoints as named
      variants, safe-area on the body and `viewport-fit=cover`, layer scopes and building blocks (`app/kanon.css`)
- [x] 2. Swiss spine: navigation, credit line, home, login, register, set-password, welcome, dictionary, assistant, bookmarks,
      guards, pitch and banners, coin balance and toast
- [x] 3. Edition: Daily Report (dashboard and archive report) with the shared `ReportHeader`, the day colour, the story list in
      Source Serif 4 and Geist Mono, `MarkdownContent` following the layer
- [x] 4. Campus: Prompt School (overview, chapter, lesson, practice, level test, pop-up), University pages, celebration
- [x] 5. Console: the technical admin screens
- [x] 6. Validation tooling: `npm run audit:responsive` now has the spec's 31 viewports (`AUDIT_VIEWPORTS=spec` or a group),
      browser zoom (`AUDIT_ZOOM=1.25|2`), pixel ratio (`AUDIT_DPR`), reduced motion (`AUDIT_REDUCED=1`), a core page set
      (`AUDIT_PAGES=core`), and measured KANON checks (h1 in Unbounded, editorial in Source Serif, metadata in Geist Mono, nothing
      rounded or shadowed outside Campus, text under 10px)
- [x] 7. Validation: 31 spec viewports, zoom 125% and 200%, pixel ratio 3, reduced motion, unit tests, lint, typecheck, build, probe, smoke (all green, see PDL-074)
- [ ] 8. Director review of screenshots, then push

Not built on purpose: a real Scan mode (Read/Scan/Learn switch, Know/Test/Decide rows), which is a feature, not a style.
