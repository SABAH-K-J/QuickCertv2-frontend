/**
 * auth.ts
 * -------
 * Central authentication state management.
 *
 * The JWT is stored in localStorage under TOKEN_KEY so it survives page
 * refreshes. All API calls read the token from here via getToken().
 *
 * No framework dependency — plain TS so it can be imported anywhere.
 */

const TOKEN_KEY = "qc_access_token";
const USER_KEY = "qc_user";

/** True only in a browser environment (not during SSR / Node.js). */
const isBrowser = typeof window !== "undefined";

export interface StoredUser {
  id: number;
  name: string;
  email: string;
}

// ── Token ────────────────────────────────────────────────────────────────

export function getToken(): string | null {
  if (!isBrowser) return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  if (!isBrowser) return;
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  if (!isBrowser) return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

// ── User ─────────────────────────────────────────────────────────────────

export function getStoredUser(): StoredUser | null {
  if (!isBrowser) return null;
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as StoredUser) : null;
  } catch {
    return null;
  }
}

export function setStoredUser(user: StoredUser): void {
  if (!isBrowser) return;
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

// ── Guards ────────────────────────────────────────────────────────────────

export function isLoggedIn(): boolean {
  return Boolean(getToken());
}

export function logout(): void {
  clearToken();
}
