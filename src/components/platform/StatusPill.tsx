interface Props {
  status: string
  variant?: "success" | "warning" | "danger" | "info" | "neutral"
}

const VARIANT_CLASSES: Record<string, string> = {
  success: "bg-status-success/10 text-status-success border-status-success/20",
  warning: "bg-status-warning/10 text-status-warning border-status-warning/20",
  danger: "bg-status-danger/10 text-status-danger border-status-danger/20",
  info: "bg-status-info/10 text-status-info border-status-info/20",
  neutral: "bg-brand-surface-interactive text-brand-text-muted border-brand-border",
}

export default function StatusPill({ status, variant = "neutral" }: Props) {
  const cls = VARIANT_CLASSES[variant] || VARIANT_CLASSES.neutral
  return (
    <span className={`inline-block text-[9px] font-mono uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${cls}`}>
      {status}
    </span>
  )
}
