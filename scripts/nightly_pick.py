#!/usr/bin/env python3
"""Pick the next batch of records for the nightly job and dump them for an agent.

Modes
  verify  : unverified records (verified=false), oldest category rotation first
  images  : records with no image at all (no auto image, no image.path, no YouTube/X media)
State: docs/nightly-state.json keeps the ids already attempted per mode, so a record that
could not be resolved is not picked again every night (it is retried after --retry-days).

Usage: python3 scripts/nightly_pick.py verify 60 OUT.json
       python3 scripts/nightly_pick.py images 40 OUT.json
       python3 scripts/nightly_pick.py mark verify OUT.json   # record that the batch was attempted
"""
import json, sys
from datetime import date, timedelta
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data"; STATE = ROOT / "docs" / "nightly-state.json"
ROTATION = ["content", "tv", "record", "live", "ad", "mv", "sns", "notice", "goods", "magazine", "web", "music"]
FIELDS = ("id", "date", "date_type", "date_precision", "category", "entity", "members", "title", "summary", "detail", "note", "note_en", "credits", "source_url", "reference_urls", "media", "image", "links", "tags", "verified", "editor_note")

def load_state():
    return json.loads(STATE.read_text()) if STATE.exists() else {"attempted": {"verify": {}, "images": {}}, "log": []}

def records():
    out = []
    for f in json.loads((DATA / "manifest.json").read_text())["files"]:
        out += json.loads((DATA / f).read_text())
    return out

def pick(mode, n, retry_days=30):
    st = load_state(); tried = dict(st["attempted"].get(mode, {}))
    # a renamed record keeps the attempt history of its old id (data/id-aliases.json maps old -> new)
    ap = DATA / "id-aliases.json"
    for old, new in (json.loads(ap.read_text()) if ap.exists() else {}).items():
        if old in tried and tried[old] > tried.get(new, "0000"): tried[new] = tried[old]
    cutoff = (date.today() - timedelta(days=retry_days)).isoformat()
    rows = records()
    if mode == "verify":
        cand = [r for r in rows if not r.get("verified")]
    else:
        idx = json.loads((ROOT / "media" / "auto" / "index.json").read_text())
        bl = ROOT / "media" / "auto" / "blocked.json"; blocked = set(json.loads(bl.read_text()).get("ids", [])) if bl.exists() else set()
        cand = [r for r in rows if r["id"] not in idx and r["id"] not in blocked and not (r.get("image") or {}).get("path") and (r.get("media") or {}).get("type") not in ("youtube", "x")]
    cand = [r for r in cand if tried.get(r["id"], "0000") < cutoff]
    # interleave categories so one night covers several kinds
    buckets = {c: sorted([r for r in cand if r["category"] == c], key=lambda r: r["date"]) for c in ROTATION}
    out = []
    while len(out) < n and any(buckets.values()):
        for c in ROTATION:
            if buckets[c] and len(out) < n: out.append(buckets[c].pop(0))
    return [{k: r[k] for k in FIELDS if k in r} for r in out], len(cand)

def main():
    if sys.argv[1] == "mark":
        mode, path = sys.argv[2], sys.argv[3]
        st = load_state(); ids = [r["id"] for r in json.loads(Path(path).read_text())]
        for i in ids: st["attempted"].setdefault(mode, {})[i] = date.today().isoformat()
        STATE.write_text(json.dumps(st, ensure_ascii=False, indent=1) + "\n"); print(f"marked {len(ids)} {mode}"); return
    mode, n, path = sys.argv[1], int(sys.argv[2]), sys.argv[3]
    batch, remaining = pick(mode, n)
    Path(path).write_text(json.dumps(batch, ensure_ascii=False, indent=1) + "\n")
    print(f"{mode}: picked {len(batch)} of {remaining} eligible -> {path}")

if __name__ == "__main__":
    main()
