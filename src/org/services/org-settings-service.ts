import { getApiClient } from '../../lib/api-client';
import { API } from '../../constants/api';

export interface OrgProfile {
  organizationName: string
  shortName: string
  contactEmail: string
  phone: string
  website: string
  address: string
}

export interface OrgBrandingData {
  logoUrl: string | null
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
  async fetchProfile(orgId: string): Promise<OrgProfile> {
    const { data } = await getApiClient().get<OrgProfile>(API.ENDPOINTS.ORGANIZATIONS.BY_ID(orgId))
    return data
  },

  async updateProfile(orgId: string, input: Partial<OrgProfile>): Promise<OrgProfile> {
    const { data } = await getApiClient().put<OrgProfile>(API.ENDPOINTS.ORGANIZATIONS.BY_ID(orgId), input)
    return data
  },

  async fetchBranding(orgId: string): Promise<OrgBrandingData> {
    const { data } = await getApiClient().get<OrgBrandingData>(API.ENDPOINTS.ORGANIZATIONS.BRANDING(orgId))
    return data
  },

  async updateBranding(orgId: string, input: Partial<OrgBrandingData>): Promise<OrgBrandingData> {
    const { data } = await getApiClient().put<OrgBrandingData>(API.ENDPOINTS.ORGANIZATIONS.BRANDING(orgId), input)
    return data
  },

  async fetchSettings(orgId: string): Promise<OrgSettings> {
    const { data } = await getApiClient().get<OrgSettings>(API.ENDPOINTS.ORGANIZATIONS.SETTINGS(orgId))
    return data
  },

  async updateSettings(orgId: string, input: Partial<OrgSettings>): Promise<OrgSettings> {
    const { data } = await getApiClient().put<OrgSettings>(API.ENDPOINTS.ORGANIZATIONS.SETTINGS(orgId), input)
    return data
  },
}
