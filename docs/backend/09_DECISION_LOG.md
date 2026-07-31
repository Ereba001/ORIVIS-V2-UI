# ORIVIS Backend Decision Log

Version: 1.0

Status: Active

Last Updated: July 2026

---

# 1. Purpose

The purpose of this document is to preserve the reasoning behind important project decisions.

It provides long-term continuity across AI sessions and future contributors.

---

# 2. How to Use This Document

Before making significant architectural or business changes:

- Review existing decisions.
- Determine whether a related decision already exists.
- Do not silently reverse previous decisions.
- If a change is required, create a new decision entry explaining why the previous decision has been superseded.

---

# 3. Decision Entry Format

Each decision must contain:

Decision ID

Date

Category

Status

Decision

Reason

Alternatives Considered

Impact

Related Documentation

Implementation Notes

Supersedes (if applicable)

---

# 4. Initial Architectural Decisions

Generate initial entries for at least the following decisions.

---

Decision 001

Category

Architecture

Decision

ORIVIS will use Laravel 12 with PHP 8.3+ as the backend framework.

Reason

Mature ecosystem, security, maintainability, strong community support and long-term scalability.

---

Decision 002

Category

Frontend

Decision

The existing React frontend is the source of truth for the user interface.

Reason

The backend exists to power the frontend rather than redesign it.

---

Decision 003

Category

Architecture

Decision

Business logic belongs in dedicated Service classes.

Reason

Thin controllers improve maintainability and testability.

---

Decision 004

Category

Security

Decision

Tenant isolation is mandatory.

Reason

Organizations must never access another organization's data.

---

Decision 005

Category

Authentication

Decision

Email verification is required before accessing protected organization functionality.

Reason

Improve trust and reduce fraudulent registrations.

---

Decision 006

Category

Platform

Decision

One organization owns one workspace during the Presentation MVP.

Reason

Simplifies implementation while remaining extensible for future enhancements.

---

Decision 007

Category

Presentation MVP

Decision

Commercial platform features are intentionally postponed.

Deferred features include:

- Paystack
- Billing
- Subscription Plans
- Revenue Management
- Founder Analytics

Reason

The immediate objective is to demonstrate a complete election workflow rather than a commercial SaaS platform.

---

Decision 008

Category

Email

Decision

Brevo will be used for transactional email services.

Reason

Supports email verification, password reset, invitations and election notifications.

---

Decision 009

Category

Database

Decision

Internal database records use BIGINT primary keys while public-facing identifiers may use UUIDs where appropriate.

Reason

Improves performance while reducing exposure of predictable identifiers.

---

Decision 010

Category

Development

Decision

Documentation is part of the codebase.

Reason

Documentation must remain synchronized with implementation to prevent architectural drift.

---

# 5. Decision Categories

Recommended categories include:

Architecture

Database

API

Security

Authentication

Authorization

Frontend Integration

Performance

Infrastructure

Business Rules

Presentation MVP

Notifications

Email

Deployment

Testing

Documentation

---

# 6. Decision Status

Support the following statuses:

Active

Superseded

Deprecated

Rejected

Experimental

---

# 7. Change Management

Architectural changes should only occur when:

- A clear technical limitation exists.
- Security is improved.
- Performance is improved.
- Maintainability is improved.
- Business requirements change.

Every change must include a written justification.

---

# 8. AI Behaviour

The AI agent must:

Read this document before making architectural decisions.

Avoid reversing existing decisions.

Prefer extending current architecture rather than replacing it.

Record every significant architectural change.

Update related documentation whenever a new decision is added.

---

# 9. Review Schedule

Recommend reviewing this document:

- At the end of every major implementation phase.
- Before introducing new infrastructure.
- Before major database changes.
- Before security changes.
- Before deployment.

---

# 10. Definition of Done

This document is functioning correctly when:

Major decisions are preserved.

Historical reasoning is retained.

Architectural consistency is maintained.

Future contributors can understand why decisions were made.

---

# 11. Conclusion

This document is the permanent architectural memory of ORIVIS.

It exists to preserve continuity, prevent accidental regressions and ensure long-term consistency throughout the lifecycle of the platform.

---

End of document.
