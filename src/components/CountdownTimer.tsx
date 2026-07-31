import { useState, useEffect } from "react"
import { motion } from "motion/react"
import { Clock } from "lucide-react"

interface CountdownTimerProps {
  targetDate: string
  label?: string
  onComplete?: () => void
  className?: string
}

function getTimeRemaining(target: Date): { days: number; hours: number; minutes: number; seconds: number; total: number } {
  const total = target.getTime() - Date.now()
  if (total <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 }
  const seconds = Math.floor((total / 1000) % 60)
  const minutes = Math.floor((total / 1000 / 60) % 60)
  const hours = Math.floor((total / (1000 * 60 * 60)) % 24)
  const days = Math.floor(total / (1000 * 60 * 60 * 24))
  return { days, hours, minutes, seconds, total }
}

export function useCountdown(targetDate: string) {
  const [remaining, setRemaining] = useState(() => getTimeRemaining(new Date(targetDate)))

  useEffect(() => {
    function tick() {
      const r = getTimeRemaining(new Date(targetDate))
      setRemaining(r)
      if (r.total <= 0) return
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [targetDate])

  return remaining
}

export default function CountdownTimer({ targetDate, label, onComplete, className = "" }: CountdownTimerProps) {
  const remaining = useCountdown(targetDate)

  useEffect(() => {
    if (remaining.total <= 0) onComplete?.()
  }, [remaining.total, onComplete])

  if (remaining.total <= 0) return null

  const parts: { value: number; suffix: string }[] = []
  if (remaining.days > 0) parts.push({ value: remaining.days, suffix: "d" })
  if (remaining.hours > 0 || remaining.days > 0) parts.push({ value: remaining.hours, suffix: "h" })
  parts.push({ value: remaining.minutes, suffix: "m" })
  parts.push({ value: remaining.seconds, suffix: "s" })

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex flex-col items-center gap-2 ${className}`}
    >
      {label && (
        <span className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest text-brand-text-muted font-bold">
          <Clock size={12} />
          {label}
        </span>
      )}
      <div className="flex items-center gap-1.5">
        {parts.map((p, i) => (
          <span key={i} className="flex items-center gap-1">
            <span className="text-2xl sm:text-3xl font-mono font-bold text-brand-gold tabular-nums">
              {String(p.value).padStart(2, "0")}
            </span>
            <span className="text-xs font-mono text-brand-text-muted mr-1">{p.suffix}</span>
          </span>
        ))}
      </div>
    </motion.div>
  )
}
