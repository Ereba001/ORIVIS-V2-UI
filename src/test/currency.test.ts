import { describe, it, expect } from 'vitest'
import { formatMoney, formatMoneyFromMinor } from '../lib/currency'

describe('formatMoney', () => {
  it('formats whole naira amounts with the naira symbol', () => {
    expect(formatMoney(250000, 'NGN')).toBe('₦250,000')
    expect(formatMoney(0, 'NGN')).toBe('₦0')
  })

  it('formats whole dollar amounts with the dollar symbol', () => {
    expect(formatMoney(9900, 'USD')).toBe('$9,900')
  })

  it('is case-insensitive on the currency code', () => {
    expect(formatMoney(100, 'ngn')).toBe('₦100')
    expect(formatMoney(50, 'usd')).toBe('$50')
  })

  it('falls back to a plain grouped number for unknown/empty codes', () => {
    expect(formatMoney(12345, '')).toBe('12,345')
    expect(formatMoney(12345, 'XYZ')).toBe('12,345')
    expect(formatMoney(12345, undefined as unknown as string)).toBe('12,345')
  })

  it('is safe with non-finite values', () => {
    expect(formatMoney(Number.NaN, 'NGN')).toBe('₦0')
    expect(formatMoney(Number.POSITIVE_INFINITY, 'USD')).toBe('$0')
  })
})

describe('formatMoneyFromMinor', () => {
  it('converts minor units (kobo/cents) to whole units', () => {
    expect(formatMoneyFromMinor(250000, 'NGN')).toBe('₦2,500')
    expect(formatMoneyFromMinor(9900, 'USD')).toBe('$99')
    expect(formatMoneyFromMinor(0, 'NGN')).toBe('₦0')
  })

  it('falls back to a plain grouped number for unknown/empty codes', () => {
    expect(formatMoneyFromMinor(12345, '')).toBe('123')
    expect(formatMoneyFromMinor(12345, 'XYZ')).toBe('123')
  })
})