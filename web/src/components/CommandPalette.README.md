# Command Palette

A powerful command palette (Cmd+K) for quick navigation and actions throughout the Nodebook application.

## Features

- **Global Keyboard Shortcut**: Press `Cmd+K` (Mac) or `Ctrl+K` (Windows/Linux) to open
- **Fuzzy Search**: Type to search through all available commands
- **Categorized Commands**: Commands organized into Navigation, Actions, Search, Settings, and Help
- **Recent Commands**: Shows recently used commands at the top for quick access
- **Keyboard Navigation**: Use arrow keys to navigate, Enter to select, Esc to close
- **Persistent History**: Recent commands stored in localStorage
- **Visual Hints**: Command palette trigger button shown in the header with keyboard shortcut

## Usage

### Opening the Command Palette

1. **Keyboard**: Press `Cmd+K` (Mac) or `Ctrl+K` (Windows/Linux)
2. **Mouse**: Click the search button in the header navigation bar

### Navigating Commands

- **Type** to filter commands
- **↑/↓ Arrow Keys** to navigate through results
- **Enter** to execute the selected command
- **Esc** to close the palette

## Command Categories

### Navigation
- Go to Dashboard (`g d`)

### Actions
- Create New Document (`c d`)
- Create New Table (`c t`)
- Create New Calendar (`c c`)
- Create New Folder (`c f`)

### Search
- Search Nodes (`/`)

### Settings
- Toggle Dark Mode (`t`)
- Open Settings (`,`)

### Help
- Keyboard Shortcuts (`?`)
- View Documentation

## Architecture

### Components

**CommandPalette.tsx**
- Main component that renders the command palette dialog
- Handles keyboard shortcuts (Cmd/Ctrl+K)
- Manages command execution and history
- Uses cmdk library for search and navigation

**command.tsx** (shadcn/ui)
- Reusable command palette UI primitives
- Built on top of cmdk library
- Styled with Tailwind CSS

**dialog.tsx** (shadcn/ui)
- Dialog wrapper for the command palette
- Provides overlay and modal behavior

### State Management

**commandPaletteStore.ts** (Zustand)
- Manages open/closed state
- Tracks recent command history
- Persists history to localStorage
- Provides actions: `open()`, `close()`, `toggle()`, `addToHistory()`

### Configuration

**commandRegistry.ts**
- Defines all available commands
- Command interface: `{ id, label, category, icon, keywords, shortcut, action }`
- Helper functions for filtering and grouping commands
- Extensible design for adding new commands

## Adding New Commands

To add a new command, edit `/web/src/lib/commandRegistry.ts`:

```typescript
{
  id: 'my-command',
  label: 'My Custom Command',
  category: CommandCategory.ACTIONS,
  icon: MyIcon,
  keywords: ['custom', 'example'],
  shortcut: 'c m',
  action: () => {
    // Your command action here
  },
}
```

## Technical Details

### Dependencies
- `cmdk` - Command menu component
- `@radix-ui/react-dialog` - Dialog primitives
- `zustand` - State management
- `lucide-react` - Icons

### Storage
- Recent commands stored in localStorage under `nodebook-command-history`
- Maximum of 5 recent commands tracked

### Keyboard Handling
- Global keyboard listener in CommandPalette component
- Prevents default browser behavior for Cmd/Ctrl+K
- Automatically closes on Esc key

## Design Reference

The command palette design is inspired by:
- Linear (linear.app)
- Raycast
- GitHub's command palette

## Future Enhancements

- [ ] Command analytics tracking
- [ ] Custom user-defined commands
- [ ] Command history search
- [ ] Multi-step commands
- [ ] Command chaining
- [ ] Contextual commands based on current page
- [ ] Voice-activated commands
