# 運用手順

## A. レコードを1件追加する

1. 雛形を生成する。

```
python3 scripts/new_item.py --category magazine --date 2024-03-01 --slug vogue-korea --precision month
```

   標準出力にJSONが出るので、`data/magazine.json`の配列に追記する。

2. 必須項目を埋める。title.ja、title.en、source_url、date_type、verified。
3. 検証する。

```
python3 scripts/validate.py --fix-order
```

4. `errors=0`を確認してコミットする。

```
git add data/ && git commit -m "data: add magazine Vogue Korea 2024-03"
```

## B. 非公開素材（スキャン等）を添付する

1. `media/<category>/<id>/`にファイルを置く（ASCIIファイル名）。
2. レコードの`local_assets`に`"<category>/<id>/<file>"`を追加する。
3. 検証・コミット。

画像が多くなる場合はGit LFSの導入を検討する（`git lfs track "media/**"`）。

## B2. 代表画像を取得・更新する

```
python3 scripts/fetch_images.py              # 未取得のレコードのみ取得
python3 scripts/fetch_images.py --only goods # カテゴリ指定
python3 scripts/fetch_images.py --force      # 全件取り直し
```

X投稿を参照するレコード（media.type=x）を追加したときは、`python3 scripts/fetch_x.py`も実行する（取得済みの投稿は再取得しない。`--force`で取り直し）。

取得後に`media/auto/index.json`と画像をコミットする。画像が不適切（記事と無関係なロゴ等）な場合は、該当IDの画像ファイルとindex.jsonの行を削除するか、レコードに`image`を手動指定して上書きする。

自動取得の除外規則（scripts/fetch_images.py）:
- `image.path`または`local_assets`を持つレコード（手動ギャラリー）は取得しない。
- `media/auto/blocked.json`の`hashes`（保存後JPEGのMD5）に一致する画像は破棄する。汎用画像（Weverse Shopのアーティスト共通画像、LINE FRIENDS SQUAREロゴ等）を登録する。
- `media/auto/blocked.json`の`ids`に挙げたレコードは取得しない。到達できる画像が別日の活動のものしかない場合に使う。
- X投稿のカード画像（pbs.twimg.com/card_img）はリンク先の汎用画像であることが多いため、常に除外する。

## C. 確認状況を更新する

一次ソースで確認が取れたら`verified: true`にし、`source_url`を一次ソースに差し替え、`note`の未確認理由を削除する。

## D. ローカル確認

```
python3 -m http.server 8080
```

http://localhost:8080/ で表示確認。URLの`#`以降に絞り込み状態が保持されるので、確認したい条件のURLをそのまま共有・ブックマークできる。

## D2. 本モードと索引の使い分け

- 本モード（表紙から読む）：未確認バッジ、参照リンク、編集者メモを表示しない。
- 索引（目次末尾）から項目を開くと、同じページが編集者表示（未確認バッジ、参照リンク、編集者メモ付き）になる。読書中はキーmで切り替えられる。
- データ修正時は索引から該当日を開いて確認する。

## E. 公開（反映）

`docs/hosting.md`の手順でCloudflare Pagesに接続していれば、`main`ブランチへのpushで自動反映される。

## F. 収集ソース一覧（定期巡回）

| カテゴリ | 一次ソース |
|---|---|
| music / mv | https://www.youtube.com/@NewJeans_official 、各配信サービス、newjeans.kr |
| tv | 放送局公式サイト、番組公式X |
| magazine | 各出版社の号案内ページ、公式Instagramの掲載告知 |
| web | 媒体の記事URL |
| ad | ブランド公式プレスリリース、公式X |
| sns | https://x.com/NewJeans_ADOR 、Instagram @newjeans_official、Weverse、Phoning、TikTok |
| content | https://www.youtube.com/@NewJeans_official の再生リスト、Weverse LIVE |
| record | Billboard、Circle Chart、Oricon、ADOR公式SNSの節目告知、受賞式公式サイト |
| goods | Weverse Shop、公式サイトのNOTICE |
| live | 公式サイトのNOTICE、主催者・フェス公式サイト、Weverse告知 |

### F2. 機械的に取得できるエンドポイント（2026-10-16 確認）

- Weverse 告知: `/notice/v1.0/community-81/notices?pageNo=N` で一覧、`/notice/v1.0/notice-<id>` で本文と添付画像。署名付きリクエストが必要（Playwright不要）。
- Weverse Shop カテゴリ: `categories/<parent>?subCategoryId=<id>&page=N`。本ネットワークからは常にUS（USD）ショップが返るため、GLOBALショップの並び順は取得できない。
- LINE FRIENDS（Shopify）: linefriendssquare.com / .us / .jp の `collections/<handle>/products.json`。公開中の商品しか返らないため、過去ドロップの全量にはならない。ポップアップ告知は `/blogs/event/`。
- X 投稿: api.fxtwitter.com（scripts/fetch_x.py）。投稿のカード画像（pbs.twimg.com/card_img）はリンク先の汎用画像のことがあるため、代表画像には使わない。

## G. 収録率の確認（台帳）

```
python3 scripts/fetch_youtube_list.py   # 公式チャンネルの長尺動画一覧を取り直す（新規だけ追記）
python3 scripts/coverage.py             # 台帳ごとの収録率
python3 scripts/coverage.py --missing   # 未収録の項目を列挙
```

台帳の形式はscripts/coverage.pyの先頭に書いてある。`match: manual`の台帳は項目の`record`に覆っているレコードIDを書く。未収録項目を収集したら`record`を埋める。

## 作業の委任ルール（モデルの使い分け）

- 調査・収集・URL解決・画像探索・本文推敲など、エージェントに委任する作業はFableの1段下のモデル（Opus）で実行する。Fableはこのセッション本体（設計、レビュー、統合判断、公開）に限る。
- 大きな収集処理は深夜（JST 3〜5時）にまとめて実行し、日中はトークン上限を圧迫しない。
