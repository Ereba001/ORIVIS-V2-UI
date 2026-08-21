import { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Upload, X, FileText, AlertTriangle, Check, ArrowRight, HelpCircle, Loader2 } from 'lucide-react'
import { useOrgBranding } from '../contexts/OrgBrandingContext'
import type { CsvParseResult } from '../../types/registration'

interface Props {
  open: boolean
  onClose: () => void
  onConfirm: (mapping: Record<string, string>, records: Record<string, string>[]) => void
  expectedHeaders: string[]
  requiredHeaders: string[]
}

type Step = 'upload' | 'preview' | 'mapping' | 'confirm'

const MAX_PREVIEW_ROWS = 100
const MAX_FILE_SIZE = 5 * 1024 * 1024

function sanitizeCell(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .slice(0, 500)
}

function parseCSV(text: string): CsvParseResult {
  const lines: string[] = []
  let current = ''
  let inQuotes = false
  for (const ch of text) {
    if (ch === '\r') continue
    if (ch === '"') { inQuotes = !inQuotes; continue }
    if (ch === '\n' && !inQuotes) { lines.push(current); current = ''; continue }
    current += ch
  }
  if (current.trim()) lines.push(current)
  if (lines.length === 0) return { headers: [], rows: [], totalRows: 0, invalidRows: 0, duplicateCount: 0, errors: ['CSV is empty'] }

  const parseLine = (line: string): string[] => {
    const result: string[] = []
    let field = ''
    let quoted = false
    for (let i = 0; i < line.length; i++) {
      const ch = line[i]
      if (quoted) {
        if (ch === '"') {
          if (i + 1 < line.length && line[i + 1] === '"') { field += '"'; i++; continue }
          quoted = false; continue
        }
        field += ch; continue
      }
      if (ch === '"') { quoted = true; continue }
      if (ch === ',') { result.push(field.trim()); field = ''; continue }
      field += ch
    }
    result.push(field.trim())
    return result
  }

  const rawHeaders = parseLine(lines[0])
  const seenHeaders = new Map<string, number>()
  const headers: string[] = []
  const headerErrors: string[] = []

  for (const h of rawHeaders) {
    const normalized = h.toLowerCase().replace(/[\s_-]+/g, '_').replace(/[^a-z0-9_]/g, '')
    if (!normalized) { headerErrors.push('Empty header found'); continue }
    if (seenHeaders.has(normalized)) {
      headerErrors.push(`Duplicate header: "${h}"`)
      continue
    }
    seenHeaders.set(normalized, headers.length)
    headers.push(normalized)
  }

  if (headers.length === 0) {
    return { headers: [], rows: [], totalRows: 0, invalidRows: 0, duplicateCount: 0, errors: ['No valid headers found in CSV'] }
  }

  const rows: Record<string, string>[] = []
  const seenRecords = new Set<string>()
  let invalidRows = 0
  let duplicateCount = 0

  for (let i = 1; i < lines.length; i++) {
    const values = parseLine(lines[i])
    if (values.length === 0 || values.every((v) => !v.trim())) { invalidRows++; continue }

    const row: Record<string, string> = {}
    let hasData = false
    for (let j = 0; j < headers.length; j++) {
      const val = values[j]?.trim() ?? ''
      row[headers[j]] = sanitizeCell(val)
      if (val) hasData = true
    }
    if (!hasData) { invalidRows++; continue }

    const signature = headers.map((h) => row[h]).join('|')
    if (seenRecords.has(signature)) { duplicateCount++; continue }
    seenRecords.add(signature)

    rows.push(row)
  }

  const allErrors = headerErrors.length > 0
    ? [...headerErrors, ...(lines.length > 1 ? [] : ['No data rows found'])]
    : rows.length === 0
      ? ['No valid data rows found']
      : []

  return { headers, rows, totalRows: lines.length - 1, invalidRows, duplicateCount, errors: allErrors }
}

export default function CsvMappingModal({ open, onClose, onConfirm, expectedHeaders, requiredHeaders }: Props) {
  const { branding } = useOrgBranding()
  const pColor = branding.primaryColor
  const [step, setStep] = useState<Step>('upload')
  const [file, setFile] = useState<File | null>(null)
  const [parseResult, setParseResult] = useState<CsvParseResult | null>(null)
  const [mapping, setMapping] = useState<Record<string, string>>({})
  const [error, setError] = useState<string | null>(null)
  const [parsing, setParsing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const modalRef = useRef<HTMLDivElement>(null)

  const reset = useCallback(() => {
    setStep('upload')
    setFile(null)
    setParseResult(null)
    setMapping({})
    setError(null)
    setParsing(false)
  }, [])

  const handleClose = useCallback(() => {
    reset()
    onClose()
  }, [reset, onClose])

  useEffect(() => {
    if (!open) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [open, handleClose])

  useEffect(() => {
    if (!open) return
    const focusable = modalRef.current?.querySelector<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    focusable?.focus()
  }, [open, step])

  const handleFile = useCallback((f: File) => {
    if (!f.name.toLowerCase().endsWith('.csv')) {
      setError('Only .csv files are accepted.')
      return
    }
    if (f.size > MAX_FILE_SIZE) {
      setError(`File size exceeds the ${(MAX_FILE_SIZE / 1024 / 1024).toFixed(0)} MB limit.`)
      return
    }
    if (f.size === 0) {
      setError('File is empty.')
      return
    }

    setError(null)
    setFile(f)
    setParsing(true)

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const text = typeof e.target?.result === 'string' ? e.target.result : ''
        const result = parseCSV(text)
        setParseResult(result)
        setParsing(false)

        if (result.errors.length > 0 && result.rows.length === 0) {
          setError(result.errors.join('. '))
          return
        }

        const autoMapping: Record<string, string> = {}
        for (const expected of expectedHeaders) {
          const match = result.headers.find(
            (h) => h === expected || h.replace(/[^a-z0-9]/g, '') === expected.replace(/[^a-z0-9]/g, '')
          )
          if (match) autoMapping[expected] = match
        }
        setMapping(autoMapping)
        setStep('preview')
      } catch (err) {
        setParsing(false)
        setError(err instanceof Error ? err.message : 'Failed to parse CSV file.')
      }
    }
    reader.onerror = () => { setParsing(false); setError('Failed to read file.') }
    reader.readAsText(f)
  }, [expectedHeaders])

  const previewRows = useMemo(() => {
    if (!parseResult) return []
    return parseResult.rows.slice(0, MAX_PREVIEW_ROWS)
  }, [parseResult])

  const missingRequired = requiredHeaders.filter(
    (h) => !mapping[h] || !parseResult?.headers.includes(mapping[h])
  )

  const unmappedFields = expectedHeaders.filter((h) => !mapping[h] || !parseResult?.headers.includes(mapping[h]))

  const duplicateMappings = useMemo(() => {
    const seen = new Map<string, string[]>()
    for (const [field, column] of Object.entries(mapping)) {
      if (!column) continue
      const existing = seen.get(column) ?? []
      existing.push(field)
      seen.set(column, existing)
    }
    return [...seen.entries()].filter(([, f]) => f.length > 1).map(([col, f]) => ({ column: col, fields: f }))
  }, [mapping])

  const labelClass = 'text-[10px] font-mono font-bold text-brand-text-muted uppercase tracking-wider mb-1.5 block'

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={handleClose}
          role="dialog"
          aria-modal="true"
          aria-label="Import CSV"
        >
          <motion.div
            ref={modalRef}
            initial={{ scale: 0.95, opacity: 0, y: 8 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 8 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e: React.MouseEvent) => e.stopPropagation()}
            className="glass-strong rounded-2xl p-6 w-full max-w-2xl shadow-brand-lg max-h-[85vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${pColor}18`, color: pColor }}>
                  <FileText size={18} aria-hidden="true" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-brand-text-primary">Import CSV</h3>
                  <p className="text-[10px] text-brand-text-muted">
                    {parsing && 'Parsing CSV...'}
                    {!parsing && step === 'upload' && 'Upload a CSV file with voter data'}
                    {!parsing && step === 'preview' && 'Review parsed data'}
                    {!parsing && step === 'mapping' && 'Map CSV columns to fields'}
                    {!parsing && step === 'confirm' && 'Confirm import'}
                  </p>
                </div>
              </div>
              <button
                onClick={handleClose}
                aria-label="Close dialog"
                className="text-brand-text-muted hover:text-brand-text-primary transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex items-center gap-1 mb-5" role="tablist" aria-label="Import steps">
              {(['upload', 'preview', 'mapping', 'confirm'] as const).map((s, i) => {
                const stepIndex = ['upload', 'preview', 'mapping', 'confirm'].indexOf(step)
                const isDone = i < stepIndex
                return (
                  <div key={s} className="flex items-center gap-1 flex-1">
                    <div
                      role="tab"
                      aria-selected={s === step}
                      className={`flex items-center justify-center w-6 h-6 rounded-full text-[9px] font-mono font-bold transition-all ${
                        s === step ? 'text-white' : isDone ? 'text-black' : 'text-brand-text-muted bg-brand-surface-elevated'
                      }`}
                      style={{ backgroundColor: s === step || isDone ? pColor : undefined }}
                    >
                      {isDone ? <Check size={10} aria-hidden="true" /> : i + 1}
                    </div>
                    {i < 3 && (
                      <div
                        className={`flex-1 h-px ${isDone ? '' : 'bg-brand-divider'}`}
                        style={{ backgroundColor: isDone ? pColor : undefined }}
                        aria-hidden="true"
                      />
                    )}
                  </div>
                )
              })}
            </div>

            {error && (
              <div role="alert" className="flex items-center gap-2 p-3 rounded-xl bg-status-error/10 border border-status-error/20 mb-4">
                <AlertTriangle size={14} className="text-status-error shrink-0" />
                <p className="text-[10px] font-mono text-status-error">{error}</p>
              </div>
            )}

            {/* STEP: UPLOAD */}
            {step === 'upload' && !parsing && (
              <div
                onClick={() => fileInputRef.current?.click()}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click() }}
                role="button"
                tabIndex={0}
                aria-label="Upload CSV file"
                className="border-2 border-dashed border-brand-divider rounded-2xl p-8 text-center cursor-pointer hover:border-brand-text-muted transition-colors focus:outline-none focus:border-[var(--org-primary)]"
              >
                <input
                  ref={fileInputRef}
                  name="csvFileUpload"
                  type="file"
                  aria-label="Upload CSV file"
                  accept=".csv"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
                  className="hidden"
                  aria-hidden="true"
                />
                <Upload size={28} className="mx-auto mb-3 text-brand-text-disabled" aria-hidden="true" />
                <p className="text-xs text-brand-text-muted font-medium">
                  <span className="underline decoration-brand-gold/30" style={{ color: pColor }}>Click to upload</span> a CSV file
                </p>
                <p className="text-[10px] text-brand-text-disabled mt-1">Comma separated values (.csv) up to 5 MB</p>
              </div>
            )}

            {parsing && (
              <div className="flex items-center justify-center gap-3 py-12">
                <Loader2 size={20} className="animate-spin" style={{ color: pColor }} aria-hidden="true" />
                <span className="text-xs text-brand-text-muted">Parsing CSV...</span>
              </div>
            )}

            {/* STEP: PREVIEW */}
            {step === 'preview' && parseResult && (
              <div className="space-y-4">
                {file && (
                  <div className="flex items-center gap-2.5 p-3 rounded-xl bg-brand-surface-elevated/20">
                    <FileText size={14} className="text-brand-text-muted" aria-hidden="true" />
                    <span className="text-xs text-brand-text-primary flex-1 truncate">{file.name}</span>
                    <span className="text-[10px] font-mono text-brand-text-muted">{(file.size / 1024).toFixed(1)} KB</span>
                  </div>
                )}

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div className="p-2.5 rounded-xl bg-brand-surface-elevated/20 text-center">
                    <p className="text-sm font-bold text-brand-text-primary">{parseResult.totalRows}</p>
                    <p className="text-[8px] font-mono text-brand-text-muted uppercase tracking-wider">Total Rows</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-brand-surface-elevated/20 text-center">
                    <p className="text-sm font-bold text-brand-text-primary">{parseResult.rows.length}</p>
                    <p className="text-[8px] font-mono text-brand-text-muted uppercase tracking-wider">Valid</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-brand-surface-elevated/20 text-center">
                    <p className={`text-sm font-bold ${parseResult.invalidRows > 0 ? 'text-status-warning' : 'text-brand-text-primary'}`}>{parseResult.invalidRows}</p>
                    <p className="text-[8px] font-mono text-brand-text-muted uppercase tracking-wider">Skipped</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-brand-surface-elevated/20 text-center">
                    <p className={`text-sm font-bold ${parseResult.duplicateCount > 0 ? 'text-status-warning' : 'text-brand-text-primary'}`}>{parseResult.duplicateCount}</p>
                    <p className="text-[8px] font-mono text-brand-text-muted uppercase tracking-wider">Duplicates</p>
                  </div>
                </div>

                <div>
                  <p className={labelClass}>CSV Headers</p>
                  <div className="flex flex-wrap gap-1.5">
                    {parseResult.headers.map((h) => (
                      <span key={h} className={`px-2.5 py-1 rounded-lg text-[10px] font-mono border ${
                        expectedHeaders.includes(h) ? 'border-status-success/30 text-status-success bg-status-success/10' : 'bg-brand-surface-elevated text-brand-text-muted border-brand-divider'
                      }`}>
                        {h}
                      </span>
                    ))}
                  </div>
                </div>

                {previewRows.length > 0 && (
                  <div>
                    <p className={labelClass}>Preview (first {Math.min(previewRows.length, MAX_PREVIEW_ROWS)} rows)</p>
                    <div className="overflow-x-auto rounded-xl border border-brand-divider">
                      <table className="w-full text-[10px] font-mono">
                        <thead>
                          <tr className="bg-brand-surface-elevated">
                            {parseResult.headers.map((h) => (
                              <th key={h} scope="col" className="px-3 py-2 text-left text-brand-text-muted font-bold uppercase tracking-wider whitespace-nowrap">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {previewRows.map((row, i) => (
                            <tr key={i} className="border-t border-brand-divider">
                              {parseResult.headers.map((h) => (
                                <td key={h} className="px-3 py-2 text-brand-text-primary truncate max-w-[160px]" title={row[h]}>
                                  {row[h] || <span className="text-brand-text-disabled">&mdash;</span>}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  {missingRequired.length > 0 && (
                    <div className="flex items-center gap-1.5 text-[10px] font-mono text-status-warning">
                      <AlertTriangle size={12} aria-hidden="true" />
                      Missing required headers: {missingRequired.join(', ')}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* STEP: MAPPING */}
            {step === 'mapping' && parseResult && (
              <div className="space-y-3">
                <p className="text-[10px] text-brand-text-muted">Map CSV columns to registration fields. Required fields are marked with <span aria-hidden="true" className="text-status-error">*</span>.</p>

                {duplicateMappings.map(({ column, fields }) => (
                  <div key={column} role="alert" className="flex items-center gap-2 p-2.5 rounded-xl bg-status-warning/10 border border-status-warning/20 text-[10px] font-mono text-status-warning">
                    <AlertTriangle size={12} aria-hidden="true" />
                    Column &ldquo;{column}&rdquo; mapped to multiple fields: {fields.join(', ')}
                  </div>
                ))}

                {unmappedFields.length > 0 && (
                  <div role="alert" className="flex items-center gap-2 p-2.5 rounded-xl bg-status-warning/10 border border-status-warning/20 text-[10px] font-mono text-status-warning">
                    <AlertTriangle size={12} aria-hidden="true" />
                    Unmapped fields: {unmappedFields.join(', ')}. These columns will be left empty when imported.
                  </div>
                )}

                {expectedHeaders.map((expected) => {
                  const isRequired = requiredHeaders.includes(expected)
                  const isMapped = !!mapping[expected] && parseResult.headers.includes(mapping[expected])
                  return (
                    <div key={expected} className="flex items-center gap-2 p-2.5 rounded-xl bg-brand-surface-elevated/20">
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-mono font-bold text-brand-text-primary flex items-center gap-1.5">
                          {expected}
                          {isRequired && <span aria-label="required" className="text-[8px] text-status-error">*</span>}
                        </p>
                      </div>
                      <ArrowRight size={12} className="text-brand-text-muted shrink-0" aria-hidden="true" />
                      <select
                        name="csvColumnMapping"
                        value={mapping[expected] ?? ''}
                        onChange={(e) => setMapping((prev) => ({ ...prev, [expected]: e.target.value }))}
                        aria-label={`Map ${expected} to CSV column`}
                        className={`w-44 sm:w-48 bg-brand-surface border rounded-lg px-2.5 py-1.5 text-[10px] font-mono outline-none transition-colors ${
                          isMapped ? 'border-status-success/30 text-status-success' : 'border-brand-divider text-brand-text-muted'
                        }`}
                      >
                        <option value="">&mdash; Select column &mdash;</option>
                        {parseResult.headers.map((h) => (
                          <option key={h} value={h}>{h}</option>
                        ))}
                      </select>
                      {isMapped && <Check size={12} className="text-status-success shrink-0" aria-hidden="true" />}
                    </div>
                  )
                })}
              </div>
            )}

            {/* STEP: CONFIRM */}
            {step === 'confirm' && parseResult && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 p-3 rounded-xl bg-status-success/10 border border-status-success/20">
                  <Check size={14} className="text-status-success shrink-0" aria-hidden="true" />
                  <div>
                    <p className="text-xs font-bold text-status-success">Ready to Import</p>
                    <p className="text-[10px] font-mono text-status-success/80">All {expectedHeaders.length} fields mapped successfully.</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="p-2.5 rounded-xl bg-brand-surface-elevated/20 text-center">
                    <p className="text-sm font-bold text-brand-text-primary">{parseResult.rows.length}</p>
                    <p className="text-[8px] font-mono text-brand-text-muted uppercase tracking-wider">Records</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-brand-surface-elevated/20 text-center">
                    <p className="text-sm font-bold text-brand-text-primary">{parseResult.duplicateCount}</p>
                    <p className="text-[8px] font-mono text-brand-text-muted uppercase tracking-wider">Duplicates</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-brand-surface-elevated/20 text-center">
                    <p className="text-sm font-bold text-brand-text-primary">{parseResult.invalidRows}</p>
                    <p className="text-[8px] font-mono text-brand-text-muted uppercase tracking-wider">Skipped</p>
                  </div>
                </div>

                <div>
                  <p className={labelClass}>Mapping Summary</p>
                  <div className="space-y-1.5">
                    {Object.entries(mapping).filter(([, v]) => v).map(([field, column]) => (
                      <div key={field} className="flex items-center justify-between text-[10px] font-mono px-3 py-1.5 rounded-lg bg-brand-surface-elevated/20">
                        <span className="text-brand-text-primary">{field}</span>
                        <span className="text-brand-text-muted">&rarr; {column}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2 p-3 rounded-xl bg-brand-surface-elevated/20 text-[10px] font-mono text-brand-text-muted">
                  <HelpCircle size={12} aria-hidden="true" />
                  This will import {parseResult.rows.length} record{parseResult.rows.length !== 1 ? 's' : ''} from {file?.name ?? 'CSV'}.
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-brand-divider">
              {step !== 'upload' && !parsing && (
                <button
                  type="button"
                  onClick={() => {
                    const steps: Step[] = ['upload', 'preview', 'mapping', 'confirm']
                    const idx = steps.indexOf(step)
                    if (idx > 0) setStep(steps[idx - 1])
                  }}
                  className="px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-brand-text-muted hover:text-brand-text-primary bg-brand-surface-interactive rounded-xl transition-colors cursor-pointer"
                >
                  Back
                </button>
              )}
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-brand-text-muted hover:text-brand-text-primary rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              {step === 'preview' && !parsing && (
                <button
                  type="button"
                  onClick={() => setStep('mapping')}
                  className="px-4 py-2 text-[11px] font-bold uppercase tracking-wider rounded-xl text-white transition-colors cursor-pointer"
                  style={{ backgroundColor: pColor }}
                >
                  Configure Mapping
                </button>
              )}
              {step === 'mapping' && (
                <button
                  type="button"
                  onClick={() => setStep('confirm')}
                  disabled={missingRequired.length > 0 || duplicateMappings.length > 0}
                  className="px-4 py-2 text-[11px] font-bold uppercase tracking-wider rounded-xl text-white transition-colors cursor-pointer disabled:opacity-40"
                  style={{ backgroundColor: missingRequired.length > 0 || duplicateMappings.length > 0 ? '#6b7280' : pColor }}
                  aria-disabled={missingRequired.length > 0 || duplicateMappings.length > 0}
                >
                  Review
                </button>
              )}
              {step === 'confirm' && (
                <button
                  type="button"
                  onClick={() => {
                    const fullMapping: Record<string, string> = {}
                    for (const [field, column] of Object.entries(mapping)) {
                      if (column) fullMapping[field] = column
                    }
                    onConfirm(fullMapping, parseResult?.rows ?? [])
                    handleClose()
                  }}
                  className="px-4 py-2 text-[11px] font-bold uppercase tracking-wider rounded-xl text-white transition-colors cursor-pointer"
                  style={{ backgroundColor: pColor }}
                >
                  Import {parseResult?.rows.length ?? 0} Records
                </button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
