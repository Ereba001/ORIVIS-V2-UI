import { describe, it, expect } from 'vitest'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join, resolve } from 'node:path'

/**
 * Regression guard for the P1 audit finding (A-01): the obsolete marketing
 * /organize payment flow must stay fully removed. Payment could previously be
 * confirmed purely from client-side state (a Paystack JS callback writing
 * `paid: true` into localStorage under `orivis_app_*`) with no server-side
 * verification. All active payment paths now use server-side verification
 * (EventBillingPanel -> initializePayment -> Paystack -> verifyPayment/webhook).
 *
 * These assertions are source-level and deterministic: if anyone re-introduces
 * a client-only payment route or a localStorage paid-state writer, CI fails.
 */
const srcRoot = resolve(process.cwd(), 'src')

function walk(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name)
    return entry.isDirectory() ? walk(path) : [path]
  })
}

describe('obsolete marketing payment flow (A-01)', () => {
  it('removes the /payment and /application-submitted routes', () => {
    const app = readFileSync(join(srcRoot, 'App.tsx'), 'utf8')

    expect(app).not.toMatch(/path="\/payment/)
    expect(app).not.toMatch(/application-submitted/)
    expect(app).not.toMatch(/pages\/Payment/)
    expect(app).not.toMatch(/ApplicationSubmitted/)
  })

  it('deletes the obsolete payment pages', () => {
    expect(existsSync(join(srcRoot, 'pages/Payment.tsx'))).toBe(false)
    expect(existsSync(join(srcRoot, 'pages/ApplicationSubmitted.tsx'))).toBe(false)
  })

  it('has no client-side payment-success writer (orivis_app_* + setItem)', () => {
    const offenders = walk(srcRoot)
      .filter((file) => /\.(ts|tsx)$/.test(file))
      .filter((file) => !file.includes(`${join('test')}${''}`))
      .filter((file) => {
        const content = readFileSync(file, 'utf8')
        return /orivis_app_/.test(content) && /setItem/.test(content)
      })

    expect(offenders).toEqual([])
  })

  it('has no remaining references to the removed pages in non-test code', () => {
    const offenders = walk(srcRoot)
      .filter((file) => /\.(ts|tsx)$/.test(file))
      .filter((file) => !file.includes('test'))
      .filter((file) => {
        const content = readFileSync(file, 'utf8')
        return /ApplicationSubmitted|pages\/Payment/.test(content)
      })

    expect(offenders).toEqual([])
  })
})
