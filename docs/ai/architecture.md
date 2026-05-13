# アーキテクチャ概要

このドキュメントは、将来 LLM が項目追加・修正を行うために必要な前提を一枚にまとめたものです。

## ゴール

- SUUMO に掲載されている 27 件の賃貸物件を **テーブル⇔カードの中間ビュー** で比較可能にする
- 月額 / 初期費用は合計のみ表示し、Hover/Click で内訳を出す
- 5 段階+メモの評価をローカル環境で永続化する
- GitHub Pages で公開し、スマホで閲覧可能（noindex）

## スタック

- Vite 6 + React 18 + TypeScript（厳格モード）
- Tailwind CSS 3 + shadcn/ui（最低限の Button / Dialog / Popover / Badge を `src/components/ui/` に内包）
- ルーティングなし（単一ページ）
- 状態管理ライブラリなし（`useState` / `useMemo` で十分）

## ディレクトリ

```
move2026/
├── public/thumbnails/<id>.jpg       # 物件サムネ（1枚/物件）
├── src/
│   ├── App.tsx                      # ルート: ソート + 一覧
│   ├── main.tsx
│   ├── components/
│   │   ├── ui/                      # shadcn/ui の最小コンポーネント
│   │   ├── SortBar.tsx              # ソートキー切替
│   │   ├── PropertyList.tsx         # 一覧ラッパ
│   │   ├── PropertyCard.tsx         # 1物件カード
│   │   ├── PriceCell.tsx            # 月額/初期費用 合計+Popover内訳
│   │   ├── PhotoSlideshow.tsx       # Dialog ベース画像送り
│   │   ├── HazardBadge.tsx          # 洪水/土砂/津波 バッジ
│   │   └── RatingControl.tsx        # ★+メモ
│   ├── data/
│   │   ├── properties.json          # 27件の物件データ（型は src/lib/types.ts）
│   │   └── ratings.json             # { ratings: { [id]: Rating } }
│   ├── lib/
│   │   ├── types.ts                 # Property / Rating の型 ★スキーマの正本
│   │   ├── format.ts                # 表示用フォーマッタ
│   │   ├── sort.ts                  # ソート関数 + SORT_OPTIONS
│   │   ├── ratings.ts               # 評価データの取得・保存（環境別）
│   │   └── utils.ts                 # cn (clsx + tailwind-merge)
│   └── styles/globals.css           # Tailwind layer + shadcn 変数
├── plugins/ratings-dev-plugin.ts    # /api/ratings を提供（dev時のみ）
├── docs/ai/                         # ★このフォルダ
└── .github/workflows/deploy.yml     # GitHub Pages 自動デプロイ
```

## データの流れ

1. 起動時に `App.tsx` が `properties.json` を import（バンドル時に静的に読み込み）
2. `loadRatings()` が
    - 開発時 → `GET /api/ratings`（dev plugin）
    - 本番時 → バンドルされた `ratings.json`
3. `sortProperties` が現在のソート設定に従って配列を返す
4. `PropertyCard` は `RatingControl` をレンダーし、変更時は `saveRating` 経由で
    - 開発時 → `PUT /api/ratings/:id` で `src/data/ratings.json` を更新
    - 本番時 → `alert()` で停止し書き込まない

## 環境分岐

| 場面 | 評価の読込 | 評価の書込 | バナー |
| --- | --- | --- | --- |
| `npm start` (dev) | API | API | なし |
| `npm run build && npm run preview` | bundled JSON | alert | 「閲覧のみ」 |
| GitHub Pages | bundled JSON | alert | 「閲覧のみ」 |

`import.meta.env.DEV` で分岐。

## 関連ドキュメント

- [data-schema.md](./data-schema.md) — `properties.json` の各フィールド意味
- [add-property.md](./add-property.md) — 物件の追加・廃止チェック・同期 標準フロー
- [add-field.md](./add-field.md) — 新規フィールドを追加する手順（型/UI/ソート連動）
- [ratings-storage.md](./ratings-storage.md) — 評価データの保存仕様

## 補助スクリプト

`scripts/` 以下にデータ整備系のスクリプトを置いている。詳細は [add-property.md](./add-property.md) を参照。

| スクリプト | 用途 |
| --- | --- |
| `fetch-thumbnails.sh` | `suumo-list.md` 全件のサムネ画像と photoUrls を取得 |
| `merge-photos.mjs` | photoUrls を properties.json にマージ |
| `check-listings.mjs` | 全URLの生存状態と name 整合性を確認 |
| `sync-listings.mjs` | suumo-list.md 基準で properties.json と thumbnails を同期削除 |
| `swap-pairs.mjs` | データ取り違えペアの手動入替（緊急時のみ） |

## 追加・削除の運用原則

**LLM へ「この URL の物件を追加して」と指示された場合、明示的に止められない限り以下の4つを一括実行する:**

1. 新URLを `suumo-list.md` と `properties.json` に追加
2. `suumo-list.md` の全URLに対して生存チェック
3. 掲載終了物件を `suumo-list.md` / `properties.json` / `public/thumbnails/` から削除
4. `sync-listings.mjs` で **双方向同期** （片方にだけ残った孤児を両方から削除）

`suumo-list.md` と `properties.json` は常に同じ ID 集合を持つことを保証する。一時非表示は `hidden: true` フラグで対応する（[data-schema.md](./data-schema.md) 参照）。

詳細は [add-property.md](./add-property.md) の標準フロー。
