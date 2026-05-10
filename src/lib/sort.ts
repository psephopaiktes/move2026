import type { Property, RatingsMap } from "./types";

export type SortKey =
  | "monthlyTotal"
  | "initialTotal"
  | "areaSqm"
  | "builtYear"
  | "walkMin"
  | "icDriveMin"
  | "rating"
  | "name";

export type SortDir = "asc" | "desc";

export interface SortOption {
  key: SortKey;
  label: string;
  /** 既定の方向（小さい方が良いなら asc） */
  defaultDir: SortDir;
}

export const SORT_OPTIONS: SortOption[] = [
  { key: "monthlyTotal", label: "月額合計", defaultDir: "asc" },
  { key: "initialTotal", label: "初期費用合計", defaultDir: "asc" },
  { key: "areaSqm", label: "専有面積", defaultDir: "desc" },
  { key: "builtYear", label: "築年", defaultDir: "desc" },
  { key: "walkMin", label: "駅徒歩", defaultDir: "asc" },
  { key: "icDriveMin", label: "高速IC", defaultDir: "asc" },
  { key: "rating", label: "★評価", defaultDir: "desc" },
  { key: "name", label: "物件名", defaultDir: "asc" },
];

function valueOf(p: Property, key: SortKey, ratings: RatingsMap): number | string | null {
  switch (key) {
    case "monthlyTotal":
      return p.monthly.total;
    case "initialTotal":
      return p.initial.total;
    case "areaSqm":
      return p.layout.areaSqm;
    case "builtYear":
      return p.building.builtYear;
    case "walkMin":
      return p.station[0]?.walkMin ?? null;
    case "icDriveMin":
      return p.area.nearestIc?.driveMin ?? null;
    case "rating":
      return ratings[p.id]?.stars ?? 0;
    case "name":
      return p.name;
  }
}

export function sortProperties(
  list: Property[],
  key: SortKey,
  dir: SortDir,
  ratings: RatingsMap,
): Property[] {
  const factor = dir === "asc" ? 1 : -1;
  return [...list].sort((a, b) => {
    const va = valueOf(a, key, ratings);
    const vb = valueOf(b, key, ratings);
    // null は常に末尾
    if (va == null && vb == null) return 0;
    if (va == null) return 1;
    if (vb == null) return -1;
    if (typeof va === "string" && typeof vb === "string") {
      return va.localeCompare(vb, "ja") * factor;
    }
    return ((va as number) - (vb as number)) * factor;
  });
}
