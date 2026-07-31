import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import SignIn from "../components/SignIn";
import SeoHead from "../components/SeoHead";
import { useAuth } from "../hooks/useAuth";

export default function SignInPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/platform", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  return (
    <div className="min-h-screen bg-brand-bg flex items-center justify-center p-6">
      <SeoHead meta={{ noindex: true }} />
      <SignIn variant="platform" onSuccess={() => {}} />
    </div>
  );
}
