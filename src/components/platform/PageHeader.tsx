import type { ReactNode } from "react"
import SearchInput from "./SearchInput"

interface Props {
  title: string
  description?: string
  actions?: ReactNode
  search?: { value: string; onChange: (v: string) => void; placeholder?: string }
}

export default function PageHeader({ title, description, actions, search }: Props) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
      <div className="min-w-0 flex-1">
        <h1 className="text-lg font-bold text-brand-text-primary">{title}</h1>
        {description && (
          <p className="text-xs text-brand-text-muted mt-0.5">{description}</p>
        )}
      </div>
      <div className="flex items-center gap-3 shrink-0">
        {search && (
          <div className="w-56">
            <SearchInput value={search.value} onChange={search.onChange} placeholder={search.placeholder} />
          </div>
        )}
        {actions}
      </div>
    </div>
  )
}
