import type { UUID, ISO8601DateTime } from './common';

export type OrganizationStatus = 'PROVISIONING' | 'ACTIVE' | 'SUSPENDED' | 'ARCHIVED' | 'CANCELLED';
export type OrganizationType = 'GOVERNMENT' | 'EDUCATION' | 'CORPORATE' | 'NON_PROFIT' | 'OTHER';
export type OrganizationVisibility = 'PUBLIC' | 'PRIVATE';

export interface Organization {
  id: UUID;
  organizationName: string;
  organizationType: OrganizationType;
  registrationNumber?: string;
  slug: string;
  officialEmail: string;
  officialPhone?: string;
  country?: string;
  state?: string;
  city?: string;
  website?: string;
  status: OrganizationStatus;
  visibility: OrganizationVisibility;
  provisionedAt?: ISO8601DateTime;
  createdAt: ISO8601DateTime;
  updatedAt: ISO8601DateTime;
}

export interface OrganizationProfile {
  description?: string;
  mission?: string;
  vision?: string;
  foundedYear?: number;
  logoUrl?: string;
  bannerUrl?: string;
}

export interface OrganizationBranding {
  primaryColor?: string;
  secondaryColor?: string;
  logoUrl?: string;
  faviconUrl?: string;
  theme?: string;
}

export interface WorkspaceSettings {
  timezone?: string;
  locale?: string;
  maxAdmins?: number;
  maxElections?: number;
  features?: Record<string, boolean>;
}

export interface CreateOrganizationInput {
  organizationName: string;
  organizationType: OrganizationType;
  slug: string;
  officialEmail: string;
  officialPhone?: string;
  country?: string;
}

export interface UpdateOrganizationInput {
  organizationName?: string;
  officialEmail?: string;
  officialPhone?: string;
  website?: string;
  country?: string;
  state?: string;
  city?: string;
}
