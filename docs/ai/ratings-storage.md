# 評価データの保存仕様

## 要約

- 評価データは `src/data/ratings.json` の単一ファイルに保管
- 形式: `{ "ratings": { "<propertyId>": { stars, memo, updatedAt } } }`
- 開発時は **Vite dev plugin が REST API として提供** し、フロントから書き込みでファイル更新
- 本番（GitHub Pages 等の静的配信）では **書き込み不能** → `alert()` で停止

## なぜ localStorage を使わないか

- ユーザーが「ローカルJSONとして管理したい」と明示した
- 複数デバイス間で `git` 経由で評価を共有可能（コミットすれば残る）
- ブラウザクリアで消える事故を避ける

## 開発時の動作

### Vite plugin (`plugins/ratings-dev-plugin.ts`)

`apply: "serve"` 指定なので、`vite build` には含まれない。dev server 上だけで動く。

| メソッド | パス | 動作 |
| --- | --- | --- |
| GET | `/api/ratings` | `src/data/ratings.json` を返す |
| PUT | `/api/ratings/:id` | body の Rating で `ratings[id]` を upsert |
| DELETE | `/api/ratings/:id` | `ratings[id]` を削除 |

書き込みは `fs.writeFile` で同期的に `src/data/ratings.json` を更新する。HMRで自動反映。

### フロント側 (`src/lib/ratings.ts`)

`import.meta.env.DEV` の値で分岐:

| 状態 | `loadRatings()` | `saveRating()` |
| --- | --- | --- |
| dev | API GET → 失敗時はバンドル fallback | API PUT |
| 本番 | バンドル import | `alert()` + 書込みなし |

## 本番（GitHub Pages）での動作

- `import.meta.env.DEV === false`
- `RatingControl` のクリックハンドラは `alert()` を出して終了する
- メモも編集はできるが保存されない

## バックアップ

`src/data/ratings.json` は通常の git 管理対象。意図せず破壊された場合は `git checkout -- src/data/ratings.json` で戻る。

## トラブルシュート

### 「評価が保存されない」
- dev server を立ち上げ直す（HMR でも plugin は再起動が必要な場合あり）
- DevToolsで `PUT /api/ratings/<id>` のレスポンスを確認。500ならサーバ側のログ確認
- `src/data/ratings.json` が読み取り専用になっていないか

### 「dev時もalertが出る」
- `vite.config.ts` で plugin が import されているか
- `command === "serve"` 時に有効になっているか
