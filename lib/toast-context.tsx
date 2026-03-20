"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

type ToastType = "success" | "error" | "info";

type ToastState = {
  message: string;
  type: ToastType;
} | null;

type ToastContextValue = {
  toast: ToastState;
  showToast: (message: string, type?: ToastType, durationMs?: number) => void;
  hideToast: () => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const DEFAULT_TOAST_DURATION_MS = 4000;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastState>(null);
  const [duration, setDuration] = useState(DEFAULT_TOAST_DURATION_MS);

  const hideToast = useCallback(() => setToast(null), []);

  const [isHiding, setIsHiding] = useState(false);

  const showToast = useCallback(
    (message: string, type: ToastType = "info", durationMs?: number) => {
      setIsHiding(false);
      setDuration(durationMs ?? DEFAULT_TOAST_DURATION_MS);
      setToast({ message, type });
    },
    []
  );

  useEffect(() => {
    if (!toast) return;
    let hideId: ReturnType<typeof setTimeout> | undefined;
    const id = setTimeout(() => {
      setIsHiding(true);
      hideId = setTimeout(hideToast, 200);
    }, duration);
    return () => {
      clearTimeout(id);
      if (hideId !== undefined) clearTimeout(hideId);
      setIsHiding(false);
    };
  }, [toast, hideToast, duration]);

  return (
    <ToastContext.Provider value={{ toast, showToast, hideToast }}>
      {children}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className={`fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-sm rounded-lg border px-3 py-2.5 text-sm shadow-lg sm:left-auto sm:right-4 transition-opacity duration-200 ${
            isHiding ? "opacity-0" : "opacity-100"
          }`}
          style={{
            backgroundColor:
              toast.type === "error"
                ? "rgba(254, 226, 226, 0.8)"
                : toast.type === "success"
                  ? "rgba(220, 252, 231, 0.8)"
                  : "rgba(250, 250, 250, 0.8)",
            borderColor:
              toast.type === "error"
                ? "rgb(248 113 113)"
                : toast.type === "success"
                  ? "rgb(34 197 94)"
                  : "rgb(228 228 231)",
            color:
              toast.type === "error"
                ? "rgb(153 27 27)"
                : toast.type === "success"
                  ? "rgb(21 128 61)"
                  : "rgb(24 24 27)",
          }}
        >
          {toast.message}
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return ctx;
}
