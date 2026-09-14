/**
 * Found live 2026-09-14 (DECISION_LOG.md PDL-029): Tailwind CSS was
 * never actually wired up in this project despite every component
 * being written with Tailwind utility class names since Sprint 1 --
 * the compiled CSS bundle was a 479-byte hand-written reset only. This
 * file is the missing piece; see app/globals.css for the matching
 * `@import "tailwindcss";`.
 */
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};

export default config;
