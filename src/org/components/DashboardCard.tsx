import { motion } from 'motion/react'
import type { ReactNode } from 'react'

interface DashboardCardProps {
  children: ReactNode
  className?: string
  hover?: boolean
}

export default function DashboardCard({ children, className = '', hover = true }: DashboardCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      whileHover={hover ? { scale: 1.01, y: -1 } : undefined}
      className={`bg-brand-surface rounded-xl border border-brand-border shadow-sm p-5 transition-all duration-300 ${hover ? 'hover:shadow-md' : ''} ${className}`}
    >
      {children}
    </motion.div>
  )
}
