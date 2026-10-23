# NJAs record rules (for agents writing or correcting records)

Site: private bilingual archive of NewJeans' official activities, read chronologically. Each record must conform EXACTLY to /home/user/NJAs/data/schema.json (read it first; additionalProperties is false). Write valid JSON only (array of records) to the output path given in your task. Do NOT modify anything under /home/user/NJAs. Keep your working files under the scratchpad research directory.

Use today's date. Cover 2022-07-01 through today (NJZ period included; entity "njz" for activities done under the NJZ name, "newjeans" otherwise; "predebut" before 2022-07).

Dedupe: <scratchpad>/existing_ids.json (generate with: python3 scripts/nightly_ids.py <scratchpad>/existing_ids.json) lists existing ids/dates/titles per file. Do not re-add an event already present (same event, same date). If an existing record is wrong, report it in your handback instead of duplicating.

Record rules
- id: <category>-<YYYY-MM-DD>-<slug> (lowercase ascii, hyphens). Unique.
- date = the day the thing happened/was released; date_precision day/month/year; date_type per schema (event for appearances, release/sale_start for products).
- title.ja and title.en required; title.original for Korean titles.
- summary.ja/en: one sentence each (40–80 JP chars). detail.ja/en: 2–5 sentences, facts only, nothing known only later than that date (spoiler-safe: no "would later", no future dates).
- members: ["all"] for group; otherwise only the member(s) involved (minji, hanni, danielle, haerin, hyein).
- source_url: an official primary source (newjeans.kr, ador.world, Weverse notice, official X/Instagram/YouTube, organiser/brand official page). If only secondary (Wikipedia, namu.wiki, Soompi, news), use it and set verified=false.
- reference_urls: secondary sources used.
- verified=true only when you actually fetched an official/highly reliable page confirming date and content.
- media: {"type":"youtube","ref":"<id>"} only for an official video you confirmed; {"type":"x","ref":"<post url>"} for an official X post you confirmed; else {"type":"none"}.
- image: {"url": "<direct image url>", "source_url": "<page>"} for one representative official image when available (official X/Instagram photo, organiser page, brand page). Never a site logo / generic og:image.
- tags: see task. editor_note for provenance/uncertainty (not shown to readers). note only for reader-facing facts known at that date.
- Never fabricate. Omit what you cannot confirm. Completeness of verified rows beats polish.
- Style: Japanese member names ミンジ, ハニ, ダニエル, ヘリン, ヘイン; song titles in 「」 in JP and single quotes in EN; no outlet-led openings ("Soompi reported..."); neutral tone.

Tools: WebSearch/WebFetch; python3 -I for any script reading downloaded files; keep downloads in their own directory.
Finish with a handback listing: output path, record count, verified count, sources used, events you found but could not confirm (with why), and any existing records that look wrong.

Additions (2026-10)
- Bilingual: title, summary and detail need both ja and en. A reader note goes in note (ja) and note_en (en). Credit values or product names (asset_titles) written in Korean/Japanese are given as {"ja": "...", "en": "..."}; Latin official names stay plain strings.
- Credit keys use the existing vocabulary (label, channel, brand, venue, broadcaster, program, publisher, photographer, stylist, director, ...); do not invent near-duplicates.
- Japanese copy: plain, factual, no outlet-led openings, no future knowledge. Korean names in katakana as 姓・名.
