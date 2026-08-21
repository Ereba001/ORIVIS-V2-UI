import type { UUID, ISO8601DateTime } from './common';
import type { MembershipRole } from './auth';

export type MembershipStatus = 'INVITED' | 'ACTIVE' | 'SUSPENDED' | 'REMOVED';

export interface Membership {
  id: UUID;
  organizationId: UUID;
  userId: UUID;
  role: MembershipRole;
  status: MembershipStatus;
  invitedBy?: string;
  invitedAt?: ISO8601DateTime;
  joinedAt?: ISO8601DateTime;
  suspendedAt?: ISO8601DateTime;
  createdAt: ISO8601DateTime;
  updatedAt: ISO8601DateTime;
}

export interface Invitation {
  id: UUID;
  organizationId: UUID;
  email: string;
  role: MembershipRole;
  invitedBy: string;
  token?: string;
  expiresAt: ISO8601DateTime;
  acceptedAt?: ISO8601DateTime;
  revokedAt?: ISO8601DateTime;
  createdAt: ISO8601DateTime;
}

export interface ChangeRoleInput {
  newRole: MembershipRole;
  changedBy: UUID;
}

export interface InviteUserInput {
  organizationId: UUID;
  email: string;
  role: MembershipRole;
  invitedBy?: string;
}

export interface AcceptInvitationInput {
  token: string;
  userId: UUID;
}
