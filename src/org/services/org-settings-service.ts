import { getApiClient, unwrapPayload } from '../../lib/api-client';
import { API } from '../../constants/api';

export interface OrgProfile {
  organizationName: string
  shortName: string
  contactEmail: string
  phone: string
  website: string
  address: string
  about?: string
  founded?: string
  sector?: string
}

export interface OrgBrandingData {
  logoUrl: string | null
  faviconUrl: string | null
  primaryColor: string
  secondaryColor: string
  accentColor: string
  themeMode: 'light' | 'dark' | 'system'
}

export interface OrgSettings {
  workspaceName: string
  timezone: string
  language: string
  eventVisibility: 'public' | 'private'
  notificationEmail: boolean
  notificationSms: boolean
  notificationPush: boolean
  sessionTimeout: number
  require2fa: boolean
  loginAlerts: boolean
}

export const orgSettingsService = {
  async fetchProfile(_orgId: string): Promise<OrgProfile> {
    const { data } = await getApiClient().get(API.ENDPOINTS.WORKSPACE.PROFILE)
    return unwrapPayload<OrgProfile>(data)
  },

  async updateProfile(_orgId: string, input: Partial<OrgProfile>): Promise<OrgProfile> {
    const payload: Record<string, unknown> = {}
    if (input.organizationName !== undefined) payload.name = input.organizationName
    if (input.shortName !== undefined) payload.shortName = input.shortName
    if (input.contactEmail !== undefined) payload.email = input.contactEmail
    if (input.phone !== undefined) payload.phone = input.phone
    if (input.website !== undefined) payload.website = input.website
    if (input.address !== undefined) payload.address = input.address
    const { data } = await getApiClient().put(API.ENDPOINTS.WORKSPACE.PROFILE, payload)
    return unwrapPayload<OrgProfile>(data)
  },

  async fetchBranding(_orgId: string): Promise<OrgBrandingData> {
    const { data } = await getApiClient().get(API.ENDPOINTS.WORKSPACE.BRANDING)
    return unwrapPayload<OrgBrandingData>(data)
  },

  async updateBranding(_orgId: string, input: Partial<OrgBrandingData>): Promise<OrgBrandingData> {
    const { data } = await getApiClient().put(API.ENDPOINTS.WORKSPACE.BRANDING, input)
    return unwrapPayload<OrgBrandingData>(data)
  },

  async fetchSettings(_orgId: string): Promise<OrgSettings> {
    const { data } = await getApiClient().get(API.ENDPOINTS.WORKSPACE.SETTINGS)
    return unwrapPayload<OrgSettings>(data)
  },

  async updateSettings(_orgId: string, input: Partial<OrgSettings>): Promise<OrgSettings> {
    const { data } = await getApiClient().put(API.ENDPOINTS.WORKSPACE.SETTINGS, input)
    return unwrapPayload<OrgSettings>(data)
  },

  async uploadLogo(file: File): Promise<string> {
    const fd = new FormData()
    fd.append('file', file)
    const { data } = await getApiClient().post(
      API.ENDPOINTS.WORKSPACE.LOGO_UPLOAD,
      fd,
      { headers: { 'Content-Type': undefined } },
    )
    return unwrapPayload<{ logoUrl: string }>(data).logoUrl
  },

  async deleteLogo(): Promise<void> {
    await getApiClient().delete(API.ENDPOINTS.WORKSPACE.LOGO_DELETE)
  },

  async uploadFavicon(file: File): Promise<string> {
    const fd = new FormData()
    fd.append('file', file)
    const { data } = await getApiClient().post(
      API.ENDPOINTS.WORKSPACE.FAVICON_UPLOAD,
      fd,
      { headers: { 'Content-Type': undefined } },
    )
    return unwrapPayload<{ faviconUrl: string }>(data).faviconUrl
  },
}
