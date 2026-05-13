#!/usr/bin/env bash
# SUUMO 物件詳細ページから物件写真を一括取得し、public/thumbnails/<id>.jpg を作成する。
# 同時に各物件の写真URL一覧を /tmp/suumo_photos.json に書き出す。
# 並列度は MAX_PARALLEL で制御。
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
THUMB_DIR="$ROOT/public/thumbnails"
PHOTOS_OUT="/tmp/suumo_photos.json"
UA="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)"
MAX_PARALLEL=4

mkdir -p "$THUMB_DIR"
echo "{" > "$PHOTOS_OUT.tmp"
first=1

fetch_one() {
  local id="$1"
  local url="https://suumo.jp/chintai/${id}/"
  local html_tmp="/tmp/suumo_${id}.html"
  curl -sL -A "$UA" -o "$html_tmp" "$url" || { echo "  [FAIL fetch html] $id" >&2; return 1; }

  # 物件画像URLを抽出
  # SUUMO命名規則:
  #   _ro = 外観 / _co = 間取り図 / _go = 地図 / _1o,2o,... = 物件写真
  # 地図(_go)は不要なので除外。間取り図(_co)は比較に有用なので残す。
  local urls
  urls=$(grep -oE 'https://img01\.suumo\.com/front/gazo/fr/bukken/[0-9]+/[0-9]+/[0-9]+_[a-z0-9]+\.jpg' "$html_tmp" \
    | awk '!seen[$0]++' \
    | grep -vE '_go\.jpg$' \
    | head -12)

  if [ -z "$urls" ]; then
    echo "  [WARN no images] $id" >&2
    rm -f "$html_tmp"
    return 1
  fi

  # 1枚目をサムネとしてDL（_ro優先、なければ最初の写真）
  local thumb_url
  thumb_url=$(echo "$urls" | grep -E '_ro\.jpg$' | head -1)
  if [ -z "$thumb_url" ]; then
    thumb_url=$(echo "$urls" | head -1)
  fi
  curl -sL -A "$UA" -o "$THUMB_DIR/${id}.jpg" "$thumb_url"

  # JPEG ヘッダ確認
  if ! head -c 3 "$THUMB_DIR/${id}.jpg" | xxd -p | grep -q '^ffd8ff'; then
    echo "  [WARN bad jpg] $id" >&2
    rm -f "$THUMB_DIR/${id}.jpg"
    rm -f "$html_tmp"
    return 1
  fi

  # photoUrls 用に書き出し（行ベース）
  echo "$urls" > "/tmp/suumo_photos_${id}.txt"
  rm -f "$html_tmp"
  echo "  [OK] $id ($(echo "$urls" | wc -l | tr -d ' ') urls)"
}

# suumo-list.md からURL→IDを抜き出す（macOSのbash3でも動くように mapfile を避ける）
# bc_xxx 直URLと jnc_*/?bc=xxx クエリの両方に対応。同じIDは重複排除。
IDS=()
while IFS= read -r line; do
  IDS+=("$line")
done < <(grep -oE '(bc_|bc=)[0-9]+' "$ROOT/suumo-list.md" | sed 's/bc=/bc_/' | awk '!seen[$0]++')

echo "Fetching ${#IDS[@]} properties (batches of $MAX_PARALLEL)..."
batch=""
for id in "${IDS[@]}"; do
  fetch_one "$id" &
  batch="$batch $!"
  count=$(echo "$batch" | wc -w | tr -d ' ')
  if [ "$count" -ge "$MAX_PARALLEL" ]; then
    for pid in $batch; do wait "$pid" || true; done
    batch=""
  fi
done
for pid in $batch; do wait "$pid" || true; done

# JSON組み立て
python3 - "$THUMB_DIR" "$PHOTOS_OUT" "${IDS[@]}" <<'PY'
import json, os, sys
thumb_dir = sys.argv[1]
out_path = sys.argv[2]
ids = sys.argv[3:]
data = {}
for pid in ids:
    fp = f"/tmp/suumo_photos_{pid}.txt"
    if os.path.exists(fp):
        with open(fp) as f:
            urls = [l.strip() for l in f if l.strip()]
        data[pid] = urls
        os.remove(fp)
    else:
        data[pid] = []
with open(out_path, "w") as f:
    json.dump(data, f, ensure_ascii=False, indent=2)
print(f"wrote {out_path}: {sum(1 for v in data.values() if v)}/{len(data)} have urls")
PY

echo "Done."
ls -la "$THUMB_DIR" | tail -30
