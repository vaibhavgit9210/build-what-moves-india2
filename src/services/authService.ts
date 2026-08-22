/**
 * Demo authentication service. LocalStorage only — nothing is validated
 * against any government database and no identity is ever verified.
 */
import { loadJSON, saveJSON, removeKey, KEYS } from '@/lib/storage';
import { uid } from '@/lib/id';
import type { IdMethod, User } from '@/lib/types';

export async function hashPassword(password: string): Promise<string> {
  const data = new TextEncoder().encode('ncrp-demo-salt::' + password);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export function getUsers(): User[] {
  return loadJSON<User[]>(KEYS.users, []);
}

function saveUsers(users: User[]): void {
  saveJSON(KEYS.users, users);
}

export function getSessionUserId(): string | null {
  return loadJSON<string | null>(KEYS.session, null);
}

export function getCurrentUser(): User | null {
  const id = getSessionUserId();
  if (!id) return null;
  return getUsers().find((u) => u.id === id) ?? null;
}

function norm(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, '');
}

/** Find a user by any login handle: identifier, email or mobile. */
export function findUserByHandle(handle: string): User | null {
  const h = norm(handle);
  if (!h) return null;
  return (
    getUsers().find(
      (u) =>
        norm(u.identifier) === h ||
        (u.email && norm(u.email) === h) ||
        (u.mobile && norm(u.mobile) === h),
    ) ?? null
  );
}

export interface RegisterInput {
  name: string;
  idMethod: IdMethod;
  identifier: string;
  email?: string;
  mobile?: string;
  password: string;
  state?: string;
}

export type AuthResult = { ok: true; user: User } | { ok: false; error: AuthError };
export type AuthError =
  | 'handle-taken'
  | 'not-found'
  | 'wrong-password'
  | 'invalid';

export async function register(input: RegisterInput): Promise<AuthResult> {
  if (!input.name.trim() || !input.identifier.trim() || input.password.length < 8) {
    return { ok: false, error: 'invalid' };
  }
  const clash =
    findUserByHandle(input.identifier) ||
    (input.email ? findUserByHandle(input.email) : null) ||
    (input.mobile ? findUserByHandle(input.mobile) : null);
  if (clash) return { ok: false, error: 'handle-taken' };

  const user: User = {
    id: uid(),
    name: input.name.trim(),
    idMethod: input.idMethod,
    identifier: input.identifier.trim(),
    email: input.email?.trim() || undefined,
    mobile: input.mobile?.trim() || undefined,
    passwordHash: await hashPassword(input.password),
    state: input.state,
    createdAt: new Date().toISOString(),
  };
  saveUsers([...getUsers(), user]);
  saveJSON(KEYS.session, user.id);
  return { ok: true, user };
}

export async function login(handle: string, password: string): Promise<AuthResult> {
  const user = findUserByHandle(handle);
  if (!user) return { ok: false, error: 'not-found' };
  const hash = await hashPassword(password);
  if (hash !== user.passwordHash) return { ok: false, error: 'wrong-password' };
  saveJSON(KEYS.session, user.id);
  return { ok: true, user };
}

export function logout(): void {
  removeKey(KEYS.session);
}

export function updateUser(updated: User): void {
  saveUsers(getUsers().map((u) => (u.id === updated.id ? updated : u)));
}

/**
 * Demo "forgot password": there is no email/SMS in the prototype, so the
 * user proves nothing — they pick a handle and set a new password directly.
 * The UI must clearly label this as demo-only behaviour.
 */
export async function resetPassword(handle: string, newPassword: string): Promise<AuthResult> {
  const user = findUserByHandle(handle);
  if (!user) return { ok: false, error: 'not-found' };
  if (newPassword.length < 8) return { ok: false, error: 'invalid' };
  const updated = { ...user, passwordHash: await hashPassword(newPassword) };
  updateUser(updated);
  return { ok: true, user: updated };
}

/** 0..4 — used by the password strength meter. */
export function passwordStrength(pw: string): number {
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^a-zA-Z0-9]/.test(pw)) score++;
  return Math.min(4, score);
}
