import { useState, useEffect, useCallback } from 'react'
import {
  Globe, Lock, Clock, Upload, Eye, Bell, Loader2, AlertCircle,
  Shield, Smartphone, Mail, Moon, Sun, Monitor, EyeOff, Trash2,
} from 'lucide-react'
import { useOrgBranding } from '../contexts/OrgBrandingContext'
import { useAuth } from '../../hooks/useAuth'
import DashboardCard from '../components/DashboardCard'
import PasswordField from '../../components/auth/PasswordField'
import { authService } from '../../services/auth-service'
import { orgSettingsService, type OrgProfile, type OrgBrandingData, type OrgSettings } from '../services/org-settings-service'
import SeoHead from "../../components/SeoHead"
import MediaPicker, { type MediaSource } from '../../components/MediaPicker'

type SettingsTab = 'profile' | 'branding' | 'workspace' | 'notifications' | 'security'

const DEFAULT_PROFILE: OrgProfile = {
  organizationName: '', shortName: '', contactEmail: '', phone: '', website: '', address: '', about: '', founded: '', sector: '',
}

const DEFAULT_BRANDING: OrgBrandingData = {
  logoUrl: null, faviconUrl: null, primaryColor: '#FCA311', secondaryColor: '#3B82F6', accentColor: '#10B981', themeMode: 'light',
}

const DEFAULT_CONFIG: OrgSettings = {
  workspaceName: '', timezone: 'Africa/Lagos', language: 'en', eventVisibility: 'public',
  notificationEmail: true, notificationSms: false, notificationPush: true,
  sessionTimeout: 30, require2fa: false, loginAlerts: true,
}

export default function OrgWorkspaceSettings() {
  const { branding, updateBranding } = useOrgBranding()
  const { activeOrganization } = useAuth()
  const orgId = activeOrganization?.organizationId
  const [tab, setTab] = useState<SettingsTab>('profile')
  const pColor = branding.primaryColor

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [profile, setProfile] = useState<OrgProfile>(DEFAULT_PROFILE)
  const [brandSettings, setBrandSettings] = useState<OrgBrandingData>(DEFAULT_BRANDING)
  const [logoSource, setLogoSource] = useState<MediaSource | null>(null)
  const [faviconSource, setFaviconSource] = useState<MediaSource | null>(null)
  const [config, setConfig] = useState<OrgSettings>(DEFAULT_CONFIG)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const [logoDeleting, setLogoDeleting] = useState(false)

  const [pwCurrent, setPwCurrent] = useState('')
  const [pwNew, setPwNew] = useState('')
  const [pwConfirm, setPwConfirm] = useState('')
  const [pwSubmitting, setPwSubmitting] = useState(false)
  const [pwError, setPwError] = useState<string | null>(null)
  const [pwSuccess, setPwSuccess] = useState<string | null>(null)

  const loadSettings = useCallback(() => {
    if (!orgId) { setLoading(false); return }
    setLoading(true)
    setError(null)
    Promise.all([
      orgSettingsService.fetchProfile(orgId).catch(() => DEFAULT_PROFILE),
      orgSettingsService.fetchBranding(orgId).catch(() => DEFAULT_BRANDING),
      orgSettingsService.fetchSettings(orgId).catch(() => DEFAULT_CONFIG),
    ]).then(([p, b, c]) => {
      setProfile(p)
      setBrandSettings(b)
      setConfig(c)
    }).catch(() => setError('Failed to load settings')).finally(() => setLoading(false))
  }, [orgId])

  useEffect(() => {
    loadSettings()
  }, [loadSettings])

  const handleChangePassword = async () => {
    setPwError(null)
    setPwSuccess(null)
    if (!pwCurrent) { setPwError('Your current password is required.'); return }
    if (!pwNew) { setPwError('A new password is required.'); return }
    if (pwNew.length < 8) { setPwError('Password must be at least 8 characters.'); return }
    if (pwNew !== pwConfirm) { setPwError('Passwords do not match.'); return }
    setPwSubmitting(true)
    try {
      await authService.changePassword(pwCurrent, pwNew)
      setPwCurrent('')
      setPwNew('')
      setPwConfirm('')
      setPwSuccess('Password updated successfully.')
      setTimeout(() => setPwSuccess(null), 3000)
    } catch (err: unknown) {
      setPwError(err instanceof Error ? err.message : 'Failed to update password.')
    } finally {
      setPwSubmitting(false)
    }
  }

  const handleDeleteLogo = async () => {
    if (!orgId || !brandSettings.logoUrl) return
    setLogoDeleting(true)
    try {
      await orgSettingsService.deleteLogo()
      setBrandSettings({ ...brandSettings, logoUrl: null })
      updateBranding({ logoUrl: null })
      setLogoSource(null)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to delete logo')
    } finally {
      setLogoDeleting(false)
    }
  }

  const handleSave = async () => {
    if (!orgId) return
    setSaving(true)
    setSaved(false)
    setError(null)
    try {
      let logoUrl = brandSettings.logoUrl
      let faviconUrl = brandSettings.faviconUrl

      if (logoSource?.type === 'file') {
        logoUrl = await orgSettingsService.uploadLogo(logoSource.file)
      } else if (logoSource?.type === 'url') {
        logoUrl = logoSource.url
      }

      if (faviconSource?.type === 'file') {
        faviconUrl = await orgSettingsService.uploadFavicon(faviconSource.file)
      } else if (faviconSource?.type === 'url') {
        faviconUrl = faviconSource.url
      }

      await Promise.all([
        orgSettingsService.updateProfile(orgId, profile),
        orgSettingsService.updateBranding(orgId, {
          ...brandSettings,
          logoUrl,
          faviconUrl,
        }),
        orgSettingsService.updateSettings(orgId, config),
      ])
      updateBranding({
        primaryColor: brandSettings.primaryColor,
        secondaryColor: brandSettings.secondaryColor,
        accentColor: brandSettings.accentColor,
        shortName: profile.shortName,
        organizationName: profile.organizationName,
        logoUrl,
        faviconUrl,
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <SeoHead meta={{ title: "Workspace Settings — Organization | ORIVIS", noindex: true }} />
      <div className="space-y-6">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 size={24} className="animate-spin text-brand-gold" />
          </div>
        ) : error && !saving ? (
          <div className="bg-status-error/10 border border-status-error/20 rounded-xl p-6 text-center">
            <AlertCircle size={24} className="text-status-error mx-auto mb-2" />
            <p className="text-sm text-status-error font-semibold">{error}</p>
            <button onClick={loadSettings} className="mt-3 text-[10px] text-brand-text-muted hover:text-brand-text-primary underline cursor-pointer">Retry</button>
          </div>
        ) : (<>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--org-primary)' }}>Workspace Settings</h1>
            <p className="text-sm text-brand-text-muted mt-1">Configure your organization profile, branding, and workspace preferences.</p>
          </div>
          <button onClick={handleSave} disabled={saving}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all text-white disabled:opacity-50 w-full sm:w-auto"
            style={{ backgroundColor: saved ? '#22C55E' : pColor }}>
            {saving ? 'Saving...' : saved ? 'Saved!' : 'Save'}
          </button>
        </div>

      <div className="flex items-center gap-1 bg-brand-surface-elevated rounded-xl p-1 w-fit flex-wrap">
        {(['profile', 'branding', 'workspace', 'notifications', 'security'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-[10px] font-bold transition-all ${
              tab === t ? 'text-white' : 'text-brand-text-muted hover:text-brand-text-primary'
            }`}
            style={tab === t ? { backgroundColor: pColor } : {}}>
            {t === 'profile' ? 'Organization' : t === 'branding' ? 'Branding' : t === 'workspace' ? 'Workspace' : t === 'notifications' ? 'Notifications' : 'Security'}
          </button>
        ))}
      </div>

      {tab === 'profile' && (
        <DashboardCard hover={false}>
          <h2 className="text-xs font-bold text-brand-text-primary mb-4">Organization Profile</h2>
          <div className="space-y-4 max-w-2xl">
            <div className="flex items-center gap-6 mb-2">
              {brandSettings.logoUrl ? (
                <img src={brandSettings.logoUrl} alt="Organization logo" className="w-16 h-16 rounded-xl object-contain bg-brand-surface-elevated p-1 shrink-0" />
              ) : (
                <div className="w-16 h-16 rounded-xl flex items-center justify-center text-lg font-bold text-white shrink-0" style={{ backgroundColor: pColor }}>
                  {profile.shortName?.charAt(0) || 'O'}
                </div>
              )}
              <div>
                <p className="text-xs font-semibold text-brand-text-primary">{profile.organizationName}</p>
                <p className="text-[9px] text-brand-text-muted">Logo preview · 64x64px</p>
                <div className="flex items-center gap-2 mt-1">
                  <button type="button" onClick={() => setTab('branding')} className="flex items-center gap-1 text-[10px] font-bold cursor-pointer hover:opacity-80 transition-opacity" style={{ color: pColor }}>
                    <Upload size={12} /> Upload New Logo
                  </button>
                  {brandSettings.logoUrl && (
                    <button type="button" onClick={handleDeleteLogo} disabled={logoDeleting}
                      className="flex items-center gap-1 text-[10px] font-bold cursor-pointer hover:opacity-80 transition-opacity text-status-error disabled:opacity-50">
                      <Trash2 size={12} /> {logoDeleting ? 'Removing...' : 'Remove Logo'}
                    </button>
                  )}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] text-brand-text-muted font-bold mb-1.5" htmlFor="organizationName">Organization Name</label>
                <input id="organizationName" name="organizationName" value={profile.organizationName} onChange={(e) => setProfile({ ...profile, organizationName: e.target.value })}
                  className="w-full bg-brand-bg-secondary/50 border border-brand-divider rounded-xl px-4 py-3 text-xs text-brand-text-primary focus:outline-none transition-all" />
              </div>
              <div>
                <label className="block text-[10px] text-brand-text-muted font-bold mb-1.5" htmlFor="shortName">Short Name</label>
                <input id="shortName" name="shortName" value={profile.shortName} onChange={(e) => setProfile({ ...profile, shortName: e.target.value })}
                  className="w-full bg-brand-bg-secondary/50 border border-brand-divider rounded-xl px-4 py-3 text-xs text-brand-text-primary focus:outline-none transition-all" />
              </div>
              <div>
                <label className="block text-[10px] text-brand-text-muted font-bold mb-1.5" htmlFor="contactEmail">Contact Email</label>
                <input id="contactEmail" name="contactEmail" value={profile.contactEmail} onChange={(e) => setProfile({ ...profile, contactEmail: e.target.value })}
                  className="w-full bg-brand-bg-secondary/50 border border-brand-divider rounded-xl px-4 py-3 text-xs text-brand-text-primary focus:outline-none transition-all" />
              </div>
              <div>
                <label className="block text-[10px] text-brand-text-muted font-bold mb-1.5" htmlFor="phone">Phone</label>
                <input id="phone" name="phone" value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  className="w-full bg-brand-bg-secondary/50 border border-brand-divider rounded-xl px-4 py-3 text-xs text-brand-text-primary focus:outline-none transition-all" />
              </div>
              <div>
                <label className="block text-[10px] text-brand-text-muted font-bold mb-1.5" htmlFor="website">Website</label>
                <input id="website" name="website" value={profile.website} onChange={(e) => setProfile({ ...profile, website: e.target.value })}
                  className="w-full bg-brand-bg-secondary/50 border border-brand-divider rounded-xl px-4 py-3 text-xs text-brand-text-primary focus:outline-none transition-all" />
              </div>
              <div>
                <label className="block text-[10px] text-brand-text-muted font-bold mb-1.5" htmlFor="address">Address</label>
                <input id="address" name="address" value={profile.address} onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                  className="w-full bg-brand-bg-secondary/50 border border-brand-divider rounded-xl px-4 py-3 text-xs text-brand-text-primary focus:outline-none transition-all" />
              </div>
            </div>
            <div className="pt-4 border-t border-brand-divider">
              <h3 className="text-[10px] font-bold text-brand-text-muted mb-3">Additional Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] text-brand-text-muted font-bold mb-1.5" htmlFor="about">About / Description</label>
                  <textarea id="about" name="about" value={profile.about ?? ''} onChange={(e) => setProfile({ ...profile, about: e.target.value })}
                    className="w-full bg-brand-bg-secondary/50 border border-brand-divider rounded-xl px-4 py-3 text-xs text-brand-text-primary focus:outline-none transition-all resize-none" rows={3} />
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] text-brand-text-muted font-bold mb-1.5" htmlFor="founded">Founded</label>
                    <input id="founded" name="founded" value={profile.founded ?? ''} onChange={(e) => setProfile({ ...profile, founded: e.target.value })}
                      className="w-full bg-brand-bg-secondary/50 border border-brand-divider rounded-xl px-4 py-3 text-xs text-brand-text-primary focus:outline-none transition-all" />
                  </div>
                  <div>
                    <label className="block text-[10px] text-brand-text-muted font-bold mb-1.5" htmlFor="sector">Sector</label>
                    <input id="sector" name="sector" value={profile.sector ?? ''} onChange={(e) => setProfile({ ...profile, sector: e.target.value })}
                      className="w-full bg-brand-bg-secondary/50 border border-brand-divider rounded-xl px-4 py-3 text-xs text-brand-text-primary focus:outline-none transition-all" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </DashboardCard>
      )}

      {tab === 'branding' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <DashboardCard hover={false}>
            <h2 className="text-xs font-bold text-brand-text-primary mb-4">Brand Colors</h2>
            <div className="space-y-4">
              {([
                { label: 'Primary Color', key: 'primaryColor', value: brandSettings.primaryColor },
                { label: 'Secondary Color', key: 'secondaryColor', value: brandSettings.secondaryColor },
                { label: 'Accent Color', key: 'accentColor', value: brandSettings.accentColor },
              ] as const).map((c) => (
                <div key={c.key}>
                  <label className="block text-[10px] text-brand-text-muted font-bold mb-1.5">{c.label}</label>
                  <div className="flex items-center gap-3">
                    <input type="color" name="brandColor" value={c.value} aria-label="Brand color"
                      onChange={(e) => setBrandSettings({ ...brandSettings, [c.key]: e.target.value })}
                      className="w-10 h-10 rounded-xl border border-brand-divider bg-transparent cursor-pointer" />
                    <input name="brandColorHex" value={c.value} readOnly aria-label="Brand color hex"
                      className="flex-1 bg-brand-bg-secondary/50 border border-brand-divider rounded-xl px-4 py-3 text-xs text-brand-text-muted focus:outline-none transition-all" />
                  </div>
                </div>
              ))}
              <div>
                <label className="block text-[10px] text-brand-text-muted font-bold mb-1.5">Theme Mode</label>
                <div className="flex items-center gap-2">
                  {([
                    { label: 'Light', icon: Sun, value: 'light' as const },
                    { label: 'Dark', icon: Moon, value: 'dark' as const },
                    { label: 'System', icon: Monitor, value: 'system' as const },
                  ]).map((t) => {
                    const Icon = t.icon
                    return (
                      <button key={t.value} onClick={() => setBrandSettings({ ...brandSettings, themeMode: t.value })}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[10px] font-bold transition-all ${
                          brandSettings.themeMode === t.value ? 'text-white' : 'border border-brand-divider text-brand-text-muted hover:bg-brand-surface-interactive'
                        }`}
                        style={brandSettings.themeMode === t.value ? { backgroundColor: pColor } : {}}>
                        <Icon size={14} /> {t.label}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          </DashboardCard>

          <DashboardCard hover={false}>
            <h2 className="text-xs font-bold text-brand-text-primary mb-4">Logo & Favicon</h2>
            <div className="space-y-4">
              <MediaPicker
                label="Logo"
                accept=".jpg,.jpeg,.png,.svg,.webp"
                hint="Recommended: 200 x 200px, max 1MB. Supports file upload or image URL."
                value={logoSource}
                onChange={setLogoSource}
                initialUrl={brandSettings.logoUrl}
              />
              <MediaPicker
                label="Favicon"
                accept=".jpg,.jpeg,.png,.svg,.ico,.webp"
                hint="Shown in the browser tab. Supports file upload or image URL."
                value={faviconSource}
                onChange={setFaviconSource}
                initialUrl={brandSettings.faviconUrl}
              />
            </div>
          </DashboardCard>

          <DashboardCard hover={false}>
            <h2 className="text-xs font-bold text-brand-text-primary mb-4">Preview</h2>
            <div className="rounded-xl border border-brand-divider overflow-hidden">
              <div className="h-20 flex items-center justify-center" style={{ backgroundColor: brandSettings.primaryColor }}>
                <span className="text-white text-sm font-bold ">ORIVIS WORKSPACE</span>
              </div>
              <div className="p-4 bg-brand-surface space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: brandSettings.primaryColor }}>O</div>
                  <div>
                    <p className="text-xs font-semibold text-brand-text-primary">{profile.organizationName}</p>
                    <p className="text-[9px] text-brand-text-muted">Powered by ORIVIS</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <span className="px-3 py-1.5 rounded-lg text-[10px] font-bold text-white" style={{ backgroundColor: brandSettings.primaryColor }}>Primary</span>
                  <span className="px-3 py-1.5 rounded-lg text-[10px] font-bold text-white" style={{ backgroundColor: brandSettings.secondaryColor }}>Secondary</span>
                  <span className="px-3 py-1.5 rounded-lg text-[10px] font-bold text-white" style={{ backgroundColor: brandSettings.accentColor }}>Accent</span>
                </div>
                <div className="h-2 rounded-full" style={{ backgroundColor: brandSettings.primaryColor, width: '60%' }} />
                <div className="flex items-center gap-2 text-[10px] text-brand-text-muted">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: brandSettings.secondaryColor }} />
                  Online — All systems operational
                </div>
              </div>
            </div>
          </DashboardCard>
        </div>
      )}

        {tab === 'workspace' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <DashboardCard hover={false}>
            <h2 className="text-xs font-bold text-brand-text-primary mb-4">Workspace Configuration</h2>
            <div className="space-y-4">
              <div>
                <label className="flex items-center gap-2 text-[10px] text-brand-text-muted font-bold mb-1.5" htmlFor="workspaceName">
                  <Globe size={12} /> Workspace Name
                </label>
                <input id="workspaceName" name="workspaceName" value={config.workspaceName} onChange={(e) => setConfig({ ...config, workspaceName: e.target.value })}
                  className="w-full bg-brand-bg-secondary/50 border border-brand-divider rounded-xl px-4 py-3 text-xs text-brand-text-primary focus:outline-none transition-all" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center gap-2 text-[10px] text-brand-text-muted font-bold mb-1.5" htmlFor="timezone">
                    <Clock size={12} /> Time Zone
                  </label>
                  <select id="timezone" name="timezone" value={config.timezone} onChange={(e) => setConfig({ ...config, timezone: e.target.value })}
                    className="w-full bg-brand-bg-secondary/50 border border-brand-divider rounded-xl px-4 py-3 text-xs text-brand-text-primary focus:outline-none transition-all">
                    <option value="Africa/Lagos">Africa/Lagos (WAT)</option>
                    <option value="Africa/Nairobi">Africa/Nairobi (EAT)</option>
                    <option value="America/New_York">America/New_York (EST)</option>
                    <option value="Europe/London">Europe/London (GMT)</option>
                  </select>
                </div>
                <div>
                  <label className="flex items-center gap-2 text-[10px] text-brand-text-muted font-bold mb-1.5" htmlFor="language">
                    <Globe size={12} /> Language
                  </label>
                  <select id="language" name="language" value={config.language} onChange={(e) => setConfig({ ...config, language: e.target.value })}
                    className="w-full bg-brand-bg-secondary/50 border border-brand-divider rounded-xl px-4 py-3 text-xs text-brand-text-primary focus:outline-none transition-all">
                    <option value="en">English</option>
                    <option value="fr">French</option>
                    <option value="es">Spanish</option>
                    <option value="pt">Portuguese</option>
                  </select>
                </div>
              </div>
              <div className="pt-2">
                <label className="block text-[10px] text-brand-text-muted font-bold mb-2">
                  <Eye size={12} className="inline mr-1" /> Event Visibility
                </label>
                <div className="space-y-2">
                  <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl border border-brand-divider hover:bg-brand-surface-interactive/30 transition-all">
                    <input type="radio" name="visibility" checked={config.eventVisibility === 'public'}
                      onChange={() => setConfig({ ...config, eventVisibility: 'public' })}
                      className="w-4 h-4 accent-[var(--org-primary)]" />
                    <div>
                      <p className="text-xs font-semibold text-brand-text-primary flex items-center gap-1.5"><Eye size={12} /> Public</p>
                      <p className="text-[9px] text-brand-text-muted">Anyone can view election details and results.</p>
                    </div>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl border border-brand-divider hover:bg-brand-surface-interactive/30 transition-all">
                    <input type="radio" name="visibility" checked={config.eventVisibility === 'private'}
                      onChange={() => setConfig({ ...config, eventVisibility: 'private' })}
                      className="w-4 h-4 accent-[var(--org-primary)]" />
                    <div>
                      <p className="text-xs font-semibold text-brand-text-primary flex items-center gap-1.5"><EyeOff size={12} /> Private</p>
                      <p className="text-[9px] text-brand-text-muted">Only registered voters can access election pages.</p>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          </DashboardCard>

          <DashboardCard hover={false}>
            <h2 className="text-xs font-bold text-brand-text-primary mb-4">Storage Usage</h2>
            <div className="p-4 rounded-xl bg-brand-surface-elevated/20 text-center">
              <p className="text-[10px] text-brand-text-muted">Storage metrics will appear here once the billing module is connected.</p>
            </div>
            <div className="mt-4 p-3 rounded-xl border border-brand-divider bg-brand-surface-elevated/30">
              <p className="text-[9px] text-brand-text-muted">
                <strong style={{ color: pColor }}>Tip:</strong> Compress uploaded images and archive old elections to free up space.
              </p>
            </div>
          </DashboardCard>
        </div>
      )}

      {tab === 'notifications' && (
        <DashboardCard hover={false}>
          <h2 className="text-xs font-bold text-brand-text-primary mb-4">Notification Preferences</h2>
          <div className="space-y-3 max-w-xl">
            {([
              { key: 'notificationEmail', icon: Mail, label: 'Email Notifications', desc: 'Receive updates via email for election events and team changes.' },
              { key: 'notificationSms', icon: Smartphone, label: 'SMS Notifications', desc: 'Get text messages for critical alerts and urgent updates.' },
              { key: 'notificationPush', icon: Bell, label: 'Push Notifications', desc: 'Receive in-browser notifications when you are online.' },
            ] as const).map((n) => {
              const Icon = n.icon
              const isOn = config[n.key]
              return (
                <label key={n.key} className="flex items-center justify-between p-3 rounded-xl border border-brand-divider hover:bg-brand-surface-interactive/30 transition-all cursor-pointer">
                  <div className="flex items-center gap-3">
                    <Icon size={16} style={{ color: pColor }} />
                    <div>
                      <p className="text-xs font-semibold text-brand-text-primary">{n.label}</p>
                      <p className="text-[9px] text-brand-text-muted">{n.desc}</p>
                    </div>
                  </div>
                  <button onClick={() => setConfig({ ...config, [n.key]: !isOn })}
                    className={`relative w-10 h-5 rounded-full transition-all ${isOn ? 'bg-[var(--org-primary)]' : 'bg-brand-surface-elevated'}`}>
                    <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${isOn ? 'left-5' : 'left-0.5'}`} />
                  </button>
                </label>
              )
            })}
          </div>
        </DashboardCard>
      )}

      {tab === 'security' && (<>
        <DashboardCard hover={false}>
          <h2 className="text-xs font-bold text-brand-text-primary mb-4">Security Preferences</h2>
          <div className="space-y-4 max-w-xl">
            {([
              { key: 'sessionTimeout', label: 'Session Timeout', desc: 'Automatically sign out after inactivity.', control: 'select' },
              { key: 'require2fa', label: 'Require Two-Factor Authentication', desc: 'All team members must set up 2FA to access the workspace.', control: 'toggle' },
              { key: 'loginAlerts', label: 'Login Alerts', desc: 'Send notifications when new devices or locations access the workspace.', control: 'toggle' },
            ] as const).map((s) => (
              <div key={s.key} className="flex items-center justify-between p-3 rounded-xl border border-brand-divider hover:bg-brand-surface-interactive/30 transition-all">
                <div className="flex items-center gap-3">
                  <Shield size={16} style={{ color: pColor }} />
                  <div>
                    <p className="text-xs font-semibold text-brand-text-primary">{s.label}</p>
                    <p className="text-[9px] text-brand-text-muted">{s.desc}</p>
                  </div>
                </div>
                {s.control === 'toggle' ? (
                  <button onClick={() => setConfig({ ...config, [s.key]: !(config as any)[s.key] })}
                    className={`relative w-10 h-5 rounded-full transition-all ${(config as any)[s.key] ? 'bg-[var(--org-primary)]' : 'bg-brand-surface-elevated'}`}>
                    <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${(config as any)[s.key] ? 'left-5' : 'left-0.5'}`} />
                  </button>
                ) : (
                  <select name="sessionTimeout" value={config.sessionTimeout} onChange={(e) => setConfig({ ...config, sessionTimeout: Number(e.target.value) })} aria-label="Session timeout"
                    className="bg-brand-bg-secondary/50 border border-brand-divider rounded-lg px-3 py-1.5 text-[10px] text-brand-text-primary focus:outline-none">
                    <option value={15}>15 min</option>
                    <option value={30}>30 min</option>
                    <option value={60}>1 hour</option>
                    <option value={120}>2 hours</option>
                    <option value={240}>4 hours</option>
                  </select>
                )}
              </div>
            ))}
            <div className="p-3 rounded-xl border border-brand-divider bg-brand-surface-elevated/30">
              <p className="text-[9px] text-brand-text-muted">
                <Lock size={10} className="inline mr-1" />
                All data is encrypted in transit and at rest using AES-256.
              </p>
            </div>
          </div>
        </DashboardCard>

        <DashboardCard hover={false}>
          <h2 className="text-xs font-bold text-brand-text-primary mb-4">Change Password</h2>
          {pwError && (
            <div className="mb-4 p-3 bg-status-error/10 border border-status-error/20 rounded-xl text-status-error text-[11px] font-semibold">
              {pwError}
            </div>
          )}
          {pwSuccess && (
            <div className="mb-4 p-3 bg-status-success/10 border border-status-success/20 rounded-xl text-status-success text-[11px] font-semibold">
              {pwSuccess}
            </div>
          )}
          <div className="space-y-4 max-w-xl">
            <PasswordField
              id="currentPassword"
              label="Current Password"
              value={pwCurrent}
              onChange={setPwCurrent}
              placeholder="Enter your current password"
              disabled={pwSubmitting}
            />
            <PasswordField
              id="newPassword"
              label="New Password"
              value={pwNew}
              onChange={setPwNew}
              placeholder="Enter a new password"
              showStrength
              disabled={pwSubmitting}
            />
            <PasswordField
              id="confirmNewPassword"
              label="Confirm New Password"
              value={pwConfirm}
              onChange={setPwConfirm}
              placeholder="Re-enter your new password"
              disabled={pwSubmitting}
            />
            <button
              onClick={handleChangePassword}
              disabled={pwSubmitting}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all text-white disabled:opacity-50 w-full sm:w-auto"
              style={{ backgroundColor: pwSubmitting ? undefined : pColor }}
            >
              {pwSubmitting ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </DashboardCard>
      </>)}
      </> )}
    </div>
    </>
  )
}