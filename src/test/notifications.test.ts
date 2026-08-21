import { describe, it, expect, vi, beforeEach } from "vitest"

// The org-service mapper is not exported, so exercise the notification wiring
// through the service layer with a mocked api-client, mirroring how the app
// consumes poll responses.
const mockGet = vi.fn()
const mockPost = vi.fn()
const mockPut = vi.fn()

vi.mock("../lib/api-client", () => ({
  getApiClient: () => ({
    get: mockGet,
    post: mockPost,
    put: mockPut,
  }),
  unwrapPayload: (data: unknown) => (data as { data?: unknown })?.data ?? data,
}))

import { orgService } from "../services/org-service"

describe("notification service mapping", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("maps priority and derives election action path", async () => {
    mockGet.mockResolvedValueOnce({
      data: { data: [{ id: 7, uuid: "n-1", organization_id: 1, user_id: null, type: "event", priority: "warning", level: "important", title: "Voting ended", body: "Closed", data: { election_id: 99 }, action_type: "election", action_id: "99", read_at: null, dismissed_at: null, created_at: "2026-08-14T10:00:00Z", updated_at: "2026-08-14T10:00:00Z" }] },
      meta: { total: 1, current_page: 1, per_page: 50 },
    })

    const result = await orgService.getNotifications({ perPage: 50 })
    const n = result.items[0]

    expect(n.priority).toBe("warning")
    expect(n.level).toBe("important")
    expect(n.actionPath).toBe("/org/events/99")
    expect(n.type).toBe("event")
  })

  it("maps participant action path using embedded election id", async () => {
    mockGet.mockResolvedValueOnce({
      data: { data: [{ id: 8, uuid: "n-2", organization_id: 1, user_id: null, type: "event", priority: "success", title: "Participant verified", body: "Passed", data: { election_id: 42 }, action_type: "participant", action_id: "300", read_at: null, dismissed_at: null, created_at: "2026-08-14T11:00:00Z", updated_at: "2026-08-14T11:00:00Z" }] },
      meta: { total: 1, current_page: 1, per_page: 50 },
    })

    const result = await orgService.getNotifications({ perPage: 50 })
    expect(result.items[0].actionPath).toBe("/org/events/42/participants")
  })

  it("maps critical priority and no action path for unknown action type", async () => {
    mockGet.mockResolvedValueOnce({
      data: { data: [{ id: 9, uuid: "n-3", organization_id: 1, user_id: null, type: "security_alert", priority: "critical", title: "Payment failed", body: "Could not complete", data: null, action_type: null, action_id: null, read_at: null, dismissed_at: null, created_at: "2026-08-14T12:00:00Z", updated_at: "2026-08-14T12:00:00Z" }] },
      meta: { total: 1, current_page: 1, per_page: 50 },
    })

    const result = await orgService.getNotifications({ perPage: 50 })
    expect(result.items[0].priority).toBe("critical")
    expect(result.items[0].level).toBe("critical")
    expect(result.items[0].actionPath).toBeUndefined()
  })

  it("falls back to priority classification when level is absent", async () => {
    mockGet.mockResolvedValueOnce({
      data: { data: [{ id: 10, uuid: "n-5", organization_id: 1, user_id: null, type: "event", priority: "success", title: "Participant verified", body: "Passed", data: null, action_type: null, action_id: null, read_at: null, dismissed_at: null, created_at: "2026-08-14T14:00:00Z", updated_at: "2026-08-14T14:00:00Z" }] },
      meta: { total: 1, current_page: 1, per_page: 50 },
    })

    const result = await orgService.getNotifications({ perPage: 50 })
    expect(result.items[0].level).toBe("normal")
  })

  it("poll returns maxId for incremental polling", async () => {
    mockGet.mockResolvedValueOnce({
      data: { data: { items: [{ id: 12, uuid: "n-4", organization_id: 1, user_id: null, type: "event", priority: "info", title: "Election created", body: "", data: null, action_type: "election", action_id: "5", read_at: null, dismissed_at: null, created_at: "2026-08-14T13:00:00Z", updated_at: "2026-08-14T13:00:00Z" }], unread: 3 } },
    })

    const result = await orgService.pollNotifications(10)
    expect(result.maxId).toBe(12)
    expect(result.unread).toBe(3)
    expect(result.items[0].title).toBe("Election created")
  })

  it("marks a notification read", async () => {
    mockPost.mockResolvedValueOnce({})
    await orgService.markNotificationRead("n-1")
    expect(mockPost).toHaveBeenCalledWith("/org/notifications/n-1/read")
  })
})
