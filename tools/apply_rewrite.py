#!/usr/bin/env python3
"""Apply reader-text rewrites (summary/detail/note) produced by the rewrite agents.

Input: one or more JSON files keyed by record id:
  {"<id>": {"summary": {"ja","en"}, "detail": {"ja","en"}, "note": "...", "editor_note_add": "...", "credits_add": {...}}}
Only present keys are applied. editor_note_add is appended to editor_note (joined with " / ").
Usage: python3 tools/apply_rewrite.py out_A.json [out_B.json ...]
"""
import json, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data"

def main(paths):
    patches = {}
    for p in paths: patches.update(json.loads(Path(p).read_text()))
    manifest = json.loads((DATA / "manifest.json").read_text())["files"]
    applied, missing = 0, set(patches)
    for f in manifest:
        fp = DATA / f; rows = json.loads(fp.read_text()); changed = False
        for r in rows:
            pt = patches.get(r["id"])
            if not pt: continue
            missing.discard(r["id"])
            for k in ("summary", "detail"):
                if isinstance(pt.get(k), dict):
                    cur = dict(r.get(k) or {})
                    for lang in ("ja", "en"):
                        if pt[k].get(lang) is not None: cur[lang] = pt[k][lang]
                    r[k] = cur
            if "note" in pt: r["note"] = pt["note"] or None
            if pt.get("editor_note_add"):
                r["editor_note"] = (r.get("editor_note") + " / " if r.get("editor_note") else "") + pt["editor_note_add"].strip()
            if isinstance(pt.get("credits_add"), dict) and pt["credits_add"]:
                r["credits"] = {**(r.get("credits") or {}), **pt["credits_add"]}
            if r.get("note") is None: r.pop("note", None)
            applied += 1; changed = True
        if changed: fp.write_text(json.dumps(rows, ensure_ascii=False, indent=2) + "\n")
    print(f"applied {applied}; missing ids: {sorted(missing)[:10]}{' ...' if len(missing) > 10 else ''}")

if __name__ == "__main__":
    main(sys.argv[1:])
