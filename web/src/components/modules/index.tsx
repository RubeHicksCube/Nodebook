import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { GraphModule } from './GraphModule';
import { TableModule } from './TableModule';
import { CalendarModule } from './CalendarModule';
import { TextModule } from './TextModule';
import { KanbanModule } from './KanbanModule';
import CanvasModule from './CanvasModule';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';
import { Module, ModuleType, Node, ModuleNodesResponse } from '@/types';
import { api } from '@/api';

// Export all module components
export { GraphModule } from './GraphModule';
export { TableModule } from './TableModule';
export { CalendarModule } from './CalendarModule';
export { TextModule } from './TextModule';
export { KanbanModule } from './KanbanModule';
export { CanvasModule };

interface ModuleRendererProps {
  module: Module;
}

/**
 * ModuleRenderer component that fetches nodes and renders the appropriate module type
 */
export function ModuleRenderer({ module }: ModuleRendererProps) {
  const {
    data,
    isLoading,
    isError,
    error,
  } = useQuery<ModuleNodesResponse>({
    queryKey: ['module-nodes', module.id],
    queryFn: async () => {
      const response = await api.get(`/modules/${module.id}/nodes`);
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    refetchOnWindowFocus: false, // Don't refetch on window focus
  });

  if (isError) {
    return (
      <Card className="h-full">
        <CardContent className="flex items-center justify-center h-full">
          <div className="text-center text-destructive">
            <AlertCircle className="h-12 w-12 mx-auto mb-4" />
            <p className="text-lg font-medium">Error Loading Module</p>
            <p className="text-sm mt-2">
              {error instanceof Error ? error.message : 'Failed to load module data'}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const nodes = data?.nodes || [];
  const config = module.config;

  return renderModuleByType(module.type, nodes, config, isLoading);
}

/**
 * Factory function to render the correct module component based on type
 */
export function renderModuleByType(
  type: ModuleType,
  nodes: Node[],
  config: any,
  isLoading: boolean = false
): React.ReactElement {
  switch (type) {
    case 'graph':
      return <GraphModule nodes={nodes} config={config} isLoading={isLoading} />;

    case 'table':
      return <TableModule nodes={nodes} config={config} isLoading={isLoading} />;

    case 'calendar':
      return <CalendarModule nodes={nodes} config={config} isLoading={isLoading} />;

    case 'text':
      return <TextModule nodes={nodes} config={config} isLoading={isLoading} />;

    case 'kanban':
      return <KanbanModule nodes={nodes} config={config} isLoading={isLoading} />;

    case 'canvas':
      // Canvas module needs refactoring - zones no longer own nodes
      return (
        <Card className="h-full">
          <CardContent className="flex items-center justify-center h-full">
            <div className="text-center text-muted-foreground">
              <AlertCircle className="h-12 w-12 mx-auto mb-4" />
              <p className="text-lg font-medium">Canvas Module Under Construction</p>
              <p className="text-sm mt-2">
                Canvas visualization is being updated to work with the new node architecture.
                <br />
                Please use Table, Graph, or other module types for now.
              </p>
            </div>
          </CardContent>
        </Card>
      );

    case 'list':
    case 'grid':
      // Fallback to table for list/grid types (can be implemented later)
      return <TableModule nodes={nodes} config={config} isLoading={isLoading} />;

    default:
      return (
        <Card className="h-full">
          <CardContent className="flex items-center justify-center h-full">
            <div className="text-center text-muted-foreground">
              <AlertCircle className="h-12 w-12 mx-auto mb-4" />
              <p className="text-lg font-medium">Unknown Module Type</p>
              <p className="text-sm mt-2">Module type "{type}" is not supported</p>
            </div>
          </CardContent>
        </Card>
      );
  }
}

/**
 * Hook to fetch module nodes
 */
export function useModuleNodes(moduleId: string) {
  return useQuery<ModuleNodesResponse>({
    queryKey: ['module-nodes', moduleId],
    queryFn: async () => {
      const response = await api.get(`/modules/${moduleId}/nodes`);
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    refetchOnWindowFocus: false, // Don't refetch on window focus
  });
}

/**
 * Module loading skeleton component
 */
export function ModuleSkeleton() {
  return (
    <Card className="h-full">
      <CardContent className="flex items-center justify-center h-full">
        <div className="space-y-3 w-full max-w-md">
          <div className="h-4 bg-muted rounded animate-pulse" />
          <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
          <div className="h-4 bg-muted rounded animate-pulse w-1/2" />
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Module error component
 */
interface ModuleErrorProps {
  error: Error | unknown;
  onRetry?: () => void;
}

export function ModuleError({ error, onRetry }: ModuleErrorProps) {
  return (
    <Card className="h-full">
      <CardContent className="flex items-center justify-center h-full">
        <div className="text-center text-destructive">
          <AlertCircle className="h-12 w-12 mx-auto mb-4" />
          <p className="text-lg font-medium">Error Loading Module</p>
          <p className="text-sm mt-2">
            {error instanceof Error ? error.message : 'An unexpected error occurred'}
          </p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              Retry
            </button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Empty module state component
 */
interface ModuleEmptyStateProps {
  type: ModuleType;
  message?: string;
}

export function ModuleEmptyState({ type, message }: ModuleEmptyStateProps) {
  const defaultMessages: Record<ModuleType, string> = {
    graph: 'Add nodes with numeric data to visualize them in a chart',
    table: 'Add nodes to display them in a table',
    calendar: 'Add nodes with date fields to display events on the calendar',
    text: 'Add text nodes to display content here',
    kanban: 'Add nodes with status fields to organize them in columns',
    canvas: 'Add nodes to this canvas to visualize them',
    list: 'Add nodes to display them in a list',
    grid: 'Add nodes to display them in a grid',
  };

  return (
    <Card className="h-full">
      <CardContent className="flex items-center justify-center h-full">
        <div className="text-center text-muted-foreground">
          <p className="text-lg font-medium">No Data Available</p>
          <p className="text-sm mt-2">{message || defaultMessages[type]}</p>
        </div>
      </CardContent>
    </Card>
  );
}
