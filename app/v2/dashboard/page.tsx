"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/v2/header";
import { getAuthToken } from "@/lib/auth";
import styles from "./dashboard.module.css";
import { MobileNav } from "@/components/v2/MobileNav";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const IMG_AVATAR =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuDxwZyqJ4H7aFw43xc9BztWapcArXLZlPr2UzBqxiPU4DFzB26LXCyNHadLMvi8d2ls8Pc0Pi3898xIaXW_wI9qgOX2bGN90uZujjB8JmowFjO2hOhPDvazOC83gNtVENMN6ka4pSTY7ftUVyzJblYozGMzJ7hfPNUnbIGz6e6ef3nWUGNIrQsS-k83lvB7v5A4JQ3nuXp0O347uw0upZ-glH-dUnAj2HZhco8-Zh5YKoWM_eM7dJEgwpq_NV6nWwIJpILvo6zu60w";

const IMG_PLAY_BG =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuAdeD9jD4wFP5m8jeHYihc9onG4ZLyRfTmD5RvFgsnbJueMquK9TNRW_SyHqXiIDR9B3CH692i5gr4ce_y_Oup803Q_AcpyvX-y5KMaYf_yXfTl5AOu0K8GL2lcpnv7uvGZvNwoLRT4Sf3r-w5mlohM6S-Dtd2AngioMwnLGH8pUY4eXUvZAWvpm65heuxqA3sVBvBmhR6wRxb6rrp4U3yk5rc-MHX2OG0Jp16jur2xfsCeZV090T9-FFgbHyrLZj9mOjaMMqBev_U";

type MeUser = {
  id?: number;
  name?: string;
  email?: string;
  nickname?: string | null;
  avatar_seed?: string | null;
};

function greetingFirstName(user: MeUser | null): string {
  if (!user) return "there";
  const nick = user.nickname?.trim();
  if (nick) return nick;
  const first = user.name?.trim().split(/\s+/)[0];
  if (first) return first;
  const local = user.email?.split("@")[0]?.trim();
  if (local) return local;
  return "there";
}

export default function V2DashboardPage() {
  const router = useRouter();
  const [me, setMe] = useState<MeUser | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);

  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      router.replace("/v2/login?returnUrl=/v2/dashboard");
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

  const displayName = greetingFirstName(me);

  return (
    <div
      className={`${styles.dashboard} bg-[#131316] font-sans text-[#e4e1e6] selection:bg-[#c2c1ff] selection:text-[#282671]`}
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
        <section className="mb-10">
          <h2 className="mb-2 text-4xl font-extrabold tracking-tight text-[#e4e1e6]">
            {isLoadingUser ? (
              <span className="inline-block h-10 w-56 animate-pulse rounded-lg bg-[#2a2a2d]" />
            ) : (
              <>Hello, {displayName}.</>
            )}
          </h2>
          <p className="font-medium text-[#c8c5d2]/70">
            Ready to climb the tiers today?
          </p>
        </section>

        <div className="mb-10 grid grid-cols-2 gap-4">
          <div className="group relative col-span-2 h-48 cursor-pointer overflow-hidden rounded-xl bg-linear-to-br from-[#c2c1ff] to-[#8a89d9] transition-transform duration-200 active:scale-95">
            <div className="absolute inset-0 opacity-20 mix-blend-overlay">
              <Image
                alt="Abstract tennis court lines from above"
                src={IMG_PLAY_BG}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 448px"
                priority={false}
              />
            </div>
            <div className="relative flex h-full flex-col justify-end p-6">
              <div className="flex items-end justify-between">
                <div>
                  <span
                    className="material-symbols-outlined mb-2 text-4xl text-[#211e6a]"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    sports_tennis
                  </span>
                  <h3 className="text-2xl font-bold tracking-tight text-[#211e6a]">
                    PLAY
                  </h3>
                </div>
                <span className="material-symbols-outlined text-[#211e6a]/50">
                  arrow_forward
                </span>
              </div>
            </div>
          </div>

          <div className="group flex h-40 cursor-pointer flex-col justify-between rounded-xl bg-[#1b1b1e] p-6 transition-transform active:scale-95">
            <span className="material-symbols-outlined text-3xl text-[#4ce081]">
              group_add
            </span>
            <div>
              <h3 className="text-lg font-bold text-[#e4e1e6]">JOIN</h3>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-[#c8c5d2]">
                Active Hubs
              </p>
            </div>
          </div>

          <div className="group flex h-40 cursor-pointer flex-col justify-between rounded-xl bg-[#1f1f22] p-6 transition-transform active:scale-95">
            <span className="material-symbols-outlined text-3xl text-[#c2c1ff]">
              leaderboard
            </span>
            <div>
              <h3 className="text-lg font-bold text-[#e4e1e6]">RANK</h3>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-[#c8c5d2]">
                Tier 4 Elite
              </p>
            </div>
          </div>
        </div>

        <section className="mb-6">
          <div className="mb-6 flex items-end justify-between">
            <h2 className="text-xl font-bold tracking-tight text-[#e4e1e6]">
              Recent Activity
            </h2>
            <button
              type="button"
              className="rounded-full bg-[#c2c1ff]/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-[#c2c1ff]"
            >
              View All
            </button>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-4 rounded-xl bg-[#1b1b1e] p-4 transition-colors hover:bg-[#1f1f22]">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-[#4ce081]/10">
                <span className="material-symbols-outlined text-[#4ce081]">
                  military_tech
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="truncate font-semibold text-[#e4e1e6]">
                  Won Match vs. J. Doe
                </h4>
                <p className="text-xs text-[#c8c5d2]">+12 Ranking Points</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-medium text-[#c8c5d2]/60">2h ago</p>
              </div>
            </div>

            <div className="flex items-center gap-4 rounded-xl bg-[#1b1b1e] p-4 transition-colors hover:bg-[#1f1f22]">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-[#c2c1ff]/10">
                <span className="material-symbols-outlined text-[#c2c1ff]">
                  event_available
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="truncate font-semibold text-[#e4e1e6]">
                  Upcoming: Padel Finals
                </h4>
                <p className="text-xs text-[#c8c5d2]">
                  Courtside Club • 18:00
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-medium text-[#c8c5d2]/60">
                  Tomorrow
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 rounded-xl bg-[#1b1b1e] p-4 transition-colors hover:bg-[#1f1f22]">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-[#353438]">
                <span className="material-symbols-outlined text-[#c8c5d2]">
                  forum
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="truncate font-semibold text-[#e4e1e6]">
                  New Message
                </h4>
                <p className="text-xs text-[#c8c5d2]">
                  Coach Smith: Great serve!
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-medium text-[#c8c5d2]/60">1d ago</p>
              </div>
            </div>
          </div>
        </section>

        <section className="relative mt-8 overflow-hidden rounded-xl bg-[#353438] p-6">
          <div className="absolute left-0 top-0 h-full w-1 bg-[#4ce081]" aria-hidden />
          <div className="pointer-events-none absolute -right-5 -top-5" aria-hidden>
            <span className={`material-symbols-outlined ${styles.watermarkIcon}`}>
              trending_up
            </span>
          </div>

          <div className="relative z-10">
            <h3 className="mb-1 text-lg font-bold text-[#e4e1e6]">On a Streak!</h3>
            <p className="mb-4 text-sm text-[#c8c5d2]">
              You&apos;ve played 5 matches this week. Keep the momentum going to unlock Tier 5.
            </p>

            <div className="mb-2 h-1.5 w-full rounded-full bg-[#131316]">
              <div className="h-full w-4/5 rounded-full bg-[#4ce081]" />
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#4ce081]">
                80% to Goal
              </span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#c8c5d2]">
                1 Match Left
              </span>
            </div>
          </div>
        </section>
      </main>

      {/* <nav className="fixed bottom-0 left-0 z-50 w-full bg-[#131316]/70 backdrop-blur-xl shadow-[0_-4px_40px_-5px_rgba(0,0,0,0.3)]">
        <div className="fixed bottom-0 left-0 flex w-full items-center justify-around px-4 pb-6 pt-3">
          <Link
            className="scale-90 rounded-2xl bg-linear-to-br from-[#c2c1ff] to-[#8a89d9] px-4 py-1.5 text-[#131316] duration-200 active:transition-transform"
            href="/v2/dashboard"
          >
            <span
              className="material-symbols-outlined"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              home
            </span>
            <span className="block text-[10px] font-medium uppercase tracking-wider">
              Home
            </span>
          </Link>

          <Link
            className="scale-90 px-4 py-1.5 text-[#353438] transition-colors duration-200 hover:text-[#c2c1ff] active:transition-transform"
            href="#"
          >
            <span className="material-symbols-outlined">leaderboard</span>
            <span className="block text-[10px] font-medium uppercase tracking-wider">
              Rankings
            </span>
          </Link>

          <Link
            className="scale-90 px-4 py-1.5 text-[#353438] transition-colors duration-200 hover:text-[#c2c1ff] active:transition-transform"
            href="#"
          >
            <span className="material-symbols-outlined">sports_tennis</span>
            <span className="block text-[10px] font-medium uppercase tracking-wider">
              Play
            </span>
          </Link>

          <Link
            className="scale-90 px-4 py-1.5 text-[#353438] transition-colors duration-200 hover:text-[#c2c1ff] active:transition-transform"
            href="#"
          >
            <span className="material-symbols-outlined">person</span>
            <span className="block text-[10px] font-medium uppercase tracking-wider">
              Profile
            </span>
          </Link>
        </div>
      </nav> */}

      <MobileNav />



      <button
        type="button"
        className="fixed bottom-24 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-linear-to-br from-[#c2c1ff] to-[#8a89d9] text-[#131316] shadow-xl transition-transform active:scale-90"
        aria-label="Add"
      >
        <span className="material-symbols-outlined text-3xl">add</span>
      </button>
    </div>
  );
}
