"""
One-off migration helper for the KANON redesign (PDL-074): rewrites the Tailwind class strings of the
existing pages onto the k-* building blocks in app/kanon.css. It only touches class names (typography,
lines, radii, colours), never structure, text or logic. Run once per layer group, then review the diff.

    python scripts/kanon-migrate.py swiss|edition|campus <files...>
"""
import re
import sys
import pathlib

group = sys.argv[1]
files = [pathlib.Path(f) for f in sys.argv[2:]]

TYPO = re.compile(r"^(?:(?:xs|sm|md|lg|xl|nav|split|laptop|wide):)?(?:text-(?:xs|sm|base|lg|xl|[2-9]xl)|font-(?:black|bold|extrabold|semibold|medium)|tracking-\w+|leading-\w+|uppercase|normal-case)$")
BIG = re.compile(r"^(?:(?:xs|sm|md|lg|xl):)?text-(?:2xl|3xl|4xl|5xl|6xl)$")
BORDER_W = re.compile(r"^border-(?:4|2|8)$")
BORDER_SIDE = re.compile(r"^border-([tblrxy])-(4|2|8)$")


def transform(cls: str, tag: str) -> str:
    tokens = cls.split()
    if not tokens:
        return cls
    s = set(tokens)
    is_heading = tag in ("h1", "h2", "h3", "h4")
    upper = "uppercase" in s
    boxed = any(BORDER_W.match(t) for t in tokens)
    button_like = (tag in ("button", "a", "Link", "label", "span") and upper and (boxed or "bg-black" in s)) or (tag in ("button", "Link", "a") and upper and any(t.startswith("min-h-11") for t in tokens))
    wrapper = "min-h-dvh" in s and "bg-white" in s

    out = []
    if wrapper:
        drop = re.compile(r"^(?:min-h-dvh|bg-white|(?:sm:|md:|lg:)?p[xy]-\d+)$")
        out = [t for t in tokens if not drop.match(t)]
        out.append("k-page")
        if group == "campus":
            out.append("layer-campus")
        elif group == "edition":
            out.append("layer-edition")
        return " ".join(out)

    if is_heading:
        keep = [t for t in tokens if not TYPO.match(t)]
        big = any(BIG.match(t) for t in tokens)
        small = "text-xs" in s or "text-sm" in s
        if tag == "h1":
            k = "k-cheading" if group == "campus" else "k-display"
        elif tag == "h2":
            k = ("k-h3" if group == "campus" else "k-h2") if big else "k-h4"
        else:
            k = "k-label" if (small and upper) else "k-h4"
        if group == "campus" and k == "k-label":
            k = "k-clabel"
        return " ".join(keep + [k])

    if button_like:
        primary = "bg-black" in s
        drop = re.compile(
            r"^(?:border-(?:4|2|8)|border-black|border-\[#FF3000\]|bg-black|bg-white|text-black|text-white|(?:sm:|md:)?p[xy]-\d+|"
            r"hover:(?:border|bg|text)-.*|transition-colors|duration-\d+|ease-out|focus-visible:(?:outline-none|ring-4|ring-\[#FF3000\])|"
            r"text-xs|text-sm|font-(?:black|bold|extrabold|semibold)|tracking-\w+|uppercase)$"
        )
        keep = [t for t in tokens if not drop.match(t)]
        if group == "campus":
            keep += ["k-cbtn"] + (["k-cbtn-primary"] if primary else [])
        else:
            keep += ["k-btn"] + (["k-btn-primary"] if primary else [])
        return " ".join(keep)

    if upper:
        # a label or eyebrow
        keep = [t for t in tokens if not TYPO.match(t)]
        return " ".join(keep + ["k-clabel" if group == "campus" else "k-label"])

    # boxes and lines
    res = []
    has_pad = any(re.match(r"^(?:sm:|md:)?p-\d+$", t) for t in tokens)
    for t in tokens:
        if BORDER_W.match(t):
            if group == "campus" and has_pad:
                res.append("k-card" if t == "border-4" else "k-card-sm")
            elif group == "campus":
                res.append("border-2")
            else:
                res.append("border")
            continue
        m = BORDER_SIDE.match(t)
        if m and m.group(2) == "8":
            res.append(f"border-{m.group(1)}-4")
            continue
        if m:
            res.append(f"border-{m.group(1)}")
            continue
        res.append(t)
    if group == "campus" and any(t in ("k-card", "k-card-sm") for t in res):
        res = [t for t in res if t not in ("border-black", "bg-white")]
    return " ".join(res)


pat = re.compile(r'className=(?:"([^"{}]*)"|\{`([^`]*)`\})')


def process(text: str) -> str:
    def repl(m):
        pos = m.start()
        lt = text.rfind("<", 0, pos)
        tm = re.match(r"<([A-Za-z][\w.]*)", text[lt:lt + 40])
        tag = tm.group(1) if tm else ""
        if m.group(1) is not None:
            return 'className="' + transform(m.group(1), tag) + '"'
        # template literal: transform the static parts only
        parts = re.split(r"(\$\{[^}]*\})", m.group(2))
        static = "".join(p for p in parts if not p.startswith("${"))
        new_static = transform(static, tag)
        if not any(p.startswith("${") for p in parts):
            return "className={`" + new_static + "`}"
        # keep expressions where they were: transform each static piece token by token
        out = []
        for p in parts:
            out.append(p if p.startswith("${") else transform(p.strip(), tag) if p.strip() else p)
            if not p.startswith("${") and p.strip():
                out[-1] = (" " if p.startswith(" ") else "") + out[-1] + (" " if p.endswith(" ") else "")
        return "className={`" + "".join(out) + "`}"

    return pat.sub(repl, text)


COLOR = [
    (r"\[#FF3000\]", "signal"),
    (r"\[#ff3000\]", "signal"),
    (r"\[#F2F2F2\]", "paper-2"),
    (r"\[#E5E5E5\]", "rule"),
    (r"\[#D4A017\]", "studio-lemon"),
]

for f in files:
    src = f.read_text(encoding="utf-8")
    new = process(src)
    for a, b in COLOR:
        new = re.sub(a, b, new)
    if new != src:
        f.write_text(new, encoding="utf-8")
        print("changed", f)
