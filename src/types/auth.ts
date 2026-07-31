import type { UUID, EmailAddress } from './common';
import type { UserStatus } from './user';

export type UserType = 'PERSON' | 'VOTER' | 'OBSERVER' | 'SYSTEM';

export type MembershipRole =
  | 'OWNER'
  | 'ADMIN'
  | 'ELECTION_MANAGER'
  | 'ELECTION_OFFICER'
  | 'FINANCE_OFFICER'
  | 'SUPPORT_OFFICER'
  | 'OBSERVER'
  | 'VOTER';

export const ROLE_HIERARCHY: MembershipRole[] = [
  'OWNER',
  'ADMIN',
  'ELECTION_MANAGER',
  'ELECTION_OFFICER',
  'FINANCE_OFFICER',
  'SUPPORT_OFFICER',
  'OBSERVER',
  'VOTER',
];

export function getHighestRole(roles: MembershipRole[]): MembershipRole | null {
  if (roles.length === 0) return null;
  for (const role of ROLE_HIERARCHY) {
    if (roles.includes(role)) return role;
  }
  return roles[0] ?? null;
}

export interface JwtPayload {
  sub: UUID;
  email: EmailAddress;
  iat?: number;
  exp?: number;
}

export interface AuthenticatedUser {
  id: UUID;
  email: EmailAddress;
  username: string;
  displayName: string;
  avatarUrl?: string;
  status: UserStatus;
  userType: UserType;
  emailVerifiedAt?: string | null;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginInput {
  email: EmailAddress;
  password: string;
}

export interface RegisterInput {
  email: EmailAddress;
  username: string;
  displayName: string;
  password: string;
}

export interface AuthResponse {
  user: AuthenticatedUser;
  tokens: AuthTokens;
}

export interface AuthStoreState {
  user: AuthenticatedUser | null;
  isAuthenticated: boolean;
  role: MembershipRole | null;
  organizationId: UUID | null;
  isLoading: boolean;
  setUser: (user: AuthenticatedUser, role?: MembershipRole, organizationId?: UUID) => void;
  clearUser: () => void;
  setLoading: (loading: boolean) => void;
}
