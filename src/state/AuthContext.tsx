/** Session state on top of authService. */
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import * as authService from '@/services/authService';
import type { AuthResult, RegisterInput } from '@/services/authService';
import type { User } from '@/lib/types';

interface AuthValue {
  user: User | null;
  login: (handle: string, password: string) => Promise<AuthResult>;
  register: (input: RegisterInput) => Promise<AuthResult>;
  logout: () => void;
  /** Re-read the current user after a profile update. */
  refresh: () => void;
}

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => authService.getCurrentUser());

  const login = useCallback(async (handle: string, password: string) => {
    const res = await authService.login(handle, password);
    if (res.ok) setUser(res.user);
    return res;
  }, []);

  const register = useCallback(async (input: RegisterInput) => {
    const res = await authService.register(input);
    if (res.ok) setUser(res.user);
    return res;
  }, []);

  const logout = useCallback(() => {
    authService.logout();
    setUser(null);
  }, []);

  const refresh = useCallback(() => setUser(authService.getCurrentUser()), []);

  const value = useMemo(() => ({ user, login, register, logout, refresh }), [user, login, register, logout, refresh]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
