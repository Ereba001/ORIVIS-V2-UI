import { useRef, type ClipboardEvent, type KeyboardEvent } from "react"

interface VotingPassInputProps {
  value: string[]
  onChange: (groups: string[]) => void
  disabled?: boolean
}

const GROUP_SIZE = 4
const NUM_GROUPS = 4

export default function VotingPassInput({ value, onChange, disabled }: VotingPassInputProps) {
  const refs = useRef<(HTMLInputElement | null)[]>([])

  function handleChange(index: number, text: string) {
    const upper = text.replace(/[^A-Z0-9]/gi, "").toUpperCase().slice(0, GROUP_SIZE)
    const next = [...value]
    next[index] = upper
    onChange(next)

    if (upper.length === GROUP_SIZE && index < NUM_GROUPS - 1) {
      refs.current[index + 1]?.focus()
    }
  }

  function handleKeyDown(index: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !value[index] && index > 0) {
      refs.current[index - 1]?.focus()
    }
  }

  function handlePaste(e: ClipboardEvent<HTMLInputElement>) {
    e.preventDefault()
    const text = e.clipboardData.getData("text").replace(/[^A-Z0-9]/gi, "").toUpperCase()
    const groups: string[] = []
    for (let i = 0; i < NUM_GROUPS; i++) {
      groups.push(text.slice(i * GROUP_SIZE, (i + 1) * GROUP_SIZE))
    }
    onChange(groups)
    let lastNonEmpty = 0
    for (let i = groups.length - 1; i >= 0; i--) {
      if (groups[i]!.length === GROUP_SIZE) { lastNonEmpty = i; break }
    }
    const focusIdx = lastNonEmpty < NUM_GROUPS - 1 ? lastNonEmpty + 1 : NUM_GROUPS - 1
    refs.current[focusIdx]?.focus()
  }

  return (
    <div className="flex items-center gap-2 justify-center">
      {Array.from({ length: NUM_GROUPS }, (_, i) => (
        <div key={i} className="flex items-center gap-2">
          <input
            ref={(el) => { refs.current[i] = el }}
            type="text"
            inputMode="text"
            autoComplete="off"
            maxLength={GROUP_SIZE}
            disabled={disabled}
            value={value[i] ?? ""}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            onPaste={i === 0 ? handlePaste : undefined}
            className="w-16 h-14 text-center text-lg font-mono font-bold tracking-widest bg-brand-surface border border-brand-border rounded-xl text-brand-text-primary placeholder-brand-text-disabled focus:outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold/30 transition-all disabled:opacity-50 uppercase"
            placeholder="____"
          />
          {i < NUM_GROUPS - 1 && (
            <span className="text-brand-text-disabled text-lg font-bold">-</span>
          )}
        </div>
      ))}
    </div>
  )
}
