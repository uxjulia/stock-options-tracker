export type OptionDirection = 'bought' | 'sold';
export type OptionType = 'call' | 'put';
export type CloseReason = 'assigned' | 'expired' | 'closed_early';

export interface OptionRow {
  id: number;
  user_id: number;
  account_id: number;
  ticker: string;
  direction: OptionDirection;
  option_type: OptionType;
  strike_price: number;
  expiration_date: string;
  quantity: number;
  premium: number;
  date_opened: string;
  date_closed: string | null;
  close_reason: CloseReason | null;
  cost_to_close: number | null;
  stock_delta_applied: number | null;
  ignore_next_steps: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface OptionWithCalculations extends OptionRow {
  account_name: string;
  breakeven: number;
  proceeds: number;
  days_open: number;
  current_price: number | null;
  price_is_manual: boolean;
  price_stale: boolean;
}
