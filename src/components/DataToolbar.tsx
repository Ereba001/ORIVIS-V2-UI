import { type ReactNode } from "react"
import SearchInput from "./platform/SearchInput"
import FilterDropdown from "./platform/FilterDropdown"

interface FilterOption {
  value: string
  label: string
}

interface FilterConfig {
  label: string
  options: FilterOption[]
  value: string
  onChange: (value: string) => void
}

interface Props {
  search?: { value: string; onChange: (v: string) => void; placeholder?: string }
  filters?: FilterConfig[]
  bulkActions?: ReactNode
  rightContent?: ReactNode
}

export default function DataToolbar({ search, filters, bulkActions, rightContent }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-3 mb-4">
      {search && (
        <div className="w-full sm:w-56">
          <SearchInput value={search.value} onChange={search.onChange} placeholder={search.placeholder} />
        </div>
      )}
      {filters?.map((f) => (
        <FilterDropdown key={f.label} label={f.label} options={f.options} value={f.value} onChange={f.onChange} />
      ))}
      {bulkActions && (
        <div className="flex items-center gap-2 ml-auto">
          {bulkActions}
        </div>
      )}
      {rightContent && !bulkActions && (
        <div className="flex items-center gap-2 ml-auto">
          {rightContent}
        </div>
      )}
    </div>
  )
}
