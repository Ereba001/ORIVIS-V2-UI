# ORIVIS Backend System Architecture

Version: 1.0

Status: Active

Last Updated: July 2026

---

# 1. Purpose

This document defines the architectural standards for the ORIVIS backend.

Every backend implementation must follow this architecture.

Architectural consistency is mandatory.

When conflicts arise, this document takes precedence over implementation unless officially revised.

---

# 2. Architectural Philosophy

ORIVIS is designed as a modern enterprise-grade SaaS platform.

The architecture must be:

- Modular
- Scalable
- Secure
- Maintainable
- Extensible
- Testable
- Multi-tenant
- API-first

Every module should be independently maintainable.

---

# 3. Technology Stack

Framework

Laravel 12

Language

PHP 8.3+

Database

MySQL 8

API

REST API

Authentication

Laravel Authentication

Email

Brevo

Queue

Database Queue during development

Redis ready for production

Storage

Laravel Storage

Cloud storage abstraction

---

# 4. High Level Architecture

Client

↓

React Frontend

↓

REST API

↓

Middleware

↓

Controllers

↓

Service Layer

↓

Models

↓

Database

Every request follows this flow.

Controllers must never contain heavy business logic.

---

# 5. Backend Directory Architecture

app/ — Application source code containing all domain logic.

Actions/ — Single-action invokable classes for simple operations that do not warrant a full Service class.

Console/ — Custom Artisan commands (e.g., cleanup, report generation, maintenance tasks).

Events/ — Event classes dispatched when significant actions occur (e.g., VoteCast, ElectionClosed).

Exceptions/ — Custom exception classes and the exception handler for consistent error responses.

Helpers/ — Global helper functions for shared utility operations.

Http/Console — Console kernel, middleware registration, route definitions.

Http/Controllers — Thin controllers that accept requests, delegate to services, and return responses. Must never contain business logic.

Http/Middleware — Custom middleware for tenant scoping, authentication, authorization, and request preprocessing.

Http/Requests — Laravel Form Request classes containing all validation and authorization logic per endpoint.

Http/Resources — Laravel API Resource classes for consistent JSON response formatting.

Jobs/ — Queueable job classes for background processing (emails, CSV imports, report generation).

Listeners/ — Event listener classes that handle dispatched events (e.g., send email on OrganizationRegistered).

Mail/ — Mail classes for transactional emails (verification, invitations, password reset).

Models/ — Eloquent model classes representing database entities with relationships, scopes, casts, and accessors.

Notifications/ — Notification classes for database, email, and future channel notifications.

Observers/ — Eloquent observer classes that react to model lifecycle events (created, updated, deleted).

Policies/ — Authorization policy classes that govern CRUD permissions per entity.

Providers/ — Service providers for bootstrapping application services and registering bindings.

Rules/ — Custom validation rule classes for reusable validation logic.

Services/ — Service-layer classes containing business logic, workflow coordination, and transaction management.

Traits/ — Reusable trait classes shared across models, services, or controllers.

Repositories/ (optional) — Repository pattern for complex query abstraction when justified.

Support/Enums/ — PHP enum classes for statuses, roles, permissions, and other fixed-value sets.

database/migrations/ — Laravel migration files for database schema changes, ordered by creation timestamp.

database/factories/ — Model factory classes for test and development data generation.

database/seeders/ — Database seeder classes for populating test and reference data.

routes/ — Route definition files (api.php, web.php, console.php) mapping URIs to controllers.

config/ — Laravel configuration files for application settings and third-party services.

storage/ — Local file storage directory for uploads, logs, and generated files.

tests/ — Test files organized by type (Feature, Unit) mirroring the app/ structure.

---

# 6. Layer Responsibilities

Controller

Accept requests.

Validate request classes.

Call services.

Return API responses.

Nothing more.

---

Service Layer

Contains business logic.

Coordinates workflows.

Calls models.

Uses transactions where necessary.

---

Model

Represents database entities.

Contains relationships.

Contains scopes.

Contains casts.

Contains accessors.

Must never become bloated.

---

Request Validation

All validation must use Laravel Form Requests.

Validation must never be placed directly inside controllers.

---

Resources

All API responses should use Laravel API Resources whenever practical.

---

# 7. API Architecture

Backend communicates only through REST APIs.

Rules

Consistent JSON responses

HTTP status codes

Version ready

No HTML responses

Predictable error format

Pagination support

Filtering support

Sorting support

Search support

---

# 8. Multi-Tenant Architecture

Tenant

Organization

Every major entity belongs to an organization.

Examples

Election

Candidate

Participant

Team Member

Audit Log

Workspace Settings

Every query must be tenant-aware.

Never expose another tenant's data.

Tenant scoping in Laravel uses a Global Scope on the organization_id column, applied via a middleware that sets the tenant context from the authenticated user's organization. Every tenant-scoped model includes a TenantScope trait that applies ->where('organization_id', $currentOrganizationId) to all queries. Controllers and Services receive the tenant context from middleware rather than resolving it directly. Cross-tenant queries are prohibited except for Founder-level platform operations with explicit authorization.

---

# 9. Authentication Architecture

Support

Registration

Email Verification

Login

Logout

Password Reset

Session Authentication

Remember Me

Future support for MFA

Authentication flow: Visitor registers an organization → creates primary Organization Owner → sends email verification → user verifies email → account activates → automatic login → redirect to dashboard. Login uses email + password with Laravel's built-in authentication. Session-based authentication with Sanctum for SPA compatibility. Remember Me extends session lifetime. Password reset uses Laravel's notification-based reset flow with expiring tokens. All protected routes require authentication middleware; email verification is checked separately for sensitive operations.

---

# 10. Authorization Architecture

Use Laravel Policies and Gates.

Support:

Founder

Organization Owner

Organization Admin

Election Manager

Participant Manager

Observer

Future custom roles.

Permission strategy: Use Laravel Policies for model-level authorization (one Policy per entity) and Gates for action-level checks. Permissions are stored as granular strings (e.g., "election.create", "election.publish") and assigned to roles via a role-permission pivot table. Each user within an organization has one role; the role determines available permissions. Policies check both role-based and ownership-based rules. Super-admin Founder role bypasses organization-specific policies but scoping still applies.

---

# 11. Service Architecture

Business logic belongs inside Services.

Examples

AuthenticationService

OrganizationService

ElectionService

CandidateService

ParticipantService

VotingService

ResultService

NotificationService

WorkspaceService

AuditService

Responsibilities:

AuthenticationService — Registration, login, logout, email verification, password reset, token management.

OrganizationService — Organization CRUD, workspace settings, branding, tenant lifecycle management.

ElectionService — Election CRUD, lifecycle transitions (publish, close, archive), status management.

CandidateService — Candidate CRUD, photo upload, position assignment, ordering.

ParticipantService — Participant CRUD, CSV import, validation, duplicate detection, bulk operations.

VotingService — Ballot generation, vote submission, duplicate prevention, receipt generation.

ResultService — Result calculation per position/candidate, live result aggregation, export generation.

NotificationService — Notification creation, delivery, read/unread tracking, batch sending.

WorkspaceService — Workspace settings, organization configuration, feature toggles.

AuditService — Audit log creation, querying, export, retention management.

---

# 12. Event Driven Design

Recommend events for:

Organization Registered

Election Published

Election Closed

Participant Imported

Vote Cast

Password Reset

Email Verified

Events decouple the action from its side effects. For example, VoteCast dispatches an event that triggers receipt generation, audit logging, result recalculation, and notification sending — all via separate listeners. This makes the codebase easier to extend (add a listener without modifying the vote controller), test (test each listener independently), and maintain (isolate failure in one listener without affecting the vote action).

---

# 13. Queue Architecture

Development

Database Queue

Production

Redis Queue

Jobs should include:

Emails

CSV Imports

Reports

Large Notifications

Future background processing.

---

# 14. File Storage Architecture

Support

Organization Logos

Candidate Photos

CSV Files

Reports

Future Documents

Storage uses Laravel's Storage facade with the local disk in development and S3-compatible cloud storage in production. All files are stored under the tenant-prefixed path `organizations/{organization_id}/{type}/` for isolation. Metadata (filename, MIME type, size, path) is stored in the database; binary content is never stored in the database. Unique filenames are generated via Str::uuid() to prevent collisions. File access is mediated through Laravel's temporary signed URLs for cloud storage.

---

# 15. Error Handling Strategy

Standard JSON error format: { "success": false, "message": "...", "errors": {}, "error_code": "..." }

Validation Errors (422) — Returned via Form Request exceptions with per-field error messages in the errors object.

Authentication Errors (401) — Returned when the user is not authenticated or session has expired.

Authorization Errors (403) — Returned when the user lacks permission for the requested action via Policy denial.

Business Rule Violations (409) — Returned for duplicate votes, invalid status transitions, or rule violations.

Not Found (404) — Returned when a requested entity does not exist or is not accessible in the current tenant context.

Rate Limit (429) — Returned when the user exceeds rate-limit thresholds with retry-after header.

Server Errors (500) — Returned for unexpected exceptions with a generic message; detailed error logged server-side.

All errors use the same JSON envelope. The exception handler in App\Exceptions\Handler normalizes all exceptions into the standard format.

---

# 16. Logging Strategy

Explain use of Laravel logging.

Log:

Authentication

Errors

Exceptions

Security Events

Critical Business Events

Avoid logging sensitive information.

---

# 17. Performance Strategy

Recommend:

Pagination

Database Indexes

Eager Loading

Caching readiness

Queue usage

Efficient Queries

Avoid N+1 queries.

---

# 18. Scalability Strategy

Architecture should support future:

Redis

WebSockets

Horizontal Scaling

Multiple Servers

Cloud Storage

Microservice migration if required

without major redesign.

---

# 19. Security Strategy

Discuss architectural security including:

CSRF

XSS

SQL Injection

Mass Assignment

Rate Limiting

Password Hashing

Secure Sessions

Input Validation

Output Escaping

Tenant Isolation

Audit Logging

---

# 20. Testing Architecture

Testing strategy uses PHPUnit with the following structure:

Feature Tests (tests/Feature/) — Test complete HTTP request/response cycles. One test file per endpoint group. Cover success, validation failure, authorization denial, and edge cases.

Unit Tests (tests/Unit/) — Test Services, Actions, and custom logic in isolation. Mock external dependencies. Cover business rules and edge cases.

Authentication Tests — Test registration, login, logout, email verification, password reset, session expiry, rate limiting.

Voting Tests — Test ballot retrieval, vote submission, duplicate prevention, receipts, immutable vote enforcement.

CSV Import Tests — Test file validation, row parsing, duplicate detection, error reporting, rollback on failure.

Permission Tests — Test every role against every authorized/unauthorized action to ensure Policies enforce correctly.

Testing requirements: Every service method must have a test. Every Form Request must have a validation test. Every Policy must have an authorization test. Database transactions roll back after each test. Use factories for test data. Aim for 80%+ code coverage on Services and Policies.

---

# 21. Development Standards

Controllers remain thin.

Services contain business logic.

Validation always uses Form Requests.

Transactions protect critical operations.

Relationships are always defined.

Soft Deletes used where appropriate.

Never duplicate logic.

Always document significant architectural decisions.

---

# 22. Definition of Done

Architecture is considered correctly implemented when:

All modules follow this document.

Business logic is centralized.

Tenant isolation is enforced.

Authentication is secure.

APIs are consistent.

Security standards are met.

The architecture supports future commercial expansion without redesign.

---

# 23. Conclusion

This document serves as the architectural constitution for the ORIVIS backend.

Every implementation phase must reference and comply with this document.

Future documentation must remain consistent with this architecture.

---

End of document.
