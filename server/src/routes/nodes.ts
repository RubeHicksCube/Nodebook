import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { validate } from '../middleware/validate';
import {
  createNodeSchema,
  updateNodeSchema,
  moveNodeSchema,
  reorderNodeSchema,
} from '../lib/validation';
import { db } from '../services/db';
import { nodes, nodeTags, tags, nodeReferences, zones } from '../db/schema';
import { eq, and, or, desc, asc, sql, isNull, ilike, inArray } from 'drizzle-orm';

const router = Router();

// Configure multer for file uploads
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    // Sanitize extension: remove path traversal attempts
    const ext = path.extname(file.originalname).replace(/\.\./g, '').substring(0, 10);
    // Sanitize basename: only allow alphanumeric, underscores, hyphens
    const basename = path.basename(file.originalname, ext)
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .substring(0, 100);
    cb(null, `${basename}-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow images and common file types
    const allowedMimes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/svg+xml',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
      'text/csv',
    ];

    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
});

// All routes require authentication
router.use(requireAuth);

// Search nodes
router.get('/search', async (req: AuthRequest, res) => {
  try {
    const { q, type, include_deleted } = req.query;

    if (!q || typeof q !== 'string') {
      return res.status(400).json({ error: 'invalid_query', message: 'Search query is required' });
    }

    const includeDeleted = include_deleted === 'true';

    // Build base conditions
    const conditions = [
      eq(nodes.userId, req.user!.id),
      or(
        ilike(nodes.name, `%${q}%`),
        sql`${nodes.content}::text ILIKE ${`%${q}%`}`
      ),
    ];

    // Exclude soft-deleted nodes unless explicitly requested
    if (!includeDeleted) {
      conditions.push(isNull(nodes.deletedAt));
    }

    let query = db
      .select()
      .from(nodes)
      .where(and(...conditions))
      .$dynamic();

    // Filter by type if provided
    if (type && typeof type === 'string') {
      query = query.where(eq(nodes.type, type));
    }

    const results = await query.orderBy(desc(nodes.updatedAt)).limit(50);

    res.json(results);
  } catch (err) {
    console.error('Error searching nodes:', err);
    res.status(500).json({ error: 'server_error', message: 'Search failed' });
  }
});

// Upload file and create image/file node
router.post('/upload', upload.single('file'), async (req: AuthRequest, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'no_file', message: 'No file uploaded' });
    }

    const { name, type, parentId, color, metadata } = req.body;

    // Validate node type
    if (type !== 'image' && type !== 'file') {
      // Clean up uploaded file
      fs.unlinkSync(req.file.path);
      return res.status(400).json({
        error: 'invalid_type',
        message: 'Upload endpoint only supports image and file node types'
      });
    }

    // Validate name
    if (!name || name.trim().length === 0) {
      // Clean up uploaded file
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: 'invalid_name', message: 'Name is required' });
    }

    // If parentId is provided, verify it belongs to the user
    if (parentId) {
      const parent = await db.query.nodes.findFirst({
        where: and(
          eq(nodes.id, parentId),
          eq(nodes.userId, req.user!.id)
        ),
      });

      if (!parent) {
        // Clean up uploaded file
        fs.unlinkSync(req.file.path);
        return res.status(404).json({ error: 'not_found', message: 'Parent node not found' });
      }
    }

    // Get the next position for this node
    const siblings = await db.query.nodes.findMany({
      where: parentId
        ? eq(nodes.parentId, parentId)
        : and(eq(nodes.userId, req.user!.id), isNull(nodes.parentId)),
      orderBy: [desc(nodes.position)],
      limit: 1,
    });

    const nextPosition = siblings.length > 0 ? siblings[0].position + 1 : 0;

    // Create node with file metadata
    const fileUrl = `/uploads/${req.file.filename}`;
    const [newNode] = await db
      .insert(nodes)
      .values({
        userId: req.user!.id,
        name: name.trim(),
        type,
        parentId: parentId || null,
        color: color || null,
        content: {
          url: fileUrl,
          filename: req.file.originalname,
          mimetype: req.file.mimetype,
          size: req.file.size,
        },
        metadata: metadata ? JSON.parse(metadata) : {},
        position: nextPosition,
      })
      .returning();

    res.status(201).json(newNode);
  } catch (err) {
    console.error('Error uploading file:', err);
    // Clean up uploaded file on error
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ error: 'server_error', message: 'Failed to upload file' });
  }
});

// Get all nodes for the current user (paginated)
router.get('/', async (req: AuthRequest, res) => {
  try {
    // Parse pagination parameters
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 200); // Max 200
    const cursor = req.query.cursor as string | undefined;
    const includeDeleted = req.query.include_deleted === 'true';

    // Build where conditions
    const conditions = [
      eq(nodes.userId, req.user!.id),
    ];

    // Exclude soft-deleted nodes unless explicitly requested
    if (!includeDeleted) {
      conditions.push(isNull(nodes.deletedAt));
    }

    // Add cursor condition if provided (for pagination)
    if (cursor) {
      conditions.push(sql`${nodes.createdAt} < (SELECT created_at FROM ${nodes} WHERE id = ${cursor})`);
    }

    const userNodes = await db.query.nodes.findMany({
      where: and(...conditions),
      orderBy: [desc(nodes.createdAt)],
      limit: limit + 1, // Fetch one extra to determine if there are more
      with: {
        tags: {
          with: {
            tag: true,
          },
        },
        parent: {
          columns: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Determine if there are more results
    const hasMore = userNodes.length > limit;
    const results = hasMore ? userNodes.slice(0, limit) : userNodes;
    const nextCursor = hasMore && results.length > 0 ? results[results.length - 1].id : null;

    res.json({
      data: results,
      pagination: {
        hasMore,
        nextCursor,
        limit,
      },
    });
  } catch (err) {
    console.error('Error fetching nodes:', err);
    res.status(500).json({ error: 'server_error', message: 'Failed to fetch nodes' });
  }
});

// Get a single node by ID
router.get('/:id', async (req: AuthRequest, res) => {
  try {
    const node = await db.query.nodes.findFirst({
      where: and(
        eq(nodes.id, req.params.id),
        eq(nodes.userId, req.user!.id)
      ),
      with: {
        tags: {
          with: {
            tag: true,
          },
        },
        parent: {
          columns: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!node) {
      return res.status(404).json({ error: 'not_found', message: 'Node not found' });
    }

    res.json(node);
  } catch (err) {
    console.error('Error fetching node:', err);
    res.status(500).json({ error: 'server_error', message: 'Failed to fetch node' });
  }
});

// Get children of a node
router.get('/:id/children', async (req: AuthRequest, res) => {
  try {
    // First verify the parent node belongs to the user
    const parentNode = await db.query.nodes.findFirst({
      where: and(
        eq(nodes.id, req.params.id),
        eq(nodes.userId, req.user!.id)
      ),
    });

    if (!parentNode) {
      return res.status(404).json({ error: 'not_found', message: 'Parent node not found' });
    }

    const children = await db.query.nodes.findMany({
      where: eq(nodes.parentId, req.params.id),
      orderBy: [asc(nodes.position), desc(nodes.createdAt)],
      with: {
        tags: {
          with: {
            tag: true,
          },
        },
      },
    });

    res.json(children);
  } catch (err) {
    console.error('Error fetching children:', err);
    res.status(500).json({ error: 'server_error', message: 'Failed to fetch children' });
  }
});

// Get all descendants of a node (recursive)
router.get('/:id/descendants', async (req: AuthRequest, res) => {
  try {
    // First verify the parent node belongs to the user
    const parentNode = await db.query.nodes.findFirst({
      where: and(
        eq(nodes.id, req.params.id),
        eq(nodes.userId, req.user!.id)
      ),
    });

    if (!parentNode) {
      return res.status(404).json({ error: 'not_found', message: 'Parent node not found' });
    }

    // Use recursive CTE to get all descendants
    const descendants = await db.execute(sql`
      WITH RECURSIVE descendants AS (
        SELECT * FROM ${nodes} WHERE ${nodes.id} = ${req.params.id}
        UNION ALL
        SELECT n.* FROM ${nodes} n
        INNER JOIN descendants d ON n.parent_id = d.id
      )
      SELECT * FROM descendants WHERE id != ${req.params.id}
      ORDER BY position ASC, created_at DESC
    `);

    res.json(descendants.rows);
  } catch (err) {
    console.error('Error fetching descendants:', err);
    res.status(500).json({ error: 'server_error', message: 'Failed to fetch descendants' });
  }
});

// Get nodes that reference this node
router.get('/:id/references', async (req: AuthRequest, res) => {
  try {
    // Verify the node belongs to the user
    const node = await db.query.nodes.findFirst({
      where: and(
        eq(nodes.id, req.params.id),
        eq(nodes.userId, req.user!.id)
      ),
    });

    if (!node) {
      return res.status(404).json({ error: 'not_found', message: 'Node not found' });
    }

    // Find all nodes that reference this one
    const references = await db
      .select({
        id: nodes.id,
        name: nodes.name,
        type: nodes.type,
        createdAt: nodeReferences.createdAt,
      })
      .from(nodeReferences)
      .innerJoin(nodes, eq(nodeReferences.sourceNodeId, nodes.id))
      .where(eq(nodeReferences.targetNodeId, req.params.id));

    res.json(references);
  } catch (err) {
    console.error('Error fetching references:', err);
    res.status(500).json({ error: 'server_error', message: 'Failed to fetch references' });
  }
});

// Create a new node
router.post('/', validate(createNodeSchema), async (req: AuthRequest, res) => {
  try {
    const { name, type, parentId, positionX, positionY, referenceId, color, content, metadata, tags: tagNames } = req.body;

    // If parentId is provided, verify it belongs to the user
    if (parentId) {
      const parent = await db.query.nodes.findFirst({
        where: and(
          eq(nodes.id, parentId),
          eq(nodes.userId, req.user!.id)
        ),
      });

      if (!parent) {
        return res.status(404).json({ error: 'not_found', message: 'Parent node not found' });
      }
    }

    // Get the next position for this node
    const siblings = await db.query.nodes.findMany({
      where: parentId
        ? eq(nodes.parentId, parentId)
        : and(eq(nodes.userId, req.user!.id), isNull(nodes.parentId)),
      orderBy: [desc(nodes.position)],
      limit: 1,
    });

    const nextPosition = siblings.length > 0 ? siblings[0].position + 1 : 0;

    // Create the node
    const [newNode] = await db
      .insert(nodes)
      .values({
        userId: req.user!.id,
        name,
        type,
        parentId: parentId || null,
        positionX: positionX || 0,
        positionY: positionY || 0,
        referenceId: referenceId || null,
        color,
        content: content || {},
        metadata: metadata || {},
        position: nextPosition,
      })
      .returning();

    // Handle tags if provided (optimized to avoid N+1 queries)
    if (tagNames && tagNames.length > 0) {
      // Fetch all existing tags in one query
      const existingTags = await db
        .select()
        .from(tags)
        .where(
          and(
            eq(tags.userId, req.user!.id),
            inArray(tags.name, tagNames)
          )
        );

      const existingTagMap = new Map(existingTags.map(t => [t.name, t]));

      // Find which tags need to be created
      const tagsToCreate = tagNames.filter((name: string) => !existingTagMap.has(name));

      // Bulk create missing tags
      if (tagsToCreate.length > 0) {
        const newTags = await db
          .insert(tags)
          .values(tagsToCreate.map((name: string) => ({
            userId: req.user!.id,
            name
          })))
          .returning();

        newTags.forEach(t => existingTagMap.set(t.name, t));
      }

      // Bulk insert node-tag relationships
      if (existingTagMap.size > 0) {
        await db.insert(nodeTags).values(
          tagNames.map((name: string) => ({
            nodeId: newNode.id,
            tagId: existingTagMap.get(name)!.id,
          }))
        );
      }
    }

    // Fetch the complete node with tags
    const completeNode = await db.query.nodes.findFirst({
      where: eq(nodes.id, newNode.id),
      with: {
        tags: {
          with: {
            tag: true,
          },
        },
      },
    });

    res.status(201).json(completeNode);
  } catch (err) {
    console.error('Error creating node:', err);
    res.status(500).json({ error: 'server_error', message: 'Failed to create node' });
  }
});

// Update a node
router.patch('/:id', validate(updateNodeSchema), async (req: AuthRequest, res) => {
  try {
    const { name, color, content, metadata, tags: tagNames, positionX, positionY, version } = req.body;

    // Verify node exists and belongs to user
    const existingNode = await db.query.nodes.findFirst({
      where: and(
        eq(nodes.id, req.params.id),
        eq(nodes.userId, req.user!.id)
      ),
    });

    if (!existingNode) {
      return res.status(404).json({ error: 'not_found', message: 'Node not found' });
    }

    // Optimistic locking check
    if (version !== existingNode.version) {
      return res.status(409).json({
        error: 'version_conflict',
        message: 'Node has been modified by another request',
        currentVersion: existingNode.version,
      });
    }

    // Update the node
    const updates: any = {
      version: existingNode.version + 1,
      updatedAt: new Date(),
    };

    if (name !== undefined) updates.name = name;
    if (color !== undefined) updates.color = color;
    if (content !== undefined) updates.content = content;
    if (metadata !== undefined) updates.metadata = metadata;
    if (positionX !== undefined) updates.positionX = positionX;
    if (positionY !== undefined) updates.positionY = positionY;

    const [updatedNode] = await db
      .update(nodes)
      .set(updates)
      .where(eq(nodes.id, req.params.id))
      .returning();

    // Handle tags if provided (optimized to avoid N+1 queries)
    if (tagNames !== undefined) {
      // Remove existing tag relationships
      await db.delete(nodeTags).where(eq(nodeTags.nodeId, req.params.id));

      // Add new tags using bulk operations
      if (tagNames.length > 0) {
        // Fetch all existing tags in one query
        const existingTags = await db
          .select()
          .from(tags)
          .where(
            and(
              eq(tags.userId, req.user!.id),
              inArray(tags.name, tagNames)
            )
          );

        const existingTagMap = new Map(existingTags.map(t => [t.name, t]));

        // Find which tags need to be created
        const tagsToCreate = tagNames.filter((name: string) => !existingTagMap.has(name));

        // Bulk create missing tags
        if (tagsToCreate.length > 0) {
          const newTags = await db
            .insert(tags)
            .values(tagsToCreate.map((name: string) => ({
              userId: req.user!.id,
              name
            })))
            .returning();

          newTags.forEach(t => existingTagMap.set(t.name, t));
        }

        // Bulk insert node-tag relationships
        if (existingTagMap.size > 0) {
          await db.insert(nodeTags).values(
            tagNames.map((name: string) => ({
              nodeId: updatedNode.id,
              tagId: existingTagMap.get(name)!.id,
            }))
          );
        }
      }
    }

    // Fetch complete node with tags
    const completeNode = await db.query.nodes.findFirst({
      where: eq(nodes.id, updatedNode.id),
      with: {
        tags: {
          with: {
            tag: true,
          },
        },
      },
    });

    res.json(completeNode);
  } catch (err) {
    console.error('Error updating node:', err);
    res.status(500).json({ error: 'server_error', message: 'Failed to update node' });
  }
});

// Delete a node (cascades to children)
router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    // Verify node exists and belongs to user
    const node = await db.query.nodes.findFirst({
      where: and(
        eq(nodes.id, req.params.id),
        eq(nodes.userId, req.user!.id)
      ),
    });

    if (!node) {
      return res.status(404).json({ error: 'not_found', message: 'Node not found' });
    }

    // Delete the node (cascade will handle children, tags, references)
    await db.delete(nodes).where(eq(nodes.id, req.params.id));

    res.json({ message: 'Node deleted successfully' });
  } catch (err) {
    console.error('Error deleting node:', err);
    res.status(500).json({ error: 'server_error', message: 'Failed to delete node' });
  }
});

// Move a node to a new parent
router.post('/:id/move', validate(moveNodeSchema), async (req: AuthRequest, res) => {
  try {
    const { parentId, position } = req.body;

    // Verify node exists and belongs to user
    const node = await db.query.nodes.findFirst({
      where: and(
        eq(nodes.id, req.params.id),
        eq(nodes.userId, req.user!.id)
      ),
    });

    if (!node) {
      return res.status(404).json({ error: 'not_found', message: 'Node not found' });
    }

    // If parentId is provided, verify it belongs to user and isn't a descendant
    if (parentId) {
      const parent = await db.query.nodes.findFirst({
        where: and(
          eq(nodes.id, parentId),
          eq(nodes.userId, req.user!.id)
        ),
      });

      if (!parent) {
        return res.status(404).json({ error: 'not_found', message: 'Parent node not found' });
      }

      // Prevent moving a node into its own descendant (would create cycle)
      const descendants = await db.execute(sql`
        WITH RECURSIVE descendants AS (
          SELECT id FROM ${nodes} WHERE id = ${req.params.id}
          UNION ALL
          SELECT n.id FROM ${nodes} n
          INNER JOIN descendants d ON n.parent_id = d.id
        )
        SELECT id FROM descendants WHERE id = ${parentId}
      `);

      if (descendants.rows.length > 0) {
        return res.status(400).json({
          error: 'invalid_operation',
          message: 'Cannot move a node into its own descendant',
        });
      }
    }

    // Calculate new position if not provided
    let newPosition = position;
    if (newPosition === undefined) {
      const siblings = await db.query.nodes.findMany({
        where: parentId
          ? eq(nodes.parentId, parentId)
          : isNull(nodes.parentId),
        orderBy: [desc(nodes.position)],
        limit: 1,
      });
      newPosition = siblings.length > 0 ? siblings[0].position + 1 : 0;
    }

    // Update the node
    const [updatedNode] = await db
      .update(nodes)
      .set({
        parentId: parentId || null,
        position: newPosition,
        version: node.version + 1,
        updatedAt: new Date(),
      })
      .where(eq(nodes.id, req.params.id))
      .returning();

    res.json(updatedNode);
  } catch (err) {
    console.error('Error moving node:', err);
    res.status(500).json({ error: 'server_error', message: 'Failed to move node' });
  }
});

// Reorder a node within its parent
router.post('/:id/reorder', validate(reorderNodeSchema), async (req: AuthRequest, res) => {
  try {
    const { position: newPosition } = req.body;

    // Verify node exists and belongs to user
    const node = await db.query.nodes.findFirst({
      where: and(
        eq(nodes.id, req.params.id),
        eq(nodes.userId, req.user!.id)
      ),
    });

    if (!node) {
      return res.status(404).json({ error: 'not_found', message: 'Node not found' });
    }

    // Update the position
    const [updatedNode] = await db
      .update(nodes)
      .set({
        position: newPosition,
        version: node.version + 1,
        updatedAt: new Date(),
      })
      .where(eq(nodes.id, req.params.id))
      .returning();

    res.json(updatedNode);
  } catch (err) {
    console.error('Error reordering node:', err);
    res.status(500).json({ error: 'server_error', message: 'Failed to reorder node' });
  }
});

export default router;
