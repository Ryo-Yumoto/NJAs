#!/usr/bin/env python3
"""Move sentences that reveal the future (or editorial hedging) out of reader-facing text.

Reader-facing fields: summary.ja/en, detail.ja/en, note.
A sentence is moved to editor_note when it contains an explicit date later than the
record's horizon (day: the date itself; month precision: end of that month; year: end of year)
and either cites a later report (報道/記事/according to…) or lies more than 120 days ahead; announced
schedules within 120 days (release dates, pop-up periods) stay. Editorial hedging sentences are moved too.
Usage: python3 scripts/sanitize_future.py [--dry]
"""
import json, re, sys, calendar
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
MON = {m: i + 1 for i, m in enumerate(["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"])}
EDITORIAL = re.compile(r"確認できていない|確認できておらず|未確認|could not be confirmed|not confirmed|unconfirmed|not enriched|本記録は|this record", re.I)
# a date attached to a citation ("2024年12月25日付記事", "article of March 21, 2023", "(Bandwagon, 7 January 2025)")
CITE_JA = re.compile(r"(20\d\d)年(\d{1,2})月(\d{1,2})日(付|の|、)?(報道|記事|発表の記事|付記事|のレポート)")
CITE_EN = re.compile(r"(article|report(?:ed|s)?|per|according to|coverage|piece|story)[^.;]{0,40}?\b(?:(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.? (\d{1,2}), (20\d\d)|(\d{1,2}) (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]* (20\d\d))", re.I)
NEAR_DAYS = 120  # an announced schedule (release date, pop-up period) within this window is knowledge of the time

def horizon(it):
    d = it["date"]
    if it.get("date_precision") == "month":
        y, m = int(d[:4]), int(d[5:7]); return f"{y}-{m:02d}-{calendar.monthrange(y, m)[1]:02d}"
    if it.get("date_precision") == "year": return d[:4] + "-12-31"
    return d

import datetime
def days_between(a, b): return (datetime.date.fromisoformat(b) - datetime.date.fromisoformat(a)).days
def dates_in(txt):
    out = set()
    for m in re.finditer(r"(20\d\d)-(\d\d)-(\d\d)", txt): out.add(f"{m[1]}-{m[2]}-{m[3]}")
    for m in re.finditer(r"(20\d\d)年(\d{1,2})月(\d{1,2})日", txt): out.add(f"{m[1]}-{int(m[2]):02d}-{int(m[3]):02d}")
    for m in re.finditer(r"\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.? (\d{1,2}), (20\d\d)", txt): out.add(f"{m[3]}-{MON[m[1].lower()]:02d}-{int(m[2]):02d}")
    for m in re.finditer(r"\b(\d{1,2}) (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]* (20\d\d)", txt): out.add(f"{m[3]}-{MON[m[2].lower()]:02d}-{int(m[1]):02d}")
    return out

def split(txt, lang):
    if lang == "ja": return [s for s in re.split(r"(?<=。)", txt) if s.strip()]
    return [s for s in re.split(r"(?<=[.!?])\s+(?=[A-Z\"'(])", txt) if s.strip()]

def clean(txt, lang, hz):
    keep, moved = [], []
    for s in split(txt, lang):
        fut = [d for d in dates_in(s) if d > hz]
        far = any(days_between(hz, d) > NEAR_DAYS for d in fut)
        cited = []
        for m in CITE_JA.finditer(s): cited.append(f"{m[1]}-{int(m[2]):02d}-{int(m[3]):02d}")
        for m in CITE_EN.finditer(s):
            if m.group(4): cited.append(f"{m[4]}-{MON[m[2].lower()]:02d}-{int(m[3]):02d}")
            else: cited.append(f"{m[7]}-{MON[m[6].lower()]:02d}-{int(m[5]):02d}")
        cite_future = any(d > hz for d in cited)
        if far or cite_future or EDITORIAL.search(s): moved.append(s.strip())
        else: keep.append(s.strip())
    return ("" if lang == "ja" else " ").join(keep) if lang == "ja" else " ".join(keep), moved

def main():
    dry = "--dry" in sys.argv
    man = json.loads((ROOT / "data/manifest.json").read_text())
    total_moved = 0; touched = 0
    for f in man["files"]:
        p = ROOT / "data" / f; items = json.loads(p.read_text()); ch = False
        for it in items:
            hz = horizon(it); moved_all = []
            for field in ("summary", "detail"):
                obj = it.get(field)
                if not obj: continue
                for lang in ("ja", "en"):
                    if not obj.get(lang): continue
                    new, moved = clean(obj[lang], lang, hz)
                    if moved:
                        moved_all += [f"[{field}.{lang}] " + m for m in moved]
                        if new: obj[lang] = new
                        else: obj.pop(lang, None)
                if not obj: it.pop(field, None)
            if it.get("note"):
                new, moved = clean(it["note"], "ja", hz)
                if moved: moved_all += ["[note] " + m for m in moved]; it["note"] = new; 
                if not it.get("note"): it.pop("note", None)
            if moved_all:
                it["editor_note"] = (it.get("editor_note", "") + " | removed from reader text: " + " ".join(moved_all)).strip(" |")
                total_moved += len(moved_all); touched += 1; ch = True
                if dry: print(it["id"], "->", len(moved_all))
        if ch and not dry:
            p.write_text(json.dumps(items, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"records touched={touched} sentences moved={total_moved}{' (dry run)' if dry else ''}")

if __name__ == "__main__":
    main()
