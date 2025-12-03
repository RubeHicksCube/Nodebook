# Nodebook Vision: Keyboard-First Second Brain

## Core Philosophy

**Problem Statement:**
- Notion: Can't edit referenced content inline across pages
- Obsidian: Too complicated to tie data together, not a web app
- Current Nodebook: Overcomplic with wizards, drag-and-drop, multiple clicks

**Solution:**
A fast, keyboard-first web app where **nodes are the atomic unit** of reusable, editable data that can be referenced and edited anywhere they appear.

## Core Principles

### 1. Speed First
- **One click** (or keyboard shortcut) to add a new node and start typing
- No wizards, no multi-step flows
- Instant node creation, instant editing
- Everything happens in the editor

### 2. Keyboard-Centric
- Almost never need to click
- Everything accessible via keyboard
- Quick commands for all actions
- Fast navigation between nodes

### 3. Nodes as Atomic Data
- Small, byte-sized data entries
- Each node is independently editable
- Nodes can be referenced/embedded anywhere
- Editing a node updates it everywhere it's referenced
- The "document" is just a collection of node references

### 4. Mobile-Friendly
- No complex drag-and-drop required
- Touch-friendly (but keyboard-first on desktop)
- Simple, linear flows
- Works on any screen size

### 5. Simplicity Over Features
- Fewer clicks, fewer steps
- No unnecessary UI chrome
- Focus on the content, not the interface
- Progressive disclosure of advanced features

## User Flow (Ideal)

### Creating Content
```
1. User presses Ctrl+N (or clicks once)
2. Empty node appears, focused, ready to type
3. User types content
4. Presses Enter - content saved, new node created
5. Repeat
```

### Referencing Nodes
```
1. User types [[ or @ in any node
2. Quick search appears
3. Type to filter nodes
4. Select node (keyboard or click)
5. Node is embedded inline
6. Can edit the referenced node right there
7. Changes update everywhere the node is referenced
```

### Organizing
```
- Tags inline: #work #project
- Links inline: [[other node]]
- No need to assign zones/modules manually
- Just type and link
```

## Architecture Implications

### Module Editor Should Be:
1. **The default view** - not a separate page
2. **A canvas of node references** - drag in nodes or type [[
3. **Live editing** - click any node to edit inline
4. **Auto-organizing** - nodes tagged/linked automatically appear in relevant modules
5. **Query-based** - modules are saved queries (e.g., "all nodes tagged #work")

### Node Creation Should Be:
1. **Instant** - Ctrl+N anywhere, anytime
2. **Inline** - create while editing, no context switch
3. **No wizard** - just name and content (type can be auto-detected)
4. **Smart defaults** - inherit context (tags, parent, zone)

### Navigation Should Be:
1. **Search-first** - Ctrl+K to find anything
2. **Backlinks** - see where a node is referenced
3. **Graph view** (optional) - visualize connections
4. **Breadcrumbs** - know where you are

## Comparison to Existing Tools

| Feature | Notion | Obsidian | Nodebook Vision |
|---------|--------|----------|-----------------|
| Edit references inline | ❌ | ❌ | ✅ |
| Web app | ✅ | ❌ | ✅ |
| Fast node creation | ⚠️ | ✅ | ✅ |
| Keyboard-first | ⚠️ | ✅ | ✅ |
| Mobile-friendly | ✅ | ❌ | ✅ |
| Visual modules | ✅ | ⚠️ | ✅ |
| Reusable data | ❌ | ⚠️ | ✅ |

## Implementation Priorities

### Phase 1: Core Node Experience (MVP)
- [ ] Fast inline node creation (Ctrl+N or /)
- [ ] Inline editing anywhere
- [ ] Basic markdown support
- [ ] Simple tagging (#tag)
- [ ] Node referencing ([[node]])
- [ ] Search (Ctrl+K)

### Phase 2: Organization
- [ ] Query-based modules
- [ ] Backlinks panel
- [ ] Auto-tagging from context
- [ ] Saved views/filters

### Phase 3: Advanced
- [ ] Graph visualization
- [ ] Templates
- [ ] Block types (table, calendar, kanban)
- [ ] Collaboration

## Key Questions for Agents

### For UI Specialist:
- How to make node creation feel instant?
- What's the minimal UI for max productivity?
- Mobile vs desktop keyboard shortcuts?
- Visual feedback for references/backlinks?

### For Code Analyzer:
- Current architecture bottlenecks?
- Security concerns with inline editing?
- Performance with 1000+ nodes?
- Database query optimization for references?

### For Web App Expert:
- Best approach for inline node references?
- Real-time sync of referenced content?
- Module as saved query implementation?
- Conflict resolution for concurrent edits?

## Success Metrics

1. **Speed**: < 500ms from intent to typing
2. **Clicks**: < 5 clicks per complex task
3. **Keyboard**: 95% of actions via keyboard
4. **Mobile**: Full functionality on mobile
5. **Learning**: < 5 minutes to understand basics
