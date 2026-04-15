import apiClient from "./client";
import type { Account } from "../types/account";

export const listAccounts = async (): Promise<Account[]> => {
  const res = await apiClient.get("/accounts");
  return res.data;
};

export const createAccount = async (data: {
  name: string;
  description?: string;
}): Promise<Account> => {
  const res = await apiClient.post("/accounts", data);
  return res.data;
};

export const updateAccount = async (
  id: number,
  data: { name?: string; description?: string; is_active?: boolean }
): Promise<Account> => {
  const res = await apiClient.put(`/accounts/${id}`, data);
  return res.data;
};

export const deleteAccount = async (id: number): Promise<void> => {
  await apiClient.delete(`/accounts/${id}`);
};
