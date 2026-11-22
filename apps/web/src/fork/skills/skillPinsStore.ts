import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { resolveStorage } from "../../lib/storage";
import type { SkillFilter } from "./skillsSection.logic";

/** Skills you pinned, as `driver:name`, so a pin follows the skill across threads and projects. */
interface SkillPinsState {
  pinned: string[];
  collapsed: boolean;
  /** Gallery shows icons and titles; list is the compact one with the raw names. */
  view: "gallery" | "list";
  /** The filter chip you chose last, so every thread opens on it. */
  filter: SkillFilter;
  toggle: (key: string) => void;
  setCollapsed: (collapsed: boolean) => void;
  setView: (view: "gallery" | "list") => void;
  setFilter: (filter: SkillFilter) => void;
}

const STAGESHOW_PIN = "claudeAgent:stageshow";

export const useSkillPinsStore = create<SkillPinsState>()(
  persist(
    (set) => ({
      pinned: [STAGESHOW_PIN],
      collapsed: false,
      view: "gallery",
      setView: (view) => set({ view }),
      filter: "emil",
      setFilter: (filter) => set({ filter }),
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
      // Version 1 pins Stageshow once, for everyone who had the store before; unpinning it sticks.
      version: 1,
      migrate: (persisted, version) => {
        const state = (persisted ?? {}) as Partial<SkillPinsState>;
        const pins = state.pinned ?? [];
        return version < 1 && !pins.includes(STAGESHOW_PIN)
          ? { ...state, pinned: [...pins, STAGESHOW_PIN] }
          : state;
      },
      storage: createJSONStorage(() =>
        resolveStorage(typeof window !== "undefined" ? window.localStorage : undefined),
      ),
      partialize: (state) => ({
        pinned: state.pinned,
        collapsed: state.collapsed,
        view: state.view,
        filter: state.filter,
      }),
    },
  ),
);
