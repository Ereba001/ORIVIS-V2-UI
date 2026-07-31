import { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { motion } from "motion/react";
import { ArrowLeft } from "lucide-react";
import SeoHead from "../components/SeoHead";
import AuthLayout from "../components/auth/AuthLayout";
import PasswordField from "../components/auth/PasswordField";
import { AuthCard, AuthStateCard, AuthFormWrapper } from "../components/auth/AuthCard";

type PageState = "form" | "loading" | "success" | "error";

export default function OrgResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const [pageState, setPageState] = useState<PageState>(token ? "form" : "error");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  if (!token) {
    return (
      <AuthLayout title="Organization Password Reset" subtitle="Invalid or missing reset token." variant="organization">
        <SeoHead meta={{ title: "Reset Password — ORIVIS Organization", noindex: true }} />
        <AuthCard className="!shadow-none !bg-transparent !border-none !p-0 !backdrop-blur-none !max-w-none">
          <AuthStateCard
            state="error"
            title="Invalid Link"
            message="This password reset link is invalid or has expired. Please request a new password reset."
            action={
              <Link
                to="/org/forgot-password"
                className="inline-block bg-brand-gold text-brand-bg-secondary rounded-xl py-2.5 px-6 text-xs font-bold uppercase tracking-widest hover:bg-brand-gold-hover transition-colors"
              >
                Request New Link
              </Link>
            }
          />
        </AuthCard>
      </AuthLayout>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) { setErrorMessage("Please enter a new password."); return; }
    if (password.length < 8) { setErrorMessage("Password must be at least 8 characters."); return; }
    if (password !== confirmPassword) { setErrorMessage("Passwords do not match."); return; }
    setErrorMessage("");
    setPageState("loading");
    await new Promise((r) => setTimeout(r, 1500));
    setPageState("success");
  };

  if (pageState === "success") {
    return (
      <AuthLayout title="Password Updated" subtitle="Your organization account password has been reset." variant="organization">
        <SeoHead meta={{ title: "Password Reset — ORIVIS Organization", noindex: true }} />
        <AuthCard className="!shadow-none !bg-transparent !border-none !p-0 !backdrop-blur-none !max-w-none">
          <AuthStateCard
            state="success"
            title="Password Updated"
            message="Your organization account password has been successfully reset. You can now sign in with your new password."
            action={
              <button
                onClick={() => navigate("/org/signin")}
                className="bg-brand-gold text-brand-bg-secondary rounded-xl py-2.5 px-6 text-xs font-bold uppercase tracking-widest hover:bg-brand-gold-hover transition-colors cursor-pointer"
              >
                Sign In Now
              </button>
            }
          />
        </AuthCard>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Reset Password" subtitle="Enter your new password for your organization account." variant="organization">
      <SeoHead meta={{ title: "Reset Password — ORIVIS Organization", noindex: true }} />
      <AuthCard className="!shadow-none !bg-transparent !border-none !p-0 !backdrop-blur-none !max-w-none">
        {pageState === "error" && errorMessage && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-3 bg-status-error/10 border border-status-error/20 rounded-xl text-status-error text-[11px] font-semibold"
          >
            {errorMessage}
          </motion.div>
        )}

        <AuthFormWrapper onSubmit={handleSubmit}>
          <PasswordField
            id="password"
            label="New Password"
            value={password}
            onChange={setPassword}
            placeholder="Enter your new password"
            showStrength
          />

          <PasswordField
            id="confirmPassword"
            label="Confirm New Password"
            value={confirmPassword}
            onChange={setConfirmPassword}
            placeholder="Re-enter your new password"
          />

          <motion.button
            type="submit"
            disabled={pageState === "loading"}
            whileHover={pageState === "loading" ? {} : { scale: 1.01 }}
            whileTap={pageState === "loading" ? {} : { scale: 0.99 }}
            className="w-full bg-brand-gold hover:bg-brand-gold-hover text-brand-bg-secondary rounded-xl py-3 text-xs font-bold uppercase tracking-widest shadow-md transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 mt-1 disabled:opacity-50"
          >
            {pageState === "loading" ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Resetting Password...
              </span>
            ) : (
              <span className="flex items-center gap-2">Reset Password</span>
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
