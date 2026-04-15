import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as optionsApi from "../api/options";
import type { OptionFilters } from "../types/option";

export const useOptions = (filters: Partial<OptionFilters> = {}) => {
  return useQuery({
    queryKey: ["options", filters],
    queryFn: () => optionsApi.listOptions(filters),
    staleTime: 60 * 1000,
  });
};

export const useOption = (id: number) => {
  return useQuery({
    queryKey: ["options", id],
    queryFn: () => optionsApi.getOption(id),
    enabled: !!id,
  });
};

export const useCreateOption = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: optionsApi.createOption,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["options"] });
      queryClient.invalidateQueries({ queryKey: ["pnl"] });
      queryClient.invalidateQueries({ queryKey: ["next-steps"] });
    },
  });
};

export const useUpdateOption = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number;
      data: Parameters<typeof optionsApi.updateOption>[1];
    }) => optionsApi.updateOption(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["options"] });
      queryClient.invalidateQueries({ queryKey: ["pnl"] });
    },
  });
};

export const useCloseOption = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number;
      data: Parameters<typeof optionsApi.closeOption>[1];
    }) => optionsApi.closeOption(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["options"] });
      queryClient.invalidateQueries({ queryKey: ["pnl"] });
      queryClient.invalidateQueries({ queryKey: ["next-steps"] });
    },
  });
};

export const useDeleteOption = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: optionsApi.deleteOption,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["options"] });
      queryClient.invalidateQueries({ queryKey: ["pnl"] });
    },
  });
};

export const useToggleIgnoreNextSteps = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ignore }: { id: number; ignore: boolean }) =>
      optionsApi.toggleIgnoreNextSteps(id, ignore),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["options"] });
      queryClient.invalidateQueries({ queryKey: ["next-steps"] });
    },
  });
};
