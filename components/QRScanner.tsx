"use client";

import { useEffect, useId, useRef, useState } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Parse facility token from QR code content.
 * Handles: raw token, URL with ?token=, or path with ?token=
 */
export function parseFacilityTokenFromQR(decodedText: string): string | null {
  const trimmed = decodedText.trim();
  if (!trimmed) return null;

  // URL format: ...?token=xxx or ...&token=xxx
  try {
    const url = new URL(trimmed.startsWith("http") ? trimmed : `https://dummy.com${trimmed.startsWith("/") ? "" : "/"}${trimmed}`);
    const token = url.searchParams.get("token");
    if (token) return token;
  } catch {
    // Not a valid URL, treat as raw token
  }

  return trimmed;
}

type QRScannerProps = {
  active?: boolean;
  onScan: (token: string) => void;
  onClose?: () => void;
  onRetry?: () => void;
  className?: string;
};

async function stopScanner(
  scanner: { stop: () => Promise<void> } | null
): Promise<void> {
  if (!scanner) return;
  try {
    await scanner.stop();
  } catch (e) {
    // AbortError occurs when video is removed before play() resolves - safe to ignore
    if ((e as Error)?.name !== "AbortError") throw e;
  }
}

export function QRScanner({
  active = true,
  onScan,
  onClose,
  onRetry,
  className = "",
}: QRScannerProps) {
  const [status, setStatus] = useState<"idle" | "starting" | "scanning" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const scannerRef = useRef<{ stop: () => Promise<void> } | null>(null);
  const hasScannedRef = useRef(false);
  const containerId = `qr-reader-${useId().replace(/:/g, "")}`;
  const onScanRef = useRef(onScan);
  onScanRef.current = onScan;

  useEffect(() => {
    if (typeof window === "undefined" || !active) {
      const scanner = scannerRef.current;
      scannerRef.current = null;
      void stopScanner(scanner);
      return;
    }

    let mounted = true;

    const startScan = async () => {
      setStatus("starting");
      setErrorMessage(null);

      try {
        const { Html5Qrcode } = await import("html5-qrcode");
        const scanner = new Html5Qrcode(containerId);

        const cameras = await Html5Qrcode.getCameras();
        if (!cameras?.length) {
          setErrorMessage("No camera found.");
          setStatus("error");
          return;
        }

        const backCamera = cameras.find((c) => c.label.toLowerCase().includes("back"));
        const cameraId = backCamera?.id ?? cameras[0].id;

        await scanner.start(
          cameraId,
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1,
          },
          (decodedText) => {
            if (hasScannedRef.current || !mounted) return;
            const token = parseFacilityTokenFromQR(decodedText);
            if (token) {
              hasScannedRef.current = true;
              onScanRef.current(token);
            }
          },
          () => {}
        );

        if (mounted) {
          scannerRef.current = scanner;
          setStatus("scanning");
        } else {
          await stopScanner(scanner);
        }
      } catch (err) {
        if (mounted) {
          const msg = err instanceof Error ? err.message : "";
          const userMsg =
            msg.includes("NotAllowedError") || msg.includes("Permission")
              ? "Camera access denied. Please allow camera permissions."
              : "Could not access camera.";
          setErrorMessage(userMsg);
          setStatus("error");
        }
      }
    };

    startScan();

    return () => {
      mounted = false;
      const scanner = scannerRef.current;
      scannerRef.current = null;
      stopScanner(scanner);
    };
  }, [active]);

  return (
    <div className={cn("relative overflow-hidden rounded-xl bg-gray-900", className)}>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
          aria-label="Close scanner"
        >
          <X className="h-5 w-5" />
        </button>
      )}
      <div
        id={containerId}
        className="min-h-[260px] w-full [&_.qr-shaded-region]:rounded-lg"
      />
      {status === "starting" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900/90 text-white">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-white border-t-transparent" />
          <p className="mt-3 text-sm font-medium">Starting camera…</p>
        </div>
      )}
      {status === "error" && errorMessage && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gray-900/95 p-4 text-center">
          <p className="text-sm text-red-300">{errorMessage}</p>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="rounded-lg bg-white/20 px-4 py-2 text-sm font-medium text-white hover:bg-white/30 transition-colors"
            >
              Try again
            </button>
          )}
        </div>
      )}
    </div>
  );
}

