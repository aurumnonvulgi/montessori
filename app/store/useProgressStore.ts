import { create } from "zustand";

type ProgressState = {
  completedIds: string[];
  activeMaterialId: string | null;
  markComplete: (id: string) => void;
  setActiveMaterial: (id: string) => void;
};

export const useProgressStore = create<ProgressState>((set) => ({
  completedIds: [],
  activeMaterialId: null,
  markComplete: (id) =>
    set((state) =>
      state.completedIds.includes(id)
        ? state
        : { completedIds: [...state.completedIds, id] },
    ),
  setActiveMaterial: (id) => set({ activeMaterialId: id }),
}));
