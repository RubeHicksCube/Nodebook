import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from '@/components/ui/command';
import { useCommandPaletteStore } from '@/stores/commandPaletteStore';
import { useThemeStore } from '@/stores/themeStore';
import { useCreateNodeStore } from '@/stores/createNodeStore';
import { useQuickNodeStore } from '@/stores/quickNodeStore';
import { useToast } from '@/components/ui/use-toast';
import {
  createCommandRegistry,
  filterCommands,
  groupCommandsByCategory,
  CommandCategory,
  type Command,
} from '@/lib/commandRegistry';
import { Clock } from 'lucide-react';

export default function CommandPalette() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { theme, setTheme } = useThemeStore();
  const { isOpen, close, open, addToHistory, getRecentCommandIds } = useCommandPaletteStore();
  const { open: openCreateNode } = useCreateNodeStore();
  const { open: openQuickNode } = useQuickNodeStore();

  const [search, setSearch] = useState('');
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false);

  // Create command registry with actions
  const commands = createCommandRegistry({
    navigate: (path: string) => {
      navigate(path);
      close();
    },
    createQuickText: () => {
      openQuickNode('short');
      close();
    },
    createLongText: () => {
      openQuickNode('long');
      close();
    },
    createMultiNode: () => {
      openQuickNode('multi');
      close();
    },
    createDocument: () => {
      toast({
        title: 'Document Editor (Coming Soon)',
        description: 'The advanced document editor with Zone/Module integration is coming soon!',
      });
      close();
    },
    createTable: () => {
      openCreateNode('table');
      close();
    },
    createCalendar: () => {
      openCreateNode('calendar');
      close();
    },
    createFolder: () => {
      openCreateNode('folder');
      close();
    },
    createImage: () => {
      openCreateNode('image');
      close();
    },
    createFile: () => {
      openCreateNode('file');
      close();
    },
    toggleTheme: () => {
      setTheme(theme === 'dark' ? 'light' : 'dark');
      close();
    },
    showKeyboardShortcuts: () => {
      setShowKeyboardShortcuts(true);
      toast({
        title: 'Keyboard Shortcuts',
        description: 'Press Cmd+K to open command palette. Use arrow keys to navigate.',
      });
      close();
    },
    openSearch: () => {
      toast({
        title: 'Search',
        description: 'Advanced search coming soon!',
      });
      close();
    },
  });

  // Handle command execution
  const executeCommand = useCallback(
    (command: Command) => {
      addToHistory(command.id);
      command.action();
    },
    [addToHistory]
  );

  // Filter and group commands
  const filteredCommands = filterCommands(commands, search);
  const groupedCommands = groupCommandsByCategory(filteredCommands);

  // Get recent commands
  const recentCommandIds = getRecentCommandIds();
  const recentCommands = commands.filter(cmd => recentCommandIds.includes(cmd.id));

  // Keyboard shortcut handler - Escape only
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape to close
      if (e.key === 'Escape' && isOpen) {
        close();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, close]);

  // Reset search when dialog opens/closes
  useEffect(() => {
    if (!isOpen) {
      setSearch('');
    }
  }, [isOpen]);

  // Always show Ctrl for universal compatibility
  const modifierKey = 'Ctrl';

  return (
    <CommandDialog open={isOpen} onOpenChange={close}>
      <CommandInput
        placeholder="Type a command or search..."
        value={search}
        onValueChange={setSearch}
      />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        {/* Recent Commands */}
        {!search && recentCommands.length > 0 && (
          <>
            <CommandGroup heading="Recent">
              {recentCommands.map(command => {
                const Icon = command.icon;
                return (
                  <CommandItem
                    key={command.id}
                    value={command.id}
                    onSelect={() => executeCommand(command)}
                  >
                    {Icon && <Icon className="mr-2 h-4 w-4" />}
                    <Clock className="mr-2 h-3 w-3 text-muted-foreground" />
                    <span>{command.label}</span>
                    {command.shortcut && (
                      <CommandShortcut>{command.shortcut}</CommandShortcut>
                    )}
                  </CommandItem>
                );
              })}
            </CommandGroup>
            <CommandSeparator />
          </>
        )}

        {/* Navigation Commands */}
        {groupedCommands.has(CommandCategory.NAVIGATION) && (
          <CommandGroup heading="Navigation">
            {groupedCommands.get(CommandCategory.NAVIGATION)!.map(command => {
              const Icon = command.icon;
              return (
                <CommandItem
                  key={command.id}
                  value={command.id}
                  keywords={command.keywords}
                  onSelect={() => executeCommand(command)}
                >
                  {Icon && <Icon className="mr-2 h-4 w-4" />}
                  <span>{command.label}</span>
                  {command.shortcut && (
                    <CommandShortcut>{command.shortcut}</CommandShortcut>
                  )}
                </CommandItem>
              );
            })}
          </CommandGroup>
        )}

        {/* Action Commands */}
        {groupedCommands.has(CommandCategory.ACTIONS) && (
          <CommandGroup heading="Actions">
            {groupedCommands.get(CommandCategory.ACTIONS)!.map(command => {
              const Icon = command.icon;
              return (
                <CommandItem
                  key={command.id}
                  value={command.id}
                  keywords={command.keywords}
                  onSelect={() => executeCommand(command)}
                >
                  {Icon && <Icon className="mr-2 h-4 w-4" />}
                  <span>{command.label}</span>
                  {command.shortcut && (
                    <CommandShortcut>{command.shortcut}</CommandShortcut>
                  )}
                </CommandItem>
              );
            })}
          </CommandGroup>
        )}

        {/* Search Commands */}
        {groupedCommands.has(CommandCategory.SEARCH) && (
          <CommandGroup heading="Search">
            {groupedCommands.get(CommandCategory.SEARCH)!.map(command => {
              const Icon = command.icon;
              return (
                <CommandItem
                  key={command.id}
                  value={command.id}
                  keywords={command.keywords}
                  onSelect={() => executeCommand(command)}
                >
                  {Icon && <Icon className="mr-2 h-4 w-4" />}
                  <span>{command.label}</span>
                  {command.shortcut && (
                    <CommandShortcut>{command.shortcut}</CommandShortcut>
                  )}
                </CommandItem>
              );
            })}
          </CommandGroup>
        )}

        {/* Settings Commands */}
        {groupedCommands.has(CommandCategory.SETTINGS) && (
          <CommandGroup heading="Settings">
            {groupedCommands.get(CommandCategory.SETTINGS)!.map(command => {
              const Icon = command.icon;
              return (
                <CommandItem
                  key={command.id}
                  value={command.id}
                  keywords={command.keywords}
                  onSelect={() => executeCommand(command)}
                >
                  {Icon && <Icon className="mr-2 h-4 w-4" />}
                  <span>{command.label}</span>
                  {command.shortcut && (
                    <CommandShortcut>{command.shortcut}</CommandShortcut>
                  )}
                </CommandItem>
              );
            })}
          </CommandGroup>
        )}

        {/* Help Commands */}
        {groupedCommands.has(CommandCategory.HELP) && (
          <CommandGroup heading="Help">
            {groupedCommands.get(CommandCategory.HELP)!.map(command => {
              const Icon = command.icon;
              return (
                <CommandItem
                  key={command.id}
                  value={command.id}
                  keywords={command.keywords}
                  onSelect={() => executeCommand(command)}
                >
                  {Icon && <Icon className="mr-2 h-4 w-4" />}
                  <span>{command.label}</span>
                  {command.shortcut && (
                    <CommandShortcut>{command.shortcut}</CommandShortcut>
                  )}
                </CommandItem>
              );
            })}
          </CommandGroup>
        )}
      </CommandList>

      {/* Footer hint */}
      <div className="border-t px-4 py-2 text-xs text-muted-foreground flex items-center justify-between">
        <span>Press {modifierKey}+K or {modifierKey}+/ to toggle</span>
        <span>↑↓ to navigate • Enter to select • Esc to close</span>
      </div>
    </CommandDialog>
  );
}
