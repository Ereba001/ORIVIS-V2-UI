import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import SignIn from "../components/SignIn";
import SeoHead from "../components/SeoHead";
import { useAuth } from "../hooks/useAuth";
import { getPlatformHomeRoute } from "../lib/navigation";
import { LogOut } from "lucide-react";

export default function SignInPage() {
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuth();
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (isAuthenticated && !showForm) {
      navigate(getPlatformHomeRoute(user), { replace: true });
    }
  }, [isAuthenticated, user, navigate, showForm]);

  if (isAuthenticated && !showForm) return null;

  return (
    <div className="min-h-screen bg-brand-bg flex items-center justify-center p-4 sm:p-6">
      <SeoHead meta={{ noindex: true }} />
      {isAuthenticated && showForm && (
        <div className="fixed top-4 right-4 z-50">
          <button
            onClick={async () => {
              try { await logout() } catch (err) { console.error('Logout failed:', err) }
              setShowForm(false)
            }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-brand-surface border border-brand-border text-brand-text-muted text-[10px] font-mono uppercase tracking-wider hover:text-brand-text-primary hover:border-brand-gold transition-all cursor-pointer"
          >
            <LogOut size={12} /> Sign in as different user
          </button>
        </div>
      )}
      <SignIn variant="platform" onSuccess={() => {}} />
    </div>
  );
}
