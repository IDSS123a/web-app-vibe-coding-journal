/**
 * Public developer credit line (Director's request, 2026-09-15;
 * amends P-15 CONSTITUTION.md — see PDL-039). Small, fixed to the
 * bottom-right corner, present on every page including /admin —
 * it's a brand/attribution mark, not navigation, so it isn't gated
 * the way SiteNav is. The logo mark is the same file already used as
 * the site's browser-tab favicon (public/favicon.png, P-15) — same
 * asset, added here as well per the Director's follow-up request.
 */

export function SiteCredit() {
  return (
    // max-w + flex-wrap: on a 320-375 px phone the single-line credit was wider
    // than the screen and made the whole page scroll sideways (stress test D4).
    <div className="pointer-events-none fixed bottom-1 right-2 z-40 flex max-w-[calc(100vw-1rem)] select-none flex-wrap items-center justify-end gap-x-1 text-[10px] leading-tight tracking-wide text-black/40">
      {/* eslint-disable-next-line @next/next/no-img-element -- tiny static
          brand mark, not a candidate for next/image optimization */}
      <img src="/favicon.png" alt="" width={12} height={12} className="opacity-70" />
      <span>Prompt Hero Studio™</span>
      <span className="mx-1">·</span>
      <a
        href="mailto:ai-hero-studio@outlook.com"
        className="pointer-events-auto -my-1.5 py-1.5 underline decoration-1 underline-offset-2 transition-colors duration-150 ease-out hover:text-[#FF3000]"
      >
        ai-hero-studio@outlook.com
      </a>
    </div>
  );
}
