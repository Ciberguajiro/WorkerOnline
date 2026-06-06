import { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContextValue';

export function useAuth() {
  return useContext(AuthContext);
}

export function authFetch(token: string, input: string, init?: RequestInit): Promise<Response> {
  return fetch(input, {
    ...init,
    headers: {
      ...init?.headers,
      Authorization: `Bearer ${token}`,
    },
  });
}
