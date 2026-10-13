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

date_precisionがmonthの場合はdateの日を01、yearの場合は01-01にする（validate.pyが検査する）。

## 2. 名義（entity）

- newjeans: ADOR所属としての活動。
- njz: 2025年の専属契約紛争期にNJZ名義で行われた活動（2025年2月の名義発表から、2025年3月の裁判所の活動禁止仮処分以降を含む）。仮処分以降の活動は、公式発表に基づくもののみ収録し、noteに経緯を記す。

## 3. 「公式」の範囲

- ADORまたはNewJeans公式アカウント（サイト、YouTube、X、Instagram、Weverse）が発信したもの。
- 放送局、出版社、ブランドが公式に発表した出演・掲載・起用。
- メンバー個人の雑誌表紙・広告起用・番組出演は、公式発表があるものを収録し、membersに該当メンバーを記す。
- ファン撮影、非公式まとめ、転載は収録しない（reference_urlsとしての参照は可）。

## 4. 確認済（verified）

- trueの条件：一次ソース（公式サイト、公式SNS、放送局、出版社、ブランド公式）で日付と内容を確認した。
- falseの場合はnoteに未確認の理由を書く（例：Wikipediaのみで確認、発売日不明で月のみ）。
- 画面では未確認レコードに「未確認」バッジが付く。「確認済のみ」で絞り込める。

## 5. ID（id）

`<category>-<YYYY-MM-DD>-<slug>`。slugは半角小文字英数字とハイフンのみ。同日に同カテゴリの複数レコードがある場合はslugで区別する。IDは一度付けたら変更しない（URLのアンカーとして使う）。

## 6. 非公開素材（local_assets）

- 雑誌スキャン、購入グッズの撮影画像など、公開サイトに載せられない素材は`media/<category>/<id>/`に置く。
- ファイル名はASCIIのみ。例：`media/magazine/magazine-2023-07-01-vogue-korea/p01.jpg`
- このリポジトリをpublicにしない。認証付きホスティングでのみ配信する。
