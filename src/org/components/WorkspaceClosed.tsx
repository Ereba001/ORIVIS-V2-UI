import { useState } from 'react';
import { Lock, MessageCircle, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import LiveChat from './LiveChat';

interface WorkspaceClosedProps {
  organizationName: string;
  logoUrl?: string | null;
  primaryColor?: string;
}

export default function WorkspaceClosed({
  organizationName,
  logoUrl,
  primaryColor = 'var(--org-primary, #6366f1)',
}: WorkspaceClosedProps) {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [chatOpen, setChatOpen] = useState(false);

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

          <div className="w-16 h-16 rounded-full bg-status-error/10 flex items-center justify-center mx-auto mb-5">
            <Lock size={32} className="text-status-error" />
          </div>

          <h1 className="text-lg font-bold text-brand-text-primary mb-2">Workspace Closed</h1>

          <p className="text-xs text-brand-text-muted mb-4">
            The workspace <span className="font-semibold text-brand-text-primary">{organizationName}</span> has been closed.
          </p>

          <p className="text-xs text-brand-text-muted mb-4">
            This workspace is no longer accessible. Historical data has been preserved.
          </p>

          <p className="text-[10px] text-brand-text-muted mb-6">
            Please contact ORIVIS Support or your administrator for assistance.
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
              onClick={async () => {
                try { await logout(); } catch { /* ignore */ }
                navigate('/org/signin');
              }}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold border border-brand-divider text-brand-text-muted hover:bg-brand-surface-interactive/30 transition-all cursor-pointer"
            >
              <LogOut size={14} /> Sign Out
            </button>
          </div>
        </div>
      </div>
      <LiveChat open={chatOpen} onClose={() => setChatOpen(false)} />
    </>
  );
}
