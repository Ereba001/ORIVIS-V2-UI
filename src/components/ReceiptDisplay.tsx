import { Download, Printer, CheckCircle } from "lucide-react"
import type { VoteReceipt } from "../types/voting-pass"

interface ReceiptDisplayProps {
  receipt: VoteReceipt
  electionTitle?: string
  organization?: string
}

export default function ReceiptDisplay({ receipt, electionTitle, organization }: ReceiptDisplayProps) {
  function handlePrint() {
    window.print()
  }

  function handleDownload() {
    const text = [
      `ORIVIS Vote Receipt`,
      `====================`,
      ``,
      `Receipt:       ${receipt.receiptHash}`,
      `Block #:       ${receipt.blockNumber}`,
      `Timestamp:     ${new Date(receipt.timestamp).toLocaleString()}`,
      `Election:      ${electionTitle ?? receipt.electionId}`,
      `Organization:  ${organization ?? "—"}`,
      `Voter:         ${receipt.voterName}`,
      ``,
      `Selections:`,
      ...receipt.selections.map((s) => `  • ${s.positionTitle}: ${s.candidateName}`),
      ``,
      `This receipt verifies your vote was recorded without revealing your choices.`,
    ].join("\n")

    const blob = new Blob([text], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `receipt-${receipt.passId}.txt`
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
          <Detail label="Receipt ID" value={receipt.receiptHash} mono />
          <Detail label="Block #" value={`#${receipt.blockNumber.toLocaleString()}`} />
          <Detail label="Timestamp" value={new Date(receipt.timestamp).toLocaleString()} />
          <Detail label="Pass ID" value={receipt.passId} />
        </div>

        {electionTitle && <Detail label="Election" value={electionTitle} />}
        {organization && <Detail label="Organization" value={organization} />}
        <Detail label="Voter" value={receipt.voterName} />

        <div className="pt-2">
          <span className="block text-[10px] font-mono uppercase tracking-wider text-brand-text-muted font-bold mb-2">
            Your Selections
          </span>
          <div className="bg-brand-bg-secondary/50 rounded-xl divide-y divide-brand-border">
            {receipt.selections.map((s, i) => (
              <div key={i} className="flex items-center justify-between px-4 py-2.5">
                <span className="text-xs text-brand-text-muted">{s.positionTitle}</span>
                <span className="text-xs font-semibold text-brand-text-primary">{s.candidateName}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

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
