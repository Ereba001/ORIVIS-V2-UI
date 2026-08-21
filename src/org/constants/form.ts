export const TIMEZONES = [
  'Africa/Lagos', 'Africa/Nairobi', 'Africa/Cairo', 'Africa/Johannesburg',
  'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
  'Europe/London', 'Europe/Paris', 'Europe/Berlin', 'Europe/Moscow',
  'Asia/Dubai', 'Asia/Kolkata', 'Asia/Singapore', 'Asia/Tokyo',
  'Australia/Sydney', 'Pacific/Auckland', 'UTC',
]

export const CATEGORY_LABELS: Record<string, string> = {
  government: 'Government',
  university: 'University',
  corporate: 'Corporate',
  ngo: 'Non-Governmental Organization',
  association: 'Association',
  award: 'Award',
  education: 'Education',
  healthcare: 'Healthcare',
  religious: 'Religious',
  cooperative: 'Cooperative',
  trade_union: 'Trade Union',
  sports: 'Sports',
  community: 'Community',
  staff_union: 'Staff Union / Welfare',
  party_primary: 'Party Primary',
  board: 'Board',
  class: 'Class',
  faculty: 'Faculty',
  department: 'Department',
  hod: 'Head of Department',
  custom: 'Custom',
}

export const CATEGORY_OPTIONS: { value: string; label: string }[] =
  Object.entries(CATEGORY_LABELS).map(([value, label]) => ({ value, label }))

export function eventCategoryOptions(allowed?: string[]): { value: string; label: string }[] {
  const candidates = allowed?.length
    ? [...allowed.filter((v) => v !== 'custom'), 'custom']
    : Object.keys(CATEGORY_LABELS)

  return candidates.map((value) => ({
    value,
    label: CATEGORY_LABELS[value] ?? value,
  }))
}
