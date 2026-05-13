import { useState } from "react";
import { ExternalLink } from "lucide-react";
import type { Property, Rating } from "@/lib/types";
import {
  fmtAge,
  fmtBool,
  fmtFloor,
  fmtMeter,
  fmtMin,
  fmtSqm,
} from "@/lib/format";
import { PriceCell } from "./PriceCell";
import { PhotoSlideshow } from "./PhotoSlideshow";
import { HazardBadge } from "./HazardBadge";
import { RatingControl } from "./RatingControl";
import { StationCell } from "./StationCell";

interface Props {
  property: Property;
  rating?: Rating;
  onRatingChange?: (id: string, r: Rating) => void;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-0.5 text-sm">{children}</div>
    </div>
  );
}

export function PropertyCard({ property: p, rating, onRatingChange }: Props) {
  const [open, setOpen] = useState(false);
  const thumbSrc = `${import.meta.env.BASE_URL}${p.thumbnailPath}`;
  const placeholderSrc = `${import.meta.env.BASE_URL}no-image.svg`;

  return (
    <article className="flex flex-col gap-3 rounded-lg border bg-card p-3 shadow-sm transition-shadow hover:shadow-md md:flex-row">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="block shrink-0 overflow-hidden rounded-md bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:w-56"
        aria-label={`${p.name} の写真を見る`}
      >
        <img
          src={thumbSrc}
          alt={p.name}
          loading="lazy"
          className="aspect-[4/3] w-full object-cover transition-transform hover:scale-[1.02]"
          onError={(e) => {
            const img = e.currentTarget as HTMLImageElement;
            const fallback = p.photoUrls[0];
            if (fallback && img.src !== fallback) {
              img.src = fallback;
            } else if (img.src !== placeholderSrc) {
              img.src = placeholderSrc;
            }
          }}
        />
      </button>

      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <header className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-base font-semibold">
            <a
              href={p.suumoUrl}
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex items-center gap-1 hover:underline"
            >
              {p.name}
              <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
            </a>
          </h2>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-muted-foreground">月額</span>
            <PriceCell mode="monthly" total={p.monthly.total} detail={p.monthly} />
            <span className="text-muted-foreground">初期</span>
            <PriceCell mode="initial" total={p.initial.total} detail={p.initial} />
          </div>
        </header>

        <section className="grid grid-cols-2 gap-x-4 gap-y-2 md:grid-cols-4">
          <Field label="間取り / 面積">
            {p.layout.plan} · {fmtSqm(p.layout.areaSqm)}
          </Field>
          <Field label="築年 / 構造">
            {fmtAge(p.building.builtYear)} · {p.building.structure}
          </Field>
          <Field label="階数 / 向き">
            {fmtFloor(p.building.floor, p.building.totalFloors)} · {p.building.facing}
          </Field>
          <Field label="最寄駅">
            <StationCell stations={p.station} />
          </Field>
          <Field label="駐車場 / 駐輪">
            {fmtMeter(p.facilities.parkingDistanceM)} · 駐輪 {fmtBool(p.facilities.bikeParking)}
          </Field>
          <Field label="ネット / ゴミ置場">
            {p.facilities.internet ?? "—"} · {fmtBool(p.facilities.garbageOnSite)}
          </Field>
          <Field label="高速IC">
            {p.area.nearestIc
              ? `${p.area.nearestIc.name} (車${fmtMin(p.area.nearestIc.driveMin)})`
              : "—"}
          </Field>
          <Field label="契約 / 角部屋 / 総戸数">
            {p.misc.contractType} · 角{fmtBool(p.misc.cornerUnit)} · {p.building.totalUnits ?? "—"}戸
          </Field>
        </section>

        <section className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_minmax(0,16rem)]">
          <div className="space-y-2">
            <div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                ハザード
              </div>
              <div className="mt-1">
                <HazardBadge hazard={p.area.hazard} />
              </div>
            </div>
            {p.area.surroundings.length > 0 && (
              <div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  周辺情報
                </div>
                <ul className="mt-1 flex flex-wrap gap-1">
                  {p.area.surroundings.map((s, i) => (
                    <li
                      key={i}
                      className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground"
                    >
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
              評価
            </div>
            <div className="mt-1">
              <RatingControl
                propertyId={p.id}
                initial={rating}
                onChange={(r) => onRatingChange?.(p.id, r)}
              />
            </div>
          </div>
        </section>
      </div>

      <PhotoSlideshow
        open={open}
        onOpenChange={setOpen}
        title={p.name}
        thumbnailSrc={thumbSrc}
        photoUrls={p.photoUrls}
      />
    </article>
  );
}
