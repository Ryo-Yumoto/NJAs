# NJAs - NewJeans Archive

NewJeansの公式活動（楽曲、MV、テレビ出演、雑誌、WEBインタビュー、広告、X投稿、グッズ、ライブ）を日付順に閲覧する非公開アーカイブサイト。

## コンセプト

デビュー（2022年7月22日）から続いた公開の連鎖（ティザー、コンセプト、楽曲、MV、出演、掲載）を、公開された順番どおりに追体験する。時系列が最優先であり、次の設計で担保する。

- 既定の並び順は古い順（デビューから現在へ）。
- 各項目にデビュー起点の経過日数（DAY 1、DAY 151、デビュー前はD-21）を表示する。
- 同日内の順序は任意項目`time`（KST）で制御する（例：ティザー00:00、配信18:00）。
- 活動期（デビュー期、OMG期、Get Up期、How Sweet/Supernatural期、紛争・NJZ期、復帰後）を`data/eras.json`で定義し、年表上の見出しとマストヘッドのバンドに表示する。
- マストヘッドに月別件数の積み上げバーと累積件数の推移を同一時間軸で表示する。

## 設計方針

- データが本体、サイトは表示層。全レコードは`data/*.json`にGit管理し、`index.html`はそれを読み込んで描画するだけ。
- ビルド工程なし。静的ファイルのみで動作し、任意の静的ホスティングに配置できる。
- 外部コンテンツ（YouTube、X）は埋め込み／リンクのみで、ファイルは保持しない。
- 非公開素材（雑誌スキャン等）は`media/`配下に置き、Cloudflare Access等の認証の内側でのみ配信する。

## ディレクトリ

| パス | 役割 |
|---|---|
| `index.html` | 画面本体 |
| `assets/css/style.css` | スタイル（ライト／ダーク対応、スマホ対応） |
| `assets/js/app.js` | 読込・絞り込み・描画ロジック |
| `data/schema.json` | レコード定義（JSON Schema） |
| `data/manifest.json` | 読み込むデータファイルの一覧 |
| `data/<category>.json` | カテゴリ別レコード配列 |
| `media/` | 非公開素材（スキャン画像等）。`local_assets`から相対参照 |
| `media/auto/` | `scripts/fetch_images.py`が一次ソースから自動取得した代表画像と出所一覧（index.json） |
| `data/eras.json` | 活動期の定義（期間、見出し、代表画像、配色） |
| `scripts/validate.py` | データ検証（スキーマ、ID一意性、日付整合、並び順） |
| `scripts/new_item.py` | 新規レコードの雛形生成 |
| `scripts/fetch_images.py` | 各レコードの代表画像を取得（YouTubeサムネイル、ページのog:image） |
| `docs/operations.md` | 日常運用手順（追加・確認・公開） |
| `docs/hosting.md` | 認証付きホスティング手順（Cloudflare Pages + Access） |
| `docs/data-policy.md` | 日付・名義・確認済の判定ルール |

## ローカルで開く

`file://`では`fetch`が動作しないため、簡易サーバーで開く。

```
python3 -m http.server 8080
```

ブラウザで http://localhost:8080/ を開く。

## データ検証

```
python3 scripts/validate.py            # 検証のみ
python3 scripts/validate.py --fix-order  # 並び順を自動修正して再検証
```

コミット前に必ず実行し、`errors=0`を確認する。

## レコード定義（要約）

| 項目 | 必須 | 内容 |
|---|---|---|
| id | 必須 | `<category>-<YYYY-MM-DD>-<slug>` |
| date | 必須 | ソート用日付 |
| time | 任意 | 同日内の順序（HH:MM、KST） |
| image | 任意 | 手動指定の代表画像（`media/`配下のpathと出所URL） |
| date_type | 必須 | release / announce / broadcast / publish / post / sale_start / event |
| date_precision | 必須 | day / month / year |
| category | 必須 | music / mv / tv / magazine / web / ad / tweet / goods / live |
| entity | 必須 | newjeans（ADOR名義）/ njz（NJZ名義期間） |
| members | 任意 | all / minji / hanni / danielle / haerin / hyein |
| title.ja, title.en | 必須 | 日英タイトル。`title.original`に原題 |
| summary.ja, summary.en | 任意 | 一文要約 |
| source_url | 必須 | 一次ソースURL |
| reference_urls | 任意 | 日付確認に使った二次ソース |
| media | 任意 | youtube（動画ID）/ x（投稿URL）/ image / none |
| local_assets | 任意 | `media/`配下の相対パス |
| tags | 任意 | 自由タグ |
| verified | 必須 | 一次ソースで日付・内容を確認済ならtrue |
| note | 任意 | 補足・未確認理由 |

詳細は`data/schema.json`と`docs/data-policy.md`を参照。
