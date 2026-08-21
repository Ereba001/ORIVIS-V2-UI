import { useState } from 'react'
import { motion } from 'motion/react'
import { Lock, Globe, Calendar, Loader2 } from 'lucide-react'
import { useOrgBranding } from '../../contexts/OrgBrandingContext'
import DashboardCard from '../../components/DashboardCard'
import ProgressBar from '../../components/ProgressBar'
import MediaPicker, { type MediaSource } from '../../../components/MediaPicker'
import { electionService } from '../../../services/election-service'
import { type OrivisEvent } from './_shared'

export function BrandingTab({ event, locked, saveSuccess, setSaveSuccess }: { event: OrivisEvent; locked?: boolean; saveSuccess: boolean; setSaveSuccess: (v: boolean) => void }) {
  const { branding } = useOrgBranding()
  const pColor = branding.primaryColor
  const [theme, setTheme] = useState(event.branding.theme)
  const [customUrl, setCustomUrl] = useState(event.branding.customUrl || '')
  const [banner, setBanner] = useState<MediaSource | null>(event.branding.bannerUrl ? { type: 'url', url: event.branding.bannerUrl } : null)
  const [logo, setLogo] = useState<MediaSource | null>(event.branding.logoUrl ? { type: 'url', url: event.branding.logoUrl } : null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const handleSave = async () => {
    setSaving(true)
    setSaveError(null)
    try {
      const tasks: Promise<unknown>[] = []
      const settingsPayload: Record<string, unknown> = {
        theme,
        customUrl: customUrl || null,
      }
      if (logo?.type === 'url') {
        settingsPayload.logoUrl = logo.url
      }
      tasks.push(electionService.updateElection(event.id, {
        bannerUrl: banner?.type === 'url' ? banner.url : (event.branding.bannerUrl ?? null),
        settings: settingsPayload,
        auditNote: 'Updated election branding',
      }))
      if (banner?.type === 'file') {
        const fd = new FormData()
        fd.append('file', banner.file)
        tasks.push(electionService.uploadBanner(event.id, fd))
      }
      if (logo?.type === 'file') {
        const fd = new FormData()
        fd.append('file', logo.file)
        tasks.push(electionService.uploadLogo(event.id, fd))
      }
      await Promise.all(tasks)
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 2000)
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save branding')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {locked && (
        <div className="lg:col-span-2 flex items-start gap-3 p-4 rounded-xl bg-status-warning/10 border border-status-warning/20">
          <Lock size={14} className="text-status-warning shrink-0 mt-0.5" />
          <p className="text-[10px] text-status-warning font-medium">Branding is locked because this event has been published.</p>
        </div>
      )}
      <div className="lg:col-span-2 space-y-6">
        <DashboardCard hover={false}>
          <h3 className="text-xs font-bold text-brand-text-primary mb-4">Banner Image</h3>
          <MediaPicker
            label="Banner"
            accept=".jpg,.jpeg,.png,.webp"
            hint="Recommended: 1200 x 300px, max 2MB. Supports file upload or image URL."
            value={banner}
            onChange={setBanner}
            initialUrl={event.branding.bannerUrl}
            disabled={saving || locked}
          />
        </DashboardCard>

        <DashboardCard hover={false}>
          <h3 className="text-xs font-bold text-brand-text-primary mb-4">Logo</h3>
          <MediaPicker
            label="Logo"
            accept=".jpg,.jpeg,.png,.svg,.webp"
            hint="Recommended: 200 x 200px, max 1MB. Supports file upload or image URL."
            value={logo}
            onChange={setLogo}
            initialUrl={event.branding.logoUrl}
            disabled={saving || locked}
          />
        </DashboardCard>


        <DashboardCard hover={false}>
          <h3 className="text-xs font-bold text-brand-text-primary mb-4">Theme</h3>
          <div className="flex items-center gap-2 p-1 bg-brand-surface-elevated rounded-xl w-fit">
            {(['light', 'dark', 'system'] as const).map((t) => (
              <button key={t} onClick={() => setTheme(t)}
                className={`px-4 py-2 rounded-lg text-[10px] font-bold transition-all capitalize ${
                  theme === t ? 'text-white' : 'text-brand-text-muted hover:text-brand-text-primary'
                }`}
                style={theme === t ? { backgroundColor: pColor } : {}}>{t}</button>
            ))}
          </div>
        </DashboardCard>

        <DashboardCard hover={false}>
          <h3 className="text-xs font-bold text-brand-text-primary mb-4">Custom URL</h3>
          <div className="flex items-center gap-2">
            <Globe size={14} className="text-brand-text-muted shrink-0" />
            <input name="customUrl" value={customUrl} onChange={(e) => setCustomUrl(e.target.value)} placeholder="https://events.myorg.com/event-slug" aria-label="Custom event URL"
              className="flex-1 bg-brand-bg-secondary/50 border border-brand-border rounded-xl px-4 py-3 text-xs text-brand-text-primary placeholder-brand-text-disabled focus:outline-none transition-all" />
          </div>
        </DashboardCard>

        <div className="flex items-center gap-3">
          {locked ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-bold border border-brand-divider text-brand-text-muted/40">
              <Lock size={12} /> Locked (Event Published)
            </span>
          ) : (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-[10px] font-bold transition-all text-white disabled:opacity-50"
              style={{ backgroundColor: pColor }}
            >
              {saving && <Loader2 size={12} className="animate-spin" />}
              {saving ? 'Saving...' : 'Save Changes'}
            </motion.button>
          )}
          {saveSuccess && (
            <motion.span
              initial={{ opacity: 0, x: -4 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              className="text-[10px] text-status-success font-bold"
            >
              Saved!
            </motion.span>
          )}
          {saveError && (
            <span className="text-[10px] text-status-error font-bold">{saveError}</span>
          )}
        </div>
      </div>

      <div>
        <DashboardCard hover={false}>
          <h3 className="text-xs font-bold text-brand-text-primary mb-4">Preview</h3>
          <div className="rounded-2xl overflow-hidden border border-brand-divider">
            <div className="h-20 relative overflow-hidden" style={{ backgroundColor: pColor }}>
              {banner?.type === 'url' && banner.url ? (
                <img src={banner.url} alt="" className="absolute inset-0 w-full h-full object-cover" />
              ) : event.branding.bannerUrl ? (
                <img src={event.branding.bannerUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
              ) : null}
            </div>
            <div className="p-4 bg-brand-surface">
              <div className="flex items-center gap-3 mb-3">
                {logo?.type === 'url' && logo.url ? (
                  <img src={logo.url} alt="" className="w-10 h-10 rounded-xl object-contain bg-white/10" />
                ) : event.branding.logoUrl ? (
                  <img src={event.branding.logoUrl} alt="" className="w-10 h-10 rounded-xl object-contain bg-white/10" />
                ) : (
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: pColor }}>
                    EV
                  </div>
                )}
                <div>
                  <p className="text-xs font-bold text-brand-text-primary" style={{ color: pColor }}>
                    Event Title Preview
                  </p>
                  <p className="text-[9px] text-brand-text-muted">Organization Name</p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-[9px] text-brand-text-muted">
                  <Calendar size={10} /> Oct 15, 2026
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-[8px] px-1.5 py-0.5 rounded-full" style={{ backgroundColor: `${pColor}20`, color: pColor }}>
                    Live
                  </span>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-brand-divider">
                <ProgressBar value={65} max={100} size="sm" label="Participation" color={pColor} />
              </div>
            </div>
          </div>
        </DashboardCard>
      </div>
    </div>
  )
}
