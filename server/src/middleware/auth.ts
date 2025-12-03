import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth';
import { db } from '../services/db';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string | null;
  };
}

export async function requireAuth(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    // Get token from cookie
    const token = req.cookies?.accessToken;

    if (!token) {
      return res.status(401).json({ error: 'unauthorized', message: 'No token provided' });
    }

    // Verify token
    const payload = AuthService.verifyToken(token);

    // Get user from database
    const user = await db.query.users.findFirst({
      where: eq(users.id, payload.userId),
      columns: {
        id: true,
        email: true,
        name: true,
      },
    });

    if (!user) {
      return res.status(401).json({ error: 'unauthorized', message: 'User not found' });
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'unauthorized', message: 'Invalid token' });
  }
}

export function optionalAuth(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  const token = req.cookies?.accessToken;

  if (!token) {
    return next();
  }

  try {
    const payload = AuthService.verifyToken(token);

    db.query.users.findFirst({
      where: eq(users.id, payload.userId),
      columns: {
        id: true,
        email: true,
        name: true,
      },
    }).then(user => {
      if (user) {
        req.user = user;
      }
      next();
    });
  } catch (err) {
    next();
  }
}
