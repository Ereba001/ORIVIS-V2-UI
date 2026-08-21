import { Download, Printer, CheckCircle } from "lucide-react"
import type { VoteReceipt, ReceiptSelection } from "../types/voting-pass"

interface ReceiptDisplayProps {
  receipt: VoteReceipt
  electionTitle?: string
  organization?: string
  selections?: ReceiptSelection[]
  readOnly?: boolean
}

export default function ReceiptDisplay({ receipt, electionTitle, organization, selections = [], readOnly = false }: ReceiptDisplayProps) {
  function handlePrint() {
    window.print()
  }

  function handleDownload() {
    const lines = [
      `ORIVIS Vote Receipt`,
      `====================`,
      ``,
      `Receipt ID:    ${receipt.uuid}`,
      `Receipt Code:  ${receipt.receiptCode}`,
      `Status:        ${receipt.status}`,
      `Generated:     ${receipt.generatedAt ? new Date(receipt.generatedAt).toLocaleString() : "—"}`,
      `Election:      ${electionTitle ?? "—"}`,
      `Organization:  ${organization ?? "—"}`,
      ``,
    ]

    if (selections.length > 0) {
      lines.push(`Your Selections`)
      lines.push(`---------------`)
      for (const s of selections) {
        lines.push(`  ${s.positionTitle ?? `Position ${s.positionId}`}: ${s.candidateName ?? "Abstained"}`)
      }
      lines.push(``)
    }

    if (receipt.verificationUrl) {
      lines.push(`Verify:        ${receipt.verificationUrl}`)
      lines.push(``)
    }

    lines.push(`This receipt verifies your vote was recorded and shows your selections.`)

    const blob = new Blob([lines.join("\n")], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `receipt-${receipt.receiptCode}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="bg-brand-surface border border-brand-border rounded-2xl overflow-hidden">
      <div className="px-6 py-5 border-b border-brand-border flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-status-success/20 flex items-center justify-center">
          <CheckCircle size={20} className="text-status-success" />
        </div>
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-brand-text-primary">Vote Cast Successfully</h3>
          <p className="text-[10px] text-brand-text-muted">Your vote has been recorded on the ledger</p>
        </div>
      </div>

      <div className="p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Detail label="Receipt ID" value={receipt.uuid} mono />
          <Detail label="Status" value={receipt.status} />
          <Detail label="Receipt Code" value={receipt.receiptCode} mono />
          <Detail label="Generated" value={receipt.generatedAt ? new Date(receipt.generatedAt).toLocaleString() : "—"} />
        </div>

        {electionTitle && <Detail label="Election" value={electionTitle} />}
        {organization && <Detail label="Organization" value={organization} />}

        {selections.length > 0 && (
          <div className="pt-2">
            <span className="block text-[10px] font-mono uppercase tracking-wider text-brand-text-muted font-bold mb-3">
              Your Selections
            </span>
            <div className="border border-brand-border rounded-xl overflow-hidden">
              {selections.map((s, i) => (
                <div
                  key={`${s.positionId}-${s.candidateId}-${i}`}
                  className={`flex items-start justify-between gap-4 px-4 py-3 ${
                    i > 0 ? "border-t border-brand-border" : ""
                  }`}
                >
                  <div>
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-brand-text-muted">
                      {s.positionTitle ?? `Position ${s.positionId}`}
                    </span>
                    <span className="block text-sm font-semibold text-brand-text-primary mt-0.5">
                      {s.candidateName ?? "Abstained"}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-status-success shrink-0">
                    Selected
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {receipt.verificationUrl && (
          <div className="pt-2">
            <span className="block text-[10px] font-mono uppercase tracking-wider text-brand-text-muted font-bold mb-2">
              Verify on the Ledger
            </span>
            <a
              href={receipt.verificationUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-semibold text-brand-gold hover:underline break-all"
            >
              {receipt.verificationUrl}
            </a>
          </div>
        )}
      </div>

      {!readOnly && (
        <div className="px-6 py-4 border-t border-brand-border flex items-center justify-end gap-3">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-surface border border-brand-border text-brand-text-muted hover:text-brand-text-primary hover:border-brand-gold/30 text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer"
          >
            <Printer size={13} />
            <span>Print</span>
          </button>
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-gold hover:bg-brand-gold-hover text-brand-bg-secondary text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer"
          >
            <Download size={13} />
            <span>Download Receipt</span>
          </button>
        </div>
      )}
    </div>
  )
}

function Detail({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <span className="block text-[9px] font-mono uppercase tracking-widest text-brand-text-muted font-bold mb-0.5">
        {label}
      </span>
      <span className={`text-xs font-semibold text-brand-text-primary break-all ${mono ? "font-mono" : ""}`}>
        {value}
      </span>
    </div>
  )
}
