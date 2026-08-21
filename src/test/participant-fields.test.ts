/* @vitest-environment jsdom */
import { describe, it, expect } from 'vitest'
import {
  resolveParticipantFields,
  hasParticipantData,
  participantFieldValue,
  participantFieldKeys,
} from '../lib/participant-fields'
import type { RegistrationSettings } from '../types/registration'

const schemaSettings = (fields: { key: string; label: string; required?: boolean; custom?: boolean }[]): RegistrationSettings => ({
  registration_enabled: true,
  registration_required: true,
  registration_message: null,
  lookup_fields: ['name', 'email', 'custom'],
  verification_method: 'otp',
  pass_required: true,
  custom_lookup_fields: ['Faculty'],
  participant_fields: fields.map((f) => ({ key: f.key, label: f.label, required: f.required ?? f.key === 'name', custom: f.custom ?? false })),
})

describe('resolveParticipantFields', () => {
  it('falls back to the legacy participant fields when settings have no participant_fields', () => {
    const fields = resolveParticipantFields({} as RegistrationSettings)
    expect(participantFieldKeys({} as RegistrationSettings)).toEqual([
      'name', 'email', 'phone', 'voter_id', 'student_id', 'staff_id', 'department',
    ])
    expect(fields[0].key).toBe('name')
    expect(fields[0].required).toBe(true)
  })

  it('returns null and empty list safely', () => {
    expect(resolveParticipantFields(null)).toHaveLength(7)
    expect(resolveParticipantFields(undefined)).toHaveLength(7)
  })

  it('prefers the API-resolved schema when present', () => {
    const settings = schemaSettings([
      { key: 'name', label: 'Full Name' },
      { key: 'membership_number', label: 'Membership Number' },
      { key: 'faculty', label: 'Faculty', custom: true },
    ])
    const fields = resolveParticipantFields(settings)
    expect(fields.map((f) => f.key)).toEqual(['name', 'membership_number', 'faculty'])
    expect(fields[2].custom).toBe(true)
  })
})

describe('hasParticipantData', () => {
  it('detects column values across the roster', () => {
    const roster: Array<{ fields?: Record<string, string | null> }> = [
      { fields: { student_id: 'S1' } },
      { fields: {} },
    ]
    expect(hasParticipantData(roster, 'student_id')).toBe(true)
    expect(hasParticipantData(roster, 'staff_id')).toBe(false)
  })

  it('treats empty strings as no data', () => {
    expect(hasParticipantData([{ fields: { voter_id: '' } }], 'voter_id')).toBe(false)
    expect(hasParticipantData([{ fields: { voter_id: null } }], 'voter_id')).toBe(false)
  })

  it('shows department when any participant has one, even via fields', () => {
    expect(hasParticipantData([{ department: 'Legal' }], 'department')).toBe(true)
    expect(hasParticipantData([{ department: '' }], 'department')).toBe(false)
    expect(hasParticipantData([{ fields: { department: 'Eng' } }], 'department')).toBe(true)
  })
})

describe('participantFieldValue', () => {
  it('reads department from the dedicated field first', () => {
    expect(participantFieldValue({ department: 'Legal', fields: { department: 'Eng' } }, 'department')).toBe('Legal')
    expect(participantFieldValue({ department: 'Eng' }, 'department')).toBe('Eng')
    expect(participantFieldValue({ fields: { department: 'Eng' } }, 'department')).toBe('Eng')
    expect(participantFieldValue({ department: '' }, 'department')).toBe('')
  })

  it('reads custom field values from fields', () => {
    expect(participantFieldValue({ fields: { faculty: 'Engineering' } }, 'faculty')).toBe('Engineering')
    expect(participantFieldValue({}, 'faculty')).toBe('')
  })
})