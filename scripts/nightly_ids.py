#!/usr/bin/env python3
"""Write the list of existing records (id, date, English title, members) per data file, for agents to dedupe against.
Usage: python3 scripts/nightly_ids.py OUT.json"""
import json, sys
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]; DATA = ROOT / "data"
out = {f[:-5]: [{"id": r["id"], "date": r["date"], "title": r["title"]["en"], "members": r.get("members", ["all"])} for r in json.loads((DATA / f).read_text())]
       for f in json.loads((DATA / "manifest.json").read_text())["files"]}
Path(sys.argv[1]).write_text(json.dumps(out, ensure_ascii=False, indent=0)); print(sum(len(v) for v in out.values()), "records ->", sys.argv[1])
