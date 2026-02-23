import { Request, Response } from "express";
import { z } from "zod";
import {
  findUserByUsername,
  findUserById,
  verifyPassword,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  toPublicUser,
  updatePassword,
  createUser as createUserService,
  listUsers as listUsersService,
  deleteUser as deleteUserService,
  adminResetPassword as adminResetPasswordService,
  UsernameConflictError,
  SelfDeleteError,
  UserNotFoundError,
} from "../services/auth.service";
import type { AuthRequest } from "../middleware/auth";

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

export async function login(req: Request, res: Response): Promise<void> {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Username and password are required" });
    return;
  }

  const { username, password } = parsed.data;
  const user = findUserByUsername(username);

  if (!user || !(await verifyPassword(password, user.password_hash))) {
    res.status(401).json({ error: "Invalid username or password" });
    return;
  }

  const token = signAccessToken(user.id, user.username);
  const refreshToken = signRefreshToken(user.id, user.username);

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: "/api/auth/refresh",
  });

  res.json({ token, user: toPublicUser(user) });
}

export function refresh(req: Request, res: Response): void {
  const refreshToken = req.cookies?.refreshToken;
  if (!refreshToken) {
    res.status(401).json({ error: "No refresh token" });
    return;
  }

  const payload = verifyRefreshToken(refreshToken);
  if (!payload) {
    res.status(401).json({ error: "Invalid or expired refresh token" });
    return;
  }

  const user = findUserById(payload.userId);
  if (!user) {
    res.status(401).json({ error: "User not found" });
    return;
  }

  const token = signAccessToken(user.id, user.username);
  res.json({ token, user: toPublicUser(user) });
}

export function logout(_req: Request, res: Response): void {
  res.clearCookie("refreshToken", { path: "/api/auth/refresh" });
  res.status(204).end();
}

export function me(req: AuthRequest, res: Response): void {
  const user = findUserById(req.userId!);
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json({ user: toPublicUser(user) });
}

export async function changePassword(
  req: AuthRequest,
  res: Response
): Promise<void> {
  const schema = z.object({
    current_password: z.string().min(1),
    new_password: z.string().min(8),
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res
      .status(400)
      .json({
        error: "Invalid request",
        details: parsed.error.flatten().fieldErrors,
      });
    return;
  }

  const user = findUserById(req.userId!);
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  if (
    !(await verifyPassword(parsed.data.current_password, user.password_hash))
  ) {
    res.status(401).json({ error: "Current password is incorrect" });
    return;
  }

  await updatePassword(user.id, parsed.data.new_password);
  res.json({ message: "Password updated successfully" });
}

export async function createUser(
  req: AuthRequest,
  res: Response
): Promise<void> {
  const schema = z.object({
    username: z.string().min(1),
    password: z.string().min(8),
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res
      .status(400)
      .json({
        error: "Invalid request",
        details: parsed.error.flatten().fieldErrors,
      });
    return;
  }

  try {
    const user = await createUserService(
      parsed.data.username,
      parsed.data.password
    );
    res.status(201).json({ user });
  } catch (err) {
    if (err instanceof UsernameConflictError) {
      res.status(409).json({ error: "Username already exists" });
      return;
    }
    throw err;
  }
}

export function getUsers(_req: AuthRequest, res: Response): void {
  const users = listUsersService();
  res.json({ users });
}

export async function removeUser(
  req: AuthRequest,
  res: Response
): Promise<void> {
  const targetId = Number(req.params.id);
  if (!Number.isInteger(targetId)) {
    res.status(400).json({ error: "Invalid user id" });
    return;
  }
  try {
    deleteUserService(targetId, req.userId!);
    res.status(204).end();
  } catch (err) {
    if (err instanceof SelfDeleteError) {
      res.status(400).json({ error: err.message });
      return;
    }
    if (err instanceof UserNotFoundError) {
      res.status(404).json({ error: err.message });
      return;
    }
    throw err;
  }
}

export async function adminResetPassword(
  req: AuthRequest,
  res: Response
): Promise<void> {
  const targetId = Number(req.params.id);
  if (!Number.isInteger(targetId)) {
    res.status(400).json({ error: "Invalid user id" });
    return;
  }
  const schema = z.object({ new_password: z.string().min(8) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Password must be at least 8 characters" });
    return;
  }
  try {
    await adminResetPasswordService(targetId, parsed.data.new_password);
    res.json({ message: "Password reset successfully" });
  } catch (err) {
    if (err instanceof UserNotFoundError) {
      res.status(404).json({ error: err.message });
      return;
    }
    throw err;
  }
}
