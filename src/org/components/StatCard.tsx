import { motion } from 'motion/react'
import * as Lucide from 'lucide-react'
import type { DashboardStat } from '../types'

const ICON_MAP: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  Activity: Lucide.Activity,
  Users: Lucide.Users,
  BarChart3: Lucide.BarChart3,
  CheckCircle: Lucide.CheckCircle,
}

interface StatCardProps {
  stat: DashboardStat
  index: number
}

export default function StatCard({ stat, index }: StatCardProps) {
  const Icon = ICON_MAP[stat.icon] || Lucide.Building2
  const trendUp = stat.trend >= 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ scale: 1.02, y: -2 }}
      className="glass-card rounded-2xl p-5 hover:border-[var(--org-primary)]/30 transition-all duration-300"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-brand-surface-elevated flex items-center justify-center shrink-0" style={{ color: 'var(--org-primary)' }}>
            <Icon size={20} />
          </div>
          <div>
            <p className="text-xs font-semibold text-brand-text-primary">{stat.label}</p>
            <p className="text-[9px] font-mono text-brand-text-muted">{stat.insight}</p>
          </div>
        </div>
        <span className={`flex items-center gap-1 text-[10px] font-mono shrink-0 ${trendUp ? 'text-status-success' : 'text-status-danger'}`}>
          <span>{trendUp ? '↑' : '↓'}</span>
          <span>{Math.abs(stat.trend)}{stat.suffix === '%' ? '%' : ''}</span>
        </span>
      </div>
      <div className="flex items-end justify-between">
        <p className="text-2xl font-bold font-mono text-brand-text-primary tracking-tight">
          {stat.prefix}
          {stat.value.toLocaleString()}
          {stat.suffix}
        </p>
      </div>
      <p className="text-[10px] font-mono text-brand-text-muted/60 mt-1.5">{stat.trendLabel}</p>
    </motion.div>
  )
}
