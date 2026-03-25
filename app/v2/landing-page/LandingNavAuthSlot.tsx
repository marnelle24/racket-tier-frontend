"use client";

import { LogIn } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getAuthToken } from "@/lib/auth";

type Props = {
  avatarSrc: string;
};

export function LandingNavAuthSlot({ avatarSrc }: Props) {
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    const sync = () => setAuthed(!!getAuthToken());
    sync();
    window.addEventListener("storage", sync);
    window.addEventListener("focus", sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("focus", sync);
    };
  }, []);

  if (!authed) {
    return (
      <Link
        href="/login"
        className="flex h-8 w-8 items-center justify-center rounded-full bg-[#353438] text-[#c2c1ff] transition-opacity hover:opacity-80"
        aria-label="Sign in"
      >
        <LogIn className="h-4 w-4" strokeWidth={2.25} />
      </Link>
    );
  }

  return (
    <Link
      href="/account"
      className="relative block h-8 w-8 overflow-hidden rounded-full bg-[#353438] transition-opacity hover:opacity-80"
      aria-label="Account"
    >
      <Image
        alt="Profile"
        className="object-cover"
        src={avatarSrc}
        fill
        sizes="32px"
      />
    </Link>
  );
}
