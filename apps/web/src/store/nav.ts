import { create } from "zustand";

export type View = "create" | "library";

interface NavState {
  view: View;
  setView: (view: View) => void;
}

export const useNav = create<NavState>((set) => ({
  view: "create",
  setView: (view) => set({ view }),
}));
