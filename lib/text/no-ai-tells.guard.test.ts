import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import ts from "typescript";

/**
 * Build guard for the writing rule (Director, 2026-09-19): no em dash or en dash in
 * anything a reader can see. It parses every source file and inspects string
 * literals, template literals and JSX text only. Comments are deliberately not
 * checked: they are for maintainers and are not shipped as content.
 * Add a violation and this test names the file, line and text.
 */

const ROOT = process.cwd();
const DIRS = ["app", "components", "features", "lib", "types"];
const EXTRA_FILES = ["middleware.ts"];
const posix = (file: string) => file.split(path.sep).join("/");
const SKIP = (file: string) => /\.test\.tsx?$/.test(file) || posix(file).endsWith("lib/text/no-ai-tells.ts");
const DASH = /[—–]/;

function walk(dir: string, out: string[] = []): string[] {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (/\.(ts|tsx)$/.test(entry.name) && !SKIP(full)) out.push(full);
  }
  return out;
}

export function findDashLiterals(file: string): string[] {
  const source = fs.readFileSync(file, "utf8");
  const sf = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, file.endsWith("x") ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  const hits: string[] = [];
  const visit = (node: ts.Node) => {
    const k = node.kind;
    const isText =
      k === ts.SyntaxKind.StringLiteral ||
      k === ts.SyntaxKind.NoSubstitutionTemplateLiteral ||
      k === ts.SyntaxKind.TemplateHead ||
      k === ts.SyntaxKind.TemplateMiddle ||
      k === ts.SyntaxKind.TemplateTail ||
      k === ts.SyntaxKind.JsxText;
    if (isText) {
      const text = (node as ts.LiteralLikeNode).text ?? "";
      if (DASH.test(text)) {
        const { line } = sf.getLineAndCharacterOfPosition(node.getStart());
        hits.push(`${posix(path.relative(ROOT, file))}:${line + 1}  ${text.trim().slice(0, 90).replace(/\s+/g, " ")}`);
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);
  return hits;
}

describe("no em dash or en dash in user-facing source", () => {
  it("finds none in string literals, template literals or JSX text", () => {
    const files = [...DIRS.flatMap((d) => walk(path.join(ROOT, d))), ...EXTRA_FILES.map((f) => path.join(ROOT, f))].filter((f) => fs.existsSync(f));
    const hits = files.flatMap(findDashLiterals);
    expect(hits, `Replace each with a comma and a space (or a hyphen in a number range):\n${hits.join("\n")}`).toEqual([]);
  });
});
