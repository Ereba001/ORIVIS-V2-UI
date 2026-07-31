import { motion } from "motion/react"

interface Step {
  num: number
  label: string
}

interface Props {
  steps: Step[]
  currentStep: number
}

export default function StepIndicator({ steps, currentStep }: Props) {
  return (
    <div className="flex items-center justify-center flex-wrap gap-1 mb-6">
      {steps.map((s) => {
        const isActive = currentStep === s.num
        const isCompleted = currentStep > s.num
        return (
          <div key={s.num} className="flex items-center gap-1">
            <motion.div
              layout
              className={`h-6 px-2.5 rounded-full flex items-center gap-1 text-[9px] font-mono font-bold uppercase border transition-all duration-300 ${
                isActive
                  ? "bg-brand-gold text-brand-bg-secondary border-brand-gold shadow-sm"
                  : isCompleted
                    ? "bg-brand-surface text-brand-text-muted border-brand-border"
                    : "bg-brand-bg-secondary text-brand-text-disabled border-transparent"
              }`}
            >
              <span
                className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[7px] ${
                  isActive
                    ? "bg-brand-bg-secondary text-brand-gold"
                    : "bg-brand-text-disabled/10 text-brand-text-disabled"
                }`}
              >
                {isCompleted ? "✓" : s.num}
              </span>
              <span>{s.label}</span>
            </motion.div>
            {s.num < steps.length && (
              <div className={`w-2 h-px ${isCompleted ? "bg-brand-gold/50" : "bg-brand-border"}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}

export const ORGANIZE_STEPS = [
  { num: 1, label: "Registration" },
  { num: 2, label: "Branding" },
]
