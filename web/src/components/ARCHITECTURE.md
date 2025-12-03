# ModuleGrid Architecture

## Component Hierarchy

```
ModuleGrid
├── GridLayout (react-grid-layout)
│   └── [Multiple ModuleCard instances]
│       ├── Card (shadcn/ui)
│       │   ├── CardHeader
│       │   │   ├── Type Icon
│       │   │   ├── CardTitle
│       │   │   └── DropdownMenu
│       │   │       ├── Edit MenuItem
│       │   │       ├── Settings MenuItem
│       │   │       ├── Duplicate MenuItem
│       │   │       ├── Move MenuItem
│       │   │       └── Delete MenuItem
│       │   ├── CardContent
│       │   │   └── [Module Visualization]
│       │   └── CardFooter (optional)
│       │       └── Filter/Settings Display
│       └── Resize Handles
└── Empty State / Loading State
```

## Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                         User Actions                         │
│  (Drag, Resize, Edit, Delete, Create)                       │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│                       ModuleGrid                             │
│  - Event handlers (onDragStop, onResizeStop)                │
│  - Layout management                                         │
│  - TanStack Query hooks                                      │
└────────────┬───────────────────────┬────────────────────────┘
             │                       │
             │ Local State           │ Server State
             ▼                       ▼
┌────────────────────┐    ┌──────────────────────┐
│   Zustand Store    │    │   TanStack Query     │
│   (moduleStore)    │    │   Cache              │
│                    │    │                      │
│  - modules[]       │    │  - Query: modules    │
│  - activeZoneId    │    │  - Mutation: create  │
│  - selectedModule  │    │  - Mutation: update  │
│                    │    │  - Mutation: delete  │
│  Actions:          │    │  - Mutation: layout  │
│  - setModules      │    └──────────┬───────────┘
│  - addModule       │               │
│  - updateModule    │               │ API Calls
│  - removeModule    │               ▼
│  - updateLayout    │    ┌──────────────────────┐
└────────────────────┘    │    API Layer         │
                          │    (modulesApi)      │
                          │                      │
                          │  - list()            │
                          │  - create()          │
                          │  - update()          │
                          │  - delete()          │
                          │  - updateLayout()    │
                          └──────────┬───────────┘
                                     │
                                     │ HTTP Requests
                                     ▼
                          ┌──────────────────────┐
                          │   Backend Server     │
                          │   (Express.js)       │
                          │                      │
                          │  GET /api/modules    │
                          │  POST /api/modules   │
                          │  PATCH /api/modules  │
                          │  DELETE /api/modules │
                          │  POST /modules/layout│
                          └──────────┬───────────┘
                                     │
                                     ▼
                          ┌──────────────────────┐
                          │   PostgreSQL DB      │
                          │   (modules table)    │
                          └──────────────────────┘
```

## State Management Flow

### 1. Initial Load
```
User Opens Page
    ↓
ModuleGrid mounts
    ↓
TanStack Query: useQuery(['modules', zoneId])
    ↓
API: modulesApi.list(zoneId)
    ↓
Backend: GET /api/modules?zone_id=xxx
    ↓
Database: SELECT * FROM modules WHERE zone_id = xxx
    ↓
Response flows back up
    ↓
Zustand: setModules(fetchedModules)
    ↓
ModuleGrid renders with modules
```

### 2. Drag Module
```
User drags module
    ↓
GridLayout: onLayoutChange (optimistic update)
    ↓
Zustand: updateMultipleLayouts(newLayouts)
    ↓
UI updates immediately
    ↓
GridLayout: onDragStop
    ↓
TanStack Mutation: updateLayoutMutation.mutate()
    ↓
API: modulesApi.updateLayout(zoneId, layouts)
    ↓
Backend: POST /api/modules/layout
    ↓
Database: UPDATE modules SET position_x, position_y, width, height
    ↓
Success
    ↓
TanStack Query: invalidateQueries(['modules', zoneId])
```

### 3. Delete Module
```
User clicks Delete
    ↓
ModuleCard: onDelete handler
    ↓
ModuleGrid: handleDelete
    ↓
Confirmation dialog
    ↓
TanStack Mutation: deleteModuleMutation.mutate(moduleId)
    ↓
API: modulesApi.delete(moduleId)
    ↓
Backend: DELETE /api/modules/:id
    ↓
Database: DELETE FROM modules WHERE id = xxx (CASCADE)
    ↓
Success
    ↓
TanStack Query: invalidateQueries(['modules', zoneId])
    ↓
UI re-fetches and updates
```

## Layout Coordinate System

```
Grid Layout (12 columns × infinite rows)

┌─────────────────────────────────────────────────────────────┐
│ (0,0)   (1,0)   (2,0)   (3,0)   ... (11,0)                 │ Row 0
├─────────────────────────────────────────────────────────────┤
│ (0,1)   (1,1)   (2,1)   (3,1)   ... (11,1)                 │ Row 1
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   Example Module:                                           │
│   ┌──────────────┐                                          │
│   │ x=0, y=2     │                                          │
│   │ w=4, h=3     │   (spans 4 columns, 3 rows)            │ Rows 2-4
│   │              │                                          │
│   └──────────────┘                                          │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│ (0,5)   (1,5)   ...                                        │ Row 5
└─────────────────────────────────────────────────────────────┘

Module Position Object:
{
  i: "module-id",     // unique identifier
  x: 0,               // column position (0-11)
  y: 2,               // row position (0-∞)
  w: 4,               // width in columns (1-12)
  h: 3,               // height in rows (min: 2)
  minW: 2,            // minimum width
  minH: 2             // minimum height
}

Pixel Calculation:
- Column width = (containerWidth - margins - padding) / 12
- Row height = 60px (configurable)
- Item width = (columnWidth × w) + (margin × (w - 1))
- Item height = (rowHeight × h) + (margin × (h - 1))
```

## Module Types & Icons

```typescript
Type       Icon          Use Case
────────────────────────────────────────────────────
graph      BarChart3     Charts, analytics, graphs
table      Table2        Data tables, spreadsheets
calendar   Calendar      Events, schedules, dates
text       Type          Rich text, notes, docs
kanban     Layout        Task boards, workflows
list       List          Todo lists, items
grid       Grid3x3       Image galleries, tiles
```

## Props Flow

```
Page/Dashboard Component
    │
    ├── zoneId: string
    ├── onCreateModule: () => void
    ├── onEditModule: (module) => void
    ├── onDeleteModule: (module) => void
    ├── onDuplicateModule: (module) => void
    ├── onMoveModule: (module) => void
    └── onSettingsModule: (module) => void
    │
    ▼
ModuleGrid Component
    │
    ├── Fetches modules for zoneId
    ├── Manages layout state
    └── Renders grid with modules
        │
        └── For each module:
            │
            ▼
        ModuleCard Component
            │
            ├── module: Module
            ├── onEdit: inherited from ModuleGrid
            ├── onDelete: inherited from ModuleGrid
            ├── onDuplicate: inherited from ModuleGrid
            ├── onMove: inherited from ModuleGrid
            ├── onSettings: inherited from ModuleGrid
            └── children: Module-specific content
```

## Event Handlers

```typescript
// Grid Events
onLayoutChange(layout: Layout[])
  → Called during drag/resize (continuous)
  → Updates Zustand store optimistically

onDragStop(layout: Layout[])
  → Called when drag ends
  → Persists to backend via API

onResizeStop(layout: Layout[])
  → Called when resize ends
  → Persists to backend via API

// Card Events
onEdit(module: Module)
  → Open edit dialog
  → Update module properties

onDelete(module: Module)
  → Confirm deletion
  → Call API to delete
  → Invalidate cache

onDuplicate(module: Module)
  → Copy module config
  → Create new module
  → Position near original

onMove(module: Module)
  → Open zone selector
  → Move to different zone
  → Update zoneId

onSettings(module: Module)
  → Open settings panel
  → Configure filters, display options
```

## CSS Class Structure

```css
.react-grid-layout              /* Container for all grid items */
  .react-grid-item              /* Individual grid item wrapper */
    .module-grid-item           /* Custom wrapper for module */
      .card                     /* shadcn/ui Card component */
        .card-header            /* Module header */
          .drag-handle          /* Makes card draggable */
        .card-content           /* Module visualization */
        .card-footer            /* Optional filters/settings */
    .react-resizable-handle     /* Resize handles (8 directions) */
  .react-grid-placeholder       /* Visual placeholder during drag */
```

## Responsive Breakpoints

```
Screen Size    Breakpoint    Columns    Module Behavior
────────────────────────────────────────────────────────
Extra Large    ≥1200px       12         Full layout
Large          996-1199px    10         Slightly compressed
Medium         768-995px     6          Moderate compression
Small          480-767px     4          Heavy compression
Extra Small    <480px        2          Minimal layout

Module Width Adjustment:
- Large screens: use full w value
- Medium screens: w = min(w, 6)
- Small screens: w = min(w, 4)
- XS screens: w = 2 (stack vertically)
```

## Integration Points

### 1. Zone System
```typescript
// ModuleGrid needs active zone
const activeZoneId = useZoneStore((state) => state.activeZoneId);

// Pass to ModuleGrid
<ModuleGrid zoneId={activeZoneId} />
```

### 2. Module Dialogs
```typescript
// Create/Edit dialogs
const [dialogOpen, setDialogOpen] = useState(false);
const [selectedModule, setSelectedModule] = useState<Module | null>(null);

<ModuleGrid
  onCreateModule={() => {
    setSelectedModule(null);
    setDialogOpen(true);
  }}
  onEditModule={(module) => {
    setSelectedModule(module);
    setDialogOpen(true);
  }}
/>

<ModuleDialog
  open={dialogOpen}
  module={selectedModule}
  onClose={() => setDialogOpen(false)}
/>
```

### 3. Authentication
```typescript
// ModuleGrid uses API which requires authentication
// Ensure user is authenticated before rendering

<ProtectedRoute>
  <Dashboard>
    <ModuleGrid zoneId={activeZoneId} />
  </Dashboard>
</ProtectedRoute>
```

## Performance Optimization

### Current Optimizations
- `useCallback` for event handlers (prevents re-renders)
- `useMemo` for computed values (layout array, filtered modules)
- TanStack Query caching (prevents redundant fetches)
- Optimistic updates (immediate UI feedback)

### Future Optimizations
- Virtual scrolling for 50+ modules
- Debounce layout save API calls
- Lazy load module visualizations
- Code splitting for module types
- Service worker caching
- WebSocket for real-time updates

## Error Handling

```typescript
// API Error
useQuery({
  queryKey: ['modules', zoneId],
  queryFn: () => modulesApi.list(zoneId),
  onError: (error) => {
    toast.error('Failed to load modules');
    console.error(error);
  }
})

// Mutation Error
useMutation({
  mutationFn: modulesApi.updateLayout,
  onError: (error) => {
    toast.error('Failed to save layout');
    // Rollback optimistic update
    queryClient.invalidateQueries(['modules', zoneId]);
  }
})

// Network Error
// Handled by axios interceptor in api.ts
// Shows toast notification
// Redirects to login if 401
```

## Security Considerations

1. **Authorization**: Backend validates user owns module/zone
2. **Input Validation**: Zod schemas validate all API inputs
3. **SQL Injection**: Using Drizzle ORM (parameterized queries)
4. **XSS**: React escapes by default, sanitize user HTML
5. **CSRF**: Using HTTP-only cookies + SameSite
6. **Rate Limiting**: Backend rate limits API endpoints

## Accessibility

```typescript
// Keyboard Navigation
- Tab: Navigate between modules
- Enter/Space: Open actions menu
- Arrow keys: Navigate menu items
- Escape: Close dialogs/menus

// Screen Readers
<span className="sr-only">Open menu</span>
<div role="grid" aria-label="Module grid">
<button aria-label={`Edit ${module.name}`}>

// Focus Management
- Focus module after creation
- Focus first module after deletion
- Trap focus in dialogs
```

## Testing Strategy

### Unit Tests
- Store actions (Zustand)
- Layout calculations
- Event handlers
- Type validation

### Integration Tests
- API integration
- State synchronization
- Cache invalidation
- Error scenarios

### E2E Tests
- Drag and drop
- Create/edit/delete flows
- Multi-module interactions
- Responsive behavior
```
