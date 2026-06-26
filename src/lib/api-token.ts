/**
 * Module-level access-token holder.
 * Decouples the axios instance from next-auth so it stays importable on the
 * server and in tests. The <TokenSync/> client component keeps this in sync
 * with the active NextAuth session.
 */
let accessToken: string | null = null;
let onUnauthorized: (() => void) | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export function getAccessToken(): string | null {
  return accessToken;
}

export function setUnauthorizedHandler(fn: (() => void) | null) {
  onUnauthorized = fn;
}

export function handleUnauthorized() {
  onUnauthorized?.();
}
