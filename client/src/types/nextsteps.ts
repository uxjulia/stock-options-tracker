export type Recommendation = 'sell_covered_call' | 'sell_csp' | 'neutral';

export interface NextStepRecommendation {
  ticker: string;
  current_price: number | null;
  net_stock_delta: number;
  open_contracts_count: number;
  recommendation: Recommendation;
  rationale: string;
  is_ignored: boolean;
}
