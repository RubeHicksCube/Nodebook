# Nodebook Architecture

## Core Philosophy

**Nodes exist independently.** They are atomic data units that stand on their own.

**Modules** are visualization methods that **filter and display** nodes in different formats (graphs, tables, calendars, etc.).

**Zones** provide organizational context for grouping related modules.

## Hierarchy

```
Dashboard
  └─ Zones (Categories/Workspaces) - Left Sidebar
       └─ Modules (Visualizations/Pages) - Dashboard Grid
            └─ Filtered Nodes (Data queried by module filters)
```

**Important:** The arrow doesn't mean ownership - modules **query** nodes via filters, they don't **contain** them. A single node can appear in multiple modules.

## Entity Definitions

### 1. Zones
- **What:** Categories or workspaces for organizing modules
- **Examples:** "Budget", "Health", "Work Projects", "Personal"
- **Properties:**
  - id (UUID)
  - user_id
  - name
  - color
  - icon
  - reference_id (for quick search)
  - position (order in sidebar)
  - is_default (boolean)
  - created_at, updated_at

### 2. Modules
- **What:** Pages/visualizations that display collections of nodes
- **Examples:**
  - "Net Worth Graph" (line chart of income/expense nodes)
  - "Weight Loss Chart" (weight nodes over time)
  - "Expense Table" (table of expense nodes)
  - "Blog Post" (single large node)
- **Properties:**
  - id (UUID)
  - user_id
  - zone_id (which zone it belongs to)
  - name
  - reference_id (for quick search)
  - type (graph, table, kanban, text, custom)
  - config (JSONB - visualization settings, filters, etc.)
  - position_x, position_y (grid coordinates)
  - width, height (grid units)
  - created_at, updated_at

### 3. Nodes
- **What:** Atomic units of data/content
- **Examples:**
  - A single weight entry: `{ date: "2024-01-15", weight: 180, unit: "lbs" }`
  - A blog post: `{ title: "...", content: "...", markdown: true }`
  - An expense: `{ amount: 45.50, category: "food", date: "..." }`
  - An image: `{ url: "...", alt: "...", caption: "..." }`
- **Properties:**
  - id (UUID) - immutable
  - user_id
  - type (weight, expense, income, blog, image, text, etc.)
  - content (JSONB - flexible schema based on type)
  - metadata (JSONB - additional context)
  - tags (many-to-many relationship)
  - created_at, updated_at, deleted_at (soft delete)

### 4. Module-Node Relationships
- Modules can pull nodes based on:
  - Node type (e.g., all "weight" nodes)
  - Tags (e.g., all nodes tagged "work")
  - Date range
  - Custom filters in module config

## Database Schema

### zones
```sql
CREATE TABLE zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  reference_id VARCHAR(50) UNIQUE, -- e.g., "ZONE-BUDGET-001"
  color VARCHAR(7),
  icon VARCHAR(50),
  position INTEGER NOT NULL DEFAULT 0,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX zones_user_id_idx ON zones(user_id);
CREATE INDEX zones_reference_id_idx ON zones(reference_id);
```

### modules
```sql
CREATE TABLE modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  zone_id UUID NOT NULL REFERENCES zones(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  reference_id VARCHAR(50) UNIQUE, -- e.g., "MOD-NETWORTH-001"
  type VARCHAR(50) NOT NULL, -- graph, table, kanban, text, etc.
  config JSONB DEFAULT '{}', -- visualization settings
  position_x FLOAT DEFAULT 0,
  position_y FLOAT DEFAULT 0,
  width FLOAT DEFAULT 4, -- grid units
  height FLOAT DEFAULT 3, -- grid units
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX modules_user_id_idx ON modules(user_id);
CREATE INDEX modules_zone_id_idx ON modules(zone_id);
CREATE INDEX modules_reference_id_idx ON modules(reference_id);
```

### nodes (enhanced)
```sql
-- Keep existing nodes table but enhance it
ALTER TABLE nodes ADD COLUMN reference_id VARCHAR(50) UNIQUE;
ALTER TABLE nodes ADD COLUMN deleted_at TIMESTAMP;

CREATE INDEX nodes_reference_id_idx ON nodes(reference_id);
CREATE INDEX nodes_type_idx ON nodes(user_id, type);
CREATE INDEX nodes_deleted_at_idx ON nodes(deleted_at) WHERE deleted_at IS NULL;
```

### module_filters (optional - for saved filters)
```sql
CREATE TABLE module_filters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  filter_type VARCHAR(50) NOT NULL, -- node_type, tag, date_range, custom
  filter_value JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## API Routes

### Zones
- `GET /api/zones` - Get all zones for user
- `GET /api/zones/:id` - Get zone by ID
- `POST /api/zones` - Create zone
- `PATCH /api/zones/:id` - Update zone
- `DELETE /api/zones/:id` - Delete zone
- `POST /api/zones/:id/reorder` - Reorder zones

### Modules
- `GET /api/modules?zone_id=xxx` - Get modules for zone
- `GET /api/modules/:id` - Get module by ID
- `GET /api/modules/:id/nodes` - Get nodes for module (with filters)
- `POST /api/modules` - Create module
- `PATCH /api/modules/:id` - Update module
- `DELETE /api/modules/:id` - Delete module
- `POST /api/modules/:id/move` - Move module to different zone
- `POST /api/modules/:id/resize` - Resize module

### Nodes (existing + enhancements)
- Keep existing node routes
- Add `GET /api/nodes/search?ref=xxx` - Search by reference_id
- Add soft delete support

## UI Components

### Dashboard Layout
```
+------------------+-------------------------------------+
| Zones Sidebar    | Module Grid (customizable)         |
|                  |                                     |
| Zone 1           | +--------+  +--------+  +--------+ |
| Zone 2 (active)  | | Module |  | Module |  | Module | |
| Zone 3           | |   1    |  |   2    |  |   3    | |
|                  | +--------+  +--------+  +--------+ |
|                  |                                     |
|                  | +--------+  +--------------------+ |
|                  | | Module |  |      Module 5       | |
|                  | |   4    |  |    (larger)         | |
|                  | +--------+  +--------------------+ |
+------------------+-------------------------------------+
```

### Module Types
1. **Graph Module** - Line/bar/pie charts from node data
2. **Table Module** - Tabular view of nodes
3. **Kanban Module** - Drag-drop board (like Trello)
4. **Text Module** - Single large node (blog post, note)
5. **Gallery Module** - Image nodes in grid
6. **Calendar Module** - Nodes displayed on calendar
7. **Custom Module** - User-defined visualization

## Example Use Cases

### Budget Zone
```
Modules:
1. "Net Worth Graph" (type: graph)
   - Filters: nodes with type "income" or "expense"
   - Config: { chartType: "line", calculation: "cumulative" }

2. "Expense Table" (type: table)
   - Filters: nodes with type "expense"
   - Config: { columns: ["date", "amount", "category"], sortBy: "date" }

3. "Income vs Expenses" (type: graph)
   - Filters: nodes with type "income" OR "expense"
   - Config: { chartType: "bar", groupBy: "month", comparison: true }
```

### Health Zone
```
Modules:
1. "Weight Tracker" (type: graph)
   - Filters: nodes with type "weight"
   - Config: { chartType: "line", yAxis: "weight", xAxis: "date" }

2. "Mood Calendar" (type: calendar)
   - Filters: nodes with type "mood"
   - Config: { colorBy: "mood_value" }
```

## Implementation Plan

### Phase 1: Schema & API (Priority)
1. Create zones table and API routes
2. Create modules table and API routes
3. Add reference_id and soft delete to nodes
4. Migration scripts

### Phase 2: UI Foundation
1. Update dashboard to show zones sidebar
2. Build grid layout system for modules
3. Create module cards/containers
4. Zone switcher

### Phase 3: Module Types
1. Text module (simplest - just display node content)
2. Table module
3. Graph module (using recharts or similar)
4. Calendar module
5. Custom module framework

### Phase 4: Advanced Features
1. Drag-and-drop module positioning
2. Module resize
3. Quick search by reference_id
4. Node sharing/embedding
5. Export/import
