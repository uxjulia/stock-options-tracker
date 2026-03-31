import apiClient from "./client";

export interface PriceData {
  symbol: string;
  price: number;
  isManualOverride: boolean;
  isStale: boolean;
  fetchedAt: string;
}

export async function getPrices(
  symbols: string[]
): Promise<Record<string, PriceData | null>> {
  const res = await apiClient.get("/tickers/prices", {
    params: { symbols: symbols.join(",") },
  });
  return res.data;
}

export async function getActivePrices(): Promise<
  Record<string, PriceData | null>
> {
  const res = await apiClient.get("/tickers/active");
  return res.data;
}

export async function setManualOverride(
  symbol: string,
  price: number
): Promise<PriceData> {
  const res = await apiClient.post(`/tickers/${symbol}/override`, { price });
  return res.data;
}

export async function clearManualOverride(symbol: string): Promise<PriceData> {
  const res = await apiClient.delete(`/tickers/${symbol}/override`);
  return res.data;
}

export async function setAcknowledgedDelta(
  symbol: string,
  delta: number
): Promise<void> {
  await apiClient.patch(`/tickers/${symbol}/acknowledged-delta`, { delta });
}

export async function clearAcknowledgedDelta(symbol: string): Promise<void> {
  await apiClient.delete(`/tickers/${symbol}/acknowledged-delta`);
}

export async function resetDelta(symbol: string): Promise<void> {
  await apiClient.post(`/tickers/${symbol}/reset-delta`);
}
