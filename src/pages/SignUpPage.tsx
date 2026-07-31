import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "motion/react";
import SeoHead from "../components/SeoHead";
import AuthLayout from "../components/auth/AuthLayout";
import PasswordField from "../components/auth/PasswordField";
import { AuthCard, AuthStateCard, AuthFormWrapper } from "../components/auth/AuthCard";

type PageState = "form" | "loading" | "success" | "error";

export default function SignUpPage() {
  const navigate = useNavigate();
  const [pageState, setPageState] = useState<PageState>("form");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const errors: Record<string, string> = {};
    if (!fullName.trim()) errors.fullName = "Full name is required";
    if (!email.trim()) errors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = "Invalid email address";
    if (!password) errors.password = "Password is required";
    else if (password.length < 8) errors.password = "At least 8 characters required";
    if (!confirmPassword) errors.confirmPassword = "Please confirm your password";
    else if (password !== confirmPassword) errors.confirmPassword = "Passwords do not match";
    if (!agreeTerms) errors.terms = "You must agree to the terms";
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    if (!validate()) return;
    setPageState("loading");
    await new Promise((r) => setTimeout(r, 1500));
    setPageState("success");
  };

  if (pageState === "success") {
    return (
      <div className="min-h-screen bg-brand-bg flex items-center justify-center p-6">
        <SeoHead meta={{ title: "Account Created — ORIVIS", noindex: true }} />
        <AuthCard>
          <AuthStateCard
            state="success"
            title="Account Created"
            message={`Welcome to ORIVIS, ${fullName.split(" ")[0]}. We've sent a verification email to ${email}. Please verify your email to get started.`}
            action={
              <button
                onClick={() => navigate("/platformsignin")}
                className="bg-brand-gold text-brand-bg-secondary rounded-xl py-2.5 px-6 text-xs font-bold uppercase tracking-widest hover:bg-brand-gold-hover transition-colors cursor-pointer"
              >
                Go to Sign In
              </button>
            }
          />
        </AuthCard>
      </div>
    );
  }

  return (
    <AuthLayout title="Create Account" subtitle="Register to get started with ORIVIS." variant="platform">
      <SeoHead meta={{ title: "Sign Up — ORIVIS", noindex: true }} />
      <AuthCard className="!shadow-none !bg-transparent !border-none !p-0 !backdrop-blur-none !max-w-none">
        {pageState === "error" && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-3 bg-status-error/10 border border-status-error/20 rounded-xl text-status-error text-[11px] font-semibold"
          >
            {errorMessage}
          </motion.div>
        )}

        <AuthFormWrapper onSubmit={handleSubmit}>
          <div>
            <label htmlFor="fullName" className="block text-[10px] font-mono uppercase tracking-wider text-brand-text-muted font-bold mb-1">
              Full Name
            </label>
            <input
              id="fullName"
              type="text"
              required
              placeholder="John Doe"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className={`w-full bg-brand-bg-secondary/50 border ${fieldErrors.fullName ? "border-status-danger" : "border-brand-border"} rounded-xl px-4 py-2.5 text-xs text-brand-text-primary placeholder-brand-text-disabled focus:outline-none focus:border-brand-gold focus:bg-brand-surface transition-all font-medium`}
            />
            {fieldErrors.fullName && <p className="text-[10px] text-status-danger mt-1 font-semibold">{fieldErrors.fullName}</p>}
          </div>

          <div>
            <label htmlFor="email" className="block text-[10px] font-mono uppercase tracking-wider text-brand-text-muted font-bold mb-1">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              required
              placeholder="you@organization.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`w-full bg-brand-bg-secondary/50 border ${fieldErrors.email ? "border-status-danger" : "border-brand-border"} rounded-xl px-4 py-2.5 text-xs text-brand-text-primary placeholder-brand-text-disabled focus:outline-none focus:border-brand-gold focus:bg-brand-surface transition-all font-medium`}
            />
            {fieldErrors.email && <p className="text-[10px] text-status-danger mt-1 font-semibold">{fieldErrors.email}</p>}
          </div>

          <PasswordField
            id="password"
            label="Password"
            value={password}
            onChange={setPassword}
            placeholder="Create a strong password"
            error={fieldErrors.password}
            showStrength
          />

          <PasswordField
            id="confirmPassword"
            label="Confirm Password"
            value={confirmPassword}
            onChange={setConfirmPassword}
            placeholder="Re-enter your password"
            error={fieldErrors.confirmPassword}
          />

          <div className="flex flex-col gap-2 mt-1">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                className="mt-0.5 accent-brand-gold"
              />
              <span className="text-[10px] text-brand-text-muted leading-relaxed">
                I agree to the{" "}
                <button type="button" onClick={() => navigate("/terms")} className="text-brand-gold hover:underline cursor-pointer">
                  Terms of Service
                </button>{" "}
                and{" "}
                <button type="button" onClick={() => navigate("/privacy")} className="text-brand-gold hover:underline cursor-pointer">
                  Privacy Policy
                </button>
              </span>
            </label>
            {fieldErrors.terms && <p className="text-[10px] text-status-danger font-semibold">{fieldErrors.terms}</p>}
          </div>

          <motion.button
            type="submit"
            disabled={pageState === "loading"}
            whileHover={pageState === "loading" ? {} : { scale: 1.01 }}
            whileTap={pageState === "loading" ? {} : { scale: 0.99 }}
            className="w-full bg-brand-gold hover:bg-brand-gold-hover text-brand-bg-secondary rounded-xl py-3 text-xs font-bold uppercase tracking-widest shadow-md transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 mt-1 disabled:opacity-50"
          >
            {pageState === "loading" ? <span>Creating Account...</span> : <span>Create Account</span>}
          </motion.button>
        </AuthFormWrapper>

        <p className="text-center text-[11px] text-brand-text-muted mt-4">
          Already have an account?{" "}
          <Link to="/platformsignin" className="text-brand-gold hover:underline font-semibold">Sign In</Link>
        </p>
      </AuthCard>
    </AuthLayout>
  );
}
