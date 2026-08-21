import { useEffect, useState } from "react"
import { Globe, Lock, Database, RefreshCw, AlertTriangle, Check } from "lucide-react"
import SeoHead from "../../components/SeoHead"
import Breadcrumbs from "../../components/platform/Breadcrumbs"
import { platformService } from "../../services/platform-service"

interface PlatformSettingsData {
  platformName: string
  supportEmail: string
  notificationEmail: string
  maintenanceMode: boolean
  allowPublicRegistration: boolean
  requireEmailVerification: boolean
  brevoEnabled: boolean
  sessionTimeout: string
  maxLoginAttempts: string
  storageRetention: string
  defaultTrialDays: string
  maxStorageMb: string
}

const DEFAULTS: PlatformSettingsData = {
  platformName: "ORIVIS",
  supportEmail: "support@orivis.com",
  notificationEmail: "notifications@orivis.com",
  maintenanceMode: false,
  allowPublicRegistration: true,
  requireEmailVerification: true,
  brevoEnabled: true,
  sessionTimeout: "60",
  maxLoginAttempts: "5",
  storageRetention: "90",
  defaultTrialDays: "14",
  maxStorageMb: "20480",
}

export default function PlatformSettings() {
  const [settings, setSettings] = useState<PlatformSettingsData>(DEFAULTS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    let active = true
    setLoading(true)
    platformService
      .getSettings()
      .then((rows) => {
        if (!active) return
        const map: Record<string, string> = {}
        for (const r of rows) map[r.key] = String(r.value ?? "")
        setSettings({
          platformName: map["platform_name"] ?? DEFAULTS.platformName,
          supportEmail: map["platform_support_email"] ?? DEFAULTS.supportEmail,
          notificationEmail: map["platform_notification_email"] ?? DEFAULTS.notificationEmail,
          maintenanceMode: map["maintenance_mode"] === "1" || map["maintenance_mode"] === "true",
          allowPublicRegistration: map["allow_public_registration"] === "1" || map["allow_public_registration"] === "true",
          requireEmailVerification: map["require_email_verification"] === "1" || map["require_email_verification"] === "true",
          brevoEnabled: map["brevo_enabled"] === "1" || map["brevo_enabled"] === "true",
          sessionTimeout: map["session_timeout"] ?? DEFAULTS.sessionTimeout,
          maxLoginAttempts: map["max_login_attempts"] ?? DEFAULTS.maxLoginAttempts,
          storageRetention: map["storage_retention"] ?? DEFAULTS.storageRetention,
          defaultTrialDays: map["default_trial_days"] ?? DEFAULTS.defaultTrialDays,
          maxStorageMb: map["max_storage_mb"] ?? DEFAULTS.maxStorageMb,
        })
      })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "Failed to load settings"))
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [])

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    setSaved(false)
    const payload = [
      { key: "platform_name", value: settings.platformName, type: "string" },
      { key: "platform_support_email", value: settings.supportEmail, type: "string" },
      { key: "platform_notification_email", value: settings.notificationEmail, type: "string" },
      { key: "maintenance_mode", value: settings.maintenanceMode, type: "boolean" },
      { key: "allow_public_registration", value: settings.allowPublicRegistration, type: "boolean" },
      { key: "require_email_verification", value: settings.requireEmailVerification, type: "boolean" },
      { key: "brevo_enabled", value: settings.brevoEnabled, type: "boolean" },
      { key: "session_timeout", value: settings.sessionTimeout, type: "integer" },
      { key: "max_login_attempts", value: settings.maxLoginAttempts, type: "integer" },
      { key: "storage_retention", value: settings.storageRetention, type: "integer" },
      { key: "default_trial_days", value: settings.defaultTrialDays, type: "integer" },
      { key: "max_storage_mb", value: settings.maxStorageMb, type: "integer" },
    ]
    try {
      await platformService.updateSettings(payload)
      setSaved(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save settings")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-2xl space-y-6">
        <Breadcrumbs items={[{ label: "Settings" }]} />
        <div className="h-10 w-56 bg-brand-surface-elevated animate-pulse rounded-lg" />
        <div className="h-96 bg-brand-surface-elevated animate-pulse rounded-2xl" />
      </div>
    )
  }

  return (
    <>
      <SeoHead meta={{ title: "Platform Settings | ORIVIS", noindex: true }} />
      <div className="max-w-2xl space-y-6">
        <Breadcrumbs items={[{ label: "Settings" }]} />
        <div>
          <h1 className="text-2xl font-display font-bold uppercase tracking-tight text-brand-text-primary">Platform Settings</h1>
          <p className="text-sm text-brand-text-muted mt-1">Configure global platform settings.</p>
        </div>


        {(error || saved) && (
          <div className={`rounded-xl px-4 py-3 text-xs font-semibold flex items-center gap-2 border ${
            error ? "text-status-error bg-status-error/10 border-status-error/20" : "text-status-success bg-status-success/10 border-status-success/20"
          }`}>
            {error ? <AlertTriangle size={14} /> : <Check size={14} />}
            <span>{error ?? "Settings saved successfully."}</span>
          </div>
        )}

        <div className="bg-brand-surface border border-brand-border rounded-2xl p-6 space-y-6">
          <div className="flex items-center gap-2 border-b border-brand-border pb-4">
            <Globe size={14} className="text-brand-gold" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-brand-text-primary">General</h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <label htmlFor="platformName" className="block text-[10px] font-mono uppercase tracking-wider text-brand-text-muted font-bold mb-1.5">Platform Name</label>
              <input id="platformName" value={settings.platformName} onChange={(e) => setSettings({ ...settings, platformName: e.target.value })}
                className="w-full bg-brand-bg-secondary/50 border border-brand-border rounded-xl px-4 py-3 text-xs text-brand-text-primary focus:outline-none focus:border-brand-gold transition-all" />
            </div>
            <div>
              <label htmlFor="supportEmail" className="block text-[10px] font-mono uppercase tracking-wider text-brand-text-muted font-bold mb-1.5">Support Email</label>
              <input id="supportEmail" value={settings.supportEmail} onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
                className="w-full bg-brand-bg-secondary/50 border border-brand-border rounded-xl px-4 py-3 text-xs text-brand-text-primary focus:outline-none focus:border-brand-gold transition-all" />
            </div>
            <div>
              <label htmlFor="notificationEmail" className="block text-[10px] font-mono uppercase tracking-wider text-brand-text-muted font-bold mb-1.5">Notification Email</label>
              <input id="notificationEmail" value={settings.notificationEmail} onChange={(e) => setSettings({ ...settings, notificationEmail: e.target.value })}
                className="w-full bg-brand-bg-secondary/50 border border-brand-border rounded-xl px-4 py-3 text-xs text-brand-text-primary focus:outline-none focus:border-brand-gold transition-all" />
            </div>
            <div>
              <label htmlFor="defaultTrialDays" className="block text-[10px] font-mono uppercase tracking-wider text-brand-text-muted font-bold mb-1.5">Default Trial (days)</label>
              <input id="defaultTrialDays" type="number" value={settings.defaultTrialDays} onChange={(e) => setSettings({ ...settings, defaultTrialDays: e.target.value })}
                className="w-full bg-brand-bg-secondary/50 border border-brand-border rounded-xl px-4 py-3 text-xs text-brand-text-primary focus:outline-none focus:border-brand-gold transition-all" />
            </div>
          </div>

          <div className="flex items-center gap-2 border-b border-brand-border pb-4">
            <Lock size={14} className="text-brand-gold" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-brand-text-primary">Security</h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <label htmlFor="sessionTimeout" className="block text-[10px] font-mono uppercase tracking-wider text-brand-text-muted font-bold mb-1.5">Session Timeout (minutes)</label>
              <input id="sessionTimeout" type="number" value={settings.sessionTimeout} onChange={(e) => setSettings({ ...settings, sessionTimeout: e.target.value })}
                className="w-full bg-brand-bg-secondary/50 border border-brand-border rounded-xl px-4 py-3 text-xs text-brand-text-primary focus:outline-none focus:border-brand-gold transition-all" />
            </div>
            <div>
              <label htmlFor="maxLoginAttempts" className="block text-[10px] font-mono uppercase tracking-wider text-brand-text-muted font-bold mb-1.5">Max Login Attempts</label>
              <input id="maxLoginAttempts" type="number" value={settings.maxLoginAttempts} onChange={(e) => setSettings({ ...settings, maxLoginAttempts: e.target.value })}
                className="w-full bg-brand-bg-secondary/50 border border-brand-border rounded-xl px-4 py-3 text-xs text-brand-text-primary focus:outline-none focus:border-brand-gold transition-all" />
            </div>
          </div>

          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={settings.maintenanceMode} onChange={(e) => setSettings({ ...settings, maintenanceMode: e.target.checked })}
                className="w-4 h-4 rounded border-brand-border accent-brand-gold" />
              <div>
                <p className="text-xs font-semibold text-brand-text-primary">Maintenance Mode</p>
                <p className="text-[9px] font-mono text-brand-text-muted">Disable platform access for all users except Platform Administrators.</p>
              </div>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={settings.allowPublicRegistration} onChange={(e) => setSettings({ ...settings, allowPublicRegistration: e.target.checked })}
                className="w-4 h-4 rounded border-brand-border accent-brand-gold" />
              <div>
                <p className="text-xs font-semibold text-brand-text-primary">Allow Public Registration</p>
                <p className="text-[9px] font-mono text-brand-text-muted">Allow new organizations to register on the platform.</p>
              </div>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={settings.requireEmailVerification} onChange={(e) => setSettings({ ...settings, requireEmailVerification: e.target.checked })}
                className="w-4 h-4 rounded border-brand-border accent-brand-gold" />
              <div>
                <p className="text-xs font-semibold text-brand-text-primary">Require Email Verification</p>
                <p className="text-[9px] font-mono text-brand-text-muted">Users must verify email before accessing the platform.</p>
              </div>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={settings.brevoEnabled} onChange={(e) => setSettings({ ...settings, brevoEnabled: e.target.checked })}
                className="w-4 h-4 rounded border-brand-border accent-brand-gold" />
              <div>
                <p className="text-xs font-semibold text-brand-text-primary">Email Service (Brevo)</p>
                <p className="text-[9px] font-mono text-brand-text-muted">Enable transactional email delivery via Brevo.</p>
              </div>
            </label>
          </div>

          <div className="flex items-center gap-2 border-b border-brand-border pb-4">
            <Database size={14} className="text-brand-gold" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-brand-text-primary">Data & Storage</h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <label htmlFor="storageRetention" className="block text-[10px] font-mono uppercase tracking-wider text-brand-text-muted font-bold mb-1.5">Audit Log Retention (days)</label>
              <input id="storageRetention" type="number" value={settings.storageRetention} onChange={(e) => setSettings({ ...settings, storageRetention: e.target.value })}
                className="w-full bg-brand-bg-secondary/50 border border-brand-border rounded-xl px-4 py-3 text-xs text-brand-text-primary focus:outline-none focus:border-brand-gold transition-all" />
            </div>
            <div>
              <label htmlFor="maxStorageMb" className="block text-[10px] font-mono uppercase tracking-wider text-brand-text-muted font-bold mb-1.5">Max Storage (MB)</label>
              <input id="maxStorageMb" type="number" value={settings.maxStorageMb} onChange={(e) => setSettings({ ...settings, maxStorageMb: e.target.value })}
                className="w-full bg-brand-bg-secondary/50 border border-brand-border rounded-xl px-4 py-3 text-xs text-brand-text-primary focus:outline-none focus:border-brand-gold transition-all" />
            </div>
          </div>

          <button onClick={handleSave} disabled={saving}
            className="w-full bg-brand-gold hover:bg-brand-gold-hover text-brand-bg-secondary rounded-xl py-3 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60">
            {saving ? <><RefreshCw size={14} className="animate-spin" /> Saving...</> : "Save Settings"}
          </button>
        </div>
      </div>
    </>
  )
}