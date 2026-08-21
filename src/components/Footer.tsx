import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import TextureBg from "./TextureBg";
import { 
  Smartphone, 
  Facebook, 
  Instagram, 
  Linkedin, 
  Twitter, 
  Youtube, 
  Send, 
  CheckCircle 
} from "lucide-react";
import OrivisLogo from "./OrivisLogo";
import logoUrl from "../assets/images/orivis-logo.svg"
import GetStartedModal from "./GetStartedModal";

export default function Footer() {
  const navigate = useNavigate();
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [getStartedOpen, setGetStartedOpen] = useState(false);
  const [fullName, setFullName] = useState("");
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !emailOrPhone || !message) return;
    
    setFormSubmitted(true);
    setTimeout(() => {
      setFullName("");
      setEmailOrPhone("");
      setMessage("");
    }, 2000);
  };

  return (
    <footer id="orivis-global-footer" className="w-full bg-brand-bg pt-16 pb-8 px-6 sm:px-8 md:px-12 lg:px-16 mt-16 relative overflow-hidden flex flex-col items-center justify-center">
      <TextureBg src="https://images.unsplash.com/photo-1772775756679-34a0716ae0d9?q=80&w=1600&auto=format&fit=crop" opacity={0.15} />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(59,130,246,0.06)_0%,transparent_60%),radial-gradient(ellipse_at_bottom_right,rgba(252,163,17,0.04)_0%,transparent_60%)] pointer-events-none" />
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-white/[0.01] rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-white/[0.01] rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-7xl flex flex-col gap-12 md:gap-16 relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="w-full relative overflow-hidden rounded-[24px] md:rounded-[32px] bg-gradient-to-br from-brand-surface-elevated to-brand-bg border border-brand-border p-8 md:p-12 text-center flex flex-col items-center gap-6 shadow-2xl"
        >
          <div className="absolute inset-0 bg-[radial-gradient(#ffffff/0.02_1px,transparent_1px)] [background-size:12px_12px] pointer-events-none rounded-[24px] md:rounded-[32px]" />

          <div className="relative z-10 flex flex-col items-center gap-3 max-w-2xl">
            <h3 className="font-display font-bold text-2xl md:text-4xl text-brand-text-primary tracking-tight uppercase leading-tight">
              The trusted platform for <span className="text-brand-text-muted">organizational decisions</span>
            </h3>
            <p className="font-sans text-xs md:text-sm text-brand-text-muted max-w-lg leading-relaxed">
              Run transparent elections and secure decision making processes your organization can trust. Simple to set up, verifiable every step of the way.
            </p>
          </div>

          <div className="relative z-10 flex flex-col sm:flex-row items-center gap-4 mt-2">
            <motion.button
              onClick={() => setGetStartedOpen(true)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="px-6 py-3 rounded-full bg-brand-gold text-brand-bg-secondary font-semibold text-xs transition-colors hover:bg-brand-gold-hover flex items-center gap-2 shadow-lg cursor-pointer animate-none"
            >
              Get Started with Orivis
            </motion.button>

            <div className="px-5 py-3 rounded-full bg-brand-surface border border-brand-border text-brand-text-muted text-xs font-mono tracking-wider flex items-center gap-2.5">
              <Smartphone size={14} className="text-brand-text-disabled animate-pulse" />
              <span>Mobile App Coming Soon</span>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-8 pt-6 relative z-10">
          
          <div className="lg:col-span-5 flex flex-col gap-6">
            <div className="flex items-center gap-2">
              <OrivisLogo size="lg" className="text-brand-text-primary" />
              <div className="w-1.5 h-1.5 rounded-full bg-brand-text-primary" />
            </div>
            
            <p className="font-sans text-xs text-brand-text-muted leading-relaxed max-w-sm">
              A secure platform for running elections and managing decisions. Transparent, verifiable, and built for organizations of any size.
            </p>

            <div className="flex items-center gap-3.5">
              {[
                { icon: Facebook, label: "Facebook" },
                { icon: Instagram, label: "Instagram" },
                { icon: Linkedin, label: "LinkedIn" },
                { icon: Twitter, label: "X" },
                { icon: Youtube, label: "YouTube" }
              ].map((social, idx) => {
                const IconComponent = social.icon;
                return (
                  <a
                    key={idx}
                    href="#"
                    className="w-8 h-8 rounded-full bg-brand-surface-interactive border border-brand-border flex items-center justify-center text-brand-text-muted hover:text-brand-text-primary hover:bg-brand-surface hover:border-brand-border transition-all"
                    aria-label={social.label}
                  >
                    <IconComponent size={14} />
                  </a>
                );
              })}
            </div>
          </div>

          <div className="lg:col-span-3 flex flex-col gap-5">
            <h4 className="font-sans font-bold text-xs text-brand-text-primary uppercase tracking-wider">
              Navigation
            </h4>
            <ul className="flex flex-col gap-3">
              <li>
                <button onClick={() => navigate("/")} className="font-sans text-xs text-brand-text-muted hover:text-brand-text-primary transition-colors text-left focus:outline-none cursor-pointer">
                  Home
                </button>
              </li>
              <li>
                <button onClick={() => navigate("/governance")} className="font-sans text-xs text-brand-text-muted hover:text-brand-text-primary transition-colors text-left focus:outline-none cursor-pointer">
                  Governance Centre
                </button>
              </li>
              <li>
                <button onClick={() => navigate("/about")} className="font-sans text-xs text-brand-text-muted hover:text-brand-text-primary transition-colors text-left focus:outline-none cursor-pointer">
                  About
                </button>
              </li>
              <li>
                <button onClick={() => navigate("/contact")} className="font-sans text-xs text-brand-text-muted hover:text-brand-text-primary transition-colors text-left focus:outline-none cursor-pointer">
                  Contact
                </button>
              </li>
              <li>
                <button onClick={() => navigate("/results")} className="font-sans text-xs text-brand-text-muted hover:text-brand-text-primary transition-colors text-left focus:outline-none cursor-pointer">
                  Results
                </button>
              </li>
            </ul>
          </div>

          <div className="lg:col-span-4 flex flex-col gap-5">
            <h4 className="font-sans font-bold text-xs text-brand-text-primary uppercase tracking-wider">
              Contact us form
            </h4>
            
            <AnimatePresence mode="wait">
              {!formSubmitted ? (
                <motion.form 
                  onSubmit={handleSubmit}
                  initial={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col gap-3"
                >
                  <input
                    type="text"
                    name="fullName"
                    required
                    aria-label="Full name"
                    placeholder="Full name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-brand-surface border border-brand-border rounded-xl px-4 py-2.5 text-xs text-brand-text-primary placeholder-brand-text-disabled focus:outline-none focus:border-brand-gold transition-all"
                  />
                  <input
                    type="text"
                    name="emailOrPhone"
                    required
                    aria-label="Email or phone"
                    placeholder="Enter email or phone"
                    value={emailOrPhone}
                    onChange={(e) => setEmailOrPhone(e.target.value)}
                    className="w-full bg-brand-surface border border-brand-border rounded-xl px-4 py-2.5 text-xs text-brand-text-primary placeholder-brand-text-disabled focus:outline-none focus:border-brand-gold transition-all"
                  />
                  <textarea
                    name="message"
                    required
                    aria-label="Message"
                    rows={3}
                    placeholder="Message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full bg-brand-surface border border-brand-border rounded-xl px-4 py-2.5 text-xs text-brand-text-primary placeholder-brand-text-disabled focus:outline-none focus:border-brand-gold transition-all resize-none"
                  />
                  
                  <motion.button
                    type="submit"
                    whileTap={{ scale: 0.98 }}
                    className="w-full bg-brand-gold text-brand-bg-secondary hover:bg-brand-gold-hover font-semibold text-xs py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer mt-1"
                  >
                    <Send size={12} />
                    <span>Send message</span>
                  </motion.button>
                </motion.form>
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="bg-brand-surface border border-brand-border rounded-xl p-5 text-center flex flex-col items-center gap-2.5"
                >
                  <CheckCircle size={24} className="text-status-success" />
                  <h5 className="font-sans font-bold text-xs text-brand-text-primary uppercase tracking-wider">
                    Message Sent
                  </h5>
                  <p className="font-sans text-[10px] text-brand-text-muted leading-relaxed max-w-[220px]">
                    Thank you, {fullName}. Our consensus compliance team will contact you shortly.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="w-full border-t border-brand-border pt-12 relative z-10 flex flex-col items-center justify-center overflow-hidden">
          <div className="opacity-[0.025] pointer-events-none select-none transform translate-y-3 flex items-center justify-center">
            <img src={logoUrl} alt="" className="w-auto h-[15vw] sm:h-[18vw] max-w-none opacity-100" style={{ filter: 'none' }} />
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between w-full mt-4 text-[10px] font-mono tracking-widest text-brand-text-disabled uppercase gap-2">
            <span>&copy; {new Date().getFullYear()} ORIVIS PROTOCOL. ALL RIGHTS RESERVED.</span>
            <div className="flex gap-4">
              <button 
                onClick={() => navigate("/privacy")} 
                className="hover:text-brand-text-primary transition-colors cursor-pointer"
              >
                Privacy Policy
              </button>
              <span>&middot;</span>
              <button 
                onClick={() => navigate("/terms")} 
                className="hover:text-brand-text-primary transition-colors cursor-pointer"
              >
                Terms of Service
              </button>
            </div>
          </div>
        </div>
      </div>

      <GetStartedModal open={getStartedOpen} onClose={() => setGetStartedOpen(false)} />
    </footer>
  );
}
