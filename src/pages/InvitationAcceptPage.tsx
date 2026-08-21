import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "motion/react";
import SeoHead from "../components/SeoHead";
import AuthLayout from "../components/auth/AuthLayout";
import AuthHeroIllustration from "../components/auth/AuthHeroIllustration";
import PasswordField from "../components/auth/PasswordField";
import LoadingOverlay from "../components/LoadingOverlay";
import { authTokens } from "../lib/auth";
import { API } from "../constants/api";
import { createApiClient } from "../lib/api-client";

type PageState = "loading" | "accept" | "error" | "expired";

export default function InvitationAcceptPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const [pageState, setPageState] = useState<PageState>(token ? "loading" : "error");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showLoading, setShowLoading] = useState(false);
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [invitationData, setInvitationData] = useState<{
    email: string;
    role: string;
    organization: { name: string; slug: string };
    expires_at: string;
  } | null>(null);

  const apiClient = createApiClient(
    () => authTokens.getAccessToken(),
    () => {},
    async () => null,
  );

  useEffect(() => {
    if (!token) {
      setPageState("error");
      return;
    }

    const fetchInvitation = async () => {
      try {
        const res = await apiClient.get(API.ENDPOINTS.INVITATIONS_PUBLIC.SHOW(token));
        setInvitationData(res.data.invitation);
        setPageState("accept");
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "This invitation is invalid or has expired.";
        if (msg.includes("expired")) {
          setPageState("expired");
        } else {
          setPageState("error");
        }
        setErrorMessage(msg);
      }
    };

    fetchInvitation();
  }, [token]);

  if (pageState === "loading") {
    return (
      <AuthLayout title="" subtitle="" variant="organization">
        <SeoHead meta={{ title: "Loading Invitation | ORIVIS", noindex: true }} />
        <div className="relative flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-md"
          >
            <div className="glass-card rounded-2xl p-10 shadow-lg">
              <div className="text-center mb-4">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-mono font-medium status-badge-default">
                  <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                  Verifying your invitation...
                </div>
                <h1 className="font-display font-bold text-xl uppercase tracking-tight text-brand-text-primary mt-3">
                  Loading Invitation
                </h1>
                <p className="text-xs text-brand-text-muted mt-1">
                  Please wait while we verify your invitation details.
                </p>
              </div>
              <div className="flex justify-center pt-2">
                <svg className="animate-spin h-6 w-6 text-brand-gold" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              </div>
            </div>
          </motion.div>
        </div>
      </AuthLayout>
    );
  }

  if (pageState === "error" || pageState === "expired") {
    return (
      <AuthLayout title="" subtitle="" variant="organization">
        <SeoHead meta={{ title: "Invitation | ORIVIS", noindex: true }} />
        <div className="relative flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-md"
          >
            <div className="glass-card rounded-2xl p-10 shadow-lg">
              <div className="text-center mb-4">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-mono font-medium status-badge-default">
                  <span className="w-1.5 h-1.5 rounded-full bg-current" />
                  {pageState === "expired" ? "Invitation Expired" : "Invalid Invitation"}
                </div>
                <h1 className="font-display font-bold text-xl uppercase tracking-tight text-brand-text-primary mt-3">
                  {pageState === "expired" ? "Invitation Expired" : "Invalid Invitation"}
                </h1>
                <p className="text-xs text-brand-text-muted mt-1">
                  {errorMessage || "This invitation link is invalid or has expired. Please contact the person who invited you to send a new invitation."}
                </p>
              </div>
              <div className="flex justify-center pt-1">
                <motion.button
                  type="button"
                  onClick={() => navigate("/org/signin")}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="w-full max-w-[240px] bg-brand-gold hover:bg-brand-gold-hover text-brand-bg-secondary rounded-full py-2.5 px-8 text-xs font-bold uppercase tracking-widest shadow-brand-gold transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  Go to Sign In
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>
      </AuthLayout>
    );
  }

  if (pageState === "accept" && invitationData) {
    const orgName = invitationData.organization.name;

    const getStatusText = () => {
      if (fullName && password && confirmPassword) return "Ready to Accept";
      if (fullName || password) return "Awaiting Input Validation";
      return "Secure Connection Established";
    };

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setErrorMessage("");

      if (!fullName.trim()) {
        setErrorMessage("Please enter your full name.");
        return;
      }
      if (!password) {
        setErrorMessage("Please enter a password.");
        return;
      }
      if (password.length < 8) {
        setErrorMessage("Password must be at least 8 characters.");
        return;
      }
      if (password !== confirmPassword) {
        setErrorMessage("Passwords do not match.");
        return;
      }

      setIsSubmitting(true);
      setShowLoading(true);

      try {
        const res = await apiClient.post(API.ENDPOINTS.INVITATIONS_PUBLIC.ACCEPT(token), {
          name: fullName.trim(),
          password,
          password_confirmation: confirmPassword,
        });

        const { access_token, refresh_token } = res.data;
        authTokens.setTokens(access_token, refresh_token ?? access_token);

        setTimeout(() => {
          window.location.href = "/org/dashboard";
        }, 2200);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Failed to accept invitation. Please try again.";
        setErrorMessage(message);
        setShowLoading(false);
      } finally {
        setIsSubmitting(false);
      }
    };

    const formContent = (
      <>
        <div className="text-center mb-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-mono font-medium status-badge-default">
            <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
            {getStatusText()}
          </div>
          <h1 className="font-display font-bold text-xl uppercase tracking-tight text-brand-text-primary mt-3">
            Join {orgName}
          </h1>
          <p className="text-xs text-brand-text-muted mt-1">
            You've been invited as{" "}
            <span className="text-brand-gold font-semibold capitalize">{invitationData.role}</span>.
            Set up your account to get started.
          </p>
        </div>

        {errorMessage && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-3 bg-status-error/10 border border-status-error/20 rounded-xl text-status-error text-[11px] font-semibold"
          >
            {errorMessage}
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-2">
          <div>
            <label htmlFor="fullName" className="block text-[10px] font-mono uppercase tracking-wider text-brand-text-muted font-bold mb-1">
              Full Name
            </label>
            <input
              id="fullName"
              type="text"
              required
              placeholder="Enter your full name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full bg-brand-bg-secondary/50 border border-brand-border rounded-xl px-4 py-3 text-xs text-brand-text-primary placeholder-brand-text-disabled focus:outline-none focus:border-brand-gold focus:bg-brand-surface transition-all font-medium"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-[10px] font-mono uppercase tracking-wider text-brand-text-muted font-bold mb-1">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={invitationData.email}
              disabled
              className="w-full bg-brand-bg-secondary/30 border border-brand-border/50 rounded-xl px-4 py-3 text-xs text-brand-text-disabled cursor-not-allowed font-medium"
            />
          </div>

          <PasswordField
            id="password"
            label="Create Password"
            value={password}
            onChange={setPassword}
            placeholder="Create a password"
            showStrength
          />

          <PasswordField
            id="confirmPassword"
            label="Confirm Password"
            value={confirmPassword}
            onChange={setConfirmPassword}
            placeholder="Confirm your password"
          />

          <div className="flex justify-center pt-1">
            <motion.button
              type="submit"
              disabled={isSubmitting}
              whileHover={isSubmitting ? {} : { scale: 1.03 }}
              whileTap={isSubmitting ? {} : { scale: 0.97 }}
              className="w-full max-w-[240px] bg-brand-gold hover:bg-brand-gold-hover text-brand-bg-secondary rounded-full py-2.5 px-8 text-xs font-bold uppercase tracking-widest shadow-brand-gold transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? <span>Accepting...</span> : <span>Accept Invitation</span>}
            </motion.button>
          </div>
        </form>

        <div className="mt-3 flex flex-col items-center gap-1.5">
          <p className="text-[11px] text-brand-text-muted">
            Already have an account?{" "}
            <button
              type="button"
              onClick={() => navigate("/org/signin")}
              className="text-brand-gold hover:underline font-semibold cursor-pointer"
            >
              Sign In
            </button>
          </p>
        </div>
      </>
    );

    return (
      <AuthLayout
        title=""
        subtitle=""
        variant="organization"
        heroContent={
          <>
            <div className="mb-6">
              <AuthHeroIllustration variant="organization" />
            </div>
            <h2 className="text-3xl font-display font-bold text-white mb-3">Join {orgName}</h2>
            <p className="text-sm text-white/60 leading-relaxed">
              You've been invited as{" "}
              <span className="text-brand-gold font-semibold capitalize">{invitationData.role}</span>.
              Complete your registration to access the workspace.
            </p>
          </>
        }
      >
        <SeoHead meta={{ title: `Accept Invitation | ORIVIS`, noindex: true }} />
        {showLoading && (
          <LoadingOverlay
            messages={[
              "Verifying invitation details...",
              "Creating your account...",
              "Setting up organization access...",
              "Loading your workspace...",
            ]}
          />
        )}
        <div className="relative flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-md"
          >
            <div className="glass-card rounded-2xl p-10 shadow-lg">
              {formContent}
            </div>
          </motion.div>
        </div>
      </AuthLayout>
    );
  }

  return null;
}
