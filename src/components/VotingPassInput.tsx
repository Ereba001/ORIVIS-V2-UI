import { type ChangeEvent } from "react"

interface VotingPassInputProps {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  placeholder?: string
}

/**
 * Single-field voting pass / token input.
 *
 * Accepts the complete pass EXACTLY as issued — e.g. `ABC-123456-ORV` (with
 * hyphens) or a 64-char raw token — including pasted values. The value is
 * sent to the backend untouched and validated server-side; the input only
 * trims surrounding whitespace for ergonomics.
 */
export default function VotingPassInput({ value, onChange, disabled, placeholder = "ABC-123456-ORV" }: VotingPassInputProps) {
  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    // Trim outer whitespace only — hyphens and casing are preserved so the
    // complete pass can be matched exactly against the issued code.
    onChange(e.target.value.trim())
  }

  return (
    <div className="w-full">
      <input
        name="votingPass"
        type="text"
        aria-label="Voting pass"
        inputMode="text"
        autoComplete="off"
        autoCapitalize="characters"
        spellCheck={false}
        disabled={disabled}
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        className="w-full h-14 text-center text-lg font-mono font-bold tracking-widest bg-brand-surface border border-brand-border rounded-xl text-brand-text-primary placeholder-brand-text-disabled focus:outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold/30 transition-all disabled:opacity-50 uppercase"
      />
    </div>
  )
}
