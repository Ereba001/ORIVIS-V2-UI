# ORIVIS Business Rules

Version: 1.0

Status: Active

Last Updated: July 2026

---

# 1. Purpose

Define the business behaviour of the ORIVIS platform.

This document explains how the platform must behave regardless of implementation details.

---

# 2. Platform Principles

The platform shall prioritise:

- Trust
- Transparency
- Security
- Simplicity
- Fairness
- Reliability

Every business rule must support these principles.

---

# 3. Multi-Tenant Rules

- Every organization is an independent tenant.
- Organizations cannot access each other's data.
- Every election belongs to exactly one organization.
- Every candidate belongs to exactly one election.
- Every participant belongs to exactly one organization.
- Every vote belongs to one election and one participant.
- Tenant isolation is mandatory.

---

# 4. Organization Rules

Organizations may:

- Register.
- Verify their email.
- Create one workspace.
- Edit their profile.
- Configure branding.
- Invite team members.

Organizations may not access another organization's resources.

---

# 5. Workspace Rules

Every organization owns exactly one workspace.

Workspace settings include:

- Name
- Logo
- Primary colour
- Secondary colour
- Cover image
- Contact details

Changes take effect immediately.

---

# 6. Team Rules

An organization may invite multiple users.

Each user has one role.

A user may belong to multiple organizations in the future, but only within the permissions granted by each organization.

Invitations expire after a configurable period.

---

# 7. Election Rules

An election belongs to one organization.

Election lifecycle:

Draft

↓

Scheduled

↓

Published

↓

Open

↓

Closed

↓

Archived

Allowed transitions:
- Draft → Scheduled (set start/end dates)
- Draft → Cancelled (terminal — no voting possible)
- Scheduled → Published (make visible)
- Scheduled → Cancelled (terminal)
- Published → Open (start voting period)
- Published → Cancelled (terminal)
- Open → Closed (end voting period)
- Closed → Archived (final read-only state)

Rules:

Draft elections cannot receive votes.

Scheduled elections have fixed dates and positions but are not yet visible to participants.

Published elections become visible according to their visibility settings.

Open elections accept votes.

Closed elections reject every voting attempt. Results are final.

Archived elections become read-only. All data preserved.

Cancelled elections are a terminal state — no further transitions possible. Results are not produced.

Status Mapping (Backend enum → Frontend display):

| Backend Enum | Frontend Badge | Notes |
|---|---|---|
| draft | Draft | Initial editable state |
| scheduled | Ready | Dates configured, positions set, awaiting publish |
| published | Published | Visible to participants, not yet accepting votes |
| open | Live | Actively accepting votes |
| closed | Completed | Voting ended, results available |
| cancelled | Cancelled | Terminal — election abandoned |
| archived | Archived | Read-only final state |

---

# 8. Candidate Rules

Candidates belong to one election.

Candidates may be edited before publication.

After publication, editing should be restricted according to election status.

Candidate photographs are optional but recommended.

Each candidate must belong to a valid contest or position.

---

# 9. Participant Rules

Participants may be added by:

- CSV Import
- Manual entry (future)

Duplicate participants within the same organization must not be created.

Participant validation must occur before import.

Invalid rows must be reported.

---

# 10. Voting Rules

Each eligible participant may vote only once in an election.

Votes cannot be changed after submission.

Votes cannot be deleted.

Votes cannot be edited.

Voting is only permitted while the election is open.

The backend must reject duplicate voting attempts.

---

# 11. Result Rules

Results are calculated from stored votes.

Manual modification of vote totals is prohibited.

Winners are determined using the configured election method.

Closed elections produce final results.

---

# 12. Authentication Rules

Organizations must verify their email before accessing protected areas.

Passwords are never stored in plain text.

Password reset tokens expire.

Sessions must expire after inactivity.

Future support for MFA must be considered.

---

# 13. Email Rules

System emails include:

- Welcome
- Email verification
- Password reset
- Invitation
- Election notifications

Email sending failures must never break core business operations.

---

# 14. File Upload Rules

Allowed uploads include:

- Organization logos
- Candidate photos
- CSV participant files

Uploads must be validated for:

- File type
- File size
- File extension

Unsafe files must be rejected.

---

# 15. Audit Rules

Important business events should be recorded.

Examples include:

- Registration
- Login
- Election creation
- Election publication
- Participant import
- Vote submission
- Election closure

Audit records must not be editable through normal application workflows.

---

# 16. Error Rules

Business rule violations must return clear and consistent error responses.

Examples:

- Duplicate vote
- Election closed
- Invalid participant
- Unauthorized access
- Invalid invitation

---

# 17. Future Expansion Rules

The platform must remain compatible with:

- Subscription plans
- Paystack billing
- Founder approval workflow
- Advanced reporting
- Multi-language support
- Mobile applications
- Public APIs

Future functionality must not require redesign of current business rules.

---

# 18. Definition of Done

Business logic is considered compliant when:

- All workflows follow this document.
- No business rules are hard-coded inconsistently.
- Security rules are enforced.
- Tenant isolation is maintained.
- Voting integrity is preserved.

---

# 19. Conclusion

This document defines the operational behaviour of ORIVIS.

All backend services, controllers, policies, and future modules must implement these business rules consistently.

---

End of document.
