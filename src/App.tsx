import { Routes, Route, Outlet, Navigate } from "react-router-dom";
import { lazy, Suspense } from "react";
import PublicLayout from "./layouts/PublicLayout";
import PlatformLayout from "./layouts/PlatformLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import ScrollToTop from "./components/ScrollToTop";
import ErrorBoundary from "./components/ErrorBoundary";
import LoadingOverlay from "./components/LoadingOverlay";
import { PlatformGovernanceProvider } from "./contexts/PlatformGovernanceContext";
import {
  OrgBrandingProvider,
  OrgLayout,
  OrgProtectedRoute,
  OrgSignIn,
  OrgDashboard,
  OrgEvents,
  OrgCreateEvent,
  OrgEventDetail,
  OrgTeam,
  OrgBilling,
  OrgWorkspaceSettings,
  OrgAuditLogs,
  OrgHelp,
  OrgReports,
  OrgArchiveCentre,
  OrgTemplates,
  OrgSetupWizard,
} from "./org";

const Home = lazy(() => import("./pages/Home"));
const About = lazy(() => import("./pages/About"));
const Contact = lazy(() => import("./pages/Contact"));
const Governance = lazy(() => import("./pages/Governance"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Terms = lazy(() => import("./pages/Terms"));
const Results = lazy(() => import("./pages/Results"));
const SignInPage = lazy(() => import("./pages/SignInPage"));
const OrgSignInPage = lazy(() => import("./pages/OrgSignInPage"));
const SignUpPage = lazy(() => import("./pages/SignUpPage"));
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
const Payment = lazy(() => import("./pages/Payment"));
const ApplicationSubmitted = lazy(() => import("./pages/ApplicationSubmitted"));

const ElectionLanding = lazy(() => import("./pages/elections/ElectionLanding"));
const VoterRegistration = lazy(() => import("./pages/elections/VoterRegistration"));
const VoteAuth = lazy(() => import("./pages/elections/VoteAuth"));
const VotingBooth = lazy(() => import("./pages/elections/VotingBooth"));
const VoteSuccess = lazy(() => import("./pages/elections/VoteSuccess"));
const ElectionResults = lazy(() => import("./pages/elections/ElectionResults"));
const ElectionClosed = lazy(() => import("./pages/elections/ElectionClosed"));
const ReceiptPage = lazy(() => import("./pages/receipt/ReceiptPage"));

const PlatformDashboard = lazy(() => import("./pages/platform/Dashboard"));
const PlatformOrganizations = lazy(() => import("./pages/platform/Organizations"));
const PlatformOrganizationDetail = lazy(() => import("./pages/platform/OrganizationDetail"));
const PlatformUsers = lazy(() => import("./pages/platform/Users"));
const PlatformUserDetail = lazy(() => import("./pages/platform/UserDetail"));
const PlatformMemberships = lazy(() => import("./pages/platform/Memberships"));
const PlatformElections = lazy(() => import("./pages/platform/PlatformElections"));
const PlatformAudit = lazy(() => import("./pages/platform/PlatformAudit"));
const PlatformAnalytics = lazy(() => import("./pages/platform/Analytics"));
const PlatformBilling = lazy(() => import("./pages/platform/Billing"));
const PlatformNotifications = lazy(() => import("./pages/platform/PlatformNotifications"));
const PlatformSettings = lazy(() => import("./pages/platform/PlatformSettings"));
const GovernanceSessions = lazy(() => import("./pages/platform/GovernanceSessions"));
const PlatformMonitoring = lazy(() => import("./pages/platform/PlatformMonitoring"));
const PlatformSecurity = lazy(() => import("./pages/platform/PlatformSecurity"));
const PlatformRoles = lazy(() => import("./pages/platform/Roles"));
const PlatformStaff = lazy(() => import("./pages/platform/Staff"));
const PlatformSubscriptions = lazy(() => import("./pages/platform/Subscriptions"));
const PlatformSupport = lazy(() => import("./pages/platform/Support"));

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
            <Route path="/payment/:appId" element={<SuspenseWrapper><Payment /></SuspenseWrapper>} />
            <Route path="/application-submitted/:appId" element={<SuspenseWrapper><ApplicationSubmitted /></SuspenseWrapper>} />

            <Route path="/elections" element={<SuspenseWrapper><Governance /></SuspenseWrapper>} />
            <Route path="/elections/:id" element={<SuspenseWrapper><ElectionLanding /></SuspenseWrapper>} />
            <Route path="/elections/:id/register" element={<SuspenseWrapper><VoterRegistration /></SuspenseWrapper>} />
            <Route path="/elections/:id/auth" element={<SuspenseWrapper><VoteAuth /></SuspenseWrapper>} />
            <Route path="/elections/:id/vote" element={<SuspenseWrapper><VotingBooth /></SuspenseWrapper>} />
            <Route path="/elections/:id/success" element={<SuspenseWrapper><VoteSuccess /></SuspenseWrapper>} />
            <Route path="/elections/:id/results" element={<SuspenseWrapper><ElectionResults /></SuspenseWrapper>} />
            <Route path="/elections/:id/closed" element={<SuspenseWrapper><ElectionClosed /></SuspenseWrapper>} />
            <Route path="/receipt/:passId" element={<SuspenseWrapper><ReceiptPage /></SuspenseWrapper>} />
          </Route>

          <Route path="/platformsignin" element={<SuspenseWrapper><SignInPage /></SuspenseWrapper>} />
          <Route path="/platformsignup" element={<SuspenseWrapper><SignUpPage /></SuspenseWrapper>} />
          <Route path="/signin" element={<Navigate to="/platformsignin" replace />} />
          <Route path="/signup" element={<Navigate to="/platformsignup" replace />} />
          <Route path="/forgot-password" element={<SuspenseWrapper><ForgotPasswordPage /></SuspenseWrapper>} />
          <Route path="/reset-password" element={<SuspenseWrapper><ResetPasswordPage /></SuspenseWrapper>} />
          <Route path="/verify-email" element={<SuspenseWrapper><EmailVerificationPage /></SuspenseWrapper>} />
          <Route path="/activate-account" element={<SuspenseWrapper><AccountActivationPage /></SuspenseWrapper>} />
          <Route path="/session-expired" element={<SuspenseWrapper><SessionExpiredPage /></SuspenseWrapper>} />
          <Route path="/unauthorized" element={<SuspenseWrapper><UnauthorizedPage /></SuspenseWrapper>} />

          <Route path="/workspace/signin" element={<SuspenseWrapper><OrgSignInPage /></SuspenseWrapper>} />
          <Route path="/org/register" element={<SuspenseWrapper><OrgRegistrationPage /></SuspenseWrapper>} />
          <Route path="/org/forgot-password" element={<SuspenseWrapper><OrgForgotPasswordPage /></SuspenseWrapper>} />
          <Route path="/org/reset-password" element={<SuspenseWrapper><OrgResetPasswordPage /></SuspenseWrapper>} />
          <Route path="/org/invitation" element={<SuspenseWrapper><InvitationAcceptPage /></SuspenseWrapper>} />

          <Route path="/platform/2fa" element={<SuspenseWrapper><TwoFactorAuthPage /></SuspenseWrapper>} />
          <Route path="/platform/verify" element={<SuspenseWrapper><SecurityVerificationPage /></SuspenseWrapper>} />
          <Route path="/platform/backup-code" element={<SuspenseWrapper><BackupCodePage /></SuspenseWrapper>} />

          <Route element={<ProtectedRoute />}>
            <Route element={<PlatformLayout />}>
              <Route path="/platform" element={<SuspenseWrapper><PlatformDashboard /></SuspenseWrapper>} />
              <Route path="/platform/governance-sessions" element={<SuspenseWrapper><GovernanceSessions /></SuspenseWrapper>} />
              <Route path="/platform/organizations" element={<SuspenseWrapper><PlatformOrganizations /></SuspenseWrapper>} />
              <Route path="/platform/organizations/:id" element={<SuspenseWrapper><PlatformOrganizationDetail /></SuspenseWrapper>} />
              <Route path="/platform/users" element={<SuspenseWrapper><PlatformUsers /></SuspenseWrapper>} />
              <Route path="/platform/users/:id" element={<SuspenseWrapper><PlatformUserDetail /></SuspenseWrapper>} />
              <Route path="/platform/memberships" element={<SuspenseWrapper><PlatformMemberships /></SuspenseWrapper>} />
              <Route path="/platform/elections" element={<SuspenseWrapper><PlatformElections /></SuspenseWrapper>} />
              <Route path="/platform/audit" element={<SuspenseWrapper><PlatformAudit /></SuspenseWrapper>} />
              <Route path="/platform/analytics" element={<SuspenseWrapper><PlatformAnalytics /></SuspenseWrapper>} />
              <Route path="/platform/billing" element={<SuspenseWrapper><PlatformBilling /></SuspenseWrapper>} />
              <Route path="/platform/notifications" element={<SuspenseWrapper><PlatformNotifications /></SuspenseWrapper>} />
              <Route path="/platform/monitoring" element={<SuspenseWrapper><PlatformMonitoring /></SuspenseWrapper>} />
              <Route path="/platform/security" element={<SuspenseWrapper><PlatformSecurity /></SuspenseWrapper>} />
              <Route path="/platform/roles" element={<SuspenseWrapper><PlatformRoles /></SuspenseWrapper>} />
              <Route path="/platform/staff" element={<SuspenseWrapper><PlatformStaff /></SuspenseWrapper>} />
              <Route path="/platform/subscriptions" element={<SuspenseWrapper><PlatformSubscriptions /></SuspenseWrapper>} />
              <Route path="/platform/support" element={<SuspenseWrapper><PlatformSupport /></SuspenseWrapper>} />
              <Route path="/platform/settings" element={<SuspenseWrapper><PlatformSettings /></SuspenseWrapper>} />
            </Route>
          </Route>

          <Route element={<OrgBrandingProvider><SuspenseWrapper><Outlet /></SuspenseWrapper></OrgBrandingProvider>}>
            <Route path="/org/signin" element={<OrgSignIn />} />
            <Route path="/org" element={<Navigate to="/org/signin" replace />} />
            <Route element={<OrgProtectedRoute />}>
              <Route element={<OrgLayout />}>
                <Route path="/org/dashboard" element={<SuspenseWrapper><OrgDashboard /></SuspenseWrapper>} />
                <Route path="/org/events" element={<SuspenseWrapper><OrgEvents /></SuspenseWrapper>} />
                <Route path="/org/events/create" element={<SuspenseWrapper><OrgCreateEvent /></SuspenseWrapper>} />
                <Route path="/org/events/:id" element={<SuspenseWrapper><OrgEventDetail /></SuspenseWrapper>} />
                <Route path="/org/setup" element={<SuspenseWrapper><OrgSetupWizard /></SuspenseWrapper>} />
                <Route path="/org/team" element={<SuspenseWrapper><OrgTeam /></SuspenseWrapper>} />
                <Route path="/org/billing" element={<SuspenseWrapper><OrgBilling /></SuspenseWrapper>} />
                <Route path="/org/workspace" element={<SuspenseWrapper><OrgWorkspaceSettings /></SuspenseWrapper>} />
                <Route path="/org/audit-logs" element={<SuspenseWrapper><OrgAuditLogs /></SuspenseWrapper>} />
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