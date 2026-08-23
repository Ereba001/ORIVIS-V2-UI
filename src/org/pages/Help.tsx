import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import {
  Search, BookOpen, HelpCircle, FileText, MessageCircle, Bug,
  ChevronRight, ExternalLink, Mail, CheckCircle2,
  Star, GitMerge, ChevronDown,
  BookMarked, Lightbulb, Send,
} from 'lucide-react'
import DOMPurify from 'dompurify'
import { useOrgBranding } from '../contexts/OrgBrandingContext'
import DashboardCard from '../components/DashboardCard'
import EmptyState from '../components/EmptyState'
import SkeletonLoader from '../components/SkeletonLoader'
import LiveChat from '../components/LiveChat'
import { orgService } from '../../services/org-service'
import { useApiResource } from '../../hooks/useApiResource'
import type { HelpArticle, FAQItem, ReleaseNote, WorkspaceStatus } from '../types'
import SeoHead from "../../components/SeoHead"

type HelpTab = 'knowledge-base' | 'faq' | 'release-notes' | 'contact'

const WORKSPACE_STATUSES: WorkspaceStatus[] = [
  { label: 'Platform Status', value: 'All Systems Operational', variant: 'success' },
  { label: 'Event Integrity', value: 'Verified — Zero-Knowledge Proofs Active', variant: 'success' },
  { label: 'Data Encryption', value: 'End-to-End Encrypted', variant: 'success' },
  { label: 'Last Backup', value: '3 hours ago', variant: 'info' },
]

const FAQS: FAQItem[] = [
  { id: 'faq-1', question: 'How do I create my first event?', answer: 'Navigate to Events in the sidebar and click "Create Event". Fill in the details, add positions and candidates, then publish when ready.', category: 'Events' },
  { id: 'faq-2', question: 'Can I import participants from a spreadsheet?', answer: 'Yes. Go to Participants and click "Import". We support CSV and Excel files. Map the columns to participant fields and the system will process the import.', category: 'Participants' },
  { id: 'faq-3', question: 'How do voting passes work?', answer: 'Each voter receives a unique voting pass via email. They use this pass to authenticate and cast their ballot. Passes are single-use and cryptographically secured.', category: 'Security' },
  { id: 'faq-4', question: 'What is the difference between roles?', answer: 'Roles control what team members can do. Organization Owners have full access, while Observers can only view results. Custom roles let you define granular permissions.', category: 'Team' },
  { id: 'faq-5', question: 'How secure is the voting process?', answer: 'ORIVIS uses end to end encryption, zero-knowledge proofs, and blockchain-backed audit trails. Every ballot is anonymized and verifiable without compromising voter privacy.', category: 'Security' },
  { id: 'faq-6', question: 'Can I customize my workspace branding?', answer: 'Yes. Go to Workspace Settings > Branding to upload your logo, set your color scheme, and choose between light and dark themes.', category: 'Workspace' },
  { id: 'faq-7', question: 'How do I upgrade my plan?', answer: 'Navigate to Billing to view available plans. Click "Upgrade" on your desired plan. The system will handle pro-rated billing for the remainder of your cycle.', category: 'Billing' },
  { id: 'faq-8', question: 'What happens when an event ends?', answer: 'Voting closes automatically at the scheduled end time. Results are tallied and made available immediately. Admins can publish results for public viewing.', category: 'Events' },
]

const RELEASE_NOTES: ReleaseNote[] = [
  { id: 'rn-1', version: '2.5.0', date: 'Jul 20, 2026', title: 'Custom Roles & Enhanced Permissions', changes: ['Introducing custom role builder with granular permissions', 'New permission matrix with 8 permission groups', 'Package-aware role limits with upgrade prompts'], type: 'feature' },
  { id: 'rn-2', version: '2.4.0', date: 'Jul 5, 2026', title: 'Audit Log Overhaul', changes: ['Redesigned audit log with severity filters', 'New global search across all audit events', 'Export audit logs to CSV'], type: 'feature' },
  { id: 'rn-3', version: '2.3.1', date: 'Jun 28, 2026', title: 'Performance Improvements', changes: ['Optimized dashboard load times', 'Reduced memory usage on large voter imports', 'Fixed sidebar flickering on navigation'], type: 'fix' },
  { id: 'rn-4', version: '2.3.0', date: 'Jun 15, 2026', title: 'Billing Dashboard & Package Comparison', changes: ['New billing dashboard with package comparison', 'Automatic invoice generation', 'Payment method management'], type: 'feature' },
  { id: 'rn-5', version: '2.2.0', date: 'Jun 1, 2026', title: 'Help Center Launch', changes: ['New knowledge base with searchable articles', 'FAQ section with categorized questions', 'Release notes history'], type: 'feature' },
  { id: 'rn-6', version: '2.1.0', date: 'May 15, 2026', title: 'Workspace Settings Redesign', changes: ['Unified settings page with sections', 'Branding customization tools', 'Notification preference controls'], type: 'improvement' },
  { id: 'rn-7', version: '2.0.0', date: 'May 1, 2026', title: 'ORIVIS V2 Launch', changes: ['Complete UI redesign with new design system', 'Enhanced organization branding engine', 'Improved navigation and layout', 'Dark mode support'], type: 'feature' },
]

export default function OrgHelp() {
  const { branding } = useOrgBranding()
  const pColor = branding.primaryColor

  const [tab, setTab] = useState<HelpTab>('knowledge-base')
  const [search, setSearch] = useState('')
  const [selectedArticle, setSelectedArticle] = useState<HelpArticle | null>(null)
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null)
  const [contactSubject, setContactSubject] = useState('')
  const [contactCategory, setContactCategory] = useState('Technical Issue')
  const [contactMessage, setContactMessage] = useState('')
  const [contactSubmitting, setContactSubmitting] = useState(false)
  const [contactSubmitted, setContactSubmitted] = useState(false)
  const [chatOpen, setChatOpen] = useState(false)

  const { data, loading, error, reload } = useApiResource(async () => {
    const result = await orgService.getHelpArticles({ perPage: 100 })
    return result.items
  })

  const HELP_ARTICLES = data ?? []

  if (loading) {
    return (
      <>
        <SeoHead meta={{ title: "Help & Support | ORIVIS", noindex: true }} />
        <div className="space-y-6">
          <div className="animate-pulse h-10 w-64 bg-brand-surface-elevated rounded-2xl" />
          <SkeletonLoader rows={4} variant="card" />
        </div>
      </>
    )
  }

  if (error) {
    return (
      <>
        <SeoHead meta={{ title: "Help & Support | ORIVIS", noindex: true }} />
        <EmptyState
          icon={BookOpen}
          title="Failed to load help center"
          description={error}
          action={{ label: 'Retry', onClick: reload }}
        />
      </>
    )
  }

  const filteredArticles = HELP_ARTICLES.filter((a) =>
    !search || a.title.toLowerCase().includes(search.toLowerCase()) ||
    (a.description ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (a.category ?? '').toLowerCase().includes(search.toLowerCase())
  )

  const categories = Array.from(new Set(HELP_ARTICLES.map((a) => a.category)))

  const filteredFaqs = FAQS.filter((f) =>
    !search || f.question.toLowerCase().includes(search.toLowerCase()) ||
    f.answer.toLowerCase().includes(search.toLowerCase())
  )

  const filteredReleaseNotes = RELEASE_NOTES

  const onlineStatus = WORKSPACE_STATUSES[0]

  return (
    <>
    <SeoHead meta={{ title: "Help & Support | ORIVIS", noindex: true }} />
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--org-primary)' }}>Help & Support</h1>
          <p className="text-sm text-brand-text-muted mt-1">Find answers, browse documentation, or get in touch with our team.</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-brand-divider bg-brand-surface w-full sm:w-auto justify-center">
          <span className={`w-2 h-2 rounded-full ${onlineStatus.variant === 'success' ? 'bg-status-success' : 'bg-status-warning'} animate-pulse`} />
          <span className="text-[9px] text-brand-text-muted">{onlineStatus.value}</span>
        </div>
      </div>

      <div className="relative max-w-xl">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-text-muted" />
        <input name="search" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search"
          placeholder="Search knowledge base, FAQs, and release notes..."
          className="w-full bg-brand-surface border border-brand-divider rounded-2xl pl-11 pr-4 py-3.5 text-xs text-brand-text-primary placeholder-brand-text-disabled focus:outline-none transition-all" />
      </div>

      <div className="flex items-center gap-1 bg-brand-surface-elevated rounded-xl p-1 w-fit flex-wrap">
        {([
          { key: 'knowledge-base', label: 'Knowledge Base', icon: BookOpen },
          { key: 'faq', label: 'FAQs', icon: HelpCircle },
          { key: 'release-notes', label: 'Release Notes', icon: GitMerge },
          { key: 'contact', label: 'Contact Support', icon: MessageCircle },
        ] as const).map((t) => {
          const Icon = t.icon
          return (
            <button key={t.key} onClick={() => { setTab(t.key); setSelectedArticle(null) }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-bold transition-all ${
                tab === t.key ? 'text-white' : 'text-brand-text-muted hover:text-brand-text-primary'
              }`}
              style={tab === t.key ? { backgroundColor: pColor } : {}}>
              <Icon size={12} />{t.label}
            </button>
          )
        })}
      </div>

      {tab === 'knowledge-base' && (
        <>
          {selectedArticle ? (
            <DashboardCard hover={false}>
              <button onClick={() => setSelectedArticle(null)}
                className="flex items-center gap-1 text-[10px] font-bold mb-4" style={{ color: pColor }}>
                <ChevronRight size={12} className="rotate-180" /> Back to Articles
              </button>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[9px] px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: pColor }}>
                  {selectedArticle.category}
                </span>
                <span className="text-[9px] text-brand-text-muted">{selectedArticle.readTime}</span>
              </div>
              <h2 className="text-lg font-bold tracking-tight text-brand-text-primary mb-2">{selectedArticle.title}</h2>
              <p className="text-sm text-brand-text-muted mb-6">{selectedArticle.description}</p>
              <div className="prose prose-sm max-w-none text-brand-text-secondary">
                <div className="text-xs leading-relaxed" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(selectedArticle.content || '<p>No content available for this article.</p>') }} />
                <div className="mt-4 p-4 rounded-xl border border-brand-divider bg-brand-surface-elevated/30">
                  <p className="text-[10px] text-brand-text-muted">
                    <Lightbulb size={12} className="inline mr-1" style={{ color: pColor }} />
                    <strong style={{ color: pColor }}>Pro tip:</strong> Use the search bar above to quickly find articles across the entire knowledge base.
                  </p>
                </div>
              </div>
            </DashboardCard>
          ) : (
            <>
              {search && filteredArticles.length === 0 ? (
                <DashboardCard hover={false}>
                  <EmptyState icon={BookOpen} title="No articles found"
                    description={`No results for "${search}". Try different keywords.`} />
                </DashboardCard>
              ) : (
                <div className="space-y-6">
                  {categories.map((category) => {
                    const articles = (search ? filteredArticles : HELP_ARTICLES).filter((a) => a.category === category)
                    if (articles.length === 0) return null
                    return (
                      <div key={category}>
                        <h3 className="text-xs font-bold text-brand-text-muted mb-3">{category}</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {articles.map((article) => (
                            <motion.button key={article.id} whileHover={{ scale: 1.02 }}
                              onClick={() => setSelectedArticle(article)}
                              className="text-left p-4 rounded-xl border border-brand-divider bg-brand-surface hover:border-[var(--org-primary)]/30 transition-all">
                              <div className="flex items-center gap-1.5 mb-2">
                                <FileText size={12} style={{ color: pColor }} />
                                <span className="text-[9px] text-brand-text-muted">{article.readTime}</span>
                              </div>
                              <h4 className="text-xs font-semibold text-brand-text-primary mb-1">{article.title}</h4>
                              <p className="text-[10px] text-brand-text-muted line-clamp-2">{article.description}</p>
                            </motion.button>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl border border-brand-divider bg-brand-surface text-center">
                  <BookMarked size={20} className="mx-auto mb-2" style={{ color: pColor }} />
                  <p className="text-xs font-semibold text-brand-text-primary mb-1">Quick Start Guide</p>
                  <p className="text-[10px] text-brand-text-muted">Get up and running in 5 minutes</p>
                </div>
                <div className="p-4 rounded-xl border border-brand-divider bg-brand-surface text-center">
                  <Lightbulb size={20} className="mx-auto mb-2" style={{ color: pColor }} />
                  <p className="text-xs font-semibold text-brand-text-primary mb-1">Best Practices</p>
                  <p className="text-[10px] text-brand-text-muted">Tips from election administrators</p>
                </div>
                <div className="p-4 rounded-xl border border-brand-divider bg-brand-surface text-center">
                  <Star size={20} className="mx-auto mb-2" style={{ color: pColor }} />
                  <p className="text-xs font-semibold text-brand-text-primary mb-1">What's New</p>
                  <p className="text-[10px] text-brand-text-muted">Latest features and improvements</p>
                </div>
              </div>
            </>
          )}
        </>
      )}

      {tab === 'faq' && (
        <DashboardCard hover={false}>
          {filteredFaqs.length === 0 ? (
            <EmptyState icon={HelpCircle} title="No FAQs found"
              description={`No results for "${search}". Try different keywords.`} />
          ) : (
            <div className="space-y-3 max-w-3xl">
              {filteredFaqs.map((faq) => (
                <div key={faq.id} className="rounded-xl border border-brand-divider overflow-hidden">
                  <button onClick={() => setExpandedFaq(expandedFaq === faq.id ? null : faq.id)}
                    className="w-full flex items-center justify-between p-4 text-left hover:bg-brand-surface-interactive/30 transition-all">
                    <div className="flex items-center gap-3">
                      <HelpCircle size={14} style={{ color: pColor }} />
                      <span className="text-xs font-semibold text-brand-text-primary">{faq.question}</span>
                    </div>
                    <ChevronDown size={14} className={`text-brand-text-muted transition-transform ${expandedFaq === faq.id ? 'rotate-180' : ''}`} />
                  </button>
                  <AnimatePresence>
                    {expandedFaq === faq.id && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
                        className="overflow-hidden">
                        <div className="px-4 pb-4 pt-0 border-t border-brand-divider">
                          <p className="text-xs text-brand-text-muted mt-3 leading-relaxed">{faq.answer}</p>
                          <span className="inline-block mt-2 text-[9px] px-2 py-0.5 rounded-full" style={{ backgroundColor: `${pColor}10`, color: pColor }}>
                            {faq.category}
                          </span>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          )}
        </DashboardCard>
      )}

      {tab === 'release-notes' && (
        <div className="space-y-4">
          {filteredReleaseNotes.length === 0 ? (
            <DashboardCard hover={false}>
              <EmptyState icon={GitMerge} title="No release notes" description="Check back for future updates." />
            </DashboardCard>
          ) : (
            filteredReleaseNotes.map((note) => {
              const TypeIcon = note.type === 'feature' ? Star : note.type === 'fix' ? Bug : Lightbulb
              const typeColor = note.type === 'feature' ? 'text-status-success' : note.type === 'fix' ? 'text-status-warning' : 'text-status-info'
              return (
                <DashboardCard key={note.id} hover={false}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${pColor}15` }}>
                        <TypeIcon size={18} style={{ color: pColor }} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-brand-text-primary">v{note.version}</h3>
                          <span className={`text-[9px] px-2 py-0.5 rounded-full ${typeColor}/10 ${typeColor} border`}
                            style={{ borderColor: 'currentColor' }}>
                            {note.type}
                          </span>
                        </div>
                        <p className="text-[10px] text-brand-text-muted">{note.date} · {note.title}</p>
                      </div>
                    </div>
                  </div>
                  <ul className="space-y-1.5">
                    {note.changes.map((change, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-brand-text-muted">
                        <CheckCircle2 size={12} className="text-status-success mt-0.5 shrink-0" />
                        <span>{change}</span>
                      </li>
                    ))}
                  </ul>
                </DashboardCard>
              )
            })
          )}
        </div>
      )}

      {tab === 'contact' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <DashboardCard hover={false}>
            <h2 className="text-xs font-bold text-brand-text-primary mb-4">Get in Touch</h2>
            {contactSubmitted ? (
              <div className="flex flex-col items-center text-center py-8">
                <CheckCircle2 size={32} className="text-status-success mb-3" />
                <p className="text-xs font-bold text-brand-text-primary">Ticket Submitted</p>
                <p className="text-[10px] text-brand-text-muted mt-1">We'll get back to you within 24 hours.</p>
                <button onClick={() => { setContactSubmitted(false); setContactSubject(''); setContactMessage('') }}
                  className="mt-4 text-[10px] font-bold" style={{ color: pColor }}>Submit another</button>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] text-brand-text-muted font-bold mb-1.5" htmlFor="contactSubject">Subject</label>
                  <input id="contactSubject" name="subject" placeholder="Brief description of your issue..." value={contactSubject} onChange={(e) => setContactSubject(e.target.value)}
                    className="w-full bg-brand-bg-secondary/50 border border-brand-divider rounded-xl px-4 py-3 text-xs text-brand-text-primary placeholder-brand-text-disabled focus:outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-[10px] text-brand-text-muted font-bold mb-1.5" htmlFor="contactCategory">Category</label>
                  <select id="contactCategory" name="category" value={contactCategory} onChange={(e) => setContactCategory(e.target.value)}
                    className="w-full bg-brand-bg-secondary/50 border border-brand-divider rounded-xl px-4 py-3 text-xs text-brand-text-primary focus:outline-none transition-all">
                    <option>Technical Issue</option>
                    <option>Account & Billing</option>
                    <option>Feature Request</option>
                    <option>Report a Bug</option>
                    <option>General Inquiry</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] text-brand-text-muted font-bold mb-1.5" htmlFor="contactMessage">Message</label>
                  <textarea id="contactMessage" name="message" rows={4} placeholder="Describe your issue in detail..." value={contactMessage} onChange={(e) => setContactMessage(e.target.value)}
                    className="w-full bg-brand-bg-secondary/50 border border-brand-divider rounded-xl px-4 py-3 text-xs text-brand-text-primary placeholder-brand-text-disabled focus:outline-none transition-all resize-none" />
                </div>
                <button
                  onClick={async () => {
                    if (!contactSubject.trim() || !contactMessage.trim()) return
                    setContactSubmitting(true)
                    try {
                      const categoryMap: Record<string, string> = {
                        'Technical Issue': 'technical',
                        'Account & Billing': 'billing',
                        'Feature Request': 'feature_request',
                        'Report a Bug': 'other',
                        'General Inquiry': 'other',
                      }
                      await orgService.createSupportTicket({
                        subject: contactSubject,
                        description: contactMessage,
                        category: categoryMap[contactCategory] ?? 'other',
                        priority: 'medium',
                      })
                      setContactSubmitted(true)
                    } catch {
                      // error handled by UI
                    } finally {
                      setContactSubmitting(false)
                    }
                  }}
                  disabled={contactSubmitting || !contactSubject.trim() || !contactMessage.trim()}
                  className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-xs font-bold transition-all text-white disabled:opacity-50"
                  style={{ backgroundColor: pColor }}>
                  <Send size={12} />
                  {contactSubmitting ? 'Submitting...' : 'Submit'}
                </button>
              </div>
            )}
          </DashboardCard>

          <div className="space-y-4">
            <DashboardCard hover={false}>
              <h2 className="text-xs font-bold text-brand-text-primary mb-3">Contact Options</h2>
              <div className="space-y-3">
                {([
                  { icon: Mail, label: 'Email Support', desc: 'support@orivis.io', color: 'text-status-info', action: 'none' as const },
                  { icon: MessageCircle, label: 'Live Chat', desc: 'Available Mon-Fri, 9AM-6PM WAT', color: 'text-status-success', action: 'chat' as const },
                  { icon: Bug, label: 'Report a Bug', desc: 'Found an issue? Let us know.', color: 'text-status-warning', action: 'none' as const },
                ]).map((c) => {
                  const Icon = c.icon
                  return (
                    <button key={c.label}
                      onClick={() => { if (c.action === 'chat') setChatOpen(true) }}
                      className={`flex items-center gap-3 p-3 rounded-xl border border-brand-divider hover:bg-brand-surface-interactive/30 transition-all text-left w-full ${c.action === 'chat' ? 'cursor-pointer' : 'cursor-default'}`}>
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-brand-surface-elevated">
                        <Icon size={16} className={c.color} />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-semibold text-brand-text-primary">{c.label}</p>
                        <p className="text-[9px] text-brand-text-muted">{c.desc}</p>
                      </div>
                      <ExternalLink size={14} className="text-brand-text-muted" />
                    </button>
                  )
                })}
              </div>
            </DashboardCard>

            <DashboardCard hover={false}>
              <h2 className="text-xs font-bold text-brand-text-primary mb-3">System Status</h2>
              <div className="space-y-2">
                {WORKSPACE_STATUSES.map((s) => (
                  <div key={s.label} className="flex items-center justify-between py-2">
                    <span className="text-xs text-brand-text-muted">{s.label}</span>
                    <span className={`flex items-center gap-1 text-[9px] ${
                      s.variant === 'success' ? 'text-status-success' :
                      s.variant === 'warning' ? 'text-status-warning' : 'text-status-error'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full bg-current`} />
                      {s.value}
                    </span>
                  </div>
                ))}
              </div>
            </DashboardCard>
          </div>
        </div>
      )}
    </div>
    <LiveChat open={chatOpen} onClose={() => setChatOpen(false)} />
    </>
  )
}