import { getApiClient } from '../lib/api-client';
import { API } from '../constants/api';
import type { Membership, Invitation, InviteUserInput, ChangeRoleInput, AcceptInvitationInput } from '../types/membership';

export const membershipService = {
  listMembers: async (organizationId: string): Promise<Membership[]> => {
    const { data } = await getApiClient().get<Membership[]>(API.ENDPOINTS.MEMBERSHIPS.MEMBERS(organizationId));
    return data;
  },

  invite: async (input: InviteUserInput): Promise<{ invitation: Invitation }> => {
    const { data } = await getApiClient().post<{ invitation: Invitation }>(API.ENDPOINTS.MEMBERSHIPS.INVITE, input);
    return data;
  },

  acceptInvitation: async (input: AcceptInvitationInput): Promise<{ membership: Membership }> => {
    const { data } = await getApiClient().post<{ membership: Membership }>(API.ENDPOINTS.MEMBERSHIPS.ACCEPT, input);
    return data;
  },

  revokeInvitation: async (invitationId: string, revokedBy: string): Promise<{ invitation: Invitation }> => {
    const { data } = await getApiClient().post<{ invitation: Invitation }>(API.ENDPOINTS.MEMBERSHIPS.REVOKE, { invitationId, revokedBy });
    return data;
  },

  changeRole: async (id: string, input: ChangeRoleInput): Promise<{ membership: Membership }> => {
    const { data } = await getApiClient().patch<{ membership: Membership }>(API.ENDPOINTS.MEMBERSHIPS.ROLE(id), input);
    return data;
  },

  suspend: async (id: string, suspendedBy: string): Promise<{ membership: Membership }> => {
    const { data } = await getApiClient().patch<{ membership: Membership }>(API.ENDPOINTS.MEMBERSHIPS.SUSPEND(id), { suspendedBy });
    return data;
  },

  reactivate: async (id: string, reactivatedBy: string): Promise<{ membership: Membership }> => {
    const { data } = await getApiClient().patch<{ membership: Membership }>(API.ENDPOINTS.MEMBERSHIPS.REACTIVATE(id), { reactivatedBy });
    return data;
  },

  restore: async (id: string, restoredBy: string): Promise<{ membership: Membership }> => {
    const { data } = await getApiClient().patch<{ membership: Membership }>(API.ENDPOINTS.MEMBERSHIPS.RESTORE(id), { restoredBy });
    return data;
  },

  remove: async (id: string, removedBy: string): Promise<{ membership: Membership }> => {
    const { data } = await getApiClient().delete<{ membership: Membership }>(API.ENDPOINTS.MEMBERSHIPS.REMOVE(id), { data: { removedBy } });
    return data;
  },

  getUserOrganizations: async (userId: string): Promise<Membership[]> => {
    const { data } = await getApiClient().get<Membership[]>(API.ENDPOINTS.MEMBERSHIPS.USER_ORGS(userId));
    return data;
  },
};
