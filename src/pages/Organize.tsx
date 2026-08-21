import { useState } from "react"
import OrivisLogo from "../components/OrivisLogo"
import { useNavigate } from "react-router-dom"
import SafeImage from "../components/SafeImage"
import TextureBg from "../components/TextureBg"
import StepIndicator, { ORGANIZE_STEPS } from "../components/Organize/StepIndicator"
import StepOrgCategory from "../components/Organize/StepOrgCategory"
import StepVerification from "../components/Organize/StepVerification"
import {
  INITIAL_FORM_STATE,
  type OrganizeFormState,
  type OrganizePhase1,
} from "../types/organize"
import SeoHead from "../components/SeoHead"

type StepErrors = Partial<Record<string, string>>

const LEFT_PANEL_CONTENT = [
  {
    title: "Register Your Organization",
    desc: "Tell us about your organization to get started with Orivis.",
  },
  {
    title: "Branding",
    desc: "Customize your organization's look and feel with your logo and colors.",
  },
]

const RIGHT_PANEL_LABELS = [
  { title: "Organization Details", subtitle: "Tell us about your organization" },
  { title: "Branding", subtitle: "Upload logo and choose colors" },
]

export default function Organize() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [form, setForm] = useState<OrganizeFormState>(INITIAL_FORM_STATE)
  const [errors, setErrors] = useState<StepErrors>({})

  const updatePhase1 = (data: OrganizePhase1) =>
    setForm((prev) => ({ ...prev, phase1: data }))

  const updatePhase2 = (data: OrganizeFormState["phase2"]) =>
    setForm((prev) => ({ ...prev, phase2: data }))

  const validateStep1 = (): boolean => {
    const e: StepErrors = {}
    const d = form.phase1
    if (!d.organizationName.trim()) e.organizationName = "Organization name is required"
    if (!d.organizationType) e.organizationType = "Organization type is required"
    if (!d.country.trim()) e.country = "Country is required"
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleNext = () => {
    if (step === 1 && !validateStep1()) return
    setStep((s) => Math.min(s + 1, 2))
    scrollToTop()
    setErrors({})
  }

  const handleBack = () => {
    setStep((s) => Math.max(s - 1, 1))
    scrollToTop()
    setErrors({})
  }

  const handleFinish = () => {
    const appId = `org-${Date.now()}`
    const submission = {
      appId,
      form,
      submittedAt: new Date().toISOString(),
    }
    try { localStorage.setItem(`orivis_org_${appId}`, JSON.stringify(submission)) } catch (err) { console.warn('localStorage write failed:', err) }
    navigate("/org/signin")
  }

  const panel = LEFT_PANEL_CONTENT[step - 1]
  const rightPanel = RIGHT_PANEL_LABELS[step - 1]

  return (
    <>
      <SeoHead meta={{ title: "Organize — Register Your Organization | ORIVIS", noindex: true }} />
      <div className="w-full flex-grow flex items-center justify-center py-12 px-4 sm:px-6 md:px-12 bg-gradient-to-br from-brand-bg via-brand-bg-secondary to-brand-bg min-h-[calc(100vh-80px)] mt-20 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-white/[0.015] rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-6xl glass-card rounded-[28px] overflow-hidden shadow-lg grid grid-cols-1 md:grid-cols-12 min-h-[600px] relative z-10">
        <TextureBg
          src="https://images.unsplash.com/photo-1765408217205-1c42d81f1677?q=80&w=1600&auto=format&fit=crop"
          opacity={0.15}
        />

        <div className="md:col-span-4 relative min-h-[200px] md:min-h-full overflow-hidden flex flex-col justify-between p-6 sm:p-8 border-b md:border-b-0 md:border-r border-brand-border bg-neutral-950">
          <div className="absolute inset-0">
            <SafeImage
              src="https://images.unsplash.com/photo-1504384308090-c894fdcc538d?q=80&w=1000&auto=format&fit=crop"
              alt="Orivis Governance Background"
              className="w-full h-full object-cover opacity-30 mix-blend-luminosity"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-transparent to-neutral-950/50" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent" />
          </div>

          <div className="relative z-10 flex items-center gap-1.5">
            <OrivisLogo size="sm" className="text-white" />
            <div className="w-1 h-1 rounded-full bg-white" />
          </div>

          <div className="relative z-10 mt-auto pt-10 md:pt-0">
            <span className="text-[8px] font-mono tracking-widest text-neutral-400 uppercase mb-1.5 block font-bold">
              Step {step} of {ORGANIZE_STEPS.length}
            </span>
            <h2 className="font-display font-bold text-2xl sm:text-3xl text-white uppercase tracking-tight leading-tight mb-2">
              {panel.title}
            </h2>
            <p className="font-sans text-[11px] text-neutral-400 leading-relaxed max-w-xs">
              {panel.desc}
            </p>
          </div>
        </div>

        <div className="md:col-span-8 bg-brand-surface p-6 sm:p-8 md:p-10 flex flex-col justify-between relative">
          <div className="w-full">
            <StepIndicator steps={ORGANIZE_STEPS} currentStep={step} />

            <div className="text-center mb-6">
              <h1 className="font-sans font-black text-2xl uppercase tracking-tight text-brand-text-primary">
                {rightPanel.title}
              </h1>
              <p className="font-sans text-xs text-brand-text-muted mt-1 max-w-sm mx-auto">
                {rightPanel.subtitle}
              </p>
            </div>

            {step === 1 && (
              <StepOrgCategory
                data={form.phase1}
                onChange={updatePhase1}
                onNext={handleNext}
                errors={errors}
              />
            )}
            {step === 2 && (
              <StepVerification
                data={form.phase2}
                onChange={updatePhase2}
                onNext={handleFinish}
                onBack={handleBack}
              />
            )}
          </div>

          <div className="mt-8 pt-6 border-t border-brand-border" />
        </div>
      </div>
    </div>
    </>
  )
}
