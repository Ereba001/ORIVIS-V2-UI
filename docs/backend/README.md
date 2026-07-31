# ORIVIS Backend Documentation

This directory contains the complete backend documentation for the ORIVIS platform — a multi-tenant Laravel 12 SaaS election application.

## Recommended Reading Order

| # | Document | Purpose | Essential? |
|---|---|---|---|
| 01 | [Project Overview](./01_PROJECT_OVERVIEW.md) | Master vision, scope, MVP boundaries, architecture philosophy | Yes |
| 02 | [System Architecture](./02_SYSTEM_ARCHITECTURE.md) | Architectural standards, layers, directory structure, service definitions | Yes |
| 03 | [Business Rules](./03_BUSINESS_RULES.md) | Platform behaviour rules — election lifecycle, voting, tenants, invitations | Yes |
| 04 | [Database Architecture](./04_DATABASE_ARCHITECTURE.md) | Engine, naming, full column specs for every entity, relationships, indexes | Yes |
| 05 | [Authentication & Security](./05_AUTHENTICATION_AND_SECURITY.md) | Auth flows, password policy, session management, rate limits, security headers | Yes |
| 06 | [API Specification](./06_API_SPECIFICATION.md) | REST API contract — all endpoints with method, URI, validation, responses | Yes |
| 07 | [Frontend-Backend Mapping](./07_FRONTEND_BACKEND_MAPPING.md) | Full mapping of 67 pages, 78 routes, 59 components to API requirements | Reference |
| 08 | [Development Rulebook](./08_DEVELOPMENT_RULEBOOK.md) | Coding standards, AI behaviour rules, testing requirements | Reference |
| 09 | [Decision Log](./09_DECISION_LOG.md) | Permanent architectural decision record | Reference |
| 10 | [Audit Report](./AUDIT_REPORT.md) | Pre-implementation audit with findings, scores, and recommendations | Reference |

## Status

All documents are active and have been audited. See [AUDIT_REPORT.md](./AUDIT_REPORT.md) for a full assessment and the recommended action plan before implementation begins.

## Key Contacts

- Framework: Laravel 12 / PHP 8.3+
- Database: MySQL 8
- Frontend: React SPA (Vite)
- Auth: Laravel Sanctum (session-based)
- Email: Brevo
