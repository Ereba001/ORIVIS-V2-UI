import { useState, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { Upload, ArrowLeft, ArrowRight, Sun, Moon } from "lucide-react";
import SeoHead from "../components/SeoHead";
import AuthLayout from "../components/auth/AuthLayout";
import AuthHeroIllustration from "../components/auth/AuthHeroIllustration";
import { AuthCard, AuthStateCard, AuthFormWrapper } from "../components/auth/AuthCard";
import PasswordField from "../components/auth/PasswordField";
import PhoneInput from "../components/PhoneInput";
import SearchableSelect from "../components/SearchableSelect";
import { COUNTRY_OPTIONS, COUNTRY_STATES } from "../constants/countries";
import { authService } from "../services/auth-service";
import { authTokens } from "../lib/auth";

type OrgStep = "details" | "branding" | "review" | "submitting" | "success";

const MAX_LOGO_SIZE = 2 * 1024 * 1024; // 2MB

interface OrgFormData {
  organizationName: string;
  shortName: string;
  category: string;
  contactEmail: string;
  phoneCode: string;
  phoneNumber: string;
  website: string;
  country: string;
  stateRegion: string;
  tagline: string;
  logoUrl: string;
  logoFile: File | null;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  password: string;
  confirmPassword: string;
  acceptedTerms: boolean;
}

const initialFormData: OrgFormData = {
  organizationName: "",
  shortName: "",
  category: "",
  contactEmail: "",
  phoneCode: "+234 (NGA)",
  phoneNumber: "",
  website: "",
  country: "",
  stateRegion: "",
  tagline: "",
  logoUrl: "",
  logoFile: null,
  primaryColor: "#FCA311",
  secondaryColor: "#FFFFFF",
  accentColor: "#3B82F6",
  password: "",
  confirmPassword: "",
  acceptedTerms: false,
};

const CATEGORIES = [
  "Academic / Education",
  "Government / Public Sector",
  "Corporate / Business",
  "Civic / Non-Profit",
  "Religious",
  "Sports / Recreation",
  "Professional Association",
  "Trade Union / Labor",
  "Community Organization",
  "Other",
];

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function hexToHsl(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g) h = ((b - r) / d + 2) / 6;
    else h = ((r - g) / d + 4) / 6;
  }
  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}

function hslToHex(h: number, s: number, l: number): string {
  s /= 100; l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

function autoDarkColor(hex: string): string {
  const [h, s, l] = hexToHsl(hex);
  if (l <= 25) return hex;
  const newL = Math.max(12, Math.round(l * 0.35));
  return hslToHex(h, Math.min(100, s + 5), newL);
}

function autoDarkSecondary(hex: string): string {
  const [h, s, l] = hexToHsl(hex);
  if (l >= 50) return hslToHex(h, Math.min(100, s + 5), 12);
  return hex;
}

export default function OrgRegistrationPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<OrgStep>("details");
  const [formData, setFormData] = useState<OrgFormData>(initialFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [previewDark, setPreviewDark] = useState(false);
  const [darkPrimary, setDarkPrimary] = useState("#FCA311");
  const [darkSecondary, setDarkSecondary] = useState("#0f172a");
  const [darkAccent, setDarkAccent] = useState("#3B82F6");
  const [autoDark, setAutoDark] = useState(true);

  const regenerateDark = useCallback((primary: string, secondary: string, accent: string) => {
    setDarkPrimary(autoDarkColor(primary));
    setDarkSecondary(autoDarkSecondary(secondary));
    setDarkAccent(autoDarkColor(accent));
  }, []);

  const previewPrimary = previewDark ? darkPrimary : formData.primaryColor;
  const previewSecondary = previewDark ? darkSecondary : formData.secondaryColor;
  const previewAccent = previewDark ? darkAccent : formData.accentColor;
  const previewBg = previewDark ? '#0f172a' : '#f1f5f9';
  const previewSurface = previewDark ? '#1e293b' : '#ffffff';
  const previewText = previewDark ? '#f1f5f9' : '#0f172a';
  const previewTextMuted = previewDark ? '#94a3b8' : '#64748b';

  const updateField = <K extends keyof OrgFormData>(key: K, value: OrgFormData[K]) => {
    setFormData((prev) => {
      const next = { ...prev, [key]: value };
      if (autoDark && (key === 'primaryColor' || key === 'secondaryColor' || key === 'accentColor')) {
        regenerateDark(
          key === 'primaryColor' ? (value as string) : prev.primaryColor,
          key === 'secondaryColor' ? (value as string) : prev.secondaryColor,
          key === 'accentColor' ? (value as string) : prev.accentColor,
        );
      }
      return next;
    });
    setErrors((prev) => ({ ...prev, [key]: "" }));
  };

  const validateDetails = (): boolean => {
    const e: Record<string, string> = {};
    if (!formData.organizationName.trim()) e.organizationName = "Organization name is required";
    if (!formData.shortName.trim()) e.shortName = "Short name is required";
    else if (formData.shortName.length > 15) e.shortName = "Max 15 characters";
    if (!formData.category) e.category = "Category is required";
    if (!formData.contactEmail.trim()) e.contactEmail = "Contact email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contactEmail)) e.contactEmail = "Invalid email";
    if (!formData.phoneNumber.trim()) e.phoneNumber = "Phone number is required";
    if (!formData.country) e.country = "Country is required";
    if (!formData.password) e.password = "Password is required";
    else if (formData.password.length < 8) e.password = "At least 8 characters required";
    if (!formData.confirmPassword) e.confirmPassword = "Please confirm your password";
    else if (formData.password !== formData.confirmPassword) e.confirmPassword = "Passwords do not match";
    if (!formData.acceptedTerms) e.acceptedTerms = "You must accept the terms";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step === "details") {
      if (!validateDetails()) return;
      setStep("branding");
      return;
    }
    if (step === "branding") {
      setStep("review");
      return;
    }
    if (step === "review") {
      if (!formData.acceptedTerms) {
        setErrors({ acceptedTerms: "You must accept the terms and conditions" });
        return;
      }
      setStep("submitting");
      setErrors({});
      try {
        const logoUrl = formData.logoFile
          ? await fileToDataUrl(formData.logoFile)
          : formData.logoUrl || null;

        const response = await authService.register({
          email: formData.contactEmail,
          username: formData.shortName.toLowerCase().replace(/\s+/g, "_"),
          displayName: formData.organizationName,
          password: formData.password,
          organizationName: formData.organizationName,
          organizationType: formData.category,
          phone: `${formData.phoneCode.replace(/\D/g, "")}${formData.phoneNumber.replace(/\D/g, "")}`,
          country: formData.country,
          state: formData.stateRegion,
          primaryColor: formData.primaryColor,
          secondaryColor: formData.secondaryColor,
          accentColor: formData.accentColor,
          logoUrl: logoUrl ?? undefined,
          tagline: formData.tagline || undefined,
        });
        if (!response?.accessToken) {
          throw new Error('Registration succeeded but authentication failed. Please sign in.')
        }
        authTokens.setTokens(response.accessToken);
        setStep("success");
      } catch (err) {
        const message = err instanceof Error ? err.message : "Something went wrong. Please try again.";
        setErrors({ submit: message });
        setStep("review");
      }
    }
  };

  if (step === "success") {
    return (
      <div className="min-h-screen bg-brand-bg flex items-center justify-center p-6">
        <SeoHead meta={{ title: "Organization Created — ORIVIS", noindex: true }} />
        <AuthCard>
          <AuthStateCard
            state="success"
            title="Organization Created"
            message={`${formData.organizationName} has been registered. We've sent a verification email to ${formData.contactEmail}. Please verify your email to continue.`}
            action={
              <button
                onClick={() => navigate(`/verify-email?email=${encodeURIComponent(formData.contactEmail)}&org=${encodeURIComponent(formData.shortName)}`)}
                className="bg-brand-gold text-brand-bg-secondary rounded-xl py-2.5 px-6 text-xs font-bold uppercase tracking-widest hover:bg-brand-gold-hover transition-colors cursor-pointer"
              >
                Check Your Email
              </button>
            }
          />
        </AuthCard>
      </div>
    );
  }

  return (
    <AuthLayout
      title="Register Organization"
      subtitle="Set up your organization on ORIVIS."
      variant="organization"
      heroContent={
        step !== "submitting" ? (
          <>
            <div className="mb-6">
              <AuthHeroIllustration variant="organization" />
            </div>
            <h2 className="text-3xl font-display font-bold text-white mb-3">Register Your Organization</h2>
            <p className="text-sm text-white/60 leading-relaxed">
              {step === "details" && "Tell us about your organization to get started."}
              {step === "branding" && "Customize your organization's look and feel with your logo and brand colors."}
              {step === "review" && "Review your organization details before submitting."}
            </p>
          </>
        ) : null
      }
    >
      <SeoHead meta={{ title: "Register Organization — ORIVIS", noindex: true }} />
      <AuthCard className="!shadow-none !bg-transparent !border-none !p-0 !backdrop-blur-none !max-w-none">
        <div className="flex items-center gap-2 mb-6">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-mono font-bold transition-all ${
                (step === "details" && s === 1) || (step === "branding" && s <= 2) || (step === "review" && s <= 3)
                  ? "bg-brand-gold text-brand-bg-secondary"
                  : "bg-brand-border text-brand-text-disabled"
              }`}>
                {s}
              </div>
              {s < 3 && <div className={`flex-1 h-px ${(step === "branding" && s >= 1) || (step === "review" && s >= 1) ? "bg-brand-gold" : "bg-brand-border"}`} />}
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {step === "details" && (
            <motion.div key="details" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} transition={{ duration: 0.2 }}>
              <AuthFormWrapper onSubmit={handleSubmit}>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2 sm:col-span-1">
                      <label htmlFor="organizationName" className="block text-[10px] font-mono uppercase tracking-wider text-brand-text-muted font-bold mb-1">Organization Name</label>
                      <input type="text" id="organizationName" name="organizationName" required placeholder="Use your organization's official registered name" value={formData.organizationName}
                        onChange={(e) => updateField("organizationName", e.target.value)}
                        className={`w-full bg-brand-bg-secondary/50 border ${errors.organizationName ? "border-status-danger" : "border-brand-border"} rounded-xl px-4 py-2.5 text-xs text-brand-text-primary placeholder-brand-text-disabled focus:outline-none focus:border-brand-gold focus:bg-brand-surface transition-all font-medium`} />
                      {errors.organizationName && <p className="text-[10px] text-status-danger mt-1 font-semibold">{errors.organizationName}</p>}
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <label htmlFor="shortName" className="block text-[10px] font-mono uppercase tracking-wider text-brand-text-muted font-bold mb-1">Short Name</label>
                      <input type="text" id="shortName" name="shortName" required placeholder="Short name your members recognize (max 15 characters)" maxLength={15} value={formData.shortName}
                        onChange={(e) => updateField("shortName", e.target.value.toUpperCase())}
                        className={`w-full bg-brand-bg-secondary/50 border ${errors.shortName ? "border-status-danger" : "border-brand-border"} rounded-xl px-4 py-2.5 text-xs text-brand-text-primary placeholder-brand-text-disabled focus:outline-none focus:border-brand-gold focus:bg-brand-surface transition-all font-medium uppercase`} />
                      {errors.shortName && <p className="text-[10px] text-status-danger mt-1 font-semibold">{errors.shortName}</p>}
                    </div>
                  </div>

                  <div>
                    <label htmlFor="category" className="block text-[10px] font-mono uppercase tracking-wider text-brand-text-muted font-bold mb-1">Category</label>
                    <select id="category" name="category" required value={formData.category}
                      onChange={(e) => updateField("category", e.target.value)}
                      className={`w-full bg-brand-bg-secondary/50 border ${errors.category ? "border-status-danger" : "border-brand-border"} rounded-xl px-4 py-2.5 text-xs text-brand-text-primary focus:outline-none focus:border-brand-gold focus:bg-brand-surface transition-all`}>
                      <option value="">Select category</option>
                      {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                    {errors.category && <p className="text-[10px] text-status-danger mt-1 font-semibold">{errors.category}</p>}
                  </div>

                  <div>
                    <label htmlFor="tagline" className="block text-[10px] font-mono uppercase tracking-wider text-brand-text-muted font-bold mb-1">Tagline</label>
                    <input type="text" id="tagline" name="tagline" placeholder="A short tagline for your organization (e.g. Empowering communities)" maxLength={100} value={formData.tagline}
                      onChange={(e) => updateField("tagline", e.target.value)}
                      className="w-full bg-brand-bg-secondary/50 border border-brand-border rounded-xl px-4 py-2.5 text-xs text-brand-text-primary placeholder-brand-text-disabled focus:outline-none focus:border-brand-gold focus:bg-brand-surface transition-all font-medium" />
                    <p className="text-[9px] text-brand-text-muted mt-1">Displayed under your organization name. Optional.</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="contactEmail" className="block text-[10px] font-mono uppercase tracking-wider text-brand-text-muted font-bold mb-1">Contact Email</label>
                      <input type="email" id="contactEmail" name="contactEmail" required placeholder="Use your organization's official email address" value={formData.contactEmail}
                        onChange={(e) => updateField("contactEmail", e.target.value)}
                        className={`w-full bg-brand-bg-secondary/50 border ${errors.contactEmail ? "border-status-danger" : "border-brand-border"} rounded-xl px-4 py-2.5 text-xs text-brand-text-primary placeholder-brand-text-disabled focus:outline-none focus:border-brand-gold focus:bg-brand-surface transition-all font-medium`} />
                      {errors.contactEmail && <p className="text-[10px] text-status-danger mt-1 font-semibold">{errors.contactEmail}</p>}
                    </div>
                    <div>
                      <PhoneInput
                        code={formData.phoneCode}
                        number={formData.phoneNumber}
                        onCodeChange={(v) => updateField("phoneCode", v)}
                        onNumberChange={(v) => updateField("phoneNumber", v)}
                        codeError={errors.phoneCode}
                        numberError={errors.phoneNumber}
                        numberRequired
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="website" className="block text-[10px] font-mono uppercase tracking-wider text-brand-text-muted font-bold mb-1">Website</label>
                      <input type="url" id="website" name="website" placeholder="Paste your organization's website URL (if any)" value={formData.website}
                        onChange={(e) => updateField("website", e.target.value)}
                        className="w-full bg-brand-bg-secondary/50 border border-brand-border rounded-xl px-4 py-2.5 text-xs text-brand-text-primary placeholder-brand-text-disabled focus:outline-none focus:border-brand-gold focus:bg-brand-surface transition-all font-medium" />
                    </div>
                    <div>
                      <label htmlFor="country" className="block text-[10px] font-mono uppercase tracking-wider text-brand-text-muted font-bold mb-1">Country</label>
                      <select id="country" name="country" required value={formData.country}
                        onChange={(e) => {
                          updateField("country", e.target.value)
                          if (!(COUNTRY_STATES[e.target.value] ?? []).includes(formData.stateRegion)) {
                            updateField("stateRegion", "")
                          }
                        }}
                        className={`w-full bg-brand-bg-secondary/50 border ${errors.country ? "border-status-danger" : "border-brand-border"} rounded-xl px-4 py-2.5 text-xs text-brand-text-primary focus:outline-none focus:border-brand-gold focus:bg-brand-surface transition-all`}>
                        <option value="">Select country</option>
                        {COUNTRY_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
                      </select>
                      {errors.country && <p className="text-[10px] text-status-danger mt-1 font-semibold">{errors.country}</p>}
                    </div>
                  </div>

                  <div>
                    <label htmlFor="stateRegion" className="block text-[10px] font-mono uppercase tracking-wider text-brand-text-muted font-bold mb-1">State / Region</label>
                    {COUNTRY_STATES[formData.country]?.length ? (
                      <SearchableSelect
                        options={COUNTRY_STATES[formData.country].map((s) => ({ value: s, label: s }))}
                        value={formData.stateRegion}
                        onChange={(v) => updateField("stateRegion", v)}
                        placeholder="Select state / region"
                      />
                    ) : (
                      <input
                        type="text"
                        id="stateRegion"
                        name="stateRegion"
                        placeholder={formData.country ? "Enter your state / region" : "Select a country first to see available states"}
                        value={formData.stateRegion}
                        onChange={(e) => updateField("stateRegion", e.target.value)}
                        className="w-full bg-brand-bg-secondary/50 border border-brand-border rounded-xl px-4 py-2.5 text-xs text-brand-text-primary placeholder-brand-text-disabled focus:outline-none focus:border-brand-gold focus:bg-brand-surface transition-all font-medium"
                      />
                    )}
                  </div>

                  <div className="pt-4 border-t border-brand-border">
                    <p className="text-[9px] font-mono uppercase tracking-wider text-brand-text-muted font-bold mb-3">Account Security</p>
                    <p className="text-[10px] text-brand-text-muted mb-3 leading-relaxed">
                      Sign in with <strong className="text-brand-text-primary">{formData.contactEmail || 'your contact email'}</strong> after registration.
                    </p>

                    <PasswordField
                      id="regPassword"
                      label="Password"
                      value={formData.password}
                      onChange={(v) => updateField("password", v)}
                      placeholder="Create a strong password"
                      error={errors.password}
                      showStrength
                    />

                    {formData.password && (
                      <div className="mt-2 mb-3 space-y-1">
                        {[
                          { label: "At least 8 characters", test: (v: string) => v.length >= 8 },
                          { label: "One uppercase letter", test: (v: string) => /[A-Z]/.test(v) },
                          { label: "One lowercase letter", test: (v: string) => /[a-z]/.test(v) },
                          { label: "One number", test: (v: string) => /[0-9]/.test(v) },
                          { label: "One special character", test: (v: string) => /[^A-Za-z0-9]/.test(v) },
                        ].map((c) => {
                          const passed = c.test(formData.password)
                          return (
                            <div key={c.label} className="flex items-center gap-1.5">
                              {passed ? (
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="text-status-success shrink-0"><polyline points="20 6 9 17 4 12" /></svg>
                              ) : (
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="text-status-danger shrink-0"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                              )}
                              <span className={`text-[10px] ${passed ? 'text-status-success' : 'text-brand-text-muted'}`}>
                                {c.label}
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    )}

                    <PasswordField
                      id="regConfirmPassword"
                      label="Confirm Password"
                      value={formData.confirmPassword}
                      onChange={(v) => updateField("confirmPassword", v)}
                      placeholder="Re-enter your password"
                      error={errors.confirmPassword}
                    />

                    <div className="flex items-start gap-2.5 mt-4">
                      <input
                        id="terms"
                        type="checkbox"
                        name="acceptedTerms"
                        checked={formData.acceptedTerms}
                        onChange={(e) => updateField("acceptedTerms", e.target.checked)}
                        className="mt-0.5 accent-brand-gold cursor-pointer"
                      />
                      <label htmlFor="terms" className="text-[10px] text-brand-text-muted leading-relaxed cursor-pointer">
                        I confirm that the information provided is accurate and I have the authority to register this organization. I agree to the{" "}
                        <Link to="/terms" target="_blank" className="text-brand-gold hover:underline">Terms of Service</Link>{" "}
                        and <Link to="/privacy" target="_blank" className="text-brand-gold hover:underline">Privacy Policy</Link>.
                      </label>
                    </div>
                    {errors.acceptedTerms && <p className="text-[10px] text-status-danger mt-1 font-semibold">{errors.acceptedTerms}</p>}
                  </div>
                </div>

                <motion.button type="submit" whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                  className="w-full bg-brand-gold hover:bg-brand-gold-hover text-brand-bg-secondary rounded-xl py-3 text-xs font-bold uppercase tracking-widest shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 mt-3">
                  Continue <ArrowRight size={13} />
                </motion.button>
              </AuthFormWrapper>
            </motion.div>
          )}

          {step === "branding" && (
            <motion.div key="branding" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} transition={{ duration: 0.2 }}>
              <form onSubmit={handleSubmit} className="space-y-3.5">
                <p className="text-[10px] font-mono uppercase tracking-wider text-brand-text-muted font-bold mb-3">Upload your logo and choose your brand colors</p>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Left: Form controls */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-mono uppercase tracking-wider text-brand-text-muted font-bold mb-1">Logo</label>
                      <div className="flex gap-3">
                        <div className="w-16 h-16 rounded-xl border border-dashed border-brand-border bg-brand-bg-secondary/50 flex items-center justify-center shrink-0 overflow-hidden"
                          style={formData.logoUrl || formData.logoFile ? { borderStyle: "solid", backgroundColor: formData.primaryColor + "20" } : {}}>
                          {formData.logoFile ? (
                            <img src={URL.createObjectURL(formData.logoFile)} alt="Logo preview" className="w-full h-full object-contain" />
                          ) : formData.logoUrl ? (
                            <img src={formData.logoUrl} alt="Logo preview" className="w-full h-full object-contain" />
                          ) : (
                            <Upload size={18} className="text-brand-text-disabled" />
                          )}
                        </div>
                        <div className="flex-1 space-y-2.5">
                          <label className="flex flex-col items-center justify-center gap-1.5 cursor-pointer bg-brand-bg-secondary/50 border border-dashed border-brand-border rounded-xl px-4 py-3 text-xs text-brand-text-muted hover:border-brand-gold hover:bg-brand-surface transition-all">
                            <Upload size={16} className="text-brand-text-disabled" />
                            <span className="font-semibold text-[11px]">{formData.logoFile ? formData.logoFile.name : "Click to upload logo"}</span>
                            {!formData.logoFile && (
                              <div className="flex gap-1.5 mt-0.5">
                                {["JPG", "PNG", "SVG", "WebP"].map((t) => (
                                  <span key={t} className="text-[8px] font-mono px-1.5 py-0.5 rounded bg-brand-surface border border-brand-border text-brand-text-disabled uppercase">{t}</span>
                                ))}
                              </div>
                            )}
                            <input
                              type="file"
                              name="logoFile"
                              accept=".jpg,.jpeg,.png,.svg,.webp"
                              onChange={(e) => {
                                const file = e.target.files?.[0]
                                if (file) {
                                  if (file.size > MAX_LOGO_SIZE) {
                                    setErrors((prev) => ({ ...prev, logoFile: `File exceeds ${MAX_LOGO_SIZE / 1024 / 1024}MB limit` }))
                                    return
                                  }
                                  setErrors((prev) => ({ ...prev, logoFile: "" }))
                                  updateField("logoFile", file)
                                  updateField("logoUrl", "")
                                }
                              }}
                              className="hidden"
                            />
                          </label>
                          {errors.logoFile && <p className="text-[10px] text-status-danger font-semibold">{errors.logoFile}</p>}
                          {formData.logoFile && (
                            <p className="text-[9px] text-brand-text-muted text-center">
                              {(formData.logoFile.size / 1024).toFixed(1)} KB / {MAX_LOGO_SIZE / 1024 / 1024} MB
                            </p>
                          )}
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-px bg-brand-border" />
                            <span className="text-[8px] font-mono uppercase tracking-wider text-brand-text-muted">or paste URL</span>
                            <div className="flex-1 h-px bg-brand-border" />
                          </div>
                          <input type="text" name="logoUrl" placeholder="Paste a direct link to your logo image" aria-label="Organization logo URL" value={formData.logoUrl}
                            onChange={(e) => {
                              updateField("logoUrl", e.target.value)
                              if (e.target.value) updateField("logoFile", null)
                            }}
                            className="w-full bg-brand-bg-secondary/50 border border-brand-border rounded-xl px-3 py-2 text-[11px] text-brand-text-primary placeholder-brand-text-disabled focus:outline-none focus:border-brand-gold focus:bg-brand-surface transition-all font-medium" />
                        </div>
                      </div>
                    </div>

                    {/* Light mode colors */}
                    <div>
                      <p className="text-[10px] font-mono uppercase tracking-wider text-brand-text-muted font-bold mb-2">Light Mode Colors</p>
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label htmlFor="primaryColor" className="block text-[9px] font-mono text-brand-text-muted mb-1">Primary</label>
                          <input type="color" id="primaryColor" name="primaryColor" value={formData.primaryColor}
                            onChange={(e) => updateField("primaryColor", e.target.value)}
                            className="w-full h-10 rounded-xl border border-brand-border bg-transparent cursor-pointer" />
                          <p className="text-[8px] font-mono text-brand-text-muted mt-0.5 text-center">{formData.primaryColor}</p>
                        </div>
                        <div>
                          <label htmlFor="secondaryColor" className="block text-[9px] font-mono text-brand-text-muted mb-1">Secondary</label>
                          <input type="color" id="secondaryColor" name="secondaryColor" value={formData.secondaryColor}
                            onChange={(e) => updateField("secondaryColor", e.target.value)}
                            className="w-full h-10 rounded-xl border border-brand-border bg-transparent cursor-pointer" />
                          <p className="text-[8px] font-mono text-brand-text-muted mt-0.5 text-center">{formData.secondaryColor}</p>
                        </div>
                        <div>
                          <label htmlFor="accentColor" className="block text-[9px] font-mono text-brand-text-muted mb-1">Accent</label>
                          <input type="color" id="accentColor" name="accentColor" value={formData.accentColor}
                            onChange={(e) => updateField("accentColor", e.target.value)}
                            className="w-full h-10 rounded-xl border border-brand-border bg-transparent cursor-pointer" />
                          <p className="text-[8px] font-mono text-brand-text-muted mt-0.5 text-center">{formData.accentColor}</p>
                        </div>
                      </div>
                    </div>

                    {/* Dark mode colors */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-[10px] font-mono uppercase tracking-wider text-brand-text-muted font-bold">Dark Mode Colors</p>
                        <button type="button" onClick={() => { setAutoDark(!autoDark); if (!autoDark) regenerateDark(formData.primaryColor, formData.secondaryColor, formData.accentColor) }}
                          className={`text-[9px] font-bold px-2 py-1 rounded-lg transition-all ${autoDark ? 'bg-brand-gold/20 text-brand-gold' : 'bg-brand-surface-elevated text-brand-text-muted hover:text-brand-text-primary'}`}>
                          {autoDark ? 'Auto' : 'Manual'}
                        </button>
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="block text-[9px] font-mono text-brand-text-muted mb-1">Primary</label>
                          <input type="color" value={darkPrimary} disabled={autoDark}
                            onChange={(e) => { setDarkPrimary(e.target.value); setAutoDark(false) }}
                            className="w-full h-10 rounded-xl border border-brand-border bg-transparent cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed" />
                          <p className="text-[8px] font-mono text-brand-text-muted mt-0.5 text-center">{darkPrimary}</p>
                        </div>
                        <div>
                          <label className="block text-[9px] font-mono text-brand-text-muted mb-1">Secondary</label>
                          <input type="color" value={darkSecondary} disabled={autoDark}
                            onChange={(e) => { setDarkSecondary(e.target.value); setAutoDark(false) }}
                            className="w-full h-10 rounded-xl border border-brand-border bg-transparent cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed" />
                          <p className="text-[8px] font-mono text-brand-text-muted mt-0.5 text-center">{darkSecondary}</p>
                        </div>
                        <div>
                          <label className="block text-[9px] font-mono text-brand-text-muted mb-1">Accent</label>
                          <input type="color" value={darkAccent} disabled={autoDark}
                            onChange={(e) => { setDarkAccent(e.target.value); setAutoDark(false) }}
                            className="w-full h-10 rounded-xl border border-brand-border bg-transparent cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed" />
                          <p className="text-[8px] font-mono text-brand-text-muted mt-0.5 text-center">{darkAccent}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right: Live preview */}
                  <div className="rounded-2xl border border-brand-border bg-brand-surface overflow-hidden">
                    <div className="p-3 border-b border-brand-border flex items-center justify-between">
                      <p className="text-[10px] font-mono uppercase tracking-wider text-brand-text-muted font-bold">Preview</p>
                      <button type="button" onClick={() => setPreviewDark(!previewDark)}
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[9px] font-bold transition-all"
                        style={{ backgroundColor: previewDark ? darkPrimary + '20' : '#f1f5f9', color: previewDark ? darkPrimary : '#64748b' }}>
                        {previewDark ? <Moon size={10} /> : <Sun size={10} />}
                        {previewDark ? 'Dark' : 'Light'}
                      </button>
                    </div>
                    <div className="flex min-h-[360px]" style={{ backgroundColor: previewBg }}>
                      {/* Mini sidebar */}
                      <div className="w-[110px] shrink-0 p-2.5 flex flex-col gap-1" style={{ backgroundColor: previewSecondary }}>
                        <div className="flex items-center gap-1.5 px-1.5 py-1.5 mb-1">
                          {formData.logoFile || formData.logoUrl ? (
                            <img src={formData.logoFile ? URL.createObjectURL(formData.logoFile) : formData.logoUrl} alt="Logo" className="w-6 h-6 rounded object-contain"
                              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                          ) : (
                            <div className="w-6 h-6 rounded flex items-center justify-center text-[9px] font-bold text-white" style={{ backgroundColor: previewPrimary }}>
                              {formData.shortName?.charAt(0) || "O"}
                            </div>
                          )}
                          <span className="text-[8px] font-bold truncate" style={{ color: previewDark ? '#f1f5f9' : '#fff' }}>
                            {formData.shortName || "Org"}
                          </span>
                        </div>
                        <p className="text-[6px] font-mono uppercase tracking-wider px-1.5 mb-0.5" style={{ color: previewDark ? '#94a3b8' : 'rgba(255,255,255,0.4)' }}>Navigation</p>
                        {["Dashboard", "Events", "Team", "Settings"].map((item, i) => (
                          <div key={item} className="flex items-center gap-1.5 px-2 py-1.5 rounded-md text-[7px] font-medium"
                            style={i === 0
                              ? { backgroundColor: previewPrimary + '20', color: previewPrimary }
                              : { color: previewDark ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.6)' }}>
                            <div className="w-1.5 h-1.5 rounded-full" style={i === 0 ? { backgroundColor: previewPrimary } : { backgroundColor: previewDark ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.25)' }} />
                            {item}
                          </div>
                        ))}
                      </div>

                      {/* Mini main area */}
                      <div className="flex-1 flex flex-col">
                        {/* Mini header */}
                        <div className="h-7 flex items-center justify-between px-3" style={{ backgroundColor: previewSurface, borderBottom: `1px solid ${previewDark ? '#334155' : '#e2e8f0'}` }}>
                          <div className="w-16 h-1.5 rounded-full" style={{ backgroundColor: previewDark ? '#475569' : '#e2e8f0' }} />
                          <div className="flex gap-1">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: previewDark ? '#475569' : '#e2e8f0' }} />
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: previewDark ? '#475569' : '#e2e8f0' }} />
                          </div>
                        </div>

                        {/* Mini hero */}
                        <div className="px-4 py-4" style={{ background: `linear-gradient(135deg, ${previewPrimary}25, ${previewAccent}12)` }}>
                          <p className="text-[8px] font-bold" style={{ color: previewText }}>Welcome, {formData.shortName || "Org"}</p>
                          <p className="text-[6px] mt-0.5" style={{ color: previewTextMuted }}>{formData.organizationName || "Your Organization"}</p>
                          <div className="flex gap-1.5 mt-2">
                            <div className="px-2 py-0.5 rounded text-[6px] font-bold text-white" style={{ backgroundColor: previewPrimary }}>Create Event</div>
                          </div>
                        </div>

                        {/* Mini content */}
                        <div className="flex-1 p-2.5 space-y-2" style={{ backgroundColor: previewBg }}>
                          <div className="flex gap-1.5">
                            {[
                              { label: "Events", value: "12", color: previewPrimary },
                              { label: "Team", value: "8", color: previewAccent },
                              { label: "Reports", value: "5", color: previewDark ? '#10b981' : '#22c55e' },
                            ].map((s) => (
                              <div key={s.label} className="flex-1 rounded-lg p-1.5" style={{ backgroundColor: previewSurface, border: `1px solid ${previewDark ? '#334155' : '#e2e8f0'}` }}>
                                <p className="text-[5px]" style={{ color: previewTextMuted }}>{s.label}</p>
                                <p className="text-[9px] font-bold mt-0.5" style={{ color: s.color }}>{s.value}</p>
                              </div>
                            ))}
                          </div>
                          <div className="rounded-lg p-2" style={{ backgroundColor: previewSurface, border: `1px solid ${previewDark ? '#334155' : '#e2e8f0'}` }}>
                            <div className="h-1.5 rounded-full w-3/4" style={{ backgroundColor: previewDark ? '#475569' : '#e2e8f0' }} />
                            <div className="h-1.5 rounded-full w-1/2 mt-1" style={{ backgroundColor: previewDark ? '#475569' : '#e2e8f0' }} />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button type="button" onClick={() => setStep("details")}
                    className="flex-1 bg-brand-surface border border-brand-border text-brand-text-muted rounded-xl py-3 text-xs font-bold uppercase tracking-widest hover:bg-brand-surface-elevated transition-all cursor-pointer flex items-center justify-center gap-2">
                    <ArrowLeft size={13} /> Back
                  </button>
                  <motion.button type="submit" whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                    className="flex-1 bg-brand-gold hover:bg-brand-gold-hover text-brand-bg-secondary rounded-xl py-3 text-xs font-bold uppercase tracking-widest shadow-md transition-all cursor-pointer flex items-center justify-center gap-2">
                    Review <ArrowRight size={13} />
                  </motion.button>
                </div>
              </form>
            </motion.div>
          )}

          {step === "review" && (
            <motion.div key="review" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} transition={{ duration: 0.2 }}>
              <div className="bg-brand-surface border border-brand-border rounded-xl p-4 space-y-3 mb-4">
                <div className="flex items-center gap-3 pb-3 border-b border-brand-border">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold shrink-0" style={{ backgroundColor: formData.primaryColor }}>
                    {formData.shortName.charAt(0)}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-brand-text-primary">{formData.organizationName}</p>
                    <p className="text-[10px] text-brand-text-muted">{formData.shortName}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-[10px]">
                  <p className="text-brand-text-muted">Category:</p>
                  <p className="text-brand-text-primary font-semibold">{formData.category}</p>
                  {formData.tagline && (
                    <>
                      <p className="text-brand-text-muted">Tagline:</p>
                      <p className="text-brand-text-primary font-semibold">{formData.tagline}</p>
                    </>
                  )}
                  <p className="text-brand-text-muted">Contact Email:</p>
                  <p className="text-brand-text-primary font-semibold">{formData.contactEmail}</p>
                  <p className="text-brand-text-muted">Phone:</p>
                  <p className="text-brand-text-primary font-semibold">{formData.phoneCode ? `${formData.phoneCode} ${formData.phoneNumber}` : formData.phoneNumber || "—"}</p>
                  <p className="text-brand-text-muted">Website:</p>
                  <p className="text-brand-text-primary font-semibold">{formData.website || "—"}</p>
                  <p className="text-brand-text-muted">Country:</p>
                  <p className="text-brand-text-primary font-semibold">{formData.country}</p>
                  <p className="text-brand-text-muted">State/Region:</p>
                  <p className="text-brand-text-primary font-semibold">{formData.stateRegion || "—"}</p>
                </div>

                <div className="pt-3 border-t border-brand-border">
                  <p className="text-[9px] font-mono uppercase tracking-wider text-brand-text-muted font-bold mb-2">Brand Colors</p>
                  <div className="flex gap-2">
                    <div className="flex items-center gap-1.5">
                      <div className="w-4 h-4 rounded" style={{ backgroundColor: formData.primaryColor }} />
                      <span className="text-[9px] text-brand-text-muted font-mono">{formData.primaryColor}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-4 h-4 rounded" style={{ backgroundColor: formData.secondaryColor, border: "1px solid #333" }} />
                      <span className="text-[9px] text-brand-text-muted font-mono">{formData.secondaryColor}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-4 h-4 rounded" style={{ backgroundColor: formData.accentColor }} />
                      <span className="text-[9px] text-brand-text-muted font-mono">{formData.accentColor}</span>
                    </div>
                  </div>
                </div>
              </div>

              {errors.submit && (
                <p className="text-[11px] text-status-danger font-semibold text-center mt-3">{errors.submit}</p>
              )}

              <AuthFormWrapper onSubmit={handleSubmit}>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setStep("branding")}
                    className="flex-1 bg-brand-surface border border-brand-border text-brand-text-muted rounded-xl py-3 text-xs font-bold uppercase tracking-widest hover:bg-brand-surface-elevated transition-all cursor-pointer flex items-center justify-center gap-2">
                    <ArrowLeft size={13} /> Edit
                  </button>
                  <motion.button type="submit" whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                    className="flex-1 bg-brand-gold hover:bg-brand-gold-hover text-brand-bg-secondary rounded-xl py-3 text-xs font-bold uppercase tracking-widest shadow-md transition-all cursor-pointer flex items-center justify-center gap-2">
                    Create Organization
                  </motion.button>
                </div>
              </AuthFormWrapper>
            </motion.div>
          )}

          {step === "submitting" && (
            <motion.div key="submitting" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-8">
              <AuthStateCard
                state="loading"
                title="Creating Organization"
                message="Please wait while we set up your organization. This should only take a moment."
              />
            </motion.div>
          )}
        </AnimatePresence>

        {step !== "submitting" && (
          <p className="text-center text-[11px] text-brand-text-muted mt-4">
            Already have an organization?{" "}
            <Link to="/org/signin" className="text-brand-gold hover:underline font-semibold">Sign In</Link>
          </p>
        )}
      </AuthCard>
    </AuthLayout>
  );
}
