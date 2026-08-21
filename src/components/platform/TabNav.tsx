import { motion } from "motion/react"

interface Tab {
  id: string
  label: string
  count?: number
}

interface Props {
  tabs: Tab[]
  activeTab: string
  onChange: (id: string) => void
}

export default function TabNav({ tabs, activeTab, onChange }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-1.5 p-1 bg-brand-surface-elevated rounded-2xl w-fit">
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`relative px-3 py-2 text-[11px] font-bold uppercase tracking-wider rounded-xl transition-colors cursor-pointer ${
              isActive ? "text-white" : "text-brand-text-muted hover:text-brand-text-primary"
            }`}
          >
            {isActive && (
              <motion.span
                layoutId="tab-active-bg"
                className="absolute inset-0 bg-brand-gold rounded-xl"
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-2">
              {tab.label}
              {tab.count !== undefined && (
                <span className={`text-[10px] font-mono ${isActive ? "text-white/70" : "text-brand-text-disabled"}`}>
                  {tab.count}
                </span>
              )}
            </span>
          </button>
        )
      })}
    </div>
  )
}
