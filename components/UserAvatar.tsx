"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";
import { diceBearUrl, getInitial, getAvatarBackgroundClass } from "@/lib/avatar";

type UserAvatarProps = {
  name: string;
  avatarSeed?: string | null;
  size?: number;
  className?: string;
};

export function UserAvatar({ name, avatarSeed, size = 40, className }: UserAvatarProps) {
  const sizeMap: Record<number, string> = {
    24: "size-6",
    28: "size-7",
    32: "size-8",
    40: "size-10",
    64: "size-16",
    72: "size-[72px]",
    96: "size-24",
  };
  const sizeClass = sizeMap[size];
  const sizeStyle = sizeClass ? undefined : { width: size, height: size };
  const textSizeClass =
    size <= 24 ? "text-[10px]" : size <= 40 ? "text-sm" : size <= 64 ? "text-lg" : "text-xl";

  if (avatarSeed) {
    const bgClass = getAvatarBackgroundClass(avatarSeed);
    return (
      <Image
        src={diceBearUrl(avatarSeed, size)}
        alt=""
        width={size}
        height={size}
        unoptimized
        style={sizeStyle}
        className={cn(
          "rounded-full object-cover shrink-0 border-2 border-zinc-400/80 shadow",
          sizeClass,
          bgClass,
          className
        )}
      />
    );
  }

  return (
    <div
      style={sizeStyle}
      className={cn(
        "rounded-full aspect-square flex items-center justify-center shrink-0 font-semibold bg-zinc-100 text-zinc-600 border-2 border-zinc-200",
        sizeClass,
        textSizeClass,
        className
      )}
      aria-hidden
    >
      {getInitial(name || "?")}
    </div>
  );
}
