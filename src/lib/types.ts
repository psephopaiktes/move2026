// 物件データのスキーマ。docs/ai/data-schema.md と必ず同期させること。
//
// nullable のルール:
// - SUUMO に掲載されていない／調査が困難な値は null を入れる。
// - hazard など列挙型では "unknown" を使う。
// - 0 と null は意味が違う（例: 駐車場0m と 駐車場情報なし）。

export type HazardLevel = "low" | "mid" | "high" | "unknown";

export interface Station {
  line: string;
  name: string;
  walkMin: number;
}

export interface Layout {
  /** 例: "2LDK", "3DK" */
  plan: string;
  /** 専有面積 m² */
  areaSqm: number;
}

export interface Building {
  /** 西暦 例: 2018 */
  builtYear: number;
  /** 例: "RC", "鉄骨", "木造" */
  structure: string;
  /** 当該階数 */
  floor: number;
  /** 総階数 */
  totalFloors: number;
  /** 例: "南", "南東", "未掲載" */
  facing: string;
  /** 総戸数 */
  totalUnits: number | null;
}

export interface Monthly {
  /** 月額合計 = rent + maintenance + parking */
  total: number;
  /** 家賃 */
  rent: number;
  /** 管理共益費 */
  maintenance: number;
  /** 駐車場代 */
  parking: number;
}

export interface InitialCost {
  /** 初期費用合計 = deposit + keyMoney + guarantee */
  total: number;
  /** 敷金 */
  deposit: number;
  /** 礼金 */
  keyMoney: number;
  /** 保証金 */
  guarantee: number;
}

export interface Facilities {
  parkingDistanceM: number | null;
  bikeParking: boolean | null;
  /** 例: "光回線", "Wi-Fi無料", "未掲載" */
  internet: string | null;
  garbageOnSite: boolean | null;
}

export interface NearestIc {
  name: string;
  driveMin: number;
}

export interface HazardInfo {
  flood: HazardLevel;
  landslide: HazardLevel;
  tsunami: HazardLevel;
  /** 国土地理院 重ねるハザードマップ等の参照URL */
  sourceUrl?: string;
  /** 自由記述メモ。「○○川氾濫想定3-5m」など */
  note?: string;
}

export interface AreaInfo {
  nearestIc: NearestIc | null;
  /** SUUMO「周辺情報」リスト。テキストのまま転記 */
  surroundings: string[];
  hazard: HazardInfo;
}

export interface MiscInfo {
  /** 例: "普通借家", "定期借家2年" */
  contractType: string;
  cornerUnit: boolean | null;
}

export interface Property {
  /** SUUMO URL末尾の bc_xxx をそのまま使う */
  id: string;
  suumoUrl: string;
  name: string;
  /** Vite の base に対する相対パス。例: "thumbnails/bc_xxx.jpg" */
  thumbnailPath: string;
  /** SUUMO 掲載写真の直リンク配列 */
  photoUrls: string[];
  /** 住所（最寄り駅と別に持つ） */
  address: string | null;
  station: Station[];
  layout: Layout;
  building: Building;
  monthly: Monthly;
  initial: InitialCost;
  facilities: Facilities;
  area: AreaInfo;
  misc: MiscInfo;
  /** データ取得日 (YYYY-MM-DD) */
  fetchedAt: string;
  /** true にすると一覧から除外される（一時非表示）。省略可。 */
  hidden?: boolean;
}

export interface Rating {
  stars: 0 | 1 | 2 | 3 | 4 | 5;
  memo: string;
  /** ISO8601 */
  updatedAt: string;
}

export type RatingsMap = Record<string, Rating>;
