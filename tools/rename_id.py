#!/usr/bin/env python3
"""Rename a record id everywhere (and record old -> new in data/id-aliases.json so old links keep working): data/*.json (the record and text mentions in editor_note/links),
data/refs/*.json (record fields), media/auto/index.json and its file, media/<cat>/<id>/ galleries
(image.path / local_assets rewritten). Does not change the record's date; set that separately.
Usage: python3 tools/rename_id.py OLD_ID NEW_ID
"""
import json, os, sys
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]; DATA = ROOT / "data"

def main(old, new):
    n = 0
    for f in json.loads((DATA / "manifest.json").read_text())["files"]:
        p = DATA / f; txt = p.read_text()
        if old not in txt: continue
        rows = json.loads(txt)
        for r in rows:
            if r["id"] == old:
                r["id"] = new; n += 1
                cat = r["category"]
                if (r.get("image") or {}).get("path", "").startswith(f"{cat}/{old}/"): r["image"]["path"] = r["image"]["path"].replace(f"{cat}/{old}/", f"{cat}/{new}/")
                if r.get("local_assets"): r["local_assets"] = [a.replace(f"{cat}/{old}/", f"{cat}/{new}/") for a in r["local_assets"]]
        p.write_text(json.dumps(rows, ensure_ascii=False, indent=2).replace(old, new) + "\n")
    for p in (DATA / "refs").glob("*.json"):
        txt = p.read_text()
        if old in txt: p.write_text(txt.replace(old, new))
    idx = ROOT / "media" / "auto" / "index.json"
    if idx.exists():
        d = json.loads(idx.read_text())
        if old in d:
            e = d.pop(old); src = ROOT / "media" / "auto" / e["file"]; dst = ROOT / "media" / "auto" / (new + ".jpg")
            if src.exists(): src.rename(dst)
            e["file"] = dst.name; d[new] = e
            idx.write_text(json.dumps(d, ensure_ascii=False, indent=1, sort_keys=True) + "\n")
    for cat_dir in (ROOT / "media").iterdir():
        g = cat_dir / old
        if g.is_dir(): g.rename(cat_dir / new)
    al = DATA / "id-aliases.json"
    aliases = json.loads(al.read_text()) if al.exists() else {}
    for k, v in list(aliases.items()):
        if v == old: aliases[k] = new
    aliases[old] = new
    al.write_text(json.dumps(dict(sorted(aliases.items())), ensure_ascii=False, indent=1) + "\n")
    print(f"renamed {old} -> {new} ({n} record); alias recorded")

if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
