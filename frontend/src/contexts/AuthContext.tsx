import React, { useState, useEffect, useCallback } from 'react';
import { AuthContext } from './AuthContextValue';

interface AuthUser {
  username: string;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem('webterminal-token');
    if (savedToken) {
      verifyToken(savedToken);
    } else {
      setIsLoading(false);
    }
  }, []);

  const verifyToken = async (t: string) => {
    try {
      const res = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${t}` },
      });
      if (res.ok) {
        const data = await res.json();
        setToken(t);
        setUser(data.user);
      } else {
        localStorage.removeItem('webterminal-token');
      }
    } catch {
      localStorage.removeItem('webterminal-token');
    } finally {
      setIsLoading(false);
    }
  };

  const login = useCallback(async (username: string, password: string): Promise<boolean> => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      if (res.ok) {
        const data = await res.json();
        setToken(data.token);
        setUser(data.user);
        localStorage.setItem('webterminal-token', data.token);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('webterminal-token');
  }, []);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: !!token && !!user,
        user,
        token,
        login,
        logout,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
