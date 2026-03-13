"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  BarChart2,
  Trophy,
  Gamepad2,
  Building2,
  TrendingDown,
  TrendingUp,
  Percent,
  Users,
  Flame,
  ChevronDown,
  Swords,
  X,
  MapPin,
} from "lucide-react";
import { InlineError } from "@/components/InlineError";
import { RacketTierLogo } from "@/components/RacketTierLogo";
import { getAuthToken } from "@/lib/auth";
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

const SPORT_IMAGES: Record<string, string> = {
  badminton: "/images/badminton.png",
  pickleball: "/images/pickleball.png",
  tennis: "/images/tennis.png",
  pingpong: "/images/ping-pong.png",
};

const SPORT_LABELS: Record<string, string> = {
  badminton: "Badminton",
  pickleball: "Pickleball",
  tennis: "Tennis",
  pingpong: "Ping Pong",
};

type StatsData = {
  global_rating: number;
  tier: number;
  name: string;
  member_since: string | null;
  totals: {
    games_played: number;
    wins: number;
    losses: number;
    win_rate: number;
    facilities_visited: number;
  };
  per_sport: {
    sport: string;
    games_played: number;
    wins: number;
    losses: number;
    draws: number;
    win_rate: number;
  }[];
  per_facility: {
    facility_id: number;
    facility_name: string;
    games_played: number;
    wins: number;
    losses: number;
    points: number;
    win_rate: number;
  }[];
  streaks: {
    current_type: string | null;
    current_count: number;
  };
  unique_opponents: number;
};

type HistoryGame = {
  game_id: number;
  sport: string;
  match_type: string | null;
  facility_id: number;
  facility_name: string;
  result: string | null;
  score: string | number[] | null;
  duration_minutes: number | null;
  opponents: { user_id: number; name: string; result: string | null; avatar_seed?: string | null }[];
  end_time: string | null;
};

type HistoryPagination = {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
};

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  if (isToday) {
    return `Today, ${d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}`;
  }
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatScore(score: string | number[] | null): string | null {
  if (!score) return null;
  if (Array.isArray(score)) return score.join(" - ");
  try {
    const parsed = JSON.parse(score);
    if (Array.isArray(parsed)) return parsed.join(" - ");
  } catch {
    // not JSON
  }
  return String(score);
}

function getTierName(tier: number): string {
  if (tier <= 0) return "Beginner";
  if (tier <= 1) return "Novice";
  if (tier <= 2) return "Intermediate";
  if (tier <= 3) return "Skilled";
  if (tier <= 4) return "Advanced";
  if (tier <= 6) return "Expert";
  return "Master";
}

function resultColor(result: string | null) {
  if (result === "win") return "text-emerald-700 bg-emerald-100 border-emerald-200";
  if (result === "loss") return "text-red-700 bg-red-100 border-red-200";
  return "text-zinc-600 bg-zinc-100 border-zinc-200";
}

function resultLabel(result: string | null) {
  if (result === "win") return "Win";
  if (result === "loss") return "Loss";
  if (result === "draw") return "Draw";
  return "—";
}

export default function StatisticsPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [history, setHistory] = useState<HistoryGame[]>([]);
  const [historyPagination, setHistoryPagination] = useState<HistoryPagination | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [selectedHistoryGame, setSelectedHistoryGame] = useState<HistoryGame | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      router.push("/login?returnUrl=/statistics");
      return;
    }

    const headers = { Authorization: `Bearer ${token}` };

    Promise.all([
      fetch(`${API_URL}/api/stats/me`, { headers }),
      fetch(`${API_URL}/api/stats/me/history?per_page=10`, { headers }),
    ])
      .then(async ([statsRes, historyRes]) => {
        if (!statsRes.ok) throw new Error("Could not load stats.");
        const statsJson = await statsRes.json();
        setStats(statsJson.data);

        if (historyRes.ok) {
          const historyJson = await historyRes.json();
          setHistory(historyJson.data?.games ?? []);
          setHistoryPagination(historyJson.data?.pagination ?? null);
        }
      })
      .catch(() => setError("Could not load your statistics."))
      .finally(() => setIsLoading(false));
  }, [router]);

  const loadMoreHistory = useCallback(() => {
    if (!historyPagination || historyPagination.current_page >= historyPagination.last_page) return;
    const token = getAuthToken();
    if (!token) return;

    setIsLoadingMore(true);
    const nextPage = historyPagination.current_page + 1;

    fetch(`${API_URL}/api/stats/me/history?per_page=10&page=${nextPage}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (res) => {
        if (!res.ok) return;
        const json = await res.json();
        setHistory((prev) => [...prev, ...(json.data?.games ?? [])]);
        setHistoryPagination(json.data?.pagination ?? null);
      })
      .finally(() => setIsLoadingMore(false));
  }, [historyPagination]);

  const hasMoreHistory =
    historyPagination && historyPagination.current_page < historyPagination.last_page;

  return (
    <div className="relative min-h-screen -mx-4 overflow-hidden">
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

      <div className="relative px-6 pt-5 pb-24 min-w-0 overflow-x-hidden">
        <div className="w-full max-w-md mx-auto space-y-6 min-w-0">
          {/* Nav */}
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
              href="/dashboard"
              className="text-xs font-normal uppercase leading-tight tracking-wider text-zinc-500 hover:text-zinc-800 transition-colors flex items-center gap-1"
            >
              ← Dashboard
            </Link>
          </nav>

          {/* Header */}
          <header
            className={cn(
              "space-y-1 transition-all duration-700 delay-75",
              mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            )}
          >
            <span className="text-md font-normal text-zinc-400">
              Your Performance
            </span>
            <h1 className="text-2xl font-bold text-zinc-900 leading-6">
              My Statistics
            </h1>
          </header>

          {isLoading ? (
            <LoadingSkeleton mounted={mounted} />
          ) : error ? (
            <div
              className={cn(
                "transition-all duration-700 delay-100",
                mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              )}
            >
              <InlineError message={error} />
            </div>
          ) : stats ? (
            <>
              {/* Hero: Global Rating & Tier */}
              <section
                className={cn(
                  "transition-all duration-700 delay-100",
                  mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                )}
              >
                <div className="rounded-2xl bg-linear-to-br from-teal-500 via-green-600 to-lime-600 p-5 shadow-lg shadow-green-500/25 text-white">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-white/90 drop-shadow-sm font-medium">
                        Overall Skills Rating
                      </p>
                      <p className="text-4xl font-bold tabular-nums tracking-tight mt-0.5 drop-shadow-sm">
                        {stats.global_rating.toLocaleString()}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <div className="flex flex-col items-end gap-1.5">
                        <div className="flex items-center gap-1.5 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1.5">
                          <Trophy className="h-4 w-4 text-amber-300" aria-hidden />
                          <span className="text-sm font-bold tracking-widest uppercase">
                            Tier {stats.tier}
                          </span>
                        </div>
                        <span className="text-[0.60rem] font-medium text-white tracking-widest uppercase">
                          {getTierName(stats.tier)} Player
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-between text-xs text-white">
                    <span>{stats.name}</span>
                    {stats.member_since && (
                      <span>
                        Joined since{" "}
                        {new Date(stats.member_since).toLocaleDateString(undefined, {
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    )}
                  </div>
                </div>
              </section>

              {/* Aggregate Stats */}
              <section
                className={cn(
                  "space-y-3 transition-all duration-700 delay-150",
                  mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                )}
              >
                <h2 className="text-sm font-semibold text-zinc-700">
                  Overview
                </h2>
                <div className="grid grid-cols-2 gap-3">
                  <StatCard
                    icon={<Gamepad2 className="h-7 w-7" />}
                    iconColor="text-amber-600"
                    value={stats.totals.games_played}
                    label="Games Played"
                  />
                  <StatCard
                    icon={<Building2 className="h-7 w-7" />}
                    iconColor="text-emerald-600"
                    value={stats.totals.facilities_visited}
                    label="Courts Checked In"
                  />
                  <StatCard
                    icon={<TrendingUp className="h-7 w-7" />}
                    iconColor="text-emerald-600"
                    value={stats.totals.wins}
                    label="Total Wins"
                    variant="success"
                  />
                  <StatCard
                    icon={<TrendingDown className="h-7 w-7" />}
                    iconColor="text-red-600"
                    value={stats.totals.losses}
                    label="Total Losses"
                    variant="danger"
                  />
                  <StatCard
                    icon={<Percent className="h-7 w-7" />}
                    iconColor="text-violet-600"
                    value={`${stats.totals.win_rate}%`}
                    label="Win Rate"
                  />
                  <StatCard
                    icon={<Users className="h-7 w-7" />}
                    iconColor="text-blue-600"
                    value={stats.unique_opponents}
                    label="Opponents"
                  />
                </div>

                {/* Streak pill */}
                {stats.streaks.current_count > 0 && stats.streaks.current_type && (
                  <div
                    className={cn(
                      "flex items-center gap-2 rounded-xl px-4 py-3 border text-sm font-medium",
                      stats.streaks.current_type === "win"
                        ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                        : stats.streaks.current_type === "loss"
                          ? "bg-red-50 border-red-200 text-red-700"
                          : "bg-zinc-50 border-zinc-200 text-zinc-600"
                    )}
                  >
                    <Flame className="h-4 w-4" aria-hidden />
                    <span>
                      {stats.streaks.current_count}-game{" "}
                      {stats.streaks.current_type === "win"
                        ? "winning"
                        : stats.streaks.current_type === "loss"
                          ? "losing"
                          : "draw"}{" "}
                      streak
                    </span>
                  </div>
                )}
              </section>

              {/* Per-Sport Breakdown */}
              {stats.per_sport.length > 0 && (
                <section
                  className={cn(
                    "space-y-3 transition-all duration-700 delay-200",
                    mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                  )}
                >
                  <h2 className="text-sm font-semibold text-zinc-700 flex items-center gap-2">
                    <Swords className="h-4 w-4 text-indigo-500" aria-hidden />
                    By Sport
                  </h2>
                  <div className="grid gap-3">
                    {stats.per_sport.map((s) => {
                      const sportImg =
                        SPORT_IMAGES[s.sport] ?? `/images/${s.sport}.png`;
                      const sportLabel =
                        SPORT_LABELS[s.sport] ??
                        s.sport.charAt(0).toUpperCase() + s.sport.slice(1);

                      return (
                        <div
                          key={s.sport}
                          className="rounded-2xl border border-zinc-200/80 bg-white/80 backdrop-blur-sm p-4 shadow-sm flex items-center gap-4"
                        >
                          <div
                            className="relative h-10 w-10 shrink-0 rounded-sm bg-zinc-100 overflow-hidden"
                            style={{
                              backgroundImage: `url(${sportImg})`,
                              backgroundSize: "cover",
                              backgroundPosition: "left",
                              backgroundRepeat: "no-repeat",
                            }}
                          >
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-zinc-900 text-sm">
                              {sportLabel}
                            </p>
                            <p className="text-xs text-zinc-500 tabular-nums mt-0.5">
                              {s.games_played} game{s.games_played !== 1 ? "s" : ""}{" "}
                              · W-{s.wins} · L-{s.losses}
                              {s.draws > 0 ? ` · D-${s.draws}` : ""}
                            </p>
                          </div>
                          <div className="shrink-0 text-right">
                            <p className="font-bold text-zinc-900 tabular-nums text-lg">
                              {s.win_rate}%
                            </p>
                            <p className="text-[10px] text-zinc-500 uppercase tracking-wide">
                              Win Rate
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}

              {/* Per-Facility Performance */}
              {stats.per_facility.length > 0 && (
                <section
                  className={cn(
                    "space-y-3 transition-all duration-700 delay-[250ms]",
                    mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                  )}
                >
                  <h2 className="text-sm font-semibold text-zinc-700 flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-emerald-500" aria-hidden />
                    By Facility
                  </h2>
                  <ul className="rounded-2xl border border-zinc-200/80 bg-white/80 backdrop-blur-sm overflow-hidden shadow-sm divide-y divide-zinc-100">
                    {stats.per_facility.map((f) => (
                      <li key={f.facility_id} className="px-4 py-3">
                        <div className="flex items-center justify-between">
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-zinc-900 text-sm truncate">
                              {f.facility_name}
                            </p>
                            <p className="text-xs text-zinc-500 tabular-nums mt-0.5">
                              {f.games_played} game{f.games_played !== 1 ? "s" : ""}{" "}
                              · W-{f.wins} · L-{f.losses} · {f.points} pts
                            </p>
                          </div>
                          <div className="shrink-0 text-right ml-3">
                            <p className="font-bold text-zinc-900 tabular-nums">
                              {f.win_rate}%
                            </p>
                            <p className="text-[10px] text-zinc-500 uppercase tracking-wide">
                              Win Rate
                            </p>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {/* Match History */}
              <section
                className={cn(
                  "space-y-3 transition-all duration-700 delay-300",
                  mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                )}
              >
                <h2 className="text-sm font-semibold text-zinc-700 flex items-center gap-2">
                  <BarChart2 className="h-4 w-4 text-violet-500" aria-hidden />
                  My Game History
                </h2>

                {history.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-zinc-200/80 bg-white/80 backdrop-blur-sm min-h-[120px] flex flex-col items-center justify-center p-6 text-center shadow-sm">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 text-zinc-400 mb-3">
                      <Gamepad2 className="h-6 w-6" aria-hidden />
                    </div>
                    <p className="text-sm font-medium text-zinc-600">
                      No matches yet
                    </p>
                    <p className="text-sm text-zinc-500 mt-0.5">
                      Play some games to see your history here
                    </p>
                  </div>
                ) : (
                  <>
                    <ul className="rounded-2xl border border-zinc-200/80 bg-white/80 backdrop-blur-sm overflow-hidden shadow-sm divide-y divide-zinc-100">
                      {history.map((game) => {
                        const sportImg =
                          SPORT_IMAGES[game.sport] ??
                          `/images/${game.sport}.png`;
                        const scoreStr = formatScore(game.score);

                        return (
                          <li
                            key={game.game_id}
                            role="button"
                            tabIndex={0}
                            onClick={() => setSelectedHistoryGame(game)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                setSelectedHistoryGame(game);
                              }
                            }}
                            className="px-4 py-3 cursor-pointer hover:bg-zinc-50/80 transition-colors active:bg-zinc-100/80"
                          >
                            <div className="flex items-center gap-3">
                              <div
                                style={{
                                  backgroundImage: `url(${sportImg})`,
                                  backgroundSize: "cover",
                                  backgroundPosition: "left",
                                  backgroundRepeat: "no-repeat",
                                }}
                                className="relative h-9 w-9 shrink-0 rounded-lg bg-zinc-100 overflow-hidden">
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span
                                    className={cn(
                                      "inline-flex items-center text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full border",
                                      resultColor(game.result)
                                    )}
                                  >
                                    {resultLabel(game.result)}
                                  </span>
                                </div>
                                <p className="text-xs text-zinc-500 mt-1 truncate">
                                  vs{" "}
                                  {game.opponents.length > 0
                                    ? game.opponents
                                        .map((o) => o.name)
                                        .join(", ")
                                    : "—"}
                                </p>
                              </div>
                              <div className="shrink-0 text-right">
                                {scoreStr && (
                                  <span className="flex flex-col">
                                    <span className="text-zinc-500/60 text-[10px] uppercase tracking-wide">Score</span>
                                    <span className="text-md text-zinc-500 tabular-nums font-medium">
                                      {scoreStr}
                                    </span>
                                  </span>
                                )}
                                <p className="text-[10px] text-zinc-400 truncate uppercase tracking-wide max-w-[100px]">
                                  {game.facility_name}
                                </p>
                                <p className="text-[10px] text-zinc-400 mt-0.5 tabular-nums">
                                  {formatDate(game.end_time)}
                                </p>
                              </div>
                            </div>
                          </li>
                        );
                      })}
                    </ul>

                    {hasMoreHistory && (
                      <button
                        type="button"
                        onClick={loadMoreHistory}
                        disabled={isLoadingMore}
                        className="w-full flex items-center justify-center gap-2 rounded-xl border border-zinc-200/80 bg-white/80 backdrop-blur-sm py-3 text-sm font-medium text-zinc-600 hover:bg-zinc-50/80 hover:border-zinc-300/80 transition-all disabled:opacity-50"
                      >
                        {isLoadingMore ? (
                          <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-600" />
                        ) : (
                          <ChevronDown className="h-4 w-4" aria-hidden />
                        )}
                        {isLoadingMore ? "Loading…" : "Load more"}
                      </button>
                    )}

                    {historyPagination && (
                      <p className="text-center text-xs text-zinc-400 tabular-nums">
                        Showing {history.length} of {historyPagination.total} match
                        {historyPagination.total !== 1 ? "es" : ""}
                      </p>
                    )}
                  </>
                )}
              </section>

              {/* Game Details Modal */}
              {selectedHistoryGame && (
                <GameDetailsModal
                  game={selectedHistoryGame}
                  onClose={() => setSelectedHistoryGame(null)}
                  formatScore={formatScore}
                  formatDate={formatDate}
                  resultColor={resultColor}
                  resultLabel={resultLabel}
                  sportImages={SPORT_IMAGES}
                  sportLabels={SPORT_LABELS}
                />
              )}
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function GameDetailsModal({
  game,
  onClose,
  formatScore,
  formatDate,
  resultColor,
  resultLabel,
  sportImages,
  sportLabels,
}: {
  game: HistoryGame;
  onClose: () => void;
  formatScore: (score: string | number[] | null) => string | null;
  formatDate: (iso: string | null) => string;
  resultColor: (result: string | null) => string;
  resultLabel: (result: string | null) => string;
  sportImages: Record<string, string>;
  sportLabels: Record<string, string>;
}) {
  const sportImg = sportImages[game.sport] ?? `/images/${game.sport}.png`;
  const sportLabel = sportLabels[game.sport] ?? game.sport.charAt(0).toUpperCase() + game.sport.slice(1);
  const scoreStr = formatScore(game.score);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="game-details-modal-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-zinc-200/90 overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative px-5 pt-5 pb-4 border-b border-zinc-100">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 rounded-full p-2 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-3 pr-10">
            <div
              className="h-15 w-15 shrink-0 rounded-xl bg-zinc-100 overflow-hidden"
              style={{
                backgroundImage: `url(${sportImg})`,
                backgroundSize: "cover",
                backgroundPosition: "left",
              }}
            />
            <div className="min-w-0 flex-1">
              <h2 id="game-details-modal-title" className="text-lg font-semibold text-zinc-900">
                {sportLabel}
                {game.match_type && (
                  <span className="text-zinc-500 font-normal ml-1">({game.match_type})</span>
                )}
              </h2>
              <span
                className={cn(
                  "inline-flex mt-1.5 text-xs font-semibold uppercase tracking-wide px-2.5 py-0.5 rounded-full border",
                  resultColor(game.result)
                )}
              >
                {resultLabel(game.result)}
              </span>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="px-5 py-4 space-y-4">
          {(scoreStr || game.duration_minutes != null) && (
            <div className="flex gap-6">
              {scoreStr && (
                <div>
                  <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wide mb-0.5">
                    Final Score
                  </p>
                  <p className="text-xl font-bold tabular-nums text-zinc-900">{scoreStr}</p>
                </div>
              )}
              {game.duration_minutes != null && (
                <div>
                  <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wide mb-0.5">
                    Duration
                  </p>
                  <p className="text-xl font-bold tabular-nums text-zinc-900">
                    {game.duration_minutes < 60
                      ? `${game.duration_minutes} min`
                      : `${Math.floor(game.duration_minutes / 60)}h ${game.duration_minutes % 60} min`}
                  </p>
                </div>
              )}
            </div>
          )}

          {game.opponents.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wide mb-2">
                Game Participants
              </p>
              <ul className="space-y-2">
                {game.opponents.map((o) => (
                  <li
                    key={o.user_id}
                    className="flex items-center justify-between py-1"
                  >
                    <div className="flex items-center gap-2">
                      <UserAvatar name={o.name} avatarSeed={o.avatar_seed} size={24} />
                      <span className="text-sm font-medium text-zinc-900">{o.name}</span>
                    </div>
                    <span
                      className={cn(
                        "text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full border",
                        resultColor(o.result)
                      )}
                    >
                      {resultLabel(o.result)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex items-center gap-2 pt-1">
            <MapPin className="h-4 w-4 text-zinc-400 shrink-0" aria-hidden />
            <Link
              href={`/facility/${game.facility_id}`}
              className="text-sm font-medium text-emerald-600 hover:text-emerald-700 hover:underline"
            >
              {game.facility_name}
            </Link>
          </div>

          <p className="text-xs text-zinc-500 tabular-nums">
            Match Recorded on {formatDate(game.end_time)}
          </p>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  iconColor,
  value,
  label,
  variant,
}: {
  icon: React.ReactNode;
  iconColor: string;
  value: number | string;
  label: string;
  variant?: "success" | "danger";
}) {
  const borderClass =
    variant === "success"
      ? "border-emerald-200 bg-emerald-100/80"
      : variant === "danger"
        ? "border-red-200/50 bg-red-100/80"
        : "border-slate-200 bg-gray-50";

  return (
    <div
      className={cn(
        "rounded-2xl border backdrop-blur-sm p-4 shadow-sm transition-all duration-200 hover:shadow-md hover:scale-[1.01] active:scale-[0.99]",
        borderClass
      )}
    >
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
            iconColor
          )}
        >
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <p className="mt-0.5 text-2xl font-bold tabular-nums text-zinc-900">
            {typeof value === "number" ? value.toLocaleString() : value}
          </p>
          <p className="text-[10px] font-medium text-zinc-500 uppercase leading-tight tracking-wide">
            {label}
          </p>
        </div>
      </div>
    </div>
  );
}

function LoadingSkeleton({ mounted }: { mounted: boolean }) {
  return (
    <div className="space-y-6">
      {/* Hero skeleton */}
      <div
        className={cn(
          "rounded-2xl bg-linear-to-br from-indigo-400/60 to-purple-400/60 p-5 shadow-sm transition-all duration-700 delay-100",
          mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        )}
      >
        <div className="h-6 w-28 bg-white/20 rounded animate-pulse" />
        <div className="h-10 w-20 bg-white/30 rounded animate-pulse mt-2" />
        <div className="flex items-center justify-between mt-4">
          <div className="h-4 w-24 bg-white/20 rounded animate-pulse" />
          <div className="h-4 w-20 bg-white/20 rounded animate-pulse" />
        </div>
      </div>
      {/* Stats grid skeleton */}
      <div
        className={cn(
          "space-y-3 transition-all duration-700 delay-150",
          mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        )}
      >
        <div className="h-4 w-16 bg-zinc-200 rounded animate-pulse" />
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="rounded-2xl border border-zinc-200/80 bg-white/80 p-4 shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-xl bg-zinc-200/80 animate-pulse" />
                <div className="space-y-2 flex-1">
                  <div className="h-6 w-10 bg-zinc-200/80 rounded animate-pulse" />
                  <div className="h-3 w-16 bg-zinc-100 rounded animate-pulse" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* History skeleton */}
      <div
        className={cn(
          "space-y-3 transition-all duration-700 delay-200",
          mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        )}
      >
        <div className="h-4 w-28 bg-zinc-200 rounded animate-pulse" />
        <div className="rounded-2xl border border-zinc-200/80 bg-white/80 overflow-hidden shadow-sm">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex items-center gap-3 px-4 py-3 border-b border-zinc-100 last:border-0"
            >
              <div className="h-9 w-9 rounded-lg bg-zinc-200/80 animate-pulse" />
              <div className="flex-1 space-y-1.5">
                <div className="h-4 w-12 bg-zinc-200/80 rounded animate-pulse" />
                <div className="h-3 w-28 bg-zinc-100 rounded animate-pulse" />
              </div>
              <div className="space-y-1">
                <div className="h-3 w-16 bg-zinc-100 rounded animate-pulse" />
                <div className="h-3 w-12 bg-zinc-100 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
