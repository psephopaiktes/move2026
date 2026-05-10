# 新規物件を1件追加する手順

LLMが新しいSUUMO URLを受け取って物件を追加するときの手順です。

## 入力例

> このURLの物件を追加して: https://suumo.jp/chintai/bc_100503999999/

## 手順

### 1. URLから id を確定
末尾の `bc_xxxxxxxxxx` を `id` フィールドとして使う。

### 2. SUUMO 物件詳細ページを WebFetch
以下のpromptで構造化データを取得する：

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
  "surroundings": ["周辺情報"...],
  "photoUrls": ["写真URL"...]
}

JSONブロックだけ返してください。
```

### 3. 金額の正規化

| SUUMO表記 | 数値変換 |
| --- | --- |
| `14.9万円` | 149000 |
| `3万円` | 30000 |
| `家賃1ヶ月分` | rent × 1 |
| `家賃2ヶ月` | rent × 2 |
| `-` / `無し` / `0` | 0 |

### 4. 外部調査（ハザード・高速IC）

#### ハザード判定

| 種別 | low | mid | high |
| --- | --- | --- | --- |
| flood (洪水) | 想定区域外 / <0.5m | 0.5–3m | >3m |
| landslide | 警戒区域外 | イエロー | レッド |
| tsunami | 内陸 / 想定外 | <1m | ≥1m |

調査リソース:
- 国土地理院「重ねるハザードマップ」 https://disaportal.gsi.go.jp/maps/index.html
- 自治体ハザードマップ
- WebSearch: `"<住所> 洪水ハザードマップ"`

不明時は遠慮なく `"unknown"` を入れる。

#### 最寄り高速IC

- 首都高入口でも可
- driveMin はGoogle Mapsで「車で○分」を概算（標準時間）
- 不明・非現実的なら `null`

### 5. サムネ画像のダウンロード

```bash
# og:image を取得
curl -sL -A "Mozilla/5.0" "https://suumo.jp/chintai/bc_xxx/" | \
  grep -oE 'property="og:image" content="[^"]+"' | \
  head -1 | sed 's/.*content="//;s/"//'

# ダウンロード
curl -sL -A "Mozilla/5.0" -o public/thumbnails/bc_xxx.jpg "<image_url>"
file public/thumbnails/bc_xxx.jpg  # JPEG image data であることを確認
```

### 6. properties.json に追記

末尾に追加（配列の最後）。Property型に厳密に合わせる。
- `monthly.total = rent + maintenance + parking`
- `initial.total = deposit + keyMoney + guarantee`
- 不明数値は `0`、不明nullableは `null`、不明列挙は `"unknown"`

### 7. 検証

```bash
npm run typecheck   # JSON自体は型検査されないが App は通る
npm run dev         # 起動して新物件が並ぶか目視
```

### 8. （任意）`suumo-list.md` にも追記

ソース管理の一貫性のため。

## チェックリスト

- [ ] `id` が `bc_` 付き
- [ ] `monthly.total` が内訳合計と一致
- [ ] `initial.total` が内訳合計と一致
- [ ] `thumbnailPath` が `thumbnails/<id>.jpg` 形式
- [ ] `public/thumbnails/<id>.jpg` が JPEG として存在
- [ ] `area.hazard` の3項目に値（unknownでも可）
- [ ] `area.nearestIc` を入れた、または null
- [ ] `fetchedAt` を今日の日付に
