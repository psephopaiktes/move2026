import { ArrowDown, ArrowUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SORT_OPTIONS, type SortDir, type SortKey } from "@/lib/sort";
import { cn } from "@/lib/utils";

interface Props {
  sortKey: SortKey;
  sortDir: SortDir;
  onChange: (key: SortKey, dir: SortDir) => void;
  count: number;
}

export function SortBar({ sortKey, sortDir, onChange, count }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-card px-3 py-2 shadow-sm">
      <span className="mr-2 text-sm text-muted-foreground">
        全 <strong className="text-foreground tabular-nums">{count}</strong> 件 · 並び替え
      </span>
      <div className="flex flex-wrap gap-1">
        {SORT_OPTIONS.map((opt) => {
          const active = opt.key === sortKey;
          return (
            <Button
              key={opt.key}
              type="button"
              size="sm"
              variant={active ? "default" : "outline"}
              onClick={() => {
                if (active) {
                  onChange(opt.key, sortDir === "asc" ? "desc" : "asc");
                } else {
                  onChange(opt.key, opt.defaultDir);
                }
              }}
              className={cn("h-8")}
            >
              {opt.label}
              {active && (
                <span className="ml-1 inline-flex">
                  {sortDir === "asc" ? (
                    <ArrowUp className="h-3 w-3" />
                  ) : (
                    <ArrowDown className="h-3 w-3" />
                  )}
                </span>
              )}
            </Button>
          );
        })}
      </div>
    </div>
  );
}
