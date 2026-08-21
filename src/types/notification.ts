import type { UUID, ISO8601DateTime } from './common';

export type NotificationType =
  | 'INVITATION_RECEIVED'
  | 'INVITATION_ACCEPTED'
  | 'ROLE_CHANGED'
  | 'ELECTION_STARTED'
  | 'ELECTION_ENDED'
  | 'VOTE_CONFIRMED'
  | 'RESULT_PUBLISHED'
  | 'MEMBER_JOINED'
  | 'ACCOUNT_VERIFIED'
  | 'ORGANIZATION_APPROVED';

export interface Notification {
  id: UUID;
  userId: UUID;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  link?: string;
  createdAt: ISO8601DateTime;
}

export interface NotificationPreferences {
  email: boolean;
  push: boolean;
  inApp: boolean;
}
