import { useState, useMemo, type ReactNode } from "react"
import { motion } from "motion/react"
import { ChevronDown, ChevronUp, ChevronsUpDown } from "lucide-react"

export interface Column<T> {
  key: string
  label: string
  sortable?: boolean
  render: (row: T) => ReactNode
  sortValue?: (row: T) => string | number
}

interface Props<T> {
  columns: Column<T>[]
  data: T[]
  keyExtractor: (row: T) => string
  onRowClick?: (row: T) => void
  selectedIds?: Set<string>
  onSelectChange?: (id: string, selected: boolean) => void
  emptyMessage?: string
  pageSize?: number
}

export default function AdvancedTable<T>({
  columns, data, keyExtractor, onRowClick,
  selectedIds, onSelectChange, emptyMessage = "No data",
  pageSize = 10,
}: Props<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc")
  const [page, setPage] = useState(0)

  const sorted = useMemo(() => {
    if (!sortKey) return data
    const col = columns.find((c) => c.key === sortKey)
    if (!col) return data
    return [...data].sort((a, b) => {
      const av = col.sortValue ? col.sortValue(a) : String(col.render(a))
      const bv = col.sortValue ? col.sortValue(b) : String(col.render(b))
      const cmp = typeof av === "number" && typeof bv === "number" ? av - bv : String(av).localeCompare(String(bv))
      return sortDir === "asc" ? cmp : -cmp
    })
  }, [data, sortKey, sortDir, columns])

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize))
  const paged = sorted.slice(page * pageSize, (page + 1) * pageSize)

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    } else {
      setSortKey(key)
      setSortDir("asc")
    }
    setPage(0)
  }

  const SortIcon = ({ col }: { col: string }) => {
    if (sortKey !== col) return <ChevronsUpDown size={12} className="text-brand-text-disabled" />
    return sortDir === "asc" ? <ChevronUp size={12} /> : <ChevronDown size={12} />
  }

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center py-16 text-xs text-brand-text-muted">
        {emptyMessage}
      </div>
    )
  }

  return (
    <div>
      <div className="overflow-x-auto rounded-2xl border border-brand-border">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-brand-border bg-brand-surface-elevated">
              {selectedIds && onSelectChange && (
                <th className="px-4 py-3 w-10">
                  <input
                    type="checkbox"
                    name="selectAll"
                    aria-label="Select all rows"
                    className="accent-brand-gold"
                    checked={selectedIds.size === data.length}
                    onChange={() => {
                      if (selectedIds.size === data.length) {
                        data.forEach((r) => onSelectChange(keyExtractor(r), false))
                      } else {
                        data.forEach((r) => onSelectChange(keyExtractor(r), true))
                      }
                    }}
                  />
                </th>
              )}
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-brand-text-muted ${col.sortable ? "cursor-pointer hover:text-brand-text-primary select-none" : ""}`}
                  onClick={() => col.sortable && handleSort(col.key)}
                >
                  <div className="flex items-center gap-1.5">
                    {col.label}
                    {col.sortable && <SortIcon col={col.key} />}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paged.map((row, i) => {
              const id = keyExtractor(row)
              const isSelected = selectedIds?.has(id)
              return (
                <motion.tr
                  key={id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.02, duration: 0.2 }}
                  className={`border-b border-brand-border last:border-b-0 transition-colors ${onRowClick ? "cursor-pointer" : ""} ${isSelected ? "bg-brand-gold/5" : "hover:bg-brand-surface-interactive"}`}
                  onClick={() => onRowClick?.(row)}
                >
                  {selectedIds && onSelectChange && (
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        name="selectRow"
                        aria-label="Select row"
                        className="accent-brand-gold"
                        checked={!!isSelected}
                        onChange={(e) => { e.stopPropagation(); onSelectChange(id, e.target.checked) }}
                      />
                    </td>
                  )}
                  {columns.map((col) => (
                    <td key={col.key} className="px-4 py-3 text-xs text-brand-text-primary">
                      {col.render(row)}
                    </td>
                  ))}
                </motion.tr>
              )
            })}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <span className="text-[11px] text-brand-text-muted">
            Page {page + 1} of {totalPages}
          </span>
          <div className="flex items-center gap-2">
            <button
              disabled={page === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-brand-text-muted hover:text-brand-text-primary disabled:opacity-30 disabled:cursor-not-allowed bg-brand-surface-interactive rounded-xl transition-colors cursor-pointer"
            >
              Prev
            </button>
            <button
              disabled={page >= totalPages - 1}
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-brand-text-muted hover:text-brand-text-primary disabled:opacity-30 disabled:cursor-not-allowed bg-brand-surface-interactive rounded-xl transition-colors cursor-pointer"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
