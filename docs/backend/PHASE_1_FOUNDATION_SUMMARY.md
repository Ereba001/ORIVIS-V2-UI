# Phase 1 — Backend Foundation Summary

> **Last updated:** 2026-07-30
> **Git commit:** `bd3c0cba`
> **Branch:** `main`

---

## 1. Folder Structure

```
backend/
├── app/
│   ├── Actions/
│   │   └── Action.php                          # Base action class
│   ├── Contracts/
│   │   ├── OrganizationAwareInterface.php       # Tenant isolation contract
│   │   ├── RepositoryInterface.php              # Persistence contract
│   │   └── ServiceInterface.php                 # Service marker interface
│   ├── DTOs/
│   │   └── BaseDto.php                          # Base data transfer object
│   ├── Enums/
│   │   ├── ElectionStatus.php                   # draft/scheduled/published/open/closed/archived/cancelled
│   │   ├── ElectionType.php                     # single/multiple/ranked
│   │   ├── OrganizationStatus.php               # active/suspended/trial/expired
│   │   ├── Permission.php                       # Granular permission strings
│   │   └── Role.php                             # founder/owner/admin/election_manager/participant_manager/observer
│   ├── Exceptions/
│   │   ├── ApiException.php                     # Base API exception with render()
│   │   ├── ForbiddenException.php               # 403
│   │   ├── NotFoundException.php                # 404
│   │   ├── UnauthorizedException.php            # 401
│   │   └── ValidationException.php              # 422
│   ├── Helpers/
│   │   └── helpers.php                          # Global helper functions (autoloaded)
│   ├── Http/
│   │   ├── Controllers/
│   │   │   ├── Controller.php                   # Base controller with ApiResponse trait
│   │   │   └── Api/V1/
│   │   │       └── HealthController.php         # Health check endpoint
│   │   ├── Middleware/
│   │   │   └── ForceJsonResponse.php            # Forces Accept: application/json
│   │   ├── Requests/Api/V1/                     # (empty — ready for form requests)
│   │   └── Resources/Api/V1/
│   │       ├── BaseCollection.php               # Paginated JSON wrapper
│   │       └── BaseResource.php                 # Single resource JSON wrapper
│   ├── Models/
│   │   └── User.php                             # Authenticatable model (Sanctum-ready)
│   ├── Policies/
│   │   └── BasePolicy.php                       # Org member/permission helper methods
│   ├── Providers/
│   │   └── AppServiceProvider.php
│   ├── Repositories/
│   │   └── BaseRepository.php                   # Generic CRUD implementation
│   ├── Services/
│   │   └── BaseService.php                      # Transaction + logging helpers
│   ├── Support/Enums/                           # (reserved for support enums)
│   └── Traits/
│       ├── ApiResponse.php                      # success/error/paginated JSON responses
│       ├── Filterable.php                       # Scope-based query filtering
│       ├── HasCreatedBy.php                     # created_by user relationship
│       ├── Sortable.php                         # Scope-based query sorting
│       └── TenantScope.php                      # organization_id scoping
├── bootstrap/
│   └── app.php                                  # Middleware, exceptions, routing config
├── config/
│   ├── app.php                                  # name, timezone (Africa/Lagos), debug
│   ├── auth.php
│   ├── cache.php
│   ├── cors.php                                 # SPA CORS with credentials
│   ├── database.php                             # MySQL default
│   ├── filesystems.php
│   ├── logging.php                              # Daily rotation, 30-day retention
│   ├── mail.php                                 # SMTP defaults (Brevo-ready)
│   ├── queue.php
│   ├── sanctum.php                              # Stateful SPA auth, 1-year expiry
│   ├── services.php
│   └── session.php
├── database/
│   └── migrations/
│       ├── 0001_01_01_000000_create_users_table.php      # users, password_reset_tokens, sessions
│       ├── 0001_01_01_000001_create_cache_table.php       # cache, cache_locks
│       ├── 0001_01_01_000002_create_jobs_table.php        # jobs, job_batches, failed_jobs
│       └── 2026_07_30_015405_create_personal_access_tokens_table.php  # Sanctum tokens
├── routes/
│   ├── api.php                                           # Prefix v1, loads api_v1.php
│   ├── api_v1.php                                        # v1 route definitions
│   ├── web.php
│   └── console.php
├── .env.example
└── composer.json
```

---

## 2. Installed Packages

### Production
| Package | Version | Purpose |
|---|---|---|
| `laravel/framework` | ^12.0 | Core framework |
| `laravel/sanctum` | ^4.3 | SPA session auth + API tokens |
| `laravel/tinker` | ^2.10 | Interactive REPL |

### Dev
| Package | Version | Purpose |
|---|---|---|
| `fakerphp/faker` | ^1.23 | Test data generation |
| `laravel/pail` | ^1.2 | Log viewer |
| `laravel/pint` | ^1.13 | PSR-12 linting |
| `laravel/sail` | ^1.41 | Docker dev environment |
| `mockery/mockery` | ^1.6 | Test mocking |
| `nunomaduro/collision` | ^8.6 | CLI error handling |
| `phpunit/phpunit` | ^11.5 | Test framework |

---

## 3. Environment Requirements

| Requirement | Version |
|---|---|
| PHP | ^8.2 |
| MySQL | 8.0+ |
| Composer | 2.x |
| Extensions | `pdo_mysql`, `zip`, `mbstring`, `xml`, `curl`, `gd` (for images) |

---

## 4. Configuration Summary

| Setting | Value | Config File |
|---|---|---|
| App Name | `ORIVIS` | `config/app.php` |
| Environment | `local` (dev) / `production` | `.env` |
| Timezone | `Africa/Lagos` | `config/app.php` |
| Locale | `en` | `config/app.php` |
| Debug Mode | `true` (dev) / `false` (prod) | `.env` |
| Bcrypt Rounds | 12 | `.env` |
| URL | `http://localhost:8000` | `.env` |

### `.env.example` Keys

```
APP_NAME, APP_ENV, APP_KEY, APP_DEBUG, APP_URL
APP_LOCALE, APP_FALLBACK_LOCALE, APP_FAKER_LOCALE
APP_MAINTENANCE_DRIVER
PHP_CLI_SERVER_WORKERS
BCRYPT_ROUNDS
LOG_CHANNEL, LOG_STACK, LOG_DEPRECATIONS_CHANNEL, LOG_LEVEL
DB_CONNECTION, DB_HOST, DB_PORT, DB_DATABASE, DB_USERNAME, DB_PASSWORD
SESSION_DRIVER, SESSION_LIFETIME, SESSION_ENCRYPT, SESSION_PATH, SESSION_DOMAIN
BROADCAST_CONNECTION, FILESYSTEM_DISK, QUEUE_CONNECTION
CACHE_STORE
MEMCACHED_HOST
REDIS_CLIENT, REDIS_HOST, REDIS_PASSWORD, REDIS_PORT
MAIL_MAILER, MAIL_SCHEME, MAIL_HOST, MAIL_PORT, MAIL_USERNAME, MAIL_PASSWORD
MAIL_FROM_ADDRESS, MAIL_FROM_NAME
AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_DEFAULT_REGION, AWS_BUCKET
AWS_USE_PATH_STYLE_ENDPOINT
SANCTUM_STATEFUL_DOMAINS
FRONTEND_URL
VITE_APP_NAME
```

---

## 5. API Conventions

### Base URL
```
/api/v1
```

### Versioning Strategy
- Version prefix in route file: `routes/api.php` groups all routes under `prefix('v1')`
- Version-specific routes in `routes/api_v1.php`
- Controllers namespaced under `App\Http\Controllers\Api\V1`
- Future versions: add `routes/api_v2.php` and update `api.php`

### Naming Conventions
- Routes: `api.v1.{resource}.{action}` (e.g., `api.v1.health`)
- Controllers: `ResourceController` with invokable or named methods
- Resources: `Api\V1\{ResourceName}Resource`
- Requests: `Api\V1\{Action}{Resource}Request`

### HTTP Methods
| Method | Usage |
|---|---|
| `GET` | Retrieve resources |
| `POST` | Create resources |
| `PUT` | Full update |
| `PATCH` | Partial update |
| `DELETE` | Remove resources |

---

## 6. Response Format

### Success
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... },
  "meta": {
    "current_page": 1,
    "per_page": 15,
    "total": 100,
    "last_page": 7
  }
}
```

### Error
```json
{
  "success": false,
  "message": "Human-readable error message",
  "errors": { "field": ["Validation error"] },
  "error_code": "VALIDATION_ERROR"
}
```

### HTTP Status Codes
| Code | Usage |
|---|---|
| 200 | Success |
| 201 | Created |
| 204 | No Content |
| 400 | Bad Request |
| 401 | Unauthenticated |
| 403 | Forbidden |
| 404 | Not Found |
| 405 | Method Not Allowed |
| 422 | Validation Error |
| 429 | Too Many Requests |
| 500 | Internal Server Error |
| 503 | Service Unavailable |

---

## 7. Exception Strategy

All exceptions are handled centrally in `bootstrap/app.php` via the `withExceptions()` callback:

| Exception | HTTP Code | `error_code` |
|---|---|---|
| `AuthenticationException` | 401 | `UNAUTHENTICATED` |
| `ValidationException` | 422 | `VALIDATION_ERROR` |
| `NotFoundHttpException` | 404 | `NOT_FOUND` |
| `MethodNotAllowedHttpException` | 405 | `METHOD_NOT_ALLOWED` |
| `ApiException` (custom) | Varies | Custom |
| Uncaught `Throwable` (prod only) | 500 | `INTERNAL_ERROR` |

Custom exceptions in `app/Exceptions/`:
- `ApiException` — base class with `render()` method
- `NotFoundException` — 404
- `UnauthorizedException` — 401
- `ForbiddenException` — 403
- `ValidationException` — 422

---

## 8. Middleware Stack

### API Middleware (prepended)
| Middleware | Purpose |
|---|---|
| `ForceJsonResponse` | Sets `Accept: application/json` on all API requests |

### Default Laravel API Middleware Group
- `ForceJsonResponse` (custom, prepended)
- `ThrottleRequests:api`
- `SubstituteBindings`
- Sanctum `AuthenticateSession`

### Aliases
| Alias | Class |
|---|---|
| `force.json` | `ForceJsonResponse` |

---

## 9. Database Driver Configuration

| Setting | Value |
|---|---|
| Connection | `mysql` |
| Host | `127.0.0.1` |
| Port | `3306` |
| Database | `orivis` |
| Username | `root` |
| Charset | `utf8mb4` |
| Collation | `utf8mb4_unicode_ci` |
| Strict Mode | `true` |

### Framework Tables Created

```sql
migrations            -- Migration tracking
users                 -- User accounts
password_reset_tokens -- Password resets
sessions              -- Session storage
cache                 -- Cache store
cache_locks           -- Cache lock store
jobs                  -- Queue jobs
job_batches           -- Job batch tracking
failed_jobs           -- Failed queue jobs
personal_access_tokens -- Sanctum API tokens
```

---

## 10. Cache Strategy

| Setting | Value |
|---|---|
| Default Driver | `database` |
| Table | `cache` |
| Production Target | `redis` (future) |

For development, the `database` driver stores cache in the `cache` table. Redis is configured as an alternative in `config/cache.php` and can be activated by setting `CACHE_STORE=redis` in `.env`.

---

## 11. Session Strategy

| Setting | Value |
|---|---|
| Driver | `database` |
| Table | `sessions` |
| Lifetime | 120 minutes |
| Expire on Close | `false` |
| Encrypt | `false` |
| Same-Site | `lax` |
| HTTP Only | `true` |

---

## 12. Queue Strategy

| Setting | Value |
|---|---|
| Default Connection | `database` |
| Table | `jobs` |
| Failed Jobs Driver | `database-uuids` |
| Failed Jobs Table | `failed_jobs` |
| Production Target | `redis` (future) |

---

## 13. Sanctum Configuration

| Setting | Value |
|---|---|
| Stateful Domains | `SANCTUM_STATEFUL_DOMAINS` (env) — defaults include localhost with ports 3000, 5173, 5174, 8000 |
| Guard | `web` |
| Token Expiration | 525600 minutes (1 year) |
| Token Prefix | `SANCTUM_TOKEN_PREFIX` (env) — empty by default |
| SPA Auth | Enabled — `AuthenticateSession`, `EncryptCookies`, `ValidateCsrfToken` |

Sanctum is configured for stateful SPA authentication (cookie-based) as documented in `docs/backend/05_AUTHENTICATION_AND_SECURITY.md`.

Before authentication routes are implemented, ensure the frontend calls `sanctum/csrf-cookie` before POST requests.

---

## 14. Health Endpoint Specification

```
GET /api/v1/health
Route name: api.v1.health
Controller: App\Http\Controllers\Api\V1\HealthController
```

### Response (200)
```json
{
  "success": true,
  "message": "Health check completed",
  "data": {
    "status": "healthy",
    "timestamp": "2026-07-30T03:19:09+01:00",
    "environment": "local",
    "debug": true,
    "services": {
      "database": { "healthy": true, "driver": "mysql" },
      "cache": { "healthy": true, "driver": "database" }
    }
  }
}
```

### Response (503 — degraded)
```json
{
  "success": true,
  "message": "Health check completed",
  "data": {
    "status": "healthy",
    "timestamp": "...",
    "environment": "local",
    "debug": true,
    "services": {
      "database": { "healthy": true, "driver": "mysql" },
      "cache": { "healthy": false, "error": "..." }
    }
  }
}
```

The endpoint returns 503 if either database or cache is unhealthy. It never throws — all service checks are wrapped in try/catch.

---

## 15. CORS Configuration

| Setting | Value |
|---|---|
| Allowed Origins | `FRONTEND_URL` env (default: `http://localhost:3000`) |
| Allowed Methods | `*` |
| Allowed Headers | `*` |
| Supports Credentials | `true` |
| Paths | `api/*`, `sanctum/csrf-cookie` |
| Max Age | 0 |

Cross-origin requests from the React frontend (port 3000 by default) are permitted with credentials (cookies) for session-based authentication.

---

## 16. Logging Configuration

| Setting | Value |
|---|---|
| Default Channel | `stack` (composed of `single`) |
| Dev Channel | `single` → `storage/logs/laravel.log` |
| Daily Retention | 30 days |
| Custom Channel | `orivis` → `storage/logs/orivis.log` (daily) |

### Channels
- `stack` — aggregates configured channels
- `single` — single file (`laravel.log`)
- `daily` — daily rotation (`orivis.log`, 30-day retention)
- `orivis` — dedicated daily-rotated channel for application logs

---

## 17. Multi-Tenant Foundation

### Architecture
- Every organization owns only its own data
- Tenant isolation via `organization_id` foreign key on all tenant-scoped tables
- No cross-tenant data access

### Components

**Contracts:**
- `OrganizationAwareInterface` — defines `getOrganizationId()`, `setOrganizationId()`, `scopeByOrganization()`

**Traits:**
- `TenantScope` — provides `scopeByOrganization()` and `scopeCurrentOrganization()` (uses session-based org context)
- `HasCreatedBy` — links records to the creating user

**Policies:**
- `BasePolicy` — pre-built `isOrganizationMember()` and `hasPermission()` checks

### Scoping Strategy
```php
// Apply in models
use App\Traits\TenantScope;

class Election extends Model
{
    use TenantScope;
}

// Usage
Election::byOrganization($orgId)->get();
```

Future middleware will set `current_organization_id` in the session based on the authenticated user's active organization.

---

## 18. Git

```
bd3c0cba — Audit fixes: strict typing, env.example cleanup, interface typing, remove dead code
0fdeac1b — Initial backend foundation
```

Branch: `main`

---

## 19. Known Assumptions

1. **Frontend defaults to `http://localhost:3001`** for the API base URL. The backend must be served on port 3001 (`php artisan serve --port=3001`) or the frontend `.env` must set `VITE_API_URL` to the actual backend URL.

2. **Database name `orivis`** is hardcoded as the default in `.env.example`. Developers must create this database before running `php artisan migrate`.

3. **Email configuration** is placeholder-only (`MAIL_HOST=localhost`, `MAIL_PORT=1025`). Brevo SMTP credentials must be configured before email features are implemented.

4. **Session-based authentication** using Sanctum's SPA pattern. The frontend must be served on one of the configured stateful domains.

5. **Cache driver** uses `database` for development. Production should switch to `redis` or `memcached`.

6. **Queue driver** uses `database` for development. Production should switch to `redis`.

7. **File storage** uses `local` driver. Production should switch to `s3` (or compatible).

8. **The `app/Support/Enums` directory** is reserved for future use. All current enums live in `app/Enums/`.

9. **`app/Http/Requests/Api/V1`** is empty. Form requests will be added during feature implementation.

---

## 20. Phase 2 Prerequisites

Before beginning the Authentication Phase:

- [x] **Sanctum installed and configured** — stateful domains, guard, token expiration
- [x] **User model exists** — with `HasFactory`, `Notifiable`, `casts()`
- [x] **Migrations for users, sessions, personal_access_tokens** — all created
- [x] **CORS configured** — supports credentials, allows frontend origin
- [x] **Exception handling for 401** — returns `{ success: false, message: "Unauthenticated", error_code: "UNAUTHENTICATED" }`
- [x] **ForceJsonResponse middleware** — ensures API responses are always JSON
- [x] **Base API routing structure** — versioned under `/api/v1`
- [ ] **Brevo SMTP credentials** — must be set in `.env` for verification emails
- [ ] **Mail Mailable classes** — registration verification, password reset
- [ ] **Authentication controllers** — Register, Login, Logout, VerifyEmail, ForgotPassword, ResetPassword
- [ ] **Rate limiting** — login (5/min), registration (3/hour), password reset (3/hour)
- [ ] **Session timeout** — 30-minute inactivity logout
- [ ] **Password policy validation** — min 8 chars, mixed case, digit, special char
