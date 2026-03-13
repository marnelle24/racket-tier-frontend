/**
 * Auth cookie name. Must match middleware.ts so the auth guard can read it.
 * Set on login; clear on logout.
 */
export const AUTH_COOKIE = "auth_token";

const AUTH_TOKEN_STORAGE_KEY = "token";
const AUTH_TOKEN_EXPIRES_AT_STORAGE_KEY = "token_expires_at";

function getLocalMidnight(date: Date): Date {
  const midnight = new Date(date);
  midnight.setHours(24, 0, 0, 0);
  return midnight;
}

function getSecondsUntilLocalMidnight(): number {
  const now = new Date();
  const midnight = getLocalMidnight(now);
  return Math.max(1, Math.floor((midnight.getTime() - now.getTime()) / 1000));
}

function getSecondsUntil(expiresAtMs: number): number {
  return Math.max(1, Math.floor((expiresAtMs - Date.now()) / 1000));
}

export function setAuthCookie(token: string, expiresAtMs?: number): void {
  if (typeof document === "undefined") return;
  const maxAge =
    expiresAtMs != null ? getSecondsUntil(expiresAtMs) : getSecondsUntilLocalMidnight();
  document.cookie = `${AUTH_COOKIE}=${encodeURIComponent(token)}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

export function clearAuthCookie(): void {
  if (typeof document === "undefined") return;
  document.cookie = `${AUTH_COOKIE}=; path=/; max-age=0`;
}

/**
 * Store auth token and optional server-side expiry (ms). If expiresAtMs is omitted,
 * falls back to local midnight for backward compatibility.
 */
export function storeAuthToken(token: string, expiresAtMs?: number): void {
  if (typeof window === "undefined") return;
  const expiresAt =
    expiresAtMs != null && Number.isFinite(expiresAtMs)
      ? expiresAtMs
      : getLocalMidnight(new Date()).getTime();
  localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token);
  localStorage.setItem(AUTH_TOKEN_EXPIRES_AT_STORAGE_KEY, String(expiresAt));
  setAuthCookie(token, expiresAt);
}

export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;

  const token = localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
  const expiresAtRaw = localStorage.getItem(AUTH_TOKEN_EXPIRES_AT_STORAGE_KEY);
  const expiresAt = Number(expiresAtRaw);

  if (!token || !expiresAtRaw || !Number.isFinite(expiresAt) || Date.now() >= expiresAt) {
    // Require both localStorage and cookie; no cookie fallback.
    clearStoredAuthToken();
    return null;
  }

  return token;
}

export function clearStoredAuthToken(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
  localStorage.removeItem(AUTH_TOKEN_EXPIRES_AT_STORAGE_KEY);
  clearAuthCookie();
}
