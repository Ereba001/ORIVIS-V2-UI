import { useState, useMemo, useEffect, useCallback, useRef } from "react"
import { motion, AnimatePresence } from "motion/react"
import {
  Search, X, Send, MessageSquare, FileText,
  BookOpen, ChevronDown, User, Clock, AlertCircle,
  AlertTriangle, RefreshCw, CheckCircle, Paperclip, Image as ImageIcon,
} from "lucide-react"
import SeoHead from "../../components/SeoHead"
import Breadcrumbs from "../../components/platform/Breadcrumbs"
import PageHeader from "../../components/platform/PageHeader"
import StatsGrid from "../../components/platform/StatsGrid"
import TabNav from "../../components/platform/TabNav"
import StatusPill from "../../components/platform/StatusPill"
import FilterDropdown from "../../components/platform/FilterDropdown"
import EmptyState from "../../components/platform/EmptyState"
import NotificationBell from "../../components/support/NotificationBell"
import ChatMessage from "../../components/support/ChatMessage"
import type { ChatMessageData } from "../../components/support/ChatMessage"
import VoiceRecorder from "../../components/support/VoiceRecorder"
import { platformService } from "../../services/platform-service"
import type { SupportTicket, TicketStatus, TicketPriority, TicketCategory, PlatformStaff } from "../../types/platform"

const STATUS_VARIANT: Record<TicketStatus, "success" | "warning" | "danger" | "info" | "neutral"> = {
  OPEN: "warning",
  ASSIGNED: "info",
  ACCEPTED: "info",
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
  if (mins < 1) return 'now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  const months = Math.floor(days / 30)
  return `${months}mo ago`
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  if (d.toDateString() === today.toDateString()) return 'Today'
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday'
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: d.getFullYear() !== today.getFullYear() ? 'numeric' : undefined })
}

function groupMessagesByDate<T extends { createdAt: string }>(messages: T[]): { date: string; items: T[] }[] {
  const groups: { date: string; items: T[] }[] = []
  let current = ''
  for (const msg of messages) {
    const d = new Date(msg.createdAt).toDateString()
    if (d !== current) {
      current = d
      groups.push({ date: msg.createdAt, items: [msg] })
    } else {
      groups[groups.length - 1].items.push(msg)
    }
  }
  return groups
}

const KB_ARTICLES = [
  {
    id: "kb-1",
    title: "How to Create and Manage Events",
    category: "Getting Started",
    summary: "Step-by-step guide to setting up your first event on the platform.",
    content:
      "Navigate to the Events section from your dashboard. Click 'Create Event' and fill in the required details including title, description, participant eligibility criteria, and voting period. You can configure ballot options, set visibility rules, and assign event administrators. Once created, review the settings and publish when ready.",
  },
  {
    id: "kb-2",
    title: "Bulk Participant Import Guide",
    category: "Participant Management",
    summary: "Upload thousands of participants efficiently using CSV files.",
    content:
      "Prepare a CSV file with columns: email, full_name, participant_id, and optional department/class. Navigate to Participants > Import and upload your file. The system supports up to 5,000 records per batch. For larger uploads, split into multiple files and upload sequentially. Verify the preview before confirming the import.",
  },
  {
    id: "kb-3",
    title: "Understanding Subscription Tiers",
    category: "Billing",
    summary: "Compare Starter, Professional, Enterprise, and Custom plans.",
    content:
      "Starter: up to 500 voters, basic features. Professional: up to 5,000 voters, advanced analytics. Enterprise: up to 50,000 voters, white label support, dedicated account manager. Custom: tailored for large-scale deployments with custom pricing and SLAs. Upgrade anytime from your organization settings.",
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
      "Enable two factor authentication for all admin accounts. Use strong, unique passwords and rotate them every 90 days. Set up IP allowlisting for your organization's network. Regularly review access logs and audit trails. Configure session timeouts and limit concurrent sessions per user.",
  },
]

export default function PlatformSupportCentre() {
  const [search, setSearch] = useState("")
  const [tab, setTab] = useState("all")
  const [priorityFilter, setPriorityFilter] = useState("all")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null)
  const [activeSection, setActiveSection] = useState<"tickets" | "knowledge">("tickets")
  const [replyText, setReplyText] = useState("")
  const [expandedArticle, setExpandedArticle] = useState<string | null>(null)
  const [sendingReply, setSendingReply] = useState(false)
  const [mutationError, setMutationError] = useState<string | null>(null)
  const [staffList, setStaffList] = useState<PlatformStaff[]>([])
  const [pendingMedia, setPendingMedia] = useState<{ type: 'voice' | 'image' | 'file'; blob?: Blob; fileName?: string; fileSize?: number; fileType?: string; filePath?: string; duration?: number } | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)

  const [tickets, setTickets] = useState<SupportTicket[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = () => {
    setLoading(true)
    setError(null)
    platformService.getSupportTickets({ perPage: 100 })
      .then((result) => { setTickets(result.items); setLoading(false) })
      .catch((err: unknown) => { setError(err instanceof Error ? err.message : 'Failed to load tickets.'); setLoading(false) })
  }

  useEffect(() => {
    load()
    platformService.getStaff({ perPage: 100 }).then((r) => setStaffList(r.items)).catch((err) => console.error('Support.getStaff:', err))
  }, [])

  const reloadTicket = useCallback(async (uuid: string) => {
    const updated = await platformService.getSupportTicket(uuid)
    if (updated) {
      setSelectedTicket(updated)
      setTickets((prev) => prev.map((t) => t.id === uuid ? updated : t))
    }
  }, [])

  /**
   * Run a ticket mutation, revert the optimistic local change and surface the
   * error when the API call fails — a failed save must never leave the UI
   * showing a state the server did not persist.
   */
  const runTicketMutation = useCallback(async (ticketId: string, action: () => Promise<void>) => {
    setMutationError(null)
    try {
      await action()
      await reloadTicket(ticketId)
    } catch (err: unknown) {
      await reloadTicket(ticketId)
      setMutationError(err instanceof Error ? err.message : 'Failed to update ticket.')
    }
  }, [reloadTicket])

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    if (selectedTicket) setTimeout(scrollToBottom, 100)
  }, [selectedTicket?.messages.length, scrollToBottom])

  useEffect(() => {
    if (!selectedTicket) return
    const interval = setInterval(async () => {
      try {
        const updated = await platformService.getSupportTicket(selectedTicket.id)
        if (updated) {
          setSelectedTicket(updated)
          setTickets((prev) => prev.map((t) => t.id === selectedTicket.id ? updated : t))
        }
      } catch (err) { console.error('Support.poll:', err) }
    }, 10000)
    return () => clearInterval(interval)
  }, [selectedTicket?.id])

  const counts = useMemo(() => ({
    all: tickets.length,
    open: tickets.filter((t) => t.status === "OPEN").length,
    assigned: tickets.filter((t) => t.status === "ASSIGNED").length,
    accepted: tickets.filter((t) => t.status === "ACCEPTED").length,
    waiting: tickets.filter((t) => t.status === "WAITING").length,
    resolved: tickets.filter((t) => t.status === "RESOLVED").length,
    closed: tickets.filter((t) => t.status === "CLOSED").length,
  }), [tickets])

  const filtered = useMemo(() => {
    let list = tickets
    if (tab !== "all") list = list.filter((t) => t.status.toLowerCase() === tab)
    if (priorityFilter !== "all") list = list.filter((t) => t.priority === priorityFilter)
    if (categoryFilter !== "all") list = list.filter((t) => t.category === categoryFilter)
    if (search) {
      const q = search.toLowerCase()
      list = list.filter((t) =>
        t.subject.toLowerCase().includes(q) ||
        t.organizationName.toLowerCase().includes(q) ||
        t.assignedToName?.toLowerCase().includes(q) ||
        t.createdBy.toLowerCase().includes(q)
      )
    }
    return list
  }, [tab, priorityFilter, categoryFilter, search, tickets])

  const handleSend = async () => {
    const hasText = replyText.trim().length > 0
    const hasMedia = pendingMedia !== null
    if ((!hasText && !hasMedia) || !selectedTicket || sendingReply) return

    setSendingReply(true)
    const text = replyText.trim()
    setReplyText("")

    try {
      let media: { message_type?: string; file_path?: string; file_name?: string; file_size?: number; file_type?: string; voice_duration?: number } | undefined

      if (hasMedia && pendingMedia) {
        if (pendingMedia.filePath) {
          media = {
            message_type: pendingMedia.type,
            file_path: pendingMedia.filePath,
            file_name: pendingMedia.fileName,
            file_size: pendingMedia.fileSize,
            file_type: pendingMedia.fileType,
            voice_duration: pendingMedia.duration,
          }
        } else if (pendingMedia.blob) {
          const file = new File([pendingMedia.blob], pendingMedia.fileName || 'upload', { type: pendingMedia.blob.type })
          const uploaded = await platformService.uploadSupportMedia(file)
          media = {
            message_type: uploaded.message_type,
            file_path: uploaded.file_path,
            file_name: uploaded.file_name,
            file_size: uploaded.file_size,
            file_type: uploaded.file_type,
            voice_duration: pendingMedia.duration,
          }
        }
      }

      await platformService.replyToTicket(selectedTicket.id, text || (pendingMedia?.type === 'voice' ? '' : text), false, media)
      setPendingMedia(null)
      await reloadTicket(selectedTicket.id)
    } catch (err) {
      setMutationError(err instanceof Error ? err.message : 'Failed to send reply.')
    }
    finally { setSendingReply(false) }
  }

  const handleFileUpload = async (file: File, type: 'image' | 'file') => {
    try {
      const uploaded = await platformService.uploadSupportMedia(file)
      setPendingMedia({
        type,
        fileName: uploaded.file_name,
        fileSize: uploaded.file_size,
        fileType: uploaded.file_type,
        filePath: uploaded.file_path,
      })
    } catch { /* ignore */ }
  }

  const handleVoiceRecorded = async (blob: Blob, duration: number) => {
    setPendingMedia({
      type: 'voice',
      blob,
      fileName: `voice-${Date.now()}.webm`,
      fileSize: blob.size,
      fileType: blob.type,
      duration,
    })
  }

  const chatMessages: ChatMessageData[] = useMemo(() =>
    (selectedTicket?.messages ?? []).map((m) => ({
      id: m.id,
      author: m.author,
      authorRole: m.authorRole,
      content: m.content,
      messageType: m.messageType || 'text',
      fileUrl: m.fileUrl,
      fileName: m.fileName,
      fileSize: m.fileSize,
      fileType: m.fileType,
      voiceDuration: m.voiceDuration,
      createdAt: m.createdAt,
    })),
  [selectedTicket?.messages])

  const messageGroups = useMemo(() => groupMessagesByDate(chatMessages), [chatMessages])

  const statsItems = useMemo(() => [
    { label: "Open", value: String(counts.open), icon: AlertCircle, color: "text-status-warning" },
    { label: "Assigned", value: String(counts.assigned), icon: User, color: "text-blue-400" },
    { label: "Accepted", value: String(counts.accepted), icon: CheckCircle, color: "text-cyan-400" },
    { label: "Waiting", value: String(counts.waiting), icon: Clock, color: "text-brand-text-muted" },
    { label: "Resolved", value: String(counts.resolved + counts.closed), icon: MessageSquare, color: "text-status-success" },
  ], [counts])

  const tabs = [
    { id: "all", label: "All", count: counts.all },
    { id: "open", label: "Open", count: counts.open },
    { id: "assigned", label: "Assigned", count: counts.assigned },
    { id: "accepted", label: "Accepted", count: counts.accepted },
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
          <div className="flex items-center gap-2">
            <NotificationBell
              fetchNotifications={async () => {
                const notifService = (await import("../../services/platform-service")).platformService
                const { items } = await notifService.getNotifications({ perPage: 20 })
                return items.map((n) => ({ id: n.id, title: n.title, body: n.description, type: n.type, read: n.read, created_at: n.createdAt }))
              }}
              fetchUnreadCount={async () => {
                const notifService = (await import("../../services/platform-service")).platformService
                const { items } = await notifService.getNotifications({ perPage: 100 })
                return items.filter((n) => !n.read).length
              }}
            />
          </div>
        }
      />

      <StatsGrid items={statsItems} />

      <div className="flex items-center gap-1.5 p-1 bg-brand-surface-elevated rounded-2xl w-fit">
        {(["tickets", "knowledge"] as const).map((section) => (
          <button
            key={section}
            onClick={() => setActiveSection(section)}
            className={`relative px-4 py-2 text-[11px] font-bold uppercase tracking-wider rounded-xl transition-colors cursor-pointer ${
              activeSection === section ? "text-black" : "text-brand-text-muted hover:text-brand-text-primary"
            }`}
          >
            {activeSection === section && (
              <motion.span layoutId="support-section-bg" className="absolute inset-0 bg-brand-gold rounded-xl" transition={{ type: "spring", stiffness: 380, damping: 30 }} />
            )}
            <span className="relative z-10 flex items-center gap-2">
              {section === "tickets" ? <MessageSquare size={12} /> : <BookOpen size={12} />}
              {section === "tickets" ? "Tickets" : "Knowledge Base"}
            </span>
          </button>
        ))}
      </div>

      {activeSection === "tickets" ? (
        <>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <TabNav tabs={tabs} activeTab={tab} onChange={setTab} />
            <div className="flex items-center gap-3 sm:ml-auto">
              <FilterDropdown label="Priority" options={PRIORITY_OPTIONS} value={priorityFilter} onChange={setPriorityFilter} />
              <FilterDropdown label="Category" options={CATEGORY_OPTIONS} value={categoryFilter} onChange={setCategoryFilter} />
            </div>
          </div>

          {loading ? (
            <div className="bg-brand-surface border border-brand-border rounded-2xl overflow-hidden">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-14 border-b border-brand-border last:border-0 flex items-center gap-4 px-4">
                  <div className="w-8 h-8 rounded-lg bg-brand-surface-elevated animate-pulse" />
                  <div className="flex-1 h-3 bg-brand-surface-elevated animate-pulse rounded" />
                  <div className="w-24 h-3 bg-brand-surface-elevated animate-pulse rounded" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="bg-brand-surface border border-brand-border rounded-2xl p-10 flex flex-col items-center justify-center text-center">
              <AlertTriangle size={32} className="text-status-error mb-3" />
              <p className="text-brand-text-primary font-semibold">Failed to load tickets</p>
              <p className="text-sm text-brand-text-muted mt-1">{error}</p>
              <button onClick={load} className="mt-4 flex items-center gap-2 text-sm font-semibold text-brand-gold hover:underline"><RefreshCw size={14} /> Retry</button>
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState icon={MessageSquare} title="No tickets found" description={search ? "Try adjusting your search." : "No tickets match the current filters."} />
          ) : (
            <div className="bg-brand-surface border border-brand-border rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-brand-border">
                    {["Subject", "Organization", "Priority", "Category", "Status", "Assigned To", "Created"].map((h) => (
                      <th key={h} className="px-4 py-3 text-[9px] font-mono uppercase tracking-widest text-brand-text-muted font-bold">{h}</th>
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
                          <div className="w-8 h-8 rounded-lg bg-brand-surface-elevated flex items-center justify-center text-brand-text-muted"><MessageSquare size={14} /></div>
                          <span className="text-xs font-semibold text-brand-text-primary max-w-[240px] truncate">{ticket.subject}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-brand-text-muted">{ticket.organizationName}</td>
                      <td className="px-4 py-3"><span className={`inline-block text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full border ${PRIORITY_COLORS[ticket.priority]}`}>{ticket.priority}</span></td>
                      <td className="px-4 py-3"><span className={`inline-block text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full border ${CATEGORY_COLORS[ticket.category]}`}>{ticket.category.replace("_", " ")}</span></td>
                      <td className="px-4 py-3"><StatusPill status={ticket.status} variant={STATUS_VARIANT[ticket.status]} /></td>
                      <td className="px-4 py-3 text-xs text-brand-text-muted">{ticket.assignedToName || "Unassigned"}</td>
                      <td className="px-4 py-3 text-[10px] font-mono text-brand-text-muted">{timeAgo(ticket.createdAt)}</td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="space-y-4">
          <div className="relative max-w-md">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-text-muted pointer-events-none" />
            <input name="search" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search" placeholder="Search articles..."
              className="w-full bg-brand-bg-secondary/50 border border-brand-border rounded-xl pl-9 pr-4 py-2.5 text-xs text-brand-text-primary placeholder-brand-text-disabled focus:outline-none focus:border-brand-gold transition-all" />
          </div>
          <div className="grid gap-3">
            {KB_ARTICLES.filter((a) => !search || a.title.toLowerCase().includes(search.toLowerCase()) || a.category.toLowerCase().includes(search.toLowerCase())).map((article) => (
              <div key={article.id} className="glass-card rounded-2xl overflow-hidden transition-all duration-200">
                <button onClick={() => setExpandedArticle(expandedArticle === article.id ? null : article.id)}
                  className="w-full flex items-start justify-between p-4 text-left cursor-pointer hover:bg-brand-surface-interactive/30 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1"><FileText size={14} className="text-brand-gold shrink-0" /><h3 className="text-xs font-bold text-brand-text-primary">{article.title}</h3></div>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full bg-brand-surface-elevated text-brand-text-muted border border-brand-border">{article.category}</span>
                      <p className="text-[10px] text-brand-text-muted line-clamp-1">{article.summary}</p>
                    </div>
                  </div>
                  <ChevronDown size={14} className={`mt-1 text-brand-text-muted transition-transform duration-200 shrink-0 ${expandedArticle === article.id ? "rotate-180" : ""}`} />
                </button>
                <AnimatePresence>
                  {expandedArticle === article.id && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }} className="overflow-hidden">
                      <div className="px-4 pb-4 pt-0 border-t border-brand-border"><p className="text-[11px] text-brand-text-secondary leading-relaxed mt-3">{article.content}</p></div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* TICKET DETAIL — SIDE-BY-SIDE CHATBOX                          */}
      {/* ════════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {selectedTicket && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm" onClick={() => { setSelectedTicket(null); setPendingMedia(null) }}>
            <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", stiffness: 350, damping: 30 }}
              onClick={(e) => e.stopPropagation()} className="absolute right-0 top-0 h-full w-full max-w-2xl bg-brand-bg border-l border-brand-border flex flex-col">

              {/* ── Header ── */}
              <div className="shrink-0 border-b border-brand-border px-4 py-3 space-y-2">
                <div className="flex items-center justify-between">
                  <button onClick={() => { setSelectedTicket(null); setPendingMedia(null) }}
                    className="p-1.5 rounded-xl hover:bg-brand-surface-interactive text-brand-text-muted hover:text-brand-text-primary transition-colors cursor-pointer">
                    <X size={16} />
                  </button>
                  <span className="text-[9px] font-mono text-brand-text-muted">#{selectedTicket.id.slice(-8).toUpperCase()}</span>
                </div>
                <h2 className="text-sm font-bold text-brand-text-primary leading-tight">{selectedTicket.subject}</h2>
                {mutationError && (
                  <div role="alert" className="flex items-center gap-2 mt-2 px-3 py-2 rounded-xl bg-status-error/10 border border-status-error/20 text-[10px] font-mono text-status-error">
                    <AlertTriangle size={12} />
                    {mutationError}
                  </div>
                )}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`inline-block text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full border ${PRIORITY_COLORS[selectedTicket.priority]}`}>{selectedTicket.priority}</span>
                  <span className={`inline-block text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full border ${CATEGORY_COLORS[selectedTicket.category]}`}>{selectedTicket.category.replace("_", " ")}</span>
                  <span className="text-[9px] font-mono text-brand-text-muted ml-auto">{selectedTicket.organizationName}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 flex-1">
                    <label htmlFor="p-status" className="text-[9px] font-mono uppercase tracking-wider text-brand-text-muted font-bold shrink-0">Status</label>
                    <select id="p-status" value={selectedTicket.status}
                      onChange={async (e) => {
                        const val = e.target.value as TicketStatus
                        if (val === selectedTicket.status) return
                        setSelectedTicket({ ...selectedTicket, status: val })
                        await runTicketMutation(selectedTicket.id, () =>
                          platformService.updateSupportTicket(selectedTicket.id, { status: val.toLowerCase() })
                        )
                      }}
                      className="flex-1 appearance-none bg-brand-surface-elevated border border-brand-border rounded-lg px-2 py-1.5 text-[10px] font-mono font-bold uppercase tracking-wider text-brand-text-primary focus:outline-none focus:border-brand-gold cursor-pointer">
                      {(["OPEN", "ASSIGNED", "ACCEPTED", "WAITING", "RESOLVED", "CLOSED"] as TicketStatus[]).map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  {(selectedTicket.status === "OPEN" || selectedTicket.status === "ASSIGNED") && (
                    <button onClick={async () => {
                      setSelectedTicket({ ...selectedTicket, status: "ASSIGNED" })
                      await runTicketMutation(selectedTicket.id, () => platformService.acceptSupportTicket(selectedTicket.id))
                      load()
                    }}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-status-success text-white text-[9px] font-bold uppercase tracking-wider hover:opacity-90 transition-all cursor-pointer shrink-0">
                      Accept
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-1.5">
                  <label htmlFor="p-assign" className="text-[9px] font-mono uppercase tracking-wider text-brand-text-muted font-bold shrink-0">Assign</label>
                  <select id="p-assign" value={selectedTicket.assignedTo || ""}
                    onChange={async (e) => {
                      const val = e.target.value || null
                      setSelectedTicket({ ...selectedTicket, assignedTo: val })
                      await runTicketMutation(selectedTicket.id, () =>
                        platformService.updateSupportTicket(selectedTicket.id, { assigned_to: val })
                      )
                    }}
                    className="flex-1 appearance-none bg-brand-surface-elevated border border-brand-border rounded-lg px-2 py-1.5 text-[10px] font-mono text-brand-text-primary focus:outline-none focus:border-brand-gold cursor-pointer">
                    <option value="">Unassigned</option>
                    {staffList.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
              </div>

              {/* ── Messages — Side-by-side chat ── */}
              <div className="flex-1 overflow-y-auto px-4 py-4">
                {chatMessages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <MessageSquare size={28} className="text-brand-text-disabled mb-2" />
                    <p className="text-xs text-brand-text-muted">No messages yet. Send the first reply below.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messageGroups.map((group) => (
                      <div key={group.date}>
                        <div className="flex items-center gap-3 my-3">
                          <div className="flex-1 h-px bg-brand-border" />
                          <span className="text-[9px] font-mono uppercase tracking-wider text-brand-text-muted">{formatDate(group.date)}</span>
                          <div className="flex-1 h-px bg-brand-border" />
                        </div>
                        <div className="space-y-2">
                          {group.items.map((msg) => (
                            <ChatMessage key={msg.id} message={msg} isOwn={msg.authorRole === 'STAFF'} />
                          ))}
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>

              {/* ── Send area ── */}
              <div className="shrink-0 border-t border-brand-border px-4 py-3 space-y-2">
                {/* Pending media preview */}

                {pendingMedia && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-brand-surface-elevated border border-brand-border">
                    {pendingMedia.type === 'voice' ? (
                      <div className="flex items-center gap-2 flex-1">
                        <div className="w-6 h-6 rounded-full bg-status-error/10 flex items-center justify-center"><div className="w-2 h-2 rounded-full bg-status-error animate-pulse" /></div>
                        <span className="text-[10px] font-mono text-brand-text-primary">Voice note ({pendingMedia.duration ? `${Math.floor(pendingMedia.duration / 60)}:${(pendingMedia.duration % 60).toString().padStart(2, '0')}` : '0:00'})</span>
                      </div>
                    ) : pendingMedia.type === 'image' && pendingMedia.filePath ? (
                      <img src={pendingMedia.filePath} alt="Preview" className="h-10 w-10 rounded-lg object-cover" />
                    ) : (
                      <FileText size={14} className="text-brand-gold shrink-0" />
                    )}
                    {pendingMedia.fileName && <span className="text-[10px] text-brand-text-muted truncate flex-1">{pendingMedia.fileName}</span>}
                    <button onClick={() => setPendingMedia(null)} className="p-1 rounded-lg hover:bg-brand-surface-interactive text-brand-text-muted transition-colors cursor-pointer"><X size={10} /></button>
                  </div>
                )}

                <div className="flex items-end gap-2">
                  {/* Attachment buttons */}
                  <div className="flex items-center gap-1 shrink-0 pb-0.5">
                    <VoiceRecorder onRecordingComplete={handleVoiceRecorded} disabled={sendingReply} />
                    <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileUpload(f, 'image'); e.target.value = '' }} />
                    <button onClick={() => imageInputRef.current?.click()} disabled={sendingReply}
                      className="p-2.5 rounded-xl bg-brand-surface-elevated border border-brand-border text-brand-text-muted hover:text-brand-gold hover:border-brand-gold/30 transition-all cursor-pointer disabled:opacity-40"
                      title="Upload image">
                      <ImageIcon size={14} />
                    </button>
                    <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.csv" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileUpload(f, 'file'); e.target.value = '' }} />
                    <button onClick={() => fileInputRef.current?.click()} disabled={sendingReply}
                      className="p-2.5 rounded-xl bg-brand-surface-elevated border border-brand-border text-brand-text-muted hover:text-brand-gold hover:border-brand-gold/30 transition-all cursor-pointer disabled:opacity-40"
                      title="Upload file">
                      <Paperclip size={14} />
                    </button>
                  </div>

                  {/* Text input */}
                  <input name="reply" aria-label="Type your reply" value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
                    placeholder="Type your reply..."
                    className="flex-1 min-w-0 bg-brand-bg-secondary/50 border border-brand-border rounded-xl px-3 py-2.5 text-xs text-brand-text-primary placeholder-brand-text-disabled focus:outline-none focus:border-brand-gold transition-all" />

                  {/* Send */}
                  <button onClick={handleSend} disabled={(!replyText.trim() && !pendingMedia) || sendingReply}
                    className="p-2.5 rounded-xl bg-brand-gold text-black hover:bg-brand-gold-hover disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer shrink-0">
                    {sendingReply ? <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" /> : <Send size={14} />}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
    </>
  )
}
