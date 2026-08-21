function toDate(dateStr: string | undefined | null): Date | null {
  if (!dateStr || typeof dateStr !== 'string') return null
  const d = new Date(dateStr)
  return isNaN(d.getTime()) ? null : d
}

/**
 * Format a date string to "MMM D, YYYY" (e.g. "Jan 5, 2026").
 * Returns "—" for invalid or missing input.
 */
export function formatDate(dateStr: string | undefined | null): string {
  const d = toDate(dateStr)
  if (!d) return '—'
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

/**
 * Format a date string to "MMM D, YYYY h:mm A" (e.g. "Jan 5, 2026 3:30 PM").
 * Returns "—" for invalid or missing input.
 */
export function formatDateTime(dateStr: string | undefined | null): string {
  const d = toDate(dateStr)
  if (!d) return '—'
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

/**
 * Format a time-only string to "h:mm A" (e.g. "3:30 PM").
 * Returns "—" for invalid or missing input.
 */
export function formatTime(dateStr: string | undefined | null): string {
  const d = toDate(dateStr)
  if (!d) return '—'
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
}

/**
 * Relative time string (e.g. "Just now", "5m ago", "3h ago", "2d ago").
 * Falls back to formatted date for anything older than 6 days.
 * Returns "—" for invalid or missing input.
 */
export function timeAgo(dateStr: string | undefined | null): string {
  const d = toDate(dateStr)
  if (!d) return '—'

  const diff = Date.now() - d.getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return formatDate(dateStr)
}

/**
 * Returns a day-group label: "Today", "Yesterday", or "Earlier".
 * Returns "—" for invalid or missing input.
 */
export function getDayGroup(dateStr: string | undefined | null): string {
  const d = toDate(dateStr)
  if (!d) return '—'

  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  const target = new Date(d.getFullYear(), d.getMonth(), d.getDate())

  if (target.getTime() === today.getTime()) return 'Today'
  if (target.getTime() === yesterday.getTime()) return 'Yesterday'
  return 'Earlier'
}
