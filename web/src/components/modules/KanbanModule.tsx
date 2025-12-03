import React from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Node, ModuleConfig } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { GripVertical } from 'lucide-react';

interface KanbanModuleProps {
  nodes: Node[];
  config: ModuleConfig;
  isLoading?: boolean;
}

interface KanbanColumn {
  id: string;
  title: string;
  color?: string;
  nodes: Node[];
}

interface KanbanCardProps {
  node: Node;
}

function KanbanCard({ node }: KanbanCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: node.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <Card className="mb-3 cursor-move hover:shadow-md transition-shadow">
        <CardContent className="p-3">
          <div className="flex items-start gap-2">
            <div {...listeners} className="mt-1 cursor-grab active:cursor-grabbing">
              <GripVertical className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-sm mb-1 truncate">{node.name}</h4>
              {node.content.description && (
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {node.content.description}
                </p>
              )}
              <div className="flex items-center gap-2 mt-2">
                {node.type && (
                  <span className="text-xs px-2 py-0.5 bg-muted rounded-md">{node.type}</span>
                )}
                {node.color && (
                  <div
                    className="w-3 h-3 rounded-full border"
                    style={{ backgroundColor: node.color }}
                  />
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function KanbanModule({ nodes, config, isLoading }: KanbanModuleProps) {
  const [activeNode, setActiveNode] = React.useState<Node | null>(null);
  const statusField = config.statusField || 'status';

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Get columns from config or generate default columns
  const columns = React.useMemo<KanbanColumn[]>(() => {
    if (config.kanbanColumns && config.kanbanColumns.length > 0) {
      return config.kanbanColumns.map((col) => ({
        id: col.id,
        title: col.title,
        color: col.color,
        nodes: nodes.filter((node) => node.content[statusField] === col.id),
      }));
    }

    // Generate columns from unique status values
    const statusValues = new Set<string>();
    nodes.forEach((node) => {
      const status = node.content[statusField];
      if (status) {
        statusValues.add(String(status));
      }
    });

    const defaultColumns = ['todo', 'in-progress', 'done'];
    const allStatuses = Array.from(statusValues);

    // Use default columns if available, otherwise use discovered statuses
    const columnIds = allStatuses.length > 0 ? allStatuses : defaultColumns;

    return columnIds.map((status) => ({
      id: status,
      title: status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' '),
      nodes: nodes.filter((node) => node.content[statusField] === status),
    }));
  }, [nodes, config.kanbanColumns, statusField]);

  const handleDragStart = (event: DragStartEvent) => {
    const node = nodes.find((n) => n.id === event.active.id);
    if (node) {
      setActiveNode(node);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveNode(null);

    const { active, over } = event;
    if (!over) return;

    // Find which column the node was dropped into
    const targetColumnId = columns.find((col) =>
      col.id === over.id || col.nodes.some((n) => n.id === over.id)
    )?.id;

    if (targetColumnId) {
      // Here you would update the node's status
      // This would typically call an API to update the node
      console.log(`Move node ${active.id} to column ${targetColumnId}`);
      // For now, this is just a placeholder
      // You would implement: api.updateNode(active.id, { content: { ...node.content, [statusField]: targetColumnId } })
    }
  };

  if (isLoading) {
    return (
      <Card className="h-full">
        <CardContent className="flex items-center justify-center h-full">
          <div className="animate-pulse text-muted-foreground">Loading kanban board...</div>
        </CardContent>
      </Card>
    );
  }

  if (nodes.length === 0) {
    return (
      <Card className="h-full">
        <CardContent className="flex items-center justify-center h-full">
          <div className="text-center text-muted-foreground">
            <p className="text-lg font-medium">No Tasks</p>
            <p className="text-sm mt-2">Add nodes with status fields to organize them in columns</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardContent className="p-4 h-full">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 h-full">
            {columns.map((column) => (
              <div key={column.id} className="flex flex-col min-w-0">
                <div className="mb-3 flex items-center gap-2">
                  {column.color && (
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: column.color }}
                    />
                  )}
                  <h3 className="font-semibold text-sm">{column.title}</h3>
                  <span className="text-xs text-muted-foreground ml-auto">
                    {column.nodes.length}
                  </span>
                </div>
                <ScrollArea className="flex-1">
                  <div className="pr-2">
                    <SortableContext
                      items={column.nodes.map((n) => n.id)}
                      strategy={verticalListSortingStrategy}
                      id={column.id}
                    >
                      {column.nodes.length === 0 ? (
                        <div className="text-center py-8 text-sm text-muted-foreground border-2 border-dashed rounded-lg">
                          Drop items here
                        </div>
                      ) : (
                        column.nodes.map((node) => <KanbanCard key={node.id} node={node} />)
                      )}
                    </SortableContext>
                  </div>
                </ScrollArea>
              </div>
            ))}
          </div>

          <DragOverlay>
            {activeNode ? (
              <Card className="cursor-grabbing opacity-90 shadow-lg">
                <CardContent className="p-3">
                  <div className="flex items-start gap-2">
                    <GripVertical className="h-4 w-4 text-muted-foreground mt-1" />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm mb-1">{activeNode.name}</h4>
                      {activeNode.content.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {activeNode.content.description}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : null}
          </DragOverlay>
        </DndContext>
      </CardContent>
    </Card>
  );
}
