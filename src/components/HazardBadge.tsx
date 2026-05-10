import type { HazardInfo, HazardLevel } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const TONE: Record<HazardLevel, "low" | "mid" | "high" | "unknown"> = {
  low: "low",
  mid: "mid",
  high: "high",
  unknown: "unknown",
};

const TEXT: Record<HazardLevel, string> = {
  low: "低",
  mid: "中",
  high: "高",
  unknown: "?",
};

interface Props {
  hazard: HazardInfo;
}

export function HazardBadge({ hazard }: Props) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-1 rounded px-1 -mx-1 hover:bg-accent focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          title="ハザード情報を見る"
        >
          <Badge tone={TONE[hazard.flood]}>洪水{TEXT[hazard.flood]}</Badge>
          <Badge tone={TONE[hazard.landslide]}>土砂{TEXT[hazard.landslide]}</Badge>
          <Badge tone={TONE[hazard.tsunami]}>津波{TEXT[hazard.tsunami]}</Badge>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-72">
        <div className="text-xs font-medium text-muted-foreground">ハザード詳細</div>
        <dl className="mt-2 grid grid-cols-[6rem_1fr] gap-y-1 text-sm">
          <dt className="text-muted-foreground">洪水</dt>
          <dd>{TEXT[hazard.flood]} ({hazard.flood})</dd>
          <dt className="text-muted-foreground">土砂災害</dt>
          <dd>{TEXT[hazard.landslide]} ({hazard.landslide})</dd>
          <dt className="text-muted-foreground">津波</dt>
          <dd>{TEXT[hazard.tsunami]} ({hazard.tsunami})</dd>
        </dl>
        {hazard.note && <p className="mt-2 text-xs">{hazard.note}</p>}
        {hazard.sourceUrl && (
          <a
            href={hazard.sourceUrl}
            target="_blank"
            rel="noreferrer noopener"
            className="mt-2 inline-block text-xs text-blue-600 hover:underline"
          >
            ハザードマップを開く →
          </a>
        )}
      </PopoverContent>
    </Popover>
  );
}
