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
  showToast: (message: string, type?: ToastType) => void;
  hideToast: () => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const TOAST_DURATION_MS = 4000;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastState>(null);

  const hideToast = useCallback(() => setToast(null), []);

  const showToast = useCallback(
    (message: string, type: ToastType = "info") => {
      setToast({ message, type });
    },
    []
  );

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(hideToast, TOAST_DURATION_MS);
    return () => clearTimeout(id);
  }, [toast, hideToast]);

  return (
    <ToastContext.Provider value={{ toast, showToast, hideToast }}>
      {children}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-sm rounded-lg border px-3 py-2.5 text-sm shadow-lg sm:left-auto sm:right-4"
          style={{
            backgroundColor:
              toast.type === "error"
                ? "rgb(254 226 226)"
                : toast.type === "success"
                  ? "rgb(220 252 231)"
                  : "rgb(250 250 250)",
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
