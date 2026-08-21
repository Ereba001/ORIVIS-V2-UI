import { Shield } from 'lucide-react'
import { useOrgBranding } from '../../contexts/OrgBrandingContext'
import DashboardCard from '../../components/DashboardCard'
import { type OrivisEvent } from './_shared'

export function PermissionsTab({ event: _event }: { event: OrivisEvent }) {
  const { branding } = useOrgBranding()
  const pColor = branding.primaryColor

  const PERMISSION_GROUPS = [
    { id: 'pg-event', label: 'Event', permissions: [
      { id: 'p-event-view', label: 'View Event', key: 'view_event', enabled: true },
      { id: 'p-event-edit', label: 'Edit Event', key: 'edit_event', enabled: true },
      { id: 'p-event-delete', label: 'Delete Event', key: 'delete_event', enabled: true },
      { id: 'p-event-publish', label: 'Publish Event', key: 'publish_event', enabled: false },
    ]},
    { id: 'pg-candidates', label: 'Candidates', permissions: [
      { id: 'p-cand-view', label: 'View Candidates', key: 'view_candidates', enabled: true },
      { id: 'p-cand-create', label: 'Create Candidates', key: 'create_candidate', enabled: true },
      { id: 'p-cand-edit', label: 'Edit Candidates', key: 'edit_candidate', enabled: true },
      { id: 'p-cand-delete', label: 'Delete Candidates', key: 'delete_candidate', enabled: false },
    ]},
    { id: 'pg-voters', label: 'Participants', permissions: [
      { id: 'p-voter-view', label: 'View Participants', key: 'view_voters', enabled: true },
      { id: 'p-voter-import', label: 'Import Participants', key: 'import_voters', enabled: true },
      { id: 'p-voter-remove', label: 'Remove Participants', key: 'remove_voter', enabled: false },
    ]},
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3 p-4 rounded-xl bg-brand-surface-elevated/30 border border-brand-divider">
        <Shield size={14} className="text-brand-text-muted shrink-0 mt-0.5" />
        <p className="text-[10px] text-brand-text-muted">Event permissions are managed through organization roles. Contact your workspace admin to adjust role permissions.</p>
      </div>
      {PERMISSION_GROUPS.map((group) => (
        <DashboardCard key={group.id} hover={false}>
          <h3 className="text-xs font-bold text-brand-text-primary mb-4">{group.label}</h3>
          <div className="space-y-2">
            {group.permissions.map((perm) => (
              <label key={perm.id} className="flex items-center justify-between p-3 rounded-xl bg-brand-surface-elevated/20 cursor-pointer">
                <div className="flex items-center gap-2">
                  <Shield size={14} style={{ color: pColor }} />
                  <span className="text-[10px] text-brand-text-primary font-medium">{perm.label}</span>
                  <span className="text-[8px] text-brand-text-disabled">{perm.key}</span>
                </div>
                <input name="permission" type="checkbox" checked={perm.enabled} readOnly aria-label="Permission"
                  className="w-4 h-4 rounded border-brand-border accent-[var(--org-primary)]" />
              </label>
            ))}
          </div>
        </DashboardCard>
      ))}
    </div>
  )
}
