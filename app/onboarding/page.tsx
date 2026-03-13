"use client";

import Link from "next/link";
import { Building2, Gamepad2, Trophy, BarChart2, ChevronRight } from "lucide-react";
import { RacketTierLogo } from "@/components/RacketTierLogo";

const featureCards = [
  {
    title: "Facility Check-In",
    description: "Join a facility first so you can open its game room and play.",
    icon: Building2,
  },
  {
    title: "Create & Invite",
    description: "Create a game, choose players, and send invites in seconds.",
    icon: Gamepad2,
  },
  {
    title: "Tier Ranking",
    description: "Win matches, climb tiers, and track your progress over time.",
    icon: Trophy,
  },
  {
    title: "Player Stats",
    description: "See wins, losses, and game history from your dashboard and stats.",
    icon: BarChart2,
  },
];

export default function OnboardingPage() {
  return (
    <div className="relative min-h-screen -mx-4 overflow-hidden">
      <div
        className="absolute inset-0 -z-10"
        style={{
          background: `
            radial-gradient(ellipse 80% 50% at 50% -20%, rgba(120, 119, 198, 0.3), transparent),
            radial-gradient(ellipse 60% 40% at 100% 100%, rgba(74, 222, 128, 0.15), transparent),
            radial-gradient(ellipse 50% 30% at 0% 80%, rgba(251, 191, 36, 0.12), transparent),
            linear-gradient(180deg, #fafafa 0%, #f4f4f5 50%, #fafafa 100%)
          `,
        }}
      />
      <div
        className="absolute inset-0 -z-10 opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(0,0,0,1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,0,0,1) 1px, transparent 1px)
          `,
          backgroundSize: "48px 48px",
        }}
      />

      <div
        className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full blur-3xl transition-opacity duration-700 animate-float opacity-30"
        style={{
          background:
            "radial-gradient(circle, rgba(120, 119, 198, 0.4) 0%, transparent 70%)",
        }}
      />
      <div
        className="absolute bottom-1/3 right-1/4 w-48 h-48 rounded-full blur-3xl transition-opacity duration-700 delay-150 animate-float opacity-20"
        style={{
          background:
            "radial-gradient(circle, rgba(74, 222, 128, 0.4) 0%, transparent 70%)",
          animation: "float 10s ease-in-out infinite reverse",
        }}
      />

      <div className="relative px-6 pt-20 pb-24 min-w-0 overflow-x-hidden">
        <div className="w-full max-w-md mx-auto space-y-6 min-w-0">
          <div
            className="animate-in fade-in animation-duration-[700ms] [animation-delay:80ms] fill-mode-[forwards]"
          >
            <p className="mb-1 text-sm text-start font-medium uppercase tracking-[0.10rem] text-zinc-400">
              Welcome to
            </p>
            <RacketTierLogo
              textSize="text-5xl"
              tagline={null}
              mounted
              className="min-h-[42px] flex justify-start items-center"
            />
          </div>

          <header
            className="space-y-2 animate-in fade-in animation-duration-[700ms] [animation-delay:180ms] fill-mode-[forwards]"
          >

            <h1 className="text-lg font-bold text-zinc-900 leading-6">
              You are all set. Here is a quick walkthrough.
            </h1>
            <p className="text-sm text-zinc-500">
              Learn the basics, create your first game, and invite friends at your facility.
            </p>
          </header>

          <section
            className="grid gap-3"
          >
            {featureCards.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="rounded-2xl border border-zinc-200/80 bg-white/80 backdrop-blur-sm p-4 shadow-sm animate-in fade-in animation-duration-[700ms] fill-mode-[forwards]"
                  style={{ animationDelay: `${280 + index * 90}ms` }}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-zinc-700">
                      <Icon className="h-5 w-5" aria-hidden />
                    </div>
                    <div className="min-w-0">
                      <h2 className="text-sm font-semibold text-zinc-900">
                        {feature.title}
                      </h2>
                      <p className="text-sm text-zinc-500 mt-0.5">{feature.description}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </section>

          <div
            className="grid gap-3"
          >
            <Link
              href="/facility/join"
              className="group w-full flex items-center gap-3 rounded-2xl bg-linear-to-br from-emerald-500 to-emerald-600 p-4 shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/35 transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] animate-in fade-in animation-duration-[700ms] [animation-delay:720ms] fill-mode-[forwards]"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/20 text-white">
                <Building2 className="h-5 w-5" aria-hidden />
              </div>
              <div className="flex-1 text-left">
                <p className="font-semibold text-white">Check In at a Facility</p>
                <p className="text-sm text-white/90">Join a facility first so you can open its game room and play.</p>
              </div>
              <ChevronRight className="h-5 w-5 shrink-0 text-white/90 group-hover:translate-x-0.5 transition-transform" />
            </Link>

            <Link
              href="/dashboard"
              className="w-full flex items-center justify-center rounded-xl border border-zinc-200/80 bg-white/80 p-3.5 text-sm font-semibold text-zinc-700 hover:bg-zinc-50/80 hover:border-zinc-300/80 transition-colors animate-in fade-in animation-duration-[700ms] [animation-delay:820ms] fill-mode-[forwards]"
            >
              Go to My Dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
