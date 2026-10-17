#!/usr/bin/env python3
"""Apply field patches to records.

Input JSON keyed by record id: {"<id>": {"date": ..., "title": {...}, "reference_urls": [...], "verified": true,
  "editor_note_add": "...", "resolution": "<ignored, for humans>", ...}}
Any schema field given replaces the current value (summary/detail/title merge per language).
editor_note_add is appended. If "date" changes, the id is renamed to keep <cat>-<date>-<slug>
(tools/rename_id.py is used, so media and ledgers follow). If "category" changes, the record moves
to that file and the id prefix changes too.
Usage: python3 tools/apply_patch.py fixes.json [more.json ...]
"""
import json, subprocess, sys
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]; DATA = ROOT / "data"

def load_all():
    files = json.loads((DATA / "manifest.json").read_text())["files"]
    return {f: json.loads((DATA / f).read_text()) for f in files}

def save(f, rows): (DATA / f).write_text(json.dumps(rows, ensure_ascii=False, indent=2) + "\n")

def main(paths):
    patches = {}
    for p in paths: patches.update(json.loads(Path(p).read_text()))
    renames = []
    for pid, pt in patches.items():
        tables = load_all(); where = None
        for f, rows in tables.items():
            for r in rows:
                if r["id"] == pid: where = (f, r); break
            if where: break
        if not where: print("missing:", pid); continue
        f, r = where
        for k, v in pt.items():
            if k in ("resolution", "editor_note_add"): continue
            if k in ("title", "summary", "detail") and isinstance(v, dict): r[k] = {**(r.get(k) or {}), **v}
            else: r[k] = v
        if pt.get("editor_note_add"): r["editor_note"] = (r.get("editor_note") + " / " if r.get("editor_note") else "") + pt["editor_note_add"].strip()
        new_cat = r["category"]; new_date = r["date"]
        slug = pid.split("-", 4)[4]
        new_id = f"{new_cat}-{new_date}-{slug}"
        if new_cat + ".json" != f:  # move file
            tables[f].remove(r); tables[new_cat + ".json"].append(r); save(f, tables[f]); save(new_cat + ".json", tables[new_cat + ".json"])
        else: save(f, tables[f])
        if new_id != pid:
            subprocess.run([sys.executable, str(ROOT / "tools" / "rename_id.py"), pid, new_id], check=True); renames.append((pid, new_id))
        print("patched", pid, "->" if new_id != pid else "", new_id if new_id != pid else "")
    if renames: print("renamed:", renames)

if __name__ == "__main__":
    main(sys.argv[1:])
