import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";

const faqs = [
  {
    q: "What is Orivis?",
    a: "Orivis is a governance technology platform that helps organizations conduct elections, approvals, consultations, and decision making events with trust and transparency. Every vote is cryptographically signed, immutably recorded, and publicly verifiable without compromising voter anonymity.",
  },
  {
    q: "Who can use Orivis?",
    a: "Orivis serves governments, universities, corporations, NGOs, and associations worldwide. Any organization that needs to make trusted decisions can use the platform, from national referendums with millions of voters to boardroom resolutions with a handful of participants.",
  },
  {
    q: "What types of events does Orivis support?",
    a: "Orivis supports elections (candidate selection), approvals (board resolutions, policy adoption), consultations (public feedback), referendums (constitutional changes), and surveys (sentiment analysis). Each event type has tailored workflows and verification requirements.",
  },
  {
    q: "How does Orivis ensure votes are secure?",
    a: "Every vote is cryptographically signed and immutably recorded on an auditable ledger. Multiple identity verification tiers ensure only eligible voters participate. Results are verifiable without exposing how any individual voted.",
  },
  {
    q: "Can votes be both anonymous and verifiable?",
    a: "Yes. Orivis uses cryptographic techniques that keep individual votes anonymous while allowing anyone to verify that all votes were counted correctly. This means outcomes can be trusted without compromising voter privacy.",
  },
  {
    q: "Is Orivis only for government elections?",
    a: "No. Orivis is a global platform for any organization, not tied to any country, government, or political party. Universities use it for student elections, corporations for shareholder votes, NGOs for member decisions, and associations for council elections.",
  },
  {
    q: "How does multi-tenant architecture work?",
    a: "Each organization operates in its own isolated workspace with its own elections, voters, branding, and settings. No organization can access another's data. This architecture supports thousands of organizations and millions of voters without compromising data isolation.",
  },
];

export default function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggle = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <div className="w-full bg-brand-surface-elevated py-20 sm:py-28 relative overflow-hidden">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 md:px-8 w-full relative z-10">
        <div className="flex flex-col items-center text-center mb-14 sm:mb-16">
          <span className="text-[10px] sm:text-[11px] font-mono font-bold uppercase tracking-[0.2em] text-brand-gold mb-4">
            FAQ
          </span>
          <h2 className="font-display font-bold uppercase text-3xl sm:text-4xl md:text-5xl leading-[1.05] text-brand-text-primary">
            Questions?
            <br />
            <span className="text-brand-text-muted">We have answers.</span>
          </h2>
          <p className="font-sans text-xs sm:text-sm text-brand-text-muted leading-relaxed max-w-lg mt-4">
            Everything you need to know about Orivis and how it powers trusted decisions.
          </p>
        </div>

        <div>
          <div className="flex flex-col gap-3">
          {faqs.map((faq, idx) => {
            const isOpen = openIndex === idx;

            return (
              <div
                key={idx}
                className="rounded-2xl border border-brand-border bg-brand-surface overflow-hidden transition-colors duration-200"
              >
                <button
                  onClick={() => toggle(idx)}
                  className="w-full flex items-center justify-between gap-4 px-5 sm:px-7 py-4 sm:py-5 text-left cursor-pointer"
                  aria-expanded={isOpen}
                >
                  <span className="font-sans text-sm sm:text-base font-semibold text-brand-text-primary leading-snug pr-2">
                    {faq.q}
                  </span>
                  <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-brand-surface-interactive border border-brand-border flex items-center justify-center shrink-0 transition-colors duration-200">
                    <motion.svg
                      width="14"
                      height="14"
                      viewBox="0 0 14 14"
                      fill="none"
                      animate={{ rotate: isOpen ? 45 : 0 }}
                      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                    >
                      <line x1="7" y1="1" x2="7" y2="13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-brand-text-muted" />
                      <line x1="1" y1="7" x2="13" y2="7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-brand-text-muted" />
                    </motion.svg>
                  </span>
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      key="content"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 sm:px-7 pb-5 sm:pb-6 pt-0">
                        <div className="w-8 h-px bg-brand-gold/40 mb-3" />
                        <p className="font-sans text-xs sm:text-sm text-brand-text-muted leading-relaxed">
                          {faq.a}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
        </div>
      </div>
      </div>
  );
}
