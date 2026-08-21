import { useState } from 'react'
import { motion } from 'motion/react'
import { Bell } from 'lucide-react'
import { useOrgBranding } from '../../contexts/OrgBrandingContext'
import DashboardCard from '../../components/DashboardCard'
import { type OrivisEvent } from './_shared'

export function CommunicationTab({ event: _event }: { event: OrivisEvent }) {
  const { branding } = useOrgBranding()
  const pColor = branding.primaryColor
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [sent, setSent] = useState(false)

  const handleSend = () => {
    if (!subject.trim() || !message.trim()) return
    setSent(true)
    setTimeout(() => setSent(false), 3000)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3 p-4 rounded-xl bg-status-warning/10 border border-status-warning/20">
        <Bell size={14} className="text-status-warning shrink-0 mt-0.5" />
        <p className="text-[10px] text-status-warning font-medium">Participant email notifications are sent automatically when events go live, votes are cast, and registrations succeed. Manual messaging coming soon.</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DashboardCard hover={false}>
          <h3 className="text-xs font-bold text-brand-text-primary mb-4">Notification Settings</h3>
          <div className="space-y-3">
            {[
              { label: 'New Registration', desc: 'Notify when a participant registers' },
              { label: 'Vote Cast', desc: 'Notify when a vote is cast' },
              { label: 'Candidate Changes', desc: 'Notify when candidate details change' },
              { label: 'Event Updates', desc: 'Notify when event settings change' },
              { label: 'Results Published', desc: 'Notify when results are published' },
            ].map((n) => (
              <label key={n.label} className="flex items-center justify-between p-3 rounded-xl bg-brand-surface-elevated/20 cursor-pointer">
                <div>
                  <span className="text-[10px] text-brand-text-primary font-medium">{n.label}</span>
                  <p className="text-[8px] text-brand-text-disabled">{n.desc}</p>
                </div>
                <input name="notification" type="checkbox" defaultChecked readOnly aria-label="Notification" className="w-4 h-4 rounded border-brand-border accent-[var(--org-primary)]" />
              </label>
            ))}
          </div>
        </DashboardCard>

        <DashboardCard hover={false}>
          <h3 className="text-xs font-bold text-brand-text-primary mb-4">Send Notification</h3>
          <div className="space-y-4">
            <div>
              <label htmlFor="notificationSubject" className="block text-[10px] text-brand-text-muted font-bold mb-1.5">Subject</label>
              <input name="subject" id="notificationSubject" placeholder="Notification subject..." value={subject} onChange={(e) => setSubject(e.target.value)}
                className="w-full bg-brand-bg-secondary/50 border border-brand-border rounded-xl px-4 py-3 text-xs text-brand-text-primary placeholder-brand-text-disabled focus:outline-none transition-all" />
            </div>
            <div>
              <label htmlFor="notificationMessage" className="block text-[10px] text-brand-text-muted font-bold mb-1.5">Message</label>
              <textarea name="message" id="notificationMessage" rows={4} placeholder="Type your notification message..." value={message} onChange={(e) => setMessage(e.target.value)}
                className="w-full bg-brand-bg-secondary/50 border border-brand-border rounded-xl px-4 py-3 text-xs text-brand-text-primary placeholder-brand-text-disabled focus:outline-none transition-all resize-none" />
            </div>
            {sent ? (
              <p className="text-[10px] text-status-success font-bold">Notification queued for delivery.</p>
            ) : (
              <motion.button
                onClick={handleSend}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-[10px] font-bold transition-all text-white"
                style={{ backgroundColor: pColor }}
              >
                <Bell size={12} />
                Send to All Participants
              </motion.button>
            )}
          </div>
        </DashboardCard>
      </div>
    </div>
  )
}
