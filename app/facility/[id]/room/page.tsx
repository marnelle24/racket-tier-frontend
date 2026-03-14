"use client";

import { useParams, useRouter, notFound } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, ChartBar, Clock, Dot, Gamepad2, Loader2, Pencil, Plus, RefreshCcw, Search, Trophy, Users, X } from "lucide-react";
import { UserAvatar } from "@/components/UserAvatar";
import { getEcho } from "@/lib/echo";
import { getAuthToken } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { useToast } from "@/lib/toast-context";
import { InlineError } from "@/components/InlineError";
import { RacketTierLogo } from "@/components/RacketTierLogo";
import { Button } from "@/components/ui/button";
import { GameCard } from "@/components/GameCard";
import { GameInviteModal } from "@/components/GameInviteModal";
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
const ACTIVE_PLAYERS_PREVIEW_COUNT = 11;
// Use default Echo namespace mapping (App.Events.*) to avoid event-name mismatches.
const EVENT_GAME_INVITED = "GameInvited";
const EVENT_GAME_CREATED = "GameCreated";
const EVENT_GAME_INVITATION_RESPONDED = "GameInvitationResponded";
const EVENT_GAME_INVITATION_RESPONDED_ALT = ".App.Events.GameInvitationResponded";
const EVENT_GAME_STARTED = "GameStarted";
const EVENT_GAME_RESULT_SUBMITTED = "GameResultSubmitted";
const EVENT_GAME_RESULT_CONFIRMED = "GameResultConfirmed";
const EVENT_GAME_ABORTED = "GameAborted";

const SPORTS = [
  { value: "pickleball", label: "Pickleball" },
  { value: "badminton", label: "Badminton" },
  { value: "tennis", label: "Tennis" },
  { value: "pingpong", label: "Pingpong" },
] as const;

const SPORT_IMAGES: Record<string, string> = {
  badminton: "/images/badminton.png",
  pickleball: "/images/pickleball.png",
  tennis: "/images/tennis.png",
  pingpong: "/images/ping-pong.png",
};

// Sport accent colors (projects-list style): Orange=badminton, Yellow=pickleball, Green=tennis, Red=pingpong
const SPORT_COLORS: Record<string, { border: string; bg: string; badge: string; text: string }> = {
  badminton: {
    border: "border-orange-500",
    bg: "bg-orange-50",
    badge: "bg-orange-100 text-orange-700 border-orange-200",
    text: "text-orange-700",
  },
  pickleball: {
    border: "border-amber-400",
    bg: "bg-amber-50",
    badge: "bg-amber-100 text-amber-800 border-amber-200",
    text: "text-amber-800",
  },
  tennis: {
    border: "border-emerald-500",
    bg: "bg-emerald-50",
    badge: "bg-emerald-100 text-emerald-700 border-emerald-200",
    text: "text-emerald-700",
  },
  pingpong: {
    border: "border-red-500",
    bg: "bg-red-50",
    badge: "bg-red-100 text-red-700 border-red-200",
    text: "text-red-700",
  },
};

type Player = {
  user_id: number;
  name: string;
  full_name?: string | null;
  nickname?: string | null;
  avatar_seed?: string | null;
  tier?: number;
  global_rating?: number;
};

type Participant = {
  user_id: number;
  invitation_responded_at?: string | null;
  result?: string | null;
  confirmed_at?: string | null;
  user?: { id: number; name: string; avatar_seed?: string | null };
};

type Game = {
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
  winners?: { id: number; name: string }[];
  participants: Participant[];
  stats_applied_at?: string | null;
  facility_id?: number;
};

export default function FacilityGameRoomPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [facilityName, setFacilityName] = useState<string | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [completedGames, setCompletedGames] = useState<Game[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [createLoading, setCreateLoading] = useState(false);
  const [error, setError] = useState("");
  const { showToast } = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedSport, setSelectedSport] = useState<string>("pickleball");
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<number[]>([]);
  const [createGameSearchQuery, setCreateGameSearchQuery] = useState("");
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [respondingGameId, setRespondingGameId] = useState<number | null>(null);
  const [startingGameId, setStartingGameId] = useState<number | null>(null);
  const [abortingGameId, setAbortingGameId] = useState<number | null>(null);
  const [abortConfirmGameId, setAbortConfirmGameId] = useState<number | null>(null);
  const [editInviteModalGame, setEditInviteModalGame] = useState<Game | null>(null);
  const [editInvitePlayerIds, setEditInvitePlayerIds] = useState<number[]>([]);
  const [editInviteSearchQuery, setEditInviteSearchQuery] = useState("");
  const [editingInvitesGameId, setEditingInvitesGameId] = useState<number | null>(null);
  const [finishGameModalGame, setFinishGameModalGame] = useState<Game | null>(null);
  const [finishResults, setFinishResults] = useState<Record<number, "win" | "loss">>({});
  const [finishWinScore, setFinishWinScore] = useState("");
  const [finishLoseScore, setFinishLoseScore] = useState("");
  const [finishMatchType, setFinishMatchType] = useState("");
  const [finishSubmittingGameId, setFinishSubmittingGameId] = useState<number | null>(null);
  const [confirmingGameId, setConfirmingGameId] = useState<number | null>(null);
  const [leavingGameId, setLeavingGameId] = useState<number | null>(null);
  const [isRefreshingPlayers, setIsRefreshingPlayers] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isNotFound, setIsNotFound] = useState(false);
  const [showAllPlayers, setShowAllPlayers] = useState(false);
  const [activePlayersSearchQuery, setActivePlayersSearchQuery] = useState("");
  const [inviteModalGame, setInviteModalGame] = useState<Game | null>(null);
  const invitedModalAutoShownRef = useRef(false);
  const realtimeReconcileTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const realtimeRetryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [realtimeInitTick, setRealtimeInitTick] = useState(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined" && id) {
      const stored = sessionStorage.getItem(`facility_${id}_name`);
      if (stored) setFacilityName(stored);
    }
  }, [id]);

  // Request notification permission so we can show "Game invite" when user is in another tab
  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    if (Notification.permission === "default") {
      Notification.requestPermission().catch(() => {});
    }
  }, []);

  useEffect(() => {
    if (!currentUserId || !games.length || invitedModalAutoShownRef.current) return;
    const first = games.find(isInvitedToGame);
    if (first) {
      setInviteModalGame(first);
      invitedModalAutoShownRef.current = true;
    }
  }, [games, currentUserId]);

  // Real-time: subscribe to Reverb for game invite, confirmation, start, result.
  // Use /me with current token to get user id for the user channel so it always matches the auth token (avoids 403).
  const echoCleanupRef = useRef<(() => void) | null>(null);
  useEffect(() => {
    if (!mounted || typeof window === "undefined" || !id) return;
    let cancelled = false;
    const facilityIdNum = parseInt(id, 10);
    // Channel names without "private-" — Echo's .private() adds that prefix when subscribing.
    const facilityChannel = `facility.${id}`;
    const scheduleRealtimeReconcile = (delayMs = 250) => {
      if (realtimeReconcileTimeoutRef.current) {
        clearTimeout(realtimeReconcileTimeoutRef.current);
      }
      realtimeReconcileTimeoutRef.current = setTimeout(() => {
        realtimeReconcileTimeoutRef.current = null;
        fetchData();
      }, delayMs);
    };

    const scheduleRealtimeRetry = (delayMs = 2000) => {
      if (cancelled) return;
      if (realtimeRetryTimeoutRef.current) return;
      realtimeRetryTimeoutRef.current = setTimeout(() => {
        realtimeRetryTimeoutRef.current = null;
        if (!cancelled) {
          setRealtimeInitTick((v) => v + 1);
        }
      }, delayMs);
    };

    const token = getAuthToken();
    if (!token) {
      scheduleRealtimeRetry(1200);
      return () => {
        cancelled = true;
        if (realtimeReconcileTimeoutRef.current) {
          clearTimeout(realtimeReconcileTimeoutRef.current);
          realtimeReconcileTimeoutRef.current = null;
        }
        if (realtimeRetryTimeoutRef.current) {
          clearTimeout(realtimeRetryTimeoutRef.current);
          realtimeRetryTimeoutRef.current = null;
        }
        if (echoCleanupRef.current) {
          echoCleanupRef.current();
        }
      };
    }

    (async () => {
      const authUserId = currentUserId;
      if (authUserId == null || cancelled) {
        scheduleRealtimeRetry();
        return;
      }

      // Before getEcho - Temporary debug - remove after fixing
      console.log("[Echo Debug] token present:", !!token, "userId:", currentUserId);
      const echo = getEcho(token);
      console.log("[Echo Debug] getEcho returned:", echo ? "Echo instance" : "null");
     
      if (!echo || cancelled) {
        scheduleRealtimeRetry();
        return;
      }

      const userChannel = `App.Models.User.${authUserId}`;

      // Laravel broadcasts event "App.Events.GameInvited" on private channel App.Models.User.{id}
      console.log("[Echo Debug] Subscribing to private channel:", userChannel);
      echo.private(userChannel)
        .listen(EVENT_GAME_INVITED, (payload: { game?: Game }) => {
          logger.debug("GameInvited received", {
            hasGame: Boolean(payload?.game),
            facilityId: (payload?.game as Game)?.facility_id,
            currentFacilityId: facilityIdNum,
          });
          const raw = payload?.game;
          if (!raw || Number((raw as Game).facility_id) !== facilityIdNum) return;
          const game = normalizeGameFromBroadcast(raw as Game);
          // Show invitation pop-up modal in real-time
          setInviteModalGame(game);
          setGames((prev) => {
            const idx = prev.findIndex((g) => g.id === game.id);
            if (idx >= 0) {
              const next = [...prev];
              next[idx] = game;
              return next;
            }
            return [game, ...prev];
          });
          scheduleRealtimeReconcile();
          // Push notification to the invited user (always when permitted, so they see it even if tab is focused)
          if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
            const creatorName = game.creator?.name ?? "Someone";
            const sportLabel = getSportLabel(game.sport);
            const n = new Notification("Game invite", {
              body: `${creatorName} invited you to a game of ${sportLabel}`,
              icon: SPORT_IMAGES[game.sport] ?? "/images/pickleball.png",
              tag: `game-invite-${game.id}`,
            });
            n.onclick = () => {
              window.focus();
              n.close();
            };
          }
        });

      const handleInvitationResponded = (payload: { game?: Game; action?: string; declined_user?: { id: number; name: string }; left_user?: { id: number; name: string } }) => {
        const raw = payload?.game;
        if (!raw || Number((raw as Game).facility_id) !== facilityIdNum) return;
        const game = normalizeGameFromBroadcast(raw as Game);
        const creatorId = game.creator_id ?? (game.creator as { id?: number })?.id;
        const isCreator = authUserId != null && creatorId != null && Number(authUserId) === Number(creatorId);

        // Notify game creator when an invited player declines
        const action = payload?.action ?? (payload as Record<string, unknown>)?.action;
        const declinedUser = payload?.declined_user ?? (payload as Record<string, unknown>)?.declined_user as { id?: number; name?: string } | undefined;
        const leftUser = payload?.left_user;
        if (action === "decline" && declinedUser && isCreator) {
          const name = declinedUser.name ?? "A player";
          showToast(`${name} declined your game invitation`, "error");
        }
        if (action === "leave" && leftUser && isCreator) {
          const name = leftUser.name ?? "A player";
          showToast(`${name} left the game`, "error");
        }

        const isInvolved = Boolean(game.participants?.some((p) => p.user_id === authUserId)) || creatorId === authUserId;
        if (!isInvolved) {
          // If user is no longer a participant (e.g. declined), remove stale card immediately.
          setGames((prev) => prev.filter((g) => g.id !== game.id));
          setInviteModalGame((prev) => (prev?.id === game.id ? null : prev));
          scheduleRealtimeReconcile();
          return;
        }

        setGames((prev) => {
          const idx = prev.findIndex((g) => g.id === game.id);
          if (idx >= 0) {
            const next = [...prev];
            next[idx] = game;
            return next;
          }
          return [game, ...prev];
        });
        // Reconcile authoritative server state so creator view always reflects completed confirmations.
        scheduleRealtimeReconcile();
      };

      const handleGameAborted = (payload: { game_id?: number; facility_id?: number }) => {
        const gameId = Number(payload?.game_id);
        const payloadFacilityId = Number(payload?.facility_id);
        if (!Number.isFinite(gameId) || !Number.isFinite(payloadFacilityId) || payloadFacilityId !== facilityIdNum) {
          return;
        }
        setGames((prev) => prev.filter((g) => g.id !== gameId));
        setInviteModalGame((prev) => (prev?.id === gameId ? null : prev));
        setEditInviteModalGame((prev) => (prev?.id === gameId ? null : prev));
        setAbortConfirmGameId((prev) => (prev === gameId ? null : prev));
        scheduleRealtimeReconcile();
      };

      console.log("[Echo Debug] Subscribing to private channel:", facilityChannel);
      echo.private(facilityChannel)
        .listen(EVENT_GAME_CREATED, (payload: { game?: Game }) => {
          const raw = payload?.game;
          if (!raw || Number((raw as Game).facility_id) !== facilityIdNum) return;
          const game = normalizeGameFromBroadcast(raw as Game);
          const isInvolved = Boolean(game.participants?.some((p) => p.user_id === authUserId)) || game.creator_id === authUserId;
          const isPublicActive = game.status === "awaiting_confirmation";
          if (!isInvolved && !isPublicActive) return;
          setGames((prev) => {
            const idx = prev.findIndex((g) => g.id === game.id);
            if (idx >= 0) {
              const next = [...prev];
              next[idx] = game;
              return next;
            }
            return [game, ...prev];
          });
          scheduleRealtimeReconcile();

          // Fallback path: if private invite event is missed, still open invite modal from GameCreated.
          // Only show to actual invitees (must be in participants) - prevents non-invited players from receiving invitation.
          const myParticipant = game.participants?.find((p) => p.user_id === authUserId);
          const isInvitedPending = myParticipant != null
            && (game.creator_id ?? game.creator?.id) !== authUserId
            && myParticipant.invitation_responded_at == null;
          if (isInvitedPending) {
            setInviteModalGame(game);
          }
        })
        .listen(EVENT_GAME_INVITATION_RESPONDED, handleInvitationResponded)
        .listen(EVENT_GAME_INVITATION_RESPONDED_ALT, handleInvitationResponded)
        .listen(EVENT_GAME_STARTED, (payload: { game?: Game }) => {
          const raw = payload?.game;
          if (!raw || Number((raw as Game).facility_id) !== facilityIdNum) return;
          const game = normalizeGameFromBroadcast(raw as Game);
          const isInvolved = Boolean(game.participants?.some((p) => p.user_id === authUserId)) || game.creator_id === authUserId;
          const isPublicActive = game.status === "ongoing";
          if (!isInvolved && !isPublicActive) return;

          setGames((prev) => {
            const idx = prev.findIndex((g) => g.id === game.id);
            if (idx >= 0) {
              const next = [...prev];
              next[idx] = game;
              return next;
            }
            return [game, ...prev];
          });
          scheduleRealtimeReconcile();
        })
        .listen(EVENT_GAME_RESULT_SUBMITTED, (payload: { game?: Game }) => {
          const raw = payload?.game;
          if (!raw || Number((raw as Game).facility_id) !== facilityIdNum) return;
          const game = normalizeGameFromBroadcast(raw as Game);
          const isInvolved = Boolean(game.participants?.some((p) => p.user_id === authUserId)) || game.creator_id === authUserId;
          if (!isInvolved) return;

          setGames((prev) => {
            const idx = prev.findIndex((g) => g.id === game.id);
            if (idx >= 0) {
              const next = [...prev];
              next[idx] = game;
              return next;
            }
            return [game, ...prev];
          });
          scheduleRealtimeReconcile();
        })
        .listen(EVENT_GAME_RESULT_CONFIRMED, (payload: { game?: Game }) => {
          const raw = payload?.game;
          if (!raw || Number((raw as Game).facility_id) !== facilityIdNum) return;
          const game = normalizeGameFromBroadcast(raw as Game);
          const isInvolved = Boolean(game.participants?.some((p) => p.user_id === authUserId)) || game.creator_id === authUserId;

          if (game.status === "completed") {
            setGames((prev) => prev.filter((g) => g.id !== game.id));
            if (isInvolved) {
              setCompletedGames((prev) => {
                const idx = prev.findIndex((g) => g.id === game.id);
                if (idx >= 0) {
                  const next = [...prev];
                  next[idx] = game;
                  return next;
                }
                return [game, ...prev];
              });
            }
            scheduleRealtimeReconcile();
            return;
          }

          if (!isInvolved) return;

          setGames((prev) => {
            const idx = prev.findIndex((g) => g.id === game.id);
            if (idx >= 0) {
              const next = [...prev];
              next[idx] = game;
              return next;
            }
            return [game, ...prev];
          });
          scheduleRealtimeReconcile();
        })
        .listen(EVENT_GAME_ABORTED, handleGameAborted);

      echo.private(userChannel)
        .listen(EVENT_GAME_INVITATION_RESPONDED, handleInvitationResponded)
        .listen(EVENT_GAME_INVITATION_RESPONDED_ALT, handleInvitationResponded)
        .listen(EVENT_GAME_ABORTED, handleGameAborted);

      if (cancelled) {
        echo.leave(userChannel);
        echo.leave(facilityChannel);
      } else {
        echoCleanupRef.current = () => {
          echo.leave(userChannel);
          echo.leave(facilityChannel);
          echoCleanupRef.current = null;
        };
      }
    })();

    return () => {
      cancelled = true;
      if (realtimeReconcileTimeoutRef.current) {
        clearTimeout(realtimeReconcileTimeoutRef.current);
        realtimeReconcileTimeoutRef.current = null;
      }
      if (realtimeRetryTimeoutRef.current) {
        clearTimeout(realtimeRetryTimeoutRef.current);
        realtimeRetryTimeoutRef.current = null;
      }
      if (echoCleanupRef.current) {
        echoCleanupRef.current();
      }
    };
  }, [mounted, id, currentUserId, realtimeInitTick, showToast]);

  function fetchData(): Promise<void> {
    const authToken = getAuthToken();
    if (!authToken) {
      router.push(`/login?returnUrl=${encodeURIComponent(`/facility/${id}/room`)}`);
      return Promise.resolve();
    }

    const headers = { Authorization: `Bearer ${authToken}` };

    return Promise.all([
      fetch(`${API_URL}/api/me`, { headers }),
      fetch(`${API_URL}/api/facilities/${id}/players`, { headers, cache: "no-store" }),
      fetch(`${API_URL}/api/games?facility_id=${id}`, { headers }),
      fetch(`${API_URL}/api/games?facility_id=${id}&status=completed`, { headers }),
    ])
      .then(async ([meRes, playersRes, gamesRes, completedRes]) => {
        if (playersRes.status === 404 || gamesRes.status === 404) {
          setIsNotFound(true);
          return;
        }
        const meData = meRes.ok ? await meRes.json() : null;
        const playersData = playersRes.ok ? await playersRes.json() : null;
        const gamesData = gamesRes.ok ? await gamesRes.json() : null;
        const completedData = completedRes.ok ? await completedRes.json() : null;
        const me = meData?.data?.user ?? meData?.user ?? meData;
        setCurrentUserId(me?.id ?? null);
        const rawPlayers = Array.isArray(playersData?.data)
          ? playersData.data
          : Array.isArray(playersData)
            ? playersData
            : [];
        setPlayers(
          rawPlayers.map((p: Record<string, unknown>) => ({
            user_id: p.user_id as number,
            name: (p.name as string) ?? `Player ${p.user_id}`,
            nickname: p.nickname as string | null | undefined,
            avatar_seed: p.avatar_seed as string | null | undefined,
            tier: typeof p.tier === "number" ? p.tier : typeof p.tier === "string" ? parseInt(String(p.tier), 10) : undefined,
            global_rating:
              typeof p.global_rating === "number"
                ? p.global_rating
                : typeof p.global_rating === "string"
                  ? parseInt(String(p.global_rating), 10)
                  : undefined,
          }))
        );
        setGames(
          Array.isArray(gamesData?.data)
            ? gamesData.data
            : Array.isArray(gamesData)
              ? gamesData
              : []
        );
        setCompletedGames(
          Array.isArray(completedData?.data)
            ? completedData.data
            : Array.isArray(completedData)
              ? completedData
              : []
        );
      })
      .catch((err) => {
        if (err?.digest === "NEXT_NOT_FOUND") throw err;
        setError("Could not load data.");
      })
      .finally(() => setIsLoading(false));
  }

  async function handleRefreshPlayers() {
    if (isRefreshingPlayers) return;
    setIsRefreshingPlayers(true);
    try {
      await Promise.all([
        fetchData(),
        new Promise((resolve) => setTimeout(resolve, 1000)),
      ]);
    } finally {
      setIsRefreshingPlayers(false);
    }
  }

  /** Creator can start when at least one invitee has accepted. Non-responders are auto-removed on start. */
  function isCreatorAndAllAccepted(game: Game): boolean {
    if (currentUserId == null) return false;
    const creatorId = game.creator_id ?? game.creator?.id;
    if (creatorId !== currentUserId) return false;
    if (game.status !== "awaiting_confirmation") return false;
    const participants = game.participants ?? [];
    const acceptedCount = participants.filter((p) => p.invitation_responded_at != null).length;
    return acceptedCount >= 2; // creator (auto-accepted) + at least 1 invited player accepted
  }

  function isInvitedToGame(game: Game): boolean {
    if (currentUserId == null) return false;
    const creatorId = game.creator_id ?? game.creator?.id;
    if (creatorId === currentUserId) return false;
    const myParticipant = game.participants?.find((p) => p.user_id === currentUserId);
    return Boolean(myParticipant && myParticipant.invitation_responded_at == null);
  }

  async function handleRespondToInvitation(gameId: number, action: "accept" | "decline") {
    if (respondingGameId !== null) return;
    const authToken = getAuthToken();
    if (!authToken) return;
    setRespondingGameId(gameId);
    setError("");
    try {
      const res = await fetch(`${API_URL}/api/games/${gameId}/respond`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ action }),
      });
      if (res.status === 401) {
        router.push(`/login?returnUrl=${encodeURIComponent(`/facility/${id}/room`)}`);
        return;
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.message || "Could not respond to invitation.");
        return;
      }
      showToast("Invitation responded", "success");
      setInviteModalGame((prev) => (prev?.id === gameId ? null : prev));
      fetchData();
    } catch {
      setError("Network error.");
    } finally {
      setRespondingGameId(null);
    }
  }

  async function handleLeaveGame(gameId: number) {
    if (leavingGameId !== null) return;
    const authToken = getAuthToken();
    if (!authToken) return;
    setLeavingGameId(gameId);
    setError("");
    try {
      const res = await fetch(`${API_URL}/api/games/${gameId}/leave`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({}),
      });
      if (res.status === 401) {
        router.push(`/login?returnUrl=${encodeURIComponent(`/facility/${id}/room`)}`);
        return;
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data?.message || "Could not leave game.");
        return;
      }
      const data = await res.json().catch(() => ({}));
      const updatedGameRaw = data?.data?.game;
      if (updatedGameRaw) {
        const updatedGame = normalizeGameFromBroadcast(updatedGameRaw as Game);
        setGames((prev) => {
          const idx = prev.findIndex((g) => g.id === updatedGame.id);
          if (idx >= 0) {
            const next = [...prev];
            next[idx] = updatedGame;
            return next;
          }
          return [updatedGame, ...prev];
        });
      } else {
        setGames((prev) => prev.filter((g) => g.id !== gameId));
      }
      showToast("You left the game", "success");
      fetchData();
    } catch {
      setError("Network error.");
    } finally {
      setLeavingGameId(null);
    }
  }

  async function handleStartGame(gameId: number) {
    if (startingGameId !== null) return;
    const authToken = getAuthToken();
    if (!authToken) return;
    setStartingGameId(gameId);
    setError("");
    try {
      const res = await fetch(`${API_URL}/api/games/${gameId}/start`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({}),
      });
      if (res.status === 401) {
        router.push(`/login?returnUrl=${encodeURIComponent(`/facility/${id}/room`)}`);
        return;
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.message || "Could not start game.");
        return;
      }
      const data = await res.json().catch(() => ({}));
      const startedGameRaw = data?.data?.game;
      if (startedGameRaw) {
        const startedGame = normalizeGameFromBroadcast(startedGameRaw as Game);
        setGames((prev) => {
          const idx = prev.findIndex((g) => g.id === startedGame.id);
          if (idx >= 0) {
            const next = [...prev];
            next[idx] = startedGame;
            return next;
          }
          return [startedGame, ...prev];
        });
      }
      showToast("Game started", "success");
      fetchData();
    } catch {
      setError("Network error.");
    } finally {
      setStartingGameId(null);
    }
  }

  function isCreator(game: Game): boolean {
    if (currentUserId == null) return false;
    const creatorId = game.creator_id ?? game.creator?.id;
    return creatorId === currentUserId;
  }

  function openAbortConfirmModal(gameId: number) {
    setAbortConfirmGameId(gameId);
    setError("");
  }

  function closeAbortConfirmModal() {
    setAbortConfirmGameId(null);
    setError("");
  }

  async function handleAbortGame(gameId: number) {
    if (abortingGameId !== null) return;
    const authToken = getAuthToken();
    if (!authToken) return;
    setAbortingGameId(gameId);
    setError("");
    try {
      const res = await fetch(`${API_URL}/api/games/${gameId}/abort`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({}),
      });
      if (res.status === 401) {
        router.push(`/login?returnUrl=${encodeURIComponent(`/facility/${id}/room`)}`);
        return;
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.message || "Could not abort game.");
        return;
      }
      setGames((prev) => prev.filter((g) => g.id !== gameId));
      setInviteModalGame((prev) => (prev?.id === gameId ? null : prev));
      setEditInviteModalGame((prev) => (prev?.id === gameId ? null : prev));
      showToast("Game aborted", "success");
      fetchData();
    } catch {
      setError("Network error.");
    } finally {
      setAbortingGameId(null);
    }
  }

  async function confirmAbortGame() {
    const gameId = abortConfirmGameId;
    if (gameId == null) return;
    closeAbortConfirmModal();
    await handleAbortGame(gameId);
  }

  function openEditInviteModal(game: Game) {
    const creatorId = game.creator_id ?? game.creator?.id;
    const selected = (game.participants ?? [])
      .map((p) => p.user_id)
      .filter((userId) => userId !== creatorId);
    setEditInviteModalGame(game);
    setEditInvitePlayerIds(Array.from(new Set(selected)));
    setEditInviteSearchQuery("");
    setError("");
  }

  function closeEditInviteModal() {
    setEditInviteModalGame(null);
    setEditInvitePlayerIds([]);
    setEditInviteSearchQuery("");
    setError("");
  }

  function toggleEditInvitePlayer(userId: number) {
    setEditInvitePlayerIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  }

  async function handleEditInvitesSubmit() {
    const game = editInviteModalGame;
    if (!game || editingInvitesGameId !== null) return;
    const authToken = getAuthToken();
    if (!authToken) {
      router.push(`/login?returnUrl=${encodeURIComponent(`/facility/${id}/room`)}`);
      return;
    }

    setEditingInvitesGameId(game.id);
    setError("");
    try {
      const res = await fetch(`${API_URL}/api/games/${game.id}/invite`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ user_ids: editInvitePlayerIds }),
      });
      if (res.status === 401) {
        router.push(`/login?returnUrl=${encodeURIComponent(`/facility/${id}/room`)}`);
        return;
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data?.message || "Could not update invited players.");
        return;
      }

      const data = await res.json().catch(() => ({}));
      const updatedGameRaw = data?.data?.game;
      if (updatedGameRaw) {
        const updatedGame = normalizeGameFromBroadcast(updatedGameRaw as Game);
        setGames((prev) => {
          const idx = prev.findIndex((g) => g.id === updatedGame.id);
          if (idx >= 0) {
            const next = [...prev];
            next[idx] = updatedGame;
            return next;
          }
          return [updatedGame, ...prev];
        });
      }

      closeEditInviteModal();
      showToast("Invited players updated", "success");
      fetchData();
    } catch {
      setError("Network error.");
    } finally {
      setEditingInvitesGameId(null);
    }
  }

  useEffect(() => {
    if (!id) return;

    // First check if facility exists (same as facility page) — 404 for e.g. /facility/5555/room
    fetch(`${API_URL}/api/facilities/check/${id}`)
      .then((checkRes) => {
        if (checkRes.status === 404) {
          setIsNotFound(true);
          setIsLoading(false);
          return;
        }
        fetchData();
      })
      .catch(() => setError("Could not load data."));
  }, [id]);

  function openCreateGameModal() {
    setError("");
    setSelectedSport("pickleball");
    setSelectedPlayerIds([]);
    setCreateGameSearchQuery("");
    setModalOpen(true);
  }

  function openFinishGameModal(game: Game) {
    setError("");
    const participants = game.participants ?? [];
    const initial: Record<number, "win" | "loss"> = {};
    participants.forEach((p, i) => {
      initial[p.user_id] = i === 0 ? "win" : "loss";
    });
    setFinishResults(initial);
    let existingScore: number[] = [];
    if (Array.isArray(game.score)) {
      existingScore = game.score;
    } else if (typeof game.score === "string") {
      try {
        const parsed = JSON.parse(game.score) as unknown;
        if (Array.isArray(parsed)) {
          existingScore = parsed
            .map((value) => Number(value))
            .filter((value) => Number.isFinite(value));
        }
      } catch {
        existingScore = [];
      }
    }
    setFinishWinScore(
      existingScore[0] != null && Number.isFinite(existingScore[0]) ? String(existingScore[0]) : ""
    );
    setFinishLoseScore(
      existingScore[1] != null && Number.isFinite(existingScore[1]) ? String(existingScore[1]) : ""
    );
    setFinishMatchType(game.match_type ?? "");
    setFinishGameModalGame(game);
  }

  function closeFinishGameModal() {
    setFinishGameModalGame(null);
    setFinishResults({});
    setFinishWinScore("");
    setFinishLoseScore("");
    setFinishMatchType("");
    setError("");
  }

  function togglePlayerInvite(userId: number) {
    setSelectedPlayerIds((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  }

  async function handleCreateGameSubmit() {
    if (createLoading) return;

    if (!selectedSport?.trim()) {
      showToast("Please select a game type.", "error");
      return;
    }
    if (selectedPlayerIds.length === 0) {
      showToast("Please select at least one player to invite.", "error");
      return;
    }

    setCreateLoading(true);
    setError("");
    const authToken = getAuthToken();
    if (!authToken) {
      router.push(`/login?returnUrl=${encodeURIComponent(`/facility/${id}/room`)}`);
      return;
    }

    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${authToken}`,
    };

    try {
      const createRes = await fetch(`${API_URL}/api/games`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          facility_id: parseInt(id, 10),
          sport: selectedSport,
          user_ids: selectedPlayerIds,
        }),
      });
      const createData = await createRes.json().catch(() => ({}));

      if (createRes.status === 401) {
        router.push(`/login?returnUrl=${encodeURIComponent(`/facility/${id}/room`)}`);
        return;
      }

      if (!createRes.ok) {
        setError(createData.message || "Could not create game.");
        return;
      }

      setModalOpen(false);
      showToast("Game created", "success");
      fetchData();
    } catch {
      setError("Network error.");
    } finally {
      setCreateLoading(false);
    }
  }

  async function handleFinishGameSubmit() {
    if (finishSubmittingGameId !== null) return;
    const game = finishGameModalGame;
    if (!game) return;
    const authToken = getAuthToken();
    if (!authToken) {
      router.push(`/login?returnUrl=${encodeURIComponent(`/facility/${id}/room`)}`);
      return;
    }
    const participants = game.participants ?? [];
    const results = participants.map((p) => ({
      user_id: p.user_id,
      result: finishResults[p.user_id],
    }));
    const allSelected = participants.every((p) => finishResults[p.user_id] != null);
    if (!allSelected) {
      setError("Select win or loss for each player.");
      return;
    }
    if (finishWinScore.trim() === "" || finishLoseScore.trim() === "") {
      setError("Please enter both win and lose scores.");
      return;
    }
    const winScore = Number(finishWinScore);
    const loseScore = Number(finishLoseScore);
    if (!Number.isInteger(winScore) || !Number.isInteger(loseScore) || winScore < 0 || loseScore < 0) {
      setError("Score must be a whole number (0 or higher).");
      return;
    }
    if (!finishMatchType.trim()) {
      setError("Please enter the match type.");
      return;
    }
    setFinishSubmittingGameId(game.id);
    setError("");
    try {
      const res = await fetch(`${API_URL}/api/games/${game.id}/result`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          results,
          score: [winScore, loseScore],
          match_type: finishMatchType.trim(),
        }),
      });
      if (res.status === 401) {
        router.push(`/login?returnUrl=${encodeURIComponent(`/facility/${id}/room`)}`);
        return;
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const msg =
          data?.message ||
          (data?.errors && typeof data.errors === "object"
            ? Object.values(data.errors).flat().join(" ")
            : null) ||
          "Could not submit result.";
        setError(msg);
        return;
      }
      const data = await res.json().catch(() => ({}));
      const finishedGameRaw = data?.data?.game;
      if (finishedGameRaw) {
        const finishedGame = normalizeGameFromBroadcast(finishedGameRaw as Game);
        setGames((prev) => {
          const idx = prev.findIndex((g) => g.id === finishedGame.id);
          if (idx >= 0) {
            const next = [...prev];
            next[idx] = finishedGame;
            return next;
          }
          return [finishedGame, ...prev];
        });
      }
      closeFinishGameModal();
      showToast("Result submitted", "success");
      fetchData();
    } catch {
      setError("Network error.");
    } finally {
      setFinishSubmittingGameId(null);
    }
  }

  function canConfirmResult(game: Game): boolean {
    if (currentUserId == null) return false;
    if (game.status !== "awaiting_result_confirmation") return false;
    const myParticipant = game.participants?.find((p) => p.user_id === currentUserId);
    return Boolean(myParticipant && myParticipant.confirmed_at == null);
  }

  async function handleConfirmResult(gameId: number) {
    if (confirmingGameId !== null) return;
    const authToken = getAuthToken();
    if (!authToken) return;
    setConfirmingGameId(gameId);
    setError("");
    try {
      const res = await fetch(`${API_URL}/api/games/${gameId}/confirm`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({}),
      });
      if (res.status === 401) {
        router.push(`/login?returnUrl=${encodeURIComponent(`/facility/${id}/room`)}`);
        return;
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.message || "Could not confirm result.");
        return;
      }
      showToast("Result confirmed", "success");
      fetchData();
    } catch {
      setError("Network error.");
    } finally {
      setConfirmingGameId(null);
    }
  }

  function getSportLabel(sport: string): string {
    const s = SPORTS.find((x) => x.value === sport);
    return s ? s.label : sport.charAt(0).toUpperCase() + sport.slice(1);
  }

  /** Normalize game payload from Laravel broadcast (may use snake_case / nested relations). */
  function normalizeGameFromBroadcast(raw: Game): Game {
    const creator = raw.creator ?? (raw as unknown as { creator?: { id: number; name: string } }).creator;
    const creatorNorm =
      creator && typeof creator === "object" && "id" in creator && "name" in creator
        ? { id: Number(creator.id), name: String(creator.name) }
        : undefined;
    return {
      id: Number(raw.id),
      sport: String(raw.sport),
      status: String(raw.status),
      facility_id: raw.facility_id != null ? Number(raw.facility_id) : undefined,
      creator_id: raw.creator_id != null ? Number(raw.creator_id) : undefined,
      creator: creatorNorm,
      participants: Array.isArray(raw.participants) ? raw.participants : [],
      created_at: raw.created_at,
      start_time: raw.start_time,
      end_time: raw.end_time,
      score: raw.score,
      match_type: raw.match_type ?? (raw as unknown as { matchType?: string | null }).matchType ?? null,
      stats_applied_at: raw.stats_applied_at,
      winners: raw.winners,
    };
  }

  function getSportColors(sport: string) {
    return SPORT_COLORS[sport] ?? {
      border: "border-l-gray-400",
      bg: "bg-gray-50",
      badge: "bg-gray-100 text-gray-700 border-gray-200",
      text: "text-gray-700",
    };
  }

  function getStatusBadge(status: string) {
    const map: Record<string, { className: string; label: string }> = {
      awaiting_confirmation: { className: "bg-yellow-100 text-yellow-700", label: "Pending" },
      ongoing: { className: "bg-blue-100 text-blue-700", label: "Game Started" },
      awaiting_result_confirmation: { className: "bg-amber-100 text-amber-700", label: "Confirming" },
      completed: { className: "bg-emerald-100 text-emerald-700", label: "Completed" },
    };
    return map[status] ?? { className: "bg-gray-100 text-gray-700", label: status };
  }

  // Call notFound() during render so Next.js catches it (async callbacks can't trigger it)
  if (isNotFound) notFound();

  const isCurrentUserCheckedIn =
    currentUserId != null && players.some((p) => p.user_id === currentUserId);

  function getCompletedAt(game: Game): Date | null {
    const raw = game.end_time ?? game.created_at;
    if (!raw) return null;
    const parsed = new Date(raw);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  function isSameLocalDay(a: Date, b: Date): boolean {
    return (
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate()
    );
  }

  const today = new Date();
  const completedGamesToday = completedGames
    .filter((game) => {
      const completedAt = getCompletedAt(game);
      return completedAt != null && isSameLocalDay(completedAt, today);
    })
    .slice()
    .sort((a, b) => {
      const aTime = getCompletedAt(a)?.getTime() ?? 0;
      const bTime = getCompletedAt(b)?.getTime() ?? 0;
      return bTime - aTime;
    });

  return (
    <div className="relative min-h-screen -mx-4 overflow-hidden">
      {/* Same gradient background as dashboard / facility */}
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
              href={`/facility/${id}`}
              className="text-xs font-normal uppercase leading-tight tracking-wider text-zinc-500 hover:text-zinc-800 transition-colors flex items-center gap-1"
            >
              ← Facility
            </Link>
          </nav>

          {error && (
            <div
              className={cn(
                "transition-all duration-700 delay-75",
                mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              )}
            >
              <InlineError message={error} />
            </div>
          )}

          {isLoading ? (
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
          ) : (
        <>
          {/* Header — Facility info (same as dashboard/facility) */}
          <header
            className={cn(
              "space-y-1 transition-all duration-700 delay-75",
              mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            )}
          >
            <span className="text-md font-normal text-zinc-400">Game Room</span>
            <h1 className="text-2xl font-bold text-zinc-900 leading-6">
              {facilityName ?? "Game Room"}
            </h1>
            <div className="flex justify-between items-center gap-2 flex-wrap">
              <p className="text-sm text-zinc-400 flex items-center gap-1.5 mt-2">
                <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full inline-block animate-pulse" />
                {players.length} player{players.length !== 1 ? "s" : ""} checked in
              </p>
              <Link
                href={`/facility/${id}`}
                className="flex gap-1 text-sm font-medium text-amber-600 active:text-amber-700 active:scale-105 transition-all duration-200 items-center"
              >
                <Trophy className="w-3 h-3 shrink-0" aria-hidden />
                Leaderboard
                <ArrowRight className="w-3 h-3 shrink-0" aria-hidden />
              </Link>
            </div>
          </header>

          {/* Active Players */}
          <section
            className={cn(
              "space-y-3 transition-all duration-700 delay-100 mt-12",
              mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            )}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-zinc-700">Active Players</h2>
              {/* add a refresh button to reload the active users.-ml-px mr-2*/}
              <button
                type="button"
                className="flex items-center cursor-pointer uppercase tracking-wider gap-2 ml-2 text-xs font-normal text-green-600 hover:text-green-700 transition-colors disabled:cursor-not-allowed disabled:opacity-60"
                onClick={handleRefreshPlayers}
                disabled={isRefreshingPlayers}
                aria-busy={isRefreshingPlayers}
              >
                <RefreshCcw
                  className={cn("w-3.5 h-3.5", isRefreshingPlayers && "animate-spin")}
                  aria-hidden
                />
                {isRefreshingPlayers ? "Refreshing..." : "Refresh"}
              </button>
            </div>
            {players.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-zinc-300/80 bg-white/40 min-h-[100px] flex items-center justify-center p-6">
                <p className="text-sm text-zinc-500/60">No players checked in.</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="relative">
                  <Search
                    className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400"
                    aria-hidden
                  />
                  <input
                    type="search"
                    value={activePlayersSearchQuery}
                    onChange={(e) => setActivePlayersSearchQuery(e.target.value)}
                    placeholder="Search players by name…"
                    className="w-full rounded-xl border border-zinc-200/80 bg-white pl-9 pr-9 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-colors"
                    aria-label="Search active players by name"
                  />
                  {activePlayersSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setActivePlayersSearchQuery("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                      aria-label="Clear search"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <div className="max-h-[350px] overflow-y-auto grid grid-cols-1 gap-2 space-y-1">
                {(() => {
                  const q = activePlayersSearchQuery.trim().toLowerCase();
                  const filtered = q
                    ? players.filter((p) => {
                        const name = (p.nickname?.trim() ?? p.name ?? "").toLowerCase();
                        return name.includes(q);
                      })
                    : players;
                  const toShow = showAllPlayers ? filtered : filtered.slice(0, ACTIVE_PLAYERS_PREVIEW_COUNT);
                  if (filtered.length === 0) {
                    return (
                      <div className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50/50 py-6 text-center">
                        <p className="text-sm text-zinc-500">No matching players</p>
                        <p className="text-xs text-zinc-400 mt-1">Try a different search</p>
                      </div>
                    );
                  }
                  return (
                    <>
                      {toShow.map((p) => (
                        <div key={p.user_id} className="p-2 shadow-sm w-full border border-zinc-200/80 bg-linear-to-bl from-green-50 via-green-500/20 to-green-50 rounded-lg flex items-start justify-between gap-2">
                          <div className="flex items-start gap-2 flex-1 min-w-0">
                            <UserAvatar
                              key={p.user_id}
                              name={p.name || `Player ${p.user_id}`}
                              avatarSeed={p.avatar_seed}
                              size={35}
                            />
                            <div className="flex flex-col items-start justify-start flex-1 min-w-0">
                              <p className="w-full text-sm font-semibold text-zinc-700 truncate drop-shadow-sm">
                                {p.nickname?.trim() ?? p.name}
                              </p>
                              <span className="flex items-center gap-1">
                                <Trophy className="w-3 h-3 text-amber-500 shrink-0" aria-hidden />
                                <span className="text-xs uppercase tracking-widest font-normal text-amber-500">Tier {p.tier ?? "—"}</span>
                              </span>
                              {games.some(
                                (g) =>
                                  g.status === "ongoing" &&
                                  (g.participants ?? []).some((part) => part.user_id === p.user_id)
                              ) && (
                                <span className="flex items-center gap-1">
                                  <Gamepad2 className="w-3 h-3 text-green-700 shrink-0" aria-hidden />
                                  <span className="flex items-center gap-0 [&>svg+svg]:-ml-3">
                                    <span className="text-xs font-normal text-green-700 tracking-wider">Currently playing</span>
                                    <span className="flex items-end gap-0 [&>svg+svg]:-ml-3">
                                      <Dot className="w-5 h-5 text-green-700 shrink-0 dot-pulse-1" aria-hidden />
                                      <Dot className="w-5 h-5 text-green-700 shrink-0 dot-pulse-2" aria-hidden />
                                      <Dot className="w-5 h-5 text-green-700 shrink-0 dot-pulse-3" aria-hidden />
                                    </span>
                                  </span>
                                </span>
                              )}
                            </div>
                          </div>
                          <span className="shrink-0 flex flex-col items-center gap-1">
                            <span className="text-xs tabular-nums font-normal tracking-wider text-zinc-600 drop-shadow-sm">Skills Level</span>
                            <span className="text-xl font-bold tracking-wider text-zinc-600 drop-shadow-sm">
                              {p.global_rating != null ? p.global_rating.toLocaleString() : "—"}
                            </span>
                          </span>
                        </div>
                      ))}
                      {filtered.length > ACTIVE_PLAYERS_PREVIEW_COUNT && (
                        <div className="w-full aspect-square max-w-[80px] mx-auto flex items-center justify-center">
                          <button
                            type="button"
                            onClick={() => setShowAllPlayers((prev) => !prev)}
                            className="aspect-square bg-zinc-50 p-2 text-center rounded-full border-2 border-dashed border-zinc-200 text-zinc-500 text-xs font-medium hover:border-zinc-300 hover:text-zinc-700 hover:bg-zinc-100 transition-colors"
                            aria-label={showAllPlayers ? "View fewer players" : "See all players"}
                          >
                            {showAllPlayers ? "View Less" : "View All"}
                          </button>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
              </div>
            )}
          </section>

          {/* Active Games */}
          <section
            className={cn(
              "space-y-3 transition-all duration-700 delay-150 mt-8",
              mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            )}
          >
            <h2 className="text-sm font-semibold text-zinc-700">Active Games</h2>
            {games.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-zinc-300/80 bg-white/40 min-h-[100px] flex items-center justify-center p-6">
                <p className="text-sm text-zinc-500/60">No active games.</p>
              </div>
            ) : (
              <div>
                        
                <div className="grid grid-cols-1 gap-3">
                  {[...games]
                    .sort((a, b) => {
                      const aIsParticipant = (a.participants ?? []).some((p) => p.user_id === currentUserId);
                      const bIsParticipant = (b.participants ?? []).some((p) => p.user_id === currentUserId);
                      if (aIsParticipant && !bIsParticipant) return -1;
                      if (!aIsParticipant && bIsParticipant) return 1;
                      return 0;
                    })
                    .map((g) => {
                      const isUserParticipant = (g.participants ?? []).some((p) => p.user_id === currentUserId);
                      if (!isUserParticipant) {
                        const statusBadge = getStatusBadge(g.status);
                        const durationLabel = (() => {
                          const refTime = g.status === "ongoing" ? g.start_time : g.created_at;
                          if (!refTime) return "—";
                          const ref = new Date(refTime);
                          if (Number.isNaN(ref.getTime())) return "—";
                          const diffMs = Date.now() - ref.getTime();
                          if (diffMs < 0) return "—";
                          const totalMinutes = Math.floor(diffMs / 60000);
                          const hours = Math.floor(totalMinutes / 60);
                          const minutes = totalMinutes % 60;
                          if (hours === 0 && minutes === 0) return "<1m";
                          if (hours === 0) return `${minutes}m`;
                          if (minutes === 0) return `${hours}h`;
                          return `${hours}h ${minutes}m`;
                        })();
                        return (
                          <div
                            key={g.id}
                            className="text-zinc-700 rounded-lg bg-white/70 border border-zic-500 transition-all duration-300 ease-out hover:bg-zinc-100 hover:-translate-y-0.5 shadow"
                          >
                            <div className="flex">
                              <div
                                className="w-21 h-auto shrink-0 rounded-l-lg bg-zinc-100"
                                style={{
                                  backgroundImage: `url(${SPORT_IMAGES[g.sport] ?? ""})`,
                                  backgroundSize: "cover",
                                  backgroundPosition: "left",
                                  backgroundRepeat: "no-repeat",
                                }}
                              />
                              <div className="flex flex-col w-full min-w-0">
                                <div className="flex items-center justify-between gap-2 px-3 pt-3 pb-2">
                                  <div className="flex items-center gap-1.5 min-w-0 flex-1">
                                    {(g.participants ?? []).map((p) => (
                                      <UserAvatar
                                        key={p.user_id}
                                        name={p.user?.name ?? `Player ${p.user_id}`}
                                        avatarSeed={p.user?.avatar_seed}
                                        size={48}
                                        className="shrink-0 border-2 border-zinc-300/80"
                                      />
                                    ))}
                                  </div>
                                  <span
                                    className={cn(
                                      "shrink-0 rounded-full px-2 py-0.5 text-xs font-medium",
                                      `${statusBadge.label === "Game Started" ? "bg-red-400 text-white" : statusBadge.className}`
                                    )}
                                  >
                                    {statusBadge.label === "Game Started" ? "Game ongoing" : statusBadge.label}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1 px-3 pb-3 text-zinc-500">
                                  <Clock className="size-3 shrink-0" aria-hidden />
                                  <span className="text-[0.75rem]">{durationLabel}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      }
                      const invited = isInvitedToGame(g);
                      const responding = respondingGameId === g.id;
                      const showStart = isCreatorAndAllAccepted(g);
                      const starting = startingGameId === g.id;
                      const showAbort = isCreator(g) && (g.status === "awaiting_confirmation" || g.status === "ongoing");
                      const showEditInvites = isCreator(g) && g.status === "awaiting_confirmation";
                      const showFinish = isCreator(g) && g.status === "ongoing";
                      const showLeaveGame = !isCreator(g) && (g.status === "awaiting_confirmation" || g.status === "ongoing") && (g.participants ?? []).some((p) => p.user_id === currentUserId);
                      const showConfirmResult = canConfirmResult(g);
                      const aborting = abortingGameId === g.id;
                      const leaving = leavingGameId === g.id;
                      const finishing = finishSubmittingGameId === g.id;
                      const confirming = confirmingGameId === g.id;
                      const statusBadge = getStatusBadge(g.status);
                      const sportColors = getSportColors(g.sport);
                      const participantsWithStatus = (g.participants ?? []).map((p) => {
                        const name = p.user?.name ?? `Player ${p.user_id}`;
                        const isYou = p.user_id === currentUserId;
                        let status: "awaiting_confirmation" | "confirmed" = "confirmed";
                        if (g.status === "awaiting_confirmation") {
                          status = p.invitation_responded_at != null ? "confirmed" : "awaiting_confirmation";
                        } else if (g.status === "awaiting_result_confirmation") {
                          status = p.confirmed_at != null ? "confirmed" : "awaiting_confirmation";
                        }
                        return {
                          user_id: p.user_id,
                          name,
                          avatar_seed: p.user?.avatar_seed,
                          isYou,
                          status,
                          result: p.result ?? null,
                        };
                      });
                      const confirmResultMessage =
                        g.status === "awaiting_result_confirmation"
                          ? showConfirmResult
                            ? "Confirm your result above."
                            : "Waiting for others to confirm."
                          : "—";
                      return (
                        <GameCard
                          key={g.id}
                          game={g}
                          participantsWithStatus={participantsWithStatus}
                          statusBadge={statusBadge}
                          sportColors={sportColors}
                          sportLabel={getSportLabel(g.sport)}
                          invited={invited}
                          responding={responding}
                          showStart={showStart}
                          starting={starting}
                          showAbort={showAbort}
                          aborting={aborting}
                          showLeaveGame={showLeaveGame}
                          leaving={leaving}
                          showEditInvites={showEditInvites}
                          showFinish={showFinish}
                          finishing={finishing}
                          showConfirmResult={showConfirmResult}
                          confirming={confirming}
                          confirmResultMessage={confirmResultMessage}
                          onRespondAccept={() => handleRespondToInvitation(g.id, "accept")}
                          onRespondDecline={() => handleRespondToInvitation(g.id, "decline")}
                          onStartGame={() => handleStartGame(g.id)}
                          onAbortGame={() => openAbortConfirmModal(g.id)}
                          onLeaveGame={() => handleLeaveGame(g.id)}
                          onEditInvites={() => openEditInviteModal(g)}
                          onOpenFinishModal={() => openFinishGameModal(g)}
                          onConfirmResult={() => handleConfirmResult(g.id)}
                        />
                      );
                    })}
                </div>
              </div>
            )}
          </section>

          {/* Create Game FAB — emerald to match dashboard */}
          <div className="group fixed bottom-12 right-4 z-50 flex items-center justify-end gap-2">
            <div className="relative flex items-center">
              {!isCurrentUserCheckedIn && (
                <div
                  className="z-50 absolute text-xs right-full top-1/2 mr-3 -translate-y-1/2 whitespace-nowrap rounded-lg bg-amber-200/90 px-3 py-2 font-normal text-gray-800 shadow-md transition-opacity duration-200 drop-shadow-sm group-hover:opacity-100 group-focus-within:opacity-100"
                  role="tooltip"
                  aria-live="polite"
                >
                    You are not checked in the court today.<br />
                    Check in now to start joining/creating games.    
                  <span
                    className="absolute -right-2 top-1/2 h-0 w-0 -translate-y-1/2 border-y-8 border-l-8 border-r-0 border-l-amber-50 border-y-transparent"
                    aria-hidden
                  />
                  <span
                    className="absolute -right-[7px] top-1/2 h-0 w-0 -translate-y-1/2 border-y-[7px] border-l-[7px] border-r-0 border-l-amber-200/90 border-y-transparent"
                    aria-hidden
                  />
                </div>
              )}
              <button
                type="button"
                onClick={openCreateGameModal}
                disabled={createLoading || !isCurrentUserCheckedIn}
                aria-busy={createLoading}
                aria-label="Create game"
                title={!isCurrentUserCheckedIn ? "You must check-in to the facility to create game" : undefined}
                className="disabled:bg-gray-400/90 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg shadow-emerald-500/25 transition-all duration-200 hover:scale-105 hover:shadow-emerald-500/35 active:scale-95 disabled:cursor-not-allowed"
              >
                <Plus className="size-7 shrink-0" aria-hidden />
              </button>
            </div>
          </div>

          <section
            className={cn(
              "space-y-3 transition-all duration-700 delay-200 mt-8",
              mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            )}
          >
            <h2 className="text-sm font-semibold text-zinc-700">
              Your Completed Games
            </h2>
            <div className="overflow-hidden rounded-lg shadow-sm bg-zinc-50/60 transition-all duration-300 ease-out">
              <div className="max-h-[330px] overflow-y-auto transition-all duration-300 ease-out [scrollbar-width:none] hover:[scrollbar-width:none] [&::-webkit-scrollbar]:w-0 hover:[&::-webkit-scrollbar]:w-0 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-zinc-300 hover:[&::-webkit-scrollbar-thumb]:bg-zinc-400">
                <div className="space-y-3 text-left text-xs sm:text-sm">
                  {completedGamesToday.length === 0 ? (
                    <div className="px-3 py-4 text-center text-zinc-400/80 text-sm">
                      No completed games yet today.
                    </div>
                  ) : (
                    completedGamesToday.map((g) => {
                      const durationLabel = (() => {
                        if (!g.start_time || !g.end_time) return "—";
                        const start = new Date(g.start_time);
                        const end = new Date(g.end_time);
                        if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
                          return "—";
                        }
                        const diffMs = end.getTime() - start.getTime();
                        if (diffMs <= 0) return "—";
                        const totalMinutes = Math.floor(diffMs / 60000);
                        const hours = Math.floor(totalMinutes / 60);
                        const minutes = totalMinutes % 60;
                        if (hours === 0 && minutes === 0) return "<1m";
                        if (hours === 0) return `${minutes}m`;
                        if (minutes === 0) return `${hours}h`;
                        return `${hours}h ${minutes}m`;
                      })();
                      const scoreParts = (() => {
                        const toPair = (value: unknown): readonly [number, number] | null => {
                          if (!Array.isArray(value) || value.length < 2) return null;
                          const left = Number(value[0]);
                          const right = Number(value[1]);
                          if (!Number.isFinite(left) || !Number.isFinite(right)) return null;
                          return [left, right] as const;
                        };

                        const fromArray = toPair(g.score);
                        if (fromArray) return fromArray;

                        if (typeof g.score !== "string" || g.score.trim() === "") return null;
                        const raw = g.score.trim();

                        // API can return a JSON string score, e.g. "[21,16]".
                        try {
                          const parsed = JSON.parse(raw) as unknown;
                          const fromJson = toPair(parsed);
                          if (fromJson) return fromJson;
                        } catch {}

                        // Fallback for plain text formats: "21/16", "21-16", "21,16".
                        const cleaned = raw.replace(/\s+/g, "");
                        const match = cleaned.match(/^(-?\d+)[\/,\-](-?\d+)$/);
                        if (!match) return null;
                        const left = Number(match[1]);
                        const right = Number(match[2]);
                        if (!Number.isFinite(left) || !Number.isFinite(right)) return null;
                        return [left, right] as const;
                      })();
                      const creatorLabel = g.creator?.name?.trim() || "Someone";
                      const matchTypeLabel = g.match_type?.trim() || "—";

                      return (
                        <div
                          key={g.id}
                          className="text-zinc-700 rounded-lg bg-white/70 border border-zinc-200 transition-all duration-300 ease-out hover:bg-zinc-100 hover:-translate-y-0.5 hover:shadow-sm"
                        >
                          <div className="flex">
                              {/* Sport image */}
                              <div
                                className="w-21 h-auto shrink-0 rounded-l-lg"
                                // make the sport image as the background of the cell
                                style={{
                                  backgroundImage: `url(${SPORT_IMAGES[g.sport]})`,
                                  backgroundSize: "cover",
                                  backgroundPosition: "left",
                                  backgroundRepeat: "no-repeat",
                                }}
                            />
                            <div className="flex flex-col w-full">
                              <div className="flex gap-1">
                                {/* Game players */}
                                <div className="min-w-0 flex-1 whitespace-nowrap px-3 pt-4">
                                  <div className="flex items-center gap-1">
                                    {(() => {
                                      const winnerIds = new Set((g.winners ?? []).map((w) => w.id));
                                      const winners = g.participants.filter((p) =>
                                        winnerIds.has(p.user?.id ?? p.user_id)
                                      );
                                      const losers = g.participants.filter(
                                        (p) => !winnerIds.has(p.user?.id ?? p.user_id)
                                      );
                                      const matchType = (g.match_type ?? "").toLowerCase();
                                      const isDoublesGame =
                                        matchType.includes("double") ||
                                        (winners.length === 2 && losers.length === 2);

                                      const renderAvatar = (p: Participant, isWinner: boolean) => (
                                        <div
                                          key={`${isWinner ? "w" : "l"}-${p.user_id}`}
                                          className={cn(
                                            "shrink-0 overflow-hidden rounded-full border-2",
                                            isWinner
                                              ? "border-emerald-500"
                                              : "border-red-500/90"
                                          )}
                                          title={p.user?.name ?? `Player ${p.user_id}`}
                                        >
                                          <UserAvatar
                                            name={p.user?.name ?? `Player ${p.user_id}`}
                                            avatarSeed={p.user?.avatar_seed}
                                            size={32}
                                            className="border-0"
                                          />
                                        </div>
                                      );

                                      return (
                                        <>
                                          <div
                                            className={cn(
                                              "flex items-center",
                                              isDoublesGame ? "-space-x-2" : "gap-1"
                                            )}
                                          >
                                            {winners.map((p) => renderAvatar(p, true))}
                                          </div>
                                          {winners.length > 0 && losers.length > 0 ? (
                                            <span className="text-[10px] font-bold tracking-wide text-zinc-500">
                                              VS
                                            </span>
                                          ) : null}
                                          <div
                                            className={cn(
                                              "flex items-center",
                                              isDoublesGame ? "-space-x-2" : "gap-2"
                                            )}
                                          >
                                            {losers.map((p) => renderAvatar(p, false))}
                                          </div>
                                        </>
                                      );
                                    })()}
                                  </div>
                                </div>
                                {/* Score */}
                                <div className="whitespace-nowrap items-start justify-center py-2">
                                  <div className="flex flex-col items-center gap-1 justify-end">
                                    <span className="text-[0.5rem] text-zinc-400 uppercase tracking-widest">Score</span>
                                    <span>
                                      {scoreParts ? (
                                        <>
                                          <span
                                            className={cn(
                                              scoreParts[0] > scoreParts[1]
                                                ? "text-emerald-600 font-semibold text-[14px]"
                                                : scoreParts[0] < scoreParts[1]
                                                  ? "text-red-500 font-semibold text-[14px]"
                                                  : "text-zinc-700 font-semibold text-[14px]"
                                            )}
                                          >
                                            {scoreParts[0]}
                                          </span>
                                          <span className="text-zinc-400 px-0.5">/</span>
                                          <span
                                            className={cn(
                                              scoreParts[1] > scoreParts[0]
                                                ? "text-emerald-600 font-semibold text-[14px]"
                                                : scoreParts[1] < scoreParts[0]
                                                  ? "text-red-500 font-semibold text-[14px]"
                                                  : "text-zinc-700 font-semibold text-[14px]"
                                            )}
                                          >
                                            {scoreParts[1]}
                                          </span>
                                        </>
                                      ) : (
                                        "—"
                                      )}
                                    </span>
                                  </div>
                                </div>
                                {/* Duration */}
                                <div className="whitespace-nowrap text-right pr-3 pl-1 py-2">
                                  <div className="flex flex-col items-center gap-1 justify-end">
                                    <span className="text-[0.5rem] text-zinc-400 uppercase tracking-widest">Duration</span>
                                    <span className="text-zinc-700 text-[14px] font-semibold flex items-center gap-1">
                                      {durationLabel !== "—" && (
                                        <>
                                          <Clock className="size-2.5 shrink-0" aria-hidden />
                                        </>
                                      )}
                                      <span className="text-zinc-700 text-[0.8rem] font-semibold">
                                        {durationLabel}
                                      </span>
                                    </span>
                                  </div>
                                </div>
                              </div>
                              {/* Game details */}
                              <div className="pl-4 mb-3 mt-3 min-w-0 flex flex-col items-start text-[0.65rem] text-zinc-500">
                                <span>
                                  <span className="text-zinc-400 italic">Organized by:</span>{" "}
                                  <span className="text-zinc-700 font-semibold">{creatorLabel}</span>
                                </span>
                                <span>
                                  <span className="text-zinc-400 italic">Game Details:</span>{" "}
                                  <span className="text-zinc-700 font-semibold">{matchTypeLabel}</span>
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </section>
        </>
          )}

        <GameInviteModal
          open={inviteModalGame != null}
          game={inviteModalGame}
          sportLabel={inviteModalGame ? getSportLabel(inviteModalGame.sport) : undefined}
          sportImageUrl={
            inviteModalGame
              ? SPORT_IMAGES[inviteModalGame.sport] ?? `/images/${inviteModalGame.sport}.png`
              : undefined
          }
          onAccept={() => inviteModalGame && handleRespondToInvitation(inviteModalGame.id, "accept")}
          onDecline={() => inviteModalGame && handleRespondToInvitation(inviteModalGame.id, "decline")}
          onClose={() => setInviteModalGame(null)}
          responding={respondingGameId !== null && inviteModalGame?.id === respondingGameId}
        />

        {abortConfirmGameId != null && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
            role="dialog"
            aria-modal="true"
            aria-labelledby="abort-game-modal-title"
            onClick={() => closeAbortConfirmModal()}
          >
            <div
              className="w-full max-w-sm rounded-2xl bg-white/95 backdrop-blur-sm shadow-xl border border-zinc-200/80 p-4 sm:p-5"
              onClick={(e) => e.stopPropagation()}
            >
              <h2
                id="abort-game-modal-title"
                className="text-lg font-semibold text-zinc-900 mb-2"
              >
                Abort game?
              </h2>
              <p className="text-sm text-zinc-600 mb-5">
                This will cancel the game and remove it from the room. This cannot be undone.
              </p>
              <div className="flex gap-2 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={closeAbortConfirmModal}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={confirmAbortGame}
                >
                  Abort game
                </Button>
              </div>
            </div>
          </div>
        )}

        {editInviteModalGame && (() => {
          const creatorId = editInviteModalGame.creator_id ?? editInviteModalGame.creator?.id;
          const existingParticipants = (editInviteModalGame.participants ?? [])
            .filter((p) => p.user_id !== creatorId)
            .map((p) => ({ user_id: p.user_id, name: p.user?.name ?? `Player ${p.user_id}` }));
          const candidateMap = new Map<number, Player>();
          for (const p of players) {
            if (p.user_id !== creatorId) candidateMap.set(p.user_id, p);
          }
          for (const p of existingParticipants) {
            if (!candidateMap.has(p.user_id)) candidateMap.set(p.user_id, p);
          }
          const candidates = Array.from(candidateMap.values());
          const query = editInviteSearchQuery.trim().toLowerCase();
          const filteredCandidates = query
            ? candidates.filter((p) => p.name.toLowerCase().includes(query))
            : candidates;
          const isSubmitting = editingInvitesGameId === editInviteModalGame.id;

          return (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
              role="dialog"
              aria-modal="true"
              aria-labelledby="edit-invites-modal-title"
              onClick={() => !isSubmitting && closeEditInviteModal()}
            >
              <div
                className="w-full max-w-md rounded-2xl bg-white/95 backdrop-blur-sm shadow-2xl border border-zinc-200/80 overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-zinc-100">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
                      <Pencil className="h-5 w-5" aria-hidden />
                    </div>
                    <div>
                      <h2 id="edit-invites-modal-title" className="text-lg font-semibold text-zinc-900">
                        Edit invited players
                      </h2>
                      <p className="text-xs text-zinc-500 mt-0.5">
                        Update who should be invited to this game
                      </p>
                    </div>
                  </div>
                </div>

                <div className="px-5 py-4 space-y-4 max-h-[65vh] overflow-y-auto">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-zinc-700">Players</span>
                  </div>

                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" aria-hidden />
                    <input
                      type="search"
                      value={editInviteSearchQuery}
                      onChange={(e) => setEditInviteSearchQuery(e.target.value)}
                      placeholder="Search by name..."
                      className="w-full rounded-xl border border-zinc-200/80 bg-white pl-9 pr-3 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-colors"
                    />
                  </div>

                  {filteredCandidates.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50/50 py-6 text-center">
                      <p className="text-sm text-zinc-500">No matching players</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-zinc-100 max-h-56 overflow-y-auto">
                      {filteredCandidates.map((p) => {
                        const isSelected = editInvitePlayerIds.includes(p.user_id);
                        return (
                          <label
                            key={p.user_id}
                            className={cn(
                              "flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-colors",
                              isSelected ? "bg-emerald-200/60" : "hover:bg-white/60"
                            )}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleEditInvitePlayer(p.user_id)}
                              className="sr-only"
                            />
                            <UserAvatar
                              name={p.name}
                              avatarSeed={p.avatar_seed}
                              size={24}
                            />
                            <span className="flex-1 text-sm font-medium text-zinc-900 truncate">{p.name}</span>
                            <div
                              className={cn(
                                "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-all",
                                isSelected ? "border-emerald-500 bg-emerald-500 text-white" : "border-zinc-300 bg-white"
                              )}
                            >
                              {isSelected && (
                                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  )}
                  <p className="text-xs text-right text-zinc-500">
                    {editInvitePlayerIds.length} player{editInvitePlayerIds.length !== 1 ? "s" : ""} selected
                  </p>
                </div>

                <div className="flex gap-3 px-5 py-4 bg-zinc-50/50 border-t border-zinc-100">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={closeEditInviteModal}
                    disabled={isSubmitting}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    onClick={handleEditInvitesSubmit}
                    disabled={isSubmitting}
                    aria-busy={isSubmitting}
                    className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                        Saving...
                      </>
                    ) : (
                      "Save invites"
                    )}
                  </Button>
                </div>
              </div>
            </div>
          );
        })()}

        {modalOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-game-modal-title"
            onClick={() => !createLoading && setModalOpen(false)}
          >
            <div
              className="w-full max-w-md rounded-2xl bg-white/95 backdrop-blur-sm shadow-2xl border border-zinc-200/80 overflow-hidden animate-in zoom-in fade-in duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-zinc-100">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center text-emerald-500">
                    <Gamepad2 className="h-10 w-10" aria-hidden />
                  </div>
                  <div>
                    <h2
                      id="create-game-modal-title"
                      className="text-lg font-semibold text-zinc-900"
                    >
                      Create New Game
                    </h2>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      Organize game & invite players
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => !createLoading && setModalOpen(false)}
                  disabled={createLoading}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="px-5 py-4 space-y-5 max-h-[70vh] overflow-y-auto">
                {/* Sport selection */}
                <section>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-emerald-600 font-bold bg-emerald-100 border border-emerald-600/60 rounded-full w-7 h-7 flex items-center justify-center">1</span>
                    <span className="text-md font-semibold text-zinc-600">
                        Select Game
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {SPORTS.map((sport) => {
                      const colors = getSportColors(sport.value);
                      const isSelected = selectedSport === sport.value;
                      const sportImage =
                        SPORT_IMAGES[sport.value] ?? `/images/${sport.value}.png`;
                      return (
                        <div
                          key={sport.value}
                          role="button"
                          tabIndex={0}
                          onClick={() => setSelectedSport(sport.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              setSelectedSport(sport.value);
                            }
                          }}
                          className={cn(
                            "relative rounded-xl h-16 overflow-hidden transition-all duration-200 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2",
                            isSelected
                              ? `ring-2 ${colors.border} shadow-md`
                              : "border-2 border-zinc-200 hover:border-zinc-300 hover:shadow-sm opacity-75 hover:opacity-100 active:opacity-100 grayscale-75 hover:grayscale-0 active:grayscale-0"
                          )}
                          aria-pressed={isSelected}
                          aria-label={`Select ${sport.label}`}
                        >
                          <div className="relative w-full h-16 bg-zinc-100">
                            <Image
                              src={sportImage}
                              alt={sport.label}
                              fill
                              sizes="(max-width: 640px) 50vw, 80px"
                              className="object-cover"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>

                {/* Invite players — only those checked in at this facility */}
                <section className="mt-8">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-emerald-600 font-bold bg-emerald-100 border border-emerald-600/60 rounded-full w-8 h-8 flex items-center justify-center">2</span>
                    <span className="text-md font-semibold text-zinc-600">
                      Invite players
                    </span>
                  </div>
                  {players.length > 0 ? (
                    <>
                      <div className="relative mb-4">
                        <Search
                          className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400"
                          aria-hidden
                        />
                        <input
                          type="search"
                          value={createGameSearchQuery}
                          onChange={(e) => setCreateGameSearchQuery(e.target.value)}
                          placeholder="Search by name…"
                          className="w-full rounded-xl border border-zinc-200/80 bg-white pl-9 pr-3 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-colors"
                          aria-label="Search players by name"
                        />
                        {createGameSearchQuery && (
                          <button
                            type="button"
                            onClick={() => setCreateGameSearchQuery("")}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                            aria-label="Clear search"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                      {(() => {
                        const q = createGameSearchQuery.trim().toLowerCase();
                        const filtered = q
                          ? players.filter((p) =>
                              p.name.toLowerCase().includes(q)
                            )
                          : players;
                        return filtered.length === 0 ? (
                          <div className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50/50 py-6 text-center">
                            <p className="text-sm text-zinc-500">
                              No matching players
                            </p>
                            <p className="text-xs text-zinc-400 mt-1">
                              Try a different search
                            </p>
                          </div>
                        ) : (
                          <div className="divide-y divide-zinc-100 max-h-44 overflow-y-auto">
                            {filtered.map((p) => {
                              const isCreator = p.user_id === currentUserId;
                              const isSelected = selectedPlayerIds.includes(
                                p.user_id
                              );
                              const rowContent = (
                                <>
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    disabled={isCreator}
                                    onChange={() => !isCreator && togglePlayerInvite(p.user_id)}
                                    className="sr-only"
                                    aria-disabled={isCreator}
                                  />
                                  <UserAvatar
                                    name={p.name}
                                    avatarSeed={p.avatar_seed}
                                    size={28}
                                  />
                                  <div className="flex flex-1 flex-col items-start">
                                    <span className="text-sm font-medium text-zinc-900 truncate">
                                      {p.name} 
                                    </span>
                                    {p.nickname != null && (
                                      <span className="text-xs text-zinc-500">
                                        {p.nickname}
                                      </span>
                                    )}
                                  </div>
                                  <div
                                    className={cn(
                                      "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-all",
                                      isSelected
                                        ? "border-emerald-500 bg-emerald-500 text-white"
                                        : "border-zinc-300 bg-white",
                                      isCreator && "opacity-50"
                                    )}
                                  >
                                    {isSelected && (
                                      <svg
                                        className="h-3 w-3"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                        strokeWidth={3}
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          d="M5 13l4 4L19 7"
                                        />
                                      </svg>
                                    )}
                                  </div>
                                </>
                              );
                              return isCreator ? (
                                <div
                                  key={p.user_id}
                                  className={cn(
                                    "flex items-center gap-3 px-3 py-2.5 transition-colors cursor-not-allowed opacity-80",
                                    "bg-zinc-200/60"
                                  )}
                                  aria-label={`${p.name} (creator)`}
                                >
                                  {rowContent}
                                </div>
                              ) : (
                                <label
                                  key={p.user_id}
                                  className={cn(
                                    "flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-colors",
                                    isSelected
                                      ? "bg-emerald-200/60"
                                      : "hover:bg-white/60"
                                  )}
                                >
                                  {rowContent}
                                </label>
                              );
                            })}
                          </div>
                        );
                      })()}
                    </>
                  ) : (
                    <div className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50/50 py-8 text-center">
                      <Users className="h-10 w-10 text-zinc-300 mx-auto mb-2" />
                      <p className="text-sm text-zinc-500">
                        No players checked in at this facility
                      </p>
                    </div>
                  )}
                  {players.length > 0 && selectedPlayerIds.length > 0 && (
                    <p className="text-xs text-right text-zinc-500 mt-2">
                      {selectedPlayerIds.length} player
                      {selectedPlayerIds.length !== 1 ? "s" : ""} selected
                    </p>
                  )}
                </section>

                {error && (
                  <div>
                    <InlineError message={error} />
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex gap-3 px-5 py-4 bg-zinc-50/50 border-t border-zinc-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setModalOpen(false)}
                  disabled={createLoading}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleCreateGameSubmit}
                  disabled={createLoading}
                  aria-busy={createLoading}
                  className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white shadow-md shadow-emerald-500/20"
                >
                  {createLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                      Creating…
                    </>
                  ) : (
                    "Create game"
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}

        {finishGameModalGame && (() => {
          const participants = finishGameModalGame.participants ?? [];
          const sportLabel = getSportLabel(finishGameModalGame.sport);
          const sportColors = SPORT_COLORS[finishGameModalGame.sport] ?? SPORT_COLORS.pickleball;
          const winCount = participants.filter((p) => finishResults[p.user_id] === "win").length;
          const lossCount = participants.filter((p) => finishResults[p.user_id] === "loss").length;
          const allAssigned = participants.every((p) => finishResults[p.user_id] != null);
          const summaryParts: string[] = [];
          if (winCount > 0) summaryParts.push(`${winCount} win${winCount !== 1 ? "s" : ""}`);
          if (lossCount > 0) summaryParts.push(`${lossCount} loss${lossCount !== 1 ? "es" : ""}`);
          const summaryText = summaryParts.length ? summaryParts.join(", ") : "Assign each player";
          return (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
              role="dialog"
              aria-modal="true"
              aria-labelledby="finish-game-modal-title"
              onClick={() =>
                finishSubmittingGameId === null && closeFinishGameModal()
              }
            >
              <div
                className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-zinc-200/90 overflow-hidden animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header with sport context */}
                <div className={cn("px-5 pt-5 pb-1", sportColors.bg, "border-b border-zinc-200/80")}>
                  <span
                    className={cn(
                      "inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full border mb-3",
                      sportColors.badge
                    )}
                  >
                    {sportLabel}
                  </span>
                  <h2
                    id="finish-game-modal-title"
                    className="text-xl font-semibold text-zinc-900"
                  >
                    Finish game
                  </h2>
                  <p className="text-sm text-zinc-600 mt-1">
                    Assign win or loss for each player.
                  </p>
                </div>

                {/* Player list with pill toggles */}
                <ul className="max-h-56 overflow-y-auto divide-y divide-zinc-100">
                  {participants.map((p) => {
                    const name = p.user?.name ?? `Player ${p.user_id}`;
                    const result = finishResults[p.user_id];
                    return (
                      <li
                        key={p.user_id}
                        className="flex items-center gap-2 px-5 py-3 hover:bg-zinc-50/80 transition-colors"
                      >
                        <UserAvatar
                          name={name}
                          avatarSeed={p.user?.avatar_seed}
                          size={28}
                        />
                        <span className="text-sm font-medium text-zinc-900 min-w-0 truncate flex-1">
                          {name}
                        </span>
                        <div
                          className="flex rounded-lg bg-zinc-100 p-0.5 shrink-0"
                          role="group"
                          aria-label={`Result for ${name}`}
                        >
                          {(["win", "loss"] as const).map((value) => (
                            <button
                              key={value}
                              type="button"
                              onClick={() =>
                                setFinishResults((prev) => ({
                                  ...prev,
                                  [p.user_id]: value,
                                }))
                              }
                              className={cn(
                                "px-3 py-1.5 text-xs font-medium rounded-md transition-all",
                                result === value
                                  ? value === "win"
                                    ? "bg-emerald-500 text-white shadow-sm"
                                    : "bg-red-500/90 text-white shadow-sm"
                                  : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/80"
                              )}
                            >
                              {value.charAt(0).toUpperCase() + value.slice(1)}
                            </button>
                          ))}
                        </div>
                      </li>
                    );
                  })}
                </ul>

                <div className="px-5 py-4 space-y-3 border-t border-zinc-100 bg-white">
                  <div>
                    <label
                      htmlFor="finish-match-type"
                      className="block text-xs font-medium text-zinc-600 mb-1"
                    >
                      Match type
                    </label>
                    <input
                      id="finish-match-type"
                      type="text"
                      value={finishMatchType}
                      onChange={(e) => setFinishMatchType(e.target.value)}
                      placeholder="e.g: 1st Set, 2nd set, final"
                      className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label
                        htmlFor="finish-win-score"
                        className="block text-xs font-medium text-zinc-600 mb-1"
                      >
                        Win score
                      </label>
                      <input
                        id="finish-win-score"
                        type="number"
                        min={0}
                        step={1}
                        inputMode="numeric"
                        value={finishWinScore}
                        onChange={(e) => setFinishWinScore(e.target.value)}
                        placeholder="21"
                        className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="finish-lose-score"
                        className="block text-xs font-medium text-zinc-600 mb-1"
                      >
                        Lose score
                      </label>
                      <input
                        id="finish-lose-score"
                        type="number"
                        min={0}
                        step={1}
                        inputMode="numeric"
                        value={finishLoseScore}
                        onChange={(e) => setFinishLoseScore(e.target.value)}
                        placeholder="15"
                        className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                      />
                    </div>
                  </div>
                </div>

                {/* Summary strip */}
                <div className="px-5 py-2.5 bg-zinc-50 border-t border-zinc-100 flex items-center justify-between gap-2">
                  <span className="text-xs text-zinc-500">
                    {allAssigned ? (
                      <span className="font-medium text-zinc-700">{summaryText}</span>
                    ) : (
                      "Select an outcome for every player"
                    )}
                  </span>
                </div>

                {error && (
                  <div className="px-5 pt-2">
                    <InlineError message={error} />
                  </div>
                )}

                {/* Footer */}
                <div className="flex gap-3 px-5 py-4 bg-white border-t border-zinc-100">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={closeFinishGameModal}
                    disabled={finishSubmittingGameId !== null}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    onClick={handleFinishGameSubmit}
                    disabled={
                      finishSubmittingGameId !== null || !allAssigned
                    }
                    aria-busy={finishSubmittingGameId === finishGameModalGame.id}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-500/20"
                  >
                    {finishSubmittingGameId === finishGameModalGame.id ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                        Submitting…
                      </>
                    ) : (
                      "Submit result"
                    )}
                  </Button>
                </div>
              </div>
            </div>
          );
        })()}
        </div>
      </div>
    </div>
  );
}
