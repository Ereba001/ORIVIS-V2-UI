import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import SignIn from "../components/SignIn";
import SeoHead from "../components/SeoHead";
import { useAuth } from "../hooks/useAuth";

export default function OrgSignInPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/workspace", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  return (
    <div className="min-h-screen bg-brand-bg flex items-center justify-center p-6">
      <SeoHead meta={{ noindex: true }} />
      <SignIn variant="organization" onSuccess={() => {}} />
    </div>
  );
}
