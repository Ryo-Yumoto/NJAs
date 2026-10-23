# NJAs coverage ledger brief

Purpose: the archive must be able to say "complete" per category by measuring against a reference list (ledger), not by guessing. You build ledgers; you do NOT add records and do NOT modify anything under /home/user/NJAs. Write outputs to the scratchpad research directory at the paths your task names.

Ledger JSON format (one file per ledger; see /home/user/NJAs/data/refs/youtube_videos.json and /home/user/NJAs/scripts/coverage.py):
{"name": "<snake_case>", "category": "<record category>", "scope": "<one Japanese sentence defining exactly what this ledger enumerates>",
 "source": "<url of the primary list used>", "fetched": "<today, YYYY-MM-DD>", "match": "manual",
 "items": [{"key": "<stable slug, lowercase ascii>", "date": "YYYY-MM-DD" (first day of month if only month known), "title": "<English title>",
            "url": "<source page for this item>", "record": "<existing record id that covers it>" | null, "exclude": "<reason in Japanese>" | null,
            "note": "<optional: details needed to add it later, e.g. broadcaster, songs performed>"}]}

Matching to existing records: <scratchpad>/existing_ids.json (generate with: python3 scripts/nightly_ids.py <scratchpad>/existing_ids.json) lists every record (id, date, English title, members) per data file. Match by date and content; a record that covers the item gets its id in "record". A matched id must exist exactly as listed. When an existing record has a wrong date or title compared with your source, still match it and add "note": "existing record date differs: ..." and list it in your handback.

Exclusions: set "exclude" only for items outside the archive's policy (docs/data-policy.md in the repo: official activities of NewJeans/NJZ and the members; YouTube Shorts excluded; SNS limited to announcements/releases/milestones/statements). Everything else stays in with record=null if not yet covered.

Sources: use Wikipedia (en/ko/ja), namu.wiki (via web search if the site blocks fetches), official sites, and broadcaster/organiser pages; prefer the most complete list and merge others. Each ledger should be the union of the lists you find; cite the lists in "source" (comma-separated if several). Period: 2022-07-01 to today (include NJZ period). Use python3 -I for any script reading downloaded files; keep downloads in their own directory.

Handback: for each ledger, give counts (items, matched, unmatched, excluded), the source lists used, and existing records whose date/title disagrees with the sources. Keep the report under 60 lines.
