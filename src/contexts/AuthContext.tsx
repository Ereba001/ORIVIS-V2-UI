import { createContext } from 'react';
import type { User } from '../types/user';
import type { Membership } from '../types/membership';

export interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  activeOrganization: Membership | null;
  memberships: Membership[];
  isImpersonating: boolean;
  impersonatedOrgId: string | null;
}

export interface AuthActions {
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  setActiveOrganization: (membership: Membership) => void;
  startImpersonation: (organizationId: string) => void;
  stopImpersonation: () => void;
}

export type AuthContextValue = AuthState & AuthActions;

export const AuthContext = createContext<AuthContextValue | null>(null);
