import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { resolveStorage } from "../../lib/storage";

/** Skills you pinned, as `driver:name`, so a pin follows the skill across threads and projects. */
interface SkillPinsState {
  pinned: string[];
  collapsed: boolean;
  toggle: (key: string) => void;
  setCollapsed: (collapsed: boolean) => void;
}

export const useSkillPinsStore = create<SkillPinsState>()(
  persist(
    (set) => ({
      pinned: [],
      collapsed: false,
      setCollapsed: (collapsed) => set({ collapsed }),
      toggle: (key) =>
        set((state) => ({
          pinned: state.pinned.includes(key)
            ? state.pinned.filter((candidate) => candidate !== key)
            : [...state.pinned, key],
        })),
    }),
    {
      name: "t3code:fork-skill-pins:v1",
      storage: createJSONStorage(() =>
        resolveStorage(typeof window !== "undefined" ? window.localStorage : undefined),
      ),
      partialize: (state) => ({ pinned: state.pinned, collapsed: state.collapsed }),
    },
  ),
);
