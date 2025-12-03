# ModuleGrid Quick Start Guide

## 1. Basic Usage (Copy & Paste)

```tsx
import ModuleGrid from '@/components/ModuleGrid';

function MyDashboard() {
  return (
    <div className="h-screen">
      <ModuleGrid
        zoneId="your-zone-id"
        onCreateModule={() => console.log('Create')}
        onEditModule={(m) => console.log('Edit', m)}
        onDeleteModule={(m) => console.log('Delete', m)}
      />
    </div>
  );
}
```

## 2. With Full Event Handlers

```tsx
import { useState } from 'react';
import ModuleGrid from '@/components/ModuleGrid';
import type { Module } from '@/types';

function Dashboard() {
  const [activeZoneId] = useState('zone-1');

  const handleCreate = () => {
    // Open create dialog
    console.log('Open create dialog');
  };

  const handleEdit = (module: Module) => {
    // Open edit dialog with module
    console.log('Edit module:', module);
  };

  const handleDelete = (module: Module) => {
    // Confirm and delete
    if (confirm(`Delete ${module.name}?`)) {
      // Will trigger API call automatically
      console.log('Deleting:', module.id);
    }
  };

  const handleDuplicate = (module: Module) => {
    // Clone module config and create new
    console.log('Duplicate:', module);
  };

  const handleMove = (module: Module) => {
    // Open zone selector
    console.log('Move to zone:', module);
  };

  const handleSettings = (module: Module) => {
    // Open settings panel
    console.log('Settings for:', module);
  };

  return (
    <div className="h-screen flex flex-col">
      <header className="border-b p-4">
        <h1 className="text-2xl font-bold">Dashboard</h1>
      </header>
      <main className="flex-1 overflow-auto">
        <ModuleGrid
          zoneId={activeZoneId}
          onCreateModule={handleCreate}
          onEditModule={handleEdit}
          onDeleteModule={handleDelete}
          onDuplicateModule={handleDuplicate}
          onMoveModule={handleMove}
          onSettingsModule={handleSettings}
        />
      </main>
    </div>
  );
}
```

## 3. With Zustand Store

```tsx
import ModuleGrid from '@/components/ModuleGrid';
import { useModuleStore } from '@/stores/moduleStore';
import { useZoneStore } from '@/stores/zoneStore'; // if you have zones

function Dashboard() {
  const activeZoneId = useZoneStore((state) => state.activeZoneId);
  const setSelectedModule = useModuleStore((state) => state.setSelectedModuleId);

  return (
    <ModuleGrid
      zoneId={activeZoneId || 'default'}
      onEditModule={(module) => {
        setSelectedModule(module.id);
        // Open edit dialog
      }}
    />
  );
}
```

## 4. Creating a Module

```tsx
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { modulesApi } from '@/api';
import type { CreateModuleInput } from '@/types';

function CreateModuleButton({ zoneId }: { zoneId: string }) {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (data: CreateModuleInput) => modulesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modules', zoneId] });
    },
  });

  const handleCreate = () => {
    createMutation.mutate({
      name: 'New Module',
      type: 'graph',
      zoneId: zoneId,
      positionX: 0,
      positionY: 0,
      width: 4,
      height: 3,
      config: {
        chartType: 'line',
        filters: {},
      },
    });
  };

  return (
    <button onClick={handleCreate}>
      Create Module
    </button>
  );
}
```

## 5. Custom Module Card Content

```tsx
import ModuleCard from '@/components/ModuleCard';
import type { Module } from '@/types';

function MyModuleWithContent({ module }: { module: Module }) {
  return (
    <ModuleCard module={module}>
      {/* Your custom visualization */}
      <div className="p-4">
        <h3>{module.name}</h3>
        <p>Custom content here</p>
        {/* Graph, table, calendar, etc. */}
      </div>
    </ModuleCard>
  );
}
```

## 6. Custom Grid Configuration

```tsx
// Edit ModuleGrid.tsx

const GRID_CONFIG = {
  cols: 16,              // Change to 16 columns
  rowHeight: 80,         // Taller rows
  margin: [20, 20],      // More spacing
  containerPadding: [20, 20],
  compactType: 'vertical', // Auto-compact vertically
  preventCollision: true,  // Prevent overlapping
};
```

## 7. Module Store Usage

```tsx
import { useModuleStore } from '@/stores/moduleStore';

function MyComponent() {
  // Get modules for a zone
  const getModules = useModuleStore((state) => state.getModulesByZone);
  const zoneModules = getModules('zone-1');

  // Get specific module
  const getModule = useModuleStore((state) => state.getModuleById);
  const module = getModule('module-id');

  // Update module
  const updateModule = useModuleStore((state) => state.updateModule);
  updateModule('module-id', { name: 'New Name' });

  // Remove module
  const removeModule = useModuleStore((state) => state.removeModule);
  removeModule('module-id');

  return <div>...</div>;
}
```

## 8. API Usage

```tsx
import { modulesApi } from '@/api';

// List all modules
const modules = await modulesApi.list();

// List modules in a zone
const zoneModules = await modulesApi.list('zone-id');

// Get single module
const module = await modulesApi.get('module-id');

// Create module
const newModule = await modulesApi.create({
  name: 'My Module',
  type: 'table',
  zoneId: 'zone-id',
});

// Update module
const updated = await modulesApi.update('module-id', {
  name: 'Updated Name',
  config: { /* new config */ },
});

// Delete module
await modulesApi.delete('module-id');

// Move module to another zone
await modulesApi.move('module-id', { zoneId: 'new-zone-id' });

// Update layout
await modulesApi.updateLayout('zone-id', {
  layouts: [
    { i: 'module-1', x: 0, y: 0, w: 4, h: 3 },
    { i: 'module-2', x: 4, y: 0, w: 4, h: 3 },
  ],
});
```

## 9. Common Patterns

### Empty State Handler
```tsx
<ModuleGrid
  zoneId={zoneId}
  onCreateModule={() => {
    // User clicked "Create Module" in empty state
    openCreateDialog();
  }}
/>
```

### Delete Confirmation
```tsx
<ModuleGrid
  zoneId={zoneId}
  onDeleteModule={(module) => {
    if (confirm(`Delete "${module.name}"? This cannot be undone.`)) {
      // Deletion is handled automatically
      // Just need to confirm
    }
  }}
/>
```

### Edit Dialog
```tsx
const [editDialogOpen, setEditDialogOpen] = useState(false);
const [editingModule, setEditingModule] = useState<Module | null>(null);

<ModuleGrid
  zoneId={zoneId}
  onEditModule={(module) => {
    setEditingModule(module);
    setEditDialogOpen(true);
  }}
/>

<ModuleEditDialog
  open={editDialogOpen}
  module={editingModule}
  onClose={() => setEditDialogOpen(false)}
/>
```

## 10. Styling

### Dark Mode
```tsx
// Already supported via Tailwind CSS theme
// Just ensure your app has dark mode toggle

<html className="dark">
  <ModuleGrid zoneId={zoneId} />
</html>
```

### Custom Module Card Styling
```tsx
<ModuleCard
  module={module}
  className="border-2 border-primary" // Custom styling
>
  {/* content */}
</ModuleCard>
```

### Custom Grid Container
```tsx
<div className="bg-muted rounded-lg p-4">
  <ModuleGrid
    zoneId={zoneId}
    className="min-h-screen"
  />
</div>
```

## 11. TypeScript Types

```tsx
import type {
  Module,
  ModuleType,
  ModuleConfig,
  ModuleLayout,
  CreateModuleInput,
  UpdateModuleInput,
} from '@/types';

// Module type
const moduleType: ModuleType = 'graph'; // 'table' | 'calendar' | etc.

// Full module object
const module: Module = {
  id: 'uuid',
  userId: 'user-uuid',
  zoneId: 'zone-uuid',
  name: 'Sales Chart',
  referenceId: null,
  type: 'graph',
  config: {
    chartType: 'line',
    filters: {},
  },
  positionX: 0,
  positionY: 0,
  width: 4,
  height: 3,
  createdAt: '2024-01-01',
  updatedAt: '2024-01-01',
};

// Layout object
const layout: ModuleLayout = {
  i: 'module-id',
  x: 0,
  y: 0,
  w: 4,
  h: 3,
};
```

## 12. Debugging

```tsx
// Enable react-grid-layout debug mode
<GridLayout
  {...props}
  onLayoutChange={(layout) => {
    console.log('Layout changed:', layout);
    handleLayoutChange(layout);
  }}
/>

// Check store state
const modules = useModuleStore((state) => state.modules);
console.log('Current modules:', modules);

// Check query state
const { data, isLoading, error } = useQuery({
  queryKey: ['modules', zoneId],
  queryFn: () => modulesApi.list(zoneId),
});
console.log('Query state:', { data, isLoading, error });
```

## 13. Common Issues

### Modules not appearing
- Check if zoneId is correct
- Check browser console for API errors
- Verify backend is running and accessible
- Check if modules exist in database

### Drag/resize not working
- Ensure `isDraggable={true}` and `isResizable={true}`
- Check if `.drag-handle` class is present
- Verify no CSS is preventing pointer events

### Layout not saving
- Check browser console for API errors
- Verify `updateLayout` endpoint is implemented
- Check if mutation is being called
- Verify user has permission to update

### TypeScript errors
- Run `npx tsc --noEmit` to check
- Ensure all types are imported correctly
- Check ModuleCard props match interface

## 14. Next Steps

1. **Implement Backend API**
   - Create `/api/modules` endpoints
   - Test with Postman/curl

2. **Create Dialogs**
   - Module creation form
   - Module edit form
   - Settings panel

3. **Add Visualizations**
   - GraphModule component
   - TableModule component
   - CalendarModule component

4. **Test Thoroughly**
   - Drag and drop
   - Resize
   - CRUD operations
   - Multiple zones

## Need Help?

- Read `MODULE_GRID_README.md` for detailed docs
- Check `ARCHITECTURE.md` for system design
- See `ModuleGridExample.tsx` for working example
- Review `IMPLEMENTATION_SUMMARY.md` for overview
