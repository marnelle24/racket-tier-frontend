"use client";

import { useEffect } from "react";
import { ToastProvider } from "@/lib/toast-context";

// Suppress AbortError from video.play() when media is removed before play() resolves.
// Common with camera streams (e.g. QR scanner) when stopping or navigating away.
// Uses capture phase so we run before Next.js dev overlay.
function suppressPlayAbortError(e: PromiseRejectionEvent) {
  const reason = e.reason;
  if (reason?.name !== "AbortError") return;
  const msg = String(reason?.message ?? "");
  if (
    msg.includes("play") ||
    msg.includes("interrupted") ||
    msg.includes("removed from the document")
  ) {
    e.preventDefault();
    e.stopPropagation();
  }
}

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    window.addEventListener("unhandledrejection", suppressPlayAbortError, true);
    return () =>
      window.removeEventListener("unhandledrejection", suppressPlayAbortError, true);
  }, []);

  return <ToastProvider>{children}</ToastProvider>;
}
