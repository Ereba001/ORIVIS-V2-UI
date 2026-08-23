import { type LucideIcon, TrendingUp, TrendingDown } from "lucide-react"
import { motion } from "motion/react"

interface StatItem {
  label: string
  value: string
  icon: LucideIcon
  trend?: { value: number; positive: boolean }
  color?: string
}

interface Props {
  items: StatItem[]
}

const DEFAULT_COLORS = ["text-brand-gold", "text-status-info", "text-status-success", "text-status-warning"]

export default function StatsGrid({ items }: Props) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {items.map((item, i) => {
        const Icon = item.icon
        const accent = item.color || DEFAULT_COLORS[i % DEFAULT_COLORS.length]
        return (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            whileHover={{ scale: 1.02, y: -2 }}
            className="glass-card rounded-2xl p-5 hover:border-brand-gold/30 transition-all duration-300 cursor-default"
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 rounded-xl bg-brand-surface-elevated flex items-center justify-center ${accent}`}>
                <Icon size={20} />
              </div>
              {item.trend && (
                <span className={`flex items-center gap-1 text-[10px] font-mono ${item.trend.positive ? "text-status-success" : "text-status-danger"}`}>
                  {item.trend.positive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                  <span>{item.trend.value}%</span>
                </span>
              )}
            </div>
            <div className="space-y-1">
              <p className="text-2xl font-bold font-mono text-brand-text-primary">{item.value}</p>
              <p className="text-xs text-brand-text-muted">{item.label}</p>
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}
