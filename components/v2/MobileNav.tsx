"use client";

import { Building2, HomeIcon, TrophyIcon, UserIcon } from "lucide-react";
import { usePathname } from "next/navigation";
import { MobileNavItem } from "@/components/v2/MobileNavItem";

const ITEMS = [
  { href: "/v2/dashboard", label: "Home", icon: HomeIcon },
  { href: "/v2/ranking", label: "Rankings", icon: TrophyIcon },
  { href: "/v2/facilities", label: "Facilities", icon: Building2 },
  { href: "/account", label: "Profile", icon: UserIcon },
] as const;

function navItemActive(pathname: string, href: string): boolean {
  if (href === "/v2/dashboard") {
    return pathname === "/v2/dashboard";
  }
  if (href === "/v2/ranking") {
    return pathname === "/v2/ranking";
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
      <div className="flex items-center justify-around bg-[#131316]/70 shadow-[0_-4px_40px_-5px_rgba(0,0,0,0.3)] backdrop-blur-xl">
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
