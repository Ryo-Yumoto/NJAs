# 認証付きホスティング（Cloudflare Pages + Cloudflare Access）

目的：スマホからも閲覧できる非公開サイトにする。静的ファイルのみなので、Cloudflare Pagesで配信し、Cloudflare Access（Zero Trust）でメール認証をかける。個人利用の範囲では無料枠で収まる。

## 前提

- GitHubリポジトリ`Ryo-Yumoto/NJAs`はprivateのままにする。
- Cloudflareアカウント（無料）を持っている。

## 手順

1. Cloudflare Dashboard > Workers & Pages > Create > Pages > Connect to Git で本リポジトリを選択する。
2. Build settings
   - Framework preset: None
   - Build command: （空欄）
   - Build output directory: `/`
3. Deploy後、`<project>.pages.dev`のURLが発行される。この時点では誰でも見られるので、次にAccessをかける。
4. Zero Trust > Access > Applications > Add an application > Self-hosted
   - Application domain: `<project>.pages.dev`（サブドメインのワイルドカード`*.<project>.pages.dev`も追加し、プレビューURLも保護する）
   - Policy: Allow、Include = Emails、自分のメールアドレスを指定
   - Identity provider: One-time PIN（追加設定なしでメールにPINが届く）
5. スマホのブラウザで`https://<project>.pages.dev/`を開き、メールのPINでログインできることを確認する。
6. Workers & Pages > 該当プロジェクト > Settings > Access policy を有効にすると、プレビューデプロイにも同じAccessが適用される。

## 補足

- `_headers`ファイルで`X-Robots-Tag: noindex`を全パスに付与済み。検索エンジンへの登録を防ぐ。
- `media/`配下の非公開素材も同じAccessの内側で配信されるため、リポジトリに含めてよい。ただしリポジトリ容量（Pagesは1ファイル25MiB、合計20,000ファイルまで）に注意する。
- Cloudflare以外の候補：Vercel（Password Protectionは有料プラン）、Netlify（同様に有料）、GitHub Pages（privateサイトはEnterpriseのみ）。無料でメール認証を付けられる点でCloudflareを採用した。

## 補足：SNS投稿の埋め込み

本番（Cloudflare Pages）では、SNSカテゴリの項目のうちX投稿（media.type=x）とInstagram投稿（platform=instagram、source_urlが投稿URL）は、公式の埋め込みウィジェット（platform.twitter.com/widgets.js、instagram.com/embed.js）でそのまま表示される。Artifact版は外部スクリプトが読み込めないため、サムネイルとリンクの表示になる（build_artifact.pyがwindow.NJAS_NO_EMBEDを設定）。
