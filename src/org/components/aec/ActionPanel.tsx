import { motion } from 'motion/react'
import {
  Eye,
  UserPlus,
  Mail,
  ShieldCheck,
  Key,
  RefreshCw,
  Vote,
  FileText,
  Lock,
} from 'lucide-react'

const ACTION_CONFIG: Record<
  string,
  { icon: typeof Eye; label: string }
> = {
  VIEW: { icon: Eye, label: 'View Participant' },
  REGISTER: { icon: UserPlus, label: 'Register Participant' },
  SEND_OTP: { icon: Mail, label: 'Send Verification Code' },
  VERIFY_OTP: { icon: ShieldCheck, label: 'Verify Code' },
  ISSUE_PASS: { icon: Key, label: 'Issue Voting Pass' },
  REISSUE_PASS: { icon: RefreshCw, label: 'Reissue Voting Pass' },
  ASSISTED_VOTE: { icon: Vote, label: 'Assisted Vote' },
  VIEW_RECEIPT: { icon: FileText, label: 'View Receipt' },
}

interface ActionPanelProps {
  allowedActions: string[]
  blockedReasons: Record<string, string>
  onAction: (action: string) => void
  primaryColor?: string
  verificationMethods?: Array<{
    key: string
    label: string
    available: boolean
    coming_soon?: boolean
  }>
}

export default function ActionPanel({
  allowedActions,
  blockedReasons,
  onAction,
  primaryColor = '#D4AF37',
  verificationMethods,
}: ActionPanelProps) {
  const allActions = Object.keys(ACTION_CONFIG)

  return (
    <div>
      <div className="grid grid-cols-2 gap-2">
        {allActions.map((actionKey) => {
          const config = ACTION_CONFIG[actionKey]
          if (!config) return null

          const Icon = config.icon
          const isAllowed = allowedActions.includes(actionKey)
          const blockedReason = blockedReasons[actionKey]

          if (isAllowed) {
            return (
              <motion.button
                key={actionKey}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onAction(actionKey)}
                className="flex items-center gap-2 p-2.5 rounded-xl border border-brand-border bg-brand-surface hover:bg-brand-surface-interactive transition-colors text-left cursor-pointer"
              >
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                  style={{ backgroundColor: `${primaryColor}18` }}
                >
                  <Icon size={13} style={{ color: primaryColor }} />
                </div>
                <span className="text-[10px] font-bold text-brand-text-primary">
                  {config.label}
                </span>
              </motion.button>
            )
          }

          return (
            <div
              key={actionKey}
              className="relative group"
            >
              <div className="flex items-center gap-2 p-2.5 rounded-xl border border-brand-border bg-brand-surface opacity-40 cursor-not-allowed">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 bg-brand-surface-interactive">
                  <Lock size={13} className="text-brand-text-disabled" />
                </div>
                <span className="text-[10px] font-bold text-brand-text-disabled">
                  {config.label}
                </span>
              </div>
              {blockedReason && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2.5 py-1.5 rounded-lg bg-brand-surface-elevated border border-brand-border shadow-brand-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 whitespace-nowrap">
                  <p className="text-[9px] text-brand-text-muted">{blockedReason}</p>
                  <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px">
                    <div className="w-2 h-2 rotate-45 bg-brand-surface-elevated border-r border-b border-brand-border" />
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {verificationMethods && verificationMethods.length > 0 && (
        <div className="mt-3 pt-3 border-t border-brand-border">
          <p className="text-[9px] font-semibold uppercase tracking-wider text-brand-text-muted mb-2">
            Verification Methods
          </p>
          <div className="flex flex-wrap gap-1.5">
            {verificationMethods.map((method) => (
              <div
                key={method.key}
                className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[9px] font-medium border ${
                  method.available
                    ? 'border-status-success bg-status-success/10 text-status-success'
                    : 'border-brand-border bg-brand-surface text-brand-text-muted'
                }`}
              >
                {method.label}
                {method.coming_soon && (
                  <span className="text-[8px] bg-brand-surface-elevated text-brand-text-muted px-1 rounded-full">
                    Coming Soon
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
