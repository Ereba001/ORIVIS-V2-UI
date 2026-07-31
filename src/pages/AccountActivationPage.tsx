import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import SeoHead from "../components/SeoHead";
import AuthLayout from "../components/auth/AuthLayout";
import { AuthCard, AuthStateCard } from "../components/auth/AuthCard";

type ActivationState = "activating" | "activated" | "failed" | "already-activated";

export default function AccountActivationPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const [status, setStatus] = useState<ActivationState>(token ? "activating" : "failed");

  useEffect(() => {
    if (token) {
      const timer = setTimeout(() => {
        setStatus("activated");
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [token]);

  const renderContent = () => {
    switch (status) {
      case "activating":
        return (
          <AuthStateCard
            state="loading"
            title="Activating Your Account"
            message="Please wait while we activate your account. This should only take a moment."
            action={
              <div className="flex items-center gap-2 text-brand-text-muted text-[10px] font-mono">
                <svg className="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Activating...
              </div>
            }
          />
        );
      case "activated":
        return (
          <AuthStateCard
            state="success"
            title="Account Activated"
            message="Your account has been successfully activated. You can now sign in and start using ORIVIS."
            action={
              <button
                onClick={() => navigate("/platformsignin")}
                className="bg-brand-gold text-brand-bg-secondary rounded-xl py-2.5 px-6 text-xs font-bold uppercase tracking-widest hover:bg-brand-gold-hover transition-colors cursor-pointer"
              >
                Sign In Now
              </button>
            }
          />
        );
      case "already-activated":
        return (
          <AuthStateCard
            state="info"
            title="Already Activated"
            message="This account has already been activated. No further action is needed. You can proceed to sign in."
            action={
              <button
                onClick={() => navigate("/platformsignin")}
                className="bg-brand-gold text-brand-bg-secondary rounded-xl py-2.5 px-6 text-xs font-bold uppercase tracking-widest hover:bg-brand-gold-hover transition-colors cursor-pointer"
              >
                Sign In Now
              </button>
            }
          />
        );
      case "failed":
        return (
          <AuthStateCard
            state="error"
            title="Activation Failed"
            message="We couldn't activate your account. The activation link may be invalid or expired. Please try registering again or contact support."
            action={
              <button
                onClick={() => navigate("/platformsignup")}
                className="bg-brand-gold text-brand-bg-secondary rounded-xl py-2.5 px-6 text-xs font-bold uppercase tracking-widest hover:bg-brand-gold-hover transition-colors cursor-pointer"
              >
                Create New Account
              </button>
            }
          />
        );
    }
  };

  return (
    <AuthLayout title="Account Activation" subtitle="Activate your ORIVIS account to get started." variant="platform">
      <SeoHead meta={{ title: "Account Activation — ORIVIS", noindex: true }} />
      <AuthCard className="!shadow-none !bg-transparent !border-none !p-0 !backdrop-blur-none !max-w-none">
        {renderContent()}

        {status !== "activating" && (
          <p className="text-center text-[11px] text-brand-text-muted mt-4">
            <Link to="/platformsignin" className="text-brand-gold hover:underline font-semibold flex items-center justify-center gap-1">
              <ArrowLeft size={12} /> Back to Sign In
            </Link>
          </p>
        )}
      </AuthCard>
    </AuthLayout>
  );
}
