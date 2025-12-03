/**
 * Example usage of ModuleGrid component
 *
 * This file demonstrates how to integrate ModuleGrid into a page.
 * You can copy this pattern to your actual dashboard/workspace page.
 */

import { useState } from 'react';
import ModuleGrid from '@/components/ModuleGrid';
import type { Module } from '@/types';

export default function ModuleGridExample() {
  const [activeZoneId] = useState<string>('zone-1');

  const handleCreateModule = () => {
    console.log('Create new module in zone:', activeZoneId);
    // TODO: Open create module dialog
  };

  const handleEditModule = (module: Module) => {
    console.log('Edit module:', module);
    // TODO: Open edit module dialog
  };

  const handleDeleteModule = (module: Module) => {
    console.log('Delete module:', module);
    // TODO: Implement delete confirmation and API call
  };

  const handleDuplicateModule = (module: Module) => {
    console.log('Duplicate module:', module);
    // TODO: Implement duplicate logic
  };

  const handleMoveModule = (module: Module) => {
    console.log('Move module to another zone:', module);
    // TODO: Open zone selection dialog
  };

  const handleSettingsModule = (module: Module) => {
    console.log('Open module settings:', module);
    // TODO: Open settings dialog
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Header with zone selector */}
      <div className="border-b p-4">
        <h1 className="text-2xl font-bold">Module Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Active Zone: {activeZoneId}
        </p>
      </div>

      {/* Module Grid */}
      <div className="flex-1 overflow-auto">
        <ModuleGrid
          zoneId={activeZoneId}
          onCreateModule={handleCreateModule}
          onEditModule={handleEditModule}
          onDeleteModule={handleDeleteModule}
          onDuplicateModule={handleDuplicateModule}
          onMoveModule={handleMoveModule}
          onSettingsModule={handleSettingsModule}
        />
      </div>
    </div>
  );
}
