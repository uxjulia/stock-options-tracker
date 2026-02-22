export interface Account {
  id: number;
  user_id: number;
  name: string;
  description: string | null;
  is_active: number;
  created_at: string;
  updated_at: string;
  trade_count: number;
  open_count: number;
  realized_pnl: number;
}
