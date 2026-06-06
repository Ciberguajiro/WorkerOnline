import { createContext } from 'react';

interface AuthUser {
  username: string;
}

interface AuthContextValue {
  isAuthenticated: boolean;
  user: AuthUser | null;
  token: string | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

export const AuthContext = createContext<AuthContextValue>({
  isAuthenticated: false,
  user: null,
  token: null,
  login: async () => false,
  logout: () => {},
  isLoading: true,
});
