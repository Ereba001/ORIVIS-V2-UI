import type { UUID, ISO8601DateTime } from './common'

export type RegistrationStatusValue = 'draft' | 'pending_otp' | 'verified' | 'completed' | 'rejected' | 'expired' | 'cancelled' | 'blocked' | 'withdrawn'

export type VoterLookupField = 'student_id' | 'staff_id' | 'employee_id' | 'membership_number' | 'external_id' | 'voter_id' | 'email' | 'phone' | 'name' | 'surname' | 'other_name' | 'custom'

export type VerificationMethodType = 'otp' | 'email' | 'manual'

export interface ParticipantField {
  key: string
  label: string
  required: boolean
  custom: boolean
}

export interface RegistrationSettings {
  registration_enabled: boolean
  registration_required: boolean
  registration_message: string | null
  lookup_fields: VoterLookupField[]
  verification_method: VerificationMethodType
  pass_required: boolean
  custom_lookup_fields?: string[]
  participant_fields?: ParticipantField[]
}

export interface RegistrationRecord {
  uuid: UUID
  status: RegistrationStatusValue
  statusLabel: string
  lookupField: string
  lookupValue: string
  registeredAt: ISO8601DateTime | null
  verifiedAt: ISO8601DateTime | null
  completedAt: ISO8601DateTime | null
  expiresAt: ISO8601DateTime | null
  registrationEnabled: boolean
  registrationRequired: boolean
  registrationOpen: boolean
  voter: {
    uuid: UUID
    name: string
    email: string
  }
  election: {
    uuid: UUID
    title: string
  }
}

export interface ElectionRegistrationInfo {
  registrationEnabled: boolean
  registrationRequired: boolean
  lookupFields: VoterLookupField[]
  verificationMethod: VerificationMethodType
  passRequired: boolean
  registrationOpen: boolean
  registrationStartsAt: ISO8601DateTime | null
  registrationEndsAt: ISO8601DateTime | null
  registrationStatus: string
  message: string | null
  election: {
    uuid: UUID
    title: string
    slug: string
  }
}

export interface RegistrationSettingsInput {
  registration_enabled?: boolean
  registration_required?: boolean
  registration_message?: string | null
  lookup_fields?: VoterLookupField[]
  verification_method?: VerificationMethodType
  pass_required?: boolean
  custom_lookup_fields?: string[]
}

export interface LookupResult {
  found: boolean
  requiresOtp: boolean
  voter?: {
    name: string
    email_masked: string
  }
  election: {
    uuid: UUID
    title: string
    slug: string
  }
}

export interface OtpResult {
  message: string
  expires_in: number
  registration: string
}

export interface VerifyOtpResult {
  message: string
  registration: string
  verified: boolean
  voter?: {
    name: string
    email: string
  }
}

export interface CompleteRegistrationResult {
  message: string
  registration: string
  pass: {
    code: string
    expires_at: ISO8601DateTime | null
  }
}

export interface RegistrationStatusResponse {
  uuid: UUID
  status: RegistrationStatusValue
  statusLabel: string
  lookupField: string
  lookupValue: string
  registeredAt: ISO8601DateTime | null
  verifiedAt: ISO8601DateTime | null
  completedAt: ISO8601DateTime | null
  expiresAt: ISO8601DateTime | null
  election: {
    uuid: UUID
    title: string
  }
  registrationEnabled: boolean
  registrationRequired: boolean
}

export interface BulkImportResult {
  total: number
  succeeded: number
  failed: number
  errors: BulkImportError[]
  importedAt: ISO8601DateTime
}

export interface BulkImportError {
  row: number
  message: string
}

export interface CsvParseResult {
  headers: string[]
  rows: Record<string, string>[]
  totalRows: number
  invalidRows: number
  duplicateCount: number
  errors: string[]
}
