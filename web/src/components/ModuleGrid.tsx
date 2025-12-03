import { useCallback, useEffect, useMemo } from 'react';
import { Responsive, WidthProvider, Layout } from 'react-grid-layout';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import ModuleCard from '@/components/ModuleCard';
import { modulesApi } from '@/api';
import { useModuleStore } from '@/stores/moduleStore';
import type { Module, ModuleLayout } from '@/types';
import { cn } from '@/lib/utils';
import 'react-grid-layout/css/styles.css';
import { ModuleRenderer } from './modules';

const ResponsiveGridLayout = WidthProvider(Responsive);

interface ModuleGridProps {
  zoneId: string;
  onCreateModule?: () => void;
  onEditModule?: (module: Module) => void;
  onDeleteModule?: (module: Module) => void;
  onDuplicateModule?: (module: Module) => void;
  onMoveModule?: (module: Module) => void;
  onSettingsModule?: (module: Module) => void;
  className?: string;
}

const GRID_CONFIG = {
  breakpoints: { lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 },
  cols: { lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 },
  rowHeight: 60,
  margin: [16, 16] as [number, number],
  containerPadding: { lg: [16, 16], md: [16, 16], sm: [10, 10], xs: [8, 8], xxs: [8, 8] },
};

export function ModuleGrid({
  zoneId,
  onCreateModule,
  onEditModule,
  onDeleteModule,
  onDuplicateModule,
  onMoveModule,
  onSettingsModule,
  className,
}: ModuleGridProps) {
  const queryClient = useQueryClient();
  const { modules, setModules, updateMultipleLayouts } = useModuleStore();

  const { data: fetchedModules, isLoading } = useQuery({
    queryKey: ['modules', zoneId],
    queryFn: () => modulesApi.list(zoneId),
    enabled: !!zoneId,
  });

  useEffect(() => {
    if (fetchedModules) {
      setModules(fetchedModules);
    }
  }, [fetchedModules, setModules]);

  const updateLayoutMutation = useMutation({
    mutationFn: (layouts: ModuleLayout[]) => modulesApi.updateLayout(zoneId, { layouts }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modules', zoneId] });
    },
  });

  const deleteModuleMutation = useMutation({
    mutationFn: (moduleId: string) => modulesApi.delete(moduleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modules', zoneId] });
    },
  });
  
  const layouts = useMemo(() => {
    const lg = modules
      .filter((m) => m.zoneId === zoneId)
      .map((module) => ({
        i: module.id,
        x: module.positionX,
        y: module.positionY,
        w: module.width,
        h: module.height,
        minW: 2,
        minH: 2,
      }));
    return { lg };
  }, [modules, zoneId]);
  
  const handleLayoutChange = useCallback(
    (newLayout: Layout[], allLayouts: any) => {
      const moduleLayouts: ModuleLayout[] = newLayout.map((item) => ({
        i: item.i,
        x: item.x,
        y: item.y,
        w: item.w,
        h: item.h,
      }));
      updateMultipleLayouts(moduleLayouts);
    },
    [updateMultipleLayouts]
  );
  
  const handleStop = useCallback(
    (newLayout: Layout[]) => {
      const moduleLayouts: ModuleLayout[] = newLayout.map((item) => ({
        i: item.i,
        x: item.x,
        y: item.y,
        w: item.w,
        h: item.h,
      }));
      updateLayoutMutation.mutate(moduleLayouts);
    },
    [updateLayoutMutation]
  );

  const handleDelete = useCallback(
    (module: Module) => {
      if (onDeleteModule) {
        onDeleteModule(module);
      } else {
        if (window.confirm(`Are you sure you want to delete "${module.name}"?`)) {
          deleteModuleMutation.mutate(module.id);
        }
      }
    },
    [onDeleteModule, deleteModuleMutation]
  );

  const zoneModules = useMemo(
    () => modules.filter((m) => m.zoneId === zoneId),
    [modules, zoneId]
  );

  if (isLoading) {
    return (
      <div className={cn('flex items-center justify-center h-full', className)}>
        <div className="text-muted-foreground">Loading modules...</div>
      </div>
    );
  }

  if (zoneModules.length === 0) {
    return (
      <div className={cn('flex items-center justify-center h-full', className)}>
        <div className="text-center">
          <p className="text-muted-foreground mb-4">No modules in this zone</p>
          {onCreateModule && (
            <button
              onClick={onCreateModule}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" />
              Create Module
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={cn('w-full h-full', className)}>
      <ResponsiveGridLayout
        className="layout"
        layouts={layouts}
        breakpoints={GRID_CONFIG.breakpoints}
        cols={GRID_CONFIG.cols}
        rowHeight={GRID_CONFIG.rowHeight}
        margin={GRID_CONFIG.margin}
        containerPadding={GRID_CONFIG.containerPadding}
        onLayoutChange={handleLayoutChange}
        onDragStop={handleStop}
        onResizeStop={handleStop}
        isDraggable={true}
        isResizable={true}
        draggableHandle=".drag-handle"
      >
        {zoneModules.map((module) => (
          <div key={module.id} className="module-grid-item">
            <ModuleCard
              module={module}
              onEdit={onEditModule}
              onDelete={handleDelete}
              onDuplicate={onDuplicateModule}
              onMove={onMoveModule}
              onSettings={onSettingsModule}
              className="h-full"
            >
              <ModuleRenderer module={module} />
            </ModuleCard>
          </div>
        ))}
      </ResponsiveGridLayout>
    </div>
  );
}

export default ModuleGrid;
