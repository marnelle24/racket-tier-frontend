export const DICEBEAR_BASE = "https://api.dicebear.com/9.x/lorelei/svg";

export const AVATAR_PICKER_SEEDS = [
  "avocado",
  "kiwi",
  "grape",
  "cherry",
  "berry",
  "star",
  "comet",
  "orbit",
  "nebula",
  "river",
  "cloud",
  "mountain",
] as const;

export const AVATAR_SEED_BACKGROUNDS: Record<(typeof AVATAR_PICKER_SEEDS)[number], string> = {
  avocado: "bg-lime-100",
  kiwi: "bg-emerald-100",
  grape: "bg-violet-100",
  cherry: "bg-rose-100",
  berry: "bg-fuchsia-100",
  star: "bg-amber-100",
  comet: "bg-sky-100",
  orbit: "bg-indigo-100",
  nebula: "bg-purple-100",
  river: "bg-cyan-100",
  cloud: "bg-slate-100",
  mountain: "bg-stone-100",
};

export function getInitial(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return "?";
  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    const first = parts[0]!.charAt(0).toUpperCase();
    const last = parts[parts.length - 1]!.charAt(0).toUpperCase();
    return `${first}${last}`;
  }
  return trimmed.slice(0, 2).toUpperCase();
}

export function diceBearUrl(seed: string, size = 128): string {
  return `${DICEBEAR_BASE}?seed=${encodeURIComponent(seed)}&size=${size}`;
}

export function getAvatarBackgroundClass(seed: string): string {
  return AVATAR_SEED_BACKGROUNDS[seed as (typeof AVATAR_PICKER_SEEDS)[number]] ?? "bg-zinc-100";
}
