/**
 * Laravel Echo client for Reverb (WebSockets). Use only in the browser.
 * Subscribing to private channels requires a valid auth token (e.g. from localStorage).
 */

import Echo from "laravel-echo";
import Pusher from "pusher-js";
import { logger } from "@/lib/logger";

declare global {
  interface Window {
    Pusher?: typeof Pusher;
  }
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const REVERB_KEY = process.env.NEXT_PUBLIC_REVERB_APP_KEY;
const REVERB_HOST_ENV = process.env.NEXT_PUBLIC_REVERB_HOST || "localhost";
// Reverb runs on 8080 by default; 8000 is the Laravel HTTP API (not the WebSocket server).
const REVERB_PORT = (() => {
  const raw = process.env.NEXT_PUBLIC_REVERB_PORT || "8080";
  const port = parseInt(raw, 10);
  return port === 8000 ? 8080 : port; // avoid using API port for WebSocket
})();
const REVERB_SCHEME = process.env.NEXT_PUBLIC_REVERB_SCHEME || "http";

// Temporary debug - remove after fixing
if (typeof window !== "undefined") {
  console.log("[Echo] REVERB_APP_KEY present:", !!process.env.NEXT_PUBLIC_REVERB_APP_KEY);
  console.log("[Echo] REVERB_HOST:", process.env.NEXT_PUBLIC_REVERB_HOST || "(not set)");
}
// Temporary debug - remove after fixing

let cachedEcho: Echo<"reverb"> | null = null;
let cachedToken: string | null = null;

function resolveApiUrl(): string {
  if (typeof window === "undefined") return API_URL;
  try {
    const parsed = new URL(API_URL);
    if ((parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1")
      && window.location.hostname !== "localhost"
      && window.location.hostname !== "127.0.0.1") {
      parsed.hostname = window.location.hostname;
      return parsed.toString().replace(/\/$/, "");
    }
    return API_URL;
  } catch {
    return API_URL;
  }
}

function resolveReverbHost(): string {
  if (typeof window === "undefined") return REVERB_HOST_ENV;

  // Common local-dev pitfall: using localhost from another device points to itself.
  // If host is localhost but page is opened from LAN/IP, use API host instead.
  if ((REVERB_HOST_ENV === "localhost" || REVERB_HOST_ENV === "127.0.0.1")
    && window.location.hostname !== "localhost"
    && window.location.hostname !== "127.0.0.1") {
    try {
      const apiHost = new URL(API_URL).hostname;
      if (apiHost) return apiHost;
    } catch {
      return REVERB_HOST_ENV;
    }
  }

  return REVERB_HOST_ENV;
}

/**
 * Get an Echo instance configured for Reverb with the given auth token.
 * Private channel subscriptions will use this token for /broadcasting/auth.
 * Returns null if not in browser, Reverb is not configured, or token is missing.
 */
export function getEcho(token: string | null): Echo<"reverb"> | null {
  if (typeof window === "undefined") return null;
  if (!REVERB_KEY) return null;
  if (!token) {
    if (cachedEcho) {
      cachedEcho.disconnect();
      cachedEcho = null;
      cachedToken = null;
    }
    return null;
  }

  if (cachedEcho && cachedToken === token) return cachedEcho;

  if (cachedEcho) {
    cachedEcho.disconnect();
    cachedEcho = null;
  }

  window.Pusher = Pusher;
  const resolvedHost = resolveReverbHost();
  const resolvedApiUrl = resolveApiUrl();
  const authHeaders = {
    Authorization: `Bearer ${token}`,
  };

  const echo = new Echo<"reverb">({
    broadcaster: "reverb",
    key: REVERB_KEY,
    wsHost: resolvedHost,
    wsPort: REVERB_PORT,
    wssPort: REVERB_PORT,
    forceTLS: REVERB_SCHEME === "https",
    enabledTransports: ["ws", "wss"],
    authEndpoint: `${resolvedApiUrl}/api/broadcasting/auth`,
    auth: {
      headers: authHeaders,
    },
    // Pusher JS v8+ uses channelAuthorization; keep both for compatibility.
    channelAuthorization: {
      endpoint: `${resolvedApiUrl}/api/broadcasting/auth`,
      transport: "ajax",
      headers: authHeaders,
    } as never,
    authorizer: ((channel: { name: string }) => ({
      authorize: (socketId: string, callback: (error: Error | null, data: Record<string, unknown> | null) => void) => {
        void (async () => {
          try {
            const res = await fetch(`${resolvedApiUrl}/api/broadcasting/auth`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
                "X-Requested-With": "XMLHttpRequest",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                socket_id: socketId,
                channel_name: channel.name,
              }),
            });

            const data = await res.json().catch(() => null);
            if (!res.ok) {
              logger.warn("Broadcast auth failed", {
                status: res.status,
                channel: channel.name,
              });
              callback(new Error(`Broadcast auth failed (${res.status})`), data);
              return;
            }
            callback(null, data);
          } catch (err) {
            logger.error("Broadcast auth request failed", err);
            callback(new Error("Broadcast auth request failed"), null);
          }
        })();
      },
    })) as never,
  });

  cachedEcho = echo;
  cachedToken = token;
  return echo;
}

/**
 * Disconnect and clear the cached Echo instance (e.g. on logout).
 */
export function disconnectEcho(): void {
  if (cachedEcho) {
    cachedEcho.disconnect();
    cachedEcho = null;
    cachedToken = null;
  }
}
