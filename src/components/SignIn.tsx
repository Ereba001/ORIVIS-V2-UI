import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { Eye, EyeOff } from "lucide-react";
import LoadingOverlay from "./LoadingOverlay";
import { useAuth } from "../hooks/useAuth";

interface SignInProps {
  onSuccess: () => void;
  variant: "platform" | "organization";
  compact?: boolean;
}

export default function SignIn({ onSuccess, variant, compact }: SignInProps) {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showLoading, setShowLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!email.trim()) {
      setErrorMessage("Please enter your email address.");
      return;
    }
    if (!password) {
      setErrorMessage("Please enter your password.");
      return;
    }

    setIsSubmitting(true);
    setShowLoading(true);

    try {
      await login(email.trim(), password);
      onSuccess();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Sign in failed. Please check your credentials.";
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
      setShowLoading(false);
    }
  };

  const getStatusText = () => {
    if (email && password) {
      return "Ready to Sign In";
    }
    if (email || password) {
      return "Awaiting Input Validation";
    }
    return "Secure Connection Established";
  };

  const formContent = (
    <>
      <div className="text-center mb-4">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-mono font-medium status-badge-default">
          <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
          {getStatusText()}
        </div>
        <h1 className="font-display font-bold text-xl uppercase tracking-tight text-brand-text-primary mt-3">
          {variant === "platform" ? "Platform Sign In" : "Organization Sign In"}
        </h1>
        <p className="text-xs text-brand-text-muted mt-1">
          {variant === "platform"
            ? "Sign in to access the ORIVIS Platform Console."
            : "Sign in to your organization's workspace."}
        </p>
      </div>

      {errorMessage && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 p-3 bg-status-error/10 border border-status-error/20 rounded-xl text-status-error text-[11px] font-semibold"
        >
          {errorMessage}
        </motion.div>
      )}

      <form onSubmit={handleSignIn} className="space-y-2">
        <div>
          <label htmlFor="email" className="block text-[10px] font-mono uppercase tracking-wider text-brand-text-muted font-bold mb-1">
            Email Address
          </label>
          <input
            id="email"
            type="email"
            required
            autoComplete="username"
            placeholder="Enter your registered email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-brand-bg-secondary/50 border border-brand-border rounded-xl px-4 py-3 text-xs text-brand-text-primary placeholder-brand-text-disabled focus:outline-none focus:border-brand-gold focus:bg-brand-surface transition-all font-medium"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-[10px] font-mono uppercase tracking-wider text-brand-text-muted font-bold mb-1">
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              required
              autoComplete="current-password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-brand-bg-secondary/50 border border-brand-border rounded-xl px-4 py-3 text-xs text-brand-text-primary placeholder-brand-text-disabled focus:outline-none focus:border-brand-gold focus:bg-brand-surface transition-all font-medium pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-brand-text-muted hover:text-brand-text-primary cursor-pointer"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
        </div>

        <div className="flex justify-center pt-1">
          <motion.button
            type="submit"
            disabled={isSubmitting}
            whileHover={isSubmitting ? {} : { scale: 1.03 }}
            whileTap={isSubmitting ? {} : { scale: 0.97 }}
            className="w-full max-w-[240px] bg-brand-gold hover:bg-brand-gold-hover text-brand-bg-secondary rounded-full py-2.5 px-8 text-xs font-bold uppercase tracking-widest shadow-brand-gold transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isSubmitting ? <span>Authenticating...</span> : <span>Sign In</span>}
          </motion.button>
        </div>
      </form>

      <div className="mt-3 flex flex-col items-center gap-1.5">
        {variant === "organization" && (
          <button
            type="button"
            onClick={() => navigate("/org/forgot-password")}
            className="text-[11px] text-brand-text-muted hover:text-brand-gold transition-colors cursor-pointer"
          >
            Forgot Password?
          </button>
        )}
        <p className="text-[11px] text-brand-text-muted">
          {variant === "platform" ? (
            <>Contact your platform administrator to reset your password.</>
          ) : (
            <>New to ORIVIS?{" "}
              <button type="button" onClick={() => navigate("/org/register")} className="text-brand-gold hover:underline font-semibold cursor-pointer">
                Register Organization
              </button>
            </>
          )}
        </p>
      </div>
    </>
  );

  if (compact) {
    return (
      <div className="relative">
        {showLoading && <LoadingOverlay showLogo={variant !== "organization"} messages={["Authenticating your credentials...", "Connecting to secure server...", "Loading your dashboard..."]} />}
        {formContent}
      </div>
    );
  }

  return (
    <div className="relative flex items-center justify-center">
        {showLoading && <LoadingOverlay showLogo={variant !== "organization"} messages={["Authenticating your credentials...", "Connecting to secure server...", "Loading your dashboard..."]} />}

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md"
      >
        <div className="glass-card rounded-2xl p-6 sm:p-10 shadow-lg">
          {formContent}
        </div>
      </motion.div>
    </div>
  );
}
