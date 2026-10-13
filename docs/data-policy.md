# データ判定ルール

## 1. 日付（date / date_type）

同一の活動に複数の日付がある場合、カテゴリごとに次を採用する。別の日付も記録したい場合は別レコードにする（例：アルバム発表=announce、発売=release）。

| category | 採用する日付 | date_type |
|---|---|---|
| music | 配信開始日（KST基準） | release |
| mv | 公式YouTube公開日（KST基準） | release |
| tv | 放送日（放送国の現地時刻） | broadcast |
| magazine | 発売日。不明なら号の発行月（date_precision=month） | publish |
| web | 記事公開日 | publish |
| ad | アンバサダー就任等は発表日（announce）、CM・キャンペーン公開は公開日（release） | announce / release |
| tweet | 投稿日（KST基準） | post |
| goods | 販売開始日。不明なら月（date_precision=month） | sale_start |
| live | 開催日（現地時刻）。複数日公演は初日をdateにし、noteに全日程を記す | event |
| notice | 公式発表は発表日（announce）、記者会見・判決・聴聞は実施日（event） | announce / event |

date_precisionがmonthの場合はdateの日を01、yearの場合は01-01にする（validate.pyが検査する）。

## 2. 名義（entity）

- predebut: デビュー（2022-07-22）前の、HYBE・Source Music・ADOR・ミン・ヒジンに関する公式発表と広告（オーディション広告、ADOR設立、メンバーのデビュー前の公式出演）。
- newjeans: ADOR所属としての活動。
- njz: 2025年の専属契約紛争期にNJZ名義で行われた活動（2025年2月の名義発表から、2025年3月の裁判所の活動禁止仮処分以降を含む）。仮処分以降の活動は、公式発表に基づくもののみ収録し、noteに経緯を記す。

## 2b. ライブ（live）の範囲

- 対象：単独公演、ファンミーティング（Bunnies Camp）、フェス出演、大学祭、ショーケース、ブランドイベントでのパフォーマンス、NJZ名義期の公演。
- 放送・配信されたパフォーマンス（音楽番組、授賞式、年末歌謡祭）はtvに置く。同じ公演が放送された場合はliveとtvの両方に登録してよい。
- サイン会・リリースイベントは、公式に告知があればliveに含める。

## 2c. 公式発表（notice）の範囲

ADOR、HYBE、裁判所、メンバー側代理人による公式発表・声明・法的事象。記者会見、監査、仮処分、判決、復帰発表など物語の骨格となる出来事を収録する。報道のみで公式文書がない場合はverified=falseとし、一次報道をsource_urlにする。

## 3. 「公式」の範囲

- ADORまたはNewJeans公式アカウント（サイト、YouTube、X、Instagram、Weverse）が発信したもの。
- 放送局、出版社、ブランドが公式に発表した出演・掲載・起用。
- メンバー個人の雑誌表紙・広告起用・番組出演は、公式発表があるものを収録し、membersに該当メンバーを記す。
- ファン撮影、非公式まとめ、転載は収録しない（reference_urlsとしての参照は可）。

## 4. 確認済（verified）

- trueの条件：一次ソース（公式サイト、公式SNS、放送局、出版社、ブランド公式）で日付と内容を確認した。
- falseの場合はnoteに未確認の理由を書く（例：Wikipediaのみで確認、発売日不明で月のみ）。
- 画面では未確認レコードに「未確認」バッジが付く。「確認済のみ」で絞り込める。

## 4b. 同日内の順序（time）

同じ日に複数の公開がある場合、`time`（KST、24時間制）で順序を固定する。例：MVティザー00:00、音源配信18:00、MV公開18:00。timeのある項目が時刻順で先に並び、timeのない項目はカテゴリの既定順（公式発表→X投稿→映像→楽曲→ライブ→テレビ→広告→WEB→雑誌→グッズ）、同カテゴリ内はID順で続く。

## 4b2. 読者向け補足（note）と編集者メモ（editor_note）

- note：読者に見せる補足。そのレコードの日付時点で分かることだけを書く。未来の日付・出来事、「後に〜となる」等の回顧的表現、「Wikipediaによれば」等の作業メモは書かない。
- editor_note：出典の食い違い、未確認の理由、作業履歴。本モードでは表示せず、索引から開いたとき（またはキーm）にのみ表示する。
- summaryとtitleもnoteと同じ制約に従う。未発表だった作品名（例：デビュー日時点のEP名）をタグや文中に書かない。

## 4b3. 日付精度とページ配置

- day：その日のページに載る。
- month：その月の最後（月内の全日付ページの後）に「YYYY.MM（日付未確定）」ページとして載る。月初に置くと、実際には月末の出来事を先に読ませてしまうため。
- year：その年の最後に載る。

## 4c. 予告系コンテンツ（teaser等）

ティザー、トレーラー、コンセプトフィルム、リリックビデオ等は`mv`カテゴリに入れ、`tags`に次のいずれかを付ける：teaser / trailer / concept-film / lyric-video / track-video / dance-practice / performance / stage-cam。画面上はカテゴリ名の横に種別として表示される。プロモーションスケジュールやコンセプトフォトのSNS投稿は`tweet`カテゴリに入れ、Instagram・Weverse由来の場合はnoteに媒体名を記す。

## 4d. 活動期（eras）

`data/eras.json`で定義する。境界日は公式発表（先行公開日、契約関連の会見日等）に基づくが、解釈を含むため編集可能とする。各期の代表画像は`image`に既存レコードのIDを指定し、そのレコードの自動取得画像を使う。

ネタバレ防止の制約：章名は初日に公開されたものに基づく。`caption`には章の初日時点で分かることだけを書き、終了日、後続のリリース名、紛争の経過等を書かない。`image`は章の初日以前に公開されたレコードから選ぶ。

## 5. ID（id）

`<category>-<YYYY-MM-DD>-<slug>`。slugは半角小文字英数字とハイフンのみ。同日に同カテゴリの複数レコードがある場合はslugで区別する。IDは一度付けたら変更しない（URLのアンカーとして使う）。

## 6. 代表画像（image / media/auto）

- 自動取得：`python3 scripts/fetch_images.py`が、YouTube動画のサムネイルと一次ソースURLのog:imageを`media/auto/<id>.jpg`に保存し、出所を`media/auto/index.json`に記録する。wiki系ドメインとX・YouTubeのページは記事の汎用画像になるため取得対象外。
- 手動指定：`image: {"path": "<category>/<id>/cover.jpg", "source_url": "<出所>"}`を書くと自動取得より優先される。
- `image.url`に画像URLを書くと、fetch_images.pyがその画像を`media/auto/<id>.jpg`として取得する（ジャケット画像等）。
- X投稿は`media.ref`の投稿URLから、投稿の1枚目の画像または動画サムネイルを取得する。
- 表示優先順位：image > local_assets[0] > media/auto > YouTubeサムネイル（外部参照）。
- 取得画像は非公開サイト内でのみ使用する。

## 7. 非公開素材（local_assets）

- 雑誌スキャン、購入グッズの撮影画像など、公開サイトに載せられない素材は`media/<category>/<id>/`に置く。
- ファイル名はASCIIのみ。例：`media/magazine/magazine-2023-07-01-vogue-korea/p01.jpg`
- このリポジトリをpublicにしない。認証付きホスティングでのみ配信する。
