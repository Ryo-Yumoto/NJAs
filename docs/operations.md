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

## C. 確認状況を更新する

一次ソースで確認が取れたら`verified: true`にし、`source_url`を一次ソースに差し替え、`note`の未確認理由を削除する。

## D. ローカル確認

```
python3 -m http.server 8080
```

http://localhost:8080/ で表示確認。URLの`#`以降に絞り込み状態が保持されるので、確認したい条件のURLをそのまま共有・ブックマークできる。

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
| tweet | https://x.com/NewJeans_ADOR |
| goods | Weverse Shop、公式サイトのNOTICE |
| live | 公式サイトのNOTICE、主催者・フェス公式サイト、Weverse告知 |
