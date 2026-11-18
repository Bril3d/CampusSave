import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { authApi, getStoredToken, setStoredToken } from '../services/api';
import type { SafeUser } from '../types';

interface AuthContextValue {
  user: SafeUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<SafeUser>;
  register: (payload: {
    fullName: string;
    email: string;
    phone: string;
    password: string;
    role: 'student' | 'merchant';
  }) => Promise<SafeUser>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SafeUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      setLoading(false);
      return;
    }
    authApi
      .me()
      .then((res) => setUser(res.user))
      .catch(() => {
        setStoredToken(null);
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await authApi.login({ email, password });
    setStoredToken(res.token);
    setUser(res.user);
    return res.user;
  }, []);

  const register = useCallback(
    async (payload: {
      fullName: string;
      email: string;
      phone: string;
      password: string;
      role: 'student' | 'merchant';
    }) => {
      const res = await authApi.register(payload);
      setStoredToken(res.token);
      setUser(res.user);
      return res.user;
    },
    [],
  );

  const logout = useCallback(() => {
    setStoredToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return ctx;
}
