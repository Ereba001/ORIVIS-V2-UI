import { motion } from "motion/react"
import * as Lucide from "lucide-react"
import AnimatedCounter from "./AnimatedCounter"

interface PlatformStat {
  id: string
  label: string
  value: number
  prefix?: string
  suffix?: string
  trend: number
  trendLabel: string
  icon: string
}

interface StatCardProps {
  stat: PlatformStat
  index: number
}

const ICON_MAP: Record<string, React.ComponentType<{ size?: number }>> = {
  Building2: Lucide.Building2,
  Users: Lucide.Users,
  Vote: Lucide.Vote,
  TrendingUp: Lucide.TrendingUp,
  Shield: Lucide.Shield,
  Clock: Lucide.Clock,
}

const COLOR_MAP: Record<string, string> = {
  orgs: "text-brand-gold",
  users: "text-blue-400",
  events: "text-brand-text-muted",
  revenue: "text-emerald-400",
  uptime: "text-status-success",
  pending: "text-amber-400",
}

export default function StatCard({ stat, index }: StatCardProps) {
  const Icon = ICON_MAP[stat.icon] || Lucide.Building2
  const accentColor = COLOR_MAP[stat.id] || "text-brand-text-muted"
  const trendUp = stat.trend >= 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ scale: 1.02, y: -2 }}
      className="glass-card rounded-2xl p-5 hover:border-brand-gold/30 transition-all duration-300 cursor-default"
    >
      <div className="flex items-center justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl bg-brand-surface-elevated flex items-center justify-center ${accentColor}`}>
          <Icon size={20} />
        </div>
        <span className={`flex items-center gap-1 text-[10px] font-mono ${trendUp ? "text-status-success" : "text-status-danger"}`}>
          <span>{trendUp ? "↑" : "↓"}</span>
          <span>{Math.abs(stat.trend)}{stat.suffix === "%" ? "%" : ""}</span>
        </span>
      </div>
      <div className="space-y-1">
        <p className="text-2xl font-bold font-mono text-brand-text-primary">
          {stat.prefix}
          <AnimatedCounter value={stat.value} />
          {stat.suffix}
        </p>
        <p className="text-xs text-brand-text-muted">{stat.label}</p>
        <p className="text-[10px] font-mono text-brand-text-muted/60">{stat.trendLabel}</p>
      </div>
    </motion.div>
  )
}
