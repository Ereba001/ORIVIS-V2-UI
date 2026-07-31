import { ChevronDown } from "lucide-react"

interface Option {
  value: string
  label: string
}

interface Props {
  label: string
  options: Option[]
  value: string
  onChange: (value: string) => void
}

export default function FilterDropdown({ label, options, value, onChange }: Props) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] font-bold uppercase tracking-wider text-brand-text-muted">{label}</span>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="appearance-none bg-brand-surface-elevated border border-brand-border rounded-xl pl-3 pr-8 py-2 text-[11px] text-brand-text-primary focus:outline-none focus:border-brand-gold transition-all cursor-pointer"
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-brand-text-muted pointer-events-none" />
      </div>
    </div>
  )
}
