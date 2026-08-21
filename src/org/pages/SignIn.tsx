import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import AuthLayout from "../../components/auth/AuthLayout"
import AuthHeroIllustration from "../../components/auth/AuthHeroIllustration"
import SignIn from "../../components/SignIn"
import SeoHead from "../../components/SeoHead"
import { useAuth } from "../../hooks/useAuth"
import { getOrgHomeRoute } from "../../lib/navigation"
import { LogOut } from "lucide-react"

export default function OrgSignInPage() {
  const navigate = useNavigate()
  const { isAuthenticated, user, memberships, logout } = useAuth()
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    if (isAuthenticated && !showForm) {
      navigate(getOrgHomeRoute(user, memberships), { replace: true })
    }
  }, [isAuthenticated, user, memberships, navigate, showForm])

  if (isAuthenticated && !showForm) return null

  return (
    <AuthLayout
      title=""
      subtitle=""
      variant="organization"
      heroContent={
        <>
          <div className="mb-6">
            <AuthHeroIllustration variant="organization" />
          </div>
          <h2 className="text-3xl font-display font-bold text-white mb-3">Sign In to Your Organization</h2>
          <p className="text-sm text-white/60 leading-relaxed">
            Access your organization's workspace on ORIVIS.
          </p>
        </>
      }
    >
      <SeoHead meta={{ title: "Organization Sign In | ORIVIS", noindex: true }} />
      {isAuthenticated && showForm && (
        <div className="mb-4 flex justify-end">
          <button
            onClick={async () => { await logout(); setShowForm(false); }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-brand-surface border border-brand-border text-brand-text-muted text-[10px] font-mono uppercase tracking-wider hover:text-brand-text-primary hover:border-brand-gold transition-all cursor-pointer"
          >
            <LogOut size={12} /> Sign in as different user
          </button>
        </div>
      )}
      <SignIn variant="organization" onSuccess={() => navigate(getOrgHomeRoute(user, memberships), { replace: true })} />
    </AuthLayout>
  )
}
