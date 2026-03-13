/**
 * Allowlist of safe redirect paths. Protects against open redirect attacks.
 */
const ALLOWED_REDIRECT_PATTERNS = [
  /^\/dashboard(\/|$)/,
  /^\/onboarding$/,
  /^\/account$/,
  /^\/facilities(\/|$)/,
  /^\/facility\/join$/,
  /^\/facility\/\d+(\/room)?$/,
  /^\/statistics$/,
];

/**
 * Returns true if the path is safe to redirect to.
 */
export function isAllowedRedirectPath(path: string): boolean {
  if (!path || typeof path !== "string") return false;
  const normalized = path.replace(/\\/g, "/");
  if (!normalized.startsWith("/") || normalized.startsWith("//"))
    return false;
  return ALLOWED_REDIRECT_PATTERNS.some((p) => p.test(normalized));
}

/**
 * Returns the path if allowed, otherwise /dashboard.
 */
export function getSafeRedirect(returnUrl: string | null): string {
  return returnUrl && isAllowedRedirectPath(returnUrl) ? returnUrl : "/dashboard";
}
