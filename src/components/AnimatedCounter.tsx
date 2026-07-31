import { useEffect, useState } from "react"

interface AnimatedCounterProps {
  value: number
  duration?: number
}

export default function AnimatedCounter({ value, duration = 800 }: AnimatedCounterProps) {
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    let start = 0
    const increment = value / (duration / 16)
    const timer = setInterval(() => {
      start += increment
      if (start >= value) {
        setDisplay(value)
        clearInterval(timer)
      } else {
        setDisplay(Math.round(start))
      }
    }, 16)
    return () => clearInterval(timer)
  }, [value, duration])

  return <span>{display.toLocaleString()}</span>
}
