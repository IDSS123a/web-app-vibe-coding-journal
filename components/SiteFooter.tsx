/**
 * The footer of every page (PDL-079): the legal pages, and the studio behind the product. The fixed credit line in the corner
 * (SiteCredit) stays; this is the part a reader, a customer or a regulator looks for at the bottom of a page.
 */
import Link from "next/link";
import { LEGAL_PAGES } from "@/features/legal/content";
import { STUDIO } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="border-t border-black bg-white px-4 pb-10 pt-8 text-black md:px-12">
      <nav aria-label="Legal" className="flex flex-wrap gap-x-6">
        {LEGAL_PAGES.map((p) => (
          <Link key={p.path} href={p.path} className="inline-flex min-h-11 items-center text-xs underline decoration-1 underline-offset-4 transition-colors duration-150 ease-out hover:text-signal">
            {p.title}
          </Link>
        ))}
      </nav>
      <p className="mt-2 text-xs opacity-70">
        Vibe-Coding Journal is a product of {STUDIO.name}. Contact:{" "}
        <a href={`mailto:${STUDIO.email}`} className="underline decoration-1 underline-offset-2 hover:text-signal">
          {STUDIO.email}
        </a>
        .
      </p>
    </footer>
  );
}
