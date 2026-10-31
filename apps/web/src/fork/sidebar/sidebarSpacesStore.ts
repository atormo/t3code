import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { resolveStorage } from "../../lib/storage";
import type { SidebarSpace } from "./projectOrganization";

interface SidebarSpacesState {
  spaces: SidebarSpace[];
  activeSpaceId: string | null;
  setSpaces: (spaces: SidebarSpace[], activeSpaceId: string | null) => void;
  /** null is the all-projects view. */
  setActiveSpace: (spaceId: string | null) => void;
}

/** Sidebar spaces (tabs). Cross-store moves live in sidebarOrganizationActions. */
export const useSidebarSpacesStore = create<SidebarSpacesState>()(
  persist(
    (set) => ({
      spaces: [],
      activeSpaceId: null,
      setSpaces: (spaces, activeSpaceId) => set({ spaces, activeSpaceId }),
      setActiveSpace: (activeSpaceId) => set({ activeSpaceId }),
    }),
    {
      name: "t3code:fork-sidebar-spaces:v1",
      storage: createJSONStorage(() =>
        resolveStorage(typeof window !== "undefined" ? window.localStorage : undefined),
      ),
      partialize: (state) => ({ spaces: state.spaces, activeSpaceId: state.activeSpaceId }),
    },
  ),
);
