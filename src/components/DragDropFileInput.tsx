import { useState, useRef, type DragEvent } from "react"
import { Upload, X, FileText, Image } from "lucide-react"

interface DragDropFileInputProps {
  label: string
  accept: string
  required?: boolean
  value: File | null
  onChange: (file: File | null) => void
}

const ACCEPT_LABELS: Record<string, string> = {
  ".pdf": "PDF",
  ".jpg": "JPG",
  ".jpeg": "JPEG",
  ".png": "PNG",
  ".svg": "SVG",
  ".webp": "WEBP",
}

function getAcceptLabel(accept: string): string {
  return accept
    .split(",")
    .map((ext) => ACCEPT_LABELS[ext.trim()] || ext.trim().toUpperCase())
    .join(", ")
}

function getAcceptIcon(accept: string): React.ReactNode {
  const hasImage = [".jpg", ".jpeg", ".png", ".svg", ".webp"].some((e) => accept.includes(e))
  const hasPdf = accept.includes(".pdf")
  if (hasImage && !hasPdf) return <Image size={20} className="text-brand-text-disabled" />
  return <FileText size={20} className="text-brand-text-disabled" />
}

export default function DragDropFileInput({ label, accept, required, value, onChange }: DragDropFileInputProps) {
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragging(true)
  }

  const handleDragLeave = (e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragging(false)
  }

  const handleDrop = (e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) onChange(file)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    onChange(file)
  }

  const handleRemove = () => {
    onChange(null)
    if (inputRef.current) inputRef.current.value = ""
  }

  const allowedFormats = getAcceptLabel(accept)
  const icon = getAcceptIcon(accept)

  return (
    <div>
      <label className="block text-[10px] font-mono uppercase tracking-wider text-brand-text-muted font-bold mb-1.5">
        {label}
      </label>
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-xl px-4 py-5 text-center cursor-pointer transition-all duration-200 ${
          dragging
            ? "border-brand-gold bg-brand-gold/5"
            : value
              ? "border-status-success/40 bg-status-success/5"
              : "border-brand-border hover:border-brand-text-muted bg-brand-bg-secondary/30"
        }`}
      >
        <input
          ref={inputRef}
          name="file"
          type="file"
          aria-label="Upload file"
          accept={accept}
          required={required && !value}
          onChange={handleFileChange}
          className="hidden"
        />

        {value ? (
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-brand-gold/10 flex items-center justify-center shrink-0">
                {icon}
              </div>
              <div className="min-w-0 text-left">
                <p className="text-xs font-medium text-brand-text-primary truncate">{value.name}</p>
                <p className="text-[10px] text-brand-text-muted">{(value.size / 1024).toFixed(1)} KB</p>
              </div>
            </div>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); handleRemove() }}
              className="w-6 h-6 rounded-full bg-brand-surface border border-brand-border flex items-center justify-center hover:bg-brand-surface-interactive shrink-0 transition-colors"
            >
              <X size={12} className="text-brand-text-muted" />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1.5">
            <Upload size={18} className="text-brand-text-disabled" />
            <p className="text-xs text-brand-text-muted font-medium">
              <span className="text-brand-gold underline decoration-brand-gold/30">Click to upload</span> or drag and drop
            </p>
            <p className="text-[10px] text-brand-text-disabled">{allowedFormats}</p>
          </div>
        )}
      </div>
    </div>
  )
}
