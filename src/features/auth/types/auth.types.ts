export interface UserData {
  id: string;
  username: string;
  email?: string | null;
  phone?: string | null;
}

export interface SignInCredentials {
  username: string;
  password: string;
}

export interface SignUpCredentials {
  username: string;
  email?: string;
  phone?: string;
  password: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResult extends AuthTokens {
  user: UserData;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: AuthResult;
}
