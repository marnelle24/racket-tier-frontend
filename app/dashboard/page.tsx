"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { InlineError } from "@/components/InlineError";
import { clearStoredAuthToken, getAuthToken } from "@/lib/auth";
import { RacketTierLogo } from "@/components/RacketTierLogo";
import { RecentFacilitiesList, type RecentFacility } from "@/components/RecentFacilitiesList";
import {
  Building2,
  QrCode,
  Gamepad2,
  ChevronRight,
  Trophy,
  TrendingDown,
  BarChart2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { UserAvatar } from "@/components/UserAvatar";

const sharedBackgroundStyle = {
  gradient: `
    radial-gradient(ellipse 80% 50% at 50% -20%, rgba(120, 119, 198, 0.3), transparent),
    radial-gradient(ellipse 60% 40% at 100% 100%, rgba(74, 222, 128, 0.15), transparent),
    radial-gradient(ellipse 50% 30% at 0% 80%, rgba(251, 191, 36, 0.12), transparent),
    linear-gradient(180deg, #fafafa 0%, #f4f4f5 50%, #fafafa 100%)
  `,
  grid: `
    linear-gradient(rgba(0,0,0,1) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0,0,0,1) 1px, transparent 1px)
  `,
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

type Me = {
  id: number;
  user_id?: number;
  name: string;
  email: string;
  avatar_seed?: string | null;
  tier?: number;
  email_verified_at?: string | null;
  created_at?: string;
  updated_at?: string;
};

const quickActions = [
  {
    href: "/facility/join?mode=scan",
    label: "Scan or enter QR code",
    description: "Check in to the venue & start playing",
    icon: QrCode,
    primary: false,
  },
  {
    href: "/facilities",
    label: "Find facilities",
    description: "Search for your nearby facilities",
    icon: Building2,
    primary: false,
  },
  {
    href: "/statistics",
    label: "My statistics",
    description: "View rankings & history",
    icon: BarChart2,
    primary: false,
  },
];

export default function DashboardPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [me, setMe] = useState<Me | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [firstFacility, setFirstFacility] = useState<RecentFacility | null>(null);
  const [totalGamesPlayed, setTotalGamesPlayed] = useState<number | null>(null);
  const [totalFacilities, setTotalFacilities] = useState<number | null>(null);
  const [totalWins, setTotalWins] = useState<number | null>(null);
  const [totalLosses, setTotalLosses] = useState<number | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      router.push("/login?returnUrl=/dashboard");
      return;
    }

    fetch(`${API_URL}/api/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Could not load user.");
        return res.json();
      })
      .then((data) => {
        const user = data?.data?.user ?? data?.user ?? data;
        setMe(user);
      })
      .catch(() => setError("Could not load your details."))
      .finally(() => setIsLoading(false));
  }, []);

  async function handleLogout() {
    if (isLoggingOut) return;
    const token = getAuthToken();
    if (!token) {
      clearStoredAuthToken();
      router.push("/login");
      return;
    }
    setIsLoggingOut(true);
    try {
      await fetch(`${API_URL}/api/logout`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
    } finally {
      clearStoredAuthToken();
      router.push("/login");
    }
  }

  return (
    <div className="relative min-h-screen -mx-4 overflow-hidden">
      {/* Same gradient background as login/register */}
      <div
        className="absolute inset-0 -z-10"
        style={{ background: sharedBackgroundStyle.gradient }}
      />
      <div
        className="absolute inset-0 -z-10 opacity-[0.03]"
        style={{
          backgroundImage: sharedBackgroundStyle.grid,
          backgroundSize: "48px 48px",
        }}
      />
      {/* Floating orbs - CSS-only transition to avoid React removeChild issues with animate-in */}
      <div
        className={cn(
          "absolute top-1/4 left-1/4 w-64 h-64 rounded-full blur-3xl transition-opacity duration-700 animate-float",
          mounted ? "opacity-30" : "opacity-0"
        )}
        style={{
          background:
            "radial-gradient(circle, rgba(120, 119, 198, 0.4) 0%, transparent 70%)",
        }}
      />
      <div
        className={cn(
          "absolute bottom-1/3 right-1/4 w-48 h-48 rounded-full blur-3xl transition-opacity duration-700 delay-150 animate-float",
          mounted ? "opacity-20" : "opacity-0"
        )}
        style={{
          background:
            "radial-gradient(circle, rgba(74, 222, 128, 0.4) 0%, transparent 70%)",
          animation: "float 10s ease-in-out infinite reverse",
        }}
      />

      {/* Content: same padding/alignment as login/register (reference) */}
      <div className="relative px-6 pt-5 pb-24 min-w-0 overflow-x-hidden">
        <div className="w-full max-w-md mx-auto space-y-6 min-w-0">
          <nav
            className={cn(
              "flex items-center justify-between transition-all duration-700",
              mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            )}
          >
            <RacketTierLogo
              textSize="text-3xl"
              tagline={null}
              mounted={mounted}
              className="min-h-[44px] flex items-center"
            />
            {me && (
              <button
                type="button"
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="text-xs font-normal uppercase leading-tight tracking-wider text-zinc-500 hover:text-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
              >
                <svg className="h-3.5 w-3.5" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" version="1.1" fill="#000000"><g id="SVGRepo_bgCarrier" strokeWidth="0"></g><g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g><g id="SVGRepo_iconCarrier"><g fill="none" stroke="#222222" strokeWidth="12px" strokeLinecap="round" strokeLinejoin="round"><path d="m 50,10 0,35"></path><path d="M 26,20 C -3,48 16,90 51,90 79,90 89,67 89,52 89,37 81,26 74,20"></path></g></g></svg>
                {isLoggingOut ? "Signing out…" : "Logout"}
              </button>
            )}
          </nav>

          <header
            className={cn(
              "space-y-1 transition-all duration-700 delay-75",
              mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            )}
          >
            {/* <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">
              Dashboard
            </p> */}
            <span className="text-md font-normal text-zinc-400">Welcome back! </span>
            <div className="flex items-center gap-2">
              <UserAvatar
                name={me?.name || `Player ${me?.user_id}`}
                avatarSeed={me?.avatar_seed}
                size={32}
              />
              <h1
                className="text-2xl font-bold text-zinc-900 leading-6"
              >
                {me ? `${me.name}` : "Dashboard"}
              </h1>
              {me && (
                <div className="flex items-center gap-1.5 bg-emerald-100/60 border border-emerald-300/60 backdrop-blur-sm rounded-full px-2.5 py-1">
                  <Trophy className="h-3 w-3 text-emerald-600" aria-hidden />
                  <span className="text-xs font-medium tracking-widest uppercase text-emerald-900">
                    Tier {me.tier ?? 0}
                  </span>
                </div>
              )}
            </div>
            <p className="text-sm text-zinc-400 mt-2">
              {me
                ? "Join or create a game, invite friends & rank up your tiers."
                : "You are logged in."}
            </p>
          </header>

          {isLoading && (
            <div
              className={cn(
                "rounded-2xl border border-zinc-200/80 bg-white/80 backdrop-blur-sm p-6 shadow-sm transition-all duration-700 delay-100",
                mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              )}
            >
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-zinc-200/80 animate-pulse" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 w-32 bg-zinc-200/80 rounded animate-pulse" />
                  <div className="h-3 w-24 bg-zinc-100 rounded animate-pulse" />
                </div>
              </div>
            </div>
          )}

          {error && (
            <div
              className={cn(
                "transition-all duration-700 delay-100",
                mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              )}
            >
              <InlineError message={error} />
            </div>
          )}

          {!isLoading && !error && me ? (
            <div key="dashboard-content">
              {/* User stats - same card style as login form */}
              <section
                className={cn(
                  "space-y-3 transition-all duration-700 delay-100",
                  mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                )}
              >
                <h2 className="text-sm font-semibold text-zinc-700">
                  Your stats
                </h2>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-slate-200 bg-gray-50 backdrop-blur-sm p-4 shadow-sm transition-all duration-200 hover:shadow-md hover:scale-[1.01] active:scale-[0.99]">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-amber-600">
                        <Gamepad2 className="h-8 w-8" aria-hidden />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="mt-0.5 text-2xl font-bold tabular-nums text-zinc-900">
                          {totalGamesPlayed === null ? (
                            <span className="inline-block h-7 w-8 animate-pulse rounded bg-zinc-200/80" />
                          ) : (
                            totalGamesPlayed.toLocaleString()
                          )}
                        </p>
                        <p className="text-[10px] font-medium text-zinc-500 uppercase leading-tight tracking-wide">
                           Games Played
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-gray-50 backdrop-blur-sm p-4 shadow-sm transition-all duration-200 hover:shadow-md hover:scale-[1.01] active:scale-[0.99]">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-emerald-600">
                        <Building2 className="h-8 w-8" aria-hidden />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="mt-0.5 text-2xl font-bold tabular-nums text-zinc-900">
                          {totalFacilities === null ? (
                            <span className="inline-block h-7 w-8 animate-pulse rounded bg-zinc-200/80" />
                          ) : (
                            totalFacilities.toLocaleString()
                          )}
                        </p>
                        <p className="text-[10px] font-medium text-zinc-500 uppercase leading-tight tracking-wide">
                          Courts Visited
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-100/80 backdrop-blur-sm p-4 shadow-sm transition-all duration-200 hover:shadow-md hover:scale-[1.01] active:scale-[0.99]">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-amber-600">
                        <Trophy className="h-8 w-8" aria-hidden />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="mt-0.5 text-2xl font-bold tabular-nums text-zinc-900">
                          {totalWins === null ? (
                            <span className="inline-block h-7 w-8 animate-pulse rounded bg-zinc-200/80" />
                          ) : (
                            totalWins.toLocaleString()
                          )}
                        </p>
                        <p className="text-[10px] font-medium text-zinc-500 uppercase leading-tight tracking-wide">
                          Total Wins
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-2xl border border-red-200/50 bg-red-100/80 backdrop-blur-sm p-4 shadow-sm transition-all duration-200 hover:shadow-md hover:scale-[1.01] active:scale-[0.99]">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-red-600">
                        <TrendingDown className="h-8 w-8" aria-hidden />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="mt-0.5 text-2xl font-bold tabular-nums text-zinc-900">
                          {totalLosses === null ? (
                            <span className="inline-block h-7 w-8 animate-pulse rounded bg-zinc-200/80" />
                          ) : (
                            totalLosses.toLocaleString()
                          )}
                        </p>
                        <p className="text-[10px] font-medium text-zinc-500 uppercase leading-tight tracking-wide">
                          Total Losses
                        </p>
                      </div>
                    </div>
                  </div>
                  
                </div>
              </section>

              {/* Quick Actions */}
              <section
                className={cn(
                  "space-y-3 mt-8 transition-all duration-700 delay-150 min-w-0 overflow-hidden",
                  mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                )}
              >
                <h2 className="text-sm font-semibold text-zinc-700">
                  Quick Actions
                </h2>
                <div className="grid gap-3 min-w-0">
                  {firstFacility && (
                    <Link
                      href={`/facility/${firstFacility.facility_id}/room`}
                      className="group w-full min-w-0 flex items-center gap-3 rounded-2xl bg-linear-to-br from-emerald-500 to-emerald-600 p-4 shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/35 transition-all duration-200 hover:scale-[1.01] active:scale-[0.99]"
                    >
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/20 text-white">
                        <Gamepad2 className="h-6 w-6" aria-hidden />
                      </div>
                      <div className="flex-1 min-w-0 overflow-hidden text-left">
                        <p className="font-semibold text-white truncate leading-tight">
                          <span className="text-sm font-normal leading-normal text-white/70">Play Now! · Your last visited court</span>
                          <br />
                          <span className="text-lg font-semibold leading-tight tracking-wide text-white">
                            {firstFacility.name}
                          </span>
                        </p>
                        <p className="text-sm text-white/90 truncate mt-1">
                          Organize games, invite & rank up..
                        </p>
                      </div>
                      <ChevronRight className="h-5 w-5 shrink-0 text-white/90 group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                  )}
                  {quickActions.map((action) => {
                    const Icon = action.icon;
                    return (
                      <Link
                        key={action.href}
                        href={action.href}
                        className={cn(
                          "w-full min-w-0 flex items-center gap-3 rounded-2xl border border-zinc-200/80 bg-white/80 backdrop-blur-sm p-4 transition-all duration-200 hover:scale-[1.01] active:scale-[0.99]",
                          action.primary
                            ? "hover:bg-emerald-50/80 hover:border-emerald-200/80"
                            : "hover:bg-zinc-50/80 hover:border-zinc-300/80"
                        )}
                      >
                        <div
                          className={cn(
                            "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl",
                            action.primary
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-zinc-100 text-zinc-600"
                          )}
                        >
                          <Icon className="h-6 w-6" aria-hidden />
                        </div>
                        <div className="flex-1 min-w-0 overflow-hidden">
                          <p
                            className={cn(
                              "font-semibold truncate",
                              action.primary ? "text-zinc-900" : "text-zinc-800"
                            )}
                          >
                            {action.label}
                          </p>
                          <p className="text-sm text-zinc-500 truncate">
                            {action.description}
                          </p>
                        </div>
                        <ChevronRight className="h-5 w-5 shrink-0 text-zinc-400" />
                      </Link>
                    );
                  })}
                </div>
              </section>

              {/* Recently checked in */}
              <div
                className={cn(
                  "transition-all duration-700 delay-200 mt-8",
                  mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                )}
              >
                <RecentFacilitiesList
                  title="Recently Checked-In"
                  onLoaded={(facilities) => {
                    if (facilities.length > 0) setFirstFacility(facilities[0]);
                    setTotalGamesPlayed(
                      facilities.reduce(
                        (sum, f) => sum + (f.games_played ?? 0),
                        0
                      )
                    );
                    setTotalFacilities(facilities.length);
                    setTotalWins(
                      facilities.reduce((sum, f) => sum + (f.wins ?? 0), 0)
                    );
                    setTotalLosses(
                      facilities.reduce((sum, f) => sum + (f.losses ?? 0), 0)
                    );
                  }}
                />
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
