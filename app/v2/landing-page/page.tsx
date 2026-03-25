import { ArrowRightIcon, BuildingIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
// import { LandingBottomNav } from "@/components/LandingBottomNav";
import { LandingNavAuthSlot } from "./LandingNavAuthSlot";
import { RacketTierV2Wordmark } from "@/components/RacketTierV2Wordmark";

const IMG_HERO =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBuiQvEUbibNDHHCNjwO2e8lIj98smZFwOTDBSkYkg529KVWtzJ6x5O5JN7RdsO0xDxLgfauQ-b09aXrADrpzAxutttjgeCKCRC8hDYT199FRjA6l85ptCneiqqPvvHD712-OCiBrsGeg2sqz00TcJDgwpqmJ0tAXK43bR9pthYw99s6Gnz7KMrblNuo9lj5NHMLw9NCT-aGkuyKFYznl205z0YIrU-mJ23PXiSPwsf0zSNUidVDo59mQI2v93nv0Wy9LFTbvyv6es";

const IMG_AVATAR =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuAyhqaOEmGryd9C9VvwbHZyf293aj-NTThg-mq4hrPIVTboLw9jR-_9X4wxIgkhMiCxNIUt3-oTCLf0GS7PuCXkuJAwFcJGlj8XMHRGt2dkDbsUMSKXhoKwYkEyciOdPPIiK-y9CmkEipEYMkL4-r2zZ7KIHhgpcB9lp_rzk7wkVIR4U4LI0r3vNjzlbMjAhh7gOIwoFeLmWSpqGZpq5OdQo0EhswLDgKq-6cA2WkSJfeoqBrFWV_3nz7FqC2NQAKNqP-R5Q05BlzQ";

const IMG_COURT =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuCcNm6e9LXXjtc5jcT-ghsNkK9q8hjmxzNvrRg1H3D1pMGtmyfNOCiQYDljR2p48bIDcX84peZBIee_F4XgW3X0YybcmJvJwuD3YI5hOxFHTjYQu8o8nicOhWn3zUBpM_i6k_JhfclYhalVsHJX20zONHpKVnYT-7JtnfSCBSYUc1Yqu55qhm9n-MnJ1USAnIvk79jXD9lfaLwHKBm43Az0enw4SmavKyq4yIWrl-8fFwyTArAKQbcVxKj9brvWrupqgBzpJwfOQFc";

export default function LandingPageV2() {
  return (
    <>
      <nav className="fixed top-0 z-50 w-full bg-[#131316]/70 backdrop-blur-xl dark:bg-[#131316]/70">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-4">
            {/* <span className="font-headline text-2xl font-extrabold tracking-tighter text-[#c2c1ff]">
              Racket<span className="text-[#c2c1ff] italic">Tier</span>
            </span> */}
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
              href="#"
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
            <LandingNavAuthSlot avatarSrc={IMG_AVATAR} />
          </div>
        </div>
      </nav>

      <main className="relative min-h-screen overflow-x-hidden pt-16">
        <section className="relative mx-auto max-w-7xl px-6 py-12 md:px-12 md:py-24">
          <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-[#c2c1ff]/10 blur-[120px]" />
          <div className="pointer-events-none absolute -left-24 top-1/2 h-64 w-64 rounded-full bg-[#4ce081]/5 blur-[100px]" />
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12">
            <div className="z-10 lg:col-span-7">
              <div className="mb-6 inline-block rounded-full border-none bg-[#2a2a2d] px-3 py-1">
                <span className="font-label text-[10px] font-bold uppercase tracking-[0.2em] text-[#4ce081]">
                  Every Smash Counts
                </span>
              </div>
              <h1 className="font-headline mb-8 text-5xl font-extrabold leading-[0.9] tracking-tighter text-[#e4e1e6] md:text-8xl">
                MASTER <br />
                <span className="text-[#c2c1ff] italic">THE COURT.</span>
                <br />
                OWN THE TIER.
              </h1>
              <p className="font-body mb-10 max-w-lg text-lg leading-relaxed text-[#c8c5d2] md:text-xl">
                The definitive ranking ecosystem for competitive racket sports.
                Track progress, find challengers, earn reward points, and rise through the editorial
                tiers of global performance.
              </p>
              <div className="flex items-start gap-4 sm:items-center">
                <Link
                  className="kinetic-gradient rounded-xl px-8 py-4 font-headline text-lg font-bold text-[#211e6a] shadow-[0_20px_40px_-10px_rgba(194,193,255,0.3)] transition-all duration-200 hover:scale-[1.02] active:scale-95"
                  href="/register"
                >
                  Create Account
                </Link>
                <Link
                  className="rounded-xl bg-[#353438] px-8 py-4 font-headline text-lg font-bold text-[#e4e1e6] transition-colors hover:bg-[#39393c]"
                  href="/v2/login"
                >
                  Sign In
                </Link>
              </div>
              <div className="mt-16 grid grid-cols-2 gap-8 border-none md:grid-cols-3">
                <div>
                  <span className="font-headline block text-3xl font-bold text-[#e4e1e6]">
                    12.4K
                  </span>
                  <span className="font-label text-[10px] uppercase tracking-widest text-[#929094]">
                    Active Players
                  </span>
                </div>
                <div>
                  <span className="font-headline block text-3xl font-bold text-[#e4e1e6]">
                    482
                  </span>
                  <span className="font-label text-[10px] uppercase tracking-widest text-[#929094]">
                    Elite Clubs
                  </span>
                </div>
                <div className="hidden md:block">
                  <span className="font-headline block text-3xl font-bold text-[#4ce081]">
                    A+
                  </span>
                  <span className="font-label text-[10px] uppercase tracking-widest text-[#929094]">
                    Circuit Rating
                  </span>
                </div>
              </div>
            </div>

            <div className="group relative lg:col-span-5">
              <div className="relative aspect-4/5 w-full overflow-hidden rounded-xl shadow-2xl">
                <Image
                  alt="Professional Tennis Action"
                  className="scale-110 object-cover transition-transform duration-700 group-hover:scale-100"
                  src={IMG_HERO}
                  fill
                  sizes="(max-width: 1024px) 100vw, 42vw"
                  priority
                />
                <div className="absolute inset-0 bg-linear-to-t from-[#131316] via-transparent to-transparent" />
                <div className="glass-panel absolute bottom-6 left-6 right-6 rounded-xl border-none bg-[#131316]/40 p-4">
                  <div className="flex items-end justify-between">
                    <div>
                      <span className="font-label mb-1 block text-[10px] font-bold uppercase tracking-widest text-[#c2c1ff]">
                        Live Momentum
                      </span>
                      <span className="font-headline block text-lg text-[#e4e1e6]">
                        Match Win: Final Set
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="font-headline block text-2xl text-[#4ce081]">
                        +125
                      </span>
                      <span className="font-label block text-[8px] uppercase text-[#c8c5d2]">
                        Points Earned
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-8 -left-8 hidden h-48 w-48 flex-col items-center justify-center rounded-xl bg-[#1b1b1e] p-6 text-center shadow-xl xl:flex">
                <p className="font-headline text-sm font-bold leading-tight text-[#e4e1e6]">
                  <span className="text-[#c2c1ff] text-2xl italic">Pro-Tier</span> <br /> Verified
                </p>
              </div>  
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 py-24 md:px-12">
          <div className="mb-16">
            <h2 className="font-headline mb-4 text-3xl font-extrabold tracking-tighter text-[#e4e1e6] md:text-5xl">
              THE ARENA.
            </h2>
            <div className="h-1 w-24 bg-[#c2c1ff]" />
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-4 lg:grid-cols-6">
            <div className="relative flex flex-col justify-between overflow-hidden rounded-xl bg-[#1f1f22] p-8 md:col-span-4 lg:col-span-4">
              <div className="z-10">
                <h3 className="font-headline mb-4 text-2xl font-bold text-[#e4e1e6]">
                  Precision Rankings
                </h3>
                <p className="max-w-md leading-relaxed text-[#c8c5d2]">
                  Our proprietary algorithm calculates your standing based on
                  match difficulty, performance volatility, and court
                  conditions.
                </p>
              </div>
              <div className="no-scrollbar z-10 mt-8 flex gap-4 overflow-x-auto pb-4">
                <div className="min-w-[120px] rounded-lg bg-[#1b1b1e] p-4">
                  <span className="font-label mb-2 block text-[10px] uppercase text-[#c8c5ca]">
                    Pickleball
                  </span>
                  <span className="font-headline text-xl font-bold">Tier 4</span>
                </div>
                <div className="min-w-[120px] rounded-lg bg-[#00b65d]/20 p-4">
                  <span className="font-label mb-2 block text-[10px] uppercase text-[#6cfe9b]">
                    Badminton
                  </span>
                  <span className="font-headline text-xl font-bold text-[#6cfe9b]">
                    Tier 3
                  </span>
                </div>
                <div className="min-w-[120px] rounded-lg bg-[#1b1b1e] p-4">
                  <span className="font-label mb-2 block text-[10px] uppercase text-[#c8c5ca]">
                    Lawn Tennis
                  </span>
                  <span className="font-headline text-xl font-bold">Tier 2</span>
                </div>
                <div className="min-w-[120px] rounded-lg bg-[#1b1b1e]/60 p-4">
                  <span className="font-label mb-2 block text-[10px] uppercase text-[#c8c5ca]">
                    Ping Pong
                  </span>
                  <span className="font-headline text-xl font-bold">Tier 1</span>
                </div>
              </div>
              <div className="pointer-events-none absolute -bottom-20 -right-20 h-64 w-64 rounded-full bg-[#c2c1ff]/5" />
            </div>

            <div className="flex flex-col rounded-xl bg-[#353438] p-8 md:col-span-2 lg:col-span-2">
              <BuildingIcon className="mb-6 size-8 text-[#c2c1ff]" />
              <h3 className="font-headline mb-2 text-2xl font-bold text-[#e4e1e6]">
                Facilities
              </h3>
              <p className="text-sm leading-relaxed text-[#c8c5d2]">
                Connect with partner facilities. Join the game room, create your own matches,
                invite players, rank your performance and earn official facility points.
              </p>
            </div>

            <div className="flex flex-col justify-between rounded-xl border-none bg-[#1b1b1e] p-8 md:col-span-2 lg:col-span-2">
              <div>
                <h3 className="font-headline mb-4 text-2xl font-bold text-[#e4e1e6]">
                  Player Insights
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[#c8c5d2]">Win Rate</span>
                    <span className="font-bold text-[#4ce081]">78%</span>
                  </div>
                  <div className="h-1 w-full rounded-full bg-[#353438]">
                    <div
                      className="h-full rounded-full bg-[#4ce081]"
                      style={{ width: "78%" }}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[#c8c5d2]">Stamina</span>
                    <span className="font-bold text-[#c2c1ff]">92</span>
                  </div>
                  <div className="h-1 w-full rounded-full bg-[#353438]">
                    <div
                      className="h-full rounded-full bg-[#c2c1ff]"
                      style={{ width: "92%" }}
                    />
                  </div>
                </div>
              </div>
              <button
                type="button"
                className="font-label mt-8 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#e4e1e6] transition-all hover:gap-4"
              >
                View Stats{" "}
                <ArrowRightIcon className="size-4 text-[#e4e1e6]" />
              </button>
            </div>

            <div className="relative min-h-[240px] overflow-hidden rounded-xl border-none bg-[#131316] md:col-span-2 lg:col-span-4 lg:min-h-[280px]">
              <Image
                alt="Racket Court"
                className="object-cover opacity-40"
                src={IMG_COURT}
                fill
                sizes="(max-width: 768px) 100vw, 66vw"
              />
              <div className="absolute inset-0 flex flex-col justify-end bg-linear-to-t from-[#131316] via-transparent to-transparent p-8">
                <h3 className="font-headline mb-3 text-[1.8rem] font-bold text-[#e4e1e6]">
                  Find other players in Real-time
                </h3>
                <p className="max-w-sm text-sm text-[#c8c5d2]">
                  Real-time find other players based on skill level, favorite sports, and
                  preferred playing intensity. You can also create your own matches and invite players.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* <LandingBottomNav /> */}

      <footer className="mt-4 border-none px-6 pb-8 text-center md:px-12">
        <p className="font-label text-[8px] uppercase tracking-[0.2em] text-[#918f9c]">
          RacketTier © 2026 | All rights reserved
        </p>
      </footer>
    </>
  );
}
