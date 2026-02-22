export interface User {
  id: number;
  username: string;
  created_at: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
}
