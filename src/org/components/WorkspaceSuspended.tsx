import { useState } from 'react';
import { ShieldAlert, MessageCircle, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import LiveChat from './LiveChat';

interface WorkspaceSuspendedProps {
  organizationName: string;
  logoUrl?: string | null;
  primaryColor?: string;
  reason?: string;
  suspensionId?: string;
}

export default function WorkspaceSuspended({
  organizationName,
  logoUrl,
  primaryColor = 'var(--org-primary, #6366f1)',
  reason,
  suspensionId,
}: WorkspaceSuspendedProps) {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [chatOpen, setChatOpen] = useState(false);
  const [appealSent, setAppealSent] = useState(false);

  return (
    <>
      <div className="min-h-screen flex items-center justify-center bg-brand-bg p-4">
        <div className="glass-card rounded-2xl p-8 max-w-md w-full text-center shadow-xl">
          {/* Organization branding */}
          <div className="mb-6">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={`${organizationName} logo`}
                className="h-12 w-auto mx-auto mb-4 object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            ) : (
              <div
                className="w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-4 text-lg font-bold text-white"
                style={{ backgroundColor: primaryColor }}
              >
                {organizationName.charAt(0)}
              </div>
            )}
            <p className="text-sm font-bold text-brand-text-primary">{organizationName}</p>
          </div>

          {/* Suspension icon */}
          <div className="w-16 h-16 rounded-full bg-status-warning/10 flex items-center justify-center mx-auto mb-5">
            <ShieldAlert size={32} className="text-status-warning" />
          </div>

          <h1 className="text-lg font-bold text-brand-text-primary mb-2">Workspace Suspended</h1>

          <p className="text-xs text-brand-text-muted mb-4">
            Your organization's ORIVIS workspace has been suspended due to malicious or unwanted activities detected on the platform.
          </p>

          <p className="text-xs text-brand-text-muted mb-4">
            Access to workspace functions has been disabled.
          </p>

          {reason && (
            <div className="mb-4 p-3 bg-brand-surface-elevated/30 border border-brand-divider rounded-xl text-left">
              <p className="text-[10px] text-brand-text-muted font-semibold mb-1">Reason</p>
              <p className="text-xs text-brand-text-primary">{reason}</p>
            </div>
          )}

          <p className="text-[10px] text-brand-text-muted mb-6">
            If you believe this suspension was made in error or you would like to discuss this matter with our support team, please contact ORIVIS Support.
          </p>

          <div className="flex flex-col gap-3">
            <button
              onClick={() => setChatOpen(true)}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white transition-all cursor-pointer"
              style={{ backgroundColor: primaryColor }}
            >
              <MessageCircle size={14} /> Contact Support
            </button>

            <button
              onClick={() => {
                navigate('/org/help');
              }}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold border border-brand-divider text-brand-text-muted hover:bg-brand-surface-interactive/30 transition-all cursor-pointer"
            >
              Help Centre
            </button>

            <button
              onClick={async () => {
                if (appealSent) return;
                try {
                  const { orgService } = await import('../../services/org-service');
                  await orgService.createSupportTicket({
                    subject: `Suspension Appeal — ${organizationName}`,
                    description: `I would like to appeal the suspension of this workspace.${reason ? `\n\nStated reason: ${reason}` : ''}${suspensionId ? `\n\nSuspension reference: ${suspensionId}` : ''}\n\nI believe this suspension should be reviewed and lifted. Please investigate.`,
                    category: 'suspension_appeal',
                    priority: 'high',
                  });
                  setAppealSent(true);
                  setChatOpen(true);
                } catch { /* ignore */ }
              }}
              disabled={appealSent}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold border border-brand-divider text-brand-text-muted hover:bg-brand-surface-interactive/30 transition-all cursor-pointer disabled:opacity-50"
            >
              {appealSent ? 'Appeal Submitted' : 'Request Review'}
            </button>

            <button
              onClick={async () => {
                try { await logout(); } catch { /* ignore */ }
                navigate('/org/signin');
              }}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold border border-brand-divider text-brand-text-muted hover:bg-brand-surface-interactive/30 transition-all cursor-pointer"
            >
              <LogOut size={14} /> Sign Out
            </button>
          </div>

          <p className="text-[9px] text-brand-text-disabled mt-6">
            Your organization's data and historical records remain securely retained by ORIVIS.
          </p>
        </div>
      </div>
      <LiveChat open={chatOpen} onClose={() => setChatOpen(false)} />
    </>
  );
}
