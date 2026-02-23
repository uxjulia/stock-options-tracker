import apiClient from "./client";
import type { PnLByAccount, PnLByTicker, PnLSummary } from "../types/pnl";

export async function getPnLByAccount(year?: number): Promise<PnLByAccount[]> {
  const res = await apiClient.get("/pnl/by-account", {
    params: year ? { year } : {},
  });
  return res.data;
}

export async function getPnLByTicker(params?: {
  account_id?: number;
  year?: number;
}): Promise<PnLByTicker[]> {
  const res = await apiClient.get("/pnl/by-ticker", { params });
  return res.data;
}

export async function getPnLSummary(): Promise<PnLSummary> {
  const res = await apiClient.get("/pnl/summary");
  return res.data;
}
