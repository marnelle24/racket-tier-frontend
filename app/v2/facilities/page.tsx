"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAuthToken } from "@/lib/auth";
import styles from "./facilities.module.css";
import { Header } from "@/components/v2/header";
import { MobileNav } from "@/components/v2/MobileNav";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const IMG_AVATAR_FALLBACK =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBKv5as7CrXePWKXHkaJ1WczThn6Rphh23R5el1919AC7qm6-rXPXaN2U3K7dt6JHKkELyqyLgS5ymfdqgzS35GERzwSaI3512zGfemcVXdX1CVKTksH5k2H7uFy_JKifHPDTy9RiTvzG4ZS2f5Ih6kpnPiTvvb3w8mLqMX7ZqIC4Ek5JAeejvf0SWTuoHQ18sZ6KzD0a48He8N_cg2OOMTpAl6z8sgG84MCjRYYBUi5Q64PYF1Teab6DcMASukd_yn9o8wdeOjDGc";

type MeUser = {
  id?: number;
  name?: string;
  email?: string;
  nickname?: string | null;
  avatar_seed?: string | null;
};

const FACILITIES = [
  {
    key: "north-wing",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBIvy-5TrZeBrBNJipuvbN3IkkBPP56NU9ZgBrVSVcgdU6sA0lX9SWuVXZiUidNCF1hSeKh_CP6IGL6ubGoG7pgLPqhPOlfNRvsfWHPFrG4xWmaf1UoMyS7Wrk4w25DPZQsRiOYCQ5qufcOsAm0E5nzgx-_RxhX8srk4SJg5WxTN-MFd6tvxQ-0t2FE6M1VGcaochNLKR8nXqVZF6k-6ctnApVXk9Gx_u9_sNx5rzwLR3IgdP74PYbhBqO7FhiUA9_UhsWvrEzZg-g",
    imageAlt:
      "Modern indoor tennis court with vibrant blue surface and bright professional overhead lighting in a sleek architectural setting",
    rating: "4.9",
    badge: null as string | null,
    title: "Ground Zero Fitness Hub",
    address: "Tipolo, Subangdaku, Cebu City, PH 6000",
    footer: "avatars" as const,
  },
  {
    key: "metro-sports-club-cebu",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCsGae15FWCctrIyKUBvIoL0eHSVf6qTdHT3XfSn0OjsQOFdskSjiTn9luc8NRnH93ADfdUeYUuF1jnH2CW0s1sokeRJs1uDCdbxz9EuYcz6Q91_yv_Cz-hpidI-8Rgn9_FK1uij9g02lLrrFECFGJE016p3uCHjyZ2cqh71K9W2KuApkSWaQIw2UmhcRUBpimfW3kWwJmhL7M4yJAVEDxM5NqhOh30PRfeLKrwsNWWTKari29wusxlzUfW3ZW2HZuyY3JuQNYG1U8",
    imageAlt:
      "Modern indoor tennis court with vibrant blue surface and bright professional overhead lighting in a sleek architectural setting",
    rating: "4.9",
    badge: null as string | null,
    title: "Metro Sports Club Cebu",
    address: "Lahug, Cebu City, PH 6000",
    footer: "avatars" as const,
  },
] as const;

const STACK_AVATARS = [
  "https://lh3.googleusercontent.com/aida-public/AB6AXuA5IHItjTJyu37DgKYI7F5k77hBYPD0mITCIRMKFvr9qrT3G6NwZLQ47M72qddtbU2-WSfmexcTbL-B5fRVW8loj3faqNTIZO8CT0WKoVQd7bM1L-Ap2bWrYPSZx71uaTKNHZvFMLxfdo4UJXDkFlkzoooF1UvvIT0wvoCQ9tjtmv-KMvehyAd4hoIxxuRYEmvUWn_IWMD4U2CznRkcG5fSBtfvcWQzGl2EDtuCqFc-v5YQVmmIslir3ZaFn-f0b56qfX8M3Kodb34",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuA7WTIbSYufI5maVnQqkyhDMCzHP_QnsbgF4o2mz2tTW0I52YahX2HbwrlI6ae8Bcq2lnPScEteU3bpjcEWjpTVgUJ9_VRRitAkjhwY0VH3g6tw7b5Hdo6mcg4I0_Ycyt9tM2pmrd4m3ZE6RE_tcBguMe9C0C2603QDbEwmOEJYsIwzOzGsIwtdFJ9av7TvpHE2lKBULi2152MqRFO-IS8s5izyLh-ZEgGdVm-GxTpqZkbE0rMFSAUi-19jAszENEAUnW8x99TFxZc",
] as const;

export default function V2FacilitiesPage() {
  const router = useRouter();
  const [me, setMe] = useState<MeUser | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);

  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      router.replace("/v2/login?returnUrl=/v2/facilities");
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
      className={`${styles.facilities} bg-[#131316] pb-24 text-[#e4e1e6] selection:bg-[#c2c1ff] selection:text-[#282671]`}
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
        avatarSrc={IMG_AVATAR_FALLBACK}
      />
      
      <main className="mx-auto max-w-5xl px-6 py-20">
        <div className="mb-10 mt-8">
          <h1 className="mb-4 text-4xl font-extrabold leading-none tracking-tighter md:text-6xl">
            Partner <span className="text-[#c2c1ff]">Facilities</span>
          </h1>
          <p className="max-w-md font-medium text-[#c8c5d2]">
            Check out our partner facilities for your next ranking performance.
          </p>
        </div>

        <div className="group relative mb-8">
          <div className="pointer-events-none absolute inset-y-0 left-4 z-10 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6">
              <path d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
          </div>
          <input
            type="search"
            placeholder="Search facilities or locations..."
            className="font-body w-full rounded-xl border border-[#353438] bg-[#0e0e11] py-4 pl-12 pr-4 text-sm text-[#e4e1e6] transition-all placeholder:text-[#918f9c] focus:ring-1 focus:ring-[#c2c1ff]/20"
          />
        </div>

        <div className="space-y-6">
          {FACILITIES.map((f) => (
            <div
              key={f.key}
              className="group relative overflow-hidden rounded-xl bg-[#1f1f22] transition-all duration-300 hover:bg-[#2a2a2d]"
            >
              <div className="flex h-full flex-col md:flex-row">
                <div className="relative h-56 overflow-hidden md:h-auto md:w-1/3">
                  <Image
                    alt=""
                    src={f.image}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                </div>

                <div className="flex grow flex-col justify-between p-6 md:p-8">
                  <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
                    <div>
                      {f.badge ? (
                        <span className="mb-2 block font-['Inter'] text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#c8c5d2]">
                          {f.badge}
                        </span>
                      ) : (
                        ''
                      )}
                      <h3 className="mb-2 text-2xl font-bold tracking-tight md:text-3xl">
                        {f.title}
                      </h3>
                      <div className="flex flex-wrap items-center gap-4 text-sm font-medium text-[#c8c5d2]">
                        <div className="flex items-center gap-1">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-4">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                            </svg>
                            <span>{f.address}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {f.footer === "avatars" && (
                    <div className="mt-8 flex items-center justify-between">
                      <div className="-space-x-1 flex items-center">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-[#1f1f22] bg-[#353438] text-[10px] font-bold">
                          +12
                        </div>
                        {STACK_AVATARS.map((src) => (
                          <div
                            key={src}
                            className="relative h-7 w-7 overflow-hidden rounded-full border-2 border-[#676769]"
                          >
                            <Image
                              alt=""
                              src={src}
                              fill
                              className="object-cover"
                              sizes="32px"
                            />
                          </div>
                        ))}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          className="rounded-xl bg-linear-to-br from-[#c2c1ff] to-[#8a89d9] px-3.5 py-2 text-xs font-bold tracking-tight text-[#131316] transition-transform active:scale-95"
                        >
                          View Details
                        </button>
                        <button
                          type="button"
                          className="rounded-xl bg-linear-to-br from-[#4ce081] to-[#4ce081] px-3.5 py-2 text-xs font-bold tracking-tight text-[#131316] transition-transform active:scale-95"
                        >
                          Gameroom
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      <MobileNav />

    </div>
  );
}
