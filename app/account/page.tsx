"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAuthToken } from "@/lib/auth";
import { useToast } from "@/lib/toast-context";
import { InlineError } from "@/components/InlineError";
import { RacketTierLogo } from "@/components/RacketTierLogo";
import { UserAvatar } from "@/components/UserAvatar";
import Image from "next/image";
import { cn } from "@/lib/utils";
import {
  AVATAR_PICKER_SEEDS,
  AVATAR_SEED_BACKGROUNDS,
  diceBearUrl,
} from "@/lib/avatar";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const PRONOUN_OPTIONS = [
  { value: "", label: "Pronoun" },
  { value: "He/Him", label: "He/Him" },
  { value: "She/Her", label: "She/Her" },
  { value: "They/Them", label: "They/Them" },
  { value: "Other", label: "Other" },
] as const;

const PRIMARY_SPORT_OPTIONS = [
  { value: "", label: "Select your primary sport" },
  { value: "badminton", label: "Badminton" },
  { value: "pickleball", label: "Pickleball" },
  { value: "tennis", label: "Tennis" },
  { value: "ping-pong", label: "Ping-pong" },
] as const;

type Me = {
  id: number;
  name: string;
  email: string;
  age?: number | null;
  pronoun?: string | null;
  primary_sport?: string | null;
  nickname?: string | null;
  avatar_seed?: string | null;
  email_verified_at?: string | null;
  created_at?: string;
  updated_at?: string;
};

const sharedBackgroundStyle = {
  gradient: `
    radial-gradient(ellipse 80% 50% at 50% -20%, rgba(120, 119, 198, 0.3), transparent),
    radial-gradient(ellipse 60% 40% at 100% 100%, rgba(74, 222, 128, 0.15), transparent),
    radial-gradient(ellipse 50% 30% at 0% 80%, rgba(251, 191, 36, 0.12), transparent),
    linear-gradient(180deg, #fafafa 0%, #f4f4f5 50%, #fafafa 100%)
  `,
  grid: `
    linear-gradient(rgba(0,0,0,1) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0,0,0,1) 1px, transparent 1px)
  `,
};

export default function AccountPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [mounted, setMounted] = useState(false);
  const [me, setMe] = useState<Me | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [profileError, setProfileError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [age, setAge] = useState("");
  const [pronoun, setPronoun] = useState("");
  const [primarySport, setPrimarySport] = useState("");
  const [nickname, setNickname] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      router.push("/login?returnUrl=/account");
      return;
    }

    fetch(`${API_URL}/api/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Could not load user.");
        return res.json();
      })
      .then((data) => {
        const user = data?.data?.user ?? data?.user ?? data;
        setMe(user);
        setName(user?.name ?? "");
        setEmail(user?.email ?? "");
        setAge(user?.age != null ? String(user.age) : "");
        setPronoun(user?.pronoun ?? "");
        setPrimarySport(user?.primary_sport ?? "");
        setNickname(user?.nickname ?? "");
      })
      .catch(() => setError("Could not load your account."))
      .finally(() => setIsLoading(false));
  }, [router]);

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!me || isSavingProfile) return;
    setProfileError("");
    setIsSavingProfile(true);

    const token = getAuthToken();
    if (!token) return;

    const payload: Record<string, string | number | null | undefined> = {
      name: name.trim(),
      email: email.trim(),
      age: age.trim() ? Math.min(150, Math.max(1, parseInt(age, 10) || 0)) : null,
      pronoun: pronoun.trim() || null,
      primary_sport: primarySport.trim() || null,
      nickname: nickname.trim() || null,
      avatar_seed: me.avatar_seed ?? null,
    };

    try {
      const res = await fetch(`${API_URL}/api/me`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const msg =
          data.errors?.email?.[0] ||
          data.errors?.name?.[0] ||
          data.message ||
          "Failed to update profile.";
        setProfileError(msg);
        setIsSavingProfile(false);
        return;
      }

      const updated = data?.data?.user ?? data?.user ?? data;
      setMe(updated);
      showToast("Profile updated", "success");
    } catch {
      setProfileError("Network error. Please try again.");
    } finally {
      setIsSavingProfile(false);
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (isSavingPassword) return;
    setPasswordError("");

    if (newPassword.length < 8) {
      setPasswordError("Password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match.");
      return;
    }

    const token = getAuthToken();
    if (!token) return;

    setIsSavingPassword(true);
    try {
      const res = await fetch(`${API_URL}/api/me/password`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          current_password: currentPassword,
          password: newPassword,
          password_confirmation: confirmPassword,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const msg =
          data.errors?.current_password?.[0] ||
          data.errors?.password?.[0] ||
          data.message ||
          "Failed to change password.";
        setPasswordError(msg);
        setIsSavingPassword(false);
        return;
      }

      showToast("Password updated", "success");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      setPasswordError("Network error. Please try again.");
    } finally {
      setIsSavingPassword(false);
    }
  }

  async function handleSelectAvatar(seed: string) {
    if (!me || isSavingProfile) return;
    const token = getAuthToken();
    if (!token) return;

    setIsSavingProfile(true);
    setProfileError("");
    const payload = {
      name: me.name,
      email: me.email,
      age: me.age ?? null,
      pronoun: me.pronoun ?? null,
      primary_sport: me.primary_sport ?? null,
      nickname: me.nickname ?? null,
      avatar_seed: seed,
    };
    try {
      const res = await fetch(`${API_URL}/api/me`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setProfileError(data?.message ?? "Failed to update avatar.");
        setIsSavingProfile(false);
        return;
      }

      const updated = data?.data?.user ?? data?.user ?? data;
      setMe(updated);
      showToast("Avatar updated", "success");
    } catch {
      setProfileError("Network error. Please try again.");
    } finally {
      setIsSavingProfile(false);
    }
  }

  const inputClass =
    "w-full rounded-xl border border-zinc-200/80 bg-white/80 px-3.5 py-2.5 text-zinc-900 placeholder-zinc-500 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200/80 disabled:opacity-70 disabled:cursor-not-allowed transition-colors duration-200";
  const labelClass = "block text-sm font-medium text-zinc-700 mb-1";
  const sectionClass =
    "rounded-2xl border border-zinc-200/80 bg-white/80 backdrop-blur-sm p-5 sm:p-6 shadow-sm";

  if (isLoading) {
    return (
      <div className="relative min-h-screen -mx-4 overflow-hidden">
        <div className="absolute inset-0 -z-10" style={{ background: sharedBackgroundStyle.gradient }} />
        <div
          className="absolute inset-0 -z-10 opacity-[0.03]"
          style={{ backgroundImage: sharedBackgroundStyle.grid, backgroundSize: "48px 48px" }}
        />
        <div className="relative px-8 py-12">
          <div className="w-full max-w-md mx-auto space-y-6 animate-pulse">
            <div className="h-8 bg-zinc-200/80 rounded w-40" />
            <div className={cn(sectionClass, "space-y-4")}>
              <div className="h-24 rounded-full bg-zinc-200/80 w-24 mx-auto" />
              <div className="h-10 bg-zinc-200/80 rounded-xl" />
              <div className="h-10 bg-zinc-200/80 rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="relative min-h-screen -mx-4 overflow-hidden">
        <div className="absolute inset-0 -z-10" style={{ background: sharedBackgroundStyle.gradient }} />
        <div className="relative px-8 py-12">
          <div className="w-full max-w-md mx-auto space-y-4">
            <RacketTierLogo textSize="text-3xl" tagline={null} mounted={true} />
            <InlineError message={error} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen -mx-4 overflow-hidden">
      <div className="absolute inset-0 -z-10" style={{ background: sharedBackgroundStyle.gradient }} />
      <div
        className="absolute inset-0 -z-10 opacity-[0.03]"
        style={{ backgroundImage: sharedBackgroundStyle.grid, backgroundSize: "48px 48px" }}
      />
      <div
        className={cn(
          "absolute top-1/4 left-1/4 w-64 h-64 rounded-full blur-3xl transition-opacity duration-700 animate-float",
          mounted ? "opacity-30" : "opacity-0"
        )}
        style={{
          background: "radial-gradient(circle, rgba(120, 119, 198, 0.4) 0%, transparent 70%)",
        }}
      />
      <div
        className={cn(
          "absolute bottom-1/3 right-1/4 w-48 h-48 rounded-full blur-3xl transition-opacity duration-700 delay-150 animate-float",
          mounted ? "opacity-20" : "opacity-0"
        )}
        style={{
          background: "radial-gradient(circle, rgba(74, 222, 128, 0.4) 0%, transparent 70%)",
          animation: "float 10s ease-in-out infinite reverse",
        }}
      />

      <div className="relative px-6 pt-5 pb-24 min-w-0 overflow-x-hidden">
        <div className="w-full max-w-md mx-auto space-y-6">
          <nav
            className={cn(
              "flex items-center transition-all duration-700",
              mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            )}
          >
            <RacketTierLogo textSize="text-3xl" tagline={null} mounted={mounted} className="min-h-[44px] flex items-center" />
          </nav>

          <header
            className={cn(
              "space-y-1 transition-all duration-700 delay-75",
              mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            )}
          >
            <h1 className="text-2xl font-bold text-zinc-900 leading-6">My Account</h1>
          </header>

          {/* Avatar section */}
          <section
            className={cn(
              sectionClass,
              "space-y-4 transition-all duration-700 delay-100",
              mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            )}
          >
            <h2 className="text-sm font-semibold text-zinc-800">Avatar</h2>
            <div className="flex flex-col items-center gap-4">
              <UserAvatar
                name={me?.name ?? "?"}
                avatarSeed={me?.avatar_seed}
                size={96}
              />
              <p className="text-xs text-zinc-500">Choose an avatar</p>
              <div className="grid grid-cols-6 gap-2">
                {AVATAR_PICKER_SEEDS.map((seed) => (
                  <button
                    key={seed}
                    type="button"
                    onClick={() => handleSelectAvatar(seed)}
                    disabled={isSavingProfile}
                    className={cn(
                      "size-10 rounded-full overflow-hidden border-2 transition-all focus:outline-none focus:ring-2 focus:ring-zinc-400 focus:ring-offset-2",
                      AVATAR_SEED_BACKGROUNDS[seed],
                      me?.avatar_seed === seed
                        ? "border-primary ring-2 ring-primary/30"
                        : "border-zinc-200 hover:border-zinc-300"
                    )}
                  >
                    <Image
                      src={diceBearUrl(seed, 62)}
                      alt=""
                      width={62}
                      height={62}
                      unoptimized
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>
          </section>

          <h2 className="text-lg font-semibold text-zinc-800 mb-2">Personal Info</h2>
          {/* Personal info + new fields */}
          <form
            onSubmit={handleSaveProfile}
            className={cn(
              sectionClass,
              "space-y-4 transition-all duration-700 delay-150",
              mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            )}
          >
            <div>
              <label htmlFor="name" className={labelClass}>Name</label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoComplete="name"
                disabled={isSavingProfile}
                className={inputClass}
                placeholder="Your name"
              />
            </div>
            <div>
              <label htmlFor="email" className={labelClass}>Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                disabled={isSavingProfile}
                className={inputClass}
                placeholder="you@example.com"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="age" className={labelClass}>Age <span className="text-zinc-400 font-normal">(optional)</span></label>
                <input
                  id="age"
                  type="number"
                  min={1}
                  max={150}
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  disabled={isSavingProfile}
                  autoComplete="off"
                  className={inputClass}
                  placeholder="Age"
                />
              </div>
              <div>
                <label htmlFor="pronoun" className={labelClass}>Pronoun</label>
                <select
                  id="pronoun"
                  value={pronoun}
                  onChange={(e) => setPronoun(e.target.value)}
                  disabled={isSavingProfile}
                  className={inputClass}
                >
                  {PRONOUN_OPTIONS.map((opt) => (
                    <option key={opt.value || "empty"} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label htmlFor="nickname" className={labelClass}>Nick Name <span className="text-zinc-400 font-normal">(optional)</span></label>
              <input
                id="nickname"
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                disabled={isSavingProfile}
                autoComplete="nickname"
                className={inputClass}
                placeholder="Preferred nickname"
              />
            </div>
            <div>
              <label htmlFor="primary_sport" className={labelClass}>Primary Sport</label>
              <select
                id="primary_sport"
                value={primarySport}
                onChange={(e) => setPrimarySport(e.target.value)}
                disabled={isSavingProfile}
                className={inputClass}
              >
                {PRIMARY_SPORT_OPTIONS.map((opt) => (
                  <option key={opt.value || "empty"} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            {profileError && <InlineError message={profileError} />}
            <button
              type="submit"
              disabled={isSavingProfile}
              className={cn(
                "w-full rounded-xl drop-shadow-md bg-linear-to-br from-emerald-500 via-emerald-400 to-emerald-500 py-3 px-4 text-sm font-semibold text-white",
                "hover:bg-emerald-700 active:bg-emerald-800",
                "transition-all duration-300 ease-out hover:scale-[1.02] active:scale-[0.98]",
                "shadow-lg shadow-zinc-900/20 hover:shadow-xl hover:shadow-zinc-900/25",
                "disabled:opacity-50 disabled:pointer-events-none disabled:hover:scale-100"
              )}
            >
              {isSavingProfile ? "Saving…" : "Save profile"}
            </button>
          </form>

          <h2 className="text-lg font-semibold text-zinc-800 mb-2">Change Password</h2>
          <form
            onSubmit={handleChangePassword}
            className={cn(
              sectionClass,
              "space-y-4 transition-all duration-700 delay-200",
              mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            )}
          >
            <div>
              <label htmlFor="current_password" className={labelClass}>Current Password</label>
              <input
                id="current_password"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                autoComplete="current-password"
                disabled={isSavingPassword}
                className={inputClass}
                placeholder="Current password"
              />
            </div>
            <div>
              <label htmlFor="new_password" className={labelClass}>New password</label>
              <input
                id="new_password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
                disabled={isSavingPassword}
                className={inputClass}
                placeholder="At least 8 characters"
              />
            </div>
            <div>
              <label htmlFor="confirm_password" className={labelClass}>Confirm new password</label>
              <input
                id="confirm_password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
                disabled={isSavingPassword}
                className={inputClass}
                placeholder="Confirm new password"
              />
            </div>
            {passwordError && <InlineError message={passwordError} />}
            <button
              type="submit"
              disabled={isSavingPassword}
              className={cn(
                "w-full rounded-xl drop-shadow-md bg-linear-to-br from-emerald-500 via-emerald-400 to-emerald-500 py-3 px-4 text-sm font-semibold text-white",
                "hover:bg-emerald-700 active:bg-emerald-800",
                "transition-all duration-300 ease-out hover:scale-[1.02] active:scale-[0.98]",
                "shadow-lg shadow-zinc-900/20 hover:shadow-xl hover:shadow-zinc-900/25",
                "disabled:opacity-50 disabled:pointer-events-none disabled:hover:scale-100"
              )}
            >
              {isSavingPassword ? "Updating…" : "Update password"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
