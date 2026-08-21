import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import {
  Search, Plus, Clock, Sparkles, Star, LayoutTemplate, Folder, X,
} from 'lucide-react'
import { useOrgBranding } from '../contexts/OrgBrandingContext'
import DashboardCard from '../components/DashboardCard'
import EmptyState from '../components/EmptyState'
import SkeletonLoader from '../components/SkeletonLoader'
import SeoHead from "../../components/SeoHead"
import { ROUTES } from '../../constants/routes'
import type { EventTemplate } from '../types'
import type { EventType } from '../types'
import { orgService } from '../../services/org-service'
import { useApiResource } from '../../hooks/useApiResource'

type CategoryFilter = 'all' | 'default' | 'organization' | 'recent'

const TYPE_LABELS: Record<EventType, string> = {
  governance_election: 'Governance Election', award_competition: 'Award Competition', poll: 'Poll',
  survey: 'Survey', referendum: 'Referendum', agm: 'AGM', recruitment: 'Recruitment',
  general_meeting: 'General Meeting', custom: 'Custom',
}

export default function OrgTemplates() {
  const { branding } = useOrgBranding()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all')

  const { data, loading, error, reload } = useApiResource(async () => {
    const result = await orgService.getTemplates({ perPage: 100 })
    return result.items
  })

  const MOCK_TEMPLATES = data ?? []

  const filtered = useMemo(() => {
    let result = [...MOCK_TEMPLATES]
    if (categoryFilter !== 'all') result = result.filter((t) => t.category === categoryFilter)
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter((t) => t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q))
    }
    return result
  }, [categoryFilter, search, MOCK_TEMPLATES])

  const recentTemplates = useMemo(() =>
    MOCK_TEMPLATES.filter((t) => t.category === 'recent').sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()), [MOCK_TEMPLATES])
  const defaultTemplates = useMemo(() =>
    MOCK_TEMPLATES.filter((t) => t.category === 'default').sort((a, b) => b.usedCount - a.usedCount), [MOCK_TEMPLATES])
  const orgTemplates = useMemo(() =>
    MOCK_TEMPLATES.filter((t) => t.category === 'organization').sort((a, b) => b.usedCount - a.usedCount), [MOCK_TEMPLATES])

  const [previewing, setPreviewing] = useState<string | null>(null)
  const previewTemplate = MOCK_TEMPLATES.find((t) => t.id === previewing) ?? null

  if (loading) {
    return (
      <>
        <SeoHead meta={{ title: 'Templates — Organization | ORIVIS', noindex: true }} />
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
        <SeoHead meta={{ title: 'Templates — Organization | ORIVIS', noindex: true }} />
        <EmptyState
          icon={LayoutTemplate}
          title="Failed to load templates"
          description={error}
          action={{ label: 'Retry', onClick: reload }}
        />
      </>
    )
  }

  const handleUseTemplate = (template: EventTemplate) => {
    navigate(`${ROUTES.ORG.CREATE_EVENT}?template=${template.id}&type=${template.type}&title=${encodeURIComponent(template.name)}`)
  }

  const handleSaveAsTemplate = () => {
    navigate(ROUTES.ORG.CREATE_EVENT)
  }

  return (
    <>
      <SeoHead meta={{ title: 'Templates — Organization | ORIVIS', noindex: true }} />
      <div className="space-y-6 max-w-[1440px] mx-auto pb-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-brand-text-primary">
              Event Templates
            </h1>
            <p className="text-[10px] text-brand-text-muted mt-0.5">
              Start from a template or save your current event as one
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={handleSaveAsTemplate}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white transition-all shadow-md w-full sm:w-auto"
            style={{ backgroundColor: branding.primaryColor }}
          >
            <Plus size={14} /> Save as Template
          </motion.button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <DashboardCard>
            <p className="text-[10px] text-brand-text-muted ">Total Templates</p>
            <p className="text-2xl font-bold text-brand-text-primary mt-1">{MOCK_TEMPLATES.length}</p>
          </DashboardCard>
          <DashboardCard>
            <p className="text-[10px] text-brand-gold ">Most Used</p>
            <p className="text-2xl font-bold text-brand-text-primary mt-1">{defaultTemplates[0]?.usedCount ?? 0}x</p>
          </DashboardCard>
          <DashboardCard>
            <p className="text-[10px] text-brand-text-muted ">Organization</p>
            <p className="text-2xl font-bold text-brand-text-primary mt-1">{orgTemplates.length}</p>
          </DashboardCard>
          <DashboardCard>
            <p className="text-[10px] text-status-success ">Recent</p>
            <p className="text-2xl font-bold text-brand-text-primary mt-1">{recentTemplates.length}</p>
          </DashboardCard>
        </div>

        <div className="relative flex-1 max-w-md">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-text-muted pointer-events-none" />
          <input
            name="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search"
            placeholder="Search templates..."
            className="w-full h-10 pl-9 pr-4 rounded-xl text-xs bg-brand-surface border border-brand-border text-brand-text-primary placeholder:text-brand-text-disabled focus:outline-none focus:ring-2 transition-all"
            style={{ '--tw-ring-color': branding.primaryColor } as React.CSSProperties}
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 -mx-1 px-1">
          {(['all', 'default', 'organization', 'recent'] as CategoryFilter[]).map((cat) => {
            const count = cat === 'all' ? MOCK_TEMPLATES.length : MOCK_TEMPLATES.filter((t) => t.category === cat).length
            const isActive = categoryFilter === cat
            return (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-[10px] font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-[var(--org-primary)]/10 text-[var(--org-primary)] border border-[var(--org-primary)]/20'
                    : 'bg-brand-surface border border-brand-border text-brand-text-muted hover:text-brand-text-primary hover:border-brand-text-muted/30'
                }`}
              >
                {cat === 'all' ? 'All' : cat.charAt(0).toUpperCase() + cat.slice(1)}
                <span className={`px-1.5 py-0.5 rounded-full text-[8px] font-bold ${isActive ? 'bg-[var(--org-primary)]/20' : 'bg-brand-surface-elevated text-brand-text-disabled'}`}>{count}</span>
              </button>
            )
          })}
        </div>

        {recentTemplates.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Clock size={14} className="text-brand-gold" />
              <h2 className="text-xs font-bold text-brand-text-primary">Recent Templates</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recentTemplates.map((tmpl) => (
                <TemplateCard key={tmpl.id} template={tmpl} onUse={handleUseTemplate} onPreview={setPreviewing} branding={branding} />
              ))}
            </div>
          </div>
        )}

        <div>
          <div className="flex items-center gap-2 mb-4">
            <Sparkles size={14} className="text-brand-gold" />
            <h2 className="text-xs font-bold text-brand-text-primary">Default Templates</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {defaultTemplates.map((tmpl) => (
              <TemplateCard key={tmpl.id} template={tmpl} onUse={handleUseTemplate} onPreview={setPreviewing} branding={branding} />
            ))}
          </div>
          {defaultTemplates.length === 0 && (
            <EmptyState icon={LayoutTemplate} title="No Default Templates" description="Default templates will appear here." />
          )}
        </div>

        {orgTemplates.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Folder size={14} className="text-brand-gold" />
              <h2 className="text-xs font-bold text-brand-text-primary">Organization Templates</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {orgTemplates.map((tmpl) => (
                <TemplateCard key={tmpl.id} template={tmpl} onUse={handleUseTemplate} onPreview={setPreviewing} branding={branding} />
              ))}
            </div>
          </div>
        )}

        {filtered.length === 0 && !recentTemplates.length && (
          <EmptyState
            icon={LayoutTemplate}
            title="No Templates Found"
            description={search ? 'Try a different search term.' : 'No templates match the selected filter.'}
          />
        )}

        <AnimatePresence>
          {previewTemplate && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
              onClick={() => setPreviewing(null)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-lg rounded-2xl border border-brand-divider bg-brand-surface p-6 shadow-2xl"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${branding.primaryColor}15`, color: branding.primaryColor }}>
                      <LayoutTemplate size={24} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-brand-text-primary">{previewTemplate.name}</h3>
                      <p className="text-[10px] text-brand-text-muted">{TYPE_LABELS[previewTemplate.type] || previewTemplate.type}</p>
                    </div>
                  </div>
                  <button onClick={() => setPreviewing(null)} className="p-1.5 rounded-lg hover:bg-brand-surface-interactive text-brand-text-muted">
                    <X size={14} />
                  </button>
                </div>
                <p className="text-xs text-brand-text-muted mb-4 leading-relaxed">{previewTemplate.description}</p>
                <div className="flex items-center gap-4 mb-4 text-[10px] text-brand-text-muted">
                  <span className="flex items-center gap-1"><Star size={10} className="text-brand-gold" /> {previewTemplate.usedCount} uses</span>
                  <span>Category: {previewTemplate.category}</span>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => { setPreviewing(null); handleUseTemplate(previewTemplate) }}
                    className="flex-1 py-2.5 rounded-xl text-[10px] font-bold text-white transition-all"
                    style={{ backgroundColor: branding.primaryColor }}>
                    Use Template
                  </button>
                  <button onClick={() => setPreviewing(null)}
                    className="px-4 py-2.5 rounded-xl text-[10px] font-bold border border-brand-border text-brand-text-muted hover:bg-brand-surface-interactive transition-all">
                    Close
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

function TemplateCard({ template, onUse, onPreview, branding }: {
  template: EventTemplate
  onUse: (t: EventTemplate) => void
  onPreview: (id: string | null) => void
  branding: any
}) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
      className="rounded-2xl border border-brand-divider bg-brand-surface p-5 transition-all hover:border-[var(--org-primary)]/30"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded-xl bg-brand-surface-elevated flex items-center justify-center" style={{ color: branding.primaryColor }}>
          <LayoutTemplate size={20} />
        </div>
        <span className="text-[9px] font-bold text-brand-text-muted px-2 py-1 rounded-full bg-brand-surface-elevated">
          {TYPE_LABELS[template.type] || template.type}
        </span>
      </div>
      <h3 className="text-sm font-bold text-brand-text-primary mb-1">{template.name}</h3>
      <p className="text-[11px] text-brand-text-muted leading-relaxed mb-4 line-clamp-2">{template.description}</p>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-1 text-[10px] text-brand-text-muted">
          <Star size={10} className="text-brand-gold" />
          <span>{template.usedCount} uses</span>
        </div>
        <span className="text-[9px] text-brand-text-disabled">{template.category}</span>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPreview(template.id)}
          className="flex-1 py-2 rounded-xl text-[10px] font-bold border border-brand-border text-brand-text-muted hover:text-brand-text-primary hover:border-brand-text-muted/30 transition-all"
        >
          Preview
        </button>
        <button
          onClick={() => onUse(template)}
          className="flex-1 py-2 rounded-xl text-[10px] font-bold text-white transition-all"
          style={{ backgroundColor: branding.primaryColor }}
        >
          Use Template
        </button>
      </div>
    </motion.div>
  )
}