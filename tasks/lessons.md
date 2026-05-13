# lessons

このプロジェクトで得た学び・ハマり所メモ。今後似たケースで再発しないように。

## 2026-05-10 初期セットアップ

### サブエージェントで27件のWebFetchを並列処理する戦略
**状況**: 27件のSUUMO詳細ページを順次取ろうとするとメインのコンテキストを大量に消費する。
**やり方**: general-purposeサブエージェントに `fetch + Edit properties.json` をまとめて任せ、メインは形式と検証だけ受け取る。WebFetchは1メッセージで複数並列呼び出しできるので、サブエージェント内で3〜5件ずつ並列化する。
**注意**: サブエージェントに型定義を渡すこと。`Property` のフィールド名・nullable方針を明示しないと推測で埋めてくる。

### shadcn/ui の手動配置 vs CLI
**状況**: `npx shadcn add` は対話プロンプトが入ることがあり、Bash経由だとフリーズする。
**やり方**: 必要な4コンポーネント（button/dialog/popover/badge）は手動でコピーした。`components.json` は形式維持のみ。
**前提**: `@radix-ui/react-*` `class-variance-authority` `clsx` `tailwind-merge` `tailwindcss-animate` の依存は package.json に直接書く。

### Vite dev plugin で middleware パスをマウントする際の挙動
**状況**: `server.middlewares.use("/api/ratings", handler)` で登録するとリクエストの `req.url` から `/api/ratings` が strip される。よって `/api/ratings/abc123` の場合 `req.url === "/abc123"` になる。
**学び**: ID取り出しは `req.url.split("/").filter(Boolean)[0]` で十分。

### GitHub Pages の base パス問題
**状況**: GitHub Pages はリポジトリ名のサブパス（`/move2026/`）配信。`base: "/move2026/"` を vite.config.ts に必ず指定。
**注意**: `command === "serve"` 時は `/` のままにしないと dev で 404 になる。よって `defineConfig(({ command }) => ({ base: command === "build" ? "/move2026/" : "/" }))` で切り替え。

### サブエージェント間でのファイル競合
**状況**: 「ハザード調査」「画像DL+photoUrls更新」を並列で別エージェントに依頼したい。両者とも `properties.json` を編集する。
**やり方**: 各エージェントに「他のフィールドには触らない」と明示。Edit ツールベースの差分編集なら、同一フィールドを書かなければ衝突しない。Write で全文上書きすると競合するので避ける。

### SUUMO 画像URLの命名規則
**前提**: SUUMO物件画像URLは `https://img01.suumo.com/front/gazo/fr/bukken/<3桁>/<id>/<id>_<suffix>.jpg` の形式。
**suffix の意味**:
- `_ro`: 外観 (Roof/Outside)
- `_co`: 間取り図 (floor plan / Configuration)
- `_go`: 地図 (Geo)
- `_1o`, `_2o`, ...: 物件写真（室内・設備）

**やったミス**: 当初 `_co` を「間取り図 ≠ 写真」と判断して fetch-thumbnails.sh で除外していた → ユーザーから「間取り図も欲しい」と指摘されて修正。
**ルール**: `_go`（地図）は除外、`_co`（間取り図）は残す。物件比較では間取り図は必須情報。

### 「コメントアウトしたい」=「物件を一時非表示にしたい」のサイン
**状況**: ユーザーが「JSONをコメントアウトしたい」「cjson にできない?」と言った。
**最初の対応**: JSONC化＋スクリプト5本書き換えに走った → ユーザーに止められた。
**正しい解釈**: ユーザーが本当に欲しいのは「物件単位の一時無効化」だった。`hidden: true` 1フィールド追加 + フロントで `.filter()` 1行で実装完了。
**ルール**: 「コメントアウト」というワードを聞いたら、まず **何のためのコメントアウトか** を確認する。プログラミング流の「ファイル形式変更」に飛びつかない。多くの場合、データに1フィールド足すだけで済む。

### 物件追加と suumo-list.md/掲載終了同期は1セット
**状況**: ユーザーは「このURLを追加して」と指示することが多い。毎回「suumo-list.md にも追加して」「掲載終了も削除して」と細かく指示するのは煩雑。
**ルール**: LLM が物件追加を依頼されたら、明示的に止められない限り (1) 追加 (2) 全URL生存チェック (3) 掲載終了物件の同期削除 (4) `sync-listings.mjs` で **双方向同期** を**毎回必ず一括実行**する。
**理由**: SUUMOは新着物件が日常的に掲載終了になり、`/library/` リダイレクトに変わる。また、ユーザーが片方だけから手動削除した「孤児」も発生する。
**双方向同期**: `suumo-list.md` と `properties.json` は常に同じ ID 集合を持つ。片方にだけ残ったら、ユーザーがもう片方から消した意図と解釈して両方から削除する。一時非表示は `hidden: true` フラグで対応。
**実装**: `scripts/check-listings.mjs` (生存チェック) + `scripts/sync-listings.mjs` (双方向同期、孤児を両方から削除) で機械化。`docs/ai/add-property.md` に手順記載。

### floor: 0 / facing: "unknown" 等の不明値の扱い
**状況**: SUUMOで階数が掲載されていない物件あり。型を `number` 必須にしたので 0 で代用したが、UI で `0/N階` と表示されると違和感がある。
**やり方**: `format.fmtFloor` で `floor === 0` を `?/N階` に変換。表示時に「不明」として扱う。型側は `number | null` でも良いが、ソートが少し複雑になるので避けた。
