import db from "../config/database";
import { getPrices } from "./tickers.service";

export type Recommendation = "sell_covered_call" | "sell_csp" | "neutral";

export interface NextStepRecommendation {
  ticker: string;
  current_price: number | null;
  net_stock_delta: number;
  open_contracts_count: number;
  recommendation: Recommendation;
  rationale: string;
  is_ignored: boolean;
}

export async function getNextSteps(
  userId: number
): Promise<NextStepRecommendation[]> {
  // Get all assigned options grouped by ticker (excluding those marked ignore)
  const assignedRows = db
    .prepare(
      `SELECT
        ticker,
        SUM(stock_delta_applied) AS net_delta,
        MAX(ignore_next_steps) AS is_ignored
       FROM options
       WHERE user_id = ? AND close_reason = 'assigned'
       GROUP BY ticker`
    )
    .all(userId) as { ticker: string; net_delta: number; is_ignored: number }[];

  if (assignedRows.length === 0) return [];

  // Get open options counts per ticker (to show awareness of pending positions)
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
      const priceInfo = priceData[row.ticker] ?? null;
      const isIgnored = row.is_ignored === 1;

      let recommendation: Recommendation = "neutral";
      let rationale = "Net stock delta is 0. No action needed.";

      if (!isIgnored) {
        if (netDelta > 0) {
          recommendation = "sell_covered_call";
          rationale = `You have a net long position of +${netDelta} shares. Sell ${Math.abs(netDelta) / 100} covered call(s) to collect premium and reduce delta.`;
        } else if (netDelta < 0) {
          recommendation = "sell_csp";
          rationale = `You have a net short position of ${netDelta} shares (stock was called away). Sell ${Math.abs(netDelta) / 100} cash-secured put(s) to re-acquire shares at a target price.`;
        }
      }

      return {
        ticker: row.ticker,
        current_price: priceInfo?.price ?? null,
        net_stock_delta: netDelta,
        open_contracts_count: openCountMap[row.ticker] ?? 0,
        recommendation: isIgnored ? "neutral" : recommendation,
        rationale: isIgnored
          ? "This ticker is ignored for next steps recommendations."
          : rationale,
        is_ignored: isIgnored,
      };
    })
    .filter((r) => r.net_stock_delta !== 0 || r.is_ignored);
}
