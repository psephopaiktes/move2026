import type { Property, RatingsMap } from "@/lib/types";
import { PropertyCard } from "./PropertyCard";

interface Props {
  properties: Property[];
  ratings: RatingsMap;
  onRatingChange: (id: string, rating: import("@/lib/types").Rating) => void;
}

export function PropertyList({ properties, ratings, onRatingChange }: Props) {
  if (properties.length === 0) {
    return (
      <div className="rounded-lg border border-dashed bg-card p-10 text-center text-muted-foreground">
        <p>物件データがまだ登録されていません。</p>
        <p className="mt-1 text-xs">
          <code>src/data/properties.json</code> にデータを追加してください。
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {properties.map((p) => (
        <PropertyCard
          key={p.id}
          property={p}
          rating={ratings[p.id]}
          onRatingChange={onRatingChange}
        />
      ))}
    </div>
  );
}
