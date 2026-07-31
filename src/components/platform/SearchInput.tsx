import { useEffect, useRef, useState } from "react"
import { Search, X } from "lucide-react"

interface Props {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export default function SearchInput({ value, onChange, placeholder = "Search..." }: Props) {
  const [local, setLocal] = useState(value)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => {
    setLocal(value)
  }, [value])

  const handleChange = (v: string) => {
    setLocal(v)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => onChange(v), 250)
  }

  return (
    <div className="relative">
      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-text-muted pointer-events-none" />
      <input
        value={local}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-brand-bg-secondary/50 border border-brand-border rounded-xl pl-9 pr-8 py-2.5 text-xs text-brand-text-primary placeholder-brand-text-disabled focus:outline-none focus:border-brand-gold transition-all"
      />
      {local && (
        <button onClick={() => { handleChange(""); onChange("") }} className="absolute right-2 top-1/2 -translate-y-1/2 text-brand-text-muted hover:text-brand-text-primary cursor-pointer">
          <X size={14} />
        </button>
      )}
    </div>
  )
}
