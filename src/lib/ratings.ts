import type { Rating, RatingsMap } from "./types";
import initialRatings from "@/data/ratings.json";

const API = "/api/ratings";

/**
 * 評価データを取得する。
 * - 開発時 (import.meta.env.DEV): /api/ratings から最新を取得
 * - 本番 (GitHub Pages): バンドルされた ratings.json をそのまま返す
 */
export async function loadRatings(): Promise<RatingsMap> {
  if (import.meta.env.DEV) {
    try {
      const res = await fetch(API);
      if (!res.ok) throw new Error(`status ${res.status}`);
      const json = (await res.json()) as { ratings: RatingsMap };
      return json.ratings ?? {};
    } catch (err) {
      console.warn("[ratings] dev fetch failed, fallback to bundled JSON", err);
    }
  }
  return (initialRatings as { ratings: RatingsMap }).ratings ?? {};
}

/**
 * 評価データを保存する。
 * - 開発時: dev plugin に PUT 送信して src/data/ratings.json を更新
 * - 本番: alert で停止（書き込み不能を明示）
 *
 * @returns 成功した場合 true、本番モード等で書込み不能なら false
 */
export async function saveRating(id: string, rating: Rating): Promise<boolean> {
  if (!import.meta.env.DEV) {
    alert(
      "GitHub Pages 上では評価の保存はできません。ローカル環境（npm start）で起動してください。",
    );
    return false;
  }
  try {
    const res = await fetch(`${API}/${encodeURIComponent(id)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(rating),
    });
    if (!res.ok) throw new Error(`status ${res.status}`);
    return true;
  } catch (err) {
    console.error("[ratings] save failed", err);
    alert("評価の保存に失敗しました。dev server のログを確認してください。");
    return false;
  }
}
