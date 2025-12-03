import {
  Home,
  Plus,
  FileText,
  Table,
  Calendar,
  Search,
  Settings,
  Moon,
  Sun,
  Keyboard,
  Book,
  Folder,
  Tag,
  Image,
  Paperclip,
  Type,
  AlignLeft,
  BookOpen,
  type LucideIcon,
} from 'lucide-react';

export interface Command {
  id: string;
  label: string;
  category: CommandCategory;
  icon?: LucideIcon;
  keywords?: string[];
  shortcut?: string;
  action: () => void | Promise<void>;
}

export enum CommandCategory {
  NAVIGATION = 'Navigation',
  ACTIONS = 'Actions',
  SEARCH = 'Search',
  SETTINGS = 'Settings',
  HELP = 'Help',
}

interface CommandRegistryConfig {
  navigate: (path: string) => void;
  createQuickText: () => void;
  createLongText: () => void;
  createMultiNode: () => void;
  createDocument: () => void;
  createTable: () => void;
  createCalendar: () => void;
  createFolder: () => void;
  createImage: () => void;
  createFile: () => void;
  toggleTheme: () => void;
  showKeyboardShortcuts: () => void;
  openSearch: () => void;
}

export const createCommandRegistry = (config: CommandRegistryConfig): Command[] => {
  return [
    // Main Actions
    {
      id: 'create-node',
      label: 'Create Node',
      category: CommandCategory.ACTIONS,
      icon: Plus,
      keywords: ['new', 'create', 'node', 'add'],
      shortcut: 'c n',
      action: config.createQuickText,
    },
    {
      id: 'create-multi-node',
      label: 'Create Multiple Nodes',
      category: CommandCategory.ACTIONS,
      icon: Plus,
      keywords: ['new', 'multiple', 'batch', 'bulk', 'many', 'create'],
      shortcut: 'c m',
      action: config.createMultiNode,
    },
  ];
};

// Helper function to filter commands by search query
export const filterCommands = (commands: Command[], query: string): Command[] => {
  if (!query.trim()) return commands;

  const lowerQuery = query.toLowerCase();

  return commands.filter(command => {
    // Search in label
    if (command.label.toLowerCase().includes(lowerQuery)) {
      return true;
    }

    // Search in keywords
    if (command.keywords?.some(keyword => keyword.toLowerCase().includes(lowerQuery))) {
      return true;
    }

    // Search in category
    if (command.category.toLowerCase().includes(lowerQuery)) {
      return true;
    }

    return false;
  });
};

// Helper to group commands by category
export const groupCommandsByCategory = (commands: Command[]): Map<CommandCategory, Command[]> => {
  const grouped = new Map<CommandCategory, Command[]>();

  for (const command of commands) {
    const existing = grouped.get(command.category) || [];
    grouped.set(command.category, [...existing, command]);
  }

  return grouped;
};
