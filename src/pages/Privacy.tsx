import React from "react";
import { motion } from "motion/react";
import TextureBg from "../components/TextureBg";
import SeoHead from "../components/SeoHead";
import { breadcrumbListSchema } from "../seo/schema";
import { ArrowLeft } from "lucide-react";

export default function Privacy() {
  return (
    <motion.main
      key="privacy"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="w-full flex-grow flex flex-col pt-24"
    >
      <SeoHead jsonLd={[
        breadcrumbListSchema([
          { name: "Home", url: "/" },
          { name: "Privacy Policy", url: "/privacy" },
        ]),
      ]} />
      <div className="w-full bg-brand-surface py-24 border-b border-brand-border relative overflow-hidden">
        <TextureBg src="https://images.unsplash.com/photo-1772775756679-34a0716ae0d9?q=80&w=1600&auto=format&fit=crop" opacity={0.22} />
        <div className="max-w-4xl mx-auto px-6 text-center flex flex-col gap-4">
          <span className="text-[10px] font-mono tracking-widest uppercase text-brand-text-muted font-bold">Your Privacy Matters</span>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-display font-bold uppercase text-brand-text-primary">
            Privacy Policy
          </h1>
          <p className="text-sm text-brand-text-muted max-w-xl mx-auto leading-relaxed uppercase tracking-wider">
            How we protect your data and keep your votes private.
          </p>
        </div>
      </div>

      <div className="w-full bg-brand-bg-secondary py-20 relative overflow-hidden">
        <TextureBg src="https://images.unsplash.com/photo-1771924310799-930349452c76?q=80&w=1600&auto=format&fit=crop" opacity={0.18} />
        <div className="max-w-4xl mx-auto px-6 flex flex-col gap-12">
          {[
            { title: "1. Your Vote is Private", text: "Your identity is never linked to your vote. When you cast a ballot, the system separates who you are from what you chose. No one can match your vote back to you." },
            { title: "2. How Verification Works", text: "We verify your identity when you sign in using standard methods like passwords or OTP codes. Once verified, the system gives you a one-time credential to vote. This credential proves you are eligible without revealing who you are." },
            { title: "3. Encrypted on Your Device", text: "Your vote is encrypted on your own device before it is sent. This means even we cannot see your selection. Only the final results are decrypted and shared." },
            { title: "4. No Tracking", text: "We do not use analytics trackers, ads, or share your data with third parties. Basic system data is collected for performance and is deleted after each voting round ends." },
            { title: "5. Public Verification", text: "Vote totals are published so results can be verified by anyone. But these public records contain no personal information. Your identity and your vote remain separate." },
            { title: "6. Compliance & Contact", text: "We support compliance with data protection regulations like GDPR and CCPA. For privacy-related questions, reach us at privacy@orivis.org." }
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
