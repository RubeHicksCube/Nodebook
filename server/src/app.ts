import express from 'express';
import cors from 'cors';
import multer from 'multer';
import authRoutes from './routes/auth';
import moduleRoutes from './routes/modules';
import explorerRoutes from './routes/explorer';

const app = express();

// middleware
app.use(cors());
app.use(express.json());

// file uploads (for cover images)
const upload = multer({ dest: 'uploads/' });
app.use('/uploads', express.static('uploads'));

// routes
app.use('/auth', authRoutes);
app.use('/modules', moduleRoutes());
app.use('/explorer', explorerRoutes);

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

export default app;
