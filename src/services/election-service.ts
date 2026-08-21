import { getApiClient, unwrapPayload, readOrNull } from '../lib/api-client';
import { API } from '../constants/api';
import type { Election, ElectionStatus, ElectionAuditLog } from '../types/election';
import type {
  RegistrationSettings, RegistrationSettingsInput, BulkImportResult,
  ElectionRegistrationInfo, LookupResult,
  OtpResult, VerifyOtpResult, CompleteRegistrationResult, RegistrationStatusResponse,
} from '../types/registration';

export const electionService = {
  async getElections(): Promise<Election[]> {
    const { data } = await getApiClient().get<unknown>(API.ENDPOINTS.ELECTIONS.BASE);
    return unwrapPayload<Election[]>(data);
  },

  async getPublicElections(): Promise<Election[]> {
    const { data } = await getApiClient().get<unknown>(API.ENDPOINTS.PUBLIC.ELECTIONS.BASE);
    const list = unwrapPayload<Record<string, unknown>[]>(data);
    return list.map((raw) => mapPublicElection(raw));
  },

  async getElection(id: string): Promise<Election> {
    const { data } = await getApiClient().get<unknown>(API.ENDPOINTS.ELECTIONS.BY_ID(id));
    const raw = unwrapPayload<Record<string, unknown>>(data);
    return {
      ...raw,
      startsAt: String(raw.startsAt ?? raw.votingStartsAt ?? ''),
      endsAt: String(raw.endsAt ?? raw.votingEndsAt ?? ''),
    } as Election;
  },

  async getPublicElection(slug: string): Promise<Election | null> {
    return readOrNull(async () => {
      const { data } = await getApiClient().get<unknown>(API.ENDPOINTS.PUBLIC.ELECTIONS.BY_SLUG(slug));
      return mapPublicElection(unwrapPayload<Record<string, unknown>>(data));
    });
  },

  async getElectionsByStatus(status: string): Promise<Election[]> {
    const { data } = await getApiClient().get<unknown>(`${API.ENDPOINTS.ELECTIONS.BASE}?status=${status}`);
    return unwrapPayload<Election[]>(data);
  },

  async getElectionsByOrg(orgId: string): Promise<Election[]> {
    const { data } = await getApiClient().get<Election[]>(`/organizations/${orgId}/elections`);
    return data;
  },

  async createElection(input: Record<string, unknown>): Promise<Election> {
    const { data } = await getApiClient().post<unknown>(API.ENDPOINTS.ELECTIONS.CREATE, input);
    return unwrapPayload<Election>(data);
  },

  async saveDraft(input: Record<string, unknown>): Promise<Election> {
    const { data } = await getApiClient().post<unknown>(API.ENDPOINTS.ELECTIONS.DRAFTS.CREATE, input);
    return unwrapPayload<Election>(data);
  },

  async updateDraft(id: string, input: Record<string, unknown>): Promise<Election> {
    const { data } = await getApiClient().put<unknown>(API.ENDPOINTS.ELECTIONS.DRAFTS.UPDATE(id), input);
    return unwrapPayload<Election>(data);
  },

  async updateElection(id: string, input: Record<string, unknown>): Promise<Election> {
    const { data } = await getApiClient().put<unknown>(API.ENDPOINTS.ELECTIONS.UPDATE(id), input);
    return unwrapPayload<Election>(data);
  },

  async updateCandidateSlots(id: string, candidateSlots: number | null): Promise<void> {
    await getApiClient().put(API.ENDPOINTS.ELECTIONS.CANDIDATE_SLOTS(id), { candidateSlots });
  },

  async uploadBanner(id: string, formData: FormData): Promise<{ bannerUrl: string }> {
    const { data } = await getApiClient().post<unknown>(
      API.ENDPOINTS.ELECTIONS.BANNER_UPLOAD(id),
      formData,
      { headers: { 'Content-Type': undefined } },
    );
    return unwrapPayload<{ bannerUrl: string }>(data);
  },

  async uploadLogo(id: string, formData: FormData): Promise<{ logoUrl: string }> {
    const { data } = await getApiClient().post<unknown>(
      API.ENDPOINTS.ELECTIONS.LOGO_UPLOAD(id),
      formData,
      { headers: { 'Content-Type': undefined } },
    );
    return unwrapPayload<{ logoUrl: string }>(data);
  },

  async deleteElection(id: string): Promise<void> {
    await getApiClient().delete(API.ENDPOINTS.ELECTIONS.DELETE(id));
  },

  async publishElection(id: string): Promise<Election> {
    const { data } = await getApiClient().post<unknown>(API.ENDPOINTS.ELECTIONS.PUBLISH(id));
    return unwrapPayload<Election>(data);
  },

  async schedulePublishElection(id: string, publishAt: string): Promise<Election> {
    const { data } = await getApiClient().post<unknown>(API.ENDPOINTS.ELECTIONS.SCHEDULE_PUBLISH(id), { publishAt });
    return unwrapPayload<Election>(data);
  },

  async cancelScheduledPublish(id: string): Promise<Election> {
    const { data } = await getApiClient().delete<unknown>(API.ENDPOINTS.ELECTIONS.CANCEL_SCHEDULED_PUBLISH(id));
    return unwrapPayload<Election>(data);
  },

  async startElection(id: string, auditNote: string): Promise<Election> {
    const { data } = await getApiClient().post<unknown>(API.ENDPOINTS.ELECTIONS.START(id), { auditNote });
    return unwrapPayload<Election>(data);
  },

  async stopElection(id: string, auditNote: string): Promise<Election> {
    const { data } = await getApiClient().post<unknown>(API.ENDPOINTS.ELECTIONS.STOP(id), { auditNote });
    return unwrapPayload<Election>(data);
  },

  async closeElection(id: string, auditNote: string): Promise<Election> {
    const { data } = await getApiClient().post<unknown>(API.ENDPOINTS.ELECTIONS.CLOSE(id), { auditNote });
    return unwrapPayload<Election>(data);
  },

  async archiveElection(id: string): Promise<Election> {
    const { data } = await getApiClient().post<unknown>(API.ENDPOINTS.ELECTIONS.ARCHIVE(id));
    return unwrapPayload<Election>(data);
  },

  async publishResults(electionId: string, live: boolean): Promise<void> {
    await getApiClient().post(`/elections/${electionId}/publish-results`, { live });
  },

  async scheduleResultsPublish(electionId: string, publishAt: string): Promise<void> {
    await getApiClient().post(`/elections/${electionId}/schedule-results-publish`, { publishAt });
  },

  async getElectionAuditLogs(id: string, params?: { page?: number; perPage?: number; search?: string }): Promise<{ items: ElectionAuditLog[]; total: number; page: number; perPage: number }> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.perPage) searchParams.set('per_page', String(params.perPage));
    if (params?.search) searchParams.set('search', params.search);
    const qs = searchParams.toString();
    const url = `${API.ENDPOINTS.ELECTIONS.AUDIT_LOGS(id)}${qs ? '?' + qs : ''}`;
    const res = await getApiClient().get<unknown>(url);
    const payload = res as unknown as { data: ElectionAuditLog[]; meta?: { currentPage: number; lastPage: number; perPage: number; total: number } };
    return {
      items: payload.data ?? [],
      total: payload.meta?.total ?? (payload.data?.length ?? 0),
      page: payload.meta?.currentPage ?? 1,
      perPage: payload.meta?.perPage ?? 25,
    };
  },

  async duplicateElection(id: string): Promise<Election> {
    const { data } = await getApiClient().post<unknown>(API.ENDPOINTS.ELECTIONS.DUPLICATE(id));
    return unwrapPayload<Election>(data);
  },

  // === REGISTRATION SETTINGS ===

  async getRegistrationSettings(electionId: string): Promise<RegistrationSettings | null> {
    return readOrNull(async () => {
      const { data } = await getApiClient().get<unknown>(API.ENDPOINTS.REGISTRATION.SETTINGS(electionId));
      return unwrapPayload<RegistrationSettings>(data);
    });
  },

  async saveRegistrationSettings(electionId: string, input: RegistrationSettingsInput): Promise<RegistrationSettings> {
    const { data } = await getApiClient().put<unknown>(API.ENDPOINTS.REGISTRATION.SETTINGS(electionId), input);
    return unwrapPayload<RegistrationSettings>(data);
  },

  async getRegistrationInfo(slug: string): Promise<ElectionRegistrationInfo | null> {
    return readOrNull(async () => {
      const { data } = await getApiClient().get<unknown>(API.ENDPOINTS.REGISTRATION.INFO(slug));
      return unwrapPayload<ElectionRegistrationInfo>(data);
    });
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
    const { data } = await getApiClient().get<unknown>(API.ENDPOINTS.REGISTRATION.STATUS(registrationUuid));
    return unwrapPayload<RegistrationStatusResponse>(data);
  },

  async bulkImport(electionId: string, file: File, fieldMapping: Record<string, string>): Promise<BulkImportResult> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('mapping', JSON.stringify(fieldMapping));
    const { data } = await getApiClient().post<unknown>(API.ENDPOINTS.REGISTRATION.IMPORT(electionId), formData, { headers: { 'Content-Type': undefined } });
    return unwrapPayload<BulkImportResult>(data);
  },

  async toggleRegistration(electionId: string, enabled: boolean): Promise<void> {
    await getApiClient().patch(API.ENDPOINTS.REGISTRATION.TOGGLE(electionId), { enabled });
  },

  /**
   * Close registration for a published/live election ahead of its scheduled
   * window end. Audited server-side (who, when, optional note).
   */
  async endRegistration(electionId: string, auditNote?: string): Promise<void> {
    await getApiClient().post(API.ENDPOINTS.REGISTRATION.END(electionId), { auditNote });
  },

  /**
   * Open registration for a published/live election ahead of (or outside) its
   * configured window. Audited server-side (who, when, optional note).
   */
  async startRegistration(electionId: string, auditNote?: string): Promise<void> {
    await getApiClient().post(API.ENDPOINTS.REGISTRATION.START(electionId), { auditNote });
  },

  // === POSITIONS ===

  async getPositions(electionId: string): Promise<Record<string, unknown>[]> {
    const { data } = await getApiClient().get<unknown>(API.ENDPOINTS.POSITIONS.BASE(electionId));
    return unwrapPayload<Record<string, unknown>[]>(data);
  },

  async createPosition(electionId: string, input: Record<string, unknown>): Promise<Record<string, unknown>> {
    const { data } = await getApiClient().post<unknown>(API.ENDPOINTS.POSITIONS.CREATE(electionId), input);
    return unwrapPayload<Record<string, unknown>>(data);
  },

  // === CANDIDATES ===

  async createCandidate(
    electionId: string,
    positionId: string,
    input: Record<string, unknown> | FormData,
  ): Promise<Record<string, unknown>> {
    const isFormData = input instanceof FormData
    const { data } = await getApiClient().post<unknown>(
      API.ENDPOINTS.CANDIDATES.CREATE(electionId, positionId),
      input,
      isFormData ? { headers: { 'Content-Type': undefined } } : undefined,
    );
    return unwrapPayload<Record<string, unknown>>(data);
  },

  async updateCandidate(
    electionId: string,
    positionId: string,
    candidateId: string,
    input: Record<string, unknown> | FormData,
  ): Promise<Record<string, unknown>> {
    const isFormData = input instanceof FormData
    const { data } = await getApiClient().put<unknown>(
      API.ENDPOINTS.CANDIDATES.UPDATE(electionId, positionId, candidateId),
      input,
      isFormData ? { headers: { 'Content-Type': undefined } } : undefined,
    );
    return unwrapPayload<Record<string, unknown>>(data);
  },

  async reorderCandidates(electionId: string, positionId: string, orderedIds: string[]): Promise<void> {
    await getApiClient().post<unknown>(
      API.ENDPOINTS.CANDIDATES.REORDER(electionId, positionId),
      { ordered_ids: orderedIds },
    );
  },

  async deleteCandidate(electionId: string, positionId: string, candidateId: string): Promise<void> {
    await getApiClient().delete(API.ENDPOINTS.CANDIDATES.DELETE(electionId, positionId, candidateId));
  },
};

function mapPublicElection(raw: Record<string, unknown>): Election {
  return {
    id: String(raw.id ?? raw.uuid ?? ''),
    slug: String(raw.slug ?? ''),
    organizationId: String(raw.organizationId ?? ''),
    organizationName: raw.organizationName ? String(raw.organizationName) : undefined,
    title: String(raw.title ?? 'Untitled Election'),
    description: raw.description ? String(raw.description) : undefined,
    type: (raw.type as Election['type']) ?? 'ELECTION',
    status: (raw.status as ElectionStatus) ?? 'CREATED',
    startsAt: String(raw.startsAt ?? raw.votingStartsAt ?? ''),
    endsAt: String(raw.endsAt ?? raw.votingEndsAt ?? ''),
    startedAt: raw.startedAt ? String(raw.startedAt) : undefined,
    endedAt: raw.endedAt ? String(raw.endedAt) : undefined,
    registrationStartsAt: raw.registrationStartsAt ? String(raw.registrationStartsAt) : undefined,
    registrationEndsAt: raw.registrationEndsAt ? String(raw.registrationEndsAt) : undefined,
    timezone: raw.timezone ? String(raw.timezone) : undefined,
    maxVotes: raw.maxVotes ? Number(raw.maxVotes) : undefined,
    allowAbstention: Boolean(raw.allowAbstention ?? false),
    isAnonymous: Boolean(raw.isAnonymous ?? false),
    isMultiParty: raw.isMultiParty !== undefined ? Boolean(raw.isMultiParty) : undefined,
    candidateSlots: raw.candidateSlots !== undefined && raw.candidateSlots !== null ? Number(raw.candidateSlots) : undefined,
    category: raw.category ? String(raw.category) : undefined,
    customCategory: raw.customCategory ? String(raw.customCategory) : undefined,
    totalRegistered: raw.totalRegistered !== undefined ? Number(raw.totalRegistered) : undefined,
    positionCount: raw.positionCount !== undefined ? Number(raw.positionCount) : undefined,
    candidateCount: raw.candidateCount !== undefined ? Number(raw.candidateCount) : undefined,
    visibility: (raw.visibility as Election['visibility']) ?? 'public',
    lifecycleState: (raw.lifecycleState as Election['lifecycleState']) ?? undefined,
    bannerUrl: raw.bannerUrl ? String(raw.bannerUrl) : null,
    subtitle: raw.subtitle ? String(raw.subtitle) : null,
    branding: mapElectionBranding(raw.branding),
    positions: Array.isArray(raw.positions) ? (raw.positions as Record<string, unknown>[]).map(mapPublicPosition) : undefined,
    createdAt: String(raw.createdAt ?? ''),
    updatedAt: String(raw.updatedAt ?? raw.createdAt ?? ''),
  };
}

function mapPublicPosition(raw: Record<string, unknown>): Election['positions'] extends (infer P)[] | undefined ? P : never {
  const candidates = Array.isArray(raw.candidates)
    ? (raw.candidates as Record<string, unknown>[]).map((c) => ({
        id: String(c.uuid ?? c.id ?? ''),
        name: String(c.name ?? ''),
        photoUrl: c.photo_url ? String(c.photo_url) : undefined,
        campaignImageUrl: c.campaign_image_url ? String(c.campaign_image_url) : undefined,
        party: c.party ? String(c.party) : undefined,
        partyLogoUrl: c.party_logo_url ? String(c.party_logo_url) : undefined,
        slogan: c.slogan ? String(c.slogan) : undefined,
        bio: c.bio ? String(c.bio) : undefined,
        biography: c.biography ? String(c.biography) : undefined,
        manifesto: c.manifesto ? String(c.manifesto) : undefined,
        manifestoUrl: c.manifesto_url ? String(c.manifesto_url) : undefined,
        candidateCode: c.candidate_code ? String(c.candidate_code) : undefined,
        sortOrder: c.sort_order !== undefined ? Number(c.sort_order) : undefined,
      }))
    : []
  return {
    id: String(raw.uuid ?? raw.id ?? ''),
    title: String(raw.title ?? ''),
    description: raw.description ? String(raw.description) : undefined,
    maxSelections: raw.max_votes !== undefined ? Number(raw.max_votes) : 1,
    ballotOrder: raw.sort_order !== undefined ? Number(raw.sort_order) : undefined,
    candidates,
  } as Election['positions'] extends (infer P)[] | undefined ? P : never
}

function mapElectionBranding(raw: unknown): Election['branding'] {
  if (!raw || typeof raw !== 'object') return undefined;
  const b = raw as Record<string, unknown>;
  return {
    organizationName: b.organizationName ? String(b.organizationName) : undefined,
    workspaceName: b.workspaceName ? String(b.workspaceName) : undefined,
    shortName: b.shortName ? String(b.shortName) : undefined,
    workspaceTitle: b.workspaceTitle ? String(b.workspaceTitle) : undefined,
    tagline: b.tagline ? String(b.tagline) : undefined,
    primaryColor: b.primaryColor ? String(b.primaryColor) : undefined,
    secondaryColor: b.secondaryColor ? String(b.secondaryColor) : undefined,
    accentColor: b.accentColor ? String(b.accentColor) : undefined,
    logoUrl: b.logoUrl ? String(b.logoUrl) : null,
    faviconUrl: b.faviconUrl ? String(b.faviconUrl) : null,
    themeMode: b.themeMode ? String(b.themeMode) : undefined,
  };
}
