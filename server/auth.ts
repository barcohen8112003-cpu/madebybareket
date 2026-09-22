import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';

const JWT_SECRET =
  process.env.SESSION_SECRET ||
  process.env.JWT_SECRET ||
  'madebybareket_secret_key_123!';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

export function generateToken(payload: object): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${body}`).digest('base64url');
  return `${header}.${body}.${signature}`;
}

export function verifyToken(token: string): any {
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [header, body, signature] = parts;
  const expectedSignature = crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${body}`).digest('base64url');
  if (signature !== expectedSignature) return null;
  try {
    return JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
  } catch {
    return null;
  }
}

export function checkAdminPassword(password: string): boolean {
  return password === ADMIN_PASSWORD;
}

export interface AuthenticatedRequest extends Request {
  user?: any;
}

export function authenticateJWT(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }
  const token = authHeader.split(' ')[1];
  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(403).json({ error: 'Invalid or expired token.' });
  }
  req.user = decoded;
  next();
}
