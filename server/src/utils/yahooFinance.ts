/**
 * Stock price fetching with a three-provider fallback chain:
 *   1. Finnhub  (primary  – real-time, 60 req/min free tier)
 *   2. Polygon  (backup   – prev-day close, 5 req/min free tier)
 *   3. Yahoo Finance (last-resort – no key required, may be rate-limited)
 *
 * Each provider is tried per-symbol; if it returns null or throws, the next
 * provider is attempted. The function always returns a value for every symbol
 * (null if all providers fail).
 */

// ---------------------------------------------------------------------------
// Finnhub
// ---------------------------------------------------------------------------

interface FinnhubQuoteResponse {
  c?: number;  // current price
  pc?: number; // previous close
}

async function fetchFinnhub(symbol: string, apiKey: string): Promise<number | null> {
  const url = `https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(symbol)}&token=${apiKey}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Finnhub HTTP ${res.status}`);
  const data = await res.json() as FinnhubQuoteResponse;
  // c === 0 means the symbol wasn't found / market closed with no data
  return data.c && data.c !== 0 ? data.c : null;
}

// ---------------------------------------------------------------------------
// Polygon.io  (previous day close — available on free tier)
// ---------------------------------------------------------------------------

interface PolygonPrevCloseResponse {
  results?: Array<{ c?: number }>;
}

async function fetchPolygon(symbol: string, apiKey: string): Promise<number | null> {
  const url = `https://api.polygon.io/v2/aggs/ticker/${encodeURIComponent(symbol)}/prev?adjusted=true&apiKey=${apiKey}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Polygon HTTP ${res.status}`);
  const data = await res.json() as PolygonPrevCloseResponse;
  return data.results?.[0]?.c ?? null;
}

// ---------------------------------------------------------------------------
// Yahoo Finance  (no key — scrapes, may 429)
// ---------------------------------------------------------------------------

type YFInstance = {
  quote: (
    symbol: string,
    queryOptions?: Record<string, unknown>,
    moduleOptions?: Record<string, unknown>
  ) => Promise<{ regularMarketPrice?: number | null } | null>;
};
type YFClass = new () => YFInstance;

let _yf: YFInstance | null = null;
async function getYF(): Promise<YFInstance> {
  if (_yf) return _yf;
  const mod = await eval("import('yahoo-finance2')") as { default: YFClass };
  _yf = new mod.default();
  return _yf;
}

async function fetchYahoo(symbol: string): Promise<number | null> {
  const yf = await getYF();
  const quote = await yf.quote(symbol, {}, { validateResult: false });
  return quote?.regularMarketPrice ?? null;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Fetch current prices for the given symbols.
 * Tries Finnhub → Polygon → Yahoo Finance in order, per symbol.
 * Returns null for any symbol where all providers fail.
 */
export async function fetchPrices(symbols: string[]): Promise<Record<string, number | null>> {
  const result: Record<string, number | null> = {};
  if (symbols.length === 0) return result;

  const finnhubKey = process.env.FINNHUB_API_KEY;
  const polygonKey = process.env.POLYGON_API_KEY;

  for (const symbol of symbols) {
    let price: number | null = null;

    // 1. Finnhub
    if (finnhubKey) {
      try {
        price = await fetchFinnhub(symbol, finnhubKey);
      } catch (err) {
        console.warn(`[Finnhub] Failed for ${symbol}:`, err instanceof Error ? err.message : err);
      }
    }

    // 2. Yahoo Finance
    if (price === null) {
      try {
        price = await fetchYahoo(symbol);
      } catch (err) {
        console.warn(`[Yahoo] Failed for ${symbol}:`, err instanceof Error ? err.message : err);
      }
    }

    // 3. Polygon
    if (price === null && polygonKey) {
      try {
        price = await fetchPolygon(symbol, polygonKey);
      } catch (err) {
        console.warn(`[Polygon] Failed for ${symbol}:`, err instanceof Error ? err.message : err);
      }
    }

    result[symbol] = price;
  }

  return result;
}
