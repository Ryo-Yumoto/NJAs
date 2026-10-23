#!/usr/bin/env python3
"""Plan an incremental Artifact publish.

Input: a text file with the artifact's current file listing as printed by the Artifact tool
(action "list", scope "files"): lines like  - "sprites/2024-05-a.jpg"  image/jpeg  2750806 bytes
Compares sizes with the local build (build/artifact/sprites*, data/*.json, media/x/posts.json,
assets/*) and writes publish chunks (each under ~58 MB, at most 200 files) as JSON maps
{published_path: source_path | null} to OUT_DIR/pub1.json, pub2.json, ... The last chunk carries
sprites.json, data, assets and removals, so the page only switches once all sheets are up.
Usage: python3 tools/publish_plan.py LISTING.txt OUT_DIR
"""
import json, os, sys
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]

def main(listing, out_dir):
    remote = {}
    for line in Path(listing).read_text().splitlines():
        line = line.strip()
        if line.startswith('- "'):
            remote[line.split('"')[1]] = int(line.split()[-2])
    os.chdir(ROOT)
    local = {"sprites.json": ("build/artifact/sprites.json", os.path.getsize("build/artifact/sprites.json"))}
    for f in os.listdir("build/artifact/sprites"): local["sprites/" + f] = ("build/artifact/sprites/" + f, os.path.getsize("build/artifact/sprites/" + f))
    for f in os.listdir("data"):
        if f.endswith(".json"): local["data/" + f] = ("data/" + f, os.path.getsize("data/" + f))
    for p in ("media/x/posts.json", "assets/js/app.js", "assets/css/style.css"): local[p] = (p, os.path.getsize(p))
    changed = {p: v for p, v in local.items() if remote.get(p) != v[1]}
    removed = [p for p in remote if p.startswith("sprites/") and p not in local]
    chunks, cur, size = [], {}, 0
    for p, (src, s) in sorted(changed.items(), key=lambda x: -x[1][1]):
        if not p.startswith("sprites/"): continue
        if size + s > 58e6 or len(cur) >= 200: chunks.append(cur); cur, size = {}, 0
        cur[p] = src; size += s
    chunks.append(cur)
    last = chunks[-1]
    for p, (src, s) in changed.items():
        if not p.startswith("sprites/"): last[p] = src
    for p in removed: last[p] = None
    Path(out_dir).mkdir(parents=True, exist_ok=True)
    for i, c in enumerate(chunks, 1): Path(out_dir, f"pub{i}.json").write_text(json.dumps(c))
    print(f"changed {len(changed)} ({sum(v[1] for v in changed.values())/1e6:.1f} MB), removed {len(removed)}, chunks {[len(c) for c in chunks]}")

if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
