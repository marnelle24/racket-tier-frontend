"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  LayoutDashboard,
  LogIn,
  UserPlus,
  Building2,
  BarChart2,
  User,
} from "lucide-react";
import { getAuthToken } from "@/lib/auth";
import { cn } from "@/lib/utils";

const guestNavItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/login", label: "Sign in", icon: LogIn },
  { href: "/register", label: "Register", icon: UserPlus },
] as const;

const authNavItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/facility/join", label: "Facilities", icon: Building2 },
  { href: "/statistics", label: "My Statistics", icon: BarChart2 },
  { href: "/account", label: "Account", icon: User },
] as const;

function getIsLoggedIn(): boolean {
  return !!getAuthToken();
}

export function BottomNav() {
  const pathname = usePathname();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    setIsLoggedIn(getIsLoggedIn());
  }, [pathname]);

  const navItems = isLoggedIn ? authNavItems : guestNavItems;

  if (
    pathname === "/" ||
    pathname === "/login" ||
    pathname === "/register" ||
    pathname === "/onboarding"
  ) {
    return null;
  }

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/80 pb-[env(safe-area-inset-bottom)]"
      aria-label="Main navigation"
    >
      <div className="mx-auto flex max-w-md items-center justify-around">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive =
            href === "/"
              ? pathname === "/"
              : href === "/facility/join"
                ? pathname.startsWith("/facility")
                : href === "/account"
                  ? pathname.startsWith("/account")
                  : pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 rounded-none px-4 py-2 min-w-[64px] transition-colors relative",
                "text-muted-foreground hover:text-foreground hover:bg-muted/80 active:bg-muted",
                isActive &&
                  "font-medium bg-primary/10 rounded-none text-primary hover:bg-primary/15 hover:text-primary after:absolute after:bottom-0 after:left-1/2 after:-translate-x-1/2 after:block after:h-0.5 after:w-8 after:rounded-full after:bg-primary after:content-['']"
              )}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon
                className={cn("size-5 shrink-0", isActive && "text-primary")}
                aria-hidden
              />
              <span className="text-[10px] leading-tight">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
