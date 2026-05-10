# 新規フィールドを追加する手順

物件に新しい項目（例: ペット可、宅配ボックス、室内洗濯機置場）を追加する場合のチェックリスト。

連動して更新が必要なファイルが多いので、見落とさないように。

## 1. 型を更新（正本）

`src/lib/types.ts`:
```ts
export interface Facilities {
  parkingDistanceM: number | null;
  bikeParking: boolean | null;
  internet: string | null;
  garbageOnSite: boolean | null;
  petAllowed: boolean | null;          // ★ 追加
}
```

nullable のルールは [data-schema.md](./data-schema.md) を参照。

## 2. データを埋める

`src/data/properties.json` の各物件 27 件すべてに新フィールドを追加。
- LLMで一括処理する場合: `Edit` ツールで `"garbageOnSite": ...` の直後に追加。
- 値が分からない物件は `null`（boolean 型なら）/ `"unknown"`（列挙）/ `0`（数値）。

## 3. UI に表示

### 3a. PropertyCard に Field を追加

`src/components/PropertyCard.tsx`:
```tsx
<Field label="ペット可">
  {fmtBool(p.facilities.petAllowed)}
</Field>
```

ラベルは1行15文字以内が望ましい（カードレイアウトの折り返し対策）。

### 3b. フォーマッタが必要なら format.ts に追加

`src/lib/format.ts` に `fmtPet` などを追加（既存の `fmtBool` で済むなら不要）。

## 4. ソート対応（任意）

定量項目で並び替えしたい場合のみ:

`src/lib/sort.ts`:
```ts
export type SortKey = ... | "petAllowed";

// SORT_OPTIONS に追加
{ key: "petAllowed", label: "ペット可", defaultDir: "desc" },

// valueOf に case
case "petAllowed":
  return p.facilities.petAllowed ? 1 : 0;
```

## 5. ドキュメントを更新

### 5a. data-schema.md
表に行を追加。出典・nullable・備考を明記。

### 5b. add-property.md
取得用 WebFetch プロンプトに新項目を追加。LLMが新規物件追加時に同フィールドを埋められるようにする。

## 6. 検証

```bash
npm run typecheck
npm run build
npm run dev
```

ブラウザで:
- 全物件カードに新項目が表示されている
- ソート対応した場合、ソートバーに新ボタンが現れて昇降が動く

## 失念しがちな箇所

- ❌ 型に追加したのに `properties.json` のデータが27件のうち数件しか埋まっていない → ランタイムで undefined 参照が発生
- ❌ ソート登録だけして `valueOf` の case を書き忘れる → TypeScript の網羅性チェックがコンパイルエラーになる
- ❌ `fmtBool` で `null` を `"なし"` 表示にしてしまう → 「不明」と「無し」を区別できない。`null → "—"` を維持する
