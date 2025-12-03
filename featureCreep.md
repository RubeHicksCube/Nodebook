# Nodebook Feature Suggestions Report
**Generated:** 2025-12-02
**Purpose:** Comprehensive feature enhancement roadmap for Nodebook

---

## Table of Contents
1. [Node Management & Navigation](#1-node-management--navigation)
2. [Module Visualizations](#2-module-visualizations)
3. [Collaboration & Sharing](#3-collaboration--sharing)
4. [Productivity & Workflow](#4-productivity--workflow)
5. [UI/UX Enhancements](#5-uiux-enhancements)
6. [Data Management & Analysis](#6-data-management--analysis)
7. [Search & Discovery](#7-search--discovery)
8. [Export & Integration](#8-export--integration)
9. [Mobile Experience](#9-mobile-experience)
10. [Advanced Features](#10-advanced-features)

---

## 1. Node Management & Navigation

### 1.1 Bidirectional Linking (Backlinks)
**Priority:** Must-Have
**Complexity:** Medium

**Description:**
Automatically track and display all nodes that reference the current node. When you reference a node using `[[node-name]]` syntax, both the source and target nodes should be aware of the connection.

**Benefits:**
- Discover unexpected connections between ideas
- Navigate your knowledge graph bidirectionally
- Understand the context and importance of a node by seeing what references it
- Essential for building a true "second brain"

**Implementation Details:**
- Display backlinks panel on node editor page
- Update `node_references` table on node save/edit
- API endpoint: `GET /api/nodes/:id/backlinks`
- Real-time updates when references are created/deleted
- Click backlink to jump to referencing node

**UI Location:**
- Right sidebar panel in Node Editor
- Collapsible "Backlinks" section showing count
- List of referencing nodes with preview snippets

**Test Zone:** "ZONE-KNOWLEDGE-001"

**Dependencies:**
- Node reference parsing in content
- Database queries for backlinks
- Real-time sync infrastructure

---

### 1.2 Graph View Visualization
**Priority:** Should-Have
**Complexity:** High

**Description:**
Interactive network graph showing nodes as vertices and references/relationships as edges. Visualize the entire knowledge structure or focus on a specific node's neighborhood.

**Benefits:**
- Understand the overall structure of your knowledge base
- Identify isolated nodes (orphans) that need connection
- Discover clusters of related information
- Visual exploration is more intuitive than hierarchical navigation
- Find "hub" nodes that connect many concepts

**Implementation Details:**
- Use D3.js, Cytoscape.js, or React Flow for graph rendering
- Force-directed layout with configurable physics
- Node size based on number of connections or content size
- Color coding by node type or tags
- Zoom, pan, and filter controls
- Click node to navigate or show preview
- "Focus mode" to show only nodes within N hops

**Module Type:** New `graph-network` module type

**UI Controls:**
- Zoom slider
- Layout algorithm selector (force, hierarchical, circular)
- Filter by node type, tags, date range
- Search highlighting
- Mini-map for navigation

**Test Zone:** "ZONE-GRAPH-VIZ-001"

**Dependencies:**
- Graph data structure API endpoint
- Performance optimization for 1000+ nodes
- WebGL rendering for large graphs

---

### 1.3 Node Templates
**Priority:** Should-Have
**Complexity:** Medium

**Description:**
Pre-defined node structures for common use cases. Quick-start nodes with preset content structure, child nodes, and metadata.

**Benefits:**
- Consistency across similar nodes
- Faster content creation
- Enforce best practices and structure
- Reduce decision fatigue

**Example Templates:**
- Meeting Notes (Date, Attendees, Agenda, Action Items)
- Book Review (Title, Author, Rating, Summary, Key Takeaways, Quotes)
- Project (Overview, Goals, Milestones, Resources, Status)
- Daily Journal (Date, Mood, Events, Gratitude, Tomorrow's Goals)
- Bug Report (Title, Steps to Reproduce, Expected, Actual, Priority)
- Recipe (Ingredients, Instructions, Prep Time, Cook Time, Servings)

**Implementation Details:**
- Templates stored as JSON in database or config
- Template manager UI for creating/editing templates
- "New from Template" command in command palette
- Templates create node + child nodes in one operation
- Variable substitution (e.g., `{{date}}`, `{{user_name}}`)
- Community template sharing (future enhancement)

**Storage:**
```typescript
interface NodeTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  nodeType: NodeType;
  defaultContent: Record<string, any>;
  childrenTemplates?: NodeTemplate[];
  metadata?: Record<string, any>;
}
```

**Test Zone:** "ZONE-TEMPLATES-001"

**Dependencies:**
- Template storage system
- Template editor UI
- Recursive node creation API

---

### 1.4 Quick Node Switcher
**Priority:** Should-Have
**Complexity:** Low

**Description:**
Fuzzy-search modal to instantly jump to any node. Similar to VSCode's Cmd+P file switcher.

**Benefits:**
- Navigate without touching mouse
- Fast access to any node regardless of hierarchy
- Search by name, tags, or content snippets
- Recent/frequently accessed nodes at top

**Implementation Details:**
- Modal triggered by `Ctrl+P` or `Ctrl+Shift+P`
- Fuzzy search algorithm (fuse.js)
- Show recent nodes by default
- Display node type icon, name, path breadcrumb
- Highlight search matches
- Arrow keys to navigate, Enter to open
- ESC to close

**UI Components:**
- Reuse Command Palette UI pattern
- 300-500px wide modal centered on screen
- Max 8-10 results visible with scroll

**Test Zone:** "ZONE-NAV-001"

**Dependencies:**
- Node search index
- Keyboard shortcut system
- Recent nodes tracking

---

### 1.5 Node Version History
**Priority:** Nice-to-Have
**Complexity:** High

**Description:**
Track all changes to node content with ability to view, compare, and restore previous versions. Essential for preventing accidental data loss.

**Benefits:**
- Never lose work due to accidental deletion or overwrite
- Review how ideas evolved over time
- Compare different versions side-by-side
- Restore previous versions with one click
- Audit trail for collaborative work

**Implementation Details:**
- Store snapshots on every save (or debounced saves)
- New table: `node_versions` with content snapshot, timestamp, user
- Version list UI showing timestamps and change summaries
- Diff viewer showing additions/deletions
- "Restore this version" action
- Optional: Automatic pruning of old versions to save space

**Storage:**
```sql
CREATE TABLE node_versions (
  id UUID PRIMARY KEY,
  node_id UUID REFERENCES nodes(id) ON DELETE CASCADE,
  version_number INTEGER,
  content JSONB,
  metadata JSONB,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP,
  change_summary TEXT
);
```

**Test Zone:** "ZONE-VERSIONING-001"

**Dependencies:**
- Background job for version cleanup
- Efficient diff algorithm
- UI for version comparison

---

### 1.6 Smart Folders with Dynamic Queries
**Priority:** Should-Have
**Complexity:** Medium

**Description:**
Folders that automatically include nodes matching specific criteria. Instead of manually organizing, define rules and let the folder stay updated.

**Benefits:**
- Automatic organization without manual effort
- Multiple views of the same data
- Always up-to-date collections
- Examples: "All unfinished tasks", "Notes from last week", "High priority items"

**Example Queries:**
- All nodes with tag "urgent" AND type "task"
- All nodes created in last 7 days
- All nodes referencing node-X
- All nodes with content containing "budget"
- All image nodes larger than 1MB

**Implementation Details:**
- Smart folders are nodes with `type: 'smart-folder'`
- Query stored in `content.query` as structured JSON
- Query builder UI with visual filters
- Real-time updates when nodes match/unmatch criteria
- Can be displayed in file explorer with special icon
- Performance: Index common query patterns

**Test Zone:** "ZONE-SMART-FOLDERS-001"

**Dependencies:**
- Query engine/filter builder
- Index optimization
- Real-time query evaluation

---

### 1.7 Multi-Select Bulk Operations
**Priority:** Should-Have
**Complexity:** Low

**Description:**
Select multiple nodes in file explorer or node list and perform batch operations.

**Benefits:**
- Delete multiple nodes at once
- Move multiple nodes to different parent
- Apply tags to multiple nodes
- Change color of multiple nodes
- Export multiple nodes together

**Operations:**
- Move to folder
- Add tags
- Remove tags
- Delete (with confirmation)
- Change color
- Export as ZIP
- Duplicate

**Implementation Details:**
- Checkbox next to each node in lists/explorer
- "Select All" / "Deselect All" buttons
- Bulk action toolbar appears when nodes selected
- Batch API endpoints for efficiency
- Confirmation dialog for destructive actions

**Test Zone:** "ZONE-BULK-OPS-001"

**Dependencies:**
- Batch operation API endpoints
- UI state for selection tracking

---

### 1.8 Node Aliasing / Synonyms
**Priority:** Nice-to-Have
**Complexity:** Low

**Description:**
Allow nodes to have multiple names/aliases. When searching or linking, any alias matches the node.

**Benefits:**
- Handle abbreviations (e.g., "ML" → "Machine Learning")
- Support different naming conventions
- Improve search discoverability
- Handle common misspellings

**Implementation Details:**
- Add `aliases` field to node metadata
- Alias management UI in node editor
- Search includes aliases
- Link resolution tries aliases
- Show "also known as" in node preview

**Storage:**
```typescript
metadata: {
  aliases: ["ML", "Machine Learning", "AI/ML"]
}
```

**Test Zone:** "ZONE-ALIASES-001"

---

### 1.9 Node Locking / Read-Only Mode
**Priority:** Nice-to-Have
**Complexity:** Low

**Description:**
Mark nodes as locked to prevent accidental editing or deletion. Useful for finalized documents, references, or archived content.

**Benefits:**
- Protect important content from accidental changes
- Create "reference" nodes that shouldn't be edited
- Archive completed projects without fear of modification

**Implementation Details:**
- Add `isLocked: boolean` to node metadata
- Lock icon in UI
- Edit/delete buttons disabled for locked nodes
- "Unlock to Edit" button with confirmation
- Option to lock recursively (node + children)

**Test Zone:** "ZONE-PROTECTION-001"

---

## 2. Module Visualizations

### 2.1 Timeline/Gantt Module
**Priority:** Should-Have
**Complexity:** Medium

**Description:**
Display nodes on a horizontal timeline, perfect for project planning, roadmaps, and schedule visualization.

**Benefits:**
- Visualize project timelines
- Track deadlines and milestones
- Identify scheduling conflicts
- Plan sprints and iterations

**Use Cases:**
- Project roadmap
- Content calendar
- Course schedule
- Release planning

**Implementation Details:**
- New module type: `timeline`
- Horizontal bars representing node duration
- Start date + end date from node content
- Drag to reschedule
- Color by status, priority, or custom field
- Zoom in/out for different time scales
- Today indicator line
- Dependencies between tasks (arrows)

**Configuration:**
```typescript
config: {
  startDateField: 'content.startDate',
  endDateField: 'content.endDate',
  labelField: 'name',
  colorField: 'content.status',
  showDependencies: true,
  timeScale: 'week', // day, week, month, quarter
}
```

**Library:** react-gantt-chart or dhtmlx-gantt

**Test Zone:** "ZONE-TIMELINE-001"

---

### 2.2 Mind Map Module
**Priority:** Should-Have
**Complexity:** Medium

**Description:**
Radial tree layout for brainstorming and hierarchical visualization. Central node with branches radiating outward.

**Benefits:**
- Better than linear lists for brainstorming
- Visual hierarchy at a glance
- Encourages non-linear thinking
- Great for presentations

**Implementation Details:**
- Center node with configurable root
- Collapsible branches
- Drag to rearrange
- Click to add child inline
- Export as image
- Zoom and pan controls

**Module Type:** `mind-map`

**Library:** markmap or react-mindmap

**Test Zone:** "ZONE-MINDMAP-001"

---

### 2.3 Board/Gallery Module for Images
**Priority:** Should-Have
**Complexity:** Low

**Description:**
Pinterest-style masonry grid for displaying image nodes. Perfect for mood boards, design inspiration, screenshots collection.

**Benefits:**
- Optimized for visual content
- Responsive masonry layout
- Quick preview and navigation
- Drag-and-drop reordering

**Implementation Details:**
- Filter nodes by `type: 'image'`
- Masonry layout with variable heights
- Lightbox on click
- Lazy loading for performance
- Bulk upload interface
- Image metadata display (size, dimensions, date)

**Module Type:** `gallery`

**Library:** react-masonry-css or react-photo-gallery

**Test Zone:** "ZONE-GALLERY-001"

---

### 2.4 Heatmap Module
**Priority:** Nice-to-Have
**Complexity:** Medium

**Description:**
Calendar heatmap showing activity over time. GitHub-style contribution graph for tracking habits, journal entries, or any time-based metrics.

**Benefits:**
- Visualize consistency and patterns
- Motivate daily habits
- Identify gaps in tracking
- Beautiful visual representation

**Use Cases:**
- Daily journal streak
- Exercise tracking
- Work hours logged
- Mood over time

**Implementation Details:**
- Grid of days (52 weeks × 7 days)
- Color intensity based on metric value
- Tooltip showing details on hover
- Click day to see nodes
- Configurable metric field

**Module Type:** `heatmap`

**Configuration:**
```typescript
config: {
  dateField: 'createdAt',
  valueField: 'content.count', // or just count nodes
  colorScale: ['#ebedf0', '#9be9a8', '#40c463', '#30a14e', '#216e39'],
}
```

**Library:** react-calendar-heatmap

**Test Zone:** "ZONE-HEATMAP-001"

---

### 2.5 Pivot Table Module
**Priority:** Nice-to-Have
**Complexity:** High

**Description:**
Interactive pivot table for multi-dimensional data analysis. Drag-and-drop fields to rows, columns, and values areas.

**Benefits:**
- Powerful data analysis tool
- No code required
- Multiple aggregation functions
- Export to CSV/Excel

**Use Cases:**
- Expense analysis (by category, by month)
- Time tracking (by project, by person)
- Sales data (by region, by product)

**Implementation Details:**
- Drag-and-drop field configuration
- Aggregation functions: sum, average, count, min, max
- Sorting and filtering
- Drill-down capability
- Export functionality

**Module Type:** `pivot-table`

**Library:** react-pivottable or custom implementation

**Test Zone:** "ZONE-PIVOT-001"

---

### 2.6 Map Module (Geolocation)
**Priority:** Nice-to-Have
**Complexity:** Medium

**Description:**
Display nodes with location data on an interactive map. Perfect for travel journals, location-based notes, or site visits.

**Benefits:**
- Visualize geographic data
- Plan trips and routes
- Track visited locations
- Cluster nearby nodes

**Implementation Details:**
- Filter nodes with `content.latitude` and `content.longitude`
- Interactive map (Leaflet or Google Maps)
- Markers with node preview on click
- Clustering for dense areas
- Draw routes between nodes
- Search for places and geocode addresses

**Module Type:** `map`

**Configuration:**
```typescript
config: {
  latField: 'content.latitude',
  lngField: 'content.longitude',
  clusterMarkers: true,
  showRoutes: false,
}
```

**Library:** react-leaflet

**Test Zone:** "ZONE-MAP-001"

---

### 2.7 Metrics Dashboard Module
**Priority:** Should-Have
**Complexity:** Medium

**Description:**
KPI dashboard with multiple widgets showing key metrics at a glance. Combine charts, numbers, and progress bars.

**Benefits:**
- Track important metrics on one screen
- Quick status overview
- Motivational visual feedback
- Customizable layout

**Example Widgets:**
- Total node count
- Nodes created this week
- Completion rate for tasks
- Average note length
- Most used tags
- Activity streak

**Implementation Details:**
- Grid of metric cards
- Each card queries nodes and calculates metric
- Real-time updates
- Click card to drill down
- Preset layouts or fully customizable

**Module Type:** `dashboard`

**Test Zone:** "ZONE-METRICS-001"

---

### 2.8 Spreadsheet Module
**Priority:** Nice-to-Have
**Complexity:** High

**Description:**
Full-featured spreadsheet interface for tabular data with formulas, sorting, filtering, and cell formatting.

**Benefits:**
- Familiar Excel-like interface
- Complex calculations with formulas
- Professional data presentation
- Import/export CSV

**Implementation Details:**
- Each row is a node
- Columns defined in module config
- Formula support (=SUM, =AVERAGE, etc.)
- Cell validation rules
- Freeze header row
- Conditional formatting

**Module Type:** `spreadsheet`

**Library:** Handsontable or AG Grid

**Test Zone:** "ZONE-SPREADSHEET-001"

---

### 2.9 Whiteboard/Canvas Module (Enhanced)
**Priority:** Should-Have
**Complexity:** High

**Description:**
Infinite canvas for freeform visual thinking. Combine nodes, drawings, shapes, and connections. Better than current canvas module.

**Benefits:**
- Spatial thinking and organization
- Mix structured data (nodes) with freeform content
- Presentations and diagrams
- Brainstorming sessions

**Features:**
- Drag nodes onto canvas
- Draw shapes (rectangles, circles, arrows)
- Freehand drawing with pen tool
- Sticky notes
- Connectors between elements
- Zoom and pan (infinite canvas)
- Groups and frames
- Layers
- Export as image or SVG

**Module Type:** `canvas` (refactored)

**Library:** Excalidraw, tldraw, or Fabric.js

**Test Zone:** "ZONE-WHITEBOARD-001"

---

### 2.10 Habit Tracker Module
**Priority:** Nice-to-Have
**Complexity:** Low

**Description:**
Specialized module for tracking daily habits with checkbox grid and streak tracking.

**Benefits:**
- Build better habits
- Visual motivation (streaks)
- Historical view of consistency
- Multiple habits in one view

**Implementation Details:**
- Each habit is a node or tag filter
- Grid of days with checkboxes
- Mark habit complete/incomplete
- Streak counter
- Color coding for completion rates
- Monthly view

**Module Type:** `habit-tracker`

**Test Zone:** "ZONE-HABITS-001"

---

## 3. Collaboration & Sharing

### 3.1 Real-Time Collaborative Editing
**Priority:** Should-Have
**Complexity:** High

**Description:**
Multiple users can edit the same node simultaneously. See others' cursors and changes in real-time.

**Benefits:**
- True collaboration like Google Docs
- No conflict resolution needed
- Faster team workflows
- See who's working on what

**Implementation Details:**
- WebSocket connection for real-time sync
- Operational Transformation (OT) or CRDT for conflict-free editing
- User presence indicators (colored cursors)
- "Currently editing" badge on nodes
- User avatars in active node
- Conflict resolution for simultaneous edits

**Technology:**
- Socket.io or Pusher for WebSockets
- Yjs or Automerge for CRDT
- Quill or ProseMirror for collaborative text editing

**Test Zone:** "ZONE-COLLAB-001"

**Dependencies:**
- WebSocket server infrastructure
- CRDT library integration
- User presence system

---

### 3.2 Comments and Annotations
**Priority:** Should-Have
**Complexity:** Medium

**Description:**
Add comments to nodes for discussion, feedback, and questions. Comments can be threaded and resolved.

**Benefits:**
- Discuss content without editing it
- Ask questions and get answers
- Code review-style feedback
- Track discussion history

**Implementation Details:**
- Comments stored in separate `comments` table
- Thread/reply support
- Mention users with @username
- Emoji reactions
- Mark as resolved
- Comment count badge on node
- Filter to show only nodes with unresolved comments

**Storage:**
```sql
CREATE TABLE comments (
  id UUID PRIMARY KEY,
  node_id UUID REFERENCES nodes(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  parent_comment_id UUID REFERENCES comments(id),
  content TEXT,
  is_resolved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

**Test Zone:** "ZONE-COMMENTS-001"

---

### 3.3 Node Sharing with Permissions
**Priority:** Should-Have
**Complexity:** High

**Description:**
Share individual nodes or entire zones with other users with granular permissions (view, edit, admin).

**Benefits:**
- Selective sharing (not all-or-nothing)
- Collaborate on specific projects
- Share read-only references
- Control who can edit what

**Permission Levels:**
- **View:** Can see node and children
- **Comment:** Can add comments
- **Edit:** Can modify content
- **Admin:** Can delete and change permissions

**Implementation Details:**
- Sharing modal with user search
- Permission dropdown per user
- "Anyone with link" option
- Expiring share links
- Audit log of permission changes
- Recursive permissions (share node + children)

**Storage:**
```sql
CREATE TABLE node_shares (
  id UUID PRIMARY KEY,
  node_id UUID REFERENCES nodes(id) ON DELETE CASCADE,
  shared_with_user_id UUID REFERENCES users(id),
  permission_level VARCHAR(20), -- view, comment, edit, admin
  shared_by_user_id UUID REFERENCES users(id),
  expires_at TIMESTAMP,
  created_at TIMESTAMP
);
```

**Test Zone:** "ZONE-SHARING-001"

---

### 3.4 Public Links for Anonymous Viewing
**Priority:** Should-Have
**Complexity:** Medium

**Description:**
Generate public URLs that anyone can view without logging in. Perfect for sharing portfolios, articles, or public wikis.

**Benefits:**
- Share with people outside your organization
- No account required for viewers
- SEO-friendly public pages
- Optional password protection

**Implementation Details:**
- "Make Public" toggle in node settings
- Generate unique shareable URL
- Public page with minimal UI (no sidebar/edit controls)
- Optional password requirement
- View analytics (optional)
- Custom subdomain (future: workspace.nodebook.app/node-slug)

**URL Format:** `https://nodebook.app/s/{unique-id}`

**Test Zone:** "ZONE-PUBLIC-001"

---

### 3.5 Activity Feed / Changelog
**Priority:** Nice-to-Have
**Complexity:** Medium

**Description:**
Stream of recent changes across all nodes. See what others are working on and track project progress.

**Benefits:**
- Stay updated on team activity
- Audit trail for changes
- Discover what's being worked on
- Filter by user, node, or action type

**Events Tracked:**
- Node created
- Node updated
- Node deleted
- Comment added
- Tag added/removed
- Node moved
- Node shared

**Implementation Details:**
- Activity feed page or sidebar widget
- Filter by user, date range, action type
- Click activity to jump to node
- Real-time updates via WebSocket
- Activity stored in `activity_log` table

**Test Zone:** "ZONE-ACTIVITY-001"

---

### 3.6 Team Workspaces
**Priority:** Nice-to-Have
**Complexity:** High

**Description:**
Create workspaces where teams can collaborate. Each workspace has its own zones, modules, and shared nodes.

**Benefits:**
- Separate personal and team work
- Multiple projects with different members
- Workspace-level permissions
- Billing per workspace

**Implementation Details:**
- Workspace entity above zones
- Invite members to workspace
- Workspace settings and branding
- Transfer nodes between workspaces
- Workspace admin role

**Test Zone:** "ZONE-TEAMS-001"

---

## 4. Productivity & Workflow

### 4.1 Inline [[Node]] References with Embeds
**Priority:** Must-Have
**Complexity:** Medium

**Description:**
Type `[[node-name]]` to reference another node inline. Optionally embed the node's content directly (transclusion).

**Benefits:**
- Build connected knowledge graphs
- Reuse content without duplication
- Changes propagate everywhere
- Essential for "second brain" methodology

**Implementation Details:**
- Autocomplete menu when typing `[[`
- Create new node if name doesn't exist
- Render as link or embedded content
- Click to navigate or edit inline
- Syntax: `[[node-name]]` or `![[node-name]]` for embed

**Rendering:**
- Link: Shows as hyperlink with hover preview
- Embed: Shows full node content inline (editable)

**Test Zone:** "ZONE-LINKING-001"

**Dependencies:**
- Markdown parser extension
- Node autocomplete search
- Backlinks system (1.1)

---

### 4.2 Task Management with Checkboxes
**Priority:** Should-Have
**Complexity:** Low

**Description:**
Native checkbox support in markdown: `- [ ] Task` and `- [x] Completed task`. Track completion status and create todo lists.

**Benefits:**
- Lightweight task management
- No need for separate task app
- Visual progress tracking
- Filter/search for incomplete tasks

**Implementation Details:**
- Markdown checkbox syntax support
- Click to toggle completion
- Store completion state in node content
- Query for all incomplete tasks
- Show completion percentage
- "Show only incomplete" filter

**Module Integration:**
- Kanban module can show checkbox tasks
- Table module shows completion column
- Special "Tasks" smart folder

**Test Zone:** "ZONE-TASKS-001"

---

### 4.3 Slash Commands (/) in Editor
**Priority:** Should-Have
**Complexity:** Medium

**Description:**
Type `/` in any text editor to open command menu for quick formatting and block insertion.

**Benefits:**
- Keyboard-first content creation
- Faster than toolbar buttons
- Discoverable features
- Notion-style UX

**Commands:**
- `/h1`, `/h2`, `/h3` - Headings
- `/table` - Insert table
- `/code` - Code block
- `/quote` - Blockquote
- `/checklist` - Todo list
- `/date` - Insert current date
- `/image` - Upload image
- `/node` - Link to node
- `/divider` - Horizontal rule

**Implementation Details:**
- Detect `/` followed by text
- Show floating menu near cursor
- Fuzzy search commands
- Arrow keys + Enter to select
- Transform text at cursor position

**Test Zone:** "ZONE-SLASH-001"

**Status:** Partially implemented (SlashCommandMenu exists)

---

### 4.4 Quick Capture Widget
**Priority:** Should-Have
**Complexity:** Low

**Description:**
Global floating widget for capturing ideas without opening full editor. Always accessible, instantly saves.

**Benefits:**
- Capture fleeting thoughts immediately
- No context switching
- Lower friction than opening full app
- Process later workflow

**Implementation Details:**
- Floating button in corner (existing FAB can be repurposed)
- Click opens small text input
- Type and press Enter to save
- Creates node in "Inbox" or default zone
- Keyboard shortcut to open from anywhere
- Optional: Voice input button

**UI:**
- Small modal or slide-in panel
- Single text input with Save button
- "Add tags" and "Select parent" dropdowns (optional)
- Close automatically after save

**Test Zone:** "ZONE-INBOX-001"

---

### 4.5 Keyboard Shortcuts Everywhere
**Priority:** Must-Have
**Complexity:** Medium

**Description:**
Comprehensive keyboard shortcuts for all major actions. No mouse required for power users.

**Benefits:**
- Faster workflows
- Power user efficiency
- Accessibility improvement
- Reduced RSI from mouse usage

**Essential Shortcuts:**
- `Ctrl+K` - Command palette (exists)
- `Ctrl+P` - Quick node switcher
- `Ctrl+N` - New node
- `Ctrl+S` - Save current node
- `Ctrl+/` - Toggle shortcuts help
- `Ctrl+B` - Bold text
- `Ctrl+I` - Italic text
- `Ctrl+E` - Code inline
- `Ctrl+Shift+F` - Global search
- `Ctrl+,` - Settings
- `Esc` - Close modal/dialog
- `?` - Show keyboard shortcuts

**Implementation Details:**
- Global keyboard handler
- Context-aware shortcuts (editor vs dashboard)
- Customizable shortcuts (settings)
- Visual hint showing shortcut on hover
- Shortcuts help modal (`?` or `Ctrl+/`)

**Test Zone:** "ZONE-KEYBOARD-001"

---

### 4.6 Auto-Save with Conflict Detection
**Priority:** Must-Have
**Complexity:** Medium

**Description:**
Automatically save changes every few seconds. Detect conflicts if same node edited elsewhere.

**Benefits:**
- Never lose work
- No manual save needed
- Multi-device safety
- Peace of mind

**Implementation Details:**
- Debounced auto-save (3-5 seconds after last edit)
- Version checking (optimistic locking)
- Conflict notification with 3-way merge
- Local draft storage (IndexedDB) as backup
- "Saving..." indicator
- "All changes saved" confirmation

**Conflict Resolution:**
- Show both versions side-by-side
- Highlight differences
- Let user choose which to keep or merge manually

**Test Zone:** "ZONE-AUTOSAVE-001"

---

### 4.7 Undo/Redo Stack
**Priority:** Must-Have
**Complexity:** Medium

**Description:**
Track recent actions and allow undo/redo with keyboard shortcuts.

**Benefits:**
- Recover from mistakes
- Experiment without fear
- Standard UX expectation
- Boost user confidence

**Actions Trackable:**
- Text edits
- Node creation/deletion
- Move operations
- Tag changes
- Content changes

**Implementation Details:**
- Undo stack stored in memory (per session)
- `Ctrl+Z` to undo
- `Ctrl+Shift+Z` or `Ctrl+Y` to redo
- Visual indicator of undo/redo availability
- Limit stack size (e.g., last 50 actions)
- Clear stack on page refresh (warn user)

**Test Zone:** "ZONE-UNDO-001"

---

### 4.8 Recurring Nodes / Templates
**Priority:** Nice-to-Have
**Complexity:** Medium

**Description:**
Automatically create nodes on a schedule. Perfect for daily journals, weekly reviews, or recurring reminders.

**Benefits:**
- Build daily habits
- Consistent structure
- Never forget routine tasks
- Automation reduces friction

**Use Cases:**
- Daily journal entry created every morning
- Weekly review created every Sunday
- Monthly budget review
- Quarterly OKR review

**Implementation Details:**
- Recurrence rules (daily, weekly, monthly, custom cron)
- Time of creation
- Template to use for new node
- Stop after N occurrences or date
- Background job to create nodes
- "Skip today" or "Mark complete" actions

**Test Zone:** "ZONE-RECURRING-001"

---

### 4.9 Focus Mode
**Priority:** Nice-to-Have
**Complexity:** Low

**Description:**
Distraction-free writing mode. Hide all UI chrome except the editor.

**Benefits:**
- Eliminate distractions
- Better concentration
- Immersive writing experience
- Fullscreen writing

**Implementation Details:**
- Toggle button or `F11` key
- Hide sidebar, toolbar, breadcrumbs
- Center content with max-width
- Optional: Dark background with light text
- Type to start writing immediately
- ESC to exit focus mode

**Test Zone:** "ZONE-FOCUS-001"

---

### 4.10 Smart Tag Suggestions
**Priority:** Nice-to-Have
**Complexity:** Medium

**Description:**
AI-powered or rule-based tag suggestions based on node content.

**Benefits:**
- Consistent tagging
- Discover relevant tags
- Save time
- Better organization

**Implementation Details:**
- Analyze node content for keywords
- Suggest existing tags that match
- ML model (optional) for smart suggestions
- "Apply suggested tags" button
- Learn from user acceptance/rejection

**Test Zone:** "ZONE-TAG-AI-001"

---

## 5. UI/UX Enhancements

### 5.1 Dark Mode Improvements
**Priority:** Should-Have
**Complexity:** Low

**Description:**
Enhanced dark mode with better contrast, accent colors, and true black option for OLED screens.

**Improvements:**
- True black background option (#000000 for OLED)
- High contrast mode for accessibility
- Syntax highlighting themes (dark/light variants)
- Image dimming in dark mode
- Smooth theme transition animation

**Implementation Details:**
- Additional theme variants
- CSS custom properties for colors
- Persist theme preference
- Respect system theme by default
- Preview themes in settings

**Test Zone:** Any zone

---

### 5.2 Customizable Color Themes
**Priority:** Nice-to-Have
**Complexity:** Medium

**Description:**
User-defined color themes or preset themes beyond dark/light.

**Benefits:**
- Personal expression
- Brand matching for teams
- Accessibility (colorblind modes)
- Variety reduces monotony

**Preset Themes:**
- Nord
- Dracula
- Solarized
- Gruvbox
- One Dark
- GitHub
- High Contrast

**Implementation Details:**
- Theme picker in settings
- CSS variables for all colors
- Theme export/import
- Community theme gallery (future)

**Test Zone:** "ZONE-THEMES-001"

---

### 5.3 Customizable Dashboard Layouts
**Priority:** Should-Have
**Complexity:** Low

**Description:**
Save and switch between different dashboard layouts for different contexts.

**Benefits:**
- Different layouts for different tasks
- Quick context switching
- Personal vs professional layouts
- Shareable layouts

**Implementation Details:**
- "Save Layout" button
- Layout presets dropdown
- Default layout setting
- Duplicate/rename/delete layouts
- Export/import layout JSON

**Test Zone:** Any zone

---

### 5.4 Breadcrumb Navigation
**Priority:** Should-Have
**Complexity:** Low

**Description:**
Show current location in node hierarchy with clickable breadcrumbs.

**Benefits:**
- Know where you are
- Quick upward navigation
- Understand context
- Standard UX pattern

**Implementation Details:**
- Display: `Zone > Parent Folder > Current Node`
- Click any breadcrumb to navigate
- Truncate middle items if too long
- Show full path on hover
- Mobile: Collapsible breadcrumb menu

**Test Zone:** Any zone

---

### 5.5 Loading Skeletons & Optimistic UI
**Priority:** Should-Have
**Complexity:** Low

**Description:**
Replace spinners with skeleton screens. Update UI immediately before server confirms.

**Benefits:**
- Feels faster
- Better perceived performance
- Less jarring than spinners
- Modern UX standard

**Implementation Details:**
- Skeleton components for cards, lists, text
- Optimistic updates for create/edit/delete
- Rollback on error with toast notification
- Smooth transitions between skeleton and content

**Test Zone:** Any zone

---

### 5.6 Toast Notifications System
**Priority:** Must-Have
**Complexity:** Low

**Description:**
Non-intrusive notifications for actions, errors, and confirmations.

**Benefits:**
- User feedback without blocking
- Error visibility
- Success confirmation
- Better UX than alert()

**Implementation Details:**
- Toast positions (top-right, bottom-right, etc.)
- Auto-dismiss after N seconds
- Action buttons in toasts
- Different variants (success, error, warning, info)
- Toast queue management

**Status:** Already implemented (using shadcn/ui toast)

**Improvements:**
- Undo button in toasts
- Batch similar toasts
- Persistent toasts for critical errors

**Test Zone:** Any zone

---

### 5.7 Empty States with Call-to-Action
**Priority:** Should-Have
**Complexity:** Low

**Description:**
Beautiful, helpful empty states that guide users on what to do next.

**Benefits:**
- Reduce confusion
- Guide onboarding
- Encourage action
- Professional polish

**Examples:**
- Empty zone: "Create your first module"
- Empty search: "Try different keywords"
- Empty trash: "Deleted items will appear here"
- Empty module: "Add nodes to visualize data"

**Implementation Details:**
- Illustration or icon
- Helpful message
- Primary CTA button
- Optional secondary action
- Contextual help link

**Test Zone:** Any zone

---

### 5.8 Drag-and-Drop File Uploads
**Priority:** Should-Have
**Complexity:** Low

**Description:**
Drag files from desktop directly into Nodebook to create image/file nodes.

**Benefits:**
- Intuitive UX
- Faster than file picker
- Bulk upload support
- Modern standard

**Implementation Details:**
- Drop zone overlay when dragging file over window
- Highlight drop target
- Progress indicator for uploads
- Support multiple files
- Preview before upload (optional)
- Paste from clipboard (Ctrl+V)

**Test Zone:** "ZONE-UPLOADS-001"

---

### 5.9 Responsive Mobile Experience
**Priority:** Must-Have
**Complexity:** High

**Description:**
Optimize all pages and components for mobile/tablet screens.

**Benefits:**
- Use Nodebook on any device
- Mobile capture workflow
- Touch-friendly UI
- Progressive web app potential

**Key Areas:**
- Hamburger menu for zones
- Bottom navigation bar
- Swipe gestures
- Touch-optimized buttons (44px min)
- Responsive grid layouts
- Fullscreen editor on mobile
- Pull-to-refresh

**Test Zone:** All zones

---

### 5.10 Onboarding Tutorial
**Priority:** Should-Have
**Complexity:** Medium

**Description:**
Interactive walkthrough for new users explaining core concepts and features.

**Benefits:**
- Faster time to value
- Reduce support burden
- Showcase key features
- Build confidence

**Steps:**
1. Welcome message
2. Create first node
3. Create first zone
4. Create first module
5. Link nodes together
6. Search and command palette
7. Keyboard shortcuts

**Implementation Details:**
- Modal overlays with spotlights
- Step-by-step progression
- Skip or restart anytime
- Checkbox: "Don't show again"
- Help center link

**Library:** Shepherd.js or Intro.js

**Test Zone:** "ZONE-ONBOARDING-001"

---

## 6. Data Management & Analysis

### 6.1 Advanced Filtering and Sorting
**Priority:** Should-Have
**Complexity:** Medium

**Description:**
Powerful multi-condition filters for all list views and modules.

**Benefits:**
- Find exactly what you need
- Build complex queries
- Save filters for reuse
- Data analysis capabilities

**Filter Options:**
- Node type
- Tags (AND/OR logic)
- Date range (created, updated)
- Content fields (equals, contains, greater than, etc.)
- Has children / No children
- Has references / Referenced by
- Custom metadata fields

**UI:**
- Filter builder with add/remove conditions
- Visual query builder
- Save filter as smart folder
- "Clear filters" button

**Test Zone:** "ZONE-FILTERS-001"

---

### 6.2 Bulk Import from External Sources
**Priority:** Should-Have
**Complexity:** High

**Description:**
Import notes and data from other apps: Notion, Evernote, Obsidian, Roam Research, OneNote, CSV, JSON.

**Benefits:**
- Easy migration from other tools
- No lock-in
- Preserve existing work
- Lower barrier to adoption

**Supported Formats:**
- Markdown files (.md)
- HTML export
- CSV (with column mapping)
- JSON (with schema mapping)
- Notion export (HTML or Markdown)
- Evernote .enex files
- OPML (mind maps)

**Implementation Details:**
- Import wizard with file upload
- Preview before import
- Field mapping UI
- Preserve hierarchy and links
- Progress indicator
- Import report (success/failures)

**Test Zone:** "ZONE-IMPORT-001"

---

### 6.3 Export Options (PDF, Markdown, HTML)
**Priority:** Should-Have
**Complexity:** Medium

**Description:**
Export nodes and zones in various formats for sharing, archiving, or printing.

**Benefits:**
- Portability
- Backup
- Sharing with non-users
- Print-friendly formats
- No lock-in

**Export Formats:**
- **Markdown:** Single file or ZIP with assets
- **HTML:** Self-contained with CSS
- **PDF:** Formatted document
- **JSON:** Full data export
- **CSV:** For table modules
- **DOCX:** Word document (future)

**Export Scope:**
- Single node
- Node + children (recursive)
- Entire zone
- Multiple selected nodes
- Filtered results

**Test Zone:** "ZONE-EXPORT-001"

---

### 6.4 Data Backup and Restore
**Priority:** Must-Have
**Complexity:** Medium

**Description:**
Automated backups with one-click restore. Never lose data.

**Benefits:**
- Disaster recovery
- Peace of mind
- Test environment creation
- Migrate to self-hosted

**Implementation Details:**
- Automated daily backups
- Manual backup trigger
- Download backup as ZIP
- Restore from backup file
- Backup includes: nodes, zones, modules, tags, attachments
- Incremental backups for efficiency
- Retention policy (keep last N backups)

**Test Zone:** "ZONE-BACKUP-001"

---

### 6.5 Data Analytics and Insights
**Priority:** Nice-to-Have
**Complexity:** High

**Description:**
Dashboard showing statistics about your usage patterns and content.

**Metrics:**
- Total nodes created
- Most active days/hours
- Most used tags
- Node type distribution
- Average node length
- Growth over time
- Longest writing streak
- Most referenced nodes
- Orphaned nodes count

**Visualizations:**
- Line charts for trends
- Pie charts for distributions
- Bar charts for comparisons
- Heatmap for activity

**Test Zone:** "ZONE-ANALYTICS-001"

---

### 6.6 Trash/Recycle Bin
**Priority:** Must-Have
**Complexity:** Low

**Description:**
Soft delete nodes to trash instead of permanent deletion. Restore or permanently delete from trash.

**Benefits:**
- Undo accidental deletions
- Review before permanent deletion
- Safety net
- Standard UX pattern

**Implementation Details:**
- "Move to Trash" instead of delete
- Trash view showing deleted nodes
- Restore button
- "Empty Trash" permanently deletes
- Auto-empty after 30 days
- Excluded from search by default

**Test Zone:** "ZONE-TRASH-001"

---

### 6.7 Duplicate Detection
**Priority:** Nice-to-Have
**Complexity:** Medium

**Description:**
Identify and merge duplicate or similar nodes.

**Benefits:**
- Reduce clutter
- Consolidate information
- Better search results
- Cleaner data

**Detection Methods:**
- Exact content match
- Similar titles (fuzzy matching)
- Similar content (semantic similarity)
- Same external link

**Implementation Details:**
- "Find Duplicates" tool
- Show pairs of potential duplicates
- Side-by-side comparison
- "Merge" or "Keep Both" actions
- Merge combines content and preserves references

**Test Zone:** "ZONE-DEDUP-001"

---

## 7. Search & Discovery

### 7.1 Full-Text Search with Relevance Ranking
**Priority:** Must-Have
**Complexity:** Medium

**Description:**
Fast, accurate search across all node content with intelligent ranking.

**Benefits:**
- Find information quickly
- Better than manual browsing
- Essential for large knowledge bases
- Power user feature

**Features:**
- Search in name, content, tags, metadata
- Fuzzy matching for typos
- Relevance scoring
- Search within specific zone or globally
- Filter results by type, tags, date
- Highlight matching text in results

**Implementation Details:**
- PostgreSQL full-text search or Elasticsearch
- Search index updated on node save
- Debounced search as you type
- Show result count
- Recent searches

**Test Zone:** "ZONE-SEARCH-001"

---

### 7.2 Saved Searches
**Priority:** Nice-to-Have
**Complexity:** Low

**Description:**
Save frequently used search queries for quick access.

**Benefits:**
- Faster repeated searches
- Build custom views
- Share searches with team
- Workflow optimization

**Implementation Details:**
- "Save Search" button in search UI
- Saved searches list in sidebar
- Click to run search
- Edit/delete saved searches
- Share saved search with others

**Test Zone:** "ZONE-SAVEDSEARCH-001"

---

### 7.3 Tag Cloud / Tag Browser
**Priority:** Nice-to-Have
**Complexity:** Low

**Description:**
Visual representation of all tags sized by usage frequency.

**Benefits:**
- Discover popular tags
- Visual exploration
- Identify tag patterns
- Navigate by topic

**Implementation Details:**
- Tag cloud with larger text for frequent tags
- Click tag to filter nodes
- Color coding (optional)
- Sort by frequency or alphabetically
- Tag hierarchy visualization (if nested tags implemented)

**Test Zone:** "ZONE-TAGS-CLOUD-001"

---

### 7.4 Related Nodes Suggestions
**Priority:** Nice-to-Have
**Complexity:** High

**Description:**
AI-powered suggestions for related nodes based on content similarity.

**Benefits:**
- Discover connections
- Serendipitous discovery
- Build knowledge graph organically
- Reduce information silos

**Implementation Details:**
- Show "Related Nodes" panel in node editor
- Calculate similarity using TF-IDF or embeddings
- Consider tags, content, references
- Click to view or link
- "Not relevant" feedback

**Test Zone:** "ZONE-RELATED-001"

---

### 7.5 Random Node Button
**Priority:** Nice-to-Have
**Complexity:** Low

**Description:**
Navigate to a random node. Rediscover forgotten content.

**Benefits:**
- Serendipitous discovery
- Break routine browsing
- Rediscover old notes
- Fun exploration

**Implementation Details:**
- "Random" button in sidebar or toolbar
- Fetch random node from database
- Optional: Weight by age (favor old nodes)
- Keyboard shortcut

**Test Zone:** "ZONE-RANDOM-001"

---

## 8. Export & Integration

### 8.1 API for External Integrations
**Priority:** Should-Have
**Complexity:** Medium

**Description:**
RESTful API with authentication for third-party integrations.

**Benefits:**
- Automation with Zapier/n8n
- Custom tools and scripts
- Mobile apps
- Browser extensions

**Endpoints:**
- CRUD for nodes, zones, modules, tags
- Search API
- File upload API
- Webhook subscriptions

**Documentation:**
- OpenAPI/Swagger docs
- Example code in multiple languages
- API playground

**Test Zone:** "ZONE-API-001"

---

### 8.2 Webhook Subscriptions
**Priority:** Nice-to-Have
**Complexity:** Medium

**Description:**
Subscribe to events via webhooks for external automation.

**Benefits:**
- Real-time integrations
- Trigger external workflows
- Custom notifications
- Automation

**Events:**
- node.created
- node.updated
- node.deleted
- tag.added
- comment.created

**Implementation Details:**
- Webhook management UI
- Retry logic for failed deliveries
- Signature verification
- Payload filtering

**Test Zone:** "ZONE-WEBHOOKS-001"

---

### 8.3 Zapier/Make.com Integration
**Priority:** Nice-to-Have
**Complexity:** High

**Description:**
Official Zapier and Make.com apps for no-code automation.

**Benefits:**
- Connect to 5000+ apps
- No coding required
- Popular automation platforms
- Expand use cases

**Example Zaps:**
- Create node from email
- Save Pocket articles as nodes
- Tweet when node created with #publish tag
- Backup to Google Drive daily

**Test Zone:** "ZONE-ZAPIER-001"

---

### 8.4 Browser Extension
**Priority:** Nice-to-Have
**Complexity:** High

**Description:**
Chrome/Firefox extension for quick capture from any webpage.

**Benefits:**
- Capture web content instantly
- Save bookmarks with notes
- Screenshot and annotate
- Clip articles

**Features:**
- Right-click context menu "Save to Nodebook"
- Popup with quick capture form
- Highlight text to save selection
- Screenshot tool
- Tag and choose destination

**Test Zone:** "ZONE-EXTENSION-001"

---

### 8.5 Email to Node
**Priority:** Nice-to-Have
**Complexity:** Medium

**Description:**
Unique email address to create nodes by forwarding emails.

**Benefits:**
- Capture from mobile easily
- Forward important emails
- Save newsletters
- Archive conversations

**Implementation Details:**
- Each user gets unique address: `user123@nodebook.app`
- Email subject becomes node name
- Email body becomes content
- Attachments saved as child nodes
- Optional: Tag via email subject (e.g., "Meeting notes #work")

**Test Zone:** "ZONE-EMAIL-001"

---

## 9. Mobile Experience

### 9.1 Progressive Web App (PWA)
**Priority:** Should-Have
**Complexity:** Medium

**Description:**
Install Nodebook as a native-feeling app on mobile devices.

**Benefits:**
- App-like experience
- Offline support
- Home screen icon
- Push notifications
- Faster load times

**Implementation Details:**
- Service worker for offline caching
- manifest.json with icons
- Offline queue for edits
- "Install App" prompt
- Background sync

**Test Zone:** All zones

---

### 9.2 Swipe Gestures
**Priority:** Nice-to-Have
**Complexity:** Low

**Description:**
Swipe actions for common operations on mobile.

**Benefits:**
- Touch-optimized
- Faster actions
- Less tapping
- Modern UX

**Gestures:**
- Swipe right to go back
- Swipe left on node to delete
- Swipe down to close
- Pull down to refresh
- Pinch to zoom (canvas/graph)

**Test Zone:** All zones (mobile)

---

### 9.3 Voice Input
**Priority:** Nice-to-Have
**Complexity:** Medium

**Description:**
Speech-to-text for hands-free note creation.

**Benefits:**
- Capture while driving/walking
- Faster than typing on mobile
- Accessibility
- Modern feature

**Implementation Details:**
- Microphone button in editor
- Real-time transcription
- Multiple language support
- Punctuation commands
- Edit after transcription

**Test Zone:** "ZONE-VOICE-001"

---

### 9.4 Mobile-Optimized Editor
**Priority:** Must-Have
**Complexity:** Medium

**Description:**
Editor with mobile-specific improvements.

**Features:**
- Floating toolbar above keyboard
- Swipe keyboard toolbar for formatting
- Touch-friendly buttons
- Reduced UI chrome
- Fullscreen mode
- Handle keyboard show/hide

**Test Zone:** All zones (mobile)

---

## 10. Advanced Features

### 10.1 Custom CSS/Theming
**Priority:** Nice-to-Have
**Complexity:** Medium

**Description:**
Allow users to inject custom CSS for complete UI customization.

**Benefits:**
- Power users can tweak anything
- Company branding
- Personal expression
- Accessibility customization

**Implementation Details:**
- Custom CSS editor in settings
- Live preview
- Syntax highlighting
- CSS validation
- Export/import CSS
- Gallery of community themes

**Test Zone:** "ZONE-CUSTOM-CSS-001"

---

### 10.2 Plugin System
**Priority:** Nice-to-Have
**Complexity:** Very High

**Description:**
Extensibility platform for community-built plugins.

**Benefits:**
- Infinite possibilities
- Community-driven features
- Niche use cases
- Competitive advantage

**Plugin Capabilities:**
- Custom module types
- Custom node types
- Editor extensions
- Command palette commands
- Context menu items
- API integrations

**Implementation Details:**
- Plugin manifest.json
- Sandboxed execution
- Plugin marketplace
- Version management
- Security review

**Test Zone:** "ZONE-PLUGINS-001"

---

### 10.3 AI-Powered Features
**Priority:** Nice-to-Have
**Complexity:** Very High

**Description:**
Integrate AI for various smart features.

**AI Features:**
- Summarize long nodes
- Generate content from prompts
- Auto-tag nodes
- Find similar nodes
- Extract key points
- Answer questions about notes
- Suggest titles
- Grammar/spelling fixes

**Implementation:**
- OpenAI API integration
- Local models (optional)
- Token usage tracking
- User-provided API key option

**Test Zone:** "ZONE-AI-001"

---

### 10.4 Encryption for Sensitive Nodes
**Priority:** Nice-to-Have
**Complexity:** High

**Description:**
End-to-end encryption for sensitive nodes.

**Benefits:**
- Store passwords, secrets
- Privacy-sensitive notes
- Compliance requirements
- User trust

**Implementation Details:**
- Password-protect specific nodes
- Client-side encryption
- Encrypted content not searchable
- Master password or per-node password
- Recovery mechanism

**Test Zone:** "ZONE-ENCRYPTED-001"

---

### 10.5 Multi-Language Support (i18n)
**Priority:** Nice-to-Have
**Complexity:** Medium

**Description:**
Translate UI into multiple languages.

**Benefits:**
- Global audience
- Accessibility
- Market expansion
- User preference

**Languages to Start:**
- English (default)
- Spanish
- French
- German
- Chinese (Simplified)
- Japanese
- Portuguese

**Implementation:**
- i18next library
- Language selector in settings
- RTL support (Arabic, Hebrew)
- Crowdsourced translations

**Test Zone:** All zones

---

### 10.6 Self-Hosting Option
**Priority:** Nice-to-Have
**Complexity:** Low (Documentation)

**Description:**
Detailed guide and Docker setup for self-hosting Nodebook.

**Benefits:**
- Data sovereignty
- On-premise deployment
- Customization freedom
- Trust and privacy

**Implementation Details:**
- Docker Compose setup (already exists)
- Environment configuration guide
- Database migration guide
- Reverse proxy setup (Nginx)
- SSL/TLS setup
- Backup/restore guide

**Documentation:**
- SELF_HOSTING.md
- Video tutorial
- Community forum

**Test Zone:** N/A (Infrastructure)

---

## Implementation Roadmap

### Phase 1: Foundation (Months 1-3)
**Focus:** Core functionality and UX polish

**Must-Have Features:**
- 1.1 Bidirectional Linking (Backlinks)
- 1.6 Smart Folders with Dynamic Queries
- 4.1 Inline [[Node]] References with Embeds
- 4.5 Keyboard Shortcuts Everywhere
- 4.6 Auto-Save with Conflict Detection
- 4.7 Undo/Redo Stack
- 5.6 Toast Notifications System (enhance existing)
- 6.6 Trash/Recycle Bin
- 7.1 Full-Text Search with Relevance Ranking
- 9.4 Mobile-Optimized Editor

### Phase 2: Productivity (Months 4-6)
**Focus:** Making Nodebook indispensable for daily use

**Should-Have Features:**
- 1.2 Graph View Visualization
- 1.3 Node Templates
- 1.4 Quick Node Switcher
- 1.7 Multi-Select Bulk Operations
- 2.1 Timeline/Gantt Module
- 2.2 Mind Map Module
- 2.3 Board/Gallery Module for Images
- 2.7 Metrics Dashboard Module
- 4.2 Task Management with Checkboxes
- 4.3 Slash Commands (enhance existing)
- 4.4 Quick Capture Widget
- 5.3 Customizable Dashboard Layouts
- 5.4 Breadcrumb Navigation
- 5.5 Loading Skeletons & Optimistic UI
- 5.8 Drag-and-Drop File Uploads
- 6.1 Advanced Filtering and Sorting

### Phase 3: Collaboration (Months 7-9)
**Focus:** Team features and sharing

**Should-Have Features:**
- 3.1 Real-Time Collaborative Editing
- 3.2 Comments and Annotations
- 3.3 Node Sharing with Permissions
- 3.4 Public Links for Anonymous Viewing
- 5.10 Onboarding Tutorial
- 6.2 Bulk Import from External Sources
- 6.3 Export Options (PDF, Markdown, HTML)
- 8.1 API for External Integrations

### Phase 4: Growth (Months 10-12)
**Focus:** Scalability and advanced features

**Nice-to-Have Features:**
- 1.5 Node Version History
- 2.4 Heatmap Module
- 2.9 Whiteboard/Canvas Module (Enhanced)
- 3.5 Activity Feed / Changelog
- 4.8 Recurring Nodes / Templates
- 5.2 Customizable Color Themes
- 6.4 Data Backup and Restore
- 6.5 Data Analytics and Insights
- 9.1 Progressive Web App (PWA)

### Phase 5: Ecosystem (Months 12+)
**Focus:** Integrations and extensibility

**Nice-to-Have Features:**
- 2.5 Pivot Table Module
- 2.6 Map Module (Geolocation)
- 3.6 Team Workspaces
- 8.2 Webhook Subscriptions
- 8.3 Zapier/Make.com Integration
- 8.4 Browser Extension
- 10.2 Plugin System
- 10.3 AI-Powered Features

---

## Testing Zone Recommendations

Create these test zones to prototype and demo features:

1. **ZONE-PROTOTYPE-001** - General prototyping
2. **ZONE-KNOWLEDGE-001** - Backlinks and linking
3. **ZONE-GRAPH-VIZ-001** - Graph visualization
4. **ZONE-TEMPLATES-001** - Node templates
5. **ZONE-TIMELINE-001** - Timeline/Gantt modules
6. **ZONE-GALLERY-001** - Image gallery module
7. **ZONE-COLLAB-001** - Collaborative features
8. **ZONE-TASKS-001** - Task management
9. **ZONE-ANALYTICS-001** - Data insights
10. **ZONE-MOBILE-DEMO-001** - Mobile-specific features

---

## Priority Summary

### Must-Have (Critical for Core Experience)
- Bidirectional linking & backlinks
- Inline node references with embeds
- Auto-save & conflict detection
- Undo/redo functionality
- Comprehensive keyboard shortcuts
- Trash/recycle bin
- Full-text search
- Mobile-optimized editor
- Smart folders with queries

### Should-Have (High Impact Features)
- Graph view visualization
- Node templates
- Quick node switcher
- Timeline/Gantt module
- Mind map module
- Real-time collaborative editing
- Comments & annotations
- Sharing with permissions
- Task management
- Advanced filtering
- Dashboard customization
- Import/export functionality

### Nice-to-Have (Polish & Differentiation)
- Node version history
- Advanced module types (pivot, map, heatmap)
- Activity feed
- Custom themes
- Analytics dashboard
- PWA support
- API & webhooks
- Browser extension
- AI features
- Plugin system

---

## Competitive Analysis

### Features That Match Notion
- ✅ Rich text editing
- ✅ Nested pages/nodes
- ✅ Multiple views (table, kanban, calendar)
- ✅ Drag-and-drop interface
- ⏳ Databases (partial - via filtered modules)
- ⏳ Templates
- ❌ Team collaboration
- ❌ Published pages

### Features That Match Obsidian
- ✅ Markdown support
- ✅ Local-first (with self-hosting)
- ⏳ Backlinks (needs implementation)
- ⏳ Graph view (needs implementation)
- ✅ Tags
- ❌ Community plugins
- ⏳ Daily notes (recurring nodes)

### Unique to Nodebook
- ✅ Module-based visualization system
- ✅ Zones for organizational context
- ✅ UUID-based immutable nodes
- ✅ Query-based filtering
- ✅ JSONB flexible content
- ✅ Web-first architecture
- ⏳ Node references tracked in DB

### Gaps to Fill
1. Real-time collaboration (Notion has this)
2. Plugin ecosystem (Obsidian has this)
3. Mobile apps (both have native apps)
4. Advanced database features (Notion excels)
5. Graph visualization (Obsidian excels)
6. Publishing platform (both have this)

---

## Conclusion

This feature suggestions report provides a comprehensive roadmap for evolving Nodebook into a world-class knowledge management system. The features are organized by priority and complexity, with clear implementation details and suggested test zones.

**Key Recommendations:**
1. **Start with Phase 1** to solidify core functionality and UX
2. **Focus on bidirectional linking** as it's fundamental to knowledge management
3. **Prioritize keyboard-first workflows** per the VISION.md philosophy
4. **Build mobile experience early** to enable capture-anywhere workflows
5. **Add collaboration features** to compete with Notion
6. **Develop graph visualization** to compete with Obsidian

Each feature has been designed to align with Nodebook's architecture of independent nodes, filtered modules, and organizational zones. The system's flexibility allows for incremental implementation without major refactoring.

**Success Metrics:**
- Reduced time to create and link notes
- Increased daily active usage
- Higher user retention
- Positive user feedback on specific features
- Competitive feature parity with leading tools

Use this document as a living roadmap - prioritize based on user feedback, competitive landscape, and technical feasibility. Not every feature needs to be built; focus on what makes Nodebook uniquely valuable to your target users.
