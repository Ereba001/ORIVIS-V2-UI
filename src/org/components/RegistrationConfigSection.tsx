import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import {
  ChevronDown, ChevronUp, Settings, Users, Shield, Key,
} from 'lucide-react'
import { useOrgBranding } from '../contexts/OrgBrandingContext'
import type {
  RegistrationSettings, VoterLookupField, VerificationMethodType,
} from '../../types/registration'

interface Props {
  config: RegistrationSettings
  onChange: (config: RegistrationSettings) => void
  errors?: Record<string, string>
}

type SectionKey = 'general' | 'fields' | 'verification' | 'pass'

const VOTER_LOOKUP_FIELDS: { value: VoterLookupField; label: string }[] = [
  { value: 'student_id', label: 'Student ID' },
  { value: 'staff_id', label: 'Staff ID' },
  { value: 'employee_id', label: 'Employee ID' },
  { value: 'membership_number', label: 'Membership Number' },
  { value: 'external_id', label: 'External ID' },
  { value: 'voter_id', label: 'Voter ID' },
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone' },
  { value: 'name', label: 'Full Name' },
  { value: 'surname', label: 'Surname' },
  { value: 'other_name', label: 'Other Name' },
  { value: 'custom', label: 'Custom' },
]

export type OrgCategory = 'university' | 'corporate' | 'ngo' | 'government' | 'general'

const DEFAULT_LOOKUP_FIELDS: Record<OrgCategory, VoterLookupField[]> = {
  university: ['name', 'student_id', 'email'],
  corporate: ['name', 'employee_id', 'email'],
  ngo: ['name', 'membership_number', 'email'],
  government: ['name', 'voter_id', 'email'],
  general: ['name', 'email', 'phone'],
}

export function getOrgCategory(
  organizationType: string,
  organizationContext?: string | null,
): OrgCategory {
  const context = organizationContext ? organizationContext.toLowerCase() : ''
  if (context === 'corporate') return 'corporate'
  if (context === 'government') return 'government'
  if (context === 'non_profit' || context === 'ngo') return 'ngo'
  if (context === 'educational' || context === 'university') return 'university'
  if (context === 'other') return 'general'

  const t = organizationType.toUpperCase()
  if (/UNIV|SCHOOL|EDUCATION|ACADEMIC/.test(t)) return 'university'
  if (/CORP|COMPANY|BUSINESS|ENTERPRISE/.test(t)) return 'corporate'
  if (/NGO|NON|FOUNDATION|CHARITY/.test(t)) return 'ngo'
  if (/GOV|PUBLIC|STATE/.test(t)) return 'government'
  return 'general'
}

export function createDefaultRegSettings(category: OrgCategory = 'general'): RegistrationSettings {
  return {
    // Default to ENABLED: configuring a registration window (or saving this
    // config) must not silently keep the public registration closed. This
    // matches the backend default (`setting('registration_enabled') ?? true`);
    // admins can still explicitly disable registration with the toggle.
    registration_enabled: true,
    registration_required: true,
    registration_message: null,
    lookup_fields: DEFAULT_LOOKUP_FIELDS[category],
    verification_method: 'otp',
    pass_required: true,
    custom_lookup_fields: [],
  }
}

export function resolveLookupFields(config: RegistrationSettings): string[] {
  return [...config.lookup_fields.filter((f) => f !== 'custom'), ...(config.custom_lookup_fields ?? [])]
}

export default function RegistrationConfigSection({ config, onChange, errors = {} }: Props) {
  const { branding } = useOrgBranding()
  const pColor = branding.primaryColor
  const [openSections, setOpenSections] = useState<Record<SectionKey, boolean>>({
    general: true, fields: false, verification: false, pass: false,
  })

  const toggle = useCallback((s: SectionKey) => {
    setOpenSections((prev) => ({ ...prev, [s]: !prev[s] }))
  }, [])

  const update = useCallback(<K extends keyof RegistrationSettings>(key: K, value: RegistrationSettings[K]) => {
    onChange({ ...config, [key]: value })
  }, [config, onChange])

  const toggleLookupField = useCallback((field: VoterLookupField) => {
    const fields = config.lookup_fields.includes(field)
      ? config.lookup_fields.filter((f) => f !== field)
      : [...config.lookup_fields, field]
    update('lookup_fields', fields)
  }, [config.lookup_fields, update])

  const labelClass = 'text-[10px] font-mono font-bold text-brand-text-muted uppercase tracking-wider mb-1.5 block'
  const inputClass = 'w-full bg-brand-surface border border-brand-border rounded-xl px-4 py-2.5 text-xs text-brand-text-primary placeholder-brand-text-disabled/50 outline-none focus:border-[var(--org-primary)] transition-colors'
  const selectClass = 'w-full bg-brand-surface border border-brand-border rounded-xl px-4 py-2.5 text-xs text-brand-text-primary outline-none focus:border-[var(--org-primary)] transition-colors appearance-none'

  const renderSection = (
    section: SectionKey,
    title: string,
    icon: React.ReactNode,
    children: React.ReactNode,
  ) => (
    <div className="border border-brand-divider rounded-2xl overflow-hidden">
      <button
        type="button"
        onClick={() => toggle(section)}
        aria-expanded={openSections[section]}
        aria-controls={`reg-section-${section}`}
        className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-brand-surface-interactive transition-colors"
      >
        <div className="flex items-center gap-2.5">
          {icon}
          <span className="text-xs font-bold uppercase tracking-wider text-brand-text-primary">{title}</span>
        </div>
        {openSections[section] ? <ChevronUp size={14} className="text-brand-text-muted" aria-hidden="true" /> : <ChevronDown size={14} className="text-brand-text-muted" aria-hidden="true" />}
      </button>
      <AnimatePresence initial={false}>
        {openSections[section] && (
          <motion.div
            id={`reg-section-${section}`}
            role="region"
            aria-labelledby={`reg-section-btn-${section}`}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 space-y-4">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )

  const Toggle = ({ on, onToggle, label, id }: { on: boolean; onToggle: (v: boolean) => void; label: string; id?: string }) => (
    <div className="flex items-center justify-between gap-3">
      <span className="text-xs text-brand-text-primary" id={id}>{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        aria-labelledby={id}
        onClick={() => onToggle(!on)}
        className={`w-9 h-5 rounded-full relative transition-colors shrink-0 ${on ? 'bg-status-success' : 'bg-brand-border'}`}
      >
        <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${on ? 'translate-x-4' : 'translate-x-0.5'}`} />
      </button>
    </div>
  )

  return (
    <div className="space-y-3" role="form" aria-label="Registration configuration">
      {errors._form && (
        <div
          role="alert"
          className="p-3 rounded-xl bg-status-error/10 border border-status-error/20 text-[10px] font-mono text-status-error"
        >
          {errors._form}
        </div>
      )}

      {/* General Settings */}
      {renderSection('general', 'General Settings', <Settings size={14} style={{ color: pColor }} aria-hidden="true" />, (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Toggle
              on={config.registration_enabled}
              onToggle={(v) => update('registration_enabled', v)}
              label="Enable registration"
              id="reg-enabled"
            />
            <Toggle
              on={config.registration_required}
              onToggle={(v) => update('registration_required', v)}
              label="Registration required to vote"
              id="reg-required"
            />
            <Toggle
              on={config.pass_required}
              onToggle={(v) => update('pass_required', v)}
              label="Require voting pass"
              id="pass-required"
            />
          </div>

          {errors.registration_enabled && (
            <p className="text-[9px] text-status-error" role="alert">{errors.registration_enabled}</p>
          )}

          <div>
            <label htmlFor="reg-message" className={labelClass}>Registration Message</label>
            <textarea
              id="reg-message"
              name="registrationMessage"
              value={config.registration_message ?? ''}
              onChange={(e) => update('registration_message', e.target.value || null)}
              placeholder="Optional message shown to registrants"
              rows={2}
              className={`${inputClass} resize-none`}
              aria-describedby={errors.registration_message ? 'err-reg-message' : undefined}
            />
            {errors.registration_message && (
              <p id="err-reg-message" className="text-[9px] text-status-error mt-1" role="alert">{errors.registration_message}</p>
            )}
          </div>
        </>
      ))}

      {/* Lookup Fields */}
      {renderSection('fields', 'Voter Lookup Fields', <Users size={14} style={{ color: pColor }} aria-hidden="true" />, (
        <>
          <p className="text-[10px] text-brand-text-muted">
            Select which fields voters can use to look themselves up during registration.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2" role="group" aria-label="Lookup fields">
            {VOTER_LOOKUP_FIELDS.map((field) => {
              const selected = config.lookup_fields.includes(field.value)
              return (
                <button
                  key={field.value}
                  type="button"
                  role="checkbox"
                  aria-checked={selected}
                  onClick={() => toggleLookupField(field.value)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-[10px] font-mono font-bold uppercase tracking-wider transition-all border ${
                    selected
                      ? 'text-white border-transparent'
                      : 'text-brand-text-muted border-brand-divider hover:border-brand-text-muted'
                  }`}
                  style={{ backgroundColor: selected ? pColor : undefined }}
                >
                  {selected ? <span aria-hidden="true">&check;</span> : <span aria-hidden="true">&nbsp;</span>}
                  {field.label}
                </button>
              )
            })}
          </div>

          {errors.lookup_fields && (
            <p className="text-[9px] text-status-error" role="alert">{errors.lookup_fields}</p>
          )}

          {config.lookup_fields.includes('custom') && (
            <div>
              <label htmlFor="custom-lookup-fields" className={labelClass}>Custom Fields</label>
              <input
                id="custom-lookup-fields"
                type="text"
                value={(config.custom_lookup_fields ?? []).join(', ')}
                onChange={(e) =>
                  update('custom_lookup_fields', e.target.value.split(',').map((s) => s.trim()).filter(Boolean))
                }
                placeholder="e.g. matric_number, account_no"
                className={inputClass}
                aria-describedby={errors.lookup_fields ? 'err-lookup-fields' : undefined}
              />
              <p className="text-[9px] text-brand-text-muted mt-1">
                Comma separated field names registrants can use to look themselves up.
              </p>
            </div>
          )}
        </>
      ))}

      {/* Verification */}
      {renderSection('verification', 'Verification Method', <Shield size={14} style={{ color: pColor }} aria-hidden="true" />, (
        <>
          <p className="text-[10px] text-brand-text-muted">Select how registrants verify their identity.</p>
          <div>
            <label htmlFor="verification-method" className={labelClass}>Method</label>
            <select
              id="verification-method"
              name="verificationMethod"
              value={config.verification_method}
              onChange={(e) => update('verification_method', e.target.value as VerificationMethodType)}
              className={selectClass}
              aria-describedby={errors.verification_method ? 'err-verification' : undefined}
            >
              <option value="otp">OTP (Email)</option>
              <option value="email">Email Link</option>
              <option value="manual">Manual Review</option>
            </select>
            {errors.verification_method && (
              <p id="err-verification" className="text-[9px] text-status-error mt-1" role="alert">{errors.verification_method}</p>
            )}
          </div>
        </>
      ))}

      {/* Voting Pass */}
      {renderSection('pass', 'Voting Pass', <Key size={14} style={{ color: pColor }} aria-hidden="true" />, (
        <Toggle
          on={config.pass_required}
          onToggle={(v) => update('pass_required', v)}
          label="Require voting pass to vote"
          id="reg-pass-toggle"
        />
      ))}
    </div>
  )
}
