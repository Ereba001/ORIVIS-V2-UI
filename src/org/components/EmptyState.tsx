import { motion } from 'motion/react'
import { Inbox } from 'lucide-react'

interface EmptyStateProps {
  icon?: React.ComponentType<{ size?: number; className?: string }>
  title: string
  description: string
  action?: { label: string; onClick: () => void }
}

export default function EmptyState({ icon: Icon = Inbox, title, description, action }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-12 px-4 text-center"
    >
      <div className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-full bg-brand-surface-interactive text-brand-text-muted">
        <Icon size={24} />
      </div>
      <h3 className="mt-4 text-base font-semibold text-brand-text-primary">{title}</h3>
      <p className="mt-1 text-sm text-brand-text-muted max-w-sm">{description}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="mt-5 rounded-lg px-4 py-2 text-sm font-medium text-white shadow-sm hover:opacity-90 transition-opacity"
          style={{ backgroundColor: 'var(--org-primary)' }}
        >
          {action.label}
        </button>
      )}
    </motion.div>
  )
}
