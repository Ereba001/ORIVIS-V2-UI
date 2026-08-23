import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { CheckCircle, Phone, MapPin, Mail, Send, AlertCircle, Loader2 } from "lucide-react";
import TextureBg from "../components/TextureBg";
import SeoHead from "../components/SeoHead";
import { organizationSchema } from "../seo/schema";
import { platformService } from "../services/platform-service";

export default function Contact() {
  const [submitted, setSubmitted] = useState(false);
  const [fullName, setFullName] = useState("");
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  return (
    <motion.main
      key="contact"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="w-full flex-grow flex flex-col pt-24"
    >
      <SeoHead jsonLd={[organizationSchema()]} />
      {/* Hero */}
      <div className="w-full bg-brand-surface py-24 sm:py-28 border-b border-brand-border relative overflow-hidden">
        <TextureBg src="https://images.unsplash.com/photo-1771924310799-930349452c76?q=80&w=1600&auto=format&fit=crop" opacity={0.25} />
        <div className="max-w-4xl mx-auto px-6 text-center flex flex-col gap-5 relative z-10">
          <span className="text-[10px] sm:text-[11px] font-mono tracking-[0.2em] uppercase text-brand-gold font-bold">Get In Touch</span>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-display font-bold uppercase text-brand-text-primary leading-[1.05]">
            Contact Orivis
          </h1>
          <p className="text-xs sm:text-sm text-brand-text-muted max-w-xl mx-auto leading-relaxed uppercase tracking-wider">
            Have questions or want to learn more? We are here to help.
          </p>
        </div>
      </div>

      {/* Contact Info + Form */}
      <div className="w-full bg-brand-surface-elevated text-brand-text-primary py-20 sm:py-24 relative overflow-hidden">
        <TextureBg src="https://images.unsplash.com/photo-1772775756679-34a0716ae0d9?q=80&w=1600&auto=format&fit=crop" opacity={0.2} />
        <div className="max-w-5xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-5 gap-10 lg:gap-14 relative z-10">
          {/* Contact Details */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            <div>
              <span className="text-[10px] font-mono tracking-widest uppercase text-brand-gold font-bold">Reach Us</span>
              <h2 className="text-xl sm:text-2xl font-display font-bold uppercase text-brand-text-primary mt-2 leading-[1.1]">
                Let's Talk Governance
              </h2>
              <p className="text-xs text-brand-text-muted leading-relaxed mt-3">
                Send us a message and our team will get back to you.
              </p>
            </div>

            <div className="flex flex-col gap-4">
              <a href="tel:+23490279914" className="glass-card rounded-2xl p-4 flex items-center gap-3.5 group hover:border-brand-gold/30 transition-all duration-200">
                <div className="w-10 h-10 rounded-xl bg-brand-gold/10 border border-brand-gold/20 flex items-center justify-center shrink-0">
                  <Phone size={16} className="text-brand-gold" />
                </div>
                <div>
                  <p className="text-[9px] font-mono tracking-widest text-brand-text-disabled uppercase">Phone</p>
                  <p className="text-xs font-semibold text-brand-text-primary mt-0.5 group-hover:text-brand-gold transition-colors">+234 902 799 14</p>
                </div>
              </a>

              <div className="glass-card rounded-2xl p-4 flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-brand-gold/10 border border-brand-gold/20 flex items-center justify-center shrink-0">
                  <MapPin size={16} className="text-brand-gold" />
                </div>
                <div>
                  <p className="text-[9px] font-mono tracking-widest text-brand-text-disabled uppercase">Address</p>
                  <p className="text-xs font-semibold text-brand-text-primary mt-0.5">Ada George, Port Harcourt, Rivers State</p>
                </div>
              </div>

              <a href="mailto:info@orivis.com" className="glass-card rounded-2xl p-4 flex items-center gap-3.5 group hover:border-brand-gold/30 transition-all duration-200">
                <div className="w-10 h-10 rounded-xl bg-brand-gold/10 border border-brand-gold/20 flex items-center justify-center shrink-0">
                  <Mail size={16} className="text-brand-gold" />
                </div>
                <div>
                  <p className="text-[9px] font-mono tracking-widest text-brand-text-disabled uppercase">Email</p>
                  <p className="text-xs font-semibold text-brand-text-primary mt-0.5 group-hover:text-brand-gold transition-colors">info@orivis.com</p>
                </div>
              </a>
            </div>
          </div>

          {/* Form */}
          <div className="lg:col-span-3">
            <div className="glass-card rounded-2xl p-6 sm:p-8">
              <h3 className="font-sans font-bold text-sm text-brand-text-primary uppercase tracking-wider mb-6">
                Send Us a Message
              </h3>

              <AnimatePresence mode="wait">
                {!submitted ? (
                  <motion.form
                    key="form"
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onSubmit={async (e) => {
                      e.preventDefault();
                      setFormError(null);
                      setIsSubmitting(true);
                      try {
                        await platformService.submitContactMessage({
                          name: fullName,
                          email: emailOrPhone,
                          message,
                        });
                        setSubmitted(true);
                      } catch (err) {
                        setFormError(
                          err instanceof Error ? err.message : "Failed to send message. Please try again."
                        );
                      } finally {
                        setIsSubmitting(false);
                      }
                    }}
                    className="flex flex-col gap-4"
                  >
                    <input
                      type="text"
                      name="fullName"
                      required
                      aria-label="Full name"
                      placeholder="Full name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full bg-brand-surface border border-brand-border rounded-xl px-4 py-3 text-xs text-brand-text-primary placeholder-brand-text-disabled focus:outline-none focus:border-brand-gold transition-all"
                    />
                    <input
                      type="text"
                      name="emailOrPhone"
                      required
                      aria-label="Email or phone number"
                      placeholder="Email or phone number"
                      value={emailOrPhone}
                      onChange={(e) => setEmailOrPhone(e.target.value)}
                      className="w-full bg-brand-surface border border-brand-border rounded-xl px-4 py-3 text-xs text-brand-text-primary placeholder-brand-text-disabled focus:outline-none focus:border-brand-gold transition-all"
                    />
                    <textarea
                      required
                      name="message"
                      aria-label="Message"
                      rows={4}
                      placeholder="How can we help you?"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="w-full bg-brand-surface border border-brand-border rounded-xl px-4 py-3 text-xs text-brand-text-primary placeholder-brand-text-disabled focus:outline-none focus:border-brand-gold transition-all resize-none"
                    />
                    {formError && (
                      <div className="flex items-center gap-2 text-status-danger text-xs bg-status-danger/10 border border-status-danger/20 rounded-xl px-4 py-3">
                        <AlertCircle size={14} className="shrink-0" />
                        <span>{formError}</span>
                      </div>
                    )}
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full bg-brand-gold text-brand-bg-secondary text-xs font-bold uppercase tracking-widest py-3.5 rounded-xl hover:scale-102 active:scale-98 transition-all cursor-pointer flex items-center justify-center gap-2 mt-1 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? (
                        <Loader2 size={12} className="animate-spin" />
                      ) : (
                        <Send size={12} />
                      )}
                      <span>{isSubmitting ? "Sending..." : "Send Message"}</span>
                    </button>
                  </motion.form>
                ) : (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center gap-3 text-center py-8"
                  >
                    <CheckCircle size={32} className="text-status-success" />
                    <p className="text-brand-text-primary font-bold text-sm uppercase tracking-wider">Message Sent</p>
                    <p className="text-brand-text-muted text-xs max-w-xs leading-relaxed">
                      Thank you, {fullName}. Our governance team will contact you shortly.
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </motion.main>
  );
}
