# 実装タスク（move2026 物件比較ページ）

## やること

### 基盤
- [x] Vite + React + TS でプロジェクト初期化
- [x] Tailwind v3 + shadcn/ui の最小コンポーネント整備
- [x] パスエイリアス `@/*` を tsconfig & vite に設定
- [x] `noindex` meta を `index.html` に追加

### コア型・ロジック
- [x] `src/lib/types.ts` で Property / Rating を定義
- [x] `src/lib/format.ts`（円/m²/階数フォーマッタ）
- [x] `src/lib/sort.ts`（8キーのソート + null 末尾処理）
- [x] `src/lib/ratings.ts`（環境別の読み書き）
- [x] `plugins/ratings-dev-plugin.ts`（dev時のみREST API提供）

### UI
- [x] `PropertyList` / `PropertyCard`
- [x] `PriceCell`（合計+Popoverで内訳）
- [x] `PhotoSlideshow`（Dialog + 矢印キー）
- [x] `HazardBadge`（3項目バッジ + Popover詳細）
- [x] `RatingControl`（5★ + メモ）
- [x] `SortBar`（クリックで方向トグル）

### データ整備
- [x] サブエージェントで27件のSUUMOデータを取得し `properties.json` 生成
- [ ] サブエージェントでハザード/ICを調査し各物件を更新（背景で進行中）
- [ ] サブエージェントでサムネ画像27枚をDLし `photoUrls` も更新（背景で進行中）

### 公開
- [x] `.github/workflows/deploy.yml`（GitHub Pages 自動デプロイ）
- [x] `vite.config.ts` の `base` を `/move2026/`（ビルド時のみ）

### ドキュメント
- [x] `docs/ai/architecture.md`
- [x] `docs/ai/data-schema.md`
- [x] `docs/ai/add-property.md`
- [x] `docs/ai/add-field.md`
- [x] `docs/ai/ratings-storage.md`

### 検証
- [x] `npm run build` でバンドル成功
- [x] `npx tsc -b --noEmit` で型エラーなし
- [ ] `npm run dev` で動作確認（27件カード表示・ソート・写真Dialog・★保存）
- [ ] スマホ幅（375px相当）で崩れないことを確認

## レビュー（実装後に追記）

### 設計サマリ
- 単一ページ・単一データソース（`properties.json`）でシンプルに保った
- 評価データは「開発時APIで永続化／本番は閲覧専用」の2系統。`import.meta.env.DEV` で分岐
- shadcn/ui は CLI を使わず手動でコピー（必要な4コンポーネントのみ）にして依存を最小化

### 残課題（将来）
- 写真URLを SUUMO 直リンクに依存しているので、SUUMO側のURL構造変更で壊れるリスクあり
- ハザードマップの自動再評価は未実装。住所が変わったら手動で再調査が必要
- 検索機能（駅名・予算）は未実装。27件なら不要と判断

### 学び（lessons）
- shadcn/ui を CLI ではなく手動配置する場合、`components.json` は形式維持のみで実機能はない（CLI 利用時のための設定）
- Vite の dev plugin で `middlewares.use("/api/...", handler)` を使うとパスは strip される。`/api/ratings/:id` の `:id` は `req.url` の冒頭セグメントになる
