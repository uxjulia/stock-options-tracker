import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../config/database';
import { env } from '../config/env';
import { JWT_ACCESS_EXPIRY, JWT_REFRESH_EXPIRY } from '../config/constants';
import type { User, PublicUser } from '../models/user.model';

export function findUserByUsername(username: string): User | undefined {
  return db.prepare('SELECT * FROM users WHERE username = ?').get(username) as User | undefined;
}

export function findUserById(id: number): User | undefined {
  return db.prepare('SELECT * FROM users WHERE id = ?').get(id) as User | undefined;
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export function signAccessToken(userId: number, username: string): string {
  return jwt.sign({ userId, username }, env.JWT_SECRET, { expiresIn: JWT_ACCESS_EXPIRY });
}

export function signRefreshToken(userId: number, username: string): string {
  return jwt.sign({ userId, username }, env.JWT_REFRESH_SECRET, { expiresIn: JWT_REFRESH_EXPIRY });
}

export function verifyRefreshToken(token: string): { userId: number; username: string } | null {
  try {
    return jwt.verify(token, env.JWT_REFRESH_SECRET) as { userId: number; username: string };
  } catch {
    return null;
  }
}

export function toPublicUser(user: User): PublicUser {
  return { id: user.id, username: user.username, created_at: user.created_at };
}

export async function updatePassword(userId: number, newPassword: string): Promise<void> {
  const hash = await bcrypt.hash(newPassword, 12);
  db.prepare('UPDATE users SET password_hash = ?, updated_at = datetime(\'now\') WHERE id = ?').run(
    hash,
    userId
  );
}
