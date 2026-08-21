import { Send } from 'lucide-react'
import { useState } from 'react'

const CATEGORY_OPTIONS = [
  { value: 'technical', label: 'Technical Issue' },
  { value: 'billing', label: 'Account & Billing' },
  { value: 'feature_request', label: 'Feature Request' },
  { value: 'other', label: 'General Inquiry' },
]

interface NewTicketFormProps {
  primaryColor: string
  creating: boolean
  onSubmit: (subject: string, message: string, category: string) => Promise<void>
}

export default function NewTicketForm({ primaryColor, creating, onSubmit }: NewTicketFormProps) {
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [category, setCategory] = useState('technical')

  const handleSubmit = () => onSubmit(subject, message, category)

  return (
    <div className="flex-1 overflow-y-auto px-4 py-5">
      <div className="space-y-4">
        <div>
          <label className="block text-[10px] font-bold text-brand-text-muted uppercase tracking-wider mb-1.5">Subject</label>
          <input value={subject} onChange={(e) => setSubject(e.target.value)}
            placeholder="What do you need help with?"
            className="w-full bg-brand-surface border border-brand-divider rounded-xl px-4 py-3 text-xs text-brand-text-primary placeholder-brand-text-disabled focus:outline-none transition-all" />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-brand-text-muted uppercase tracking-wider mb-1.5">Category</label>
          <div className="grid grid-cols-2 gap-2">
            {CATEGORY_OPTIONS.map((c) => (
              <button key={c.value} onClick={() => setCategory(c.value)}
                className={`px-3 py-2 rounded-xl text-[10px] font-bold border transition-all cursor-pointer ${
                  category === c.value
                    ? 'text-white border-transparent'
                    : 'text-brand-text-muted border-brand-divider hover:border-brand-text-disabled'
                }`}
                style={category === c.value ? { backgroundColor: primaryColor } : {}}>
                {c.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-[10px] font-bold text-brand-text-muted uppercase tracking-wider mb-1.5">Message</label>
          <textarea value={message} onChange={(e) => setMessage(e.target.value)}
            rows={4} placeholder="Describe your issue..."
            className="w-full bg-brand-surface border border-brand-divider rounded-xl px-4 py-3 text-xs text-brand-text-primary placeholder-brand-text-disabled focus:outline-none transition-all resize-none" />
        </div>
        <button onClick={handleSubmit}
          disabled={!subject.trim() || !message.trim() || creating}
          className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-xs font-bold text-white disabled:opacity-50 transition-all cursor-pointer"
          style={{ backgroundColor: primaryColor }}>
          {creating ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Send size={14} />
          )}
          {creating ? 'Sending...' : 'Start Conversation'}
        </button>
      </div>
    </div>
  )
}
