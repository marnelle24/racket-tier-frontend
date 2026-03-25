"use client";

import { cn } from "@/lib/utils";

export type RacketTierV2WordmarkProps = {
  /** Tailwind text size class, e.g. `text-4xl`, `text-3xl`, `text-2xl` */
  textSize?: string;
  className?: string;
};

export function RacketTierV2Wordmark({
  textSize = "text-4xl",
  className,
}: RacketTierV2WordmarkProps) {
  return (
    <h1
      className={cn(
        "font-headline font-extrabold tracking-tighter text-[#c2c1ff]",
        textSize,
        className
      )}
    >
      Racket
      <span className="text-[#c2c1ff] italic">Tier</span>
    </h1>
  );
}
