import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { fmtMan, fmtYen } from "@/lib/format";
import { cn } from "@/lib/utils";

type Mode = "monthly" | "initial";

interface MonthlyDetail {
  rent: number;
  maintenance: number;
  parking: number;
}
interface InitialDetail {
  deposit: number;
  keyMoney: number;
  guarantee: number;
}

interface Props {
  mode: Mode;
  total: number;
  detail: MonthlyDetail | InitialDetail;
  className?: string;
}

const LABELS: Record<Mode, { title: string; rows: { key: string; label: string }[] }> = {
  monthly: {
    title: "月額内訳",
    rows: [
      { key: "rent", label: "家賃" },
      { key: "maintenance", label: "管理共益費" },
      { key: "parking", label: "駐車場" },
    ],
  },
  initial: {
    title: "初期費用内訳",
    rows: [
      { key: "deposit", label: "敷金" },
      { key: "keyMoney", label: "礼金" },
      { key: "guarantee", label: "保証金" },
    ],
  },
};

export function PriceCell({ mode, total, detail, className }: Props) {
  const { title, rows } = LABELS[mode];
  const detailMap = detail as unknown as Record<string, number>;
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex items-baseline gap-1 rounded px-1 -mx-1 hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
            className,
          )}
        >
          <span className="text-base font-semibold tabular-nums">{fmtMan(total)}</span>
          <span aria-hidden className="text-xs text-muted-foreground">▸</span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-56">
        <div className="text-xs font-medium text-muted-foreground">{title}</div>
        <table className="mt-2 w-full text-sm">
          <tbody>
            {rows.map(({ key, label }) => (
              <tr key={key}>
                <td className="py-0.5 text-muted-foreground">{label}</td>
                <td className="py-0.5 text-right tabular-nums">
                  {fmtYen(detailMap[key])}
                </td>
              </tr>
            ))}
            <tr className="border-t">
              <td className="pt-1 font-medium">合計</td>
              <td className="pt-1 text-right font-semibold tabular-nums">
                {fmtYen(total)}
              </td>
            </tr>
          </tbody>
        </table>
      </PopoverContent>
    </Popover>
  );
}
