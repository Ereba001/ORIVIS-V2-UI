import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { ArrowLeft } from "lucide-react";
import SeoHead from "../components/SeoHead";
import AuthLayout from "../components/auth/AuthLayout";
import { AuthCard, AuthStateCard, AuthFormWrapper } from "../components/auth/AuthCard";

type PageState = "form" | "loading" | "success" | "error";

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [pageState, setPageState] = useState<PageState>("form");
  const [email, setEmail] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) { setErrorMessage("Please enter your email address."); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setErrorMessage("Please enter a valid email address."); return; }
    setErrorMessage("");
    setPageState("loading");
    await new Promise((r) => setTimeout(r, 1500));
    setPageState("success");
  };

  return (
    <AuthLayout title="Forgot Password" subtitle="Enter your email and we'll send you a reset link." variant="platform">
      <SeoHead meta={{ title: "Forgot Password — ORIVIS", noindex: true }} />
      <AuthCard className="!shadow-none !bg-transparent !border-none !p-0 !backdrop-blur-none !max-w-none">
        {pageState === "success" ? (
          <>
            <AuthStateCard
              state="success"
              title="Check Your Email"
              message={`If an account exists for ${email}, we've sent a password reset link. Please check your inbox and follow the instructions.`}
            />
            <button
              onClick={() => navigate("/platformsignin")}
              className="w-full mt-4 bg-brand-surface border border-brand-border text-brand-text-primary rounded-xl py-2.5 text-xs font-bold uppercase tracking-widest hover:bg-brand-surface-elevated transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <ArrowLeft size={14} /> Back to Sign In
            </button>
          </>
        ) : (
          <>
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
                  className="w-full bg-brand-bg-secondary/50 border border-brand-border rounded-xl px-4 py-2.5 text-xs text-brand-text-primary placeholder-brand-text-disabled focus:outline-none focus:border-brand-gold focus:bg-brand-surface transition-all font-medium"
                />
              </div>

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
                    Sending...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">Send Reset</span>
                )}
              </motion.button>
            </AuthFormWrapper>

            <p className="text-center text-[11px] text-brand-text-muted mt-4">
              <Link to="/platformsignin" className="text-brand-gold hover:underline font-semibold">Back to Sign In</Link>
            </p>
          </>
        )}
      </AuthCard>
    </AuthLayout>
  );
}
