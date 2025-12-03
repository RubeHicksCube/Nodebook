# Module Rendering System

## Core Philosophy

**Nodes exist independently** - They are atomic data units that stand on their own. **Modules** are simply different ways to **visualize** and interact with those nodes.

## Architecture Overview

```
Nodes (Data Layer)
  ↑ filtered by
Modules (Visualization Layer)
  ↑ organized by
Zones (Context Layer)
  ↑ displayed in
Dashboard (UI Layer)
```

## The Relationship

### Nodes → The Data
- Nodes are **pure data** - they don't belong to zones or modules
- Each node has a `type` (document, image, table, event, etc.) and JSONB `content`
- Nodes can be tagged and nested hierarchically via `parentId`
- **Key Principle:** A single node can appear in multiple modules

### Modules → The Display Method
- Modules **don't own nodes** - they **query and display** them
- Each module has a `config` object that defines:
  - **Filters**: Which nodes to show (by type, tags, date range, parent, custom JSONB queries)
  - **Visualization type**: How to render them (graph, table, kanban, calendar, etc.)
  - **Sort order**: How to order the results

### Zones → The Context
- Zones are **organizational containers for modules**
- They provide context: "Budget", "Health", "Work", etc.
- Zones help users mentally group related visualizations
- **Zones do NOT contain nodes** - they contain modules that filter nodes

## Module Types and Their Purpose

Each module type renders filtered nodes in a specific format:

### 1. **Graph Module** (`type: 'graph'`)
**Purpose:** Visualize numeric node data over time or relationships

**Example Use Case:**
```javascript
// "Net Worth Over Time" module
{
  type: 'graph',
  config: {
    filters: {
      nodeTypes: ['income', 'expense'],
      dateRange: { field: 'createdAt', start: '2024-01-01' }
    },
    chartType: 'line',
    xAxis: 'content.date',
    yAxis: 'content.amount',
    calculation: 'cumulative'
  }
}
```

**Expected Node Structure:**
- Nodes with numeric fields in `content` (e.g., `content.amount`, `content.value`)
- Time-series data with date fields

### 2. **Table Module** (`type: 'table'`)
**Purpose:** Display nodes in a tabular format with sortable columns

**Example Use Case:**
```javascript
// "Expense Tracker" module
{
  type: 'table',
  config: {
    filters: {
      nodeTypes: ['expense'],
      tags: ['work']
    },
    columns: ['name', 'content.amount', 'content.category', 'createdAt'],
    sortBy: 'createdAt',
    sortOrder: 'desc'
  }
}
```

**Expected Node Structure:**
- Any nodes where you want to display specific fields as columns
- Works best with consistent content structures

### 3. **Kanban Module** (`type: 'kanban'`)
**Purpose:** Task/card organization with drag-and-drop between columns

**Example Use Case:**
```javascript
// "Project Tasks" module
{
  type: 'kanban',
  config: {
    filters: {
      nodeTypes: ['task'],
      parentId: 'project-uuid-123'
    },
    groupBy: 'content.status', // "todo", "in_progress", "done"
    columnOrder: ['todo', 'in_progress', 'done']
  }
}
```

**Expected Node Structure:**
- Nodes with a `content.status` field (or similar grouping field)
- Optional: `content.priority`, `content.assignee`, `content.dueDate`

### 4. **Text Module** (`type: 'text'`)
**Purpose:** Display a single large node (blog post, note, document)

**Example Use Case:**
```javascript
// "Project README" module
{
  type: 'text',
  config: {
    filters: {
      nodeTypes: ['document'],
      search: 'README'
    },
    renderMode: 'markdown' // or 'html' or 'plain'
  }
}
```

**Expected Node Structure:**
- Single node with large `content.text` or `content.markdown` field

### 5. **Calendar Module** (`type: 'calendar'`)
**Purpose:** Display nodes on a calendar view by date

**Example Use Case:**
```javascript
// "Mood Tracker" module
{
  type: 'calendar',
  config: {
    filters: {
      nodeTypes: ['mood', 'event'],
      dateRange: { field: 'createdAt', start: '2024-01-01' }
    },
    dateField: 'content.date', // or 'createdAt'
    colorBy: 'content.mood_value' // color-code by field
  }
}
```

**Expected Node Structure:**
- Nodes with a date field (either `createdAt` or `content.date`)
- Optional: Fields for color-coding or categorization

### 6. **Gallery Module** (`type: 'gallery'`)
**Purpose:** Display image/file nodes in a grid

**Example Use Case:**
```javascript
// "Screenshots" module
{
  type: 'gallery',
  config: {
    filters: {
      nodeTypes: ['image'],
      tags: ['screenshot']
    },
    gridColumns: 4,
    imageSize: 'medium'
  }
}
```

**Expected Node Structure:**
- Nodes with `type: 'image'` or `type: 'file'`
- `content.url` pointing to uploaded file
- Optional: `content.thumbnail`, `content.caption`

### 7. **Custom Module** (`type: 'custom'`)
**Purpose:** User-defined visualization logic

**Example Use Case:**
```javascript
// "Custom Dashboard Widget" module
{
  type: 'custom',
  config: {
    filters: { nodeTypes: ['metric'] },
    componentName: 'MetricWidget',
    customProps: { showTrend: true }
  }
}
```

**Expected Node Structure:**
- Flexible - depends on custom component implementation

## Implementation Flow

### Backend: Module Nodes Endpoint
```
GET /api/modules/:id/nodes
```

1. Fetch the module by ID
2. Extract `config.filters` from the module
3. Use `filterBuilder.ts` to build Drizzle query conditions
4. Execute query and return filtered nodes
5. Frontend receives nodes + knows module type

### Frontend: Module Renderer Component
```typescript
<ModuleRenderer
  module={module}
  nodes={filteredNodes}
/>
```

The renderer switches on `module.type`:
- `type: 'graph'` → `<GraphRenderer nodes={nodes} config={config} />`
- `type: 'table'` → `<TableRenderer nodes={nodes} config={config} />`
- `type: 'kanban'` → `<KanbanRenderer nodes={nodes} config={config} />`
- etc.

## Key Implementation Details

### Filter Builder (`server/src/lib/filterBuilder.ts`)
- **Soft delete handling:** Always excludes `deletedAt IS NOT NULL`
- **Tag filtering:** Joins through `node_tags` junction table
- **Custom JSONB filters:** Supports `gte`, `lte`, `eq` operators on `content` fields
- **Performance:** Limits results (default 100, max 1000 per module)

### Module Config Schema
```typescript
interface ModuleConfig {
  filters?: {
    nodeTypes?: string[];      // Filter by node type
    tags?: string[];            // Filter by tag names
    dateRange?: {               // Filter by date
      field: 'createdAt' | 'updatedAt';
      start?: string;
      end?: string;
    };
    parentId?: string | null;   // Filter by parent node
    search?: string;             // Full-text search
    customFilters?: {           // JSONB content filters
      [key: string]: any;       // e.g., { amount: { gte: 100 } }
    };
  };
  sort?: {
    field: 'createdAt' | 'updatedAt' | 'name';
    order: 'asc' | 'desc';
  };
  limit?: number;               // Max nodes to return (capped at 1000)
}
```

## Example Workflow: Budget Zone

**Zone:** Budget
**Purpose:** Track income and expenses

**Modules in this zone:**

1. **Net Worth Graph**
   - Type: `graph`
   - Filters: `nodeTypes: ['income', 'expense']`
   - Visualization: Cumulative line chart over time

2. **Expense Table**
   - Type: `table`
   - Filters: `nodeTypes: ['expense']`
   - Visualization: Sortable table with amount, category, date columns

3. **Income vs Expenses**
   - Type: `graph`
   - Filters: `nodeTypes: ['income', 'expense']`
   - Visualization: Grouped bar chart comparing monthly totals

**Nodes used across all modules:**
- Node 1: `{ type: 'income', content: { amount: 5000, date: '2024-01-15', source: 'salary' } }`
- Node 2: `{ type: 'expense', content: { amount: 45.50, date: '2024-01-16', category: 'food' } }`
- Node 3: `{ type: 'expense', content: { amount: 1200, date: '2024-01-01', category: 'rent' } }`

**Result:** The same 3 nodes appear in different modules with different visualizations:
- Graph modules show trends
- Table module shows detailed rows
- All are in the "Budget" zone for organizational context

## Migration Notes

The system previously tried to link nodes directly to zones via `zoneId`. This has been **removed** because:
- Nodes are data, not views
- A single node can be relevant to multiple zones
- Modules provide the filtering/display logic

**New approach:**
- Nodes exist independently with no zone relationship
- Modules filter nodes and belong to zones
- Zones organize modules for user context
