/** Authority session state, on top of adminAuthService. Separate from AuthContext. */
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import * as adminAuthService from '@/services/adminAuthService';
import type { AdminAuthResult } from '@/services/adminAuthService';
import type { Authority } from '@/content/authorityRoster';

interface AdminAuthValue {
  authority: Authority | null;
  login: (badgeId: string, password: string) => AdminAuthResult;
  logout: () => void;
}

const AdminAuthContext = createContext<AdminAuthValue | null>(null);

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [authority, setAuthority] = useState<Authority | null>(() =>
    adminAuthService.getCurrentAuthority(),
  );

  const login = useCallback((badgeId: string, password: string) => {
    const res = adminAuthService.login(badgeId, password);
    if (res.ok) setAuthority(res.authority);
    return res;
  }, []);

  const logout = useCallback(() => {
    adminAuthService.logout();
    setAuthority(null);
  }, []);

  const value = useMemo(() => ({ authority, login, logout }), [authority, login, logout]);
  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
}

export function useAdminAuth(): AdminAuthValue {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error('useAdminAuth must be used inside AdminAuthProvider');
  return ctx;
}
