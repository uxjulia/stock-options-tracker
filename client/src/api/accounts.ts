import apiClient from "./client";
import type { Account } from "../types/account";

export async function listAccounts(): Promise<Account[]> {
  const res = await apiClient.get("/accounts");
  return res.data;
}

export async function createAccount(data: {
  name: string;
  description?: string;
}): Promise<Account> {
  const res = await apiClient.post("/accounts", data);
  return res.data;
}

export async function updateAccount(
  id: number,
  data: { name?: string; description?: string; is_active?: boolean }
): Promise<Account> {
  const res = await apiClient.put(`/accounts/${id}`, data);
  return res.data;
}

export async function deleteAccount(id: number): Promise<void> {
  await apiClient.delete(`/accounts/${id}`);
}
