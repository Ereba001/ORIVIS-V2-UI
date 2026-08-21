import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "motion/react"
import { CheckCircle2 } from "lucide-react"
import OrivisLogo from "./OrivisLogo"

interface Props {
  messages: string[]
  delay?: number
  showLogo?: boolean
}

export default function LoadingOverlay({ messages, delay = 600, showLogo = true }: Props) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-brand-surface border border-brand-border rounded-2xl p-6 sm:p-8 max-w-sm w-full mx-4 sm:mx-auto shadow-2xl"
        >
          <div className="flex flex-col items-center gap-6">
            {showLogo && (
              <motion.div
                animate={{ opacity: [0.6, 1, 0.6] }}
                transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
              >
                <OrivisLogo size="xl" className="text-brand-gold" />
              </motion.div>
            )}

            <div className={`space-y-3 w-full ${showLogo ? '' : 'mt-2'}`}>
              {messages.map((msg, i) => (
                <MessageRow key={i} text={msg} index={i} delay={delay} />
              ))}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

function MessageRow({ text, index, delay }: { text: string; index: number; delay: number }) {
  const [done, setDone] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setDone(true), (index + 1) * delay)
    return () => clearTimeout(t)
  }, [index, delay])

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.15 }}
      className="flex items-center gap-2.5 text-xs"
    >
      {done ? (
        <CheckCircle2 size={14} className="text-status-success shrink-0" />
      ) : (
        <motion.div
          className="w-3.5 h-3.5 rounded-full border-2 border-brand-text-disabled shrink-0"
          animate={{ borderTopColor: "var(--color-brand-gold, #FCA311)" }}
        />
      )}
      <span className={done ? "text-brand-text-primary" : "text-brand-text-muted"}>{text}</span>
    </motion.div>
  )
}
