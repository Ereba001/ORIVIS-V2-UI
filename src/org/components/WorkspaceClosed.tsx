import { Lock, ArrowLeft, Mail } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface WorkspaceClosedProps {
  organizationName: string;
}

export default function WorkspaceClosed({ organizationName }: WorkspaceClosedProps) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-bg-primary p-4">
      <div className="glass-card rounded-2xl p-8 max-w-md w-full text-center shadow-xl">
        <div className="w-16 h-16 rounded-full bg-status-error/10 flex items-center justify-center mx-auto mb-5">
          <Lock size={32} className="text-status-error" />
        </div>
        <h1 className="text-lg font-bold text-brand-text-primary mb-2">Workspace Closed</h1>
        <p className="text-xs text-brand-text-muted mb-4">
          The workspace <span className="font-semibold text-brand-text-primary">{organizationName}</span> has been closed.
        </p>
        <p className="text-[10px] text-brand-text-muted mb-6">
          This workspace is no longer accessible. Historical data has been preserved. Please contact support or your administrator for assistance.
        </p>
        <div className="flex flex-col gap-3">
          <button
            onClick={() => navigate('/')}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold border border-brand-divider text-brand-text-muted hover:bg-brand-surface-interactive/30 transition-all"
          >
            <ArrowLeft size={14} /> Return to Dashboard
          </button>
          <a
            href="mailto:support@orivis.com"
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white transition-all"
            style={{ backgroundColor: 'var(--org-primary, #6366f1)' }}
          >
            <Mail size={14} /> Contact Support
          </a>
        </div>
      </div>
    </div>
  );
}
