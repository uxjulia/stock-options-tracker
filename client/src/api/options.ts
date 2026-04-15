import apiClient from "./client";
import type {
  Option,
  OptionFormData,
  CloseOptionData,
  OptionFilters,
  OptionListResponse,
} from "../types/option";

export const listOptions = async (
  filters: Partial<OptionFilters> = {}
): Promise<OptionListResponse> => {
  const params: Record<string, unknown> = { ...filters };
  const res = await apiClient.get("/options", { params });
  return res.data;
};

export const getOption = async (id: number): Promise<Option> => {
  const res = await apiClient.get(`/options/${id}`);
  return res.data;
};

export const createOption = async (data: OptionFormData): Promise<Option> => {
  const res = await apiClient.post("/options", data);
  return res.data;
};

export const updateOption = async (
  id: number,
  data: Partial<OptionFormData>
): Promise<Option> => {
  const res = await apiClient.put(`/options/${id}`, data);
  return res.data;
};

export const closeOption = async (
  id: number,
  data: CloseOptionData
): Promise<Option> => {
  const res = await apiClient.post(`/options/${id}/close`, data);
  return res.data;
};

export const deleteOption = async (id: number): Promise<void> => {
  await apiClient.delete(`/options/${id}`);
};

export const toggleIgnoreNextSteps = async (
  id: number,
  ignore: boolean
): Promise<Option> => {
  const res = await apiClient.patch(`/options/${id}/ignore-next-steps`, {
    ignore,
  });
  return res.data;
};
