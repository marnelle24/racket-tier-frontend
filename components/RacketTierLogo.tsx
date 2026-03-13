"use client";

import { cn } from "@/lib/utils";

type RacketTierLogoProps = {
  /** Tailwind text size class, e.g. "text-5xl", "text-3xl", "text-sm" */
  textSize?: string;
  /** Tagline text below the logo. Omit or pass empty string to hide. */
  tagline?: string | null;
  /** For entrance animation. When false, logo starts faded/offset; when true, fully visible. */
  mounted?: boolean;
  /** Optional extra class names for the wrapper */
  className?: string;
};

export function RacketTierLogo({
  textSize = "text-5xl",
  tagline = null,
  mounted = true,
  className,
}: RacketTierLogoProps) {
  return (
    <div
      className={cn(
        "transition-all duration-700",
        mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4",
        className
      )}
    >
      <h1
        className={cn(
          textSize,
          "font-bold tracking-tight text-zinc-900"
        )}
        style={{
          fontVariationSettings: "'wght' 700",
          letterSpacing: "-0.02em",
        }}
      >
        Racket
        <span
          className="bg-linear-to-r from-violet-600 to-emerald-600 bg-clip-text text-transparent"
          style={{ letterSpacing: "-0.02em" }}
        >
          Tier
        </span>
      </h1>
      {tagline ? (
        <p className="text-zinc-500 text-xs font-light uppercase leading-tight tracking-[0.20rem] mt-1">
          {tagline}
        </p>
      ) : null}
    </div>
  );
}
