"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MobileNav } from "@/components/v2/MobileNav";
import { getAuthToken } from "@/lib/auth";
import styles from "./ranking.module.css";
import { Header } from "@/components/v2/header";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const IMG_HEADER_AVATAR =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuDLTPsNRv49lP4MXGr_3zM1S4-AbRtR0oSb9E_VfjjaPezHLxbwtP__cHgY-sXE8FRIlkZsF_XUqu4-CTRNUdJflEBi0XJifq1cogSe9oHLhO2WlXGhJp3kvuicItp1JGWJNCDxSh99P728JUSwv6Pk41jylFZZDB70bGb3g6LO4MfpNr1gl48j61PQJP3pwTzlryO9bR7YuMu2grsJ-lISIv0JlF0C7jvSz3g1wOidGiFkIPERUsggGGVgIeG3ZvSziBcq_go3AfI";

const IMG_RANK_1 =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuDkcQuiUlDak7Nu3Km_tS0d01_vv6THE8fHhOP5oPj1U52fnKuny7ig-uPHQqa-qd3GM8hCyDa8isv_EmRqWUV_wlWirMOf1cxDKaTZHJM_1n078IZ8L0UmYVSOURgLy5iiajqQZ_Fzs4EUdLObYuL_iEakJiSETsnzEunPkJ0Riwot38IGZXzeY7UD77eGpDfWSdPc4ERVB-_n8k7XRVjQljbvwl6bqZEXL1eVy9D2zMw7ASe8vutxK9B8hTrdee1xEX-GMowYgm4";

const IMG_RANK_2 =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuD6h_I42Km1gHaB7pbjzDdlmhf53baL3DjYFEVdCilPKFhGoyHkiSIritotA4TxXdk2KiqVlFZC9gi7-2yyxknEU4M2KcRSWxlAWGZuC-V2WuTvIjmeeu_AETYk0-Y1xdtUpeUOl55-msjaCLFJUhXq5zTb3R6VEhch8Nx9NFUYOzx4uLqlOHibCLNaEoZ8oZU0TRjKaz-u_6JPitcMQoyTs5JcOMMg6TIN9avvWM4aP0AYkaAPse1131eSUSEPjClK6cWlS7KNjjs";

const IMG_RANK_3 =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBV2cYZ0Eo5A08XIKuPloaAeGWTQLgEEULKJUid9cMye4ZJH04V8g_U1bxqgHcmF5i-sCkQjOwItCkvxycrUTMnjbNWacBXy9q9E8A9QI_7UNrKwTNgnVBaiRXCU1wfECJTlRWKLiVADb12-ZZkw2nOBkm13wlyg57IxT5lNrIdR475Bj0NqdJDrej8kf7p1lVyqDGZxR7bUVnIvHlfVShvo2W300CLSOQWznZQPoMv5bKfMgAqdg3p-4a_2vgSDbeJXutoFEiLUI0";

const IMG_RANK_4 =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuANo_6whauMBZEh_PczyqN_q3wjU4-TULrnMg17_hcIdliNB-GGuz9g7sGGs0t5eytYV5riikZcN-k50KW2aRTRqGveHpdxOUvjXoMxjjZtb5_hZ17Ulc-GiuhhLfAJeXC6dtGSHd4ZWaydh9hMYsYZbIoQBAkhLtRqC0n2PrC6Opbmck9ze9MOw5qm0kPn0WuY92oz5uBViV4ygZV7567_hl83IndfWkiH_vqNiQA-aG7rkNGo7PpAgZ6XBoKPCqGUCbF7-tQg_ck";

const IMG_RANK_5 =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuCGXx63ExYxiW_vAq2DtZzfsPJzpkWcUX0314EnmKVKPIORbx0mydvGwI1OS-80YLdSZ4ad1qHQDY23_MOLLBW016JBzoJUBof8lLl6CucR5SZxsFTYml5s3A7u59nQjOQdFe4yTL1exVhqXkH4Kr1f8M8gON79_6W-igB6IXHq9nCFK0T5ZXMBOGoxO9REfCuoBib7Ic2IoFKk9Xd4z8AJphirdoqpWFqfO6xqbaXa6qULxvLiUvbClNRr1sgzDWDeJiUMeZx7p6k";

const IMG_RANK_6 =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuDvmBLoDUcugvTWF3Gad7p_v5OdTvoVO5nEsEcbaiir5C3Tm1aevA8Q3mg4u0jO336yMTUZwJum443uDSh0khBxIvaNKKdP_fce2G8jYhIj_CuI5-56-o6Q_EYi302HJB1xjKrj93-mWZbSAGMY-JKAGWKmQnggqGy63m8tiOSDiPvajr5raswEOVH2yEkoL4n8pCGCXLoYwrPex1WyaXREf_q-FFc7ui-h9BqtQ30gvmqDCoGcBJqINLz1PJGtocwkBJnfgtumKCc";

const FILTERS = ["Global", "Regional", "Under-21", "Masters"] as const;

type MeUser = {
  id?: number;
  name?: string;
  email?: string;
  nickname?: string | null;
  avatar_seed?: string | null;
};

export default function V2RankingPage() {
  const router = useRouter();
  const [me, setMe] = useState<MeUser | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [activeFilter, setActiveFilter] = useState<(typeof FILTERS)[number]>(
    "Global",
  );

  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      router.replace("/v2/login?returnUrl=/v2/ranking");
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
      className={`${styles.ranking} bg-[#131316] pb-24 text-[#e4e1e6] selection:bg-[#c2c1ff] selection:text-[#282671]`}
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
        avatarSrc={IMG_HEADER_AVATAR}
      />
      <main className="mx-auto max-w-md px-6 pt-20">
        <section className="mb-10 mt-8">
          <div className="flex flex-col gap-1">
            <h2
              className={`${styles.kineticHeader} text-4xl font-extrabold tracking-tighter text-[#e4e1e6]`}
            >
              Rankings
            </h2>
          </div>
          <p className="font-body mt-4 max-w-[80%] text-sm leading-relaxed text-[#c8c5d2]">
            Live updates for the global season. Performance metrics based on the
            Tier-1 algorithm.
          </p>
        </section>

        <div className="mb-8 flex flex-col gap-4">
          <div className="group relative">
            <div className="pointer-events-none absolute inset-y-0 left-4 z-10 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6">
                <path d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
              </svg>
            </div>
            <input
              type="search"
              placeholder="Search players..."
              className="font-body w-full rounded-xl border border-[#353438] bg-[#0e0e11] py-4 pl-12 pr-4 text-sm text-[#e4e1e6] transition-all placeholder:text-[#918f9c] focus:ring-1 focus:ring-[#c2c1ff]/20"
            />
          </div>
          <div
            className={`flex gap-2 overflow-x-auto pb-2 ${styles.customScrollbar}`}
          >
            {FILTERS.map((label) => {
              const isActive = activeFilter === label;
              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => setActiveFilter(label)}
                  className={
                    isActive
                      ? "shrink-0 rounded-full bg-[#4ce081] px-5 py-2 text-xs font-bold whitespace-nowrap text-[#003919]"
                      : "shrink-0 cursor-pointer rounded-full bg-[#353438] px-5 py-2 text-xs font-medium whitespace-nowrap text-[#e4e1e6] transition-colors hover:bg-[#1f1f22]"
                  }
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <div className="overflow-hidden rounded-xl bg-linear-to-br from-[#c2c1ff]/10 to-transparent p-px">
            <div className="relative flex items-center gap-4 rounded-xl bg-[#1f1f22] p-4">
              <div
                className={`${styles.kineticHeader} min-w-12 text-4xl font-extrabold italic text-[#c2c1ff]/40`}
              >
                01
              </div>
              <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-[#353438]">
                <Image
                  alt="Alex S."
                  src={IMG_RANK_1}
                  width={48}
                  height={48}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1">
                  <h3 className="font-headline font-bold text-[#e4e1e6]">
                    Alex Sokolov
                  </h3>
                  {/* <span
                    className="material-symbols-outlined text-[14px] text-[#4ce081]"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    verified
                  </span> */}
                </div>
                <p className="font-label text-[10px] tracking-widest text-[#c8c5d2] uppercase">
                  34 W — 2 L
                </p>
              </div>
              <div className="text-right">
                <div
                  className={`${styles.kineticHeader} text-lg font-bold text-[#e4e1e6]`}
                >
                  14,250
                </div>
                <div className="text-[10px] font-bold text-[#4ce081]">+240</div>
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-xl bg-linear-to-br from-[#4ce081]/5 to-transparent p-px">
            <div className="flex items-center gap-4 rounded-xl bg-[#1f1f22] p-4">
              <div
                className={`${styles.kineticHeader} min-w-12 text-4xl font-extrabold italic text-[#c8c5d2]/20`}
              >
                02
              </div>
              <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-[#353438]">
                <Image
                  alt="Elena M."
                  src={IMG_RANK_2}
                  width={48}
                  height={48}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-headline font-bold text-[#e4e1e6]">
                  Elena Moretti
                </h3>
                <p className="font-label text-[10px] tracking-widest text-[#c8c5d2] uppercase">
                  31 W — 5 L
                </p>
              </div>
              <div className="text-right">
                <div
                  className={`${styles.kineticHeader} text-lg font-bold text-[#e4e1e6]`}
                >
                  12,890
                </div>
                <div className="text-[10px] font-medium text-[#c8c5d2]">--</div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 rounded-xl bg-[#1f1f22] p-4">
            <div
              className={`${styles.kineticHeader} min-w-12 text-4xl font-extrabold italic text-[#c8c5d2]/10`}
            >
              03
            </div>
            <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-[#353438]">
              <Image
                alt="Jordan L."
                src={IMG_RANK_3}
                width={48}
                height={48}
                className="h-full w-full object-cover"
              />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-headline font-bold text-[#e4e1e6]">
                Jordan Lee
              </h3>
              <p className="font-label text-[10px] tracking-widest text-[#c8c5d2] uppercase">
                28 W — 7 L
              </p>
            </div>
            <div className="text-right">
              <div
                className={`${styles.kineticHeader} text-lg font-bold text-[#e4e1e6]`}
              >
                11,400
              </div>
              <div className="text-[10px] font-bold text-[#ffb4ab]">-110</div>
            </div>
          </div>

          <div className="mt-4 flex flex-col">
            <div className="group flex items-center gap-4 rounded-xl px-2 py-4 transition-colors hover:bg-[#1b1b1e]">
              <div className="w-10 shrink-0 text-center font-headline font-bold text-[#c8c5d2] transition-colors group-hover:text-[#c2c1ff]">
                4
              </div>
              <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-[#1b1b1e]">
                <Image
                  alt="R. Kim"
                  src={IMG_RANK_4}
                  width={40}
                  height={40}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="font-body text-sm font-semibold text-[#e4e1e6]">
                  Ryuji Kim
                </h4>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-[#c8c5d2]">25W-10L</span>
                  <span className="h-1 w-1 shrink-0 rounded-full bg-[#474651]" />
                  <span className="text-[10px] text-[#c8c5d2]">KR</span>
                </div>
              </div>
              <div className="pr-2 text-right">
                <div className="text-sm font-bold text-[#e4e1e6]">9,820</div>
              </div>
            </div>

            <div className="group flex items-center gap-4 rounded-xl px-2 py-4 transition-colors hover:bg-[#1b1b1e]">
              <div className="w-10 shrink-0 text-center font-headline font-bold text-[#c8c5d2] transition-colors group-hover:text-[#c2c1ff]">
                5
              </div>
              <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-[#1b1b1e]">
                <Image
                  alt="C. Perez"
                  src={IMG_RANK_5}
                  width={40}
                  height={40}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="font-body text-sm font-semibold text-[#e4e1e6]">
                  Carlos Perez
                </h4>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-[#c8c5d2]">24W-12L</span>
                  <span className="h-1 w-1 shrink-0 rounded-full bg-[#474651]" />
                  <span className="text-[10px] text-[#c8c5d2]">ES</span>
                </div>
              </div>
              <div className="pr-2 text-right">
                <div className="text-sm font-bold text-[#e4e1e6]">9,540</div>
              </div>
            </div>

            <div className="group flex items-center gap-4 rounded-xl px-2 py-4 transition-colors hover:bg-[#1b1b1e]">
              <div className="w-10 shrink-0 text-center font-headline font-bold text-[#c8c5d2] transition-colors group-hover:text-[#c2c1ff]">
                6
              </div>
              <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-[#1b1b1e]">
                <Image
                  alt="S. White"
                  src={IMG_RANK_6}
                  width={40}
                  height={40}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="font-body text-sm font-semibold text-[#e4e1e6]">
                  Sarah White
                </h4>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-[#c8c5d2]">22W-14L</span>
                  <span className="h-1 w-1 shrink-0 rounded-full bg-[#474651]" />
                  <span className="text-[10px] text-[#c8c5d2]">AU</span>
                </div>
              </div>
              <div className="pr-2 text-right">
                <div className="text-sm font-bold text-[#e4e1e6]">8,910</div>
              </div>
            </div>
          </div>

          <button
            type="button"
            className="font-label mt-8 mb-12 w-full rounded-xl bg-[#353438] py-4 text-xs font-bold tracking-widest text-[#e4e1e6] uppercase transition-all hover:bg-[#353438]/90"
          >
            View All Athletes
          </button>
        </div>
      </main>

      <MobileNav />
    </div>
  );
}
