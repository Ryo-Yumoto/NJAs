#!/usr/bin/env python3
"""Build the claude.ai Artifact variant of the page.

The Artifact host wraps the file in its own document skeleton, forbids iframes and
third-party scripts, and allows at most 511 files per artifact version. So this:
  - strips <!doctype>/<html>/<head>/<body>, keeps <title> / font links / stylesheet link,
  - sets window.NJAS_NO_EMBED (videos and posts link out instead of embedding),
  - packs media/auto images into per-month sprite sheets (build/artifact/sprites/*.jpg,
    plus sprites.json mapping id -> sheet, y, w, h) so hundreds of images become ~70 files,
  - writes files.json with the publish map.
"""
import hashlib, json, re
from urllib.parse import urlparse
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "build" / "artifact"; (OUT / "sprites").mkdir(parents=True, exist_ok=True)
MAX_W, MAX_SHEET_H, MAX_PER_SHEET = 900, 30000, 40  # browsers refuse to decode images taller than 32767px

html = (ROOT / "index.html").read_text(encoding="utf-8")
head = re.search(r"<head>(.*?)</head>", html, re.S).group(1)
body = re.search(r"<body[^>]*>(.*?)</body>", html, re.S).group(1)
keep = []
for m in re.finditer(r"<(title|link)[^>]*>(?:.*?</title>)?", head, re.S):
    tag = m.group(0)
    if tag.startswith("<title") or 'rel="stylesheet"' in tag or 'rel="preconnect"' in tag:
        keep.append(tag)
ver = hashlib.sha1((ROOT / "assets/js/app.js").read_bytes() + (ROOT / "assets/css/style.css").read_bytes()).hexdigest()[:8]
keep = [k.replace('href="assets/css/style.css"', f'href="assets/css/style.css?v={ver}"') for k in keep]
body = body.replace('src="assets/js/app.js"', f'src="assets/js/app.js?v={ver}"')
page = "\n".join(keep) + f"\n<script>window.NJAS_NO_EMBED = true; window.NJAS_SPRITES = 'sprites.json?v={ver}'; window.NJAS_VER = '{ver}';</script>\n" + body.strip() + "\n"
(OUT / "index.html").write_text(page, encoding="utf-8")

# ---- sprites: group images by the record's month ----
index = json.loads((ROOT / "media/auto/index.json").read_text())
manifest = json.loads((ROOT / "data/manifest.json").read_text())
month_of = {}
for f in manifest["files"]:
    for it in json.loads((ROOT / "data" / f).read_text()):
        month_of[it["id"]] = it["date"][:7]
groups = {}
for rid, e in index.items():
    m = month_of.get(rid)
    if m and (ROOT / "media/auto" / e["file"]).exists(): groups.setdefault(m, []).append((rid, ROOT / "media/auto" / e["file"]))
# curated assets (image.path, local_assets) keyed "a/<path>"
for f in manifest["files"]:
    for it in json.loads((ROOT / "data" / f).read_text()):
        paths = ([it["image"]["path"]] if (it.get("image") or {}).get("path") else []) + list(it.get("local_assets") or [])
        for pth in paths:
            fp = ROOT / "media" / pth
            if fp.exists(): groups.setdefault(it["date"][:7], []).append(("a/" + pth, fp))
# X post photos / video thumbnails and avatars (keyed "x/<file>", grouped by the first record's month)
xposts_path = ROOT / "media/x/posts.json"
xposts = json.loads(xposts_path.read_text()) if xposts_path.exists() else {}
for sid, post in xposts.items():
    recs = [r for r in post.get("records", []) if r in month_of]
    m = min(month_of[r] for r in recs) if recs else None
    if not m: continue
    for me in post.get("media", []):
        f = ROOT / "media/x" / me["file"]
        if f.exists(): groups.setdefault(m, []).append(("x/" + me["file"], f))
    av = (post.get("author") or {}).get("avatar")
    if av and (ROOT / "media/x" / av).exists() and not any(k == "x/" + av for g in groups.values() for k, _ in g):
        groups.setdefault("avatars", []).append(("x/" + av, ROOT / "media/x" / av))
sprites = {}; sheet_files = []
old = {p.name for p in (OUT / "sprites").glob("*.jpg")}
for m, lst in sorted(groups.items()):
    lst.sort()
    # load + downscale first, then split into parts by cumulative height and count
    loaded = []
    for rid, fn in lst:
        im = Image.open(fn).convert("RGB")
        if im.width > MAX_W: im = im.resize((MAX_W, round(im.height * MAX_W / im.width)), Image.LANCZOS)
        if im.height > MAX_SHEET_H: im = im.resize((round(im.width * MAX_SHEET_H / im.height), MAX_SHEET_H), Image.LANCZOS)
        loaded.append((rid, im))
    parts, cur, h = [], [], 0
    for rid, im in loaded:
        if cur and (h + im.height > MAX_SHEET_H or len(cur) >= MAX_PER_SHEET): parts.append(cur); cur, h = [], 0
        cur.append((rid, im)); h += im.height
    if cur: parts.append(cur)
    for pi, ims in enumerate(parts):
        W = max(im.width for _, im in ims); H = sum(im.height for _, im in ims)
        sheet = Image.new("RGB", (W, H), (0, 0, 0)); y = 0
        name = f"{m}{'' if len(parts) == 1 else '-' + chr(97 + pi)}.jpg"
        for rid, im in ims:
            sheet.paste(im, (0, y)); sprites[rid] = {"sheet": f"sprites/{name}", "y": y, "w": im.width, "h": im.height}; y += im.height
            if rid in index:  # image credit: the page the image was taken from, and the image host (to tell YouTube thumbnails apart)
                sprites[rid]["from"] = index[rid].get("page_url"); sprites[rid]["ih"] = urlparse(index[rid].get("image_url") or "").netloc
        sheet = sheet.crop((0, 0, W, y))
        sheet.save(OUT / "sprites" / name, "JPEG", quality=80, optimize=True, progressive=True)
        sheet_files.append(name); old.discard(name)
for stale in old: (OUT / "sprites" / stale).unlink()
(OUT / "sprites.json").write_text(json.dumps(sprites, separators=(",", ":")))
files = {"assets/css/style.css": "assets/css/style.css", "assets/js/app.js": "assets/js/app.js", "sprites.json": "build/artifact/sprites.json"}
for p in sorted((ROOT / "data").glob("*.json")): files[f"data/{p.name}"] = f"data/{p.name}"
if xposts_path.exists(): files["media/x/posts.json"] = "media/x/posts.json"
for n in sheet_files: files[f"sprites/{n}"] = f"build/artifact/sprites/{n}"
(OUT / "files.json").write_text(json.dumps(files, indent=1))
total = sum((OUT / "sprites" / n).stat().st_size for n in sheet_files)
print(f"page bytes {len(page.encode())} sheets {len(sheet_files)} sprite bytes {total/1e6:.1f}MB images mapped {len(sprites)} files {len(files)}")
