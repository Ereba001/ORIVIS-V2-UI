import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AuthContext, type AuthContextValue } from '../contexts/AuthContext';
import type { User } from '../types/user';
import type { Membership } from '../types/membership';
import { authService } from '../services/auth-service';
import { membershipService } from '../services/membership-service';
import { authTokens } from '../lib/auth';
import { createApiClient } from '../lib/api-client';

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeOrganization, setActiveOrganizationState] = useState<Membership | null>(null);
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    createApiClient(
      () => authTokens.getAccessToken(),
      () => { logout(); },
    );

    if (authTokens.hasTokens()) {
      initUser();
    } else {
      setIsLoading(false);
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
      authTokens.clearTokens();
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const userData = await authService.me();
      setUser(userData);
      const orgs = await membershipService.getUserOrganizations(userData.id);
      setMemberships(orgs);
    } catch {
      authTokens.clearTokens();
      setUser(null);
      setMemberships([]);
      setActiveOrganizationState(null);
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const response = await authService.login({ email, password });
    authTokens.setTokens(response.tokens.accessToken, response.tokens.refreshToken);
    await refreshUser();
  }, [refreshUser]);

  const logout = useCallback(async () => {
    try {
      const refreshToken = authTokens.getRefreshToken();
      if (refreshToken) {
        await authService.logout(refreshToken);
      }
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

  const value = useMemo<AuthContextValue>(() => ({
    user,
    isLoading,
    isAuthenticated: !!user,
    activeOrganization,
    memberships,
    login,
    logout,
    refreshUser,
    setActiveOrganization,
  }), [user, isLoading, activeOrganization, memberships, login, logout, refreshUser, setActiveOrganization]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
