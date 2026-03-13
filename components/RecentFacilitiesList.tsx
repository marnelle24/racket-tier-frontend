"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Building2,
  Calendar,
  ChevronRight,
  Clock,
  Gamepad2,
} from "lucide-react";
import { getAuthToken } from "@/lib/auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export type RecentFacility = {
  facility_id: number;
  name: string;
  joined_at: string;
  last_seen_at: string;
  games_played: number;
  wins?: number;
  losses?: number;
};

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    return d.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: d.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    });
  } catch {
    return iso;
  }
}

function formatDateWithTime(iso: string): string {
  try {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const timeStr = d.toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
    if (diffDays === 0) return `Today @ ${timeStr}`;
    if (diffDays === 1) return `Yesterday @ ${timeStr}`;
    if (diffDays < 7) return `${diffDays} days ago @ ${timeStr}`;
    const dateStr = d.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: d.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    });
    return `${dateStr} @ ${timeStr}`;
  } catch {
    return iso;
  }
}

type RecentFacilitiesListProps = {
  title?: string;
  className?: string;
  onLoaded?: (facilities: RecentFacility[]) => void;
};

export function RecentFacilitiesList({
  title = "Recently Checked-In",
  className = "",
  onLoaded,
}: RecentFacilitiesListProps) {
  const [recentFacilities, setRecentFacilities] = useState<RecentFacility[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const authToken = getAuthToken();
    if (!authToken) {
      setIsLoading(false);
      return;
    }
    fetch(`${API_URL}/api/facilities/mine`, {
      headers: { Authorization: `Bearer ${authToken}` },
    })
      .then((res) => (res.ok ? res.json() : { data: [] }))
      .then((json) => {
        const list = json?.data ?? json ?? [];
        const facilities = Array.isArray(list) ? list : [];
        setRecentFacilities(facilities);
        onLoaded?.(facilities);
      })
      .catch(() => setRecentFacilities([]))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <section className={className}>
      <div className="flex items-center gap-2">
        <Building2 className="h-5 w-5 text-gray-500" aria-hidden />
        <h2 className="text-sm font-semibold text-zinc-700">{title}</h2>
      </div>

      {isLoading ? (
        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden mt-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex items-center gap-4 px-4 py-4 border-b border-gray-100 last:border-0"
            >
              <div className="h-12 w-12 rounded-xl bg-gray-200 animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
                <div className="h-3 w-24 bg-gray-100 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      ) : recentFacilities.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 min-h-[120px] flex flex-col items-center justify-center p-6 text-center mt-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-200 text-gray-400 mb-3">
            <Building2 className="h-6 w-6" />
          </div>
          <p className="text-sm font-medium text-gray-600">No facilities yet</p>
          <p className="text-sm text-gray-500 mt-0.5">
            Join a facility to see it here
          </p>
        </div>
      ) : (
        <ul className="rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm divide-y divide-gray-100 mt-3">
          {recentFacilities.map((f) => (
            <li key={f.facility_id}>
              <Link
                href={`/facility/${f.facility_id}`}
                className="flex items-center gap-4 px-4 py-4 hover:bg-gray-50 active:bg-gray-100 transition-colors group"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-green-100 text-green-700">
                  <Building2 className="h-6 w-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 truncate">
                    {f.name}
                  </p>
                  <div className="flex flex-col gap-y-0.5 mt-0.5 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Joined {formatDate(f.joined_at)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Checked-in {formatDateWithTime(f.last_seen_at)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Gamepad2 className="h-3 w-3" />
                      {f.games_played} game{f.games_played !== 1 ? "s" : ""}{" "}
                      played
                    </span>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-gray-600 shrink-0 transition-colors" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
