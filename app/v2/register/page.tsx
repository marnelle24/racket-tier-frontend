"use client";

import { Suspense, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { RacketTierV2Wordmark } from "@/components/RacketTierV2Wordmark";
import { storeAuthToken } from "@/lib/auth";
import { getSafeRedirect } from "@/lib/redirect-validation";
import { useToast } from "@/lib/toast-context";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const GOOGLE_ICON =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuAg6awCdOFM2mUf4iHGroiuA4v5FGVYEt8GEc92F4OoyT6bPN8TgPc9BXPwzIwu6l6DzC-ib67_TfDdsMJGski5FBONFL2OCZtkAXkPfW5fjp0Aa7CYj1xz8fPs3c94HvcxIBfE931i7mdW-d75OYOWJO6ZRrdOwdqPYcK6Pvw4rcFmItgXGZeVHiOOpAG3gm5ycAVVg-8KThXtrrHSXtZuG76rIEYQYEUAfkK7vvhPTG9lGDjsnVhTkjSYXSaozv_E4CchpD1d7xc";

const APPLE_ICON =
  "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/apple/apple-original.svg";

const PRONOUN_OPTIONS = [
  { value: "", label: "Pronoun" },
  { value: "He/Him", label: "He" },
  { value: "She/Her", label: "She" },
  { value: "They/Them", label: "They" },
  { value: "Other", label: "Others" },
] as const;

function V2RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get("returnUrl") ?? "/dashboard";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [age, setAge] = useState("");
  const [pronounce, setPronounce] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");

  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { showToast } = useToast();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isLoading) return;

    setError("");
    setIsLoading(true);

    try {
      if (password !== passwordConfirmation) {
        setError("Passwords do not match.");
        setIsLoading(false);
        return;
      }

      const payload: Record<string, string | number | undefined> = {
        name: name.trim(),
        email: email.trim(),
        password,
      };

      const ageNum =
        age.trim() !== "" ? Math.trunc(Number.parseInt(age, 10)) : undefined;
      if (ageNum != null && !Number.isNaN(ageNum) && ageNum >= 1 && ageNum <= 150) {
        payload.age = ageNum;
      }

      if (pronounce.trim() !== "") {
        payload.pronoun = pronounce;
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
          storeAuthToken(
            token,
            Number.isFinite(expiresAtMs) ? expiresAtMs : undefined
          );
        }
        showToast("Account created", "success");
        router.push(getSafeRedirect(returnUrl));
        return;
      }

      setError("Invalid response from server.");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  const loginHref =
    returnUrl !== "/dashboard"
      ? `/v2/login?returnUrl=${encodeURIComponent(returnUrl)}`
      : "/v2/login";

  return (
    <div className="mesh-bg flex min-h-[max(884px,100dvh)] flex-col text-[#e4e1e6]">
      <main className="flex grow items-center justify-center px-6 py-12 md:py-24">
        <div className="w-full max-w-md space-y-12">
          <div className="space-y-4 text-center">
            <div className="inline-flex items-center justify-center">
              <Image
                src="/images/rt-logo.png"
                alt="RacketTier"
                width={44}
                height={44}
                className="h-11 w-11"
              />
            </div>
            <RacketTierV2Wordmark textSize="text-4xl" />
            <p className="font-medium tracking-tight text-[#c8c5d2]">
              Enter the kinetic world of racket sports <br />
              where every smash counts.
            </p>
          </div>

          <div className="space-y-8 rounded-xl bg-[#1b1b1e] p-8">
            <form className="space-y-6" onSubmit={handleSubmit} aria-busy={isLoading}>
              <div className="space-y-2">
                <label
                  htmlFor="v2-register-name"
                  className="font-label ml-1 block text-xs uppercase tracking-[0.15em] text-[#c8c5d2]"
                >
                  Name
                </label>
                <div className="relative">
                  <input
                    id="v2-register-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    autoComplete="name"
                    disabled={isLoading}
                    placeholder="Your name"
                    className="w-full rounded-lg border-none bg-[#0e0e11] px-4 py-3.5 text-[#e4e1e6] outline-none transition-all placeholder:text-[#918f9c]/50 focus:bg-[#2a2a2d] focus:ring-1 focus:ring-[#c2c1ff]/20 disabled:opacity-60"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="v2-register-email"
                  className="font-label ml-1 block text-xs uppercase tracking-[0.15em] text-[#c8c5d2]"
                >
                  Email Address
                </label>
                <div className="relative">
                  <input
                    id="v2-register-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    disabled={isLoading}
                    placeholder="name@example.com"
                    className="w-full rounded-lg border-none bg-[#0e0e11] px-4 py-3.5 text-[#e4e1e6] outline-none transition-all placeholder:text-[#918f9c]/50 focus:bg-[#2a2a2d] focus:ring-1 focus:ring-[#c2c1ff]/20 disabled:opacity-60"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label
                    htmlFor="v2-register-age"
                    className="font-label ml-1 block text-xs uppercase tracking-[0.15em] text-[#c8c5d2]"
                  >
                    Age
                  </label>
                  <div className="relative">
                    <input
                      id="v2-register-age"
                      type="number"
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      autoComplete="off"
                      disabled={isLoading}
                      placeholder="Age"
                      min={1}
                      max={150}
                      className="w-full rounded-lg border-none bg-[#0e0e11] px-4 py-3.5 text-[#e4e1e6] outline-none transition-all placeholder:text-[#918f9c]/50 focus:bg-[#2a2a2d] focus:ring-1 focus:ring-[#c2c1ff]/20 disabled:opacity-60"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="v2-register-pronounce"
                    className="font-label ml-1 block text-xs uppercase tracking-[0.15em] text-[#c8c5d2]"
                  >
                    Pronounce
                  </label>
                  <div className="relative">
                    <select
                      id="v2-register-pronounce"
                      value={pronounce}
                      onChange={(e) => setPronounce(e.target.value)}
                      disabled={isLoading}
                      className="w-full rounded-lg border-none bg-[#0e0e11] px-4 py-3.5 text-[#e4e1e6] outline-none transition-all placeholder:text-[#918f9c]/50 focus:bg-[#2a2a2d] focus:ring-1 focus:ring-[#c2c1ff]/20 disabled:opacity-60"
                    >
                      {PRONOUN_OPTIONS.map((opt) => (
                        <option
                          key={opt.value || "empty"}
                          value={opt.value}
                          className="bg-[#0e0e11] text-[#e4e1e6] text-xs tracking-[0.15em]"
                        >
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="v2-register-password"
                  className="font-label text-xs uppercase tracking-[0.15em] text-[#c8c5d2]"
                >
                  Password
                </label>
                <div className="relative">
                  <input
                    id="v2-register-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                    disabled={isLoading}
                    placeholder="••••••••"
                    className="w-full rounded-lg border-none bg-[#0e0e11] px-4 py-3.5 text-[#e4e1e6] outline-none transition-all placeholder:text-[#918f9c]/50 focus:bg-[#2a2a2d] focus:ring-1 focus:ring-[#c2c1ff]/20 disabled:opacity-60"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="v2-register-password-confirmation"
                  className="font-label text-xs uppercase tracking-[0.15em] text-[#c8c5d2]"
                >
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    id="v2-register-password-confirmation"
                    type="password"
                    value={passwordConfirmation}
                    onChange={(e) => setPasswordConfirmation(e.target.value)}
                    required
                    autoComplete="new-password"
                    disabled={isLoading}
                    placeholder="••••••••"
                    className="w-full rounded-lg border-none bg-[#0e0e11] px-4 py-3.5 text-[#e4e1e6] outline-none transition-all placeholder:text-[#918f9c]/50 focus:bg-[#2a2a2d] focus:ring-1 focus:ring-[#c2c1ff]/20 disabled:opacity-60"
                  />
                </div>
              </div>

              {error ? (
                <div
                  className="rounded-lg bg-[#93000a]/35 px-3 py-2 text-sm text-[#ffdad6]"
                  role="alert"
                >
                  {error}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={isLoading}
                className="mt-8 kinetic-gradient font-headline w-full rounded-xl py-4 font-bold text-[#211e6a] shadow-[0_20px_40px_-10px_rgba(194,193,255,0.2)] transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-60"
              >
                {isLoading ? "Creating account…" : "Create Account"}
              </button>
            </form>

            <div className="relative flex items-center justify-center py-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#474651]/15" />
              </div>
              <span className="font-label relative bg-[#1b1b1e] px-4 text-[10px] uppercase tracking-[0.2em] text-[#918f9c]">
                Or continue with
              </span>
            </div>

            <div>
              <div className="flex justify-center items-center text-[#918f9c]/70 text-xs mb-2">
                coming soon...
              </div>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  disabled={true}
                  className="cursor-not-allowed opacity-50 flex items-center justify-center gap-3 rounded-xl bg-[#5f5e60] py-3.5 transition-colors duration-200 hover:bg-[#39393c] active:scale-95"
                >
                  <Image
                    alt="Google"
                    className="h-5 w-5"
                    src={GOOGLE_ICON}
                    width={20}
                    height={20}
                  />
                  <span className="font-label text-xs font-semibold uppercase tracking-wider">
                    Google
                  </span>
                </button>
                <button
                  type="button"
                  disabled={true}
                  className="cursor-not-allowed opacity-50 flex items-center justify-center gap-3 rounded-xl bg-[#5f5e60] py-3.5 transition-colors duration-200 hover:bg-[#39393c] active:scale-95"
                >
                  <Image
                    src={APPLE_ICON}
                    alt="Apple"
                    width={20}
                    height={20}
                    className="h-5 w-5"
                  />
                  <span className="font-label text-xs font-semibold uppercase tracking-wider">
                    Apple
                  </span>
                </button>
              </div>
            </div>
          </div>

          <p className="text-center text-sm text-[#c8c5d2]">
            Already have an account?{" "}
            <Link
              href={loginHref}
              className="ml-1 font-bold text-[#4ce081] underline-offset-4 hover:underline"
            >
              Sign In
            </Link>
          </p>
        </div>
      </main>

      <div className="pointer-events-none fixed -left-20 top-[10%] h-64 w-64 rounded-full bg-[#c2c1ff]/5 blur-[100px]" />
      <div className="pointer-events-none fixed -right-20 bottom-[10%] h-80 w-80 rounded-full bg-[#4ce081]/5 blur-[120px]" />

      <footer className="p-8 text-center">
        <div className="font-label flex flex-wrap justify-center gap-x-8 gap-y-2 text-[10px] uppercase tracking-[0.2em] text-[#918f9c]">
          <a className="transition-colors hover:text-[#e4e1e6]" href="#">
            Privacy Policy
          </a>
          <a className="transition-colors hover:text-[#e4e1e6]" href="#">
            Terms of Service
          </a>
          <a className="transition-colors hover:text-[#e4e1e6]" href="#">
            Help Center
          </a>
        </div>
      </footer>
    </div>
  );
}

function V2RegisterFallback() {
  return (
    <div className="mesh-bg flex min-h-[max(884px,100dvh)] flex-col">
      <main className="flex grow items-center justify-center px-6 py-12">
        <div className="w-full max-w-md animate-pulse space-y-12">
          <div className="space-y-4 text-center">
            <div className="mx-auto h-16 w-16 rounded-xl bg-[#1f1f22]" />
            <div className="mx-auto h-8 w-48 rounded bg-[#2a2a2d]" />
            <div className="mx-auto h-4 w-64 rounded bg-[#2a2a2d]" />
          </div>
          <div className="space-y-6 rounded-xl bg-[#1b1b1e] p-8">
            <div className="h-10 rounded-lg bg-[#0e0e11]" />
            <div className="h-10 rounded-lg bg-[#0e0e11]" />
            <div className="grid grid-cols-2 gap-4">
              <div className="h-10 rounded-lg bg-[#0e0e11]" />
              <div className="h-10 rounded-lg bg-[#0e0e11]" />
            </div>
            <div className="h-10 rounded-xl bg-[#353438]" />
            <div className="h-12 rounded-xl bg-[#353438]" />
          </div>
        </div>
      </main>
    </div>
  );
}

export default function V2RegisterPage() {
  return (
    <Suspense fallback={<V2RegisterFallback />}>
      <V2RegisterForm />
    </Suspense>
  );
}

