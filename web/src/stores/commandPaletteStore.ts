import { create } from 'zustand';

interface CommandHistory {
  commandId: string;
  timestamp: number;
}

interface CommandPaletteStore {
  isOpen: boolean;
  recentCommands: CommandHistory[];
  open: () => void;
  close: () => void;
  toggle: () => void;
  addToHistory: (commandId: string) => void;
  getRecentCommandIds: () => string[];
  clearHistory: () => void;
}

const MAX_RECENT_COMMANDS = 5;
const STORAGE_KEY = 'nodebook-command-history';

// Load initial state from localStorage
const loadRecentCommands = (): CommandHistory[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Failed to load command history:', error);
  }
  return [];
};

// Save to localStorage
const saveRecentCommands = (commands: CommandHistory[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(commands));
  } catch (error) {
    console.error('Failed to save command history:', error);
  }
};

export const useCommandPaletteStore = create<CommandPaletteStore>((set, get) => ({
  isOpen: false,
  recentCommands: loadRecentCommands(),

  open: () => set({ isOpen: true }),

  close: () => set({ isOpen: false }),

  toggle: () => set(state => ({ isOpen: !state.isOpen })),

  addToHistory: (commandId: string) => {
    set(state => {
      // Remove if already exists
      const filtered = state.recentCommands.filter(cmd => cmd.commandId !== commandId);

      // Add to beginning
      const updated = [
        { commandId, timestamp: Date.now() },
        ...filtered,
      ].slice(0, MAX_RECENT_COMMANDS);

      // Save to localStorage
      saveRecentCommands(updated);

      return { recentCommands: updated };
    });
  },

  getRecentCommandIds: () => {
    return get().recentCommands.map(cmd => cmd.commandId);
  },

  clearHistory: () => {
    set({ recentCommands: [] });
    saveRecentCommands([]);
  },
}));

// Hook for keyboard shortcuts
export const useCommandPaletteShortcut = () => {
  const { open, close, toggle } = useCommandPaletteStore();

  return {
    open,
    close,
    toggle,
  };
};
