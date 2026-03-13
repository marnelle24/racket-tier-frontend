"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getAuthToken } from "@/lib/auth";
import { isAllowedRedirectPath } from "@/lib/redirect-validation";

function isProtectedPath(pathname: string): boolean {
  if (pathname === "/onboarding" || pathname === "/statistics" || pathname === "/account") {
    return true;
  }
  if (pathname === "/dashboard" || pathname.startsWith("/dashboard/")) {
    return true;
  }
  if (pathname === "/facilities" || pathname.startsWith("/facilities/")) {
    return true;
  }
  if (pathname.startsWith("/facility")) {
    return true;
  }
  return false;
}

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!isProtectedPath(pathname)) return;

    const token = getAuthToken();
    if (!token) {
      const safeReturn = isAllowedRedirectPath(pathname) ? pathname : "/dashboard";
      router.replace(`/login?returnUrl=${encodeURIComponent(safeReturn)}`);
    }
  }, [pathname, router]);

  return <>{children}</>;
}
