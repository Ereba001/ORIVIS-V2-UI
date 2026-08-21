import { describe, it, expect, vi, beforeEach } from "vitest"
import { getApiClient } from "../lib/api-client"
import { platformService } from "../services/platform-service"

// The api-client is mocked so these tests verify the service maps to the
// correct endpoints and payloads without a network.
vi.mock("../lib/api-client", () => ({
  getApiClient: vi.fn(),
  unwrapPayload: (body: unknown) =>
    body && typeof body === "object" && "data" in body ? (body as { data: unknown }).data : body,
}))

describe("platform role service", () => {
  const client = { put: vi.fn(), post: vi.fn(), delete: vi.fn() }

  beforeEach(() => {
    vi.clearAllMocks()
    ;(getApiClient as unknown as ReturnType<typeof vi.fn>).mockReturnValue(client)
  })

  it("updateRole PUTs the role with name, description and permissions", async () => {
    await platformService.updateRole("role-abc", {
      name: "Senior Agent",
      description: "desc",
      permissions: ["view_dashboard"],
    })

    expect(client.put).toHaveBeenCalledWith("/platform/roles/role-abc", {
      name: "Senior Agent",
      description: "desc",
      permissions: ["view_dashboard"],
    })
  })

  it("archiveRole and restoreRole POST to the correct sub-routes", async () => {
    await platformService.archiveRole("role-abc")
    await platformService.restoreRole("role-abc")

    expect(client.post).toHaveBeenCalledWith("/platform/roles/role-abc/archive")
    expect(client.post).toHaveBeenCalledWith("/platform/roles/role-abc/restore")
  })

  it("deleteRole DELETEs the role", async () => {
    await platformService.deleteRole("role-abc")

    expect(client.delete).toHaveBeenCalledWith("/platform/roles/role-abc")
  })
})
