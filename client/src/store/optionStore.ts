import { create } from 'zustand';
import type { OptionFilters } from '../types/option';

interface OptionStore {
  filters: OptionFilters;
  setFilters: (filters: Partial<OptionFilters>) => void;
  resetFilters: () => void;
}

const defaultFilters: OptionFilters = {
  status: 'open',
  show_old: false,
  page: 1,
  limit: 50,
};

export const useOptionStore = create<OptionStore>((set) => ({
  filters: defaultFilters,
  setFilters: (newFilters) =>
    set((state) => ({
      filters: { ...state.filters, ...newFilters, page: newFilters.page ?? 1 },
    })),
  resetFilters: () => set({ filters: defaultFilters }),
}));
