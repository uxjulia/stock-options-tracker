import { Response } from "express";
import { z } from "zod";
import type { AuthRequest } from "../middleware/auth";
import * as accountsService from "../services/accounts.service";

export function list(req: AuthRequest, res: Response): void {
  const accounts = accountsService.listAccounts(req.userId!);
  res.json(accounts);
}

export function create(req: AuthRequest, res: Response): void {
  const schema = z.object({
    name: z.string().min(1).max(100),
    description: z.string().max(500).optional(),
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res
      .status(400)
      .json({
        error: "Validation failed",
        details: parsed.error.flatten().fieldErrors,
      });
    return;
  }

  try {
    const account = accountsService.createAccount(req.userId!, parsed.data);
    res.status(201).json(account);
  } catch (err: unknown) {
    if (err instanceof Error && err.message.includes("UNIQUE")) {
      res
        .status(409)
        .json({ error: "An account with that name already exists" });
    } else {
      throw err;
    }
  }
}

export function update(req: AuthRequest, res: Response): void {
  const schema = z.object({
    name: z.string().min(1).max(100).optional(),
    description: z.string().max(500).optional(),
    is_active: z.boolean().optional(),
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res
      .status(400)
      .json({
        error: "Validation failed",
        details: parsed.error.flatten().fieldErrors,
      });
    return;
  }

  const account = accountsService.updateAccount(
    req.userId!,
    Number(req.params.id),
    parsed.data
  );
  if (!account) {
    res.status(404).json({ error: "Account not found" });
    return;
  }

  res.json(account);
}

export function remove(req: AuthRequest, res: Response): void {
  const deleted = accountsService.deleteAccount(
    req.userId!,
    Number(req.params.id)
  );
  if (!deleted) {
    res.status(404).json({ error: "Account not found" });
    return;
  }
  res.status(204).end();
}
