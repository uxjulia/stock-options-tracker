import apiClient from "./client";
import type { PnLByAccount, PnLByTicker, PnLSummary } from "../types/pnl";

export const getPnL = async (year?: number): Promise<PnLByAccount[]> => {
  const res = await apiClient.get("/pnl/by-account", {
    params: year ? { year } : {},
  });
  return res.data;
};

export const getPnLByTicker = async (params?: {
  account_id?: number;
  year?: number;
}): Promise<PnLByTicker[]> => {
  const res = await apiClient.get("/pnl/by-ticker", { params });
  return res.data;
};

export const getPnLSummary = async (): Promise<PnLSummary> => {
  const res = await apiClient.get("/pnl/summary");
  return res.data;
};
