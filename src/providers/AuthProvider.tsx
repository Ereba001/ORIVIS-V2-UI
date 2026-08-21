import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AuthContext, type AuthContextValue } from '../contexts/AuthContext';
import type { User } from '../types/user';
import type { Membership } from '../types/membership';
import { authService } from '../services/auth-service';
import { membershipService } from '../services/membership-service';
import { authTokens, isSameIdentity } from '../lib/auth';
import { createApiClient } from '../lib/api-client';

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeOrganization, setActiveOrganizationState] = useState<Membership | null>(null);
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [impersonatedOrgId, setImpersonatedOrgId] = useState<string | null>(null);
  const initialized = useRef(false);
  const userRef = useRef<User | null>(null);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  const isImpersonating = impersonatedOrgId !== null;

  const effectiveActiveOrganization = useMemo<Membership | null>(() => {
    if (!impersonatedOrgId) return activeOrganization;
    return {
      id: impersonatedOrgId,
      organizationId: impersonatedOrgId,
      userId: user?.id ?? '',
      role: 'OWNER',
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }, [impersonatedOrgId, activeOrganization, user]);

  const clearSession = useCallback(() => {
    authTokens.clearTokens();
    setUser(null);
    setMemberships([]);
    setActiveOrganizationState(null);
    setImpersonatedOrgId(null);
  }, []);

  const handleUnauthorized = useCallback(() => {
    clearSession();
  }, [clearSession]);

  const refreshAccessToken = useCallback(async (): Promise<string | null> => {
    try {
      const response = await authService.refresh();
      // Fail-safe: never adopt a refreshed identity that differs from the
      // identity this tab already holds (e.g. the httpOnly refresh cookie was
      // overwritten by a login on another tab). Returning null tears the
      // session down instead of silently switching users.
      if (!isSameIdentity(userRef.current, response.user)) {
        return null;
      }
      authTokens.setTokens(response.accessToken);
      return response.accessToken;
    } catch {
      return null;
    }
  }, []);

  const initUser = useCallback(async () => {
    try {
      const userData = await authService.me();
      setUser(userData);
      const orgs = await membershipService.getUserOrganizations(userData.id);
      setMemberships(orgs);
      const firstOrg = orgs[0];
      if (firstOrg) setActiveOrganizationState(firstOrg);
    } catch {
      clearSession();
    } finally {
      setIsLoading(false);
    }
  }, [clearSession]);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    createApiClient(
      () => authTokens.getAccessToken(),
      handleUnauthorized,
      refreshAccessToken,
    );

    if (authTokens.hasTokens()) {
      initUser();
    } else {
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const userData = await authService.me();
      setUser(userData);
      const orgs = await membershipService.getUserOrganizations(userData.id);
      setMemberships(orgs);
      setActiveOrganizationState((prev) => {
        if (!prev) return orgs[0] ?? null;
        const stillExists = orgs.find((m) => m.organizationId === prev.organizationId);
        return stillExists ?? orgs[0] ?? null;
      });
    } catch {
      authTokens.clearTokens();
      setUser(null);
      setMemberships([]);
      setActiveOrganizationState(null);
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const response = await authService.login({ email, password });
    authTokens.setTokens(response.accessToken);
    await refreshUser();
  }, [refreshUser]);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch {
    } finally {
      authTokens.clearTokens();
      setUser(null);
      setMemberships([]);
      setActiveOrganizationState(null);
    }
  }, []);

  const setActiveOrganization = useCallback((membership: Membership) => {
    setActiveOrganizationState(membership);
  }, []);

  const startImpersonation = useCallback((organizationId: string) => {
    setImpersonatedOrgId(organizationId);
  }, []);

  const stopImpersonation = useCallback(() => {
    setImpersonatedOrgId(null);
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    isLoading,
    isAuthenticated: !!user,
    activeOrganization: effectiveActiveOrganization,
    memberships,
    login,
    logout,
    refreshUser,
    setActiveOrganization,
    isImpersonating,
    impersonatedOrgId,
    startImpersonation,
    stopImpersonation,
  }), [user, isLoading, effectiveActiveOrganization, memberships, login, logout, refreshUser, setActiveOrganization, isImpersonating, impersonatedOrgId, startImpersonation, stopImpersonation]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
