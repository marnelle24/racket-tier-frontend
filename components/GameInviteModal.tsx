"use client";

import Image from "next/image";
import { Gamepad2, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type GameInviteGame = {
  id: number;
  sport: string;
  creator_id?: number;
  creator?: { id: number; name: string };
};

type GameInviteModalProps = {
  open: boolean;
  game: GameInviteGame | null;
  sportLabel?: string;
  sportImageUrl?: string;
  onAccept: () => void;
  onDecline: () => void;
  onClose: () => void;
  responding?: boolean;
  className?: string;
};

function formatSportLabel(sport: string): string {
  if (!sport) return "Game";
  return sport.charAt(0).toUpperCase() + sport.slice(1).replace(/_/g, " ");
}

export function GameInviteModal({
  open,
  game,
  sportLabel,
  sportImageUrl,
  onAccept,
  onDecline,
  onClose,
  responding = false,
  className,
}: GameInviteModalProps) {
  if (!open) return null;

  const creatorName = game?.creator?.name ?? "Someone";
  const label = sportLabel ?? (game ? formatSportLabel(game.sport) : "Game");
  const imageUrl = sportImageUrl ?? (game ? `/images/${game.sport}.png` : null);

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200",
        className
      )}
      role="dialog"
      aria-modal="true"
      aria-labelledby="game-invite-modal-title"
      aria-describedby="game-invite-modal-description"
      onClick={() => !responding && onClose()}
    >
      <div
        className="w-full max-w-sm rounded-2xl bg-white/95 backdrop-blur-sm shadow-2xl border border-zinc-200/80 overflow-hidden animate-in zoom-in fade-in duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative flex shrink-0 items-center justify-center w-full h-38 rounded-t-2xl bg-zinc-300 overflow-hidden">
          <button
            type="button"
            onClick={onClose}
            disabled={responding}
            className="z-10 absolute top-3 right-3 rounded-full bg-zinc-200/60 p-2 text-zinc-700 hover:bg-zinc-300 hover:text-zinc-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt=""
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 100vw, 100vw"
              className="object-cover"
            />
          ) : (
              // <Gamepad2 className="h-8 w-8 text-emerald-600" aria-hidden />
              <h1 className="text-3xl font-bold text-zinc-400 text-center">
                Invitation to Play {label.toUpperCase()} Game
              </h1>
          )}
        </div>
        <div className="p-5 sm:p-6">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="min-w-0">
                <h2
                  id="game-invite-modal-title"
                  className="text-2xl font-semibold text-zinc-900"
                >
                  You&apos;re invited to play
                </h2>
                <p
                  id="game-invite-modal-description"
                  className="text-md text-zinc-500 mt-0.5"
                >
                  {creatorName} invited you to a game of {label}
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-3 mt-5">
            <Button
              type="button"
              variant="outline"
              className="flex-1 border-red-500 bg-red-400 hover:bg-red-500 text-white"
              onClick={onDecline}
              disabled={responding}
            >
              {responding ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : (
                "Decline"
              )}
            </Button>
            <Button
              type="button"
              className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white"
              onClick={onAccept}
              disabled={responding}
            >
              {responding ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : (
                "Accept"
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
