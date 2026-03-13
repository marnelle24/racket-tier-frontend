import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { AUTH_COOKIE } from "./lib/auth";
import { isAllowedRedirectPath } from "./lib/redirect-validation";

export function proxy(request: NextRequest) {
  const token = request.cookies.get(AUTH_COOKIE)?.value;
  const { pathname } = request.nextUrl;

  // Login page: if already authenticated, redirect to dashboard
  if (pathname === "/login") {
    if (token) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.next();
  }

  // Protected routes: require auth
  const isProtected =
    pathname === "/onboarding" ||
    pathname === "/dashboard" ||
    pathname === "/statistics" ||
    pathname.startsWith("/facility");

  if (isProtected && !token) {
    const loginUrl = new URL("/login", request.url);
    const safeReturn = isAllowedRedirectPath(pathname) ? pathname : "/dashboard";
    loginUrl.searchParams.set("returnUrl", safeReturn);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/login",
    "/onboarding",
    "/dashboard",
    "/dashboard/:path*",
    "/statistics",
    "/facility/:path*",
  ],
};
