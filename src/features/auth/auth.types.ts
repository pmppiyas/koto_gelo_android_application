export interface User {
  id: string;
  username: string;
  name?: string;
  email?: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface SignInPayload {
  username: string;
  password: string;
}

export interface SignUpPayload {
  username: string;
  password: string;
  name?: string;
  email?: string;
}
