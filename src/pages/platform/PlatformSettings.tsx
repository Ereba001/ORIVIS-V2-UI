import { useState } from "react"
import { Globe, Lock, Database } from "lucide-react"
import SeoHead from "../../components/SeoHead"
import Breadcrumbs from "../../components/platform/Breadcrumbs"

export default function PlatformSettings() {
  const [settings, setSettings] = useState({
    platformName: "Orivis",
    supportEmail: "support@orivis.app",
    maintenanceMode: false,
    allowPublicRegistration: true,
    requireEmailVerification: true,
    sessionTimeout: "60",
    maxLoginAttempts: "5",
    storageRetention: "90",
  })

  return (
    <>
    <SeoHead meta={{ title: "Platform Settings | ORIVIS", noindex: true }} />
    <div className="max-w-2xl space-y-6">
      <Breadcrumbs items={[{ label: "Settings" }]} />
      <div>
        <h1 className="text-2xl font-display font-black uppercase tracking-tight text-brand-text-primary">Platform Settings</h1>
        <p className="text-sm text-brand-text-muted mt-1">Configure global platform settings.</p>
      </div>

      <div className="bg-brand-surface border border-brand-border rounded-2xl p-6 space-y-6">
        <div className="flex items-center gap-2 border-b border-brand-border pb-4">
          <Globe size={14} className="text-brand-gold" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-brand-text-primary">General</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-mono uppercase tracking-wider text-brand-text-muted font-bold mb-1.5">Platform Name</label>
            <input value={settings.platformName} onChange={(e) => setSettings({ ...settings, platformName: e.target.value })}
              className="w-full bg-brand-bg-secondary/50 border border-brand-border rounded-xl px-4 py-3 text-xs text-brand-text-primary focus:outline-none focus:border-brand-gold transition-all" />
          </div>
          <div>
            <label className="block text-[10px] font-mono uppercase tracking-wider text-brand-text-muted font-bold mb-1.5">Support Email</label>
            <input value={settings.supportEmail} onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
              className="w-full bg-brand-bg-secondary/50 border border-brand-border rounded-xl px-4 py-3 text-xs text-brand-text-primary focus:outline-none focus:border-brand-gold transition-all" />
          </div>
        </div>

        <div className="flex items-center gap-2 border-b border-brand-border pb-4">
          <Lock size={14} className="text-brand-gold" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-brand-text-primary">Security</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-mono uppercase tracking-wider text-brand-text-muted font-bold mb-1.5">Session Timeout (minutes)</label>
            <input value={settings.sessionTimeout} onChange={(e) => setSettings({ ...settings, sessionTimeout: e.target.value })}
              className="w-full bg-brand-bg-secondary/50 border border-brand-border rounded-xl px-4 py-3 text-xs text-brand-text-primary focus:outline-none focus:border-brand-gold transition-all" />
          </div>
          <div>
            <label className="block text-[10px] font-mono uppercase tracking-wider text-brand-text-muted font-bold mb-1.5">Max Login Attempts</label>
            <input value={settings.maxLoginAttempts} onChange={(e) => setSettings({ ...settings, maxLoginAttempts: e.target.value })}
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
        </div>

        <div className="flex items-center gap-2 border-b border-brand-border pb-4">
          <Database size={14} className="text-brand-gold" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-brand-text-primary">Data</h2>
        </div>

        <div>
          <label className="block text-[10px] font-mono uppercase tracking-wider text-brand-text-muted font-bold mb-1.5">Audit Log Retention (days)</label>
          <input value={settings.storageRetention} onChange={(e) => setSettings({ ...settings, storageRetention: e.target.value })}
            className="w-full bg-brand-bg-secondary/50 border border-brand-border rounded-xl px-4 py-3 text-xs text-brand-text-primary focus:outline-none focus:border-brand-gold transition-all" />
        </div>

        <button className="w-full bg-brand-gold hover:bg-brand-gold-hover text-brand-bg-secondary rounded-xl py-3 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2">
          Save
        </button>
      </div>
    </div>
    </>
  )
}
