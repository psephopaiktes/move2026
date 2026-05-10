import { useEffect, useRef, useState } from "react";
import { Star } from "lucide-react";
import type { Rating } from "@/lib/types";
import { saveRating } from "@/lib/ratings";
import { cn } from "@/lib/utils";

const READ_ONLY = !import.meta.env.DEV;

interface Props {
  propertyId: string;
  initial?: Rating;
  onChange?: (rating: Rating) => void;
}

const EMPTY: Rating = { stars: 0, memo: "", updatedAt: "" };

export function RatingControl({ propertyId, initial, onChange }: Props) {
  const [stars, setStars] = useState<Rating["stars"]>(initial?.stars ?? 0);
  const [memo, setMemo] = useState(initial?.memo ?? "");
  const [hover, setHover] = useState(0);
  const debounceRef = useRef<number | null>(null);

  useEffect(() => {
    setStars(initial?.stars ?? 0);
    setMemo(initial?.memo ?? "");
  }, [initial?.stars, initial?.memo]);

  function commit(next: Rating) {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => {
      saveRating(propertyId, next).then((ok) => {
        if (ok) onChange?.(next);
      });
    }, 300);
  }

  function handleStar(n: Rating["stars"]) {
    if (READ_ONLY) {
      void saveRating(propertyId, { ...EMPTY, stars: n });
      return;
    }
    setStars(n);
    commit({ stars: n, memo, updatedAt: new Date().toISOString() });
  }

  function handleMemo(value: string) {
    setMemo(value);
    if (READ_ONLY) return;
    commit({ stars, memo: value, updatedAt: new Date().toISOString() });
  }

  return (
    <div className="space-y-2">
      <div
        className="flex items-center gap-0.5"
        onMouseLeave={() => setHover(0)}
        role="radiogroup"
        aria-label="5段階評価"
      >
        {[1, 2, 3, 4, 5].map((n) => {
          const active = (hover || stars) >= n;
          return (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={stars === n}
              onMouseEnter={() => setHover(n)}
              onClick={() => handleStar(n as Rating["stars"])}
              className="rounded p-0.5 hover:bg-accent focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              title={`${n}星`}
            >
              <Star
                className={cn(
                  "h-5 w-5 transition-colors",
                  active
                    ? "fill-amber-400 text-amber-400"
                    : "fill-transparent text-slate-300",
                )}
              />
            </button>
          );
        })}
        {stars > 0 && !READ_ONLY && (
          <button
            type="button"
            onClick={() => handleStar(0)}
            className="ml-2 text-xs text-muted-foreground hover:underline"
          >
            クリア
          </button>
        )}
      </div>
      <textarea
        value={memo}
        onChange={(e) => handleMemo(e.target.value)}
        placeholder={READ_ONLY ? "メモ（閲覧のみ）" : "メモ..."}
        rows={2}
        className="w-full resize-none rounded border border-input bg-background px-2 py-1 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      />
      {READ_ONLY && (
        <p className="text-[10px] text-muted-foreground">
          GitHub Pages では編集が反映されません（ローカルで起動してください）
        </p>
      )}
    </div>
  );
}
