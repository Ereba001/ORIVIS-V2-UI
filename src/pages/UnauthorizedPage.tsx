import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { ShieldAlert } from "lucide-react";
import SeoHead from "../components/SeoHead";
import OrivisLogo from "../components/OrivisLogo";
import TextureBg from "../components/TextureBg";
import { useAuth } from "../hooks/useAuth";

export default function UnauthorizedPage() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handlePlatformSignIn = async () => {
    try {
      await logout();
    } finally {
      navigate("/platformsignin", { replace: true });
    }
  };

  return (
    <div className="min-h-screen bg-brand-bg flex items-center justify-center p-6 relative overflow-hidden">
      <SeoHead meta={{ title: "Unauthorized — ORIVIS", noindex: true }} />
      <TextureBg src="https://images.unsplash.com/photo-1772775756679-34a0716ae0d9?q=80&w=1600&auto=format&fit=crop" opacity={0.1} />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="glass-card rounded-2xl p-8 md:p-10 shadow-lg text-center">
          <div className="flex items-center justify-center mb-6">
            <OrivisLogo className="text-brand-text-primary" />
          </div>

          <div className="w-16 h-16 rounded-2xl bg-status-danger/10 border border-status-danger/20 flex items-center justify-center mx-auto mb-5">
            <ShieldAlert size={28} className="text-status-danger" />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-status-danger/20 bg-status-danger/5 text-status-danger text-[10px] font-mono font-medium mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-status-danger animate-pulse" />
            403 Forbidden
          </div>

          <h1 className="font-display font-bold text-xl uppercase tracking-tight text-brand-text-primary mb-2">
            Access Denied
          </h1>
          <p className="text-xs text-brand-text-muted leading-relaxed mb-8 max-w-sm mx-auto">
            You do not have the required permissions to access this page. This area is the ORIVIS platform administration console and is separate from organization workspaces. Sign in with a platform administrator account to continue.
          </p>

          <div className="flex flex-col gap-2.5">
            <motion.button
              onClick={handlePlatformSignIn}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className="w-full bg-brand-gold hover:bg-brand-gold-hover text-brand-bg-secondary rounded-xl py-3 text-xs font-bold uppercase tracking-widest shadow-md transition-all duration-200 cursor-pointer flex items-center justify-center gap-2"
            >
              Sign in as Platform Admin
            </motion.button>

            <button
              onClick={() => navigate(-1)}
              className="w-full bg-brand-surface border border-brand-border text-brand-text-muted rounded-xl py-2.5 text-xs font-semibold hover:bg-brand-surface-elevated transition-all cursor-pointer"
            >
              Go Back
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
