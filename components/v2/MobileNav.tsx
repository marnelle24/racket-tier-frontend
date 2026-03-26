"use client";

import { HomeIcon, PlayIcon, TrophyIcon, UserIcon } from "lucide-react";
import { usePathname } from "next/navigation";
import { MobileNavItem } from "@/components/v2/MobileNavItem";

const ITEMS = [
  { href: "/v2/dashboard", label: "Home", icon: HomeIcon },
  { href: "/statistics", label: "Rankings", icon: TrophyIcon },
  { href: "/facilities", label: "Play", icon: PlayIcon },
  { href: "/account", label: "Profile", icon: UserIcon },
] as const;

function navItemActive(pathname: string, href: string): boolean {
  if (href === "/v2/dashboard") {
    return pathname === "/v2/dashboard";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 z-50 w-full md:hidden"
      aria-label="Primary"
    >
      <div className="flex items-center justify-around bg-[#131316]/70 px-4 pb-6 pt-3 shadow-[0_-4px_40px_-5px_rgba(0,0,0,0.3)] backdrop-blur-xl">
        {ITEMS.map((item) => (
          <MobileNavItem
            key={item.href}
            href={item.href}
            label={item.label}
            icon={item.icon}
            active={navItemActive(pathname, item.href)}
          />
        ))}
      </div>
    </nav>
  );
}
