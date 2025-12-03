import { create } from 'zustand';
import type { Zone } from '@/types';

interface ZoneState {
  zones: Zone[];
  activeZoneId: string | null;
  isLoading: boolean;

  // Actions
  setZones: (zones: Zone[]) => void;
  setActiveZone: (zoneId: string | null) => void;
  addZone: (zone: Zone) => void;
  updateZone: (id: string, updates: Partial<Zone>) => void;
  removeZone: (id: string) => void;
  reorderZones: (zones: Zone[]) => void;
  setLoading: (loading: boolean) => void;
}

export const useZoneStore = create<ZoneState>((set) => ({
  zones: [],
  activeZoneId: null,
  isLoading: false,

  setZones: (zones) => set((state) => {
    // Auto-select Index zone or first zone if no zone is selected
    let newActiveZoneId = state.activeZoneId;
    if (!newActiveZoneId && zones.length > 0) {
      // Prefer Index zone
      const indexZone = zones.find(z => z.name === 'Index' || z.referenceId === 'INDEX-001');
      newActiveZoneId = indexZone ? indexZone.id : zones[0].id;
    }
    return { zones, activeZoneId: newActiveZoneId };
  }),

  setActiveZone: (zoneId) => set({ activeZoneId: zoneId }),

  addZone: (zone) =>
    set((state) => ({
      zones: [...state.zones, zone].sort((a, b) => a.position - b.position),
    })),

  updateZone: (id, updates) =>
    set((state) => ({
      zones: state.zones.map((zone) =>
        zone.id === id ? { ...zone, ...updates } : zone
      ),
    })),

  removeZone: (id) =>
    set((state) => ({
      zones: state.zones.filter((zone) => zone.id !== id),
      activeZoneId: state.activeZoneId === id ? null : state.activeZoneId,
    })),

  reorderZones: (zones) => set({ zones }),

  setLoading: (loading) => set({ isLoading: loading }),
}));
