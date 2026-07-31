import { useState, useMemo } from "react"
import { motion } from "motion/react"
import { Search, Loader2, AlertCircle, ChevronDown } from "lucide-react"
import type { VoterLookupField } from "../types/registration"

const FIELD_LABELS: Record<VoterLookupField, { label: string; placeholder: string; type: "text" | "email" | "tel" }> = {
  student_id: { label: "Student ID", placeholder: "e.g. 2020/12345", type: "text" },
  staff_id: { label: "Staff ID", placeholder: "e.g. STAFF-001", type: "text" },
  employee_id: { label: "Employee ID", placeholder: "e.g. EMP-12345", type: "text" },
  membership_number: { label: "Membership Number", placeholder: "e.g. MEM-001", type: "text" },
  external_id: { label: "External ID", placeholder: "Enter your ID", type: "text" },
  voter_id: { label: "Voter ID", placeholder: "e.g. VTR-001", type: "text" },
  email: { label: "Email Address", placeholder: "you@example.com", type: "email" },
  phone: { label: "Phone Number", placeholder: "+234 800 000 0000", type: "tel" },
  name: { label: "Full Name", placeholder: "Enter your full name", type: "text" },
  surname: { label: "Surname", placeholder: "Enter your surname", type: "text" },
  other_name: { label: "Other Name", placeholder: "Enter other name", type: "text" },
}

interface VoterRegistrationFormProps {
  lookupFields: VoterLookupField[]
  onLookup: (field: VoterLookupField, value: string) => Promise<void>
  disabled?: boolean
}

export default function VoterRegistrationForm({ lookupFields, onLookup, disabled }: VoterRegistrationFormProps) {
  const [selectedField, setSelectedField] = useState<VoterLookupField>(lookupFields[0] ?? "student_id")
  const [value, setValue] = useState("")
  const [lookingUp, setLookingUp] = useState(false)
  const [error, setError] = useState("")
  const [showDropdown, setShowDropdown] = useState(false)

  const fieldConfig = useMemo(() => FIELD_LABELS[selectedField], [selectedField])
  const singleField = lookupFields.length === 1

  async function handleSubmit() {
    if (!value.trim()) return
    setLookingUp(true)
    setError("")
    try {
      await onLookup(selectedField, value.trim())
    } catch (e) {
      setError(e instanceof Error ? e.message : "Lookup failed. Please try again.")
    } finally {
      setLookingUp(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="bg-brand-surface border border-brand-border rounded-2xl p-6 space-y-4">
        <label className="block text-xs font-bold uppercase tracking-wider text-brand-text-muted">
          Identify Yourself
        </label>

        {singleField ? (
          <div className="flex gap-3">
            <input
              type={fieldConfig.type}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              placeholder={fieldConfig.placeholder}
              disabled={disabled || lookingUp}
              aria-label={fieldConfig.label}
              className="flex-1 bg-brand-bg-secondary/50 border border-brand-border rounded-xl px-4 py-3 text-sm text-brand-text-primary placeholder-brand-text-disabled focus:outline-none focus:border-brand-gold transition-all disabled:opacity-50"
            />
            <button
              onClick={handleSubmit}
              disabled={disabled || lookingUp || !value.trim()}
              aria-label={`Look up using ${fieldConfig.label}`}
              className="flex items-center gap-2 bg-brand-gold hover:bg-brand-gold-hover disabled:opacity-50 text-brand-bg-secondary px-5 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer disabled:cursor-not-allowed"
            >
              {lookingUp ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
              <span>{lookingUp ? "Searching..." : "Look Up"}</span>
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowDropdown(!showDropdown)}
                disabled={disabled || lookingUp}
                aria-haspopup="listbox"
                aria-expanded={showDropdown}
                className="w-full flex items-center justify-between bg-brand-bg-secondary/50 border border-brand-border rounded-xl px-4 py-3 text-sm text-brand-text-primary focus:outline-none focus:border-brand-gold transition-all disabled:opacity-50 cursor-pointer"
              >
                <span>{fieldConfig.label}</span>
                <ChevronDown size={14} className={`text-brand-text-muted transition-transform ${showDropdown ? "rotate-180" : ""}`} />
              </button>
              {showDropdown && (
                <motion.ul
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  role="listbox"
                  className="absolute z-20 mt-1 w-full bg-brand-surface border border-brand-border rounded-xl overflow-hidden shadow-lg"
                >
                  {lookupFields.map((f) => (
                    <li key={f}>
                      <button
                        type="button"
                        role="option"
                        aria-selected={f === selectedField}
                        onClick={() => { setSelectedField(f); setShowDropdown(false) }}
                        className={`w-full text-left px-4 py-2.5 text-xs transition-colors cursor-pointer ${
                          f === selectedField
                            ? "bg-brand-gold/10 text-brand-gold font-bold"
                            : "text-brand-text-primary hover:bg-brand-bg-secondary/50"
                        }`}
                      >
                        {FIELD_LABELS[f]?.label ?? f.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                      </button>
                    </li>
                  ))}
                </motion.ul>
              )}
            </div>
            <div className="flex gap-3">
              <input
                type={fieldConfig.type}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                placeholder={fieldConfig.placeholder}
                disabled={disabled || lookingUp}
                aria-label={fieldConfig.label}
                className="flex-1 bg-brand-bg-secondary/50 border border-brand-border rounded-xl px-4 py-3 text-sm text-brand-text-primary placeholder-brand-text-disabled focus:outline-none focus:border-brand-gold transition-all disabled:opacity-50"
              />
              <button
                onClick={handleSubmit}
                disabled={disabled || lookingUp || !value.trim()}
                aria-label="Look up"
                className="flex items-center gap-2 bg-brand-gold hover:bg-brand-gold-hover disabled:opacity-50 text-brand-bg-secondary px-5 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer disabled:cursor-not-allowed"
              >
                {lookingUp ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
                <span>{lookingUp ? "Searching..." : "Look Up"}</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          role="alert"
          className="flex items-start gap-3 bg-status-error/10 border border-status-error/20 rounded-xl p-4"
        >
          <AlertCircle size={16} className="text-status-error shrink-0 mt-0.5" />
          <p className="text-xs text-status-error">{error}</p>
        </motion.div>
      )}
    </div>
  )
}
