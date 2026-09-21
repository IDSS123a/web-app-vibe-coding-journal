/**
 * One legal page (PDL-079): a heading, the date of this version, the text, and links to the other legal pages.
 * A server component, so the text is in the page itself and search engines and the customer's browser get it without scripts.
 */
import Link from "next/link";
import { MarkdownContent } from "@/components/MarkdownContent";
import { LEGAL_PAGES, LEGAL_UPDATED } from "@/features/legal/content";

export function LegalPage({ path }: { path: (typeof LEGAL_PAGES)[number]["path"] }) {
  const page = LEGAL_PAGES.find((p) => p.path === path)!;
  return (
    <div className="k-page layer-edition">
      <div className="k-wide">
        <div className="mb-8 border-b border-black pb-8">
          <p className="mb-2 text-signal k-label">Legal</p>
          <h1 className="text-black k-display">{page.title}</h1>
          <p className="mt-3 text-sm text-black">Version of {LEGAL_UPDATED}</p>
        </div>

        <MarkdownContent className="k-cols legal-text">{page.markdown}</MarkdownContent>

        <nav aria-label="Other legal pages" className="mt-12 flex flex-wrap gap-x-6 border-t border-black pt-6">
          {LEGAL_PAGES.filter((p) => p.path !== path).map((p) => (
            <Link key={p.path} href={p.path} className="inline-flex min-h-11 items-center underline decoration-1 underline-offset-4 hover:text-signal k-label">
              {p.title}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}
