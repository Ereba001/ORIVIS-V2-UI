import { useState, useEffect } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import {
  Menu, X, Shield, Sun, Moon
} from "lucide-react";
import OrivisLogo from "../components/OrivisLogo";
import Footer from "../components/Footer";
import GetStartedModal from "../components/GetStartedModal";
import { useTheme } from "../contexts/ThemeProvider";

const navLinks = [
  { name: "Home", path: "/" },
  { name: "Governance Centre", path: "/governance" },
  { name: "About Us", path: "/about" },
  { name: "Contact Us", path: "/contact" }
];

const publicPaths = ["/", "/governance", "/about", "/contact"];

export default function PublicLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [howItWorksOpen, setHowItWorksOpen] = useState(false);
  const [getStartedOpen, setGetStartedOpen] = useState(false);
  const { theme, toggle } = useTheme();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const isMainPage = publicPaths.includes(location.pathname);
  return (
    <div className="min-h-screen bg-brand-bg flex flex-col font-sans antialiased selection:bg-brand-gold selection:text-brand-bg-secondary relative">
      <div className="absolute inset-0 bg-[radial-gradient(#FFFFFF/0.03_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

        <nav className={`${
        isScrolled
          ? "fixed top-0 left-0 right-0 glass border-b border-brand-border overflow-hidden flex items-center h-14"
          : "fixed top-0 left-0 right-0 bg-transparent border-b border-transparent"
        } z-50 w-full px-4 sm:px-6 md:px-12 transition-all duration-300`} aria-label="Main navigation">
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between gap-4">
          <a
            href="/"
            onClick={(e) => { e.preventDefault(); navigate("/"); }}
            className="flex items-center gap-1.5 sm:gap-2 group shrink-0"
          >
            <OrivisLogo size="xl" className="transition-transform duration-300 group-hover:scale-105" />
          </a>

          {isMainPage && (
            <div className="hidden md:flex items-center gap-0.5 lg:gap-1 bg-brand-surface px-1 lg:px-1.5 py-1 lg:py-1.5 rounded-full border border-brand-border">
              {navLinks.map((link) => {
                const isCurrent = location.pathname === link.path;
                return (
                  <button
                    key={link.path}
                    onClick={() => navigate(link.path)}
                    className={`px-3 lg:px-4 py-1.5 lg:py-2 rounded-full text-[11px] lg:text-xs font-semibold transition-all cursor-pointer ${
                      isCurrent
                        ? "bg-brand-gold text-brand-bg-secondary"
                        : "text-brand-text-muted hover:bg-brand-gold hover:text-brand-bg-secondary"
                    }`}
                  >
                    {link.name}
                  </button>
                );
              })}
            </div>
          )}

          {isMainPage ? (
            <div className="hidden md:flex items-center gap-2 lg:gap-3 shrink-0">
              <motion.button
                onClick={toggle}
                whileTap={{ scale: 0.9 }}
                className="relative w-9 h-9 rounded-full bg-brand-surface border border-brand-border flex items-center justify-center text-brand-text-muted hover:text-brand-text-primary hover:border-brand-gold/30 transition-all cursor-pointer shrink-0"
                aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
              >
                <motion.span
                  key={theme}
                  initial={{ rotate: -90, opacity: 0, scale: 0.5 }}
                  animate={{ rotate: 0, opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                >
                  {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
                </motion.span>
              </motion.button>
              <motion.button
                onClick={() => setHowItWorksOpen(true)}
                whileHover="hover"
                initial="rest"
                className="relative overflow-hidden bg-brand-surface text-brand-text-primary border border-brand-border px-3 lg:px-5 py-2 lg:py-2.5 rounded-full text-[11px] lg:text-xs font-semibold shadow-sm cursor-pointer hover:scale-102 active:scale-98 transition-all"
              >
                <motion.span
                  variants={{
                    rest: { scale: 0, rotate: 0, x: "-50%", y: "-50%" },
                    hover: { scale: 1.4, rotate: 180, x: "-50%", y: "-50%" }
                  }}
                  transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                  className="absolute top-1/2 left-1/2 w-48 h-48 rounded-[40%] bg-gradient-to-br from-brand-surface-elevated via-brand-surface to-brand-surface-elevated -z-10 pointer-events-none"
                />
                <span className="relative z-10 text-brand-text-primary">How It Works</span>
              </motion.button>

              <motion.button
                onClick={() => setGetStartedOpen(true)}
                whileHover="hover"
                initial="rest"
                className="relative overflow-hidden bg-brand-gold text-brand-bg-secondary px-3 lg:px-5 py-2 lg:py-2.5 rounded-full text-[11px] lg:text-xs font-semibold shadow-sm cursor-pointer hover:scale-102 active:scale-98 transition-all"
              >
                <motion.span
                  variants={{
                    rest: { scale: 0, rotate: 0, x: "-50%", y: "-50%" },
                    hover: { scale: 1.4, rotate: 180, x: "-50%", y: "-50%" }
                  }}
                  transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                  className="absolute top-1/2 left-1/2 w-48 h-48 rounded-[42%] bg-gradient-to-br from-brand-gold-hover via-brand-gold to-brand-gold-pressed -z-10 pointer-events-none"
                />
                <span className="relative z-10 text-brand-bg-secondary">Get Started</span>
              </motion.button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <motion.button
                onClick={toggle}
                whileTap={{ scale: 0.9 }}
                className="w-9 h-9 rounded-full bg-brand-surface border border-brand-border flex items-center justify-center text-brand-text-muted hover:text-brand-text-primary hover:border-brand-gold/30 transition-all cursor-pointer shrink-0"
                aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
              >
                <motion.span
                  key={theme}
                  initial={{ rotate: -90, opacity: 0, scale: 0.5 }}
                  animate={{ rotate: 0, opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                >
                  {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
                </motion.span>
              </motion.button>
              <motion.button
                onClick={() => window.location.href = "/"}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="relative overflow-hidden bg-brand-surface-elevated text-brand-text-primary px-4 py-2 sm:px-5 sm:py-2.5 rounded-full text-[11px] lg:text-xs font-semibold shadow-sm hover:bg-brand-surface-interactive transition-all cursor-pointer flex items-center gap-1.5"
              >
                <span>Back</span>
              </motion.button>
            </div>
          )}

          {isMainPage && (
            <div className="md:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-full hover:bg-brand-surface text-brand-text-primary transition-colors focus:outline-none cursor-pointer"
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          )}

      <AnimatePresence mode="popLayout">
            {isMainPage && mobileMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className={`absolute ${
                  isScrolled ? "top-[68px]" : "top-[130px]"
                } left-0 right-0 w-full glass-strong border-b border-brand-border p-6 shadow-xl flex flex-col gap-4 z-40 md:hidden`}
              >
                <div className="flex flex-col gap-2">
                  {navLinks.map((link) => {
                    const isCurrent = location.pathname === link.path;
                    return (
                      <button
                        key={link.path}
                        onClick={() => {
                          navigate(link.path);
                          setMobileMenuOpen(false);
                        }}
                        className={`px-4 py-2.5 text-sm font-semibold rounded-xl transition-all text-left ${
                          isCurrent
                            ? "bg-brand-gold text-brand-bg-secondary"
                            : "text-brand-text-muted hover:bg-brand-gold hover:text-brand-bg-secondary"
                        }`}
                      >
                        {link.name}
                      </button>
                    );
                  })}
                </div>
                <hr className="border-brand-divider" />
                <div className="flex items-center justify-between gap-3 pt-1">
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      setHowItWorksOpen(true);
                    }}
                    className="w-full bg-brand-surface hover:bg-brand-surface-elevated text-brand-text-primary border border-brand-border py-2.5 rounded-xl text-xs font-semibold text-center transition-colors shadow-sm cursor-pointer"
                  >
                    How It Works
                  </button>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      setGetStartedOpen(true);
                    }}
                    className="w-full bg-brand-gold hover:bg-brand-gold-hover text-brand-bg-secondary py-2.5 rounded-xl text-xs font-semibold text-center transition-colors shadow-sm cursor-pointer"
                  >
                    Get Started
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </nav>

      <button
        id="orivis-how-it-works-trigger"
        onClick={() => setHowItWorksOpen(true)}
        style={{ display: "none" }}
        aria-hidden="true"
      />

      <div className="flex flex-col flex-grow w-full">
        <Outlet key={location.pathname} />
      </div>

      <Footer />

      <GetStartedModal open={getStartedOpen} onClose={() => setGetStartedOpen(false)} />

      <AnimatePresence>
        {howItWorksOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
          >
            <div className="absolute inset-0" onClick={() => setHowItWorksOpen(false)} />

            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="relative w-full max-w-2xl glass rounded-[28px] overflow-hidden shadow-brand-lg z-10 flex flex-col text-brand-text-primary"
            >
              <div className="flex items-center justify-between border-b border-brand-border px-6 py-5 bg-brand-surface">
                <div className="flex flex-col gap-0.5">
                  <span className="text-[9px] font-mono font-bold tracking-widest text-brand-text-muted uppercase">Platform Overview</span>
                  <h3 className="font-sans font-extrabold text-lg uppercase tracking-tight text-brand-text-primary">How Orivis Works</h3>
                </div>
                <button
                  onClick={() => setHowItWorksOpen(false)}
                  className="w-8 h-8 rounded-full bg-brand-surface hover:bg-brand-surface-elevated flex items-center justify-center transition-colors cursor-pointer"
                  aria-label="Close modal"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="p-6 md:p-8 overflow-y-auto max-h-[60vh] flex flex-col gap-6 font-sans">
                <p className="text-xs text-brand-text-secondary leading-relaxed">
                  Orivis is a governance technology platform that helps organizations conduct secure elections, approvals, consultations, and decision-making events with confidence. Every action is traceable, verifiable, and accountable.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                  <div className="bg-brand-surface border border-brand-border rounded-[20px] p-5 flex flex-col gap-3">
                    <div className="w-8 h-8 rounded-full bg-brand-gold text-brand-bg-secondary flex items-center justify-center text-xs font-bold font-mono">01</div>
                    <h4 className="font-bold text-xs uppercase tracking-tight text-brand-text-primary">Organizations Set Up</h4>
                    <p className="text-[10px] text-brand-text-muted leading-relaxed">
                      Organizations create an isolated workspace, configure elections, upload voter registers, and add candidates or proposals. Every election passes a review process before going live.
                    </p>
                  </div>
                  <div className="bg-brand-surface border border-brand-border rounded-[20px] p-5 flex flex-col gap-3">
                    <div className="w-8 h-8 rounded-full bg-brand-gold text-brand-bg-secondary flex items-center justify-center text-xs font-bold font-mono">02</div>
                    <h4 className="font-bold text-xs uppercase tracking-tight text-brand-text-primary">Voters Participate</h4>
                    <p className="text-[10px] text-brand-text-muted leading-relaxed">
                      Verified participants sign in, review candidates or proposals, and cast their decision during the scheduled period. Each vote is encrypted and recorded. A receipt is generated as confirmation.
                    </p>
                  </div>
                  <div className="bg-brand-surface border border-brand-border rounded-[20px] p-5 flex flex-col gap-3">
                    <div className="w-8 h-8 rounded-full bg-brand-gold text-brand-bg-secondary flex items-center justify-center text-xs font-bold font-mono">03</div>
                    <h4 className="font-bold text-xs uppercase tracking-tight text-brand-text-primary">Results Are Verified</h4>
                    <p className="text-[10px] text-brand-text-muted leading-relaxed">
                      Once an election ends, results are generated and validated. Published outcomes include cryptographic receipts so every participant can verify their vote was counted without revealing their choice.
                    </p>
                  </div>
                </div>

                <div className="bg-brand-surface-elevated text-brand-text-secondary rounded-[18px] p-4 flex gap-3 items-center mt-2">
                  <Shield size={20} className="shrink-0 text-brand-text-muted" />
                  <p className="text-[10px] leading-relaxed">
                    <strong>Trusted & Transparent:</strong> Orivis is designed for organizations that need verifiable decision-making, without compromising voter privacy or platform security.
                  </p>
                </div>
              </div>

              <div className="border-t border-brand-border px-6 py-4 bg-brand-surface flex justify-end">
                <button
                  onClick={() => setHowItWorksOpen(false)}
                  className="bg-brand-gold text-brand-bg-secondary text-xs font-bold uppercase tracking-widest px-6 py-2.5 rounded-full hover:bg-brand-gold-hover transition-colors cursor-pointer"
                >
                  Understood
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
