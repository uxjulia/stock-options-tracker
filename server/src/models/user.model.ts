export interface User {
  id: number;
  username: string;
  password_hash: string;
  created_at: string;
  updated_at: string;
}

export interface PublicUser {
  id: number;
  username: string;
  created_at: string;
}
