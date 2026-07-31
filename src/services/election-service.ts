import { getApiClient } from '../lib/api-client';
import { API } from '../constants/api';
import type { Election } from '../types/election';
import type {
  RegistrationSettings, RegistrationSettingsInput, BulkImportResult,
  ElectionRegistrationInfo, LookupResult,
  OtpResult, VerifyOtpResult, CompleteRegistrationResult, RegistrationStatusResponse,
} from '../types/registration';

export const electionService = {
  async getElections(): Promise<Election[]> {
    const { data } = await getApiClient().get<Election[]>(API.ENDPOINTS.ELECTIONS.BASE);
    return data;
  },

  async getElection(id: string): Promise<Election | null> {
    try {
      const { data } = await getApiClient().get<Election>(API.ENDPOINTS.ELECTIONS.BY_ID(id));
      return data;
    } catch {
      return null;
    }
  },

  async getElectionsByStatus(status: string): Promise<Election[]> {
    const { data } = await getApiClient().get<Election[]>(`${API.ENDPOINTS.ELECTIONS.BASE}?status=${status}`);
    return data;
  },

  async getElectionsByOrg(orgId: string): Promise<Election[]> {
    const { data } = await getApiClient().get<Election[]>(`/organizations/${orgId}/elections`);
    return data;
  },

  async createElection(input: Record<string, unknown>): Promise<Election> {
    const { data } = await getApiClient().post<Election>(API.ENDPOINTS.ELECTIONS.CREATE, input);
    return data;
  },

  async updateElection(id: string, input: Record<string, unknown>): Promise<Election> {
    const { data } = await getApiClient().put<Election>(API.ENDPOINTS.ELECTIONS.UPDATE(id), input);
    return data;
  },

  async deleteElection(id: string): Promise<void> {
    await getApiClient().delete(API.ENDPOINTS.ELECTIONS.DELETE(id));
  },

  async publishElection(id: string): Promise<Election> {
    const { data } = await getApiClient().post<Election>(API.ENDPOINTS.ELECTIONS.PUBLISH(id));
    return data;
  },

  async closeElection(id: string): Promise<Election> {
    const { data } = await getApiClient().post<Election>(API.ENDPOINTS.ELECTIONS.CLOSE(id));
    return data;
  },

  // === REGISTRATION SETTINGS ===

  async getRegistrationSettings(electionId: string): Promise<RegistrationSettings | null> {
    try {
      const { data } = await getApiClient().get<RegistrationSettings>(API.ENDPOINTS.REGISTRATION.SETTINGS(electionId));
      return data;
    } catch {
      return null;
    }
  },

  async saveRegistrationSettings(electionId: string, input: RegistrationSettingsInput): Promise<RegistrationSettings> {
    const { data } = await getApiClient().put<RegistrationSettings>(API.ENDPOINTS.REGISTRATION.SETTINGS(electionId), input);
    return data;
  },

  async getRegistrationInfo(slug: string): Promise<ElectionRegistrationInfo | null> {
    try {
      const { data } = await getApiClient().get<ElectionRegistrationInfo>(API.ENDPOINTS.REGISTRATION.INFO(slug));
      return data;
    } catch {
      return null;
    }
  },

  async lookupVoter(slug: string, field: string, value: string): Promise<LookupResult> {
    const { data } = await getApiClient().post<LookupResult>(API.ENDPOINTS.REGISTRATION.LOOKUP(slug), { field, value });
    return data;
  },

  async register(slug: string, field: string, value: string): Promise<{ registration: string; status: string }> {
    const { data } = await getApiClient().post<{ registration: string; status: string }>(API.ENDPOINTS.REGISTRATION.REGISTER(slug), { field, value });
    return data;
  },

  async sendOtp(registrationUuid: string): Promise<OtpResult> {
    const { data } = await getApiClient().post<OtpResult>(API.ENDPOINTS.REGISTRATION.SEND_OTP(registrationUuid));
    return data;
  },

  async verifyOtp(registrationUuid: string, code: string): Promise<VerifyOtpResult> {
    const { data } = await getApiClient().post<VerifyOtpResult>(API.ENDPOINTS.REGISTRATION.VERIFY_OTP(registrationUuid), { code });
    return data;
  },

  async completeRegistration(registrationUuid: string): Promise<CompleteRegistrationResult> {
    const { data } = await getApiClient().post<CompleteRegistrationResult>(API.ENDPOINTS.REGISTRATION.COMPLETE(registrationUuid));
    return data;
  },

  async getRegistrationStatus(registrationUuid: string): Promise<RegistrationStatusResponse> {
    const { data } = await getApiClient().get<RegistrationStatusResponse>(API.ENDPOINTS.REGISTRATION.STATUS(registrationUuid));
    return data;
  },

  async bulkImport(electionId: string, file: File, fieldMapping: Record<string, string>): Promise<BulkImportResult> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('mapping', JSON.stringify(fieldMapping));
    const { data } = await getApiClient().post<BulkImportResult>(API.ENDPOINTS.REGISTRATION.IMPORT(electionId), formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  async toggleRegistration(electionId: string, enabled: boolean): Promise<void> {
    await getApiClient().patch(API.ENDPOINTS.REGISTRATION.TOGGLE(electionId), { enabled });
  },
};
