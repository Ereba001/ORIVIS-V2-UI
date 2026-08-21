import { describe, it, expect } from 'vitest'
import { createDefaultRegSettings, getOrgCategory } from '../org/components/RegistrationConfigSection'

describe('createDefaultRegSettings', () => {
  it('defaults registration to ENABLED so a configured registration window actually opens', () => {
    // Regression: the config previously defaulted registration_enabled to
    // false, so saving the registration config silently kept the public
    // registration closed even when the org set an open registration window.
    const defaults = createDefaultRegSettings()
    expect(defaults.registration_enabled).toBe(true)
    expect(defaults.registration_required).toBe(true)
    expect(defaults.pass_required).toBe(true)
  })

  it('keeps default lookup fields per org category', () => {
    expect(getOrgCategory('UNIVERSITY')).toBe('university')
    expect(createDefaultRegSettings('university').lookup_fields).toEqual(['name', 'student_id', 'email'])
    expect(createDefaultRegSettings('corporate').lookup_fields).toEqual(['name', 'employee_id', 'email'])
  })
})
