/**
 * Parsers for the two supplied dictionary documents (2026-09-19). Pure: they take the
 * markdown text and return raw terms; nothing here touches the network or the database.
 *
 * Document A ("Premium_Vibe_Coding_Dictionary.md"): sections "## N. Title", terms as
 * "### N. Term" followed by the definition. Its last sections (alphabetical index, UI
 * advice) are not numbered, so parsing stops there.
 * Document B ("premium-vibe-coding-dictionary.md"): sections "## N. Title", terms as a
 * bold line "**Term**" followed by the definition. Its "Additional High-Frequency Terms"
 * section holds most of the terms and has no internal structure, which is why terms are
 * classified into topic groups afterwards rather than taken from section titles.
 *
 * Every definition passes through stripAiTells (writing rule) and loses markdown bold
 * markers, so nothing but plain text reaches the Dictionary.
 */

import { stripAiTells } from "@/lib/text/no-ai-tells";
import { splitTermAndAlias, type RawImportedTerm } from "./domain";

function cleanText(text: string): string {
  return stripAiTells(text.replace(/\*\*/g, "").replace(/\s+/g, " ").trim());
}

function finish(term: string, defLines: string[], section: string, origin: "book_a" | "book_b"): RawImportedTerm | null {
  const definition = cleanText(defLines.join(" "));
  const { term: display, aliases } = splitTermAndAlias(cleanText(term));
  if (!display || !definition) return null;
  return { term: display, aliases, definition, section, origin };
}

export function parseBookA(markdown: string): RawImportedTerm[] {
  const out: RawImportedTerm[] = [];
  let section: string | null = null;
  let current: { term: string; def: string[] } | null = null;

  const flush = () => {
    if (current && section) {
      const t = finish(current.term, current.def, section, "book_a");
      if (t) out.push(t);
    }
    current = null;
  };

  for (const raw of markdown.split(/\r?\n/)) {
    const line = raw.trimEnd();
    let m: RegExpMatchArray | null;
    if ((m = line.match(/^## \d+\.\s+(.+)$/))) {
      flush();
      section = m[1]!.trim();
      continue;
    }
    if (/^## /.test(line)) {
      flush();
      section = null;
      continue;
    }
    if (section && (m = line.match(/^### \d+\.\s+(.+)$/))) {
      flush();
      current = { term: m[1]!, def: [] };
      continue;
    }
    if (current && line.trim() && !/^---+$/.test(line.trim())) current.def.push(line.trim());
  }
  flush();
  return out;
}

export function parseBookB(markdown: string): RawImportedTerm[] {
  const out: RawImportedTerm[] = [];
  let section: string | null = null;
  let current: { term: string; def: string[] } | null = null;

  const flush = () => {
    if (current && section) {
      const t = finish(current.term, current.def, section, "book_b");
      if (t) out.push(t);
    }
    current = null;
  };

  for (const raw of markdown.split(/\r?\n/)) {
    const line = raw.trimEnd();
    let m: RegExpMatchArray | null;
    if ((m = line.match(/^## \d+\.\s+(.+)$/))) {
      flush();
      section = m[1]!.trim();
      continue;
    }
    if (/^## /.test(line)) {
      flush();
      section = null;
      continue;
    }
    if (section && (m = line.match(/^\*\*(.+?)\*\*\s*$/))) {
      flush();
      current = { term: m[1]!, def: [] };
      continue;
    }
    if (current && line.trim() && !/^---+$/.test(line.trim())) current.def.push(line.trim());
  }
  flush();
  return out;
}
