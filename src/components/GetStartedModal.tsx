import { motion, AnimatePresence } from "motion/react";
import { useNavigate } from "react-router-dom";
import { Building2, LogIn, Vote, X } from "lucide-react";
import TextureBg from "./TextureBg";

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function GetStartedModal({ open, onClose }: Props) {
  const navigate = useNavigate();

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            onClick={(e) => e.stopPropagation()}
            className="glass-card rounded-3xl p-8 md:p-10 w-full max-w-md shadow-2xl relative overflow-hidden"
          >
            <TextureBg src="https://images.unsplash.com/photo-1771924310799-930349452c76?q=80&w=1600&auto=format&fit=crop" opacity={0.2} />
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-xl font-display font-bold uppercase text-brand-text-primary">
                  Get Started
                </h2>
                <p className="text-sm text-brand-text-muted mt-1">
                  What would you like to do?
                </p>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-brand-surface border border-brand-border flex items-center justify-center hover:bg-brand-surface-elevated transition-colors cursor-pointer"
              >
                <X size={16} className="text-brand-text-muted" />
              </button>
            </div>

            <div className="grid gap-4">
              <button
                onClick={() => { onClose(); navigate("/org/register"); }}
                className="group flex items-center gap-4 p-5 rounded-2xl border border-brand-border bg-brand-surface hover:bg-brand-surface-elevated shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer text-left"
              >
                <div className="w-12 h-12 rounded-xl bg-brand-gold/10 group-hover:bg-brand-gold/20 flex items-center justify-center shrink-0">
                  <Building2 size={22} className="text-brand-gold transition-colors" />
                </div>
                <div>
                  <div className="text-sm font-bold uppercase tracking-wider text-brand-text-primary">Register Your Organization</div>
                  <div className="text-xs text-brand-text-muted mt-0.5">
                    Set up your organization on Orivis to start creating secure governance campaigns.
                  </div>
                </div>
              </button>

              <button
                onClick={() => { onClose(); navigate("/org/signin"); }}
                className="group flex items-center gap-4 p-5 rounded-2xl border border-brand-border bg-brand-surface hover:bg-brand-surface-elevated shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer text-left"
              >
                <div className="w-12 h-12 rounded-xl bg-brand-gold/10 group-hover:bg-brand-gold/20 flex items-center justify-center shrink-0">
                  <LogIn size={22} className="text-brand-gold transition-colors" />
                </div>
                <div>
                  <div className="text-sm font-bold uppercase tracking-wider text-brand-text-primary">Sign In to Your Organization</div>
                  <div className="text-xs text-brand-text-muted mt-0.5">
                    Access your organization's admin console, manage elections, and view results.
                  </div>
                </div>
              </button>

              <button
                onClick={() => { onClose(); navigate("/governance"); }}
                className="group flex items-center gap-4 p-5 rounded-2xl border border-brand-border bg-brand-surface hover:bg-brand-surface-elevated shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer text-left"
              >
                <div className="w-12 h-12 rounded-xl bg-brand-gold/10 group-hover:bg-brand-gold/20 flex items-center justify-center shrink-0">
                  <Vote size={22} className="text-brand-gold transition-colors" />
                </div>
                <div>
                  <div className="text-sm font-bold uppercase tracking-wider text-brand-text-primary">Participate in an Election</div>
                  <div className="text-xs text-brand-text-muted mt-0.5">
                    Cast your vote in an election you are eligible for. Quick and private.
                  </div>
                </div>
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
