export interface PnLByAccount {
  account_id: number;
  account_name: string;
  trade_count: number;
  win_count: number;
  realized_pnl: number;
}

export interface PnLByTicker {
  ticker: string;
  trade_count: number;
  win_count: number;
  realized_pnl: number;
}

export interface MonthlyPnL {
  month: string;
  realized_pnl: number;
}

export interface PnLSummary {
  total_realized: number;
  total_trades: number;
  win_rate: number;
  by_month: MonthlyPnL[];
}
