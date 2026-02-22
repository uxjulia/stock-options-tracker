import db from '../config/database';
import { fetchPrices } from '../utils/yahooFinance';
import { PRICE_CACHE_TTL_MS } from '../config/constants';
import type { TickerPriceCache, PriceData } from '../models/tickerCache.model';

function isCacheFresh(fetchedAt: string): boolean {
  const fetchedTime = new Date(fetchedAt + 'Z').getTime();
  return Date.now() - fetchedTime < PRICE_CACHE_TTL_MS;
}

function rowToPriceData(row: TickerPriceCache, stale = false): PriceData {
  return {
    symbol: row.symbol,
    price: row.price,
    isManualOverride: row.is_manual_override === 1,
    isStale: stale,
    fetchedAt: row.fetched_at,
  };
}

export async function getPrices(symbols: string[]): Promise<Record<string, PriceData | null>> {
  const result: Record<string, PriceData | null> = {};
  const staleSymbols: string[] = [];

  for (const symbol of symbols) {
    const cached = db
      .prepare('SELECT * FROM ticker_price_cache WHERE symbol = ?')
      .get(symbol) as TickerPriceCache | undefined;

    if (cached) {
      if (cached.is_manual_override === 1) {
        result[symbol] = rowToPriceData(cached, false);
        continue;
      }
      if (isCacheFresh(cached.fetched_at)) {
        result[symbol] = rowToPriceData(cached, false);
        continue;
      }
      // Stale — queue for refresh but use cached value as fallback
      result[symbol] = rowToPriceData(cached, true);
      staleSymbols.push(symbol);
    } else {
      result[symbol] = null;
      staleSymbols.push(symbol);
    }
  }

  if (staleSymbols.length > 0) {
    const fetched = await fetchPrices(staleSymbols);

    const upsert = db.prepare(
      `INSERT INTO ticker_price_cache (symbol, price, is_manual_override, fetched_at)
       VALUES (?, ?, 0, datetime('now'))
       ON CONFLICT(symbol) DO UPDATE SET
         price = excluded.price,
         fetched_at = excluded.fetched_at,
         is_manual_override = 0`
    );

    for (const symbol of staleSymbols) {
      const price = fetched[symbol];
      if (price !== null && price !== undefined) {
        upsert.run(symbol, price);
        result[symbol] = {
          symbol,
          price,
          isManualOverride: false,
          isStale: false,
          fetchedAt: new Date().toISOString(),
        };
      }
      // If fetch failed, leave whatever was in result (null or stale cached value)
    }
  }

  return result;
}

export function setManualOverride(symbol: string, price: number): PriceData {
  db.prepare(
    `INSERT INTO ticker_price_cache (symbol, price, is_manual_override, fetched_at)
     VALUES (?, ?, 1, datetime('now'))
     ON CONFLICT(symbol) DO UPDATE SET
       price = excluded.price,
       is_manual_override = 1,
       fetched_at = excluded.fetched_at`
  ).run(symbol, price);

  return {
    symbol,
    price,
    isManualOverride: true,
    isStale: false,
    fetchedAt: new Date().toISOString(),
  };
}

export function clearManualOverride(symbol: string): PriceData | null {
  const existing = db
    .prepare('SELECT * FROM ticker_price_cache WHERE symbol = ?')
    .get(symbol) as TickerPriceCache | undefined;

  if (!existing) return null;

  db.prepare(
    `UPDATE ticker_price_cache
     SET is_manual_override = 0, fetched_at = datetime('1970-01-01')
     WHERE symbol = ?`
  ).run(symbol);

  return {
    symbol,
    price: existing.price,
    isManualOverride: false,
    isStale: true,
    fetchedAt: existing.fetched_at,
  };
}

export function getActiveTickersForUser(userId: number): string[] {
  const rows = db
    .prepare(
      `SELECT DISTINCT ticker FROM options WHERE user_id = ? AND date_closed IS NULL`
    )
    .all(userId) as { ticker: string }[];
  return rows.map((r) => r.ticker);
}
