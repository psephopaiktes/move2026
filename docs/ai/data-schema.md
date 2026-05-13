# データスキーマ仕様

`src/data/properties.json` のスキーマ。**正本は `src/lib/types.ts`** なので、変更時はそちらと両方を更新してください。

## 物件の一時非表示

`hidden: true` を物件に追加するとUI一覧から除外される。「一旦これは考えない」を表現するためのフラグ。例:

```json
{
  "id": "bc_100502914439",
  "name": "ＡＬＥＲＯ白山",
  "hidden": true,
  ...
}
```

- 評価メモやデータは保持されるので、`hidden` を外せば即座に再表示される
- ソート対象からも外れる
- スクリプト (`check-listings.mjs` 等) は `hidden` の値にかかわらず全件を処理する（生存チェックは行われる）

## ルートは Property[]

各物件は以下のフィールドを持つオブジェクトです。

| パス | 型 | nullable | 出典 | メモ |
| --- | --- | --- | --- | --- |
| `id` | string |  | URL末尾 | `"bc_100505077565"` のように `bc_` プレフィックス付きで保存 |
| `suumoUrl` | string |  | URLそのもの | |
| `name` | string |  | SUUMO物件名 | |
| `thumbnailPath` | string |  | 固定 | `"thumbnails/<id>.jpg"`。`public/` 直下のサムネ画像を参照 |
| `photoUrls` | string[] |  | SUUMO掲載写真URL | 取得失敗時は `[]`。SUUMO直リンク |
| `address` | string \| null | ✅ | SUUMO住所欄 | 町名まで |
| `station` | { line, name, walkMin }[] |  | SUUMO交通欄 | 順序保持 |
| `layout.plan` | string |  | SUUMO | `"2LDK"` 等 |
| `layout.areaSqm` | number |  | SUUMO | 専有面積 (m²) |
| `building.builtYear` | number |  | SUUMO築年 | 西暦 |
| `building.structure` | string |  | SUUMO構造 | `"鉄筋コン"` 等 |
| `building.floor` | number |  | SUUMO所在階 | **不明時 0**。表示は `?/N階` |
| `building.totalFloors` | number |  | SUUMO総階数 | |
| `building.facing` | string |  | SUUMO向き | 不明時 `"unknown"` |
| `building.totalUnits` | number \| null | ✅ | SUUMO総戸数 | |
| `monthly.total` | number |  | 計算 | `rent + maintenance + parking` を必ず満たす |
| `monthly.rent` | number |  | SUUMO家賃 | 円 |
| `monthly.maintenance` | number |  | SUUMO管理費 | 円。不明 0 |
| `monthly.parking` | number |  | SUUMO駐車場代 | 円。不明 0 |
| `initial.total` | number |  | 計算 | `deposit + keyMoney + guarantee` |
| `initial.deposit` | number |  | SUUMO敷金 | 円 |
| `initial.keyMoney` | number |  | SUUMO礼金 | 円 |
| `initial.guarantee` | number |  | SUUMO保証金 | 円。不明 0 |
| `facilities.parkingDistanceM` | number \| null | ✅ | SUUMO駐車場備考 | m。「敷地内」は **0** （null は「未掲載」を意味する） |
| `facilities.bikeParking` | boolean \| null | ✅ | SUUMO設備 | |
| `facilities.internet` | string \| null | ✅ | SUUMO設備 | `"光ファイバー"` 等 |
| `facilities.garbageOnSite` | boolean \| null | ✅ | SUUMO設備 | |
| `area.nearestIc` | { name, driveMin } \| null | ✅ | 外部調査 | 首都高ICでも可 |
| `area.surroundings` | string[] |  | SUUMO周辺情報 | テキスト原文 |
| `area.hazard.flood` | "low"/"mid"/"high"/"unknown" |  | 国土地理院 | |
| `area.hazard.landslide` | 同上 |  | 国土地理院 | |
| `area.hazard.tsunami` | 同上 |  | 国土地理院 | |
| `area.hazard.sourceUrl` | string \| 省略可 | ✅ | 自治体ハザードURL | |
| `area.hazard.note` | string \| 省略可 | ✅ | 自由記述 | |
| `misc.contractType` | string |  | SUUMO契約形態 | |
| `misc.cornerUnit` | boolean \| null | ✅ | SUUMO備考 | |
| `fetchedAt` | string |  | 取得日 | `"YYYY-MM-DD"` |

## 不明値の扱い

- 数値 nullable → `null`
- 数値 non-null（floor 等） → `0`（UI 側で `?/N階` に変換）
- 文字列 nullable → `null`
- 文字列 non-null（facing 等） → `"unknown"`
- ハザード列挙 → `"unknown"`

## ハザード判定基準

[architecture.md](./architecture.md) ではなく [add-property.md](./add-property.md) に記載。

## 0 と null の区別

- `0`: SUUMOに「無し」「-」と明記、または計算上 0
- `null`: SUUMOに掲載なし（不明）

例: 駐車場代 0円 と「駐車場代欄なし」は別物。前者は `parking: 0`、後者は `parking: 0`（仕様上 number 必須）。区別が重要なら `parkingFeePresent: bool` 等を別フィールドで持つこと。
