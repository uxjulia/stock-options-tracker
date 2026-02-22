export type OptionDirection = 'bought' | 'sold';
export type OptionType = 'call' | 'put';
export type CloseReason = 'assigned' | 'expired' | 'closed_early';

export interface Option {
  id: number;
  user_id: number;
  account_id: number;
  account_name: string;
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
  // Calculated fields
  breakeven: number;
  proceeds: number;
  days_open: number;
  current_price: number | null;
  price_is_manual: boolean;
  price_stale: boolean;
}

export interface OptionFormData {
  account_id: number;
  ticker: string;
  direction: OptionDirection;
  option_type: OptionType;
  strike_price: number;
  expiration_date: string;
  quantity: number;
  premium: number;
  date_opened: string;
  notes?: string;
}

export interface CloseOptionData {
  close_reason: CloseReason;
  date_closed: string;
  cost_to_close?: number;
}

export interface OptionFilters {
  account_id?: number;
  ticker?: string;
  option_type?: OptionType;
  direction?: OptionDirection;
  status: 'open' | 'closed' | 'all';
  show_old: boolean;
  page: number;
  limit: number;
}

export interface OptionListResponse {
  data: Option[];
  total: number;
}
