import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import { Check, ArrowLeft, ArrowRight, Sparkles, Building2, Palette, Globe, LayoutDashboard } from 'lucide-react'
import { useOrgBranding } from '../contexts/OrgBrandingContext'
import { orgSettingsService } from '../services/org-settings-service'
import DashboardCard from '../components/DashboardCard'
import SeoHead from '../../components/SeoHead'

type SetupStep = 'welcome' | 'confirm' | 'branding' | 'workspace' | 'finish'

const STEP_LABELS: { key: SetupStep; label: string; icon: typeof Sparkles }[] = [
  { key: 'welcome', label: 'Welcome', icon: Sparkles },
  { key: 'confirm', label: 'Organization', icon: Building2 },
  { key: 'branding', label: 'Branding', icon: Palette },
  { key: 'workspace', label: 'Workspace', icon: Globe },
  { key: 'finish', label: 'Finish', icon: LayoutDashboard },
]

export default function SetupWizard() {
  const navigate = useNavigate()
  const { branding, updateBranding } = useOrgBranding()
  const [step, setStep] = useState<SetupStep>('welcome')
  const [workspaceName, setWorkspaceName] = useState(branding.workspaceName)
  const [timezone, setTimezone] = useState('Africa/Lagos')
  const [language, setLanguage] = useState('English')

  const steps = STEP_LABELS.map(s => s.key)
  const currentIdx = steps.indexOf(step)

  const goNext = () => {
    const next = steps[currentIdx + 1]
    if (next) setStep(next)
  }
  const goBack = () => {
    const prev = steps[currentIdx - 1]
    if (prev) setStep(prev)
  }

  const handleFinish = async () => {
    updateBranding({ workspaceName })
    try {
      const orgId = branding.shortName
      if (orgId) {
        await orgSettingsService.updateSettings(orgId, { workspaceName, timezone, language })
      }
    } catch {
      // settings save is best-effort
    }
    localStorage.setItem('orivis_setup_complete', 'true')
    navigate('/org/dashboard', { replace: true })
  }

  const stepIndicator = (
    <div className="flex items-center gap-1 mb-6 overflow-x-auto pb-1">
      {STEP_LABELS.map((s, i) => {
        const idx = i
        const isActive = steps[idx] === step
        const isDone = idx < currentIdx
        const Icon = s.icon
        return (
          <div key={s.key} className="flex items-center gap-1 min-w-0">
            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-bold whitespace-nowrap transition-all ${
                isActive ? 'shadow-sm' : isDone ? 'opacity-60' : 'opacity-30'
              }`}
              style={{
                backgroundColor: isActive ? `${branding.primaryColor}18` : 'transparent',
                color: isActive ? branding.primaryColor : 'var(--color-brand-text-secondary)',
                borderColor: isActive ? branding.primaryColor : 'transparent',
                borderWidth: isActive ? 1 : 0,
              }}
            >
              {isDone ? <Check size={10} /> : <Icon size={10} />}
              <span className="hidden sm:inline">{s.label}</span>
            </div>
            {i < steps.length - 1 && (
              <div className="w-6 h-px shrink-0" style={{ backgroundColor: isDone ? branding.primaryColor : 'var(--color-brand-border, #2a2a3a)' }} />
            )}
          </div>
        )
      })}
    </div>
  )

  return (
    <>
      <SeoHead meta={{ title: "Workspace Setup — Organization | ORIVIS", noindex: true }} />
      <div className="max-w-[700px] mx-auto py-8 px-4">
        {stepIndicator}

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {step === 'welcome' && (
              <DashboardCard hover={false}>
                <div className="flex flex-col items-center text-center py-6">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                    className="w-20 h-20 rounded-2xl flex items-center justify-center mb-5"
                    style={{ backgroundColor: `${branding.primaryColor}18`, color: branding.primaryColor }}
                  >
                    <Sparkles size={36} />
                  </motion.div>
                  <h2 className="text-xl font-bold tracking-tight text-brand-text-primary">
                    Welcome, {branding.organizationName}
                  </h2>
                  <p className="text-xs text-brand-text-muted mt-3 max-w-md leading-relaxed">
                    Let's get your workspace set up in just a few steps. You'll confirm your organization information,
                    review your branding, and create your workspace.
                  </p>
                  <motion.button
                    type="button"
                    onClick={goNext}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    className="mt-8 inline-flex items-center gap-2 px-8 py-3 rounded-xl text-xs font-bold shadow-md text-white"
                    style={{ backgroundColor: branding.primaryColor }}
                  >
                    Get Started <ArrowRight size={13} />
                  </motion.button>
                </div>
              </DashboardCard>
            )}

            {step === 'confirm' && (
              <DashboardCard hover={false}>
                <h2 className="text-sm font-bold tracking-tight text-brand-text-primary mb-1">
                  Confirm Organization Information
                </h2>
                <p className="text-[11px] text-brand-text-muted mb-5">
                  Verify the details below. You can edit them later in Workspace Settings.
                </p>

                <div className="bg-brand-surface border border-brand-border rounded-xl p-4 space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-brand-text-muted">Organization</span>
                    <span className="text-brand-text-primary font-semibold">{branding.organizationName}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-brand-text-muted">Short Name</span>
                    <span className="text-brand-text-primary font-semibold">{branding.shortName}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-brand-text-muted">Primary Color</span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded" style={{ backgroundColor: branding.primaryColor }} />
                      <span className="text-brand-text-primary ">{branding.primaryColor}</span>
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-brand-text-muted">Secondary Color</span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded border border-brand-border" style={{ backgroundColor: branding.secondaryColor }} />
                      <span className="text-brand-text-primary ">{branding.secondaryColor}</span>
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-brand-text-muted">Accent Color</span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded" style={{ backgroundColor: branding.accentColor }} />
                      <span className="text-brand-text-primary ">{branding.accentColor}</span>
                    </span>
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button type="button" onClick={goBack}
                    className="w-1/3 bg-brand-surface border border-brand-border hover:bg-brand-surface-interactive text-brand-text-primary rounded-xl py-2.5 text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5">
                    <ArrowLeft size={13} /> Back
                  </button>
                  <motion.button type="button" onClick={goNext}
                    whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                    className="w-2/3 inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold shadow-md text-white"
                    style={{ backgroundColor: branding.primaryColor }}>
                    Looks Good <ArrowRight size={13} />
                  </motion.button>
                </div>
              </DashboardCard>
            )}

            {step === 'branding' && (
              <DashboardCard hover={false}>
                <h2 className="text-sm font-bold tracking-tight text-brand-text-primary mb-1">
                  Review Branding
                </h2>
                <p className="text-[11px] text-brand-text-muted mb-5">
                  Your brand identity from registration will be used across the platform.
                </p>

                <div className="flex items-center gap-4 p-5 rounded-xl border border-brand-border bg-brand-surface/50 mb-2">
                  <div className="w-16 h-16 rounded-xl flex items-center justify-center text-white text-xl font-bold shrink-0"
                    style={{ backgroundColor: branding.primaryColor }}>
                    {branding.shortName.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-brand-text-primary">{branding.organizationName}</p>
                    <p className="text-[10px] text-brand-text-muted mt-0.5">Your brand colors and logo will appear on the sidebar, dashboard, and public event pages.</p>
                    <div className="flex gap-1.5 mt-2">
                      <div className="w-5 h-5 rounded" style={{ backgroundColor: branding.primaryColor }} title="Primary" />
                      <div className="w-5 h-5 rounded border border-brand-border" style={{ backgroundColor: branding.secondaryColor }} title="Secondary" />
                      <div className="w-5 h-5 rounded" style={{ backgroundColor: branding.accentColor }} title="Accent" />
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button type="button" onClick={goBack}
                    className="w-1/3 bg-brand-surface border border-brand-border hover:bg-brand-surface-interactive text-brand-text-primary rounded-xl py-2.5 text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5">
                    <ArrowLeft size={13} /> Back
                  </button>
                  <motion.button type="button" onClick={goNext}
                    whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                    className="w-2/3 inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold shadow-md text-white"
                    style={{ backgroundColor: branding.primaryColor }}>
                    Continue <ArrowRight size={13} />
                  </motion.button>
                </div>
              </DashboardCard>
            )}

            {step === 'workspace' && (
              <DashboardCard hover={false}>
                <h2 className="text-sm font-bold tracking-tight text-brand-text-primary mb-1">
                  Create Your Workspace
                </h2>
                <p className="text-[11px] text-brand-text-muted mb-5">
                  Set up your workspace name and preferences.
                </p>

                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-bold text-brand-text-muted mb-1.5 block" htmlFor="workspaceName">
                      Workspace Name
                    </label>
                    <input type="text" id="workspaceName" name="workspaceName" value={workspaceName}
                      onChange={(e) => setWorkspaceName(e.target.value)}
                      placeholder="e.g. Event Management Console"
                      className="w-full bg-brand-surface border border-brand-border rounded-xl px-4 py-2.5 text-xs text-brand-text-primary placeholder-brand-text-disabled/50 outline-none focus:border-[var(--org-primary)] transition-colors" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-brand-text-muted mb-1.5 block" htmlFor="timezone">
                        Timezone
                      </label>
                      <select id="timezone" name="timezone" value={timezone} onChange={(e) => setTimezone(e.target.value)}
                        className="w-full bg-brand-surface border border-brand-border rounded-xl px-4 py-2.5 text-xs text-brand-text-primary outline-none focus:border-[var(--org-primary)] transition-colors">
                        <option value="Africa/Lagos">Africa/Lagos</option>
                        <option value="Africa/Nairobi">Africa/Nairobi</option>
                        <option value="Africa/Cairo">Africa/Cairo</option>
                        <option value="Africa/Johannesburg">Africa/Johannesburg</option>
                        <option value="America/New_York">America/New_York</option>
                        <option value="Europe/London">Europe/London</option>
                        <option value="Asia/Dubai">Asia/Dubai</option>
                        <option value="UTC">UTC</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-brand-text-muted mb-1.5 block" htmlFor="language">
                        Language
                      </label>
                      <select id="language" name="language" value={language} onChange={(e) => setLanguage(e.target.value)}
                        className="w-full bg-brand-surface border border-brand-border rounded-xl px-4 py-2.5 text-xs text-brand-text-primary outline-none focus:border-[var(--org-primary)] transition-colors">
                        <option value="English">English</option>
                        <option value="French">French</option>
                        <option value="Arabic">Arabic</option>
                        <option value="Portuguese">Portuguese</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button type="button" onClick={goBack}
                    className="w-1/3 bg-brand-surface border border-brand-border hover:bg-brand-surface-interactive text-brand-text-primary rounded-xl py-2.5 text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5">
                    <ArrowLeft size={13} /> Back
                  </button>
                  <motion.button type="button" onClick={goNext}
                    whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                    className="w-2/3 inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold shadow-md text-white"
                    style={{ backgroundColor: branding.primaryColor }}>
                    Continue <ArrowRight size={13} />
                  </motion.button>
                </div>
              </DashboardCard>
            )}

            {step === 'finish' && (
              <DashboardCard hover={false}>
                <div className="flex flex-col items-center text-center py-6">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: 'spring', stiffness: 200, damping: 15 }}
                    className="w-20 h-20 rounded-2xl flex items-center justify-center mb-5"
                    style={{ backgroundColor: `${branding.primaryColor}18`, color: branding.primaryColor }}
                  >
                    <CheckCircle2 size={36} />
                  </motion.div>
                  <motion.h2
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-lg font-bold tracking-tight text-brand-text-primary"
                  >
                    Setup Complete
                  </motion.h2>
                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="text-xs text-brand-text-muted mt-2 max-w-md"
                  >
                    Your workspace <strong className="text-brand-text-primary">{workspaceName}</strong> is ready. You can now start creating events, managing your team, and customizing your settings.
                  </motion.p>
                  <motion.ul
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="mt-6 space-y-2 text-left"
                  >
                    {[
                      'Create and manage events',
                      'Invite team members',
                      'Customize branding and settings',
                      'View audit logs and billing',
                    ].map((item) => (
                      <li key={item} className="flex items-center gap-2 text-[11px] text-brand-text-secondary">
                        <Check size={12} className="text-status-success shrink-0" />
                        {item}
                      </li>
                    ))}
                  </motion.ul>
                  <motion.button
                    type="button"
                    onClick={handleFinish}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="mt-8 inline-flex items-center gap-2 px-8 py-3 rounded-xl text-xs font-bold shadow-md text-white"
                    style={{ backgroundColor: branding.primaryColor }}
                  >
                    Go to Dashboard <LayoutDashboard size={13} />
                  </motion.button>
                </div>
              </DashboardCard>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </>
  )
}

function CheckCircle2(props: { size?: number; className?: string }) {
  return (
    <svg width={props.size || 24} height={props.size || 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={props.className}>
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  )
}
