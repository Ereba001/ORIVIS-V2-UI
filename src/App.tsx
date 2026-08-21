import { Routes, Route, Outlet, Navigate } from "react-router-dom";
import { lazy, Suspense } from "react";
import PublicLayout from "./layouts/PublicLayout";
import ElectionPublicLayout from "./layouts/ElectionPublicLayout";
import PlatformLayout from "./layouts/PlatformLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import ScrollToTop from "./components/ScrollToTop";
import ErrorBoundary from "./components/ErrorBoundary";
import LoadingOverlay from "./components/LoadingOverlay";
import { PlatformGovernanceProvider } from "./contexts/PlatformGovernanceContext";
import { PlatformPermissionsProvider } from "./contexts/PlatformPermissionsContext";
import RequirePlatformPermission from "./components/platform/RequirePlatformPermission";
import { PLATFORM_PERMISSIONS } from "./constants/platformPermissions";
import {
  OrgBrandingProvider,
  OrgPermissionsProvider,
  OrgLayout,
  OrgProtectedRoute,
  OrgSignIn,
} from "./org";

const Home = lazy(() => import("./pages/Home"));
const About = lazy(() => import("./pages/About"));
const Contact = lazy(() => import("./pages/Contact"));
const Governance = lazy(() => import("./pages/Governance"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Terms = lazy(() => import("./pages/Terms"));
const Results = lazy(() => import("./pages/Results"));
const SignInPage = lazy(() => import("./pages/SignInPage"));
const ForgotPasswordPage = lazy(() => import("./pages/ForgotPasswordPage"));
const ResetPasswordPage = lazy(() => import("./pages/ResetPasswordPage"));
const EmailVerificationPage = lazy(() => import("./pages/EmailVerificationPage"));
const AccountActivationPage = lazy(() => import("./pages/AccountActivationPage"));
const SessionExpiredPage = lazy(() => import("./pages/SessionExpiredPage"));
const UnauthorizedPage = lazy(() => import("./pages/UnauthorizedPage"));
const NotFound = lazy(() => import("./pages/NotFound"));
const OrgRegistrationPage = lazy(() => import("./pages/OrgRegistrationPage"));
const OrgForgotPasswordPage = lazy(() => import("./pages/OrgForgotPasswordPage"));
const OrgResetPasswordPage = lazy(() => import("./pages/OrgResetPasswordPage"));
const InvitationAcceptPage = lazy(() => import("./pages/InvitationAcceptPage"));
const TwoFactorAuthPage = lazy(() => import("./pages/TwoFactorAuthPage"));
const SecurityVerificationPage = lazy(() => import("./pages/SecurityVerificationPage"));
const BackupCodePage = lazy(() => import("./pages/BackupCodePage"));
const Organize = lazy(() => import("./pages/Organize"));

const ElectionLanding = lazy(() => import("./pages/elections/ElectionLanding"));
const VoterRegistration = lazy(() => import("./pages/elections/VoterRegistration"));
const VoteAuth = lazy(() => import("./pages/elections/VoteAuth"));
const VotingBooth = lazy(() => import("./pages/elections/VotingBooth"));
const VoteSuccess = lazy(() => import("./pages/elections/VoteSuccess"));
const ElectionResults = lazy(() => import("./pages/elections/ElectionResults"));
const ElectionClosed = lazy(() => import("./pages/elections/ElectionClosed"));
const VoterConsole = lazy(() => import("./pages/elections/VoterConsole"));
const ReceiptPage = lazy(() => import("./pages/receipt/ReceiptPage"));
const ReceiptLookupPage = lazy(() => import("./pages/receipt/ReceiptLookupPage"));

const PlatformDashboard = lazy(() => import("./pages/platform/Dashboard"));
const PlatformOrganizations = lazy(() => import("./pages/platform/Organizations"));
const PlatformOrganizationDetail = lazy(() => import("./pages/platform/OrganizationDetail"));
const PlatformWorkspaceView = lazy(() => import("./pages/platform/WorkspaceView"));
const PlatformUserDetail = lazy(() => import("./pages/platform/UserDetail"));
const PlatformElections = lazy(() => import("./pages/platform/PlatformElections"));
const PlatformAudit = lazy(() => import("./pages/platform/PlatformAudit"));
const FounderAuditConsole = lazy(() => import("./pages/platform/FounderAuditConsole"));
const PlatformAnalytics = lazy(() => import("./pages/platform/Analytics"));
const PlatformBilling = lazy(() => import("./pages/platform/Billing"));
const PlatformFreeEventFlags = lazy(() => import("./pages/platform/FreeEventFlags"));
const PlatformFinance = lazy(() => import("./pages/platform/Finance"));
const PlatformPricingTiers = lazy(() => import("./pages/platform/PricingTiers"));
const PlatformNotifications = lazy(() => import("./pages/platform/PlatformNotifications"));
const PlatformSettings = lazy(() => import("./pages/platform/PlatformSettings"));
const PlatformMonitoring = lazy(() => import("./pages/platform/PlatformMonitoring"));
const PlatformSecurity = lazy(() => import("./pages/platform/PlatformSecurity"));
const PlatformRoles = lazy(() => import("./pages/platform/Roles"));
const PlatformStaff = lazy(() => import("./pages/platform/Staff"));
const PlatformSubscriptions = lazy(() => import("./pages/platform/Subscriptions"));
const PlatformSupport = lazy(() => import("./pages/platform/Support"));
const PlatformAcceptInvitation = lazy(() => import("./pages/platform/AcceptInvitationPage"));

const OrgDashboard = lazy(() => import("./org/pages/Dashboard"));
const OrgEvents = lazy(() => import("./org/pages/Events"));
const OrgCreateEvent = lazy(() => import("./org/pages/CreateEvent"));
const OrgEventDetail = lazy(() => import("./org/pages/EventDetail"));
const OrgEditEvent = lazy(() => import("./org/pages/EditEvent"));
const OrgTeam = lazy(() => import("./org/pages/Team"));
const OrgBilling = lazy(() => import("./org/pages/Billing"));
const OrgWorkspaceSettings = lazy(() => import("./org/pages/WorkspaceSettings"));
const OrgAuditLogs = lazy(() => import("./org/pages/AuditLogs"));
const OrgNotifications = lazy(() => import("./org/pages/Notifications"));
const OrgHelp = lazy(() => import("./org/pages/Help"));
const OrgReports = lazy(() => import("./org/pages/Reports"));
const OrgArchiveCentre = lazy(() => import("./org/pages/ArchiveCentre"));
const OrgTemplates = lazy(() => import("./org/pages/Templates"));
const OrgSetupWizard = lazy(() => import("./org/pages/SetupWizard"));
const OrgRoles = lazy(() => import("./org/pages/Roles"));
const OrgLiveResults = lazy(() => import("./org/pages/LiveResults"));
const OrgAssistedElectionCentre = lazy(() => import("./org/pages/AssistedElectionCentre"));

function SuspenseWrapper({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<LoadingOverlay messages={["Loading page..."]} />}>
      {children}
    </Suspense>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ScrollToTop />
      <PlatformGovernanceProvider>
        <Routes>
          <Route element={<PublicLayout />}>
            <Route path="/" element={<SuspenseWrapper><Home /></SuspenseWrapper>} />
            <Route path="/about" element={<SuspenseWrapper><About /></SuspenseWrapper>} />
            <Route path="/contact" element={<SuspenseWrapper><Contact /></SuspenseWrapper>} />
            <Route path="/governance" element={<SuspenseWrapper><Governance /></SuspenseWrapper>} />
            <Route path="/privacy" element={<SuspenseWrapper><Privacy /></SuspenseWrapper>} />
            <Route path="/terms" element={<SuspenseWrapper><Terms /></SuspenseWrapper>} />
            <Route path="/results" element={<SuspenseWrapper><Results /></SuspenseWrapper>} />
            <Route path="/organize" element={<SuspenseWrapper><Organize /></SuspenseWrapper>} />

            <Route path="/elections" element={<SuspenseWrapper><Governance /></SuspenseWrapper>} />
            <Route path="/receipt/:passId" element={<SuspenseWrapper><ReceiptPage /></SuspenseWrapper>} />
            <Route path="/verify-receipt" element={<SuspenseWrapper><ReceiptLookupPage /></SuspenseWrapper>} />
          </Route>

          <Route element={<ElectionPublicLayout />}>
            <Route path="/elections/:id" element={<SuspenseWrapper><ElectionLanding /></SuspenseWrapper>} />
            <Route path="/elections/:id/register" element={<SuspenseWrapper><VoterRegistration /></SuspenseWrapper>} />
            <Route path="/elections/:id/auth" element={<SuspenseWrapper><VoteAuth /></SuspenseWrapper>} />
            <Route path="/elections/:id/vote" element={<SuspenseWrapper><VotingBooth /></SuspenseWrapper>} />
            <Route path="/elections/:id/success" element={<SuspenseWrapper><VoteSuccess /></SuspenseWrapper>} />
            <Route path="/elections/:id/results" element={<SuspenseWrapper><ElectionResults /></SuspenseWrapper>} />
            <Route path="/elections/:id/closed" element={<SuspenseWrapper><ElectionClosed /></SuspenseWrapper>} />
            <Route path="/elections/:id/console" element={<SuspenseWrapper><VoterConsole /></SuspenseWrapper>} />
          </Route>

          <Route path="/platformsignin" element={<SuspenseWrapper><SignInPage /></SuspenseWrapper>} />
          <Route path="/signin" element={<Navigate to="/platformsignin" replace />} />
          <Route path="/signup" element={<Navigate to="/platformsignin" replace />} />
          <Route path="/forgot-password" element={<SuspenseWrapper><ForgotPasswordPage /></SuspenseWrapper>} />
          <Route path="/reset-password" element={<SuspenseWrapper><ResetPasswordPage /></SuspenseWrapper>} />
          <Route path="/verify-email" element={<SuspenseWrapper><EmailVerificationPage /></SuspenseWrapper>} />
          <Route path="/activate-account" element={<SuspenseWrapper><AccountActivationPage /></SuspenseWrapper>} />
          <Route path="/session-expired" element={<SuspenseWrapper><SessionExpiredPage /></SuspenseWrapper>} />
          <Route path="/unauthorized" element={<SuspenseWrapper><UnauthorizedPage /></SuspenseWrapper>} />

          <Route path="/org/register" element={<SuspenseWrapper><OrgRegistrationPage /></SuspenseWrapper>} />
          <Route path="/org/forgot-password" element={<SuspenseWrapper><OrgForgotPasswordPage /></SuspenseWrapper>} />
          <Route path="/org/reset-password" element={<SuspenseWrapper><OrgResetPasswordPage /></SuspenseWrapper>} />
          <Route path="/org/invitation" element={<SuspenseWrapper><InvitationAcceptPage /></SuspenseWrapper>} />
          <Route path="/platform/accept-invitation" element={<SuspenseWrapper><PlatformAcceptInvitation /></SuspenseWrapper>} />

          <Route path="/platform/2fa" element={<SuspenseWrapper><TwoFactorAuthPage /></SuspenseWrapper>} />
          <Route path="/platform/verify" element={<SuspenseWrapper><SecurityVerificationPage /></SuspenseWrapper>} />
          <Route path="/platform/backup-code" element={<SuspenseWrapper><BackupCodePage /></SuspenseWrapper>} />

          <Route element={<ProtectedRoute />}>
            <Route element={<PlatformPermissionsProvider><PlatformLayout /></PlatformPermissionsProvider>}>
              <Route path="/platform" element={<RequirePlatformPermission permission={PLATFORM_PERMISSIONS.VIEW_DASHBOARD}><SuspenseWrapper><PlatformDashboard /></SuspenseWrapper></RequirePlatformPermission>} />
              <Route path="/platform/organizations" element={<RequirePlatformPermission permission={PLATFORM_PERMISSIONS.VIEW_ORGANIZATIONS}><SuspenseWrapper><PlatformOrganizations /></SuspenseWrapper></RequirePlatformPermission>} />
              <Route path="/platform/organizations/:id" element={<RequirePlatformPermission permission={PLATFORM_PERMISSIONS.VIEW_ORGANIZATIONS}><SuspenseWrapper><PlatformOrganizationDetail /></SuspenseWrapper></RequirePlatformPermission>} />
              <Route path="/platform/organizations/:id/workspace" element={<RequirePlatformPermission permission={PLATFORM_PERMISSIONS.VIEW_WORKSPACE_SESSIONS}><SuspenseWrapper><PlatformWorkspaceView /></SuspenseWrapper></RequirePlatformPermission>} />
              <Route path="/platform/users/:id" element={<RequirePlatformPermission permission={PLATFORM_PERMISSIONS.VIEW_USERS}><SuspenseWrapper><PlatformUserDetail /></SuspenseWrapper></RequirePlatformPermission>} />
              <Route path="/platform/elections" element={<RequirePlatformPermission permission={PLATFORM_PERMISSIONS.VIEW_REPORTS}><SuspenseWrapper><PlatformElections /></SuspenseWrapper></RequirePlatformPermission>} />
              <Route path="/platform/audit" element={<RequirePlatformPermission permission={PLATFORM_PERMISSIONS.VIEW_AUDIT}><SuspenseWrapper><PlatformAudit /></SuspenseWrapper></RequirePlatformPermission>} />
              <Route path="/platform/founder-audit" element={<RequirePlatformPermission permission={PLATFORM_PERMISSIONS.VIEW_WORKSPACE_SESSIONS}><SuspenseWrapper><FounderAuditConsole /></SuspenseWrapper></RequirePlatformPermission>} />
              <Route path="/platform/analytics" element={<RequirePlatformPermission permission={PLATFORM_PERMISSIONS.VIEW_REPORTS}><SuspenseWrapper><PlatformAnalytics /></SuspenseWrapper></RequirePlatformPermission>} />
              <Route path="/platform/billing" element={<RequirePlatformPermission permission={PLATFORM_PERMISSIONS.VIEW_FINANCE}><SuspenseWrapper><PlatformBilling /></SuspenseWrapper></RequirePlatformPermission>} />
              <Route path="/platform/free-event-flags" element={<RequirePlatformPermission permission={PLATFORM_PERMISSIONS.VIEW_FINANCE}><SuspenseWrapper><PlatformFreeEventFlags /></SuspenseWrapper></RequirePlatformPermission>} />
              <Route path="/platform/finance" element={<RequirePlatformPermission permission={PLATFORM_PERMISSIONS.VIEW_FINANCE}><SuspenseWrapper><PlatformFinance /></SuspenseWrapper></RequirePlatformPermission>} />
              <Route path="/platform/pricing-tiers" element={<RequirePlatformPermission permission={PLATFORM_PERMISSIONS.VIEW_FINANCE}><SuspenseWrapper><PlatformPricingTiers /></SuspenseWrapper></RequirePlatformPermission>} />
              <Route path="/platform/notifications" element={<RequirePlatformPermission permission={PLATFORM_PERMISSIONS.MANAGE_NOTIFICATIONS}><SuspenseWrapper><PlatformNotifications /></SuspenseWrapper></RequirePlatformPermission>} />
              <Route path="/platform/monitoring" element={<RequirePlatformPermission permission={PLATFORM_PERMISSIONS.VIEW_DASHBOARD}><SuspenseWrapper><PlatformMonitoring /></SuspenseWrapper></RequirePlatformPermission>} />
              <Route path="/platform/security" element={<RequirePlatformPermission permission={PLATFORM_PERMISSIONS.VIEW_AUDIT}><SuspenseWrapper><PlatformSecurity /></SuspenseWrapper></RequirePlatformPermission>} />
              <Route path="/platform/roles" element={<RequirePlatformPermission permission={PLATFORM_PERMISSIONS.MANAGE_ROLES}><SuspenseWrapper><PlatformRoles /></SuspenseWrapper></RequirePlatformPermission>} />
              <Route path="/platform/staff" element={<RequirePlatformPermission permission={PLATFORM_PERMISSIONS.VIEW_USERS}><SuspenseWrapper><PlatformStaff /></SuspenseWrapper></RequirePlatformPermission>} />
              <Route path="/platform/subscriptions" element={<RequirePlatformPermission permission={PLATFORM_PERMISSIONS.VIEW_SUBSCRIPTIONS}><SuspenseWrapper><PlatformSubscriptions /></SuspenseWrapper></RequirePlatformPermission>} />
              <Route path="/platform/support" element={<RequirePlatformPermission permission={PLATFORM_PERMISSIONS.MANAGE_SUPPORT}><SuspenseWrapper><PlatformSupport /></SuspenseWrapper></RequirePlatformPermission>} />
              <Route path="/platform/settings" element={<RequirePlatformPermission permission={PLATFORM_PERMISSIONS.MANAGE_ORGANIZATIONS}><SuspenseWrapper><PlatformSettings /></SuspenseWrapper></RequirePlatformPermission>} />
            </Route>
          </Route>

          <Route element={<OrgBrandingProvider><OrgPermissionsProvider><SuspenseWrapper><Outlet /></SuspenseWrapper></OrgPermissionsProvider></OrgBrandingProvider>}>
            <Route path="/org/signin" element={<OrgSignIn />} />
            <Route path="/org" element={<Navigate to="/org/signin" replace />} />
            <Route element={<OrgProtectedRoute />}>
              <Route element={<OrgLayout />}>
                <Route path="/org/dashboard" element={<SuspenseWrapper><OrgDashboard /></SuspenseWrapper>} />
                <Route path="/org/events" element={<SuspenseWrapper><OrgEvents /></SuspenseWrapper>} />
                <Route path="/org/events/create" element={<SuspenseWrapper><OrgCreateEvent /></SuspenseWrapper>} />
                <Route path="/org/events/:id" element={<SuspenseWrapper><OrgEventDetail /></SuspenseWrapper>} />
                <Route path="/org/events/:id/edit" element={<SuspenseWrapper><OrgEditEvent /></SuspenseWrapper>} />
                <Route path="/org/events/:id/results" element={<SuspenseWrapper><OrgLiveResults /></SuspenseWrapper>} />
                <Route path="/org/assisted-election-centre" element={<SuspenseWrapper><OrgAssistedElectionCentre /></SuspenseWrapper>} />
                <Route path="/org/roles" element={<SuspenseWrapper><OrgRoles /></SuspenseWrapper>} />
                <Route path="/org/setup" element={<SuspenseWrapper><OrgSetupWizard /></SuspenseWrapper>} />
                <Route path="/org/team" element={<SuspenseWrapper><OrgTeam /></SuspenseWrapper>} />
                <Route path="/org/billing" element={<SuspenseWrapper><OrgBilling /></SuspenseWrapper>} />
                <Route path="/org/workspace" element={<SuspenseWrapper><OrgWorkspaceSettings /></SuspenseWrapper>} />
                <Route path="/org/audit-logs" element={<SuspenseWrapper><OrgAuditLogs /></SuspenseWrapper>} />
                <Route path="/org/notifications" element={<SuspenseWrapper><OrgNotifications /></SuspenseWrapper>} />
                 <Route path="/org/help" element={<SuspenseWrapper><OrgHelp /></SuspenseWrapper>} />
                 <Route path="/org/reports" element={<SuspenseWrapper><OrgReports /></SuspenseWrapper>} />
                 <Route path="/org/archive" element={<SuspenseWrapper><OrgArchiveCentre /></SuspenseWrapper>} />
                 <Route path="/org/templates" element={<SuspenseWrapper><OrgTemplates /></SuspenseWrapper>} />
              </Route>
            </Route>
          </Route>

          <Route path="*" element={<SuspenseWrapper><NotFound /></SuspenseWrapper>} />
        </Routes>
      </PlatformGovernanceProvider>
    </ErrorBoundary>
  );
}