import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

interface PasswordFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  showStrength?: boolean;
}

export default function PasswordField({
  id, label, value, onChange, placeholder = "Enter your password", disabled, error, showStrength
}: PasswordFieldProps) {
  const [showPassword, setShowPassword] = useState(false);

  const getStrength = (): { label: string; color: string; width: string } => {
    if (!value) return { label: "", color: "", width: "0%" };
    let score = 0;
    if (value.length >= 8) score++;
    if (value.length >= 12) score++;
    if (/[A-Z]/.test(value)) score++;
    if (/[a-z]/.test(value)) score++;
    if (/[0-9]/.test(value)) score++;
    if (/[^A-Za-z0-9]/.test(value)) score++;
    if (score <= 2) return { label: "Weak", color: "bg-status-danger", width: "25%" };
    if (score <= 3) return { label: "Fair", color: "bg-status-warning", width: "50%" };
    if (score <= 4) return { label: "Good", color: "bg-event-live", width: "75%" };
    return { label: "Strong", color: "bg-status-success", width: "100%" };
  };

  const strength = getStrength();

  return (
    <div>
      <label htmlFor={id} className="block text-[10px] font-mono uppercase tracking-wider text-brand-text-muted font-bold mb-1">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          name="password"
          type={showPassword ? "text" : "password"}
          required
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className={`w-full bg-brand-bg-secondary/50 border ${error ? "border-status-danger" : "border-brand-border"} rounded-xl px-4 py-2.5 text-xs text-brand-text-primary placeholder-brand-text-disabled focus:outline-none focus:border-brand-gold focus:bg-brand-surface transition-all font-medium pr-10 disabled:opacity-50`}
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
      {error && (
        <p className="text-[10px] text-status-danger mt-1 font-semibold">{error}</p>
      )}
      {showStrength && value && (
        <div className="mt-2">
          <div className="h-1 bg-brand-border rounded-full overflow-hidden">
            <div className={`h-full ${strength.color} rounded-full transition-all duration-300`} style={{ width: strength.width }} />
          </div>
          <p className={`text-[9px] font-mono mt-1 ${strength.color.replace("bg-", "text-")}`}>
            {strength.label}
          </p>
        </div>
      )}
    </div>
  );
}
