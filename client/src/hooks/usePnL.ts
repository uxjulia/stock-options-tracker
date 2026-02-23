import { useQuery } from "@tanstack/react-query";
import * as pnlApi from "../api/pnl";

export function usePnLSummary() {
  return useQuery({
    queryKey: ["pnl", "summary"],
    queryFn: pnlApi.getPnLSummary,
    staleTime: 2 * 60 * 1000,
  });
}

export function usePnLByAccount(year?: number) {
  return useQuery({
    queryKey: ["pnl", "by-account", year],
    queryFn: () => pnlApi.getPnLByAccount(year),
    staleTime: 2 * 60 * 1000,
  });
}

export function usePnLByTicker(params?: {
  account_id?: number;
  year?: number;
}) {
  return useQuery({
    queryKey: ["pnl", "by-ticker", params],
    queryFn: () => pnlApi.getPnLByTicker(params),
    staleTime: 2 * 60 * 1000,
  });
}
