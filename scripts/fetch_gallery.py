#!/usr/bin/env python3
"""Download curated galleries (a cover image plus individual images) for records.

Spec (JSON, keyed by record id):
  {"goods-2023-11-23-line-friends-hang-out-with-newjeans-collection":
     {"cover": "https://.../lineup.jpg", "items": ["https://.../item1.jpg", ...],
      "source": "https://page/where/the/images/come/from", "note": "optional editor note"}}

Files go to media/<category>/<id>/cover.jpg and media/<category>/<id>/01.jpg ...
The record gets image = {"path": "<category>/<id>/cover.jpg", "source_url": source}
and local_assets = ["<category>/<id>/01.jpg", ...]. Existing gallery files for the id are replaced.
Images are resized to max 1400px on the long side and stored as JPEG.

Usage: python3 scripts/fetch_gallery.py spec.json
"""
import io, json, shutil, sys, time
from pathlib import Path

import requests
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data"
MAX_SIDE = 1400
UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36"

def fetch(s, url):
    for i in range(3):
        try:
            r = s.get(url, timeout=40, headers={"User-Agent": UA, "Referer": url})
            if r.status_code == 200 and r.content:
                im = Image.open(io.BytesIO(r.content)); im.load()
                if im.mode in ("RGBA", "LA", "P"):
                    bg = Image.new("RGB", im.size, (255, 255, 255)); bg.paste(im.convert("RGBA"), mask=im.convert("RGBA").split()[-1]); im = bg
                else: im = im.convert("RGB")
                w, h = im.size
                if max(w, h) > MAX_SIDE:
                    sc = MAX_SIDE / max(w, h); im = im.resize((round(w * sc), round(h * sc)), Image.LANCZOS)
                return im
        except Exception:
            time.sleep(1.5)
    return None

def main(spec_path):
    spec = json.loads(Path(spec_path).read_text())
    manifest = json.loads((DATA / "manifest.json").read_text())["files"]
    s = requests.Session(); done = {}
    for f in manifest:
        fp = DATA / f; rows = json.loads(fp.read_text()); changed = False
        for r in rows:
            sp = spec.get(r["id"])
            if not sp: continue
            cat = r["category"]; d = ROOT / "media" / cat / r["id"]
            if d.exists(): shutil.rmtree(d)
            d.mkdir(parents=True)
            cover = fetch(s, sp["cover"]) if sp.get("cover") else None
            items = []
            for n, u in enumerate(sp.get("items") or [], 1):
                im = fetch(s, u)
                if im is None: continue
                name = f"{n:02d}.jpg"; im.save(d / name, "JPEG", quality=88, optimize=True); items.append(f"{cat}/{r['id']}/{name}")
            if cover is None and items:
                # no usable cover: promote the first item
                cover_path = items.pop(0)
            elif cover is not None:
                cover.save(d / "cover.jpg", "JPEG", quality=88, optimize=True); cover_path = f"{cat}/{r['id']}/cover.jpg"
            else:
                shutil.rmtree(d); done[r["id"]] = "nothing fetched"; continue
            r["image"] = {"path": cover_path, "source_url": sp.get("source") or r.get("source_url")}
            r["local_assets"] = items
            if sp.get("note"): r["editor_note"] = (r.get("editor_note") + " / " if r.get("editor_note") else "") + sp["note"]
            done[r["id"]] = f"cover + {len(items)} items"; changed = True
        if changed: fp.write_text(json.dumps(rows, ensure_ascii=False, indent=2) + "\n")
    for k, v in done.items(): print(k, "->", v)
    missing = set(spec) - set(done)
    if missing: print("ids not found in data:", sorted(missing))

if __name__ == "__main__":
    main(sys.argv[1])
