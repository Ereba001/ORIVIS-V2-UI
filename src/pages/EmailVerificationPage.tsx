import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { Mail, MailCheck, RefreshCw, ArrowLeft } from "lucide-react";
import SeoHead from "../components/SeoHead";
import AuthLayout from "../components/auth/AuthLayout";
import { AuthCard, AuthStateCard } from "../components/auth/AuthCard";
import { authService } from "../services/auth-service";

type VerificationState = "pending" | "verifying" | "success" | "failed" | "expired" | "resending";

function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!domain) return email;
  const masked = local.length <= 2 ? local[0] + "***" : local[0] + "***" + local[local.length - 1];
  return `${masked}@${domain}`;
}

export default function EmailVerificationPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const email = searchParams.get("email") || "";
  const org = searchParams.get("org") || "";

  const getInitialState = (): VerificationState => {
    if (token) return "verifying";
    if (email) return "pending";
    return "failed";
  };

  const [status, setStatus] = useState<VerificationState>(getInitialState);
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);

  useEffect(() => {
    if (token && status === "verifying") {
      let cancelled = false;
      authService
        .verifyEmail(token, email)
        .then(() => {
          if (!cancelled) setStatus("success");
        })
        .catch(() => {
          if (!cancelled) setStatus("failed");
        });
      return () => {
        cancelled = true;
      };
    }
  }, [token, email, status]);

  const handleResend = async () => {
    setStatus("resending");
    try {
      await authService.sendVerification(email);
      setStatus(email ? "pending" : "success");
    } catch (err) {
      const code = (err as { code?: string | null })?.code;
      if (code === "ALREADY_VERIFIED") {
        setStatus("success");
      } else {
        setStatus(email ? "failed" : "expired");
      }
    }
  };

  const handleContinueToSignIn = () => {
    setShowRegistrationModal(true);
  };

  const handleProceedToLogin = () => {
    if (org) {
      navigate("/org/signin");
    } else {
      navigate("/platformsignin");
    }
  };

  const renderContent = () => {
    switch (status) {
      case "pending":
        return (
          <div className="text-center">
            <div className="w-14 h-14 rounded-full bg-brand-gold/10 flex items-center justify-center mx-auto mb-4">
              <MailCheck size={28} className="text-brand-gold" />
            </div>
            <h3 className="text-lg font-bold text-brand-text mb-1">Check Your Email</h3>
            <p className="text-sm text-brand-text-muted mb-2">
              We sent a verification email to
            </p>
            <p className="text-sm font-semibold text-brand-text mb-6">
              {maskEmail(email)}
            </p>
            <p className="text-xs text-brand-text-muted mb-6 leading-relaxed">
              Click the link in the email to verify your account.
              <br />
              Can't find it? Check your spam folder.
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={handleResend}
                className="text-brand-gold hover:underline text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer bg-transparent border-none"
              >
                <RefreshCw size={12} /> Resend Verification
              </button>
            </div>
          </div>
        );
      case "verifying":
        return (
          <AuthStateCard
            state="loading"
            title="Verifying Your Email"
            message="Please wait while we verify your email address. This should only take a moment."
            action={
              <div className="flex items-center gap-2 text-brand-text-muted text-[10px] font-mono">
                <svg className="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Verifying...
              </div>
            }
          />
        );
      case "success":
        return (
          <AuthStateCard
            state="success"
            title="Email Verified"
            message="Your email address has been successfully verified. You can now access all ORIVIS features."
            action={
              <button
                onClick={handleContinueToSignIn}
                className="bg-brand-gold text-brand-bg-secondary rounded-xl py-2.5 px-6 text-xs font-bold uppercase tracking-widest hover:bg-brand-gold-hover transition-colors cursor-pointer"
              >
                {org ? `Continue to ${org}` : "Continue to Sign In"}
              </button>
            }
          />
        );
      case "failed":
        return (
          <AuthStateCard
            state="error"
            title="Verification Failed"
            message="We couldn't verify your email. The verification link may be invalid or damaged. Please try requesting a new verification email."
            action={
              <button
                onClick={handleResend}
                className="bg-brand-gold text-brand-bg-secondary rounded-xl py-2.5 px-6 text-xs font-bold uppercase tracking-widest hover:bg-brand-gold-hover transition-colors cursor-pointer flex items-center gap-2"
              >
                <Mail size={12} /> Resend Verification
              </button>
            }
          />
        );
      case "expired":
        return (
          <AuthStateCard
            state="warning"
            title="Link Expired"
            message="This verification link has expired. Verification links are valid for 24 hours. Please request a new verification email."
            action={
              <button
                onClick={handleResend}
                className="bg-brand-gold text-brand-bg-secondary rounded-xl py-2.5 px-6 text-xs font-bold uppercase tracking-widest hover:bg-brand-gold-hover transition-colors cursor-pointer flex items-center gap-2"
              >
                <Mail size={12} /> Resend Verification
              </button>
            }
          />
        );
      case "resending":
        return (
          <AuthStateCard
            state="loading"
            title="Resending Email"
            message="Please wait while we send a new verification email to your registered address."
          />
        );
    }
  };

  const showBackLink = status !== "verifying" && status !== "resending";

  return (
    <AuthLayout title="Email Verification" subtitle="Verify your email address to activate your account." variant="platform">
      <SeoHead meta={{ title: "Email Verification — ORIVIS", noindex: true }} />
      <AuthCard className="!shadow-none !bg-transparent !border-none !p-0 !backdrop-blur-none !max-w-none">
        {renderContent()}

        {showBackLink && (
          <p className={`text-center text-[11px] text-brand-text-muted ${status === "pending" ? "mt-6" : "mt-4"}`}>
            {org ? (
              <Link to="/org/signin" className="text-brand-gold hover:underline font-semibold flex items-center justify-center gap-1">
                <ArrowLeft size={12} /> Back to Sign In
              </Link>
            ) : (
              <Link to="/platformsignin" className="text-brand-gold hover:underline font-semibold flex items-center justify-center gap-1">
                <ArrowLeft size={12} /> Back to Sign In
              </Link>
            )}
          </p>
        )}
      </AuthCard>

      {status === "success" && showRegistrationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm glass-strong rounded-2xl border border-brand-divider p-6 shadow-2xl">
            <div className="w-12 h-12 rounded-full bg-brand-gold/10 flex items-center justify-center mx-auto mb-4">
              <MailCheck size={24} className="text-brand-gold" />
            </div>
            <h3 className="text-lg font-bold text-brand-text text-center mb-1">Account Registration Successful</h3>
            <p className="text-sm text-brand-text-muted text-center leading-relaxed mb-6">
              Proceed to login to access your organization workspace.
            </p>
            <button
              onClick={handleProceedToLogin}
              className="w-full bg-brand-gold text-brand-bg-secondary rounded-xl py-2.5 px-6 text-xs font-bold uppercase tracking-widest hover:bg-brand-gold-hover transition-colors cursor-pointer"
            >
              Proceed to Login
            </button>
          </div>
        </div>
      )}
    </AuthLayout>
  );
}
