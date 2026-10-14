#!/usr/bin/env python3
"""Build the claude.ai Artifact variant of the page.

The Artifact host wraps the file in its own document skeleton and forbids iframes,
so this strips <!doctype>/<html>/<head>/<body>, keeps <title>, font links and the
stylesheet link at the top, and sets window.NJAS_NO_EMBED so videos link out.
Output: build/artifact/index.html plus build/artifact/files.json (publish map).
"""
import json, re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "build" / "artifact"; OUT.mkdir(parents=True, exist_ok=True)
html = (ROOT / "index.html").read_text(encoding="utf-8")
head = re.search(r"<head>(.*?)</head>", html, re.S).group(1)
body = re.search(r"<body[^>]*>(.*?)</body>", html, re.S).group(1)
keep = []
for m in re.finditer(r"<(title|link)[^>]*>(?:.*?</title>)?", head, re.S):
    tag = m.group(0)
    if tag.startswith("<title") or 'rel="stylesheet"' in tag or 'rel="preconnect"' in tag:
        keep.append(tag)
import hashlib, time
ver = hashlib.sha1((ROOT / "assets/js/app.js").read_bytes() + (ROOT / "assets/css/style.css").read_bytes()).hexdigest()[:8]
keep = [k.replace('href="assets/css/style.css"', f'href="assets/css/style.css?v={ver}"') for k in keep]
body = body.replace('src="assets/js/app.js"', f'src="assets/js/app.js?v={ver}"')
page = "\n".join(keep) + f"\n<script>window.NJAS_NO_EMBED = true; window.NJAS_VER = '{ver}';</script>\n" + body.strip() + "\n"
(OUT / "index.html").write_text(page, encoding="utf-8")
files = {"assets/css/style.css": "assets/css/style.css", "assets/js/app.js": "assets/js/app.js", "media/auto/index.json": "media/auto/index.json"}
for p in sorted((ROOT / "data").glob("*.json")): files[f"data/{p.name}"] = f"data/{p.name}"
for p in sorted((ROOT / "media" / "auto").glob("*.jpg")): files[f"media/auto/{p.name}"] = f"media/auto/{p.name}"
(OUT / "files.json").write_text(json.dumps(files, indent=1))
print("page bytes", len(page.encode()), "files", len(files))
