/**
 * Shared money formatting for the ORIVIS frontend.
 *
 * Every monetary value rendered in the UI is driven by the API-returned
 * currency code — never a hardcoded symbol. Unknown or empty currency codes
 * fall back to a plain symbol-less grouped number so a malformed API response
 * cannot crash the render.
 *
 * Symbols are mapped explicitly (rather than relying on Intl locale-specific
 * currency display) so output is deterministic across environments: ₦250,000
 * for NGN, $9,900 for USD, etc.
 */

const CURRENCY_SYMBOL: Record<string, string> = {
  NGN: '₦',
  USD: '$',
  GBP: '£',
  EUR: '€',
  KES: 'KSh ',
  GHS: 'GH₵',
  ZAR: 'R',
  CAD: 'C$',
  AUD: 'A$',
}

const SUPPORTED_CURRENCIES = new Set(Object.keys(CURRENCY_SYMBOL))

function normalizeCode(currency: string | null | undefined): string | null {
  const code = (currency ?? '').trim().toUpperCase()
  return code && SUPPORTED_CURRENCIES.has(code) ? code : null
}

function safeNumber(value: number | null | undefined): number {
  return Number.isFinite(value) ? (value as number) : 0
}

function grouped(value: number): string {
  return Math.round(value).toLocaleString('en-US')
}

/**
 * Format a whole-unit monetary amount (naira, dollars, etc.) using the
 * currency code returned by the API. Whole values render without decimals
 * (e.g. ₦250,000 / $9,900), matching the platform's pricing model.
 */
export function formatMoney(value: number | null | undefined, currency: string): string {
  const code = normalizeCode(currency)
  const number = grouped(safeNumber(value))

  return code ? `${CURRENCY_SYMBOL[code]}${number}` : number
}

/**
 * Format a monetary value that is stored in minor units (kobo, cents).
 */
export function formatMoneyFromMinor(value: number | null | undefined, currency: string): string {
  const code = normalizeCode(currency)
  const number = grouped(safeNumber(value) / 100)

  return code ? `${CURRENCY_SYMBOL[code]}${number}` : number
}