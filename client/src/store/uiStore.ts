import { create } from "zustand";
import { persist } from "zustand/middleware";

interface UIStore {
  sidebarOpen: boolean;
  showOldOptions: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setShowOldOptions: (show: boolean) => void;
}

export const useUIStore = create<UIStore>()(
  persist(
    (set) => ({
      sidebarOpen: true,
      showOldOptions: false,
      toggleSidebar: () =>
        set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      setShowOldOptions: (show) => set({ showOldOptions: show }),
    }),
    {
      name: "ui-store",
      partialize: (state) => ({ showOldOptions: state.showOldOptions }),
    }
  )
);
