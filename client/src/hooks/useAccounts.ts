import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as accountsApi from "../api/accounts";

export const useAccounts = () => {
  return useQuery({
    queryKey: ["accounts"],
    queryFn: accountsApi.listAccounts,
    staleTime: 2 * 60 * 1000,
  });
};

export const useCreateAccount = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: accountsApi.createAccount,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["accounts"] }),
  });
};

export const useUpdateAccount = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number;
      data: Parameters<typeof accountsApi.updateAccount>[1];
    }) => accountsApi.updateAccount(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["accounts"] }),
  });
};

export const useDeleteAccount = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: accountsApi.deleteAccount,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      queryClient.invalidateQueries({ queryKey: ["options"] });
    },
  });
};
