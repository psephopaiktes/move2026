import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  thumbnailSrc: string;
  photoUrls: string[];
}

export function PhotoSlideshow({
  open,
  onOpenChange,
  title,
  thumbnailSrc,
  photoUrls,
}: Props) {
  const sources = photoUrls.length > 0 ? photoUrls : [thumbnailSrc];
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (open) setIndex(0);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowLeft") setIndex((i) => (i - 1 + sources.length) % sources.length);
      if (e.key === "ArrowRight") setIndex((i) => (i + 1) % sources.length);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, sources.length]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogTitle className="pr-10">{title}</DialogTitle>
        <DialogDescription className="sr-only">
          物件 {title} の掲載写真スライドショー
        </DialogDescription>
        <div className="relative mt-3 aspect-[4/3] w-full overflow-hidden rounded-md bg-muted">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={sources[index]}
            alt={`${title} の写真 ${index + 1}/${sources.length}`}
            loading="lazy"
            referrerPolicy="no-referrer"
            className="h-full w-full object-contain"
            onError={(e) => {
              const img = e.currentTarget as HTMLImageElement;
              if (img.src !== thumbnailSrc) {
                img.src = thumbnailSrc;
              }
            }}
          />
          {sources.length > 1 && (
            <>
              <button
                type="button"
                aria-label="前の写真"
                onClick={() => setIndex((i) => (i - 1 + sources.length) % sources.length)}
                className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-1 text-white hover:bg-black/60"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                type="button"
                aria-label="次の写真"
                onClick={() => setIndex((i) => (i + 1) % sources.length)}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-1 text-white hover:bg-black/60"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </>
          )}
        </div>
        <div className="mt-2 text-center text-xs text-muted-foreground tabular-nums">
          {index + 1} / {sources.length}
        </div>
      </DialogContent>
    </Dialog>
  );
}
