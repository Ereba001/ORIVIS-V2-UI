interface StatusBadgeProps {
  status: "Active" | "Pending" | "Suspended" | string
}

const STATUS_COLORS: Record<string, string> = {
  Active: "bg-status-success/10 text-status-success border-status-success/20",
  Pending: "bg-status-warning/10 text-status-warning border-status-warning/20",
  Suspended: "bg-status-error/10 text-status-error border-status-error/20",
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const colors = STATUS_COLORS[status] || "bg-brand-surface-interactive text-brand-text-muted border-brand-border"

  return (
    <span className={`text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full border ${colors}`}>
      {status}
    </span>
  )
}
