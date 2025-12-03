import { Router } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createTagSchema, updateTagSchema } from '../lib/validation';
import { db } from '../services/db';
import { tags, nodeTags, nodes } from '../db/schema';
import { eq, and } from 'drizzle-orm';

const router = Router();

// All routes require authentication
router.use(requireAuth);

// Get all tags for the current user
router.get('/', async (req: AuthRequest, res) => {
  try {
    const userTags = await db.query.tags.findMany({
      where: eq(tags.userId, req.user!.id),
      orderBy: (tags, { asc }) => [asc(tags.name)],
    });

    res.json(userTags);
  } catch (err) {
    console.error('Error fetching tags:', err);
    res.status(500).json({ error: 'server_error', message: 'Failed to fetch tags' });
  }
});

// Get a single tag by ID
router.get('/:id', async (req: AuthRequest, res) => {
  try {
    const tag = await db.query.tags.findFirst({
      where: and(
        eq(tags.id, req.params.id),
        eq(tags.userId, req.user!.id)
      ),
    });

    if (!tag) {
      return res.status(404).json({ error: 'not_found', message: 'Tag not found' });
    }

    res.json(tag);
  } catch (err) {
    console.error('Error fetching tag:', err);
    res.status(500).json({ error: 'server_error', message: 'Failed to fetch tag' });
  }
});

// Create a new tag
router.post('/', validate(createTagSchema), async (req: AuthRequest, res) => {
  try {
    const { name, color } = req.body;

    // Check if tag with same name already exists for this user
    const existing = await db.query.tags.findFirst({
      where: and(
        eq(tags.userId, req.user!.id),
        eq(tags.name, name)
      ),
    });

    if (existing) {
      return res.status(409).json({
        error: 'tag_exists',
        message: 'A tag with this name already exists',
      });
    }

    const [newTag] = await db
      .insert(tags)
      .values({
        userId: req.user!.id,
        name,
        color,
      })
      .returning();

    res.status(201).json(newTag);
  } catch (err) {
    console.error('Error creating tag:', err);
    res.status(500).json({ error: 'server_error', message: 'Failed to create tag' });
  }
});

// Update a tag
router.patch('/:id', validate(updateTagSchema), async (req: AuthRequest, res) => {
  try {
    const { name, color } = req.body;

    // Verify tag exists and belongs to user
    const tag = await db.query.tags.findFirst({
      where: and(
        eq(tags.id, req.params.id),
        eq(tags.userId, req.user!.id)
      ),
    });

    if (!tag) {
      return res.status(404).json({ error: 'not_found', message: 'Tag not found' });
    }

    // If name is being changed, check for conflicts
    if (name && name !== tag.name) {
      const existing = await db.query.tags.findFirst({
        where: and(
          eq(tags.userId, req.user!.id),
          eq(tags.name, name)
        ),
      });

      if (existing) {
        return res.status(409).json({
          error: 'tag_exists',
          message: 'A tag with this name already exists',
        });
      }
    }

    const updates: any = {};
    if (name !== undefined) updates.name = name;
    if (color !== undefined) updates.color = color;

    const [updatedTag] = await db
      .update(tags)
      .set(updates)
      .where(eq(tags.id, req.params.id))
      .returning();

    res.json(updatedTag);
  } catch (err) {
    console.error('Error updating tag:', err);
    res.status(500).json({ error: 'server_error', message: 'Failed to update tag' });
  }
});

// Delete a tag
router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    // Verify tag exists and belongs to user
    const tag = await db.query.tags.findFirst({
      where: and(
        eq(tags.id, req.params.id),
        eq(tags.userId, req.user!.id)
      ),
    });

    if (!tag) {
      return res.status(404).json({ error: 'not_found', message: 'Tag not found' });
    }

    // Delete the tag (cascade will remove node_tags entries)
    await db.delete(tags).where(eq(tags.id, req.params.id));

    res.json({ message: 'Tag deleted successfully' });
  } catch (err) {
    console.error('Error deleting tag:', err);
    res.status(500).json({ error: 'server_error', message: 'Failed to delete tag' });
  }
});

// Add a tag to a node
router.post('/nodes/:nodeId/tags/:tagId', async (req: AuthRequest, res) => {
  try {
    // Verify node exists and belongs to user
    const node = await db.query.nodes.findFirst({
      where: and(
        eq(nodes.id, req.params.nodeId),
        eq(nodes.userId, req.user!.id)
      ),
    });

    if (!node) {
      return res.status(404).json({ error: 'not_found', message: 'Node not found' });
    }

    // Verify tag exists and belongs to user
    const tag = await db.query.tags.findFirst({
      where: and(
        eq(tags.id, req.params.tagId),
        eq(tags.userId, req.user!.id)
      ),
    });

    if (!tag) {
      return res.status(404).json({ error: 'not_found', message: 'Tag not found' });
    }

    // Check if already linked
    const existing = await db.query.nodeTags.findFirst({
      where: and(
        eq(nodeTags.nodeId, req.params.nodeId),
        eq(nodeTags.tagId, req.params.tagId)
      ),
    });

    if (existing) {
      return res.status(409).json({
        error: 'already_linked',
        message: 'Tag is already linked to this node',
      });
    }

    // Link tag to node
    await db.insert(nodeTags).values({
      nodeId: req.params.nodeId,
      tagId: req.params.tagId,
    });

    res.status(201).json({ message: 'Tag added to node successfully' });
  } catch (err) {
    console.error('Error adding tag to node:', err);
    res.status(500).json({ error: 'server_error', message: 'Failed to add tag to node' });
  }
});

// Remove a tag from a node
router.delete('/nodes/:nodeId/tags/:tagId', async (req: AuthRequest, res) => {
  try {
    // Verify node exists and belongs to user
    const node = await db.query.nodes.findFirst({
      where: and(
        eq(nodes.id, req.params.nodeId),
        eq(nodes.userId, req.user!.id)
      ),
    });

    if (!node) {
      return res.status(404).json({ error: 'not_found', message: 'Node not found' });
    }

    // Delete the link
    const result = await db
      .delete(nodeTags)
      .where(and(
        eq(nodeTags.nodeId, req.params.nodeId),
        eq(nodeTags.tagId, req.params.tagId)
      ));

    res.json({ message: 'Tag removed from node successfully' });
  } catch (err) {
    console.error('Error removing tag from node:', err);
    res.status(500).json({ error: 'server_error', message: 'Failed to remove tag from node' });
  }
});

export default router;
