#!/usr/bin/env node
// id ペアでデータが取り違えになっている物件を入れ替える。
// 入れ替え対象は id / suumoUrl / thumbnailPath 以外の全フィールド。
import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const propsPath = resolve(root, "src/data/properties.json");
const properties = JSON.parse(readFileSync(propsPath, "utf8"));

// [現役ID, 掲載終了ID] のペア
const SWAP_PAIRS = [
  ["bc_100502873998", "bc_100503732292"], // フレンシア浅草橋 ⇔ デュオ・スカーラ蒲田2
  ["bc_100480349207", "bc_100504015734"], // Ｄ Ｐａｉｎａ 今井南町 ⇔ GENOVIA上野2skygarden
];

// 入れ替え時に保持するフィールド（残りは交換する）
const KEEP = new Set(["id", "suumoUrl", "thumbnailPath"]);

for (const [aId, bId] of SWAP_PAIRS) {
  const a = properties.find((p) => p.id === aId);
  const b = properties.find((p) => p.id === bId);
  if (!a || !b) {
    console.error(`pair not found: ${aId} / ${bId}`);
    process.exit(1);
  }
  for (const key of Object.keys(a)) {
    if (KEEP.has(key)) continue;
    const tmp = a[key];
    a[key] = b[key];
    b[key] = tmp;
  }
  console.log(`swapped: ${aId} ⇔ ${bId}`);
  console.log(`  ${aId} -> "${a.name}"`);
  console.log(`  ${bId} -> "${b.name}"`);
}

writeFileSync(propsPath, JSON.stringify(properties, null, 2) + "\n", "utf8");
console.log(`done. wrote ${propsPath}`);
