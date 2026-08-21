import { motion } from 'motion/react'
import * as Lucide from 'lucide-react'
import type { DashboardStat } from '../types'

const ICON_MAP: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  Activity: Lucide.Activity,
  Users: Lucide.Users,
  BarChart3: Lucide.BarChart3,
  CheckCircle: Lucide.CheckCircle,
  CalendarDays: Lucide.CalendarDays,
  Vote: Lucide.Vote,
  Target: Lucide.Target,
  Percent: Lucide.Percent,
  TrendingUp: Lucide.TrendingUp,
  Gauge: Lucide.Gauge,
  Zap: Lucide.Zap,
  CalendarCheck2: Lucide.CalendarCheck2,
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
      whileHover={{ y: -3 }}
      className="group relative overflow-hidden rounded-xl border border-brand-border bg-brand-surface p-4 shadow-sm transition-all duration-300 hover:shadow-brand-md"
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{ background: 'linear-gradient(90deg, transparent, var(--org-primary), transparent)' }}
      />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium text-brand-text-muted">{stat.label}</p>
          <p className="mt-1.5 text-2xl font-bold tracking-tight text-brand-text-primary tabular-nums">
            {stat.formattedValue ?? `${stat.prefix ?? ''}${stat.value.toLocaleString()}${stat.suffix ?? ''}`}
          </p>
          <p className="mt-1 text-[11px] text-brand-text-muted">{stat.insight}</p>
        </div>
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset ring-white/5"
          style={{ backgroundColor: 'color-mix(in srgb, var(--org-primary) 10%, transparent)', color: 'var(--org-primary)' }}
        >
          <Icon size={18} />
        </div>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        {stat.trend !== 0 && (
          <span
            className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[11px] font-semibold ${
              trendUp ? 'bg-status-success/10 text-status-success' : 'bg-status-danger/10 text-status-danger'
            }`}
          >
            {trendUp ? '↑' : '↓'}
            {Math.abs(stat.trend)}{stat.suffix === '%' ? '%' : ''}
          </span>
        )}
        <span className="text-[11px] text-brand-text-muted">{stat.trendLabel}</span>
      </div>
    </motion.div>
  )
}
