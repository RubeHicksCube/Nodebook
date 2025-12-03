# How to Create Test Zones for Feature Prototyping

This guide explains how to populate your Nodebook instance with 60+ test zones for prototyping features from `featureCreep.md`.

## Quick Start

### Step 1: Get Your User ID

First, you need to find your user ID from the database:

```bash
# Option A: Using docker-compose exec
docker-compose exec server pnpm exec drizzle-kit studio

# Option B: Direct database query
docker-compose exec db psql -U nodebook -d nodebook -c "SELECT id, email FROM users;"
```

Copy your user UUID (it looks like: `550e8400-e29b-41d4-a716-446655440000`)

### Step 2: Run the Seed Script

```bash
# From the project root
cd server

# Run the seed script with your user ID
npx tsx src/db/seed-test-zones.ts YOUR_USER_ID_HERE

# Example:
npx tsx src/db/seed-test-zones.ts 550e8400-e29b-41d4-a716-446655440000
```

### Step 3: Refresh Your Browser

After running the script, refresh your Nodebook dashboard. You should see 60+ new test zones in your sidebar!

## What Gets Created

The script creates **63 test zones** organized by feature category:

### Node Management (9 zones)
- 🔗 Knowledge Graph - Backlinks testing
- 🕸️ Graph Visualization - Network view
- 📋 Node Templates - Pre-built templates
- 🧭 Navigation Testing - Breadcrumbs
- ⏱️ Version History - Node versioning
- 🗂️ Smart Folders - Dynamic filters
- ⚡ Bulk Operations - Multi-edit
- 🏷️ Node Aliases - Alternative names
- 🔒 Protected Nodes - Read-only nodes

### Module Visualizations (10 zones)
- 📊 Timeline View - Gantt charts
- 🧠 Mind Map - Interactive mapping
- 🖼️ Image Gallery - Photo grids
- 🔥 Heatmap Analytics - Activity viz
- 📈 Pivot Tables - Data analysis
- 🗺️ Location Map - Geospatial
- 📊 Dashboard Metrics - KPIs
- 📊 Spreadsheet Grid - Excel-like
- 🎨 Whiteboard - Drawing canvas
- ✅ Habit Tracker - Streaks

### Collaboration (6 zones)
- 👥 Collaboration Hub - Real-time
- 💬 Comments & Reviews - Inline comments
- 🔗 Share & Export - Public links
- 🌐 Public Pages - Website mode
- 📡 Activity Feed - Change notifications
- 👨‍👩‍👧‍👦 Team Workspaces - Multi-user

### Productivity (10 zones)
- 🔗 Inline Linking - [[Wiki links]]
- ☑️ Task Management - To-dos
- / Slash Commands - Quick actions
- ⌨️ Keyboard Shortcuts - Hotkeys
- 💾 Auto-Save - Draft saving
- 🔄 Recurring Items - Repeating tasks
- 📥 Inbox/Capture - Quick notes
- 🎯 Focus Mode - Distraction-free
- ↩️ Undo History - Multi-level undo
- 🎨 Themes Demo - Custom themes

### UI/UX (4 zones)
- 👋 Onboarding - New user tutorial
- 🔍 Advanced Filters - Complex queries
- 📎 File Uploads - Attachments
- 🎨 Custom CSS - Style customization

### Data Management (7 zones)
- 📥 Import Center - Data import
- 📤 Export Hub - Export formats
- 💾 Backup & Restore - Backups
- 📊 Analytics Dashboard - Usage stats
- 🗑️ Trash Bin - Soft delete
- 🔍 Duplicate Detection - Find dupes
- 🧪 Prototype Lab - Experiments

### Search & Discovery (5 zones)
- 🔎 Full-Text Search - Advanced search
- 📌 Saved Searches - Query bookmarks
- 🏷️ Tag Cloud - Tag visualization
- 🔗 Related Nodes - Suggestions
- 🎲 Random Discovery - Serendipity

### Export & Integration (5 zones)
- 🔌 API Testing - REST playground
- 📡 Webhooks - Event notifications
- ⚡ Zapier Integration - Automation
- 🧩 Browser Extension - Web clipper
- 📧 Email to Node - Email capture

### Mobile (2 zones)
- 📱 Mobile Demo - Mobile UX
- 🎤 Voice Input - Speech-to-text

### Advanced Features (5 zones)
- 🧩 Plugin System - Extensions
- 🤖 AI Features - LLM integration
- 🏷️ Auto-tagging - Smart tags
- 🔐 Encrypted Nodes - E2E encryption
- 🧪 Prototype Lab - Experimental

## How to Use Test Zones

1. **Reference the Feature Report**: Open `featureCreep.md` and find features you want to explore
2. **Navigate to Test Zone**: Each feature lists a test zone (e.g., "ZONE-KNOWLEDGE-001")
3. **Create Prototype Modules**: Add modules to the zone to test the feature concept
4. **Add Sample Nodes**: Create nodes with content relevant to that feature
5. **Iterate and Refine**: Test, adjust, and document what works

## Example Workflow

Let's say you want to implement backlinks:

1. Open `featureCreep.md` → Section 1.1 "Bidirectional Linking"
2. Navigate to **Knowledge Graph** zone (ZONE-KNOWLEDGE-001)
3. Create sample nodes with [[references]] to each other
4. Prototype the backlinks panel UI
5. Test navigation between linked nodes
6. Document requirements and edge cases

## Cleanup

To remove all test zones (if needed):

```bash
docker-compose exec server pnpm exec drizzle-kit studio
```

Or via SQL:

```sql
DELETE FROM zones WHERE reference_id LIKE 'ZONE-%';
```

## Tips

- **Start Small**: Pick 2-3 high-priority features to prototype first
- **Use Existing Modules**: Many features can be tested with existing module types
- **Document Findings**: Add notes in each zone about what works/doesn't work
- **Share Feedback**: Use the zones to demo features to stakeholders
- **Iterate**: Test zones are throwaway - don't worry about making mistakes

## Next Steps

After creating test zones:

1. ✅ Review `featureCreep.md` for feature details
2. ✅ Prioritize which features to implement
3. ✅ Create prototype modules in relevant zones
4. ✅ Test and gather feedback
5. ✅ Begin implementation of chosen features

Happy prototyping! 🚀
