#!/usr/bin/env python3
"""Refresh the official-channel video ledger (data/refs/youtube_videos.json).

Lists the channel's Videos tab (long-form only; Shorts tab is not read) through YouTube's
browse endpoint, then fetches the watch page of each video not yet in the ledger to get
its exact publish date and length. Existing items keep their record/exclude fields.

Usage: python3 scripts/fetch_youtube_list.py [--channel UC...] [--dry-run]
Then: python3 scripts/coverage.py --missing
"""
import argparse, json, os, re, time
from datetime import date
from pathlib import Path

import requests

ROOT = Path(__file__).resolve().parents[1]
LEDGER = ROOT / "data" / "refs" / "youtube_videos.json"
CHANNEL = "UCMki_UkHb4qSc0qyEcOHHJw"  # @NewJeans_official
H = {"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
     "X-YouTube-Client-Name": "1", "X-YouTube-Client-Version": "2.20240101.00.00", "Accept-Language": "en-US,en;q=0.8"}
CTX = {"context": {"client": {"clientName": "WEB", "clientVersion": "2.20240101.00.00", "hl": "en", "gl": "US"}}}

def session():
    s = requests.Session(); s.headers.update(H)
    ca = os.environ.get("REQUESTS_CA_BUNDLE") or "/root/.ccr/ca-bundle.crt"
    if Path(ca).exists(): s.verify = ca
    return s

def walk(o, out, toks):
    if isinstance(o, dict):
        if "lockupViewModel" in o:
            lv = o["lockupViewModel"]; vid = lv.get("contentId")
            try: title = lv["metadata"]["lockupMetadataViewModel"]["title"]["content"]
            except Exception: title = None
            if vid and title and len(vid) == 11: out.setdefault(vid, title)
        if "videoRenderer" in o:
            v = o["videoRenderer"]
            if v.get("videoId"): out.setdefault(v["videoId"], "".join(x.get("text", "") for x in v.get("title", {}).get("runs", [])))
        if "continuationCommand" in o and o["continuationCommand"].get("token"): toks.append(o["continuationCommand"]["token"])
        for v in o.values(): walk(v, out, toks)
    elif isinstance(o, list):
        for v in o: walk(v, out, toks)

def list_videos(s, channel):
    out, toks = {}, []
    r = s.post("https://www.youtube.com/youtubei/v1/browse?prettyPrint=false", json={**CTX, "browseId": channel, "params": "EgZ2aWRlb3PyBgQKAjoA"}, timeout=40)
    r.raise_for_status(); walk(r.json(), out, toks)
    seen = set()
    while toks:
        t = toks.pop(0)
        if t in seen: continue
        seen.add(t); toks = []
        r = s.post("https://www.youtube.com/youtubei/v1/browse?prettyPrint=false", json={**CTX, "continuation": t}, timeout=40)
        if r.status_code != 200: break
        n = len(out); walk(r.json(), out, toks)
        if len(out) == n and not toks: break
        time.sleep(0.4)
    return out

def watch_info(s, vid):
    """Exact publish date in KST via the next endpoint (watch pages may be blocked); length if available."""
    from datetime import datetime
    body = {"context": {"client": {**CTX["context"]["client"], "timeZone": "Asia/Seoul", "utcOffsetMinutes": 540}}, "videoId": vid}
    r = s.post("https://www.youtube.com/youtubei/v1/next?prettyPrint=false", json=body, timeout=40)
    m = re.search(r'"dateText":\{"simpleText":"([A-Z][a-z]{2} \d{1,2}, \d{4})"', r.text)
    d = re.search(r'"lengthSeconds":"(\d+)"', r.text)
    pub = datetime.strptime(m.group(1), "%b %d, %Y").strftime("%Y-%m-%d") if m else None
    return pub, (int(d.group(1)) if d else None)

def main():
    ap = argparse.ArgumentParser(); ap.add_argument("--channel", default=CHANNEL); ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--refresh-dates", action="store_true", help="re-read the exact KST publish date of every ledger item")
    a = ap.parse_args()
    L = json.loads(LEDGER.read_text())
    have = {i["key"]: i for i in L["items"]}
    s = session(); vids = list_videos(s, a.channel)
    print(f"channel videos listed: {len(vids)}; in ledger: {len(have)}")
    new = [v for v in vids if v not in have]
    for n, vid in enumerate(new, 1):
        pub, secs = watch_info(s, vid)
        item = {"key": vid, "date": pub or date.today().isoformat(), "title": vids[vid], "url": f"https://www.youtube.com/watch?v={vid}", "record": None, "exclude": None}
        if secs is not None: item["seconds"] = secs
        if not pub: item["note"] = "publish date not found on watch page; set to fetch date"
        print(f"+ {item['date']} {vid} {vids[vid][:70]}")
        L["items"].append(item)
        time.sleep(0.5)
    if a.refresh_dates:
        changed = 0
        for n, it in enumerate(L["items"], 1):
            pub, _ = watch_info(s, it["key"])
            if pub and pub != it.get("date"): it["date"] = pub; changed += 1
            if n % 50 == 0: print(f"  dates checked {n}/{len(L['items'])}, changed {changed}", flush=True)
            time.sleep(0.3)
        print(f"dates refreshed: {changed} changed")
    gone = [k for k in have if k not in vids]
    if gone: print(f"in ledger but no longer listed ({len(gone)}): {gone[:10]} (kept; mark exclude manually if removed)")
    L["items"].sort(key=lambda i: (i.get("date") or "", i["key"]))
    L["fetched"] = date.today().isoformat()
    if not a.dry_run:
        LEDGER.write_text(json.dumps(L, ensure_ascii=False, indent=1) + "\n")
    print(f"added {len(new)}; ledger items {len(L['items'])}")

if __name__ == "__main__":
    main()
