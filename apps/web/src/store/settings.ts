import { create } from "zustand";
import { persist } from "zustand/middleware";

import { API_BASE_URL } from "@/lib/api";

interface SettingsState {
  /** Local Python backend base URL. */
  backendUrl: string;
  setBackendUrl: (url: string) => void;
}

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      backendUrl: API_BASE_URL,
      setBackendUrl: (url) => set({ backendUrl: url }),
    }),
    { name: "mpt-settings" },
  ),
);
