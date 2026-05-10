#!/usr/bin/env node
// 全物件URLを叩いて <title> を取得し、properties.json の name と一致するか検証する。
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const properties = JSON.parse(readFileSync(resolve(root, "src/data/properties.json"), "utf8"));

const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)";

async function fetchTitle(url) {
  const res = await fetch(url, {
    headers: { "User-Agent": UA },
    redirect: "follow",
  });
  const html = await res.text();
  const m = html.match(/<title>([^<]+)<\/title>/);
  return { finalUrl: res.url, title: m ? m[1] : null };
}

function normalize(s) {
  // 全角・空白・記号を緩く比較
  return s.replace(/[\s　・･\.\(（〔【『「]/g, "").toLowerCase();
}

const results = [];
const limit = 4;
for (let i = 0; i < properties.length; i += limit) {
  const batch = properties.slice(i, i + limit);
  const settled = await Promise.allSettled(
    batch.map(async (p) => {
      const { finalUrl, title } = await fetchTitle(p.suumoUrl);
      return { p, finalUrl, title };
    }),
  );
  for (const s of settled) {
    if (s.status === "fulfilled") results.push(s.value);
    else results.push({ p: { id: "?" }, error: String(s.reason) });
  }
}

let mismatches = 0;
for (const r of results) {
  if (r.error) {
    console.log(`[ERR] ${r.p.id}: ${r.error}`);
    continue;
  }
  const { p, title, finalUrl } = r;
  const isRedirect = !finalUrl.includes(p.id.replace("bc_", ""));
  const titleHasName = title && normalize(title).includes(normalize(p.name));
  const flag = isRedirect ? "REDIRECT" : titleHasName ? "OK" : "MISMATCH";
  if (flag !== "OK") mismatches += 1;
  console.log(`[${flag}] ${p.id}`);
  console.log(`  json.name : ${p.name}`);
  console.log(`  page.title: ${title}`);
  if (isRedirect) console.log(`  finalUrl  : ${finalUrl}`);
}
console.log(`\nTotal: ${results.length}, mismatches/redirects: ${mismatches}`);
