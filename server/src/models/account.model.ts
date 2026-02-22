export interface Account {
  id: number;
  user_id: number;
  name: string;
  description: string | null;
  is_active: number; // 0 or 1
  created_at: string;
  updated_at: string;
}

export interface AccountWithStats extends Account {
  trade_count: number;
  open_count: number;
  realized_pnl: number;
}
