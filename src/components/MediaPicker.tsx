import { useState, useRef, type DragEvent } from "react"
import { Upload, X, Link2, Image, FileText, Loader2 } from "lucide-react"

export type MediaSource = { type: "file"; file: File } | { type: "url"; url: string }

interface MediaPickerProps {
  label: string
  accept?: string
  hint?: string
  value: MediaSource | null
  onChange: (source: MediaSource | null) => void
  /** Initial URL when editing an existing remote value. */
  initialUrl?: string | null
  disabled?: boolean
}

const ACCEPT_LABELS: Record<string, string> = {
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

function isImageAccept(accept: string): boolean {
  return [".jpg", ".jpeg", ".png", ".svg", ".webp"].some((e) => accept.includes(e))
}

function validateUrl(raw: string): boolean {
  try {
    const el = document.createElement("a")
    el.href = raw
    return (el.protocol === "http:" || el.protocol === "https:") && el.host !== ""
  } catch {
    return false
  }
}

/**
 * Google-Forms-style media input that accepts either a file upload or a
 * pasted URL. Emits a discriminated union via `onChange` so callers can
 * decide how to persist (FormData upload vs. direct URL).
 */
export default function MediaPicker({
  label,
  accept = ".jpg,.jpeg,.png,.webp",
  hint,
  value,
  onChange,
  initialUrl,
  disabled,
}: MediaPickerProps) {
  const [tab, setTab] = useState<"upload" | "url">(value?.type === "file" ? "upload" : "url")
  const [dragging, setDragging] = useState(false)
  const [urlDraft, setUrlDraft] = useState(value?.type === "url" ? value.url : (initialUrl ?? ""))
  const [urlError, setUrlError] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const effectiveUrl = value?.type === "url" ? value.url : (initialUrl ?? null)

  function handleFileChange(file: File | null) {
    if (!file) {
      onChange(null)
      setPreviewUrl(null)
      return
    }
    setUrlError(null)
    setPreviewUrl(URL.createObjectURL(file))
    onChange({ type: "file", file })
  }

  function handleDrop(e: DragEvent) {
    e.preventDefault()
    e.stopPropagation()
    setDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) handleFileChange(file)
  }

  function handleRemove() {
    onChange(null)
    setPreviewUrl(null)
    setUrlDraft("")
    setUrlError(null)
    if (inputRef.current) inputRef.current.value = ""
  }

  function handleApplyUrl() {
    const trimmed = urlDraft.trim()
    if (!trimmed) {
      setUrlError("Enter an image URL")
      return
    }
    if (!validateUrl(trimmed)) {
      setUrlError("Enter a valid http(s) URL")
      return
    }
    setUrlError(null)
    setPreviewLoading(true)
    const img = document.createElement("img")
    img.onload = () => {
      setPreviewLoading(false)
      setPreviewUrl(trimmed)
      onChange({ type: "url", url: trimmed })
    }
    img.onerror = () => {
      setPreviewLoading(false)
      setPreviewUrl(trimmed)
      onChange({ type: "url", url: trimmed })
    }
    img.src = trimmed
  }

  const allowedFormats = getAcceptLabel(accept)
  const icon = isImageAccept(accept) ? <Image size={20} /> : <FileText size={20} />

  return (
    <div>
      <label className="block text-[10px] font-mono uppercase tracking-wider text-brand-text-muted font-bold mb-1.5">
        {label}
      </label>

      <div className="rounded-xl border border-brand-border bg-brand-surface overflow-hidden">
        <div className="flex items-center gap-1 p-1 bg-brand-surface-elevated">
          {(["upload", "url"] as const).map((t) => (
            <button
              key={t}
              type="button"
              disabled={disabled}
              onClick={() => setTab(t)}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer disabled:opacity-40 ${
                tab === t
                  ? "bg-brand-surface text-brand-text-primary shadow-sm"
                  : "text-brand-text-muted hover:text-brand-text-primary"
              }`}
            >
              {t === "upload" ? <Upload size={12} /> : <Link2 size={12} />}
              {t === "upload" ? "Upload" : "URL"}
            </button>
          ))}
        </div>

        <div className="p-3">
          {tab === "upload" ? (
            <div
              onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); if (!disabled) setDragging(true) }}
              onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setDragging(false) }}
              onDrop={handleDrop}
              onClick={() => !disabled && inputRef.current?.click()}
              className={`relative border-2 border-dashed rounded-xl px-4 py-4 text-center transition-all duration-200 ${
                dragging
                  ? "border-brand-gold bg-brand-gold/5"
                  : value?.type === "file"
                    ? "border-status-success/40 bg-status-success/5"
                    : "border-brand-border hover:border-brand-text-muted cursor-pointer"
              }`}
            >
              <input
                ref={inputRef}
                type="file"
                aria-label={`Upload ${label}`}
                accept={accept}
                disabled={disabled}
                onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
                className="hidden"
              />
              {value?.type === "file" ? (
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-brand-gold/10 flex items-center justify-center shrink-0 text-brand-gold">
                      {icon}
                    </div>
                    <div className="min-w-0 text-left">
                      <p className="text-xs font-medium text-brand-text-primary truncate">{value.file.name}</p>
                      <p className="text-[10px] text-brand-text-muted">{(value.file.size / 1024).toFixed(1)} KB</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); handleRemove() }}
                    aria-label="Remove file"
                    className="w-6 h-6 rounded-full bg-brand-surface border border-brand-border flex items-center justify-center hover:bg-brand-surface-interactive shrink-0 transition-colors cursor-pointer"
                  >
                    <X size={12} className="text-brand-text-muted" />
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-1.5">
                  <Upload size={16} className="text-brand-text-disabled" />
                  <p className="text-xs text-brand-text-muted font-medium">
                    <span className="text-brand-gold underline decoration-brand-gold/30">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-[10px] text-brand-text-disabled">{allowedFormats}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-2.5">
              <div className="flex items-center gap-2">
                <Link2 size={13} className="text-brand-text-muted shrink-0" />
                <input
                  type="url"
                  value={urlDraft}
                  onChange={(e) => { setUrlDraft(e.target.value); if (urlError) setUrlError(null) }}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleApplyUrl() } }}
                  disabled={disabled}
                  placeholder="https://example.com/image.png"
                  aria-label={`${label} URL`}
                  className="flex-1 min-w-0 bg-brand-surface-elevated border border-brand-border rounded-xl px-3 py-2 text-xs text-brand-text-primary placeholder-brand-text-disabled focus:outline-none transition-all focus:border-[var(--org-primary)]/50"
                />
                <button
                  type="button"
                  onClick={handleApplyUrl}
                  disabled={disabled || !urlDraft.trim()}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider text-brand-bg-secondary transition-all disabled:opacity-40 cursor-pointer"
                  style={{ backgroundColor: "var(--org-primary, #FCA311)" }}
                >
                  {previewLoading ? <Loader2 size={12} className="animate-spin" /> : null}
                  Apply
                </button>
              </div>

              {urlError && (
                <p className="text-[10px] text-status-error font-semibold">{urlError}</p>
              )}

              {effectiveUrl && (
                <div className="flex items-center gap-3 rounded-xl border border-brand-border bg-brand-surface-elevated p-2">
                  <img src={effectiveUrl} alt={label} className="w-14 h-14 rounded-lg object-cover shrink-0 bg-brand-surface" onError={(e) => { (e.currentTarget.style.visibility = "hidden") }} onLoad={(e) => { (e.currentTarget.style.visibility = "visible") }} />
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] text-brand-text-muted truncate">{effectiveUrl}</p>
                    <p className="text-[9px] text-brand-text-disabled mt-0.5">{previewUrl && previewUrl !== effectiveUrl ? "Preview" : "URL"} applied</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemove}
                    aria-label="Remove URL"
                    className="w-6 h-6 rounded-full bg-brand-surface border border-brand-border flex items-center justify-center hover:bg-brand-surface-interactive shrink-0 transition-colors cursor-pointer"
                  >
                    <X size={12} className="text-brand-text-muted" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {hint && <p className="mt-1.5 text-[10px] text-brand-text-disabled">{hint}</p>}
    </div>
  )
}
