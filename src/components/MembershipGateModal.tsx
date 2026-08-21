import { useState } from "react"
import { motion, AnimatePresence } from "motion/react"
import { X, UserRound, UserRoundPlus } from "lucide-react"

export type MembershipChoice = "yes" | "no" | "pass"

interface MembershipGateModalProps {
  open: boolean
  onClose: () => void
  onResolve: (choice: MembershipChoice) => void
  organizationName?: string
}

/**
 * Google-Forms-style membership gate shown before the voter console and public
 * election directory. No sub-actions — just a crisp Yes / No choice.
 */
export default function MembershipGateModal({
  open,
  onClose,
  onResolve,
  organizationName,
}: MembershipGateModalProps) {
  const [choice, setChoice] = useState<MembershipChoice | null>(null)

  function handleConfirm() {
    if (!choice) return
    onResolve(choice)
    setChoice(null)
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Membership verification"
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            initial={{ y: 20, opacity: 0, scale: 0.97 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 20, opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-lg rounded-3xl bg-brand-surface border border-brand-border shadow-2xl overflow-hidden"
          >
            <div
              className="h-2 w-full"
              style={{ background: "linear-gradient(90deg, var(--org-primary), var(--org-accent))" }}
            />
            <button
              onClick={onClose}
              aria-label="Close"
              className="absolute right-4 top-5 text-brand-text-muted hover:text-brand-text-primary transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>

            <div className="p-6 sm:p-8 space-y-6">
              <div className="space-y-1.5">
                <span className="text-[10px] font-mono uppercase tracking-widest font-bold" style={{ color: "var(--org-primary)" }}>
                  {organizationName ?? "ORIVIS"}
                </span>
                <h2 className="text-xl font-display font-bold text-brand-text-primary">Are you a member of this organization?</h2>
                <p className="text-xs text-brand-text-muted">
                  Let us know so we can take you to the right experience.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <GateOption
                  selected={choice === "yes"}
                  onSelect={() => setChoice("yes")}
                  icon={<UserRound size={20} />}
                  title="Yes, I'm a member"
                  description="I'm registered and have my voting pass."
                />
                <GateOption
                  selected={choice === "no"}
                  onSelect={() => setChoice("no")}
                  icon={<UserRoundPlus size={20} />}
                  title="Not yet a member"
                  description="I want to register as a voter."
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl bg-brand-surface border border-brand-border text-brand-text-muted hover:text-brand-text-primary text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={!choice}
                  className="px-5 py-2.5 rounded-xl text-brand-bg-secondary text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  style={{ backgroundColor: "var(--org-primary)" }}
                >
                  Continue
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function GateOption({
  selected,
  onSelect,
  icon,
  title,
  description,
}: {
  selected: boolean
  onSelect: () => void
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <button
      onClick={onSelect}
      className={`w-full text-left p-4 rounded-2xl border-2 transition-all cursor-pointer ${
        selected
          ? "border-[var(--org-primary)] bg-[var(--org-primary)]/[0.06]"
          : "border-brand-border bg-brand-surface-elevated hover:border-[var(--org-primary)]/40"
      }`}
    >
      <span
        className="w-9 h-9 rounded-xl flex items-center justify-center mb-2.5"
        style={{ color: selected ? "var(--org-primary)" : "var(--brand-text-muted)", backgroundColor: "color-mix(in srgb, var(--org-primary) 10%, transparent)" }}
      >
        {icon}
      </span>
      <span className="block text-sm font-bold text-brand-text-primary">{title}</span>
      <span className="block text-[11px] text-brand-text-muted mt-0.5 leading-snug">{description}</span>
    </button>
  )
}