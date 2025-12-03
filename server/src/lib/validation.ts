import { z } from 'zod';

// Custom email validator that accepts .local and other dev TLDs
const emailSchema = z.string().min(1, 'Email is required').regex(
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  'Invalid email address'
);

// Auth schemas
export const registerSchema = z.object({
  email: emailSchema,
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(1, 'Name is required').max(255).optional(),
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

// Node schemas
export const nodeTypeSchema = z.enum([
  'root',
  'folder',
  'document',
  'paragraph',
  'image',
  'file',
  'table',
  'table-row',
  'table-cell',
  'calendar',
  'event',
  'reference',
  'widget',
]);

export const createNodeSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  type: nodeTypeSchema,
  parentId: z.string().uuid().nullable().optional(),
  positionX: z.number().int().optional(),
  positionY: z.number().int().optional(),
  referenceId: z.string().min(1).max(50).optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid hex color').optional(),
  content: z.record(z.any()).optional().default({}),
  metadata: z.record(z.any()).optional().default({}),
  tags: z.array(z.string()).optional(),
});

export const updateNodeSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
  content: z.record(z.any()).optional(),
  metadata: z.record(z.any()).optional(),
  tags: z.array(z.string()).optional(),
  positionX: z.number().int().optional(),
  positionY: z.number().int().optional(),
  version: z.number().int().positive(),
});

export const moveNodeSchema = z.object({
  parentId: z.string().uuid().nullable(),
  position: z.number().int().nonnegative().optional(),
});

export const reorderNodeSchema = z.object({
  position: z.number().int().nonnegative(),
});

// Tag schemas
export const createTagSchema = z.object({
  name: z.string().min(1).max(100),
  color: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
});

export const updateTagSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
});

// Zone schemas
export const createZoneSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  referenceId: z.string().min(1).max(50).optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid hex color').optional(),
  icon: z.string().max(50).optional(),
  isDefault: z.boolean().optional().default(false),
});

export const updateZoneSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
  icon: z.string().max(50).optional(),
  isDefault: z.boolean().optional(),
});

export const reorderZoneSchema = z.object({
  position: z.number().int().nonnegative(),
});

export const batchReorderZonesSchema = z.object({
  zones: z.array(z.object({
    id: z.string().uuid('Invalid zone ID'),
    position: z.number().int().nonnegative(),
  })).min(1, 'At least one zone is required'),
});

// Module schemas
export const moduleTypeSchema = z.enum([
  'graph',
  'table',
  'kanban',
  'text',
  'calendar',
  'gallery',
  'custom',
]);

export const createModuleSchema = z.object({
  zoneId: z.string().uuid('Invalid zone ID'),
  name: z.string().min(1, 'Name is required').max(255),
  referenceId: z.string().min(1).max(50).optional(),
  type: moduleTypeSchema,
  config: z.record(z.any()).optional().default({}),
  positionX: z.number().int().nonnegative().optional().default(0),
  positionY: z.number().int().nonnegative().optional().default(0),
  width: z.number().int().positive().optional().default(4),
  height: z.number().int().positive().optional().default(3),
});

export const updateModuleSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  type: moduleTypeSchema.optional(),
  config: z.record(z.any()).optional(),
});

export const moveModuleSchema = z.object({
  zoneId: z.string().uuid('Invalid zone ID'),
  positionX: z.number().int().nonnegative().optional(),
  positionY: z.number().int().nonnegative().optional(),
});

export const resizeModuleSchema = z.object({
  positionX: z.number().int().nonnegative().optional(),
  positionY: z.number().int().nonnegative().optional(),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
});

export const batchUpdateModuleLayoutSchema = z.object({
  modules: z.array(z.object({
    id: z.string().uuid('Invalid module ID'),
    positionX: z.number().int().nonnegative(),
    positionY: z.number().int().nonnegative(),
    width: z.number().int().positive(),
    height: z.number().int().positive(),
  })).min(1, 'At least one module is required'),
});

// Workspace schemas (deprecated - use zones)
export const createWorkspaceSchema = z.object({
  name: z.string().min(1).max(255),
  layout: z.record(z.any()).optional().default({}),
  isDefault: z.boolean().optional().default(false),
});

export const updateWorkspaceSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  layout: z.record(z.any()).optional(),
  isDefault: z.boolean().optional(),
});

// Helper type extractors
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CreateNodeInput = z.infer<typeof createNodeSchema>;
export type UpdateNodeInput = z.infer<typeof updateNodeSchema>;
export type MoveNodeInput = z.infer<typeof moveNodeSchema>;
export type ReorderNodeInput = z.infer<typeof reorderNodeSchema>;
export type CreateTagInput = z.infer<typeof createTagSchema>;
export type UpdateTagInput = z.infer<typeof updateTagSchema>;
export type CreateZoneInput = z.infer<typeof createZoneSchema>;
export type UpdateZoneInput = z.infer<typeof updateZoneSchema>;
export type ReorderZoneInput = z.infer<typeof reorderZoneSchema>;
export type CreateModuleInput = z.infer<typeof createModuleSchema>;
export type UpdateModuleInput = z.infer<typeof updateModuleSchema>;
export type MoveModuleInput = z.infer<typeof moveModuleSchema>;
export type ResizeModuleInput = z.infer<typeof resizeModuleSchema>;
export type CreateWorkspaceInput = z.infer<typeof createWorkspaceSchema>;
export type UpdateWorkspaceInput = z.infer<typeof updateWorkspaceSchema>;
