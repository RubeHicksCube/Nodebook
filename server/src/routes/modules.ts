import { Router } from 'express';
import multer from 'multer';
import { AuthRequest } from '../utils/auth';

export interface Module {
  id: string;
  name: string;
  category: string;
  description: string;
  coverImage: string | null;
}

let modules: Module[] = [];
const upload = multer({ dest: 'uploads/' });

export default function moduleRoutes() {
  const router = Router();

  // list modules
  router.get('/', (_req, res) => {
    res.json(modules);
  });

  // create module
  router.post('/', upload.single('coverImage'), (req: AuthRequest, res) => {
    const { name, category, description } = req.body;
    if (!name) return res.status(400).json({ error: 'Name required' });

    const mod: Module = {
      id: 'm_' + Date.now().toString(),
      name,
      category,
      description,
      coverImage: req.file ? `/uploads/${req.file.filename}` : null
    };

    modules.push(mod);
    res.json(mod);
  });

  return router;
}
