import { SQL, and, or, eq, gte, lte, ilike, isNull, sql, inArray } from 'drizzle-orm';
import { nodes, nodeTags, tags } from '../db/schema';
import { db } from '../services/db';

export interface ModuleFilter {
  nodeTypes?: string[];
  tags?: string[];
  dateRange?: {
    field: 'createdAt' | 'updatedAt';
    start?: string;
    end?: string;
  };
  parentId?: string | null;
  search?: string;
  customFilters?: Record<string, any>;
}

export interface ModuleConfig {
  filters?: ModuleFilter;
  sort?: {
    field: 'createdAt' | 'updatedAt' | 'name';
    order: 'asc' | 'desc';
  };
  limit?: number;
}

/**
 * Build Drizzle query conditions from module filter config
 */
export function buildFilterConditions(userId: string, config: ModuleConfig): SQL[] {
  const conditions: SQL[] = [
    eq(nodes.userId, userId),
    isNull(nodes.deletedAt), // Exclude soft-deleted nodes
  ];

  if (!config.filters) {
    return conditions;
  }

  const { filters } = config;

  // Filter by node types
  if (filters.nodeTypes && filters.nodeTypes.length > 0) {
    conditions.push(inArray(nodes.type, filters.nodeTypes));
  }

  // Filter by parent ID
  if (filters.parentId !== undefined) {
    if (filters.parentId === null) {
      conditions.push(isNull(nodes.parentId));
    } else {
      conditions.push(eq(nodes.parentId, filters.parentId));
    }
  }

  // Filter by date range
  if (filters.dateRange) {
    const dateField = filters.dateRange.field === 'updatedAt' ? nodes.updatedAt : nodes.createdAt;

    if (filters.dateRange.start) {
      conditions.push(gte(dateField, new Date(filters.dateRange.start)));
    }

    if (filters.dateRange.end) {
      conditions.push(lte(dateField, new Date(filters.dateRange.end)));
    }
  }

  // Filter by search term
  if (filters.search && filters.search.trim().length > 0) {
    const searchTerm = filters.search.trim();
    conditions.push(
      or(
        ilike(nodes.name, `%${searchTerm}%`),
        sql`${nodes.content}::text ILIKE ${`%${searchTerm}%`}`
      )!
    );
  }

  // Custom JSONB content filters
  if (filters.customFilters) {
    Object.entries(filters.customFilters).forEach(([key, value]) => {
      if (typeof value === 'object' && value !== null) {
        // Range filters: { gte: 100 } or { lte: 500 }
        if ('gte' in value) {
          conditions.push(sql`(${nodes.content}->>${key})::numeric >= ${value.gte}`);
        }
        if ('lte' in value) {
          conditions.push(sql`(${nodes.content}->>${key})::numeric <= ${value.lte}`);
        }
        if ('eq' in value) {
          conditions.push(sql`${nodes.content}->>${key} = ${value.eq}`);
        }
      } else {
        // Simple equality filter
        conditions.push(sql`${nodes.content}->>${key} = ${value}`);
      }
    });
  }

  return conditions;
}

/**
 * Get filtered nodes for a module with tag filtering support
 */
export async function getModuleNodes(userId: string, config: ModuleConfig) {
  const conditions = buildFilterConditions(userId, config);
  const limit = Math.min(config.limit || 100, 1000);

  // Determine sort field and direction
  const sortField = config.sort?.field || 'createdAt';
  const sortOrder = config.sort?.order || 'desc';

  // If filtering by tags, use join
  if (config.filters?.tags && config.filters.tags.length > 0) {
    const tagNames = config.filters.tags;

    // Get tag IDs first
    const userTags = await db
      .select({ id: tags.id, name: tags.name })
      .from(tags)
      .where(and(
        eq(tags.userId, userId),
        inArray(tags.name, tagNames)
      ));

    if (userTags.length === 0) {
      // No matching tags found
      return [];
    }

    const tagIds = userTags.map(t => t.id);

    // Query nodes with those tags
    const results = await db
      .selectDistinct({
        id: nodes.id,
        userId: nodes.userId,
        parentId: nodes.parentId,
        name: nodes.name,
        type: nodes.type,
        color: nodes.color,
        referenceId: nodes.referenceId,
        content: nodes.content,
        metadata: nodes.metadata,
        position: nodes.position,
        version: nodes.version,
        createdAt: nodes.createdAt,
        updatedAt: nodes.updatedAt,
        deletedAt: nodes.deletedAt,
      })
      .from(nodes)
      .innerJoin(nodeTags, eq(nodes.id, nodeTags.nodeId))
      .where(and(
        ...conditions,
        inArray(nodeTags.tagId, tagIds)
      ))
      .orderBy(
        sortOrder === 'desc'
          ? sql`${sortField === 'updatedAt' ? nodes.updatedAt : sortField === 'name' ? nodes.name : nodes.createdAt} DESC`
          : sql`${sortField === 'updatedAt' ? nodes.updatedAt : sortField === 'name' ? nodes.name : nodes.createdAt} ASC`
      )
      .limit(limit);

    return results;
  }

  // Query without tag filtering
  const results = await db
    .select()
    .from(nodes)
    .where(and(...conditions))
    .orderBy(
      sortOrder === 'desc'
        ? sql`${sortField === 'updatedAt' ? nodes.updatedAt : sortField === 'name' ? nodes.name : nodes.createdAt} DESC`
        : sql`${sortField === 'updatedAt' ? nodes.updatedAt : sortField === 'name' ? nodes.name : nodes.createdAt} ASC`
    )
    .limit(limit);

  return results;
}
