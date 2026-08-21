import type { User } from '../types/user';
import type { Membership } from '../types/membership';

export function getPlatformHomeRoute(_user: User | null | undefined): string {
  return '/platform';
}

export function getOrgHomeRoute(_user: User | null | undefined, _memberships?: Membership[]): string {
  return '/org/dashboard';
}
