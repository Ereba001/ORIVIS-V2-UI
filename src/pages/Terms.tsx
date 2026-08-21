import { motion } from "motion/react";
import TextureBg from "../components/TextureBg";
import SeoHead from "../components/SeoHead";
import { breadcrumbListSchema } from "../seo/schema";
import { ArrowLeft } from "lucide-react";

export default function Terms() {
  return (
    <motion.main
      key="terms"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="w-full flex-grow flex flex-col pt-24"
    >
      <SeoHead jsonLd={[
        breadcrumbListSchema([
          { name: "Home", url: "/" },
          { name: "Terms of Service", url: "/terms" },
        ]),
      ]} />
      <div className="w-full bg-brand-surface py-24 border-b border-brand-border relative overflow-hidden">
        <TextureBg src="https://images.unsplash.com/photo-1773429492523-20d3d5df05b8?q=80&w=1600&auto=format&fit=crop" opacity={0.2} />
        <div className="max-w-4xl mx-auto px-6 text-center flex flex-col gap-4">
          <span className="text-[10px] font-mono tracking-widest uppercase text-brand-text-muted font-bold">Terms & Conditions</span>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-display font-bold uppercase text-brand-text-primary">
            Terms of Service
          </h1>
          <p className="text-sm text-brand-text-muted max-w-xl mx-auto leading-relaxed uppercase tracking-wider">
            The rules and guidelines for using the Orivis platform.
          </p>
        </div>
      </div>

      <div className="w-full bg-brand-bg-secondary py-20 relative overflow-hidden">
        <TextureBg src="https://images.unsplash.com/photo-1765408217205-1c42d81f1677?q=80&w=1600&auto=format&fit=crop" opacity={0.18} />
        <div className="max-w-4xl mx-auto px-6 flex flex-col gap-12">
          {[
            { title: "1. Acceptance of Terms", text: "By using Orivis, you agree to these terms. If you are signing up for an organization, you confirm you have the authority to do so on their behalf." },
            { title: "2. Voter Lists", text: "Organizations are responsible for keeping their voter lists accurate. Orivis helps verify participants without exposing their identities, but the organization owns the accuracy of their roster." },
            { title: "3. Prohibited Activities", text: "You may not attempt to disrupt, bypass, or exploit the Orivis platform. This includes trying to vote more than once, tampering with the system, or trying to uncover how someone voted. Any abuse will result in account suspension." },
            { title: "4. Service Availability", text: "Orivis is provided as-is and as-available. We work hard to keep the platform secure and reliable, but we cannot guarantee it will be error-free or compliant with every local voting law." },
            { title: "5. Limitation of Liability", text: "Orivis is not liable for losses resulting from system downtime, user errors, or administrative mistakes made by organizations using the platform. We take reasonable measures to prevent issues but cannot cover every scenario." },
            { title: "6. Account Termination", text: "We reserve the right to suspend or terminate accounts that violate these terms, abuse the platform, or attempt to compromise the system." }
          ].map((section, i) => (
            <div key={i} className="flex flex-col gap-4">
              <h2 className="text-lg font-bold text-brand-text-primary uppercase tracking-wider font-display">
                {section.title}
              </h2>
              <p className="text-xs text-brand-text-secondary leading-relaxed">
                {section.text}
              </p>
            </div>
          ))}

          <div className="flex justify-center pt-8 border-t border-brand-divider">
            <button
              onClick={() => window.location.href = "/"}
              className="flex items-center gap-2 bg-brand-gold text-brand-bg-secondary text-xs font-bold uppercase tracking-widest px-8 h-12 rounded-full hover:bg-brand-gold-hover active:scale-95 transition-all duration-200 cursor-pointer"
            >
              <ArrowLeft size={14} />
              <span>Back to Home</span>
            </button>
          </div>
        </div>
      </div>
    </motion.main>
  );
}
