import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getNextSteps } from "../api/nextsteps";
import {
  setAcknowledgedDelta,
  clearAcknowledgedDelta,
  resetDelta,
} from "../api/tickers";

export function useNextSteps() {
  return useQuery({
    queryKey: ["next-steps"],
    queryFn: getNextSteps,
    staleTime: 2 * 60 * 1000,
  });
}

export function useAcknowledgedDelta() {
  const queryClient = useQueryClient();

  const set = useMutation({
    mutationFn: ({ ticker, delta }: { ticker: string; delta: number }) =>
      setAcknowledgedDelta(ticker, delta),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["next-steps"] }),
  });

  const clear = useMutation({
    mutationFn: (ticker: string) => clearAcknowledgedDelta(ticker),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["next-steps"] }),
  });

  return {
    setDelta: set.mutate,
    clearDelta: clear.mutate,
    isPending: set.isPending || clear.isPending,
  };
}

export function useResetDelta() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ticker: string) => resetDelta(ticker),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["next-steps"] });
      queryClient.invalidateQueries({ queryKey: ["pnl"] });
    },
  });
}
