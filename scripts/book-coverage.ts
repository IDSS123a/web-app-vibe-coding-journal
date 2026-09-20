/**
 * Prints how much of the Director's book the Prompt School covers, chapter by chapter
 * (features/prompt-school/content/book-map.ts). Run: npm run book:coverage
 * The content test already fails when an AUTHORED chapter leaves a section uncovered; this shows the whole picture.
 */
import { AUTHORED_CHAPTERS } from "../features/prompt-school/content";
import { BOOK_MAP } from "../features/prompt-school/content/book-map";
import { PROMPT_SCHOOL_OUTLINE } from "../features/prompt-school/content/outline";

const coveredIds = new Set(AUTHORED_CHAPTERS.flatMap((c) => c.lessons.flatMap((l) => l.covers)));
let covered = 0;
console.log("Chapter".padEnd(28), "Book part".padEnd(32), "Lessons".padEnd(9), "Sections covered");
for (const ch of PROMPT_SCHOOL_OUTLINE) {
  const sections = BOOK_MAP.filter((s) => s.chapter === ch.slug);
  const done = sections.filter((s) => coveredIds.has(s.id)).length;
  covered += done;
  const authored = AUTHORED_CHAPTERS.find((a) => a.slug === ch.slug);
  const provisional = sections.some((s) => s.provisional) ? " (map provisional)" : "";
  console.log(ch.slug.padEnd(28), ch.bookRef.padEnd(32), String(authored ? authored.lessons.length : 0).padEnd(9), `${done}/${sections.length}${provisional}`);
}
console.log(`\nTotal: ${covered} of ${BOOK_MAP.length} book sections covered (${Math.round((100 * covered) / BOOK_MAP.length)}%), ${AUTHORED_CHAPTERS.reduce((n, c) => n + c.lessons.length, 0)} lessons authored.`);
