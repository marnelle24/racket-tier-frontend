"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useToast } from "@/lib/toast-context";
import { InlineError } from "@/components/InlineError";
import { RacketTierLogo } from "@/components/RacketTierLogo";
import { QRScanner, parseFacilityTokenFromQR } from "@/components/QRScanner";
import { RecentFacilitiesList } from "@/components/RecentFacilitiesList";
import { Button } from "@/components/ui/button";
import { getAuthToken } from "@/lib/auth";
import {
  Building2,
  ChevronRight,
  Keyboard,
  QrCode,
  Search,
  X,
} from "lucide-react";
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

type JoinMode = "code" | "scan";
type FacilityTab = "recent" | "search";
type FacilityListItem = {
  facility_id: number;
  name: string;
  active_players: number;
};

function FacilityJoinFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fafafa]">
      <div className="animate-pulse text-zinc-400 text-sm">Loading…</div>
    </div>
  );
}

function FacilityJoinContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialMode = searchParams.get("mode") === "scan" ? "scan" : "code";
  const [mounted, setMounted] = useState(false);
  const [joinMode, setJoinMode] = useState<JoinMode>(initialMode);
  const [token, setToken] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [scannerKey, setScannerKey] = useState(0);
  const [facilityTab, setFacilityTab] = useState<FacilityTab>("recent");
  const [facilitySearch, setFacilitySearch] = useState("");
  const [searchFacilities, setSearchFacilities] = useState<FacilityListItem[]>([]);
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const [searchLoadError, setSearchLoadError] = useState("");
  const [searchPage, setSearchPage] = useState(1);
  const [hasMoreSearchFacilities, setHasMoreSearchFacilities] = useState(false);
  const [isCheckingPresence, setIsCheckingPresence] = useState(false);
  const [missingPresenceFacilityName, setMissingPresenceFacilityName] = useState("");
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const tokenInputRef = useRef<HTMLInputElement | null>(null);
  const { showToast } = useToast();

  useEffect(() => {
    setMounted(true);
  }, []);

  async function loadSearchFacilities({
    page,
    append,
    query,
  }: {
    page: number;
    append: boolean;
    query: string;
  }) {
    const authToken = getAuthToken();
    if (!authToken) {
      setSearchLoadError("Log in to search your checked-in facilities.");
      setSearchFacilities([]);
      setHasMoreSearchFacilities(false);
      return;
    }

    setIsSearchLoading(true);
    setSearchLoadError("");

    try {
      const params = new URLSearchParams({
        page: String(page),
        per_page: "10",
      });
      const trimmedQuery = query.trim();
      if (trimmedQuery !== "") {
        params.set("q", trimmedQuery);
      }

      const res = await fetch(`${API_URL}/api/facilities?${params.toString()}`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (!res.ok) throw new Error("Failed to load facilities");

      const json = await res.json();
      const payload = json?.data ?? {};
      const items = Array.isArray(payload?.items) ? payload.items : [];
      const pagination = payload?.pagination ?? {};
      const currentPage = Number(pagination.current_page ?? page);
      const lastPage = Number(pagination.last_page ?? currentPage);

      setSearchFacilities((prev) => {
        if (!append) return items;
        const seen = new Set(prev.map((f) => f.facility_id));
        const next = items.filter(
          (f: FacilityListItem) => !seen.has(f.facility_id)
        );
        return [...prev, ...next];
      });
      setSearchPage(currentPage);
      setHasMoreSearchFacilities(currentPage < lastPage);
    } catch {
      setSearchLoadError("Could not load facilities. Please try again.");
      if (!append) {
        setSearchFacilities([]);
        setHasMoreSearchFacilities(false);
      }
    } finally {
      setIsSearchLoading(false);
    }
  }

  const normalizedSearch = useMemo(() => facilitySearch.trim(), [facilitySearch]);

  useEffect(() => {
    if (facilityTab !== "search") return;
    const timeout = window.setTimeout(() => {
      void loadSearchFacilities({
        page: 1,
        append: false,
        query: normalizedSearch,
      });
    }, 250);
    return () => window.clearTimeout(timeout);
  }, [facilityTab, normalizedSearch]);

  useEffect(() => {
    if (
      facilityTab !== "search" ||
      !hasMoreSearchFacilities ||
      !loadMoreRef.current ||
      isSearchLoading
    ) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          void loadSearchFacilities({
            page: searchPage + 1,
            append: true,
            query: normalizedSearch,
          });
        }
      },
      { rootMargin: "120px 0px" }
    );

    observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [
    facilityTab,
    hasMoreSearchFacilities,
    isSearchLoading,
    normalizedSearch,
    searchPage,
  ]);

  async function joinWithToken(trimmed: string) {
    const authToken = getAuthToken();
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (authToken) headers["Authorization"] = `Bearer ${authToken}`;

    const res = await fetch(`${API_URL}/api/facilities/join`, {
      method: "POST",
      headers,
      body: JSON.stringify({ token: trimmed }),
    });

    const data = await res.json().catch(() => ({}));

    if (res.status === 401) {
      const returnUrl = "/facility/join";
      router.push(`/login?returnUrl=${encodeURIComponent(returnUrl)}`);
      return false;
    }

    if (!res.ok) {
      const msg =
        data.errors?.token?.[0] ||
        data.message ||
        "Could not join facility. Please check the code and try again.";
      setError(msg);
      return false;
    }

    const facility = data.facility ?? data.data?.facility;
    const facilityId = facility?.id;
    const facilityName = facility?.name;
    if (facilityId != null) {
      if (
        typeof window !== "undefined" &&
        facilityName != null &&
        facilityName !== ""
      ) {
        sessionStorage.setItem(
          `facility_${facilityId}_name`,
          String(facilityName)
        );
      }
      showToast("Joined facility", "success");
      router.push(`/facility/${facilityId}`);
      return true;
    }
    setError("Invalid response from server.");
    return false;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isLoading) return;
    setError("");
    setIsLoading(true);

    const trimmed = token.trim();
    if (!trimmed) {
      setError("Please enter a facility code.");
      setIsLoading(false);
      return;
    }

    await joinWithToken(trimmed);
    setIsLoading(false);
  }

  async function handleQRScan(scanned: string) {
    const parsed = parseFacilityTokenFromQR(scanned);
    if (!parsed) return;
    setError("");
    setIsLoading(true);
    await joinWithToken(parsed);
    setIsLoading(false);
  }

  async function handleSearchFacilitySelect(facility: FacilityListItem) {
    if (isCheckingPresence) return;

    const authToken = getAuthToken();
    if (!authToken) {
      const returnUrl = "/facility/join";
      router.push(`/login?returnUrl=${encodeURIComponent(returnUrl)}`);
      return;
    }

    setIsCheckingPresence(true);
    try {
      const res = await fetch(
        `${API_URL}/api/facilities/${facility.facility_id}/presence`,
        {
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );

      if (res.status === 401) {
        const returnUrl = "/facility/join";
        router.push(`/login?returnUrl=${encodeURIComponent(returnUrl)}`);
        return;
      }

      if (res.status === 404) {
        setMissingPresenceFacilityName(facility.name);
        return;
      }

      if (!res.ok) {
        showToast("Could not open facility right now.", "error");
        return;
      }

      router.push(`/facility/${facility.facility_id}`);
    } catch {
      showToast("Network error while checking facility access.", "error");
    } finally {
      setIsCheckingPresence(false);
    }
  }

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
              href="/dashboard"
              className="text-xs font-normal uppercase leading-tight tracking-wider text-zinc-500 hover:text-zinc-800 transition-colors flex items-center gap-1"
            >
              ← Dashboard
            </Link>
          </nav>

          <header
            className={cn(
              "space-y-1 transition-all duration-700 delay-75",
              mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            )}
          >
            <span className="text-md font-normal text-zinc-400">Facilities</span>
            <h1 className="text-2xl font-bold text-zinc-900 leading-6">
              Join a facility
            </h1>
            <p className="text-sm text-zinc-400 mt-2">
              Enter the facility code or scan the QR code at the venue.
            </p>
          </header>

          {/* Mode toggle */}
          <div
            className={cn(
              "flex rounded-2xl border border-zinc-200/80 bg-white/80 backdrop-blur-sm p-1.5 gap-1 transition-all duration-700 delay-100",
              mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            )}
          >
            <button
              type="button"
              onClick={() => setJoinMode("code")}
              className={cn(
                "flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-medium transition-all",
                joinMode === "code"
                  ? "bg-zinc-100 text-zinc-900 shadow-sm"
                  : "text-zinc-600 hover:text-zinc-800"
              )}
            >
              <Keyboard className="h-4 w-4" />
              Enter code
            </button>
            <button
              type="button"
              onClick={() => setJoinMode("scan")}
              className={cn(
                "flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-medium transition-all",
                joinMode === "scan"
                  ? "bg-zinc-100 text-zinc-900 shadow-sm"
                  : "text-zinc-600 hover:text-zinc-800"
              )}
            >
              <QrCode className="h-4 w-4" />
              Scan QR code
            </button>
          </div>

          {/* Content card - same style as dashboard cards */}
          <div
            className={cn(
              "rounded-2xl border border-zinc-200/80 bg-white/80 backdrop-blur-sm shadow-sm overflow-hidden transition-all duration-700 delay-150",
              mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            )}
          >
            <div className={cn(joinMode !== "code" && "hidden")}>
              <form
                onSubmit={handleSubmit}
                className="p-5 space-y-4"
                aria-busy={isLoading}
              >
                <div>
                  <label
                    htmlFor="facility-token"
                    className="block text-sm font-medium text-zinc-700 mb-1.5"
                  >
                    Facility code
                  </label>
                  <input
                    ref={tokenInputRef}
                    id="facility-token"
                    type="text"
                    value={token}
                    onChange={(e) => {
                      setToken(e.target.value);
                      setError("");
                    }}
                    required
                    autoComplete="off"
                    autoFocus={joinMode === "code"}
                    disabled={isLoading}
                    placeholder="e.g. abc123xyz..."
                    className="w-full rounded-xl border border-zinc-300 px-4 py-3 text-zinc-900 placeholder-zinc-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-70 disabled:cursor-not-allowed transition-colors"
                  />
                </div>
                {error && <InlineError message={error} />}
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl"
                >
                  {isLoading ? "Entering…" : "Enter Facility"}
                </Button>
              </form>
            </div>
            <div className={cn("p-5 space-y-4", joinMode !== "scan" && "hidden")}>
              <p className="text-sm text-zinc-600">
                Point your camera at the facility QR code to join automatically.
              </p>
              <QRScanner
                key={scannerKey}
                active={joinMode === "scan"}
                onScan={handleQRScan}
                onRetry={() => setScannerKey((k) => k + 1)}
                className="w-full"
              />
              {error && <InlineError message={error} />}
            </div>
          </div>

          {/* Facility tabs */}
          <div
            className={cn(
              "transition-all duration-700 delay-200",
              mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            )}
          >
            <div className="flex rounded-2xl border border-zinc-200/80 bg-white/80 backdrop-blur-sm p-1.5 gap-1">
              <button
                type="button"
                onClick={() => setFacilityTab("recent")}
                className={cn(
                  "flex-1 rounded-xl py-2.5 text-sm font-medium transition-all",
                  facilityTab === "recent"
                    ? "bg-zinc-100 text-zinc-900 shadow-sm"
                    : "text-zinc-600 hover:text-zinc-800"
                )}
              >
                Recently Checked-In
              </button>
              <button
                type="button"
                onClick={() => {
                  setFacilityTab("search");
                }}
                className={cn(
                  "flex-1 rounded-xl py-2.5 text-sm font-medium transition-all",
                  facilityTab === "search"
                    ? "bg-zinc-100 text-zinc-900 shadow-sm"
                    : "text-zinc-600 hover:text-zinc-800"
                )}
              >
                Search Facilities
              </button>
            </div>

            <div className="mt-3">
              {facilityTab === "recent" ? (
                <RecentFacilitiesList title="Recently Checked-In" />
              ) : (
                <section>
                  <div className="rounded-xl border border-zinc-200/80 bg-white/90 shadow-sm p-4">
                    <label
                      htmlFor="facility-search"
                      className="text-sm font-medium text-zinc-700"
                    >
                      Find a facility
                    </label>
                    <div className="mt-2 relative">
                      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                      <input
                        id="facility-search"
                        type="text"
                        value={facilitySearch}
                        onChange={(e) => setFacilitySearch(e.target.value)}
                        placeholder="Search by facility name"
                        className="w-full rounded-xl border border-zinc-300 pl-9 pr-3 py-2.5 text-zinc-900 placeholder-zinc-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-colors"
                      />
                    </div>
                  </div>

                  {isSearchLoading ? (
                    <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden mt-3">
                      {[1, 2, 3].map((i) => (
                        <div
                          key={i}
                          className="flex items-center gap-4 px-4 py-4 border-b border-zinc-100 last:border-0"
                        >
                          <div className="h-12 w-12 rounded-xl bg-zinc-200 animate-pulse" />
                          <div className="flex-1 space-y-2">
                            <div className="h-4 w-32 bg-zinc-200 rounded animate-pulse" />
                            <div className="h-3 w-24 bg-zinc-100 rounded animate-pulse" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : searchLoadError ? (
                    <div className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50 p-6 text-center mt-3">
                      <p className="text-sm font-medium text-zinc-700">{searchLoadError}</p>
                    </div>
                  ) : searchFacilities.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50 p-6 text-center mt-3">
                      <p className="text-sm font-medium text-zinc-700">
                        No facilities found
                      </p>
                      <p className="text-sm text-zinc-500 mt-1">
                        Try a different name or check in to more facilities.
                      </p>
                    </div>
                  ) : (
                    <ul className="rounded-xl border border-zinc-200 bg-white overflow-hidden shadow-sm divide-y divide-zinc-100 mt-3">
                      {searchFacilities.map((facility) => (
                        <li key={facility.facility_id}>
                          <button
                            type="button"
                            onClick={() => void handleSearchFacilitySelect(facility)}
                            disabled={isCheckingPresence}
                            className="flex w-full items-start justify-start gap-4 px-4 py-4 hover:bg-zinc-50 active:bg-zinc-100 transition-colors group"
                          >
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                              <Building2 className="h-6 w-6" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-zinc-900 truncate text-left">
                                {facility.name}
                              </p>
                              <p className="text-xs text-zinc-500 mt-0.5 text-left">
                                {facility.active_players} player
                                {facility.active_players <= 1 ? "" : "s"} online
                              </p>
                            </div>
                            <ChevronRight className="h-5 w-5 text-zinc-400 group-hover:text-zinc-600 shrink-0 transition-colors" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}

                  {facilityTab === "search" && hasMoreSearchFacilities && (
                    <div ref={loadMoreRef} className="h-10 mt-2" aria-hidden />
                  )}
                </section>
              )}
            </div>
          </div>
        </div>
      </div>

      {missingPresenceFacilityName !== "" && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="missing-presence-title"
          aria-describedby="missing-presence-description"
          onClick={() => setMissingPresenceFacilityName("")}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white/95 backdrop-blur-sm shadow-2xl border border-zinc-200/80 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100">
              <h2
                id="missing-presence-title"
                className="text-base font-semibold text-zinc-900"
              >
                Join required for this facility
              </h2>
              <button
                type="button"
                onClick={() => setMissingPresenceFacilityName("")}
                className="rounded-full p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 transition-colors"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="px-5 py-4">
              <p
                id="missing-presence-description"
                className="text-sm text-zinc-700 leading-6"
              >
                You are not checked in to{" "}
                <span className="font-semibold">{missingPresenceFacilityName}</span>.
                Go to the site and scan the RacketTier QR code at the facility. Or find the facility qr code at the counter and then paste it into the <span className="font-semibold">Enter code</span>{" "}
                input to join.
              </p>
              <div className="mt-5 flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setMissingPresenceFacilityName("")}
                >
                  Close
                </Button>
                <Button
                  type="button"
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                  onClick={() => {
                    setMissingPresenceFacilityName("");
                    setJoinMode("code");
                    setTimeout(() => {
                      tokenInputRef.current?.focus();
                    }, 0);
                  }}
                >
                  Go to Enter code
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function FacilityJoinPage() {
  return (
    <Suspense fallback={<FacilityJoinFallback />}>
      <FacilityJoinContent />
    </Suspense>
  );
}
