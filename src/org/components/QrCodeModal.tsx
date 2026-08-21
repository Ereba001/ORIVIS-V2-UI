import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Copy, X, QrCode, AlertTriangle } from 'lucide-react'
import QRCode from 'qrcode'

interface QrCodeModalProps {
  open: boolean
  onClose: () => void
  url: string
  title?: string
}

async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    // fallback: textarea + execCommand
    try {
      const ta = document.createElement('textarea')
      ta.value = text
      ta.style.position = 'fixed'
      ta.style.left = '-9999px'
      ta.style.top = '-9999px'
      document.body.appendChild(ta)
      ta.focus()
      ta.select()
      const ok = document.execCommand('copy')
      document.body.removeChild(ta)
      return ok
    } catch {
      return false
    }
  }
}

export default function QrCodeModal({ open, onClose, url, title = 'Election Link' }: QrCodeModalProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [copyError, setCopyError] = useState(false)

  useEffect(() => {
    if (!open) return
    QRCode.toDataURL(url, { width: 256, margin: 2, color: { dark: '#1a1a2e', light: '#ffffff' } })
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(null))
  }, [open, url])

  const handleCopy = useCallback(async () => {
    setCopyError(false)
    const ok = await copyToClipboard(url)
    if (ok) {
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } else {
      setCopyError(true)
      setTimeout(() => setCopyError(false), 2500)
    }
  }, [url])

  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose()
  }, [onClose])

  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={handleBackdropClick}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="w-full max-w-sm bg-brand-surface rounded-2xl border border-brand-border shadow-2xl p-6 space-y-5"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <QrCode size={16} className="text-brand-text-muted" />
                <h3 className="text-sm font-bold text-brand-text-primary">{title}</h3>
              </div>
              <button onClick={onClose} className="p-1 rounded-lg hover:bg-brand-surface-interactive text-brand-text-muted">
                <X size={16} />
              </button>
            </div>

            {qrDataUrl && (
              <div className="flex justify-center">
                <img src={qrDataUrl} alt="QR Code" className="w-48 h-48 rounded-xl" />
              </div>
            )}

            <div className="space-y-2">
              <p className="text-[10px] text-brand-text-muted">Share this link or scan the QR code to access the election page.</p>
              <div className={`flex items-center gap-2 p-3 rounded-xl bg-brand-surface-elevated/30 border transition-colors ${
                copied ? 'border-status-success/50' : copyError ? 'border-status-error/50' : 'border-brand-divider'
              }`}>
                <span className="text-[10px] text-brand-text-primary font-medium truncate flex-1">{url}</span>
                <button
                  onClick={handleCopy}
                  className="shrink-0 p-2 rounded-lg hover:bg-brand-surface-interactive text-brand-text-muted transition-colors"
                  title="Copy link"
                >
                  {copied ? null : <Copy size={14} />}
                </button>
              </div>
            </div>

            {copied && (
              <motion.p
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-[10px] text-status-success font-medium text-center"
              >
                Link copied to clipboard!
              </motion.p>
            )}
            {copyError && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-center gap-1.5 text-[10px] text-status-error font-medium"
              >
                <AlertTriangle size={10} />
                Failed to copy. Please copy manually.
              </motion.div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
