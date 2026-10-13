#!/usr/bin/env python3
"""Validate data/*.json against data/schema.json and project rules.

Usage: python3 scripts/validate.py [--fix-order]
Exit code 0 = OK, 1 = validation errors.
Rules beyond the JSON schema:
  - id unique across all files
  - id prefix equals category, and id date part equals date
  - file name equals category (music.json holds only category "music")
  - date is a real calendar date; date_precision month => day 01, year => 01-01
  - items in each file are sorted by date asc then id (--fix-order rewrites files)
"""
import json, re, sys, datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data"

def load_schema():
    return json.loads((DATA / "schema.json").read_text(encoding="utf-8"))

def check_type(v, t):
    return {"string": str, "boolean": bool, "array": list, "object": dict}[t]

def validate_against_schema(item, schema, path, errors):
    """Minimal JSON-schema subset validator (type, required, enum, pattern, additionalProperties, items, minLength)."""
    t = schema.get("type")
    if t and not isinstance(item, check_type(item, t)) or (t == "boolean" and not isinstance(item, bool)):
        errors.append(f"{path}: expected {t}")
        return
    if "enum" in schema and item not in schema["enum"]:
        errors.append(f"{path}: {item!r} not in {schema['enum']}")
    if "pattern" in schema and isinstance(item, str) and not re.search(schema["pattern"], item):
        errors.append(f"{path}: {item!r} does not match {schema['pattern']}")
    if "minLength" in schema and isinstance(item, str) and len(item) < schema["minLength"]:
        errors.append(f"{path}: too short")
    if t == "object":
        for r in schema.get("required", []):
            if r not in item:
                errors.append(f"{path}: missing required '{r}'")
        props = schema.get("properties", {})
        for k, v in item.items():
            if k in props:
                validate_against_schema(v, props[k], f"{path}.{k}", errors)
            elif schema.get("additionalProperties") is False:
                errors.append(f"{path}: unexpected key '{k}'")
    if t == "array" and "items" in schema:
        for i, v in enumerate(item):
            validate_against_schema(v, schema["items"], f"{path}[{i}]", errors)

def main():
    fix = "--fix-order" in sys.argv
    schema = load_schema()
    manifest = json.loads((DATA / "manifest.json").read_text(encoding="utf-8"))
    errors, ids = [], {}
    total = verified = 0
    for fname in manifest["files"]:
        p = DATA / fname
        cat = fname[:-5]
        try:
            items = json.loads(p.read_text(encoding="utf-8"))
        except Exception as e:
            errors.append(f"{fname}: invalid JSON: {e}")
            continue
        if not isinstance(items, list):
            errors.append(f"{fname}: top level must be an array"); continue
        for i, it in enumerate(items):
            path = f"{fname}[{i}]"
            validate_against_schema(it, schema, path, errors)
            if not isinstance(it, dict):
                continue
            iid, date = it.get("id", ""), it.get("date", "")
            if iid in ids:
                errors.append(f"{path}: duplicate id {iid} (also in {ids[iid]})")
            ids[iid] = fname
            if it.get("category") != cat:
                errors.append(f"{path}: category {it.get('category')!r} but file is {fname}")
            if iid and not iid.startswith(f"{cat}-{date}-"):
                errors.append(f"{path}: id {iid} must start with {cat}-{date}-")
            try:
                datetime.date.fromisoformat(date)
            except ValueError:
                errors.append(f"{path}: invalid date {date!r}")
            prec = it.get("date_precision")
            if prec == "month" and not date.endswith("-01"):
                errors.append(f"{path}: date_precision month requires day 01")
            if prec == "year" and not date.endswith("-01-01"):
                errors.append(f"{path}: date_precision year requires 01-01")
            total += 1
            verified += 1 if it.get("verified") else 0
        ordered = sorted(items, key=lambda x: (x.get("date", ""), x.get("id", "")))
        if ordered != items:
            if fix:
                p.write_text(json.dumps(ordered, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
                print(f"{fname}: reordered")
            else:
                errors.append(f"{fname}: not sorted by date,id (run with --fix-order)")
    for e in errors:
        print("ERROR", e)
    print(f"items={total} verified={verified} errors={len(errors)}")
    sys.exit(1 if errors else 0)

if __name__ == "__main__":
    main()
