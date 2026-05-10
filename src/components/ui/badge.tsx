import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset",
  {
    variants: {
      tone: {
        neutral:
          "bg-muted text-muted-foreground ring-border",
        low: "bg-emerald-50 text-emerald-700 ring-emerald-200",
        mid: "bg-amber-50 text-amber-700 ring-amber-200",
        high: "bg-rose-50 text-rose-700 ring-rose-200",
        unknown: "bg-slate-50 text-slate-500 ring-slate-200",
      },
    },
    defaultVariants: { tone: "neutral" },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, tone, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />;
}
