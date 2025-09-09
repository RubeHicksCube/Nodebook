import { Router } from 'express';

const router = Router();

// stubbed example endpoint
router.get('/', (_req, res) => {
  res.json({ message: 'Explorer not implemented yet' });
});

export default router;
