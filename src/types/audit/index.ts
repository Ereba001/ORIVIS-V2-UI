import type { PaginatedMeta } from '../common';

export type AuditSeverity = 'info' | 'warning' | 'error' | 'critical';
export type AuditStatus = 'success' | 'failure' | 'pending';
export type AuditCategory =
  | 'authentication'
  | 'organization'
  | 'user'
  | 'membership'
  | 'election'
  | 'permission'
  | 'settings'
  | 'billing'
  | 'notification'
  | 'system';

export interface AuditLog {
  id: string;
  timestamp: string;
  actorId: string;
  actorName: string;
  actorEmail: string;
  actorAvatar?: string;
  actorRole: string;
  organizationId?: string;
  organizationName?: string;
  resourceType: string;
  resourceId: string;
  resourceName: string;
  action: string;
  category: AuditCategory;
  severity: AuditSeverity;
  ipAddress?: string;
  location?: string;
  device?: string;
  browser?: string;
  os?: string;
  status: AuditStatus;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface AuditStats {
  total: number;
  success: number;
  failure: number;
  pending: number;
  info: number;
  warning: number;
  error: number;
  critical: number;
  uniqueActors: number;
  uniqueResources: number;
}

export interface AuditTimelineEvent {
  id: string;
  timestamp: string;
  actorName: string;
  actorRole: string;
  action: string;
  resourceName: string;
  status: AuditStatus;
  severity: AuditSeverity;
  category: AuditCategory;
}

export interface AuditFilter {
  search?: string;
  organization?: string;
  actor?: string;
  resource?: string;
  action?: string;
  category?: string;
  severity?: string;
  status?: string;
  from?: string;
  to?: string;
}

export interface AuditListResponse {
  items: AuditLog[];
  meta: PaginatedMeta;
}

export interface ListAuditParams {
  page: number;
  pageSize: number;
  search?: string;
  organization?: string;
  actor?: string;
  resource?: string;
  action?: string;
  category?: string;
  severity?: string;
  status?: string;
  from?: string;
  to?: string;
  sort?: string;
  sortDirection?: 'asc' | 'desc';
}

export const DEFAULT_PAGE_SIZE = 20;
export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const;

export const AUDIT_CATEGORIES: AuditCategory[] = [
  'authentication', 'organization', 'user', 'membership', 'election',
  'permission', 'settings', 'billing', 'notification', 'system',
];

export const AUDIT_SEVERITIES: AuditSeverity[] = ['info', 'warning', 'error', 'critical'];
export const AUDIT_STATUSES: AuditStatus[] = ['success', 'failure', 'pending'];
