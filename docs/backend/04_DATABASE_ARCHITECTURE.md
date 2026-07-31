# ORIVIS Database Architecture

Version: 1.0

Status: Active

Last Updated: July 2026

---

# 1. Purpose

Define the database architecture, naming conventions, relationships, constraints, indexing strategy, migration standards and data integrity rules for ORIVIS.

This document is the single source of truth for database design.

---

# 2. Database Engine

Database

MySQL 8

Character Set

utf8mb4

Collation

utf8mb4_unicode_ci

Timezone

UTC

Storage Engine

InnoDB

---

# 3. Database Design Principles

The database must be:

- Normalized
- Secure
- Multi-tenant
- Scalable
- Maintainable
- Performance-oriented

Avoid duplicated data whenever possible.

Use foreign keys to enforce integrity.

Index frequently queried columns.

Never store derived values unless justified.

---

# 4. Naming Conventions

Tables

Plural snake_case

Examples

organizations

organization_users

elections

participants

votes

Columns

snake_case

Foreign Keys

organization_id

election_id

candidate_id

participant_id

Primary Keys

id

Timestamps

created_at

updated_at

Soft Deletes

deleted_at

---

# 5. Primary Key Strategy

Use unsigned BIGINT auto-increment primary keys by default.

Support UUID generation for public references where appropriate without replacing internal primary keys.

Public identifiers should never expose predictable internal IDs.

---

# 6. Tenant Isolation Strategy

Every tenant-owned table must contain an organization reference where applicable.

Examples include:

- elections
- participants
- candidates
- organization_users
- invitations
- audit_logs
- workspace_settings

Every query must be scoped to the current organization.

Cross-tenant queries are prohibited unless executed by the Founder platform with explicit authorization.

---

# 7. Relationship Standards

Document recommended relationship patterns including:

One-to-One

One-to-Many

Many-to-Many

Polymorphic relationships (only where justified)

Explain when each should be used.

---

# 8. Migration Standards

Every migration must:

- Define foreign keys
- Define indexes
- Include rollback support
- Use appropriate column types
- Avoid destructive operations without explicit justification

Migrations must remain reversible.

---

# 9. Indexing Strategy

Explain indexing recommendations.

Include:

Primary indexes

Unique indexes

Composite indexes

Foreign key indexes

Search indexes

Avoid unnecessary indexes.

---

# 10. Cascade Strategy

Define when to use:

Cascade Delete

Restrict Delete

Set Null

No Action

Explain preferred strategy for election data.

Votes should never be accidentally removed.

---

# 11. Soft Delete Strategy

Identify entities suitable for soft deletes.

Examples

Organizations

Users

Candidates

Participants

Elections

Explain why votes and audit records require special consideration.

---

# 12. Core Database Entities

Each entity definition includes: purpose, table, column specifications, relationships, constraints, indexes, and soft delete recommendation.

Types: BIGINT = BIGINT UNSIGNED, INT = INT UNSIGNED, VARCHAR = VARCHAR(n), TEXT, DATETIME, TIMESTAMP, ENUM, BOOLEAN = TINYINT(1).

Default indexes: `id` PRIMARY, `created_at` INDEX, `updated_at` INDEX, `deleted_at` INDEX (if soft delete). Additional indexes listed per entity.

---

### Organizations

**Purpose:** Top-level tenant entity. Every organization is an isolated workspace.

**Table:** `organizations`

| Column | Type | Length | Nullable | Default | Index | FK |
|---|---|---|---|---|---|---|
| id | BIGINT | - | NO | auto_increment | PRIMARY | - |
| name | VARCHAR | 255 | NO | - | - | - |
| slug | VARCHAR | 255 | NO | - | UNIQUE | - |
| email | VARCHAR | 255 | NO | - | - | - |
| phone | VARCHAR | 50 | YES | NULL | - | - |
| address | TEXT | - | YES | NULL | - | - |
| logo_url | VARCHAR | 255 | YES | NULL | - | - |
| cover_url | VARCHAR | 255 | YES | NULL | - | - |
| timezone | VARCHAR | 50 | NO | 'UTC' | - | - |
| locale | VARCHAR | 10 | NO | 'en' | - | - |
| status | ENUM | - | NO | 'active' | INDEX | - |
| trial_ends_at | DATETIME | - | YES | NULL | - | - |
| created_at | TIMESTAMP | - | NO | CURRENT_TIMESTAMP | INDEX | - |
| updated_at | TIMESTAMP | - | NO | CURRENT_TIMESTAMP | - | - |
| deleted_at | TIMESTAMP | - | YES | NULL | INDEX | - |

**Relationships:** HasMany OrganizationUsers, HasMany Elections, HasMany Participants, HasMany AuditLogs, HasOne WorkspaceSettings

**Constraints:** Unique slug. Status enum: active, suspended, trial, expired.

**Soft Delete:** Yes

---

### Users

**Purpose:** Platform-wide user accounts. Not tenant-specific — a user may belong to multiple organizations (via organization_users).

**Table:** `users`

| Column | Type | Length | Nullable | Default | Index | FK |
|---|---|---|---|---|---|---|
| id | BIGINT | - | NO | auto_increment | PRIMARY | - |
| name | VARCHAR | 255 | NO | - | - | - |
| email | VARCHAR | 255 | NO | - | UNIQUE | - |
| email_verified_at | TIMESTAMP | - | YES | NULL | - | - |
| password | VARCHAR | 255 | NO | - | - | - |
| remember_token | VARCHAR | 100 | YES | NULL | - | - |
| created_at | TIMESTAMP | - | NO | CURRENT_TIMESTAMP | INDEX | - |
| updated_at | TIMESTAMP | - | NO | CURRENT_TIMESTAMP | - | - |
| deleted_at | TIMESTAMP | - | YES | NULL | INDEX | - |

**Relationships:** BelongsToMany Organizations (via organization_users), HasMany AuditLogs, HasMany Notifications

**Constraints:** Unique email. Password must meet password policy (see 05_AUTHENTICATION_AND_SECURITY).

**Soft Delete:** Yes

---

### Organization Users

**Purpose:** Links users to organizations with a role. A user may have different roles in different organizations.

**Table:** `organization_users`

| Column | Type | Length | Nullable | Default | Index | FK |
|---|---|---|---|---|---|---|
| id | BIGINT | - | NO | auto_increment | PRIMARY | - |
| organization_id | BIGINT | - | NO | - | INDEX | organizations.id |
| user_id | BIGINT | - | NO | - | INDEX | users.id |
| role_id | BIGINT | - | YES | NULL | INDEX | roles.id |
| status | ENUM | - | NO | 'active' | INDEX | - |
| joined_at | TIMESTAMP | - | NO | CURRENT_TIMESTAMP | - | - |
| created_at | TIMESTAMP | - | NO | CURRENT_TIMESTAMP | - | - |
| updated_at | TIMESTAMP | - | NO | CURRENT_TIMESTAMP | - | - |

**Relationships:** BelongsTo Organization, BelongsTo User, BelongsTo Role

**Constraints:** Unique composite (organization_id, user_id). Status enum: active, invited, suspended, removed. Cascade delete on organization and user.

**Soft Delete:** No (use status for deactivation)

**Indexes:** Composite (organization_id, user_id) UNIQUE. Composite (organization_id, role_id) INDEX.

---

### Workspace Settings

**Purpose:** Key-value store for per-organization configuration.

**Table:** `workspace_settings`

| Column | Type | Length | Nullable | Default | Index | FK |
|---|---|---|---|---|---|---|
| id | BIGINT | - | NO | auto_increment | PRIMARY | - |
| organization_id | BIGINT | - | NO | - | INDEX | organizations.id |
| setting_key | VARCHAR | 255 | NO | - | INDEX | - |
| setting_value | TEXT | - | YES | NULL | - | - |
| created_at | TIMESTAMP | - | NO | CURRENT_TIMESTAMP | - | - |
| updated_at | TIMESTAMP | - | NO | CURRENT_TIMESTAMP | - | - |

**Relationships:** BelongsTo Organization

**Constraints:** Unique composite (organization_id, setting_key). Setting keys use dot notation (e.g., branding.primary_color).

**Soft Delete:** No

---

### Invitations

**Purpose:** Tracks pending invitations for users to join an organization.

**Table:** `invitations`

| Column | Type | Length | Nullable | Default | Index | FK |
|---|---|---|---|---|---|---|
| id | BIGINT | - | NO | auto_increment | PRIMARY | - |
| organization_id | BIGINT | - | NO | - | INDEX | organizations.id |
| invited_by | BIGINT | - | NO | - | INDEX | users.id |
| email | VARCHAR | 255 | NO | - | INDEX | - |
| role_id | BIGINT | - | NO | - | INDEX | roles.id |
| token | VARCHAR | 64 | NO | - | UNIQUE | - |
| expires_at | TIMESTAMP | - | NO | - | INDEX | - |
| accepted_at | TIMESTAMP | - | YES | NULL | - | - |
| created_at | TIMESTAMP | - | NO | CURRENT_TIMESTAMP | - | - |
| updated_at | TIMESTAMP | - | NO | CURRENT_TIMESTAMP | - | - |

**Relationships:** BelongsTo Organization, BelongsTo User (invited_by), BelongsTo Role

**Constraints:** Token generated via Str::random(40). Expires after 7 days. Cascade delete on organization. Restrict delete on user (invited_by).

**Soft Delete:** No

---

### Roles

**Purpose:** Defines named roles within an organization. System roles are created by default; custom roles can be added.

**Table:** `roles`

| Column | Type | Length | Nullable | Default | Index | FK |
|---|---|---|---|---|---|---|
| id | BIGINT | - | NO | auto_increment | PRIMARY | - |
| organization_id | BIGINT | - | NO | - | INDEX | organizations.id |
| name | VARCHAR | 100 | NO | - | - | - |
| slug | VARCHAR | 100 | NO | - | - | - |
| description | TEXT | - | YES | NULL | - | - |
| is_system | BOOLEAN | - | NO | FALSE | INDEX | - |
| created_at | TIMESTAMP | - | NO | CURRENT_TIMESTAMP | - | - |
| updated_at | TIMESTAMP | - | NO | CURRENT_TIMESTAMP | - | - |
| deleted_at | TIMESTAMP | - | YES | NULL | INDEX | - |

**Relationships:** BelongsTo Organization, HasMany OrganizationUsers, BelongsToMany Permissions (via role_permissions)

**Constraints:** Unique composite (organization_id, slug). System roles (is_system = TRUE) cannot be deleted. Default system roles: Organization Owner, Organization Admin, Election Manager, Participant Manager, Observer.

**Soft Delete:** Yes (system roles excluded from soft delete)

---

### Permissions

**Purpose:** Granular permission definitions. Shared across all organizations; assigned to roles via pivot.

**Table:** `permissions`

| Column | Type | Length | Nullable | Default | Index | FK |
|---|---|---|---|---|---|---|
| id | BIGINT | - | NO | auto_increment | PRIMARY | - |
| name | VARCHAR | 100 | NO | - | - | - |
| slug | VARCHAR | 100 | NO | - | UNIQUE | - |
| group | VARCHAR | 50 | NO | - | INDEX | - |
| description | TEXT | - | YES | NULL | - | - |
| created_at | TIMESTAMP | - | NO | CURRENT_TIMESTAMP | - | - |
| updated_at | TIMESTAMP | - | NO | CURRENT_TIMESTAMP | - | - |

**Relationships:** BelongsToMany Roles (via role_permissions)

**Constraints:** Unique slug. Group categories: elections, candidates, participants, votes, workspace, team, settings, audit, results.

**Soft Delete:** No (permissions are never removed, only deprecated)

---

### Role Permissions

**Purpose:** Pivot table connecting roles to permissions.

**Table:** `role_permissions`

| Column | Type | Length | Nullable | Default | Index | FK |
|---|---|---|---|---|---|---|
| role_id | BIGINT | - | NO | - | INDEX | roles.id |
| permission_id | BIGINT | - | NO | - | INDEX | permissions.id |

**Relationships:** BelongsTo Role, BelongsTo Permission

**Constraints:** Unique composite (role_id, permission_id). Cascade delete on both role and permission.

**Soft Delete:** No

---

### Elections

**Purpose:** Represents a voting event within an organization. The central entity for the voting workflow.

**Table:** `elections`

| Column | Type | Length | Nullable | Default | Index | FK |
|---|---|---|---|---|---|---|
| id | BIGINT | - | NO | auto_increment | PRIMARY | - |
| organization_id | BIGINT | - | NO | - | INDEX | organizations.id |
| title | VARCHAR | 255 | NO | - | - | - |
| description | TEXT | - | YES | NULL | - | - |
| type | ENUM | - | NO | 'single' | INDEX | - |
| status | ENUM | - | NO | 'draft' | INDEX | - |
| start_date | DATETIME | - | YES | NULL | INDEX | - |
| end_date | DATETIME | - | YES | NULL | INDEX | - |
| max_votes_per_position | INT | - | NO | 1 | - | - |
| allow_overvote | BOOLEAN | - | NO | FALSE | - | - |
| is_public | BOOLEAN | - | NO | FALSE | INDEX | - |
| created_at | TIMESTAMP | - | NO | CURRENT_TIMESTAMP | INDEX | - |
| updated_at | TIMESTAMP | - | NO | CURRENT_TIMESTAMP | - | - |
| deleted_at | TIMESTAMP | - | YES | NULL | INDEX | - |

**Relationships:** BelongsTo Organization, HasMany ElectionPositions, HasMany Candidates, HasMany Votes, HasMany Results

**Constraints:** Type enum: single, multiple, ranked. Status enum: draft, scheduled, published, open, closed, archived. Status transitions: draft→scheduled→published→open→closed→archived. End date must be after start date. Cascade delete on organization. Restrict delete on votes (prevent orphaned votes).

**Soft Delete:** Yes

---

### Election Positions

**Purpose:** Defines positions/offices within an election (e.g., President, Secretary).

**Table:** `election_positions`

| Column | Type | Length | Nullable | Default | Index | FK |
|---|---|---|---|---|---|---|
| id | BIGINT | - | NO | auto_increment | PRIMARY | - |
| election_id | BIGINT | - | NO | - | INDEX | elections.id |
| title | VARCHAR | 255 | NO | - | - | - |
| description | TEXT | - | YES | NULL | - | - |
| max_votes | INT | - | NO | 1 | - | - |
| sort_order | INT | - | NO | 0 | INDEX | - |
| created_at | TIMESTAMP | - | NO | CURRENT_TIMESTAMP | - | - |
| updated_at | TIMESTAMP | - | NO | CURRENT_TIMESTAMP | - | - |

**Relationships:** BelongsTo Election, HasMany Candidates, HasMany Votes

**Constraints:** Cascade delete on election. Cascade delete on position (candidates and votes cascade).

**Soft Delete:** No (election deletion cascades)

---

### Candidates

**Purpose:** Represents a candidate running for a position in an election.

**Table:** `candidates`

| Column | Type | Length | Nullable | Default | Index | FK |
|---|---|---|---|---|---|---|
| id | BIGINT | - | NO | auto_increment | PRIMARY | - |
| election_id | BIGINT | - | NO | - | INDEX | elections.id |
| position_id | BIGINT | - | NO | - | INDEX | election_positions.id |
| name | VARCHAR | 255 | NO | - | - | - |
| description | TEXT | - | YES | NULL | - | - |
| photo_url | VARCHAR | 255 | YES | NULL | - | - |
| sort_order | INT | - | NO | 0 | INDEX | - |
| is_verified | BOOLEAN | - | NO | FALSE | INDEX | - |
| created_at | TIMESTAMP | - | NO | CURRENT_TIMESTAMP | - | - |
| updated_at | TIMESTAMP | - | NO | CURRENT_TIMESTAMP | - | - |
| deleted_at | TIMESTAMP | - | YES | NULL | INDEX | - |

**Relationships:** BelongsTo Election, BelongsTo Position, HasMany Votes

**Constraints:** Cascade delete on election and position. Unique composite (election_id, position_id, name) — no duplicate candidate names per position per election.

**Soft Delete:** Yes

---

### Participants

**Purpose:** Individuals eligible to vote in one or more elections within an organization.

**Table:** `participants`

| Column | Type | Length | Nullable | Default | Index | FK |
|---|---|---|---|---|---|---|
| id | BIGINT | - | NO | auto_increment | PRIMARY | - |
| organization_id | BIGINT | - | NO | - | INDEX | organizations.id |
| email | VARCHAR | 255 | YES | NULL | INDEX | - |
| name | VARCHAR | 255 | NO | - | - | - |
| identifier | VARCHAR | 255 | YES | NULL | INDEX | - |
| voter_key_hash | VARCHAR | 255 | YES | NULL | - | - |
| status | ENUM | - | NO | 'active' | INDEX | - |
| created_at | TIMESTAMP | - | NO | CURRENT_TIMESTAMP | INDEX | - |
| updated_at | TIMESTAMP | - | NO | CURRENT_TIMESTAMP | - | - |
| deleted_at | TIMESTAMP | - | YES | NULL | INDEX | - |

**Relationships:** BelongsTo Organization, BelongsToMany Elections (via election_participant), HasMany Votes

**Constraints:** Status enum: active, inactive, blocked. Cascade delete on organization. Unique composite (organization_id, email) if email provided. Unique composite (organization_id, identifier) if identifier provided.

**Soft Delete:** Yes

---

### Election Participant (Pivot)

**Purpose:** Links participants to specific elections they are eligible to vote in. Stores voting pass and status.

**Table:** `election_participant`

| Column | Type | Length | Nullable | Default | Index | FK |
|---|---|---|---|---|---|---|
| id | BIGINT | - | NO | auto_increment | PRIMARY | - |
| election_id | BIGINT | - | NO | - | INDEX | elections.id |
| participant_id | BIGINT | - | NO | - | INDEX | participants.id |
| voting_pass_hash | VARCHAR | 255 | YES | NULL | UNIQUE | - |
| pass_generated_at | TIMESTAMP | - | YES | NULL | - | - |
| voted_at | TIMESTAMP | - | YES | NULL | INDEX | - |
| created_at | TIMESTAMP | - | NO | CURRENT_TIMESTAMP | - | - |

**Relationships:** BelongsTo Election, BelongsTo Participant

**Constraints:** Unique composite (election_id, participant_id) — a participant can be linked to an election only once. Cascade delete on both election and participant. voting_pass_hash generated via SHA-256.

**Soft Delete:** No

---

### Votes

**Purpose:** Records an individual vote cast by a participant for a candidate in a position within an election. Votes are immutable — INSERT only, no UPDATE or DELETE.

**Table:** `votes`

| Column | Type | Length | Nullable | Default | Index | FK |
|---|---|---|---|---|---|---|
| id | BIGINT | - | NO | auto_increment | PRIMARY | - |
| election_id | BIGINT | - | NO | - | INDEX | elections.id |
| participant_id | BIGINT | - | NO | - | INDEX | participants.id |
| position_id | BIGINT | - | NO | - | INDEX | election_positions.id |
| candidate_id | BIGINT | - | NO | - | INDEX | candidates.id |
| receipt_id | BIGINT | - | YES | NULL | INDEX | vote_receipts.id |
| encrypted_hash | VARCHAR | 255 | NO | - | UNIQUE | - |
| cast_at | TIMESTAMP | - | NO | CURRENT_TIMESTAMP | INDEX | - |
| ip_address | VARCHAR | 45 | YES | NULL | - | - |
| user_agent | TEXT | - | YES | NULL | - | - |

**Relationships:** BelongsTo Election, BelongsTo Participant, BelongsTo Position, BelongsTo Candidate, HasOne VoteReceipt

**Constraints:** Unique composite (election_id, participant_id, position_id) — one vote per participant per position per election. Cascade delete on election and position. Restrict delete on participant (votes must persist). Candidate must belong to the same election and position. No updated_at or deleted_at columns — votes are immutable.

**Indexes:** Composite (election_id, participant_id, position_id) UNIQUE. Composite (election_id, candidate_id) INDEX for result counting.

**Soft Delete:** No (votes are immutable and permanent)

---

### Vote Receipts

**Purpose:** Stores cryptographic receipt hashes for vote verification without revealing the vote content.

**Table:** `vote_receipts`

| Column | Type | Length | Nullable | Default | Index | FK |
|---|---|---|---|---|---|---|
| id | BIGINT | - | NO | auto_increment | PRIMARY | - |
| election_id | BIGINT | - | NO | - | INDEX | elections.id |
| receipt_hash | VARCHAR | 255 | NO | - | UNIQUE | - |
| created_at | TIMESTAMP | - | NO | CURRENT_TIMESTAMP | - | - |

**Relationships:** BelongsTo Election, BelongsTo Vote

**Constraints:** Unique receipt_hash. receipt_hash generated as SHA-256 of (vote_id, election_id, participant_id, candidate_id, cast_at). Cascade delete on election. No updated_at or deleted_at.

**Soft Delete:** No (receipts are permanent)

---

### Results

**Purpose:** Pre-computed aggregated vote counts per election, position, and candidate. Updated on vote cast (queued) or election close.

**Table:** `results`

| Column | Type | Length | Nullable | Default | Index | FK |
|---|---|---|---|---|---|---|
| id | BIGINT | - | NO | auto_increment | PRIMARY | - |
| election_id | BIGINT | - | NO | - | INDEX | elections.id |
| position_id | BIGINT | - | NO | - | INDEX | election_positions.id |
| candidate_id | BIGINT | - | NO | - | INDEX | candidates.id |
| vote_count | INT | - | NO | 0 | - | - |
| percentage | DECIMAL(5,2) | - | YES | NULL | - | - |
| created_at | TIMESTAMP | - | NO | CURRENT_TIMESTAMP | - | - |
| updated_at | TIMESTAMP | - | NO | CURRENT_TIMESTAMP | - | - |

**Relationships:** BelongsTo Election, BelongsTo Position, BelongsTo Candidate

**Constraints:** Unique composite (election_id, position_id, candidate_id). Cascade delete on election, position, and candidate.

**Soft Delete:** No

---

### Audit Logs

**Purpose:** Append-only log of security-sensitive and business-critical actions for compliance and forensics.

**Table:** `audit_logs`

| Column | Type | Length | Nullable | Default | Index | FK |
|---|---|---|---|---|---|---|
| id | BIGINT | - | NO | auto_increment | PRIMARY | - |
| organization_id | BIGINT | - | NO | - | INDEX | organizations.id |
| actor_id | BIGINT | - | YES | NULL | INDEX | - |
| actor_type | VARCHAR | 100 | YES | NULL | - | - |
| action | VARCHAR | 100 | NO | - | INDEX | - |
| entity_type | VARCHAR | 100 | NO | - | INDEX | - |
| entity_id | BIGINT | - | YES | NULL | INDEX | - |
| ip_address | VARCHAR | 45 | YES | NULL | - | - |
| user_agent | TEXT | - | YES | NULL | - | - |
| metadata | JSON | - | YES | NULL | - | - |
| created_at | TIMESTAMP | - | NO | CURRENT_TIMESTAMP | INDEX | - |

**Relationships:** BelongsTo Organization. Polymorphic actor (User, System). Polymorphic entity.

**Constraints:** Cascade delete on organization. No updated_at or deleted_at — append-only. Index on (organization_id, action), (organization_id, entity_type, entity_id), (organization_id, created_at).

**Soft Delete:** No (append-only)

---

### Notifications

**Purpose:** In-app notifications delivered to users within an organization.

**Table:** `notifications`

| Column | Type | Length | Nullable | Default | Index | FK |
|---|---|---|---|---|---|---|
| id | BIGINT | - | NO | auto_increment | PRIMARY | - |
| organization_id | BIGINT | - | NO | - | INDEX | organizations.id |
| user_id | BIGINT | - | NO | - | INDEX | users.id |
| type | VARCHAR | 100 | NO | - | INDEX | - |
| title | VARCHAR | 255 | NO | - | - | - |
| body | TEXT | - | YES | NULL | - | - |
| data | JSON | - | YES | NULL | - | - |
| read_at | TIMESTAMP | - | YES | NULL | INDEX | - |
| created_at | TIMESTAMP | - | NO | CURRENT_TIMESTAMP | INDEX | - |

**Relationships:** BelongsTo Organization, BelongsTo User

**Constraints:** Cascade delete on organization and user. Index on (user_id, read_at) for unread notification queries.

**Soft Delete:** No

---

### Email Logs

**Purpose:** Records of all transactional emails sent by the system for auditing and debugging.

**Table:** `email_logs`

| Column | Type | Length | Nullable | Default | Index | FK |
|---|---|---|---|---|---|---|
| id | BIGINT | - | NO | auto_increment | PRIMARY | - |
| organization_id | BIGINT | - | YES | NULL | INDEX | organizations.id |
| recipient | VARCHAR | 255 | NO | - | INDEX | - |
| subject | VARCHAR | 255 | NO | - | - | - |
| body_preview | TEXT | - | YES | NULL | - | - |
| status | ENUM | - | NO | 'sent' | INDEX | - |
| sent_at | TIMESTAMP | - | YES | NULL | INDEX | - |
| created_at | TIMESTAMP | - | NO | CURRENT_TIMESTAMP | - | - |

**Relationships:** BelongsTo Organization (nullable — system emails may not belong to an organization)

**Constraints:** Status enum: queued, sent, failed, bounced. Cascade delete on organization (if set).

**Soft Delete:** No

---

### File Uploads

**Purpose:** Metadata for all uploaded files (logos, candidate photos, CSVs, reports). Binary content stored on disk/cloud, never in database.

**Table:** `file_uploads`

| Column | Type | Length | Nullable | Default | Index | FK |
|---|---|---|---|---|---|---|
| id | BIGINT | - | NO | auto_increment | PRIMARY | - |
| organization_id | BIGINT | - | NO | - | INDEX | organizations.id |
| uploader_id | BIGINT | - | YES | NULL | INDEX | users.id |
| file_type | ENUM | - | NO | - | INDEX | - |
| original_name | VARCHAR | 255 | NO | - | - | - |
| stored_name | VARCHAR | 255 | NO | - | UNIQUE | - |
| mime_type | VARCHAR | 127 | NO | - | - | - |
| size | INT | - | NO | - | - | - |
| path | VARCHAR | 255 | NO | - | - | - |
| disk | VARCHAR | 50 | NO | 'local' | - | - |
| created_at | TIMESTAMP | - | NO | CURRENT_TIMESTAMP | INDEX | - |

**Relationships:** BelongsTo Organization, BelongsTo User (uploader)

**Constraints:** File type enum: logo, candidate_photo, csv_import, report, document. Cascade delete on organization. Restrict delete on uploader. stored_name generated via Str::uuid() with original extension.

**Soft Delete:** No

---

### CSV Imports

**Purpose:** Tracks CSV import jobs, their progress, and results.

**Table:** `csv_imports`

| Column | Type | Length | Nullable | Default | Index | FK |
|---|---|---|---|---|---|---|
| id | BIGINT | - | NO | auto_increment | PRIMARY | - |
| organization_id | BIGINT | - | NO | - | INDEX | organizations.id |
| election_id | BIGINT | - | YES | NULL | INDEX | elections.id |
| uploader_id | BIGINT | - | NO | - | INDEX | users.id |
| file_upload_id | BIGINT | - | NO | - | INDEX | file_uploads.id |
| filename | VARCHAR | 255 | NO | - | - | - |
| total_rows | INT | - | NO | 0 | - | - |
| valid_rows | INT | - | NO | 0 | - | - |
| error_rows | INT | - | NO | 0 | - | - |
| status | ENUM | - | NO | 'pending' | INDEX | - |
| created_at | TIMESTAMP | - | NO | CURRENT_TIMESTAMP | - | - |
| updated_at | TIMESTAMP | - | NO | CURRENT_TIMESTAMP | - | - |

**Relationships:** BelongsTo Organization, BelongsTo Election (nullable), BelongsTo User (uploader), BelongsTo FileUpload, HasMany ImportErrors

**Constraints:** Status enum: pending, processing, validated, completed, failed, cancelled. Cascade delete on organization. Set null on election delete (import history preserved).

**Soft Delete:** No

---

### Import Errors

**Purpose:** Row-level errors from CSV import validation.

**Table:** `import_errors`

| Column | Type | Length | Nullable | Default | Index | FK |
|---|---|---|---|---|---|---|
| id | BIGINT | - | NO | auto_increment | PRIMARY | - |
| csv_import_id | BIGINT | - | NO | - | INDEX | csv_imports.id |
| row_number | INT | - | NO | - | - | - |
| column | VARCHAR | 100 | YES | NULL | - | - |
| error_message | TEXT | - | NO | - | - | - |
| created_at | TIMESTAMP | - | NO | CURRENT_TIMESTAMP | - | - |

**Relationships:** BelongsTo CsvImport

**Constraints:** Cascade delete on csv_import. No updated_at or deleted_at.

**Soft Delete:** No

---

### Security Codes

**Purpose:** 8-digit security verification codes for participants to authenticate before voting.

**Table:** `security_codes`

| Column | Type | Length | Nullable | Default | Index | FK |
|---|---|---|---|---|---|---|
| id | BIGINT | - | NO | auto_increment | PRIMARY | - |
| organization_id | BIGINT | - | NO | - | INDEX | organizations.id |
| election_id | BIGINT | - | NO | - | INDEX | elections.id |
| participant_id | BIGINT | - | NO | - | INDEX | participants.id |
| code_hash | VARCHAR | 255 | NO | - | - | - |
| expires_at | TIMESTAMP | - | NO | - | INDEX | - |
| used_at | TIMESTAMP | - | YES | NULL | INDEX | - |
| created_at | TIMESTAMP | - | NO | CURRENT_TIMESTAMP | - | - |

**Relationships:** BelongsTo Organization, BelongsTo Election, BelongsTo Participant

**Constraints:** Unique composite (election_id, participant_id) — one code per participant per election. Code is 8 digits stored as bcrypt hash. Cascade delete on all parent entities.

**Soft Delete:** No

---

### Password Reset Tokens

**Purpose:** Laravel's default password reset token storage.

**Table:** `password_reset_tokens`

| Column | Type | Length | Nullable | Default | Index | FK |
|---|---|---|---|---|---|---|
| email | VARCHAR | 255 | NO | - | PRIMARY | - |
| token | VARCHAR | 255 | NO | - | - | - |
| created_at | TIMESTAMP | - | YES | NULL | INDEX | - |

**Relationships:** None (standard Laravel table)

**Constraints:** Follows Laravel default schema exactly. Token is a random 60-character hex string. Expires after 60 minutes.

**Soft Delete:** No

---

### Sessions

**Purpose:** Laravel's database session storage.

**Table:** `sessions`

| Column | Type | Length | Nullable | Default | Index | FK |
|---|---|---|---|---|---|---|
| id | VARCHAR | 255 | NO | - | PRIMARY | - |
| user_id | BIGINT | - | YES | NULL | INDEX | users.id |
| ip_address | VARCHAR | 45 | YES | NULL | - | - |
| user_agent | TEXT | - | YES | NULL | - | - |
| payload | LONGTEXT | - | NO | - | - | - |
| last_activity | INT | - | NO | - | INDEX | - |

**Relationships:** BelongsTo User (nullable — guest sessions)

**Constraints:** Follows Laravel default schema exactly. last_activity stored as Unix timestamp. Cascade delete on user.

**Soft Delete:** No

---

### Personal Access Tokens

**Purpose:** Sanctum API token authentication for future API clients.

**Table:** `personal_access_tokens`

| Column | Type | Length | Nullable | Default | Index | FK |
|---|---|---|---|---|---|---|
| id | BIGINT | - | NO | auto_increment | PRIMARY | - |
| tokenable_type | VARCHAR | 255 | NO | - | INDEX | - |
| tokenable_id | BIGINT | - | NO | - | INDEX | - |
| name | VARCHAR | 255 | NO | - | - | - |
| token | VARCHAR | 64 | NO | - | UNIQUE | - |
| abilities | TEXT | - | YES | NULL | - | - |
| last_used_at | TIMESTAMP | - | YES | NULL | INDEX | - |
| expires_at | TIMESTAMP | - | YES | NULL | INDEX | - |
| created_at | TIMESTAMP | - | NO | CURRENT_TIMESTAMP | - | - |
| updated_at | TIMESTAMP | - | NO | CURRENT_TIMESTAMP | - | - |

**Relationships:** Polymorphic (tokenable: User, Organization)

**Constraints:** Follows Laravel Sanctum schema. token is SHA-256 hash of the plain-text token. Composite index on (tokenable_type, tokenable_id).

**Soft Delete:** No

---

### Contact Messages

**Purpose:** Stores public contact form submissions (no authentication required).

**Table:** `contact_messages`

| Column | Type | Length | Nullable | Default | Index | FK |
|---|---|---|---|---|---|---|
| id | BIGINT | - | NO | auto_increment | PRIMARY | - |
| name | VARCHAR | 255 | NO | - | - | - |
| email | VARCHAR | 255 | NO | - | INDEX | - |
| subject | VARCHAR | 255 | NO | - | - | - |
| message | TEXT | - | NO | - | - | - |
| read_at | TIMESTAMP | - | YES | NULL | INDEX | - |
| created_at | TIMESTAMP | - | NO | CURRENT_TIMESTAMP | INDEX | - |

**Relationships:** None (public submission)

**Constraints:** No foreign keys — this table accepts unauthenticated submissions. Rate-limited at the API layer.

**Soft Delete:** No

---

### Failed Jobs

**Purpose:** Laravel's default failed jobs table.

**Table:** `failed_jobs`

**Schema:** Standard Laravel schema (id, uuid, connection, queue, payload, exception, failed_at).

---

### Jobs

**Purpose:** Laravel's default jobs table for database queue driver.

**Table:** `jobs`

**Schema:** Standard Laravel schema (id, queue, payload, attempts, reserved_at, available_at, created_at).

---

### Cache Tables

**Purpose:** Laravel's default cache table for database cache driver.

**Table:** `cache` / `cache_locks`

**Schema:** Standard Laravel schema. Used only in development; production uses Redis.

---

### Future Entities (Post-MVP)

The following entities are identified by frontend mapping analysis but deferred to post-MVP:

- **support_tickets** — Support ticket management (id, organization_id, user_id, subject, status, priority, assigned_to, created_at, updated_at)
- **help_articles** — Knowledge base content (id, organization_id, title, slug, content, category, published_at, created_at, updated_at)
- **faqs** — FAQ content (id, organization_id, question, answer, sort_order, created_at, updated_at)
- **release_notes** — Version history content (id, version, title, content, published_at, created_at)
- **event_templates** — Reusable event configuration templates (id, organization_id, name, config_json, created_at, updated_at)
- **archive_records** — Event archiving history (id, election_id, archived_by, archive_location, created_at)
- **staff_members** — Platform staff (Founder-level) management (id, user_id, role, permissions_json, created_at, updated_at)
- **governance_sessions** — Platform governance session tracking (id, organization_id, title, date, notes, created_at, updated_at)
- **internal_notes** — Platform staff notes on organizations (id, organization_id, staff_id, note, created_at, updated_at)
- **platform_settings** — Global platform configuration (id, setting_key, setting_value, created_at, updated_at)
- **reports** — Generated report metadata (id, organization_id, election_id, type, parameters, file_upload_id, created_at)
- **backup_codes** — 2FA backup codes (id, user_id, code_hash, used_at, created_at)

---

# 13. Voting Data Integrity

Define strict integrity rules.

Examples:

Votes are immutable.

Duplicate votes prohibited.

Every vote references a valid election.

Every vote references a valid participant.

Every vote references a valid candidate.

Voting records must remain historically accurate.

---

# 14. CSV Import Data Rules

Define storage strategy for:

Import history

Import file

Import summary

Import errors

Imported records

Duplicate detection

Validation reports

---

# 15. File Storage Metadata

Define database structure for uploaded files.

Examples

Organization logo

Candidate image

CSV file

Future documents

Store metadata rather than binary content in the database.

---

# 16. Audit Data

Audit records should capture:

Actor

Organization

Action

Target Entity

Target ID

Timestamp

IP Address

User Agent

Metadata

Audit records should be append-only.

---

# 17. Performance Considerations

Recommend:

Pagination

Chunked imports

Batch inserts

Lazy processing

Efficient joins

Eager loading

Database transactions

---

# 18. Future Compatibility

Database should support future:

Subscriptions

Paystack

Invoices

Plans

Observers

Public Elections

Multiple Election Types

Advanced Analytics

Mobile Clients

WebSockets

without redesign.

---

# 19. Data Retention Strategy

Recommend retention policy for:

Votes

Audit Logs

Notifications

Email Logs

CSV Imports

Temporary files

Sessions

Password reset tokens

---

# 20. Definition of Done

Database architecture is complete when:

Every entity has been documented.

Relationships are defined.

Indexes are defined.

Constraints are defined.

Tenant isolation is supported.

Future expansion is possible without redesign.

---

# 21. Conclusion

This document defines the official database architecture for ORIVIS.

All future migrations, models, repositories and services must comply with this specification.

Database consistency is mandatory throughout the project.

---

End of document.
