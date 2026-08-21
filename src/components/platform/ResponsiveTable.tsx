import { ReactNode } from "react"

export interface ResponsiveColumn<T> {
  key: string
  label: string
  className?: string
  render?: (row: T, index: number) => ReactNode
  hideOnMobile?: boolean
  mobileOrder?: number
}

interface ResponsiveTableProps<T> {
  columns: ResponsiveColumn<T>[]
  data: T[]
  keyExtractor: (row: T, index: number) => string | number
  onRowClick?: (row: T) => void
  emptyMessage?: string
}

export default function ResponsiveTable<T extends Record<string, any>>({
  columns,
  data,
  keyExtractor,
  onRowClick,
  emptyMessage = "No data found",
}: ResponsiveTableProps<T>) {
  // Desktop shows every column; hideOnMobile columns are the detail that
  // drops out of the compact mobile card layout only.
  const visibleDesktopCols = columns
  const mobileCols = columns
    .filter((c) => !c.hideOnMobile)
    .sort((a, b) => (a.mobileOrder ?? 0) - (b.mobileOrder ?? 0))

  if (data.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-xs text-brand-text-muted">{emptyMessage}</p>
      </div>
    )
  }

  return (
    <>
      {/* Desktop table */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-brand-divider">
              {visibleDesktopCols.map((col) => (
                <th
                  key={col.key}
                  className={`px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-brand-text-muted whitespace-nowrap ${col.className ?? ""}`}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => (
              <tr
                key={keyExtractor(row, i)}
                onClick={() => onRowClick?.(row)}
                className={`border-b border-brand-divider transition-colors ${
                  onRowClick ? "cursor-pointer hover:bg-brand-surface-interactive/50" : ""
                }`}
              >
                {visibleDesktopCols.map((col) => (
                  <td key={col.key} className={`px-4 py-3 text-xs ${col.className ?? ""}`}>
                    {col.render ? col.render(row, i) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="lg:hidden divide-y divide-brand-divider">
        {data.map((row, i) => (
          <div
            key={keyExtractor(row, i)}
            onClick={() => onRowClick?.(row)}
            className={`px-4 py-3 space-y-2 ${
              onRowClick ? "cursor-pointer active:bg-brand-surface-interactive/50" : ""
            }`}
          >
            {mobileCols.map((col) => {
              const value = col.render ? col.render(row, i) : row[col.key]
              if (!value) return null
              return (
                <div key={col.key} className="flex items-start justify-between gap-3">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-brand-text-muted shrink-0 pt-0.5">
                    {col.label}
                  </span>
                  <span className={`text-xs text-brand-text-primary text-right min-w-0 ${col.className ?? ""}`}>
                    {value}
                  </span>
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </>
  )
}
