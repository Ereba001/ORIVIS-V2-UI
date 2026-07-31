# ORIVIS REST API Specification

Version: 1.0

Status: Active

Last Updated: July 2026

---

# 1. Purpose

Define the complete REST API standards for ORIVIS.

The API must be:

- RESTful
- Predictable
- Consistent
- Version-ready
- Secure
- Documented

---

# 2. Base URL

Development

/api/v1

Future production versioning should support:

/api/v2

without breaking existing clients.

---

# 3. Authentication

Strategy: Session-based authentication using Laravel Sanctum (SPA authentication). The frontend sends credentials via POST; the server establishes a session. All subsequent requests include the session cookie.

Route categories:

Guest routes — Registration, login, forgot password, reset password, public contact form. No authentication required.

Authenticated routes — All routes requiring a valid session. Returns 401 if session missing or expired.

Verified email routes — Routes that additionally require email_verified_at to be set. Returns 403 with error_code "email_not_verified" if unverified.

Role protected routes — Routes gated by Laravel Policies. Returns 403 with error_code "unauthorized" if the user lacks the required permission.

Tenant protected routes — Routes scoped to the current organization. The tenant is resolved from the authenticated user's organization membership. Returns 403 if the requested entity does not belong to the user's organization.

---

# 4. Standard JSON Response

All successful responses use this envelope:

```
{
  "success": true,
  "message": "Operation completed successfully",
  "data": { ... },
  "meta": { ... }
}
```

Field definitions:

success — Boolean, always true for successful responses.

message — Human-readable string describing the result.

data — Primary payload (object for single resource, array for collection, or scalar). May be null for operations with no return payload (e.g., delete).

meta — Optional object for pagination (page, per_page, total, last_page), or additional metadata like processing status for async operations.

Collection responses include meta.pagination. Single resource responses omit the meta field unless additional context is needed.

---

# 5. Standard Error Response

All error responses use this envelope:

```
{
  "success": false,
  "message": "Human-readable error description",
  "errors": {},
  "error_code": "ERROR_IDENTIFIER"
}
```

Field definitions:

success — Always false for error responses.

message — User-friendly description of the error.

errors — Object with field-level validation errors (for 422). Empty object for other error types.

error_code — Machine-readable identifier string for programmatic handling (e.g., "email_not_verified", "vote_duplicate", "election_closed").

Status code examples:

400 Bad Request — Invalid request format. error_code: "bad_request"

401 Unauthorized — No session or session expired. error_code: "unauthenticated"

403 Forbidden — Insufficient permissions. error_code: "unauthorized" or "email_not_verified"

404 Not Found — Entity does not exist or is not accessible in current tenant. error_code: "not_found"

409 Conflict — Business rule violation (duplicate vote, invalid status transition). error_code: specific to violation (e.g., "vote_already_cast", "election_not_open")

422 Unprocessable Entity — Validation failure. errors object contains per-field arrays of error messages. error_code: "validation_failed"

429 Too Many Requests — Rate limit exceeded. Retry-After header included. error_code: "rate_limited"

500 Internal Server Error — Unexpected server error. Generic message; details logged server-side. error_code: "server_error"

---

# 6. Pagination Standard

Pagination uses Laravel's built-in LengthAwarePaginator with the following JSON structure (within meta):

```
"meta": {
  "pagination": {
    "current_page": 1,
    "per_page": 15,
    "total": 100,
    "last_page": 7,
    "from": 1,
    "to": 15,
    "links": {
      "first": "/api/v1/resource?page=1",
      "last": "/api/v1/resource?page=7",
      "prev": null,
      "next": "/api/v1/resource?page=2"
    }
  }
}
```

Request parameters:

page (integer, default: 1) — The page number to retrieve.

per_page (integer, default: 15, max: 100) — Number of items per page.

All collection endpoints support pagination unless explicitly noted.

---

# 7. Filtering

Filtering uses query parameters with standard naming:

status=active — Filter by status field (exact match).

search=John — Full-text or partial-match search on relevant fields (name, email, title).

date_from=2026-01-01&date_to=2026-12-31 — Date range filter on created_at.

organization_id=5 — Filter by organization (for Founder-level endpoints).

role_id=3 — Filter by role membership.

Filters are combined with AND logic. Multiple values for the same field are not supported unless explicitly documented. Invalid filter parameters are silently ignored.

---

# 8. Sorting

Sorting uses a single sort query parameter:

sort=name — Sort ascending by name.

sort=-created_at — Leading hyphen indicates descending order.

Single sort field per request by default. Multiple sort fields (sort=name,-created_at) supported where explicitly documented.

Allowed sort fields are documented per endpoint. Invalid sort fields return 422 validation error.

---

# 9. Search

Search uses the search query parameter:

search=john — Case-insensitive partial match against configured searchable fields per entity.

Searchable fields are documented per endpoint. Common search fields include: name, email, title, identifier.

Search is combined with filters using AND logic. Search and filtering are independent parameters that can be used simultaneously.

---

# 10. Authentication Endpoints

All authentication endpoints are guest-accessible (no auth required) unless noted.

---

### POST /api/v1/auth/register

**Purpose:** Register a new organization with primary owner.

**Auth:** Guest

**Request body:**
```
{
  "organization_name": "Acme Corp",
  "name": "John Doe",
  "email": "john@example.com",
  "password": "Str0ng!Pass",
  "password_confirmation": "Str0ng!Pass"
}
```

**Validation:**
- organization_name: required, string, max:255
- name: required, string, max:255
- email: required, email, max:255, unique:users
- password: required, string, min:8, max:128, confirmed, regex for uppercase/lowercase/digit/special

**Success:** 201 — { success, message, data: { user, organization, requires_email_verification: true } }

**Errors:** 422 (validation), 429 (rate limited)

---

### POST /api/v1/auth/login

**Purpose:** Authenticate user and establish session.

**Auth:** Guest

**Request body:**
```
{
  "email": "john@example.com",
  "password": "Str0ng!Pass",
  "remember": false
}
```

**Validation:**
- email: required, email
- password: required, string
- remember: boolean, optional

**Success:** 200 — { success, message, data: { user, organization } }

**Errors:** 401 (invalid credentials), 403 (email not verified or account suspended), 429 (rate limited)

---

### POST /api/v1/auth/logout

**Purpose:** Invalidate current session.

**Auth:** Authenticated

**Request body:** None

**Validation:** None

**Success:** 200 — { success, message: "Logged out successfully" }

**Errors:** 401 (unauthenticated)

---

### POST /api/v1/auth/forgot-password

**Purpose:** Send password reset email.

**Auth:** Guest

**Request body:**
```
{
  "email": "john@example.com"
}
```

**Validation:** email: required, email, exists:users

**Success:** 200 — { success, message: "Reset link sent if email exists" } (always returns success to prevent email enumeration)

**Errors:** 429 (rate limited)

---

### POST /api/v1/auth/reset-password

**Purpose:** Reset password using token from email.

**Auth:** Guest

**Request body:**
```
{
  "email": "john@example.com",
  "token": "reset-token-from-email",
  "password": "NewStr0ng!Pass",
  "password_confirmation": "NewStr0ng!Pass"
}
```

**Validation:**
- email: required, email
- token: required, string
- password: required, string, min:8, confirmed, password policy rules

**Success:** 200 — { success, message: "Password reset successfully" }

**Errors:** 422 (validation, invalid/expired token), 429 (rate limited)

---

### GET /api/v1/auth/verify-email/{id}/{hash}

**Purpose:** Verify email address via signed URL.

**Auth:** Guest (signed URL)

**Parameters:** id (user ID), hash (verification hash)

**Success:** 200 — { success, message: "Email verified successfully" }

**Errors:** 403 (invalid/expired signature), 404 (user not found)

---

### POST /api/v1/auth/verify-email/resend

**Purpose:** Resend email verification link.

**Auth:** Authenticated (but unverified)

**Request body:** None

**Validation:** User must have unverified email

**Success:** 200 — { success, message: "Verification email resent" }

**Errors:** 429 (rate limited — 3 per hour), 403 (email already verified)

---

### GET /api/v1/auth/me

**Purpose:** Get the currently authenticated user with organization context.

**Auth:** Authenticated

**Request body:** None

**Success:** 200 — { success, data: { id, name, email, email_verified_at, organization, role, permissions } }

**Errors:** 401 (unauthenticated)

---

# 11. Organization Endpoints

All organization endpoints require authentication and tenant context.

---

### GET /api/v1/organization

**Purpose:** Get current organization profile.

**Auth:** Authenticated

**Success:** 200 — { success, data: { id, name, slug, email, phone, logo_url, cover_url, timezone, locale, status } }

---

### PUT /api/v1/organization

**Purpose:** Update organization profile.

**Auth:** Authenticated (requires organization.update permission)

**Request body:**
```
{
  "name": "Acme Corp Updated",
  "email": "admin@acme.com",
  "phone": "+1234567890",
  "timezone": "America/New_York",
  "locale": "en"
}
```

**Validation:**
- name: required, string, max:255
- email: required, email, max:255
- phone: string, max:50, nullable
- timezone: required, string, timezone_exists
- locale: required, string, size:2

**Success:** 200 — { success, data: { organization } }

---

### GET /api/v1/organization/settings

**Purpose:** Get workspace settings as key-value map.

**Auth:** Authenticated

**Success:** 200 — { success, data: { settings: { key: value, ... } } }

---

### PUT /api/v1/organization/settings

**Purpose:** Update workspace settings.

**Auth:** Authenticated (requires workspace.update permission)

**Request body:**
```
{
  "settings": {
    "branding.primary_color": "#2563EB",
    "notifications.email_enabled": true
  }
}
```

**Validation:**
- settings: required, array
- setting keys: string, dot-notation format
- setting values: string|boolean|number

**Success:** 200 — { success, data: { settings } }

---

### POST /api/v1/organization/logo

**Purpose:** Upload organization logo.

**Auth:** Authenticated (requires organization.update permission)

**Request:** multipart/form-data with file field

**Validation:**
- file: required, image, max:2048kb, mimes:jpg,png,svg,webp, dimensions:max:500x500

**Success:** 200 — { success, data: { logo_url } }

**Errors:** 422 (invalid file, too large, wrong dimensions)

---

### POST /api/v1/organization/cover

**Purpose:** Upload organization cover image.

**Auth:** Authenticated (requires organization.update permission)

**Request:** multipart/form-data with file field

**Validation:**
- file: required, image, max:5120kb, mimes:jpg,png,webp, dimensions:max:2000x2000

**Success:** 200 — { success, data: { cover_url } }

---

# 12. Team Endpoints

All team endpoints require authentication and organization context.

---

### POST /api/v1/team/invitations

**Purpose:** Invite a new member to the organization.

**Auth:** Authenticated (requires team.invite permission)

**Request body:**
```
{
  "email": "jane@example.com",
  "role_id": 3
}
```

**Validation:**
- email: required, email, max:255
- role_id: required, exists:roles,id (scoped to organization)

**Success:** 201 — { success, message: "Invitation sent", data: { invitation } }

**Errors:** 409 (user already member or already invited), 422 (validation)

---

### GET /api/v1/team/invitations

**Purpose:** List pending invitations.

**Auth:** Authenticated (requires team.view permission)

**Query params:** status= (pending|accepted|expired), page, per_page

**Success:** 200 — { success, data: [invitations], meta: { pagination } }

---

### GET /api/v1/team/invitations/{token}/accept

**Purpose:** Accept invitation (public — no auth required, user may need to register first).

**Auth:** Guest (validates token)

**Success:** 200 — { success, data: { organization, user, role } }

**Errors:** 404 (invalid/expired token), 409 (already accepted)

---

### GET /api/v1/team/members

**Purpose:** List all organization members with roles.

**Auth:** Authenticated (requires team.view permission)

**Query params:** role_id=, status=, search=, page, per_page, sort

**Success:** 200 — { success, data: [{ id, name, email, role, status, joined_at }], meta: { pagination } }

---

### PUT /api/v1/team/members/{user_id}/role

**Purpose:** Update a member's role.

**Auth:** Authenticated (requires team.manage permission)

**Request body:**
```
{
  "role_id": 4
}
```

**Validation:**
- role_id: required, exists:roles,id

**Success:** 200 — { success, data: { member, role } }

**Errors:** 403 (cannot modify own role, cannot modify founder)

---

### DELETE /api/v1/team/members/{user_id}

**Purpose:** Remove a member from the organization.

**Auth:** Authenticated (requires team.manage permission)

**Success:** 200 — { success, message: "Member removed" }

**Errors:** 403 (cannot remove self, cannot remove founder)

---

# 13. Election Endpoints

All election endpoints require authentication and organization context. Status flow: draft → scheduled → published → open → closed → archived.

---

### POST /api/v1/elections

**Purpose:** Create a new election.

**Auth:** Authenticated (requires election.create permission)

**Request body:**
```
{
  "title": "Board Election 2026",
  "description": "Annual board member election",
  "type": "single",
  "start_date": "2026-08-01T09:00:00Z",
  "end_date": "2026-08-02T17:00:00Z",
  "max_votes_per_position": 1,
  "allow_overvote": false,
  "is_public": false
}
```

**Validation:**
- title: required, string, max:255
- description: string, nullable
- type: required, in:single,multiple,ranked
- start_date: required, date, after_or_equal:now
- end_date: required, date, after:start_date
- max_votes_per_position: integer, min:1, max:100
- allow_overvote: boolean
- is_public: boolean

**Success:** 201 — { success, data: { election } }

**Errors:** 422 (validation)

---

### GET /api/v1/elections

**Purpose:** List elections for the organization.

**Auth:** Authenticated

**Query params:** status=, search=, date_from=, date_to=, page, per_page, sort

**Success:** 200 — { success, data: [elections], meta: { pagination } }

---

### GET /api/v1/elections/{id}

**Purpose:** View a single election with positions and statistics.

**Auth:** Authenticated

**Success:** 200 — { success, data: { election, positions: [...], candidate_count, participant_count, vote_count } }

**Errors:** 404 (not found or not in tenant)

---

### PUT /api/v1/elections/{id}

**Purpose:** Update an election. Only editable in draft or scheduled status.

**Auth:** Authenticated (requires election.update permission)

**Request body:** Same fields as create (all optional for update)

**Validation:** Same rules as create; status must be draft or scheduled

**Success:** 200 — { success, data: { election } }

**Errors:** 409 (cannot update in current status), 422 (validation)

---

### DELETE /api/v1/elections/{id}

**Purpose:** Delete an election (soft delete). Only if status is draft.

**Auth:** Authenticated (requires election.delete permission)

**Success:** 200 — { success, message: "Election deleted" }

**Errors:** 409 (cannot delete in current status — must be draft)

---

### POST /api/v1/elections/{id}/publish

**Purpose:** Transition election from draft/scheduled to published.

**Auth:** Authenticated (requires election.publish permission)

**Success:** 200 — { success, data: { election } }

**Errors:** 409 (invalid status transition — must be draft or scheduled)

---

### POST /api/v1/elections/{id}/open

**Purpose:** Open election for voting (transition from published to open).

**Auth:** Authenticated (requires election.manage permission)

**Success:** 200 — { success, data: { election } }

**Errors:** 409 (invalid status transition, start_date not reached)

---

### POST /api/v1/elections/{id}/close

**Purpose:** Close election (transition from open to closed).

**Auth:** Authenticated (requires election.manage permission)

**Success:** 200 — { success, data: { election } }

**Errors:** 409 (invalid status transition — must be open)

---

### POST /api/v1/elections/{id}/archive

**Purpose:** Archive a closed election (transition from closed to archived).

**Auth:** Authenticated (requires election.manage permission)

**Success:** 200 — { success, data: { election } }

**Errors:** 409 (invalid status transition — must be closed)

---

# 14. Candidate Endpoints

All candidate endpoints require authentication. Candidates are scoped to a specific election.

---

### POST /api/v1/elections/{election_id}/candidates

**Purpose:** Add a candidate to an election.

**Auth:** Authenticated (requires candidate.create permission)

**Request body:**
```
{
  "position_id": 1,
  "name": "Alice Johnson",
  "description": "Experienced board member",
  "sort_order": 1
}
```

**Validation:**
- position_id: required, exists:election_positions,id (scoped to election)
- name: required, string, max:255
- description: string, nullable
- sort_order: integer, nullable, default:0

**Success:** 201 — { success, data: { candidate } }

**Errors:** 409 (duplicate candidate name per position), 422 (validation)

---

### GET /api/v1/elections/{election_id}/candidates

**Purpose:** List candidates for an election, grouped by position.

**Auth:** Authenticated

**Query params:** position_id=, page, per_page, sort

**Success:** 200 — { success, data: [{ candidate, position }], meta: { pagination } }

---

### GET /api/v1/elections/{election_id}/candidates/{id}

**Purpose:** View a single candidate.

**Auth:** Authenticated

**Success:** 200 — { success, data: { candidate, position, election } }

---

### PUT /api/v1/elections/{election_id}/candidates/{id}

**Purpose:** Update a candidate.

**Auth:** Authenticated (requires candidate.update permission)

**Request body:** Same fields as create (all optional)

**Success:** 200 — { success, data: { candidate } }

---

### DELETE /api/v1/elections/{election_id}/candidates/{id}

**Purpose:** Remove a candidate (soft delete).

**Auth:** Authenticated (requires candidate.delete permission)

**Success:** 200 — { success, message: "Candidate removed" }

**Errors:** 409 (election is not in draft/scheduled status)

---

### POST /api/v1/elections/{election_id}/candidates/{id}/photo

**Purpose:** Upload candidate photo.

**Auth:** Authenticated (requires candidate.update permission)

**Request:** multipart/form-data with file field

**Validation:**
- file: required, image, max:5120kb, mimes:jpg,png,webp, dimensions:max:2000x2000

**Success:** 200 — { success, data: { photo_url } }

---

# 15. Participant Endpoints

All participant endpoints require authentication and organization context.

---

### POST /api/v1/participants

**Purpose:** Add a single participant manually.

**Auth:** Authenticated (requires participant.create permission)

**Request body:**
```
{
  "email": "voter@example.com",
  "name": "Jane Voter",
  "identifier": "EMP-001"
}
```

**Validation:**
- name: required, string, max:255
- email: email, nullable, unique:participants (with organization scope via soft-delete)
- identifier: string, max:255, nullable, unique:participants

**Success:** 201 — { success, data: { participant } }

---

### POST /api/v1/participants/csv/upload

**Purpose:** Upload CSV file for participant import.

**Auth:** Authenticated (requires participant.import permission)

**Request:** multipart/form-data with file field

**Validation:**
- file: required, mimes:csv,txt, max:10240kb

**Success:** 201 — { success, data: { csv_import: { id, filename, total_rows, status: "pending" } } }

---

### POST /api/v1/participants/csv/{import_id}/validate

**Purpose:** Validate the uploaded CSV without importing.

**Auth:** Authenticated (requires participant.import permission)

**Success:** 200 — { success, data: { valid_rows, error_rows, errors: [...] } }

---

### POST /api/v1/participants/csv/{import_id}/import

**Purpose:** Execute the CSV import. Processed in the background via queue.

**Auth:** Authenticated (requires participant.import permission)

**Success:** 202 — { success, message: "Import started", data: { import_id, status: "processing" } }

---

### GET /api/v1/participants/csv/{import_id}/status

**Purpose:** Check CSV import progress and results.

**Auth:** Authenticated

**Success:** 200 — { success, data: { id, filename, total_rows, valid_rows, error_rows, status, errors: [...] } }

---

### GET /api/v1/participants

**Purpose:** List participants for the organization.

**Auth:** Authenticated (requires participant.view permission)

**Query params:** status=, search=, election_id=, page, per_page, sort

**Success:** 200 — { success, data: [{ participant, election_count, voted_count }], meta: { pagination } }

---

### GET /api/v1/participants/{id}

**Purpose:** View a single participant and their voting history.

**Auth:** Authenticated (requires participant.view permission)

**Success:** 200 — { success, data: { participant, elections: [{ election, voted_at }] } }

---

### PUT /api/v1/participants/{id}

**Purpose:** Update a participant.

**Auth:** Authenticated (requires participant.update permission)

**Request body:** { name, email, identifier, status } — all optional

**Success:** 200 — { success, data: { participant } }

---

### DELETE /api/v1/participants/{id}

**Purpose:** Remove a participant (soft delete).

**Auth:** Authenticated (requires participant.delete permission)

**Success:** 200 — { success, message: "Participant removed" }

**Errors:** 409 (participant has existing votes — cannot delete, may be deactivated instead)

---

# 16. Voting Endpoints

Voting endpoints require participant authentication. Participants authenticate via security code or voting pass.

---

### GET /api/v1/elections/{election_id}/ballot

**Purpose:** Get the ballot for a participant — returns positions and candidates for the given election.

**Auth:** Authenticated (participant context required)

**Success:** 200 — { success, data: { election, positions: [{ id, title, max_votes, candidates: [{ id, name, photo_url, sort_order }] }] } }

**Errors:** 403 (election not open, participant not eligible), 404 (election not found)

---

### POST /api/v1/elections/{election_id}/votes

**Purpose:** Submit votes for all positions in an election.

**Auth:** Authenticated (participant context required)

**Request body:**
```
{
  "votes": [
    { "position_id": 1, "candidate_id": 3 },
    { "position_id": 2, "candidate_id": 7 }
  ]
}
```

**Validation:**
- votes: required, array, min:1
- votes.*.position_id: required, exists:election_positions,id (scoped to election)
- votes.*.candidate_id: required, exists:candidates,id (scoped to position)
- No duplicate position_ids
- Count of votes per position must not exceed position.max_votes

**Success:** 201 — { success, data: { receipt_id, receipt_hash, message: "Vote recorded successfully" } }

**Errors:**
- 403 (election not open, not eligible, already voted)
- 409 (duplicate vote — already cast for this election)
- 422 (validation errors)

---

### GET /api/v1/elections/{election_id}/receipt/{receipt_id}

**Purpose:** Retrieve a vote receipt for verification.

**Auth:** Authenticated (participant can view own receipt only)

**Success:** 200 — { success, data: { receipt_id, receipt_hash, election_id, cast_at } }

**Errors:** 403 (not the receipt owner), 404 (not found)

---

### GET /api/v1/elections/{election_id}/status

**Purpose:** Check whether the authenticated participant has voted in this election.

**Auth:** Authenticated (participant context)

**Success:** 200 — { success, data: { has_voted: true/false, voted_at: "..." or null } }

---

# 17. Result Endpoints

All result endpoints require authentication. Results visibility depends on election status and user role.

---

### GET /api/v1/elections/{election_id}/results

**Purpose:** Get full results for an election, grouped by position, sorted by vote count descending.

**Auth:** Authenticated (requires results.view permission)

**Success:** 200 — { success, data: { election, positions: [{ id, title, candidates: [{ id, name, vote_count, percentage }] }], total_votes, voter_turnout } }

**Errors:** 403 (results not yet available — election is open and user is not an admin), 404 (not found)

---

### GET /api/v1/elections/{election_id}/results/live

**Purpose:** Get live (real-time) results for an open election. Results update after each vote.

**Auth:** Authenticated (requires results.view permission). Available during open status for authorized roles.

**Success:** Same structure as full results endpoint.

**Strategy:** MVP uses client-side polling every 10 seconds. Future: WebSockets via Laravel Reverb.

---

### GET /api/v1/elections/{election_id}/results/export

**Purpose:** Export results as CSV or PDF.

**Auth:** Authenticated (requires results.export permission)

**Query params:** format=csv|pdf (default: csv)

**Success:** 200 — File download with Content-Disposition header. CSV includes election info, position, candidate, vote count, percentage per row.

---

# 18. Notification Endpoints

All notification endpoints require authentication.

---

### GET /api/v1/notifications

**Purpose:** List notifications for the authenticated user.

**Auth:** Authenticated

**Query params:** unread_only= (boolean, default: false), page, per_page

**Success:** 200 — { success, data: [{ id, type, title, body, data, read_at, created_at }], meta: { pagination, unread_count } }

---

### POST /api/v1/notifications/{id}/read

**Purpose:** Mark a single notification as read.

**Auth:** Authenticated (must own the notification)

**Success:** 200 — { success, data: { notification } }

---

### POST /api/v1/notifications/read-all

**Purpose:** Mark all unread notifications as read.

**Auth:** Authenticated

**Success:** 200 — { success, message: "All notifications marked as read" }

---

# 19. File Upload Endpoints

File upload endpoints are documented within their respective resource sections. This section covers metadata listing and management.

---

### GET /api/v1/uploads

**Purpose:** List uploaded files for the organization.

**Auth:** Authenticated (requires organization.update permission or file ownership)

**Query params:** file_type= (logo|candidate_photo|csv_import|report), page, per_page, sort

**Success:** 200 — { success, data: [{ id, file_type, original_name, mime_type, size, created_at }], meta: { pagination } }

---

### DELETE /api/v1/uploads/{id}

**Purpose:** Delete an uploaded file (soft delete — marks for cleanup).

**Auth:** Authenticated (requires organization.update permission)

**Success:** 200 — { success, message: "File deleted" }

**Errors:** 403 (file in use by active resource)

File upload endpoints per resource:
- Organization logo: POST /api/v1/organization/logo (see Section 11)
- Candidate photo: POST /api/v1/elections/{election_id}/candidates/{id}/photo (see Section 14)
- CSV import: POST /api/v1/participants/csv/upload (see Section 15)

---

# 20. Audit Endpoints

All audit endpoints require authentication and the audit.view permission.

---

### GET /api/v1/audit-logs

**Purpose:** List audit logs for the organization with filtering.

**Auth:** Authenticated (requires audit.view permission)

**Query params:** action=, entity_type=, actor_id=, date_from=, date_to=, page, per_page, sort

**Success:** 200 — { success, data: [{ id, actor, action, entity_type, entity_id, ip_address, created_at, metadata }], meta: { pagination } }

---

### GET /api/v1/audit-logs/{id}

**Purpose:** View a single audit log entry with full details.

**Auth:** Authenticated (requires audit.view permission)

**Success:** 200 — { success, data: { id, actor, action, entity_type, entity_id, ip_address, user_agent, created_at, metadata } }

---

### Export Audit Logs (future) — Deferred to post-MVP.

---

# 21. Dashboard Endpoints

Dashboard endpoints provide aggregate data for the organization dashboard. All require authentication.

---

### GET /api/v1/dashboard/stats

**Purpose:** Get aggregate statistics for the organization dashboard.

**Auth:** Authenticated

**Success:** 200 — { success, data: { total_elections, active_elections, total_participants, total_votes_cast, recent_activity: [{ action, entity_type, created_at }] } }

---

### GET /api/v1/dashboard/elections

**Purpose:** Get election summary cards for dashboard (recent elections with status counts).

**Auth:** Authenticated

**Query params:** limit= (int, default: 5)

**Success:** 200 — { success, data: { by_status: { draft: N, scheduled: N, published: N, open: N, closed: N, archived: N }, recent: [{ id, title, status, start_date, end_date, participant_count, vote_count }] } }

---

# 22. Account & Security Endpoints

Account and security endpoints allow users to manage their own account settings and security preferences.

---

### PUT /api/v1/account/profile

**Purpose:** Update the authenticated user's profile (name, email).

**Auth:** Authenticated

**Request body:**
```
{
  "name": "John Updated",
  "email": "newemail@example.com"
}
```

**Validation:**
- name: required, string, max:255
- email: required, email, max:255, unique:users (exclude current user)

**Success:** 200 — { success, data: { user } }

---

### PUT /api/v1/account/password

**Purpose:** Change the authenticated user's password.

**Auth:** Authenticated

**Request body:**
```
{
  "current_password": "OldPass1!",
  "password": "NewStr0ng!Pass",
  "password_confirmation": "NewStr0ng!Pass"
}
```

**Validation:**
- current_password: required, string, current_password (Laravel rule)
- password: required, string, min:8, confirmed, password policy rules

**Success:** 200 — { success, message: "Password updated" }

---

### POST /api/v1/security/verify-code

**Purpose:** Verify an 8-digit security code for participant voting access.

**Auth:** Guest (with participant context)

**Request body:**
```
{
  "election_id": 1,
  "code": "12345678"
}
```

**Validation:**
- election_id: required, exists:elections,id
- code: required, string, size:8, digits:8 — verified against stored hash

**Success:** 200 — { success, data: { token: "participant-session-token" } }

**Errors:** 403 (invalid/expired code), 429 (rate limited)

---

# 23. Validation Standards

All validation uses Laravel Form Requests. Standard rules by field type:

Email — email, max:255, unique:{table} (with soft-delete scope)

Password — string, min:8, max:128, confirmed, regex:/[A-Z]/, regex:/[a-z]/, regex:/[0-9]/, regex:/[!@#$%^&*()_+\-=\[\]{}|:;\"'<>,.?\/~`]/

Names (user, candidate, organization) — string, max:255, regex:/^[a-zA-Z\s\-\'\.]+$/ (allow letters, spaces, hyphens, apostrophes, periods)

Organization Name — string, max:255, unique:organizations (case-insensitive)

Election Title — string, max:255

Description fields — string, nullable, max:2000

Status fields — string, in:{allowed_values_enum}

Numeric fields — integer or decimal, min/max constraints

Date fields — date, date_format:Y-m-d\TH:i:s\Z or Y-m-d

File uploads — file, mimes:{allowed_extensions}, max:{size_in_kb}, image dimensions validated where applicable

CSV files — file, mimes:csv,txt, max:10240kb

Images — file, image, mimes:jpg,png,webp,svg, max:{size}, dimensions:{max_width}x{max_height}

Unique IDs — exists:{table},{column} — always scoped to the current tenant/organization context where applicable

Boolean fields — boolean, accept:true,false,1,0

JSON fields — json

Array fields — array, min:1, max:{limit}

Pagination fields — page: integer, min:1; per_page: integer, min:1, max:100

---

# 24. Security Standards

All API endpoints must comply with:

Authentication — Session-based via Sanctum. All non-guest routes require a valid session. Invalid/expired sessions return 401.

Authorization — Laravel Policies on every mutating operation. Policy checks happen in Form Requests or controllers. Access denial returns 403.

Rate Limiting — Named rate limiters applied per endpoint group (see 05_AUTHENTICATION_AND_SECURITY.md Section 17). Exceeded limits return 429 with Retry-After header.

Tenant Validation — Every tenant-scoped endpoint must verify the requested entity belongs to the authenticated user's organization. Returns 404 (not 403) for non-accessible entities to prevent information disclosure.

Input Validation — Every request must use a Laravel Form Request. Validation failure returns 422 with field-level errors. No inline validation in controllers.

Secure Uploads — File type, size, and dimension validation on all upload endpoints. Reject executable files. Store outside public web root.

CSRF Protection — Sanctum SPA authentication handles CSRF via XSRF-TOKEN cookie. Additional CSRF tokens not required for API routes.

Security Headers — Applied globally via middleware (see 05_AUTHENTICATION_AND_SECURITY.md Section 19).

Error Consistency — All errors use the standard JSON envelope. Exception handler normalizes all exceptions.

---

# 25. HTTP Status Codes

200 OK — Successful GET, PUT, and POST requests that return data. Always includes success:true in response body.

201 Created — Successful POST requests that create a new resource. Includes the created resource in data.

204 No Content — Successful DELETE requests or operations with no return payload. No response body.

400 Bad Request — Malformed request syntax or invalid parameters. Not used for validation errors.

401 Unauthorized — Missing or invalid authentication session. Client should redirect to login.

403 Forbidden — Authenticated but lacks permission for the requested action (authorization denial, email not verified, tenant mismatch).

404 Not Found — Requested resource does not exist or is not accessible in the current tenant context. Used for both non-existence and tenant isolation.

409 Conflict — Business rule violation. Includes specific error_code for programmatic handling (e.g., vote_already_cast, election_not_open, duplicate_invitation).

422 Unprocessable Entity — Validation failure. Includes errors object with field-level messages.

429 Too Many Requests — Rate limit exceeded. Includes Retry-After header with seconds until reset.

500 Internal Server Error — Unexpected server error. Generic error message; detailed exception logged server-side. Includes a unique error ID for support reference.

---

# 26. API Versioning

Versioning uses URI prefix: /api/v1/, /api/v2/, etc.

Strategy: The current API version (v1) remains active for at least 6 months after v2 is released. During the overlap period, both versions serve the same data. Deprecated endpoints return a Deprecation warning header. New features are added only to the latest version unless backporting is explicitly required.

Backwards compatibility: Existing endpoints in a version are never changed in a breaking way within the same version. Breaking changes (response format changes, field removals, behavior changes) require a new version. Additive changes (new fields, new endpoints) are allowed within a version.

---

# 27. Definition of Done

The API specification is complete when:

Every frontend feature has a corresponding endpoint.

Responses are standardized.

Errors are standardized.

Security requirements are documented.

Validation rules are documented.

Pagination, filtering, sorting and searching are standardized.

---

# 28. Conclusion

This document defines the official API contract for ORIVIS.

All frontend and backend development must comply with this specification.

No undocumented endpoint should be introduced into the project.

---

End of document.
