import { create } from 'zustand';
import type { Module, ModuleLayout } from '@/types';

interface ModuleStore {
  // State
  modules: Module[];
  activeZoneId: string | null;
  selectedModuleId: string | null;

  // Actions
  setModules: (modules: Module[]) => void;
  addModule: (module: Module) => void;
  updateModule: (id: string, updates: Partial<Module>) => void;
  removeModule: (id: string) => void;
  setActiveZoneId: (zoneId: string | null) => void;
  setSelectedModuleId: (moduleId: string | null) => void;

  // Layout actions
  updateModuleLayout: (id: string, layout: { positionX: number; positionY: number; width: number; height: number }) => void;
  updateMultipleLayouts: (layouts: ModuleLayout[]) => void;

  // Computed
  getModulesByZone: (zoneId: string) => Module[];
  getModuleById: (id: string) => Module | undefined;
}

export const useModuleStore = create<ModuleStore>((set, get) => ({
  // Initial state
  modules: [],
  activeZoneId: null,
  selectedModuleId: null,

  // Actions
  setModules: (modules) => set({ modules }),

  addModule: (module) =>
    set((state) => ({
      modules: [...state.modules, module],
    })),

  updateModule: (id, updates) =>
    set((state) => ({
      modules: state.modules.map((module) =>
        module.id === id ? { ...module, ...updates } : module
      ),
    })),

  removeModule: (id) =>
    set((state) => ({
      modules: state.modules.filter((module) => module.id !== id),
      selectedModuleId: state.selectedModuleId === id ? null : state.selectedModuleId,
    })),

  setActiveZoneId: (zoneId) => set({ activeZoneId: zoneId }),

  setSelectedModuleId: (moduleId) => set({ selectedModuleId: moduleId }),

  // Layout actions
  updateModuleLayout: (id, layout) =>
    set((state) => ({
      modules: state.modules.map((module) =>
        module.id === id
          ? {
              ...module,
              positionX: layout.positionX,
              positionY: layout.positionY,
              width: layout.width,
              height: layout.height,
            }
          : module
      ),
    })),

  updateMultipleLayouts: (layouts) =>
    set((state) => {
      const layoutMap = new Map(layouts.map((l) => [l.i, l]));
      return {
        modules: state.modules.map((module) => {
          const layout = layoutMap.get(module.id);
          if (layout) {
            return {
              ...module,
              positionX: layout.x,
              positionY: layout.y,
              width: layout.w,
              height: layout.h,
            };
          }
          return module;
        }),
      };
    }),

  // Computed
  getModulesByZone: (zoneId) => {
    const state = get();
    return state.modules.filter((module) => module.zoneId === zoneId);
  },

  getModuleById: (id) => {
    const state = get();
    return state.modules.find((module) => module.id === id);
  },
}));
