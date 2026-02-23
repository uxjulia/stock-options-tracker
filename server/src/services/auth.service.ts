import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import db from "../config/database";
import { env } from "../config/env";
import {
  JWT_ACCESS_EXPIRY,
  JWT_REFRESH_EXPIRY,
  BCRYPT_ROUNDS,
} from "../config/constants";
import type { User, PublicUser } from "../models/user.model";

export function findUserByUsername(username: string): User | undefined {
  return db.prepare("SELECT * FROM users WHERE username = ?").get(username) as
    | User
    | undefined;
}

export function findUserById(id: number): User | undefined {
  return db.prepare("SELECT * FROM users WHERE id = ?").get(id) as
    | User
    | undefined;
}

export async function verifyPassword(
  plain: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export function signAccessToken(userId: number, username: string): string {
  return jwt.sign({ userId, username }, env.JWT_SECRET, {
    expiresIn: JWT_ACCESS_EXPIRY,
  });
}

export function signRefreshToken(userId: number, username: string): string {
  return jwt.sign({ userId, username }, env.JWT_REFRESH_SECRET, {
    expiresIn: JWT_REFRESH_EXPIRY,
  });
}

export function verifyRefreshToken(
  token: string
): { userId: number; username: string } | null {
  try {
    return jwt.verify(token, env.JWT_REFRESH_SECRET) as {
      userId: number;
      username: string;
    };
  } catch {
    return null;
  }
}

export function toPublicUser(user: User): PublicUser {
  return { id: user.id, username: user.username, created_at: user.created_at };
}

export class UsernameConflictError extends Error {}

export async function createUser(
  username: string,
  password: string
): Promise<PublicUser> {
  const existing = db
    .prepare("SELECT id FROM users WHERE username = ?")
    .get(username);
  if (existing) throw new UsernameConflictError("Username already exists");

  const hash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  const result = db
    .prepare("INSERT INTO users (username, password_hash) VALUES (?, ?)")
    .run(username, hash);

  const newUser = db
    .prepare("SELECT * FROM users WHERE id = ?")
    .get(result.lastInsertRowid) as User;
  return toPublicUser(newUser);
}

export async function updatePassword(
  userId: number,
  newPassword: string
): Promise<void> {
  const hash = await bcrypt.hash(newPassword, 12);
  db.prepare(
    "UPDATE users SET password_hash = ?, updated_at = datetime('now') WHERE id = ?"
  ).run(hash, userId);
}

export function listUsers(): PublicUser[] {
  const rows = db
    .prepare(
      "SELECT id, username, created_at FROM users ORDER BY created_at ASC"
    )
    .all();
  return rows as PublicUser[];
}

export class SelfDeleteError extends Error {}
export class UserNotFoundError extends Error {}

export function deleteUser(targetId: number, requesterId: number): void {
  if (targetId === requesterId)
    throw new SelfDeleteError("Cannot delete your own account");
  const existing = db
    .prepare("SELECT id FROM users WHERE id = ?")
    .get(targetId);
  if (!existing) throw new UserNotFoundError("User not found");
  db.prepare("DELETE FROM users WHERE id = ?").run(targetId);
}

export async function adminResetPassword(
  targetId: number,
  newPassword: string
): Promise<void> {
  const existing = db
    .prepare("SELECT id FROM users WHERE id = ?")
    .get(targetId);
  if (!existing) throw new UserNotFoundError("User not found");
  const hash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
  db.prepare(
    "UPDATE users SET password_hash = ?, updated_at = datetime('now') WHERE id = ?"
  ).run(hash, targetId);
}
