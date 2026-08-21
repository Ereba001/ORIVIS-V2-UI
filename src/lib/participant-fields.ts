import type { ParticipantField, RegistrationSettings } from '../types/registration'

/**
 * Fallback participant field list used for events whose registration settings
 * predate the schema-driven participant fields feature (no participant_fields
 * array is returned by the API). Matches the fields the roster previously
 * carried so existing events keep behaving exactly as before.
 */
const LEGACY_PARTICIPANT_FIELDS: ParticipantField[] = [
  { key: 'name', label: 'Full Name', required: true, custom: false },
  { key: 'email', label: 'Email', required: false, custom: false },
  { key: 'phone', label: 'Phone', required: false, custom: false },
  { key: 'voter_id', label: 'Voter ID', required: false, custom: false },
  { key: 'student_id', label: 'Student ID', required: false, custom: false },
  { key: 'staff_id', label: 'Staff ID', required: false, custom: false },
  { key: 'department', label: 'Department', required: false, custom: true },
]

/**
 * Resolve the participant field schema for an event. Prefers the
 * API-resolved participant_fields; falls back to the legacy list so events
 * created before the feature keep their existing roster columns.
 */
export function resolveParticipantFields(settings?: RegistrationSettings | null): ParticipantField[] {
  if (settings && Array.isArray(settings.participant_fields) && settings.participant_fields.length > 0) {
    return settings.participant_fields
  }

  return LEGACY_PARTICIPANT_FIELDS
}

export function participantFieldKeys(settings?: RegistrationSettings | null): string[] {
  return resolveParticipantFields(settings).map((f) => f.key)
}

export function participantFieldLabel(key: string, settings?: RegistrationSettings | null): string {
  const field = resolveParticipantFields(settings).find((f) => f.key === key)

  return field?.label ?? key
}

/**
 * Whether any roster row carries a value for the given field key. Used to keep
 * the roster table tight: a column only renders when it is configured AND the
 * election actually has data for it. The department column additionally shows
 * whenever any participant has a department, so legacy events with department
 * data never lose the column after the schema-driven change.
 */
export function hasParticipantData(
  participants: ReadonlyArray<{ fields?: Record<string, string | null> | null; department?: string }>,
  key: string,
): boolean {
  if (key === 'department') {
    return participants.some((p) => Boolean(p.department || p.fields?.department))
  }

  return participants.some((p) => {
    const value = p.fields?.[key]

    return value !== undefined && value !== null && value !== ''
  })
}

export function participantFieldValue(
  p: { fields?: Record<string, string | null> | null; department?: string },
  key: string,
): string {
  if (key === 'department') {
    return p.department ?? p.fields?.department ?? ''
  }

  return p.fields?.[key] ?? ''
}