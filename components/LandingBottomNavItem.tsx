import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export type LandingBottomNavItemProps = {
  href: string;
  label: string;
  icon: LucideIcon;
  active?: boolean;
};

export function LandingBottomNavItem({
  href,
  label,
  icon: Icon,
  active,
}: LandingBottomNavItemProps) {
  return (
    <Link
      href={href}
      className={cn(
        "font-label flex cursor-pointer flex-col items-center justify-center px-4 py-1.5",
        active
          ? "scale-90 rounded-2xl bg-linear-to-br from-[#c2c1ff] to-[#8a89d9] text-[#131316] duration-200 active:transition-transform"
          : "text-[#353438] transition-colors hover:text-[#c2c1ff]",
      )}
      aria-current={active ? "page" : undefined}
    >
      <Icon className="size-6 shrink-0" />
      <span className="mt-0.5 text-[10px] font-medium uppercase tracking-wider">
        {label}
      </span>
    </Link>
  );
}
