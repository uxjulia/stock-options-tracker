import apiClient from './client';
import type { User } from '../types/auth';

export async function login(username: string, password: string): Promise<{ token: string; user: User }> {
  const res = await apiClient.post('/auth/login', { username, password });
  return res.data;
}

export async function logout(): Promise<void> {
  await apiClient.post('/auth/logout');
}

export async function getMe(): Promise<User> {
  const res = await apiClient.get('/auth/me');
  return res.data.user;
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  await apiClient.put('/auth/password', {
    current_password: currentPassword,
    new_password: newPassword,
  });
}
