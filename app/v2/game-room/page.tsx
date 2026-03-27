"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/v2/header";
import { MobileNav } from "@/components/v2/MobileNav";
import { getAuthToken } from "@/lib/auth";
import styles from "./game-room.module.css";
import { Trophy } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const IMG_AVATAR =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuDxwZyqJ4H7aFw43xc9BztWapcArXLZlPr2UzBqxiPU4DFzB26LXCyNHadLMvi8d2ls8Pc0Pi3898xIaXW_wI9qgOX2bGN90uZujjB8JmowFjO2hOhPDvazOC83gNtVENMN6ka4pSTY7ftUVyzJblYozGMzJ7hfPNUnbIGz6e6ef3nWUGNIrQsS-k83lvB7v5A4JQ3nuXp0O347uw0upZ-glH-dUnAj2HZhco8-Zh5YKoWM_eM7dJEgwpq_NV6nWwIJpILvo6zu60w";

type MeUser = {
  id?: number;
  name?: string;
  email?: string;
  nickname?: string | null;
  avatar_seed?: string | null;
};

const COURTS = [
  { id: "COURT 01", status: "MATCH ACTIVE", active: true },
  { id: "COURT 02", status: "OPENING SOON", active: false },
  { id: "COURT 03", status: "MATCH ACTIVE", active: true },
  { id: "COURT 04", status: "MAINTENANCE", active: false },
] as const;

const PLAYERS = [
  {
    initials: "MR",
    name: "MARCUS REED",
    tier: "Tier 1",
    status: "Available",
    detail: "WR  SJ",
    actionLabel: "Challenge",
    actionIcon: "chevron_right",
    statusColor: "text-[#4ce081]",
  },
  {
    initials: "EV",
    name: "ELENA VOGEL",
    tier: "Tier 2",
    status: "Playing",
    detail: "Currently on Court 03",
    actionLabel: "View Match",
    actionIcon: "visibility",
    statusColor: "text-[#c2c1ff]",
  },
  {
    initials: "JL",
    name: "JORDAN LI",
    tier: "Tier 2",
    status: "Waiting for Confirmation",
    detail: "Invited by Coach Sam",
    actionLabel: "Profile",
    actionIcon: "person",
    statusColor: "text-[#ffb4ab]",
  },
] as const;

type PlayerStatusFilter = "all" | "playing" | "available";

const filterButtonClass = (active: boolean) =>
  active
    ? "rounded-full bg-[#4ce081] px-4 py-2 text-xs font-bold text-[#003919]"
    : "rounded-full bg-[#353438] px-4 py-2 text-xs font-semibold text-[#e4e1e6]";

export default function V2GameRoomPage() {
  const router = useRouter();
  const [me, setMe] = useState<MeUser | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [playerSearch, setPlayerSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<PlayerStatusFilter>("all");
  const [fastMatchmaking, setFastMatchmaking] = useState(false);

  const q = playerSearch.trim().toLowerCase();
  const filteredPlayers = useMemo(() => {
    const searched = q
      ? PLAYERS.filter(
          (p) =>
            p.name.toLowerCase().includes(q) ||
            p.tier.toLowerCase().includes(q) ||
            p.status.toLowerCase().includes(q) ||
            p.detail.toLowerCase().includes(q)
        )
      : [...PLAYERS];

    if (statusFilter === "playing") {
      return searched.filter((p) => p.status === "Playing");
    }
    if (statusFilter === "available") {
      return searched.filter((p) => p.status === "Available");
    }
    return searched;
  }, [q, statusFilter]);

  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      router.replace("/v2/login?returnUrl=/v2/game-room");
      return;
    }

    let cancelled = false;

    fetch(`${API_URL}/api/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Could not load user.");
        return res.json();
      })
      .then((data) => {
        if (cancelled) return;
        const user = data?.data?.user ?? data?.user ?? data;
        setMe(user);
      })
      .catch(() => {
        if (!cancelled) setMe(null);
      })
      .finally(() => {
        if (!cancelled) setIsLoadingUser(false);
      });

    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <div
      className={`${styles.gameRoom} bg-[#131316] text-[#e4e1e6] selection:bg-[#c2c1ff] selection:text-[#282671]`}
    >
      <Header
        profile={
          me
            ? {
                name: me.name?.trim() || me.email || "User",
                avatar_seed: me.avatar_seed,
              }
            : null
        }
        profileLoading={isLoadingUser}
        avatarSrc={IMG_AVATAR}
      />

      <main className="mx-auto min-h-screen max-w-md px-6 pb-32 pt-30">
        <section className="mb-8">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#4ce081]">
            Ground Zero Fitness Hub
          </p>
          <h1 className="text-5xl font-extrabold tracking-tight">GAME ROOM</h1>
          <p className="mt-4 text-sm leading-relaxed text-[#c8c5d2]">
            Connect with 24 active players currently on-site.<br />
            The court is waiting for your next move.
          </p>
        </section>

        <button
          type="button"
          className="mb-8 inline-flex items-center gap-2 rounded-full bg-linear-to-br from-[#c2c1ff] to-[#8a89d9] px-5 py-3 text-xs font-bold tracking-wider text-[#282671] uppercase"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-5 text-[#282671]">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>

          Create Match
        </button>

        <section className="relative mb-8 min-h-[450px] overflow-hidden bg-[url('/images/court.png')] bg-cover bg-center p-4">
          <div className="pointer-events-none absolute inset-0 bg-black/60" />
          <div className="relative z-10">
            <h2 className="text-3xl font-bold text-[#e4e1e6]">Active Games</h2>
            <p className="mb-4 text-md text-[#c8c5d2]">Real-time ongoing matches</p>

            <div className="grid grid-cols-1 gap-3">
              {COURTS.map((court) => (
                <div
                  key={court.id}
                  className="rounded-md bg-[#131316]/80 p-3"
                  aria-label={`${court.id} ${court.status}`}
                >
                  <p className="text-[10px] font-semibold tracking-widest text-[#c8c5d2]">
                    {court.id}
                  </p>
                  <p
                    className={`mt-1 text-[10px] font-bold tracking-[0.12em] ${
                      court.active ? "text-[#4ce081]" : "text-[#c8c5d2]"
                    }`}
                  >
                    {court.status}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mb-6">
          <h2 className="mb-3 text-base font-bold text-[#e4e1e6]">
            Who&apos;s on the court
          </h2>
          <label className="mb-4 flex items-center gap-3 rounded-xl bg-[#0e0e11] px-4 py-3 ring-1 ring-white/5 focus-within:ring-[#c2c1ff]/40">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-4 stroke-[#918f9c]">
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
            <input
              type="search"
              value={playerSearch}
              onChange={(e) => setPlayerSearch(e.target.value)}
              placeholder="Search players by name, tier, or status…"
              autoComplete="off"
              spellCheck={false}
              className="min-w-0 flex-1 bg-transparent text-sm text-[#e4e1e6] placeholder:text-[#918f9c] outline-none"
              aria-label="Search players"
            />
          </label>

          <h3 className="mb-3 font-semibold text-xs text-[#e4e1e6]">Status Filters</h3>
          <div className="mb-4 flex flex-wrap gap-2" role="group" aria-label="Filter players by status">
            <button
              type="button"
              className={filterButtonClass(statusFilter === "all")}
              aria-pressed={statusFilter === "all"}
              onClick={() => setStatusFilter("all")}
            >
              All Players
            </button>
            <button
              type="button"
              className={filterButtonClass(statusFilter === "playing")}
              aria-pressed={statusFilter === "playing"}
              onClick={() => setStatusFilter("playing")}
            >
              Playing
            </button>
            <button
              type="button"
              className={filterButtonClass(statusFilter === "available")}
              aria-pressed={statusFilter === "available"}
              onClick={() => setStatusFilter("available")}
            >
              Available
            </button>
          </div>

          <p className="mt-4 mb-2 tracking-wide text-xs text-[#c8c5d2]">Enable AI-integrated matchmaking to find your next match faster. (coming soon)</p>
          <label className="opacity-70 mb-5 flex cursor-pointer items-center justify-between gap-3 rounded-full bg-[#c2c1ff]/10 px-3 py-2 text-[10px] font-bold tracking-widest text-[#c2c1ff] uppercase">
            <span className="flex min-w-0 items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-5 stroke-[#4ce081]">
                <path strokeLinecap="round" strokeLinejoin="round" d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z" />
              </svg>
              <span>AI-integrated matchmaking</span>
            </span>
            <span className="relative inline-flex shrink-0 items-center">
              <input
                type="checkbox"
                disabled={true}
                role="switch"
                checked={fastMatchmaking}
                onChange={(e) => setFastMatchmaking(e.target.checked)}
                className="peer sr-only"
                aria-label="Fast matchmaking"
              />
              <span
                className="relative flex h-7 w-12 items-center rounded-full bg-[#6b696f] p-0.5 transition-colors peer-checked:bg-[#4ce081]/85 peer-checked:[&>.thumb]:translate-x-[22px] peer-focus-visible:ring-2 peer-focus-visible:ring-[#c2c1ff]/50 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-[#131316]"
                aria-hidden
              >
                <span className="thumb block h-6 w-6 translate-x-0 rounded-full bg-white shadow transition-transform duration-200 ease-out" />
              </span>
            </span>
          </label>

          <div className="space-y-3">
            {filteredPlayers.map((player) => (
              <article
                key={player.name}
                className="flex justify-between items-center rounded-2xl bg-[#1b1b1e] p-4 transition-colors hover:bg-[#1f1f22]"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#353438] text-sm font-bold text-[#e4e1e6]">
                    {player.initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="truncate text-sm font-extrabold tracking-wide text-[#e4e1e6]">
                      {player.name}
                    </h4>
                    <p className="flex items-center">
                      <Trophy className="size-3 text-[#c8c5d2] inline-block mr-1" aria-hidden />
                      <span className="text-sm text-[#c8c5d2]">{player.tier}</span>
                    </p>
                  </div>
                </div>

                <div className="space-y-1 text-right">
                  <p className={`text-xs font-bold ${player.statusColor}`}>
                    {player.status}
                  </p>
                  <p className="text-xs text-[#c8c5d2]">{player.detail}</p>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>

      <MobileNav />
    </div>
  );
}
