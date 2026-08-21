import {
  CreditCard, CheckCircle2, Crown, Download,
  AlertCircle, Clock, Vote,
  FileText, Filter, ExternalLink, Receipt, Printer, X,
} from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useOrgBranding } from '../contexts/OrgBrandingContext'
import DashboardCard from '../components/DashboardCard'
import EmptyState from '../components/EmptyState'
import SkeletonLoader from '../components/SkeletonLoader'
import { billingService } from '../../services/billing-service'
import { useApiResource } from '../../hooks/useApiResource'
import { formatMoney } from '../../lib/currency'
import SeoHead from '../../components/SeoHead'
import { ROUTES } from '../../constants/routes'

const STATUS_STYLE: Record<string, { className: string; label: string; icon: typeof CheckCircle2 }> = {
  paid: { className: 'text-status-success', label: 'paid', icon: CheckCircle2 },
  payment_required: { className: 'text-status-warning', label: 'pending', icon: Clock },
  free_granted: { className: 'text-status-success', label: 'free', icon: Crown },
  verified: { className: 'text-status-success', label: 'verified', icon: CheckCircle2 },
  pending: { className: 'text-status-warning', label: 'pending', icon: Clock },
  failed: { className: 'text-status-error', label: 'failed', icon: AlertCircle },
  cancelled: { className: 'text-brand-text-muted', label: 'cancelled', icon: AlertCircle },
}

interface ReceiptDetails {
  kind: 'billing' | 'payment'
  title: string
  reference: string
  status: string
  amount: number
  paidAmount?: number
  currency: string
  date: string
  provider?: string | null
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  })[character] ?? character)
}

function pdfText(value: string): string {
  return value.replace(/[^\x20-\x7E]/g, '?').replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)')
}

function downloadReceiptPdf(receipt: ReceiptDetails): void {
  const lines = [
    'ORIVIS',
    receipt.kind === 'billing' ? 'EVENT BILLING RECEIPT' : 'PAYMENT RECEIPT',
    'Event: ' + receipt.title,
    'Reference: ' + receipt.reference,
    'Status: ' + receipt.status,
    'Amount: ' + receipt.currency + ' ' + receipt.amount.toLocaleString(),
    ...(receipt.paidAmount === undefined ? [] : ['Paid: ' + receipt.currency + ' ' + receipt.paidAmount.toLocaleString()]),
    'Currency: ' + receipt.currency,
    ...(receipt.provider ? ['Provider: ' + receipt.provider] : []),
    'Date: ' + new Date(receipt.date).toLocaleString(),
  ]
  const content = ['BT', '/F1 16 Tf', '72 740 Td', '(' + pdfText(lines[0]) + ') Tj', '/F1 11 Tf']
    .concat(lines.slice(1).flatMap((line) => ['0 -24 Td', '(' + pdfText(line) + ') Tj']))
    .concat(['ET']).join('\n')
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>',
    '<< /Length ' + new TextEncoder().encode(content).length + ' >>\nstream\n' + content + '\nendstream',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
  ]
  let pdf = '%PDF-1.4\n'
  const offsets = [0]
  objects.forEach((object, index) => {
    offsets[index + 1] = pdf.length
    pdf += (index + 1) + ' 0 obj\n' + object + '\nendobj\n'
  })
  const xrefOffset = pdf.length
  pdf += 'xref\n0 ' + (objects.length + 1) + '\n0000000000 65535 f \n'
  offsets.slice(1).forEach((offset) => { pdf += String(offset).padStart(10, '0') + ' 00000 n \n' })
  pdf += 'trailer\n<< /Size ' + (objects.length + 1) + ' /Root 1 0 R >>\nstartxref\n' + xrefOffset + '\n%%EOF'

  const url = URL.createObjectURL(new Blob([pdf], { type: 'application/pdf' }))
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = 'orivis-' + receipt.kind + '-receipt.pdf'
  anchor.click()
  URL.revokeObjectURL(url)
}

function printReceipt(receipt: ReceiptDetails): void {
  const printWindow = window.open('', '_blank', 'noopener,noreferrer,width=720,height=720')
  if (!printWindow) return
  const lines: Array<[string, string]> = [
    ['Event', receipt.title],
    ['Reference', receipt.reference],
    ['Status', receipt.status],
    ['Amount', formatMoney(receipt.amount, receipt.currency)],
    ...(receipt.paidAmount === undefined ? [] : [['Paid', formatMoney(receipt.paidAmount, receipt.currency)] as [string, string]]),
    ['Currency', receipt.currency],
    ...(receipt.provider ? [['Provider', receipt.provider] as [string, string]] : []),
    ['Date', new Date(receipt.date).toLocaleString()],
  ]
  const title = receipt.kind === 'billing' ? 'Event Billing Receipt' : 'Payment Receipt'
  const rows = lines.map(([label, value]) => '<p><b>' + escapeHtml(label) + '</b><span>' + escapeHtml(value) + '</span></p>').join('')
  printWindow.document.write('<!doctype html><html><head><title>' + escapeHtml(title) + '</title><style>body{font-family:Arial,sans-serif;max-width:680px;margin:48px auto;color:#171717}h1{font-size:22px;margin-bottom:8px}h2{font-size:14px;color:#555;margin-bottom:32px}p{display:flex;justify-content:space-between;border-bottom:1px solid #ddd;padding:12px 0}b{font-weight:600}</style></head><body><h1>ORIVIS</h1><h2>' + escapeHtml(title) + '</h2>' + rows + '</body></html>')
  printWindow.document.close()
  printWindow.focus()
  printWindow.print()
}

function ReceiptModal({ receipt, onClose }: { receipt: ReceiptDetails | null; onClose: () => void }) {
  if (!receipt) return null
  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4' role='presentation' onClick={onClose}>
      <div className='w-full max-w-md rounded-2xl border border-brand-border bg-brand-bg-secondary p-6 shadow-2xl' role='dialog' aria-modal='true' aria-labelledby='receipt-modal-title' onClick={event => event.stopPropagation()}>
        <div className='flex items-start justify-between gap-4'>
          <div>
            <p className='text-[10px] font-bold uppercase tracking-widest text-brand-text-muted'>ORIVIS</p>
            <h2 id='receipt-modal-title' className='mt-1 text-lg font-bold text-brand-text-primary'>{receipt.kind === 'billing' ? 'Event Billing Receipt' : 'Payment Receipt'}</h2>
          </div>
          <button type='button' aria-label='Close receipt' onClick={onClose} className='rounded-lg p-1.5 text-brand-text-muted hover:bg-brand-surface-elevated hover:text-brand-text-primary'><X size={16} /></button>
        </div>
        <dl className='mt-5 space-y-3 text-xs'>
          <div className='flex justify-between gap-4 border-b border-brand-divider pb-2'><dt className='text-brand-text-muted'>Event</dt><dd className='text-right font-semibold text-brand-text-primary'>{receipt.title}</dd></div>
          <div className='flex justify-between gap-4 border-b border-brand-divider pb-2'><dt className='text-brand-text-muted'>Reference</dt><dd className='text-right font-mono text-brand-text-primary'>{receipt.reference}</dd></div>
          <div className='flex justify-between gap-4 border-b border-brand-divider pb-2'><dt className='text-brand-text-muted'>Status</dt><dd className='capitalize text-brand-text-primary'>{receipt.status.replaceAll('_', ' ')}</dd></div>
          <div className='flex justify-between gap-4 border-b border-brand-divider pb-2'><dt className='text-brand-text-muted'>Amount</dt><dd className='font-semibold text-brand-text-primary'>{formatMoney(receipt.amount, receipt.currency)}</dd></div>
          {receipt.paidAmount !== undefined && <div className='flex justify-between gap-4 border-b border-brand-divider pb-2'><dt className='text-brand-text-muted'>Paid</dt><dd className='font-semibold text-brand-text-primary'>{formatMoney(receipt.paidAmount, receipt.currency)}</dd></div>}
          {receipt.provider && <div className='flex justify-between gap-4 border-b border-brand-divider pb-2'><dt className='text-brand-text-muted'>Provider</dt><dd className='text-brand-text-primary'>{receipt.provider}</dd></div>}
          <div className='flex justify-between gap-4'><dt className='text-brand-text-muted'>Date</dt><dd className='text-right text-brand-text-primary'>{new Date(receipt.date).toLocaleString()}</dd></div>
        </dl>
        <div className='mt-6 flex justify-end gap-2'>
          <button type='button' onClick={() => printReceipt(receipt)} className='inline-flex items-center gap-1.5 rounded-xl border border-brand-border px-3 py-2 text-[10px] font-bold text-brand-text-primary hover:bg-brand-surface-elevated'><Printer size={13} /> Print</button>
          <button type='button' onClick={() => downloadReceiptPdf(receipt)} className='inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-[10px] font-bold text-white' style={{ backgroundColor: 'var(--org-primary)' }}><Download size={13} /> Download PDF</button>
        </div>
      </div>
    </div>
  )
}

export default function OrgBilling() {
  const { branding } = useOrgBranding()
  const pColor = branding.primaryColor
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selectedReceipt, setSelectedReceipt] = useState<ReceiptDetails | null>(null)

  const overviewResource = useApiResource(() => billingService.getOverview())
  const paymentsResource = useApiResource(() => billingService.getPayments({ per_page: 50 }))

  const data = overviewResource.data
  const payments = paymentsResource.data?.items ?? []
  const filteredEvents = data?.events?.filter(e => statusFilter === 'all' || e.status === statusFilter) ?? []

  const handleExportPayments = () => {
    if (!payments.length) return
    const escapeCsvCell = (value: string) => `"${value.replaceAll('"', '""')}"`
    const headers = ['Event', 'Reference', 'Provider', 'Amount', 'Status', 'Date']
    const rows = payments.map(p => [p.election?.title ?? '', p.reference, p.provider ?? '', String(p.amount), p.status, new Date(p.created_at).toISOString()])
    const csv = [headers, ...rows].map(row => row.map(escapeCsvCell).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'event-payments.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  if (overviewResource.loading) {
    return (<>
      <SeoHead meta={{ title: 'Billing | ORIVIS', noindex: true }} />
      <div className='space-y-6'>
        <div className='animate-pulse h-10 w-64 bg-brand-surface-elevated rounded-2xl' />
        <div className='grid grid-cols-2 lg:grid-cols-4 gap-4'>{[...Array(4)].map((_, i) => <SkeletonLoader key={i} rows={1} variant='card' />)}</div>
        <SkeletonLoader rows={4} variant='card' />
      </div>
    </>)
  }

  if (overviewResource.error || !data) {
    return (<>
      <SeoHead meta={{ title: 'Billing | ORIVIS', noindex: true }} />
      <EmptyState icon={CreditCard} title='Failed to load billing' description={overviewResource.error ?? 'Something went wrong.'} action={{ label: 'Retry', onClick: overviewResource.reload }} />
    </>)
  }

  const { summary } = data?.summary ? data : { summary: { total_billed: 0, total_paid: 0, pending_amount: 0, total_events: 0, currency: 'NGN' } }
  const summaryCards = [
    { label: 'Total Billed', value: formatMoney(summary.total_billed, summary.currency), icon: CreditCard, color: pColor },
    { label: 'Total Paid', value: formatMoney(summary.total_paid, summary.currency), icon: CheckCircle2, color: '#22C55E' },
    { label: 'Pending', value: formatMoney(summary.pending_amount, summary.currency), icon: Clock, color: summary.pending_amount > 0 ? '#F59E0B' : '#22C55E' },
    { label: 'Events Billed', value: String(summary.total_events), icon: Vote, color: pColor },
  ]

  return (<>
    <SeoHead meta={{ title: 'Billing | ORIVIS', noindex: true }} />
    <div className='space-y-6'>
      <div>
        <h1 className='text-2xl font-bold tracking-tight' style={{ color: 'var(--org-primary)' }}>Billing</h1>
        <p className='text-sm text-brand-text-muted mt-1'>Per event billing overview, invoices, and payment records.</p>
      </div>

      <div className='grid grid-cols-2 lg:grid-cols-4 gap-4'>
        {summaryCards.map(card => {
          const Icon = card.icon
          return (<DashboardCard key={card.label} hover={false}>
            <div className='flex items-center gap-3'>
              <div className='w-10 h-10 rounded-xl flex items-center justify-center shrink-0' style={{ backgroundColor: `${card.color}15` }}>
                <Icon size={18} style={{ color: card.color }} />
              </div>
              <div className='min-w-0'>
                <p className='text-[10px] text-brand-text-muted truncate'>{card.label}</p>
                <p className='text-sm font-bold text-brand-text-primary truncate'>{card.value}</p>
              </div>
            </div>
          </DashboardCard>)
        })}
      </div>

      <DashboardCard hover={false}>
        <div className='flex items-center justify-between mb-4 flex-wrap gap-2'>
          <h2 className='text-xs font-bold text-brand-text-primary'>Event Billing Records</h2>
          <div className='flex items-center gap-1 bg-brand-surface-elevated/30 rounded-xl px-2 py-1'>
            <Filter size={10} className='text-brand-text-muted' />
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className='bg-transparent text-[10px] text-brand-text-primary outline-none cursor-pointer'>
              <option value='all'>All Status</option>
              <option value='paid'>Paid</option>
              <option value='payment_required'>Pending Payment</option>
              <option value='free_granted'>Free</option>
            </select>
          </div>
        </div>
        {filteredEvents.length === 0 ? (
          <EmptyState icon={FileText} title='No billing records' description='Event billing records will appear here once events are created and billed.' />
        ) : (
          <div className='overflow-x-auto'>
            <table className='w-full text-left'>
              <thead>
                <tr className='border-b border-brand-divider'>
                  <th className='pb-2 pr-3 text-[9px] font-bold uppercase tracking-wide text-brand-text-muted'>Event</th>
                  <th className='pb-2 pr-3 text-[9px] font-bold uppercase tracking-wide text-brand-text-muted'>Tier</th>
                  <th className='pb-2 pr-3 text-[9px] font-bold uppercase tracking-wide text-brand-text-muted text-right'>Participants</th>
                  <th className='pb-2 pr-3 text-[9px] font-bold uppercase tracking-wide text-brand-text-muted text-right'>Amount</th>
                  <th className='pb-2 pr-3 text-[9px] font-bold uppercase tracking-wide text-brand-text-muted text-right'>Paid</th>
                  <th className='pb-2 pr-3 text-[9px] font-bold uppercase tracking-wide text-brand-text-muted text-right'>Status</th>
                  <th className='pb-2 text-[9px] font-bold uppercase tracking-wide text-brand-text-muted text-right'>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredEvents.map(ev => {
                  const st = STATUS_STYLE[ev.status] ?? STATUS_STYLE.cancelled
                  const StIcon = st.icon
                  const isPaid = ev.status === 'paid' || ev.status === 'free_granted'
                  return (<tr key={ev.uuid} className='border-b border-brand-divider last:border-0 hover:bg-brand-surface-elevated/10 transition-colors'>
                    <td className='py-3 pr-3'>
                      <p className='text-xs font-semibold text-brand-text-primary truncate max-w-[200px]'>{ev.election_title}</p>
                      <p className='text-[9px] text-brand-text-muted mt-0.5'>{new Date(ev.created_at).toLocaleDateString()}</p>
                    </td>
                    <td className='py-3 pr-3'><span className='text-[10px] text-brand-text-secondary font-medium'>{ev.tier_name ?? (ev.is_free ? 'Free' : '\u2014')}</span></td>
                    <td className='py-3 pr-3 text-xs font-bold text-brand-text-primary text-right whitespace-nowrap'>{ev.participant_count?.toLocaleString() ?? '0'}</td>
                    <td className='py-3 pr-3 text-xs font-bold text-brand-text-primary text-right whitespace-nowrap'>{formatMoney(ev.amount, ev.currency)}</td>
                    <td className='py-3 pr-3 text-xs font-bold text-right whitespace-nowrap' style={{ color: isPaid ? '#22C55E' : '#F59E0B' }}>{formatMoney(ev.paid_amount, ev.currency)}</td>
                    <td className='py-3 pr-3 text-right'>
                      <span className={`inline-flex items-center gap-1 text-[9px] font-bold capitalize ${st.className}`}><StIcon size={10} />{st.label}</span>
                    </td>
                    <td className='py-3 text-right'>
                      <div className='flex flex-col items-end gap-1.5'>
                      <button type='button' onClick={() => setSelectedReceipt({ kind: 'billing', title: ev.election_title, reference: ev.uuid, status: ev.status, amount: ev.amount, paidAmount: ev.paid_amount, currency: ev.currency, date: ev.created_at })} className='inline-flex items-center gap-1 text-[9px] font-bold hover:opacity-80' style={{ color: pColor }}><Receipt size={10} /> View Receipt</button>
                      <Link
                        to={ROUTES.ORG.EVENT_DETAIL(String(ev.election_id))}
                        className='inline-flex items-center gap-1 text-[9px] font-bold hover:opacity-80'
                        style={{ color: pColor }}
                      >
                        <ExternalLink size={10} /> View Event
                      </Link>
                      </div>
                    </td>
                  </tr>)
                })}
              </tbody>
            </table>
          </div>
        )}
      </DashboardCard>

      <DashboardCard hover={false}>
        <div className='flex items-center justify-between mb-4 flex-wrap gap-2'>
          <h2 className='text-xs font-bold text-brand-text-primary'>Payment History</h2>
          <div className='flex items-center gap-2'>
            <button onClick={handleExportPayments} disabled={!payments.length} className='flex items-center gap-1 text-[9px] font-bold cursor-pointer disabled:cursor-not-allowed disabled:opacity-40' style={{ color: pColor }}><Download size={10} /> Export CSV</button>
            <button onClick={() => paymentsResource.reload()} className='text-[9px] font-bold' style={{ color: pColor }}>Refresh</button>
          </div>
        </div>
        {paymentsResource.loading ? <SkeletonLoader rows={3} variant='card' />
          : paymentsResource.error ? <EmptyState icon={AlertCircle} title='Failed to load payments' description={paymentsResource.error} action={{ label: 'Retry', onClick: paymentsResource.reload }} />
          : payments.length === 0 ? <EmptyState icon={Vote} title='No event payments' description='Payment records for your events will appear here.' />
          : (<div className='overflow-x-auto'>
            <table className='w-full text-left'>
              <thead>
                <tr className='border-b border-brand-divider'>
                  <th className='pb-2 pr-3 text-[9px] font-bold uppercase tracking-wide text-brand-text-muted'>Event</th>
                  <th className='pb-2 pr-3 text-[9px] font-bold uppercase tracking-wide text-brand-text-muted'>Reference</th>
                  <th className='pb-2 pr-3 text-[9px] font-bold uppercase tracking-wide text-brand-text-muted text-right'>Amount</th>
                  <th className='pb-2 pr-3 text-[9px] font-bold uppercase tracking-wide text-brand-text-muted text-right'>Status</th>
                  <th className='pb-2 pr-3 text-[9px] font-bold uppercase tracking-wide text-brand-text-muted text-right'>Receipt</th>
                  <th className='pb-2 text-[9px] font-bold uppercase tracking-wide text-brand-text-muted text-right'>Date</th>
                </tr>
              </thead>
              <tbody>
                {payments.map(p => {
                  const st = STATUS_STYLE[p.status] ?? STATUS_STYLE.cancelled
                  return (<tr key={p.uuid} className='border-b border-brand-divider last:border-0'>
                    <td className='py-2.5 pr-3'>
                      <p className='text-xs font-semibold text-brand-text-primary truncate max-w-[240px]'>{p.election?.title ?? '\u2014'}</p>
                      {p.provider && <p className='text-[9px] font-mono text-brand-text-muted'>{p.provider}</p>}
                    </td>
                    <td className='py-2.5 pr-3 text-[10px] font-mono text-brand-text-muted whitespace-nowrap'>{p.reference}</td>
                    <td className='py-2.5 pr-3 text-xs font-bold text-brand-text-primary text-right whitespace-nowrap'>{formatMoney(p.amount, p.currency)}</td>
                    <td className='py-2.5 pr-3 text-right'>
                      <span className={`inline-flex items-center gap-1 text-[9px] font-bold capitalize ${st.className}`}>
                        {p.status === 'verified' ? <CheckCircle2 size={10} /> : p.status === 'pending' ? <Clock size={10} /> : <AlertCircle size={10} />}{st.label}
                      </span>
                    </td>
                    <td className='py-2.5 pr-3 text-right'>
                      <button type='button' onClick={() => setSelectedReceipt({ kind: 'payment', title: p.election?.title ?? 'Event payment', reference: p.reference, status: p.status, amount: p.amount, currency: p.currency, date: p.created_at, provider: p.provider })} className='inline-flex items-center gap-1 text-[9px] font-bold hover:opacity-80' style={{ color: pColor }}><Receipt size={10} /> View Receipt</button>
                    </td>
                    <td className='py-2.5 text-right text-[10px] font-mono text-brand-text-muted whitespace-nowrap'>{new Date(p.created_at).toLocaleDateString()}</td>
                  </tr>)
                })}
              </tbody>
            </table>
          </div>)
        }
      </DashboardCard>
      <ReceiptModal receipt={selectedReceipt} onClose={() => setSelectedReceipt(null)} />
    </div>
  </>)
}
