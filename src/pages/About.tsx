import { motion } from "motion/react";
import TextureBg from "../components/TextureBg";
import SeoHead from "../components/SeoHead";
import { organizationSchema, breadcrumbListSchema } from "../seo/schema";
import { Shield, Eye, Lock, Users, Globe, CheckCircle } from "lucide-react";

const values = [
  { icon: Eye, label: "Transparency", desc: "Every action is traceable and publicly verifiable. No hidden processes, no black boxes." },
  { icon: Shield, label: "Trust", desc: "Cryptographic verification ensures integrity without intermediaries. Results you can rely on." },
  { icon: Lock, label: "Accountability", desc: "Immutable audit trails for every governance action, from vote to result." },
  { icon: Globe, label: "Neutrality", desc: "Platform-agnostic, organization-owned, and politically unaffiliated. Your data stays yours." },
  { icon: Users, label: "Accessibility", desc: "Designed for voters of all technical skill levels. Simple, intuitive, inclusive." },
];

const customers = [
  { name: "Governments", use: "Public elections, referendums, civic participation" },
  { name: "Universities", use: "Student elections, senate voting, faculty leadership" },
  { name: "Corporations", use: "Board resolutions, shareholder voting, internal governance" },
  { name: "NGOs & Associations", use: "Member elections, policy approvals, leadership appointments" },
];

export default function About() {
  return (
    <motion.main
      key="about"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="w-full flex-grow flex flex-col pt-24"
    >
      <SeoHead jsonLd={[
        organizationSchema(),
        breadcrumbListSchema([
          { name: "Home", url: "/" },
          { name: "About", url: "/about" },
        ]),
      ]} />
      {/* Hero */}
      <div className="w-full bg-brand-surface py-24 sm:py-28 border-b border-brand-border relative overflow-hidden">
        <TextureBg src="https://images.unsplash.com/photo-1773429492523-20d3d5df05b8?q=80&w=1600&auto=format&fit=crop" opacity={0.2} />
        <div className="max-w-4xl mx-auto px-6 text-center flex flex-col gap-5 relative z-10">
          <span className="text-[10px] sm:text-[11px] font-mono tracking-[0.2em] uppercase text-brand-gold font-bold">Powering Trusted Decisions</span>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-display font-bold uppercase text-brand-text-primary leading-[1.05]">
            About Orivis
          </h1>
          <p className="text-xs sm:text-sm text-brand-text-muted max-w-2xl mx-auto leading-relaxed uppercase tracking-wider">
            We enable organizations to conduct transparent, verifiable, and trusted decision making processes through secure digital governance tools.
          </p>
        </div>
      </div>

      {/* Mission & Vision */}
      <div className="w-full bg-brand-surface-elevated text-brand-text-primary py-20 sm:py-24 relative overflow-hidden">
        <TextureBg src="https://images.unsplash.com/photo-1765408217205-1c42d81f1677?q=80&w=1600&auto=format&fit=crop" opacity={0.18} />
        <div className="max-w-4xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-14 relative z-10">
          <div className="flex flex-col gap-3">
            <span className="text-[10px] font-mono tracking-widest uppercase text-brand-gold font-bold">Our Mission</span>
            <p className="text-sm sm:text-base text-brand-text-muted leading-relaxed">
              To enable organizations to conduct transparent, verifiable, and trusted decision making processes through secure digital governance tools.
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <span className="text-[10px] font-mono tracking-widest uppercase text-brand-gold font-bold">Our Vision</span>
            <p className="text-sm sm:text-base text-brand-text-muted leading-relaxed">
              To become the global standard for trusted digital governance and decision making.
            </p>
          </div>
        </div>
      </div>

      {/* Brand Promise */}
      <div className="w-full bg-brand-surface border-y border-brand-border py-16 sm:py-20 relative overflow-hidden">
        <TextureBg src="https://images.unsplash.com/photo-1771924310799-930349452c76?q=80&w=1600&auto=format&fit=crop" opacity={0.15} />
        <div className="max-w-3xl mx-auto px-6 text-center relative z-10">
          <div>
            <div className="inline-flex items-center gap-3 mb-4">
              <CheckCircle size={20} className="text-brand-gold" />
              <span className="text-[10px] font-mono tracking-widest uppercase text-brand-gold font-bold">Brand Promise</span>
            </div>
            <p className="text-xl sm:text-2xl md:text-3xl font-sans font-bold text-brand-text-primary uppercase tracking-tight">
              Every decision can be trusted.
            </p>
            <p className="text-xs sm:text-sm text-brand-text-muted max-w-lg mx-auto mt-4 leading-relaxed">
              Orivis is a governance technology platform that helps governments, universities, corporations, NGOs, and associations conduct elections, approvals, consultations, and decision making events with confidence.
            </p>
          </div>
        </div>
      </div>

      {/* Core Values */}
      <div className="w-full bg-brand-bg-secondary py-20 sm:py-24 relative overflow-hidden">
        <TextureBg src="https://images.unsplash.com/photo-1772775756679-34a0716ae0d9?q=80&w=1600&auto=format&fit=crop" opacity={0.15} />
        <div className="max-w-5xl mx-auto px-6 relative z-10">
          <div className="text-center mb-14">
            <span className="text-[10px] sm:text-[11px] font-mono tracking-[0.2em] uppercase text-brand-gold font-bold">Our Values</span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-display font-bold uppercase text-brand-text-primary mt-3 leading-[1.1]">
              What We Stand For
            </h2>
          </div>
          <div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
              {values.map((v, i) => (
                <div key={i} className="glass-card rounded-2xl p-5 sm:p-6 flex flex-col gap-3">
                  <v.icon size={18} className="text-brand-gold shrink-0" />
                  <div>
                    <h3 className="font-sans font-bold text-sm text-brand-text-primary uppercase tracking-wider">{v.label}</h3>
                    <p className="text-xs text-brand-text-muted leading-relaxed mt-1">{v.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Who We Serve */}
      <div className="w-full bg-brand-surface-elevated py-20 sm:py-24 relative overflow-hidden">
        <TextureBg src="https://images.unsplash.com/photo-1773429492523-20d3d5df05b8?q=80&w=1600&auto=format&fit=crop" opacity={0.15} />
        <div className="max-w-5xl mx-auto px-6 relative z-10">
          <div className="text-center mb-14">
            <span className="text-[10px] sm:text-[11px] font-mono tracking-[0.2em] uppercase text-brand-gold font-bold">Who We Serve</span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-display font-bold uppercase text-brand-text-primary mt-3 leading-[1.1]">
              Built For Every Organization
            </h2>
          </div>
          <div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
              {customers.map((c, i) => (
                <div key={i} className="glass-card rounded-2xl p-5 sm:p-6 flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-brand-gold/10 border border-brand-gold/20 flex items-center justify-center shrink-0 mt-0.5">
                    <Users size={16} className="text-brand-gold" />
                  </div>
                  <div>
                    <h3 className="font-sans font-bold text-sm text-brand-text-primary uppercase tracking-wider">{c.name}</h3>
                    <p className="text-xs text-brand-text-muted leading-relaxed mt-1">{c.use}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.main>
  );
}
