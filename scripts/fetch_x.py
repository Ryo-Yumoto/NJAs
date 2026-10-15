#!/usr/bin/env python3
"""Fetch X (Twitter) posts referenced by records (media.type == "x") so the site can
render them as native cards without third-party scripts.

Source: api.fxtwitter.com (JSON). For each post we keep author, text, created time,
photos (resized to max 1400px, JPEG) and video thumbnails; avatars are stored once
per account at 200px. Deleted/unavailable posts are recorded with "unavailable": true.

Output:
  media/x/posts.json   {status_id: {...}}  (see POST_FIELDS below)
  media/x/<status_id>-<n>.jpg, media/x/avatar-<screen_name>.jpg

Usage: python3 scripts/fetch_x.py [--force] [--only ID]
Re-runs skip status ids already in posts.json unless --force.
"""
import argparse, io, json, re, sys, time
from datetime import datetime, timezone
from pathlib import Path

import requests
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
DATA, OUT = ROOT / "data", ROOT / "media" / "x"
POSTS = OUT / "posts.json"
MAX_SIDE = 1400
HEADERS = {"Accept": "application/json", "User-Agent": "curl/8.5.0"}

def status_of(url):
    m = re.search(r"(?:x|twitter)\.com/([^/]+)/status/(\d+)", url or "")
    return (m.group(1), m.group(2)) if m else (None, None)

def get_json(s, url):
    for i in range(3):
        try:
            r = s.get(url, timeout=25, headers=HEADERS)
            if r.status_code == 404: return None, 404
            if r.status_code == 200 and r.headers.get("content-type", "").startswith("application/json"): return r.json(), 200
            if r.status_code == 429: time.sleep(5 * (i + 1)); continue
            return None, r.status_code
        except Exception:
            time.sleep(2)
    return None, 0

def save_image(s, url, path, max_side=MAX_SIDE):
    try:
        r = s.get(url, timeout=30, headers={"User-Agent": HEADERS["User-Agent"]})
        if r.status_code != 200: return None
        im = Image.open(io.BytesIO(r.content)); im.load()
        if im.mode in ("RGBA", "LA", "P"):
            bg = Image.new("RGB", im.size, (255, 255, 255)); bg.paste(im.convert("RGBA"), mask=im.convert("RGBA").split()[-1]); im = bg
        else: im = im.convert("RGB")
        w, h = im.size
        if max(w, h) > max_side:
            sc = max_side / max(w, h); im = im.resize((round(w * sc), round(h * sc)), Image.LANCZOS)
        im.save(path, "JPEG", quality=88, optimize=True)
        return {"w": im.width, "h": im.height}
    except Exception:
        return None

def pack(t, s, sid, with_media=True):
    """Reduce an fxtwitter tweet object to what the site renders."""
    a = t.get("author") or {}
    out = {
        "id": t.get("id") or sid,
        "url": t.get("url") or f"https://x.com/i/status/{sid}",
        "author": {"name": a.get("name"), "screen_name": a.get("screen_name")},
        "text": t.get("text") or "",
        "created_at": datetime.fromtimestamp(t["created_timestamp"], tz=timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ") if t.get("created_timestamp") else None,
        "lang": t.get("lang"),
        "media": [],
    }
    # avatar (one file per account)
    sn = a.get("screen_name")
    if sn and a.get("avatar_url"):
        ap = OUT / f"avatar-{sn}.jpg"
        if not ap.exists(): save_image(s, a["avatar_url"].replace("_200x200", "_400x400"), ap, 200)
        if ap.exists(): out["author"]["avatar"] = ap.name
    if with_media:
        for n, me in enumerate((t.get("media") or {}).get("all") or [], 1):
            kind = me.get("type")
            src = me.get("url") if kind == "photo" else me.get("thumbnail_url")
            if not src: continue
            fn = f"{sid}-{n}.jpg"; p = OUT / fn
            info = {"w": me.get("width"), "h": me.get("height")} if p.exists() else save_image(s, src, p)
            if not info: continue
            if p.exists():
                im = Image.open(p); info = {"w": im.width, "h": im.height}
            out["media"].append({"type": kind, "file": fn, "w": info["w"], "h": info["h"], "src": src})
    q = t.get("quote")
    if q: out["quote"] = pack(q, s, q.get("id") or "q", with_media=False)
    return out

def main():
    ap = argparse.ArgumentParser(); ap.add_argument("--force", action="store_true"); ap.add_argument("--only")
    args = ap.parse_args()
    OUT.mkdir(parents=True, exist_ok=True)
    posts = json.loads(POSTS.read_text()) if POSTS.exists() else {}
    manifest = json.loads((DATA / "manifest.json").read_text())["files"]
    wanted = {}
    for f in manifest:
        for it in json.loads((DATA / f).read_text()):
            m = it.get("media") or {}
            if m.get("type") != "x": continue
            user, sid = status_of(m.get("ref"))
            if sid and (not args.only or args.only == it["id"]): wanted.setdefault(sid, {"user": user, "records": []})["records"].append(it["id"])
    s = requests.Session()
    n_new = n_unavail = 0
    for i, (sid, w) in enumerate(sorted(wanted.items()), 1):
        if sid in posts and not args.force:
            posts[sid]["records"] = sorted(set(posts[sid].get("records", []) + w["records"])); continue
        data, code = get_json(s, f"https://api.fxtwitter.com/{w['user']}/status/{sid}")
        if data and data.get("tweet"):
            posts[sid] = pack(data["tweet"], s, sid); posts[sid]["records"] = w["records"]; n_new += 1
        else:
            posts[sid] = {"id": sid, "url": f"https://x.com/{w['user']}/status/{sid}", "unavailable": True, "http": code, "records": w["records"], "fetched": datetime.now(timezone.utc).strftime("%Y-%m-%d")}
            n_unavail += 1
        print(f"{i}/{len(wanted)} {sid} {'ok' if not posts[sid].get('unavailable') else 'unavailable ' + str(code)}", flush=True)
        POSTS.write_text(json.dumps(posts, ensure_ascii=False, indent=1, sort_keys=True) + "\n")
        time.sleep(0.6)
    POSTS.write_text(json.dumps(posts, ensure_ascii=False, indent=1, sort_keys=True) + "\n")
    print(f"done. posts={len(posts)} new={n_new} unavailable={n_unavail} photos={len(list(OUT.glob('*-*.jpg')))}")

if __name__ == "__main__":
    main()
