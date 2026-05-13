#!/usr/bin/env node
// suumo-list.md の各URLについて以下を判定する:
//   - 生存 (alive): SUUMO物件詳細ページが返る
//   - 掲載終了 (gone): /library/... へリダイレクト
//   - データ名不一致 (mismatch): 生存だが properties.json の name と SUUMOページタイトルが一致しない
//
// 結果: stdout に表形式で出力。--json で機械可読JSON。
//
// 使い方:
//   node scripts/check-listings.mjs           # 表形式
//   node scripts/check-listings.mjs --json    # JSON
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const properties = JSON.parse(
  readFileSync(resolve(root, "src/data/properties.json"), "utf8"),
);
const listLines = readFileSync(resolve(root, "suumo-list.md"), "utf8").split("\n");

const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)";

function extractIdFromUrl(url) {
  // bc_<id> 直URL もしくは jnc_*/?bc=<id> どちらにも対応
  const direct = url.match(/\/bc_(\d+)/);
  if (direct) return `bc_${direct[1]}`;
  const query = url.match(/[?&]bc=(\d+)/);
  if (query) return `bc_${query[1]}`;
  return null;
}

async function probe(url, attempt = 0) {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": UA },
      redirect: "follow",
    });
    const html = await res.text();
    const titleMatch = html.match(/<title>([^<]+)<\/title>/);
    const title = titleMatch ? titleMatch[1] : "";
    const finalUrl = res.url;
    const gone = finalUrl.includes("/library/");
    return { ok: true, status: res.status, finalUrl, title, gone };
  } catch (e) {
    if (attempt < 2) {
      await new Promise((r) => setTimeout(r, 500 + attempt * 1000));
      return probe(url, attempt + 1);
    }
    return { ok: false, error: String(e) };
  }
}

function normalize(s) {
  return (s ?? "").replace(/[\s　・･\.（）\(\)\[\]【】「」『』]/g, "").toLowerCase();
}

const urls = listLines
  .map((l) => l.trim())
  .filter((l) => l.startsWith("https://"));

const propsById = new Map(properties.map((p) => [p.id, p]));

const results = [];
const BATCH = 4;
for (let i = 0; i < urls.length; i += BATCH) {
  const batch = urls.slice(i, i + BATCH);
  const settled = await Promise.allSettled(batch.map(probe));
  for (let j = 0; j < batch.length; j++) {
    const url = batch[j];
    const id = extractIdFromUrl(url);
    const s = settled[j];
    if (s.status !== "fulfilled" || !s.value.ok) {
      results.push({
        url,
        id,
        status: "error",
        detail: s.value?.error ?? "rejected",
      });
      continue;
    }
    const { gone, title, finalUrl } = s.value;
    const p = propsById.get(id);
    const jsonName = p?.name ?? null;
    // タイトルから物件名部分のみ抜き出して比較
    const titleName = title.replace(/^【SUUMO】/, "").split("／")[0]
      .replace(/（.*$/, "")
      .trim();
    const nameMatch = jsonName
      ? normalize(titleName).includes(normalize(jsonName)) ||
        normalize(jsonName).includes(normalize(titleName))
      : null;
    let status;
    if (gone) status = "gone";
    else if (!p) status = "alive-not-in-json";
    else if (nameMatch) status = "ok";
    else status = "mismatch";
    results.push({ url, id, status, finalUrl, title, titleName, jsonName });
  }
}

// properties.json には居るが suumo-list.md に居ない物件
const inList = new Set(results.map((r) => r.id));
for (const p of properties) {
  if (!inList.has(p.id)) {
    results.push({
      url: p.suumoUrl,
      id: p.id,
      status: "in-json-not-in-list",
      jsonName: p.name,
    });
  }
}

const isJson = process.argv.includes("--json");
if (isJson) {
  console.log(JSON.stringify(results, null, 2));
} else {
  const tally = {};
  for (const r of results) tally[r.status] = (tally[r.status] || 0) + 1;
  console.log("=== summary ===");
  for (const [k, v] of Object.entries(tally)) console.log(`  ${k}: ${v}`);
  console.log("\n=== details (除く ok) ===");
  for (const r of results) {
    if (r.status === "ok") continue;
    console.log(`[${r.status}] ${r.id} ${r.url}`);
    if (r.title) console.log(`  title: ${r.title}`);
    if (r.jsonName) console.log(`  json : ${r.jsonName}`);
    if (r.detail) console.log(`  err  : ${r.detail}`);
  }
}
