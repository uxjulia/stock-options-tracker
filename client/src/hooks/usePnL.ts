import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as pnlApi from "../api/pnl";
import { clearAcknowledgedDelta, resetDelta } from "../api/tickers";

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

export function useResumeTracking() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ticker: string) => clearAcknowledgedDelta(ticker),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pnl"] });
      queryClient.invalidateQueries({ queryKey: ["next-steps"] });
    },
  });
}

export function useResetDeltaFromPnL() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ticker: string) => resetDelta(ticker),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pnl"] });
      queryClient.invalidateQueries({ queryKey: ["next-steps"] });
    },
  });
}
