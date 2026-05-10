#!/usr/bin/env node
// /tmp/suumo_photos.json から photoUrls を吸い上げて
// src/data/properties.json の各物件に書き戻す。
// fetch-thumbnails.sh の後に実行する。
import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const propsPath = resolve(root, "src/data/properties.json");
const photosPath = "/tmp/suumo_photos.json";

const properties = JSON.parse(readFileSync(propsPath, "utf8"));
const photos = JSON.parse(readFileSync(photosPath, "utf8"));

let updated = 0;
for (const p of properties) {
  const urls = photos[p.id] ?? [];
  if (urls.length > 0 && JSON.stringify(p.photoUrls) !== JSON.stringify(urls)) {
    p.photoUrls = urls;
    updated += 1;
  }
}

writeFileSync(propsPath, JSON.stringify(properties, null, 2) + "\n", "utf8");
console.log(`updated photoUrls for ${updated} properties (of ${properties.length})`);
