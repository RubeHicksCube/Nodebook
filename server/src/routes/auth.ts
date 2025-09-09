import { Router } from 'express';
import { generateToken } from '../utils/auth';

const router = Router();

// demo login (no DB yet)
router.post('/login', (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email required' });

  const fakeUser = { id: 'u_' + Date.now().toString(), email };
  const token = generateToken(fakeUser);
  res.json({ token, user: fakeUser });
});

export default router;
