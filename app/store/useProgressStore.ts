import { create } from "zustand";
import { trackLessonEvent } from "../lib/lessonTelemetry";

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
    set((state) => {
      if (state.completedIds.includes(id)) {
        return state;
      }
      trackLessonEvent({
        lesson: "app:progress-store",
        event: "completion_marked",
        success: true,
        value: id,
      });
      return { completedIds: [...state.completedIds, id] };
    }),
  setActiveMaterial: (id) => set({ activeMaterialId: id }),
}));
