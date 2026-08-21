import { describe, it, expect } from 'vitest'
import { readOrNull, isNotFoundError } from '../lib/api-client'

describe('isNotFoundError', () => {
  it('detects an API error carrying a 404 status', () => {
    const err = new Error('not found') as Error & { status?: number }
    err.status = 404
    expect(isNotFoundError(err)).toBe(true)
  })

  it('rejects other statuses and plain errors', () => {
    const server = new Error('boom') as Error & { status?: number }
    server.status = 500
    expect(isNotFoundError(server)).toBe(false)
    expect(isNotFoundError(new Error('network'))).toBe(false)
    expect(isNotFoundError(null)).toBe(false)
  })
})

describe('readOrNull', () => {
  it('returns the value when the read succeeds', async () => {
    await expect(readOrNull(async () => 'ok')).resolves.toBe('ok')
  })

  it('maps a 404 to null so not-found reads stay quiet', async () => {
    const err = new Error('missing') as Error & { status?: number }
    err.status = 404
    await expect(readOrNull(async () => { throw err })).resolves.toBeNull()
  })

  it('rethrows non-404 failures so errors surface', async () => {
    const err = new Error('boom') as Error & { status?: number }
    err.status = 500
    await expect(readOrNull(async () => { throw err })).rejects.toThrow('boom')
  })
})