import apiClient from "./client";

export interface PriceData {
  symbol: string;
  price: number;
  isManualOverride: boolean;
  isStale: boolean;
  fetchedAt: string;
}

export const getPrices = async (
  symbols: string[]
): Promise<Record<string, PriceData | null>> => {
  const res = await apiClient.get("/tickers/prices", {
    params: { symbols: symbols.join(",") },
  });
  return res.data;
};

export const getActivePrices = async (): Promise<
  Record<string, PriceData | null>
> => {
  const res = await apiClient.get("/tickers/active");
  return res.data;
};

export const setManualOverride = async (
  symbol: string,
  price: number
): Promise<PriceData> => {
  const res = await apiClient.post(`/tickers/${symbol}/override`, { price });
  return res.data;
};

export const clearManualOverride = async (
  symbol: string
): Promise<PriceData> => {
  const res = await apiClient.delete(`/tickers/${symbol}/override`);
  return res.data;
};

export const setAcknowledgedDelta = async (
  symbol: string,
  delta: number
): Promise<void> => {
  await apiClient.patch(`/tickers/${symbol}/acknowledged-delta`, { delta });
};

export const clearAcknowledgedDelta = async (symbol: string): Promise<void> => {
  await apiClient.delete(`/tickers/${symbol}/acknowledged-delta`);
};

export const resetDelta = async (symbol: string): Promise<void> => {
  await apiClient.post(`/tickers/${symbol}/reset-delta`);
};
