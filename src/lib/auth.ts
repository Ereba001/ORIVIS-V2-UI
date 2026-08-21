const ACCESS_TOKEN_KEY = 'orivis_access_token';
const REFRESH_TOKEN_KEY = 'orivis_refresh_token';

/**
 * Per-tab (sessionStorage) token store.
 *
 * sessionStorage is scoped to a single tab, so signing into the platform in one
 * tab and an organization in another can no longer overwrite each other's
 * tokens. Refreshing a tab keeps that tab's own identity, and `storage` events
 * are not fired for sessionStorage, so no cross-tab listener is required.
 *
 * Tradeoff: tokens do not survive a full browser restart (a fresh tab starts
 * signed out). The backend refresh flow remains httpOnly-cookie based and
 * unchanged; this store only holds the Bearer access token used per request.
 */
function storage(): Storage | null {
  if (typeof window === 'undefined') return null;
  return window.sessionStorage;
}

export const authTokens = {
  getAccessToken: (): string | null => {
    return storage()?.getItem(ACCESS_TOKEN_KEY) ?? null;
  },

  getRefreshToken: (): string | null => {
    return storage()?.getItem(REFRESH_TOKEN_KEY) ?? null;
  },

  setTokens: (accessToken: string, refreshToken?: string | null): void => {
    const s = storage();
    if (!s) return;
    s.setItem(ACCESS_TOKEN_KEY, accessToken);
    if (refreshToken) {
      s.setItem(REFRESH_TOKEN_KEY, refreshToken);
    } else {
      s.removeItem(REFRESH_TOKEN_KEY);
    }
  },

  clearTokens: (): void => {
    const s = storage();
    if (!s) return;
    s.removeItem(ACCESS_TOKEN_KEY);
    s.removeItem(REFRESH_TOKEN_KEY);
  },

  hasTokens: (): boolean => {
    return !!authTokens.getAccessToken();
  },
};

/**
 * Identity fail-safe for the token refresh path.
 *
 * The backend refresh endpoint is driven by a browser-wide httpOnly cookie, so
 * when a different user signs in on another tab the cookie can belong to that
 * other user. This guard prevents silently adopting a different identity after
 * a refresh: the caller must verify the refreshed identity matches the identity
 * the tab already holds, otherwise the session is torn down instead of switched.
 */
export function isSameIdentity(
  current: { id: string } | null,
  refreshed: { id: string } | null,
): boolean {
  if (current === null) {
    return refreshed !== null;
  }
  return refreshed !== null && current.id === refreshed.id;
}
