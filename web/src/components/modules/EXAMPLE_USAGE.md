# Module Components - Example Usage

This document provides practical examples of how to use the module visualization components.

## Basic Usage with ModuleRenderer

The simplest way to use modules is with the `ModuleRenderer` component, which handles data fetching automatically:

```tsx
import { ModuleRenderer } from '@/components/modules';
import { Module } from '@/types';

function Dashboard() {
  const modules: Module[] = [
    {
      id: '123',
      type: 'graph',
      name: 'Revenue Chart',
      config: {
        chartType: 'line',
        dataFields: ['revenue', 'profit'],
      },
      // ... other module fields
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4">
      {modules.map((module) => (
        <div key={module.id} className="h-96">
          <ModuleRenderer module={module} />
        </div>
      ))}
    </div>
  );
}
```

## Using Individual Components

### 1. Graph Module Example

```tsx
import { GraphModule } from '@/components/modules';
import { useModuleNodes } from '@/components/modules';

function RevenueChart({ moduleId }: { moduleId: string }) {
  const { data, isLoading } = useModuleNodes(moduleId);

  return (
    <div className="h-96">
      <GraphModule
        nodes={data?.nodes || []}
        config={{
          chartType: 'bar',
          xAxisField: 'month',
          dataFields: ['revenue', 'expenses', 'profit'],
          filters: {
            nodeTypes: ['financial-data'],
            dateRange: {
              field: 'createdAt',
              start: '2024-01-01',
              end: '2024-12-31',
            },
          },
        }}
        isLoading={isLoading}
      />
    </div>
  );
}
```

**Expected Node Structure:**
```typescript
{
  id: '...',
  name: 'January 2024',
  type: 'financial-data',
  content: {
    month: 'January',
    revenue: 50000,
    expenses: 30000,
    profit: 20000,
  },
}
```

### 2. Table Module Example

```tsx
import { TableModule } from '@/components/modules';

function EmployeeTable({ nodes }: { nodes: Node[] }) {
  return (
    <div className="h-full">
      <TableModule
        nodes={nodes}
        config={{
          columns: ['department', 'position', 'salary', 'startDate'],
          pageSize: 15,
          sort: {
            field: 'name',
            order: 'asc',
          },
          filters: {
            nodeTypes: ['employee'],
          },
        }}
        isLoading={false}
      />
    </div>
  );
}
```

**Expected Node Structure:**
```typescript
{
  id: '...',
  name: 'John Doe',
  type: 'employee',
  content: {
    department: 'Engineering',
    position: 'Senior Developer',
    salary: 95000,
    startDate: '2022-03-15',
  },
}
```

### 3. Calendar Module Example

```tsx
import { CalendarModule } from '@/components/modules';

function EventCalendar({ nodes }: { nodes: Node[] }) {
  return (
    <div className="h-screen">
      <CalendarModule
        nodes={nodes}
        config={{
          dateField: 'eventDate',
          titleField: 'eventName',
          defaultView: 'month',
          filters: {
            nodeTypes: ['event', 'meeting', 'deadline'],
            tags: ['important'],
          },
        }}
        isLoading={false}
      />
    </div>
  );
}
```

**Expected Node Structure:**
```typescript
{
  id: '...',
  name: 'Team Meeting',
  type: 'event',
  color: '#3b82f6',
  content: {
    eventName: 'Q1 Planning Meeting',
    eventDate: '2024-02-15T10:00:00Z',
    eventDateEnd: '2024-02-15T11:30:00Z',
    location: 'Conference Room A',
  },
}
```

### 4. Text Module Example

```tsx
import { TextModule } from '@/components/modules';

function DocumentViewer({ nodes }: { nodes: Node[] }) {
  return (
    <div className="h-full">
      <TextModule
        nodes={nodes}
        config={{
          filters: {
            nodeTypes: ['document', 'note'],
            parentId: null, // Only root-level documents
          },
          sort: {
            field: 'updatedAt',
            order: 'desc',
          },
        }}
        isLoading={false}
      />
    </div>
  );
}
```

**Expected Node Structure:**
```typescript
{
  id: '...',
  name: 'Project Documentation',
  type: 'document',
  content: {
    text: `# Introduction

    This is the project documentation...

    ## Features
    - Feature 1
    - Feature 2
    `,
    format: 'markdown',
  },
}
```

### 5. Kanban Module Example

```tsx
import { KanbanModule } from '@/components/modules';

function TaskBoard({ nodes }: { nodes: Node[] }) {
  return (
    <div className="h-screen">
      <KanbanModule
        nodes={nodes}
        config={{
          statusField: 'status',
          columns: [
            { id: 'backlog', title: 'Backlog', color: '#94a3b8' },
            { id: 'todo', title: 'To Do', color: '#3b82f6' },
            { id: 'in-progress', title: 'In Progress', color: '#f59e0b' },
            { id: 'review', title: 'Review', color: '#8b5cf6' },
            { id: 'done', title: 'Done', color: '#10b981' },
          ],
          filters: {
            nodeTypes: ['task'],
          },
        }}
        isLoading={false}
      />
    </div>
  );
}
```

**Expected Node Structure:**
```typescript
{
  id: '...',
  name: 'Implement user authentication',
  type: 'task',
  color: '#3b82f6',
  content: {
    status: 'in-progress',
    description: 'Add JWT-based authentication with refresh tokens',
    assignee: 'john@example.com',
    priority: 'high',
    dueDate: '2024-03-01',
  },
}
```

## Advanced Usage

### Using with TanStack Query

```tsx
import { useQuery } from '@tanstack/react-query';
import { GraphModule } from '@/components/modules';
import { api } from '@/api';

function AnalyticsModule({ moduleId }: { moduleId: string }) {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['module-nodes', moduleId],
    queryFn: async () => {
      const response = await api.get(`/modules/${moduleId}/nodes`);
      return response.data;
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  return (
    <div className="h-96">
      <div className="mb-2 flex justify-between items-center">
        <h2 className="text-lg font-semibold">{data?.module.name}</h2>
        <button onClick={() => refetch()}>Refresh</button>
      </div>
      <GraphModule
        nodes={data?.nodes || []}
        config={data?.module.config || {}}
        isLoading={isLoading}
      />
    </div>
  );
}
```

### Custom Module Renderer with Error Handling

```tsx
import { renderModuleByType, ModuleError, ModuleSkeleton } from '@/components/modules';
import { useModuleNodes } from '@/components/modules';

function CustomModuleRenderer({ moduleId }: { moduleId: string }) {
  const { data, isLoading, isError, error, refetch } = useModuleNodes(moduleId);

  if (isLoading) {
    return <ModuleSkeleton />;
  }

  if (isError) {
    return <ModuleError error={error} onRetry={refetch} />;
  }

  if (!data || data.nodes.length === 0) {
    return <ModuleEmptyState type={data.module.type} />;
  }

  return (
    <div className="h-full">
      <h2 className="text-xl font-bold mb-4">{data.module.name}</h2>
      {renderModuleByType(
        data.module.type,
        data.nodes,
        data.module.config,
        false
      )}
    </div>
  );
}
```

### Dynamic Module Grid

```tsx
import { ModuleRenderer } from '@/components/modules';
import { Module } from '@/types';

function DynamicDashboard({ modules }: { modules: Module[] }) {
  return (
    <div className="grid grid-cols-12 gap-4 p-4">
      {modules.map((module) => (
        <div
          key={module.id}
          className="border rounded-lg p-4"
          style={{
            gridColumn: `span ${module.width}`,
            gridRow: `span ${module.height}`,
            minHeight: `${module.height * 100}px`,
          }}
        >
          <ModuleRenderer module={module} />
        </div>
      ))}
    </div>
  );
}
```

### Filtering and Sorting

```tsx
import { GraphModule } from '@/components/modules';

function FilteredChart() {
  const config = {
    chartType: 'line' as const,
    dataFields: ['value'],
    filters: {
      nodeTypes: ['metric'],
      tags: ['performance'],
      dateRange: {
        field: 'createdAt' as const,
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        end: new Date().toISOString(),
      },
      search: 'revenue',
      customFilters: {
        value: { gte: 1000 }, // Only values >= 1000
      },
    },
    sort: {
      field: 'createdAt' as const,
      order: 'asc' as const,
    },
    limit: 50,
  };

  // Fetch nodes with config...

  return <GraphModule nodes={nodes} config={config} isLoading={false} />;
}
```

## Tips and Best Practices

1. **Always handle loading states**: Pass `isLoading` prop to show loading indicators

2. **Use appropriate height**: Module components are flex-based and need a height constraint:
   ```tsx
   <div className="h-96"> {/* or h-full, h-screen, etc. */}
     <GraphModule ... />
   </div>
   ```

3. **Configure filters in module config**: Use the `filters` field to pre-filter data on the backend

4. **Color consistency**: Use the node's `color` field for consistent theming across modules

5. **Responsive layouts**: All modules are responsive, but consider different grid layouts for mobile

6. **Refresh data**: Use TanStack Query's `refetchInterval` for real-time updates

7. **Error boundaries**: Wrap modules in error boundaries for production apps

8. **Type safety**: Use TypeScript and the provided types for type-safe configurations

9. **Performance**: Use pagination (table) and limit (all modules) to avoid rendering too much data

10. **Accessibility**: All components support keyboard navigation and screen readers
