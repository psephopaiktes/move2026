#!/usr/bin/env node
// parkingDistanceM が null になっている物件を再チェック。
// SUUMOページの「駐車場」セクションに「敷地内」と書かれていれば
// それは「距離 0m」を意味するので parkingDistanceM: 0 に修正する。
//
// 「未掲載」「駐車場なし」の場合は null のまま残す。
//
// 使い方:
//   node scripts/fix-onsite-parking.mjs            # 修正適用
//   node scripts/fix-onsite-parking.mjs --dry-run  # 差分プレビューのみ
import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const propsPath = resolve(root, "src/data/properties.json");
const dryRun = process.argv.includes("--dry-run");
const properties = JSON.parse(readFileSync(propsPath, "utf8"));

const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)";

async function probeOnsiteParking(url) {
  try {
    const res = await fetch(url, { headers: { "User-Agent": UA }, redirect: "follow" });
    const html = await res.text();
    // HTMLタグを除去してテキスト化してから判定する
    // (SUUMOは「駐車場」と「敷地内」の間に <td> 等を挟むため、タグ越えで近傍マッチが必要)
    const text = html
      .replace(/<[^>]+>/g, " ")
      .replace(/&[a-z]+;/gi, " ")
      .replace(/\s+/g, " ");
    // 「駐車場」の直後 80 文字以内に「敷地内」があれば敷地内駐車場
    const pattern = /駐車場[\s\S]{0,80}敷地内/;
    return pattern.test(text);
  } catch (e) {
    console.error(`  fetch failed for ${url}: ${e}`);
    return null;
  }
}

const nullList = properties.filter((p) => p.facilities.parkingDistanceM === null);
console.log(`checking ${nullList.length} properties with parkingDistanceM=null...\n`);

const updates = [];
const BATCH = 4;
for (let i = 0; i < nullList.length; i += BATCH) {
  const batch = nullList.slice(i, i + BATCH);
  const results = await Promise.all(
    batch.map(async (p) => ({ p, onsite: await probeOnsiteParking(p.suumoUrl) })),
  );
  for (const { p, onsite } of results) {
    if (onsite === true) {
      console.log(`  [ONSITE] ${p.id} (${p.name}) → parkingDistanceM: 0`);
      updates.push(p);
    } else if (onsite === false) {
      console.log(`  [OTHER]  ${p.id} (${p.name}) → 不明/未掲載、nullのまま`);
    } else {
      console.log(`  [ERR]    ${p.id} (${p.name})`);
    }
  }
}

console.log(`\n${updates.length} properties to update.`);

if (dryRun || updates.length === 0) {
  if (dryRun) console.log("(dry-run, no changes written)");
  process.exit(0);
}

for (const p of updates) p.facilities.parkingDistanceM = 0;
writeFileSync(propsPath, JSON.stringify(properties, null, 2) + "\n", "utf8");
console.log(`wrote ${propsPath}`);
