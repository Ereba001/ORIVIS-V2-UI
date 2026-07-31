import { ChevronDown } from "lucide-react"
import { COUNTRY_DIAL_CODES } from "../constants/countries"

interface PhoneInputProps {
  code: string
  number: string
  onCodeChange: (code: string) => void
  onNumberChange: (number: string) => void
  codeError?: string
  numberError?: string
  numberRequired?: boolean
}

export default function PhoneInput({ code, number, onCodeChange, onNumberChange, codeError, numberError, numberRequired }: PhoneInputProps) {
  return (
    <div>
      <label className="block text-[10px] font-mono uppercase tracking-wider text-brand-text-muted font-bold mb-1.5">
        Phone Number
      </label>
      <div className="flex gap-2">
        <div className="relative w-1/3 min-w-[130px]">
          <select
            value={code}
            onChange={(e) => onCodeChange(e.target.value)}
            className={`w-full bg-brand-bg-secondary/50 border ${codeError ? "border-status-danger" : "border-brand-border"} rounded-xl px-3 py-2.5 text-xs text-brand-text-primary focus:outline-none focus:border-brand-gold focus:bg-brand-surface transition-all appearance-none font-medium pr-8`}
          >
            {COUNTRY_DIAL_CODES.map((c) => (
              <option key={c.label} value={c.label}>{c.label}</option>
            ))}
          </select>
          <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-text-muted pointer-events-none" />
        </div>
        <input
          type="tel"
          required={numberRequired}
          value={number}
          onChange={(e) => onNumberChange(e.target.value)}
          placeholder="Phone number"
          className={`flex-1 bg-brand-bg-secondary/50 border ${numberError ? "border-status-danger" : "border-brand-border"} rounded-xl px-4 py-2.5 text-xs text-brand-text-primary placeholder-brand-text-disabled focus:outline-none focus:border-brand-gold focus:bg-brand-surface transition-all font-medium`}
        />
      </div>
      {codeError && <p className="text-[10px] text-status-danger mt-1 font-semibold">{codeError}</p>}
      {numberError && <p className="text-[10px] text-status-danger mt-1 font-semibold">{numberError}</p>}
    </div>
  )
}
