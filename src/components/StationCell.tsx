import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { Station } from "@/lib/types";
import { fmtMin } from "@/lib/format";
import { cn } from "@/lib/utils";

interface Props {
  stations: Station[];
  className?: string;
}

export function StationCell({ stations, className }: Props) {
  if (stations.length === 0) return <span className={className}>—</span>;
  const primary = stations[0];
  const hasMore = stations.length > 1;

  const labelInline = (s: Station) => `${s.line} ${s.name} · 徒歩${fmtMin(s.walkMin)}`;

  if (!hasMore) {
    return <span className={className}>{labelInline(primary)}</span>;
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex items-baseline gap-1 rounded px-1 -mx-1 text-left hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
            className,
          )}
        >
          <span>{labelInline(primary)}</span>
          <span aria-hidden className="text-xs text-muted-foreground">
            +{stations.length - 1}▸
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-72">
        <div className="text-xs font-medium text-muted-foreground">
          利用可能な駅 ({stations.length})
        </div>
        <ul className="mt-2 space-y-1 text-sm">
          {stations.map((s, i) => (
            <li key={`${s.line}-${s.name}-${i}`} className="flex items-baseline justify-between gap-2">
              <span className="min-w-0">
                <span className="text-muted-foreground">{s.line}</span>
                <span className="ml-1">{s.name}</span>
              </span>
              <span className="shrink-0 tabular-nums">徒歩{fmtMin(s.walkMin)}</span>
            </li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  );
}
