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

### floor: 0 / facing: "unknown" 等の不明値の扱い
**状況**: SUUMOで階数が掲載されていない物件あり。型を `number` 必須にしたので 0 で代用したが、UI で `0/N階` と表示されると違和感がある。
**やり方**: `format.fmtFloor` で `floor === 0` を `?/N階` に変換。表示時に「不明」として扱う。型側は `number | null` でも良いが、ソートが少し複雑になるので避けた。
