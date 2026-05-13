import { useEffect, useMemo, useState } from "react";
import propertiesData from "@/data/properties.json";
import { loadRatings } from "@/lib/ratings";
import { sortProperties, type SortDir, type SortKey } from "@/lib/sort";
import type { Property, Rating, RatingsMap } from "@/lib/types";
import { PropertyList } from "@/components/PropertyList";
import { SortBar } from "@/components/SortBar";

// hidden: true の物件は一覧から除外（一時的に検討対象外にしたい物件）
const properties = (propertiesData as unknown as Property[]).filter((p) => !p.hidden);

export default function App() {
  const [ratings, setRatings] = useState<RatingsMap>({});
  const [sortKey, setSortKey] = useState<SortKey>("rating");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  useEffect(() => {
    loadRatings().then(setRatings);
  }, []);

  const sorted = useMemo(
    () => sortProperties(properties, sortKey, sortDir, ratings),
    [sortKey, sortDir, ratings],
  );

  return (
    <div className="min-h-screen bg-slate-50/50">
      <header className="border-b bg-background">
        <div className="container flex flex-col gap-1 py-4">
          <h1 className="text-xl font-bold">2026年 引っ越し先 物件比較</h1>
          <p className="text-xs text-muted-foreground">
            SUUMO 掲載 {properties.length} 件 · 月額・初期費用は合計のみ表示／クリックで内訳
          </p>
        </div>
      </header>

      <main className="container space-y-3 py-4">
        <SortBar
          sortKey={sortKey}
          sortDir={sortDir}
          onChange={(k, d) => {
            setSortKey(k);
            setSortDir(d);
          }}
          count={properties.length}
        />
        <PropertyList
          properties={sorted}
          ratings={ratings}
          onRatingChange={(id, r: Rating) =>
            setRatings((prev) => ({ ...prev, [id]: r }))
          }
        />
      </main>

      <footer className="container py-6 text-center text-xs text-muted-foreground">
        © 2026 私的物件比較 ·{" "}
        <span>
          評価は{import.meta.env.DEV ? "ローカル JSON" : "閲覧のみ"}に保存されます
        </span>
      </footer>
    </div>
  );
}
