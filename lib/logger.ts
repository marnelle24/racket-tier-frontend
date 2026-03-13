const isDev = process.env.NODE_ENV === "development";

export const logger = {
  debug: (msg: string, data?: Record<string, unknown>) => {
    if (isDev) console.debug(`[RacketTier] ${msg}`, data ?? "");
  },
  warn: (msg: string, data?: Record<string, unknown>) => {
    console.warn(`[RacketTier] ${msg}`, data ?? "");
  },
  error: (msg: string, err?: unknown) => {
    console.error(`[RacketTier] ${msg}`, err);
  },
};
