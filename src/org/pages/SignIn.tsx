import { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import AuthLayout from "../../components/auth/AuthLayout"
import AuthHeroIllustration from "../../components/auth/AuthHeroIllustration"
import SignIn from "../../components/SignIn"
import SeoHead from "../../components/SeoHead"
import { useAuth } from "../../hooks/useAuth"

export default function OrgSignInPage() {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/org/dashboard", { replace: true })
    }
  }, [isAuthenticated, navigate])

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
      <SignIn variant="organization" onSuccess={() => navigate("/org/dashboard", { replace: true })} />
    </AuthLayout>
  )
}
