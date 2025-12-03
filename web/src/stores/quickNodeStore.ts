import { create } from 'zustand';

type QuickNodeMode = 'short' | 'long' | 'multi';

interface QuickNodeState {
  isOpen: boolean;
  mode: QuickNodeMode;
  open: (mode: QuickNodeMode) => void;
  close: () => void;
}

export const useQuickNodeStore = create<QuickNodeState>((set) => ({
  isOpen: false,
  mode: 'short',
  open: (mode) => set({ isOpen: true, mode }),
  close: () => set({ isOpen: false }),
}));
