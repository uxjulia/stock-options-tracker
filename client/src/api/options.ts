import apiClient from './client';
import type { Option, OptionFormData, CloseOptionData, OptionFilters, OptionListResponse } from '../types/option';

export async function listOptions(filters: Partial<OptionFilters> = {}): Promise<OptionListResponse> {
  const params: Record<string, unknown> = { ...filters };
  const res = await apiClient.get('/options', { params });
  return res.data;
}

export async function getOption(id: number): Promise<Option> {
  const res = await apiClient.get(`/options/${id}`);
  return res.data;
}

export async function createOption(data: OptionFormData): Promise<Option> {
  const res = await apiClient.post('/options', data);
  return res.data;
}

export async function updateOption(id: number, data: Partial<OptionFormData>): Promise<Option> {
  const res = await apiClient.put(`/options/${id}`, data);
  return res.data;
}

export async function closeOption(id: number, data: CloseOptionData): Promise<Option> {
  const res = await apiClient.post(`/options/${id}/close`, data);
  return res.data;
}

export async function deleteOption(id: number): Promise<void> {
  await apiClient.delete(`/options/${id}`);
}

export async function toggleIgnoreNextSteps(id: number, ignore: boolean): Promise<Option> {
  const res = await apiClient.patch(`/options/${id}/ignore-next-steps`, { ignore });
  return res.data;
}
