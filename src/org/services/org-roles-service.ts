import { getApiClient, unwrapPayload } from '../../lib/api-client'
import { API } from '../../constants/api'

export interface OrgRole {
  uuid: string
  organization_id: number | null
  name: string
  slug: string
  description: string | null
  is_system: boolean
  is_active: boolean
  created_by: number | null
}

export interface OrgRoleInput {
  name: string
  description?: string | null
  permissions: string[]
  is_active?: boolean
}

export interface PermissionEntry {
  key: string
  label: string
}

export interface PermissionGroup {
  group: string
  permissions: PermissionEntry[]
}

export interface OrgRoleDetail {
  role: OrgRole
  permissions: string[]
}

export const orgRolesService = {
  async listRoles(): Promise<OrgRole[]> {
    const { data } = await getApiClient().get<unknown>(API.ENDPOINTS.ORG.ROLES)
    return unwrapPayload<OrgRole[]>(data)
  },

  async permissionCatalog(): Promise<PermissionGroup[]> {
    const { data } = await getApiClient().get<unknown>(API.ENDPOINTS.ORG.ROLES_PERMISSIONS)
    return unwrapPayload<PermissionGroup[]>(data)
  },

  async getRole(uuid: string): Promise<OrgRoleDetail> {
    const { data } = await getApiClient().get<unknown>(API.ENDPOINTS.ORG.ROLE(uuid))
    const payload = data as { permissions?: string[] } | null
    return {
      role: unwrapPayload<OrgRole>(data),
      permissions: payload?.permissions ?? [],
    }
  },

  async createRole(input: OrgRoleInput): Promise<OrgRole> {
    const { data } = await getApiClient().post<unknown>(API.ENDPOINTS.ORG.ROLES, input)
    return unwrapPayload<OrgRole>(data)
  },

  async updateRole(uuid: string, input: OrgRoleInput): Promise<OrgRole> {
    const { data } = await getApiClient().put<unknown>(API.ENDPOINTS.ORG.ROLE(uuid), input)
    return unwrapPayload<OrgRole>(data)
  },

  async deleteRole(uuid: string): Promise<void> {
    await getApiClient().delete(API.ENDPOINTS.ORG.ROLE(uuid))
  },

  async cloneRole(uuid: string, input: { name: string; description?: string | null }): Promise<OrgRole> {
    const { data } = await getApiClient().post<unknown>(`${API.ENDPOINTS.ORG.ROLE(uuid)}/clone`, input)
    return unwrapPayload<OrgRole>(data)
  },
}
