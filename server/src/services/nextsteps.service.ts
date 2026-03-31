import db from "../config/database";
import { getPrices } from "./tickers.service";

export type Recommendation = "sell_covered_call" | "sell_csp" | "neutral";

export interface NextStepRecommendation {
  ticker: string;
  current_price: number | null;
  net_stock_delta: number;
  acknowledged_delta: number;
  effective_delta: number;
  open_contracts_count: number;
  recommendation: Recommendation;
  rationale: string;
}

export async function getNextSteps(
  userId: number
): Promise<NextStepRecommendation[]> {
  const assignedRows = db
    .prepare(
      `SELECT
        o.ticker,
        SUM(o.stock_delta_applied) - COALESCE(ts.delta_basis, 0) AS net_delta,
        COALESCE(ts.acknowledged_delta, 0) AS acknowledged_delta
       FROM options o
       LEFT JOIN ticker_settings ts ON ts.ticker = o.ticker AND ts.user_id = o.user_id
       WHERE o.user_id = ? AND o.close_reason = 'assigned'
       GROUP BY o.ticker`
    )
    .all(userId) as {
    ticker: string;
    net_delta: number;
    acknowledged_delta: number;
  }[];

  if (assignedRows.length === 0) return [];

  const openCountRows = db
    .prepare(
      `SELECT ticker, COUNT(*) AS open_count
       FROM options
       WHERE user_id = ? AND date_closed IS NULL
       GROUP BY ticker`
    )
    .all(userId) as { ticker: string; open_count: number }[];

  const openCountMap: Record<string, number> = {};
  for (const row of openCountRows) {
    openCountMap[row.ticker] = row.open_count;
  }

  const tickers = assignedRows.map((r) => r.ticker);
  const priceData = await getPrices(tickers);

  return assignedRows
    .map((row): NextStepRecommendation => {
      const netDelta = row.net_delta ?? 0;
      const acknowledgedDelta = row.acknowledged_delta ?? 0;
      const effectiveDelta = netDelta - acknowledgedDelta;
      const priceInfo = priceData[row.ticker] ?? null;

      let recommendation: Recommendation = "neutral";
      let rationale = "Net stock delta is 0. No action needed.";

      if (effectiveDelta > 0) {
        recommendation = "sell_covered_call";
        rationale = `You have +${effectiveDelta} shares above your hold target. Sell ${Math.abs(effectiveDelta) / 100} covered call(s) to reduce delta.`;
      } else if (effectiveDelta < 0) {
        recommendation = "sell_csp";
        rationale = `You have ${effectiveDelta} shares below your hold target. Sell ${Math.abs(effectiveDelta) / 100} cash-secured put(s) to re-acquire shares.`;
      }

      return {
        ticker: row.ticker,
        current_price: priceInfo?.price ?? null,
        net_stock_delta: netDelta,
        acknowledged_delta: acknowledgedDelta,
        effective_delta: effectiveDelta,
        open_contracts_count: openCountMap[row.ticker] ?? 0,
        recommendation,
        rationale,
      };
    })
    .filter((r) => r.effective_delta !== 0);
}
