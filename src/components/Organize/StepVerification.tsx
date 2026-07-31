import { motion } from "motion/react"
import DragDropFileInput from "../DragDropFileInput"
import type { OrganizePhase2 } from "../../types/organize"

interface Props {
  data: OrganizePhase2
  onChange: (data: OrganizePhase2) => void
  onNext: () => void
  onBack: () => void
}

export default function StepVerification({ data, onChange, onNext, onBack }: Props) {
  const update = <K extends keyof OrganizePhase2>(key: K, value: OrganizePhase2[K]) =>
    onChange({ ...data, [key]: value })

  return (
    <form onSubmit={(e) => { e.preventDefault(); onNext() }} className="space-y-4">
      <DragDropFileInput
        label="Organization Logo"
        accept=".jpg,.jpeg,.png,.svg,.webp"
        value={data.logo}
        onChange={(f) => update("logo", f)}
      />

      <DragDropFileInput
        label="Cover Image (optional)"
        accept=".jpg,.jpeg,.png,.webp"
        value={data.banner}
        onChange={(f) => update("banner", f)}
      />

      <div>
        <label className="block text-[10px] font-mono uppercase tracking-wider text-brand-text-muted font-bold mb-1.5">
          Primary Color
        </label>
        <div className="flex items-center gap-3">
          <input
            type="color"
            value={data.brandColor}
            onChange={(e) => update("brandColor", e.target.value)}
            className="w-10 h-10 rounded-xl border border-brand-border cursor-pointer bg-transparent"
          />
          <span className="text-xs font-mono text-brand-text-muted">{data.brandColor}</span>
        </div>
      </div>

      <div>
        <label className="block text-[10px] font-mono uppercase tracking-wider text-brand-text-muted font-bold mb-1.5">
          Secondary Color
        </label>
        <div className="flex items-center gap-3">
          <input
            type="color"
            value={data.brandColor === '#FCA311' ? '#FFFFFF' : '#FCA311'}
            onChange={(e) => update("brandColor", e.target.value)}
            className="w-10 h-10 rounded-xl border border-brand-border cursor-pointer bg-transparent"
          />
          <span className="text-xs font-mono text-brand-text-muted">{data.brandColor === '#FCA311' ? '#FFFFFF' : data.brandColor}</span>
        </div>
        <p className="text-[9px] text-brand-text-muted mt-1 italic">
          Secondary color applied automatically. Use the branding settings later to customize further.
        </p>
      </div>

      <div className="flex gap-3 mt-6">
        <button
          type="button"
          onClick={onBack}
          className="w-1/3 bg-brand-surface border border-brand-border hover:bg-brand-surface-interactive text-brand-text-primary rounded-xl py-3.5 text-xs font-bold uppercase tracking-widest transition-colors cursor-pointer"
        >
          Back
        </button>
        <motion.button
          type="submit"
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          className="w-2/3 bg-brand-gold hover:bg-brand-gold-hover text-brand-bg-secondary rounded-xl py-3.5 text-xs font-bold uppercase tracking-widest shadow-md transition-all duration-200 cursor-pointer"
        >
          Create Organization
        </motion.button>
      </div>
    </form>
  )
}
