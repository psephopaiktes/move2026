# 物件の追加・廃止チェック・同期 標準フロー

物件の新規追加・既存物件の生存確認・廃止物件の削除はすべて同じワークフローで実施する。

## ルール（明示的に指示されていない場合のデフォルト挙動）

**LLM へ「この URL の物件を追加して」と指示されたら、以下の 4 つを必ず一括で行う:**

1. **追加**: 新URL を `suumo-list.md` と `src/data/properties.json` の両方に追加（**片方だけは禁止**）
2. **生存チェック**: `suumo-list.md` の **全URL** に対して掲載状態を確認し、`/library/` リダイレクトしている物件は「掲載終了」として削除対象にする
3. **掲載終了の削除**: 掲載終了物件を以下から全部削除
   - `suumo-list.md` の該当行
   - `src/data/properties.json` の該当エントリ
   - `public/thumbnails/<id>.jpg`（存在すれば）
4. **双方向同期**: `node scripts/sync-listings.mjs` を実行し、孤児（片方にだけ残った物件）を消す
   - `properties.json` にあって `suumo-list.md` に無い → json から削除（+ thumbnail）
   - `suumo-list.md` にあって `properties.json` に無い → list から削除

ユーザーがこの手順を毎回指示する必要は無い。**追加・チェック・削除・双方向同期は1セット**として実行する。

### 双方向同期の不可侵ルール

`suumo-list.md` と `properties.json` は **常に同じID集合を持つ**。どちらか片方にだけ残った物件は、ユーザーがもう片方から明示的に削除した意図と解釈し、`sync-listings.mjs` で両方から消す。

- 片方しか更新したくないケース（例: 一時非表示）は **`hidden: true` フラグ** を properties.json の物件に付ける（[data-schema.md](./data-schema.md) 参照）。`hidden` 物件は両ファイルに存在し、UI からだけ消える。

ただし「追加せず生存チェックだけ走らせて」「特定の1件だけ追加して同期は後で」のような明示的な指示があれば、それに従う。

## 標準フロー

### 1. 新URLからIDを抽出

```bash
# bc_xxx 直URL
https://suumo.jp/chintai/bc_100505077565/    →  bc_100505077565

# jnc_xxx/?bc=xxx 形式（部屋単位URL）
https://suumo.jp/chintai/jnc_000106461153/?bc=100497629925   →  bc_100497629925
```

`id` フィールドは常に `bc_` プレフィックス付き。`suumoUrl` は受け取った URL を**そのまま**保存する（`jnc_` 部屋単位URLは部屋情報を持つため bc 単独に書き換えてはいけない）。

### 2. SUUMO 詳細ページから構造化データを取得

WebFetch で以下のpromptを投げる:

```
このSUUMO物件詳細ページから以下のJSONを抽出してください。値がない場合は null とし、想像で埋めないこと。

{
  "name": 物件名,
  "address": 住所（町名まで）,
  "stations": [{"line":"路線名","name":"駅名","walkMin": 徒歩分の数値}],
  "layout_plan": "間取り",
  "areaSqm": 専有面積m²(数値),
  "builtYear": 築年(西暦),
  "structure": "建物構造",
  "floor": 当該階(数値),
  "totalFloors": 総階数(数値),
  "facing": "向き",
  "totalUnits": 総戸数(数値 or null),
  "rent": 家賃(円),
  "maintenance": 管理費(円),
  "parking_fee": 駐車場代(円),
  "deposit": 敷金(円),
  "keyMoney": 礼金(円),
  "guarantee": 保証金(円),
  "parkingDistanceM": 駐車場までの距離m(数値 or null),
  "bikeParking": 駐輪場(true/false/null),
  "internet": "ネット環境",
  "garbageOnSite": 敷地内ゴミ置場(true/false/null),
  "contractType": "契約形態",
  "cornerUnit": 角部屋(true/false/null),
  "surroundings": ["周辺情報"...]
}
```

`name` に号室が含まれる場合（例: 「プレディアコート板橋 504号室」）は **物件名のみ** に切り詰める。

金額の正規化:
| SUUMO表記 | 数値変換 |
| --- | --- |
| `14.9万円` | 149000 |
| `家賃1ヶ月分` | rent × 1 |
| `家賃2ヶ月` | rent × 2 |
| `-` / `無し` / `0` | 0 |

`monthly.total = rent + maintenance + parking`, `initial.total = deposit + keyMoney + guarantee` を必ず合致させる。

### 駐車場距離 (`parkingDistanceM`) の特殊ケース

| SUUMO表記 | 値 |
| --- | --- |
| `敷地内` | `0` （= 距離0m、null ではない） |
| `123m` / `0.5km` | 数値（m単位）|
| `近隣` / `周辺` のみで距離記載なし | `null` |
| 駐車場欄が `未掲載` / 記載なし | `null` |

「敷地内」を `null` にしてしまうと「未掲載」と区別できない。SUUMOページの「駐車場」欄に **「敷地内」と明記**されていれば必ず `0`。

WebFetchの抽出時に取りこぼした場合は `node scripts/fix-onsite-parking.mjs --dry-run` で全 null 物件を再判定→`--dry-run` を外して適用できる。

### 3. 外部調査（ハザード・高速IC）

#### ハザード判定

| 種別 | low | mid | high |
| --- | --- | --- | --- |
| flood (洪水) | 想定区域外 / <0.5m | 0.5–3m | >3m |
| landslide | 警戒区域外 | イエロー | レッド |
| tsunami | 内陸 / 想定外 | <1m | ≥1m |

リソース:
- 国土地理院「重ねるハザードマップ」 https://disaportal.gsi.go.jp/maps/index.html
- 自治体ハザードマップ
- WebSearch: `"<住所> 洪水ハザードマップ"`

`sourceUrl` に参照した自治体ページを書き、`note` に判定理由（例: 「○○川氾濫想定3-5m」）を残す。不明時は `"unknown"`。

#### 最寄り高速IC

- 首都高入口でも可
- `driveMin` はGoogle Maps基準で「車で○分」を概算（標準時間）
- 不明・非現実的なら `null`

### 4. サムネ画像のダウンロードと photoUrls の取り込み

`scripts/fetch-thumbnails.sh` は **suumo-list.md 全件** を走査するので、新URLを追加した後に実行すれば自動で取得される。

```bash
bash scripts/fetch-thumbnails.sh
node scripts/merge-photos.mjs
```

サムネは `public/thumbnails/<id>.jpg` に保存される。`photoUrls` は `properties.json` の各物件に書き戻される。

### 5. 生存チェック + 廃止物件の同期削除

```bash
# 状態確認
node scripts/check-listings.mjs

# suumo-list.md 基準で properties.json と thumbnails を同期
# （suumo-list.md に無いエントリを削除）
node scripts/sync-listings.mjs --dry-run    # 差分プレビュー
node scripts/sync-listings.mjs              # 実行
```

廃止物件は **2 段階**で削除する:

1. `suumo-list.md` から該当行を手動で削除
2. `sync-listings.mjs` を実行 → properties.json と thumbnails が連動して削除される

### 6. 検証

```bash
npm run typecheck
npm run build
node scripts/check-listings.mjs   # 残った全件が ok / mismatch のみで gone が無いか確認
```

### 7. properties.json のフィールドチェックリスト

- [ ] `id` が `bc_` 付き
- [ ] `suumoUrl` は受け取った形式を維持（`jnc_` を `bc_` に書き換えない）
- [ ] `name` に号室を含めない
- [ ] `monthly.total` が内訳合計と一致
- [ ] `initial.total` が内訳合計と一致
- [ ] `thumbnailPath` が `thumbnails/<id>.jpg` 形式
- [ ] `public/thumbnails/<id>.jpg` が JPEG として存在
- [ ] `area.hazard` の3項目に値（unknownでも可）
- [ ] `area.nearestIc` を入れた、または null
- [ ] `fetchedAt` を今日の日付 `YYYY-MM-DD` に

## 関連スクリプト

| スクリプト | 用途 |
| --- | --- |
| `scripts/fetch-thumbnails.sh` | `suumo-list.md` 全件のサムネ画像と photoUrls を取得 |
| `scripts/merge-photos.mjs` | 上記で集めた photoUrls を properties.json にマージ |
| `scripts/check-listings.mjs` | 全URLの生存状態・名前整合性を確認 |
| `scripts/sync-listings.mjs` | suumo-list.md 基準で properties.json/thumbnails を同期削除 |
| `scripts/swap-pairs.mjs` | データ取り違えのペアを手動入替（緊急時のみ） |
| `scripts/fix-onsite-parking.mjs` | `parkingDistanceM: null` の物件を再判定し、「敷地内」表記なら 0 に補正 |
