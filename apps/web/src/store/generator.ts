import { create } from "zustand";
import { DEFAULT_VIDEO_PARAMS, type VideoParams } from "@mpt/shared";

interface GeneratorState {
  params: VideoParams;
  setParam: <K extends keyof VideoParams>(
    key: K,
    value: VideoParams[K],
  ) => void;
  setParams: (patch: Partial<VideoParams>) => void;
  reset: () => void;
}

export const useGenerator = create<GeneratorState>((set) => ({
  params: { ...DEFAULT_VIDEO_PARAMS },
  setParam: (key, value) =>
    set((s) => ({ params: { ...s.params, [key]: value } })),
  setParams: (patch) => set((s) => ({ params: { ...s.params, ...patch } })),
  reset: () => set({ params: { ...DEFAULT_VIDEO_PARAMS } }),
}));
