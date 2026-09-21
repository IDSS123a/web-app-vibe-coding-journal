"""
Second pass of the KANON migration for the technical admin surfaces (Console layer, PDL-074): maps the
mixed light palettes (black/white Swiss retrofit, and the older gray/blue/yellow/red pages with dark: variants
and rounded corners) onto the Console tokens (#0F1626 background, #172038 panels, #2A3658 lines, mono
metadata). Run AFTER scripts/kanon-migrate.py swiss on the same files.

    python scripts/kanon-console.py <files...>
"""
import re
import sys
import pathlib

files = [pathlib.Path(f) for f in sys.argv[1:]]


def map_token(tok: str, has_dark_btn: bool) -> list:
    m = re.match(r"^((?:(?:sm|md|lg|xl|hover|focus|disabled|focus-visible|active):)*)(.+)$", tok)
    pre, base = m.group(1), m.group(2)
    if pre.startswith("dark:") or tok.startswith("dark:"):
        return []
    if re.match(r"^(?:rounded(?:-\w+)?|shadow(?:-\w+)?|ring-\d+|ring-\w+-\d+)$", base):
        return []
    if re.match(r"^(?:bg-(?:white|gray-50|gray-100|gray-200|slate-\d+))$", base):
        return [pre + "bg-console-panel"]
    if re.match(r"^bg-(?:yellow|amber|orange)-\d+(?:/\d+)?$", base):
        return [pre + "bg-transparent", "border", "border-console-amber"]
    if re.match(r"^bg-(?:red|green|blue|emerald|rose)-\d+(?:/\d+)?$", base):
        return [pre + "bg-console-panel-2"]
    if base == "bg-black":
        return [pre + "bg-console-text"]
    if re.match(r"^(?:text-(?:black|gray-900|gray-800|gray-700))$", base):
        return [pre + "text-console-text"]
    if re.match(r"^text-gray-(?:600|500|400|300)$", base):
        return [pre + "text-console-dim"]
    if base == "text-white":
        return [pre + ("text-console-bg" if has_dark_btn else "text-console-text")]
    if re.match(r"^text-(?:blue|indigo|sky|cyan)-\d+$", base):
        return [pre + ("text-signal" if pre.startswith("hover:") else "text-console-ice")]
    if re.match(r"^text-(?:red|rose)-\d+$", base):
        return [pre + "text-signal"]
    if re.match(r"^text-(?:yellow|amber|orange)-\d+$", base):
        return [pre + "text-console-amber"]
    if re.match(r"^text-(?:green|emerald)-\d+$", base):
        return [pre + "text-console-ice"]
    if re.match(r"^(?:border-(?:black|gray-\d+|slate-\d+)|divide-(?:gray|slate)-\d+)$", base):
        return [pre + ("divide-console-line" if base.startswith("divide") else "border-console-line")]
    if re.match(r"^border-(?:red|rose)-\d+$", base):
        return [pre + "border-signal"]
    if re.match(r"^border-(?:yellow|amber|orange)-\d+$", base):
        return [pre + "border-console-amber"]
    if re.match(r"^border-(?:blue|green|indigo|emerald)-\d+$", base):
        return [pre + "border-console-line"]
    if re.match(r"^(?:border|border-t|border-b|border-l|border-r)-(?:4|2)$", base):
        return [pre + base.rsplit("-", 1)[0]]
    if base == "border-4":
        return [pre + "border"]
    if re.match(r"^hover:bg-(?:gray|slate)-\d+$", tok):
        return ["hover:bg-console-panel-2"]
    if base == "opacity-60":
        return [pre + "text-console-dim"] if False else [tok]
    return [tok]


pat = re.compile(r'className=(?:"([^"{}]*)"|\{`([^`]*)`\})')


def transform(cls: str) -> str:
    toks = cls.split()
    if "min-h-dvh" in toks and "bg-white" in toks:
        toks = [t for t in toks if t not in ("min-h-dvh", "bg-white")] + ["layer-console", "min-h-dvh"]
    has_dark_btn = "bg-black" in toks
    out = []
    for t in toks:
        if t.startswith("${"):
            out.append(t)
            continue
        out.extend(map_token(t, has_dark_btn))
    seen = []
    for t in out:
        if t not in seen:
            seen.append(t)
    return " ".join(seen)


def process(text: str) -> str:
    def repl(m):
        if m.group(1) is not None:
            return 'className="' + transform(m.group(1)) + '"'
        parts = re.split(r"(\$\{[^}]*\})", m.group(2))
        def piece(p):
            if p.startswith("${") or not p.strip():
                return p
            lead = " " if p[0].isspace() else ""
            trail = " " if p[-1].isspace() else ""
            return lead + transform(p) + trail

        return "className={`" + "".join(piece(p) for p in parts) + "`}"

    return pat.sub(repl, text)


for f in files:
    src = f.read_text(encoding="utf-8")
    new = process(src)
    if new != src:
        f.write_text(new, encoding="utf-8")
        print("console", f)
