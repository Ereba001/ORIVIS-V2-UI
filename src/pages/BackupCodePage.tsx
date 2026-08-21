import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { KeyRound, ArrowLeft } from "lucide-react";
import SeoHead from "../components/SeoHead";
import AuthLayout from "../components/auth/AuthLayout";
import VerificationInput from "../components/auth/VerificationInput";
import { AuthCard, AuthStateCard } from "../components/auth/AuthCard";

type PageState = "form" | "loading" | "success" | "error";

export default function BackupCodePage() {
  const navigate = useNavigate();
  const [code, setCode] = useState<string[]>(Array(8).fill(""));
  const [pageState, setPageState] = useState<PageState>("form");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.some((c) => !c)) { setErrorMessage("Please enter the complete backup code."); return; }
    setErrorMessage("");
    setPageState("loading");
    await new Promise((r) => setTimeout(r, 1500));
    setPageState("success");
  };

  if (pageState === "success") {
    return (
      <AuthLayout title="Backup Code" subtitle="Code accepted." variant="platform">
        <SeoHead meta={{ title: "Backup Code — ORIVIS", noindex: true }} />
        <AuthCard className="!shadow-none !bg-transparent !border-none !p-0 !backdrop-blur-none !max-w-none">
          <AuthStateCard
            state="success"
            title="Access Granted"
            message="Backup code accepted. You will be redirected to your dashboard."
            action={
              <button
                onClick={() => navigate("/platform")}
                className="bg-brand-gold text-brand-bg-secondary rounded-xl py-2.5 px-6 text-xs font-bold uppercase tracking-widest hover:bg-brand-gold-hover transition-colors cursor-pointer"
              >
                Continue to Dashboard
              </button>
            }
          />
        </AuthCard>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Backup Code" subtitle="Enter one of your backup codes to access your account." variant="platform">
      <SeoHead meta={{ title: "Backup Code — ORIVIS", noindex: true }} />
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

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="flex items-center justify-center gap-2.5 text-brand-text-muted mb-2">
            <KeyRound size={16} />
            <span className="text-[10px] font-mono uppercase tracking-wider">Backup Code</span>
          </div>

          <div className="text-center mb-1">
            <p className="text-[10px] text-brand-text-muted font-mono">
              Enter an 8-character backup code. Each code can only be used once.
            </p>
          </div>

          <VerificationInput
            length={8}
            value={code}
            onChange={setCode}
            groupSize={4}
          />

          <motion.button
            type="submit"
            disabled={pageState === "loading"}
            whileHover={pageState === "loading" ? {} : { scale: 1.01 }}
            whileTap={pageState === "loading" ? {} : { scale: 0.99 }}
            className="w-full bg-brand-gold hover:bg-brand-gold-hover text-brand-bg-secondary rounded-xl py-3 text-xs font-bold uppercase tracking-widest shadow-md transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {pageState === "loading" ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Verifying...
              </span>
            ) : (
              <span className="flex items-center gap-2">Verify</span>
            )}
          </motion.button>
        </form>

        <div className="flex flex-col items-center gap-2 mt-4">
          <button
            onClick={() => navigate("/platformsignin")}
            className="text-[11px] text-brand-text-muted hover:text-brand-text-primary transition-colors cursor-pointer flex items-center gap-1"
          >
            <ArrowLeft size={12} /> Back to Sign In
          </button>
          <p className="text-[10px] text-brand-text-muted/60 mt-1">
            Lost all backup codes? <button className="text-brand-gold hover:underline cursor-pointer">Contact Support</button>
          </p>
        </div>
      </AuthCard>
    </AuthLayout>
  );
}
