import { Response } from "express";
import type { AuthRequest } from "../middleware/auth";
import * as pnlService from "../services/pnl.service";

export function byAccount(req: AuthRequest, res: Response): void {
  const year = req.query.year ? Number(req.query.year) : undefined;
  const data = pnlService.getPnLByAccount(req.userId!, year);
  res.json(data);
}

export function byTicker(req: AuthRequest, res: Response): void {
  const year = req.query.year ? Number(req.query.year) : undefined;
  const accountId = req.query.account_id
    ? Number(req.query.account_id)
    : undefined;
  const data = pnlService.getPnLByTicker(req.userId!, accountId, year);
  res.json(data);
}

export function summary(req: AuthRequest, res: Response): void {
  const data = pnlService.getPnLSummary(req.userId!);
  res.json(data);
}
