# Module Visualization Components

This directory contains the visualization components for different module types in Nodebook. Each module type displays filtered node data in a different format.

## Components

### 1. GraphModule (`GraphModule.tsx`)
Displays node data as interactive charts using Recharts.

**Features:**
- Support for multiple chart types: line, bar, area, pie
- Customizable data fields via module config
- Responsive design with tooltips and legends
- Dark mode support

**Config:**
```typescript
{
  chartType: 'line' | 'bar' | 'area' | 'pie',
  xAxisField: 'name', // field to use for x-axis
  yAxisField: 'value', // field to use for y-axis
  dataFields: ['value', 'count'], // multiple data series
}
```

**Usage:**
```tsx
import { GraphModule } from '@/components/modules';

<GraphModule
  nodes={nodes}
  config={{ chartType: 'bar', dataFields: ['revenue', 'expenses'] }}
  isLoading={false}
/>
```

---

### 2. TableModule (`TableModule.tsx`)
Displays node data in a sortable, filterable table using TanStack Table.

**Features:**
- Sortable columns
- Global search filter
- Pagination
- Configurable columns
- Responsive layout

**Config:**
```typescript
{
  columns: ['field1', 'field2'], // fields from node.content to display
  pageSize: 10, // rows per page
}
```

**Usage:**
```tsx
import { TableModule } from '@/components/modules';

<TableModule
  nodes={nodes}
  config={{ columns: ['name', 'value', 'status'], pageSize: 20 }}
  isLoading={false}
/>
```

---

### 3. CalendarModule (`CalendarModule.tsx`)
Displays nodes with date fields as calendar events using react-big-calendar.

**Features:**
- Month, week, and day views
- Color-coded events
- Navigation controls
- Configurable date and title fields

**Config:**
```typescript
{
  dateField: 'date', // field in node.content for event date
  titleField: 'name', // field for event title
  defaultView: 'month' | 'week' | 'day',
}
```

**Usage:**
```tsx
import { CalendarModule } from '@/components/modules';

<CalendarModule
  nodes={nodes}
  config={{ dateField: 'eventDate', titleField: 'title', defaultView: 'month' }}
  isLoading={false}
/>
```

---

### 4. TextModule (`TextModule.tsx`)
Displays rich text content from nodes with markdown support.

**Features:**
- Markdown rendering
- HTML support
- Plain text fallback
- Multiple node display with separators
- Scrollable content

**Config:**
```typescript
{
  // No specific config required
  // Uses node.content.text, node.content.body, or node.content.content
}
```

**Usage:**
```tsx
import { TextModule } from '@/components/modules';

<TextModule
  nodes={nodes}
  config={{}}
  isLoading={false}
/>
```

**Node Content Format:**
```typescript
{
  text: "# Heading\nMarkdown content...",
  format: 'markdown' | 'html' | 'plain'
}
```

---

### 5. KanbanModule (`KanbanModule.tsx`)
Displays nodes in draggable kanban columns using @dnd-kit.

**Features:**
- Drag-and-drop between columns
- Configurable columns
- Auto-generated columns from node status values
- Visual feedback during drag

**Config:**
```typescript
{
  statusField: 'status', // field in node.content for column assignment
  columns: [
    { id: 'todo', title: 'To Do', color: '#ff0000' },
    { id: 'in-progress', title: 'In Progress', color: '#ffaa00' },
    { id: 'done', title: 'Done', color: '#00ff00' }
  ]
}
```

**Usage:**
```tsx
import { KanbanModule } from '@/components/modules';

<KanbanModule
  nodes={nodes}
  config={{
    statusField: 'status',
    columns: [
      { id: 'backlog', title: 'Backlog' },
      { id: 'active', title: 'Active' },
      { id: 'complete', title: 'Complete' }
    ]
  }}
  isLoading={false}
/>
```

---

## Module Factory

### `index.tsx`
Exports all module components and provides utility functions for rendering modules.

**Key Exports:**

#### `ModuleRenderer`
A component that fetches module nodes and renders the appropriate module type:

```tsx
import { ModuleRenderer } from '@/components/modules';

<ModuleRenderer module={module} />
```

#### `renderModuleByType()`
Factory function to render a module by type:

```tsx
import { renderModuleByType } from '@/components/modules';

const element = renderModuleByType('graph', nodes, config, isLoading);
```

#### `useModuleNodes()`
Hook to fetch module nodes with automatic refetching:

```tsx
import { useModuleNodes } from '@/components/modules';

const { data, isLoading, isError } = useModuleNodes(moduleId);
```

#### Helper Components
- `ModuleSkeleton` - Loading skeleton
- `ModuleError` - Error display with retry
- `ModuleEmptyState` - Empty state messages

---

## Common Props

All module components share these props:

```typescript
interface ModuleProps {
  nodes: Node[];        // Array of nodes to display
  config: ModuleConfig; // Module-specific configuration
  isLoading?: boolean;  // Loading state
}
```

## Data Flow

1. **Module Creation**: User creates a module with type and config
2. **Data Fetching**: `ModuleRenderer` or `useModuleNodes` fetches filtered nodes from `/api/modules/:id/nodes`
3. **Rendering**: Appropriate module component renders based on `module.type`
4. **Visualization**: Component transforms node data according to its config and displays it

## API Response

All modules expect this response from `/api/modules/:id/nodes`:

```typescript
{
  module: Module,
  nodes: Node[],
  total: number,
  appliedFilters: ModuleFilter
}
```

## Styling

All components:
- Use shadcn/ui components for consistency
- Support dark mode via CSS variables
- Are responsive and mobile-friendly
- Include loading and empty states

## Future Enhancements

Potential future module types:
- `list` - Simple list view
- `grid` - Card grid layout
- `timeline` - Timeline visualization
- `map` - Geographic data visualization
- `gantt` - Project timeline
