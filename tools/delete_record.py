#!/usr/bin/env python3
"""Delete a record that duplicates another (docs/data-policy.md, duplicates rule).
Removes OLD_ID from data/*.json, re-points data/refs/*.json record fields to KEEP_ID, drops its
media/auto image and index entry, and records OLD_ID -> KEEP_ID in data/id-aliases.json so old links
land on the kept record. Aliases that pointed at OLD_ID are re-pointed too.
Without KEEP_ID (a record deleted as unsupported, not as a duplicate) no alias is written and ledger
items that pointed at it are marked excluded with REASON.
Usage: python3 tools/delete_record.py OLD_ID KEEP_ID
       python3 tools/delete_record.py OLD_ID --none "REASON"
"""
import json, sys
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]; DATA = ROOT / "data"

def main(old, keep, reason=None):
    found = kept = False
    for f in json.loads((DATA / "manifest.json").read_text())["files"]:
        p = DATA / f; rows = json.loads(p.read_text())
        kept = kept or any(r["id"] == keep for r in rows)
        left = [r for r in rows if r["id"] != old]
        if len(left) != len(rows):
            found = True; p.write_text(json.dumps(left, ensure_ascii=False, indent=2) + "\n")
    if not found: sys.exit(f"not found: {old}")
    if keep and not kept: sys.exit(f"keep id not found: {keep}")
    for p in (DATA / "refs").glob("*.json"):
        txt = p.read_text()
        if f'"{old}"' not in txt: continue
        if keep: p.write_text(txt.replace(f'"{old}"', f'"{keep}"')); continue
        L = json.loads(txt)
        for it in L["items"]:
            if it.get("record") == old: it["record"] = None; it["exclude"] = reason
        p.write_text(json.dumps(L, ensure_ascii=False, indent=1) + "\n")
    idx = ROOT / "media" / "auto" / "index.json"
    if idx.exists():
        d = json.loads(idx.read_text())
        e = d.pop(old, None)
        if e:
            (ROOT / "media" / "auto" / e["file"]).unlink(missing_ok=True)
            idx.write_text(json.dumps(d, ensure_ascii=False, indent=1, sort_keys=True) + "\n")
    if not keep:
        print(f"deleted {old} (no alias)"); return
    ap = DATA / "id-aliases.json"
    aliases = json.loads(ap.read_text()) if ap.exists() else {}
    for k, v in aliases.items():
        if v == old: aliases[k] = keep
    aliases[old] = keep
    ap.write_text(json.dumps(dict(sorted(aliases.items())), ensure_ascii=False, indent=1) + "\n")
    print(f"deleted {old} -> alias to {keep}")

if __name__ == "__main__":
    if len(sys.argv) == 4 and sys.argv[2] == "--none": main(sys.argv[1], None, sys.argv[3])
    elif len(sys.argv) == 3 and sys.argv[2] != "--none": main(sys.argv[1], sys.argv[2])
    else: sys.exit(__doc__)
