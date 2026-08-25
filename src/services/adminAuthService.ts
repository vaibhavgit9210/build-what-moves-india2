/**
 * Authority sign-in seam, the admin-side twin of authService.
 *
 * Deliberately kept apart from the citizen session: a different localStorage
 * namespace (`ncrpdemo.admin.session`), a different context, a different route
 * tree. An authority session can never read the citizen dashboard and a
 * citizen session can never read a ticket.
 *
 * The roster is static demo configuration, so credentials are compared against
 * it directly rather than hashed. In a real system this call is the seam a
 * department SSO would replace.
 */
import { loadJSON, saveJSON, removeKey, KEYS } from '@/lib/storage';
import {
  authorityByBadge,
  authorityById,
  DEMO_AUTHORITY_PASSWORD,
  type Authority,
} from '@/content/authorityRoster';

export type AdminAuthError = 'not-found' | 'wrong-password' | 'invalid';
export type AdminAuthResult =
  | { ok: true; authority: Authority }
  | { ok: false; error: AdminAuthError };

export function getCurrentAuthority(): Authority | null {
  return authorityById(loadJSON<string | undefined>(KEYS.adminSession, undefined));
}

export function login(badgeId: string, password: string): AdminAuthResult {
  if (!badgeId.trim() || !password) return { ok: false, error: 'invalid' };
  const authority = authorityByBadge(badgeId);
  if (!authority) return { ok: false, error: 'not-found' };
  if (password !== DEMO_AUTHORITY_PASSWORD) return { ok: false, error: 'wrong-password' };
  saveJSON(KEYS.adminSession, authority.id);
  return { ok: true, authority };
}

export function logout(): void {
  removeKey(KEYS.adminSession);
}
