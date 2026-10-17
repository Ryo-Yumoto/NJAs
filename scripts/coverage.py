#!/usr/bin/env python3
"""Coverage report: compare reference ledgers (data/refs/*.json) with the records.

A ledger lists everything that exists for one scope (e.g. every long-form video on the
official YouTube channel) so that "complete" can be measured instead of guessed.

Ledger format:
  {"name": "...", "category": "content", "scope": "...", "source": "...", "fetched": "YYYY-MM-DD",
   "match": "youtube_id" | "manual",
   "items": [{"key": "...", "date": "YYYY-MM-DD", "title": "...", "url": "...",
              "record": "<record id>" | null, "exclude": "<reason>" | null}]}

match=youtube_id: an item is covered when any record references its key (media.ref,
source_url, links, reference_urls). match=manual: covered when item.record names an existing id.
exclude marks items that are out of scope by policy (see docs/data-policy.md) and are not counted.

Usage: python3 scripts/coverage.py [--missing] [--ledger NAME]
"""
import argparse, json, re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA, REFS = ROOT / "data", ROOT / "data" / "refs"
YT = re.compile(r"(?:youtu\.be/|[?&]v=|/shorts/|/live/|/embed/)([A-Za-z0-9_-]{11})")

def load_records():
    rows = []
    for f in json.loads((DATA / "manifest.json").read_text())["files"]:
        rows += json.loads((DATA / f).read_text())
    return rows

def youtube_index(rows):
    idx = {}
    for r in rows:
        ids = set()
        m = r.get("media") or {}
        if m.get("type") == "youtube" and m.get("ref"): ids.add(m["ref"])
        for u in [r.get("source_url", "")] + list((r.get("links") or {}).values()) + (r.get("reference_urls") or []):
            mm = YT.search(u or "")
            if mm: ids.add(mm.group(1))
        for i in ids: idx.setdefault(i, []).append(r["id"])
    return idx

def main():
    ap = argparse.ArgumentParser(); ap.add_argument("--missing", action="store_true"); ap.add_argument("--ledger")
    a = ap.parse_args()
    rows = load_records(); ids = {r["id"] for r in rows}; yt = youtube_index(rows)
    total_missing = 0
    for p in sorted(REFS.glob("*.json")):
        L = json.loads(p.read_text())
        if a.ledger and L["name"] != a.ledger: continue
        items = L["items"]; excluded = [i for i in items if i.get("exclude")]
        live = [i for i in items if not i.get("exclude")]
        missing, bad = [], []
        for i in live:
            if L["match"] == "youtube_id": ok = i["key"] in yt
            else:
                ok = bool(i.get("record")) and i["record"] in ids
                if i.get("record") and i["record"] not in ids: bad.append(i)
            if not ok: missing.append(i)
        cov = (len(live) - len(missing)) / len(live) * 100 if live else 100
        print(f"{L['name']:<24} {L['category']:<9} items={len(items):4d} excluded={len(excluded):3d} covered={len(live)-len(missing):4d}/{len(live):<4d} {cov:5.1f}%  (fetched {L.get('fetched','?')})")
        if bad: print(f"  ! {len(bad)} items name a record id that does not exist: {[b['record'] for b in bad][:5]}")
        if a.missing:
            for i in sorted(missing, key=lambda x: x.get("date") or ""):
                print(f"  - {i.get('date','????-??-??')} {i['key']:<14} {i.get('title','')[:80]}")
        total_missing += len(missing)
    print(f"missing total: {total_missing}")

if __name__ == "__main__":
    main()
