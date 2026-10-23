# 夜間バッチ手順（毎晩 02:56 JST に予約タスクが起動する）

目的：日中の手作業なしで、データの確認・補完と新着の取り込みを進める。委任はすべてOpus（docs/operations.md「作業の委任ルール」）。

進め方（2026-10-23 変更）：1晩の量に上限は設けず、5時間のトークン枠が尽きる（レート制限に当たる）か対象がなくなるまで、2〜4を「1ラウンド」として繰り返す。1ラウンドの件数は下の数を目安にし、ラウンドごとに6（検証・公開・コミット）まで済ませてから次に進む。こうしておけば、途中で枠が尽きても適用済みの分は失われない。

## 0. 準備
- `cd /home/user/NJAs && git fetch origin claude/initial-site && git status` で作業ツリーがきれいなことを確認。ずれていれば `git pull origin claude/initial-site`。
- 作業用の一時フォルダはセッションのscratchpad（コンテナが変わると消えるので、残すものはリポジトリへ）。
- `python3 scripts/nightly_ids.py <scratchpad>/existing_ids.json` を作っておく（エージェントの重複確認用）。

## 1. 新着の検知（毎晩）
- `python3 scripts/fetch_youtube_list.py` → `python3 scripts/coverage.py --missing`。
- youtube_videos に未収録があれば、Opusエージェント1体に docs/briefs/record-rules.md に従ってcontentレコードを作らせ、追加して台帳の該当項目の `record` を埋める（台帳は `match: youtube_id` なので自動で覆われる）。
- 日曜の夜だけ：Opusエージェント1体に、前回の日曜以降の公式の動き（Weverse告知、X @NewJeans_ADOR、newjeans.kr / newjeans.jp、ADOR発表、各メンバーの公式活動）を調べさせ、未収録の出来事をレコードとして提案させる。

## 2. 未確認レコードの照合（1ラウンド60件）
- `python3 scripts/nightly_pick.py verify 60 <scratchpad>/verify.json`
- Opusエージェント1体に、各レコードを一次ソースで確認させる。出力は `tools/apply_patch.py` 形式（キー＝レコードID、変更するフィールドだけ。`verified`、`date`、`reference_urls`（新しい全リスト）、本文の修正、`editor_note_add`、`resolution`（日本語で何をしたか））。確認できなかったものは `verified` を変えず `editor_note_add` に理由。
- `python3 tools/apply_patch.py <out>` → `python3 scripts/nightly_pick.py mark verify <scratchpad>/verify.json`

## 3. 画像の補完（1ラウンド40件）
- `python3 scripts/nightly_pick.py images 40 <scratchpad>/images.json`
- Opusエージェント1体に、公式の画像（公式X/Instagram、放送局・主催者・ブランド・出版社のページ）の直接URLを探させ、`{"<id>": {"image": {"url": "...", "source_url": "..."}}}` で返させる。ロゴ・汎用画像・別の日の写真は不可。
- `python3 tools/apply_patch.py <out>` → `python3 scripts/fetch_images.py` → 新しい画像を縮小一覧にして目視し、ロゴ・同一画像（ハッシュ重複）は `media/auto/blocked.json` に登録して削除 → `python3 scripts/nightly_pick.py mark images <scratchpad>/images.json`

## 4. 要確認キュー（1ラウンド5行）
- docs/review-queue.md の「未対応」「未着手」「未確認」の行から最大5行を、2のエージェントに一緒に渡して確認させる。解決した行は消す。

## 5. 一度きりの作業（残っている間だけ）
- SNS台帳：`data/refs/sns_posts.json` が無ければ、Opusエージェントに docs/briefs/ledger.md に従って作らせ（告知・発売・節目・声明の公式投稿の全件）、台帳に置く。以後は1の未収録に乗る。

## 6. 検証・公開
- `python3 scripts/validate.py --fix-order` → `python3 scripts/sanitize_future.py` → `python3 scripts/validate.py`（errors=0 でなければ直すまで公開しない）
- `python3 scripts/build_artifact.py`
- 公開の基準ファイル `<scratchpad>/publish_baseline.txt`（前回公開後の状態）があればそれを使う。無ければ（コンテナが変わった等）アーティファクト https://claude.ai/artifact/Q69aY2x29YLqxY6s46156j のファイル一覧を Artifact（action list, scope files）で取ってテキストに保存する → `python3 tools/publish_plan.py <baseline> <scratchpad>/pub` → pub1.json, pub2.json … の順に Artifact publish（file_path=build/artifact/index.html、root=リポジトリ、files=各JSON）→ 成功したら `python3 tools/publish_plan.py --baseline <scratchpad>/publish_baseline.txt` で基準を更新。
- `git add -A data media docs && git commit`（メッセージ末尾に所定の署名行）→ `git push -u origin claude/initial-site` と `git push origin HEAD:main`。本番（Cloudflare Workers）はpushで自動デプロイ。

## 6.5 次のラウンド
- 2〜4の対象が残っていれば、2に戻る。対象がなくなったら7へ。

## 7. 記録と報告
- docs/nightly-log.md に1晩につき1行追記（ラウンド数も書く）：日付、新着件数、照合（確認済みにした件数／修正した件数／確認できず）、画像追加件数、キュー消化行数、確認済み率、台帳の未収録件数、公開バージョン。
- セッションに日本語で5行以内の報告を書く。判断が必要なもの（日付の食い違いで一次ソース同士が矛盾、削除候補など）は自分で決めずに報告に載せ、docs/review-queue.md に「未決」で追加する。

## 上限と中断
- エージェントは順番に1体ずつ起動する（同時に走らせない）。体数の上限はない。
- レート制限（429 / session limit）に当たったら、その時点までの適用済み分だけ検証・公開・コミットして終了し、ログに「枠切れで終了」と書く。続きは翌晩に回す。報告はその時点の分で行う。
- 迷ったら公開しない。errors が出たまま、または未確認の画像を載せたまま公開しない。
