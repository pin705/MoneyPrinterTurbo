/** Where the MoneyPrinter Cloud backend listens. Override via VITE_CLOUD_BASE_URL. */
export const CLOUD_BASE_URL =
  (import.meta.env.VITE_CLOUD_BASE_URL as string | undefined) ??
  "http://127.0.0.1:8787";
