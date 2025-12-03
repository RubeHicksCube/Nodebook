import React from 'react';
import {
  MoreVertical,
  Edit,
  Trash2,
  Copy,
  Move,
  Settings,
  BarChart3,
  Table2,
  Calendar,
  List,
  Grid3x3,
  Type,
  Layout,
} from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Module, ModuleType } from '@/types';
import { cn } from '@/lib/utils';

interface ModuleCardProps {
  module: Module;
  onEdit?: (module: Module) => void;
  onDelete?: (module: Module) => void;
  onDuplicate?: (module: Module) => void;
  onMove?: (module: Module) => void;
  onSettings?: (module: Module) => void;
  children?: React.ReactNode;
  className?: string;
}

const MODULE_TYPE_ICONS: Record<ModuleType, React.ComponentType<{ className?: string }>> = {
  graph: BarChart3,
  table: Table2,
  calendar: Calendar,
  text: Type,
  kanban: Layout,
  list: List,
  grid: Grid3x3,
};

const MODULE_TYPE_LABELS: Record<ModuleType, string> = {
  graph: 'Graph',
  table: 'Table',
  calendar: 'Calendar',
  text: 'Text',
  kanban: 'Kanban',
  list: 'List',
  grid: 'Grid',
};

export default function ModuleCard({
  module,
  onEdit,
  onDelete,
  onDuplicate,
  onMove,
  onSettings,
  children,
  className,
}: ModuleCardProps) {
  const Icon = MODULE_TYPE_ICONS[module.type] || Layout;
  const typeLabel = MODULE_TYPE_LABELS[module.type] || module.type;

  return (
    <Card className={cn('flex flex-col h-full', className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
          <CardTitle className="text-sm font-medium truncate">{module.name}</CardTitle>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="h-8 w-8 p-0 hover:bg-accent rounded-md flex items-center justify-center shrink-0">
              <span className="sr-only">Open menu</span>
              <MoreVertical className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {onEdit && (
              <DropdownMenuItem onClick={() => onEdit(module)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
            )}
            {onSettings && (
              <DropdownMenuItem onClick={() => onSettings(module)}>
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
            )}
            {onDuplicate && (
              <DropdownMenuItem onClick={() => onDuplicate(module)}>
                <Copy className="mr-2 h-4 w-4" />
                Duplicate
              </DropdownMenuItem>
            )}
            {onMove && (
              <DropdownMenuItem onClick={() => onMove(module)}>
                <Move className="mr-2 h-4 w-4" />
                Move to zone
              </DropdownMenuItem>
            )}
            {onDelete && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onDelete(module)} className="text-destructive">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent className="flex-1 overflow-auto">
        {children || (
          <div className="h-full flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <Icon className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">{typeLabel} Module</p>
            </div>
          </div>
        )}
      </CardContent>
      {module.config?.filters && (
        <CardFooter className="text-xs text-muted-foreground border-t pt-2">
          {module.config.filters.nodeTypes && (
            <span>Types: {module.config.filters.nodeTypes.join(', ')}</span>
          )}
          {module.config.filters.tags && module.config.filters.tags.length > 0 && (
            <span className="ml-2">Tags: {module.config.filters.tags.length}</span>
          )}
        </CardFooter>
      )}
    </Card>
  );
}
