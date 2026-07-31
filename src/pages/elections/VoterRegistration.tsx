import { useState, useEffect, useCallback } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "motion/react"
import { Loader2, ArrowLeft, CheckCircle, AlertTriangle, Clock, Shield, Copy, Download, Printer } from "lucide-react"
import SeoHead from "../../components/SeoHead"
import TextureBg from "../../components/TextureBg"
import VoterRegistrationForm from "../../components/VoterRegistrationForm"
import VerificationInput from "../../components/auth/VerificationInput"
import QrCode from "../../components/QrCode"
import CountdownTimer, { useCountdown } from "../../components/CountdownTimer"
import { electionService } from "../../services/election-service"
import type { Election } from "../../types/election"
import type { ElectionRegistrationInfo, LookupResult, VoterLookupField, CompleteRegistrationResult, OtpResult } from "../../types/registration"

type PageState = "loading" | "error" | "not-found" | "registration-closed" | "lookup" | "participant-preview" | "otp" | "verified" | "complete" | "direct-complete"

function maskEmail(email: string): string {
  const [name, domain] = email.split("@")
  if (!name || !domain) return email
  return `${name[0]}${"*".repeat(Math.max(name.length - 2, 0))}${name[name.length - 1]}@${domain}`
}

const OTP_LENGTH = 6
const MAX_OTP_ATTEMPTS = 3
const RESEND_COOLDOWN = 30

export default function VoterRegistration() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [pageState, setPageState] = useState<PageState>("loading")
  const [election, setElection] = useState<Election | null>(null)
  const [regInfo, setRegInfo] = useState<ElectionRegistrationInfo | null>(null)

  const [lookupResult, setLookupResult] = useState<LookupResult | null>(null)
  const [registrationUuid, setRegistrationUuid] = useState<string | null>(null)

  const [otpValue, setOtpValue] = useState<string[]>(Array(OTP_LENGTH).fill(""))
  const [otpSending, setOtpSending] = useState(false)
  const [otpVerifying, setOtpVerifying] = useState(false)
  const [otpError, setOtpError] = useState("")
  const [otpExpiresAt, setOtpExpiresAt] = useState<string | null>(null)
  const [otpAttempts, setOtpAttempts] = useState(0)
  const [otpLocked, setOtpLocked] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)

  const [passResult, setPassResult] = useState<CompleteRegistrationResult | null>(null)
  const [completing, setCompleting] = useState(false)
  const [copied, setCopied] = useState(false)

  const otpCountdown = otpExpiresAt ? useCountdown(otpExpiresAt) : null
  const otpExpired = otpCountdown !== null && otpCountdown.total <= 0

  useEffect(() => {
    if (!id) { setPageState("not-found"); return }
    let cancelled = false
    async function load() {
      try {
        const [electionData, info] = await Promise.all([
          electionService.getElection(id!),
          electionService.getRegistrationInfo(id!),
        ])
        if (cancelled) return
        if (!electionData) { setPageState("not-found"); return }
        setElection(electionData)
        if (!info || !info.registrationEnabled) {
          setPageState("registration-closed")
          setRegInfo(info)
          return
        }
        setRegInfo(info)
        setPageState("lookup")
      } catch {
        if (!cancelled) setPageState("error")
      }
    }
    load()
    return () => { cancelled = true }
  }, [id])

  useEffect(() => {
    if (resendCooldown <= 0) return
    const timer = setInterval(() => setResendCooldown((c) => Math.max(c - 1, 0)), 1000)
    return () => clearInterval(timer)
  }, [resendCooldown])

  const handleLookup = useCallback(async (field: VoterLookupField, value: string) => {
    if (!id) return
    const result = await electionService.lookupVoter(id, field, value)
    setLookupResult(result)
    if (regInfo?.registrationRequired) {
      const reg = await electionService.register(id, field, value)
      setRegistrationUuid(reg.registration)
      setPageState("participant-preview")
    } else {
      setPageState("direct-complete")
    }
  }, [id, regInfo])

  const handleSendOtp = useCallback(async () => {
    if (!registrationUuid) return
    setOtpSending(true)
    setOtpError("")
    try {
      const result = await electionService.sendOtp(registrationUuid)
      const expiresAt = new Date(Date.now() + (result.expires_in ?? 300) * 1000).toISOString()
      setOtpExpiresAt(expiresAt)
      setOtpValue(Array(OTP_LENGTH).fill(""))
      setPageState("otp")
    } catch (e) {
      setOtpError(e instanceof Error ? e.message : "Failed to send OTP.")
    } finally {
      setOtpSending(false)
    }
  }, [registrationUuid])

  const handleVerifyOtp = useCallback(async () => {
    if (!registrationUuid) return
    const code = otpValue.join("")
    if (code.length < OTP_LENGTH) { setOtpError("Please enter the complete code."); return }
    setOtpVerifying(true)
    setOtpError("")
    try {
      const result = await electionService.verifyOtp(registrationUuid, code)
      if (!result.verified) {
        const newAttempts = otpAttempts + 1
        setOtpAttempts(newAttempts)
        if (newAttempts >= MAX_OTP_ATTEMPTS) {
          setOtpLocked(true)
          setOtpError("Maximum attempts exceeded. Registration has been locked.")
        } else {
          setOtpError(`Invalid code. ${MAX_OTP_ATTEMPTS - newAttempts} attempt${MAX_OTP_ATTEMPTS - newAttempts === 1 ? "" : "s"} remaining.`)
        }
        return
      }
      setPageState("verified")
    } catch {
      setOtpError("Verification failed. Please try again.")
    } finally {
      setOtpVerifying(false)
    }
  }, [registrationUuid, otpValue, otpAttempts])

  const handleComplete = useCallback(async () => {
    if (!registrationUuid) return
    setCompleting(true)
    try {
      const result = await electionService.completeRegistration(registrationUuid)
      setPassResult(result)
      setPageState("complete")
    } catch {
      setOtpError("Failed to complete registration. Please try again.")
    } finally {
      setCompleting(false)
    }
  }, [registrationUuid])

  const handleResendOtp = useCallback(async () => {
    if (resendCooldown > 0 || !registrationUuid) return
    setResendCooldown(RESEND_COOLDOWN)
    try {
      const result = await electionService.sendOtp(registrationUuid)
      const expiresAt = new Date(Date.now() + (result.expires_in ?? 300) * 1000).toISOString()
      setOtpExpiresAt(expiresAt)
      setOtpValue(Array(OTP_LENGTH).fill(""))
    } catch {
      setOtpError("Failed to resend OTP.")
    }
  }, [registrationUuid, resendCooldown])

  const handleCopyPass = useCallback(async () => {
    if (!passResult?.pass?.code) return
    try {
      await navigator.clipboard.writeText(passResult.pass.code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch { /* clipboard not available */ }
  }, [passResult])

  const handleDownloadPass = useCallback(() => {
    if (!passResult?.pass?.code || !election) return
    const text = [
      "ORIVIS VOTING PASS",
      "==================",
      "",
      `Pass Code: ${passResult.pass.code}`,
      `Election: ${election.title}`,
      `Expires: ${passResult.pass.expires_at ? new Date(passResult.pass.expires_at).toLocaleString() : "N/A"}`,
      "",
      "Store this pass securely. You will need it to vote.",
      "",
      `Verification: ${window.location.origin}/verify/pass/${passResult.pass.code}`,
    ].join("\n")
    const blob = new Blob([text], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url; a.download = `voting-pass-${passResult.pass.code}.txt`; a.click()
    URL.revokeObjectURL(url)
  }, [passResult, election])

  const handlePrintPass = useCallback(() => {
    window.print()
  }, [])

  if (pageState === "loading") {
    return (
      <div className="w-full flex-grow flex items-center justify-center pt-24">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={20} className="animate-spin text-brand-gold" />
          <span className="text-xs text-brand-text-muted font-mono">Loading registration...</span>
        </div>
      </div>
    )
  }

  if (pageState === "error") {
    return (
      <div className="w-full flex-grow flex flex-col items-center justify-center pt-24 px-6">
        <AlertTriangle size={40} className="text-brand-text-disabled mb-4" />
        <h1 className="text-xl font-bold text-brand-text-primary mb-2">Something went wrong</h1>
        <p className="text-xs text-brand-text-muted mb-6 text-center max-w-md">Unable to load registration. Check your connection and try again.</p>
        <button onClick={() => navigate(`/elections/${id}`)} className="flex items-center gap-2 bg-brand-gold text-brand-bg-secondary px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer">
          Back to Election
        </button>
      </div>
    )
  }

  if (pageState === "not-found") {
    return (
      <div className="w-full flex-grow flex flex-col items-center justify-center pt-24 px-6">
        <AlertTriangle size={40} className="text-brand-text-disabled mb-4" />
        <h1 className="text-xl font-bold text-brand-text-primary mb-2">Election Not Found</h1>
        <p className="text-xs text-brand-text-muted mb-6">This election doesn't exist or has been removed.</p>
        <button onClick={() => navigate("/governance")} className="flex items-center gap-2 bg-brand-gold text-brand-bg-secondary px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer">
          Browse Elections
        </button>
      </div>
    )
  }

  if (pageState === "registration-closed") {
    return (
      <motion.main
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="w-full flex-grow flex flex-col pt-24"
      >
        <SeoHead meta={{ title: "Registration | ORIVIS", noindex: true }} />
        <div className="w-full bg-brand-surface py-12 border-b border-brand-border relative overflow-hidden">
          <TextureBg src="https://images.unsplash.com/photo-1765408217205-1c42d81f1677?q=80&w=1600&auto=format&fit=crop" opacity={0.2} />
          <div className="max-w-2xl mx-auto px-6 relative z-10">
            <button onClick={() => navigate(`/elections/${id}`)} className="flex items-center gap-1.5 text-xs text-brand-text-muted hover:text-brand-text-primary transition-colors mb-6 cursor-pointer">
              <ArrowLeft size={14} /> Back
            </button>
            <h1 className="text-xl sm:text-2xl font-display font-bold uppercase text-brand-text-primary leading-tight">Registration</h1>
          </div>
        </div>
        <div className="w-full bg-brand-surface-elevated py-16 relative overflow-hidden flex-grow">
          <TextureBg src="https://images.unsplash.com/photo-1772775756679-34a0716ae0d9?q=80&w=1600&auto=format&fit=crop" opacity={0.2} />
          <div className="max-w-2xl mx-auto px-6 relative z-10">
            <div className="bg-brand-surface border border-brand-border rounded-2xl p-8 text-center space-y-4">
              <div className="w-14 h-14 rounded-full bg-brand-text-disabled/10 flex items-center justify-center mx-auto">
                <Clock size={26} className="text-brand-text-disabled" />
              </div>
              <div>
                <h2 className="text-sm font-bold uppercase tracking-wider text-brand-text-primary">Registration Unavailable</h2>
                <p className="text-xs text-brand-text-muted mt-2 max-w-sm mx-auto">
                  {regInfo?.registrationStatus === "closed" ? "Registration for this election is currently closed." : regInfo?.message ?? "Registration is not open for this election at this time."}
                </p>
              </div>
              {regInfo?.registrationStartsAt && (
                <CountdownTimer targetDate={regInfo.registrationStartsAt} label="Registration opens in" />
              )}
              {regInfo?.registrationEndsAt && (
                <CountdownTimer targetDate={regInfo.registrationEndsAt} label="Registration closes in" />
              )}
              <button onClick={() => navigate(`/elections/${id}`)} className="inline-flex items-center gap-2 bg-brand-gold text-brand-bg-secondary px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer">
                Back to Election
              </button>
            </div>
          </div>
        </div>
      </motion.main>
    )
  }

  return (
    <motion.main
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="w-full flex-grow flex flex-col pt-24"
    >
      <SeoHead meta={{ title: regInfo?.registrationRequired ? "Register | ORIVIS" : "Get Voting Pass | ORIVIS", noindex: true }} />
      <div className="w-full bg-brand-surface py-12 border-b border-brand-border relative overflow-hidden">
        <TextureBg src="https://images.unsplash.com/photo-1765408217205-1c42d81f1677?q=80&w=1600&auto=format&fit=crop" opacity={0.2} />
        <div className="max-w-2xl mx-auto px-6 relative z-10">
          <button onClick={() => navigate(`/elections/${id}`)} className="flex items-center gap-1.5 text-xs text-brand-text-muted hover:text-brand-text-primary transition-colors mb-6 cursor-pointer">
            <ArrowLeft size={14} /> Back
          </button>
          <h1 className="text-xl sm:text-2xl font-display font-bold uppercase text-brand-text-primary leading-tight">
            {regInfo?.registrationRequired ? "Register to Vote" : "Get Your Voting Pass"}
          </h1>
          <p className="text-xs text-brand-text-muted mt-2 max-w-lg">
            {regInfo?.registrationRequired
              ? "Enter your details to begin registration. You'll receive a code to verify your identity."
              : "Enter your details to look up your record and receive your voting pass."}
          </p>
          {regInfo?.message && (
            <p className="text-xs text-brand-gold mt-2">{regInfo.message}</p>
          )}
        </div>
      </div>

      <div className="w-full bg-brand-surface-elevated py-16 relative overflow-hidden flex-grow">
        <TextureBg src="https://images.unsplash.com/photo-1772775756679-34a0716ae0d9?q=80&w=1600&auto=format&fit=crop" opacity={0.2} />
        <div className="max-w-2xl mx-auto px-6 relative z-10 space-y-6">
          <AnimatePresence mode="wait">
            {pageState === "lookup" && (
              <motion.div key="lookup" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="bg-brand-surface border border-brand-border rounded-2xl p-6">
                  <VoterRegistrationForm
                    lookupFields={regInfo?.lookupFields ?? ["student_id", "staff_id"]}
                    onLookup={handleLookup}
                  />
                </div>
              </motion.div>
            )}

            {pageState === "participant-preview" && lookupResult && (
              <motion.div key="preview" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <div className="bg-brand-surface border border-brand-border rounded-2xl p-6 space-y-5">
                  <div className="flex items-center gap-2 text-status-success">
                    <CheckCircle size={16} />
                    <span className="text-xs font-bold uppercase tracking-wider">Record Found</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Detail label="Name" value={lookupResult.voter.name} />
                    <Detail label="Email" value={maskEmail(lookupResult.voter.email)} />
                    <Detail label="Election" value={lookupResult.election.title} />
                  </div>
                  <button
                    onClick={handleSendOtp}
                    disabled={otpSending}
                    className="w-full flex items-center justify-center gap-2 bg-brand-gold hover:bg-brand-gold-hover disabled:opacity-50 text-brand-bg-secondary py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer disabled:cursor-not-allowed"
                  >
                    {otpSending ? <Loader2 size={14} className="animate-spin" /> : <Shield size={14} />}
                    <span>{otpSending ? "Sending Code..." : "Send Verification Code"}</span>
                  </button>
                  <p className="text-[10px] text-brand-text-muted text-center">
                    A one-time code will be sent to your registered {regInfo?.verificationMethod === "email" ? "email" : "phone"}.
                  </p>
                </div>
                {otpError && !otpLocked && (
                  <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} role="alert" className="flex items-start gap-2 bg-status-error/10 border border-status-error/20 rounded-xl p-3 mt-3">
                    <AlertTriangle size={14} className="text-status-error shrink-0 mt-0.5" />
                    <p className="text-xs text-status-error">{otpError}</p>
                  </motion.div>
                )}
              </motion.div>
            )}

            {pageState === "otp" && (
              <motion.div key="otp" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <div className="bg-brand-surface border border-brand-border rounded-2xl p-6 sm:p-8 space-y-6">
                  <div className="text-center space-y-2">
                    <h2 className="text-sm font-bold uppercase tracking-wider text-brand-text-primary">Enter Verification Code</h2>
                    <p className="text-xs text-brand-text-muted">
                      A code was sent to your {regInfo?.verificationMethod === "email" ? "email" : "phone"}.
                    </p>
                  </div>
                  <VerificationInput
                    length={OTP_LENGTH}
                    value={otpValue}
                    onChange={setOtpValue}
                    disabled={otpVerifying || otpLocked}
                    error={otpError}
                  />
                  {otpExpired && !otpLocked && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
                      <p className="text-xs text-brand-text-muted mb-2">Code expired. Request a new one.</p>
                      <button onClick={handleResendOtp} disabled={resendCooldown > 0} className="text-xs text-brand-gold hover:underline cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
                        {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend Code"}
                      </button>
                    </motion.div>
                  )}
                  {!otpExpired && otpExpiresAt && (
                    <CountdownTimer targetDate={otpExpiresAt} label="Code expires in" className="text-center" />
                  )}
                  {otpLocked && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-status-error/10 border border-status-error/20 rounded-xl p-4 text-center space-y-2">
                      <AlertTriangle size={20} className="text-status-error mx-auto" />
                      <p className="text-xs text-status-error font-bold">Too many attempts</p>
                      <p className="text-[10px] text-status-error">Registration has been locked due to multiple failed attempts. Contact support for assistance.</p>
                    </motion.div>
                  )}
                  {otpError && !otpLocked && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} role="alert" className="flex items-start gap-2 bg-status-error/10 border border-status-error/20 rounded-xl p-3">
                      <AlertTriangle size={14} className="text-status-error shrink-0 mt-0.5" />
                      <p className="text-xs text-status-error">{otpError}</p>
                    </motion.div>
                  )}
                  <div className="flex flex-col sm:flex-row gap-3">
                    {!otpLocked && (
                      <button
                        onClick={handleVerifyOtp}
                        disabled={otpVerifying || otpValue.join("").length < OTP_LENGTH || otpLocked}
                        className="flex-1 flex items-center justify-center gap-2 bg-brand-gold hover:bg-brand-gold-hover disabled:opacity-50 text-brand-bg-secondary py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer disabled:cursor-not-allowed"
                      >
                        {otpVerifying ? <Loader2 size={14} className="animate-spin" /> : <Shield size={14} />}
                        <span>{otpVerifying ? "Verifying..." : "Verify Code"}</span>
                      </button>
                    )}
                    {!otpExpired && !otpLocked && (
                      <button
                        onClick={handleResendOtp}
                        disabled={resendCooldown > 0}
                        className="flex items-center justify-center gap-2 bg-brand-surface border border-brand-border hover:border-brand-gold/30 text-brand-text-primary py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Resend{resendCooldown > 0 ? ` (${resendCooldown}s)` : ""}
                      </button>
                    )}
                  </div>
                  {otpAttempts > 0 && !otpLocked && (
                    <p className="text-[10px] text-brand-text-muted text-center">
                      Attempt {otpAttempts} of {MAX_OTP_ATTEMPTS}
                    </p>
                  )}
                </div>
              </motion.div>
            )}

            {pageState === "verified" && (
              <motion.div key="verified" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
                <div className="bg-brand-surface border border-brand-border rounded-2xl p-8 text-center space-y-5">
                  <div className="w-16 h-16 rounded-full bg-status-success/20 flex items-center justify-center mx-auto">
                    <CheckCircle size={32} className="text-status-success" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold uppercase tracking-wider text-brand-text-primary">Verified!</h2>
                    <p className="text-xs text-brand-text-muted mt-1">Your identity has been confirmed.</p>
                  </div>
                  <button
                    onClick={handleComplete}
                    disabled={completing}
                    className="w-full flex items-center justify-center gap-2 bg-brand-gold hover:bg-brand-gold-hover disabled:opacity-50 text-brand-bg-secondary py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer disabled:cursor-not-allowed"
                  >
                    {completing ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                    <span>{completing ? "Completing..." : "Complete Registration"}</span>
                  </button>
                </div>
              </motion.div>
            )}

            {pageState === "complete" && passResult && election && (
              <motion.div key="complete" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
                <VotingPassCard
                  code={passResult.pass.code}
                  electionTitle={election.title}
                  organizationName={election.organizationName ?? "Organization"}
                  voterName={lookupResult?.voter.name ?? ""}
                  expiresAt={passResult.pass.expires_at}
                  onBack={() => navigate(`/elections/${id}`)}
                  onCopy={handleCopyPass}
                  onDownload={handleDownloadPass}
                  onPrint={handlePrintPass}
                  copied={copied}
                />
              </motion.div>
            )}

            {pageState === "direct-complete" && lookupResult && election && (
              <motion.div key="direct-complete" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
                <div className="bg-brand-surface border border-brand-border rounded-2xl p-8 text-center space-y-5">
                  <div className="w-16 h-16 rounded-full bg-status-success/20 flex items-center justify-center mx-auto">
                    <CheckCircle size={32} className="text-status-success" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold uppercase tracking-wider text-brand-text-primary">You're All Set!</h2>
                    <p className="text-xs text-brand-text-muted mt-1 max-w-sm mx-auto">
                      Your identity has been verified. You are eligible to vote in this election.
                    </p>
                  </div>
                  <div className="bg-brand-bg-secondary/50 border border-brand-border rounded-xl p-4 max-w-sm mx-auto text-left space-y-2">
                    <Detail label="Name" value={lookupResult.voter.name} />
                    <Detail label="Email" value={maskEmail(lookupResult.voter.email)} />
                    <Detail label="Election" value={lookupResult.election.title} />
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={() => navigate(`/elections/${id}/vote`)}
                      className="flex-1 flex items-center justify-center gap-2 bg-brand-gold hover:bg-brand-gold-hover text-brand-bg-secondary py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
                    >
                      Proceed to Vote
                    </button>
                    <button
                      onClick={() => navigate(`/elections/${id}`)}
                      className="flex-1 flex items-center justify-center gap-2 bg-brand-surface border border-brand-border hover:border-brand-gold/30 text-brand-text-primary py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
                    >
                      Back to Election
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.main>
  )
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="block text-[9px] font-mono uppercase tracking-widest text-brand-text-muted font-bold mb-0.5">{label}</span>
      <span className="text-sm font-semibold text-brand-text-primary break-all">{value}</span>
    </div>
  )
}

function VotingPassCard({
  code, electionTitle, organizationName, voterName, expiresAt, onBack, onCopy, onDownload, onPrint, copied,
}: {
  code: string
  electionTitle: string
  organizationName: string
  voterName: string
  expiresAt: string | null
  onBack: () => void
  onCopy: () => void
  onDownload: () => void
  onPrint: () => void
  copied: boolean
}) {
  const qrValue = `${window.location.origin}/verify/pass/${code}`

  return (
    <div className="bg-brand-surface border border-brand-border rounded-2xl overflow-hidden">
      <div className="p-6 sm:p-8 space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[9px] font-mono uppercase tracking-widest text-brand-gold font-bold">ORIVIS Voting Pass</span>
            <h2 className="text-xl sm:text-2xl font-mono font-bold tracking-widest text-brand-text-primary">{code}</h2>
          </div>
          <span className="text-[10px] font-bold font-mono uppercase tracking-widest px-2.5 py-1 rounded-full border border-status-success bg-status-success/10 text-status-success">
            Active
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-3">
            <Detail label="Election" value={electionTitle} />
            <Detail label="Organization" value={organizationName} />
            <Detail label="Participant" value={voterName} />
            <Detail label="Expires" value={expiresAt ? new Date(expiresAt).toLocaleDateString() : "N/A"} />
          </div>
          <div className="flex flex-col items-center justify-center gap-2 p-4 bg-brand-bg-secondary/30 rounded-2xl">
            <QrCode value={qrValue} size={140} />
            <span className="text-[8px] text-brand-text-muted text-center max-w-[160px] leading-tight">
              Scan to verify pass
            </span>
          </div>
        </div>

        <div className="bg-brand-bg-secondary/50 border border-brand-border rounded-xl p-4 space-y-1.5">
          <p className="text-[10px] font-bold text-brand-text-primary uppercase tracking-wider">How to vote</p>
          <ol className="space-y-1">
            <li className="text-[10px] text-brand-text-muted flex items-start gap-2">
              <span className="text-brand-gold font-bold shrink-0">1.</span>
              <span>Go to the election page on election day.</span>
            </li>
            <li className="text-[10px] text-brand-text-muted flex items-start gap-2">
              <span className="text-brand-gold font-bold shrink-0">2.</span>
              <span>Enter your voting pass code when prompted.</span>
            </li>
            <li className="text-[10px] text-brand-text-muted flex items-start gap-2">
              <span className="text-brand-gold font-bold shrink-0">3.</span>
              <span>Cast your vote and get your receipt.</span>
            </li>
          </ol>
        </div>
      </div>

      <div className="px-6 sm:px-8 py-4 border-t border-brand-border flex flex-wrap items-center justify-center gap-2 print:hidden">
        <button onClick={onCopy} className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-brand-surface border border-brand-border text-brand-text-muted hover:text-brand-text-primary hover:border-brand-gold/30 text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer" aria-label="Copy pass code">
          {copied ? <CheckCircle size={13} className="text-status-success" /> : <Copy size={13} />}
          <span>{copied ? "Copied" : "Copy"}</span>
        </button>
        <button onClick={onDownload} className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-brand-surface border border-brand-border text-brand-text-muted hover:text-brand-text-primary hover:border-brand-gold/30 text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer" aria-label="Download pass">
          <Download size={13} />
          <span>Download</span>
        </button>
        <button onClick={onPrint} className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-brand-surface border border-brand-border text-brand-text-muted hover:text-brand-text-primary hover:border-brand-gold/30 text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer" aria-label="Print pass">
          <Printer size={13} />
          <span>Print</span>
        </button>
        <button onClick={onBack} className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-brand-gold hover:bg-brand-gold-hover text-brand-bg-secondary text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer" aria-label="Back to election">
          <ArrowLeft size={13} />
          <span>Back to Election</span>
        </button>
      </div>
    </div>
  )
}
