# ORIVIS Authentication & Security

Version: 1.0

Status: Active

Last Updated: July 2026

---

# 1. Purpose

This document defines how users authenticate, how permissions are enforced, how sessions are managed, and how security is implemented throughout the ORIVIS backend.

Security is a core product feature.

Every implementation must prioritise integrity, confidentiality and availability.

---

# 2. Security Principles

The platform must follow these principles:

- Least Privilege
- Zero Trust
- Defence in Depth
- Secure by Default
- Principle of Explicit Access
- Tenant Isolation
- Complete Auditability

Security takes priority over convenience.

---

# 3. Authentication Overview

Support:

- Organization Registration
- Email Verification
- Login
- Logout
- Remember Me
- Forgot Password
- Password Reset
- Session Authentication

Future Support:

- Multi-Factor Authentication (MFA)
- Single Sign-On (SSO)
- Social Login
- Passwordless Login

---

# 4. User Registration Flow

Define the complete registration process.

Flow:

Visitor

↓

Organization Registration

↓

Create Organization

↓

Create Primary Organization Owner

↓

Send Email Verification

↓

Verify Email

↓

Activate Account

↓

Automatic Login

↓

Redirect to Organization Dashboard

Users cannot access protected routes until email verification succeeds.

---

# 5. Login Flow

Define the authentication process.

Requirements:

- Email + Password
- Remember Me
- Email verified check
- Active account check
- Active organization check
- Rate limiting
- Failed login logging
- Successful login logging

---

# 6. Password Policy

Requirements:

Minimum length: 8 characters

Maximum length: 128 characters

At least 1 uppercase letter (A–Z)

At least 1 lowercase letter (a–z)

At least 1 digit (0–9)

At least 1 special character (! @ # $ % ^ & * ( ) _ + - = [ ] { } | : ; " ' < > , . ? / ~ `)

Password confirmation required on registration and password change

Password hashing uses Laravel's Bcrypt or Argon2id via Hash facade

Passwords are never stored in plain text or logged

Validation rule: string | min:8 | max:128 | regex:/[A-Z]/ | regex:/[a-z]/ | regex:/[0-9]/ | regex:/[!@#$%^&*()_+\-=\[\]{}|:;\"'<>,.?\/~`]/ | confirmed

---

# 7. Password Reset

Forgot password request — User submits email via POST /api/v1/auth/forgot-password

Reset email — Laravel sends notification with a signed reset link containing a token

Token generation — Random 60-character hex token stored in password_reset_tokens table

Token expiration — Token expires after 60 minutes. Expired tokens are deleted on read and during cleanup

Password update — User submits new password + token via POST /api/v1/auth/reset-password. Validates new password against password policy

Automatic token invalidation — Token is deleted after successful password reset. All existing sessions for the user are invalidated

Password reset confirmation — Success response returns confirmation; user may log in with new password

---

# 8. Session Management

Secure sessions — Sessions use HTTP-only, secure, SameSite=Strict cookies in production. Session data stored in database.

Session regeneration after login — Regenerate session ID on login to prevent session fixation.

Automatic logout after inactivity — Session expires after 30 minutes of inactivity. Configurable per organization in future.

Logout from current session — POST /api/v1/auth/logout clears the server-side session.

Future support for logout from all devices — Invalidate all session records for the user.

Session invalidation after password reset — All sessions for the user are deleted on password change.

---

# 9. Email Verification

Users must verify email before creating elections, inviting team members, managing workspace, or publishing elections.

Verification workflow: On registration, the system generates a signed verification URL with a 60-minute expiry and sends it via email. The user clicks the link → GET /api/v1/auth/verify-email/{id}/{hash} → system validates the signature and hash → marks email_verified_at timestamp → activates the account. Users may request a resend (rate-limited to 3 per hour). Unverified users can log in but cannot perform guarded actions. Verification status is checked via a middleware on protected routes.

---

# 10. Authorization

Use Laravel Policies and Gates.

Roles:

Founder

Organization Owner

Organization Admin

Election Manager

Participant Manager

Observer

Future Custom Roles

Every action must be authorised.

---

# 11. Permission Strategy

Permissions must be granular.

Examples:

Create Election

Publish Election

Delete Election

Manage Candidates

Manage Participants

Manage Workspace

Invite Members

View Results

Export Results

Permissions must never be hard-coded into controllers.

---

# 12. Tenant Security

Every authenticated request must belong to one organization.

Users cannot:

Access another tenant

Modify another tenant

Read another tenant's data

Tenant isolation is mandatory.

---

# 13. API Security

Require:

Authentication middleware

Authorization middleware

Rate limiting

Input validation

CSRF protection where applicable

Secure HTTP status codes

Consistent error responses

---

# 14. File Upload Security

Validate:

MIME type — Verify against allowed types per upload category

Extension — Whitelist allowed extensions; reject all others

Maximum size — Organization logos: 2MB. Candidate photos: 5MB. CSV files: 10MB. Future documents: 20MB

Image dimensions — Logos: max 500×500px. Candidate photos: max 2000×2000px

Reject executable files — Block .exe, .sh, .bat, .php, .jar and all script extensions

Store files outside the public web root where possible. Use storage/app/ with symbolic link or cloud storage

Generate unique filenames — Str::uuid() with original extension preserved for download headers

---

# 15. Input Validation

Every request must use Laravel Form Requests.

Validate:

Required fields

Formats

Lengths

Enums

Existence rules

Uniqueness rules

Business rules

Validation must never be skipped.

---

# 16. Security Logging

Log:

Successful login

Failed login

Password reset

Email verification

Permission denial

Election publication

Vote submission

CSV imports

Security exceptions

Do not log passwords or sensitive secrets.

---

# 17. Rate Limiting

Apply limits using Laravel's RateLimiter facade with named rate limiters:

Registration — 3 attempts per hour per IP address

Login — 5 attempts per minute per email/IP combination. 10 attempts per hour

Password reset — 3 attempts per hour per email address

Email verification resend — 3 attempts per hour per email address

CSV import — 5 imports per hour per organization

Voting endpoints — 10 submissions per minute per participant (per-election). 100 per hour

Public APIs — 30 requests per minute per IP

Rate limiters return 429 Too Many Requests with Retry-After header. Exceeded limits are logged as security events. Named rate limiters are defined in App\Http\Kernel or a dedicated RateLimiterServiceProvider.

---

# 18. Encryption

Use Laravel encryption where appropriate.

Encrypt sensitive application data where justified.

Never encrypt passwords manually.

Always use Laravel Hash for passwords.

---

# 19. Security Headers

Implement via Laravel middleware or server-level configuration:

Content Security Policy — default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'

X-Frame-Options — DENY (prevents clickjacking)

X-Content-Type-Options — nosniff (prevents MIME-type sniffing)

Referrer Policy — strict-origin-when-cross-origin

Permissions Policy — camera=(), microphone=(), geolocation=(), interest-cohort=()

Strict Transport Security (production only) — max-age=31536000; includeSubDomains

Applied globally via app/Http/Middleware/SecureHeaders.php middleware registered in the HTTP kernel.

---

# 20. Common Threat Protection

Document protection against:

SQL Injection

Cross-Site Scripting (XSS)

Cross-Site Request Forgery (CSRF)

Mass Assignment

Brute Force

Session Fixation

Clickjacking

File Upload Attacks

Privilege Escalation

Broken Access Control

---

# 21. Audit Requirements

Security-sensitive actions must generate audit records.

Include:

Actor

Action

Timestamp

IP Address

User Agent

Affected Entity

Metadata

Audit records must be immutable.

---

# 22. Future Security Features

Design the architecture to support:

Multi-Factor Authentication

Hardware Security Keys

Single Sign-On

Risk-Based Authentication

Device Management

Security Alerts

Trusted Devices

---

# 23. Definition of Done

Authentication and security are complete when:

Registration works.

Email verification works.

Login works.

Logout works.

Password reset works.

Authorization is enforced.

Tenant isolation is enforced.

Security logs are generated.

Rate limiting is active.

Validation is comprehensive.

---

# 24. Conclusion

This document defines the official authentication and security standards for ORIVIS.

Every backend implementation must comply with these rules.

Security exceptions require explicit architectural approval.

---

End of document.
