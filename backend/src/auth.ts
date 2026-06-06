import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin';
const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-change-me';

if (JWT_SECRET === 'default-secret-change-me') {
  console.warn('⚠️ Using default JWT secret. Set JWT_SECRET in .env for production.');
}

export interface AuthRequest extends Request {
  user?: { username: string };
  requestId?: string;
}

export function generateToken(username: string): string {
  return jwt.sign({ username }, JWT_SECRET, { expiresIn: '24h' });
}

export function verifyToken(token: string): { username: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { username: string };
  } catch {
    return null;
  }
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;

  if (!token) {
    res.status(401).json({ error: 'Unauthorized - No token provided' });
    return;
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    res.status(401).json({ error: 'Unauthorized - Invalid token' });
    return;
  }

  req.user = decoded;
  next();
}

export function authRoutes(app: any) {
  app.post('/api/auth/login', (req: Request, res: Response) => {
    const { username, password } = req.body as { username?: string; password?: string };

    if (!username || !password) {
      res.status(400).json({ error: 'Missing username or password' });
      return;
    }

    if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const token = generateToken(username);
    res.json({ token, user: { username } });
  });

  app.get('/api/auth/me', (req: AuthRequest, res: Response) => {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;

    if (!token) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      res.status(401).json({ error: 'Invalid token' });
      return;
    }

    res.json({ user: decoded });
  });
}

export { JWT_SECRET };
