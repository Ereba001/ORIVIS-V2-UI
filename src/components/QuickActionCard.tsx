import { useNavigate } from "react-router-dom"
import { motion } from "motion/react"
import * as Lucide from "lucide-react"

interface QuickAction {
  id: string
  label: string
  description: string
  icon: string
  path: string
  color: string
}

interface QuickActionCardProps {
  action: QuickAction
}

const ICON_MAP: Record<string, React.ComponentType<{ size?: number }>> = {
  PlusCircle: Lucide.PlusCircle,
  Building2: Lucide.Building2,
  BarChart3: Lucide.BarChart3,
  SlidersHorizontal: Lucide.SlidersHorizontal,
}

export default function QuickActionCard({ action }: QuickActionCardProps) {
  const navigate = useNavigate()
  const Icon = ICON_MAP[action.icon] || Lucide.PlusCircle

  return (
    <motion.button
      onClick={() => navigate(action.path)}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.98 }}
      className="glass-card rounded-2xl p-4 text-left w-full cursor-pointer group"
    >
      <div className={`w-10 h-10 rounded-xl bg-brand-surface-elevated flex items-center justify-center mb-3 ${action.color} group-hover:scale-110 transition-transform`}>
        <Icon size={20} />
      </div>
      <p className="text-xs font-bold text-brand-text-primary mb-1">{action.label}</p>
      <p className="text-[10px] text-brand-text-muted leading-relaxed">{action.description}</p>
    </motion.button>
  )
}
