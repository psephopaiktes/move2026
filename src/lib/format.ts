const yenFmt = new Intl.NumberFormat("ja-JP", {
  style: "currency",
  currency: "JPY",
  maximumFractionDigits: 0,
});

const numFmt = new Intl.NumberFormat("ja-JP");

export function fmtYen(value: number | null | undefined): string {
  if (value == null) return "—";
  return yenFmt.format(value);
}

export function fmtMan(value: number | null | undefined): string {
  if (value == null) return "—";
  if (value === 0) return "0円";
  if (value % 10000 === 0) return `${numFmt.format(value / 10000)}万円`;
  return yenFmt.format(value);
}

export function fmtSqm(value: number | null | undefined): string {
  if (value == null) return "—";
  return `${value.toFixed(2)}㎡`;
}

export function fmtAge(builtYear: number | null | undefined, today = new Date()): string {
  if (!builtYear) return "—";
  const age = today.getFullYear() - builtYear;
  if (age <= 0) return `新築 (${builtYear})`;
  return `築${age}年 (${builtYear})`;
}

export function fmtFloor(floor: number, total: number): string {
  // 0 はサブエージェント側で「不明」を意味する代用値として使われる
  if (!floor && !total) return "—";
  if (!floor) return `?/${total}階`;
  if (!total) return `${floor}/?階`;
  return `${floor}/${total}階`;
}

export function fmtBool(value: boolean | null | undefined, t = "あり", f = "なし"): string {
  if (value == null) return "—";
  return value ? t : f;
}

export function fmtMin(value: number | null | undefined): string {
  if (value == null) return "—";
  return `${value}分`;
}

export function fmtMeter(value: number | null | undefined): string {
  if (value == null) return "—";
  return `${numFmt.format(value)}m`;
}
