"use client";

import { useParams, useRouter, notFound } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Gamepad2, Trophy, Users, Building2 } from "lucide-react";
import { UserAvatar } from "@/components/UserAvatar";
import { InlineError } from "@/components/InlineError";
import { RacketTierLogo } from "@/components/RacketTierLogo";
import { Button } from "@/components/ui/button";
import { getAuthToken } from "@/lib/auth";
import { cn } from "@/lib/utils";

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

type FacilityStatsRow = {
  rank: number;
  user_id: number;
  user?: {
    id: number;
    name: string;
    nickname?: string | null;
    tier?: number | null;
    avatar_seed?: string | null;
  } | null;
  games_played: number;
  wins: number;
  losses: number;
  points: number;
};

function getRankBadge(rank: number): string | null {
  if (rank === 1) return "🥇";
  if (rank === 2) return "🥈";
  if (rank === 3) return "🥉";
  return null;
}

function getTierLevel(tier: number): string {
  if (tier <= 0) return "Beginner";
  if (tier <= 1) return "Novice";
  if (tier <= 2) return "Intermediate";
  if (tier <= 3) return "Skilled";
  if (tier <= 4) return "Advanced";
  if (tier <= 6) return "Expert";
  return "Master";
}

export default function FacilityPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [mounted, setMounted] = useState(false);
  const [name, setName] = useState<string | null>(null);
  const [lastSeenAt, setLastSeenAt] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [stats, setStats] = useState<FacilityStatsRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isNotFound, setIsNotFound] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined" && id) {
      const stored = sessionStorage.getItem(`facility_${id}_name`);
      if (stored) setName(stored);
    }
  }, [id]);

  useEffect(() => {
    if (!id) return;

    const authToken = getAuthToken();

    // First check if facility exists (works with or without auth) — 404 for non-existing IDs e.g. /facility/5555
    fetch(`${API_URL}/api/facilities/check/${id}`)
      .then((checkRes) => {
        if (checkRes.status === 404) {
          setIsNotFound(true);
          return null;
        }
        if (!checkRes.ok) return {};
        return checkRes.json();
      })
      .then((checkData) => {
        if (checkData === null) return; // notFound will be shown via state
        if (!authToken) {
          router.push(`/login?returnUrl=${encodeURIComponent(`/facility/${id}`)}`);
          return;
        }

        const headers = { Authorization: `Bearer ${authToken}` };
        return Promise.all([
          fetch(`${API_URL}/api/me`, { headers }),
          fetch(`${API_URL}/api/stats/facility/${id}`, { headers }),
          fetch(`${API_URL}/api/facilities/mine`, { headers }),
          fetch(`${API_URL}/api/facilities/${id}/presence`, { headers }),
        ]).then(async ([meRes, statsRes, facilitiesRes, presenceRes]) => {
          const meData = meRes.ok ? await meRes.json() : null;
          const me = meData?.data?.user ?? meData?.user ?? meData;
          setCurrentUserId(me?.id ?? null);

          if (statsRes.ok) {
            const statsRaw = await statsRes.json();
            const statsList = Array.isArray(statsRaw?.data)
              ? statsRaw.data
              : Array.isArray(statsRaw)
                ? statsRaw
                : [];
            setStats(statsList);
          } else if (statsRes.status === 404) {
            setIsNotFound(true);
            return;
          } else if (statsRes.status === 401) {
            setStats([]);
          } else {
            throw new Error("Failed to load stats");
          }

          // facility_presences: last_seen_at (and optional name) from presence endpoint
          if (presenceRes.ok) {
            const presenceRaw = await presenceRes.json();
            const presence = presenceRaw?.data ?? presenceRaw;
            if (presence?.last_seen_at) {
              setLastSeenAt(presence.last_seen_at);
            } else {
              setLastSeenAt(null);
            }
            if (presence?.facility_name) {
              setName(presence.facility_name);
              if (typeof window !== "undefined") {
                sessionStorage.setItem(`facility_${id}_name`, presence.facility_name);
              }
            }
          } else {
            setLastSeenAt(null);
          }

          // Fallback: facility name from mine list if not set by presence
          if (facilitiesRes.ok) {
            const facilitiesRaw = await facilitiesRes.json();
            const list = Array.isArray(facilitiesRaw?.data) ? facilitiesRaw.data : [];
            const facility = list.find((f: { facility_id: number; name?: string }) => String(f.facility_id) === id);
            if (facility?.name && !presenceRes.ok) {
              setName(facility.name);
              if (typeof window !== "undefined") {
                sessionStorage.setItem(`facility_${id}_name`, facility.name);
              }
            }
          }
        });
      })
      .catch((err) => {
        if (err?.digest === "NEXT_NOT_FOUND") throw err;
        setError("Could not load leaderboard.");
      })
      .finally(() => setIsLoading(false));
  }, [id, router]);

  // Call notFound() during render so Next.js catches it (async callbacks can't trigger it)
  if (isNotFound) notFound();

  return (
    <div className="relative min-h-screen -mx-4 overflow-hidden">
      {/* Same gradient background as dashboard */}
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
      {/* Floating orbs */}
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

      {/* Content: same padding/alignment as dashboard */}
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
            <Link
              href="/facility/join"
              className="text-xs font-normal uppercase leading-tight tracking-wider text-zinc-500 hover:text-zinc-800 transition-colors flex items-center gap-1"
            >
              ← Facilities
            </Link>
          </nav>

          <header
            className={cn(
              "space-y-1 transition-all duration-700 delay-75",
              mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            )}
          >
            <span className="text-md font-normal text-zinc-400">Facility</span>
            <h1 className="text-2xl font-bold text-zinc-900 leading-6">
              {name ?? "Facility"}
            </h1>
            {name ? (
              <p className="text-sm text-zinc-400 mt-2 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full inline-block animate-pulse" />
                {lastSeenAt
                  ? (() => {
                      const d = new Date(lastSeenAt);
                      const now = new Date();
                      const isToday = d.toDateString() === now.toDateString();
                      const label = isToday
                        ? `Last seen today at ${d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}`
                        : `Last seen ${d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}`;
                      return label;
                    })()
                  : "Last seen —"}
              </p>
            ) : (
              id && (
                <p className="text-sm text-zinc-400 mt-2">ID: {id}</p>
              )
            )}
          </header>

          {/* Primary CTA — Enter Game Room (same style as dashboard Play Now card) */}
          <div
            className={cn(
              "transition-all duration-700 delay-100",
              mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            )}
          >
            <Link href={`/facility/${id}/room`} className="group block w-full min-w-0">
              <div className="flex items-center gap-3 rounded-2xl bg-linear-to-br from-emerald-500 to-emerald-600 p-4 shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/35 transition-all duration-200 hover:scale-[1.01] active:scale-[0.99]">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/20 text-white">
                  <Gamepad2 className="h-6 w-6" aria-hidden />
                </div>
                <div className="flex-1 min-w-0 overflow-hidden text-left">
                  <p className="font-semibold text-white text-lg leading-tight">Game Room</p>
                  <p className="text-sm text-white/90 truncate mt-0.5">
                    Create games, invite players & rank..
                  </p>
                </div>
                <ArrowRight className="h-5 w-5 shrink-0 text-white/90 group-hover:translate-x-0.5 transition-transform" aria-hidden />
              </div>
            </Link>
          </div>

          {/* Leaderboard Section */}
          <section
            className={cn(
              "space-y-3 transition-all duration-700 delay-150",
              mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            )}
          >
            <h2 className="text-md font-semibold text-zinc-700 flex items-center gap-2">
              <Trophy className="h-4 w-4 text-amber-500" aria-hidden />
              Leaderboard
            </h2>

            {isLoading ? (
              <div className="rounded-2xl border border-zinc-200/80 bg-white/80 backdrop-blur-sm overflow-hidden shadow-sm">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 px-4 py-3 border-b border-zinc-100 last:border-0"
                  >
                    <div className="h-10 w-10 rounded-full bg-zinc-200/80 animate-pulse" />
                    <div className="flex-1 space-y-1">
                      <div className="h-4 w-24 bg-zinc-200/80 rounded animate-pulse" />
                      <div className="h-3 w-16 bg-zinc-100 rounded animate-pulse" />
                    </div>
                  </div>
                ))}
              </div>
            ) : error ? (
              <InlineError message={error} />
            ) : stats.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-zinc-200/80 bg-white/80 backdrop-blur-sm min-h-[140px] flex flex-col items-center justify-center p-6 text-center shadow-sm">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 text-zinc-400 mb-3">
                  <Users className="h-6 w-6" aria-hidden />
                </div>
                <p className="text-sm font-medium text-zinc-600">No stats yet</p>
                <p className="text-sm text-zinc-500 mt-0.5">
                  Play some games to appear on the leaderboard
                </p>
              </div>
            ) : (
              <ul className="rounded-2xl border border-zinc-200/80 bg-white/80 backdrop-blur-sm overflow-hidden shadow-sm">
                {stats.map((row, index) => {
                  const displayName = row.user?.nickname?.trim() || row.user?.name || `Player ${row.user_id}`;
                  const isYou = row.user_id === currentUserId;
                  const rankBadge = getRankBadge(row.rank);
                  const tierValue =
                    typeof row.user?.tier === "number" ? row.user.tier : Number(row.user?.tier);
                  const tierLevel = Number.isFinite(tierValue) ? getTierLevel(tierValue) : null;

                  return (
                    <li
                      key={row.user_id}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 transition-colors",
                        isYou ? "bg-amber-50/50" : "hover:bg-zinc-50/80",
                        index > 0 && "border-t border-zinc-100"
                      )}
                    >
                      <div className="flex items-center gap-2 w-8 shrink-0">
                        {rankBadge ? (
                          <span className="text-lg" aria-hidden>{rankBadge}</span>
                        ) : (
                          <span className="text-sm font-semibold text-zinc-400 tabular-nums w-6 text-right">
                            #{row.rank}
                          </span>
                        )}
                      </div>
                      <UserAvatar
                        name={displayName}
                        avatarSeed={row.user?.avatar_seed}
                        size={40}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-zinc-900 truncate">
                          {displayName}
                          {isYou && (
                            <span className="ml-2 text-xs font-normal text-amber-800 bg-amber-100 border border-amber-200 px-2 py-0.5 rounded-full">
                              You
                            </span>
                          )}
                        </p>
                        <p className="text-xs flex flex-col gap-1">
                          <span className="inline-flex items-center gap-1 text-amber-500">
                            <Trophy className="h-3 w-3 text-amber-500" aria-hidden />
                            <span className="text-amber-500 text-xs tracking-widest font-semibold">TIER:</span>
                            {Number.isFinite(tierValue) ? tierValue : "-"}
                            {tierLevel ? <span className="text-amber-600">({tierLevel})</span> : null}
                          </span>
                          <span className="text-zinc-500 tabular-nums">
                            W-{row.wins} · L-{row.losses}
                          </span>
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="font-semibold text-zinc-900 tabular-nums">
                          {row.points}
                        </p>
                        <p className="text-xs text-zinc-500">pts</p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          {/* Secondary actions */}
          <div
            className={cn(
              "transition-all duration-700 delay-200",
              mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            )}
          >
            <Button
              variant="outline"
              className="w-full h-11 gap-2 rounded-xl border-zinc-200/80 bg-white/80 hover:bg-zinc-50/80 hover:border-zinc-300/80 text-zinc-700"
              asChild
            >
              <Link href="/facility/join">
                <Building2 className="h-4 w-4" aria-hidden />
                Join another facility
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
