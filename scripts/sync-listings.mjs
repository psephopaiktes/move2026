#!/usr/bin/env node
// suumo-list.md と properties.json と public/thumbnails/ の整合を取る。
//
// 動作:
//   1. suumo-list.md に居ないIDの properties.json エントリを削除
//   2. 上記エントリに対応する public/thumbnails/<id>.jpg を削除
//   3. （--prune-gone 指定時のみ）library リダイレクトの掲載終了物件を全削除
//
// 注意: 新規物件の追加は対象外。docs/ai/add-property.md の手順に従う。
//
// 使い方:
//   node scripts/sync-listings.mjs            # suumo-list.md 基準で削除
//   node scripts/sync-listings.mjs --dry-run  # 差分の確認のみ
import { readFileSync, writeFileSync, existsSync, unlinkSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const propsPath = resolve(root, "src/data/properties.json");
const listPath = resolve(root, "suumo-list.md");
const thumbDir = resolve(root, "public/thumbnails");

const dryRun = process.argv.includes("--dry-run");
const properties = JSON.parse(readFileSync(propsPath, "utf8"));
const listText = readFileSync(listPath, "utf8");

function extractId(line) {
  const direct = line.match(/\/bc_(\d+)/);
  if (direct) return `bc_${direct[1]}`;
  const q = line.match(/[?&]bc=(\d+)/);
  if (q) return `bc_${q[1]}`;
  return null;
}

const listIds = new Set(
  listText
    .split("\n")
    .map(extractId)
    .filter(Boolean),
);

const toRemove = properties.filter((p) => !listIds.has(p.id));
if (toRemove.length === 0) {
  console.log("nothing to remove. properties.json is in sync with suumo-list.md.");
  process.exit(0);
}

console.log(`will remove ${toRemove.length} properties from properties.json:`);
for (const p of toRemove) console.log(`  - ${p.id} (${p.name})`);

if (dryRun) {
  console.log("\n(dry-run, no changes written)");
  process.exit(0);
}

const kept = properties.filter((p) => listIds.has(p.id));
writeFileSync(propsPath, JSON.stringify(kept, null, 2) + "\n", "utf8");
console.log(`\nwrote ${propsPath} (${kept.length} properties)`);

let thumbsDeleted = 0;
for (const p of toRemove) {
  const f = resolve(thumbDir, `${p.id}.jpg`);
  if (existsSync(f)) {
    unlinkSync(f);
    console.log(`  deleted thumbnail: ${p.id}.jpg`);
    thumbsDeleted += 1;
  }
}
console.log(`thumbnails deleted: ${thumbsDeleted}`);
