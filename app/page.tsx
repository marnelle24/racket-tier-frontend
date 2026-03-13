"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { ArrowRight, Zap, Trophy, Users } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Home() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div
      className={cn(
        "relative min-h-[calc(100vh)] -mx-4 overflow-hidden",
        "flex flex-col justify-center"
      )}
    >
      {/* Animated gradient background */}
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
      {/* Subtle grid pattern */}
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

      {/* Floating orbs - decorative */}
      <div
        className={cn(
          "absolute top-1/4 left-1/4 w-64 h-64 rounded-full opacity-30 blur-3xl transition-all duration-1000 animate-float",
          mounted && "animate-in fade-in duration-700"
        )}
        style={{
          background: "radial-gradient(circle, rgba(120, 119, 198, 0.4) 0%, transparent 70%)",
        }}
      />
      <div
        className={cn(
          "absolute bottom-1/3 right-1/4 w-48 h-48 rounded-full opacity-20 blur-3xl transition-all duration-1000 delay-300",
          mounted && "animate-in fade-in duration-700"
        )}
        style={{
          background: "radial-gradient(circle, rgba(74, 222, 128, 0.4) 0%, transparent 70%)",
          animation: "float 10s ease-in-out infinite reverse",
        }}
      />

      <div className="relative px-8 py-12 sm:px-10 sm:py-16">
        {/* Hero content */}
        <div className="max-w-sm mx-auto text-center space-y-8">
          {/* Logo/Brand with staggered animation */}
          <div
            className={cn(
              "space-y-2 transition-all duration-700",
              mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            )}
          >
            <div className="flex justify-center">
              <Image
                src="/images/racketTier-logo-v1.png?v=2"
                alt="Racket Tier"
                width={150}
                height={100}
                loading="eager"
                style={{ width: "auto", height: "auto" }}
              />
            </div>
            <h1
              className="text-4xl sm:text-5xl font-bold tracking-tight text-zinc-900"
              style={{
                fontVariationSettings: "'wght' 700",
                letterSpacing: "-0.02em",
              }}
            >
              Racket
              <span
                className="bg-linear-to-r from-violet-600 to-emerald-600 bg-clip-text text-transparent"
                style={{ letterSpacing: "-0.02em" }}
              >
                Tier
              </span>
            </h1>
            <p
              className={cn(
                "text-zinc-500 text-xs font-light uppercase leading-tight tracking-[0.17rem] transition-all duration-700 delay-100",
                mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              )}
            >
              Every Smash Counts
            </p>
          </div>

          {/* Feature highlights - animated cards */}
          <div
            className={cn(
              "grid grid-cols-3 gap-3 transition-all duration-700 delay-200",
              mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            )}
          >
            {[
              {
                icon: Users,
                label: "Join",
                className: "group hover:bg-emerald-50 hover:border-emerald-200/60 hover:scale-[1.02] active:scale-[0.98]",
              },
              {
                icon: Zap,
                label: "Play",
                className: "group hover:bg-violet-50 hover:border-violet-200/60 hover:scale-[1.02] active:scale-[0.98]",
              },
              {
                icon: Trophy,
                label: "Rank",
                className: "group hover:bg-amber-50 hover:border-amber-200/60 hover:scale-[1.02] active:scale-[0.98]",
              },
            ].map(({ icon: Icon, label, className }) => (
              <div
                key={label}
                className={cn(
                  "flex flex-col items-center gap-2 p-4 rounded-2xl border border-zinc-200/80 bg-white/80 backdrop-blur-sm",
                  "transition-all duration-300 ease-out cursor-default",
                  className
                )}
              >
                <div className="p-2 rounded-xl transition-colors duration-300">
                  <Icon className="size-5 text-zinc-600 group-hover:text-violet-600 transition-colors duration-300" />
                </div>
                <span className="text-xs font-bold uppercase leading-tight tracking-[0.2rem] text-zinc-600">{label}</span>
              </div>
            ))}
          </div>

          {/* CTA section */}
          <div
            className={cn(
              "space-y-4 transition-all duration-700 delay-300",
              mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            )}
          >
            <p className="text-zinc-500 text-sm mb-8">
              Join the game and rank your performance. <br />
              Sign in or create an account to get started.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center sm:gap-4">
              <Link
                href="/login"
                className={cn(
                  "group inline-flex items-center justify-center gap-2 w-full sm:w-auto",
                  "rounded-xl bg-zinc-900 py-3.5 px-6 text-sm font-semibold text-white",
                  "hover:bg-zinc-800 active:bg-zinc-950",
                  "transition-all duration-300 ease-out hover:scale-[1.02] active:scale-[0.98]",
                  "shadow-lg shadow-zinc-900/20 hover:shadow-xl hover:shadow-zinc-900/25"
                )}
              >
                Sign in
                <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-0.5" />
              </Link>
              <Link
                href="/register"
                className={cn(
                  "inline-flex items-center justify-center w-full sm:w-auto",
                  "rounded-xl border-2 border-zinc-200 py-3.5 px-6 text-sm font-semibold text-zinc-900",
                  "bg-white/80 backdrop-blur-sm",
                  "hover:border-zinc-300 hover:bg-zinc-50 active:bg-zinc-100",
                  "transition-all duration-300 ease-out hover:scale-[1.02] active:scale-[0.98]"
                )}
              >
                Create account
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
