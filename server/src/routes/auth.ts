import { Router } from 'express';
import { AuthService } from '../services/auth';
import { validate } from '../middleware/validate';
import { loginSchema, registerSchema } from '../lib/validation';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();

// Register
router.post('/register', validate(registerSchema), async (req, res) => {
  try {
    const { email, password, name } = req.body;

    const result = await AuthService.register(email, password, name);

    // Set HTTP-only cookies
    res.cookie('accessToken', result.tokens.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.cookie('refreshToken', result.tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });

    res.status(201).json({
      user: result.user,
    });
  } catch (err) {
    if (err instanceof Error) {
      if (err.message === 'User already exists') {
        return res.status(409).json({ error: 'user_exists', message: err.message });
      }
    }
    console.error('Registration error:', err);
    res.status(500).json({ error: 'server_error', message: 'Registration failed' });
  }
});

// Login
router.post('/login', validate(loginSchema), async (req, res) => {
  try {
    const { email, password } = req.body;

    const result = await AuthService.login(email, password);

    // Set HTTP-only cookies
    res.cookie('accessToken', result.tokens.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.cookie('refreshToken', result.tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });

    res.json({
      user: result.user,
    });
  } catch (err) {
    if (err instanceof Error) {
      if (err.message === 'Invalid credentials') {
        return res.status(401).json({ error: 'invalid_credentials', message: err.message });
      }
    }
    console.error('Login error:', err);
    res.status(500).json({ error: 'server_error', message: 'Login failed' });
  }
});

// Logout
router.post('/logout', (_req, res) => {
  res.clearCookie('accessToken');
  res.clearCookie('refreshToken');
  res.json({ message: 'Logged out successfully' });
});

// Refresh tokens
router.post('/refresh', async (req, res) => {
  try {
    const refreshToken = req.cookies?.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({ error: 'unauthorized', message: 'No refresh token' });
    }

    const tokens = await AuthService.refreshTokens(refreshToken);

    // Set new cookies
    res.cookie('accessToken', tokens.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    res.json({ message: 'Tokens refreshed' });
  } catch (err) {
    res.status(401).json({ error: 'invalid_token', message: 'Token refresh failed' });
  }
});

// Get current user
router.get('/me', requireAuth, async (req: AuthRequest, res) => {
  res.json({
    user: req.user,
  });
});

export default router;
