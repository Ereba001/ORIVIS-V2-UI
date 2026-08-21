import { motion } from "motion/react"

interface AuthHeroIllustrationProps {
  variant?: "platform" | "organization"
}

const centerX = 120
const centerY = 120
const r = 60

function OrganizationOrbit() {
  return (
    <svg width="240" height="240" viewBox="0 0 240 240" fill="none">
      <defs>
        <radialGradient id="orgGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="var(--ill-gold, #FCA311)" stopOpacity="0.25" />
          <stop offset="100%" stopColor="var(--ill-gold, #FCA311)" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="orgStroke" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--ill-gold, #FCA311)" stopOpacity="0.4" />
          <stop offset="100%" stopColor="var(--ill-gold, #FCA311)" stopOpacity="0.08" />
        </linearGradient>
      </defs>

      <motion.circle cx={centerX} cy={centerY} r={45} fill="url(#orgGlow)"
        animate={{ scale: [1, 1.08, 1] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      />

      <motion.circle cx={centerX} cy={centerY} r={18} fill="var(--ill-gold, #FCA311)" opacity={0.9}
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      />

      {[0, 60, 120, 180, 240, 300].map((angle, i) => {
        const rad = (angle * Math.PI) / 180
        const cx = centerX + r * 0.7 * Math.cos(rad)
        const cy = centerY + r * 0.7 * Math.sin(rad)
        return (
          <motion.line
            key={`line-${i}`}
            x1={centerX} y1={centerY}
            x2={cx} y2={cy}
            stroke="url(#orgStroke)"
            strokeWidth={1.5}
            initial={{ opacity: 0.2 }}
            animate={{ opacity: [0.2, 0.6, 0.2] }}
            transition={{ duration: 3, delay: i * 0.3, repeat: Infinity, ease: "easeInOut" }}
          />
        )
      })}

      {[{ angle: 0, size: 12, color: "var(--ill-gold, #FCA311)", delay: 0 },
        { angle: 72, size: 8, color: "var(--ill-blue, #3B82F6)", delay: 0.8 },
        { angle: 144, size: 10, color: "var(--ill-green, #22C55E)", delay: 1.6 },
        { angle: 216, size: 6, color: "var(--ill-gold, #FCA311)", delay: 2.4 },
        { angle: 288, size: 9, color: "var(--ill-blue, #3B82F6)", delay: 3.2 },
      ].map((item) => {
        const rad = (item.angle * Math.PI) / 180
        const cx = centerX + r * Math.cos(rad)
        const cy = centerY + r * Math.sin(rad)
        return (
          <motion.g
            key={item.angle}
            animate={{ rotate: 360 }}
            transition={{ duration: 20 + item.delay, repeat: Infinity, ease: "linear" }}
            style={{ originX: `${centerX}px`, originY: `${centerY}px` }}
          >
            <motion.circle
              cx={cx} cy={cy} r={item.size / 2}
              fill={item.color}
              opacity={0.8}
              animate={{ y: [0, -4, 0], opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 2.5, delay: item.delay, repeat: Infinity, ease: "easeInOut" }}
            />
          </motion.g>
        )
      })}

      <motion.circle cx={centerX} cy={centerY} r={r}
        stroke="url(#orgStroke)" strokeWidth={1}
        fill="none"
        animate={{ rotate: 360 }}
        transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
        style={{ originX: `${centerX}px`, originY: `${centerY}px` }}
      />
    </svg>
  )
}

function PlatformOrbit() {
  const items = [
    { angle: 0, size: 10, color: "var(--ill-blue, #3B82F6)", delay: 0 },
    { angle: 45, size: 7, color: "var(--ill-green, #22C55E)", delay: 0.5 },
    { angle: 90, size: 9, color: "var(--ill-gold, #FCA311)", delay: 1.0 },
    { angle: 135, size: 6, color: "var(--ill-blue, #3B82F6)", delay: 1.5 },
    { angle: 180, size: 8, color: "var(--ill-green, #22C55E)", delay: 2.0 },
    { angle: 225, size: 7, color: "var(--ill-gold, #FCA311)", delay: 2.5 },
    { angle: 270, size: 10, color: "var(--ill-blue, #3B82F6)", delay: 3.0 },
    { angle: 315, size: 6, color: "var(--ill-green, #22C55E)", delay: 3.5 },
  ]

  return (
    <svg width="240" height="240" viewBox="0 0 240 240" fill="none">
      <defs>
        <radialGradient id="platGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="var(--ill-blue, #3B82F6)" stopOpacity="0.2" />
          <stop offset="100%" stopColor="var(--ill-blue, #3B82F6)" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="platStroke" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--ill-blue, #3B82F6)" stopOpacity="0.35" />
          <stop offset="100%" stopColor="var(--ill-blue, #3B82F6)" stopOpacity="0.05" />
        </linearGradient>
      </defs>

      <motion.circle cx={centerX} cy={centerY} r={50} fill="url(#platGlow)"
        animate={{ scale: [1, 1.06, 1] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
      />

      <motion.path
        d="M 95 120 Q 120 85 145 120 Q 120 155 95 120"
        fill="var(--ill-blue, #3B82F6)" opacity={0.85}
        animate={{ scale: [1, 1.04, 1] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
        style={{ originX: "120px", originY: "120px" }}
      />

      <motion.circle cx={centerX} cy={centerY - 8} r={8} fill="var(--ill-blue-hover, #60A5FA)" opacity={0.9}
        animate={{ y: [-8, -12, -8] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      />

      {items.map((item) => {
        const rad = (item.angle * Math.PI) / 180
        const cx = centerX + r * Math.cos(rad)
        const cy = centerY + r * Math.sin(rad)
        return (
          <motion.circle
            key={item.angle}
            cx={cx} cy={cy} r={item.size / 2}
            fill={item.color}
            opacity={0.7}
            animate={{ opacity: [0.5, 1, 0.5], scale: [1, 1.15, 1] }}
            transition={{ duration: 2, delay: item.delay, repeat: Infinity, ease: "easeInOut" }}
          />
        )
      })}

      <motion.circle cx={centerX} cy={centerY} r={r}
        stroke="url(#platStroke)" strokeWidth={1}
        fill="none"
        animate={{ rotate: -360 }}
        transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
        style={{ originX: `${centerX}px`, originY: `${centerY}px` }}
      />

      <motion.circle cx={centerX} cy={centerY} r={r * 0.65}
        stroke="url(#platStroke)" strokeWidth={0.5}
        fill="none"
        animate={{ rotate: 360 }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        style={{ originX: `${centerX}px`, originY: `${centerY}px` }}
      />
    </svg>
  )
}

export default function AuthHeroIllustration({ variant = "platform" }: AuthHeroIllustrationProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6 }}
      className="flex items-center justify-center"
      style={{
        "--ill-gold": "var(--color-brand-gold, #FCA311)",
        "--ill-blue": "var(--color-brand-blue, #3B82F6)",
        "--ill-blue-hover": "var(--color-brand-blue-hover, #60A5FA)",
        "--ill-green": "var(--color-status-success, #22C55E)",
      } as React.CSSProperties}
    >
      {variant === "organization" ? <OrganizationOrbit /> : <PlatformOrbit />}
    </motion.div>
  )
}
