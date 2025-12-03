import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import path from 'path';

// Routes
import authRouter from './routes/auth';
import nodesRouter from './routes/nodes';
import tagsRouter from './routes/tags';
import zonesRouter from './routes/zones';
import modulesRouter from './routes/modules';

const app = express();

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  message: 'Too many requests, please try again later.',
});

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());
app.use('/api/', limiter);

// Serve uploaded files
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/zones', zonesRouter);
app.use('/api/modules', modulesRouter);
app.use('/api/nodes', nodesRouter);
app.use('/api/tags', tagsRouter);

// Health check
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
  });
});

export default app;
