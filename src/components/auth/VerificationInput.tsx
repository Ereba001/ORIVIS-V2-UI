import { useRef, useCallback } from "react";

interface VerificationInputProps {
  length?: number;
  value: string[];
  onChange: (value: string[]) => void;
  disabled?: boolean;
  error?: string;
  groupSize?: number;
}

export default function VerificationInput({
  length = 6, value, onChange, disabled, error, groupSize = 0
}: VerificationInputProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = useCallback((index: number, char: string) => {
    if (char.length > 1) {
      const chars = char.slice(0, length - index).split("");
      const newValue = [...value];
      chars.forEach((c, i) => {
        if (index + i < length && /^[a-zA-Z0-9]$/.test(c)) {
          newValue[index + i] = c;
        }
      });
      onChange(newValue);
      const nextIdx = index + chars.length;
      if (nextIdx < length && inputRefs.current[nextIdx]) {
        inputRefs.current[nextIdx]?.focus();
      }
      return;
    }
    if (/^[a-zA-Z0-9]$/.test(char) || char === "") {
      const newValue = [...value];
      newValue[index] = char.toUpperCase();
      onChange(newValue);
      if (char && index < length - 1) {
        inputRefs.current[index + 1]?.focus();
      }
    }
  }, [length, value, onChange]);

  const handleKeyDown = useCallback((index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !value[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }, [value]);

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text").replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
    const chars = text.slice(0, length).split("");
    const newValue = [...value];
    chars.forEach((c, i) => { newValue[i] = c; });
    onChange(newValue);
    const nextIdx = chars.length;
    if (nextIdx < length && inputRefs.current[nextIdx]) {
      inputRefs.current[nextIdx]?.focus();
    }
  }, [length, value, onChange]);

  const renderGroup = (start: number, end: number) => (
    <div className="flex gap-1.5">
      {Array.from({ length: end - start }).map((_, i) => {
        const idx = start + i;
        return (
          <input
            key={idx}
            ref={(el) => { inputRefs.current[idx] = el; }}
            type="text"
            inputMode="text"
            maxLength={1}
            value={value[idx] || ""}
            onChange={(e) => handleChange(idx, e.target.value)}
            onKeyDown={(e) => handleKeyDown(idx, e)}
            onPaste={idx === 0 ? handlePaste : undefined}
            disabled={disabled}
            className={`w-9 h-11 text-center text-sm font-mono font-bold bg-brand-bg-secondary/50 border ${error ? "border-status-danger" : "border-brand-border"} rounded-lg text-brand-text-primary focus:outline-none focus:border-brand-gold focus:bg-brand-surface transition-all disabled:opacity-50 uppercase`}
          />
        );
      })}
    </div>
  );

  if (groupSize > 0) {
    const groups: React.ReactNode[] = [];
    for (let i = 0; i < length; i += groupSize) {
      const end = Math.min(i + groupSize, length);
      groups.push(
        <div key={i} className="flex items-center gap-1.5">
          {renderGroup(i, end)}
          {end < length && <span className="text-brand-text-disabled text-lg mx-1">-</span>}
        </div>
      );
    }
    return (
      <div className="flex items-center justify-center gap-2 flex-wrap">
        {groups}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center gap-1.5">
      {renderGroup(0, length)}
    </div>
  );
}
