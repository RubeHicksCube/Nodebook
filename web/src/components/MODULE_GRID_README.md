# ModuleGrid Component Implementation

## Overview

The ModuleGrid component provides a draggable and resizable grid layout for displaying module visualization cards. Built with `react-grid-layout`, it enables users to organize and customize their dashboard workspace.

## Files Created

### 1. **ModuleGrid.tsx** (`/home/rockbuntu/nodebook/web/src/components/ModuleGrid.tsx`)
Main grid component with drag-and-drop functionality.

**Features:**
- 12-column grid layout with 60px row height
- Draggable module cards
- Resizable module cards (min 2x2)
- Auto-save layout on drag/resize end
- TanStack Query integration for server state
- Empty state with "Create Module" CTA
- Loading state

**Props:**
```typescript
interface ModuleGridProps {
  zoneId: string;                           // Active zone/workspace ID
  onCreateModule?: () => void;              // Handler for creating new module
  onEditModule?: (module: Module) => void;  // Handler for editing module
  onDeleteModule?: (module: Module) => void; // Handler for deleting module
  onDuplicateModule?: (module: Module) => void; // Handler for duplicating module
  onMoveModule?: (module: Module) => void;  // Handler for moving to another zone
  onSettingsModule?: (module: Module) => void; // Handler for module settings
  className?: string;                       // Optional CSS classes
}
```

**Grid Configuration:**
- Columns: 12
- Row Height: 60px
- Margin: [16px, 16px]
- Container Padding: [16px, 16px]
- Compact Type: null (free positioning)
- Prevent Collision: false

**API Integration:**
- `GET /api/modules?zone_id=xxx` - Fetch modules for zone
- `POST /api/modules/layout` - Save layout changes

### 2. **ModuleCard.tsx** (`/home/rockbuntu/nodebook/web/src/components/ModuleCard.tsx`)
Card wrapper for individual modules with actions menu.

**Features:**
- Header with type icon, title, and actions menu
- Content area for module visualizations
- Optional footer for filters/settings display
- Dropdown menu with actions: Edit, Settings, Duplicate, Move, Delete
- Type-specific icons (Graph, Table, Calendar, etc.)
- Dark mode support

**Props:**
```typescript
interface ModuleCardProps {
  module: Module;                           // Module data
  onEdit?: (module: Module) => void;        // Edit handler
  onDelete?: (module: Module) => void;      // Delete handler
  onDuplicate?: (module: Module) => void;   // Duplicate handler
  onMove?: (module: Module) => void;        // Move handler
  onSettings?: (module: Module) => void;    // Settings handler
  children?: React.ReactNode;               // Module content
  className?: string;                       // Optional CSS classes
}
```

**Module Type Icons:**
- `graph` → BarChart3
- `table` → Table2
- `calendar` → Calendar
- `text` → Type
- `kanban` → Layout
- `list` → List
- `grid` → Grid3x3

### 3. **moduleStore.ts** (`/home/rockbuntu/nodebook/web/src/stores/moduleStore.ts`)
Zustand store for module state management.

**State:**
```typescript
{
  modules: Module[];                 // All modules
  activeZoneId: string | null;       // Currently active zone
  selectedModuleId: string | null;   // Selected module ID
}
```

**Actions:**
- `setModules(modules)` - Set all modules
- `addModule(module)` - Add new module
- `updateModule(id, updates)` - Update module
- `removeModule(id)` - Remove module
- `setActiveZoneId(zoneId)` - Set active zone
- `setSelectedModuleId(moduleId)` - Set selected module
- `updateModuleLayout(id, layout)` - Update single module layout
- `updateMultipleLayouts(layouts)` - Update multiple module layouts
- `getModulesByZone(zoneId)` - Get modules for specific zone
- `getModuleById(id)` - Get module by ID

### 4. **dropdown-menu.tsx** (`/home/rockbuntu/nodebook/web/src/components/ui/dropdown-menu.tsx`)
Shadcn/ui dropdown menu component for module actions.

### 5. **Module Types** (Added to `/home/rockbuntu/nodebook/web/src/types/index.ts`)

```typescript
export interface ModuleLayout {
  i: string;                    // module id
  x: number;                    // x position
  y: number;                    // y position
  w: number;                    // width in grid units
  h: number;                    // height in grid units
  minW?: number;                // min width
  minH?: number;                // min height
  maxW?: number;                // max width
  maxH?: number;                // max height
  static?: boolean;             // disable drag/resize
}

export interface CreateModuleInput {
  name: string;
  type: ModuleType;
  zoneId: string;
  referenceId?: string | null;
  config?: ModuleConfig;
  positionX?: number;
  positionY?: number;
  width?: number;
  height?: number;
}

export interface UpdateModuleInput {
  name?: string;
  config?: ModuleConfig;
  positionX?: number;
  positionY?: number;
  width?: number;
  height?: number;
}

export interface MoveModuleInput {
  zoneId: string;
}

export interface UpdateLayoutInput {
  layouts: ModuleLayout[];
}
```

### 6. **Module API** (Added to `/home/rockbuntu/nodebook/web/src/api.ts`)

```typescript
export const modulesApi = {
  list: async (zoneId?: string): Promise<Module[]>
  get: async (id: string): Promise<Module>
  getNodes: async (id: string): Promise<ModuleNodesResponse>
  create: async (data: CreateModuleInput): Promise<Module>
  update: async (id: string, data: UpdateModuleInput): Promise<Module>
  delete: async (id: string): Promise<void>
  move: async (id: string, data: MoveModuleInput): Promise<Module>
  updateLayout: async (zoneId: string, data: UpdateLayoutInput): Promise<void>
}
```

### 7. **CSS Styles** (Added to `/home/rockbuntu/nodebook/web/src/index.css`)
Complete react-grid-layout styling with dark mode support.

## Usage Example

```tsx
import React from 'react';
import ModuleGrid from '@/components/ModuleGrid';
import { useModuleStore } from '@/stores/moduleStore';

export default function Dashboard() {
  const activeZoneId = useModuleStore((state) => state.activeZoneId);

  const handleCreateModule = () => {
    // Open create module dialog
  };

  const handleEditModule = (module) => {
    // Open edit module dialog
  };

  const handleDeleteModule = (module) => {
    // Confirm and delete module
  };

  return (
    <div className="h-screen">
      <ModuleGrid
        zoneId={activeZoneId || 'default-zone'}
        onCreateModule={handleCreateModule}
        onEditModule={handleEditModule}
        onDeleteModule={handleDeleteModule}
      />
    </div>
  );
}
```

## Dependencies Installed

- `react-grid-layout@^1.5.2` - Core grid layout library
- `@types/react-grid-layout@^1.3.6` - TypeScript definitions

## Grid Layout Behavior

### Dragging
- Click and hold on any module card to drag
- Drag handle: `.drag-handle` class (entire card is draggable)
- Smooth animations during drag
- Visual placeholder shows drop position
- Auto-saves position on drag end

### Resizing
- Resize handles appear on all corners and edges
- Minimum size: 2x2 grid units
- Smooth animations during resize
- Auto-saves dimensions on resize end

### Layout Persistence
- Layout changes saved to backend on drag/resize stop
- Uses debounced API calls to prevent excessive requests
- Optimistic updates for responsive UI
- TanStack Query handles caching and invalidation

## Responsive Breakpoints

The component includes a `ResponsiveModuleGrid` variant for mobile/tablet support:

```typescript
const BREAKPOINTS = {
  lg: 1200,   // 12 columns
  md: 996,    // 10 columns
  sm: 768,    // 6 columns
  xs: 480,    // 4 columns
  xxs: 0      // 2 columns
};
```

## Customization

### Grid Configuration
Modify `GRID_CONFIG` in `ModuleGrid.tsx`:
```typescript
const GRID_CONFIG = {
  cols: 12,              // Number of columns
  rowHeight: 60,         // Height of each row in pixels
  margin: [16, 16],      // [x, y] margin between items
  containerPadding: [16, 16], // [x, y] padding around container
  compactType: null,     // 'vertical' | 'horizontal' | null
  preventCollision: false, // Allow overlapping
};
```

### Module Card Styling
Modify the `ModuleCard` component to customize appearance:
- Header: Card title, icon, actions menu
- Content: Module visualization area
- Footer: Filters/settings display

### Adding New Module Types
1. Add type to `ModuleType` in `types/index.ts`
2. Add icon to `MODULE_TYPE_ICONS` in `ModuleCard.tsx`
3. Add label to `MODULE_TYPE_LABELS` in `ModuleCard.tsx`

## Integration Checklist

- [x] Install react-grid-layout packages
- [x] Create ModuleGrid component
- [x] Create ModuleCard component
- [x] Create module store with Zustand
- [x] Add module types to types/index.ts
- [x] Add modules API endpoints
- [x] Add CSS styles for grid layout
- [ ] Implement backend API endpoints (/api/modules/*)
- [ ] Create module creation dialog
- [ ] Create module edit dialog
- [ ] Create module settings dialog
- [ ] Implement module visualization components (Graph, Table, Calendar, etc.)
- [ ] Add module data fetching logic
- [ ] Integrate with zone/workspace system

## Backend Requirements

The backend needs to implement these endpoints:

```
GET    /api/modules?zone_id={zoneId}  - List modules
GET    /api/modules/:id                - Get module
GET    /api/modules/:id/nodes          - Get module data
POST   /api/modules                    - Create module
PATCH  /api/modules/:id                - Update module
DELETE /api/modules/:id                - Delete module
POST   /api/modules/:id/move           - Move to zone
POST   /api/modules/layout             - Update layouts
```

## Next Steps

1. **Backend API**: Implement module endpoints on the server
2. **Module Dialogs**: Create forms for creating/editing modules
3. **Visualization Components**: Build specific module types (graphs, tables, etc.)
4. **Data Integration**: Connect modules to node data sources
5. **Advanced Features**:
   - Module templates
   - Export/import layouts
   - Keyboard shortcuts
   - Undo/redo layout changes
   - Collaborative editing

## Notes

- The grid uses absolute positioning (CSS transforms)
- Drag handle is set to `.drag-handle` class for better control
- Layout state is managed both locally (Zustand) and server-side (API)
- Module content is a placeholder - implement specific visualizations
- Supports dark mode via Tailwind CSS theme variables
- Performance optimized with React.memo and useCallback hooks
