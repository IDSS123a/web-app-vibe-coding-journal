/**
 * Renders markdown as real formatted HTML -- not raw markdown syntax
 * shown as literal text. Found live 2026-09-15: every place in this
 * app that displays AI-generated or pipeline-generated markdown (Daily
 * Report fallback text, University lesson bodies, the admin review
 * queues) was rendering the raw string directly, so a reader saw
 * "## Heading" and "**bold**" as literal characters instead of actual
 * formatting. `react-markdown` handles the parsing.
 *
 * KANON (PDL-074): the typography now lives in app/kanon.css (`.k-prose`), not in class strings here, and it
 * follows the layer the component is placed in: serif in the Edition (Daily Report), Figtree and Unbounded
 * headings in Campus (Prompt School, University), light Swiss UI elsewhere. Colour is inherited from the
 * container, as before. The only element override left is the link, which opens in a new tab.
 */

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export function MarkdownContent({ children, className = "" }: { children: string; className?: string }) {
  return (
    <div className={`k-prose ${className}`.trim()}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ children, href }) => (
            <a href={href} target="_blank" rel="noopener noreferrer">
              {children}
            </a>
          ),
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
