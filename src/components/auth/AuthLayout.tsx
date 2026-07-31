import { motion } from "motion/react";
import OrivisLogo from "../OrivisLogo";
import TextureBg from "../TextureBg";
import AuthHeroIllustration from "./AuthHeroIllustration";
import bgHero from "../../assets/images/bg-hero.jpg";

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
  variant?: "platform" | "organization";
  heroContent?: React.ReactNode;
}

function Particles() {
  const items = Array.from({ length: 20 }).map((_, i) => ({
    id: i,
    size: Math.random() * 3 + 1.5,
    x: Math.random() * 100,
    y: Math.random() * 100,
    duration: Math.random() * 25 + 15,
    delay: Math.random() * -20,
    drift: (Math.random() - 0.5) * 30,
  }));

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
      {items.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full bg-white/20 blur-[0.5px]"
          style={{ width: p.size, height: p.size, left: `${p.x}%`, top: `${p.y}%` }}
          animate={{ y: [0, -80, 0], x: [0, p.drift, 0], opacity: [0.1, 0.6, 0.1], scale: [1, 1.2, 1] }}
          transition={{ duration: p.duration, repeat: Infinity, delay: p.delay, ease: "easeInOut" }}
        />
      ))}
    </div>
  );
}

export default function AuthLayout({ children, title, subtitle, variant = "platform", heroContent }: AuthLayoutProps) {
  const currentYear = new Date().getFullYear();

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row bg-brand-bg">
      <div className="w-full md:w-[65%] min-h-screen flex flex-col bg-brand-surface">
        <div className="flex items-center justify-between px-8 pt-8 pb-0">
          <div className="flex items-center gap-3">
            <OrivisLogo size="sm" className="text-brand-text-primary" />
          </div>
          <span className="text-[10px] font-mono uppercase tracking-widest text-brand-text-muted font-medium">
            {variant === "organization" ? "Organization" : "Platform"}
          </span>
        </div>

        <div className="flex-1 flex items-center justify-center px-8 py-12">
          <div className="w-full max-w-2xl">
            <div className="mb-8">
              <h1 className="font-display font-black text-2xl uppercase tracking-tight text-brand-text-primary">
                {title}
              </h1>
              <p className="text-sm text-brand-text-muted mt-1.5">
                {subtitle}
              </p>
            </div>
            {children}
          </div>
        </div>

        <div className="px-8 pb-8 pt-0">
          <div className="flex items-center justify-between text-[10px] font-mono tracking-wider text-brand-text-disabled uppercase">
            <span>&copy; {currentYear} ORIVIS PROTOCOL</span>
            <div className="flex gap-4">
              <a href="/" className="hover:text-brand-text-primary transition-colors">Home</a>
              <a href="/privacy" className="hover:text-brand-text-primary transition-colors">Privacy</a>
              <a href="/terms" className="hover:text-brand-text-primary transition-colors">Terms</a>
            </div>
          </div>
        </div>
      </div>

      <div className="hidden md:block md:w-[35%] min-h-screen relative overflow-hidden bg-cover bg-center"
        style={{ backgroundImage: `url(${bgHero})` }}>
        <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-black/50 to-black/80 z-0" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/20 z-0" />
        <Particles />

        <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
          <div className="absolute top-[-20%] right-[5%] w-[70%] h-[140%] bg-gradient-to-b from-white/[0.04] via-white/[0.005] to-transparent rotate-[-28deg] origin-top-right blur-[80px]"
            style={{ clipPath: "polygon(100% 0, 60% 0, 0 100%, 40% 100%)" }} />
        </div>

        {heroContent ? (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center text-center px-12"
            style={{
              "--ill-gold": "#FCA311",
              "--ill-blue": "#3B82F6",
              "--ill-blue-hover": "#60A5FA",
              "--ill-green": "#22C55E",
            } as React.CSSProperties}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="max-w-md"
            >
              {heroContent}
            </motion.div>
          </div>
        ) : (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center text-center px-12"
            style={{
              "--ill-gold": "#FCA311",
              "--ill-blue": "#3B82F6",
              "--ill-blue-hover": "#60A5FA",
              "--ill-green": "#22C55E",
            } as React.CSSProperties}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="max-w-md"
            >
              <AuthHeroIllustration variant={variant} />
            </motion.div>
          </div>
        )}

        <div className="absolute bottom-0 inset-x-0 h-32 bg-gradient-to-t from-brand-bg to-transparent z-10" />
      </div>
    </div>
  );
}
