import { pgTable, uuid, varchar, text, timestamp, integer, jsonb, boolean, primaryKey, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { sql } from 'drizzle-orm';

// Users table
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  name: varchar('name', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  emailIdx: index('users_email_idx').on(table.email),
}));

// Node types
export type NodeType =
  | 'root'
  | 'folder'
  | 'document'
  | 'paragraph'
  | 'image'
  | 'file'
  | 'table'
  | 'table-row'
  | 'table-cell'
  | 'calendar'
  | 'event'
  | 'reference'
  | 'widget';

// Nodes table - core entity (atomic data units)
// Nodes exist independently - zones provide context views via module filters
export const nodes = pgTable('nodes', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  parentId: uuid('parent_id').references((): any => nodes.id, { onDelete: 'cascade' }),

  // Properties
  name: varchar('name', { length: 255 }).notNull(),
  type: varchar('type', { length: 50 }).notNull(),
  color: varchar('color', { length: 7 }), // Hex color code
  referenceId: varchar('reference_id', { length: 50 }), // e.g., "NODE-WEIGHT-001"

  // Content (flexible JSONB)
  content: jsonb('content').notNull().default({}),
  metadata: jsonb('metadata').notNull().default({}),

  // Ordering & versioning
  position: integer('position').notNull().default(0),
  version: integer('version').notNull().default(1),

  // Canvas position
  positionX: integer('position_x').notNull().default(0),
  positionY: integer('position_y').notNull().default(0),

  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'), // Soft delete
}, (table) => ({
  userIdIdx: index('nodes_user_id_idx').on(table.userId),
  parentIdIdx: index('nodes_parent_id_idx').on(table.parentId),
  typeIdx: index('nodes_type_idx').on(table.type),
  positionIdx: index('nodes_position_idx').on(table.parentId, table.position),
  userReferenceIdUnique: index('nodes_user_reference_id_unique').on(table.userId, table.referenceId).where(sql`${table.referenceId} IS NOT NULL`),
  metadataIdx: index('nodes_metadata_idx').on(table.metadata),
}));

// Tags table
export const tags = pgTable('tags', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 100 }).notNull(),
  color: varchar('color', { length: 7 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index('tags_user_id_idx').on(table.userId),
  uniqueUserTag: index('tags_user_name_unique').on(table.userId, table.name),
}));

// Node-Tags junction table (many-to-many)
export const nodeTags = pgTable('node_tags', {
  nodeId: uuid('node_id').notNull().references(() => nodes.id, { onDelete: 'cascade' }),
  tagId: uuid('tag_id').notNull().references(() => tags.id, { onDelete: 'cascade' }),
}, (table) => ({
  pk: primaryKey({ columns: [table.nodeId, table.tagId] }),
}));

// Node references (for tracking embedded nodes)
export const nodeReferences = pgTable('node_references', {
  sourceNodeId: uuid('source_node_id').notNull().references(() => nodes.id, { onDelete: 'cascade' }),
  targetNodeId: uuid('target_node_id').notNull().references(() => nodes.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  pk: primaryKey({ columns: [table.sourceNodeId, table.targetNodeId] }),
  targetIdx: index('node_references_target_idx').on(table.targetNodeId),
}));

// Zones table (categories/workspaces)
export const zones = pgTable('zones', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  referenceId: varchar('reference_id', { length: 50 }), // e.g., "ZONE-BUDGET-001"
  color: varchar('color', { length: 7 }), // Hex color code
  icon: varchar('icon', { length: 50 }), // Icon name/identifier
  position: integer('position').notNull().default(0), // Order in sidebar
  isDefault: boolean('is_default').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index('zones_user_id_idx').on(table.userId),
  userReferenceIdUnique: index('zones_user_reference_id_unique').on(table.userId, table.referenceId).where(sql`${table.referenceId} IS NOT NULL`),
}));

// Modules table (visualizations/pages)
export const modules = pgTable('modules', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  zoneId: uuid('zone_id').notNull().references(() => zones.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  referenceId: varchar('reference_id', { length: 50 }), // e.g., "MOD-NETWORTH-001"
  type: varchar('type', { length: 50 }).notNull(), // graph, table, kanban, text, calendar, etc.
  config: jsonb('config').notNull().default({}), // Visualization settings, filters, etc.

  // Grid positioning
  positionX: integer('position_x').notNull().default(0),
  positionY: integer('position_y').notNull().default(0),
  width: integer('width').notNull().default(4), // Grid units
  height: integer('height').notNull().default(3), // Grid units

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index('modules_user_id_idx').on(table.userId),
  zoneIdIdx: index('modules_zone_id_idx').on(table.zoneId),
  userReferenceIdUnique: index('modules_user_reference_id_unique').on(table.userId, table.referenceId).where(sql`${table.referenceId} IS NOT NULL`),
}));

// Keep workspaces for backward compatibility (can remove later)
export const workspaces = pgTable('workspaces', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  layout: jsonb('layout').notNull().default({}),
  isDefault: boolean('is_default').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index('workspaces_user_id_idx').on(table.userId),
}));

// Relations for Drizzle ORM
export const usersRelations = relations(users, ({ many }) => ({
  nodes: many(nodes),
  tags: many(tags),
  zones: many(zones),
  modules: many(modules),
  workspaces: many(workspaces),
}));

export const nodesRelations = relations(nodes, ({ one, many }) => ({
  user: one(users, {
    fields: [nodes.userId],
    references: [users.id],
  }),
  parent: one(nodes, {
    fields: [nodes.parentId],
    references: [nodes.id],
    relationName: 'nodeChildren',
  }),
  children: many(nodes, { relationName: 'nodeChildren' }),
  tags: many(nodeTags),
  outgoingReferences: many(nodeReferences, { relationName: 'sourceReferences' }),
  incomingReferences: many(nodeReferences, { relationName: 'targetReferences' }),
}));

export const tagsRelations = relations(tags, ({ one, many }) => ({
  user: one(users, {
    fields: [tags.userId],
    references: [users.id],
  }),
  nodes: many(nodeTags),
}));

export const nodeTagsRelations = relations(nodeTags, ({ one }) => ({
  node: one(nodes, {
    fields: [nodeTags.nodeId],
    references: [nodes.id],
  }),
  tag: one(tags, {
    fields: [nodeTags.tagId],
    references: [tags.id],
  }),
}));

export const nodeReferencesRelations = relations(nodeReferences, ({ one }) => ({
  sourceNode: one(nodes, {
    fields: [nodeReferences.sourceNodeId],
    references: [nodes.id],
    relationName: 'sourceReferences',
  }),
  targetNode: one(nodes, {
    fields: [nodeReferences.targetNodeId],
    references: [nodes.id],
    relationName: 'targetReferences',
  }),
}));

export const zonesRelations = relations(zones, ({ one, many }) => ({
  user: one(users, {
    fields: [zones.userId],
    references: [users.id],
  }),
  modules: many(modules),
}));

export const modulesRelations = relations(modules, ({ one }) => ({
  user: one(users, {
    fields: [modules.userId],
    references: [users.id],
  }),
  zone: one(zones, {
    fields: [modules.zoneId],
    references: [zones.id],
  }),
}));

export const workspacesRelations = relations(workspaces, ({ one }) => ({
  user: one(users, {
    fields: [workspaces.userId],
    references: [users.id],
  }),
}));
