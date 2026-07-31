# ORIVIS Frontend ↔ Backend Mapping

Version: 1.0

Status: Active

Last Updated: July 2026

---

# 1. Purpose

Define how every existing frontend screen communicates with the backend.

This document is the result of a complete analysis of the frontend codebase at `src/`.

Every screen, component, modal, form, widget, chart, filter, and table has been inspected.

No assumptions have been made.

If a screen exists in the frontend but has no backend, it is included with the required backend specification.

If documentation references a screen that does not exist in the codebase, it is flagged under "Documentation Mismatch."

---

# 2. Integration Principles

The backend must:

Never redesign the frontend.

Never remove UI components.

Never rename routes without updating documentation.

Return only the data required by the UI.

Maintain backwards compatibility whenever possible.

The React frontend is the source of truth for the user interface.

The Laravel backend is the source of truth for business logic and data.

---

# 3. Complete Route Inventory

All routes are defined in `src/App.tsx`. Every route below has been verified to exist on disk.

## 3.1 Public Routes

| Route | Component | Layout | File on Disk |
|---|---|---|---|
| `/` | Home | PublicLayout | `pages/Home.tsx` ✅ |
| `/about` | About | PublicLayout | `pages/About.tsx` ✅ |
| `/contact` | Contact | PublicLayout | `pages/Contact.tsx` ✅ |
| `/governance` | Governance | PublicLayout | `pages/Governance.tsx` ✅ |
| `/privacy` | Privacy | PublicLayout | `pages/Privacy.tsx` ✅ |
| `/terms` | Terms | PublicLayout | `pages/Terms.tsx` ✅ |
| `/results` | Results | PublicLayout | `pages/Results.tsx` ✅ |
| `/organize` | Organize | PublicLayout | `pages/Organize.tsx` ✅ |
| `/payment/:appId` | Payment | PublicLayout | `pages/Payment.tsx` ✅ |
| `/application-submitted/:appId` | ApplicationSubmitted | PublicLayout | `pages/ApplicationSubmitted.tsx` ✅ |
| `/elections` | Governance | PublicLayout | `pages/Governance.tsx` ✅ |
| `/elections/:id` | ElectionLanding | PublicLayout | `pages/elections/ElectionLanding.tsx` ✅ |
| `/elections/:id/register` | VoterRegistration | PublicLayout | `pages/elections/VoterRegistration.tsx` ✅ |
| `/elections/:id/auth` | VoteAuth | PublicLayout | `pages/elections/VoteAuth.tsx` ✅ |
| `/elections/:id/vote` | VotingBooth | PublicLayout | `pages/elections/VotingBooth.tsx` ✅ |
| `/elections/:id/success` | VoteSuccess | PublicLayout | `pages/elections/VoteSuccess.tsx` ✅ |
| `/elections/:id/results` | ElectionResults | PublicLayout | `pages/elections/ElectionResults.tsx` ✅ |
| `/elections/:id/closed` | ElectionClosed | PublicLayout | `pages/elections/ElectionClosed.tsx` ✅ |
| `/receipt/:passId` | ReceiptPage | PublicLayout | `pages/receipt/ReceiptPage.tsx` ✅ |

## 3.2 Standalone Auth Routes

| Route | Component | File on Disk |
|---|---|---|
| `/platformsignin` | SignInPage | `pages/SignInPage.tsx` ✅ |
| `/platformsignup` | SignUpPage | `pages/SignUpPage.tsx` ✅ |
| `/signin` | Navigate → `/platformsignin` | redirect ✅ |
| `/signup` | Navigate → `/platformsignup` | redirect ✅ |
| `/forgot-password` | ForgotPasswordPage | `pages/ForgotPasswordPage.tsx` ✅ |
| `/reset-password` | ResetPasswordPage | `pages/ResetPasswordPage.tsx` ✅ |
| `/verify-email` | EmailVerificationPage | `pages/EmailVerificationPage.tsx` ✅ |
| `/activate-account` | AccountActivationPage | `pages/AccountActivationPage.tsx` ✅ |
| `/session-expired` | SessionExpiredPage | `pages/SessionExpiredPage.tsx` ✅ |
| `/unauthorized` | UnauthorizedPage | `pages/UnauthorizedPage.tsx` ✅ |
| `/workspace/signin` | OrgSignInPage | `pages/OrgSignInPage.tsx` ✅ |
| `/org/register` | OrgRegistrationPage | `pages/OrgRegistrationPage.tsx` ✅ |
| `/org/forgot-password` | OrgForgotPasswordPage | `pages/OrgForgotPasswordPage.tsx` ✅ |
| `/org/reset-password` | OrgResetPasswordPage | `pages/OrgResetPasswordPage.tsx` ✅ |
| `/org/invitation` | InvitationAcceptPage | `pages/InvitationAcceptPage.tsx` ✅ |
| `/platform/2fa` | TwoFactorAuthPage | `pages/TwoFactorAuthPage.tsx` ✅ |
| `/platform/verify` | SecurityVerificationPage | `pages/SecurityVerificationPage.tsx` ✅ |
| `/platform/backup-code` | BackupCodePage | `pages/BackupCodePage.tsx` ✅ |

## 3.3 Platform Admin Routes

| Route | Component | File on Disk |
|---|---|---|
| `/platform` | PlatformDashboard | `pages/platform/Dashboard.tsx` ✅ |
| `/platform/governance-sessions` | GovernanceSessions | `pages/platform/GovernanceSessions.tsx` ✅ |
| `/platform/organizations` | PlatformOrganizations | `pages/platform/Organizations.tsx` ✅ |
| `/platform/organizations/:id` | PlatformOrganizationDetail | `pages/platform/OrganizationDetail.tsx` ✅ |
| `/platform/users` | PlatformUsers | `pages/platform/Users.tsx` ✅ |
| `/platform/users/:id` | PlatformUserDetail | `pages/platform/UserDetail.tsx` ✅ |
| `/platform/memberships` | PlatformMemberships | `pages/platform/Memberships.tsx` ✅ |
| `/platform/elections` | PlatformElections | `pages/platform/PlatformElections.tsx` ✅ |
| `/platform/audit` | PlatformAudit | `pages/platform/PlatformAudit.tsx` ✅ |
| `/platform/analytics` | PlatformAnalytics | `pages/platform/Analytics.tsx` ✅ |
| `/platform/billing` | PlatformBilling | `pages/platform/Billing.tsx` ✅ |
| `/platform/notifications` | PlatformNotifications | `pages/platform/PlatformNotifications.tsx` ✅ |
| `/platform/monitoring` | PlatformMonitoring | `pages/platform/PlatformMonitoring.tsx` ✅ |
| `/platform/security` | PlatformSecurity | `pages/platform/PlatformSecurity.tsx` ✅ |
| `/platform/roles` | PlatformRoles | `pages/platform/Roles.tsx` ✅ |
| `/platform/staff` | PlatformStaff | `pages/platform/Staff.tsx` ✅ |
| `/platform/subscriptions` | PlatformSubscriptions | `pages/platform/Subscriptions.tsx` ✅ |
| `/platform/support` | PlatformSupport | `pages/platform/Support.tsx` ✅ |
| `/platform/settings` | PlatformSettings | `pages/platform/PlatformSettings.tsx` ✅ |

## 3.4 Organization Workspace Routes

| Route | Component | org/page File |
|---|---|---|
| `/org/signin` | OrgSignIn | `pages/SignIn.tsx` ✅ |
| `/org` | Navigate → `/org/signin` | redirect ✅ |
| `/org/dashboard` | OrgDashboard | `pages/Dashboard.tsx` ✅ |
| `/org/events` | OrgEvents | `pages/Events.tsx` ✅ |
| `/org/events/create` | OrgCreateEvent | `pages/CreateEvent.tsx` ✅ |
| `/org/events/:id` | OrgEventDetail | `pages/EventDetail.tsx` ✅ |
| `/org/setup` | OrgSetupWizard | `pages/SetupWizard.tsx` ✅ |
| `/org/team` | OrgTeam | `pages/Team.tsx` ✅ |
| `/org/billing` | OrgBilling | `pages/Billing.tsx` ✅ |
| `/org/workspace` | OrgWorkspaceSettings | `pages/WorkspaceSettings.tsx` ✅ |
| `/org/audit-logs` | OrgAuditLogs | `pages/AuditLogs.tsx` ✅ |
| `/org/help` | OrgHelp | `pages/Help.tsx` ✅ |
| `/org/reports` | OrgReports | `pages/Reports.tsx` ✅ |
| `/org/archive` | OrgArchiveCentre | `pages/ArchiveCentre.tsx` ✅ |
| `/org/templates` | OrgTemplates | `pages/Templates.tsx` ✅ |

## 3.5 Catch-All

| Route | Component | File |
|---|---|---|
| `*` (404) | NotFound | `pages/NotFound.tsx` ✅ |

---

# 4. Layouts Inventory

| Layout | File | Purpose | Backend Requirements |
|---|---|---|---|
| PublicLayout | `layouts/PublicLayout.tsx` | Public pages: header (nav + logo), animated background, footer | Nav items (static), footer content (static) |
| PlatformLayout | `layouts/PlatformLayout.tsx` | Platform admin shell: 17-item sidebar, top bar, breadcrumbs | Current user + profile, org count badge |
| OrgLayout | `org/layouts/OrgLayout.tsx` | Org workspace shell: collapsible sidebar, top bar with search/notifications/profile, governance inspection mode | Org branding, unread notification count, current user, org name/logo, governance session state |
| AuthLayout | `components/auth/AuthLayout.tsx` | Auth pages: left form + right animated illustration | None (static) |

---

# 5. Complete Screen-by-Screen Mapping

## 5.1 Authentication Screens

### 5.1.1 SignInPage (`/platformsignin`) + SignIn component

| Aspect | Detail |
|---|---|
| **Purpose** | Platform admin sign-in. Collects email + password, authenticates, redirects to `/platform`. |
| **Data Required** | `email`, `password` from form; `{ user, token }` from API |
| **API Endpoints** | `POST /auth/login` → `{ success, message, data: { user, accessToken, refreshToken } }` |
| **Database Entities** | `users`, `sessions` |
| **Service Class** | `AuthenticationService` + `AuthService` (existing `auth-service.ts`) |
| **Permissions** | Guest (no auth required) |
| **Validation** | Email: non-empty (browser `required`). Password: non-empty (browser `required`). |
| **Loading State** | `LoadingOverlay` with cycling messages: "Authenticating your credentials...", "Connecting to secure server...", "Loading your dashboard..." |
| **Empty State** | N/A — form is always visible |
| **Error State** | Animated error banner at top of form with message from API (or fallback "Sign in failed. Please check your credentials.") |
| **Success State** | Calls `login()` from `useAuth`, parent redirects to `/platform` |
| **Variants** | Platform (blue theme) and Organization (gold theme) via `variant` prop; compact mode without glass-card wrapper |

### 5.1.2 OrgSignIn (`/org/signin`)

| Aspect | Detail |
|---|---|
| **Purpose** | Organization workspace sign-in. Uses same `SignIn` component with `variant="organization"`. |
| **Data Required** | Same as SignInPage |
| **API Endpoints** | `POST /auth/login` |
| **Database Entities** | `users`, `memberships`, `organizations` |
| **Service Class** | `AuthenticationService` |
| **Permissions** | Guest |
| **Validation** | Same as SignInPage |
| **Loading State** | Same `LoadingOverlay` |
| **Empty State** | N/A |
| **Error State** | Same animated error banner |
| **Success State** | Redirects to `/org/dashboard` |
| **Note** | If already authenticated, auto-redirects to `/org/dashboard` |

### 5.1.3 SignUpPage (`/platformsignup`)

| Aspect | Detail |
|---|---|
| **Purpose** | Platform user self-registration. Collects name, email, password, confirm password, terms agreement. Shows success with email verification prompt. |
| **Data Required** | `fullName`, `email`, `password`, `passwordConfirmation`, `agreeTerms` |
| **API Endpoints** | `POST /auth/register` |
| **Database Entities** | `users` |
| **Service Class** | `AuthenticationService` |
| **Permissions** | Guest |
| **Validation** | Full Name: required. Email: required, regex `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`. Password: required, min 8 chars. Confirm: must match. Terms: must be true. |
| **Loading State** | Button shows "Creating Account...", inputs disabled. 1.5s simulated delay. |
| **Empty State** | N/A |
| **Error State** | Animated error banner at top + inline field errors under each invalid input |
| **Success State** | `AuthStateCard` with welcome message showing user's first name + email, "Go to Sign In" button |

### 5.1.4 OrgRegistrationPage (`/org/register`)

| Aspect | Detail |
|---|---|
| **Purpose** | Multi-step (3 steps + submitting + success) organization registration. Creates org + primary owner account. |
| **Data Required** | Step 1: org name, short name (max 15), category (enum), contact email, phone, website, country, state, password, confirm password, terms. Step 2: logo file (max 2MB, types: jpg/png/svg/webp) or URL, primary/secondary/accent colors. Step 3: review all. |
| **API Endpoints** | `POST /auth/register` (owner account) + `POST /organizations` (create org) + `POST /organizations/{id}/branding` |
| **Database Entities** | `users`, `organizations`, `organization_users`, `workspace_settings`, `file_uploads` |
| **Service Class** | `AuthenticationService` + `OrganizationService` |
| **Permissions** | Guest |
| **Validation** | Org name: required. Short name: required, max 15. Category: required (non-empty). Contact email: required + email regex. Phone: required. Country: required. Password: min 8, must match confirm. Terms: must be true. Logo: max 2MB, allowed extensions. |
| **Loading State** | Step "submitting": `AuthStateCard` with loading spinner and "Creating Organization" message, 2s simulated |
| **Empty State** | N/A — all steps pre-filled or guided |
| **Error State** | Inline field-level errors (red border + text). Logo size validation error displayed below upload area. |
| **Success State** | `AuthStateCard` success with org name, verification email info, link to `/verify-email?email=...&org=...` |
| **Notes** | Writes `orivis_setup_complete = "false"` to localStorage before submission. Password strength indicator checks 5 criteria (min8, upper, lower, number, special). Supports both file upload and URL for logo (mutually exclusive). |

### 5.1.5 ForgotPasswordPage (`/forgot-password`)

| Aspect | Detail |
|---|---|
| **Purpose** | Request password reset email. Uses masked-security messaging ("If an account exists, we've sent a link"). |
| **Data Required** | `email` |
| **API Endpoints** | `POST /auth/forgot-password` |
| **Database Entities** | `users`, `password_reset_tokens` |
| **Service Class** | `AuthenticationService` |
| **Permissions** | Guest |
| **Validation** | Email: required, regex `/^[^\s@]+@[^\s@]+\.[^\s@]+$/` |
| **Loading State** | Button shows "Sending..." with spinner, 1.5s simulated |
| **Empty State** | N/A |
| **Error State** | Animated error banner for invalid format/empty |
| **Success State** | `AuthStateCard` success with masked message, "Back to Sign In" button |

### 5.1.6 ResetPasswordPage (`/reset-password`)

| Aspect | Detail |
|---|---|
| **Purpose** | Set new password using token from URL query param. |
| **Data Required** | `token` from query params, `password`, `passwordConfirmation` |
| **API Endpoints** | `POST /auth/reset-password` |
| **Database Entities** | `users`, `password_reset_tokens` |
| **Service Class** | `AuthenticationService` |
| **Permissions** | Guest (token-gated) |
| **Validation** | Token must exist in URL. Password: min 8 chars. Confirm: must match password. |
| **Loading State** | Button shows "Resetting Password..." with spinner, 1.5s simulated |
| **Empty State** | N/A |
| **Error State** | If no token: `AuthStateCard` error "Invalid Link" + "Request New Link" button. Form validation: animated error banner with specific message (empty / too short / mismatch). |
| **Success State** | `AuthStateCard` success "Password Updated" + "Sign In Now" button → `/platformsignin` |

### 5.1.7 EmailVerificationPage (`/verify-email`)

| Aspect | Detail |
|---|---|
| **Purpose** | Handle email verification flow: pending (waiting for link click), verifying, success, failed, expired, resending. |
| **Data Required** | `token` (optional), `email` (optional), `org` (optional) from URL params |
| **API Endpoints** | `POST /auth/verify-email` (verify token), `POST /auth/send-verification` (resend) |
| **Database Entities** | `users` |
| **Service Class** | `AuthenticationService` |
| **Permissions** | Guest |
| **Validation** | Token/email presence from URL determines initial state |
| **Loading State** | Verifying/resending: `AuthStateCard` loading with appropriate message |
| **Empty State** | N/A |
| **Error State** | Failed: "Verification Failed" + resend button. Expired: "Link Expired" + resend. |
| **Success State** | "Email Verified" + "Continue to Sign In" (or "Continue to {org}" if org param) |
| **States** | **Pending**: shows masked email, instructions, "I've Verified" button, resend button. **Verifying**: auto-transitions to success after 2s. **Resending**: returns to pending after 1.5s. |

### 5.1.8 AccountActivationPage (`/activate-account`)

| Aspect | Detail |
|---|---|
| **Purpose** | Activate account using token from URL. |
| **Data Required** | `token` from URL params |
| **API Endpoints** | `POST /auth/activate` |
| **Database Entities** | `users` |
| **Service Class** | `AuthenticationService` |
| **Permissions** | Guest (token-gated) |
| **Validation** | Token must exist in URL |
| **Loading State** | Activating: `AuthStateCard` loading with "Activating Your Account", auto-transitions after 2s |
| **Empty State** | N/A |
| **Error State** | No token: `AuthStateCard` error "Activation Failed" + "Create New Account" button → `/platformsignup` |
| **Success State** | "Account Activated" + "Sign In Now" → `/platformsignin` |
| **Additional** | "Already Activated" info state with sign-in button |

### 5.1.9 InvitationAcceptPage (`/org/invitation`)

| Aspect | Detail |
|---|---|
| **Purpose** | Accept organization invitation. Requires `token`, `org`, `inviter` from URL. Form collects full name + password. |
| **Data Required** | `token`, `org`, `inviter` from URL query params; `fullName`, `password`, `passwordConfirmation` from form |
| **API Endpoints** | `POST /memberships/accept` |
| **Database Entities** | `memberships`, `invitations`, `users` |
| **Service Class** | `MembershipService` |
| **Permissions** | Guest (token-gated) |
| **Validation** | Token: must exist. Full name: required. Password: min 8 chars. Confirm: must match. |
| **Loading State** | Button shows "Accepting Invitation..." with spinner, 1.5s simulated |
| **Empty State** | N/A |
| **Error State** | No token: `AuthStateCard` error "Invalid Invitation" + "Go to Organization Sign In". Form: animated error banner (name/password/mismatch). |
| **Success State** | "Invitation Accepted" + "Welcome to {orgName}" + "Sign In to {orgName}" → `/org/signin` |

### 5.1.10 TwoFactorAuthPage (`/platform/2fa`)

| Aspect | Detail |
|---|---|
| **Purpose** | Enter 6-digit authenticator code to complete 2FA. |
| **Data Required** | 6-digit code |
| **API Endpoints** | `POST /auth/2fa/verify` (future) |
| **Database Entities** | `users` (mfa_secret) |
| **Service Class** | `AuthenticationService` (future) |
| **Permissions** | Guest (post-login challenge) |
| **Validation** | 6 digits, numeric |
| **States** | Form → validating → success (redirects to dashboard) |
| **Note** | No backend implementation yet — UI exists with mock flow only |

### 5.1.11 SecurityVerificationPage (`/platform/verify`)

| Aspect | Detail |
|---|---|
| **Purpose** | Security code (8-digit) sent to email/device for sensitive operations. |
| **Data Required** | 8-digit code |
| **API Endpoints** | `POST /auth/verify-security` (future) |
| **Database Entities** | `users`, `security_codes` |
| **Service Class** | `AuthenticationService` (future) |
| **Permissions** | Authenticated (post-login challenge) |
| **Validation** | 8 digits |
| **Note** | No backend implementation yet — UI exists with mock flow only |

### 5.1.12 BackupCodePage (`/platform/backup-code`)

| Aspect | Detail |
|---|---|
| **Purpose** | Use 8-character backup code when 2FA device unavailable. |
| **Data Required** | Backup code string |
| **API Endpoints** | `POST /auth/2fa/backup` (future) |
| **Database Entities** | `users` (backup_codes) |
| **Service Class** | `AuthenticationService` (future) |
| **Permissions** | Guest (post-login challenge) |
| **Validation** | 8 characters, alphanumeric |
| **Note** | No backend implementation yet — UI exists with mock flow only |

---

## 5.2 Session/Auth Status Pages

### 5.2.1 SessionExpiredPage (`/session-expired`)

| Aspect | Detail |
|---|---|
| **Purpose** | Informs user session expired due to inactivity. "Sign In" button → `/platformsignin`. |
| **Backend Required** | None (static page) |
| **Permissions** | Guest |

### 5.2.2 UnauthorizedPage (`/unauthorized`)

| Aspect | Detail |
|---|---|
| **Purpose** | 403 Forbidden page. Options: sign in with different account, go back. |
| **Backend Required** | None (static page) |
| **Permissions** | Guest |

---

## 5.3 Public/Static Pages

### 5.3.1 Home (`/`)

| Aspect | Detail |
|---|---|
| **Purpose** | Landing page with animated stats, hero sections, org type showcase, testimonials, FAQ. Drives visitor to register. |
| **Data Required** | Platform stats (org count, votes cast, active elections, uptime — currently hardcoded) |
| **API Endpoints** | `GET /platform/stats` → platform aggregate stats |
| **Database Entities** | `organizations`, `elections`, `votes` (aggregate only) |
| **Service Class** | `PlatformService` |
| **Permissions** | Public |
| **States** | None (all static content) |

### 5.3.2 About, Contact, Privacy, Terms (`/about`, `/contact`, `/privacy`, `/terms`)

| Aspect | Detail |
|---|---|
| **Purpose** | Static informational pages. Contact has a form. |
| **Data Required** | Contact form: name, email, subject, message |
| **API Endpoints** | `POST /contact` (contact form submission) |
| **Database Entities** | `contact_messages` |
| **Service Class** | `SupportService` |
| **Permissions** | Public |
| **States** | None (static) |

### 5.3.3 Governance Centre (`/governance` and `/elections`)

| Aspect | Detail |
|---|---|
| **Purpose** | Lists all available elections/consultations/approvals/referendums/surveys. Interactive cards with status indicators. |
| **Data Required** | Elections list with status, dates, organization, position count |
| **API Endpoints** | `GET /elections` → published/listable elections |
| **Database Entities** | `elections` |
| **Service Class** | `ElectionService` |
| **Permissions** | Public |
| **States** | Currently uses mock data from `MockElection` |
| **Note** | Same component renders both `/governance` and `/elections` routes |

### 5.3.4 Results Centre (`/results`)

| Aspect | Detail |
|---|---|
| **Purpose** | Displays election results with per-position breakdowns (candidate name, votes, percentage). Live/concluded/upcoming groupings. |
| **Data Required** | Multi-election results with per-position candidate vote counts |
| **API Endpoints** | `GET /elections` → elections list; `GET /elections/{id}/results` |
| **Database Entities** | `elections`, `votes`, `results` |
| **Service Class** | `ResultService` |
| **Permissions** | Public |
| **States** | Currently uses mock data |

### 5.3.5 Organize (`/organize`)

| Aspect | Detail |
|---|---|
| **Purpose** | Quick 2-step organization registration (simplified version of OrgRegistrationPage). Collects org details + branding, saves to localStorage. |
| **Data Required** | Step 1: org name, type, country. Step 2: logo, colors. |
| **API Endpoints** | `POST /organizations` |
| **Database Entities** | `organizations`, `workspace_settings` |
| **Service Class** | `OrganizationService` |
| **Permissions** | Guest |
| **Validation** | Step 1: org name required, type required, country required. Step 2: none enforced. |
| **States** | Multi-step wizard, client-side validation, localStorage persistence |
| **Note** | This is a lightweight registration. Full version at `/org/register`. |

### 5.3.6 Payment (`/payment/:appId`)

| Aspect | Detail |
|---|---|
| **Purpose** | Post-registration payment page. Reads application from localStorage, determines tier by voter estimate, shows payment form or redirects free tier. |
| **Data Required** | `appId` from URL, application data from localStorage, selected plan, payment details |
| **API Endpoints** | `POST /payments/initialize` (future Paystack), `POST /subscriptions` (future) |
| **Database Entities** | `subscriptions`, `invoices` (future) |
| **Service Class** | `BillingService` (future) |
| **Permissions** | Guest (post-registration) |
| **States** | Subscription plan display, free tier immediate redirect, payment form (future) |
| **Note** | Payment is deferred (Presentation MVP excludes billing). UI exists with pay-on-delivery flow for MVP. |

### 5.3.7 ApplicationSubmitted (`/application-submitted/:appId`)

| Aspect | Detail |
|---|---|
| **Purpose** | Confirmation page after registration/payment. Shows app ID, success checkmark, delivery email, copy ID button. |
| **Data Required** | `appId` from URL, org name/email from localStorage |
| **API Endpoints** | None (static confirmation) |
| **Permissions** | Guest |
| **States** | Single success state |

### 5.3.8 NotFound (`*` 404)

| Aspect | Detail |
|---|---|
| **Purpose** | Catch-all 404 page. "Page not found" + "Go Home" button. |
| **Backend Required** | None |
| **Permissions** | Public |

---

## 5.4 Election Voting Flow (Public-Facing)

### 5.4.1 ElectionLanding (`/elections/:id`)

| Aspect | Detail |
|---|---|
| **Purpose** | Single election landing page. Shows title, description, dates, org, total registered. Status-driven CTAs (LIVE→vote, UPCOMING→register, CLOSED→results). |
| **Data Required** | `id` from URL. Election: id, title, description, status, startDate, endDate, totalRegistered, organization, positions. |
| **API Endpoints** | `GET /elections/{id}` |
| **Database Entities** | `elections` |
| **Service Class** | `electionService.getElection()` |
| **Permissions** | Public |
| **Validation** | If no `id` or null response → "not-found" state |
| **Loading State** | Spinner + "Loading election..." |
| **Empty/Error State** | "Election Not Found" + back button |
| **Success State** | Full layout with status-specific content (Live/Upcoming/Closed variants) |

### 5.4.2 VoterRegistration (`/elections/:id/register`)

| Aspect | Detail |
|---|---|
| **Purpose** | Voter looks up their ID, gets a voting pass issued to them. |
| **Data Required** | `id` from URL. Lookup: orgId (student/staff ID input). Issue: VoterRecord (name, email, department, level). Result: pass ID. |
| **API Endpoints** | `GET /elections/{id}` (load election); `GET /voters/lookup?orgId={orgId}&electionId={id}`; `POST /voters/{voterId}/issue-pass` |
| **Database Entities** | `elections`, `participants`, `voting_passes` |
| **Service Class** | `voterService.lookupVoter()`, `voterService.issueVotingPass()` |
| **Permissions** | Public (voter) |
| **Validation** | orgId must be non-empty. Election must exist. Lookup must return a record. |
| **Loading State** | Full-page spinner (`Loader2`) |
| **Error State** | "Election not found." text |
| **Success State** | "Voting Pass Issued!" with pass ID display |
| **Form Component** | `VoterRegistrationForm` — 2 steps: lookup (ID input + "Look Up") → confirm (VoterRecord display + "Confirm & Issue") |

### 5.4.3 VoteAuth (`/elections/:id/auth`)

| Aspect | Detail |
|---|---|
| **Purpose** | Enter 16-character voting pass (4×4 groups) to authenticate for voting. |
| **Data Required** | `id` from URL. Full 16-char pass string. Validation result: `{ valid: boolean, electionId: string }`. |
| **API Endpoints** | `POST /voting-passes/validate` |
| **Database Entities** | `voting_passes` |
| **Service Class** | `voterService.validatePass()` |
| **Permissions** | Public (pass-holder) |
| **Validation** | Pass must be exactly 16 chars. API must return `valid: true` and matching `electionId`. Input: `[^A-Z0-9]` stripped, auto-uppercased. |
| **Loading State** | Button shows `Loader2` + "Validating...", inputs disabled |
| **Error State** | Red alert box with `AlertCircle` + specific error message (incomplete/invalid/mismatch) |
| **Success State** | "Pass Validated!" + auto-redirect to voting booth after 800ms |
| **Input Component** | `VotingPassInput` — 4 groups of 4, auto-advance, paste support, backspace nav |

### 5.4.4 VotingBooth (`/elections/:id/vote`)

| Aspect | Detail |
|---|---|
| **Purpose** | Core ballot interface. Steps through positions one at a time, selects candidate (or abstain), reviews all, confirms, casts vote. |
| **Data Required** | `id` from URL, `pass` from query param. Election with `positions[{id, title, candidates[{id, name, photo?, party?}]}]`. Selections: `Record<positionId, candidateId | null>`. |
| **API Endpoints** | `GET /elections/{id}` (load positions/candidates); `POST /elections/{id}/ballots` (cast vote) |
| **Database Entities** | `elections`, `election_positions`, `candidates`, `votes`, `vote_receipts`, `voting_passes` |
| **Service Class** | `electionService.getElection()`, `voterService.castVote()` |
| **Permissions** | Validated pass-holder (pass from query param) |
| **Validation** | `passId` must exist in query params. Vote cannot be changed after submission. Duplicate vote must be rejected by backend. |
| **Loading State** | `Loader2` spinner while loading election |
| **Error State** | "Unable to load ballot." if no election/pass. Submit errors caught and shown via confirmation dialog. |
| **Empty State** | N/A — positions are pre-loaded from election data |
| **Sub-components** | `BallotPosition` (candidate cards, abstain option), `BallotNavigation` (prev/next, progress bar), `VoteReview` (all selections summary + edit), `VoteConfirmation` (modal: "Are you sure?" irreversible warning) |

### 5.4.5 VoteSuccess (`/elections/:id/success`)

| Aspect | Detail |
|---|---|
| **Purpose** | Post-vote confirmation. Shows blockchain receipt: receipt ID, timestamp, election title, org. Links back to governance or view results. |
| **Data Required** | `id` from URL, `pass` from query param. VoteReceipt (receiptId, timestamp, electionId, organizationId, voterId, selections). |
| **API Endpoints** | `GET /vote-receipts/{passId}`; `GET /elections/{id}` (for display context) |
| **Database Entities** | `vote_receipts`, `votes` |
| **Service Class** | `voterService.getReceipt()` |
| **Permissions** | Voter (pass-holder) |
| **Loading State** | `Loader2` spinner (fetches receipt + election in parallel via `Promise.all`) |
| **Error State** | None explicit — if receipt null, page still renders header + buttons without receipt section |
| **Success State** | `ReceiptDisplay` component with print/download functionality, "Back to Governance" + "View Results" links |

### 5.4.6 ReceiptPage (`/receipt/:passId`)

| Aspect | Detail |
|---|---|
| **Purpose** | Standalone receipt verification page (independent of post-vote flow). View any vote receipt by pass ID. |
| **Data Required** | `passId` from URL. VoteReceipt, related Election (title, organization). |
| **API Endpoints** | `GET /vote-receipts/{passId}`; `GET /elections/{receipt.electionId}` (chained) |
| **Database Entities** | `vote_receipts`, `votes`, `elections` |
| **Service Class** | `voterService.getReceipt()` |
| **Permissions** | Public (anyone with pass ID) |
| **Validation** | `passId` must exist. Receipt must be found. |
| **Loading State** | `Loader2` spinner |
| **Error State** | Red alert box: "Receipt Not Found" + detail |
| **Success State** | `ReceiptDisplay` component with full receipt details |

### 5.4.7 ElectionResults (`/elections/:id/results`)

| Aspect | Detail |
|---|---|
| **Purpose** | Per-position election results with horizontal bar charts showing candidate vote counts and percentages. Turnout data. |
| **Data Required** | `id` from URL. Election with positions and candidate vote counts. Total turnout, registered voters. |
| **API Endpoints** | `GET /elections/{id}` (with results/votes embedded); `GET /elections/{id}/results` |
| **Database Entities** | `elections`, `votes`, `results` |
| **Service Class** | `ElectionService` + `ResultService` |
| **Permissions** | Public |
| **Validation** | If no `id` or null election → "Results not available." |
| **Loading State** | `Loader2` spinner |
| **Error State** | "Results not available." text |
| **Success State** | Header with election meta + per-position result bars (candidate name, votes, percentage bar) |

### 5.4.8 ElectionClosed (`/elections/:id/closed`)

| Aspect | Detail |
|---|---|
| **Purpose** | Static info: voting ended, no longer accepting votes. Link to results. |
| **Backend Required** | None (static page, `id` used for nav links only) |
| **Permissions** | Public |
| **States** | Single static state — alert icon + "Voting Has Ended" + "View Results" link |

---

## 5.5 Organization Workspace Screens

### 5.5.1 OrgDashboard (`/org/dashboard`)

| Aspect | Detail |
|---|---|
| **Purpose** | Main org landing page after login. Stats, activity, notifications, health, quick actions, subscription, storage. Redirects to `/org/setup` if setup incomplete. |
| **Data Required** | DASHBOARD_STATS (4 metrics), EVENTS_SUMMARY (5 events), ORG_NOTIFICATIONS (6), ACTIVITY_FEED (6), TEAM_MEMBERS, SUBSCRIPTION_INFO, WORKSPACE_STATUS, WORKSPACE_HEALTH, STORAGE_USAGE, PENDING_TASKS, EVENT_HEALTH, org branding (name, shortName, logo) |
| **API Endpoints** | `GET /org/dashboard/stats`, `GET /org/events?limit=5`, `GET /org/notifications`, `GET /org/activity`, `GET /org/team/members?limit=4`, `GET /org/subscription`, `GET /org/workspace/health`, `GET /org/storage`, `GET /org/pending-tasks`, `GET /org/elections/health` |
| **Database Entities** | `organizations`, `elections`, `memberships`, `notifications`, `audit_logs`, `subscriptions`, `workspace_settings`, `file_uploads` |
| **Service Class** | `DashboardService`, `ElectionService`, `WorkspaceService`, `NotificationService` |
| **Permissions** | org_member (authenticated + org member) |
| **Loading State** | Full-page skeleton: pulse bars, `SkeletonLoader` (4 rows, card variant), 2-column animated pulse grid |
| **Empty State** | Per-widget `EmptyState` with context-specific action CTAs (Create Election, Invite Members, etc.) |
| **Error State** | Full-page `EmptyState` with "Failed to Load Dashboard" + Retry button (`location.reload()`) |
| **Setup Redirect** | Checks localStorage `orivis_setup_complete` — redirects to `/org/setup` if not `"true"` |

### 5.5.2 OrgEvents (`/org/events`)

| Aspect | Detail |
|---|---|
| **Purpose** | Event listing/management page. Filterable (status tabs), searchable table with summary stats and sidebar widgets. |
| **Data Required** | Events list with status, voter/candidate counts, turnout, dates |
| **API Endpoints** | `GET /org/events?status=&search=` |
| **Database Entities** | `elections` |
| **Service Class** | `ElectionService` |
| **Permissions** | org_admin |
| **Empty State** | "No Events Found" (context-aware: search vs filter) |
| **Loading State** | Not implemented (data is sync mock) |
| **States** | Tabs: All/Live/Published/Completed/Draft (maps to backend enums: live→open, published→published, completed→closed, draft→draft; see 03_BUSINESS_RULES.md §7 for full mapping). Search filters title. Summary stat cards. Widget: Event Activity, Turnout Overview. |

### 5.5.3 OrgCreateEvent (`/org/events/create`)

| Aspect | Detail |
|---|---|
| **Purpose** | 4-step event creation wizard: (1) Event Type, (2) Details (title, dates, timezone, visibility), (3) Branding (colors, theme), (4) Review & Create. |
| **Data Required** | Step 1: eventType. Step 2: title, description, start/end dates+times, registration dates, timezone, visibility. Step 3: primaryColor, accentColor, theme. Step 4: review all. |
| **API Endpoints** | `POST /org/events` |
| **Database Entities** | `elections`, `election_positions`, `workspace_settings` (branding defaults) |
| **Service Class** | `ElectionService` |
| **Permissions** | org_admin |
| **Validation** | Step 1: eventType must be selected. Step 2: title, description, all dates+times required. Step 3: always valid. No field-level error messages — only Next button disabled state. |
| **Loading State** | Submit: full-screen overlay with "Creating Event..." spinner and "Your event will be created as a draft." (1.5s mock) |
| **Empty State** | N/A (wizard always has content) |
| **Error State** | Not implemented (mock always succeeds) |
| **Notes** | `EVENT_TYPE_OPTIONS` provides type selection cards. `TIMEZONES` provides dropdown options. Cross-step state managed via `form` object + `updateField()`. |

### 5.5.4 OrgEventDetail (`/org/events/:id`)

| Aspect | Detail |
|---|---|
| **Purpose** | Comprehensive single-event management with 13 tabs: Overview, Timeline, Registration, Candidates, Participants, Branding, Settings, Analytics, Audit, Results, Permissions, Communication, Publishing. |
| **Data Required** | Full event data: event metadata, positions, candidates, participants, registrations, branding, settings, analytics, audit logs, results, permissions, timeline activities, publish readiness |
| **API Endpoints** | `GET /org/events/{id}`, `GET /org/events/{id}/positions`, `GET /org/events/{id}/candidates`, `GET /org/events/{id}/participants`, `GET /org/events/{id}/registrations`, `GET /org/events/{id}/analytics`, `GET /org/events/{id}/audit`, `GET /org/events/{id}/results`, `GET /org/events/{id}/timeline`, `PUT /org/events/{id}/branding`, `PUT /org/events/{id}/settings`, `POST /org/events/{id}/publish`, `POST /org/events/{id}/archive`, `POST /org/events/{id}/notifications` |
| **Database Entities** | `elections`, `election_positions`, `candidates`, `participants`, `registrations`, `votes`, `vote_receipts`, `audit_logs`, `workspace_settings` |
| **Service Class** | `ElectionService`, `CandidateService`, `ParticipantService`, `ResultService`, `AuditService`, `NotificationService` |
| **Permissions** | org_admin (most tabs), election_manager (some tabs) |
| **Loading State** | Not implemented (sync mock) |
| **Not Found State** | Full-page `EmptyState` "Event Not Found" + "Back to Events" |
| **Empty States** | Per-tab `EmptyState` (7+ variants): no activity, no timeline, no candidates, no participants, no analytics, no audit events, no results |
| **Error State** | Not implemented |
| **Tabs** | 13: Overview (summary + stats + recent activity), Timeline (filterable event timeline), Registration (capacity, eligibility, verification methods, pass settings), Candidates (searchable/filterable grid grouped by position, reorder, CRUD), Participants (searchable/filterable table, bulk actions, pagination, import/export), Branding (colors, theme, banner, logo, preview), Settings (title, dates, visibility, security toggles, result publication, notification toggles), Analytics (health metrics, charts: registration trend, participant growth, turnout projection, candidate stats), Audit (searchable/filterable audit log table), Results (certified banner, per-position ranking, winner highlighting, certificate badge), Permissions (read-only toggle groups), Communication (notification preferences toggles, send notification form), Publishing (readiness checklist, validation summary, Publish button with loading) |
| **Forms** | Branding tab (color+text inputs, Save mock), Settings tab (all event fields, Save mock), Communication tab (subject/message, Send mock stub) |

### 5.5.5 OrgTeam (`/org/team`)

| Aspect | Detail |
|---|---|
| **Purpose** | Team management with 3 tabs: Team Members (searchable, filterable, sortable, paginated table, multi-select, bulk actions), Roles & Permissions (system + custom roles grid, create/edit/delete/clone), Invitations (pending + history, resend/revoke). |
| **Data Required** | Team members list (name, email, role, department, status, last active), invitations (email, role, department, invitedBy, sentDate, status), roles (system + custom, name, description, memberCount, permissions) |
| **API Endpoints** | `GET /org/team/members`, `GET /org/team/roles`, `GET /org/team/invitations`, `POST /org/team/invite`, `POST /org/team/roles`, `PUT /org/team/roles/{id}`, `DELETE /org/team/roles/{id}`, `PUT /org/team/members/{id}/role`, `DELETE /org/team/members/{id}`, `POST /org/team/invitations/{id}/resend`, `POST /org/team/invitations/{id}/revoke` |
| **Database Entities** | `memberships`, `invitations`, `roles`, `role_permissions`, `users` |
| **Service Class** | `MembershipService`, `RoleService` |
| **Permissions** | org_admin |
| **Empty States** | Members: "No team members found" (context-aware). Custom roles: "No custom roles" + "Create Role" action. Invitations: "No invitations". |
| **Loading State** | Not implemented (sync mock) |
| **Error State** | Not implemented |
| **Forms** | Invite Modal (4 fields: name, email, role select, department select — no validation). Create/Edit Role Modal (name, description, permission checkboxes grouped by `PERMISSION_GROUPS` — no validation). |
| **Note** | All modal submissions are mock (no actual API calls) |

### 5.5.6 OrgBilling (`/org/billing`)

| Aspect | Detail |
|---|---|
| **Purpose** | View current subscription plan, compare available packages (monthly/annual toggle), payment methods, recent invoices. |
| **Data Required** | Current plan (name, nextBilling, amount, seats used/total, participants used, storage used/total), BILLING_PLANS (4 plans with features), PAYMENT_METHODS (brand, last4, expiry, default), INVOICES (5 recent: amount, status, date) |
| **API Endpoints** | `GET /org/billing/subscription`, `GET /org/billing/plans`, `GET /org/billing/payment-methods`, `GET /org/billing/invoices`, `POST /org/billing/subscription/change`, `POST /org/billing/payment-methods`, `DELETE /org/billing/payment-methods/{id}` |
| **Database Entities** | `subscriptions`, `subscription_plans`, `payment_methods`, `invoices` |
| **Service Class** | `BillingService` |
| **Permissions** | org_owner, org_admin |
| **Empty State** | Invoices: `<EmptyState icon={Receipt}>` "No invoices — Your invoices will appear here." |
| **Loading State** | Not implemented |
| **Error State** | Not implemented |
| **Note** | Payment deferred (Presentation MVP). UI exists, all data mock. |

### 5.5.7 OrgWorkspaceSettings (`/org/workspace`)

| Aspect | Detail |
|---|---|
| **Purpose** | 5-tab settings page: Organization Profile, Branding (colors + logo + preview), Workspace Configuration (name, timezone, language, storage), Notifications (toggle: email/SMS/push), Security (session timeout, 2FA, login alerts). |
| **Data Required** | WORKSPACE_PROFILE (name, shortName, email, phone, website, address, description, founded, sector), BRANDING_SETTINGS (primary, secondary, accent colors, theme), WORKSPACE_CONFIG (workspaceName, timezone, language, electionVisibility) |
| **API Endpoints** | `GET /org/workspace`, `PUT /org/workspace/profile`, `PUT /org/workspace/branding`, `PUT /org/workspace/config`, `PUT /org/workspace/notifications`, `PUT /org/workspace/security` |
| **Database Entities** | `organizations`, `workspace_settings` |
| **Service Class** | `WorkspaceService` |
| **Permissions** | org_admin |
| **Validation** | None — all fields controlled but unvalidated |
| **Loading State** | Not implemented |
| **Empty State** | N/A (pre-filled with mock data) |
| **Error State** | Not implemented |
| **Success Feedback** | Save button turns green "Saved!" for 2 seconds |
| **Note** | Save calls `updateBranding` from `OrgBrandingContext` (propagates CSS vars). Actual API calls not wired. |

### 5.5.8 OrgAuditLogs (`/org/audit-logs`)

| Aspect | Detail |
|---|---|
| **Purpose** | 3-tab audit log viewer: Workspace, Event, Voting. Each tab shows grouped-by-date events with search, severity filter, pagination. |
| **Data Required** | WORKSPACE_AUDIT_LOGS, EVENT_AUDIT_LOGS, VOTING_AUDIT_LOGS — each event: action, user, timestamp, IP, module, severity |
| **API Endpoints** | `GET /org/audit-logs?module={workspace|event|voting}&search=&severity=&page=&perPage=`, `GET /org/audit-logs/export` |
| **Database Entities** | `audit_logs` |
| **Service Class** | `AuditService` |
| **Permissions** | org_admin |
| **Search** | Text search filters by action and user |
| **Filter** | Severity buttons: All / Info / Warning / Critical |
| **Empty State** | "No audit events found — Try adjusting your search or filters." |
| **Loading State** | Not implemented |
| **Error State** | Not implemented |

### 5.5.9 OrgHelp (`/org/help`)

| Aspect | Detail |
|---|---|
| **Purpose** | Help & support centre with 4 tabs: Knowledge Base (searchable articles by category), FAQs (expandable accordion), Release Notes (version history), Contact Support (form). Online status indicator. |
| **Data Required** | HELP_ARTICLES (title, description, category, readTime), FAQS (question, answer, category), RELEASE_NOTES (version, type, title, date, changes), WORKSPACE_STATUSES (online/offline status) |
| **API Endpoints** | `GET /help/articles?search=&category=`, `GET /help/faqs?search=`, `GET /help/release-notes`, `GET /workspace/status`, `POST /support/contact` |
| **Database Entities** | `help_articles`, `faqs`, `release_notes`, `support_tickets` |
| **Service Class** | `SupportService` |
| **Permissions** | org_member |
| **Empty States** | KB: "No articles found". FAQs: "No FAQs found". Release Notes: "No release notes found". |
| **Loading State** | Not implemented |
| **Error State** | Not implemented |
| **Contact Form** | Subject, Category dropdown, Message textarea — no validation |

### 5.5.10 OrgReports (`/org/reports`)

| Aspect | Detail |
|---|---|
| **Purpose** | Generate and manage reports. Stats cards, report type buttons (7 types), searchable/filterable report list with export/download/delete. |
| **Data Required** | MOCK_REPORTS (title, type, format, size, downloads, status, date), report generation triggers |
| **API Endpoints** | `GET /org/reports?search=&type=&status=`, `POST /org/reports/generate`, `GET /org/reports/{id}/download`, `DELETE /org/reports/{id}`, `GET /org/reports/stats` |
| **Database Entities** | `reports` |
| **Service Class** | `ReportService` |
| **Permissions** | org_admin, election_manager |
| **Filters** | Search (title), Type dropdown (8 types), Status dropdown (Generated/Processing/Queued/Failed), Format buttons (CSV/PDF/JSON) |
| **Empty State** | "No Reports Found" (context-aware: search active vs no reports) |
| **Loading State** | Per-button spinner when generating (1.5s mock) |
| **Error State** | Per-report failed status displayed |

### 5.5.11 OrgArchiveCentre (`/org/archive`)

| Aspect | Detail |
|---|---|
| **Purpose** | Manage archived events. Searchable, filterable list with restore/permanent-delete via confirmation dialog. Shows archive reason, retention period, history. |
| **Data Required** | MOCK_ARCHIVE_RECORDS (eventTitle, archiveDate, reason, retentionPeriod, canRestore, history: [{action, user, date}]) |
| **API Endpoints** | `GET /org/archive?search=&reason=`, `POST /org/archive/{id}/restore`, `DELETE /org/archive/{id}` |
| **Database Entities** | `elections` (archive flags), `archive_records` |
| **Service Class** | `ArchiveService` |
| **Permissions** | org_admin |
| **Filters** | Search (title/reason), Reason buttons (All/Completed/Cancelled/Expired) |
| **Empty State** | "No Archived Records" (context-aware) |
| **Loading State** | Not implemented |
| **Error State** | Not implemented |

### 5.5.12 OrgTemplates (`/org/templates`)

| Aspect | Detail |
|---|---|
| **Purpose** | Browse default/org/recent event templates. Search, filter, preview, use template to create event, save as template. |
| **Data Required** | MOCK_TEMPLATES (name, description, type, category, usedCount, createdAt, configuration, settings) |
| **API Endpoints** | `GET /org/templates?search=&category=`, `GET /org/templates/{id}`, `POST /org/templates`, `POST /org/events/from-template` |
| **Database Entities** | `event_templates`, `elections` |
| **Service Class** | `TemplateService` |
| **Permissions** | org_admin |
| **Filters** | Search (name/description), Category buttons (All/Default/Organization/Recent) |
| **Empty States** | "No Default Templates", "No Templates Found" (context-aware) |
| **Loading State** | Not implemented |
| **Error State** | Not implemented |
| **Note** | "Save as Template" is a stub. "Preview" and "Use Template" are placeholder navigations. |

### 5.5.13 OrgSetupWizard (`/org/setup`)

| Aspect | Detail |
|---|---|
| **Purpose** | 5-step first-run onboarding: Welcome, Organization (confirm), Branding (review), Workspace (name/timezone/language), Finish. Marks setup complete in localStorage. |
| **Data Required** | Org branding from `OrgBrandingContext` (name, shortName, colors, logo). Workspace name, timezone, language from form. |
| **API Endpoints** | `PUT /org/workspace` (update workspace config), `POST /org/setup/complete` |
| **Database Entities** | `organizations`, `workspace_settings` |
| **Service Class** | `WorkspaceService` |
| **Permissions** | org_owner (first-run only) |
| **Validation** | None — all fields can proceed empty |
| **Loading State** | Not implemented |
| **Empty State** | N/A |
| **Error State** | Not implemented |
| **Note** | Writes `orivis_setup_complete = "true"` to localStorage. Redirects to `/org/dashboard`. |

---

## 5.6 Platform Admin Screens

### 5.6.1 PlatformDashboard (`/platform`)

| Aspect | Detail |
|---|---|
| **Purpose** | Platform admin overview: stats (6 cards), health (uptime/response/nodes/requests), revenue chart, activity events, quick actions, notifications, date display. |
| **Data Required** | PLATFORM_STATS (6 metrics), health indicators, activity events, notifications, revenue chart data, quick actions |
| **API Endpoints** | `GET /platform/stats`, `GET /platform/health`, `GET /platform/activity`, `GET /platform/revenue`, `GET /platform/notifications` |
| **Database Entities** | Aggregate: `organizations`, `users`, `elections`, `subscriptions`, `notifications`, `revenue` |
| **Service Class** | `PlatformService` |
| **Permissions** | founder |
| **States** | Static dashboard — no loading/empty/error states implemented |

### 5.6.2 PlatformOrganizations (`/platform/organizations`)

| Aspect | Detail |
|---|---|
| **Purpose** | List/manage all platform organizations. Search, status filter, sort (name/date), table with org details, subscription, events count, status. |
| **Data Required** | Organizations list with name, slug, subscription plan, active events count, status, country, dates |
| **API Endpoints** | `GET /platform/organizations?search=&status=&sort=` |
| **Database Entities** | `organizations`, `subscriptions`, `elections` |
| **Service Class** | `PlatformService` |
| **Permissions** | founder |
| **Search** | Name, slug, country, plan (case-insensitive substring) |
| **Filters** | Tabs: All / Provisioning / Active / Suspended |
| **Sort** | Name (alpha) / Date (descending) |

### 5.6.3 OrganizationDetail (`/platform/organizations/:id`)

| Aspect | Detail |
|---|---|
| **Purpose** | Single org deep-dive with 10 tabs: Overview, Subscription, Health, Timeline, Events, Members, Billing, Support, Audit, Notes. Gov session inspection/entry support. |
| **Data Required** | Org info, subscription, health metrics, timeline activities, event counts, members, invoices, support tickets, audit logs, internal notes |
| **API Endpoints** | `GET /platform/organizations/{id}`, `GET /platform/organizations/{id}/subscription`, `GET /platform/organizations/{id}/health`, `GET /platform/organizations/{id}/activities`, `GET /platform/organizations/{id}/events`, `GET /platform/organizations/{id}/members`, `GET /platform/organizations/{id}/billing`, `GET /platform/organizations/{id}/support`, `GET /platform/organizations/{id}/audit`, `GET /platform/organizations/{id}/notes` |
| **Database Entities** | `organizations`, `subscriptions`, `memberships`, `elections`, `invoices`, `support_tickets`, `audit_logs`, `internal_notes` |
| **Service Class** | `PlatformService` |
| **Permissions** | founder |
| **States** | Pre-filtered by `id` URL param — no additional search/filter on page |

### 5.6.4 PlatformUsers (`/platform/users`)

| Aspect | Detail |
|---|---|
| **Purpose** | Platform-wide user list. Searchable, sortable table: name, email, role, organization, status, joined date. Drill-down to UserDetail. |
| **Data Required** | Users list with name, email, role, organization, status, joinDate |
| **API Endpoints** | `GET /platform/users?search=&sort=` |
| **Database Entities** | `users`, `memberships` |
| **Service Class** | `PlatformService` |
| **Permissions** | founder |
| **Search** | Name, email (case-insensitive substring) |
| **Sort** | User, Role, Organization, Status, Joined (all sortable columns) |

### 5.6.5 UserDetail, Memberships, PlatformElections, PlatformAudit, Analytics, Billing, PlatformNotifications, PlatformSettings, GovernanceSessions, PlatformMonitoring, PlatformSecurity, Roles, Staff, Subscriptions, Support

All platform admin pages follow the same pattern:

| Aspect | Detail |
|---|---|
| **Data Required** | Varies per page (see summary table in Section 5.6.19) |
| **API Endpoints** | RESTful CRUD + filtered list endpoints under `/platform/*` |
| **Database Entities** | Varies per page |
| **Service Class** | `PlatformService` (or dedicated per-module service) |
| **Permissions** | founder (all platform pages) |
| **Search/Filter** | Search input + tab/status filter + category filter + sortable columns |
| **States** | Most pages have empty states but lack loading/error states (sync mock data) |

### 5.6.6 Platform Page Summary Table

| Page | Route | Primary Data | Filters |
|---|---|---|---|
| PlatformDashboard | `/platform` | Stats, health, activity, revenue, notifications | None |
| Organizations | `/platform/organizations` | Org list with subscription/events/status | Search, status tab, sort |
| OrganizationDetail | `/platform/organizations/:id` | Full org profile (10 tabs) | None (by ID) |
| Users | `/platform/users` | User list with role/org/status | Search, sort |
| UserDetail | `/platform/users/:id` | Single user profile + activity | None |
| Memberships | `/platform/memberships` | Cross-org membership list | Search |
| PlatformElections | `/platform/elections` | Cross-org election oversight | Search, status tab |
| PlatformAudit | `/platform/audit` | Combined audit trail | Search, severity, category |
| Analytics | `/platform/analytics` | Platform-wide metrics/charts | None |
| Billing | `/platform/billing` | Platform revenue/invoices | None |
| PlatformNotifications | `/platform/notifications` | Admin notification inbox | Type tabs |
| PlatformSettings | `/platform/settings` | Global platform config | None (form) |
| GovernanceSessions | `/platform/governance-sessions` | Governance session management | Search, status, sort |
| PlatformMonitoring | `/platform/monitoring` | System health/incidents | None |
| PlatformSecurity | `/platform/security` | Security events monitoring | Search, severity, category |
| Roles | `/platform/roles` | Role/permission matrix editor | None |
| Staff | `/platform/staff` | Staff account management | Search, dept/status |
| Subscriptions | `/platform/subscriptions` | Subscription/plan management | Search, status tab |
| Support | `/platform/support` | Support ticket management + KB | Search, priority, category, status |

---

# 6. Complete Component Inventory

## 6.1 Shared UI Components (`src/components/`)

| Component | Type | Purpose | Backend Data Needed |
|---|---|---|---|
| `ActivityItem` | Widget | Single activity feed entry with icon + text + timestamp | Activity event: { icon, action, time, user } |
| `AdvancedTable` | Table | Generic sortable, paginated data table with selection | Column config + data rows |
| `AnimatedCounter` | Widget | Numeric animation 0→value | Numeric value |
| `BallotNavigation` | Nav | Voting progress: prev/next + progress bar | Current position index, total positions |
| `BallotPosition` | Form | Single position with candidate cards + abstain | Position: { title, description, candidates } |
| `DataToolbar` | Layout | Search + filter dropdowns + bulk actions toolbar | None (layout only) |
| `DragDropFileInput` | Form | File upload with drag-drop, preview, remove | File upload endpoint |
| `ErrorBoundary` | System | React error boundary with refresh fallback | None |
| `FaqSection` | Widget | Accordion FAQ | FAQ items: { question, answer } |
| `Footer` | Layout | Global footer with nav links, newsletter, social | None (static) |
| `GetStartedModal` | Modal | Onboarding modal (register/signin/vote) | None |
| `LoadingOverlay` | Modal | Full-screen loading with sequential status messages | Status message list |
| `NotificationItem` | Widget | Single notification with type icon + unread dot | Notification: { type, title, preview, time, read } |
| `OrivisLogo` | Widget | SVG logo at size variants | None |
| `PhoneInput` | Form | Phone number input with country code selector | Country dial codes |
| `ProtectedRoute` | Route Guard | Auth redirect guard | Auth state from context |
| `QuickActionCard` | Widget | Clickable dashboard action tile with icon | Quick action: { icon, label, description, route } |
| `ReceiptDisplay` | Widget | Post-vote receipt with print/download | VoteReceipt: { receiptId, timestamp, selections } |
| `RevenueChart` | Chart | Bar chart with period selector (Recharts) | Revenue time-series data |
| `SafeImage` | Image | Image with broken-link fallback | Image URL |
| `ScrollToTop` | Utility | Route-change scroll reset | None |
| `SearchableSelect` | Form | Filterable dropdown with keyboard nav | Options list |
| `SectionHeader` | Layout | Title + optional action link | None |
| `SeoHead` | System | Dynamic meta/OG/JSON-LD tags | Page meta config |
| `SignIn` | Form | Reusable sign-in form (platform/org variants) | Auth tokens |
| `StatCard` | Widget | Platform stat with animated counter + trend | Stat: { value, label, trend, icon } |
| `StatusBadge` | Widget | Status pill with color coding | Status string |
| `TextureBg` | Decoration | Background image overlay | None |
| `VoteConfirmation` | Modal | Confirm vote modal with irreversible warning | None |
| `VoteReview` | Widget | All selections summary before final submit | Selections map |
| `VoterRegistrationForm` | Form | 2-step voter pass lookup+issue | VoterRecord, pass ID |
| `VotingPassInput` | Form | 4×4 segmented code input with auto-advance | None |

## 6.2 Auth Components (`src/components/auth/`)

| Component | Type | Purpose |
|---|---|---|
| `AuthCard` + `AuthStateCard` + `AuthFormWrapper` | Layout/Widget | Auth page card wrapper + stateful message card + form wrapper |
| `AuthHeroIllustration` | Decoration | Animated SVG with platform/org variants |
| `AuthLayout` | Layout | Left form + right illustration auth page shell |
| `PasswordField` | Form | Password input with show/hide + strength meter (Weak/Fair/Good/Strong) |
| `VerificationInput` | Form | Code input with auto-advance, paste, backspace-nav |

## 6.3 Platform Components (`src/components/platform/`)

| Component | Type | Purpose |
|---|---|---|
| `Breadcrumbs` | Nav | Clickable "Platform > Current Page" breadcrumb |
| `ConfirmDialog` | Modal | Blur-overlay confirm with danger/primary variants |
| `EmptyState` | Widget | Animated placeholder with icon + title + optional CTA |
| `FilterDropdown` | Form | Label + select filter dropdown |
| `PageHeader` | Layout | Title + description + search + action buttons |
| `SearchInput` | Form | Debounced search with clear button (250ms) |
| `StatsGrid` | Widget | Responsive 2×2/4-column stat cards with trend |
| `StatusPill` | Widget | Configurable color status badge |
| `TabNav` | Nav | Animated tab bar with optional badge counts |

## 6.4 Org Components (`src/org/components/`)

| Component | Type | Purpose |
|---|---|---|
| `ActivityTimeline` | Widget | Vertical timeline grouped by Today/Yesterday/Earlier |
| `CandidateCard` | Widget | Candidate display with photo, name, role, actions (view/edit/remove/reorder) |
| `DashboardCard` | Layout | Glass-morphism card wrapper with hover effect |
| `EmptyState` | Widget | Placeholder with icon + title + description + CTA |
| `EventCard` | Widget | Detailed event card with status, progress, dates, counts, actions |
| `EventListRow` | Widget | Compact table-row event view |
| `EventStatusBadge` | Widget | Election-status pill (draft/ready/published/live/completed/cancelled/archived) |
| `EventTimeline` | Widget | Chronological event activity grouped by day |
| `NotificationCard` | Widget | Org notification with type icon + unread dot |
| `OrgProtectedRoute` | Route Guard | Org auth route guard |
| `ProgressBar` | Widget | Labeled progress bar with percentage |
| `SkeletonLoader` | Widget | Loading skeleton (card/list/text) |
| `StatCard` | Widget | Dashboard stat with icon, value, trend |
| `StatusBadge` | Widget | Generic status pill |
| `WidgetPanel` | Layout | Titled card container for dashboard widgets |

## 6.5 Organize Components (`src/components/Organize/`)

| Component | Type | Purpose |
|---|---|---|
| `StepIndicator` | Widget | Horizontal step progress with checkmarks |
| `StepOrgCategory` | Form | Org type/name/country/website form step |
| `StepVerification` | Form | Logo + cover upload + brand colors form step |

---

# 7. Service Layer Mapping

| Existing Service | File | Methods | Backend Needed |
|---|---|---|---|
| `authService` | `services/auth-service.ts` | login, register, logout (with refresh), refresh, me, forgotPassword, resetPassword, changePassword, verifyEmail, sendVerification | AuthenticationController |
| `electionService` | `services/election-service.ts` | getElections, getElection, getElectionsByStatus, getElectionsByOrg | ElectionController |
| `membershipService` | `services/membership-service.ts` | listMembers, inviteUser, acceptInvitation, revokeInvitation, changeRole, suspendMember, reactivateMember, restoreMember, removeMember, getUserOrganizations | MembershipController |
| `voterService` | `services/voter-service.ts` | lookupVoter, issuePass, validatePass, markPassUsed, castVote, getReceipt | VoterController, VoteController |
| Mock services | `services/__mocks__/` | auth-mock, dashboard-mock, election-mock, platform-mock | — |

## Services Required (New)

| Service | Responsibility |
|---|---|
| `OrganizationService` | Org CRUD, branding, workspace settings, org registration |
| `WorkspaceService` | Workspace config, onboarding wizard, branding, storage |
| `CandidateService` | Candidate CRUD per election, photo upload |
| `ParticipantService` | Participant CRUD, CSV import, validation, dedup |
| `ResultService` | Result calculation, per-position breakdown, export |
| `NotificationService` | In-app notifications, preference management |
| `AuditService` | Audit log query, export |
| `SupportService` | Contact form, knowledge base, FAQs, release notes, support tickets |
| `ReportService` | Report generation, download, delete |
| `ArchiveService` | Archive record list, restore, permanent delete |
| `TemplateService` | Template CRUD, event-from-template, save-as-template |
| `BillingService` | Subscription, billing plans, payment methods, invoices (future) |
| `PlatformService` | Platform aggregate stats, cross-org queries |
| `RoleService` | Role CRUD, permission matrix |
| `DashboardService` | Org dashboard aggregate data |
| `StorageService` | File upload, metadata, preview |

---

# 8. Database Entity Mapping

| Entity | Module | Key Relationships |
|---|---|---|
| `users` | Auth | hasMany memberships, hasMany votes |
| `organizations` | Org | hasMany users (via memberships), hasMany elections, hasOne workspace_settings |
| `memberships` | Org/Team | belongsTo user, belongsTo organization, belongsTo role |
| `invitations` | Team | belongsTo organization, morphs to user on accept |
| `roles` | Auth | hasMany permissions (pivot), hasMany memberships |
| `permissions` | Auth | belongsToMany roles |
| `workspace_settings` | Org | belongsTo organization (branding, config) |
| `elections` | Election | belongsTo organization, hasMany positions, hasMany candidates, hasMany participants, hasMany votes |
| `election_positions` | Election | belongsTo election, hasMany candidates |
| `candidates` | Election | belongsTo election, belongsTo position |
| `participants` | Election | belongsTo election, belongsTo organization |
| `voting_passes` | Voting | belongsTo participant, belongsTo election |
| `votes` | Voting | belongsTo participant, belongsTo election, belongsTo candidate |
| `vote_receipts` | Voting | belongsTo vote, belongsTo election |
| `audit_logs` | Audit | morphTo target, belongsTo organization |
| `notifications` | Notification | belongsTo user, belongsTo organization |
| `subscriptions` | Billing | belongsTo organization, belongsTo plan |
| `subscription_plans` | Billing | hasMany subscriptions |
| `invoices` | Billing | belongsTo organization, belongsTo subscription |
| `payment_methods` | Billing | belongsTo organization |
| `file_uploads` | Storage | morphTo target (candidate, org logo, CSV) |
| `csv_imports` | Participant | belongsTo election, hasMany import_errors |
| `import_errors` | Participant | belongsTo csv_import |
| `reports` | Reports | belongsTo organization, belongsTo election (optional) |
| `event_templates` | Templates | belongsTo organization (nullable) |
| `archive_records` | Archive | belongsTo election |
| `support_tickets` | Support | belongsTo organization (nullable) |
| `help_articles` | Help | static content |
| `faqs` | Help | static content |
| `release_notes` | Help | static content |
| `internal_notes` | Platform | belongsTo organization |
| `governance_sessions` | Platform | belongsTo organization |
| `security_events` | Platform | belongsTo organization (nullable) |
| `platform_settings` | Platform | singleton |

---

# 9. Documentation Mismatches

The following items are referenced in docs/SEO config but do not exist in the frontend codebase:

| Item | Documented As | Actual State |
|---|---|---|
| `/workspace/*` routes (5+ entries) | SEO config has `/workspace/elections`, `/workspace/team`, `/workspace/audit`, etc. | These routes do not exist. Actual routes are `/org/events`, `/org/team`, `/org/audit-logs`. |
| `/workspace/settings/*` sub-routes (5 entries) | SEO config has `/workspace/settings/branding`, `/workspace/settings/workspace`, etc. | These routes do not exist. All workspace settings are on a single page `/org/workspace` with tabs. |
| `/org/elections` | SEO config and `routes.ts` ORG.ELECTIONS constant | Route does not exist (migrated to `/org/events`). Constant kept as deprecated. |
| `/workspace/dashboard` | SEO config | Route does not exist. Dashboard is at `/org/dashboard`. |
| `/workspace/invitations` | SEO config | Route does not exist. Invitation acceptance is at `/org/invitation`. |
| `ElectionDetail` page | Implied by documentation | Does not exist as separate page. Election management is part of `EventDetail` (13 tabs) at `/org/events/:id`. |
| Campaign module | `types/campaign.ts` exists on disk | Zero imports across the codebase — dead code. |
| Organize types | `types/organize.ts` exists on disk | Zero imports across the codebase — dead code. |

---

# 10. Frontend State Pattern Summary

| State Pattern | Count | Pages Implementing |
|---|---|---|
| **Loading state** | 11 | Dashboard (skeleton), SignIn (LoadingOverlay), SignUp, OrgRegistration, ForgotPassword, ResetPassword, EmailVerification, AccountActivation, InvitationAccept, CreateEvent (submit overlay), ElectionLanding, VoterRegistration, VoteAuth, VotingBooth, VoteSuccess, ReceiptPage, ElectionResults |
| **Empty state** | ~30+ | Dashboard (per-widget), Events, EventDetail (per-tab), Team (per-tab), Billing, AuditLogs, Help (per-tab), Reports, ArchiveCentre, Templates, and most platform pages |
| **Error state** | ~15 | Dashboard (full-page + retry), SignIn (error banner), SignUp, ResetPassword, EmailVerification, AccountActivation, InvitationAccept, VoteAuth, ReceiptPage, EventDetail (not-found), ElectionLanding, VotingBooth, ElectionResults |
| **No states implemented** | ~15 | Events, CreateEvent (error), EventDetail (loading), Team (loading), Billing (loading), WorkspaceSettings, AuditLogs, Help, Reports, Templates, SetupWizard, and several platform pages (loading/error) |

---

# 11. Complete Validation Rule Inventory

| Input | Rules | Found In |
|---|---|---|
| Email | required, regex: `/^[^\s@]+@[^\s@]+\.[^\s@]+$/` | SignIn, SignUp, ForgotPassword, OrgRegistration, InvitationAccept |
| Password | required, min 8 chars | SignUp, ResetPassword, OrgRegistration, InvitationAccept |
| Confirm Password | must match password | SignUp, ResetPassword, OrgRegistration, InvitationAccept |
| Full Name | required | SignUp, InvitationAccept |
| Org Name | required | Organize, OrgRegistration |
| Short Name | required, max 15 chars | OrgRegistration |
| Category | required (non-empty) | OrgRegistration |
| Phone | required | OrgRegistration |
| Country | required (non-empty) | Organize, OrgRegistration |
| Website | optional | OrgRegistration |
| Accepted Terms | must be true | SignUp, OrgRegistration |
| Logo file | max 2MB, jpg/jpeg/png/svg/webp | OrgRegistration |
| Voting Pass | exactly 16 chars, alphanumeric uppercase | VoteAuth |
| Event Type | must be selected | CreateEvent |
| Event Title | required (non-empty) | CreateEvent |
| Event Start/End Dates | required | CreateEvent |
| Registration Dates | required | CreateEvent |
| Token (URL) | must exist | ResetPassword, AccountActivation, InvitationAccept |
| Email (verification flow) | presence from URL | EmailVerification |
| Org ID (voter lookup) | non-empty | VoterRegistrationForm |

---

# 12. API Dependency Matrix (Summary)

```
Frontend Page → API Endpoint(s) → Service Class → Primary Table(s) → Permission
```

| Page | Key Endpoints | Service | Tables | Permission |
|---|---|---|---|---|
| SignInPage | POST /auth/login | AuthService | users, sessions | guest |
| SignUpPage | POST /auth/register | AuthService | users | guest |
| OrgRegistrationPage | POST /auth/register, POST /organizations | AuthService + OrgService | users, orgs, memberships, workspace_settings | guest |
| ForgotPasswordPage | POST /auth/forgot-password | AuthService | users, password_reset_tokens | guest |
| ResetPasswordPage | POST /auth/reset-password | AuthService | users, password_reset_tokens | guest |
| VerifyEmail | POST /auth/verify-email | AuthService | users | guest |
| InvitationAccept | POST /memberships/accept | MembershipService | memberships, invitations, users | guest |
| OrgDashboard | GET /org/dashboard/* (6+ endpoints) | DashboardService + ElectionService + etc. | orgs, elections, memberships, notifications, audit_logs, subscriptions | org_member |
| OrgEvents | GET /org/events | ElectionService | elections | org_admin |
| CreateEvent | POST /org/events | ElectionService | elections, election_positions | org_admin |
| EventDetail | GET+PUT /org/events/{id}/* (13+ endpoints) | ElectionService + CandidateService + ParticipantService + etc. | elections, positions, candidates, participants, votes, audit_logs | org_admin |
| OrgTeam | GET+POST+PUT+DELETE /org/team/* | MembershipService + RoleService | memberships, invitations, roles, role_permissions | org_admin |
| OrgBilling | GET /org/billing/* | BillingService | subscriptions, plans, invoices, payment_methods | org_owner |
| WorkspaceSettings | PUT /org/workspace/* | WorkspaceService | orgs, workspace_settings | org_admin |
| AuditLogs | GET /org/audit-logs | AuditService | audit_logs | org_admin |
| Help | GET /help/*, POST /support/contact | SupportService | help_articles, faqs, release_notes, support_tickets | org_member |
| Reports | GET+POST+DELETE /org/reports/* | ReportService | reports | org_admin |
| ArchiveCentre | GET+POST+DELETE /org/archive/* | ArchiveService | elections, archive_records | org_admin |
| Templates | GET+POST /org/templates/* | TemplateService | event_templates | org_admin |
| SetupWizard | PUT /org/workspace | WorkspaceService | orgs, workspace_settings | org_owner |
| ElectionLanding | GET /elections/{id} | ElectionService | elections | public |
| VoterRegistration | GET /voters/lookup, POST /voters/{id}/issue-pass | VoterService | participants, voting_passes | public |
| VoteAuth | POST /voting-passes/validate | VoterService | voting_passes | public |
| VotingBooth | GET /elections/{id}, POST /elections/{id}/ballots | ElectionService + VoterService | elections, candidates, votes, vote_receipts | public (pass-holder) |
| VoteSuccess | GET /vote-receipts/{passId} | VoterService | vote_receipts | public (pass-holder) |
| ReceiptPage | GET /vote-receipts/{passId} | VoterService | vote_receipts, elections | public |
| ElectionResults | GET /elections/{id}/results | ElectionService + ResultService | elections, votes, results | public |
| PlatformDashboard | GET /platform/stats | PlatformService | orgs, users, elections, subscriptions | founder |
| PlatformOrganizations | GET /platform/organizations | PlatformService | organizations | founder |
| PlatformUsers | GET /platform/users | PlatformService | users, memberships | founder |
| PlatformElections | GET /platform/elections | PlatformService | elections | founder |
| PlatformAudit | GET /platform/audit | PlatformService | audit_logs, governance_sessions | founder |
| PlatformSettings | PUT /platform/settings | PlatformService | platform_settings | founder |
| Roles | GET+POST+PUT+DELETE /platform/roles | PlatformService | roles, role_permissions | founder |
| Staff | GET+POST /platform/staff | PlatformService | staff_members | founder |
| Subscriptions | GET /platform/subscriptions | PlatformService | subscriptions, plans | founder |
| Support | GET+POST /platform/support | PlatformService | support_tickets, kb_articles | founder |

---

# 13. Frontend Codebase Totals

| Category | Count |
|---|---|
| Total routes | 78 |
| Total pages | 67 |
| Total layouts | 4 |
| Total shared components | 59 |
| Total services | 4 (existing) + 15 (needed) |
| Total contexts/providers | 5 |
| Total type files | 17 |
| Total mock data files | 5 |
| Total API endpoint constants | ~70 |
| Dead type files (no imports) | 2 (campaign.ts, organize.ts) |
| Pages missing loading states | ~15 |
| Pages missing error states | ~15 |
| Forms with no validation | ~5 (Team modals, Help form, SetupWizard, WorkspaceSettings) |
| Documentation mismatches | 10 |

---

# 14. Definition of Done

The frontend-backend integration is complete when:

- Every route in App.tsx receives valid data from a real API endpoint.
- Every service method in `services/` resolves to a working backend endpoint.
- Every TypeScript type matches the backend response structure.
- Mock data files can be replaced by live API responses without restructuring UI code.
- All empty/loading/error states receive appropriate data from the backend.
- All forms with missing validation receive server-side validation + proper error responses.
- All documentation mismatches in Section 9 are resolved.
- Dead code files (campaign.ts, organize.ts) are removed.
- The platform admin pages receive real aggregated data from backend endpoints.

---

# 15. Conclusion

This document reflects the actual frontend codebase as of July 2026 based on a complete source code analysis.

The React frontend is feature-complete for the Presentation MVP scope with 67 pages and 59 reusable components.

The Laravel backend must implement approximately 60+ unique API endpoints across 15+ service classes and 30+ database entities as mapped above.

Every backend endpoint must be validated against this mapping before implementation.

No frontend page should be redesigned without explicit instruction.

No documentation mismatch should be silently resolved by inventing frontend pages that do not exist.

---

End of document.
