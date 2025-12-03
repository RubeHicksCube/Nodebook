import { db } from '../services/db';
import { zones } from './schema';

/**
 * Seed script to create test zones for feature prototyping
 *
 * Run with: npx tsx src/db/seed-test-zones.ts <userId>
 */

const testZones = [
  { name: 'Knowledge Graph', referenceId: 'ZONE-KNOWLEDGE-001', description: 'Test backlinks and bidirectional linking', icon: '🔗', color: '#3b82f6' },
  { name: 'Graph Visualization', referenceId: 'ZONE-GRAPH-VIZ-001', description: 'Network graph view testing', icon: '🕸️', color: '#8b5cf6' },
  { name: 'Node Templates', referenceId: 'ZONE-TEMPLATES-001', description: 'Test pre-built node templates', icon: '📋', color: '#06b6d4' },
  { name: 'Navigation Testing', referenceId: 'ZONE-NAV-001', description: 'Breadcrumbs and navigation features', icon: '🧭', color: '#10b981' },
  { name: 'Version History', referenceId: 'ZONE-VERSIONING-001', description: 'Node versioning and rollback', icon: '⏱️', color: '#f59e0b' },
  { name: 'Smart Folders', referenceId: 'ZONE-SMART-FOLDERS-001', description: 'Dynamic folder filtering', icon: '🗂️', color: '#ec4899' },
  { name: 'Bulk Operations', referenceId: 'ZONE-BULK-OPS-001', description: 'Multi-node editing testing', icon: '⚡', color: '#6366f1' },
  { name: 'Node Aliases', referenceId: 'ZONE-ALIASES-001', description: 'Alternative node names', icon: '🏷️', color: '#14b8a6' },
  { name: 'Protected Nodes', referenceId: 'ZONE-PROTECTION-001', description: 'Read-only and locked nodes', icon: '🔒', color: '#ef4444' },
  { name: 'Timeline View', referenceId: 'ZONE-TIMELINE-001', description: 'Gantt and timeline visualization', icon: '📊', color: '#0ea5e9' },
  { name: 'Mind Map', referenceId: 'ZONE-MINDMAP-001', description: 'Interactive mind mapping', icon: '🧠', color: '#a855f7' },
  { name: 'Image Gallery', referenceId: 'ZONE-GALLERY-001', description: 'Photo grid with lightbox', icon: '🖼️', color: '#f97316' },
  { name: 'Heatmap Analytics', referenceId: 'ZONE-HEATMAP-001', description: 'Activity heatmap visualization', icon: '🔥', color: '#dc2626' },
  { name: 'Pivot Tables', referenceId: 'ZONE-PIVOT-001', description: 'Advanced data analysis', icon: '📈', color: '#84cc16' },
  { name: 'Location Map', referenceId: 'ZONE-MAP-001', description: 'Geospatial node mapping', icon: '🗺️', color: '#22c55e' },
  { name: 'Dashboard Metrics', referenceId: 'ZONE-METRICS-001', description: 'KPI and metrics tracking', icon: '📊', color: '#eab308' },
  { name: 'Spreadsheet Grid', referenceId: 'ZONE-SPREADSHEET-001', description: 'Excel-like editing', icon: '📊', color: '#06b6d4' },
  { name: 'Whiteboard', referenceId: 'ZONE-WHITEBOARD-001', description: 'Freeform drawing canvas', icon: '🎨', color: '#8b5cf6' },
  { name: 'Habit Tracker', referenceId: 'ZONE-HABITS-001', description: 'Streak tracking', icon: '✅', color: '#10b981' },
  { name: 'Collaboration Hub', referenceId: 'ZONE-COLLAB-001', description: 'Real-time editing testing', icon: '👥', color: '#3b82f6' },
  { name: 'Comments & Reviews', referenceId: 'ZONE-COMMENTS-001', description: 'Inline commenting', icon: '💬', color: '#f59e0b' },
  { name: 'Share & Export', referenceId: 'ZONE-SHARING-001', description: 'Public sharing links', icon: '🔗', color: '#ec4899' },
  { name: 'Public Pages', referenceId: 'ZONE-PUBLIC-001', description: 'Public website testing', icon: '🌐', color: '#6366f1' },
  { name: 'Activity Feed', referenceId: 'ZONE-ACTIVITY-001', description: 'Change notifications', icon: '📡', color: '#14b8a6' },
  { name: 'Team Workspaces', referenceId: 'ZONE-TEAMS-001', description: 'Multi-user collaboration', icon: '👨‍👩‍👧‍👦', color: '#ef4444' },
  { name: 'Inline Linking', referenceId: 'ZONE-LINKING-001', description: 'Wiki-style [[links]]', icon: '🔗', color: '#0ea5e9' },
  { name: 'Task Management', referenceId: 'ZONE-TASKS-001', description: 'To-do and checkbox nodes', icon: '☑️', color: '#a855f7' },
  { name: 'Slash Commands', referenceId: 'ZONE-SLASH-001', description: 'Quick node creation', icon: '/', color: '#f97316' },
  { name: 'Keyboard Shortcuts', referenceId: 'ZONE-KEYBOARD-001', description: 'Shortcut testing zone', icon: '⌨️', color: '#dc2626' },
  { name: 'Auto-Save', referenceId: 'ZONE-AUTOSAVE-001', description: 'Draft saving testing', icon: '💾', color: '#84cc16' },
  { name: 'Recurring Items', referenceId: 'ZONE-RECURRING-001', description: 'Repeating tasks/events', icon: '🔄', color: '#22c55e' },
  { name: 'Inbox/Capture', referenceId: 'ZONE-INBOX-001', description: 'Quick capture zone', icon: '📥', color: '#eab308' },
  { name: 'Focus Mode', referenceId: 'ZONE-FOCUS-001', description: 'Distraction-free editing', icon: '🎯', color: '#06b6d4' },
  { name: 'Undo History', referenceId: 'ZONE-UNDO-001', description: 'Multi-level undo', icon: '↩️', color: '#8b5cf6' },
  { name: 'Themes Demo', referenceId: 'ZONE-THEMES-001', description: 'Custom theme testing', icon: '🎨', color: '#10b981' },
  { name: 'Onboarding', referenceId: 'ZONE-ONBOARDING-001', description: 'New user tutorial', icon: '👋', color: '#3b82f6' },
  { name: 'Advanced Filters', referenceId: 'ZONE-FILTERS-001', description: 'Complex query testing', icon: '🔍', color: '#f59e0b' },
  { name: 'Import Center', referenceId: 'ZONE-IMPORT-001', description: 'Data import testing', icon: '📥', color: '#ec4899' },
  { name: 'Export Hub', referenceId: 'ZONE-EXPORT-001', description: 'Export format testing', icon: '📤', color: '#6366f1' },
  { name: 'Backup & Restore', referenceId: 'ZONE-BACKUP-001', description: 'Backup functionality', icon: '💾', color: '#14b8a6' },
  { name: 'Analytics Dashboard', referenceId: 'ZONE-ANALYTICS-001', description: 'Usage analytics', icon: '📊', color: '#ef4444' },
  { name: 'Trash Bin', referenceId: 'ZONE-TRASH-001', description: 'Soft delete recovery', icon: '🗑️', color: '#0ea5e9' },
  { name: 'Duplicate Detection', referenceId: 'ZONE-DEDUP-001', description: 'Find duplicate nodes', icon: '🔍', color: '#a855f7' },
  { name: 'Full-Text Search', referenceId: 'ZONE-SEARCH-001', description: 'Advanced search testing', icon: '🔎', color: '#f97316' },
  { name: 'Saved Searches', referenceId: 'ZONE-SAVEDSEARCH-001', description: 'Query bookmarks', icon: '📌', color: '#dc2626' },
  { name: 'Tag Cloud', referenceId: 'ZONE-TAGS-CLOUD-001', description: 'Tag visualization', icon: '🏷️', color: '#84cc16' },
  { name: 'Related Nodes', referenceId: 'ZONE-RELATED-001', description: 'Similarity suggestions', icon: '🔗', color: '#22c55e' },
  { name: 'Random Discovery', referenceId: 'ZONE-RANDOM-001', description: 'Serendipity feature', icon: '🎲', color: '#eab308' },
  { name: 'API Testing', referenceId: 'ZONE-API-001', description: 'REST API playground', icon: '🔌', color: '#06b6d4' },
  { name: 'Webhooks', referenceId: 'ZONE-WEBHOOKS-001', description: 'Event notifications', icon: '📡', color: '#8b5cf6' },
  { name: 'Zapier Integration', referenceId: 'ZONE-ZAPIER-001', description: 'Automation testing', icon: '⚡', color: '#10b981' },
  { name: 'Browser Extension', referenceId: 'ZONE-EXTENSION-001', description: 'Web clipper testing', icon: '🧩', color: '#3b82f6' },
  { name: 'Email to Node', referenceId: 'ZONE-EMAIL-001', description: 'Email capture', icon: '📧', color: '#f59e0b' },
  { name: 'Mobile Demo', referenceId: 'ZONE-MOBILE-DEMO-001', description: 'Mobile UX testing', icon: '📱', color: '#ec4899' },
  { name: 'Voice Input', referenceId: 'ZONE-VOICE-001', description: 'Speech-to-text', icon: '🎤', color: '#6366f1' },
  { name: 'File Uploads', referenceId: 'ZONE-UPLOADS-001', description: 'Attachment testing', icon: '📎', color: '#14b8a6' },
  { name: 'Custom CSS', referenceId: 'ZONE-CUSTOM-CSS-001', description: 'Style customization', icon: '🎨', color: '#ef4444' },
  { name: 'Plugin System', referenceId: 'ZONE-PLUGINS-001', description: 'Extension development', icon: '🧩', color: '#0ea5e9' },
  { name: 'AI Features', referenceId: 'ZONE-AI-001', description: 'LLM integration testing', icon: '🤖', color: '#a855f7' },
  { name: 'Auto-tagging', referenceId: 'ZONE-TAG-AI-001', description: 'Smart tag suggestions', icon: '🏷️', color: '#f97316' },
  { name: 'Encrypted Nodes', referenceId: 'ZONE-ENCRYPTED-001', description: 'E2E encryption testing', icon: '🔐', color: '#dc2626' },
  { name: 'Prototype Lab', referenceId: 'ZONE-PROTOTYPE-001', description: 'Experimental features', icon: '🧪', color: '#84cc16' },
];

async function seedTestZones(userId: string) {
  try {
    console.log(`Creating ${testZones.length} test zones for user ${userId}...`);

    let position = 100; // Start at position 100 to avoid conflicts with existing zones

    for (const zone of testZones) {
      const [created] = await db
        .insert(zones)
        .values({
          userId,
          name: zone.name,
          referenceId: zone.referenceId,
          color: zone.color,
          icon: zone.icon,
          position: position++,
          isDefault: false,
        })
        .returning();

      console.log(`✓ Created zone: ${zone.name} (${zone.referenceId})`);
    }

    console.log(`\n✅ Successfully created ${testZones.length} test zones!`);
    console.log('\nThese zones are ready for prototyping features from featureCreep.md');
    console.log('Each zone corresponds to a specific feature category for testing.\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding test zones:', error);
    process.exit(1);
  }
}

// Get userId from command line args
const userId = process.argv[2];

if (!userId) {
  console.error('❌ Error: Please provide a userId');
  console.log('Usage: npx tsx src/db/seed-test-zones.ts <userId>');
  console.log('Example: npx tsx src/db/seed-test-zones.ts 550e8400-e29b-41d4-a716-446655440000');
  process.exit(1);
}

seedTestZones(userId);
