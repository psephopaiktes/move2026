#!/usr/bin/env node
// suumo-list.md と properties.json と public/thumbnails/ の **双方向同期** を取る。
//
// ルール: 物件の存在を表す唯一のソースは「両者に揃って存在する」状態。
//   - properties.json にあって suumo-list.md に無い → suumo-list.md は手動編集された
//     とみなし、 properties.json から削除 + thumbnail 削除
//   - suumo-list.md にあって properties.json に無い → properties.json は手動編集された
//     とみなし、 suumo-list.md から該当URL行を削除（json への自動追加はしない）
//
// この方針により「片方にだけ残った孤児」が放置されない。
// 新規追加時は LLM が両方に同時追加する運用 (docs/ai/add-property.md)。
//
// 使い方:
//   node scripts/sync-listings.mjs            # 両方向で揃える
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

const listLines = listText.split("\n");
const listIds = new Set();
for (const line of listLines) {
  const id = extractId(line);
  if (id) listIds.add(id);
}
const jsonIds = new Set(properties.map((p) => p.id));

// json にあるが list に無い → json から削除
const removeFromJson = properties.filter((p) => !listIds.has(p.id));
// list にあるが json に無い → list から削除
const removeFromListIds = [...listIds].filter((id) => !jsonIds.has(id));

if (removeFromJson.length === 0 && removeFromListIds.length === 0) {
  console.log("nothing to remove. properties.json and suumo-list.md are in sync.");
  process.exit(0);
}

if (removeFromJson.length > 0) {
  console.log(`will remove ${removeFromJson.length} from properties.json (+ thumbnails):`);
  for (const p of removeFromJson) console.log(`  - ${p.id} (${p.name})`);
}
if (removeFromListIds.length > 0) {
  console.log(`will remove ${removeFromListIds.length} URL lines from suumo-list.md:`);
  for (const id of removeFromListIds) console.log(`  - ${id}`);
}

if (dryRun) {
  console.log("\n(dry-run, no changes written)");
  process.exit(0);
}

// 1. properties.json を更新
if (removeFromJson.length > 0) {
  const kept = properties.filter((p) => listIds.has(p.id));
  writeFileSync(propsPath, JSON.stringify(kept, null, 2) + "\n", "utf8");
  console.log(`\nwrote ${propsPath} (${kept.length} properties)`);

  let thumbsDeleted = 0;
  for (const p of removeFromJson) {
    const f = resolve(thumbDir, `${p.id}.jpg`);
    if (existsSync(f)) {
      unlinkSync(f);
      console.log(`  deleted thumbnail: ${p.id}.jpg`);
      thumbsDeleted += 1;
    }
  }
  console.log(`thumbnails deleted: ${thumbsDeleted}`);
}

// 2. suumo-list.md を更新
if (removeFromListIds.length > 0) {
  const removeSet = new Set(removeFromListIds);
  const keptLines = listLines.filter((line) => {
    const id = extractId(line);
    return !id || !removeSet.has(id);
  });
  writeFileSync(listPath, keptLines.join("\n"), "utf8");
  console.log(`\nwrote ${listPath} (removed ${removeFromListIds.length} lines)`);
}
