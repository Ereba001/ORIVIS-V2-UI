import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import TextureBg from "../components/TextureBg";
import FaqSection from "../components/FaqSection";
import SeoHead from "../components/SeoHead";
import { organizationSchema, websiteSchema, faqPageSchema } from "../seo/schema";
import {
  ArrowUpRight,
  Shield,
  Users,
  Activity,
  Eye,
  Lock,
  Globe,
  GraduationCap,
  Building2,
  Heart,
  Landmark,
  ArrowRight,
  CheckCircle2
} from "lucide-react";
import GetStartedModal from "../components/GetStartedModal";
import heroBg from "../assets/images/bg-hero.jpg";

function AnimatedCounter({ value }: { value: string }) {
  const [count, setCount] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);

  const match = value.match(/^([\d.,]+)(.+)?$/);
  const rawNumStr = match ? match[1].replace(/,/g, "") : "0";
  const suffix = match ? match[2] || "" : "";
  const isDecimal = rawNumStr.includes(".");
  const target = parseFloat(rawNumStr) || 0;

  return (
    <motion.span
      onViewportEnter={() => {
        if (!hasAnimated) {
          setHasAnimated(true);
          const duration = 1500;
          const startTime = performance.now();
          const step = (now: number) => {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const ease = progress * (2 - progress);
            setCount(ease * target);
            if (progress < 1) {
              requestAnimationFrame(step);
            } else {
              setCount(target);
            }
          };
          requestAnimationFrame(step);
        }
      }}
      viewport={{ once: true, margin: "-50px" }}
    >
      {isDecimal ? count.toFixed(2) : Math.floor(count).toLocaleString()}
      {suffix}
    </motion.span>
  );
}

export default function Home() {
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);
  const [activeSlide, setActiveSlide] = useState(0);
  const [hoveredOrgIndex, setHoveredOrgIndex] = useState<number | null>(null);
  const [getStartedOpen, setGetStartedOpen] = useState(false);
  const [slideImgFailed, setSlideImgFailed] = useState(false);

  const organizations = [
    {
      id: "government",
      name: "Government",
      description: "Run public consultations, policy approvals, and citizen engagement at any scale.",
      badge: "Trusted",
      icon: Landmark,
    },
    {
      id: "universities",
      name: "Universities",
      description: "Simple tools for student elections, faculty votes, and academic decision making.",
      badge: "Popular",
      icon: GraduationCap,
    },
    {
      id: "corporations",
      name: "Corporations",
      description: "Board resolutions, shareholder votes, and internal policy approvals made easy.",
      badge: "Enterprise",
      icon: Building2,
    },
    {
      id: "associations",
      name: "Associations",
      description: "Leadership elections, membership votes, and committee decisions.",
      badge: "Trusted",
      icon: Users,
    },
    {
      id: "nonprofits",
      name: "Non-Profits",
      description: "Policy voting, grant approvals, and stakeholder consultations.",
      badge: "Verified",
      icon: Heart,
    }
  ];

  const slides = [
    {
      id: "trust",
      badge: "TRUST",
      icon: Shield,
      heading: "Trusted Governance Infrastructure",
      caption: "A secure and transparent way for organizations to make decisions. Built to be reliable and trustworthy, so every vote counts as cast.",
      image: "https://images.unsplash.com/photo-1497366811353-6870744d04b2?q=80&w=1600&auto=format&fit=crop"
    },
    {
      id: "transparency",
      badge: "TRANSPARENT",
      icon: Eye,
      heading: "Full Transparency",
      caption: "Every vote and proposal is recorded and can be verified. Your organization gets full visibility into the process, building trust at every step.",
      image: "https://images.unsplash.com/photo-1487958449943-2429e8be8625?q=80&w=1600&auto=format&fit=crop"
    },
    {
      id: "security",
      badge: "SECURITY",
      icon: Lock,
      heading: "Privacy & Protection",
      caption: "Your data stays private and protected. Strong encryption keeps every decision safe from interference, so you can run your elections with confidence.",
      image: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?q=80&w=1600&auto=format&fit=crop"
    },
    {
      id: "decentralization",
      badge: "RELIABLE",
      icon: Globe,
      heading: "Always Available",
      caption: "Built on a distributed system that stays online when you need it. No single point of failure means your elections keep running smoothly.",
      image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1600&auto=format&fit=crop"
    }
  ];

  const stats = [
    {
      id: 1,
      number: "350+",
      label: "Organizations Supported",
      badge: null,
      hasArrow: false,
    },
    {
      id: 2,
      number: "1.2M+",
      label: "Verified Participants",
      badge: "VERIFIED",
      hasArrow: false,
    },
    {
      id: 3,
      number: "48K+",
      label: "Governance Events",
      badge: "ACTIVE",
      hasArrow: false,
    },
    {
      id: 4,
      number: "99.99%",
      label: "Platform Reliability",
      badge: "RELIABLE",
      hasArrow: false,
      featured: true,
    }
  ];

  return (
    <motion.main
      key="home"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="w-full flex flex-col animate-fadeIn relative overflow-hidden"
    >
      <SeoHead jsonLd={[
        organizationSchema(),
        websiteSchema(),
        faqPageSchema([
          { q: "What is Orivis?", a: "Orivis is a governance technology platform that helps organizations conduct elections, approvals, consultations, and decision making events with trust and transparency. Every vote is cryptographically signed, immutably recorded, and publicly verifiable without compromising voter anonymity." },
          { q: "Who can use Orivis?", a: "Orivis serves governments, universities, corporations, NGOs, and associations worldwide. Any organization that needs to make trusted decisions can use the platform, from national referendums with millions of voters to boardroom resolutions with a handful of participants." },
          { q: "What types of events does Orivis support?", a: "Orivis supports elections (candidate selection), approvals (board resolutions, policy adoption), consultations (public feedback), referendums (constitutional changes), and surveys (sentiment analysis). Each event type has tailored workflows and verification requirements." },
          { q: "How does Orivis ensure votes are secure?", a: "Every vote is cryptographically signed and immutably recorded on an auditable ledger. Multiple identity verification tiers ensure only eligible voters participate. Results are verifiable without exposing how any individual voted." },
          { q: "Can votes be both anonymous and verifiable?", a: "Yes. Orivis uses cryptographic techniques that keep individual votes anonymous while allowing anyone to verify that all votes were counted correctly. This means outcomes can be trusted without compromising voter privacy." },
          { q: "Is Orivis only for government elections?", a: "No. Orivis is a global platform for any organization, not tied to any country, government, or political party. Universities use it for student elections, corporations for shareholder votes, NGOs for member decisions, and associations for council elections." },
          { q: "How does multi-tenant architecture work?", a: "Each organization operates in its own isolated workspace with its own elections, voters, branding, and settings. No organization can access another's data. This architecture supports thousands of organizations and millions of voters without compromising data isolation." },
        ]),
      ]} />
      <TextureBg src={heroBg} opacity={1} />
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 md:px-12 pt-28 sm:pt-32 pb-14 md:pb-16 flex flex-col gap-8 md:gap-14 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-12 items-end relative z-10 mt-2">
          <div className="lg:col-span-8 flex flex-col gap-4 md:gap-5">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="font-display font-bold uppercase text-4xl sm:text-5xl md:text-6xl lg:text-7xl leading-[0.9] tracking-[-0.01em] text-brand-text-primary"
            >
              Trusted Governance <br className="hidden sm:inline" />
              For Modern Organizations
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="font-sans font-medium text-xs sm:text-sm md:text-base text-brand-text-muted leading-relaxed max-w-xl uppercase tracking-wider"
            >
              A simple, secure platform for running elections, approvals, and decision making.
              Trusted by governments, universities, corporations, and associations worldwide.
            </motion.p>
          </div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="lg:col-span-4 flex flex-row lg:flex-col items-center lg:items-end justify-start lg:justify-end gap-3 w-full self-end lg:pb-3"
          >
            <motion.button
              onClick={() => setGetStartedOpen(true)}
              whileHover="hover"
              initial="rest"
              className="relative overflow-hidden bg-brand-gold text-brand-bg-secondary rounded-full h-12 px-8 text-xs font-bold uppercase tracking-widest shadow-md hover:scale-[1.03] active:scale-[0.98] transition-all duration-200 cursor-pointer flex items-center justify-center"
            >
              <motion.span
                variants={{
                  rest: { scale: 0, rotate: 0, x: "-50%", y: "-50%" },
                  hover: { scale: 1.4, rotate: 180, x: "-50%", y: "-50%" }
                }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="absolute top-1/2 left-1/2 w-48 h-48 rounded-[42%] bg-gradient-to-br from-brand-gold-hover via-amber-700 to-brand-gold-hover -z-10 pointer-events-none"
              />
              <span className="relative z-10">Get Started</span>
            </motion.button>

            <motion.button
              onClick={() => {
                const howItWorksBtn = document.getElementById("orivis-how-it-works-trigger");
                if (howItWorksBtn) howItWorksBtn.click();
              }}
              whileHover="hover"
              initial="rest"
              className="relative overflow-hidden bg-brand-surface border border-brand-border text-brand-text-primary rounded-full h-12 px-6 text-xs font-bold uppercase tracking-widest shadow-sm hover:scale-[1.03] active:scale-[0.98] transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5"
            >
              <motion.span
                variants={{
                  rest: { scale: 0, rotate: 0, x: "-50%", y: "-50%" },
                  hover: { scale: 1.4, rotate: 180, x: "-50%", y: "-50%" }
                }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="absolute top-1/2 left-1/2 w-48 h-48 rounded-[40%] bg-gradient-to-br from-brand-surface-elevated via-brand-surface-interactive to-brand-surface-elevated -z-10 pointer-events-none"
              />
              <span className="relative z-10">How It Works</span>
              <ArrowUpRight size={14} className="relative z-10 text-brand-text-primary" />
            </motion.button>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="relative aspect-[16/10] sm:aspect-[21/9] md:aspect-[2.5/1] w-full rounded-[20px] md:rounded-[32px] overflow-hidden shadow-2xl bg-brand-bg-secondary group"
        >
          <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-30 flex gap-2">
            {slides.map((_, idx) => (
              <button
                key={idx}
                onClick={() => { setActiveSlide(idx); setSlideImgFailed(false); }}
                className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                  activeSlide === idx ? "w-6 bg-white" : "w-2 bg-white/30 hover:bg-white/60"
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>

          <AnimatePresence mode="popLayout">
            {slideImgFailed ? (
              <div className="absolute inset-0 bg-brand-bg-secondary" />
            ) : (
              <motion.img
                key={activeSlide}
                src={slides[activeSlide].image}
                alt={slides[activeSlide].heading}
                initial={{ opacity: 0, scale: 1.05 }}
                animate={{ opacity: 0.4, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.6, ease: "easeInOut" }}
                className="absolute inset-0 w-full h-full object-cover object-center"
                referrerPolicy="no-referrer"
                onError={() => setSlideImgFailed(true)}
              />
            )}
          </AnimatePresence>

          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/20 mix-blend-multiply pointer-events-none z-10" />

          <div className="absolute bottom-4 left-4 right-4 sm:bottom-6 sm:left-6 sm:right-auto md:bottom-8 md:left-8 max-w-full sm:max-w-md md:max-w-lg z-20">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeSlide}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="backdrop-blur-md bg-black/45 border border-white/10 text-white rounded-[16px] md:rounded-[20px] p-5 sm:p-6 shadow-2xl flex flex-col gap-3"
              >
                <div className="flex items-center gap-1.5 self-start bg-white/10 border border-white/20 px-2.5 py-0.5 rounded-full">
                  {(() => {
                    const IconComponent = slides[activeSlide].icon;
                    return <IconComponent size={10} className="text-white/80" />;
                  })()}
                  <span className="text-[9px] font-mono font-medium tracking-widest text-white uppercase">
                    {slides[activeSlide].badge}
                  </span>
                </div>
                <h3 className="font-sans font-extrabold text-lg sm:text-xl text-white leading-tight">
                  {slides[activeSlide].heading}
                </h3>
                <p className="font-sans font-normal text-xs text-white/70 leading-relaxed">
                  {slides[activeSlide].caption}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

          <motion.button
            onClick={() => { setActiveSlide((prev) => (prev + 1) % slides.length); setSlideImgFailed(false); }}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 200, delay: 0.7 }}
            className="absolute bottom-6 right-6 md:bottom-8 md:right-8 w-12 h-12 md:w-16 md:h-16 rounded-full bg-brand-gold text-brand-bg-secondary flex items-center justify-center hover:bg-brand-gold-hover hover:rotate-45 transition-all duration-300 shadow-2xl z-20 group/btn cursor-pointer focus:outline-none"
            aria-label="Next platform attribute"
          >
            <ArrowUpRight size={24} className="text-brand-bg-secondary transition-transform" />
          </motion.button>
        </motion.div>
      </div>

      <div className="w-full bg-brand-bg-secondary border-y border-brand-border py-16 md:py-20 relative z-10 overflow-hidden">
        <TextureBg src="https://images.unsplash.com/photo-1772775756679-34a0716ae0d9?q=80&w=1600&auto=format&fit=crop" opacity={0.2} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12 w-full flex flex-col gap-10 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="flex flex-col md:flex-row md:items-end justify-between gap-4"
          >
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-text-muted">By the Numbers</span>
              <h2 className="font-display font-bold uppercase text-3xl md:text-4xl text-brand-text-primary">
                Our Reach
              </h2>
            </div>
            <p className="font-sans font-medium text-xs md:text-sm text-brand-text-muted max-w-md leading-relaxed uppercase tracking-wider">
              Real numbers from organizations that trust Orivis for their important decisions.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {stats.map((stat, idx) => {
              const isFeatured = stat.featured;
              const delay = 0.1 + idx * 0.05;
              return (
                <motion.div
                  key={stat.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: delay }}
                  onMouseEnter={() => setHoveredCard(stat.id)}
                  onMouseLeave={() => setHoveredCard(null)}
                  className={`rounded-[18px] md:rounded-[24px] p-6 md:p-8 flex flex-col justify-between relative overflow-hidden transition-all duration-300 aspect-[1.5/1] sm:aspect-square md:aspect-[1.3/1] ${
                    isFeatured
                      ? "bg-brand-surface-elevated text-brand-text-primary hover:bg-brand-surface-interactive shadow-xl border border-brand-border"
                      : "glass-card hover:bg-brand-surface-interactive text-brand-text-primary shadow-sm"
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    {stat.badge ? (
                      <div className={`px-2.5 py-0.5 rounded-full text-[9px] font-mono tracking-widest uppercase border ${
                        isFeatured
                          ? "border-brand-border text-brand-text-muted"
                          : "border-brand-border text-brand-text-muted"
                      }`}>
                        {stat.badge}
                      </div>
                    ) : (
                      <div />
                    )}
                    {stat.id === 1 && <Users size={14} className="text-brand-text-muted" />}
                    {stat.id === 2 && <CheckCircle2 size={14} className="text-brand-text-muted" />}
                    {stat.id === 3 && <Activity size={14} className="text-brand-text-muted" />}
                    {stat.id === 4 && <Shield size={14} className="text-brand-text-muted" />}
                  </div>

                  <div className="mt-auto flex flex-col gap-1 md:gap-2">
                    <div className="flex items-baseline justify-between">
                      <span className={`font-sans font-extrabold text-3xl sm:text-4xl md:text-5xl tracking-tight leading-none ${
                        isFeatured ? "text-brand-text-primary" : "text-brand-text-primary"
                      }`}>
                        <AnimatedCounter value={stat.number} />
                      </span>
                      {stat.hasArrow && (
                        <div className="w-8 h-8 rounded-full bg-brand-gold hover:bg-brand-gold-hover text-brand-bg-secondary flex items-center justify-center transition-all shadow-md">
                          <ArrowUpRight size={14} />
                        </div>
                      )}
                    </div>
                    <span className={`text-[10px] md:text-[11px] font-bold uppercase tracking-wider ${
                      isFeatured ? "text-brand-text-muted" : "text-brand-text-muted"
                    }`}>
                      {stat.label}
                    </span>
                  </div>

                  <div className={`absolute inset-0 pointer-events-none transition-opacity duration-500 bg-gradient-to-tr from-white/0 via-white/5 to-white/0 opacity-0 ${
                    hoveredCard === stat.id ? "opacity-100" : ""
                  }`} />
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="w-full bg-brand-bg-secondary border-b border-brand-border py-16 md:py-24 relative z-10 overflow-hidden">
        <TextureBg src="https://images.unsplash.com/photo-1771924310799-930349452c76?q=80&w=1600&auto=format&fit=crop" opacity={0.18} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12 w-full flex flex-col items-center justify-center gap-10 relative z-10">
          <div className="text-center max-w-2xl flex flex-col gap-3">
            <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-brand-text-muted font-mono">Who We Serve</span>
            <h2 className="font-display font-bold uppercase text-3xl md:text-5xl text-brand-text-primary tracking-tight">
              WHO USES ORIVIS
            </h2>
            <p className="font-sans font-medium text-xs md:text-sm text-brand-text-muted leading-relaxed uppercase tracking-wider max-w-lg mx-auto">
              Pick your organization type to see how Orivis can work for you.
            </p>
          </div>

          <div className="w-full">
            <div
              id="who-uses-orivis-grid"
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5 w-full mt-2"
              onMouseLeave={() => setHoveredOrgIndex(null)}
            >
            {organizations.map((org, idx) => {
              const IconComponent = org.icon;
              const isHovered = hoveredOrgIndex === idx;
              const isSomeCardHovered = hoveredOrgIndex !== null;
              const isOtherCardHovered = isSomeCardHovered && !isHovered;

              return (
                <motion.div
                  key={org.id}
                  id={`org-card-${idx}`}
                  onMouseEnter={() => setHoveredOrgIndex(idx)}
                  onTouchStart={() => setHoveredOrgIndex(idx)}
                  className={`relative overflow-hidden bg-brand-bg-secondary border rounded-[24px] p-6 shadow-md flex flex-col justify-between min-h-[350px] text-brand-text-primary transition-all duration-300 ease-out cursor-pointer ${
                    isOtherCardHovered
                      ? "filter blur-[3px] opacity-30 scale-[0.95]"
                      : isHovered
                        ? "scale-[1.05] border-brand-border bg-brand-surface shadow-xl z-20"
                        : "border-brand-border opacity-100 scale-100"
                  }`}
                >
                  <div className="absolute inset-0 bg-[radial-gradient(#ffffff/0.03_1px,transparent_1px)] [background-size:10px_10px] pointer-events-none rounded-[24px]" />

                  <div className="relative z-10 flex flex-col gap-5 h-full">
                    <div className="flex items-center justify-between">
                      <span className="text-[8px] font-mono font-bold tracking-widest uppercase border border-brand-border px-2.5 py-0.5 rounded-full text-brand-text-muted bg-brand-surface">
                        {org.badge}
                      </span>
                      <div className="flex gap-1">
                        {organizations.map((_, dotIdx) => (
                          <div
                            key={dotIdx}
                            className={`h-1 rounded-full transition-all duration-300 ${
                              idx === dotIdx ? "w-4 bg-brand-text-primary" : "w-1 bg-brand-text-disabled"
                            }`}
                          />
                        ))}
                      </div>
                    </div>

                    <div className="w-12 h-12 rounded-[14px] bg-brand-surface border border-brand-border flex items-center justify-center shadow-md text-brand-text-primary transition-colors duration-300">
                      <IconComponent size={22} className="text-brand-text-primary" />
                    </div>

                    <div className="flex flex-col gap-2 flex-grow">
                      <h4 className="font-sans font-bold text-base text-brand-text-primary leading-tight">
                        {org.name}
                      </h4>
                      <p className="font-sans text-[11px] text-brand-text-muted leading-relaxed font-light">
                        {org.description}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-brand-border mt-auto">
                      <span className="text-[9px] font-mono tracking-widest text-brand-text-disabled uppercase">
                        Tier 0{idx + 1}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const nextIdx = (idx + 1) % organizations.length;
                          setHoveredOrgIndex(nextIdx);
                          const el = document.getElementById(`org-card-${nextIdx}`);
                          if (el) {
                            el.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
                          }
                        }}
                        className="w-8 h-8 rounded-full bg-brand-gold text-brand-bg-secondary flex items-center justify-center hover:scale-110 active:scale-95 transition-all duration-200 cursor-pointer"
                        aria-label="Next category"
                      >
                        <ArrowRight size={14} className="text-brand-bg-secondary" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
        </div>
      </div>
      <FaqSection />
      <GetStartedModal open={getStartedOpen} onClose={() => setGetStartedOpen(false)} />
    </motion.main>
  );
}
