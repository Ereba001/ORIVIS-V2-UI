import type { UUID, ISO8601DateTime } from './common';
import type { UserType } from './auth';

export type UserStatus = 'INVITED' | 'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'LOCKED' | 'ARCHIVED';
export type UserLifecycleState = 'REGISTERED' | 'VERIFIED' | 'ACTIVE' | 'SUSPENDED' | 'LOCKED' | 'ARCHIVED';
export type UserTheme = 'LIGHT' | 'DARK' | 'SYSTEM';

export interface User {
  id: UUID;
  email: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  status: UserStatus;
  userType: UserType;
  lifecycleState: UserLifecycleState;
  theme: UserTheme;
  emailVerifiedAt?: ISO8601DateTime | null;
  lastLoginAt?: ISO8601DateTime;
  createdAt: ISO8601DateTime;
  updatedAt: ISO8601DateTime;
}

export interface UserProfile {
  displayName: string;
  bio?: string;
  phone?: string;
  location?: string;
  department?: string;
  avatarUrl?: string;
}

export interface UserPreferences {
  emailNotifications: boolean;
  smsNotifications: boolean;
  locale: string;
  timezone: string;
}

export interface CreateUserInput {
  email: string;
  username: string;
  displayName: string;
  password: string;
}

export interface UpdateUserInput {
  email?: string;
  username?: string;
  displayName?: string;
  status?: UserStatus;
}

export interface UserQueryParams {
  status?: UserStatus;
  search?: string;
  page?: number;
  perPage?: number;
}
