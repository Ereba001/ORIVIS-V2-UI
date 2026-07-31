import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import {
  Search, BookOpen, HelpCircle, FileText, MessageCircle, Bug,
  ChevronRight, ExternalLink, Mail, CheckCircle2,
  Star, GitMerge, ChevronDown,
  BookMarked, Lightbulb,
} from 'lucide-react'
import { useOrgBranding } from '../contexts/OrgBrandingContext'
import DashboardCard from '../components/DashboardCard'
import WidgetPanel from '../components/WidgetPanel'
import EmptyState from '../components/EmptyState'
import {
  HELP_ARTICLES, FAQS, RELEASE_NOTES, WORKSPACE_STATUSES,
} from '../mock/data'
import type { HelpArticle, FAQItem, ReleaseNote } from '../types'
import SeoHead from "../../components/SeoHead"

type HelpTab = 'knowledge-base' | 'faq' | 'release-notes' | 'contact'

export default function OrgHelp() {
  const { branding } = useOrgBranding()
  const pColor = branding.primaryColor

  const [tab, setTab] = useState<HelpTab>('knowledge-base')
  const [search, setSearch] = useState('')
  const [selectedArticle, setSelectedArticle] = useState<HelpArticle | null>(null)
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null)

  const filteredArticles = HELP_ARTICLES.filter((a) =>
    !search || a.title.toLowerCase().includes(search.toLowerCase()) ||
    a.description.toLowerCase().includes(search.toLowerCase()) ||
    a.category.toLowerCase().includes(search.toLowerCase())
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-black uppercase tracking-tight" style={{ color: 'var(--org-primary)' }}>Help & Support</h1>
          <p className="text-sm text-brand-text-muted mt-1">Find answers, browse documentation, or get in touch with our team.</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-brand-divider bg-brand-surface">
          <span className={`w-2 h-2 rounded-full ${onlineStatus.variant === 'success' ? 'bg-status-success' : 'bg-status-warning'} animate-pulse`} />
          <span className="text-[9px] font-mono text-brand-text-muted">{onlineStatus.value}</span>
        </div>
      </div>

      <div className="relative max-w-xl">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-text-muted" />
        <input value={search} onChange={(e) => setSearch(e.target.value)}
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
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-mono uppercase tracking-wider font-bold transition-all ${
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
                className="flex items-center gap-1 text-[10px] font-mono font-bold mb-4" style={{ color: pColor }}>
                <ChevronRight size={12} className="rotate-180" /> Back to Articles
              </button>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[9px] font-mono px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: pColor }}>
                  {selectedArticle.category}
                </span>
                <span className="text-[9px] font-mono text-brand-text-muted">{selectedArticle.readTime}</span>
              </div>
              <h2 className="text-lg font-display font-black uppercase tracking-tight text-brand-text-primary mb-2">{selectedArticle.title}</h2>
              <p className="text-sm text-brand-text-muted mb-6">{selectedArticle.description}</p>
              <div className="prose prose-sm max-w-none text-brand-text-secondary">
                <p className="text-xs leading-relaxed">
                  This is a placeholder article. In production, this content would be loaded from the knowledge base API.
                  The article structure supports rich text, code blocks, images, and embedded video content.
                </p>
                <div className="mt-4 p-4 rounded-xl border border-brand-divider bg-brand-surface-elevated/30">
                  <p className="text-[10px] font-mono text-brand-text-muted">
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
                        <h3 className="text-xs font-bold uppercase tracking-wider text-brand-text-muted mb-3">{category}</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {articles.map((article) => (
                            <motion.button key={article.id} whileHover={{ scale: 1.02 }}
                              onClick={() => setSelectedArticle(article)}
                              className="text-left p-4 rounded-xl border border-brand-divider bg-brand-surface hover:border-[var(--org-primary)]/30 transition-all">
                              <div className="flex items-center gap-1.5 mb-2">
                                <FileText size={12} style={{ color: pColor }} />
                                <span className="text-[9px] font-mono text-brand-text-muted">{article.readTime}</span>
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
                          <span className="inline-block mt-2 text-[9px] font-mono px-2 py-0.5 rounded-full" style={{ backgroundColor: `${pColor}10`, color: pColor }}>
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
              const typeColor = note.type === 'feature' ? 'text-status-success' : note.type === 'fix' ? 'text-status-warning' : 'text-blue-400'
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
                          <span className={`text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full ${typeColor}/10 ${typeColor} border`}
                            style={{ borderColor: 'currentColor' }}>
                            {note.type}
                          </span>
                        </div>
                        <p className="text-[10px] font-mono text-brand-text-muted">{note.date} · {note.title}</p>
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
            <h2 className="text-xs font-bold uppercase tracking-wider text-brand-text-primary mb-4">Get in Touch</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-mono uppercase tracking-wider text-brand-text-muted font-bold mb-1.5">Subject</label>
                <input placeholder="Brief description of your issue..."
                  className="w-full bg-brand-bg-secondary/50 border border-brand-divider rounded-xl px-4 py-3 text-xs text-brand-text-primary placeholder-brand-text-disabled focus:outline-none transition-all" />
              </div>
              <div>
                <label className="block text-[10px] font-mono uppercase tracking-wider text-brand-text-muted font-bold mb-1.5">Category</label>
                <select className="w-full bg-brand-bg-secondary/50 border border-brand-divider rounded-xl px-4 py-3 text-xs text-brand-text-primary focus:outline-none transition-all">
                  <option>Technical Issue</option>
                  <option>Account & Billing</option>
                  <option>Feature Request</option>
                  <option>Report a Bug</option>
                  <option>General Inquiry</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-mono uppercase tracking-wider text-brand-text-muted font-bold mb-1.5">Message</label>
                <textarea rows={4} placeholder="Describe your issue in detail..."
                  className="w-full bg-brand-bg-secondary/50 border border-brand-divider rounded-xl px-4 py-3 text-xs text-brand-text-primary placeholder-brand-text-disabled focus:outline-none transition-all resize-none" />
              </div>
              <button className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all text-white"
                style={{ backgroundColor: pColor }}>
                Submit
              </button>
            </div>
          </DashboardCard>

          <div className="space-y-4">
            <DashboardCard hover={false}>
              <h2 className="text-xs font-bold uppercase tracking-wider text-brand-text-primary mb-3">Contact Options</h2>
              <div className="space-y-3">
                {([
                  { icon: Mail, label: 'Email Support', desc: 'support@orivis.io', color: 'text-blue-400' },
                  { icon: MessageCircle, label: 'Live Chat', desc: 'Available Mon-Fri, 9AM-6PM WAT', color: 'text-status-success' },
                  { icon: Bug, label: 'Report a Bug', desc: 'Found an issue? Let us know.', color: 'text-status-warning' },
                ]).map((c) => {
                  const Icon = c.icon
                  return (
                    <div key={c.label} className="flex items-center gap-3 p-3 rounded-xl border border-brand-divider hover:bg-brand-surface-interactive/30 transition-all">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-brand-surface-elevated">
                        <Icon size={16} className={c.color} />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-semibold text-brand-text-primary">{c.label}</p>
                        <p className="text-[9px] font-mono text-brand-text-muted">{c.desc}</p>
                      </div>
                      <ExternalLink size={14} className="text-brand-text-muted" />
                    </div>
                  )
                })}
              </div>
            </DashboardCard>

            <DashboardCard hover={false}>
              <h2 className="text-xs font-bold uppercase tracking-wider text-brand-text-primary mb-3">System Status</h2>
              <div className="space-y-2">
                {WORKSPACE_STATUSES.map((s) => (
                  <div key={s.label} className="flex items-center justify-between py-2">
                    <span className="text-xs text-brand-text-muted">{s.label}</span>
                    <span className={`flex items-center gap-1 text-[9px] font-mono uppercase tracking-wider ${
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
    </>
  )
}