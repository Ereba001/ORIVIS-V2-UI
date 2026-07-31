import { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { motion } from "motion/react";
import { UserPlus, ArrowLeft } from "lucide-react";
import SeoHead from "../components/SeoHead";
import AuthLayout from "../components/auth/AuthLayout";
import PasswordField from "../components/auth/PasswordField";
import OrivisLogo from "../components/OrivisLogo";
import { AuthCard, AuthStateCard, AuthFormWrapper } from "../components/auth/AuthCard";

type PageState = "accepting" | "accept" | "loading" | "success" | "error";

export default function InvitationAcceptPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const orgName = searchParams.get("org") || "your organization";
  const inviterEmail = searchParams.get("inviter") || "an administrator";
  const [pageState, setPageState] = useState<PageState>(token ? "accept" : "error");
  const [submitting, setSubmitting] = useState(false);
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  if (!token) {
    return (
      <AuthLayout title="Invitation" subtitle="Invalid or missing invitation token." variant="organization">
        <SeoHead meta={{ title: "Invitation — ORIVIS", noindex: true }} />
        <AuthCard className="!shadow-none !bg-transparent !border-none !p-0 !backdrop-blur-none !max-w-none">
          <AuthStateCard
            state="error"
            title="Invalid Invitation"
            message="This invitation link is invalid or has expired. Please contact the person who invited you to send a new invitation."
            action={
              <button
                onClick={() => navigate("/org/signin")}
                className="bg-brand-gold text-brand-bg-secondary rounded-xl py-2.5 px-6 text-xs font-bold uppercase tracking-widest hover:bg-brand-gold-hover transition-colors cursor-pointer"
              >
                Go to Organization Sign In
              </button>
            }
          />
        </AuthCard>
      </AuthLayout>
    );
  }

  if (pageState === "accept") {
    return (
      <AuthLayout
        title="Accept Invitation"
        subtitle={`You've been invited to join ${orgName} by ${inviterEmail}.`}
        variant="organization"
        heroContent={
          <>
            <div className="w-16 h-16 rounded-2xl bg-brand-gold/20 flex items-center justify-center mx-auto mb-6">
              <UserPlus size={28} className="text-brand-gold" />
            </div>
            <h2 className="text-3xl font-display font-bold text-white mb-3">Join {orgName}</h2>
            <p className="text-sm text-white/60 leading-relaxed">
              You've been invited by {inviterEmail}. Set up your account and get started.
            </p>
          </>
        }
      >
        <SeoHead meta={{ title: "Accept Invitation — ORIVIS", noindex: true }} />
        <AuthCard className="!shadow-none !bg-transparent !border-none !p-0 !backdrop-blur-none !max-w-none">
          {errorMessage && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-3 bg-status-error/10 border border-status-error/20 rounded-xl text-status-error text-[11px] font-semibold"
            >
              {errorMessage}
            </motion.div>
          )}

          <AuthFormWrapper onSubmit={async (e) => {
            e.preventDefault();
            if (!fullName.trim()) { setErrorMessage("Please enter your full name."); return; }
            if (!password) { setErrorMessage("Please enter a password."); return; }
            if (password.length < 8) { setErrorMessage("Password must be at least 8 characters."); return; }
            if (password !== confirmPassword) { setErrorMessage("Passwords do not match."); return; }
            setErrorMessage("");
            setSubmitting(true);
            await new Promise((r) => setTimeout(r, 1500));
            setSubmitting(false);
            setPageState("success");
          }}>
            <div>
              <label htmlFor="fullName" className="block text-[10px] font-mono uppercase tracking-wider text-brand-text-muted font-bold mb-1">
                Full Name
              </label>
              <input
                id="fullName"
                type="text"
                required
                placeholder="Your full name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full bg-brand-bg-secondary/50 border border-brand-border rounded-xl px-4 py-2.5 text-xs text-brand-text-primary placeholder-brand-text-disabled focus:outline-none focus:border-brand-gold focus:bg-brand-surface transition-all font-medium"
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

            <motion.button
              type="submit"
              disabled={submitting}
              whileHover={submitting ? {} : { scale: 1.01 }}
              whileTap={submitting ? {} : { scale: 0.99 }}
              className="w-full bg-brand-gold hover:bg-brand-gold-hover text-brand-bg-secondary rounded-xl py-3 text-xs font-bold uppercase tracking-widest shadow-md transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 mt-1 disabled:opacity-50"
            >
              {submitting ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Accepting Invitation...
                </span>
              ) : (
                <span className="flex items-center gap-2">Accept</span>
              )}
            </motion.button>
          </AuthFormWrapper>

          <p className="text-center text-[11px] text-brand-text-muted mt-4">
            <Link to="/org/signin" className="text-brand-gold hover:underline font-semibold flex items-center justify-center gap-1">
              <ArrowLeft size={12} /> Back to Sign In
            </Link>
          </p>
        </AuthCard>
      </AuthLayout>
    );
  }

  if (pageState === "success") {
    return (
      <div className="min-h-screen bg-brand-bg flex items-center justify-center p-6">
        <SeoHead meta={{ title: "Invitation Accepted — ORIVIS", noindex: true }} />
        <AuthCard>
          <div className="flex items-center justify-center mb-4">
            <OrivisLogo className="text-brand-text-primary" />
          </div>
          <AuthStateCard
            state="success"
            title="Invitation Accepted"
            message={`Welcome to ${orgName}! Your account has been created and you can now sign in to access your organization's workspace.`}
            action={
              <button
                onClick={() => navigate("/org/signin")}
                className="bg-brand-gold text-brand-bg-secondary rounded-xl py-2.5 px-6 text-xs font-bold uppercase tracking-widest hover:bg-brand-gold-hover transition-colors cursor-pointer"
              >
                Sign In to {orgName}
              </button>
            }
          />
        </AuthCard>
      </div>
    );
  }

  return null;
}
