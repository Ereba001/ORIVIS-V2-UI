import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import SignIn from "../components/SignIn";
import SeoHead from "../components/SeoHead";
import { useAuth } from "../hooks/useAuth";
import { getOrgHomeRoute } from "../lib/navigation";

export default function OrgSignInPage() {
  const navigate = useNavigate();
  const { isAuthenticated, user, memberships } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      navigate(getOrgHomeRoute(user, memberships), { replace: true });
    }
  }, [isAuthenticated, user, memberships, navigate]);

  return (
    <div className="min-h-screen bg-brand-bg flex items-center justify-center p-4 sm:p-6">
      <SeoHead meta={{ noindex: true }} />
      <SignIn variant="organization" onSuccess={() => {}} />
    </div>
  );
}
