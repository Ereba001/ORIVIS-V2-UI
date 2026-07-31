import type { ReactNode } from 'react'
import { motion } from 'motion/react'

interface WidgetPanelProps {
  title: string
  subtitle?: string
  children: ReactNode
  headerAction?: ReactNode
  className?: string
}

export default function WidgetPanel({ title, subtitle, children, headerAction, className = '' }: WidgetPanelProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className={`glass-card rounded-2xl overflow-hidden ${className}`}
    >
      <div className="px-5 py-4 border-b border-brand-divider flex items-center justify-between gap-4">
        <div className="min-w-0">
          <h3 className="text-xs font-bold uppercase tracking-wider text-brand-text-primary">{title}</h3>
          {subtitle && <p className="text-[10px] font-mono text-brand-text-muted mt-0.5 truncate">{subtitle}</p>}
        </div>
        {headerAction && <div className="shrink-0">{headerAction}</div>}
      </div>
      <div className="p-5">
        {children}
      </div>
    </motion.div>
  )
}
