# Vibe-Coding Journal — Typography Specification

**Source:** original design document  
`.conversation/attached_assets/index_1789942393931.html`  
`.conversation/attached_assets/styles_1789942393931.css`

**Status:** extracted source specification  
**Product direction:** The Daily Signal / Vibe-Coding Journal  
**Last reviewed:** 2026-09-21

## 1. Typographic direction

The original documents define a unified system with three deliberately
different reading depths:

1. **Swiss spine** — clear UI, navigation, structure, controls and product
   chrome.
2. **Edition layer** — calm daily reading, serif editorial copy and a dated
   ritual.
3. **Console / Campus layers** — monospace density for expert scanning and a
   distinct UI display treatment for learning and progression.

The type system is not a collection of interchangeable styles. Each family
has a defined job:

- **Inter** carries the main product interface and neutral explanatory copy.
- **Source Serif 4** carries editorial reading and longer-form text.
- **Unbounded** carries display hierarchy, dates, large numeric values and
  strong section anchors.
- **Figtree** carries the playful learning/studio layer.
- **Geist Mono** carries metadata, source labels, scores, keyboard hints and
  technical scanning.

## 2. Font families

### 2.1 Loading contract

The source document loads these Google Fonts:

```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Source+Serif+4:opsz,wght@8..60,400;8..60,600;8..60,700&family=Unbounded:wght@400;600;700;800&family=Figtree:wght@400;500;600;700;800&family=Geist+Mono:wght@400;500;600&display=swap');
```

### 2.2 Role tokens

```css
:root {
  --font-sans: 'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif;
  --font-serif: 'Source Serif 4', Georgia, 'Times New Roman', serif;
  --font-display: 'Unbounded', var(--font-sans);
  --font-ui: 'Figtree', var(--font-sans);
  --font-mono: 'Geist Mono', ui-monospace, 'SF Mono', Menlo, monospace;
}
```

| Token | Family | Available weights | Primary responsibility |
|---|---|---:|---|
| `--font-sans` | Inter | 400, 500, 600, 700, 800, 900 | Default UI, navigation, controls, neutral copy |
| `--font-serif` | Source Serif 4 | 400, 600, 700 | Editorial copy, article titles, ledes and reading text |
| `--font-display` | Unbounded | 400, 600, 700, 800 | Display headings, dates, scores and large values |
| `--font-ui` | Figtree | 400, 500, 600, 700, 800 | Campus/studio learning UI and progression surfaces |
| `--font-mono` | Geist Mono | 400, 500, 600 | Metadata, technical labels, keyboard hints and scan data |

### 2.3 Fallback rules

- Keep the declared fallback stack in the source tokens.
- Do not replace `Source Serif 4` with a generic sans-serif.
- Do not use `Unbounded` for paragraphs or long-form reading.
- Do not use `Geist Mono` for editorial prose.
- If a font fails to load, preserve the role and fallback stack rather than
  assigning a different product font ad hoc.

## 3. Global rules

```css
body {
  font-family: var(--font-sans);
  color: var(--ink);
  line-height: 1.55;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-rendering: optimizeLegibility;
}

button {
  font-family: inherit;
}

.mono {
  font-family: var(--font-mono);
}

.serif {
  font-family: var(--font-serif);
}
```

### 3.1 General usage rules

- Use `Inter` as the default until a component has a documented editorial,
  display, mono or studio role.
- Use uppercase sparingly and only with increased tracking.
- Use negative tracking only on large display text and editorial titles.
- Keep editorial measures constrained to approximately `44ch–74ch`.
- Use numeric and technical metadata in `Geist Mono` so values align and can
  be scanned quickly.
- Use `font-style: normal` for interface labels unless an explicit editorial
  accent is required.
- The source system uses a mechanical Swiss hierarchy: type contrast comes
  from family, weight, scale and tracking rather than shadows or decorative
  effects.

## 4. Core type scale

The original document uses a fluid scale for the main display roles and
fixed, compact sizes for UI and metadata.

| Role | Size | Line-height | Weight | Family | Tracking |
|---|---:|---:|---:|---|---:|
| Hero display | `clamp(38px, 6.4vw, 84px)` | `0.98` | 800 | Unbounded | `-0.03em` |
| Hero display, ultrawide | `clamp(72px, 5vw, 104px)` | `0.98` | 800 | Unbounded | `-0.03em` |
| Section display | `clamp(26px, 3.6vw, 44px)` | `1.02` | 800 | Unbounded | `-0.02em` |
| Section display, small phone | `clamp(22px, 7vw, 30px)` | `1.02` | 800 | Unbounded | `-0.02em` |
| Hero/editorial lede | `clamp(17px, 2vw, 21px)` | `1.5` | 400 | Source Serif 4 | default |
| Display numeric value | `22px` | normal | 800 | Unbounded | default |
| Large report date | `clamp(46px, 8vw, 84px)` | `0.86` | 800 | Unbounded | `-0.05em` |
| Report date, compact read | `clamp(40px, 7vw, 72px)` | `0.9` | 800 | Unbounded | `-0.04em` |
| Large mobile date | `40px` | `0.9` | 800 | Unbounded | `-0.04em` |
| Primary editorial title | `20px` | `1.22` | 700 | Source Serif 4 | `-0.01em` |
| Secondary editorial title | `19px` | `1.25` | 700 | Source Serif 4 | `-0.01em` |
| Section/card title | `21px` | `1.1` | 800 | Unbounded | `-0.01em` |
| Standard body | `15px` | `1.6–1.62` | 400 | Source Serif 4 | default |
| Section body | `14.5px` | `1.6` | 400 | Inter | default |
| UI body | `14px` | `1.55` | 400 | Inter | default |
| Kicker / intro body | `16px` | `1.55` | 400 | Source Serif 4 | default |
| Purpose statement | `17px` | `1.4` | 600 | Source Serif 4 | default |
| Small body / supporting copy | `13.5px` | `1.55` | 400–500 | Inter or Figtree | default |
| Compact mobile body | `12.5–13px` | `1.5` | 400 | Source Serif 4 | default |
| Navigation | `12–12.5px` | normal | 600 | Inter | default |
| Metadata | `10–12px` | normal | 500–700 | Geist Mono or Inter | `0.04–0.18em` |

## 5. Swiss spine specification

The Swiss spine is the default for the product shell and should remain
visually stable across pages.

### 5.1 Navigation and document chrome

| Element | CSS typography |
|---|---|
| Brand wordmark | Inter, 800, inherited size, `letter-spacing: -0.02em` |
| Brand mark | Unbounded, 800, `13px` |
| Brand sublabel | Inter, 500, `10px/1`, uppercase, `letter-spacing: 0.14em` |
| Primary document navigation | Inter, 600, `12.5px` |
| Compact navigation | Inter, 600, `12px` |
| Buttons | Inter, 700, `14px` |
| Trust/support labels | Inter, 500, `12px` |

### 5.2 Labels and metadata

Use `Geist Mono` for source-like or system-like labels:

| Element | CSS typography |
|---|---|
| Section number | Geist Mono, 800, `13px`, Swiss Red |
| Eyebrow | Inter, 600, `11px/1`, uppercase, `letter-spacing: 0.18em` |
| Small section label | Geist Mono, 700, `11px`, uppercase, `letter-spacing: 0.12em` |
| Source reference | Inter, 600, `11px`, uppercase, `letter-spacing: 0.06em` |
| Keyboard hint | Geist Mono, 600, `11px` |
| Technical code label | Geist Mono, 600, `11px` |
| Small status/score label | Geist Mono, 500–700, `9–12px` |

### 5.3 Hero

```css
.hero h1 {
  font: 800 clamp(38px, 6.4vw, 84px) / 0.98 var(--font-display);
  letter-spacing: -0.03em;
}

.hero .lede {
  font: 400 clamp(17px, 2vw, 21px) / 1.5 var(--font-serif);
}

.hero .meta b {
  font: 800 22px var(--font-display);
}

.hero .meta span {
  font: 500 11px var(--font-sans);
  letter-spacing: 0.1em;
  text-transform: uppercase;
}
```

## 6. Edition / Read specification

The Edition layer is the primary reading experience. It uses display type for
the date and serif type for the actual editorial material.

### 6.1 Daily Report header

| Element | CSS typography |
|---|---|
| Report date | Unbounded, 800, `clamp(46px, 8vw, 84px)`, `line-height: 0.86`, `letter-spacing: -0.05em` |
| Report date label | Inter, 600, `13px`, uppercase, `letter-spacing: 0.18em` |
| Report date metadata | Geist Mono, 600, `11px`, `letter-spacing: 0.06em` |
| Report intro kicker | Inter, 700, `12px`, uppercase, `letter-spacing: 0.12em` |
| Report intro copy | Source Serif 4, 400, `16px/1.55` |
| Compact Read date | Unbounded, 800, `clamp(40px, 7vw, 72px)`, `line-height: 0.9`, `letter-spacing: -0.04em` |
| Compact date label | Inter, 600, `13px`, uppercase, `letter-spacing: 0.16em` |
| Compact kicker | Source Serif 4, 400, `17px/1.5` |

### 6.2 Stories and editorial content

| Element | CSS typography |
|---|---|
| Story section heading | Inter, 700, `12px`, uppercase, `letter-spacing: 0.14em` |
| Story title | Source Serif 4, 700, `19px/1.25`, `letter-spacing: -0.01em` |
| Daily Report article title | Source Serif 4, 700, `20px/1.22`, `letter-spacing: -0.01em` |
| Story body | Source Serif 4, 400, `15px/1.6` |
| Daily Report body | Source Serif 4, 400, `15px/1.62` |
| Mobile story title | Source Serif 4, 700, `15px/1.25` |
| Mobile story body | Source Serif 4, 400, `12.5px/1.5` |
| Source line | Geist Mono, 500, `10–11.5px` |
| Claim badge | Inter, 600, `10.5px`, `letter-spacing: 0.04em` |
| Importance badge | Geist Mono, 700, `9–11px` |

Editorial rules:

- Source Serif 4 is reserved for reading content, not controls.
- Keep story titles short and allow the serif face to carry the hierarchy.
- Use `max-width: 74ch` for Daily Report article content.
- Use `max-width: 60ch` for the report kicker.
- Use `max-width: 44ch` for the right-side report introduction.
- Do not add tracking to normal editorial paragraphs.

## 7. Console / Scan specification

Scan is the dense view of the same content, not a separate content model.
Typography changes from editorial serif to compact sans and mono.

| Element | CSS typography |
|---|---|
| Console title | Geist Mono, 600, `13px` |
| Keyboard controls | Geist Mono, 500, `11px` |
| Funnel row | Geist Mono, 500, `11.5px` |
| Score | Geist Mono, 700, `15px` |
| Score label | Geist Mono, 500, `9px`, `letter-spacing: 0.08em` |
| Scan item title | Inter, 600, `15px/1.3` |
| Know/Test/Decide copy | Inter, 400, `13px/1.5` |
| Know/Test/Decide emphasis | Inter, 600 |
| Tags | Geist Mono, 500, `10px` |
| Mobile scan score | Unbounded, 800, `18px/1` |
| Mobile scan title | Geist Mono, 600, `12px/1.3` |
| Mobile scan body | Geist Mono, 500, `10.5px/1.4` |

Console rule: density comes from a compact mono/sans typographic system,
not from reducing editorial copy until it becomes illegible.

## 8. Campus / Learn specification

Campus is the intentional exception to the Swiss/Edition baseline. It uses
Figtree for friendly UI copy and Unbounded for strong learning headings.

| Element | CSS typography |
|---|---|
| Campus shell | Figtree |
| Campus label | Figtree, 700, `11px`, uppercase, `letter-spacing: 0.12em` |
| Campus heading | Unbounded, 800, `clamp(26px, 3.6vw, 40px)`, `line-height: 1` |
| Campus intro | Figtree, 500, `15px/1.55` |
| Progress chip | Figtree, 700, `12.5px` |
| Learn card label | Figtree, 700, `11px`, uppercase, `letter-spacing: 0.1em` |
| Learn card title | Unbounded, 800, `18px/1.15`, `letter-spacing: -0.01em` |
| Learn card body | Figtree, 500, `13.5px/1.55` |
| Learn CTA | Figtree, 700, `13px` |
| Lesson title | Unbounded, 800, `19px/1.15` |
| Exercise question | Figtree, 600, `14px/1.45` |
| Exercise option | Figtree, 600, `13px` |
| Progress caption | Figtree, 600, `11.5px` |
| Completion headline | Unbounded, 800, `22px`, uppercase |

Campus rule: Figtree gives the learning layer its approachable tone, but
Unbounded remains the bridge to the main product hierarchy.

## 9. Mobile specification

The source document keeps the same families and roles on mobile. It changes
scale and measure rather than introducing a second mobile type system.

### 9.1 Breakpoint behavior

| Breakpoint | Typography behavior |
|---|---|
| `> 1920px` | Cap the content width at `1840px`; hero display `72–104px`; section display `40–52px` |
| `1200–1920px` | Use fluid desktop values; Daily Report can use two story columns |
| `≤ 1200px` | Navigation links reduce to `12px` |
| `≤ 1000px` | Collapse multi-column reading layouts; section copy loses auto-alignment |
| `≤ 820px` | Hide document navigation; scan rows become two-column |
| `≤ 640px` | Reduce report padding and stack header/content regions |
| `≤ 420px` | Hero display `clamp(30px, 9vw, 40px)`; section display `clamp(22px, 7vw, 30px)` |

### 9.2 Mobile-specific values

```css
@media (max-width: 420px) {
  .hero h1 {
    font-size: clamp(30px, 9vw, 40px);
  }

  .sec-head h2 {
    font-size: clamp(22px, 7vw, 30px);
  }
}
```

Mobile component values from the original document:

- Mobile report date: `40px/0.9`, Unbounded 800, `letter-spacing: -0.04em`.
- Mobile date label: `10px`, Inter 600, uppercase, `letter-spacing: 0.14em`.
- Mobile kicker: `13px/1.5`, Source Serif 4 400.
- Mobile story title: `15px/1.25`, Source Serif 4 700.
- Mobile story body: `12.5px/1.5`, Source Serif 4 400.
- Mobile source: `10px`, Geist Mono 500.
- Mobile claim badge: `9px`, Inter 600, `letter-spacing: 0.03em`.
- Mobile segmented control: `11px`, Inter 600.

## 10. Implementation tokens

This is the minimum token set to carry the original typography into a
production component:

```css
:root {
  --type-sans: 'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif;
  --type-serif: 'Source Serif 4', Georgia, 'Times New Roman', serif;
  --type-display: 'Unbounded', var(--type-sans);
  --type-ui: 'Figtree', var(--type-sans);
  --type-mono: 'Geist Mono', ui-monospace, 'SF Mono', Menlo, monospace;

  --text-display-xl: clamp(38px, 6.4vw, 84px);
  --text-display-lg: clamp(26px, 3.6vw, 44px);
  --text-report-date: clamp(46px, 8vw, 84px);
  --text-display-mobile: clamp(30px, 9vw, 40px);
  --text-section-mobile: clamp(22px, 7vw, 30px);
  --text-body-lg: 17px;
  --text-body: 15px;
  --text-body-sm: 13.5px;
  --text-ui: 12.5px;
  --text-meta: 11px;
  --text-micro: 10px;
}
```

Recommended utility classes:

```css
.type-display {
  font-family: var(--type-display);
  font-weight: 800;
  letter-spacing: -0.03em;
}

.type-editorial {
  font-family: var(--type-serif);
  font-weight: 400;
  line-height: 1.6;
}

.type-ui {
  font-family: var(--type-sans);
  font-weight: 500;
}

.type-meta {
  font-family: var(--type-mono);
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.06em;
}
```

## 11. Do / do not

### Do

- Keep Inter as the stable Swiss interface voice.
- Use Source Serif 4 to make the daily report feel like an edition.
- Use Unbounded for hierarchy that needs to be seen before it is read.
- Use Geist Mono for source, score, keyboard and technical metadata.
- Use Figtree only where the learning/studio layer needs a warmer interface
  voice.
- Preserve the original line-height values when porting components.
- Test the type at `420px`, `820px`, `1200px` and `1920px` widths.

### Do not

- Do not use one font family for the whole product.
- Do not turn all labels into uppercase without adding tracking.
- Do not use Unbounded in body copy.
- Do not use Source Serif 4 for dense console rows.
- Do not mix the Campus rounded-card treatment into the Swiss spine.
- Do not tighten editorial paragraphs with negative tracking.
- Do not add a new display font without updating this role map.

## 12. Source mapping

The values in this specification are extracted from these source sections:

- `TOKENS`: font imports and family variables.
- `BASE`: body family, base line-height and rendering.
- `DOC CHROME`: brand and navigation.
- `HERO`: main display and lead paragraph.
- `SECTION SHELL` and `CONCEPT / PILLARS`: section hierarchy and labels.
- `DEPTH DIAL`: interaction controls and metadata.
- `READ pane`: editorial date, kicker, story title and body.
- `SCAN pane`: mono/sans dense workstation type.
- `LEARN pane`: Figtree/Unbounded studio hierarchy.
- `LANDING MOCKUP`: landing headline, buttons and assistant UI.
- `DAILY REPORT MOCKUP`: production-oriented report typography.
- `MOBILE MOCKUP`: mobile read, scan and learn typography.
- `TOKEN TABLE`, `GOVERNANCE` and responsive media queries: supporting
  documentation and breakpoint adjustments.

When the mockup and the original document differ, this document treats the
original CSS as the source of truth and the mockup as an implementation that
should be brought back into alignment.

## 13. Quick visual style inventory

Ovo je kratka verzija za direktnu primjenu u dizajnu i mockupu.

### 13.1 Naslov

- **Font:** Unbounded
- **Weight:** 800
- **Size:** `clamp(38px, 6.4vw, 84px)`
- **Line-height:** `0.98`
- **Letter-spacing:** `-0.03em`
- **Boja:** `#000000`
- **Akcent:** Swiss Red `#FF3000`
- **Maksimalna širina:** `16ch`
- **Napomena:** naslov može imati jednu riječ u Swiss Redu, ali ne uvoditi
  dodatne brand boje.

### 13.2 Podnaslov / uvodni tekst

- **Font:** Source Serif 4
- **Weight:** 400
- **Size:** `clamp(17px, 2vw, 21px)`
- **Line-height:** `1.5`
- **Boja:** `#1A1A1A`
- **Maksimalna širina:** `60ch`
- **Napomena:** koristi se za objašnjenje ispod naslova i uvod u dnevni
  report; ne koristiti Unbounded za ovaj sloj.

### 13.3 Naslov sekcije

- **Font:** Unbounded
- **Weight:** 800
- **Size:** `clamp(26px, 3.6vw, 44px)`
- **Line-height:** `1.02`
- **Letter-spacing:** `-0.02em`
- **Boja:** `#000000`
- **Maksimalna širina:** `22ch`

### 13.4 Naslov članka / story naslov

- **Font:** Source Serif 4
- **Weight:** 700
- **Size:** `19px` za Read story, `20px` za Daily Report članak
- **Line-height:** `1.25` / `1.22`
- **Letter-spacing:** `-0.01em`
- **Boja:** `#000000`
- **Maksimalna širina:** do `74ch`
- **Mobile:** `15px/1.25`

### 13.5 Body tekst

- **Font:** Source Serif 4 za editorial sadržaj; Inter za neutralni UI copy
- **Weight:** 400
- **Size:** `15px`
- **Line-height:** `1.6–1.62`
- **Boja:** `#2A2A2A` za editorial tekst; `#333333` za neutralni tekst
- **Maksimalna širina:** `60–74ch`
- **Mobile:** `12.5–13px`, line-height `1.5`

### 13.6 Label / eyebrow

- **Font:** Inter za UI label; Geist Mono za source/system label
- **Weight:** 600–700
- **Size:** `10–12px`
- **Line-height:** `1`
- **Letter-spacing:** `0.10–0.18em`
- **Transform:** uppercase
- **Boja:** `#5A5A5A` za neutralni label; `#FF3000` za signal label

### 13.7 Metadata / source

- **Font:** Geist Mono
- **Weight:** 500–600
- **Size:** `10–11.5px`
- **Line-height:** normal
- **Letter-spacing:** `0.04–0.06em`
- **Boja:** `#5A5A5A`
- **Upotreba:** datum, izvor, keyboard hint, score, claim metadata i
  tehničke oznake.

### 13.8 Dugme

- **Font:** Inter
- **Weight:** 700
- **Size:** `14px`
- **Line-height:** normal
- **Boja primarnog dugmeta:** tekst `#FFFFFF`, pozadina `#000000`
- **Hover primarnog dugmeta:** pozadina i border `#FF3000`
- **Border:** `1px solid #000000`
- **Padding:** `13px 22px`
- **Shape:** pravougaoni, bez radiusa
- **Touch target:** najmanje `44px` visine na touch uređajima

### 13.9 Console / Scan tekst

- **Naslov scan reda:** Inter 600, `15px/1.3`
- **Know/Test/Decide:** Inter 400, `13px/1.5`
- **Score:** Geist Mono 700, `15px`
- **Tag:** Geist Mono 500, `10px`
- **Background:** `#0F1626`
- **Panel:** `#172038`
- **Tekst:** `#E6EAF5`
- **Muted tekst:** `#8D98B8`
- **Amber signal:** `#FFB020`
- **Ice signal:** `#8CB4FF`

### 13.10 Learn / Campus tekst

- **Font osnovnog UI-ja:** Figtree
- **Naslov kartice:** Unbounded 800, `18px/1.15`
- **Body kartice:** Figtree 500, `13.5px/1.55`
- **Label:** Figtree 700, `11px`, uppercase, `letter-spacing: 0.10em`
- **CTA:** Figtree 700, `13px`
- **Canvas:** `#E9E4FF`
- **Ink:** `#1F1A45`
- **Blueberry:** `#5A48FF`
- **Lemon:** `#FFE14D`
- **Mint:** `#7FE3B5`
- **Pink:** `#FF86B4`

## 14. Boje

### 14.1 Swiss spine

| Token | Vrijednost | Uloga |
|---|---|---|
| Paper | `#FFFFFF` | glavna površina |
| Paper 2 | `#F2F2F2` | sekundarna površina, side rail, note |
| Ink | `#000000` | osnovni tekst, primarni border |
| Ink soft | `#5A5A5A` | metadata i sekundarni tekst |
| Rule | `#E4E4E4` | diskretne separacione linije |
| Rule strong | `#000000` | jake strukturalne linije |
| Signal / Swiss Red | `#FF3000` | jedina osnovna brand akcent boja |
| Signal ink | `#FFFFFF` | tekst preko Swiss Reda |

### 14.2 Day-ink boje

Day-ink je izuzetak za Edition sloj i mijenja se prema danu:

| Dan | Token | Vrijednost |
|---|---|---|
| Monday | `--day-mon` | `#FF7A1A` |
| Tuesday | `--day-tue` | `#0E7A5F` |
| Wednesday | `--day-wed` | `#D62E7E` |
| Thursday | `--day-thu` | `#F0B400` |
| Friday | `--day-fri` | `#7440E0` |
| Saturday | `--day-sat` | `#1E9BE8` |
| Sunday | `--day-sun` | `#2436E8` |

Day-ink se koristi za day bar, importance oznake i report-specific signal,
ali ne smije zamijeniti Swiss Red u globalnoj navigaciji i brand elementima.

## 15. Linije i boksovi

### 15.1 Swiss boks

- **Outer border:** `1px solid #000000`
- **Internal divider:** `1px solid #E4E4E4`
- **Strong divider:** `1px solid #000000`
- **Radius:** `0px`
- **Shadow:** nema shadowa
- **Fill:** `#FFFFFF` ili `#F2F2F2`
- **Padding za sadržaj:** najčešće `22–34px`

### 15.2 Daily Report boks

- Report header: donja linija `1px solid #E4E4E4`
- Day bar: puna vertikalna traka širine `7px`, boja `var(--day)`
- Story separator: `1px solid #E4E4E4`
- Side rail: lijeva linija `1px solid #E4E4E4`
- Claim badge: `1px solid #000000`
- Importance badge: `1px solid var(--day)`
- Nema zaobljenja, nema drop shadowa.

### 15.3 Console boks

- **Background:** `#0F1626`
- **Panel background:** `#172038`
- **Secondary panel:** `#1F2B4B`
- **Divider:** `1px solid #2A3658`
- **Tag border:** `1px solid #2A3658`
- **Hot tag border:** `1px solid #FFB020`
- **Radius:** nije dio Console tretmana

### 15.4 Campus / Learn boks

Campus je jedini sloj sa zaobljenim karticama:

- **Card border:** `2px solid #1F1A45`
- **Card radius:** `14px`
- **Card shadow:** `0 5px 0 #1F1A45`
- **Small shadow:** `0 3px 0 #1F1A45`
- **Pill radius:** `999px`
- **Exercise/button radius:** `8–12px`
- **Card fill:** `#FFFFFF` ili jedna od Campus boja

### 15.5 Pravilo prioriteta

Ako se Swiss i Campus pravila sudare:

1. Swiss spine ostaje pravougaon i bez sjene.
2. Campus radius i hard shadow ostaju ograničeni na Learn/studio sadržaj.
3. Edition zadržava čiste linije i serifnu čitljivost.
4. Console zadržava tamnu površinu i mono tehničku gustoću.

## 16. Dimenzije ekrana, platforme i prikazivanje

Ova sekcija razdvaja tri stvari:

1. **CSS breakpointove** koji mijenjaju layout i tipografiju.
2. **Referentne viewport dimenzije** za testiranje na uređajima.
3. **Mockup frame dimenzije** za canvas i screenshot prikaz.

Viewport vrijednosti su CSS pikseli, ne fizički pikseli uređaja. Browser chrome
se ne računa u viewport širinu i visinu.

### 16.1 Izvorni CSS breakpointovi

Ovo su breakpointovi koji već postoje u originalnom dokumentu i moraju ostati
referentne tačke:

| Media query | Namjena | Obavezno ponašanje |
|---|---|---|
| `max-width: 420px` | mali telefon | smanjeni hero i section display; uži gutter |
| `max-width: 640px` | veliki telefon | složiti report header, rail i Campus sadržaj |
| `max-width: 820px` | tablet portrait / mali laptop | sakriti document nav; scan rows postaju dvokolonski |
| `max-width: 1000px` | tablet landscape | multi-column layout prelazi u jednu kolonu |
| `max-width: 1200px` | mali laptop | smanjiti navigation spacing i rail širinu |
| `min-width: 1200px` | desktop | Daily Report može imati dvije kolone priča |
| `min-width: 1600px` | veliki desktop | povećati rhythm i horizontalni prostor |
| `min-width: 1920px` | ultrawide | cap sadržaj na `1840px`; ne rastezati tekst do ivica |
| `orientation: landscape` + `max-height: 520px` | telefon landscape | skratiti vertikalni spacing i ukloniti nepotrebnu visinu |

Ne uvoditi nove breakpointove samo zato što konkretan uređaj ima drugo ime.
Prvo koristiti postojeći raspon i fluidne vrijednosti (`clamp`, `%`, `ch`,
`minmax`).

### 16.2 Referentni viewporti za validaciju

AI coding assistant treba provjeriti najmanje ove širine i visine.

#### Mobile — portrait

| Klasa | Viewport | Tipična platforma / uređaj |
|---|---:|---|
| Small phone | `320 × 568` | mali Android / legacy iPhone |
| Compact phone | `360 × 800` | Android compact |
| iPhone portrait | `375 × 812` | iPhone SE / standard iPhone |
| Current phone | `390 × 844` | iPhone 12–15 class |
| Android tall | `393 × 873` | moderni Android |
| Large phone | `414 × 896` | large iPhone / Android |
| Extra-large phone | `430 × 932` | iPhone Pro Max class |

Mobile pravila:

- koristiti mobile frame `390 × 844` kao primarni referentni prikaz;
- na `320px` ne dozvoliti horizontalni scroll;
- na `360–430px` zadržati isti font role map, samo fluidno smanjiti skalu;
- hamburger navigacija mora biti dostupna do `820px`;
- body tekst ne smije pasti ispod `12.5px` u editorial Read prikazu;
- touch targeti moraju imati najmanje `44px` visine;
- koristiti `env(safe-area-inset-top/right/bottom/left)` gdje sadržaj dodiruje
  ivice ekrana.

#### Mobile — landscape

| Viewport | Namjena |
|---:|---|
| `568 × 320` | small phone landscape |
| `667 × 375` | standard phone landscape |
| `812 × 375` | iPhone landscape |
| `844 × 390` | current phone landscape |
| `896 × 414` | large phone landscape |
| `932 × 430` | extra-large phone landscape |

Landscape pravila:

- aktivirati short-viewport pravilo na visinama ispod `520px`;
- ne koristiti punu hero visinu;
- zadržati čitljiv line-height i omogućiti unutrašnji scroll;
- ne zaključavati stranicu na `100vh` ako mobilni browser mijenja toolbar.

#### Tablet

| Klasa | Portrait | Landscape | Tipična platforma |
|---|---:|---:|---|
| Small tablet | `768 × 1024` | `1024 × 768` | iPad / Android tablet |
| Tablet | `820 × 1180` | `1180 × 820` | iPad Air / Android tablet |
| Large tablet | `834 × 1112` | `1112 × 834` | iPad Pro 11 class |
| Large landscape | `1024 × 1366` | `1366 × 1024` | iPad Pro 12.9 / tablet desktop mode |

Tablet pravila:

- do `820px` koristiti mobile/tablet navigation;
- oko `768–1000px` slagati Report rail ispod glavnog sadržaja;
- ne koristiti desktop dvije kolone ako bi editorial measure pao ispod
  približno `44ch`;
- zadržati Swiss `1px` linije; ne povećavati border samo zato što je ekran
  veći.

#### Desktop and laptop

| Viewport | Klasa |
|---:|---|
| `1280 × 720` | standard desktop / mockup desktop minimum |
| `1366 × 768` | common laptop |
| `1440 × 900` | common desktop |
| `1536 × 864` | large laptop |
| `1600 × 900` | large desktop |
| `1920 × 1080` | full HD desktop |

Desktop pravila:

- `1280 × 900` koristiti kao primarni desktop mockup frame;
- od `1200px` dozvoliti dvije kolone priča u Daily Reportu;
- od `1600px` povećati vertikalni rhythm, ali ne povećavati body tekst
  automatski;
- sadržaj širine ograničiti na `1760px`, a od `1920px` na `1840px`;
- editorial tekst ostaje ograničen na `60–74ch`;
- desktop navigacija može biti puna tek iznad `820px`.

#### Ultrawide and high-resolution

| Viewport | Klasa |
|---:|---|
| `2560 × 1440` | 2K / ultrawide |
| `3440 × 1440` | 21:9 ultrawide |
| `3840 × 2160` | 4K |

Ultrawide pravila:

- ne razvlačiti UI preko cijele širine;
- primijeniti `max-width: 1840px`;
- hero display može koristiti `clamp(72px, 5vw, 104px)`;
- section display može koristiti `clamp(40px, 3vw, 52px)`;
- povećati whitespace i section rhythm, ne gustoću slova;
- provjeriti da bočne kolone ne proizvode preduge redove.

### 16.3 Mockup i canvas frame dimenzije

Za izolovane preview frameove koristiti ove standarde:

| Frame | Dimenzija | Namjena |
|---|---:|---|
| Mobile | `390 × 844` | primarni phone preview |
| Tablet | `768 × 1024` | tablet portrait preview |
| Desktop | `1280 × 720` | standardni responsive preview |
| Desktop full | `1280 × 900` | Daily Report / app screen |
| Full-page desktop | `1280 × 2400` | screenshot-style duga stranica |
| Ultrawide | `1920 × 1080` | veliki desktop pregled |

Za postojeći Daily Report mockup:

- `daily-report-desktop`: `1280 × 900`
- `daily-report-mobile`: `390 × 844`

Mobile frame ne smije samo smanjiti desktop screenshot. Komponenta mora
renderovati isti sadržaj kroz responsive layout i mobile navigaciju.

### 16.4 Platforme i browser konteksti

Implementaciju provjeriti u ovim kontekstima:

- iOS Safari: portrait, landscape i safe-area insets;
- Android Chrome: portrait, landscape i promjenjiva browser toolbar visina;
- macOS Safari / Chrome: retina desktop i zoom;
- Windows Chrome / Edge: standardni desktop i Windows scaling;
- Linux Chrome / Firefox: fallback font stack i scrollbar ponašanje;
- embedded webview / iframe: bez oslanjanja na `window.innerWidth` kao jedini
  izvor responsive logike.

Platforma ne smije mijenjati tipografsku hijerarhiju. Razlika između sistema
smije se pojaviti samo u fallback fontu, antialiasingu, scrollbarima i
safe-area ponašanju.

### 16.5 DPR, zoom i pristupačnost

Provjeriti najmanje:

- device pixel ratio `1`, `2` i `3`;
- browser zoom `100%`, `125%` i `200%`;
- system text scaling na mobile uređajima;
- `prefers-reduced-motion: reduce`;
- keyboard-only navigation na desktopu;
- fokus indikatore bez uklanjanja browser outlinea bez zamjene.

Pri `200%` zoomu sadržaj mora ostati funkcionalan bez odsijecanja naslova,
skrivenih dugmadi ili horizontalnog overflowa. Ne koristiti fiksne visine za
tekstualne blokove.

### 16.6 Responsive acceptance checklist

AI coding assistant mora potvrditi:

- nema horizontalnog scrolla na `320px`;
- nema preklapanja naslova, labela i metadata;
- svi fontovi ostaju u pravilno definisanim ulogama;
- Read, Scan i Learn zadržavaju svoje tipografske slojeve;
- Swiss boksovi su `0px` radius i bez shadowa;
- Campus boksovi su jedini zaobljeni i imaju hard shadow;
- line-height se ne smije ručno smanjivati da bi sadržaj stao;
- Daily Report rail prelazi ispod sadržaja na tablet/mobilnom prikazu;
- desktop max-width i editorial measure rade na `1920px+`;
- preview frameovi rade na `390 × 844`, `768 × 1024` i `1280 × 900`;
- layout radi u portrait i landscape orijentaciji;
- zoom `200%` ne lomi osnovnu navigaciju i kontrole.