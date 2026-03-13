"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { storeAuthToken } from "@/lib/auth";
import { useToast } from "@/lib/toast-context";
import { InlineError } from "@/components/InlineError";
import { RacketTierLogo } from "@/components/RacketTierLogo";
import { cn } from "@/lib/utils";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const PRONOUN_OPTIONS = [
  { value: "", label: "Pronoun" },
  { value: "He/Him", label: "He/Him" },
  { value: "She/Her", label: "She/Her" },
  { value: "They/Them", label: "They/Them" },
  { value: "Other", label: "Other" },
] as const;

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get("returnUrl") ?? "/dashboard";
  const [mounted, setMounted] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [age, setAge] = useState("");
  const [pronoun, setPronoun] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    setMounted(true);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isLoading) return;
    setError("");

    if (password !== passwordConfirmation) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setIsLoading(true);

    try {
      const payload: Record<string, string | number | undefined> = {
        name,
        email,
        password,
      };
      if (age.trim() !== "") {
        const ageNum = parseInt(age, 10);
        if (!Number.isNaN(ageNum) && ageNum >= 1 && ageNum <= 150) {
          payload.age = ageNum;
        }
      }
      if (pronoun.trim() !== "") {
        payload.pronoun = pronoun;
      }

      const res = await fetch(`${API_URL}/api/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const msg =
          data.errors?.email?.[0] ||
          data.errors?.name?.[0] ||
          data.errors?.password?.[0] ||
          data.errors?.age?.[0] ||
          data.errors?.pronoun?.[0] ||
          data.message ||
          "Registration failed. Please try again.";
        setError(msg);
        setIsLoading(false);
        return;
      }

      const token = data.token ?? data.data?.token;
      const expiresAtRaw = data.expires_at ?? data.data?.expires_at;
      const expiresAtMs =
        typeof expiresAtRaw === "string"
          ? new Date(expiresAtRaw).getTime()
          : undefined;
      if (token) {
        if (typeof window !== "undefined") {
          storeAuthToken(token, Number.isFinite(expiresAtMs) ? expiresAtMs : undefined);
        }
        showToast("Account created", "success");
        router.push("/onboarding");
        return;
      }

      setError("Invalid response from server.");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div
      className={cn(
        "relative h-screen -mx-4 overflow-hidden",
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
        <div className="w-full max-w-sm mx-auto space-y-6">
          <RacketTierLogo
            textSize="text-5xl"
            tagline="Create your account"
            mounted={mounted}
          />

          {/* Form with staggered animation */}
          <div
            className={cn(
              "transition-all duration-700 delay-100",
              mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            )}
          >
            <form
              onSubmit={handleSubmit}
              className="flex flex-col gap-4 rounded-2xl border border-zinc-200/80 bg-white/80 backdrop-blur-sm p-5 sm:p-6 shadow-sm"
              aria-busy={isLoading}
            >
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-zinc-700 mb-1"
                >
                  Name
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  autoComplete="name"
                  disabled={isLoading}
                  className="w-full rounded-xl border border-zinc-200/80 bg-white/80 px-3.5 py-2.5 text-zinc-900 placeholder-zinc-500 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200/80 disabled:opacity-70 disabled:cursor-not-allowed transition-colors duration-200"
                  placeholder="Your name"
                />
              </div>
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-zinc-700 mb-1"
                >
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  disabled={isLoading}
                  className="w-full rounded-xl border border-zinc-200/80 bg-white/80 px-3.5 py-2.5 text-zinc-900 placeholder-zinc-500 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200/80 disabled:opacity-70 disabled:cursor-not-allowed transition-colors duration-200"
                  placeholder="you@example.com"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="age"
                    className="block text-sm font-medium text-zinc-700 mb-1"
                  >
                    Age <span className="text-zinc-400 font-normal">(optional)</span>
                  </label>
                  <input
                    id="age"
                    type="number"
                    min={1}
                    max={150}
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    disabled={isLoading}
                    autoComplete="off"
                    className="w-full rounded-xl border border-zinc-200/80 bg-white/80 px-3.5 py-2.5 text-zinc-900 placeholder-zinc-500 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200/80 disabled:opacity-70 disabled:cursor-not-allowed transition-colors duration-200"
                    placeholder="Age"
                  />
                </div>
                <div>
                  <label
                    htmlFor="pronoun"
                    className="block text-sm font-medium text-zinc-700 mb-1"
                  >
                    Pronoun <span className="text-zinc-400 font-normal">(optional)</span>
                  </label>
                  <select
                    id="pronoun"
                    value={pronoun}
                    onChange={(e) => setPronoun(e.target.value)}
                    disabled={isLoading}
                    className="w-full mr-2 rounded-xl border border-zinc-200/80 bg-white/80 px-4 py-2.5 text-zinc-900 placeholder-zinc-300 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200/80 disabled:opacity-70 disabled:cursor-not-allowed transition-colors duration-200"
                  >
                    {PRONOUN_OPTIONS.map((opt) => (
                      <option key={opt.value || "empty"} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-zinc-700 mb-1"
                >
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  autoComplete="new-password"
                  disabled={isLoading}
                  className="w-full rounded-xl border border-zinc-200/80 bg-white/80 px-3.5 py-2.5 text-zinc-900 placeholder-zinc-500 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200/80 disabled:opacity-70 disabled:cursor-not-allowed transition-colors duration-200"
                  placeholder="At least 8 characters"
                />
              </div>
              <div>
                <label
                  htmlFor="passwordConfirmation"
                  className="block text-sm font-medium text-zinc-700 mb-1"
                >
                  Confirm password
                </label>
                <input
                  id="passwordConfirmation"
                  type="password"
                  value={passwordConfirmation}
                  onChange={(e) => setPasswordConfirmation(e.target.value)}
                  required
                  minLength={8}
                  autoComplete="new-password"
                  disabled={isLoading}
                  className="w-full rounded-xl border border-zinc-200/80 bg-white/80 px-3.5 py-2.5 text-zinc-900 placeholder-zinc-500 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200/80 disabled:opacity-70 disabled:cursor-not-allowed transition-colors duration-200"
                  placeholder="Confirm your password"
                />
              </div>
              {error && <InlineError message={error} />}
              <button
                type="submit"
                disabled={isLoading}
                aria-busy={isLoading}
                className={cn(
                  "w-full rounded-xl bg-zinc-900 py-3 px-4 text-sm font-semibold text-white",
                  "hover:bg-zinc-800 active:bg-zinc-950",
                  "transition-all duration-300 ease-out hover:scale-[1.02] active:scale-[0.98]",
                  "shadow-lg shadow-zinc-900/20 hover:shadow-xl hover:shadow-zinc-900/25",
                  "disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:hover:scale-100"
                )}
              >
                {isLoading ? "Creating account…" : "Create account"}
              </button>
            </form>
          </div>

          {/* Footer link with staggered animation */}
          <p
            className={cn(
              "text-center text-sm text-zinc-600 transition-all duration-700 delay-200",
              mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            )}
          >
            Already have an account?{" "}
            <Link
              href={`/login${returnUrl !== "/dashboard" ? `?returnUrl=${encodeURIComponent(returnUrl)}` : ""}`}
              className="font-semibold text-zinc-900 hover:text-violet-600 transition-colors duration-200"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div
          className={cn(
            "relative h-screen -mx-4 -mt-6 overflow-hidden",
            "flex flex-col justify-center"
          )}
        >
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
          <div className="relative px-8 py-12 sm:px-10 sm:py-16">
            <div className="w-full max-w-sm mx-auto animate-pulse space-y-6">
              <div className="h-8 bg-zinc-200/80 rounded w-32" />
              <div className="h-4 bg-zinc-200/60 rounded w-40" />
              <div className="rounded-2xl border border-zinc-200/80 bg-white/80 p-5 sm:p-6 space-y-4">
                <div className="h-10 bg-zinc-200/80 rounded-xl" />
                <div className="h-10 bg-zinc-200/80 rounded-xl" />
                <div className="h-10 bg-zinc-200/80 rounded-xl" />
                <div className="h-10 bg-zinc-200/80 rounded-xl" />
                <div className="h-10 bg-zinc-200/80 rounded-xl" />
                <div className="h-10 bg-zinc-200/80 rounded-xl" />
                <div className="h-11 bg-zinc-200/80 rounded-xl" />
              </div>
            </div>
          </div>
        </div>
      }
    >
      <RegisterForm />
    </Suspense>
  );
}
