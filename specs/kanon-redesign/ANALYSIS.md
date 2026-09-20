# ANALYSIS: applying the KANON visual system (TYPOGRAPHY_SPEC.md) to the existing app

Date: 2026-09-21. Source read in full: `TYPOGRAPHY_SPEC.md` (834 lines, Director's attachment, "last reviewed 2026-09-21").
The original `index.html` / `styles.css` and the Replit mockup that the spec refers to were not available, only the
extracted spec, so where the spec and the mockup disagree the spec (which says the original CSS is the source of truth) wins.
Nothing in the app has been changed by this analysis.

## 1. What the specification asks for

One system with four layers and five font roles.

| Layer | Used for | Type | Boxes |
|---|---|---|---|
| Swiss spine | shell, navigation, account, archive, controls | Inter; Unbounded for display only; Geist Mono for technical labels | 1px black border, 1px `#E4E4E4` dividers, 0 radius, no shadow |
| Edition (Read) | Daily Report, stories | Unbounded date; Source Serif 4 titles and body (15px/1.6, 60 to 74ch); Geist Mono source rows | day bar 7px in the day colour, `#E4E4E4` separators, no radius, no shadow |
| Console (Scan) | dense scanning, scores, Know/Test/Decide | Geist Mono controls and scores, Inter row titles | `#0F1626` background, `#172038` panels, `#2A3658` lines |
| Campus (Learn) | learning cards, Prompt School | Figtree UI, Unbounded card headings | the ONLY layer with 14px radius and hard shadow `0 5px 0 #1F1A45`, 2px `#1F1A45` border |

Tokens: five font tokens, a colour set (Swiss, Console, Studio, seven day-ink colours), a type scale (display `clamp(38px, 6.4vw, 84px)`,
section `clamp(26px, 3.6vw, 44px)`, report date `clamp(46px, 8vw, 84px)`, body 15px, meta 10 to 11.5px, and so on), seven source
breakpoints (420, 640, 820, 1000, 1200, 1600, 1920 plus a short-landscape rule), and a validation matrix of 31 viewports, three
DPRs, three zoom levels, nine platform contexts, safe-area insets and reduced motion.

## 2. What the app is today (measured, not assumed)

- Stack: Next.js 15, Tailwind CSS v4 (utility classes written straight into 49 `.tsx` files, 7,542 lines), one stylesheet
  (`app/globals.css`, 268 lines) and one font, Inter 400/500/700/900 through `next/font/google`. There is no token file:
  colours are hard-coded (`#FF3000` 325 times, `#F2F2F2` 27, `#D4A017` 6), fonts are not tokenised.
- Look today (Swiss International retrofit, Constitution P-20): heavy structure, **`border-4` 114 times and `border-2` 75 times**,
  headings in Inter Black **uppercase** (`uppercase` 246, `tracking-*` 243, `font-black` 72), radius 0 and no shadows except the
  gamification layer (`rounded`/`shadow` only in CelebrationOverlay, CoinBalance, Mascot, and three admin pages).
- Sizes: `text-sm` 218 and `text-xs` 194 dominate; display sizes are `text-3xl` to `text-5xl`, never fluid `clamp()`.
- Layout: `max-w-4xl xl:max-w-5xl` content columns; a **fluid root font size** `clamp(16px, 8px + 0.56vw, 22px)` (PDL-060, "every view
  must fill the whole screen") so every rem-based size grows on large monitors. Tailwind breakpoints sm/md/lg/xl (640/768/1024/1280)
  are used 159 times, none of the spec's 420/820/1000/1200/1600/1920.
- Absent: safe-area insets (0 uses), serif anywhere (0), Geist Mono (8 uses of the generic `font-mono`), Figtree, Unbounded, day colours,
  any Console or Scan surface, any Read/Scan/Learn switch. Present and to be kept: reduced-motion rule, red focus ring, 44px targets,
  `min-h-dvh`, light-only colour scheme, `dark:` utilities switched off.
- The Daily Report is one card on `app/dashboard/page.tsx` and `MarkdownContent` (Inter, uppercase black headings), the archive reuses it.
- Prompt School (and the University's learning pages) are Swiss-styled today, with `border-4` cards.

## 3. Gap analysis

| Area | Today | Spec | Change needed |
|---|---|---|---|
| Fonts | Inter only | five roles, listed weights | load four more families, add tokens, map roles |
| Display headings | Inter 900 uppercase | Unbounded 800, sentence case, fluid scale, `max-width: 16ch/22ch` | new heading primitives, remove uppercase from headings |
| Editorial text | Inter `text-sm` | Source Serif 4 15px/1.6, 60 to 74ch, `#2A2A2A` | Daily Report, archive, story text, Prompt School lesson bodies (reading) |
| Metadata | Inter uppercase | Geist Mono 10 to 11.5px, 0.04 to 0.06em | dates, sources, scores, tags, coin/score labels |
| Lines | 4px and 2px black | 1px black, 1px `#E4E4E4` dividers | all Swiss boxes: about 190 class occurrences |
| Radius/shadow | 0, except gamification | 0 in Swiss/Edition/Console, 14px + hard shadow in Campus only | scope the existing rounded elements, and move Prompt School and University into Campus |
| Colour | hex inline | tokens (`--signal`, `--ink-soft`, `--rule`, console, studio, day) | centralise; replace 325 red literals by one token |
| Breakpoints | 640/768/1024/1280 | 420/640/820/1000/1200/1600/1920 | add the missing ones as named breakpoints without breaking the existing utilities |
| Widths | 4xl/5xl + fluid root | 1760 cap, 1840 above 1920, editorial 60 to 74ch | conflict, see 4.1 |
| Safe area | none | `env(safe-area-inset-*)` | add to the shell, fixed elements (pop-up, toast, nav) |
| Validation | 12 viewports, one zoom | 31 viewports, 3 DPR, 3 zoom levels, reduced motion, keyboard | extend `audit:responsive` |

## 4. Conflicts and ambiguities that need a decision

1. **Fixed px scale versus the fluid root (PDL-060).** The spec expresses every size in px and says "do not stretch the UI across ultrawide, cap
   content at 1840px, do not grow body text automatically from 1600px". PDL-060 (the Director's own earlier request) scales all rem sizes
   up to 22px and widens content on big monitors. They cannot both hold. The spec's own text is explicit, so the recommendation is to follow
   the spec (fixed px type scale, content caps) and record PDL-060 as superseded for typography.
2. **Constitution P-20 and DESIGN_NOTES.md** prescribe Inter-only, uppercase headings and 4px structure. The spec replaces these
   (Unbounded/serif/mono, 1px lines) and adds a rounded, shadowed Campus layer. This is an amendment of a standing constitutional rule,
   so it must be logged as a decision (M-16) and P-20 rewritten, not silently ignored.
3. **Scan/Console does not exist in the app.** There is no dense scoring view and no Read/Scan/Learn switch. The spec says to apply
   the rules to those components "if they exist". Building Scan would be a new feature (and the brief forbids changing structure).
   Proposal: apply the Console palette and mono typography only to technical surfaces that already exist (the admin review queue, hold-gate
   calibration, admin payments/users tables), and leave a real Scan mode for a later, separate feature.
4. **Day ink.** The spec needs a weekday colour for the report. It has no place today. Proposal: derive `--day` from the report date (already
   shown on the card) and use it for the 7px bar and importance badge only, keeping Swiss Red for the shell.
5. **Inside the spec:** editorial colour `#2A2A2A` versus `#1A1A1A`/`#333`; story title 19px versus 20px; body 15px versus mobile 12.5px
   (the spec sets a 12.5px floor for Read, and metadata as small as 9 to 10px, both below common accessibility guidance; kept as
   specified but flagged). 1px black borders reduce visibility of form fields for low vision users; the red focus ring stays. Unbounded is
   very wide: 38px display with 16ch max width can overflow at 280 to 320px, so headings need `overflow-wrap` and a tested minimum.
6. **Uppercase.** The spec says uppercase only for labels with tracking; the app uppercases nearly every heading. Removing it also changes
   visible strings (and the smoke test matches some text case-insensitively because CSS uppercase alters what a browser reports).
7. **Which layer are the University, Dictionary and Assistant?** Prompt School is Campus by the spec's own words. Proposal: University
   follows it (learning panels, quizzes); Dictionary, Assistant, Bookmarks, Archive, Welcome, Login and Admin stay Swiss spine;
   the Daily Report and its archive are Edition.

## 5. Risks

- The styling lives inside utility class strings in 49 files. A safe migration needs semantic building blocks (a small set of component
  classes and headings that use the tokens) so the change is one edit per pattern, not 300 scattered edits. This is the "centralise, do not
  duplicate" rule of the brief.
- Loading five families adds weight. Use `next/font` (the existing mechanism), only the listed weights, `display: swap`, and the variable
  files where they exist, then check LCP on the report page.
- Existing tests and tools depend on current wording, case and structure (smoke test, probe, audit measure text below 12px, tap targets
  below 44px; the spec's 9 to 10px metadata will trip the audit's minimum-size check and need a documented exception).
- The Prompt School's own guidance (44px targets, fences, focus) must survive the move to Campus's rounded look.

## 6. Recommended approach, in phases (each ends green and is pushed only after approval)

0. Decisions in section 4 recorded (PDL, P-20 amendment, DESIGN_NOTES).
1. Foundation: fonts through `next/font`, one token block (fonts, colours, scale, lines, radii, day colours, breakpoints), base rules
   (body, focus, reduced motion, safe area), layer scopes (`.layer-swiss`, `.layer-edition`, `.layer-console`, `.layer-campus`), and the
   shared building blocks (display and section headings, eyebrow, meta, button, box, divider, editorial text). No page changes yet.
2. Swiss spine: SiteNav, SiteCredit, buttons, forms, guards and banners, login/register/welcome/home, archive list, bookmarks,
   dictionary, assistant.
3. Edition: Daily Report page, archive report, MarkdownContent, story list, day bar and badges.
4. Campus: Prompt School (overview, chapter, lesson, practice, level test, pop-up), University, rewards UI (coins, toast, celebration).
5. Console for the technical admin surfaces.
6. Validation: extend the audit to the full 31-viewport matrix plus 125% and 200% zoom, DPR 1/2/3, reduced motion and keyboard; smoke,
   probe, unit, lint, typecheck and build; a before/after screenshot set for the Director.

Verification of the platform list (iOS Safari, Android Chrome, Safari, Edge, Firefox, iframe/webview) is limited here: this machine has
Chrome/Edge through Playwright only, so Safari and Firefox behaviour can be reasoned about but not observed. That will be stated in the report.
