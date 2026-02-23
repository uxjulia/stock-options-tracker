import { Response } from "express";
import { z } from "zod";
import type { AuthRequest } from "../middleware/auth";
import * as optionsService from "../services/options.service";

const createSchema = z.object({
  account_id: z.number().int().positive(),
  ticker: z.string().min(1).max(10),
  direction: z.enum(["bought", "sold"]),
  option_type: z.enum(["call", "put"]),
  strike_price: z.number().positive(),
  expiration_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  quantity: z.number().int().min(1),
  premium: z.number().positive(),
  date_opened: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  notes: z.string().max(1000).optional(),
});

const updateSchema = createSchema.partial();

const closeSchema = z.object({
  close_reason: z.enum(["assigned", "expired", "closed_early"]),
  date_closed: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  cost_to_close: z.number().positive().optional(),
});

const filtersSchema = z.object({
  account_id: z.coerce.number().int().positive().optional(),
  ticker: z.string().optional(),
  option_type: z.enum(["call", "put"]).optional(),
  direction: z.enum(["bought", "sold"]).optional(),
  status: z.enum(["open", "closed", "all"]).default("open"),
  show_old: z
    .string()
    .optional()
    .transform((v) => v === "true"),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(200).default(50),
});

export async function list(req: AuthRequest, res: Response): Promise<void> {
  const parsed = filtersSchema.safeParse(req.query);
  if (!parsed.success) {
    res
      .status(400)
      .json({
        error: "Invalid query parameters",
        details: parsed.error.flatten().fieldErrors,
      });
    return;
  }

  const result = await optionsService.listOptions(req.userId!, parsed.data);
  res.json(result);
}

export async function getOne(req: AuthRequest, res: Response): Promise<void> {
  const option = await optionsService.getOption(
    req.userId!,
    Number(req.params.id)
  );
  if (!option) {
    res.status(404).json({ error: "Option not found" });
    return;
  }
  res.json(option);
}

export async function create(req: AuthRequest, res: Response): Promise<void> {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    res
      .status(400)
      .json({
        error: "Validation failed",
        details: parsed.error.flatten().fieldErrors,
      });
    return;
  }

  const option = await optionsService.createOption(req.userId!, parsed.data);
  res.status(201).json(option);
}

export async function update(req: AuthRequest, res: Response): Promise<void> {
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) {
    res
      .status(400)
      .json({
        error: "Validation failed",
        details: parsed.error.flatten().fieldErrors,
      });
    return;
  }

  const option = await optionsService.updateOption(
    req.userId!,
    Number(req.params.id),
    parsed.data
  );
  if (!option) {
    res.status(404).json({ error: "Option not found" });
    return;
  }
  res.json(option);
}

export async function close(req: AuthRequest, res: Response): Promise<void> {
  const parsed = closeSchema.safeParse(req.body);
  if (!parsed.success) {
    res
      .status(400)
      .json({
        error: "Validation failed",
        details: parsed.error.flatten().fieldErrors,
      });
    return;
  }

  const option = await optionsService.closeOption(
    req.userId!,
    Number(req.params.id),
    parsed.data
  );
  if (!option) {
    res.status(404).json({ error: "Option not found or already closed" });
    return;
  }
  res.json(option);
}

export async function remove(req: AuthRequest, res: Response): Promise<void> {
  const deleted = optionsService.deleteOption(
    req.userId!,
    Number(req.params.id)
  );
  if (!deleted) {
    res.status(404).json({ error: "Option not found" });
    return;
  }
  res.status(204).end();
}

export async function ignoreNextSteps(
  req: AuthRequest,
  res: Response
): Promise<void> {
  const parsed = z.object({ ignore: z.boolean() }).safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Missing "ignore" boolean field' });
    return;
  }

  const updated = optionsService.toggleIgnoreNextSteps(
    req.userId!,
    Number(req.params.id),
    parsed.data.ignore
  );

  if (!updated) {
    res.status(404).json({ error: "Option not found" });
    return;
  }

  const option = await optionsService.getOption(
    req.userId!,
    Number(req.params.id)
  );
  res.json(option);
}
