# ORIVIS Backend Development Rulebook

Version: 1.0

Status: Active

Last Updated: July 2026

---

# 1. Purpose

This document establishes the development standards for the ORIVIS backend.

Its purpose is to ensure consistency, maintainability, scalability, security and production-quality implementation across the entire project.

No backend implementation may ignore these rules.

---

# 2. General Principles

Every implementation must be:

- Production Ready
- Secure
- Readable
- Modular
- Maintainable
- Testable
- Extensible
- Consistent

Code quality takes priority over development speed.

---

# 3. AI Behaviour Rules

The AI agent shall:

Understand existing code before making changes.

Prefer extending existing implementations rather than replacing them.

Never duplicate logic.

Never remove working functionality.

Never redesign the frontend.

Never rename routes without explicit instruction.

Never introduce breaking changes.

Never generate placeholder implementations unless explicitly requested.

Never leave TODO comments for unfinished core functionality.

Always finish one feature completely before moving to the next.

---

# 4. Architecture Rules

Follow the documented architecture exactly.

Controllers must remain thin.

Business logic belongs inside Services.

Validation belongs inside Form Requests.

Authorization belongs inside Policies and Gates.

Models represent data.

Resources format API responses.

Events trigger asynchronous behaviour.

Jobs handle background processing.

Repositories may be used only where they provide clear value.

---

# 5. Database Rules

Always create migrations.

Always define foreign keys.

Always define indexes.

Always define relationships.

Use transactions for critical operations.

Never bypass tenant isolation.

Never hard-code IDs.

Prefer database constraints over application-only enforcement.

---

# 6. API Rules

Every endpoint must:

Validate input.

Authorise access.

Return consistent JSON.

Return correct HTTP status codes.

Handle exceptions gracefully.

Support future versioning.

No endpoint should return HTML.

---

# 7. Security Rules

Every implementation must protect against:

SQL Injection

Cross Site Scripting

Cross Site Request Forgery

Mass Assignment

Broken Access Control

Session Fixation

Brute Force Attacks

Privilege Escalation

Unsafe File Uploads

Security must never be optional.

---

# 8. Validation Rules

Every request must use Laravel Form Requests.

Never validate directly inside controllers.

Validation must include:

Required fields

Formats

Lengths

Enums

Uniqueness

Existence

Business rules

---

# 9. Authentication Rules

Authentication must use Laravel best practices.

Require:

Email verification

Secure password hashing

Session regeneration

Logout invalidation

Rate limiting

Future MFA compatibility

---

# 10. Authorization Rules

Every protected action must check permissions.

Never assume authenticated users are authorised.

Policies must protect:

Organizations

Elections

Participants

Candidates

Workspace Settings

Audit Logs

---

# 11. Service Rules

Every major module should have a dedicated Service.

Examples:

AuthenticationService

OrganizationService

WorkspaceService

ElectionService

CandidateService

ParticipantService

VotingService

ResultService

NotificationService

AuditService

Services should remain cohesive and focused.

---

# 12. Error Handling Rules

Never expose internal exceptions.

Return consistent API errors.

Log unexpected exceptions.

Do not reveal stack traces in production.

Provide meaningful validation messages.

---

# 13. Logging Rules

Log:

Authentication events

Security events

Voting events

Election publication

Participant imports

Critical failures

Never log passwords, tokens or sensitive secrets.

---

# 14. File Upload Rules

Validate:

Type

Extension

MIME

Size

Dimensions (where applicable)

Store metadata only in the database.

Generate unique filenames.

---

# 15. Performance Rules

Prevent N+1 queries.

Use eager loading.

Use pagination.

Use chunking for large imports.

Queue long-running jobs.

Optimise indexes.

---

# 16. Documentation Rules

Whenever implementation changes architecture, APIs or database design:

Update the relevant documentation immediately.

Documentation must never become outdated.

---

# 17. Git Workflow

Encourage:

Small commits

Clear commit messages

Feature branches

No direct breaking changes to main.

---

# 18. Testing Rules

Every completed feature should include:

Feature Tests

Unit Tests where appropriate

API Tests

Permission Tests

Validation Tests

Regression checks

Critical workflows must be tested before completion.

---

# 19. Code Review Checklist

Before completing any phase verify:

Architecture compliance

Security compliance

Database integrity

API consistency

Permission enforcement

Validation coverage

Frontend compatibility

Documentation updates

---

# 20. Definition of Done

A feature is complete only when:

Implementation is complete.

Validation is complete.

Permissions are enforced.

Documentation is updated.

Frontend integration works.

Tests pass.

No known critical issues remain.

---

# 21. Conclusion

This document is the official backend development rulebook for ORIVIS.

Every implementation phase, feature and code review must comply with these rules.

Any deviation requires explicit architectural approval.

---

End of document.
