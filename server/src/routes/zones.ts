import { Router } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { validateId } from '../middleware/validateUuid';
import {
  createZoneSchema,
  updateZoneSchema,
  reorderZoneSchema,
  batchReorderZonesSchema,
} from '../lib/validation';
import { db } from '../services/db';
import { zones, nodes } from '../db/schema';
import { eq, and, desc, inArray, asc } from 'drizzle-orm';

const router = Router();

// All routes require authentication
router.use(requireAuth);

// GET /api/zones - Get all zones for the current user
router.get('/', async (req: AuthRequest, res) => {
  try {
    const userZones = await db
      .select()
      .from(zones)
      .where(eq(zones.userId, req.user!.id))
      .orderBy(zones.position);

    res.json(userZones);
  } catch (error) {
    console.error('Error fetching zones:', error);
    res.status(500).json({ error: 'Failed to fetch zones' });
  }
});

// GET /api/zones/:id - Get a specific zone
router.get('/:id', validateId, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const [zone] = await db
      .select()
      .from(zones)
      .where(and(eq(zones.id, id), eq(zones.userId, req.user!.id)))
      .limit(1);

    if (!zone) {
      return res.status(404).json({ error: 'Zone not found' });
    }

    res.json(zone);
  } catch (error) {
    console.error('Error fetching zone:', error);
    res.status(500).json({ error: 'Failed to fetch zone' });
  }
});

// POST /api/zones - Create a new zone
router.post('/', validate(createZoneSchema), async (req: AuthRequest, res) => {
  try {
    const { name, referenceId, color, icon, isDefault } = req.body;

    const newZone = await db.transaction(async (tx) => {
      // Get the max position for ordering
      const maxPositionResult = await tx
        .select({ maxPos: zones.position })
        .from(zones)
        .where(eq(zones.userId, req.user!.id))
        .orderBy(desc(zones.position))
        .limit(1);

      const position = maxPositionResult[0]?.maxPos !== undefined
        ? maxPositionResult[0].maxPos + 1
        : 0;

      // If setting as default, unset other defaults first (in same transaction)
      if (isDefault) {
        await tx
          .update(zones)
          .set({ isDefault: false, updatedAt: new Date() })
          .where(eq(zones.userId, req.user!.id));
      }

      const [zone] = await tx
        .insert(zones)
        .values({
          userId: req.user!.id,
          name,
          referenceId,
          color,
          icon,
          position,
          isDefault: isDefault || false,
        })
        .returning();

      return zone;
    });

    res.status(201).json(newZone);
  } catch (error) {
    console.error('Error creating zone:', error);
    res.status(500).json({ error: 'Failed to create zone' });
  }
});

// PATCH /api/zones/:id - Update a zone
router.patch('/:id', validateId, validate(updateZoneSchema), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { name, color, icon, isDefault } = req.body;

    // Verify ownership first
    const [existingZone] = await db
      .select()
      .from(zones)
      .where(and(eq(zones.id, id), eq(zones.userId, req.user!.id)))
      .limit(1);

    if (!existingZone) {
      return res.status(404).json({ error: 'Zone not found' });
    }

    const updatedZone = await db.transaction(async (tx) => {
      // If setting as default, unset other defaults first (in same transaction)
      if (isDefault) {
        await tx
          .update(zones)
          .set({ isDefault: false, updatedAt: new Date() })
          .where(and(
            eq(zones.userId, req.user!.id),
            eq(zones.isDefault, true)
          ));
      }

      const [zone] = await tx
        .update(zones)
        .set({
          name,
          color,
          icon,
          isDefault,
          updatedAt: new Date(),
        })
        .where(eq(zones.id, id))
        .returning();

      return zone;
    });

    res.json(updatedZone);
  } catch (error) {
    console.error('Error updating zone:', error);
    res.status(500).json({ error: 'Failed to update zone' });
  }
});

// DELETE /api/zones/:id - Delete a zone
router.delete('/:id', validateId, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    // Verify ownership
    const [existingZone] = await db
      .select()
      .from(zones)
      .where(and(eq(zones.id, id), eq(zones.userId, req.user!.id)))
      .limit(1);

    if (!existingZone) {
      return res.status(404).json({ error: 'Zone not found' });
    }

    await db.delete(zones).where(eq(zones.id, id));

    res.json({ success: true, message: 'Zone deleted' });
  } catch (error) {
    console.error('Error deleting zone:', error);
    res.status(500).json({ error: 'Failed to delete zone' });
  }
});

// POST /api/zones/reorder - Batch reorder zones
router.post('/reorder', validate(batchReorderZonesSchema), async (req: AuthRequest, res) => {
  try {
    const { zones: zonesToReorder } = req.body;
    const zoneIds = zonesToReorder.map((z: any) => z.id);

    // Verify all zones belong to the user
    const userZones = await db
      .select({ id: zones.id })
      .from(zones)
      .where(and(
        eq(zones.userId, req.user!.id),
        inArray(zones.id, zoneIds)
      ));

    // Check if all requested zones were found
    if (userZones.length !== zoneIds.length) {
      const foundIds = new Set(userZones.map(z => z.id));
      const notFound = zoneIds.filter((id: string) => !foundIds.has(id));
      return res.status(404).json({
        error: 'One or more zones not found',
        notFound,
      });
    }

    // Update all zone positions
    await db.transaction(async (tx) => {
      for (const { id, position } of zonesToReorder) {
        await tx
          .update(zones)
          .set({ position, updatedAt: new Date() })
          .where(eq(zones.id, id));
      }
    });

    // Fetch updated zones
    const updatedZones = await db
      .select()
      .from(zones)
      .where(eq(zones.userId, req.user!.id))
      .orderBy(zones.position);

    res.json(updatedZones);
  } catch (error) {
    console.error('Error batch reordering zones:', error);
    res.status(500).json({ error: 'Failed to reorder zones' });
  }
});

// POST /api/zones/:id/reorder - Reorder a zone
router.post('/:id/reorder', validateId, validate(reorderZoneSchema), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { position } = req.body;

    // Verify ownership
    const [existingZone] = await db
      .select()
      .from(zones)
      .where(and(eq(zones.id, id), eq(zones.userId, req.user!.id)))
      .limit(1);

    if (!existingZone) {
      return res.status(404).json({ error: 'Zone not found' });
    }

    const [updatedZone] = await db
      .update(zones)
      .set({ position, updatedAt: new Date() })
      .where(eq(zones.id, id))
      .returning();

    res.json(updatedZone);
  } catch (error) {
    console.error('Error reordering zone:', error);
    res.status(500).json({ error: 'Failed to reorder zone' });
  }
});

// Note: Zones no longer have direct node relationships
// Nodes are accessed through modules, which define filters to query nodes
// Each module can filter nodes by type, tags, date ranges, etc.

export default router;
