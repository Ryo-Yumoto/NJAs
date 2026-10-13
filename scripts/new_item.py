#!/usr/bin/env python3
"""Print a JSON skeleton for a new archive item.

Usage:
  python3 scripts/new_item.py --category magazine --date 2024-03-01 --slug vogue-korea [--precision month] [--entity njz]
"""
import argparse, json

DEFAULT_DATE_TYPE = {
    "music": "release", "mv": "release", "tv": "broadcast", "magazine": "publish",
    "web": "publish", "ad": "announce", "tweet": "post", "goods": "sale_start",
}

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--category", required=True, choices=list(DEFAULT_DATE_TYPE))
    ap.add_argument("--date", required=True, help="YYYY-MM-DD")
    ap.add_argument("--slug", required=True)
    ap.add_argument("--precision", default="day", choices=["day", "month", "year"])
    ap.add_argument("--entity", default="newjeans", choices=["newjeans", "njz"])
    a = ap.parse_args()
    item = {
        "id": f"{a.category}-{a.date}-{a.slug}",
        "date": a.date,
        "date_type": DEFAULT_DATE_TYPE[a.category],
        "date_precision": a.precision,
        "category": a.category,
        "entity": a.entity,
        "members": ["all"],
        "title": {"ja": "", "en": ""},
        "summary": {"ja": "", "en": ""},
        "source_url": "https://",
        "reference_urls": [],
        "media": {"type": "none"},
        "local_assets": [],
        "tags": [],
        "verified": False,
        "note": ""
    }
    print(json.dumps(item, ensure_ascii=False, indent=2))

if __name__ == "__main__":
    main()
