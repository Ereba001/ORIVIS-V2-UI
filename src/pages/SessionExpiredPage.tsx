import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { Timer } from "lucide-react";
import SeoHead from "../components/SeoHead";
import OrivisLogo from "../components/OrivisLogo";
import TextureBg from "../components/TextureBg";

export default function SessionExpiredPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-brand-bg flex items-center justify-center p-6 relative overflow-hidden">
      <SeoHead meta={{ title: "Session Expired — ORIVIS", noindex: true }} />
      <TextureBg src="https://images.unsplash.com/photo-1772775756679-34a0716ae0d9?q=80&w=1600&auto=format&fit=crop" opacity={0.1} />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="glass-card rounded-2xl p-8 md:p-10 shadow-[0_32px_64px_rgba(0,0,0,0.4)] text-center">
          <div className="flex items-center justify-center mb-6">
            <OrivisLogo className="text-brand-text-primary" />
          </div>

          <div className="w-16 h-16 rounded-2xl bg-status-warning/10 border border-status-warning/20 flex items-center justify-center mx-auto mb-5">
            <Timer size={28} className="text-status-warning" />
          </div>

          <h1 className="font-display font-bold text-xl uppercase tracking-tight text-brand-text-primary mb-2">
            Session Expired
          </h1>
          <p className="text-xs text-brand-text-muted leading-relaxed mb-8 max-w-sm mx-auto">
            Your session has expired due to inactivity. For security purposes, we automatically sign you out after a period of inactivity. Please sign in again to continue.
          </p>

          <motion.button
            onClick={() => navigate("/platformsignin")}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            className="w-full bg-brand-gold hover:bg-brand-gold-hover text-brand-bg-secondary rounded-xl py-3 text-xs font-bold uppercase tracking-widest shadow-md transition-all duration-200 cursor-pointer flex items-center justify-center gap-2"
          >
            Sign In
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}
