export interface TickerPriceCache {
  symbol: string;
  price: number;
  is_manual_override: number; // 0 or 1
  fetched_at: string;
}

export interface PriceData {
  symbol: string;
  price: number;
  isManualOverride: boolean;
  isStale: boolean;
  fetchedAt: string;
}
