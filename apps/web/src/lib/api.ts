/** Where the local Python backend listens. Override via VITE_API_BASE_URL. */
export const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ??
  "http://127.0.0.1:8000";
