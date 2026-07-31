import { useEffect, useRef, useState } from "react"
import { Loader2 } from "lucide-react"

interface QrCodeProps {
  value: string
  size?: number
  className?: string
}

export default function QrCode({ value, size = 180, className = "" }: QrCodeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(false)

    import("qrcode")
      .then((mod) => {
        if (cancelled) return
        const QRCode = mod.default
        QRCode.toCanvas(
          canvasRef.current,
          value,
          {
            width: size,
            margin: 2,
            color: { dark: "#1a1a1a", light: "#ffffff" },
          },
          (err: Error | null | undefined) => {
            if (cancelled) return
            if (err) { setError(true); setLoading(false); return }
            setLoading(false)
          }
        )
      })
      .catch(() => {
        if (!cancelled) { setError(true); setLoading(false) }
      })

    return () => { cancelled = true }
  }, [value, size])

  return (
    <div className={`relative ${className}`} style={{ width: size, height: size }}>
      <canvas
        ref={canvasRef}
        width={size}
        height={size}
        className={`rounded-xl ${loading || error ? "opacity-0 absolute" : "opacity-100"}`}
        role="img"
        aria-label={`QR code for ${value}`}
      />
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-brand-surface border border-brand-border rounded-xl">
          <Loader2 size={20} className="animate-spin text-brand-gold" />
        </div>
      )}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-brand-surface border border-brand-border rounded-xl">
          <span className="text-[10px] text-brand-text-muted">QR unavailable</span>
        </div>
      )}
    </div>
  )
}
