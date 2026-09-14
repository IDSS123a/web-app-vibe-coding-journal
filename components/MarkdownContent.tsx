/**
 * Renders markdown as real formatted HTML -- not raw markdown syntax
 * shown as literal text. Found live 2026-09-15: every place in this
 * app that displays AI-generated or pipeline-generated markdown (Daily
 * Report fallback text, University lesson bodies, the admin review
 * queues) was rendering the raw string directly, so a reader saw
 * "## Heading" and "**bold**" as literal characters instead of actual
 * formatting. `react-markdown` handles the parsing; the component
 * overrides below apply structural typography (weight, case, spacing,
 * list style) matching the Swiss system's headings (P-20) without
 * hardcoding text color -- color is deliberately left to inherit from
 * whichever container this is used in, so the same component works
 * both on Swiss-retrofitted pages (already wrapped in a `text-black`
 * container) and pages not yet retrofitted (e.g.
 * app/admin/hold-gate-calibration/page.tsx's existing gray/dark-mode
 * theme) without fighting either one.
 */

import ReactMarkdown from "react-markdown";

export function MarkdownContent({ children, className = "" }: { children: string; className?: string }) {
  return (
    <div className={className}>
      <ReactMarkdown
        components={{
          h1: ({ children }) => (
            <h1 className="mb-4 mt-8 text-2xl font-black uppercase tracking-tight first:mt-0">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="mb-3 mt-8 text-xl font-black uppercase tracking-tight first:mt-0">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="mb-2 mt-6 text-base font-black uppercase tracking-wide">{children}</h3>
          ),
          p: ({ children }) => <p className="mb-4 text-sm leading-relaxed">{children}</p>,
          strong: ({ children }) => <strong className="font-bold">{children}</strong>,
          em: ({ children }) => <em className="italic">{children}</em>,
          ul: ({ children }) => <ul className="mb-4 ml-5 list-disc space-y-1 text-sm">{children}</ul>,
          ol: ({ children }) => <ol className="mb-4 ml-5 list-decimal space-y-1 text-sm">{children}</ol>,
          li: ({ children }) => <li className="text-sm">{children}</li>,
          a: ({ children, href }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold underline decoration-2 underline-offset-4 transition-colors duration-150 ease-out hover:text-[#FF3000]"
            >
              {children}
            </a>
          ),
          code: ({ children }) => (
            <code className="bg-[#F2F2F2] px-1 py-0.5 font-mono text-xs">{children}</code>
          ),
          hr: () => <hr className="my-6 border-t-2 border-current opacity-30" />,
          blockquote: ({ children }) => (
            <blockquote className="mb-4 border-l-4 border-[#FF3000] pl-4 text-sm italic">{children}</blockquote>
          ),
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
