import { motion } from "motion/react";
import { CheckCircle, XCircle, AlertTriangle, Clock, Mail, Shield } from "lucide-react";

type AuthCardState = "idle" | "loading" | "success" | "error" | "warning" | "info";

interface AuthCardProps {
  children: React.ReactNode;
  className?: string;
}

export function AuthCard({ children, className = "" }: AuthCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className={`w-full max-w-md glass-card rounded-2xl p-8 shadow-[0_32px_64px_rgba(0,0,0,0.4)] ${className}`}
    >
      {children}
    </motion.div>
  );
}

interface AuthStateCardProps {
  state: AuthCardState;
  title: string;
  message: string;
  action?: React.ReactNode;
}

const stateConfig = {
  success: { icon: CheckCircle, color: "text-status-success", bg: "bg-status-success/10 border-status-success/20" },
  error: { icon: XCircle, color: "text-status-danger", bg: "bg-status-danger/10 border-status-danger/20" },
  warning: { icon: AlertTriangle, color: "text-status-warning", bg: "bg-status-warning/10 border-status-warning/20" },
  info: { icon: Clock, color: "text-status-info", bg: "bg-status-info/10 border-status-info/20" },
  loading: { icon: Shield, color: "text-brand-text-muted", bg: "bg-brand-surface border-brand-border" },
  idle: { icon: Mail, color: "text-brand-text-muted", bg: "bg-brand-surface border-brand-border" },
};

export function AuthStateCard({ state, title, message, action }: AuthStateCardProps) {
  const config = stateConfig[state];
  const IconComponent = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className={`p-6 rounded-2xl border ${config.bg} text-center flex flex-col items-center gap-3`}
    >
      {state === "loading" ? (
        <svg className="animate-spin h-10 w-10 text-brand-gold" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      ) : (
        <IconComponent className={`h-10 w-10 ${config.color}`} />
      )}
      <h3 className="text-sm font-bold uppercase tracking-wider text-brand-text-primary">{title}</h3>
      <p className="text-xs text-brand-text-muted leading-relaxed max-w-sm">{message}</p>
      {action && <div className="mt-2">{action}</div>}
    </motion.div>
  );
}

interface AuthFormWrapperProps {
  children: React.ReactNode;
  onSubmit: (e: React.FormEvent) => void;
  className?: string;
}

export function AuthFormWrapper({ children, onSubmit, className = "" }: AuthFormWrapperProps) {
  return (
    <form onSubmit={onSubmit} className={`space-y-3.5 ${className}`}>
      {children}
    </form>
  );
}
