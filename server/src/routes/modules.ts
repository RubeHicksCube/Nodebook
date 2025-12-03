import { Router } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { validateId } from '../middleware/validateUuid';
import {
  createModuleSchema,
  updateModuleSchema,
  moveModuleSchema,
  resizeModuleSchema,
  batchUpdateModuleLayoutSchema,
} from '../lib/validation';
import { db } from '../services/db';
import { modules, zones } from '../db/schema';
import { eq, and, inArray } from 'drizzle-orm';
import { getModuleNodes, ModuleConfig } from '../lib/filterBuilder';

const router = Router();

// All routes require authentication
router.use(requireAuth);

// GET /api/modules?zone_id=xxx - Get all modules (optionally filtered by zone)
router.get('/', async (req: AuthRequest, res) => {
  try {
    const { zone_id } = req.query;

    let query = db
      .select()
      .from(modules)
      .where(eq(modules.userId, req.user!.id))
      .$dynamic();

    if (zone_id && typeof zone_id === 'string') {
      query = query.where(eq(modules.zoneId, zone_id));
    }

    const userModules = await query.orderBy(modules.positionY, modules.positionX);

    res.json(userModules);
  } catch (error) {
    console.error('Error fetching modules:', error);
    res.status(500).json({ error: 'Failed to fetch modules' });
  }
});

// GET /api/modules/:id - Get a specific module
router.get('/:id', validateId, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const [module] = await db
      .select()
      .from(modules)
      .where(and(eq(modules.id, id), eq(modules.userId, req.user!.id)))
      .limit(1);

    if (!module) {
      return res.status(404).json({ error: 'Module not found' });
    }

    res.json(module);
  } catch (error) {
    console.error('Error fetching module:', error);
    res.status(500).json({ error: 'Failed to fetch module' });
  }
});

// GET /api/modules/:id/nodes - Get nodes for a module based on its config/filters
router.get('/:id/nodes', validateId, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    // Get the module
    const [module] = await db
      .select()
      .from(modules)
      .where(and(eq(modules.id, id), eq(modules.userId, req.user!.id)))
      .limit(1);

    if (!module) {
      return res.status(404).json({ error: 'Module not found' });
    }

    // Get filtered nodes using module config
    const config: ModuleConfig = module.config as ModuleConfig || {};
    const moduleNodes = await getModuleNodes(req.user!.id, config);

    res.json({
      module,
      nodes: moduleNodes,
      total: moduleNodes.length,
      appliedFilters: config.filters || {},
    });
  } catch (error) {
    console.error('Error fetching module nodes:', error);
    res.status(500).json({ error: 'Failed to fetch module nodes' });
  }
});

// POST /api/modules - Create a new module
router.post('/', validate(createModuleSchema), async (req: AuthRequest, res) => {
  try {
    const {
      zoneId,
      name,
      referenceId,
      type,
      config,
      positionX,
      positionY,
      width,
      height,
    } = req.body;

    // Verify the zone exists and belongs to the user
    const [zone] = await db
      .select()
      .from(zones)
      .where(and(eq(zones.id, zoneId), eq(zones.userId, req.user!.id)))
      .limit(1);

    if (!zone) {
      return res.status(404).json({ error: 'Zone not found' });
    }

    const [newModule] = await db
      .insert(modules)
      .values({
        userId: req.user!.id,
        zoneId,
        name,
        referenceId,
        type,
        config: config || {},
        positionX: positionX || 0,
        positionY: positionY || 0,
        width: width || 4,
        height: height || 3,
      })
      .returning();

    res.status(201).json(newModule);
  } catch (error) {
    console.error('Error creating module:', error);
    res.status(500).json({ error: 'Failed to create module' });
  }
});

// PATCH /api/modules/:id - Update a module
router.patch('/:id', validateId, validate(updateModuleSchema), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { name, type, config } = req.body;

    // Verify ownership
    const [existingModule] = await db
      .select()
      .from(modules)
      .where(and(eq(modules.id, id), eq(modules.userId, req.user!.id)))
      .limit(1);

    if (!existingModule) {
      return res.status(404).json({ error: 'Module not found' });
    }

    const [updatedModule] = await db
      .update(modules)
      .set({
        name,
        type,
        config,
        updatedAt: new Date(),
      })
      .where(eq(modules.id, id))
      .returning();

    res.json(updatedModule);
  } catch (error) {
    console.error('Error updating module:', error);
    res.status(500).json({ error: 'Failed to update module' });
  }
});

// DELETE /api/modules/:id - Delete a module
router.delete('/:id', validateId, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    // Verify ownership
    const [existingModule] = await db
      .select()
      .from(modules)
      .where(and(eq(modules.id, id), eq(modules.userId, req.user!.id)))
      .limit(1);

    if (!existingModule) {
      return res.status(404).json({ error: 'Module not found' });
    }

    await db.delete(modules).where(eq(modules.id, id));

    res.json({ success: true, message: 'Module deleted' });
  } catch (error) {
    console.error('Error deleting module:', error);
    res.status(500).json({ error: 'Failed to delete module' });
  }
});

// POST /api/modules/:id/move - Move module to different zone or position
router.post('/:id/move', validateId, validate(moveModuleSchema), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { zoneId, positionX, positionY } = req.body;

    // Verify ownership
    const [existingModule] = await db
      .select()
      .from(modules)
      .where(and(eq(modules.id, id), eq(modules.userId, req.user!.id)))
      .limit(1);

    if (!existingModule) {
      return res.status(404).json({ error: 'Module not found' });
    }

    // Verify new zone exists and belongs to user
    const [zone] = await db
      .select()
      .from(zones)
      .where(and(eq(zones.id, zoneId), eq(zones.userId, req.user!.id)))
      .limit(1);

    if (!zone) {
      return res.status(404).json({ error: 'Target zone not found' });
    }

    const [updatedModule] = await db
      .update(modules)
      .set({
        zoneId,
        positionX: positionX !== undefined ? positionX : existingModule.positionX,
        positionY: positionY !== undefined ? positionY : existingModule.positionY,
        updatedAt: new Date(),
      })
      .where(eq(modules.id, id))
      .returning();

    res.json(updatedModule);
  } catch (error) {
    console.error('Error moving module:', error);
    res.status(500).json({ error: 'Failed to move module' });
  }
});

// POST /api/modules/:id/resize - Resize and/or reposition module
router.post('/:id/resize', validateId, validate(resizeModuleSchema), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { positionX, positionY, width, height } = req.body;

    // Verify ownership
    const [existingModule] = await db
      .select()
      .from(modules)
      .where(and(eq(modules.id, id), eq(modules.userId, req.user!.id)))
      .limit(1);

    if (!existingModule) {
      return res.status(404).json({ error: 'Module not found' });
    }

    const [updatedModule] = await db
      .update(modules)
      .set({
        positionX: positionX !== undefined ? positionX : existingModule.positionX,
        positionY: positionY !== undefined ? positionY : existingModule.positionY,
        width: width !== undefined ? width : existingModule.width,
        height: height !== undefined ? height : existingModule.height,
        updatedAt: new Date(),
      })
      .where(eq(modules.id, id))
      .returning();

    res.json(updatedModule);
  } catch (error) {
    console.error('Error resizing module:', error);
    res.status(500).json({ error: 'Failed to resize module' });
  }
});

// POST /api/modules/layout - Batch update module layout (positions and sizes)
router.post('/layout', validate(batchUpdateModuleLayoutSchema), async (req: AuthRequest, res) => {
  try {
    const { modules: modulesToUpdate } = req.body;
    const moduleIds = modulesToUpdate.map((m: any) => m.id);

    // Verify all modules belong to the user
    const userModules = await db
      .select({ id: modules.id })
      .from(modules)
      .where(and(
        eq(modules.userId, req.user!.id),
        inArray(modules.id, moduleIds)
      ));

    // Check if all requested modules were found
    if (userModules.length !== moduleIds.length) {
      const foundIds = new Set(userModules.map(m => m.id));
      const notFound = moduleIds.filter((id: string) => !foundIds.has(id));
      return res.status(404).json({
        error: 'One or more modules not found',
        notFound,
      });
    }

    // Update all module layouts in a transaction
    await db.transaction(async (tx) => {
      for (const { id, positionX, positionY, width, height } of modulesToUpdate) {
        await tx
          .update(modules)
          .set({
            positionX,
            positionY,
            width,
            height,
            updatedAt: new Date(),
          })
          .where(eq(modules.id, id));
      }
    });

    // Fetch updated modules
    const updatedModules = await db
      .select()
      .from(modules)
      .where(and(
        eq(modules.userId, req.user!.id),
        inArray(modules.id, moduleIds)
      ))
      .orderBy(modules.positionY, modules.positionX);

    res.json(updatedModules);
  } catch (error) {
    console.error('Error batch updating module layout:', error);
    res.status(500).json({ error: 'Failed to update module layout' });
  }
});

export default router;
