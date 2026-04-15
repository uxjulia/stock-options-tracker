import apiClient from "./client";
import type { User } from "../types/auth";

export const login = async (
  username: string,
  password: string
): Promise<{ token: string; user: User }> => {
  const res = await apiClient.post("/auth/login", { username, password });
  return res.data;
};

export const logout = async (): Promise<void> => {
  await apiClient.post("/auth/logout");
};

export const getMe = async (): Promise<User> => {
  const res = await apiClient.get("/auth/me");
  return res.data.user;
};

export const changePassword = async (
  currentPassword: string,
  newPassword: string
): Promise<void> => {
  await apiClient.put("/auth/password", {
    current_password: currentPassword,
    new_password: newPassword,
  });
};

export const createUser = async (
  username: string,
  password: string
): Promise<void> => {
  await apiClient.post("/auth/users", { username, password });
};

export const listUsers = async (): Promise<User[]> => {
  const res = await apiClient.get("/auth/users");
  return res.data.users;
};

export const deleteUser = async (id: number): Promise<void> => {
  await apiClient.delete(`/auth/users/${id}`);
};

export const adminResetPassword = async (
  id: number,
  newPassword: string
): Promise<void> => {
  await apiClient.put(`/auth/users/${id}/password`, {
    new_password: newPassword,
  });
};
