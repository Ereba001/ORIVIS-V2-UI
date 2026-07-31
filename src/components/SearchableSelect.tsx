import { useState, useRef, useEffect, useMemo } from "react"
import { ChevronDown } from "lucide-react"

interface Option {
  value: string
  label: string
}

interface Props {
  options: Option[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  disabled?: boolean
  required?: boolean
  id?: string
}

export default function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = "Select...",
  className = "",
  disabled = false,
  id,
}: Props) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const [highlightIdx, setHighlightIdx] = useState(0)

  const selected = options.find((o) => o.value === value)

  const filtered = useMemo(
    () => options.filter((o) => o.label.toLowerCase().includes(query.toLowerCase())),
    [options, query],
  )

  useEffect(() => {
    if (open) {
      inputRef.current?.focus()
      setQuery("")
      setHighlightIdx(0)
    }
  }, [open])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const select = (opt: Option) => {
    onChange(opt.value)
    setOpen(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setHighlightIdx((i) => Math.min(i + 1, filtered.length - 1))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setHighlightIdx((i) => Math.max(i - 1, 0))
    } else if (e.key === "Enter" && filtered[highlightIdx]) {
      e.preventDefault()
      select(filtered[highlightIdx])
    } else if (e.key === "Escape") {
      setOpen(false)
    }
  }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        type="button"
        id={id}
        disabled={disabled}
        onClick={() => !disabled && setOpen((o) => !o)}
        className={`w-full flex items-center justify-between gap-2 bg-brand-bg-secondary/50 border border-brand-border rounded-xl px-4 py-3 text-xs text-left transition-all ${
          disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer hover:border-brand-text-muted/30"
        } ${selected ? "text-brand-text-primary" : "text-brand-text-disabled"}`}
      >
        <span className="truncate">{selected ? selected.label : placeholder}</span>
        <ChevronDown size={13} className={`shrink-0 text-brand-text-disabled transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div
          ref={listRef}
          className="absolute z-50 top-full left-0 right-0 mt-1 bg-brand-surface border border-brand-border rounded-xl shadow-lg overflow-hidden"
          onKeyDown={handleKeyDown}
        >
          <div className="p-2 border-b border-brand-border">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => { setQuery(e.target.value); setHighlightIdx(0) }}
              placeholder="Search..."
              className="w-full bg-brand-bg border border-brand-border rounded-lg px-3 py-2 text-xs text-brand-text-primary placeholder-brand-text-disabled/50 outline-none focus:border-brand-gold transition-colors"
            />
          </div>
          <div className="max-h-48 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="text-xs text-brand-text-muted text-center py-4">No results found</p>
            ) : (
              filtered.map((opt, i) => (
                <button
                  key={opt.value}
                  type="button"
                  onMouseDown={() => select(opt)}
                  onMouseEnter={() => setHighlightIdx(i)}
                  className={`w-full text-left px-4 py-2.5 text-xs transition-colors ${
                    i === highlightIdx
                      ? "bg-brand-gold/10 text-brand-gold"
                      : opt.value === value
                        ? "bg-brand-gold/5 text-brand-text-primary"
                        : "text-brand-text-secondary hover:bg-brand-surface-interactive"
                  }`}
                >
                  {opt.label}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
