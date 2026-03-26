"use client";

import Image from "next/image";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { RacketTierV2Wordmark } from "@/components/v2/RacketTierV2Wordmark";
import { UserAvatar } from "@/components/UserAvatar";
import { getAuthToken } from "@/lib/auth";

export type V2HeaderProfile = {
  name: string;
  avatar_seed?: string | null;
};

type Props = {
  /** Fallback when `profile` is not passed (e.g. static image URL). */
  avatarSrc?: string;
  /** From GET /api/me — DiceBear / initials avatar. */
  profile?: V2HeaderProfile | null;
  /** While the parent is loading `/api/me` after auth. */
  profileLoading?: boolean;
};

type AuthState = "loading" | "authenticated" | "unauthenticated";

export function Header({
  avatarSrc,
  profile,
  profileLoading = false,
}: Props) {
  const [authState, setAuthState] = useState<AuthState>("loading");

  useEffect(() => {
    const sync = () =>
      setAuthState(getAuthToken() ? "authenticated" : "unauthenticated");
    sync();
    window.addEventListener("storage", sync);
    window.addEventListener("focus", sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("focus", sync);
    };
  }, []);

  return (
    <nav className="fixed top-0 z-50 w-full bg-[#131316]/70 backdrop-blur-xl dark:bg-[#131316]/70">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <RacketTierV2Wordmark textSize="text-3xl" />
        </div>
        <div className="hidden items-center gap-8 md:flex">
          <a
            className="font-label text-sm font-medium uppercase tracking-wider text-[#c2c1ff] transition-opacity hover:opacity-80"
            href="#"
          >
            Home
          </a>
          <a
            className="font-label text-sm font-medium uppercase tracking-wider text-[#353438] transition-opacity hover:opacity-80"
            href="/v2/ranking"
          >
            Rankings
          </a>
          <a
            className="font-label text-sm font-medium uppercase tracking-wider text-[#353438] transition-opacity hover:opacity-80"
            href="#"
          >
            Play
          </a>
        </div>
        <div className="flex items-center gap-4">
          <Link
            className="font-label hidden px-4 py-2 text-xs font-bold uppercase tracking-widest text-[#e4e1e6] transition-opacity hover:opacity-70 md:block"
            href="/v2/login"
          >
            Sign In
          </Link>
          {authState === "loading" ? (
            <div
              className="flex h-8 w-8 shrink-0 items-center justify-center"
              aria-busy="true"
              aria-label="Checking sign-in status"
            >
              <Loader2
                className="h-4 w-4 animate-spin text-[#c2c1ff]"
                aria-hidden
              />
            </div>
          ) : authState === "unauthenticated" ? (
            <Link
              href="/v2/login"
              className="px-3 py-2 text-xs border flex items-center justify-center rounded-full bg-[#353438] text-[#c2c1ff] transition-opacity hover:opacity-80"
              aria-label="Login or Register"
            >
              Login or Register
            </Link>
          ) : profileLoading ? (
            <div
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#353438]"
              aria-busy="true"
              aria-label="Loading profile"
            >
              <Loader2
                className="h-4 w-4 animate-spin text-[#c2c1ff]"
                aria-hidden
              />
            </div>
          ) : (
            <Link
              href="/account"
              className="relative flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#353438] transition-opacity hover:opacity-80"
              aria-label="Account"
            >
              {profile ? (
                <UserAvatar
                  name={profile.name}
                  avatarSeed={profile.avatar_seed}
                  size={32}
                  className="border-0 shadow-none"
                />
              ) : avatarSrc ? (
                <Image
                  alt="Profile"
                  className="object-cover"
                  src={avatarSrc}
                  fill
                  sizes="32px"
                />
              ) : (
                <UserAvatar
                  name="User"
                  size={32}
                  className="border-0 shadow-none"
                />
              )}
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
