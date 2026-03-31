import { Response } from "express";
import { z } from "zod";
import type { AuthRequest } from "../middleware/auth";
import * as tickersService from "../services/tickers.service";

export async function getPrices(
  req: AuthRequest,
  res: Response
): Promise<void> {
  const symbols = String(req.query.symbols ?? "")
    .split(",")
    .map((s) => s.trim().toUpperCase())
    .filter(Boolean);

  if (symbols.length === 0) {
    res.status(400).json({ error: "At least one symbol is required" });
    return;
  }

  const prices = await tickersService.getPrices(symbols);
  res.json(prices);
}

export async function getActiveTickerPrices(
  req: AuthRequest,
  res: Response
): Promise<void> {
  const tickers = tickersService.getActiveTickersForUser(req.userId!);
  if (tickers.length === 0) {
    res.json({});
    return;
  }
  const prices = await tickersService.getPrices(tickers);
  res.json(prices);
}

export function setOverride(req: AuthRequest, res: Response): void {
  const schema = z.object({ price: z.number().positive() });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'A positive "price" is required' });
    return;
  }

  const symbol = req.params.symbol.toUpperCase();
  const data = tickersService.setManualOverride(symbol, parsed.data.price);
  res.json(data);
}

export function clearOverride(req: AuthRequest, res: Response): void {
  const symbol = req.params.symbol.toUpperCase();
  const data = tickersService.clearManualOverride(symbol);
  if (!data) {
    res.status(404).json({ error: "No cached price found for symbol" });
    return;
  }
  res.json(data);
}

export function setAcknowledgedDelta(req: AuthRequest, res: Response): void {
  const parsed = z.object({ delta: z.number().int() }).safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'An integer "delta" is required' });
    return;
  }
  tickersService.setAcknowledgedDelta(
    req.userId!,
    req.params.symbol,
    parsed.data.delta
  );
  res.json({ ok: true });
}

export function clearAcknowledgedDelta(req: AuthRequest, res: Response): void {
  tickersService.clearAcknowledgedDelta(req.userId!, req.params.symbol);
  res.json({ ok: true });
}

export function resetDeltaBasis(req: AuthRequest, res: Response): void {
  tickersService.resetDeltaBasis(req.userId!, req.params.symbol);
  res.json({ ok: true });
}
