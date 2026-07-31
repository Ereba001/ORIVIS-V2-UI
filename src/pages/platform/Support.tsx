import { useState, useMemo, useEffect } from "react"
import { motion, AnimatePresence } from "motion/react"
import {
  Search, Plus, X, Send, MessageSquare, FileText,
  BookOpen, ChevronDown, User, Clock, AlertCircle,
  AlertTriangle, RefreshCw,
} from "lucide-react"
import SeoHead from "../../components/SeoHead"
import Breadcrumbs from "../../components/platform/Breadcrumbs"
import PageHeader from "../../components/platform/PageHeader"
import StatsGrid from "../../components/platform/StatsGrid"
import TabNav from "../../components/platform/TabNav"
import StatusPill from "../../components/platform/StatusPill"
import FilterDropdown from "../../components/platform/FilterDropdown"
import EmptyState from "../../components/platform/EmptyState"
import { platformService } from "../../services/platform-service"
import type { SupportTicket, TicketStatus, TicketPriority, TicketCategory, TicketMessage } from "../../types/platform"

const STATUS_VARIANT: Record<TicketStatus, "success" | "warning" | "danger" | "info" | "neutral"> = {
  OPEN: "warning",
  ASSIGNED: "info",
  WAITING: "neutral",
  RESOLVED: "success",
  CLOSED: "neutral",
}

const PRIORITY_COLORS: Record<TicketPriority, string> = {
  LOW: "bg-gray-400/10 text-gray-400 border-gray-400/20",
  MEDIUM: "bg-blue-400/10 text-blue-400 border-blue-400/20",
  HIGH: "bg-status-warning/10 text-status-warning border-status-warning/20",
  URGENT: "bg-status-error/10 text-status-error border-status-error/20",
}

const CATEGORY_COLORS: Record<TicketCategory, string> = {
  TECHNICAL: "bg-cyan-400/10 text-cyan-400 border-cyan-400/20",
  BILLING: "bg-amber-400/10 text-amber-400 border-amber-400/20",
  ACCOUNT: "bg-purple-400/10 text-purple-400 border-purple-400/20",
  FEATURE_REQUEST: "bg-blue-400/10 text-blue-400 border-blue-400/20",
  BUG_REPORT: "bg-red-400/10 text-red-400 border-red-400/20",
  OTHER: "bg-brand-surface-interactive text-brand-text-muted border-brand-border",
}

const PRIORITY_OPTIONS = [
  { value: "all", label: "All Priorities" },
  { value: "LOW", label: "Low" },
  { value: "MEDIUM", label: "Medium" },
  { value: "HIGH", label: "High" },
  { value: "URGENT", label: "Urgent" },
]

const CATEGORY_OPTIONS = [
  { value: "all", label: "All Categories" },
  { value: "TECHNICAL", label: "Technical" },
  { value: "BILLING", label: "Billing" },
  { value: "ACCOUNT", label: "Account" },
  { value: "FEATURE_REQUEST", label: "Feature Request" },
  { value: "BUG_REPORT", label: "Bug Report" },
  { value: "OTHER", label: "Other" },
]

function timeAgo(dateStr: string): string {
  const now = new Date()
  const d = new Date(dateStr)
  const diffMs = now.getTime() - d.getTime()
  const mins = Math.floor(diffMs / 60000)
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  const months = Math.floor(days / 30)
  return `${months}mo ago`
}

const KB_ARTICLES = [
  {
    id: "kb-1",
    title: "How to Create and Manage Elections",
    category: "Getting Started",
    summary: "Step-by-step guide to setting up your first election on the platform.",
    content:
      "Navigate to the Elections section from your dashboard. Click 'Create Election' and fill in the required details including title, description, voter eligibility criteria, and voting period. You can configure ballot options, set visibility rules, and assign election administrators. Once created, review the settings and publish when ready.",
  },
  {
    id: "kb-2",
    title: "Bulk Voter Import Guide",
    category: "Voter Management",
    summary: "Upload thousands of voters efficiently using CSV files.",
    content:
      "Prepare a CSV file with columns: email, full_name, voter_id, and optional department/class. Navigate to Voters > Import and upload your file. The system supports up to 5,000 records per batch. For larger uploads, split into multiple files and upload sequentially. Verify the preview before confirming the import.",
  },
  {
    id: "kb-3",
    title: "Understanding Subscription Tiers",
    category: "Billing",
    summary: "Compare Starter, Professional, Enterprise, and Custom plans.",
    content:
      "Starter: up to 500 voters, basic features. Professional: up to 5,000 voters, advanced analytics. Enterprise: up to 50,000 voters, white-label support, dedicated account manager. Custom: tailored for large-scale deployments with custom pricing and SLAs. Upgrade anytime from your organization settings.",
  },
  {
    id: "kb-4",
    title: "Troubleshooting Login Issues",
    category: "Account",
    summary: "Common login problems and how to resolve them.",
    content:
      "If you're locked out after multiple attempts, wait 15 minutes before retrying. Check that your email domain is verified. For 2FA issues, use recovery codes provided during setup. Contact support if you need to reset your account or have been locked out for more than 30 minutes.",
  },
  {
    id: "kb-5",
    title: "Platform Security Best Practices",
    category: "Security",
    summary: "Recommended security settings for organization admins.",
    content:
      "Enable two-factor authentication for all admin accounts. Use strong, unique passwords and rotate them every 90 days. Set up IP allowlisting for your organization's network. Regularly review access logs and audit trails. Configure session timeouts and limit concurrent sessions per user.",
  },
]

export default function PlatformSupportCentre() {
  const [search, setSearch] = useState("")
  const [tab, setTab] = useState("all")
  const [priorityFilter, setPriorityFilter] = useState("all")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null)
  const [showNewTicketModal, setShowNewTicketModal] = useState(false)
  const [activeSection, setActiveSection] = useState<"tickets" | "knowledge">("tickets")
  const [replyText, setReplyText] = useState("")
  const [expandedArticle, setExpandedArticle] = useState<string | null>(null)
  const [ticketReplies, setTicketReplies] = useState<Record<string, string[]>>({})

  const [newTicketForm, setNewTicketForm] = useState({
    subject: "",
    description: "",
    category: "TECHNICAL" as TicketCategory,
    priority: "MEDIUM" as TicketPriority,
  })

  const [tickets, setTickets] = useState<SupportTicket[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = () => {
    setLoading(true)
    setError(null)
    platformService.getSupportTickets({ perPage: 100 })
      .then((result) => {
        setTickets(result.items)
        setLoading(false)
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Failed to load tickets.')
        setLoading(false)
      })
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const counts = useMemo(() => {
    const r = tickets
    return {
      all: r.length,
      open: r.filter((t) => t.status === "OPEN").length,
      assigned: r.filter((t) => t.status === "ASSIGNED").length,
      waiting: r.filter((t) => t.status === "WAITING").length,
      resolved: r.filter((t) => t.status === "RESOLVED").length,
      closed: r.filter((t) => t.status === "CLOSED").length,
    }
  }, [tickets])

  const filtered = useMemo(() => {
    let list = tickets
    if (tab !== "all") {
      list = list.filter((t) => t.status.toLowerCase() === tab)
    }
    if (priorityFilter !== "all") {
      list = list.filter((t) => t.priority === priorityFilter)
    }
    if (categoryFilter !== "all") {
      list = list.filter((t) => t.category === categoryFilter)
    }
    if (search) {
      const q = search.toLowerCase()
      list = list.filter(
        (t) =>
          t.subject.toLowerCase().includes(q) ||
          t.organizationName.toLowerCase().includes(q) ||
          t.assignedToName?.toLowerCase().includes(q) ||
          t.createdBy.toLowerCase().includes(q)
      )
    }
    return list
  }, [tab, priorityFilter, categoryFilter, search, tickets])

  const statsItems = useMemo(
    () => [
      { label: "Open Tickets", value: String(counts.open), icon: AlertCircle, color: "text-status-warning" },
      { label: "Assigned", value: String(counts.assigned), icon: User, color: "text-blue-400" },
      { label: "Waiting", value: String(counts.waiting), icon: Clock, color: "text-brand-text-muted" },
      { label: "Resolved / Closed", value: String(counts.resolved + counts.closed), icon: MessageSquare, color: "text-status-success" },
    ],
    [counts]
  )

  const tabs = [
    { id: "all", label: "All", count: counts.all },
    { id: "open", label: "Open", count: counts.open },
    { id: "assigned", label: "Assigned", count: counts.assigned },
    { id: "waiting", label: "Waiting", count: counts.waiting },
    { id: "resolved", label: "Resolved", count: counts.resolved },
    { id: "closed", label: "Closed", count: counts.closed },
  ]

  return (
    <>
    <SeoHead meta={{ title: "Support — Platform | ORIVIS", noindex: true }} />
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: "Support" }]} />

      <PageHeader
        title="Support Centre"
        description="Manage support tickets and internal documentation."
        search={{ value: search, onChange: setSearch, placeholder: "Search tickets..." }}
        actions={
          <button
            onClick={() => setShowNewTicketModal(true)}
            className="flex items-center gap-2 bg-brand-gold hover:bg-brand-gold-hover text-brand-bg-secondary px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
          >
            <Plus size={14} />
            <span>New Ticket</span>
          </button>
        }
      />

      <StatsGrid items={statsItems} />

      <div className="flex items-center gap-1.5 p-1 bg-brand-surface-elevated rounded-2xl w-fit">
        <button
          onClick={() => setActiveSection("tickets")}
          className={`relative px-4 py-2 text-[11px] font-bold uppercase tracking-wider rounded-xl transition-colors cursor-pointer ${
            activeSection === "tickets" ? "text-black" : "text-brand-text-muted hover:text-brand-text-primary"
          }`}
        >
          {activeSection === "tickets" && (
            <motion.span
              layoutId="support-section-bg"
              className="absolute inset-0 bg-brand-gold rounded-xl"
              transition={{ type: "spring", stiffness: 380, damping: 30 }}
            />
          )}
          <span className="relative z-10 flex items-center gap-2">
            <MessageSquare size={12} />
            Tickets
          </span>
        </button>
        <button
          onClick={() => setActiveSection("knowledge")}
          className={`relative px-4 py-2 text-[11px] font-bold uppercase tracking-wider rounded-xl transition-colors cursor-pointer ${
            activeSection === "knowledge" ? "text-black" : "text-brand-text-muted hover:text-brand-text-primary"
          }`}
        >
          {activeSection === "knowledge" && (
            <motion.span
              layoutId="support-section-bg"
              className="absolute inset-0 bg-brand-gold rounded-xl"
              transition={{ type: "spring", stiffness: 380, damping: 30 }}
            />
          )}
          <span className="relative z-10 flex items-center gap-2">
            <BookOpen size={12} />
            Knowledge Base
          </span>
        </button>
      </div>

      {activeSection === "tickets" ? (
        <>
          <div className="flex items-center gap-3 flex-wrap">
            <TabNav tabs={tabs} activeTab={tab} onChange={setTab} />
            <div className="flex items-center gap-3 ml-auto">
              <FilterDropdown
                label="Priority"
                options={PRIORITY_OPTIONS}
                value={priorityFilter}
                onChange={setPriorityFilter}
              />
              <FilterDropdown
                label="Category"
                options={CATEGORY_OPTIONS}
                value={categoryFilter}
                onChange={setCategoryFilter}
              />
            </div>
          </div>

          {loading ? (
            <div className="bg-brand-surface border border-brand-border rounded-2xl overflow-hidden">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-14 border-b border-brand-border last:border-0 flex items-center gap-4 px-4">
                  <div className="w-8 h-8 rounded-lg bg-brand-surface-elevated animate-pulse" />
                  <div className="flex-1 h-3 bg-brand-surface-elevated animate-pulse rounded" />
                  <div className="w-24 h-3 bg-brand-surface-elevated animate-pulse rounded" />
                  <div className="w-16 h-3 bg-brand-surface-elevated animate-pulse rounded" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="bg-brand-surface border border-brand-border rounded-2xl p-10 flex flex-col items-center justify-center text-center">
              <AlertTriangle size={32} className="text-status-error mb-3" />
              <p className="text-brand-text-primary font-semibold">Failed to load tickets</p>
              <p className="text-sm text-brand-text-muted mt-1">{error}</p>
              <button onClick={load} className="mt-4 flex items-center gap-2 text-sm font-semibold text-brand-gold hover:underline">
                <RefreshCw size={14} /> Retry
              </button>
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={MessageSquare}
              title="No tickets found"
              description={search ? "Try adjusting your search." : "No tickets match the current filters."}
            />
          ) : (
            <div className="bg-brand-surface border border-brand-border rounded-2xl overflow-hidden">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-brand-border">
                    {["Subject", "Organization", "Priority", "Category", "Status", "Assigned To", "Created"].map((h) => (
                      <th key={h} className="px-4 py-3 text-[9px] font-mono uppercase tracking-widest text-brand-text-muted font-bold">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((ticket, i) => (
                    <motion.tr
                      key={ticket.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03, duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                      className="border-b border-brand-border last:border-0 hover:bg-brand-surface-interactive/50 transition-colors cursor-pointer group"
                      onClick={() => setSelectedTicket(ticket)}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-brand-surface-elevated flex items-center justify-center text-brand-text-muted">
                            <MessageSquare size={14} />
                          </div>
                          <span className="text-xs font-semibold text-brand-text-primary max-w-[240px] truncate">
                            {ticket.subject}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-brand-text-muted">{ticket.organizationName}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full border ${PRIORITY_COLORS[ticket.priority]}`}
                        >
                          {ticket.priority}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full border ${CATEGORY_COLORS[ticket.category]}`}
                        >
                          {ticket.category.replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <StatusPill status={ticket.status} variant={STATUS_VARIANT[ticket.status]} />
                      </td>
                      <td className="px-4 py-3 text-xs text-brand-text-muted">{ticket.assignedToName || "Unassigned"}</td>
                      <td className="px-4 py-3 text-[10px] font-mono text-brand-text-muted">{timeAgo(ticket.createdAt)}</td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      ) : (
        <div className="space-y-4">
          <div className="relative max-w-md">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-text-muted pointer-events-none" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search articles..."
              className="w-full bg-brand-bg-secondary/50 border border-brand-border rounded-xl pl-9 pr-4 py-2.5 text-xs text-brand-text-primary placeholder-brand-text-disabled focus:outline-none focus:border-brand-gold transition-all"
            />
          </div>

          <div className="grid gap-3">
            {KB_ARTICLES.filter(
              (a) => !search || a.title.toLowerCase().includes(search.toLowerCase()) || a.category.toLowerCase().includes(search.toLowerCase())
            ).map((article) => (
              <div
                key={article.id}
                className="glass-card rounded-2xl overflow-hidden transition-all duration-200"
              >
                <button
                  onClick={() => setExpandedArticle(expandedArticle === article.id ? null : article.id)}
                  className="w-full flex items-start justify-between p-4 text-left cursor-pointer hover:bg-brand-surface-interactive/30 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <FileText size={14} className="text-brand-gold shrink-0" />
                      <h3 className="text-xs font-bold text-brand-text-primary">{article.title}</h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full bg-brand-surface-elevated text-brand-text-muted border border-brand-border">
                        {article.category}
                      </span>
                      <p className="text-[10px] text-brand-text-muted line-clamp-1">{article.summary}</p>
                    </div>
                  </div>
                  <ChevronDown
                    size={14}
                    className={`mt-1 text-brand-text-muted transition-transform duration-200 shrink-0 ${
                      expandedArticle === article.id ? "rotate-180" : ""
                    }`}
                  />
                </button>
                <AnimatePresence>
                  {expandedArticle === article.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4 pt-0 border-t border-brand-border">
                        <p className="text-[11px] text-brand-text-secondary leading-relaxed mt-3">{article.content}</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Ticket Detail Drawer */}
      <AnimatePresence>
        {selectedTicket && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm"
            onClick={() => setSelectedTicket(null)}
          >
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 350, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
              className="absolute right-0 top-0 h-full w-full max-w-lg bg-brand-bg border-l border-brand-border overflow-y-auto"
            >
              <div className="p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => setSelectedTicket(null)}
                    className="p-2 rounded-xl hover:bg-brand-surface-interactive text-brand-text-muted hover:text-brand-text-primary transition-colors cursor-pointer"
                  >
                    <X size={18} />
                  </button>
                  <span className="text-[10px] font-mono text-brand-text-muted">ID: {selectedTicket.id}</span>
                </div>

                <div>
                  <h2 className="text-lg font-bold text-brand-text-primary mb-2">{selectedTicket.subject}</h2>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`inline-block text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full border ${PRIORITY_COLORS[selectedTicket.priority]}`}
                    >
                      {selectedTicket.priority}
                    </span>
                    <StatusPill status={selectedTicket.status} variant={STATUS_VARIANT[selectedTicket.status]} />
                    <span
                      className={`inline-block text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full border ${CATEGORY_COLORS[selectedTicket.category]}`}
                    >
                      {selectedTicket.category.replace("_", " ")}
                    </span>
                  </div>
                </div>

                <div className="glass-card rounded-2xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-[10px] font-mono uppercase tracking-widest text-brand-text-muted font-bold">
                      Ticket Info
                    </h3>
                    <div className="flex items-center gap-2">
                      <select
                        value={selectedTicket.assignedTo || ""}
                        onChange={(e) => {
                          if (selectedTicket) setSelectedTicket({ ...selectedTicket, assignedTo: e.target.value })
                        }}
                        className="appearance-none bg-brand-surface-elevated border border-brand-border rounded-lg pl-2 pr-6 py-1 text-[10px] font-mono text-brand-text-primary focus:outline-none focus:border-brand-gold cursor-pointer"
                      >
                        <option value="">Unassigned</option>
                        <option value="staff-004">Chioma Eze</option>
                        <option value="staff-005">Femi Adeyemi</option>
                        <option value="staff-006">Adaobi Nwachukwu</option>
                        <option value="staff-008">Yetunde Ojo</option>
                        <option value="staff-009">Musa Bello</option>
                      </select>
                      <ChevronDown size={10} className="text-brand-text-muted -ml-5 pointer-events-none" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <p className="text-[9px] font-mono uppercase tracking-wider text-brand-text-muted">Organization</p>
                      <p className="font-semibold text-brand-text-primary">{selectedTicket.organizationName}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-mono uppercase tracking-wider text-brand-text-muted">Created By</p>
                      <p className="font-semibold text-brand-text-primary">{selectedTicket.createdBy}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-mono uppercase tracking-wider text-brand-text-muted">Created</p>
                      <p className="font-semibold text-brand-text-primary">{timeAgo(selectedTicket.createdAt)}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-mono uppercase tracking-wider text-brand-text-muted">Updated</p>
                      <p className="font-semibold text-brand-text-primary">{timeAgo(selectedTicket.updatedAt)}</p>
                    </div>
                  </div>
                </div>

                {selectedTicket.description && (
                  <div className="glass-card rounded-2xl p-4">
                    <h3 className="text-[10px] font-mono uppercase tracking-widest text-brand-text-muted font-bold mb-2">
                      Description
                    </h3>
                    <p className="text-xs text-brand-text-secondary leading-relaxed">{selectedTicket.description}</p>
                  </div>
                )}

                <div className="glass-card rounded-2xl p-4">
                  <h3 className="text-[10px] font-mono uppercase tracking-widest text-brand-text-muted font-bold mb-4">
                    Messages ({selectedTicket.messages.length})
                  </h3>
                  <div className="space-y-3">
                    {selectedTicket.messages.length === 0 ? (
                      <p className="text-xs text-brand-text-muted text-center py-4">No messages yet.</p>
                    ) : (
                      selectedTicket.messages.map((msg) => {
                        const isStaff = msg.authorRole === "STAFF"
                        return (
                          <div key={msg.id} className={`flex ${isStaff ? "justify-end" : "justify-start"}`}>
                            <div
                              className={`max-w-[80%] rounded-2xl p-3 ${
                                isStaff
                                  ? "bg-brand-gold/10 border border-brand-gold/20 rounded-tr-md"
                                  : "bg-brand-surface-elevated border border-brand-border rounded-tl-md"
                              }`}
                            >
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-[10px] font-bold text-brand-text-primary">{msg.author}</span>
                                <span
                                  className={`text-[8px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded-full ${
                                    isStaff
                                      ? "bg-brand-gold/20 text-brand-gold"
                                      : "bg-brand-surface-interactive text-brand-text-muted"
                                  }`}
                                >
                                  {isStaff ? "Staff" : "Org"}
                                </span>
                              </div>
                              <p className="text-xs text-brand-text-secondary leading-relaxed">{msg.content}</p>
                              <p className="text-[9px] font-mono text-brand-text-muted mt-1">{timeAgo(msg.createdAt)}</p>
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>
                </div>

                <div className="glass-card rounded-2xl p-4">
                  <h3 className="text-[10px] font-mono uppercase tracking-widest text-brand-text-muted font-bold mb-3">
                    Change Status
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {(["OPEN", "ASSIGNED", "WAITING", "RESOLVED", "CLOSED"] as TicketStatus[]).map((status) => (
                      <button
                        key={status}
                        onClick={() => {
                          if (selectedTicket) setSelectedTicket({ ...selectedTicket, status })
                        }}
                        className={`px-3 py-1.5 rounded-xl text-[10px] font-mono font-bold uppercase tracking-wider transition-all cursor-pointer ${
                          selectedTicket.status === status
                            ? "bg-brand-gold text-black"
                            : "bg-brand-surface-elevated text-brand-text-muted hover:bg-brand-surface-interactive border border-brand-border"
                        }`}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="glass-card rounded-2xl p-4">
                  <div className="flex items-center gap-2">
                    <input
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Type your reply..."
                      className="flex-1 bg-brand-bg-secondary/50 border border-brand-border rounded-xl px-3 py-2.5 text-xs text-brand-text-primary placeholder-brand-text-disabled focus:outline-none focus:border-brand-gold transition-all"
                    />
                    <button
                      onClick={() => {
                        setTicketReplies((prev) => ({
                          ...prev,
                          [selectedTicket.id]: [...(prev[selectedTicket.id] || []), replyText],
                        }))
                        setReplyText("")
                      }}
                      disabled={!replyText.trim()}
                      className="p-2.5 rounded-xl bg-brand-gold text-black hover:bg-brand-gold-hover disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                    >
                      <Send size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* New Ticket Modal */}
      <AnimatePresence>
        {showNewTicketModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowNewTicketModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 8 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 8 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="glass-strong rounded-2xl p-6 w-full max-w-md"
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-sm font-bold text-brand-text-primary">New Support Ticket</h3>
                <button
                  onClick={() => setShowNewTicketModal(false)}
                  className="p-1.5 rounded-lg hover:bg-brand-surface-interactive text-brand-text-muted hover:text-brand-text-primary transition-colors cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-mono uppercase tracking-wider text-brand-text-muted font-bold block mb-1.5">
                    Subject
                  </label>
                  <input
                    value={newTicketForm.subject}
                    onChange={(e) => setNewTicketForm({ ...newTicketForm, subject: e.target.value })}
                    placeholder="Brief title of the issue..."
                    className="w-full bg-brand-bg-secondary/50 border border-brand-border rounded-xl px-3 py-2.5 text-xs text-brand-text-primary placeholder-brand-text-disabled focus:outline-none focus:border-brand-gold transition-all"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-mono uppercase tracking-wider text-brand-text-muted font-bold block mb-1.5">
                    Description
                  </label>
                  <textarea
                    value={newTicketForm.description}
                    onChange={(e) => setNewTicketForm({ ...newTicketForm, description: e.target.value })}
                    placeholder="Detailed description of the issue..."
                    rows={4}
                    className="w-full bg-brand-bg-secondary/50 border border-brand-border rounded-xl px-3 py-2.5 text-xs text-brand-text-primary placeholder-brand-text-disabled focus:outline-none focus:border-brand-gold transition-all resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-mono uppercase tracking-wider text-brand-text-muted font-bold block mb-1.5">
                      Category
                    </label>
                    <select
                      value={newTicketForm.category}
                      onChange={(e) => setNewTicketForm({ ...newTicketForm, category: e.target.value as TicketCategory })}
                      className="w-full bg-brand-bg-secondary/50 border border-brand-border rounded-xl px-3 py-2.5 text-xs text-brand-text-primary focus:outline-none focus:border-brand-gold transition-all cursor-pointer appearance-none"
                    >
                      <option value="TECHNICAL">Technical</option>
                      <option value="BILLING">Billing</option>
                      <option value="ACCOUNT">Account</option>
                      <option value="FEATURE_REQUEST">Feature Request</option>
                      <option value="BUG_REPORT">Bug Report</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-mono uppercase tracking-wider text-brand-text-muted font-bold block mb-1.5">
                      Priority
                    </label>
                    <select
                      value={newTicketForm.priority}
                      onChange={(e) => setNewTicketForm({ ...newTicketForm, priority: e.target.value as TicketPriority })}
                      className="w-full bg-brand-bg-secondary/50 border border-brand-border rounded-xl px-3 py-2.5 text-xs text-brand-text-primary focus:outline-none focus:border-brand-gold transition-all cursor-pointer appearance-none"
                    >
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                      <option value="URGENT">Urgent</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 justify-end mt-6">
                <button
                  onClick={() => setShowNewTicketModal(false)}
                  className="px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-brand-text-muted hover:text-brand-text-primary bg-brand-surface-interactive rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setShowNewTicketModal(false)
                    setNewTicketForm({ subject: "", description: "", category: "TECHNICAL", priority: "MEDIUM" })
                  }}
                  disabled={!newTicketForm.subject.trim() || !newTicketForm.description.trim()}
                  className="px-4 py-2 text-[11px] font-bold uppercase tracking-wider rounded-xl bg-brand-gold text-black hover:bg-brand-gold-hover disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                >
                  Submit Ticket
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
    </>
  )
}