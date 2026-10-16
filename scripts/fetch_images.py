#!/usr/bin/env python3
"""Fetch a representative image for each archive item into media/auto/.

Sources, in order:
  0. image.url set on the record (manual override, e.g. album cover art)
  1. media.type == youtube  -> i.ytimg.com maxresdefault (fallback hqdefault)
  1b. media.type == x       -> the post's first photo / video thumbnail via api.vxtwitter.com
  2. og:image / twitter:image of source_url, then of each reference_urls entry
Pages on wiki domains (wikipedia, namu, wikidata) are skipped as image sources
because their og:image is the article's generic lead image, not the item.
Images are resized to max 1400px on the long side and stored as JPEG.
Provenance is written to media/auto/index.json (id -> file, image URL, page URL).

Usage: python3 scripts/fetch_images.py [--only CATEGORY] [--force] [--workers 6]
Re-runs skip ids already present in index.json unless --force.
"""
import argparse, io, json, os, re, sys, time, threading
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from urllib.parse import urljoin, urlparse

import requests
from bs4 import BeautifulSoup
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
DATA, OUT = ROOT / "data", ROOT / "media" / "auto"
INDEX = OUT / "index.json"
UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36"
SKIP_HOSTS = ("wikipedia.org", "namu.wiki", "wikidata.org", "x.com", "twitter.com", "youtube.com", "youtu.be")
MIN_SIDE, MAX_SIDE = 320, 1400
# site-wide placeholder images (logos, category covers) that og:image returns for every page
GENERIC_IMAGE = (r"shop\.weverse\.io/weverseshop-og\.png", r"billboard\.com/.*/assets/app/icons/", r"sportskeeda\.com/.*/cover-images/category/", r"linkareer\.com/images/og/preview\.png", r"/weverse-og\.png", r"instagram\.com/static/images/ico/")
lock = threading.Lock()

def session():
    s = requests.Session()
    s.headers.update({"User-Agent": UA, "Accept-Language": "ja,en;q=0.8,ko;q=0.6"})
    ca = os.environ.get("REQUESTS_CA_BUNDLE") or "/root/.ccr/ca-bundle.crt"
    if Path(ca).exists(): s.verify = ca
    return s

def page_image(s, url):
    if any(h in urlparse(url).netloc for h in SKIP_HOSTS): return None
    try:
        r = s.get(url, timeout=20, allow_redirects=True)
        if r.status_code != 200 or "html" not in r.headers.get("content-type", ""): return None
    except Exception:
        return None
    soup = BeautifulSoup(r.text[:600000], "html.parser")
    for sel in ('meta[property="og:image:secure_url"]', 'meta[property="og:image"]', 'meta[name="twitter:image"]', 'meta[name="twitter:image:src"]', 'link[rel="image_src"]'):
        m = soup.select_one(sel)
        if m and (m.get("content") or m.get("href")):
            return urljoin(r.url, (m.get("content") or m.get("href")).strip())
    return None

def download(s, url):
    try:
        r = s.get(url, timeout=25)
        if r.status_code != 200: return None
        im = Image.open(io.BytesIO(r.content)); im.load()
    except Exception:
        return None
    if min(im.size) < MIN_SIDE: return None
    w, h = im.size
    if max(w, h) / min(w, h) > 3.2: return None  # banners / logos
    if im.mode not in ("RGB",): im = im.convert("RGB")
    if max(w, h) > MAX_SIDE:
        sc = MAX_SIDE / max(w, h); im = im.resize((round(w * sc), round(h * sc)), Image.LANCZOS)
    return im

def x_media(s, url):
    m = re.search(r"(?:x|twitter)\.com/([^/]+)/status/(\d+)", url)
    if not m: return None
    try:
        r = s.get(f"https://api.vxtwitter.com/{m.group(1)}/status/{m.group(2)}", timeout=20, headers={"Accept": "application/json", "User-Agent": "curl/8.5.0"})
        if r.status_code != 200 or not r.headers.get("content-type", "").startswith("application/json"): return None
        for me in r.json().get("media_extended", []):
            u = me.get("thumbnail_url") if me.get("type") == "video" else me.get("url")
            if u: return u
    except Exception:
        return None
    return None

def candidates(it):
    m = it.get("media") or {}
    if it.get("image", {}).get("url"):
        yield ("direct", it["image"]["url"])
    if m.get("type") == "youtube" and m.get("ref"):
        for q in ("maxresdefault", "sddefault", "hqdefault"):
            yield ("direct", f"https://i.ytimg.com/vi/{m['ref']}/{q}.jpg")
    if m.get("type") == "x" and m.get("ref"):
        yield ("x", m["ref"])
    yield ("page", it["source_url"])
    for u in it.get("reference_urls", []): yield ("page", u)

def work(it, s):
    for kind, url in candidates(it):
        img_url = url if kind == "direct" else (x_media(s, url) if kind == "x" else page_image(s, url))
        if not img_url or any(re.search(g, img_url) for g in GENERIC_IMAGE): continue
        im = download(s, img_url)
        if im is None: continue
        if kind == "direct" and im.size[1] == 90: continue  # yt placeholder
        f = OUT / f"{it['id']}.jpg"
        im.save(f, "JPEG", quality=82, optimize=True, progressive=True)
        return {"file": f.name, "image_url": img_url, "page_url": url, "w": im.size[0], "h": im.size[1], "fetched": time.strftime("%Y-%m-%d")}
    return None

def main():
    ap = argparse.ArgumentParser(); ap.add_argument("--only"); ap.add_argument("--force", action="store_true"); ap.add_argument("--workers", type=int, default=6)
    a = ap.parse_args()
    OUT.mkdir(parents=True, exist_ok=True)
    index = json.loads(INDEX.read_text()) if INDEX.exists() and not a.force else {}
    manifest = json.loads((DATA / "manifest.json").read_text())
    items = []
    for f in manifest["files"]:
        if a.only and f[:-5] != a.only: continue
        items += [i for i in json.loads((DATA / f).read_text()) if i["id"] not in index]
    print(f"to fetch: {len(items)}", flush=True)
    s = session(); done = ok = 0
    with ThreadPoolExecutor(max_workers=a.workers) as ex:
        futs = {ex.submit(work, it, s): it for it in items}
        for fu in as_completed(futs):
            it = futs[fu]; res = None
            try: res = fu.result()
            except Exception as e: print("ERR", it["id"], e, flush=True)
            done += 1
            with lock:
                if res: index[it["id"]] = res; ok += 1
                if done % 10 == 0 or done == len(items):
                    INDEX.write_text(json.dumps(index, ensure_ascii=False, indent=1, sort_keys=True) + "\n")
                    print(f"{done}/{len(items)} fetched={ok}", flush=True)
    INDEX.write_text(json.dumps(index, ensure_ascii=False, indent=1, sort_keys=True) + "\n")
    print(f"done. images={len(index)}")

if __name__ == "__main__":
    main()
