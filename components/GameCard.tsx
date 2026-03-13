"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Check, Clock, LogOut, Pencil, Play, Square, ThumbsUp, Trophy, X } from "lucide-react";
import { UserAvatar } from "@/components/UserAvatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";

type Participant = {
  user_id: number;
  user?: { id: number; name: string };
};

export type GameCardGame = {
  id: number;
  sport: string;
  status: string;
  created_at?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  score?: number[] | string | null;
  match_type?: string | null;
  creator_id?: number;
  creator?: { id: number; name: string };
  participants: Participant[];
  winners?: { id: number; name: string }[];
};

type SportColors = { border: string; bg: string };
type StatusBadge = { className: string; label: string };

export type ActiveParticipantWithStatus = {
  user_id: number;
  name: string;
  avatar_seed?: string | null;
  isYou: boolean;
  status: "awaiting_confirmation" | "confirmed";
  result?: string | null;
};

type GameCardProps = {
  game: GameCardGame;
  participantsWithStatus: ActiveParticipantWithStatus[];
  statusBadge: StatusBadge;
  sportColors: SportColors;
  sportLabel: string;
  invited: boolean;
  responding: boolean;
  showStart: boolean;
  starting: boolean;
  showAbort: boolean;
  aborting: boolean;
  showLeaveGame: boolean;
  leaving: boolean;
  showEditInvites: boolean;
  showFinish: boolean;
  finishing: boolean;
  showConfirmResult: boolean;
  confirming: boolean;
  confirmResultMessage: string;
  onRespondAccept: () => void;
  onRespondDecline: () => void;
  onStartGame: () => void;
  onAbortGame: () => void;
  onLeaveGame: () => void;
  onEditInvites: () => void;
  onOpenFinishModal: () => void;
  onConfirmResult: () => void;
};

function formatCreatedAgo(createdAt: string | null | undefined): string {
  if (!createdAt) return "Recently created";
  try {
    const date = new Date(createdAt);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);
    if (diffSec < 60) return "Created just now";
    if (diffMin < 60) return `Created ${diffMin} minute${diffMin !== 1 ? "s" : ""} ago`;
    if (diffHour < 24) return `Created ${diffHour} hour${diffHour !== 1 ? "s" : ""} ago`;
    if (diffDay < 7) return `Created ${diffDay} day${diffDay !== 1 ? "s" : ""} ago`;
    return "Recently created";
  } catch {
    return "Recently created";
  }
}

// Bump this when you replace image files (same filename) to bust browser cache
const IMAGE_CACHE_BUST = "?v=2";

const SPORT_IMAGES: Record<string, string> = {
  badminton: `/images/badminton.png${IMAGE_CACHE_BUST}`,
  pickleball: `/images/pickleball.png${IMAGE_CACHE_BUST}`,
  tennis: `/images/tennis.png${IMAGE_CACHE_BUST}`,
  pingpong: `/images/ping-pong.png${IMAGE_CACHE_BUST}`,
};

function getStatusDisplayText(status: string): string {
  const map: Record<string, string> = {
    awaiting_confirmation: "Awaiting for confirmations...",
    ongoing: "Game Started",
    awaiting_result_confirmation: "Awaiting confirmations...",
    completed: "Completed",
  };
  return map[status] ?? "—";
}

function formatElapsedFromStart(startTime: string | null | undefined, nowMs: number): string | null {
  if (!startTime) return null;
  const startMs = new Date(startTime).getTime();
  if (!Number.isFinite(startMs) || startMs <= 0) return null;
  const elapsedSec = Math.max(0, Math.floor((nowMs - startMs) / 1000));
  const hours = Math.floor(elapsedSec / 3600);
  const minutes = Math.floor((elapsedSec % 3600) / 60);
  const seconds = elapsedSec % 60;

  const mm = String(minutes).padStart(2, "0");
  const ss = String(seconds).padStart(2, "0");
  if (hours > 0) {
    return `${hours}:${mm}:${ss}`;
  }
  return `${mm}:${ss}`;
}

export function GameCard({
  game,
  participantsWithStatus,
  statusBadge,
  sportColors,
  sportLabel,
  invited,
  responding,
  showStart,
  starting,
  showAbort,
  aborting,
  showLeaveGame,
  leaving,
  showEditInvites,
  showFinish,
  finishing,
  showConfirmResult,
  confirming,
  confirmResultMessage,
  onRespondAccept,
  onRespondDecline,
  onStartGame,
  onAbortGame,
  onLeaveGame,
  onEditInvites,
  onOpenFinishModal,
  onConfirmResult,
}: GameCardProps) {
  const [hasMounted, setHasMounted] = useState(false);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const creatorName = game.creator?.name ?? "Unknown";
  const confirmedCount = participantsWithStatus.filter((p) => p.status === "confirmed").length;
  const totalCount = Math.max(participantsWithStatus.length, 1);
  const progressPercent = Math.round((confirmedCount / totalCount) * 100);
  const sportImage =
    SPORT_IMAGES[game.sport] ?? `/images/${game.sport}.png${IMAGE_CACHE_BUST}`;
  const elapsedTimer = formatElapsedFromStart(game.start_time, nowMs);
  const isCurrentUserParticipant = participantsWithStatus.some((p) => p.isYou);
  const showParticipantElapsedTimer =
    game.status === "ongoing" && isCurrentUserParticipant && !showFinish;

  useEffect(() => {
    const raf = requestAnimationFrame(() => setHasMounted(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    const shouldRunElapsedTimer =
      !!game.start_time && (showFinish || showParticipantElapsedTimer);
    if (!shouldRunElapsedTimer) return;
    const timer = window.setInterval(() => setNowMs(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [showFinish, showParticipantElapsedTimer, game.start_time]);

  return (
    <Card
      className="group relative overflow-hidden rounded-2xl border-0 p-0 shadow-sm transition-all duration-300 ease-out hover:scale-[1.03] hover:shadow-lg active:scale-[0.98] active:shadow-md"
      data-status={statusBadge.label}
      data-sport-accent={sportColors.border}
    >
      <CardContent className="p-0">
        <div
          className={`
            flex flex-col
            transition-all duration-700 ease-out
            ${hasMounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}
          `}
        >
          {/* Top section: Image area (~45%) */}
          <div
            className="relative w-full aspect-auto h-30 rounded-t-2xl bg-[#E0E0E0] shrink-0 overflow-hidden"
            aria-hidden
          >
            <div className="absolute top-2 right-2 z-10 flex gap-2">
              {showEditInvites && (
                <Button
                  type="button"
                  variant="link"
                  onClick={onEditInvites}
                  className="text-yellow-600 hover:text-yellow-700 bg-yellow-100/70 hover:bg-yellow-500/90 rounded-full h-7 w-7 flex items-center justify-center"
                >
                  <Pencil className="size-4 shrink-0" aria-hidden />
                </Button>
              )}
              {showAbort && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={onAbortGame}
                  disabled={aborting}
                  aria-busy={aborting}
                  aria-label="Abort game"
                  className="h-7 w-7 rounded-full bg-red-200/70 text-red-900/70 hover:bg-red-500/90 hover:text-white focus-visible:ring-2 focus-visible:ring-gray-600"
                >
                  {aborting ? (
                    <span className="text-xs">…</span>
                  ) : (
                    <X className="size-4 shrink-0" />
                  )}
                </Button>
              )}
            </div>
            <Image
              src={sportImage}
              alt={sportLabel}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 100vw, 100vw"
              className="object-cover"
            />
          </div>

          {/* Bottom section: Yellow details (~55%) */}
          <div className="bg-gray-50 border border-slate-300/60 p-3 space-y-1 min-w-0 w-full rounded-b-2xl">
            
            <div className="flex justify-between items-center space-x-6 mt-2">
              {/* Participant avatars (overlapping) */}
              <div className="relative flex items-center justify-between gap-1">
                {participantsWithStatus.length > 0 && !showConfirmResult && (
                  <div
                    className={`
                      flex -space-x-2
                      transition-all duration-500 ease-out delay-150
                      ${hasMounted ? "opacity-100" : "opacity-0"}
                    `}
                  >
                    {participantsWithStatus.slice(0, 5).map((p) => (
                      <div
                        key={p.user_id}
                        className={cn(
                          "shrink-0 overflow-hidden rounded-full border-2 shadow-sm shadow-gray-400",
                          p.status === "confirmed"
                            ? "border-green-600"
                            : "border-zinc-300"
                        )}
                        title={p.name}
                      >
                        <UserAvatar
                          name={p.name}
                          avatarSeed={p.avatar_seed}
                          size={32}
                          className="border-0 shadow-none"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {/* Progress bar row */}
              <div className="flex items-center justify-center gap-3 w-full">
                <div className="flex-1 space-y-1 items-center justify-center">
                  {/* Status text */}
                  <p className="text-[11px] text-gray-600 italic line-clamp-1">
                    {showConfirmResult ? confirmResultMessage : getStatusDisplayText(game.status)}
                  </p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 min-w-0 h-2 rounded-full bg-[#e6d076] overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gray-600 transition-all duration-700 ease-out"
                        style={{ width: hasMounted ? `${progressPercent}%` : "0%" }}
                      />
                    </div>
                    <span className="text-sm font-bold text-gray-500 shrink-0 tabular-nums">
                      {confirmedCount}/{totalCount}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col gap-2 mt-4">
              {invited && (
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={onRespondAccept}
                    disabled={responding}
                    aria-busy={responding}
                    className="inline-flex gap-1 items-center text-green-600 hover:text-green-700 hover:underline text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Check className="size-5 shrink-0" aria-hidden />
                    {responding ? "…" : "Accept"}
                  </button>
                  <button
                    type="button"
                    onClick={onRespondDecline}
                    disabled={responding}
                    aria-busy={responding}
                    className="inline-flex gap-1 items-center text-red-600 hover:text-red-700 hover:underline text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <X className="size-5 shrink-0" aria-hidden />
                    {responding ? "…" : "Decline"}
                  </button>
                </div>
              )}
              {showConfirmResult && (
                <div className="space-y-3">
                  {(() => {
                    const winners = participantsWithStatus.filter((p) => p.result === "win");
                    const losers = participantsWithStatus.filter((p) => p.result === "loss");
                    if (winners.length === 0 && losers.length === 0) return null;
                    return (
                      <div className="space-y-1">
                        <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
                          Result:
                        </p>
                        <div className="flex flex-wrap gap-x-3 gap-y-1.5 text-sm">
                          {winners.length > 0 && (
                            <span className="flex flex-col items-start gap-0">
                              <span className="text-emerald-600 font-semibold text-xs">Winner(s)</span>
                              <span className="text-zinc-700 text-sm">{winners.map((p) => p.name).join(", ")}</span>
                            </span>
                          )}
                          {losers.length > 0 && (
                            <span className="flex flex-col items-start gap-0">
                              <span className="text-red-600 font-semibold text-xs">Loser(s)</span>
                              <span className="text-zinc-700 text-sm">{losers.map((p) => p.name).join(", ")}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                  <Button
                    type="button"
                    onClick={onConfirmResult}
                    disabled={confirming}
                    aria-busy={confirming}
                    className="w-full bg-emerald-600 text-white py-2 rounded-full font-medium text-xs hover:bg-emerald-700 shadow-sm"
                  >
                    <ThumbsUp className="size-3 shrink-0" aria-hidden />
                    {confirming ? "Confirming…" : "Confirm Result"}
                  </Button>
                </div>
              )}
              {showFinish && (
                <div className="flex flex-col items-center justify-center gap-1">
                  <Button
                    type="button"
                    onClick={onOpenFinishModal}
                    disabled={finishing}
                    aria-busy={finishing}
                    className="w-1/2 mx-auto bg-red-600 text-lg tabular-nums tracking-wider text-white py-2 rounded-lg font-medium hover:bg-green-700"
                  >
                    <span className="size-4 shrink-0 border border-white rounded-full p-2.5 flex items-center justify-center">
                      <Square className="size-1.5 bg-white shrink-0" aria-hidden />
                    </span>
                    {finishing ? "…" : elapsedTimer ?? "00:00"}
                  </Button>
                  <em className="text-sm text-gray-500">Time elapsed</em>
                </div>
              )}
              {showParticipantElapsedTimer && (
                <div className="flex flex-col items-center justify-center gap-1">
                  <p className="w-1/2 mx-auto flex items-center justify-center gap-2 text-center bg-red-600 text-lg tabular-nums tracking-wider text-white py-2 rounded-lg font-medium">
                    <Clock className="size-4 shrink-0" aria-hidden />
                    {elapsedTimer ?? "00:00"}
                  </p>
                  <em className="text-sm text-gray-500">Time elapsed</em>
                </div>
              )}
              {showLeaveGame && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    if (window.confirm("Are you sure you want to leave this game?")) {
                      onLeaveGame();
                    }
                  }}
                  disabled={leaving}
                  aria-busy={leaving}
                  className="max-w-xs mx-auto rounded-full border-red-300 bg-red-200 text-amber-700 hover:bg-amber-50"
                >
                  <LogOut className="size-3 shrink-0" aria-hidden />
                  {leaving ? "Leaving…" : "Leave game"}
                </Button>
              )}
              {(showStart) && (
                <Button
                  type="button"
                  onClick={onStartGame}
                  disabled={starting}
                  aria-busy={starting}
                  className="w-1/2 mx-auto text-xs tracking-wider bg-green-600 text-white py-2 rounded-full font-medium hover:bg-green-700"
                >
                  <Play className="size-3 shrink-0" aria-hidden />
                  {starting ? "…" : "Start Game"}
                </Button>
              )}
            </div>

            {/* Created timestamp - use placeholder until mounted to avoid hydration mismatch */}
            <div className="mt-4 flex items-center justify-between">
                <span className="text-gray-500 italic text-[0.75rem]">
                  {hasMounted ? formatCreatedAgo(game.created_at ?? null) : "Recently created"}
                </span>
                <span className="text-gray-500 italic truncate text-[0.75rem]">Created by {creatorName}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

type CompletedParticipant = {
  user_id: number;
  result?: string | null;
  user?: { id: number; name: string };
};

type CompletedGameCardGame = {
  id: number;
  sport: string;
  participants: CompletedParticipant[];
  winners?: { id: number; name: string }[];
};

export type ParticipantWithStatus = {
  name: string;
  result?: string | null;
  isWinner: boolean;
};

type CompletedGameCardProps = {
  game: CompletedGameCardGame;
  sportColors: SportColors;
  sportLabel: string;
  participantsWithStatus: ParticipantWithStatus[];
  winnersLabel?: string;
};

export function CompletedGameCard({
  game,
  sportColors,
  sportLabel,
  participantsWithStatus,
  winnersLabel,
}: CompletedGameCardProps) {
  const [hasMounted, setHasMounted] = useState(false);
  const sportImage = SPORT_IMAGES[game.sport] ?? `/images/${game.sport}.png`;

  useEffect(() => {
    const raf = requestAnimationFrame(() => setHasMounted(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <Card
      className="group relative overflow-hidden rounded-2xl border-0 p-0 shadow-sm transition-all duration-300 ease-out hover:scale-[1.03] hover:shadow-lg active:scale-[0.98] active:shadow-md"
      data-game-id={game.id}
      data-sport-accent={sportColors.border}
    >
      <CardContent className="p-0">
        <div
          className={`
            flex flex-col
            transition-all duration-700 ease-out
            ${hasMounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}
          `}
        >
          {/* Top section: Image area (~45%) */}
          <div
            className="relative w-full aspect-auto h-24 rounded-t-2xl bg-[#E0E0E0] shrink-0 overflow-hidden"
            aria-hidden
          >
            <Image
              src={sportImage}
              alt={sportLabel}
              fill
              className="object-contain"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          </div>

          <div className="bg-slate-400/20 border border-slate-300/60 p-3 space-y-1 min-w-0 w-full rounded-b-2xl">
            {participantsWithStatus.length === 0 ? (
              <p className="text-xs text-[#6B7280]">—</p>
            ) : (
              <div className="flex flex-col">
                <span className="text-[11px] italic font-normal text-gray-500">Players:</span>
                {(() => {
                  const groupedByStatus = participantsWithStatus.reduce(
                    (acc, participant) => {
                      const status = participant.isWinner ? "winner" : "loser";
                      acc[status].push(participant);
                      return acc;
                    },
                    {
                      winner: [] as ParticipantWithStatus[],
                      loser: [] as ParticipantWithStatus[],
                    }
                  );

                  return (
                    <>
                      {groupedByStatus.winner.length > 0 && (
                        <div className="flex">
                          <span className="text-[10px] font-semibold uppercase tracking-wide text-green-700/80">
                            W:&nbsp; 
                          </span>
                          <span className="text-xs font-normal tracking-wide text-green-600/80">
                            {groupedByStatus.winner.map((p) => p.name).join(", ")}
                          </span>
                        </div>
                      )}
                      {groupedByStatus.loser.length > 0 && (
                        <div className="flex gap-0.5">
                          <span className="text-[10px] font-semibold uppercase tracking-wide text-red-700/80">
                            L:&nbsp;
                          </span>
                          <span className="text-xs font-normal tracking-wide text-red-500/80">
                            {groupedByStatus.loser.map((p) => p.name).join(", ")}
                          </span>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            )}
            {winnersLabel && (
              <p className="flex items-center gap-1 text-xs font-medium text-gray-500 mt-1">
                <Trophy className="size-2.5 shrink-0 text-amber-500" aria-hidden />
                <span className="font-bold text-amber-500">{winnersLabel}</span>
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
